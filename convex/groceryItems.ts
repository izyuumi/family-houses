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
      .query("groceryItems")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .collect();

    const clerkIds = [
      ...new Set(
        items.flatMap((item) =>
          [item.addedBy, item.completedBy].filter(
            (id): id is string => id !== undefined
          )
        )
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
    addedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePropertyAccess(ctx, args.propertyId);
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
