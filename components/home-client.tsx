"use client";

import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { useI18n } from "@/lib/i18n/context";
import { AppleSignInButton } from "@/components/apple-sign-in-button";
import { MapDashboard } from "@/components/map-dashboard";
import { Button } from "@/components/ui/button";
import { Home, List, Plus, User as UserIcon } from "lucide-react";

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

interface HomeClientProps {
  user: User | null;
  properties: Property[];
  isAdmin: boolean;
}

export function HomeClient({ user, properties, isAdmin }: HomeClientProps) {
  const { t } = useI18n();

  if (!user) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center p-8">
        <div className="flex flex-col items-center gap-16">
          <div className="flex flex-col items-center gap-4">
            <Home className="h-14 w-14 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">
              {t.home.title}
            </h1>
            <p className="text-muted-foreground text-center text-lg">{t.home.subtitle}</p>
          </div>
          <AppleSignInButton />
        </div>
      </main>
    );
  }

  return (
    <main className="h-dvh flex flex-col">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-14 shrink-0">
        <div className="w-full max-w-5xl flex justify-between items-center px-4 text-sm">
          <span className="font-semibold">{t.home.title}</span>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  {t.common.add}
                </Button>
              </Link>
            )}
            <Link href="/properties">
              <Button variant="ghost" size="sm">
                <List className="h-4 w-4 mr-1" />
                {t.common.list}
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost" size="sm">
                <UserIcon className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>
      <div className="flex-1 overflow-hidden">
        <MapDashboard properties={properties} />
      </div>
    </main>
  );
}
