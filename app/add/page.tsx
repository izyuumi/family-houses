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

export default function AdminPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AdminContent />
    </Suspense>
  );
}
