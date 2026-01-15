import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { canAccessProperty, requirePropertyAccess } from "./permissions";
import { enrichWithCreator } from "./utils";

export const listByProperty = query({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    if (!(await canAccessProperty(ctx, args.propertyId))) return [];

    const notes = await ctx.db
      .query("propertyNotes")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .collect();

    const notesWithProfiles = await enrichWithCreator(ctx, notes);

    return notesWithProfiles.sort(
      (a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0)
    );
  },
});

export const add = mutation({
  args: {
    propertyId: v.id("properties"),
    content: v.string(),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePropertyAccess(ctx, args.propertyId);
    return await ctx.db.insert("propertyNotes", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("propertyNotes"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.id);
    if (!note) throw new Error("Note not found");
    await requirePropertyAccess(ctx, note.propertyId);

    await ctx.db.patch(args.id, { content: args.content });
  },
});

export const remove = mutation({
  args: { id: v.id("propertyNotes") },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.id);
    if (!note) throw new Error("Note not found");
    await requirePropertyAccess(ctx, note.propertyId);

    await ctx.db.delete(args.id);
  },
});
