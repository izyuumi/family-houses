"use client";

import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Lock, Plus, Trash2, Webhook } from "lucide-react";
import { cn } from "@/lib/utils";

export function SwitchbotSettingsCard() {
  const { t } = useI18n();
  const status = useQuery(api.integrationSettings.switchbotStatus);
  const accounts = useQuery(api.integrationSettings.listSwitchbotAccounts);
  const addAccount = useMutation(api.integrationSettings.addSwitchbotAccount);
  const removeAccount = useMutation(api.integrationSettings.removeSwitchbotAccount);
  const saveCredentials = useMutation(api.integrationSettings.setSwitchbotCredentials);
  const registerWebhook = useAction(api.switchbot.registerWebhook);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newToken, setNewToken] = useState("");
  const [newSecret, setNewSecret] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<Id<"switchbotAccounts"> | null>(null);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [webhookToken, setWebhookToken] = useState("");
  const [savingWebhookToken, setSavingWebhookToken] = useState(false);

  if (status === null) return null;

  const errorMessage = (error: unknown) =>
    error instanceof Error && error.message ? error.message : t.common.errorGeneric;

  const handleAddAccount = async () => {
    setAdding(true);
    try {
      await addAccount({
        label: newLabel.trim(),
        token: newToken.trim(),
        secret: newSecret.trim(),
      });
      setNewLabel("");
      setNewToken("");
      setNewSecret("");
      setShowAddForm(false);
      toast.success(t.switchbotSettings.accountAdded);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveAccount = async () => {
    if (!removingId) return;
    try {
      await removeAccount({ accountId: removingId });
      toast.success(t.switchbotSettings.accountRemoved);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setRemovingId(null);
    }
  };

  const handleRegisterWebhook = async (accountId?: Id<"switchbotAccounts">) => {
    setRegisteringId(accountId ?? "legacy");
    try {
      await registerWebhook(accountId ? { accountId } : {});
      toast.success(t.admin.webhookRegistered);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setRegisteringId(null);
    }
  };

  const generateWebhookToken = () => {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    setWebhookToken(
      Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
    );
  };

  const handleSaveWebhookToken = async () => {
    if (!webhookToken.trim()) return;
    setSavingWebhookToken(true);
    try {
      await saveCredentials({ webhookToken: webhookToken.trim() });
      setWebhookToken("");
      toast.success(t.switchbotSettings.saved);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSavingWebhookToken(false);
    }
  };

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

      <p className="text-xs text-muted-foreground">{t.switchbotSettings.hint}</p>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground">
            {t.switchbotSettings.accounts}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-lg text-xs"
            onClick={() => setShowAddForm((open) => !open)}
          >
            <Plus className="h-3.5 w-3.5" />
            {t.switchbotSettings.addAccount}
          </Button>
        </div>

        {accounts?.length === 0 && !showAddForm && (
          <p className="text-sm text-muted-foreground">
            {t.switchbotSettings.noAccounts}
          </p>
        )}

        {(status?.legacyCredentialsSet || (accounts && accounts.length > 0)) && (
          <div className="divide-y divide-hairline">
            {status?.legacyCredentialsSet && (
              <div className="flex items-center gap-2 py-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-muted-foreground">
                  {t.switchbotSettings.legacyCredentials}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg text-xs"
                  disabled={registeringId === "legacy" || !status?.webhookTokenSet}
                  onClick={() => void handleRegisterWebhook(undefined)}
                >
                  {registeringId === "legacy" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Webhook className="h-3.5 w-3.5" />
                  )}
                  {t.admin.registerWebhook}
                </Button>
              </div>
            )}
            {accounts?.map((account) => (
              <div key={account._id} className="flex items-center gap-2 py-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {account.label}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg text-xs"
                  disabled={registeringId === account._id || !status?.webhookTokenSet}
                  onClick={() => void handleRegisterWebhook(account._id)}
                >
                  {registeringId === account._id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Webhook className="h-3.5 w-3.5" />
                  )}
                  {t.admin.registerWebhook}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                  onClick={() => setRemovingId(account._id)}
                  aria-label={`${t.switchbotSettings.removeAccount}: ${account.label}`}
                >
                  <Trash2 className="h-[15px] w-[15px]" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {showAddForm && (
          <div className="flex flex-col gap-3 rounded-xl border border-hairline bg-nested p-3">
            <div>
              <Label htmlFor="switchbot-account-label" className="text-xs font-semibold">
                {t.switchbotSettings.accountLabel}
              </Label>
              <Input
                id="switchbot-account-label"
                className="mt-1"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder={t.switchbotSettings.accountLabelPlaceholder}
              />
            </div>
            <div>
              <Label htmlFor="switchbot-account-token" className="text-xs font-semibold">
                {t.switchbotSettings.token}
              </Label>
              <Input
                id="switchbot-account-token"
                type="password"
                autoComplete="off"
                className="mt-1"
                value={newToken}
                onChange={(e) => setNewToken(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="switchbot-account-secret" className="text-xs font-semibold">
                {t.switchbotSettings.secret}
              </Label>
              <Input
                id="switchbot-account-secret"
                type="password"
                autoComplete="off"
                className="mt-1"
                value={newSecret}
                onChange={(e) => setNewSecret(e.target.value)}
              />
            </div>
            <Button
              type="button"
              className="self-end rounded-xl"
              disabled={!newLabel.trim() || !newToken.trim() || !newSecret.trim() || adding}
              onClick={() => void handleAddAccount()}
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : t.common.add}
            </Button>
          </div>
        )}
      </div>

      <div className="border-t border-hairline pt-3">
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
          <Button
            type="button"
            className="shrink-0 rounded-xl"
            disabled={!webhookToken.trim() || savingWebhookToken}
            onClick={() => void handleSaveWebhookToken()}
          >
            {savingWebhookToken ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t.common.save
            )}
          </Button>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {t.switchbotSettings.webhookHint}
        </p>
      </div>

      <AlertDialog
        open={Boolean(removingId)}
        onOpenChange={(open) => !open && setRemovingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.switchbotSettings.removeAccountTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.switchbotSettings.removeAccountDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void handleRemoveAccount()}
            >
              {t.switchbotSettings.removeAccount}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
