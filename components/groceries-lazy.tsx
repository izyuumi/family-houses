"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTodo } from "lucide-react";

interface GroceryItem {
  id: string;
  property_id: string;
  item_name: string;
  quantity: string | null;
  checked: boolean | null;
  added_by: string | null;
  completed_by: string | null;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  adder?: { display_name: string | null } | null;
  completer?: { display_name: string | null } | null;
}

interface GroceriesLazyProps {
  propertyId: string;
  initialItems?: GroceryItem[];
  userId?: string;
}

function GroceriesSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ListTodo className="h-4 w-4" />
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
            <div key={i} className="h-14 bg-muted/50 animate-pulse rounded-lg" />
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

export function GroceriesLazy({ propertyId, initialItems, userId }: GroceriesLazyProps) {
  return <Groceries propertyId={propertyId} initialItems={initialItems} userId={userId} />;
}
