import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { getMobileAuthContext, toGroceryId } from "@/lib/mobile-auth";
import { mobileError, parseJsonObject, runMobileMutation } from "@/lib/mobile-api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authContext = await getMobileAuthContext(request);
  if (!authContext) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await parseJsonObject(request);
  if (!body) {
    return mobileError("invalid json body", 400);
  }

  if (typeof body.checked !== "boolean") {
    return mobileError("checked must be a boolean", 400);
  }
  const checked = body.checked;

  return runMobileMutation(() => {
    return authContext.convex.mutation(api.groceryItems.toggle, {
      id: toGroceryId(id),
      checked,
      completedBy: checked ? authContext.user.clerkId : undefined,
    });
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authContext = await getMobileAuthContext(request);
  if (!authContext) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  return runMobileMutation(() => {
    return authContext.convex.mutation(api.groceryItems.remove, {
      id: toGroceryId(id),
    });
  });
}
