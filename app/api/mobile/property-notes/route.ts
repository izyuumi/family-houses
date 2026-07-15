import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { getMobileAuthContext, toPropertyId } from "@/lib/mobile-auth";
import {
  mobileError,
  parseJsonObject,
  requiredString,
  runMobileMutation,
} from "@/lib/mobile-api";

export async function POST(request: Request) {
  const authContext = await getMobileAuthContext(request);
  if (!authContext) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await parseJsonObject(request);
  if (!body) {
    return mobileError("invalid json body", 400);
  }

  const propertyId = requiredString(body, "propertyId");
  const content = requiredString(body, "content");

  if (!propertyId || !content) {
    return NextResponse.json(
      { error: "propertyId and content are required" },
      { status: 400 }
    );
  }

  return runMobileMutation(() => {
    return authContext.convex.mutation(api.propertyNotes.add, {
      propertyId: toPropertyId(propertyId),
      content,
      createdBy: authContext.user.clerkId,
    });
  });
}
