import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser, isUserAdmin, requireAdmin } from "./profiles";
import {
  isUserApprovedOrAdmin,
  canAccessPropertyWithUser,
  getMembershipForProperty,
} from "./permissions";
import { getProfileMap, extractClerkIds, enrichWithCreator } from "./utils";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    if (!isUserApprovedOrAdmin(user)) return [];

    if (isUserAdmin(user)) {
      return await ctx.db.query("properties").order("asc").collect();
    }

    const memberships = await ctx.db
      .query("propertyMembers")
      .withIndex("by_user", (q) => q.eq("userId", user.clerkId))
      .collect();

    const properties = await Promise.all(
      memberships.map((m) => ctx.db.get(m.propertyId))
    );

    return properties.filter((p) => p !== null);
  },
});

export const homeData = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return { profile: null, properties: [], needsApproval: false };
    }

    if (!isUserApprovedOrAdmin(user)) {
      return { profile: user, properties: [], needsApproval: true };
    }

    let properties;
    if (isUserAdmin(user)) {
      properties = await ctx.db.query("properties").order("asc").collect();
    } else {
      const memberships = await ctx.db
        .query("propertyMembers")
        .withIndex("by_user", (q) => q.eq("userId", user.clerkId))
        .collect();

      const fetchedProperties = await Promise.all(
        memberships.map((m) => ctx.db.get(m.propertyId))
      );
      properties = fetchedProperties.filter((p) => p !== null);
    }

    const todoCounts = await Promise.all(
      properties.map(async (p) => {
        const items = await ctx.db
          .query("groceryItems")
          .withIndex("by_property", (q) => q.eq("propertyId", p._id))
          .collect();
        return items.filter((i) => !i.checked).length;
      })
    );
    const propertiesWithTodos = properties.map((p, i) => ({
      ...p,
      todoCount: todoCounts[i],
    }));

    return { profile: user, properties: propertiesWithTodos, needsApproval: false };
  },
});

export const getById = query({
  args: { id: v.id("properties") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!(await canAccessPropertyWithUser(ctx, args.id, user))) return null;
    return await ctx.db.get(args.id);
  },
});

export const propertyDetailData = query({
  args: { slugOrId: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    if (!isUserApprovedOrAdmin(user)) return null;

    let property = await ctx.db
      .query("properties")
      .withIndex("by_slug", (q) => q.eq("slug", args.slugOrId))
      .first();

    if (!property) {
      try {
        const normalized = ctx.db.normalizeId("properties", args.slugOrId);
        if (normalized) {
          property = await ctx.db.get(normalized);
        }
      } catch {
        return null;
      }
    }

    if (!property) return null;
    if (!(await canAccessPropertyWithUser(ctx, property._id, user))) return null;

    const [groceryItems, propertyItems, propertyNotes] = await Promise.all([
      ctx.db
        .query("groceryItems")
        .withIndex("by_property", (q) => q.eq("propertyId", property._id))
        .collect(),
      ctx.db
        .query("propertyItems")
        .withIndex("by_property", (q) => q.eq("propertyId", property._id))
        .collect(),
      ctx.db
        .query("propertyNotes")
        .withIndex("by_property", (q) => q.eq("propertyId", property._id))
        .collect(),
    ]);

    const allClerkIds = [
      ...extractClerkIds(groceryItems, "addedBy", "completedBy"),
      ...extractClerkIds(propertyItems, "createdBy"),
      ...extractClerkIds(propertyNotes, "createdBy"),
    ];
    const uniqueClerkIds = [...new Set(allClerkIds)];
    const profileMap = await getProfileMap(ctx, uniqueClerkIds);

    const groceriesWithProfiles = groceryItems
      .map((item) => ({
        ...item,
        adder: item.addedBy ? profileMap.get(item.addedBy) ?? null : null,
        completer: item.completedBy ? profileMap.get(item.completedBy) ?? null : null,
      }))
      .sort((a, b) => {
        if (a.checked !== b.checked) return a.checked ? 1 : -1;
        return (b._creationTime ?? 0) - (a._creationTime ?? 0);
      });

    const itemsWithProfiles = propertyItems
      .map((item) => ({
        ...item,
        creator: item.createdBy ? profileMap.get(item.createdBy) ?? null : null,
      }))
      .sort((a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0));

    const notesWithProfiles = propertyNotes
      .map((note) => ({
        ...note,
        creator: note.createdBy ? profileMap.get(note.createdBy) ?? null : null,
      }))
      .sort((a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0));

    return {
      property,
      profile: user,
      groceries: groceriesWithProfiles,
      propertyItems: itemsWithProfiles,
      propertyNotes: notesWithProfiles,
    };
  },
});

