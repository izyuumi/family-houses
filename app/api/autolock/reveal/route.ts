import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAuthenticatedConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { propertyId } = await req.json();

  const convex = await getAuthenticatedConvexClient();

  try {
    const profile = await convex.query(api.profiles.getByClerkId, {
      clerkId: userId,
    });

    const isSystemAdmin = profile?.role === "admin";

    if (!isSystemAdmin) {
      const membership = await convex.query(api.propertyMembers.getMembership, {
        propertyId: propertyId as Id<"properties">,
        userId,
      });

      if (!membership) {
        return NextResponse.json(
          { error: "You do not have access to this property" },
          { status: 403 }
        );
      }

      if (membership.role === "guest") {
        return NextResponse.json(
          { error: "Guests cannot view auto-lock codes" },
          { status: 403 }
        );
      }
    }

    const code = await convex.query(api.properties.getAutoLockCode, {
      id: propertyId as Id<"properties">,
    });

    return NextResponse.json({ code: code ?? "" });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to get auto-lock code",
      },
      { status: 400 }
    );
  }
}
