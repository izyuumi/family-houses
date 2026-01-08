import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminClient } from "@/components/admin-client";

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

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  
  const propertyQuery = supabase
    .from("properties")
    .select("id, slug, name, postal_code, prefecture, city_ward_town, area, chome, block, building, room, wifi_ssid, wifi_password, guest_wifi_ssid, guest_wifi_password, location_x, location_y");
  
  const { data: property, error } = isUuid 
    ? await propertyQuery.eq("id", slugOrId).maybeSingle()
    : await propertyQuery.eq("slug", slugOrId).maybeSingle();

  if (error || !property) {
    redirect("/");
  }

  return <AdminClient mode="edit" property={property as Property} />;
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

export default function EditPropertyPage({ params }: PageProps) {
  return (
    <Suspense fallback={<div className="min-h-dvh p-4 max-w-xl mx-auto" />}>
      <EditData paramsPromise={params} />
    </Suspense>
  );
}
