import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { getMobileAuthContext } from "@/lib/mobile-auth";
import { mobileError } from "@/lib/mobile-api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  const authContext = await getMobileAuthContext(request);

  if (!authContext) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { idOrSlug } = await params;
  let data;
  try {
    data = await authContext.convex.query(api.properties.propertyDetailData, {
      slugOrId: idOrSlug,
    });
  } catch {
    return mobileError("request failed", 500);
  }

  if (!data) {
    return mobileError("not found", 404);
  }

  const { property, groceries, propertyItems, propertyNotes } = data;

  return NextResponse.json({
    id: property._id,
    slug: property.slug ?? null,
    name: property.name,
    postalCode: property.postalCode ?? null,
    prefecture: property.prefecture ?? null,
    cityWardTown: property.cityWardTown ?? null,
    area: property.area ?? null,
    chome: property.chome ?? null,
    block: property.block ?? null,
    building: property.building ?? null,
    room: property.room ?? null,
    appleMapsURL: property.appleMapsUrl ?? null,
    wifiSSID: property.wifiSsid ?? null,
    guestWifiSSID: property.guestWifiSsid ?? null,
    groceries: groceries.map((item) => ({
      id: item._id,
      propertyId: item.propertyId,
      itemName: item.itemName,
      checked: item.checked,
      quantity: item.quantity ?? null,
      addedByName: item.adder?.displayName ?? null,
      completedByName: item.completer?.displayName ?? null,
    })),
    propertyItems: propertyItems.map((item) => ({
      id: item._id,
      propertyId: item.propertyId,
      title: item.title,
      boughtDate: item.boughtDate ?? null,
      category: item.category ?? null,
      note: item.note ?? null,
      createdByName: item.creator?.displayName ?? null,
    })),
    propertyNotes: propertyNotes.map((note) => ({
      id: note._id,
      propertyId: note.propertyId,
      content: note.content,
      createdAtISO: note._creationTime ? new Date(note._creationTime).toISOString() : null,
      createdByName: note.creator?.displayName ?? null,
    })),
  });
}
