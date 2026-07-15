"use client";

import { useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { InfoCard } from "@/components/info-card";
import { Groceries } from "@/components/groceries";
import { PropertyItems } from "@/components/property-items";
import { PropertyNotes } from "@/components/property-notes";
import { ChevronLeft, Pencil, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildFullAddress } from "@/components/address-display";
import { cn } from "@/lib/utils";
import { DoorsSection } from "@/components/doors-section";

interface Property {
  id: string;
  slug: string | null;
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

interface GroceryItem {
  id: string;
  property_id: string;
  item_name: string;
  quantity: string | null;
  checked: boolean | null;
  added_by: string | null;
  completed_by: string | null;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  adder?: { display_name: string | null } | null;
  completer?: { display_name: string | null } | null;
}

interface PropertyItem {
  id: string;
  property_id: string;
  title: string;
  bought_date: string | null;
  note: string | null;
  category: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  creator?: { display_name: string | null } | null;
}

interface PropertyNote {
  id: string;
  property_id: string;
  content: string;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  creator?: { display_name: string | null } | null;
}

interface PropertyClientProps {
  property: Property;
  isAdmin: boolean;
  userId?: string;
  initialGroceries?: GroceryItem[];
  initialPropertyItems?: PropertyItem[];
  initialPropertyNotes?: PropertyNote[];
}

type SectionKey = "info" | "doors" | "todos" | "notes" | "items";

export function PropertyClient({
  property,
  isAdmin,
  userId,
  initialGroceries,
  initialPropertyItems,
  initialPropertyNotes,
}: PropertyClientProps) {
  const { t } = useI18n();
  const [activeSection, setActiveSection] = useState<SectionKey>("info");
  const devices = useQuery(api.locks.devicesForProperty, { propertyId: property.id as never });
  const scrollRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const todosRef = useRef<HTMLDivElement>(null);
  const doorsRef = useRef<HTMLDivElement>(null);
  const notesRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement>(null);

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

  const todoCount = (initialGroceries ?? []).filter((i) => !i.checked).length;

  const scrollToSection = (key: SectionKey) => {
    setActiveSection(key);
    const container = scrollRef.current;
    const refs = {
      info: infoRef,
      doors: doorsRef,
      todos: todosRef,
      notes: notesRef,
      items: itemsRef,
    };
    const section = refs[key].current;
    if (!container || !section) return;
    const top =
      section.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop -
      8;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    container.scrollTo({
      top: Math.max(0, top),
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  const chips: { key: SectionKey; label: string; count?: number }[] = [
    { key: "info", label: t.info.chip },
    ...(devices?.length ? [{ key: "doors" as SectionKey, label: t.locks.title }] : []),
    { key: "todos", label: t.groceries.title, count: todoCount },
    { key: "notes", label: t.propertyNotes.title },
    { key: "items", label: t.propertyItems.title },
  ];

  return (
    <main className="h-dvh flex flex-col">
      <div className="mx-auto w-full max-w-xl shrink-0">
        <div className="flex items-center justify-between px-4 pb-1 pt-[calc(0.5rem+env(safe-area-inset-top))]">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="rounded-xl shadow-none"
            aria-label={t.common.back}
          >
            <Link href="/">
              <ChevronLeft className="h-[18px] w-[18px]" />
            </Link>
          </Button>
          {isAdmin && (
            <Button
              asChild
              variant="outline"
              size="icon"
              className="rounded-xl shadow-none"
              aria-label={t.a11y.editProperty}
            >
              <Link href={`/add/p/${property.slug || property.id}/edit`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
        <div className="px-5 pb-4 pt-2">
          <h1 className="text-2xl font-bold tracking-[-0.01em]">
            {property.name}
          </h1>
          {fullAddress && (
            <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <MapPin className="h-[13px] w-[13px] shrink-0" />
              <span className="truncate">{fullAddress}</span>
            </p>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto px-5 pb-4 [scrollbar-width:none]">
          {chips.map((chip) => {
            const active = activeSection === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => scrollToSection(chip.key)}
                className={cn(
                  "touch-target flex h-[38px] shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] transition-colors",
                  active
                    ? "bg-primary font-semibold text-primary-foreground"
                    : "border bg-card font-medium text-muted-foreground"
                )}
              >
                {chip.label}
                {chip.count !== undefined && chip.count > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-[7px] py-px text-[11px] font-semibold",
                      active
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {chip.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pb-[calc(3rem+env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
          <div ref={infoRef} className="scroll-mt-2">
            <InfoCard property={property} />
          </div>
          {devices?.length ? <div ref={doorsRef} className="scroll-mt-2"><DoorsSection propertyId={property.id} /></div> : null}
          <div ref={todosRef} className="scroll-mt-2">
            <Groceries
              propertyId={property.id}
              initialItems={initialGroceries}
              userId={userId}
            />
          </div>
          <div ref={notesRef} className="scroll-mt-2">
            <PropertyNotes
              propertyId={property.id}
              initialNotes={initialPropertyNotes}
              userId={userId}
            />
          </div>
          <div ref={itemsRef} className="scroll-mt-2">
            <PropertyItems
              propertyId={property.id}
              initialItems={initialPropertyItems}
              userId={userId}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
