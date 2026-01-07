import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { JapanMap } from "@/components/japan-map";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return (
    <div className="flex-1 w-full h-full">
      <JapanMap />
    </div>
  );
}
