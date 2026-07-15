import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getConvexClient } from "@/lib/convex";

export type MobileAuthContext = {
  convex: ReturnType<typeof getConvexClient>;
  user: {
    clerkId: string;
    displayName: string | null;
    role: string;
  };
};

export function parseBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!authHeader) return null;

  const match = authHeader.match(/^bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  if (!token) return null;

  return token;
}

export async function getMobileAuthContext(request: Request): Promise<MobileAuthContext | null> {
  const token = parseBearerToken(request);
  if (!token) return null;

  const convex = getConvexClient();
  convex.setAuth(token);

  try {
    const profile = await convex.query(api.profiles.current);
    if (!profile) return null;

    return {
      convex,
      user: {
        clerkId: profile.clerkId,
        displayName: profile.displayName ?? null,
        role: profile.role,
      },
    };
  } catch {
    return null;
  }
}

export function toPropertyId(value: string): Id<"properties"> {
  return value as Id<"properties">;
}

export function toGroceryId(value: string): Id<"groceryItems"> {
  return value as Id<"groceryItems">;
}

export function toPropertyItemId(value: string): Id<"propertyItems"> {
  return value as Id<"propertyItems">;
}

export function toPropertyNoteId(value: string): Id<"propertyNotes"> {
  return value as Id<"propertyNotes">;
}
