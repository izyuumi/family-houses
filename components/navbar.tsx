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
}

export function Navbar({
  showBack = false,
  backHref = "/",
  title,
  showProfile = true,
}: NavbarProps) {
  const { t } = useI18n();

  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-14 shrink-0">
      <div className="w-full max-w-5xl flex justify-between items-center px-4">
        <div className="flex items-center gap-2">
          {showBack ? (
            <Link href={backHref}>
              <Button variant="ghost" size="sm" className="-ml-2">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-5 w-5" />
            </Link>
          )}
          {title && <span className="font-semibold">{title}</span>}
          {!title && !showBack && (
            <span className="font-semibold">{t.home.title}</span>
          )}
        </div>
        {showProfile && (
          <Link href="/profile">
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
}
