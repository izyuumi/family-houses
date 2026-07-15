import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { getCurrentUser, requireAdmin } from "./profiles";
import {
  canAccessPropertyWithUser,
  canControlLocksWithUser,
  canManageGuestAccessWithUser,
  getMembershipForProperty,
} from "./permissions";
import { getProfileMap } from "./utils";

const deviceRole = v.union(
  v.literal("entrance"),
  v.literal("unit"),
  v.literal("mailbox"),
  v.literal("other")
);

export const devicesForProperty = query({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!(await canAccessPropertyWithUser(ctx, args.propertyId, user))) return [];

    const [devices, canControl, canManageGuestAccess] = await Promise.all([
      ctx.db
        .query("switchbotDevices")
        .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
        .collect(),
      canControlLocksWithUser(ctx, args.propertyId, user),
      canManageGuestAccessWithUser(ctx, args.propertyId, user),
    ]);

    return devices.map((device) => ({
      ...device,
      canControl,
      canManageGuestAccess,
    }));
  },
});

export const activityForProperty = query({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    if (user.role !== "admin") {
      const membership = await getMembershipForProperty(ctx, args.propertyId, user.clerkId);
      if (!membership || membership.role === "guest") return [];
    }

    const events = await ctx.db
      .query("lockEvents")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .order("desc")
      .take(50);
    const clerkIds = [
      ...new Set(
        events
          .map((event) => event.actorClerkId)
          .filter((id): id is string => typeof id === "string")
      ),
    ];
    const profileMap = await getProfileMap(ctx, clerkIds);

    return events.map((event) => ({
      ...event,
      actor: event.actorClerkId
        ? profileMap.get(event.actorClerkId) ?? null
        : null,
    }));
  },
});

export const passcodesForProperty = query({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!(await canManageGuestAccessWithUser(ctx, args.propertyId, user))) return [];

    const passcodes = await ctx.db
      .query("guestPasscodes")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .collect();
    return passcodes.filter((passcode) => passcode.status !== "revoked");
  },
});

export const bindDevice = mutation({
  args: {
    propertyId: v.id("properties"),
    accountId: v.optional(v.id("switchbotAccounts")),
    deviceId: v.string(),
    deviceType: v.string(),
    label: v.string(),
    deviceRole,
    keypadDeviceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("switchbotDevices")
      .withIndex("by_device_id", (q) => q.eq("deviceId", args.deviceId))
      .first();
    if (existing) throw new Error("This SwitchBot device is already bound");
    return await ctx.db.insert("switchbotDevices", args);
  },
});

export const unbindDevice = mutation({
  args: { deviceDbId: v.id("switchbotDevices") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const [events, passcodes] = await Promise.all([
      ctx.db
        .query("lockEvents")
        .withIndex("by_device", (q) => q.eq("deviceDbId", args.deviceDbId))
        .collect(),
      ctx.db.query("guestPasscodes").collect(),
    ]);
    await Promise.all([
      ...events.map((event) => ctx.db.delete(event._id)),
      ...passcodes
        .filter((passcode) => passcode.deviceDbId === args.deviceDbId)
        .map((passcode) => ctx.db.delete(passcode._id)),
    ]);
    await ctx.db.delete(args.deviceDbId);
  },
});

export const getDeviceWithAccess = internalQuery({
  args: { deviceDbId: v.id("switchbotDevices") },
  handler: async (ctx, args) => {
    const [user, device] = await Promise.all([
      getCurrentUser(ctx),
      ctx.db.get(args.deviceDbId),
    ]);
    if (!device) return null;
    const [property, canView, canControl, canManageGuestAccess] = await Promise.all([
      ctx.db.get(device.propertyId),
      canAccessPropertyWithUser(ctx, device.propertyId, user),
      canControlLocksWithUser(ctx, device.propertyId, user),
      canManageGuestAccessWithUser(ctx, device.propertyId, user),
    ]);
    return { device, property, canView, canControl, canManageGuestAccess };
  },
});

export const getPropertyDevicesWithAccess = internalQuery({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const canView = await canAccessPropertyWithUser(ctx, args.propertyId, user);
    if (!canView) return null;
    const [property, devices] = await Promise.all([
      ctx.db.get(args.propertyId),
      ctx.db
        .query("switchbotDevices")
        .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
        .collect(),
    ]);
    return { property, devices, canView };
  },
});

