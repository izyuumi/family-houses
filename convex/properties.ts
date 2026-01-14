import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("properties").order("asc").collect();
  },
});

export const getById = query({
  args: { id: v.id("properties") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getBySlugOrId = query({
  args: { slugOrId: v.string() },
  handler: async (ctx, args) => {
    const bySlug = await ctx.db
      .query("properties")
      .withIndex("by_slug", (q) => q.eq("slug", args.slugOrId))
      .first();

    if (bySlug) return bySlug;

    try {
      const normalized = ctx.db.normalizeId("properties", args.slugOrId);
      if (normalized) {
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
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const getWifiPassword = query({
  args: { id: v.id("properties"), type: v.string() },
  handler: async (ctx, args) => {
    const property = await ctx.db.get(args.id);
    if (!property) return null;
    return args.type === "guest"
      ? property.guestWifiPassword
      : property.wifiPassword;
  },
});
