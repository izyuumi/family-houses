"use client";

import { useI18n } from "@/lib/i18n/context";
import { AdminForm } from "@/components/admin-form";
import { Navbar } from "@/components/navbar";

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
  location_x: number | null;
  location_y: number | null;
}

interface AdminClientProps {
  mode: "add" | "edit";
  property?: Property;
}

export function AdminClient({ mode, property }: AdminClientProps) {
  const { t } = useI18n();

  if (mode === "add") {
    return (
      <main className="min-h-dvh flex flex-col">
        <Navbar showBack backHref="/" title={t.admin.addProperty} />
        <div className="flex-1 p-4 max-w-xl mx-auto w-full pb-20">
          <p className="text-sm text-muted-foreground mb-4">
            {t.admin.createNewHouse}
          </p>
          <AdminForm />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex flex-col">
      <Navbar
        showBack
        backHref={`/p/${property?.slug || property?.id}`}
        title={t.admin.editProperty}
      />
      <div className="flex-1 p-4 max-w-xl mx-auto w-full pb-20">
        <p className="text-sm text-muted-foreground mb-4">
          {t.admin.updateProperty} {property?.name}
        </p>
        <AdminForm property={property} />
      </div>
    </main>
  );
}
