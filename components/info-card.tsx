"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/context";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Check,
  Wifi,
  Lock,
  Loader2,
  KeyRound,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { WifiQRCodeLazy } from "@/components/wifi-qrcode-lazy";
import { buildFullAddress } from "@/components/address-display";
import { formatMailboxLockForDisplayLocalized } from "@/components/mailbox-lock-input";
import { formatAutoLockForDisplay, getAutoLockType } from "@/components/auto-lock-input";
import { cn } from "@/lib/utils";

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

function CredRow({
  icon: Icon,
  label,
  value,
  mono = false,
  wideTracking = false,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  wideTracking?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3.5 px-4 py-3.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-secondary text-primary">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div
          className={cn(
            "truncate text-[15px] font-semibold",
            mono && "font-mono",
            wideTracking && "tracking-[0.15em]"
          )}
        >
          {value}
        </div>
      </div>
      {children}
    </div>
  );
}

function RetryValue({
  label,
  onRetry,
  retryLabel,
}: {
  label: string;
  onRetry: () => void;
  retryLabel: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-normal text-muted-foreground">{label}</span>
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={onRetry}
      >
        {retryLabel}
      </Button>
    </span>
  );
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
  const [copiedMailbox, setCopiedMailbox] = useState(false);
  const [copiedAutoLock, setCopiedAutoLock] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [mailboxLockCombination, setMailboxLockCombination] = useState<string | null>(null);
  const [mailboxLockError, setMailboxLockError] = useState(false);
  const [loadingAutoLock, setLoadingAutoLock] = useState(false);
  const [autoLockCode, setAutoLockCode] = useState<string | null>(null);
  const [autoLockError, setAutoLockError] = useState(false);

  // Auto-reveal mailbox lock and auto-lock codes on mount
  useEffect(() => {
    if (property.has_mailbox_lock && mailboxLockCombination === null && !loadingMailboxLock) {
      revealMailboxLock();
    }
    if (property.has_auto_lock && autoLockCode === null && !loadingAutoLock) {
      revealAutoLock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const revealMailboxLock = async () => {
    setLoadingMailboxLock(true);
    setMailboxLockError(false);
    try {
      const res = await fetch("/api/lock/reveal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ propertyId: property.id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.combination === undefined) throw new Error("Missing combination");
      setMailboxLockCombination(json.combination);
    } catch {
      setMailboxLockError(true);
    } finally {
      setLoadingMailboxLock(false);
    }
  };

  const revealAutoLock = async () => {
    setLoadingAutoLock(true);
    setAutoLockError(false);
    try {
      const res = await fetch("/api/autolock/reveal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ propertyId: property.id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.code === undefined) throw new Error("Missing code");
      setAutoLockCode(json.code);
    } catch {
      setAutoLockError(true);
    } finally {
      setLoadingAutoLock(false);
    }
  };

  const copyText = async (
    text: string,
    message: string,
    setCopied: (v: boolean) => void
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(message);
    } catch {
      toast.error(t.toast.copyFailed);
    }
  };

  const revealAndCopyWifi = async (type: "main" | "guest") => {
    const setLoading = type === "main" ? setLoadingWifi : setLoadingGuestWifi;
    const setPassword = type === "main" ? setWifiPassword : setGuestWifiPassword;
    const setCopied = type === "main" ? setCopiedWifi : setCopiedGuestWifi;
    const existing = type === "main" ? wifiPassword : guestWifiPassword;

    if (existing) {
      await copyText(existing, t.toast.passwordCopied, setCopied);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/wifi/reveal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ propertyId: property.id, type }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.password === undefined) throw new Error("Missing password");
      setPassword(json.password);
      if (json.password) {
        await copyText(json.password, t.toast.passwordCopied, setCopied);
      }
    } catch {
      toast.error(t.common.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const fullAddress = buildFullAddress({
    postal_code: property.postal_code ?? null,
    prefecture: property.prefecture ?? null,
    city_ward_town: property.city_ward_town ?? null,
    area: property.area ?? null,
    chome: property.chome ?? null,
    block: property.block ?? null,
    building: property.building ?? null,
    room: property.room ?? null,
  });

  const mapsQuery = encodeURIComponent(fullAddress);
  const appleMapsUrl =
    property.apple_maps_url || `https://maps.apple.com/?q=${mapsQuery}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  const mailboxDisplay = mailboxLockCombination
    ? formatMailboxLockForDisplayLocalized(
        mailboxLockCombination,
        t.form.mailboxLockRight,
        t.form.mailboxLockLeft
      )
    : "";
  const autoLockIsSwitchbot =
    autoLockCode !== null && getAutoLockType(autoLockCode) === "switchbot";
  const autoLockDisplay = autoLockCode
    ? autoLockIsSwitchbot
      ? t.info.autoLockSwitchbot
      : formatAutoLockForDisplay(autoLockCode)
    : "";

  const hasCredentials =
    property.wifi_ssid ||
    property.guest_wifi_ssid ||
    property.has_mailbox_lock ||
    property.has_auto_lock;

  return (
    <div className="flex flex-col gap-4">
      {hasCredentials && (
        <div className="divide-y divide-hairline overflow-hidden rounded-2xl border bg-card shadow-card dark:shadow-none">
          {property.wifi_ssid && (
            <CredRow icon={Wifi} label={t.info.wifi} value={property.wifi_ssid}>
              <Button
                size="icon"
                className="rounded-xl"
                disabled={loadingWifi}
                onClick={() => revealAndCopyWifi("main")}
                aria-label={t.a11y.revealAndCopyPassword}
              >
                {loadingWifi ? (
                  <Loader2 className="h-[17px] w-[17px] animate-spin" />
                ) : copiedWifi ? (
                  <Check className="h-[17px] w-[17px]" />
                ) : (
                  <Copy className="h-[17px] w-[17px]" />
                )}
              </Button>
              <WifiQRCodeLazy
                ssid={property.wifi_ssid}
                password={wifiPassword}
                propertyId={property.id}
                type="main"
                onPasswordRevealed={setWifiPassword}
              />
            </CredRow>
          )}

          {property.guest_wifi_ssid && (
            <CredRow
              icon={Wifi}
              label={t.info.guestWifi}
              value={property.guest_wifi_ssid}
            >
              <Button
                size="icon"
                className="rounded-xl"
                disabled={loadingGuestWifi}
                onClick={() => revealAndCopyWifi("guest")}
                aria-label={t.a11y.revealAndCopyPassword}
              >
                {loadingGuestWifi ? (
                  <Loader2 className="h-[17px] w-[17px] animate-spin" />
                ) : copiedGuestWifi ? (
                  <Check className="h-[17px] w-[17px]" />
                ) : (
                  <Copy className="h-[17px] w-[17px]" />
                )}
              </Button>
              <WifiQRCodeLazy
                ssid={property.guest_wifi_ssid}
                password={guestWifiPassword}
                propertyId={property.id}
                type="guest"
                onPasswordRevealed={setGuestWifiPassword}
              />
            </CredRow>
          )}

          {property.has_mailbox_lock && (
            <CredRow
              icon={Lock}
              label={t.info.mailboxLock}
              mono
              value={
                loadingMailboxLock ? (
                  <Loader2 className="inline h-4 w-4 animate-spin" />
                ) : mailboxLockError ? (
                  <RetryValue
                    label={t.info.loadFailed}
                    onRetry={revealMailboxLock}
                    retryLabel={t.common.retry}
                  />
                ) : (
                  mailboxDisplay || "—"
                )
              }
            >
              {mailboxDisplay && (
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl"
                  onClick={() =>
                    copyText(
                      mailboxDisplay,
                      t.toast.combinationCopied,
                      setCopiedMailbox
                    )
                  }
                  aria-label={t.a11y.copy}
                >
                  {copiedMailbox ? (
                    <Check className="h-[17px] w-[17px]" />
                  ) : (
                    <Copy className="h-[17px] w-[17px]" />
                  )}
                </Button>
              )}
            </CredRow>
          )}

          {property.has_auto_lock && (
            <CredRow
              icon={KeyRound}
              label={t.info.autoLock}
              mono={!autoLockIsSwitchbot}
              wideTracking={!autoLockIsSwitchbot}
              value={
                loadingAutoLock ? (
                  <Loader2 className="inline h-4 w-4 animate-spin" />
                ) : autoLockError ? (
                  <RetryValue
                    label={t.info.loadFailed}
                    onRetry={revealAutoLock}
                    retryLabel={t.common.retry}
                  />
                ) : (
                  autoLockDisplay || "—"
                )
              }
            >
              {autoLockDisplay && !autoLockIsSwitchbot && (
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl"
                  onClick={() =>
                    copyText(
                      autoLockDisplay,
                      t.toast.autoLockCopied,
                      setCopiedAutoLock
                    )
                  }
                  aria-label={t.a11y.copy}
                >
                  {copiedAutoLock ? (
                    <Check className="h-[17px] w-[17px]" />
                  ) : (
                    <Copy className="h-[17px] w-[17px]" />
                  )}
                </Button>
              )}
            </CredRow>
          )}
        </div>
      )}

      {fullAddress && (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-card dark:shadow-none">
          <div className="border-b border-hairline">
            <CredRow
              icon={MapPin}
              label={t.form.address}
              value={fullAddress}
            >
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl"
                onClick={() =>
                  copyText(
                    fullAddress,
                    t.toast.addressCopied,
                    setCopiedAddress
                  )
                }
                aria-label={t.a11y.copy}
              >
                {copiedAddress ? (
                  <Check className="h-[17px] w-[17px]" />
                ) : (
                  <Copy className="h-[17px] w-[17px]" />
                )}
              </Button>
            </CredRow>
          </div>
          <div className="grid grid-cols-2">
            <a
              href={appleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 items-center justify-center gap-2 border-r border-hairline text-[13px] font-semibold text-primary transition-colors hover:bg-muted"
            >
              <ExternalLink className="h-[15px] w-[15px]" />
              Apple Maps
            </a>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 items-center justify-center gap-2 text-[13px] font-semibold text-primary transition-colors hover:bg-muted"
            >
              <ExternalLink className="h-[15px] w-[15px]" />
              Google Maps
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
