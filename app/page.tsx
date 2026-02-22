import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { getAuthenticatedConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { HomeClient } from "@/components/home-client";
import { PendingApprovalClient } from "@/components/pending-approval-client";
import { PropertyListSkeleton } from "@/components/property-skeleton";

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

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
          <PropertyListSkeleton />
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
