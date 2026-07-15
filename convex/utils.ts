import { QueryCtx, MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

export type ProfileInfo = { displayName?: string; email?: string };

// Applies an accepted invitation to a profile: approves the account and adds
// the pre-assigned property memberships. Shared by the invite-link flow and
// the Clerk-webhook email match.
export async function applyInvitation(
  ctx: MutationCtx,
  invitation: Doc<"invitations">,
  profile: Doc<"profiles">
) {
  if (profile.approved !== true) {
    await ctx.db.patch(profile._id, { approved: true });
  }
  for (const assignment of invitation.propertyAssignments) {
    const property = await ctx.db.get(assignment.propertyId);
    if (!property) continue;
    const existing = await ctx.db
      .query("propertyMembers")
      .withIndex("by_property_user", (q) =>
        q.eq("propertyId", assignment.propertyId).eq("userId", profile.clerkId)
      )
      .first();
    if (!existing) {
      await ctx.db.insert("propertyMembers", {
        propertyId: assignment.propertyId,
        userId: profile.clerkId,
        role: assignment.role,
        invitedBy: invitation.invitedBy,
        invitedAt: Date.now(),
      });
    } else {
      // Promote if the invitation grants a higher role; never demote.
      const rank = { owner: 3, member: 2, guest: 1 } as const;
      if (rank[assignment.role] > rank[existing.role]) {
        await ctx.db.patch(existing._id, { role: assignment.role });
      }
    }
  }
  await ctx.db.patch(invitation._id, {
    status: "accepted",
    acceptedBy: profile.clerkId,
    acceptedAt: Date.now(),
  });
}

export async function findPendingInvitationByEmail(
  ctx: MutationCtx,
  email: string
) {
  if (!email) return null;
  return await ctx.db
    .query("invitations")
    .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
    .filter((q) => q.eq(q.field("status"), "pending"))
    .first();
}

export async function getProfileMap(
  ctx: QueryCtx,
  clerkIds: string[]
): Promise<Map<string, ProfileInfo>> {
  const profiles = await Promise.all(
    clerkIds.map((id) =>
      ctx.db
        .query("profiles")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", id))
        .first()
    )
  );

  return new Map(
    profiles
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .map((p) => [p.clerkId, { displayName: p.displayName, email: p.email }])
  );
}

export async function enrichWithCreator<T extends { createdBy?: string }>(
  ctx: QueryCtx,
  items: T[]
): Promise<Array<T & { creator: ProfileInfo | null }>> {
  const clerkIds = [
    ...new Set(
      items
        .map((item) => item.createdBy)
        .filter((id): id is string => id !== undefined)
    ),
  ];

  const profileMap = await getProfileMap(ctx, clerkIds);

  return items.map((item) => ({
    ...item,
    creator: item.createdBy ? profileMap.get(item.createdBy) ?? null : null,
  }));
}

export function extractClerkIds(
  items: Array<Record<string, unknown>>,
  ...fields: string[]
): string[] {
  return [
    ...new Set(
      items.flatMap((item) =>
        fields
          .map((field) => item[field])
          .filter((id): id is string => typeof id === "string")
      )
    ),
  ];
}
