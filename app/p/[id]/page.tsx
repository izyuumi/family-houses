import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PropertyClient } from "@/components/property-client";

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
  guest_wifi_ssid: string | null;
}

interface GroceryItem {
  id: string;
  property_id: string;
  item_name: string;
  quantity: string | null;
  checked: boolean | null;
  added_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

async function PropertyContent({ slugOrId }: { slugOrId: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const selectFields = "id, slug, name, postal_code, prefecture, city_ward_town, area, chome, block, building, room, wifi_ssid, guest_wifi_ssid";
  
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

  const property = propertyResult.data as Property | null;
  const propertyId = property?.id;

  const [profileResult, groceriesResult] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    propertyId 
      ? supabase
          .from("grocery_items")
          .select("*")
          .eq("property_id", propertyId)
          .order("checked", { ascending: true })
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (propertyResult.error) {
    throw new Error(propertyResult.error.message);
  }

  const isAdmin = profileResult.data?.role === "admin";
  const groceries = (groceriesResult.data as GroceryItem[]) ?? [];

  if (!property) {
    redirect("/");
  }

  return <PropertyClient property={property} isAdmin={isAdmin} initialGroceries={groceries} />;
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
