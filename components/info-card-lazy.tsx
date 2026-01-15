"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

interface Property {
  id: string;
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
}

interface InfoCardLazyProps {
  property: Property;
}

function InfoCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Info className="h-4 w-4" />
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
          <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
          <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
        </div>
        <div className="pt-3 border-t">
          <div className="h-16 bg-muted/50 animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

const InfoCard = dynamic(
  () => import("@/components/info-card").then((mod) => mod.InfoCard),
  {
    loading: InfoCardSkeleton,
  }
);

export function InfoCardLazy({ property }: InfoCardLazyProps) {
  return <InfoCard property={property} />;
}
