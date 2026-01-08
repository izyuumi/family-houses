"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { JapanMap, type PropertyMarker } from "@/components/japan-map";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Home, X, ChevronRight, List } from "lucide-react";
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
    const property = properties.find((p) => p.id === marker.id);
    if (property) {
      setSelectedProperty(property);
      setShowAllProperties(false);
    }
  };

  const navigateToProperty = (propertyId: string) => {
    router.push(`/properties/${propertyId}`);
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
            size="default"
            onClick={toggleAllProperties}
            className="shadow-md touch-manipulation h-10 px-4"
          >
            <List className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{t.properties.allProperties}</span>
            <span className="sm:hidden">{t.common.list}</span>
            <span className="ml-1">({properties.length})</span>
          </Button>
        </div>
      </div>

      {(selectedProperty || showAllProperties) && (
        <div className="w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l bg-background flex flex-col max-h-[45vh] md:max-h-full animate-in slide-in-from-bottom md:slide-in-from-right duration-200">
          <div className="md:hidden w-12 h-1 bg-border rounded-full mx-auto mt-2 mb-1" />
          
          <div className="px-4 py-3 md:p-4 border-b flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-base">
                {showAllProperties ? t.properties.allProperties : selectedProperty?.name ?? "Property"}
              </h2>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={clearSelection}
              className="h-9 w-9 touch-manipulation"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3">
            {displayedProperties.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {t.properties.noProperties}
              </div>
            ) : (
              displayedProperties.map((property) => {
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
                  <Card
                    key={property.id}
                    className="p-4 transition-all hover:border-foreground/30 active:scale-[0.98] active:bg-muted/50 cursor-pointer touch-manipulation"
                    onClick={() => navigateToProperty(property.id)}
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
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {!selectedProperty && !showAllProperties && properties.length > 0 && (
        <div className="absolute bottom-20 right-4 z-10 md:hidden">
          <Button 
            onClick={toggleAllProperties} 
            className="shadow-lg h-12 px-5 text-base touch-manipulation"
          >
            <Home className="h-5 w-5 mr-2" />
            {t.properties.viewProperties}
          </Button>
        </div>
      )}
    </div>
  );
}
