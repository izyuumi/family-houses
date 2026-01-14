import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listByProperty = query({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("propertyNotes")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .collect();

    const notesWithProfiles = await Promise.all(
      notes.map(async (note) => {
        let creator = null;

        if (note.createdBy) {
          const profile = await ctx.db
            .query("profiles")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", note.createdBy!))
            .first();
          creator = profile ? { displayName: profile.displayName } : null;
        }

        return { ...note, creator };
      })
    );

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
    return await ctx.db.insert("propertyNotes", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("propertyNotes"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { content: args.content });
  },
});

export const remove = mutation({
  args: { id: v.id("propertyNotes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
