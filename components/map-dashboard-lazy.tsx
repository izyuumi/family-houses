"use client";

import dynamic from "next/dynamic";

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

interface MapDashboardLazyProps {
  properties: Property[];
}

function MapSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-muted/30">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-2 border-muted-foreground/20 border-t-primary rounded-full animate-spin" />
      </div>
    </div>
  );
}

const MapDashboard = dynamic(
  () => import("@/components/map-dashboard").then((mod) => mod.MapDashboard),
  {
    ssr: false,
    loading: MapSkeleton,
  }
);

export function MapDashboardLazy({ properties }: MapDashboardLazyProps) {
  return <MapDashboard properties={properties} />;
}
