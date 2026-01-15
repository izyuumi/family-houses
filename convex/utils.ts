import { QueryCtx } from "./_generated/server";

export type ProfileInfo = { displayName?: string; email?: string };

export async function getProfileMap(
  ctx: QueryCtx,
  clerkIds: string[]
): Promise<Map<string, ProfileInfo>> {
  const profiles = await Promise.all(
    clerkIds.map((id) =>
      ctx.db
        .query("profiles")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", id))
        .first()
    )
  );

  return new Map(
    profiles
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .map((p) => [p.clerkId, { displayName: p.displayName, email: p.email }])
  );
}

export async function enrichWithCreator<T extends { createdBy?: string }>(
  ctx: QueryCtx,
  items: T[]
): Promise<Array<T & { creator: ProfileInfo | null }>> {
  const clerkIds = [
    ...new Set(
      items
        .map((item) => item.createdBy)
        .filter((id): id is string => id !== undefined)
    ),
  ];

  const profileMap = await getProfileMap(ctx, clerkIds);

  return items.map((item) => ({
    ...item,
    creator: item.createdBy ? profileMap.get(item.createdBy) ?? null : null,
  }));
}

export function extractClerkIds(
  items: Array<Record<string, unknown>>,
  ...fields: string[]
): string[] {
  return [
    ...new Set(
      items.flatMap((item) =>
        fields
          .map((field) => item[field])
          .filter((id): id is string => typeof id === "string")
      )
    ),
  ];
}
