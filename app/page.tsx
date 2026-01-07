import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { AppleSignInButton } from "@/components/apple-sign-in-button";
import { MapDashboard } from "@/components/map-dashboard";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { Home, List, LogOut, Plus } from "lucide-react";
import Link from "next/link";

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
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-12">
          <div className="flex flex-col items-center gap-3">
            <Home className="h-12 w-12" />
            <h1 className="text-4xl font-semibold tracking-tight">
              Family Houses
            </h1>
            <p className="text-muted-foreground text-center">
              Manage properties, groceries & deliveries
            </p>
          </div>
          <AppleSignInButton />
        </div>
      </main>
    );
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
    <main className="h-dvh flex flex-col">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-14 shrink-0">
        <div className="w-full max-w-5xl flex justify-between items-center px-4 text-sm">
          <span className="font-semibold">Family Houses</span>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </Link>
            )}
            <Link href="/properties">
              <Button variant="ghost" size="sm">
                <List className="h-4 w-4 mr-1" />
                List
              </Button>
            </Link>
            <ThemeSwitcher />
            <form action="/auth/signout" method="post">
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </nav>
      <div className="flex-1 overflow-hidden">
        <MapDashboard properties={(properties as Property[]) ?? []} />
      </div>
    </main>
  );
}

function LoadingState() {
  return (
    <div className="h-dvh flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
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
