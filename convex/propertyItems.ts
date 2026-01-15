import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { canAccessProperty, requirePropertyAccess } from "./permissions";
import { enrichWithCreator } from "./utils";

export const listByProperty = query({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    if (!(await canAccessProperty(ctx, args.propertyId))) return [];

    const items = await ctx.db
      .query("propertyItems")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .collect();

    const itemsWithProfiles = await enrichWithCreator(ctx, items);

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
