import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, MapPin, LogOut, Map } from "lucide-react";

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

  return (
    <main className="min-h-dvh p-4 max-w-xl mx-auto">
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          <h1 className="text-xl font-semibold">Houses</h1>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <Map className="h-4 w-4" />
            </Button>
          </Link>
          <form action="/auth/signout" method="post">
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </header>

      <div className="mt-2 space-y-3">
        {properties?.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No properties yet.
          </p>
        )}

        {properties?.map((p: Property) => (
          <Link key={p.id} href={`/properties/${p.id}`}>
            <Card className="p-4 transition-all active:scale-[0.99] hover:border-foreground/30">
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {p.address}
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-6 text-center">
        Admins manage houses via Supabase.
      </p>
    </main>
  );
}

function LoadingState() {
  return (
    <main className="min-h-dvh p-4 max-w-xl mx-auto">
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          <h1 className="text-xl font-semibold">Houses</h1>
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
