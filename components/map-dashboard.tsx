"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { JapanMap, type PropertyMarker } from "@/components/japan-map";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin, Home, ChevronRight, List } from "lucide-react";
import { buildFullAddress } from "@/components/address-display";

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
}

interface MapDashboardProps {
  properties: Property[];
}

export function MapDashboard({ properties }: MapDashboardProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [showAllProperties, setShowAllProperties] = useState(false);

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

  return (
    <div className="relative w-full h-full">
      <JapanMap
        mode="view"
        markers={markers}
        onMarkerClick={handleMarkerClick}
      />

      <div className="absolute top-4 left-[max(1rem,env(safe-area-inset-left))] z-10">
        <Button
          variant="outline"
          size="default"
          onClick={() => setShowAllProperties(true)}
          className="shadow-md touch-manipulation h-10 px-4"
        >
          <List className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">
            {t.properties.allProperties}
          </span>
          <span className="sm:hidden">{t.common.list}</span>
          <span className="ml-1">({properties.length})</span>
        </Button>
      </div>

      {properties.length > 0 && (
        <div className="absolute bottom-[calc(5rem+env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-10 md:hidden">
          <Button
            onClick={() => setShowAllProperties(true)}
            className="shadow-lg h-12 px-5 text-base touch-manipulation"
          >
            <Home className="h-5 w-5 mr-2" />
            {t.properties.viewProperties}
          </Button>
        </div>
      )}

      <Dialog open={showAllProperties} onOpenChange={setShowAllProperties}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              {t.properties.allProperties}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-3">
            {properties.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {t.properties.noProperties}
              </div>
            ) : (
              properties.map((property) => {
                const address = buildFullAddress({
                  postal_code: property.postal_code,
                  prefecture: property.prefecture,
                  city_ward_town: property.city_ward_town,
                  area: property.area,
                  chome: property.chome,
                  block: property.block,
                  building: property.building,
                  room: property.room,
                });
                return (
                  <Link
                    key={property.id}
                    href={`/p/${property.slug || property.id}`}
                    onClick={() => setShowAllProperties(false)}
                    className="block rounded-xl border bg-card text-card-foreground shadow p-4 transition-all hover:border-foreground/30 active:scale-[0.98] active:bg-muted/50 touch-manipulation focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium flex items-center gap-2">
                          <Home className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="truncate">{property.name}</span>
                        </div>
                        {address && (
                          <div className="text-sm text-muted-foreground mt-1.5 truncate">
                            {address}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
