import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getAuthenticatedConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { AdminClientLazy } from "@/components/admin-client-lazy";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function EditContent({ slugOrId }: { slugOrId: string }) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const convex = await getAuthenticatedConvexClient();
  const profile = await convex.query(api.profiles.getByClerkId, {
    clerkId: userId,
  });

  if (profile?.role !== "admin") {
    redirect("/");
  }

  const property = await convex.query(api.properties.getBySlugOrId, {
    slugOrId,
  });

  if (!property) {
    redirect("/");
  }

  return (
    <AdminClientLazy
      mode="edit"
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
        wifi_password: property.wifiPassword ?? null,
        guest_wifi_ssid: property.guestWifiSsid ?? null,
        guest_wifi_password: property.guestWifiPassword ?? null,
        mailbox_lock_combination: property.mailboxLockCombination ?? null,
        location_x: property.locationX ?? null,
        location_y: property.locationY ?? null,
      }}
    />
  );
}

async function EditData({
  paramsPromise,
}: {
  paramsPromise: Promise<{ id: string }>;
}) {
  const { id } = await paramsPromise;
  if (!id || id === "undefined") {
    redirect("/");
  }
  return <EditContent slugOrId={id} />;
}

function LoadingState() {
  return (
    <main className="min-h-dvh flex flex-col">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-14 shrink-0">
        <div className="w-full max-w-5xl flex justify-between items-center px-4">
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </div>
      </nav>
      <div className="flex-1 p-4 max-w-xl mx-auto w-full pb-20">
        <div className="h-4 w-48 bg-muted animate-pulse rounded mb-4" />
        <div className="space-y-4">
          <div className="h-10 bg-muted animate-pulse rounded-md" />
          <div className="h-10 bg-muted animate-pulse rounded-md" />
          <div className="h-10 bg-muted animate-pulse rounded-md" />
        </div>
      </div>
    </main>
  );
}

export default function EditPropertyPage({ params }: PageProps) {
  return (
    <Suspense fallback={<LoadingState />}>
      <EditData paramsPromise={params} />
    </Suspense>
  );
}
