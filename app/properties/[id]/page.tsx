import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { InfoCard } from "@/components/info-card";
import { Groceries } from "@/components/groceries";
import { ChevronLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ id: string }>;
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

  const property = propertyResult.data;
  const isAdmin = profileResult.data?.role === "admin";

  if (!property) {
    redirect("/properties");
  }

  return (
    <>
      <header className="py-2">
        <div className="flex items-center justify-between">
          <Link href="/properties">
            <Button variant="ghost" size="sm" className="mb-2 -ml-2">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          {isAdmin && (
            <Link href={`/admin/properties/${property.id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </Link>
          )}
        </div>
        <h1 className="text-xl font-semibold">{property.name}</h1>
        <p className="text-sm text-muted-foreground">{property.address}</p>
      </header>

      <div className="mt-4 space-y-6">
        <InfoCard property={property} />
        <Groceries propertyId={property.id} />
      </div>
    </>
  );
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
        <Button variant="ghost" size="sm" className="mb-2 -ml-2">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
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
