"use client";

import { SignIn } from "@clerk/nextjs";
import { useI18n } from "@/lib/i18n/context";
import { MapDashboardLazy } from "@/components/map-dashboard-lazy";
import { Navbar } from "@/components/navbar";
import { Home } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface Property {
  _id: Id<"properties">;
  _creationTime: number;
  name: string;
  slug?: string;
  postalCode?: string;
  prefecture?: string;
  cityWardTown?: string;
  area?: string;
  chome?: string;
  block?: string;
  building?: string;
  room?: string;
  locationX?: number;
  locationY?: number;
}

interface HomeClientProps {
  userId: string | null;
  properties: Property[];
}

export function HomeClient({ userId, properties }: HomeClientProps) {
  const { t } = useI18n();

  if (!userId) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center p-8">
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-4">
            <Home className="h-14 w-14 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">
              {t.home.title}
            </h1>
            <p className="text-muted-foreground text-center text-lg">
              {t.home.subtitle}
            </p>
          </div>
          <SignIn />
        </div>
      </main>
    );
  }

  const mappedProperties = properties.map((p) => ({
    id: p._id,
    slug: p.slug ?? null,
    name: p.name,
    postal_code: p.postalCode ?? null,
    prefecture: p.prefecture ?? null,
    city_ward_town: p.cityWardTown ?? null,
    area: p.area ?? null,
    chome: p.chome ?? null,
    block: p.block ?? null,
    building: p.building ?? null,
    room: p.room ?? null,
    location_x: p.locationX ?? null,
    location_y: p.locationY ?? null,
  }));

  return (
    <main className="h-dvh flex flex-col">
      <Navbar />
      <div className="flex-1 overflow-hidden">
        <MapDashboardLazy properties={mappedProperties} />
      </div>
    </main>
  );
}
