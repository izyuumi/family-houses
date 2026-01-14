"use client";

import { useI18n } from "@/lib/i18n/context";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";
import { SignOutButton, UserButton } from "@clerk/nextjs";
import { Navbar } from "@/components/navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Moon, Sun, Laptop, LogOut, Check, Plus } from "lucide-react";

interface ProfileClientProps {
  email?: string;
  isAdmin?: boolean;
}

export function ProfileClient({ email, isAdmin }: ProfileClientProps) {
  const { t, language, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="h-dvh flex flex-col">
      <Navbar showBack backHref="/" title={t.profile.title} showProfile={false} />
      <div className="flex-1 overflow-auto p-4 max-w-xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <UserButton afterSignOutUrl="/" />
          {email && (
            <p className="text-sm text-muted-foreground">{email}</p>
          )}
        </div>

        <div className="space-y-6">
          {isAdmin && (
            <Button asChild className="w-full">
              <Link href="/add">
                <Plus className="h-4 w-4 mr-2" />
                {t.admin.addProperty}
              </Link>
            </Button>
          )}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{t.profile.language}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant={language === "en" ? "default" : "outline"}
                size="sm"
                onClick={() => setLanguage("en")}
                className="flex-1"
              >
                English
                {language === "en" && <Check className="h-4 w-4 ml-2" />}
              </Button>
              <Button
                variant={language === "ja" ? "default" : "outline"}
                size="sm"
                onClick={() => setLanguage("ja")}
                className="flex-1"
              >
                日本語
                {language === "ja" && <Check className="h-4 w-4 ml-2" />}
              </Button>
            </div>
          </Card>

          {mounted && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{t.profile.theme}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("light")}
                  className="flex-1"
                >
                  <Sun className="h-4 w-4 mr-1" />
                  {t.profile.light}
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                  className="flex-1"
                >
                  <Moon className="h-4 w-4 mr-1" />
                  {t.profile.dark}
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("system")}
                  className="flex-1"
                >
                  <Laptop className="h-4 w-4 mr-1" />
                  {t.profile.system}
                </Button>
              </div>
            </Card>
          )}

          <SignOutButton>
            <Button variant="outline" className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              {t.common.signOut}
            </Button>
          </SignOutButton>
        </div>
      </div>
    </main>
  );
}
