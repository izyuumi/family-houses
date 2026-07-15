"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

function convexSiteUrl(): string | null {
  const cloudUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!cloudUrl) return null;
  return cloudUrl.replace(".convex.cloud", ".convex.site");
}

export function SwitchbotSettingsCard() {
  const { t } = useI18n();
  const status = useQuery(api.integrationSettings.switchbotStatus);
  const saveCredentials = useMutation(api.integrationSettings.setSwitchbotCredentials);

  const [token, setToken] = useState("");
  const [secret, setSecret] = useState("");
  const [webhookToken, setWebhookToken] = useState("");
  const [saving, setSaving] = useState(false);

  if (status === null) return null;

  const generateWebhookToken = () => {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    setWebhookToken(
      Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
    );
  };

  // Only ever built from the value the admin just typed or generated in this
  // session — stored webhook tokens are write-only and never sent back.
  const siteUrl = convexSiteUrl();
  const webhookUrl = siteUrl
    ? `${siteUrl}/switchbot-webhook?token=${webhookToken || "…"}`
    : null;

  const copyWebhookUrl = async () => {
    if (!webhookUrl || !webhookToken) return;
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast.success(t.locks.copied);
    } catch {
      toast.error(t.toast.copyFailed);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveCredentials({
        ...(token.trim() ? { token: token.trim() } : {}),
        ...(secret.trim() ? { secret: secret.trim() } : {}),
        ...(webhookToken.trim() ? { webhookToken: webhookToken.trim() } : {}),
      });
      setToken("");
      setSecret("");
      toast.success(t.switchbotSettings.saved);
    } catch {
      toast.error(t.common.errorGeneric);
    } finally {
      setSaving(false);
    }
  };

  const nothingToSave = !token.trim() && !secret.trim() && !webhookToken.trim();
  const savedPlaceholder = `•••••••• (${t.switchbotSettings.savedPlaceholder})`;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-card dark:shadow-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[15px] font-bold">
          <Lock className="h-[17px] w-[17px] text-primary" />
          {t.switchbotSettings.title}
        </div>
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full px-[9px] py-0.5 text-[11px] font-semibold",
            status?.configured
              ? "bg-secondary text-secondary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              status?.configured ? "bg-primary" : "bg-muted-foreground/50"
            )}
          />
          {status?.configured
            ? t.switchbotSettings.connected
            : t.switchbotSettings.notConfigured}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        {t.switchbotSettings.hint}
      </p>

      <div className="flex flex-col gap-3">
        <div>
          <Label htmlFor="switchbot-token" className="text-xs font-semibold">
            {t.switchbotSettings.token}
          </Label>
          <Input
            id="switchbot-token"
            type="password"
            autoComplete="off"
            className="mt-1"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={status?.tokenSet ? savedPlaceholder : ""}
          />
        </div>
        <div>
          <Label htmlFor="switchbot-secret" className="text-xs font-semibold">
            {t.switchbotSettings.secret}
          </Label>
          <Input
            id="switchbot-secret"
            type="password"
            autoComplete="off"
            className="mt-1"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder={status?.secretSet ? savedPlaceholder : ""}
          />
        </div>
        <div>
          <Label htmlFor="switchbot-webhook-token" className="text-xs font-semibold">
            {t.switchbotSettings.webhookToken}
          </Label>
          <div className="mt-1 flex gap-2">
            <Input
              id="switchbot-webhook-token"
              type="password"
              autoComplete="off"
              value={webhookToken}
              onChange={(e) => setWebhookToken(e.target.value)}
              placeholder={status?.webhookTokenSet ? savedPlaceholder : ""}
            />
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={generateWebhookToken}
            >
              {t.locks.generate}
            </Button>
          </div>
          {webhookUrl && (
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-muted px-2 py-1.5 text-[11px] text-muted-foreground">
                {webhookUrl}
              </code>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-lg"
                disabled={!webhookToken}
                onClick={() => void copyWebhookUrl()}
                aria-label={t.a11y.copy}
              >
                <Copy className="h-[15px] w-[15px]" />
              </Button>
            </div>
          )}
          <p className="mt-1 text-[11px] text-muted-foreground">
            {t.switchbotSettings.webhookHint}
          </p>
        </div>
      </div>

      <Button
        type="button"
        className="self-end rounded-xl"
        disabled={nothingToSave || saving}
        onClick={() => void handleSave()}
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          t.common.save
        )}
      </Button>
    </div>
  );
}
