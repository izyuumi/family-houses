import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { getCurrentUser, requireAdmin } from "./profiles";
import { isUserAdmin } from "./permissions";
import type { QueryCtx } from "./_generated/server";

const SWITCHBOT = "switchbot";

async function getSwitchbotRow(ctx: QueryCtx) {
  return await ctx.db
    .query("integrationSettings")
    .withIndex("by_name", (q) => q.eq("name", SWITCHBOT))
    .first();
}

export const switchbotStatus = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!isUserAdmin(user)) return null;

    const row = await getSwitchbotRow(ctx);
    const legacyToken = row?.token || process.env.SWITCHBOT_TOKEN;
    const legacySecret = row?.secret || process.env.SWITCHBOT_SECRET;
    const webhookToken = row?.webhookToken || process.env.SWITCHBOT_WEBHOOK_TOKEN;
    const accounts = await ctx.db.query("switchbotAccounts").collect();

    // Write-only secrets: expose set/unset booleans, never any part of a value.
    return {
      configured: accounts.length > 0 || Boolean(legacyToken && legacySecret),
      legacyCredentialsSet: Boolean(legacyToken && legacySecret),
      webhookTokenSet: Boolean(webhookToken),
    };
  },
});

export const listSwitchbotAccounts = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!isUserAdmin(user)) return null;

    const accounts = await ctx.db.query("switchbotAccounts").collect();
    // Labels only — tokens and secrets never leave the server.
    return accounts.map((account) => ({ _id: account._id, label: account.label }));
  },
});

export const addSwitchbotAccount = mutation({
  args: {
    label: v.string(),
    token: v.string(),
    secret: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const label = args.label.trim();
    const token = args.token.trim();
    const secret = args.secret.trim();
    if (!label) throw new Error("A label is required");
    if (!token || !secret) throw new Error("Token and secret are required");
    return await ctx.db.insert("switchbotAccounts", { label, token, secret });
  },
});

export const updateSwitchbotAccount = mutation({
  args: {
    accountId: v.id("switchbotAccounts"),
    label: v.optional(v.string()),
    token: v.optional(v.string()),
    secret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const account = await ctx.db.get(args.accountId);
    if (!account) throw new Error("Account not found");

    // An absent or empty field is left unchanged.
    const updates: { label?: string; token?: string; secret?: string } = {};
    if (args.label?.trim()) updates.label = args.label.trim();
    if (args.token?.trim()) updates.token = args.token.trim();
    if (args.secret?.trim()) updates.secret = args.secret.trim();
    await ctx.db.patch(args.accountId, updates);
  },
});

export const removeSwitchbotAccount = mutation({
  args: { accountId: v.id("switchbotAccounts") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const devices = await ctx.db.query("switchbotDevices").collect();
    if (devices.some((device) => device.accountId === args.accountId)) {
      throw new Error("Unbind this account's devices before removing it");
    }
    await ctx.db.delete(args.accountId);
  },
});

export const setSwitchbotCredentials = mutation({
  args: {
    token: v.optional(v.string()),
    secret: v.optional(v.string()),
    webhookToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // An absent field is left unchanged; an empty string clears it.
    const updates: {
      token?: string | undefined;
      secret?: string | undefined;
      webhookToken?: string | undefined;
    } = {};
    if (args.token !== undefined) updates.token = args.token.trim() || undefined;
    if (args.secret !== undefined) updates.secret = args.secret.trim() || undefined;
    if (args.webhookToken !== undefined) {
      updates.webhookToken = args.webhookToken.trim() || undefined;
    }

    const row = await getSwitchbotRow(ctx);
    if (row) {
      await ctx.db.patch(row._id, updates);
    } else {
      await ctx.db.insert("integrationSettings", { name: SWITCHBOT, ...updates });
    }
  },
});

export const getSwitchbotCredentials = internalQuery({
  args: {},
  handler: async (ctx) => {
    const row = await getSwitchbotRow(ctx);
    return {
      token: row?.token || process.env.SWITCHBOT_TOKEN,
      secret: row?.secret || process.env.SWITCHBOT_SECRET,
      webhookToken: row?.webhookToken || process.env.SWITCHBOT_WEBHOOK_TOKEN,
    };
  },
});

// Resolves the credentials for a device's account; without an accountId this
// falls back to the legacy single-credential row, then env vars.
export const getCredentialsForAccount = internalQuery({
  args: { accountId: v.optional(v.id("switchbotAccounts")) },
  handler: async (ctx, args) => {
    if (args.accountId) {
      const account = await ctx.db.get(args.accountId);
      if (account) return { token: account.token, secret: account.secret };
    }
    const row = await getSwitchbotRow(ctx);
    return {
      token: row?.token || process.env.SWITCHBOT_TOKEN,
      secret: row?.secret || process.env.SWITCHBOT_SECRET,
    };
  },
});
