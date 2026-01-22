import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getAuthenticatedConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { PropertyClient } from "@/components/property-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function PropertyContent({ slugOrId }: { slugOrId: string }) {
  const { userId } = await auth();

  if (!userId) redirect("/");

  const convex = await getAuthenticatedConvexClient();
  const data = await convex.query(api.properties.propertyDetailData, { slugOrId });

  if (!data) {
    redirect("/");
  }

  const { property, profile, groceries, propertyItems, propertyNotes } = data;
  const isAdmin = profile?.role === "admin";

  return (
    <PropertyClient
      property={{
        id: property._id,
        slug: property.slug ?? null,
        name: property.name,
        postal_code: property.postalCode ?? null,
        prefecture: property.prefecture ?? null,
        city_ward_town: property.cityWardTown ?? null,
        area: property.area ?? null,
        chome: property.chome ?? null,
        block: property.block ?? null,
        building: property.building ?? null,
        room: property.room ?? null,
        apple_maps_url: property.appleMapsUrl ?? null,
        wifi_ssid: property.wifiSsid ?? null,
        guest_wifi_ssid: property.guestWifiSsid ?? null,
        has_mailbox_lock: !!property.mailboxLockCombination,
      }}
      isAdmin={isAdmin}
      userId={userId}
      initialGroceries={groceries.map((g) => ({
        id: g._id,
        property_id: g.propertyId,
        item_name: g.itemName,
        quantity: g.quantity ?? null,
        checked: g.checked,
        added_by: g.addedBy ?? null,
        completed_by: g.completedBy ?? null,
        completed_at: g.completedAt ? new Date(g.completedAt).toISOString() : null,
        created_at: g._creationTime ? new Date(g._creationTime).toISOString() : null,
        updated_at: null,
        adder: g.adder ? { display_name: g.adder.displayName ?? null } : null,
        completer: g.completer ? { display_name: g.completer.displayName ?? null } : null,
      }))}
      initialPropertyItems={propertyItems.map((i) => ({
        id: i._id,
        property_id: i.propertyId,
        title: i.title,
        bought_date: i.boughtDate ?? null,
        note: i.note ?? null,
        category: i.category ?? null,
        created_by: i.createdBy ?? null,
        created_at: i._creationTime ? new Date(i._creationTime).toISOString() : null,
        updated_at: null,
        creator: i.creator ? { display_name: i.creator.displayName ?? null } : null,
      }))}
      initialPropertyNotes={propertyNotes.map((n) => ({
        id: n._id,
        property_id: n.propertyId,
        content: n.content,
        created_by: n.createdBy ?? null,
        created_at: n._creationTime ? new Date(n._creationTime).toISOString() : null,
        updated_at: null,
        creator: n.creator ? { display_name: n.creator.displayName ?? null } : null,
      }))}
    />
  );
}

async function PropertyData({
  paramsPromise,
}: {
  paramsPromise: Promise<{ id: string }>;
}) {
  const { id } = await paramsPromise;
  if (!id || id === "undefined") {
    redirect("/");
  }
  return <PropertyContent slugOrId={id} />;
}

function LoadingState() {
  return (
    <div className="h-dvh flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">...</div>
    </div>
  );
}

export default function PropertyDetail({ params }: PageProps) {
  return (
    <Suspense fallback={<LoadingState />}>
      <PropertyData paramsPromise={params} />
    </Suspense>
  );
}
