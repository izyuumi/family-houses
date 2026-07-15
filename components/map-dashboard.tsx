"use client";

import {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { JapanMap, type PropertyMarker } from "@/components/japan-map";
import { TabBar } from "@/components/tab-bar";
import { Input } from "@/components/ui/input";
import { buildFullAddress } from "@/components/address-display";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LockControl, lockStateLabel } from "@/components/lock-control";
import {
  Home,
  ChevronRight,
  Search,
  User as UserIcon,
  X,
} from "lucide-react";

interface Property {
  id: string;
  slug: string | null;
  name: string;
  postal_code: string | null;
  prefecture: string | null;
  city_ward_town: string | null;
  area: string | null;
  chome: string | null;
  block: string | null;
  building: string | null;
  room: string | null;
  location_x: number | null;
  location_y: number | null;
  todo_count: number;
}

interface MapDashboardProps {
  properties: Property[];
  userInitial: string | null;
}

function PropertyRow({
  property,
  secondary,
  onNavigate,
}: {
  property: Property;
  secondary: string | null;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={`/p/${property.slug || property.id}`}
      onClick={onNavigate}
      className="flex items-center gap-3.5 rounded-[14px] border bg-card p-3.5 transition-all active:scale-[0.98] touch-manipulation focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
        <Home className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold">
          {property.name}
        </div>
        {secondary && (
          <div className="mt-0.5 truncate text-xs text-muted-foreground">
            {secondary}
          </div>
        )}
      </div>
      <ChevronRight className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
    </Link>
  );
}

