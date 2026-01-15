"use client";

import { SignOutButton } from "@clerk/nextjs";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Clock, LogOut, Home } from "lucide-react";

export function PendingApprovalClient() {
  const { t, language, setLanguage } = useI18n();

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center gap-8 max-w-md text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Home className="h-14 w-14 text-primary" />
            <Clock className="h-6 w-6 text-muted-foreground absolute -bottom-1 -right-1 bg-background rounded-full p-0.5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {language === "ja" ? "承認待ち" : "Pending Approval"}
          </h1>
          <p className="text-muted-foreground">
            {language === "ja"
              ? "アカウントは管理者による承認待ちです。承認されるまでしばらくお待ちください。"
              : "Your account is pending approval from an administrator. Please wait until your account is approved."}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === "en" ? "ja" : "en")}
          >
            {language === "en" ? "日本語" : "English"}
          </Button>
        </div>

        <SignOutButton>
          <Button variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            {t.common.signOut}
          </Button>
        </SignOutButton>
      </div>
    </main>
  );
}
