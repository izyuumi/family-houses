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
  const itemName = requiredString(body, "itemName");

  if (!propertyId || !itemName) {
    return NextResponse.json(
      { error: "propertyId and itemName are required" },
      { status: 400 }
    );
  }

  const quantity = optionalString(body, "quantity");

  return runMobileMutation(() => {
    return authContext.convex.mutation(api.groceryItems.add, {
      propertyId: toPropertyId(propertyId),
      itemName,
      quantity,
      addedBy: authContext.user.clerkId,
    });
  });
}
