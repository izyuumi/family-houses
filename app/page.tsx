import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { HomeClient } from "@/components/home-client";

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
  location_x: number | null;
  location_y: number | null;
}

async function HomeContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <HomeClient user={null} properties={[]} />;
  }

  const { data: properties } = await supabase
    .from("properties")
    .select("id, slug, name, postal_code, prefecture, city_ward_town, area, chome, block, building, room, location_x, location_y")
    .order("name");

  return (
    <HomeClient
      user={user}
      properties={(properties as Property[]) ?? []}
    />
  );
}

function LoadingState() {
  return (
    <div className="h-dvh flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">...</div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <HomeContent />
    </Suspense>
  );
}
