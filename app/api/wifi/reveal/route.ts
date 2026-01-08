import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { propertyId, type = "main" } = await req.json();

  const { data, error } = await supabase
    .from("properties")
    .select("wifi_password, guest_wifi_password")
    .eq("id", propertyId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const password = type === "guest" ? data?.guest_wifi_password : data?.wifi_password;

  return NextResponse.json({ password: password ?? "" });
}
