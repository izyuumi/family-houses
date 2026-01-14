import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listByProperty = query({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("groceryItems")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .collect();

    const itemsWithProfiles = await Promise.all(
      items.map(async (item) => {
        let adder = null;
        let completer = null;

        if (item.addedBy) {
          const profile = await ctx.db
            .query("profiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", item.addedBy!))
            .first();
          adder = profile ? { displayName: profile.displayName } : null;
        }

        if (item.completedBy) {
          const profile = await ctx.db
            .query("profiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", item.completedBy!))
            .first();
          completer = profile ? { displayName: profile.displayName } : null;
        }

        return { ...item, adder, completer };
      })
    );

    return itemsWithProfiles.sort((a, b) => {
      if (a.checked !== b.checked) return a.checked ? 1 : -1;
      return (b._creationTime ?? 0) - (a._creationTime ?? 0);
    });
  },
});

export const add = mutation({
  args: {
    propertyId: v.id("properties"),
    itemName: v.string(),
    addedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("groceryItems", {
      propertyId: args.propertyId,
      itemName: args.itemName,
      checked: false,
      addedBy: args.addedBy,
    });
  },
});

export const toggle = mutation({
  args: {
    id: v.id("groceryItems"),
    checked: v.boolean(),
    completedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      checked: args.checked,
      completedBy: args.checked ? args.completedBy : undefined,
      completedAt: args.checked ? Date.now() : undefined,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("groceryItems") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const clearChecked = mutation({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("groceryItems")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .collect();

    for (const item of items) {
      if (item.checked) {
        await ctx.db.delete(item._id);
      }
    }
  },
});
