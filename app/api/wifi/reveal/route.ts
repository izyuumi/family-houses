import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decryptWifiPassword } from "@/lib/crypto/wifi";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { propertyId } = await req.json();

  const { data, error } = await supabase
    .from("properties")
    .select("wifi_password")
    .eq("id", propertyId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const enc = data?.wifi_password;
  if (!enc) {
    return NextResponse.json({ password: "" });
  }

  try {
    const password = decryptWifiPassword(enc);
    return NextResponse.json({ password });
  } catch {
    return NextResponse.json({ error: "decrypt_failed" }, { status: 400 });
  }
}
