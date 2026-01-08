"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import { MapPin } from "lucide-react";

interface Property {
  id: string;
  name: string;
  address: string;
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

          {properties.map((p: Property) => (
            <Link key={p.id} href={`/properties/${p.id}`} prefetch={false}>
              <Card className="p-4 transition-all active:scale-[0.99] hover:border-foreground/30">
                <div className="font-medium">{p.name}</div>
                <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {p.address}
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-6 text-center">
          {t.properties.adminNote}
        </p>
      </div>
    </main>
  );
}
