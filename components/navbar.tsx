"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Home, User } from "lucide-react";

interface NavbarProps {
  showBack?: boolean;
  backHref?: string;
  title?: string;
  showProfile?: boolean;
  action?: React.ReactNode;
}

export function Navbar({
  showBack = false,
  backHref = "/",
  title,
  showProfile = true,
  action,
}: NavbarProps) {
  const { t } = useI18n();

  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 shrink-0 pt-[env(safe-area-inset-top)]">
      <div className="w-full max-w-5xl h-14 flex justify-between items-center gap-2 px-4">
        <div className="flex items-center gap-2 min-w-0">
          {showBack ? (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="-ml-2"
              aria-label={t.common.back}
            >
              <Link href={backHref}>
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-2"
              aria-label={t.home.title}
            >
              <Home className="h-5 w-5" />
            </Link>
          )}
          {title && <span className="font-semibold truncate">{title}</span>}
          {!title && !showBack && (
            <span className="font-semibold">{t.home.title}</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {action}
          {showProfile && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              aria-label={t.a11y.openProfile}
            >
              <Link href="/profile">
                <User className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
