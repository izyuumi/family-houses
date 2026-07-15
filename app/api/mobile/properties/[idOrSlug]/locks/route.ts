import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { getMobileAuthContext } from "@/lib/mobile-auth";
import { mobileError } from "@/lib/mobile-api";

function actionErrorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : "SwitchBot request failed";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  const authContext = await getMobileAuthContext(request);
  if (!authContext) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { idOrSlug } = await params;
  let property;
  try {
    property = await authContext.convex.query(api.properties.getBySlugOrId, {
      slugOrId: idOrSlug,
    });
  } catch {
    return mobileError("request failed", 500);
  }

  if (!property) {
    return mobileError("not found", 404);
  }

  try {
    await authContext.convex.action(api.switchbot.refreshPropertyStatus, {
      propertyId: property._id,
    });
  } catch (error) {
    return mobileError(actionErrorMessage(error), 502);
  }

  try {
    const [devices, activity] = await Promise.all([
      authContext.convex.query(api.locks.devicesForProperty, {
        propertyId: property._id,
      }),
      authContext.convex.query(api.locks.activityForProperty, {
        propertyId: property._id,
      }),
    ]);

    return NextResponse.json({
      devices: devices.map((device) => ({
        id: device._id,
        label: device.label,
        device_role: device.deviceRole,
        lock_state: device.lockState ?? null,
        door_state: device.doorState ?? null,
        battery: device.battery ?? null,
        state_updated_at: device.stateUpdatedAt ?? null,
        can_control: device.canControl,
      })),
      activity: activity.map((event) => ({
        action: event.action,
        actor_name: event.actor?.displayName ?? null,
        source: event.source,
        at: event.at,
      })),
    });
  } catch {
    return mobileError("request failed", 500);
  }
}
