import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { getAuthenticatedConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { HomeClient } from "@/components/home-client";
import { PendingApprovalClient } from "@/components/pending-approval-client";

async function HomeContent() {
  const { userId } = await auth();

  if (!userId) {
    return <HomeClient userId={null} properties={[]} />;
  }

  const convex = await getAuthenticatedConvexClient();
  const homeData = await convex.query(api.properties.homeData);

  if (homeData.needsApproval) {
    return <PendingApprovalClient />;
  }

  return <HomeClient userId={userId} properties={homeData.properties} />;
}

function LoadingState() {
  return (
    <main className="h-dvh flex flex-col">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 shrink-0 pt-[env(safe-area-inset-top)]">
        <div className="w-full max-w-5xl h-14 flex items-center px-4">
          <div className="h-5 w-32 bg-muted animate-pulse rounded" />
        </div>
      </nav>
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute top-4 left-4 h-10 w-28 bg-muted animate-pulse rounded-md" />
        <div className="absolute inset-0 bg-muted/30 animate-pulse" />
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <HomeContent />
    </Suspense>
  );
}
