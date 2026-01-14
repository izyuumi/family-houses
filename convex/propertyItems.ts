import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listByProperty = query({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("propertyItems")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .collect();

    const itemsWithProfiles = await Promise.all(
      items.map(async (item) => {
        let creator = null;

        if (item.createdBy) {
          const profile = await ctx.db
            .query("profiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", item.createdBy!))
            .first();
          creator = profile ? { displayName: profile.displayName } : null;
        }

        return { ...item, creator };
      })
    );

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
