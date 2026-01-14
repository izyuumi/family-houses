import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { propertyId, type = "main" } = await req.json();

  const convex = getConvexClient();

  try {
    const password = await convex.query(api.properties.getWifiPassword, {
      id: propertyId as Id<"properties">,
      type,
    });

    return NextResponse.json({ password: password ?? "" });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to get password",
      },
      { status: 400 }
    );
  }
}
