import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PropertiesClient } from "@/components/properties-client";
import { Card } from "@/components/ui/card";
import { Home } from "lucide-react";

interface Property {
  id: string;
  name: string;
  address: string;
}

async function PropertiesContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, name, address")
    .order("name");

  if (error) throw new Error(error.message);

  return <PropertiesClient properties={(properties as Property[]) ?? []} />;
}

function LoadingState() {
  return (
    <main className="min-h-dvh p-4 max-w-xl mx-auto">
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          <div className="h-6 bg-muted rounded w-24 animate-pulse" />
        </div>
      </header>
      <div className="mt-2 space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-5 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-2/3 mt-2" />
          </Card>
        ))}
      </div>
    </main>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <PropertiesContent />
    </Suspense>
  );
}
