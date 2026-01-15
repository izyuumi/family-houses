import { QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getMembershipInternal, hasMinimumRole } from "./propertyMembers";
import { getCurrentUser, isAdmin } from "./profiles";

export async function canViewProperty(
  ctx: QueryCtx,
  propertyId: Id<"properties">
): Promise<boolean> {
  const user = await getCurrentUser(ctx);
  if (!user) return false;

  if (await isAdmin(ctx)) return true;

  const membership = await getMembershipInternal(ctx, propertyId, user.clerkId);
  return membership !== null;
}

export async function canEditProperty(
  ctx: QueryCtx,
  propertyId: Id<"properties">
): Promise<boolean> {
  const user = await getCurrentUser(ctx);
  if (!user) return false;

  if (await isAdmin(ctx)) return true;

  const membership = await getMembershipInternal(ctx, propertyId, user.clerkId);
  if (!membership) return false;

  return hasMinimumRole(membership.role, "admin");
}

export async function canManageMembers(
  ctx: QueryCtx,
  propertyId: Id<"properties">
): Promise<boolean> {
  const user = await getCurrentUser(ctx);
  if (!user) return false;

  if (await isAdmin(ctx)) return true;

  const membership = await getMembershipInternal(ctx, propertyId, user.clerkId);
  if (!membership) return false;

  return membership.role === "owner";
}

export async function canViewWifi(
  ctx: QueryCtx,
  propertyId: Id<"properties">
): Promise<boolean> {
  const user = await getCurrentUser(ctx);
  if (!user) return false;

  if (await isAdmin(ctx)) return true;

  const membership = await getMembershipInternal(ctx, propertyId, user.clerkId);
  if (!membership) return false;

  return hasMinimumRole(membership.role, "member");
}

export async function canAddItems(
  ctx: QueryCtx,
  propertyId: Id<"properties">
): Promise<boolean> {
  const user = await getCurrentUser(ctx);
  if (!user) return false;

  if (await isAdmin(ctx)) return true;

  const membership = await getMembershipInternal(ctx, propertyId, user.clerkId);
  if (!membership) return false;

  return hasMinimumRole(membership.role, "member");
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
