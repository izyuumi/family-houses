"use client";

import { SignIn } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { MapDashboardLazy } from "@/components/map-dashboard-lazy";
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
  todoCount?: number;
}

interface HomeClientProps {
  userId: string | null;
  userInitial: string | null;
  properties: Property[];
}

export function HomeClient({ userId, userInitial, properties }: HomeClientProps) {
  const { t } = useI18n();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!userId) {
    const dark = mounted && resolvedTheme === "dark";
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-7 py-10">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-secondary text-primary">
            <Home className="h-[34px] w-[34px]" strokeWidth={1.8} />
          </div>
          <h1 className="text-[28px] font-bold tracking-[-0.02em]">
            {t.home.title}
          </h1>
          <p className="text-center text-[15px] text-muted-foreground">
            {t.home.subtitle}
          </p>
        </div>
        <SignIn
          appearance={{
            variables: {
              colorPrimary: dark ? "#2fb39b" : "#17806d",
              colorBackground: dark ? "#141f20" : "#ffffff",
              colorText: dark ? "#e8f0ef" : "#10282b",
              colorTextSecondary: dark ? "#93a8a9" : "#5b7276",
              colorInputBackground: dark ? "#0d1516" : "#f6f8f7",
              colorInputText: dark ? "#e8f0ef" : "#10282b",
              borderRadius: "14px",
              fontFamily:
                "var(--font-plus-jakarta), var(--font-noto-sans-jp), sans-serif",
            },
            elements: {
              cardBox: "rounded-[20px] shadow-card border border-border",
              formButtonPrimary: "shadow-primary-btn",
            },
          }}
        />
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
    todo_count: p.todoCount ?? 0,
  }));

  return (
    <main className="h-dvh">
      <MapDashboardLazy
        properties={mappedProperties}
        userInitial={userInitial}
      />
    </main>
  );
}
