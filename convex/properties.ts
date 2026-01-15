import { v } from "convex/values";
import { query, mutation, QueryCtx } from "./_generated/server";
import { getCurrentUser, isAdmin, requireAdmin } from "./profiles";
import type { Id } from "./_generated/dataModel";

async function isApprovedOrAdmin(ctx: QueryCtx) {
  const user = await getCurrentUser(ctx);
  if (!user) return false;
  if (user.role === "admin") return true;
  return user.approved === true;
}

async function canAccessProperty(ctx: QueryCtx, propertyId: Id<"properties">) {
  const user = await getCurrentUser(ctx);
  if (!user) return false;
  if (!user.approved && user.role !== "admin") return false;
  if (user.role === "admin") return true;

  const membership = await ctx.db
    .query("propertyMembers")
    .withIndex("by_property_user", (q) =>
      q.eq("propertyId", propertyId).eq("userId", user.clerkId)
    )
    .first();

  return membership !== null;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    if (!(await isApprovedOrAdmin(ctx))) return [];

    if (await isAdmin(ctx)) {
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

export const getById = query({
  args: { id: v.id("properties") },
  handler: async (ctx, args) => {
    if (!(await canAccessProperty(ctx, args.id))) return null;
    return await ctx.db.get(args.id);
  },
});

export const getBySlugOrId = query({
  args: { slugOrId: v.string() },
  handler: async (ctx, args) => {
    if (!(await isApprovedOrAdmin(ctx))) return null;

    const bySlug = await ctx.db
      .query("properties")
      .withIndex("by_slug", (q) => q.eq("slug", args.slugOrId))
      .first();

    if (bySlug) {
      if (!(await canAccessProperty(ctx, bySlug._id))) return null;
      return bySlug;
    }

    try {
      const normalized = ctx.db.normalizeId("properties", args.slugOrId);
      if (normalized) {
        if (!(await canAccessProperty(ctx, normalized))) return null;
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
    if (!(await canAccessProperty(ctx, args.id))) return null;

    const user = await getCurrentUser(ctx);
    if (!user) return null;

    if (user.role !== "admin") {
      const membership = await ctx.db
        .query("propertyMembers")
        .withIndex("by_property_user", (q) =>
          q.eq("propertyId", args.id).eq("userId", user.clerkId)
        )
        .first();

      if (membership?.role === "guest") return null;
    }

    const property = await ctx.db.get(args.id);
    if (!property) return null;
    return args.type === "guest"
      ? property.guestWifiPassword
      : property.wifiPassword;
  },
});
