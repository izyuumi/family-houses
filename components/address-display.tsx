"use client";

import { useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Copy, Check, MapPin, ExternalLink } from "lucide-react";

export interface StructuredAddress {
  postal_code: string | null;
  prefecture: string | null;
  city_ward_town: string | null;
  area: string | null;
  chome: string | null;
  block: string | null;
  building: string | null;
  room: string | null;
}

interface AddressDisplayProps {
  address: StructuredAddress;
  fallbackAddress?: string;
  latitude?: number | null;
  longitude?: number | null;
}

type CopyState = "idle" | "copied";

interface AddressLine {
  key: string;
  label: string;
  value: string;
}

function buildFullAddress(address: StructuredAddress): string {
  const parts: string[] = [];

  if (address.postal_code) {
    parts.push(`〒${address.postal_code}`);
  }

  const locationParts = [
    address.prefecture,
    address.city_ward_town,
    address.area,
  ].filter(Boolean);

  if (locationParts.length > 0) {
    parts.push(locationParts.join(""));
  }

  const numberParts = [address.chome, address.block].filter(Boolean);
  if (numberParts.length > 0) {
    parts.push(numberParts.join("-"));
  }

  const buildingParts = [address.building, address.room].filter(Boolean);
  if (buildingParts.length > 0) {
    parts.push(buildingParts.join(" "));
  }

  return parts.join(" ");
}

function buildRegionLine(address: StructuredAddress): string {
  const parts: string[] = [];

  if (address.postal_code) {
    parts.push(`〒${address.postal_code}`);
  }

  const locationParts = [
    address.prefecture,
    address.city_ward_town,
    address.area,
  ].filter(Boolean);

  if (locationParts.length > 0) {
    parts.push(locationParts.join(""));
  }

  return parts.join(" ");
}

function buildNumberLine(address: StructuredAddress): string {
  const parts = [address.chome, address.block].filter(Boolean);
  return parts.join("-");
}

function buildBuildingLine(address: StructuredAddress): string {
  const parts = [address.building, address.room].filter(Boolean);
  return parts.join(" ");
}

function hasStructuredAddress(address: StructuredAddress): boolean {
  return Boolean(
    address.postal_code ||
      address.prefecture ||
      address.city_ward_town ||
      address.area ||
      address.chome ||
      address.block ||
      address.building ||
      address.room
  );
}

function CopyButton({
  text,
  size = "icon",
  variant = "ghost",
}: {
  text: string;
  size?: "icon" | "sm";
  variant?: "ghost" | "outline";
}) {
  const [copyState, setCopyState] = useState<CopyState>("idle");

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopyState("copied");
    setTimeout(() => setCopyState("idle"), 2000);
  }, [text]);

  if (size === "icon") {
    return (
      <button
        onClick={handleCopy}
        className="p-1 rounded hover:bg-muted transition-colors shrink-0"
        aria-label="Copy"
      >
        {copyState === "copied" ? (
          <Check className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
    );
  }

  return (
    <Button onClick={handleCopy} variant={variant} size="sm">
      {copyState === "copied" ? (
        <>
          <Check className="h-4 w-4 mr-1.5" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 mr-1.5" />
          Copy
        </>
      )}
    </Button>
  );
}

function AddressLineRow({
  line,
  onCopy,
}: {
  line: AddressLine;
  onCopy: (text: string) => void;
}) {
  const [copyState, setCopyState] = useState<CopyState>("idle");

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(line.value);
    setCopyState("copied");
    onCopy(line.value);
    setTimeout(() => setCopyState("idle"), 2000);
  }, [line.value, onCopy]);

  return (
    <div
      className="flex items-center justify-between gap-2 py-1.5 px-2 -mx-2 rounded cursor-pointer hover:bg-muted/50 transition-colors group"
      onClick={handleCopy}
    >
      <div className="min-w-0 flex-1">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {line.label}
        </div>
        <div className="text-sm truncate">{line.value}</div>
      </div>
      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {copyState === "copied" ? (
          <Check className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}

export function AddressDisplay({
  address,
  fallbackAddress,
  latitude,
  longitude,
}: AddressDisplayProps) {
  const { t, language } = useI18n();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const handleLineCopy = useCallback(() => {
    showToast(language === "ja" ? "コピーしました" : "Copied");
  }, [showToast, language]);

  if (!hasStructuredAddress(address)) {
    if (!fallbackAddress) return null;

    return (
      <div className="flex items-start gap-2">
        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-muted-foreground text-xs">{t.form.address}</div>
          <div className="text-sm flex items-center gap-1">
            <span className="truncate">{fallbackAddress}</span>
            <CopyButton text={fallbackAddress} />
          </div>
        </div>
      </div>
    );
  }

  const fullAddress = buildFullAddress(address);
  const regionLine = buildRegionLine(address);
  const numberLine = buildNumberLine(address);
  const buildingLine = buildBuildingLine(address);

  const lines: AddressLine[] = [];

  if (regionLine) {
    lines.push({
      key: "region",
      label: language === "ja" ? "地域" : "Region",
      value: regionLine,
    });
  }

  if (numberLine) {
    lines.push({
      key: "number",
      label: language === "ja" ? "番地" : "Street/Block",
      value: numberLine,
    });
  }

  if (buildingLine) {
    lines.push({
      key: "building",
      label: language === "ja" ? "建物・部屋" : "Building/Room",
      value: buildingLine,
    });
  }

  const hasCoordinates =
    latitude !== null &&
    latitude !== undefined &&
    longitude !== null &&
    longitude !== undefined;

  const mapsUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  return (
    <div className="relative">
      {toast && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded shadow-lg z-10 animate-in fade-in slide-in-from-bottom-1 duration-200">
          {toast}
        </div>
      )}

      <div className="flex items-start gap-2">
        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-muted-foreground text-xs mb-2">
            {t.form.address}
          </div>

          <div className="mb-3">
            <Button
              onClick={async () => {
                await navigator.clipboard.writeText(fullAddress);
                showToast(
                  language === "ja" ? "住所をコピーしました" : "Address copied"
                );
              }}
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              <Copy className="h-4 w-4 mr-2 shrink-0" />
              <span className="truncate">
                {language === "ja" ? "住所をコピー" : "Copy Full Address"}
              </span>
            </Button>
          </div>

          <div className="space-y-0.5">
            {lines.map((line) => (
              <AddressLineRow
                key={line.key}
                line={line}
                onCopy={handleLineCopy}
              />
            ))}
          </div>

          <div className="flex gap-2 mt-3 pt-3 border-t">
            <Button asChild variant="ghost" size="sm" className="flex-1">
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1.5" />
                {language === "ja" ? "マップで開く" : "Open in Maps"}
              </a>
            </Button>
            {hasCoordinates && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await navigator.clipboard.writeText(
                    `${latitude}, ${longitude}`
                  );
                  showToast(
                    language === "ja" ? "座標をコピーしました" : "Coordinates copied"
                  );
                }}
              >
                <Copy className="h-4 w-4 mr-1.5" />
                {language === "ja" ? "座標" : "Coords"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
