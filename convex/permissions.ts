import { QueryCtx } from "./_generated/server";
import type { Id, Doc } from "./_generated/dataModel";
import { getCurrentUser } from "./profiles";

export type MemberRole = "owner" | "member" | "guest";
export type UserProfile = Doc<"profiles"> | null;

const ROLE_HIERARCHY: Record<MemberRole, number> = {
  owner: 3,
  member: 2,
  guest: 1,
};

export function hasMinimumRole(
  userRole: MemberRole,
  requiredRole: MemberRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function isUserAdmin(user: UserProfile): boolean {
  return user?.role === "admin";
}

export function isUserApprovedOrAdmin(user: UserProfile): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return user.approved === true;
}

export async function isApprovedOrAdmin(ctx: QueryCtx): Promise<boolean> {
  const user = await getCurrentUser(ctx);
  return isUserApprovedOrAdmin(user);
}

export async function getMembershipForProperty(
  ctx: QueryCtx,
  propertyId: Id<"properties">,
  userId: string
) {
  return await ctx.db
    .query("propertyMembers")
    .withIndex("by_property_user", (q) =>
      q.eq("propertyId", propertyId).eq("userId", userId)
    )
    .first();
}

export function canUserAccessPropertyWithMembership(
  user: UserProfile,
  membership: Doc<"propertyMembers"> | null
): boolean {
  if (!user) return false;
  if (!user.approved && user.role !== "admin") return false;
  if (user.role === "admin") return true;
  return membership !== null;
}

export async function canAccessPropertyWithUser(
  ctx: QueryCtx,
  propertyId: Id<"properties">,
  user: UserProfile
): Promise<boolean> {
  if (!user) return false;
  if (!user.approved && user.role !== "admin") return false;
  if (user.role === "admin") return true;

  const membership = await getMembershipForProperty(ctx, propertyId, user.clerkId);
  return membership !== null;
}

export async function canAccessProperty(
  ctx: QueryCtx,
  propertyId: Id<"properties">
): Promise<boolean> {
  const user = await getCurrentUser(ctx);
  return canAccessPropertyWithUser(ctx, propertyId, user);
}

export async function requirePropertyAccessWithUser(
  ctx: QueryCtx,
  propertyId: Id<"properties">,
  user: UserProfile
): Promise<void> {
  if (!(await canAccessPropertyWithUser(ctx, propertyId, user))) {
    throw new Error("You do not have access to this property");
  }
}

export async function requirePropertyAccess(
  ctx: QueryCtx,
  propertyId: Id<"properties">
): Promise<void> {
  if (!(await canAccessProperty(ctx, propertyId))) {
    throw new Error("You do not have access to this property");
  }
}

export async function canViewPropertyWithUser(
  ctx: QueryCtx,
  propertyId: Id<"properties">,
  user: UserProfile
): Promise<boolean> {
  if (!user) return false;
  if (user.role === "admin") return true;

  const membership = await getMembershipForProperty(ctx, propertyId, user.clerkId);
  return membership !== null;
}

export async function canViewProperty(
  ctx: QueryCtx,
  propertyId: Id<"properties">
): Promise<boolean> {
  const user = await getCurrentUser(ctx);
  return canViewPropertyWithUser(ctx, propertyId, user);
}

export async function canEditPropertyWithUser(
  ctx: QueryCtx,
  propertyId: Id<"properties">,
  user: UserProfile
): Promise<boolean> {
  if (!user) return false;
  if (user.role === "admin") return true;

  const membership = await getMembershipForProperty(ctx, propertyId, user.clerkId);
  if (!membership) return false;

  return hasMinimumRole(membership.role, "owner");
}

export async function canEditProperty(
  ctx: QueryCtx,
  propertyId: Id<"properties">
): Promise<boolean> {
  const user = await getCurrentUser(ctx);
  return canEditPropertyWithUser(ctx, propertyId, user);
}

