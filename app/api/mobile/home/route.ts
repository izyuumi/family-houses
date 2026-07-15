import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { getMobileAuthContext } from "@/lib/mobile-auth";
import { mobileError } from "@/lib/mobile-api";

export async function GET(request: Request) {
  const authContext = await getMobileAuthContext(request);

  if (!authContext) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let data;
  try {
    data = await authContext.convex.query(api.properties.homeData);
  } catch {
    return mobileError("request failed", 500);
  }

  return NextResponse.json({
    properties: data.properties.map((property) => ({
      id: property._id,
      slug: property.slug ?? null,
      name: property.name,
      cityWardTown: property.cityWardTown ?? null,
      prefecture: property.prefecture ?? null,
    })),
  });
}
