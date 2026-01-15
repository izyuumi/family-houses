import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getAuthenticatedConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { AdminClientLazy } from "@/components/admin-client-lazy";

async function AdminContent() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const convex = await getAuthenticatedConvexClient();
  const profile = await convex.query(api.profiles.getByClerkId, {
    clerkId: userId,
  });

  if (profile?.role !== "admin") {
    redirect("/");
  }

  return <AdminClientLazy mode="add" />;
}

function LoadingState() {
  return (
    <main className="min-h-dvh flex flex-col">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-14 shrink-0">
        <div className="w-full max-w-5xl flex justify-between items-center px-4">
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </div>
      </nav>
      <div className="flex-1 p-4 max-w-xl mx-auto w-full pb-20">
        <div className="h-4 w-48 bg-muted animate-pulse rounded mb-4" />
        <div className="space-y-4">
          <div className="h-10 bg-muted animate-pulse rounded-md" />
          <div className="h-10 bg-muted animate-pulse rounded-md" />
          <div className="h-10 bg-muted animate-pulse rounded-md" />
        </div>
      </div>
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AdminContent />
    </Suspense>
  );
}
