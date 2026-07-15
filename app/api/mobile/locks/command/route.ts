import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getMobileAuthContext } from "@/lib/mobile-auth";
import { mobileError, parseJsonObject, requiredString } from "@/lib/mobile-api";

function actionErrorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : "SwitchBot request failed";
}

function isPermissionError(message: string) {
  return /permission|access|authentication/i.test(message);
}

export async function POST(request: Request) {
  const authContext = await getMobileAuthContext(request);
  if (!authContext) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await parseJsonObject(request);
  if (!body) {
    return mobileError("invalid json body", 400);
  }

  const deviceId = requiredString(body, "device_id");
  const command = requiredString(body, "command");
  if (!deviceId || (command !== "lock" && command !== "unlock")) {
    return mobileError("device_id and a lock or unlock command are required", 400);
  }

  try {
    const status = await authContext.convex.action(api.switchbot.sendLockCommand, {
      deviceDbId: deviceId as Id<"switchbotDevices">,
      command,
    });
    return NextResponse.json({
      lock_state: status.lockState ?? null,
      door_state: status.doorState ?? null,
      battery: status.battery ?? null,
    });
  } catch (error) {
    const message = actionErrorMessage(error);
    return mobileError(message, isPermissionError(message) ? 403 : 502);
  }
}
