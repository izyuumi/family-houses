import { v } from "convex/values";
import { query, mutation, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireAdmin } from "./profiles";
import {
  isApprovedOrAdmin,
  getMembershipForProperty,
  MemberRole,
} from "./permissions";
import { getProfileMap } from "./utils";

export const memberRoleValidator = v.union(
  v.literal("owner"),
  v.literal("member"),
  v.literal("guest")
);

export type { MemberRole };

const ROLE_HIERARCHY: Record<MemberRole, number> = {
  owner: 3,
  member: 2,
  guest: 1,
};

export async function getMembershipInternal(
  ctx: QueryCtx,
  propertyId: Id<"properties">,
  userId: string
) {
  return getMembershipForProperty(ctx, propertyId, userId);
}

export const getMembership = query({
  args: {
    propertyId: v.id("properties"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!(await isApprovedOrAdmin(ctx))) return null;
    return await getMembershipInternal(ctx, args.propertyId, args.userId);
  },
});

export const listByProperty = query({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    if (!(await isApprovedOrAdmin(ctx))) return [];

    const members = await ctx.db
      .query("propertyMembers")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .collect();

    const clerkIds = members.map((m) => m.userId);
    const profileMap = await getProfileMap(ctx, clerkIds);

    const membersWithProfiles = members.map((member) => ({
      ...member,
      profile: profileMap.get(member.userId) ?? null,
    }));

    return membersWithProfiles.sort(
      (a, b) => ROLE_HIERARCHY[b.role] - ROLE_HIERARCHY[a.role]
    );
  },
});

export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    if (!(await isApprovedOrAdmin(ctx))) return [];

    const memberships = await ctx.db
      .query("propertyMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const membershipsWithProperties = await Promise.all(
      memberships.map(async (membership) => {
        const property = await ctx.db.get(membership.propertyId);
        return {
          ...membership,
          property,
        };
      })
    );

    return membershipsWithProperties.filter((m) => m.property !== null);
  },
});

export const hasAccess = query({
  args: {
    propertyId: v.id("properties"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!(await isApprovedOrAdmin(ctx))) return false;
    const membership = await getMembershipInternal(
      ctx,
      args.propertyId,
      args.userId
    );
    return membership !== null;
  },
});

export const addMember = mutation({
  args: {
    propertyId: v.id("properties"),
    userId: v.string(),
    role: memberRoleValidator,
    invitedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existing = await getMembershipInternal(
      ctx,
      args.propertyId,
      args.userId
    );
    if (existing) {
      throw new Error("User is already a member of this property");
    }

    return await ctx.db.insert("propertyMembers", {
      propertyId: args.propertyId,
      userId: args.userId,
      role: args.role,
      invitedBy: args.invitedBy,
      invitedAt: Date.now(),
    });
  },
});

export const updateRole = mutation({
  args: {
    propertyId: v.id("properties"),
    userId: v.string(),
    newRole: memberRoleValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const membership = await getMembershipInternal(
      ctx,
      args.propertyId,
      args.userId
    );
    if (!membership) {
      throw new Error("Membership not found");
    }

    await ctx.db.patch(membership._id, { role: args.newRole });
  },
});

export const removeMember = mutation({
  args: {
    propertyId: v.id("properties"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const membership = await getMembershipInternal(
      ctx,
      args.propertyId,
      args.userId
    );
    if (!membership) {
      throw new Error("Membership not found");
    }

    if (membership.role === "owner") {
      const owners = await ctx.db
        .query("propertyMembers")
        .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
        .filter((q) => q.eq(q.field("role"), "owner"))
        .collect();

      if (owners.length <= 1) {
        throw new Error("Cannot remove the last owner of a property");
      }
    }

    await ctx.db.delete(membership._id);
  },
});
