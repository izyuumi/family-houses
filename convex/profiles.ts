import { v, Validator } from "convex/values";
import {
  query,
  mutation,
  internalMutation,
  QueryCtx,
} from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import type { UserJSON } from "@clerk/backend";

export type ProfileRole = "admin" | "user";

export function isUserAdmin(user: Doc<"profiles"> | null): boolean {
  return user?.role === "admin";
}

export async function isAdmin(ctx: QueryCtx): Promise<boolean> {
  const user = await getCurrentUser(ctx);
  return isUserAdmin(user);
}

export async function isApproved(ctx: QueryCtx): Promise<boolean> {
  const user = await getCurrentUser(ctx);
  return user?.approved === true;
}

export async function requireAdmin(ctx: QueryCtx): Promise<void> {
  const admin = await isAdmin(ctx);
  if (!admin) {
    throw new Error("Admin access required");
  }
}

export async function requireApproved(ctx: QueryCtx): Promise<void> {
  const approved = await isApproved(ctx);
  if (!approved) {
    throw new Error("Account must be approved to perform this action");
  }
}

export const current = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const isUserAdmin = await isAdmin(ctx);
    const isOwnProfile = identity.subject === args.clerkId;

    if (!isUserAdmin && !isOwnProfile) {
      throw new Error("You can only view your own profile");
    }

    return await ctx.db
      .query("profiles")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

export const upsert = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        displayName: args.displayName,
      });
      return existing._id;
    }

    return await ctx.db.insert("profiles", {
      clerkId: args.clerkId,
      email: args.email,
      displayName: args.displayName,
      role: "user",
      approved: false,
    });
  },
});

export const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> },
  async handler(ctx, { data }) {
    const userAttributes = {
      clerkId: data.id,
      email: data.email_addresses[0]?.email_address ?? "",
      displayName:
        `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() || undefined,
    };

    const user = await profileByClerkId(ctx, data.id);
    if (user === null) {
      await ctx.db.insert("profiles", {
        ...userAttributes,
        role: "user",
        approved: false,
      });
    } else {
      await ctx.db.patch(user._id, userAttributes);
    }
  },
});

export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  async handler(ctx, { clerkUserId }) {
    const user = await profileByClerkId(ctx, clerkUserId);

    if (user !== null) {
      await ctx.db.delete(user._id);
    } else {
      console.warn(
        `Can't delete user, there is none for Clerk user ID: ${clerkUserId}`
      );
    }
  },
});

export async function getCurrentUserOrThrow(ctx: QueryCtx) {
  const userRecord = await getCurrentUser(ctx);
  if (!userRecord) throw new Error("Can't get current user");
  return userRecord;
}

export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    return null;
  }
  return await profileByClerkId(ctx, identity.subject);
}

async function profileByClerkId(ctx: QueryCtx, clerkId: string) {
  return await ctx.db
    .query("profiles")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
    .first();
}

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("profiles").order("desc").collect();
  },
});

export const listPending = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("profiles").collect();
    return all.filter((p) => p.approved !== true);
  },
});

export const approveUser = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!profile) {
      throw new Error("Profile not found");
    }

    await ctx.db.patch(profile._id, { approved: true });
  },
});

export const rejectUser = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!profile) {
      throw new Error("Profile not found");
    }

    if (profile.role === "admin") {
      throw new Error("Cannot reject an admin user");
    }

    await ctx.db.delete(profile._id);
  },
});