export const getBySlugOrId = query({
  args: { slugOrId: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!isUserApprovedOrAdmin(user)) return null;

    const bySlug = await ctx.db
      .query("properties")
      .withIndex("by_slug", (q) => q.eq("slug", args.slugOrId))
      .first();

    if (bySlug) {
      if (!(await canAccessPropertyWithUser(ctx, bySlug._id, user))) return null;
      return bySlug;
    }

    try {
      const normalized = ctx.db.normalizeId("properties", args.slugOrId);
      if (normalized) {
        if (!(await canAccessPropertyWithUser(ctx, normalized, user))) return null;
        return await ctx.db.get(normalized);
      }
    } catch {
      return null;
    }

    return null;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    prefecture: v.optional(v.string()),
    cityWardTown: v.optional(v.string()),
    area: v.optional(v.string()),
    chome: v.optional(v.string()),
    block: v.optional(v.string()),
    building: v.optional(v.string()),
    room: v.optional(v.string()),
    locationX: v.optional(v.number()),
    locationY: v.optional(v.number()),
    appleMapsUrl: v.optional(v.string()),
    wifiSsid: v.optional(v.string()),
    wifiPassword: v.optional(v.string()),
    guestWifiSsid: v.optional(v.string()),
    guestWifiPassword: v.optional(v.string()),
    mailboxLockCombination: v.optional(v.string()),
    autoLockCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("properties", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("properties"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    prefecture: v.optional(v.string()),
    cityWardTown: v.optional(v.string()),
    area: v.optional(v.string()),
    chome: v.optional(v.string()),
    block: v.optional(v.string()),
    building: v.optional(v.string()),
    room: v.optional(v.string()),
    locationX: v.optional(v.number()),
    locationY: v.optional(v.number()),
    appleMapsUrl: v.optional(v.string()),
    wifiSsid: v.optional(v.string()),
    wifiPassword: v.optional(v.string()),
    guestWifiSsid: v.optional(v.string()),
    guestWifiPassword: v.optional(v.string()),
    mailboxLockCombination: v.optional(v.string()),
    autoLockCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const getWifiPassword = query({
  args: { id: v.id("properties"), type: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    if (!(await canAccessPropertyWithUser(ctx, args.id, user))) return null;

    if (user.role !== "admin") {
      const membership = await getMembershipForProperty(
        ctx,
        args.id,
        user.clerkId
      );
      if (membership?.role === "guest") return null;
    }

    const property = await ctx.db.get(args.id);
    if (!property) return null;
    return args.type === "guest"
      ? property.guestWifiPassword
      : property.wifiPassword;
  },
});

export const getMailboxLockCombination = query({
  args: { id: v.id("properties") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    if (!(await canAccessPropertyWithUser(ctx, args.id, user))) return null;

    if (user.role !== "admin") {
      const membership = await getMembershipForProperty(
        ctx,
        args.id,
        user.clerkId
      );
      if (membership?.role === "guest") return null;
    }

    const property = await ctx.db.get(args.id);
    if (!property) return null;
    return property.mailboxLockCombination;
  },
});

export const getAutoLockCode = query({
  args: { id: v.id("properties") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    if (!(await canAccessPropertyWithUser(ctx, args.id, user))) return null;

    if (user.role !== "admin") {
      const membership = await getMembershipForProperty(
        ctx,
        args.id,
        user.clerkId
      );
      if (membership?.role === "guest") return null;
    }

    const property = await ctx.db.get(args.id);
    if (!property) return null;
    return property.autoLockCode;
  },
});
