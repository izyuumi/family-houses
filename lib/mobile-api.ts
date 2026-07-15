import { NextResponse } from "next/server";

export type JsonObject = Record<string, unknown>;

export function mobileError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function parseJsonObject(request: Request): Promise<JsonObject | null> {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return null;
    }
    return body as JsonObject;
  } catch {
    return null;
  }
}

export function requiredString(body: JsonObject, key: string) {
  const value = body[key];
  return typeof value === "string" ? value.trim() : "";
}

export function optionalString(body: JsonObject, key: string) {
  const value = body[key];
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  return trimmed || undefined;
}

export async function runMobileMutation(action: () => Promise<unknown>) {
  try {
    await action();
    return NextResponse.json({ ok: true });
  } catch {
    return mobileError("request failed", 400);
  }
}
