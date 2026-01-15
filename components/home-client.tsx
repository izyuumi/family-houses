"use client";

import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import { useI18n } from "@/lib/i18n/context";
import { MapDashboardLazy } from "@/components/map-dashboard-lazy";
import { Button } from "@/components/ui/button";
import { Home, User as UserIcon } from "lucide-react";
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
        <div className="flex flex-col items-center gap-16">
          <div className="flex flex-col items-center gap-4">
            <Home className="h-14 w-14 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">
              {t.home.title}
            </h1>
            <p className="text-muted-foreground text-center text-lg">
              {t.home.subtitle}
            </p>
          </div>
          <SignInButton mode="modal">
            <Button size="lg" className="px-8 py-6 text-lg">
              {t.common.signIn}
            </Button>
          </SignInButton>
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
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-14 shrink-0">
        <div className="w-full max-w-5xl flex justify-between items-center px-4 text-sm">
          <span className="font-semibold">{t.home.title}</span>
          <div className="flex items-center gap-2">
            <Link href="/profile">
              <Button variant="ghost" size="sm">
                <UserIcon className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>
      <div className="flex-1 overflow-hidden">
        <MapDashboardLazy properties={mappedProperties} />
      </div>
    </main>
  );
}
