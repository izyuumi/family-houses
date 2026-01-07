import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminForm } from "@/components/admin-form";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

async function AdminContent() {
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

  return (
    <main className="min-h-dvh p-4 max-w-xl mx-auto pb-20">
      <header className="py-2">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-2 -ml-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Map
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Add Property</h1>
        <p className="text-sm text-muted-foreground">
          Create a new house entry
        </p>
      </header>

      <AdminForm />
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh p-4 max-w-xl mx-auto" />}>
      <AdminContent />
    </Suspense>
  );
}
