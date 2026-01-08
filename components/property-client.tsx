"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { InfoCard } from "@/components/info-card";
import { Groceries } from "@/components/groceries";
import { ChevronLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Property {
  id: string;
  name: string;
  address: string;
  wifi_ssid: string | null;
  guest_wifi_ssid: string | null;
}

interface PropertyClientProps {
  property: Property;
  isAdmin: boolean;
}

export function PropertyClient({ property, isAdmin }: PropertyClientProps) {
  const { t } = useI18n();

  return (
    <>
      <header className="py-2">
        <div className="flex items-center justify-between">
          <Link href="/properties">
            <Button variant="ghost" size="sm" className="mb-2 -ml-2">
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t.property.backToList}
            </Button>
          </Link>
          {isAdmin && (
            <Link href={`/admin/properties/${property.id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-1" />
                {t.common.edit}
              </Button>
            </Link>
          )}
        </div>
        <h1 className="text-xl font-semibold">{property.name}</h1>
        <p className="text-sm text-muted-foreground">{property.address}</p>
      </header>

      <div className="mt-4 space-y-6">
        <InfoCard property={property} />
        <Groceries propertyId={property.id} />
      </div>
    </>
  );
}
