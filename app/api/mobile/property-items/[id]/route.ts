import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { getMobileAuthContext, toPropertyItemId } from "@/lib/mobile-auth";
import { runMobileMutation } from "@/lib/mobile-api";

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
    return authContext.convex.mutation(api.propertyItems.remove, {
      id: toPropertyItemId(id),
    });
  });
}
