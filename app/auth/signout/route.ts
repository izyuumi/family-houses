import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const origin = new URL(req.url).origin;
  return NextResponse.redirect(origin, { status: 302 });
}
