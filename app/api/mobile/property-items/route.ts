import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { getMobileAuthContext, toPropertyId } from "@/lib/mobile-auth";
import {
  mobileError,
  optionalString,
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
  const title = requiredString(body, "title");

  if (!propertyId || !title) {
    return NextResponse.json(
      { error: "propertyId and title are required" },
      { status: 400 }
    );
  }

  return runMobileMutation(() => {
    return authContext.convex.mutation(api.propertyItems.add, {
      propertyId: toPropertyId(propertyId),
      title,
      boughtDate: optionalString(body, "boughtDate"),
      category: optionalString(body, "category"),
      note: optionalString(body, "note"),
      createdBy: authContext.user.clerkId,
    });
  });
}
