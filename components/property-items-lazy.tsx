"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

interface PropertyItem {
  id: string;
  property_id: string;
  title: string;
  bought_date: string | null;
  note: string | null;
  category: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  creator?: { display_name: string | null } | null;
}

interface PropertyItemsLazyProps {
  propertyId: string;
  initialItems?: PropertyItem[];
  userId?: string;
}

function PropertyItemsSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-4 w-4" />
          <div className="h-4 w-20 bg-muted animate-pulse rounded" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-muted/50 animate-pulse rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const PropertyItems = dynamic(
  () => import("@/components/property-items").then((mod) => mod.PropertyItems),
  {
    loading: PropertyItemsSkeleton,
  }
);

export function PropertyItemsLazy({ propertyId, initialItems, userId }: PropertyItemsLazyProps) {
  return <PropertyItems propertyId={propertyId} initialItems={initialItems} userId={userId} />;
}
