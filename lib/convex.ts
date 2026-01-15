import { ConvexHttpClient } from "convex/browser";
import { auth } from "@clerk/nextjs/server";

export function getConvexClient() {
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
}

export async function getAuthenticatedConvexClient() {
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  const { getToken } = await auth();
  const token = await getToken({ template: "convex" });
  if (token) {
    convex.setAuth(token);
  }
  return convex;
}
