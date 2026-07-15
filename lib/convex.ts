import { ConvexHttpClient } from "convex/browser";
import { auth } from "@clerk/nextjs/server";

function getConvexUrl() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
  }
  return convexUrl;
}

export function getConvexClient() {
  return new ConvexHttpClient(getConvexUrl());
}

export async function getAuthenticatedConvexClient() {
  const convex = new ConvexHttpClient(getConvexUrl());
  const { getToken } = await auth();
  const token = await getToken({ template: "convex" });
  if (token) {
    convex.setAuth(token);
  }
  return convex;
}
