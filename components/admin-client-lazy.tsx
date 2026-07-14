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
  apple_maps_url: string | null;
  wifi_ssid: string | null;
  wifi_password: string | null;
  guest_wifi_ssid: string | null;
  guest_wifi_password: string | null;
  mailbox_lock_combination: string | null;
  auto_lock_code: string | null;
  location_x: number | null;
  location_y: number | null;
}

interface AdminClientLazyProps {
  mode: "add" | "edit";
  property?: Property;
}

function AdminSkeleton() {
  return (
    <main className="min-h-dvh flex flex-col">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 shrink-0 pt-[env(safe-area-inset-top)]">
        <div className="w-full max-w-5xl h-14 flex justify-between items-center px-4">
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </div>
      </nav>
      <div className="flex-1 p-4 max-w-xl mx-auto w-full pb-20">
        <div className="h-4 w-48 bg-muted animate-pulse rounded mb-4" />
        <div className="space-y-4">
          <div className="h-10 bg-muted animate-pulse rounded-md" />
          <div className="h-10 bg-muted animate-pulse rounded-md" />
          <div className="h-10 bg-muted animate-pulse rounded-md" />
          <div className="h-32 bg-muted animate-pulse rounded-md" />
        </div>
      </div>
    </main>
  );
}

const AdminClient = dynamic(
  () => import("@/components/admin-client").then((mod) => mod.AdminClient),
  {
    ssr: false,
    loading: AdminSkeleton,
  }
);

export function AdminClientLazy({ mode, property }: AdminClientLazyProps) {
  return <AdminClient mode={mode} property={property} />;
}
