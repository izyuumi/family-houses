import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, ListTodo, StickyNote, Package } from "lucide-react";

function CardSkeleton({ icon: Icon, width }: { icon: typeof Info; width: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4" />
          <div className={`h-4 ${width} bg-muted animate-pulse rounded`} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-4 w-full bg-muted animate-pulse rounded" />
        <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
      </CardContent>
    </Card>
  );
}

export default function Loading() {
  return (
    <main className="min-h-dvh flex flex-col">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-14 shrink-0">
        <div className="w-full max-w-5xl flex justify-between items-center px-4">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        </div>
      </nav>
      <div className="flex-1 overflow-auto p-4 max-w-xl mx-auto w-full pb-20">
        <div className="h-4 w-48 bg-muted animate-pulse rounded mb-4" />
        <div className="space-y-6">
          <CardSkeleton icon={Info} width="w-24" />
          <CardSkeleton icon={ListTodo} width="w-20" />
          <CardSkeleton icon={StickyNote} width="w-16" />
          <CardSkeleton icon={Package} width="w-20" />
        </div>
      </div>
    </main>
  );
}
