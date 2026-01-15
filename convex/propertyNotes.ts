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

    const notes = await ctx.db
      .query("propertyNotes")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .collect();

    const clerkIds = [
      ...new Set(
        notes
          .map((note) => note.createdBy)
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

    const notesWithProfiles = notes.map((note) => ({
      ...note,
      creator: note.createdBy ? profileMap.get(note.createdBy) ?? null : null,
    }));

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