export async function canManageMembersWithUser(
  ctx: QueryCtx,
  propertyId: Id<"properties">,
  user: UserProfile
): Promise<boolean> {
  if (!user) return false;
  if (user.role === "admin") return true;

  const membership = await getMembershipForProperty(ctx, propertyId, user.clerkId);
  if (!membership) return false;

  return membership.role === "owner";
}

export async function canManageMembers(
  ctx: QueryCtx,
  propertyId: Id<"properties">
): Promise<boolean> {
  const user = await getCurrentUser(ctx);
  return canManageMembersWithUser(ctx, propertyId, user);
}

export async function canViewWifiWithUser(
  ctx: QueryCtx,
  propertyId: Id<"properties">,
  user: UserProfile
): Promise<boolean> {
  if (!user) return false;
  if (user.role === "admin") return true;

  const membership = await getMembershipForProperty(ctx, propertyId, user.clerkId);
  if (!membership) return false;

  return hasMinimumRole(membership.role, "member");
}

export async function canViewWifi(
  ctx: QueryCtx,
  propertyId: Id<"properties">
): Promise<boolean> {
  const user = await getCurrentUser(ctx);
  return canViewWifiWithUser(ctx, propertyId, user);
}

export async function canControlLocksWithUser(
  ctx: QueryCtx,
  propertyId: Id<"properties">,
  user: UserProfile
): Promise<boolean> {
  if (!user) return false;
  if (user.role === "admin") return true;

  const membership = await getMembershipForProperty(ctx, propertyId, user.clerkId);
  if (!membership) return false;

  return hasMinimumRole(membership.role, "member");
}

export async function canControlLocks(
  ctx: QueryCtx,
  propertyId: Id<"properties">
): Promise<boolean> {
  const user = await getCurrentUser(ctx);
  return canControlLocksWithUser(ctx, propertyId, user);
}

export async function canManageGuestAccessWithUser(
  ctx: QueryCtx,
  propertyId: Id<"properties">,
  user: UserProfile
): Promise<boolean> {
  if (!user) return false;
  if (user.role === "admin") return true;

  const membership = await getMembershipForProperty(ctx, propertyId, user.clerkId);
  return membership?.role === "owner";
}

export async function canManageGuestAccess(
  ctx: QueryCtx,
  propertyId: Id<"properties">
): Promise<boolean> {
  const user = await getCurrentUser(ctx);
  return canManageGuestAccessWithUser(ctx, propertyId, user);
}

export async function canAddItemsWithUser(
  ctx: QueryCtx,
  propertyId: Id<"properties">,
  user: UserProfile
): Promise<boolean> {
  if (!user) return false;
  if (user.role === "admin") return true;

  const membership = await getMembershipForProperty(ctx, propertyId, user.clerkId);
  if (!membership) return false;

  return hasMinimumRole(membership.role, "member");
}

export async function canAddItems(
  ctx: QueryCtx,
  propertyId: Id<"properties">
): Promise<boolean> {
  const user = await getCurrentUser(ctx);
  return canAddItemsWithUser(ctx, propertyId, user);
}

export async function requireViewAccess(
  ctx: QueryCtx,
  propertyId: Id<"properties">
): Promise<void> {
  const canView = await canViewProperty(ctx, propertyId);
  if (!canView) {
    throw new Error("You do not have access to this property");
  }
}

export async function requireEditAccess(
  ctx: QueryCtx,
  propertyId: Id<"properties">
): Promise<void> {
  const canEdit = await canEditProperty(ctx, propertyId);
  if (!canEdit) {
    throw new Error("You do not have permission to edit this property");
  }
}

export async function requireMemberManagement(
  ctx: QueryCtx,
  propertyId: Id<"properties">
): Promise<void> {
  const canManage = await canManageMembers(ctx, propertyId);
  if (!canManage) {
    throw new Error("You do not have permission to manage members");
  }
}

export async function requireWifiAccess(
  ctx: QueryCtx,
  propertyId: Id<"properties">
): Promise<void> {
  const canView = await canViewWifi(ctx, propertyId);
  if (!canView) {
    throw new Error("You do not have permission to view WiFi credentials");
  }
}
