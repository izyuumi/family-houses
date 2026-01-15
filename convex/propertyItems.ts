import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listByProperty = query({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
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
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("propertyItems") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
