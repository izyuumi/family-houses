"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Copy, Check, Info, Wifi, Lock, Loader2, KeyRound } from "lucide-react";
import { WifiQRCodeLazy } from "@/components/wifi-qrcode-lazy";
import { AddressDisplay } from "@/components/address-display";
import { formatMailboxLockForDisplayLocalized } from "@/components/mailbox-lock-input";
import { formatAutoLockForDisplay, getAutoLockType } from "@/components/auto-lock-input";

interface Property {
  id: string;
  name: string;
  postal_code?: string | null;
  prefecture?: string | null;
  city_ward_town?: string | null;
  area?: string | null;
  chome?: string | null;
  block?: string | null;
  building?: string | null;
  room?: string | null;
  apple_maps_url?: string | null;
  wifi_ssid: string | null;
  guest_wifi_ssid: string | null;
  has_mailbox_lock: boolean;
  has_auto_lock: boolean;
}

interface InfoCardProps {
  property: Property;
}

export function InfoCard({ property }: InfoCardProps) {
  const { t } = useI18n();
  const [wifiPassword, setWifiPassword] = useState<string | null>(null);
  const [guestWifiPassword, setGuestWifiPassword] = useState<string | null>(null);
  const [loadingWifi, setLoadingWifi] = useState(false);
  const [loadingGuestWifi, setLoadingGuestWifi] = useState(false);
  const [loadingMailboxLock, setLoadingMailboxLock] = useState(false);
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [copiedGuestWifi, setCopiedGuestWifi] = useState(false);
  const [copiedMailboxLock, setCopiedMailboxLock] = useState(false);
  const [mailboxLockCombination, setMailboxLockCombination] = useState<string | null>(null);
  const [loadingAutoLock, setLoadingAutoLock] = useState(false);
  const [copiedAutoLock, setCopiedAutoLock] = useState(false);
  const [autoLockCode, setAutoLockCode] = useState<string | null>(null);

  const revealAndCopyWifi = async (type: "main" | "guest") => {
    if (type === "main") {
      setLoadingWifi(true);
    } else {
      setLoadingGuestWifi(true);
    }

    const res = await fetch("/api/wifi/reveal", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ propertyId: property.id, type }),
    });
    const json = await res.json();

    if (type === "main") {
      setLoadingWifi(false);
      if (json.password !== undefined) {
        setWifiPassword(json.password);
        if (json.password) {
          await copyToClipboard(json.password, "main");
        }
      }
    } else {
      setLoadingGuestWifi(false);
      if (json.password !== undefined) {
        setGuestWifiPassword(json.password);
        if (json.password) {
          await copyToClipboard(json.password, "guest");
        }
      }
    }
  };

  const copyToClipboard = async (password: string, type: "main" | "guest") => {
    try {
      await navigator.clipboard.writeText(password);
      if (type === "main") {
        setCopiedWifi(true);
        setTimeout(() => setCopiedWifi(false), 2000);
      } else {
        setCopiedGuestWifi(true);
        setTimeout(() => setCopiedGuestWifi(false), 2000);
      }
      toast.success(t.toast.passwordCopied);
    } catch {
      toast.error(t.toast.copyFailed);
    }
  };

  const revealAndCopyMailboxLock = async () => {
    setLoadingMailboxLock(true);

    const res = await fetch("/api/lock/reveal", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ propertyId: property.id }),
    });
    const json = await res.json();

    setLoadingMailboxLock(false);
    if (json.combination !== undefined) {
      setMailboxLockCombination(json.combination);
      if (json.combination) {
        await copyCombinationToClipboard(json.combination);
      }
    }
  };

  const copyCombinationToClipboard = async (combination: string) => {
    try {
      const formatted = formatMailboxLockForDisplayLocalized(
        combination,
        t.form.mailboxLockRight,
        t.form.mailboxLockLeft
      );
      await navigator.clipboard.writeText(formatted || combination);
      setCopiedMailboxLock(true);
      setTimeout(() => setCopiedMailboxLock(false), 2000);
      toast.success(t.toast.combinationCopied);
    } catch {
      toast.error(t.toast.copyFailed);
    }
  };

  const revealAndCopyAutoLock = async () => {
    setLoadingAutoLock(true);

    const res = await fetch("/api/autolock/reveal", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ propertyId: property.id }),
    });
    const json = await res.json();

    setLoadingAutoLock(false);
    if (json.code !== undefined) {
      setAutoLockCode(json.code);
      if (json.code) {
        await copyAutoLockToClipboard(json.code);
      }
    }
  };

  const copyAutoLockToClipboard = async (code: string) => {
    try {
      const formatted = formatAutoLockForDisplay(code);
      await navigator.clipboard.writeText(formatted || code);
      setCopiedAutoLock(true);
      setTimeout(() => setCopiedAutoLock(false), 2000);
      toast.success(t.toast.autoLockCopied);
    } catch {
      toast.error(t.toast.copyFailed);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Info className="h-4 w-4" />
          {t.info.propertyInfo}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <AddressDisplay
          address={{
            postal_code: property.postal_code ?? null,
            prefecture: property.prefecture ?? null,
            city_ward_town: property.city_ward_town ?? null,
            area: property.area ?? null,
            chome: property.chome ?? null,
            block: property.block ?? null,
            building: property.building ?? null,
            room: property.room ?? null,
          }}
          appleMapsUrl={property.apple_maps_url}
        />

        {(property.wifi_ssid || property.guest_wifi_ssid) && (
          <div className="pt-3 border-t space-y-4">
            {property.wifi_ssid && (
              <div className="flex items-start gap-2">
                <Wifi className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <div className="text-muted-foreground text-xs">{t.info.wifi}</div>
                  <div className="text-sm">
                    <span className="font-medium">{t.info.ssid}:</span>{" "}
                    {property.wifi_ssid}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">{t.info.password}:</span>{" "}
                    {wifiPassword === null ? "••••••••" : wifiPassword || "—"}
                  </div>
                </div>
                <div className="flex gap-2">
                  {wifiPassword === null ? (
                    <Button
                      variant="default"
                      size="sm"
                      disabled={loadingWifi}
                      onClick={() => revealAndCopyWifi("main")}
                    >
                      {loadingWifi ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          <Copy className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!wifiPassword}
                      onClick={() => wifiPassword && copyToClipboard(wifiPassword, "main")}
                    >
                      {copiedWifi ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <WifiQRCodeLazy
                    ssid={property.wifi_ssid}
                    password={wifiPassword}
                    propertyId={property.id}
                    type="main"
                    onPasswordRevealed={setWifiPassword}
                  />
                </div>
              </div>
            )}

            {property.guest_wifi_ssid && (
              <div className="flex items-start gap-2">
                <Wifi className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <div className="text-muted-foreground text-xs">{t.info.guestWifi}</div>
                  <div className="text-sm">
                    <span className="font-medium">{t.info.ssid}:</span>{" "}
                    {property.guest_wifi_ssid}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">{t.info.password}:</span>{" "}
                    {guestWifiPassword === null ? "••••••••" : guestWifiPassword || "—"}
                  </div>
                </div>
                <div className="flex gap-2">
                  {guestWifiPassword === null ? (
                    <Button
                      variant="default"
                      size="sm"
                      disabled={loadingGuestWifi}
                      onClick={() => revealAndCopyWifi("guest")}
                    >
                      {loadingGuestWifi ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          <Copy className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!guestWifiPassword}
                      onClick={() => guestWifiPassword && copyToClipboard(guestWifiPassword, "guest")}
                    >
                      {copiedGuestWifi ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <WifiQRCodeLazy
                    ssid={property.guest_wifi_ssid}
                    password={guestWifiPassword}
                    propertyId={property.id}
                    type="guest"
                    onPasswordRevealed={setGuestWifiPassword}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {property.has_mailbox_lock && (
          <div className="pt-3 border-t">
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <div className="text-muted-foreground text-xs">{t.info.mailboxLock}</div>
                <div className="text-sm">
                  <span className="font-medium">{t.info.combination}:</span>{" "}
                  {mailboxLockCombination === null
                    ? "••••••••"
                    : formatMailboxLockForDisplayLocalized(
                        mailboxLockCombination,
                        t.form.mailboxLockRight,
                        t.form.mailboxLockLeft
                      ) || "—"}
                </div>
              </div>
              <div className="flex gap-2">
                {mailboxLockCombination === null ? (
                  <Button
                    variant="default"
                    size="sm"
                    disabled={loadingMailboxLock}
                    onClick={revealAndCopyMailboxLock}
                  >
                    {loadingMailboxLock ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        <Copy className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!mailboxLockCombination}
                    onClick={() => mailboxLockCombination && copyCombinationToClipboard(mailboxLockCombination)}
                  >
                    {copiedMailboxLock ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {property.has_auto_lock && (
          <div className="pt-3 border-t">
            <div className="flex items-start gap-2">
              <KeyRound className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <div className="text-muted-foreground text-xs">{t.info.autoLock}</div>
                <div className="text-sm">
                  <span className="font-medium">
                    {autoLockCode === null
                      ? t.info.code
                      : getAutoLockType(autoLockCode) === "switchbot"
                        ? t.info.autoLockSwitchbot
                        : t.info.code}
                    :
                  </span>{" "}
                  {autoLockCode === null
                    ? "••••••••"
                    : formatAutoLockForDisplay(autoLockCode) || "—"}
                </div>
              </div>
              <div className="flex gap-2">
                {autoLockCode === null ? (
                  <Button
                    variant="default"
                    size="sm"
                    disabled={loadingAutoLock}
                    onClick={revealAndCopyAutoLock}
                  >
                    {loadingAutoLock ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        <Copy className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!autoLockCode}
                    onClick={() => autoLockCode && copyAutoLockToClipboard(autoLockCode)}
                  >
                    {copiedAutoLock ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
