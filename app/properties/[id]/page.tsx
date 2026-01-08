import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PropertyClient } from "@/components/property-client";

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
  guest_wifi_ssid: string | null;
}

async function PropertyContent({ propertyId }: { propertyId: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const [propertyResult, profileResult] = await Promise.all([
    supabase
      .from("properties")
      .select("id, name, address, postal_code, prefecture, city_ward_town, area, chome, block, building, room, wifi_ssid, guest_wifi_ssid")
      .eq("id", propertyId)
      .maybeSingle(),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
  ]);

  if (propertyResult.error) {
    throw new Error(propertyResult.error.message);
  }

  const property = propertyResult.data as Property | null;
  const isAdmin = profileResult.data?.role === "admin";

  if (!property) {
    redirect("/properties");
  }

  return <PropertyClient property={property} isAdmin={isAdmin} />;
}

async function PropertyData({
  paramsPromise,
}: {
  paramsPromise: Promise<{ id: string }>;
}) {
  const { id } = await paramsPromise;
  if (!id || id === "undefined") {
    redirect("/properties");
  }
  return <PropertyContent propertyId={id} />;
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
