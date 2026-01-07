"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { JapanMap, PREFECTURES, type Prefecture } from "@/components/japan-map";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Home, X, ChevronRight, List } from "lucide-react";

interface Property {
  id: string;
  name: string;
  address: string;
  prefecture_id: string | null;
}

interface MapDashboardProps {
  properties: Property[];
}

export function MapDashboard({ properties }: MapDashboardProps) {
  const [selectedPrefecture, setSelectedPrefecture] = useState<Prefecture | null>(null);
  const [showAllProperties, setShowAllProperties] = useState(false);

  const prefecturesWithProperties = useMemo(() => {
    const prefIds = new Set(
      properties
        .map((p) => p.prefecture_id)
        .filter((id): id is string => id !== null)
    );
    return Array.from(prefIds);
  }, [properties]);

  const filteredProperties = useMemo(() => {
    if (showAllProperties) return properties;
    if (!selectedPrefecture) return [];
    return properties.filter((p) => p.prefecture_id === selectedPrefecture.id);
  }, [properties, selectedPrefecture, showAllProperties]);

  const handlePrefectureClick = (prefecture: Prefecture) => {
    setShowAllProperties(false);
    setSelectedPrefecture(prefecture);
  };

  const clearSelection = () => {
    setSelectedPrefecture(null);
    setShowAllProperties(false);
  };

  const toggleAllProperties = () => {
    setSelectedPrefecture(null);
    setShowAllProperties(!showAllProperties);
  };

  const hasPropertyData = prefecturesWithProperties.length > 0;

  return (
    <div className="relative w-full h-full flex flex-col md:flex-row">
      <div className="flex-1 relative min-h-[50vh] md:min-h-0">
        <JapanMap
          onPrefectureClick={handlePrefectureClick}
          activePrefectures={hasPropertyData ? prefecturesWithProperties : undefined}
        />

        <div className="absolute top-4 left-4 z-10">
          <Button
            variant={showAllProperties ? "default" : "outline"}
            size="sm"
            onClick={toggleAllProperties}
            className="shadow-md"
          >
            <List className="h-4 w-4 mr-2" />
            All Properties ({properties.length})
          </Button>
        </div>

        {!hasPropertyData && properties.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 md:right-auto md:max-w-xs z-10">
            <Card className="p-3 text-sm text-muted-foreground">
              <p>
                Properties don&apos;t have prefecture data yet. Click &quot;All Properties&quot; to browse.
              </p>
            </Card>
          </div>
        )}
      </div>

      {(selectedPrefecture || showAllProperties) && (
        <div className="w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l bg-background flex flex-col max-h-[50vh] md:max-h-full">
          <div className="p-4 border-b flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold">
                {showAllProperties
                  ? "All Properties"
                  : selectedPrefecture?.name ?? "Properties"}
              </h2>
            </div>
            <Button variant="ghost" size="icon" onClick={clearSelection}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredProperties.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {showAllProperties
                  ? "No properties yet"
                  : `No properties in ${selectedPrefecture?.name}`}
              </div>
            ) : (
              filteredProperties.map((property) => (
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

          {!showAllProperties && filteredProperties.length === 0 && properties.length > 0 && (
            <div className="p-4 border-t shrink-0">
              <Button
                variant="outline"
                className="w-full"
                onClick={toggleAllProperties}
              >
                View all {properties.length} properties
              </Button>
            </div>
          )}
        </div>
      )}

      {!selectedPrefecture && !showAllProperties && properties.length > 0 && (
        <div className="absolute bottom-4 right-4 z-10 md:hidden">
          <Button onClick={toggleAllProperties} className="shadow-lg">
            <Home className="h-4 w-4 mr-2" />
            View Properties
          </Button>
        </div>
      )}
    </div>
  );
}
