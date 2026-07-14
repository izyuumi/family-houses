"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { AdminForm } from "@/components/admin-form";
import { Button } from "@/components/ui/button";

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
  apple_maps_url: string | null;
  wifi_ssid: string | null;
  wifi_password: string | null;
  guest_wifi_ssid: string | null;
  guest_wifi_password: string | null;
  mailbox_lock_combination: string | null;
  auto_lock_code: string | null;
  location_x: number | null;
  location_y: number | null;
}

interface AdminClientProps {
  mode: "add" | "edit";
  property?: Property;
}

export function AdminClient({ mode, property }: AdminClientProps) {
  const { t } = useI18n();
  const isEdit = mode === "edit";
  const backHref = isEdit ? `/p/${property?.slug || property?.id}` : "/admin";

  return (
    <main className="min-h-dvh flex flex-col">
      <div className="mx-auto flex w-full max-w-xl shrink-0 items-center gap-3 px-4 pb-1 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        <Button
          asChild
          variant="outline"
          size="icon"
          className="rounded-xl shadow-none"
          aria-label={t.common.back}
        >
          <Link href={backHref}>
            <ChevronLeft className="h-[18px] w-[18px]" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold tracking-[-0.01em]">
          {isEdit ? t.admin.editProperty : t.admin.addProperty}
        </h1>
      </div>
      <div className="mx-auto w-full max-w-xl flex-1 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3">
        <AdminForm property={isEdit ? property : undefined} />
      </div>
    </main>
  );
}
