import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminClientLazy } from "@/components/admin-client-lazy";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface Property {
  id: string;
  slug: string | null;
  name: string;
  postal_code: string | null;
  prefecture: string | null;
  city_ward_town: string | null;
  area: string | null;
  chome: string | null;
  block: string | null;
  building: string | null;
  room: string | null;
  wifi_ssid: string | null;
  wifi_password: string | null;
  guest_wifi_ssid: string | null;
  guest_wifi_password: string | null;
  location_x: number | null;
  location_y: number | null;
}

async function EditContent({ slugOrId }: { slugOrId: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  const selectFields = "id, slug, name, postal_code, prefecture, city_ward_town, area, chome, block, building, room, wifi_ssid, wifi_password, guest_wifi_ssid, guest_wifi_password, location_x, location_y";
  
  let propertyResult = await supabase
    .from("properties")
    .select(selectFields)
    .eq("slug", slugOrId)
    .maybeSingle();

  if (!propertyResult.data && !propertyResult.error) {
    propertyResult = await supabase
      .from("properties")
      .select(selectFields)
      .eq("id", slugOrId)
      .maybeSingle();
  }

  const { data: property, error } = propertyResult;

  if (error || !property) {
    redirect("/");
  }

  return <AdminClientLazy mode="edit" property={property as Property} />;
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
