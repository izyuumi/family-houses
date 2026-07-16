"use client";

import { useI18n } from "@/lib/i18n/context";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TabBar } from "@/components/tab-bar";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import {
  Globe,
  Moon,
  Sun,
  Laptop,
  LogOut,
  Users,
  Car,
  ChevronRight,
} from "lucide-react";

interface ProfileClientProps {
  email?: string;
  displayName?: string;
  isAdmin?: boolean;
}

export function ProfileClient({ email, displayName, isAdmin }: ProfileClientProps) {
  const { t, language, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pendingProfiles = useQuery(
    api.profiles.listPending,
    isAdmin ? {} : "skip"
  );
  const pendingCount = pendingProfiles?.length ?? 0;
  const pendingCarRequests = useQuery(
    api.cars.pendingRequests,
    isAdmin ? {} : "skip"
  );
  const pendingCarCount = pendingCarRequests?.length ?? 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  const initial =
    (displayName ?? email ?? "").trim().charAt(0).toUpperCase() || "?";

  return (
    <main className="h-dvh flex flex-col">
      <div className="mx-auto w-full max-w-xl flex-1 overflow-y-auto">
        <div className="px-5 pb-4 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <h1 className="text-2xl font-bold tracking-[-0.01em]">
            {t.profile.title}
          </h1>
        </div>
        <div className="flex flex-col gap-4 px-4 pb-6">
          <div className="flex items-center gap-3.5 rounded-2xl border bg-card p-4 shadow-card dark:shadow-none">
            <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              {displayName && (
                <div className="truncate text-base font-semibold">
                  {displayName}
                </div>
              )}
              {email && (
                <div className="mt-0.5 truncate text-[13px] text-muted-foreground">
                  {email}
                </div>
              )}
            </div>
          </div>

          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-3.5 rounded-2xl border bg-card px-4 py-3.5 shadow-card transition-all active:scale-[0.98] dark:shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-secondary text-primary">
                <Users className="h-[18px] w-[18px]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">
                  {t.memberManagement.title}
                </div>
                {pendingCount > 0 && (
                  <div className="mt-px text-xs text-muted-foreground">
                    {t.memberManagement.pendingApproval} · {pendingCount}
                  </div>
                )}
              </div>
              <ChevronRight className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
            </Link>
          )}

          <Link
            href="/cars"
            className="flex items-center gap-3.5 rounded-2xl border bg-card px-4 py-3.5 shadow-card transition-all active:scale-[0.98] dark:shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-secondary text-primary">
              <Car className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{t.cars.title}</div>
              {pendingCarCount > 0 && (
                <div className="mt-px text-xs text-muted-foreground">
                  {t.cars.pendingRequests} · {pendingCarCount}
                </div>
              )}
            </div>
            <ChevronRight className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
          </Link>

          <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-card dark:shadow-none">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Globe className="h-4 w-4 text-muted-foreground" />
              {t.profile.language}
            </div>
            <Segmented
              aria-label={t.profile.language}
              value={language}
              onValueChange={(v) => setLanguage(v as "en" | "ja")}
              options={[
                { value: "en", label: "English" },
                { value: "ja", label: "日本語" },
              ]}
            />
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-card dark:shadow-none">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sun className="h-4 w-4 text-muted-foreground" />
              {t.profile.theme}
            </div>
            <Segmented
              aria-label={t.profile.theme}
              value={mounted ? (theme ?? "system") : "system"}
              onValueChange={setTheme}
              options={[
                {
                  value: "light",
                  label: (
                    <>
                      <Sun /> {t.profile.light}
                    </>
                  ),
                },
                {
                  value: "dark",
                  label: (
                    <>
                      <Moon /> {t.profile.dark}
                    </>
                  ),
                },
                {
                  value: "system",
                  label: (
                    <>
                      <Laptop /> {t.profile.system}
                    </>
                  ),
                },
              ]}
            />
          </div>

          <SignOutButton>
            <Button
              variant="outline"
              className="h-12 w-full rounded-[14px] text-destructive"
            >
              <LogOut className="h-4 w-4" />
              {t.common.signOut}
            </Button>
          </SignOutButton>
        </div>
      </div>
      <TabBar className="mx-auto w-full max-w-xl shrink-0" />
    </main>
  );
}
