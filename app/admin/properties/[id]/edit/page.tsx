import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminForm } from "@/components/admin-form";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function EditContent({ propertyId }: { propertyId: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  const { data: property, error } = await supabase
    .from("properties")
    .select("id, name, address, notes, wifi_ssid, location_x, location_y")
    .eq("id", propertyId)
    .maybeSingle();

  if (error || !property) {
    redirect("/properties");
  }

  return (
    <main className="min-h-dvh p-4 max-w-xl mx-auto pb-20">
      <header className="py-2">
        <Link href={`/properties/${property.id}`}>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Property
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Edit Property</h1>
        <p className="text-sm text-muted-foreground">
          Update {property.name}
        </p>
      </header>

      <AdminForm property={property} />
    </main>
  );
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
