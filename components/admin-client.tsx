"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { AdminForm } from "@/components/admin-form";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface Property {
  id: string;
  name: string;
  address: string;
  wifi_ssid: string | null;
  wifi_password: string | null;
  guest_wifi_ssid: string | null;
  guest_wifi_password: string | null;
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
      <main className="min-h-dvh p-4 max-w-xl mx-auto pb-20">
        <header className="py-2">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-2 -ml-2">
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t.property.backToMap}
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">{t.admin.addProperty}</h1>
          <p className="text-sm text-muted-foreground">
            {t.admin.createNewHouse}
          </p>
        </header>

        <AdminForm />
      </main>
    );
  }

  return (
    <main className="min-h-dvh p-4 max-w-xl mx-auto pb-20">
      <header className="py-2">
        <Link href={`/properties/${property?.id}`}>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t.property.backToProperty}
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">{t.admin.editProperty}</h1>
        <p className="text-sm text-muted-foreground">
          {t.admin.updateProperty} {property?.name}
        </p>
      </header>

      <AdminForm property={property} />
    </main>
  );
}
