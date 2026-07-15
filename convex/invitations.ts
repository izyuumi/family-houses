import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./profiles";
import { applyInvitation, getProfileMap } from "./utils";

const assignmentValidator = v.object({
  propertyId: v.id("properties"),
  role: v.union(v.literal("owner"), v.literal("member"), v.literal("guest")),
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const invitations = await ctx.db.query("invitations").order("desc").collect();
    const clerkIds = [
      ...new Set(
        invitations
          .flatMap((invitation) => [invitation.invitedBy, invitation.acceptedBy])
          .filter((id): id is string => typeof id === "string")
      ),
    ];
    const profileMap = await getProfileMap(ctx, clerkIds);
    return invitations.map((invitation) => ({
      ...invitation,
      inviter: profileMap.get(invitation.invitedBy) ?? null,
      acceptor: invitation.acceptedBy
        ? profileMap.get(invitation.acceptedBy) ?? null
        : null,
    }));
  },
});

export const create = mutation({
  args: {
    label: v.string(),
    email: v.optional(v.string()),
    // Generated client-side with crypto.getRandomValues so the mutation
    // stays deterministic.
    token: v.string(),
    propertyAssignments: v.array(assignmentValidator),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required");

    const label = args.label.trim();
    if (!label) throw new Error("A name for the invitee is required");
    const email = args.email?.trim().toLowerCase() || undefined;
    if (!/^[0-9a-f]{32,}$/.test(args.token)) {
      throw new Error("Invalid invitation token");
    }
    const duplicate = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (duplicate) throw new Error("Invalid invitation token");

    return await ctx.db.insert("invitations", {
      label,
      email,
      token: args.token,
      propertyAssignments: args.propertyAssignments,
      status: "pending",
      invitedBy: identity.subject,
    });
  },
});

export const revoke = mutation({
  args: { invitationId: v.id("invitations") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) throw new Error("Invitation not found");
    if (invitation.status !== "pending") {
      throw new Error("Only pending invitations can be revoked");
    }
    await ctx.db.patch(args.invitationId, { status: "revoked" });
  },
});

// Public (pre-auth) check used by the invite landing page. Exposes only
// validity, never the invitee email or assignments.
export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    return { valid: invitation?.status === "pending" };
  },
});

export const accept = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required");

    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    // Idempotent: the Clerk-webhook email match may have accepted this
    // invitation for the same user before the invite page finished loading.
    if (
      invitation?.status === "accepted" &&
      invitation.acceptedBy === identity.subject
    ) {
      return { ok: true };
    }
    if (!invitation || invitation.status !== "pending") {
      throw new Error("This invitation is no longer valid");
    }

    // The Clerk webhook usually creates the profile, but the invitee may
    // accept before it fires — create a minimal profile in that case.
    let profile = await ctx.db
      .query("profiles")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!profile) {
      const profileId = await ctx.db.insert("profiles", {
        clerkId: identity.subject,
        email: typeof identity.email === "string" ? identity.email : "",
        displayName:
          typeof identity.name === "string" && identity.name.trim()
            ? identity.name
            : undefined,
        role: "user",
        approved: false,
      });
      profile = await ctx.db.get(profileId);
    }
    if (!profile) throw new Error("Could not load your profile");

    await applyInvitation(ctx, invitation, profile);
    return { ok: true };
  },
});
