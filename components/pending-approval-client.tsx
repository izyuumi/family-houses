"use client";

import { SignOutButton } from "@clerk/nextjs";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Clock, LogOut, Home } from "lucide-react";

export function PendingApprovalClient() {
  const { t, language, setLanguage } = useI18n();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-7 p-7 text-center">
      <div className="relative">
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-secondary text-primary">
          <Home className="h-[34px] w-[34px]" strokeWidth={1.8} />
        </div>
        <div className="absolute -bottom-1.5 -right-1.5 flex rounded-full border bg-card p-[5px] text-muted-foreground">
          <Clock className="h-4 w-4" />
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        <h1 className="text-[22px] font-bold tracking-[-0.01em]">
          {t.pendingApproval.title}
        </h1>
        <p className="max-w-[280px] text-sm leading-[1.8] text-muted-foreground">
          {t.pendingApproval.body}
        </p>
      </div>
      <div className="flex gap-2.5">
        <Button
          variant="outline"
          className="rounded-[14px] px-[18px] text-[13px]"
          onClick={() => setLanguage(language === "en" ? "ja" : "en")}
        >
          {language === "en" ? "日本語" : "English"}
        </Button>
        <SignOutButton>
          <Button
            variant="outline"
            className="rounded-[14px] px-[18px] text-[13px] text-muted-foreground"
          >
            <LogOut className="h-[15px] w-[15px]" />
            {t.common.signOut}
          </Button>
        </SignOutButton>
      </div>
    </main>
  );
}
