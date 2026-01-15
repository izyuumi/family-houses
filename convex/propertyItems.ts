import { v } from "convex/values";
import { query, mutation, QueryCtx } from "./_generated/server";
import { getCurrentUser } from "./profiles";
import type { Id } from "./_generated/dataModel";

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

async function requirePropertyAccess(ctx: QueryCtx, propertyId: Id<"properties">) {
  if (!(await canAccessProperty(ctx, propertyId))) {
    throw new Error("You do not have access to this property");
  }
}

export const listByProperty = query({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    if (!(await canAccessProperty(ctx, args.propertyId))) return [];

    const items = await ctx.db
      .query("propertyItems")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .collect();

    const clerkIds = [
      ...new Set(
        items
          .map((item) => item.createdBy)
          .filter((id): id is string => id !== undefined)
      ),
    ];

    const profiles = await Promise.all(
      clerkIds.map((id) =>
        ctx.db
          .query("profiles")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", id))
          .first()
      )
    );

    const profileMap = new Map(
      profiles
        .filter((p): p is NonNullable<typeof p> => p !== null)
        .map((p) => [p.clerkId, { displayName: p.displayName }])
    );

    const itemsWithProfiles = items.map((item) => ({
      ...item,
      creator: item.createdBy ? profileMap.get(item.createdBy) ?? null : null,
    }));

    return itemsWithProfiles.sort(
      (a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0)
    );
  },
});

export const add = mutation({
  args: {
    propertyId: v.id("properties"),
    title: v.string(),
    boughtDate: v.optional(v.string()),
    category: v.optional(v.string()),
    note: v.optional(v.string()),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePropertyAccess(ctx, args.propertyId);
    return await ctx.db.insert("propertyItems", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("propertyItems"),
    title: v.optional(v.string()),
    boughtDate: v.optional(v.string()),
    category: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Item not found");
    await requirePropertyAccess(ctx, item.propertyId);

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("propertyItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Item not found");
    await requirePropertyAccess(ctx, item.propertyId);

    await ctx.db.delete(args.id);
  },
});
