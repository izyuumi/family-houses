import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./profiles";

export const get = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const setting = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    return setting?.value ?? null;
  },
});

export const getAllowSignups = query({
  args: {},
  handler: async (ctx) => {
    const setting = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", "allowSignups"))
      .first();
    return setting?.value ?? true;
  },
});

export const setAllowSignups = mutation({
  args: { allow: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existing = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", "allowSignups"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.allow });
    } else {
      await ctx.db.insert("appSettings", {
        key: "allowSignups",
        value: args.allow,
      });
    }
  },
});
