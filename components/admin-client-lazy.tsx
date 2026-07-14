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
      <div className="mx-auto flex w-full max-w-xl shrink-0 items-center gap-3 px-4 pb-1 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        <div className="h-11 w-11 bg-muted animate-pulse rounded-xl" />
        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
      </div>
      <div className="mx-auto w-full max-w-xl flex-1 px-4 pb-6 pt-3">
        <div className="flex flex-col gap-4">
          <div className="h-40 bg-muted animate-pulse rounded-2xl" />
          <div className="h-64 bg-muted animate-pulse rounded-2xl" />
          <div className="h-40 bg-muted animate-pulse rounded-2xl" />
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
