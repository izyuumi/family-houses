import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PropertyClient } from "@/components/property-client";
import { Card } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface Property {
  id: string;
  name: string;
  address: string;
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
      .select("id, name, address, wifi_ssid, guest_wifi_ssid")
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
    <>
      <header className="py-2">
        <div className="h-8 w-16 bg-muted rounded animate-pulse mb-2" />
        <div className="h-6 bg-muted rounded w-1/3 animate-pulse" />
        <div className="h-4 bg-muted rounded w-2/3 mt-2 animate-pulse" />
      </header>
      <div className="mt-4 space-y-6">
        {[1, 2].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-5 bg-muted rounded w-1/4 mb-4" />
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

export default function PropertyDetail({ params }: PageProps) {
  return (
    <main className="min-h-dvh p-4 max-w-xl mx-auto pb-20">
      <Suspense fallback={<LoadingState />}>
        <PropertyData paramsPromise={params} />
      </Suspense>
    </main>
  );
}
