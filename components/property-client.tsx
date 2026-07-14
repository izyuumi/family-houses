"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { InfoCard } from "@/components/info-card";
import { Groceries } from "@/components/groceries";
import { PropertyItems } from "@/components/property-items";
import { PropertyNotes } from "@/components/property-notes";
import { Navbar } from "@/components/navbar";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildFullAddress } from "@/components/address-display";

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

export function PropertyClient({
  property,
  isAdmin,
  userId,
  initialGroceries,
  initialPropertyItems,
  initialPropertyNotes,
}: PropertyClientProps) {
  const { t } = useI18n();
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

  return (
    <main className="min-h-dvh flex flex-col">
      <Navbar
        showBack
        title={property.name}
        showProfile={false}
        action={
          isAdmin ? (
            <Button
              asChild
              variant="ghost"
              size="sm"
              aria-label={t.a11y.editProperty}
            >
              <Link href={`/add/p/${property.slug || property.id}/edit`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
          ) : undefined
        }
      />
      <div className="flex-1 overflow-auto p-4 max-w-xl mx-auto w-full pb-[calc(5rem+env(safe-area-inset-bottom))]">
        {fullAddress && (
          <p className="text-sm text-muted-foreground mb-4">{fullAddress}</p>
        )}
        <div className="space-y-6">
          <InfoCard property={property} />
          <Groceries
            propertyId={property.id}
            initialItems={initialGroceries}
            userId={userId}
          />
          <PropertyNotes
            propertyId={property.id}
            initialNotes={initialPropertyNotes}
            userId={userId}
          />
          <PropertyItems
            propertyId={property.id}
            initialItems={initialPropertyItems}
            userId={userId}
          />
        </div>
      </div>
    </main>
  );
}
