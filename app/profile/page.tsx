import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getAuthenticatedConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { ProfileClient } from "@/components/profile-client";

async function ProfileContent() {
  const { userId } = await auth();

  if (!userId) redirect("/");

  const user = await currentUser();
  const convex = await getAuthenticatedConvexClient();

  const profile = await convex.query(api.profiles.getByClerkId, {
    clerkId: userId,
  });
  const isAdmin = profile?.role === "admin";
  const email = user?.primaryEmailAddress?.emailAddress;
  const displayName = profile?.displayName ?? user?.fullName ?? undefined;

  return (
    <ProfileClient email={email} displayName={displayName} isAdmin={isAdmin} />
  );
}

function LoadingState() {
  return (
    <div className="h-dvh flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">...</div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ProfileContent />
    </Suspense>
  );
}
