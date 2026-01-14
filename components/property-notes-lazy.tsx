"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StickyNote } from "lucide-react";

interface PropertyNote {
  id: string;
  property_id: string;
  content: string;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  creator?: { display_name: string | null } | null;
}

interface PropertyNotesLazyProps {
  propertyId: string;
  initialNotes?: PropertyNote[];
  userId?: string;
}

function PropertyNotesSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <StickyNote className="h-4 w-4" />
          <div className="h-4 w-16 bg-muted animate-pulse rounded" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-muted/50 animate-pulse rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const PropertyNotes = dynamic(
  () => import("@/components/property-notes").then((mod) => mod.PropertyNotes),
  {
    ssr: false,
    loading: PropertyNotesSkeleton,
  }
);

export function PropertyNotesLazy({ propertyId, initialNotes, userId }: PropertyNotesLazyProps) {
  return <PropertyNotes propertyId={propertyId} initialNotes={initialNotes} userId={userId} />;
}
