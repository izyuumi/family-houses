import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { AdminMembersClient } from "@/components/admin-members-client";

async function AdminContent() {
  const { userId } = await auth();

  if (!userId) redirect("/");

  const convex = getConvexClient();

  const profile = await convex.query(api.profiles.getByClerkId, {
    clerkId: userId,
  });

  if (profile?.role !== "admin") {
    redirect("/");
  }

  return <AdminMembersClient />;
}

function LoadingState() {
  return (
    <div className="h-dvh flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">...</div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AdminContent />
    </Suspense>
  );
}
