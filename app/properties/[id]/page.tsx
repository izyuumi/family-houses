import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { InfoCard } from "@/components/info-card";
import { Groceries } from "@/components/groceries";
import { Deliveries } from "@/components/deliveries";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PageProps {
  params: { id?: string | string[] };
}

function resolvePropertyId(params: { id?: string | string[] }) {
  if (!params.id) return null;
  if (Array.isArray(params.id)) return params.id[0] ?? null;
  return params.id;
}

async function PropertyData({ params }: { params: { id?: string | string[] } }) {
  const id = resolvePropertyId(params);
  if (!id || id === "undefined") {
    redirect("/properties");
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: property, error } = await supabase
    .from("properties")
    .select("id, name, address, notes, wifi_ssid")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!property) {
    redirect("/properties");
  }

  return (
    <main className="min-h-dvh p-4 max-w-xl mx-auto pb-20">
      <header className="py-2">
        <Link href="/properties">
          <Button variant="ghost" size="sm" className="mb-2 -ml-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">{property.name}</h1>
        <p className="text-sm text-muted-foreground">{property.address}</p>
      </header>

      <div className="mt-4 space-y-6">
        <InfoCard property={property} />
        <Groceries propertyId={property.id} />
        <Deliveries propertyId={property.id} />
      </div>
    </main>
  );
}

function LoadingState() {
  return (
    <main className="min-h-dvh p-4 max-w-xl mx-auto pb-20">
      <header className="py-2">
        <Button variant="ghost" size="sm" className="mb-2 -ml-2">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="h-6 bg-muted rounded w-1/3 animate-pulse" />
        <div className="h-4 bg-muted rounded w-2/3 mt-2 animate-pulse" />
      </header>
      <div className="mt-4 space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-5 bg-muted rounded w-1/4 mb-4" />
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}

export default function PropertyDetail({ params }: PageProps) {
  return (
    <Suspense fallback={<LoadingState />}>
      <PropertyData params={params} />
    </Suspense>
  );
}
