import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { getAuthenticatedConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { HomeClient } from "@/components/home-client";
import { PendingApprovalClient } from "@/components/pending-approval-client";

async function HomeContent() {
  const { userId } = await auth();

  if (!userId) {
    return <HomeClient userId={null} userInitial={null} properties={[]} />;
  }

  const convex = await getAuthenticatedConvexClient();
  const homeData = await convex.query(api.properties.homeData);

  if (homeData.needsApproval) {
    return <PendingApprovalClient />;
  }

  const profile = homeData.profile;
  const userInitial =
    (profile?.displayName ?? profile?.email)?.trim().charAt(0).toUpperCase() ||
    null;

  return (
    <HomeClient
      userId={userId}
      userInitial={userInitial}
      properties={homeData.properties}
    />
  );
}

function LoadingState() {
  return (
    <main className="h-dvh relative overflow-hidden">
      <div className="absolute inset-0 bg-muted/30 animate-pulse" />
      <div className="absolute inset-x-0 top-0 flex items-center gap-2.5 px-4 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        <div className="h-12 flex-1 bg-muted animate-pulse rounded-full" />
        <div className="h-12 w-12 bg-muted animate-pulse rounded-full" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-52 bg-card rounded-t-[20px] border-t border-hairline" />
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
