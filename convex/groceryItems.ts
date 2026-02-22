import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { canAccessProperty, requirePropertyAccess } from "./permissions";
import { getProfileMap, extractClerkIds } from "./utils";

export const listByProperty = query({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    if (!(await canAccessProperty(ctx, args.propertyId))) return [];

    const items = await ctx.db
      .query("groceryItems")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .collect();

    const clerkIds = extractClerkIds(items, "addedBy", "completedBy");
    const profileMap = await getProfileMap(ctx, clerkIds);

    const itemsWithProfiles = items.map((item) => ({
      ...item,
      adder: item.addedBy ? profileMap.get(item.addedBy) ?? null : null,
      completer: item.completedBy
        ? profileMap.get(item.completedBy) ?? null
        : null,
    }));

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
    category: v.optional(v.string()),
    addedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePropertyAccess(ctx, args.propertyId);
    return await ctx.db.insert("groceryItems", {
      propertyId: args.propertyId,
      itemName: args.itemName,
      category: args.category,
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
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Item not found");
    await requirePropertyAccess(ctx, item.propertyId);

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
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Item not found");
    await requirePropertyAccess(ctx, item.propertyId);

    await ctx.db.delete(args.id);
  },
});

export const clearChecked = mutation({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    await requirePropertyAccess(ctx, args.propertyId);
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