export const getPasscodeWithAccess = internalQuery({
  args: { passcodeId: v.id("guestPasscodes") },
  handler: async (ctx, args) => {
    const [user, passcode] = await Promise.all([
      getCurrentUser(ctx),
      ctx.db.get(args.passcodeId),
    ]);
    if (!passcode) return null;
    const device = await ctx.db.get(passcode.deviceDbId);
    if (!device) return null;
    return {
      passcode,
      device,
      canManageGuestAccess: await canManageGuestAccessWithUser(
        ctx,
        passcode.propertyId,
        user
      ),
    };
  },
});

export const getBoundDeviceIds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const devices = await ctx.db.query("switchbotDevices").collect();
    return devices.map((device) => device.deviceId);
  },
});

export const upsertDeviceState = internalMutation({
  args: {
    deviceDbId: v.id("switchbotDevices"),
    lockState: v.optional(v.string()),
    doorState: v.optional(v.string()),
    battery: v.optional(v.number()),
    stateUpdatedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const device = await ctx.db.get(args.deviceDbId);
    if (!device) return null;
    const updates: {
      lockState?: string;
      doorState?: string;
      battery?: number;
      stateUpdatedAt?: number;
    } = {};
    if (args.lockState !== undefined) updates.lockState = args.lockState;
    if (args.doorState !== undefined) updates.doorState = args.doorState;
    if (args.battery !== undefined) updates.battery = args.battery;
    if (args.stateUpdatedAt !== undefined) updates.stateUpdatedAt = args.stateUpdatedAt;
    await ctx.db.patch(device._id, updates);
    return { ...device, ...updates };
  },
});

export const applyWebhookEvent = internalMutation({
  args: {
    switchbotDeviceId: v.string(),
    lockState: v.optional(v.string()),
    doorState: v.optional(v.string()),
    battery: v.optional(v.number()),
    at: v.number(),
  },
  handler: async (ctx, args) => {
    const device = await ctx.db
      .query("switchbotDevices")
      .withIndex("by_device_id", (q) => q.eq("deviceId", args.switchbotDeviceId))
      .first();
    if (!device) return null;

    const lockStateChanged =
      args.lockState !== undefined && args.lockState !== device.lockState;
    const doorStateChanged =
      args.doorState !== undefined && args.doorState !== device.doorState;
    const changed = lockStateChanged || doorStateChanged;
    const updates: {
      lockState?: string;
      doorState?: string;
      battery?: number;
      stateUpdatedAt: number;
    } = { stateUpdatedAt: args.at };
    if (args.lockState !== undefined) updates.lockState = args.lockState;
    if (args.doorState !== undefined) updates.doorState = args.doorState;
    if (args.battery !== undefined) updates.battery = args.battery;
    await ctx.db.patch(device._id, updates);

    if (changed) {
      await ctx.db.insert("lockEvents", {
        propertyId: device.propertyId,
        deviceDbId: device._id,
        action: "state_change",
        source: "webhook",
        lockState: args.lockState ?? device.lockState,
        doorState: args.doorState ?? device.doorState,
        at: args.at,
      });
    }
    return { changed };
  },
});

export const recordEvent = internalMutation({
  args: {
    propertyId: v.id("properties"),
    deviceDbId: v.id("switchbotDevices"),
    action: v.string(),
    source: v.string(),
    actorClerkId: v.optional(v.string()),
    lockState: v.optional(v.string()),
    doorState: v.optional(v.string()),
    at: v.number(),
  },
  handler: async (ctx, args) => await ctx.db.insert("lockEvents", args),
});

export const insertPendingPasscode = internalMutation({
  args: {
    propertyId: v.id("properties"),
    deviceDbId: v.id("switchbotDevices"),
    name: v.string(),
    code: v.string(),
    passcodeType: v.string(),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) =>
    await ctx.db.insert("guestPasscodes", { ...args, status: "pending" }),
});

export const markPasscodeActive = internalMutation({
  args: {
    passcodeId: v.id("guestPasscodes"),
    switchbotKeyId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.passcodeId, {
      status: "active",
      ...(args.switchbotKeyId ? { switchbotKeyId: args.switchbotKeyId } : {}),
    });
  },
});

export const markPasscodeFailed = internalMutation({
  args: { passcodeId: v.id("guestPasscodes") },
  handler: async (ctx, args) => await ctx.db.patch(args.passcodeId, { status: "failed" }),
});

export const markPasscodeRevoked = internalMutation({
  args: { passcodeId: v.id("guestPasscodes") },
  handler: async (ctx, args) => await ctx.db.patch(args.passcodeId, { status: "revoked" }),
});
