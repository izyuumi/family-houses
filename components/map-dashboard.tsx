"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { JapanMap, type PropertyMarker } from "@/components/japan-map";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Home, X, ChevronRight, List } from "lucide-react";

interface Property {
  id: string;
  name: string;
  address: string;
  location_x: number | null;
  location_y: number | null;
}

interface MapDashboardProps {
  properties: Property[];
}

export function MapDashboard({ properties }: MapDashboardProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
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
    router.push(`/properties/${marker.id}`);
  };

  const clearSelection = () => {
    setSelectedProperty(null);
    setShowAllProperties(false);
  };

  const toggleAllProperties = () => {
    setSelectedProperty(null);
    setShowAllProperties(!showAllProperties);
  };

  const displayedProperties = showAllProperties
    ? properties
    : selectedProperty
      ? [selectedProperty]
      : [];

  return (
    <div className="relative w-full h-full flex flex-col md:flex-row">
      <div className="flex-1 relative min-h-[50vh] md:min-h-0">
        <JapanMap mode="view" markers={markers} onMarkerClick={handleMarkerClick} />

        <div className="absolute top-4 left-4 z-10">
          <Button
            variant={showAllProperties ? "default" : "outline"}
            size="sm"
            onClick={toggleAllProperties}
            className="shadow-md"
          >
            <List className="h-4 w-4 mr-2" />
            {t.properties.allProperties} ({properties.length})
          </Button>
        </div>
      </div>

      {(selectedProperty || showAllProperties) && (
        <div className="w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l bg-background flex flex-col max-h-[50vh] md:max-h-full">
          <div className="p-4 border-b flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold">
                {showAllProperties ? t.properties.allProperties : selectedProperty?.name ?? "Property"}
              </h2>
            </div>
            <Button variant="ghost" size="icon" onClick={clearSelection}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {displayedProperties.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {t.properties.noProperties}
              </div>
            ) : (
              displayedProperties.map((property) => (
                <Link key={property.id} href={`/properties/${property.id}`}>
                  <Card className="p-4 transition-all hover:border-foreground/30 active:scale-[0.99]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium flex items-center gap-2">
                          <Home className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="truncate">{property.name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 truncate">
                          {property.address}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      {!selectedProperty && !showAllProperties && properties.length > 0 && (
        <div className="absolute bottom-4 right-4 z-10 md:hidden">
          <Button onClick={toggleAllProperties} className="shadow-lg">
            <Home className="h-4 w-4 mr-2" />
            {t.properties.viewProperties}
          </Button>
        </div>
      )}
    </div>
  );
}
