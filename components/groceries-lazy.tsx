"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import type { Tables } from "@/database.types";

type GroceryItem = Tables<"grocery_items">;

interface GroceriesLazyProps {
  propertyId: string;
  initialItems?: GroceryItem[];
}

function GroceriesSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingCart className="h-4 w-4" />
          <div className="h-4 w-20 bg-muted animate-pulse rounded" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 h-10 bg-muted animate-pulse rounded-md" />
          <div className="h-10 w-10 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted/50 animate-pulse rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const Groceries = dynamic(
  () => import("@/components/groceries").then((mod) => mod.Groceries),
  {
    ssr: false,
    loading: GroceriesSkeleton,
  }
);

export function GroceriesLazy({ propertyId, initialItems }: GroceriesLazyProps) {
  return <Groceries propertyId={propertyId} initialItems={initialItems} />;
}
