import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { HomeClient } from "@/components/home-client";

interface Property {
  id: string;
  name: string;
  address: string;
  location_x: number | null;
  location_y: number | null;
}

async function HomeContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <HomeClient user={null} properties={[]} isAdmin={false} />;
  }

  const [{ data: properties }, { data: profile }] = await Promise.all([
    supabase
      .from("properties")
      .select("id, name, address, location_x, location_y")
      .order("name"),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
  ]);

  const isAdmin = profile?.role === "admin";

  return (
    <HomeClient
      user={user}
      properties={(properties as Property[]) ?? []}
      isAdmin={isAdmin}
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
