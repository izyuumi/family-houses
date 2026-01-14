"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useCurrentUser() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.profiles.current);

  return {
    isLoading: isLoading || (isAuthenticated && user === undefined),
    isAuthenticated: isAuthenticated && user !== null && user !== undefined,
    user,
  };
}