export function MapDashboard({ properties, userInitial }: MapDashboardProps) {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    if (searchParams.get("list") === "1") setExpanded(true);
  }, [searchParams]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  const openSheet = useCallback(() => {
    setExpanded(true);
    requestAnimationFrame(() => searchInputRef.current?.focus());
  }, []);

  const closeSheet = useCallback(() => {
    setExpanded(false);
    setQuery("");
  }, []);

  const markers: PropertyMarker[] = useMemo(() => {
    return properties
      .filter((p) => p.location_x !== null && p.location_y !== null)
      .map((p) => ({
        id: p.id,
        name: p.name,
        x: p.location_x!,
        y: p.location_y!,
      }));
  }, [properties]);

  const handleMarkerClick = (marker: PropertyMarker) => {
    const property = properties.find((p) => p.id === marker.id);
    if (property) {
      router.push(`/p/${property.slug || property.id}`);
    }
  };

  const secondaryFor = (p: Property) => {
    const place = [p.prefecture, p.city_ward_town, p.area]
      .filter(Boolean)
      .join("");
    const todos =
      p.todo_count > 0
        ? `${t.properties.todoBefore}${p.todo_count}${t.properties.todoAfter}`
        : null;
    return [place || null, todos].filter(Boolean).join(" · ") || null;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return properties;
    return properties.filter((p) => {
      const address = buildFullAddress({
        postal_code: p.postal_code,
        prefecture: p.prefecture,
        city_ward_town: p.city_ward_town,
        area: p.area,
        chome: p.chome,
        block: p.block,
        building: p.building,
        room: p.room,
      });
      return (
        p.name.toLowerCase().includes(q) || address.toLowerCase().includes(q)
      );
    });
  }, [properties, query]);

  const firstProperty = properties[0];
  const selectedDevices = useQuery(
    api.locks.devicesForProperty,
    firstProperty ? { propertyId: firstProperty.id as never } : "skip"
  ) as Array<{ _id: string; propertyId: string; label: string; lockState?: string; doorState?: string; battery?: number; canControl: boolean }> | undefined;

  const onSheetTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const onSheetTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = e.changedTouches[0].clientY - touchStartY.current;
    touchStartY.current = null;
    if (delta > 50 && expanded) closeSheet();
    if (delta < -30 && !expanded) openSheet();
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      <JapanMap
        mode="view"
        markers={markers}
        onMarkerClick={handleMarkerClick}
        controlsClass="right-[max(1rem,env(safe-area-inset-right))] bottom-[232px]"
      />

      <div className="absolute inset-x-0 top-0 z-10 mx-auto flex w-full max-w-xl items-center gap-2.5 px-4 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={openSheet}
          className="flex h-12 flex-1 items-center gap-2.5 rounded-full border bg-card px-[18px] text-left shadow-float touch-manipulation"
        >
          <Search className="h-[17px] w-[17px] shrink-0 text-muted-foreground" />
          <span className="truncate text-sm text-muted-foreground">
            {t.home.searchPlaceholder}
          </span>
        </button>
        <Link
          href="/profile"
          aria-label={t.a11y.openProfile}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-[15px] font-semibold text-primary-foreground shadow-primary-btn"
        >
          {userInitial ?? <UserIcon className="h-5 w-5" />}
        </Link>
      </div>

      {expanded && (
        <div
          className="absolute inset-0 z-20 bg-[rgba(16,40,43,.25)] dark:bg-black/35"
          onClick={closeSheet}
          aria-hidden="true"
        />
      )}

      <div
        role={expanded ? "dialog" : undefined}
        aria-modal={expanded || undefined}
        aria-label={t.properties.allProperties}
        className={cn(
          "absolute inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-xl flex-col rounded-t-[20px] border-t border-hairline bg-card shadow-sheet",
          expanded && "max-h-[78%]"
        )}
        onTouchStart={onSheetTouchStart}
        onTouchEnd={onSheetTouchEnd}
      >
        <button
          type="button"
          onClick={expanded ? closeSheet : openSheet}
          aria-label={expanded ? t.a11y.closeList : t.properties.open}
          className="touch-target mx-auto mb-3 mt-2.5 block h-1 w-10 shrink-0 rounded-full bg-check-ring"
        />
        <div className="flex shrink-0 items-center justify-between px-5 pb-3">
          <span
            className={cn(
              "font-bold tracking-[-0.01em]",
              expanded ? "text-lg" : "text-base"
            )}
          >
            {t.properties.allProperties}{" "}
            <span className="font-medium text-muted-foreground">
              · {properties.length}
            </span>
          </span>
          {expanded ? (
            <button
              type="button"
              onClick={closeSheet}
              aria-label={t.a11y.closeList}
              className="touch-target flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={openSheet}
              className="touch-target text-[13px] font-semibold text-primary"
            >
              {t.properties.open}
            </button>
          )}
        </div>

        {expanded ? (
          <>
            <div className="shrink-0 px-4 pb-2">
              <div className="flex h-11 items-center gap-2.5 rounded-lg border bg-background px-3.5">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.properties.searchPlaceholder}
                  className="h-full border-0 bg-transparent p-0 text-[13px] shadow-none focus-visible:ring-0"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2.5 overflow-y-auto px-4 pb-[max(2.125rem,env(safe-area-inset-bottom))] pt-2 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-300">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {t.properties.noProperties}
                </div>
              ) : (
                filtered.map((property) => (
                  <PropertyRow
                    key={property.id}
                    property={property}
                    secondary={secondaryFor(property)}
                    onNavigate={closeSheet}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          <>
            {firstProperty && (
              <div className="px-4 pb-3">
                {selectedDevices?.length ? <div className="mb-2 divide-y divide-hairline overflow-hidden rounded-xl border bg-background"><div className="flex items-center gap-2 px-3 py-2"><span className={cn("h-2 w-2 rounded-full", selectedDevices[0].lockState === "unlock" ? "bg-[hsl(var(--dial-left))]" : selectedDevices[0].lockState === "jammed" ? "bg-destructive" : "bg-primary")} /><span className="min-w-0 flex-1 truncate text-xs font-medium">{selectedDevices[0].label} · {lockStateLabel(selectedDevices[0], t)}</span>{selectedDevices[0].canControl && <LockControl device={selectedDevices[0]} size="compact" />}</div></div> : null}
                <PropertyRow
                  property={firstProperty}
                  secondary={secondaryFor(firstProperty)}
                  onNavigate={closeSheet}
                />
              </div>
            )}
            <TabBar onListClick={openSheet} />
          </>
        )}
      </div>
    </div>
  );
}
