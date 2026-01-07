import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MapDashboard } from "@/components/map-dashboard";

interface Property {
  id: string;
  name: string;
  address: string;
  prefecture_id: string | null;
}

async function ProtectedContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: properties } = await supabase
    .from("properties")
    .select("id, name, address, prefecture_id")
    .order("name");

  return <MapDashboard properties={(properties as Property[]) ?? []} />;
}

function LoadingState() {
  return (
    <div className="flex-1 w-full h-full flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading map...</div>
    </div>
  );
}

export default function ProtectedPage() {
  return (
    <div className="flex-1 w-full h-full">
      <Suspense fallback={<LoadingState />}>
        <ProtectedContent />
      </Suspense>
    </div>
  );
}
