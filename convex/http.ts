import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { WebhookEvent } from "@clerk/backend";
import { Webhook } from "svix";

const http = httpRouter();

http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const event = await validateRequest(request);
    if (!event) {
      return new Response("Error occurred", { status: 400 });
    }
    switch (event.type) {
      case "user.created":
      case "user.updated":
        await ctx.runMutation(internal.profiles.upsertFromClerk, {
          data: event.data,
        });
        break;

      case "user.deleted": {
        const clerkUserId = event.data.id!;
        await ctx.runMutation(internal.profiles.deleteFromClerk, {
          clerkUserId,
        });
        break;
      }
      default:
        console.log("Ignored Clerk webhook event", event.type);
    }

    return new Response(null, { status: 200 });
  }),
});

http.route({
  path: "/switchbot-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const { webhookToken } = await ctx.runQuery(
      internal.integrationSettings.getSwitchbotCredentials,
      {}
    );
    const suppliedToken = new URL(request.url).searchParams.get("token");
    if (!webhookToken || suppliedToken !== webhookToken) {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      const payload = await request.json() as Record<string, unknown>;
      const context = asRecord(payload.context);
      const eventData = asRecord(payload.eventData);
      const deviceId = stringValue(context.deviceMac) ?? stringValue(eventData.lockId);
      if (!deviceId) {
        console.warn("Ignored SwitchBot webhook without a lock device ID");
        return new Response(null, { status: 200 });
      }

      const timeOfSample = numberValue(context.timeOfSample);
      await ctx.runMutation(internal.locks.applyWebhookEvent, {
        switchbotDeviceId: deviceId,
        lockState: normalizeLockState(context.lockState ?? eventData.lockState),
        doorState: normalizeDoorState(context.doorState ?? eventData.doorState),
        battery: numberValue(context.battery ?? eventData.battery),
        at: timeOfSample ?? Date.now(),
      });
    } catch (error) {
      console.warn("Ignored invalid SwitchBot webhook payload", error);
    }

    return new Response(null, { status: 200 });
  }),
});

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

function normalizeLockState(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const state = value.toLowerCase();
  if (state === "locked") return "lock";
  if (state === "unlocked") return "unlock";
  if (state === "jammed") return "jammed";
  if (state === "latchboltlocked") return "latchBoltLocked";
  if (state === "lock" || state === "unlock") return state;
  return undefined;
}

function normalizeDoorState(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const state = value.toLowerCase();
  if (state === "open") return "open";
  if (state === "closed" || state === "close") return "close";
  return undefined;
}

async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const payloadString = await req.text();
  const svixHeaders = {
    "svix-id": req.headers.get("svix-id")!,
    "svix-timestamp": req.headers.get("svix-timestamp")!,
    "svix-signature": req.headers.get("svix-signature")!,
  };
  try {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("Missing CLERK_WEBHOOK_SECRET");
    }

    const wh = new Webhook(webhookSecret);
    return wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
  } catch (error) {
    console.error("Error verifying webhook event", error);
    return null;
  }
}

export default http;
