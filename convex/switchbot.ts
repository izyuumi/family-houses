"use node";

import { createHmac, randomUUID } from "crypto";
import { v } from "convex/values";
import { action, type ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const SWITCHBOT_BASE_URL = "https://api.switch-bot.com";

type SwitchBotEnvelope = {
  statusCode?: number;
  message?: string;
  body?: unknown;
};

type LockStatus = {
  lockState?: string;
  doorState?: string;
  battery?: number;
};

function normalizeLockState(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.toLowerCase();
  if (normalized === "locked") return "lock";
  if (normalized === "unlocked") return "unlock";
  if (normalized === "jammed") return "jammed";
  if (normalized === "latchboltlocked") return "latchBoltLocked";
  if (["lock", "unlock"].includes(normalized)) return normalized;
  return value;
}

function normalizeDoorState(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.toLowerCase();
  if (normalized === "closed") return "close";
  if (normalized === "open") return "open";
  if (normalized === "close") return "close";
  return value;
}

function readLockStatus(body: unknown): LockStatus {
  const status = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const battery = typeof status.battery === "number" ? status.battery : undefined;
  return {
    lockState: normalizeLockState(status.lockState),
    doorState: normalizeDoorState(status.doorState),
    battery,
  };
}

type SwitchBotCredentials = { token?: string; secret?: string };

async function getCredentials(ctx: ActionCtx): Promise<SwitchBotCredentials> {
  return await ctx.runQuery(internal.integrationSettings.getSwitchbotCredentials, {});
}

async function switchBotFetch(
  creds: SwitchBotCredentials,
  path: string,
  options: { method?: "GET" | "POST"; body?: unknown } = {}
): Promise<unknown> {
  const { token, secret } = creds;
  if (!token || !secret) throw new Error("SwitchBot is not configured");

  const timestamp = Date.now().toString();
  const nonce = randomUUID();
  const sign = createHmac("sha256", secret)
    .update(`${token}${timestamp}${nonce}`)
    .digest("base64")
    .toUpperCase();
  const response = await fetch(`${SWITCHBOT_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: token,
      t: timestamp,
      nonce,
      sign,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });

  let payload: SwitchBotEnvelope;
  try {
    payload = await response.json() as SwitchBotEnvelope;
  } catch {
    throw new Error(`SwitchBot request failed (${response.status})`);
  }
  if (!response.ok || payload.statusCode !== 100) {
    throw new Error(payload.message || `SwitchBot request failed (${response.status})`);
  }
  return payload.body;
}

async function requireIdentity(ctx: ActionCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Authentication required");
  return identity;
}

export const listAccountLocks = action({
  args: {},
  handler: async (ctx): Promise<{
    locks: Array<{ deviceId: string; deviceName: string; deviceType: string }>;
    keypads: Array<{ deviceId: string; deviceName: string; deviceType: string; lockDeviceId?: string }>;
  }> => {
    await requireIdentity(ctx);
    const [user, boundDeviceIds] = await Promise.all([
      ctx.runQuery(internal.profiles.currentForAction, {}),
      ctx.runQuery(internal.locks.getBoundDeviceIds, {}),
    ]);
    if (user?.role !== "admin") throw new Error("Admin access required");

    const body = await switchBotFetch(await getCredentials(ctx), "/v1.1/devices");
    const deviceList = body && typeof body === "object" && Array.isArray((body as { deviceList?: unknown }).deviceList)
      ? (body as { deviceList: Array<Record<string, unknown>> }).deviceList
      : [];
    const boundIds = new Set(boundDeviceIds);
    const locks = deviceList
      .filter((device) => {
        const type = typeof device.deviceType === "string" ? device.deviceType : "";
        return type.includes("Lock") && !boundIds.has(String(device.deviceId));
      })
      .map((device) => ({
        deviceId: String(device.deviceId),
        deviceName: typeof device.deviceName === "string" ? device.deviceName : String(device.deviceId),
        deviceType: String(device.deviceType),
      }));
    const keypads = deviceList
      .filter((device) => {
        const type = typeof device.deviceType === "string" ? device.deviceType : "";
        return type.startsWith("Keypad");
      })
      .map((device) => ({
        deviceId: String(device.deviceId),
        deviceName: typeof device.deviceName === "string" ? device.deviceName : String(device.deviceId),
        deviceType: String(device.deviceType),
        ...(typeof device.lockDeviceId === "string" ? { lockDeviceId: device.lockDeviceId } : {}),
      }));
    return { locks, keypads };
  },
});

export const sendLockCommand = action({
  args: {
    deviceDbId: v.id("switchbotDevices"),
    command: v.union(v.literal("lock"), v.literal("unlock")),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const access = await ctx.runQuery(internal.locks.getDeviceWithAccess, {
      deviceDbId: args.deviceDbId,
    });
    if (!access?.canControl) throw new Error("You do not have permission to control locks");

    const creds = await getCredentials(ctx);
    await switchBotFetch(creds, `/v1.1/devices/${access.device.deviceId}/commands`, {
      method: "POST",
      body: { commandType: "command", command: args.command, parameter: "default" },
    });
    const status = readLockStatus(
      await switchBotFetch(creds, `/v1.1/devices/${access.device.deviceId}/status`)
    );
    await ctx.runMutation(internal.locks.upsertDeviceState, {
      deviceDbId: access.device._id,
      ...status,
      stateUpdatedAt: Date.now(),
    });
    await ctx.runMutation(internal.locks.recordEvent, {
      propertyId: access.device.propertyId,
      deviceDbId: access.device._id,
      action: args.command,
      source: "app",
      actorClerkId: identity.subject,
      ...status,
      at: Date.now(),
    });
    return status;
  },
});

export const refreshPropertyStatus = action({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args): Promise<Array<{
    deviceDbId: Id<"switchbotDevices">;
    lockState?: string;
    doorState?: string;
    battery?: number;
  }>> => {
    await requireIdentity(ctx);
    const access = await ctx.runQuery(internal.locks.getPropertyDevicesWithAccess, {
      propertyId: args.propertyId,
    });
    if (!access?.canView) throw new Error("You do not have access to this property");

    const creds = await getCredentials(ctx);
    return await Promise.all(
      access.devices.map(async (device) => {
        const status = readLockStatus(
          await switchBotFetch(creds, `/v1.1/devices/${device.deviceId}/status`)
        );
        await ctx.runMutation(internal.locks.upsertDeviceState, {
          deviceDbId: device._id,
          ...status,
          stateUpdatedAt: Date.now(),
        });
        return { deviceDbId: device._id, ...status };
      })
    );
  },
});

export const createGuestPasscode = action({
  args: {
    deviceDbId: v.id("switchbotDevices"),
    name: v.string(),
    code: v.string(),
    passcodeType: v.union(
      v.literal("permanent"),
      v.literal("timeLimit"),
      v.literal("disposable")
    ),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ passcodeId: Id<"guestPasscodes">; status: string }> => {
    const identity = await requireIdentity(ctx);
    const access = await ctx.runQuery(internal.locks.getDeviceWithAccess, {
      deviceDbId: args.deviceDbId,
    });
    if (!access?.canManageGuestAccess) {
      throw new Error("You do not have permission to manage guest access");
    }
    if (!args.name.trim()) throw new Error("Guest name is required");
    if (!/^\d{6,12}$/.test(args.code)) throw new Error("Guest code must be 6 to 12 digits");
    if (!access.device.keypadDeviceId) throw new Error("No keypad paired");
    if (args.passcodeType !== "permanent" && (!args.startTime || !args.endTime)) {
      throw new Error("Start and end times are required for this guest code");
    }

    const passcodeId = await ctx.runMutation(internal.locks.insertPendingPasscode, {
      propertyId: access.device.propertyId,
      deviceDbId: access.device._id,
      name: args.name.trim(),
      code: args.code,
      passcodeType: args.passcodeType,
      startTime: args.startTime,
      endTime: args.endTime,
      createdBy: identity.subject,
    });
    const parameter: Record<string, unknown> = {
      name: args.name.trim(),
      type: args.passcodeType,
      password: args.code,
    };
    if (args.passcodeType !== "permanent") {
      parameter.startTime = Math.floor(args.startTime! / 1000);
      parameter.endTime = Math.floor(args.endTime! / 1000);
    }

    try {
      const body = await switchBotFetch(
        await getCredentials(ctx),
        `/v1.1/devices/${access.device.keypadDeviceId}/commands`,
        { method: "POST", body: { commandType: "command", command: "createKey", parameter } }
      );
      const response = body && typeof body === "object" ? body as Record<string, unknown> : {};
      const keyId = typeof response.id === "string"
        ? response.id
        : typeof response.keyId === "string"
          ? response.keyId
          : undefined;
      await ctx.runMutation(internal.locks.markPasscodeActive, { passcodeId, switchbotKeyId: keyId });
      await ctx.runMutation(internal.locks.recordEvent, {
        propertyId: access.device.propertyId,
        deviceDbId: access.device._id,
        action: "passcode_created",
        source: "app",
        actorClerkId: identity.subject,
        at: Date.now(),
      });
      return { passcodeId, status: "active" };
    } catch (error) {
      await ctx.runMutation(internal.locks.markPasscodeFailed, { passcodeId });
      throw error;
    }
  },
});

export const deleteGuestPasscode = action({
  args: { passcodeId: v.id("guestPasscodes") },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const access = await ctx.runQuery(internal.locks.getPasscodeWithAccess, {
      passcodeId: args.passcodeId,
    });
    if (!access?.canManageGuestAccess) {
      throw new Error("You do not have permission to manage guest access");
    }

    const creds = await getCredentials(ctx);
    let keyId = access.passcode.switchbotKeyId;
    if (!keyId && access.device.keypadDeviceId) {
      const body = await switchBotFetch(creds, "/v1.1/devices");
      const devices = body && typeof body === "object" && Array.isArray((body as { deviceList?: unknown }).deviceList)
        ? (body as { deviceList: Array<Record<string, unknown>> }).deviceList
        : [];
      const keypad = devices.find((device) => device.deviceId === access.device.keypadDeviceId);
      const keyList = keypad && Array.isArray(keypad.keyList) ? keypad.keyList : [];
      const matchingKey = keyList.find(
        (key): key is Record<string, unknown> =>
          Boolean(key && typeof key === "object" && (key as Record<string, unknown>).name === access.passcode.name)
      );
      if (matchingKey && typeof matchingKey.id === "string") keyId = matchingKey.id;
    }

    let warning: string | undefined;
    if (keyId && access.device.keypadDeviceId) {
      await switchBotFetch(creds, `/v1.1/devices/${access.device.keypadDeviceId}/commands`, {
        method: "POST",
        body: { commandType: "command", command: "deleteKey", parameter: { id: keyId } },
      });
    } else {
      warning = "The keypad key could not be found; the local guest code was revoked.";
    }
    await ctx.runMutation(internal.locks.markPasscodeRevoked, { passcodeId: access.passcode._id });
    await ctx.runMutation(internal.locks.recordEvent, {
      propertyId: access.passcode.propertyId,
      deviceDbId: access.device._id,
      action: "passcode_deleted",
      source: "app",
      actorClerkId: identity.subject,
      at: Date.now(),
    });
    return warning ? { warning } : {};
  },
});

export const registerWebhook = action({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    const user = await ctx.runQuery(internal.profiles.currentForAction, {});
    if (user?.role !== "admin") throw new Error("Admin access required");
    if (!args.url.startsWith("https://")) throw new Error("Webhook URL must use HTTPS");
    await switchBotFetch(await getCredentials(ctx), "/v1.1/webhook/setupWebhook", {
      method: "POST",
      body: { action: "setupWebhook", url: args.url, deviceList: "ALL" },
    });
    return { success: true };
  },
});
