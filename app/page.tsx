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

  const profile = await convex.query(api.profiles.getByClerkId, {
    clerkId: userId,
  });

  if (profile && profile.approved !== true && profile.role !== "admin") {
    return <PendingApprovalClient />;
  }

  const properties = await convex.query(api.properties.list);

  return <HomeClient userId={userId} properties={properties} />;
}

function LoadingState() {
  return (
    <div className="h-dvh flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">...</div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <HomeContent />
    </Suspense>
  );
}
