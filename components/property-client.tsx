"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { InfoCard } from "@/components/info-card";
import { Groceries } from "@/components/groceries";
import { Navbar } from "@/components/navbar";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Property {
  id: string;
  name: string;
  address: string;
  postal_code?: string | null;
  prefecture?: string | null;
  city_ward_town?: string | null;
  area?: string | null;
  chome?: string | null;
  block?: string | null;
  building?: string | null;
  room?: string | null;
  wifi_ssid: string | null;
  guest_wifi_ssid: string | null;
}

interface GroceryItem {
  id: string;
  property_id: string;
  item_name: string;
  quantity: string | null;
  checked: boolean | null;
  added_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface PropertyClientProps {
  property: Property;
  isAdmin: boolean;
  initialGroceries?: GroceryItem[];
}

export function PropertyClient({ property, isAdmin, initialGroceries }: PropertyClientProps) {
  const { t } = useI18n();

  return (
    <main className="min-h-dvh flex flex-col">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-14 shrink-0">
        <div className="w-full max-w-5xl flex justify-between items-center px-4">
          <div className="flex items-center gap-2">
            <Link href="/properties">
              <Button variant="ghost" size="sm" className="-ml-2">
                <span className="text-muted-foreground mr-1">←</span>
                <span className="font-semibold">{property.name}</span>
              </Button>
            </Link>
          </div>
          {isAdmin && (
            <Link href={`/admin/properties/${property.id}/edit`}>
              <Button variant="ghost" size="sm">
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </nav>
      <div className="flex-1 overflow-auto p-4 max-w-xl mx-auto w-full pb-20">
        <p className="text-sm text-muted-foreground mb-4">{property.address}</p>
        <div className="space-y-6">
          <InfoCard property={property} />
          <Groceries propertyId={property.id} initialItems={initialGroceries} />
        </div>
      </div>
    </main>
  );
}
