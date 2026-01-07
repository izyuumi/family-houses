import { Suspense } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { JapanMap } from "@/components/japan-map";

async function ProtectedContent() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return <JapanMap />;
}

export default function ProtectedPage() {
  return (
    <div className="flex-1 w-full h-full">
      <Suspense fallback={<div className="flex-1 w-full h-full" />}>
        <ProtectedContent />
      </Suspense>
    </div>
  );
}
