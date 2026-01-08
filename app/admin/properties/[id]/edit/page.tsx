import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminClient } from "@/components/admin-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface Property {
  id: string;
  name: string;
  address: string;
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

async function EditContent({ propertyId }: { propertyId: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const [{ data: profile }, { data: property, error }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase
      .from("properties")
      .select("id, name, address, postal_code, prefecture, city_ward_town, area, chome, block, building, room, wifi_ssid, wifi_password, guest_wifi_ssid, guest_wifi_password, location_x, location_y")
      .eq("id", propertyId)
      .maybeSingle(),
  ]);

  if (profile?.role !== "admin") {
    redirect("/");
  }

  if (error || !property) {
    redirect("/properties");
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
    redirect("/properties");
  }
  return <EditContent propertyId={id} />;
}

export default function EditPropertyPage({ params }: PageProps) {
  return (
    <Suspense fallback={<div className="min-h-dvh p-4 max-w-xl mx-auto" />}>
      <EditData paramsPromise={params} />
    </Suspense>
  );
}
