import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppleSignInButton } from "@/components/apple-sign-in-button";
import { Home } from "lucide-react";

async function AuthCheck() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/properties");

  return null;
}

function LoginContent() {
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

export default function HomePage() {
  return (
    <>
      <Suspense fallback={null}>
        <AuthCheck />
      </Suspense>
      <LoginContent />
    </>
  );
}
