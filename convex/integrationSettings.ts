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
    const token = row?.token || process.env.SWITCHBOT_TOKEN;
    const secret = row?.secret || process.env.SWITCHBOT_SECRET;
    const webhookToken = row?.webhookToken || process.env.SWITCHBOT_WEBHOOK_TOKEN;

    // Write-only secrets: expose set/unset booleans, never any part of a value.
    return {
      configured: Boolean(token && secret),
      tokenSet: Boolean(token),
      secretSet: Boolean(secret),
      webhookTokenSet: Boolean(webhookToken),
    };
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
