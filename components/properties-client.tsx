"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import { MapPin } from "lucide-react";
import { buildFullAddress } from "@/components/address-display";

interface Property {
  id: string;
  name: string;
  postal_code: string | null;
  prefecture: string | null;
  city_ward_town: string | null;
  area: string | null;
  chome: string | null;
  block: string | null;
  building: string | null;
  room: string | null;
}

interface PropertiesClientProps {
  properties: Property[];
}

export function PropertiesClient({ properties }: PropertiesClientProps) {
  const { t } = useI18n();

  return (
    <main className="min-h-dvh flex flex-col">
      <Navbar showBack backHref="/" title={t.properties.title} />
      <div className="flex-1 p-4 max-w-xl mx-auto w-full">
        <div className="mt-2 space-y-3">
          {properties.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              {t.properties.noProperties}
            </p>
          )}

          {properties.map((p: Property) => {
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
              <Link key={p.id} href={`/properties/${p.id}`} prefetch={false}>
                <Card className="p-4 transition-all active:scale-[0.99] hover:border-foreground/30">
                  <div className="font-medium">{p.name}</div>
                  {address && (
                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {address}
                    </div>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground mt-6 text-center">
          {t.properties.adminNote}
        </p>
      </div>
    </main>
  );
}
