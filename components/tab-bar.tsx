"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, List, User } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

interface TabBarProps {
  /** When provided, the Houses tab acts as a button (e.g. expands the sheet on the map screen). */
  onListClick?: () => void;
  listActive?: boolean;
  className?: string;
}

const tabClass = (active: boolean) =>
  cn(
    "flex flex-1 flex-col items-center gap-[3px] py-1.5 touch-target",
    active ? "text-primary" : "text-muted-foreground"
  );

const labelClass = (active: boolean) =>
  cn("text-[11px] leading-none", active ? "font-semibold" : "font-medium");

export function TabBar({ onListClick, listActive = false, className }: TabBarProps) {
  const { t } = useI18n();
  const pathname = usePathname();
  const mapActive = pathname === "/" && !listActive;
  const profileActive = pathname === "/profile";

  return (
    <nav
      className={cn(
        "flex border-t border-hairline bg-card px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]",
        className
      )}
    >
      <Link href="/" className={tabClass(mapActive)}>
        <MapPin className="h-5 w-5" />
        <span className={labelClass(mapActive)}>{t.tabs.map}</span>
      </Link>
      {onListClick ? (
        <button type="button" onClick={onListClick} className={tabClass(listActive)}>
          <List className="h-5 w-5" />
          <span className={labelClass(listActive)}>{t.tabs.properties}</span>
        </button>
      ) : (
        <Link href="/?list=1" className={tabClass(false)}>
          <List className="h-5 w-5" />
          <span className={labelClass(false)}>{t.tabs.properties}</span>
        </Link>
      )}
      <Link href="/profile" className={tabClass(profileActive)}>
        <User className="h-5 w-5" />
        <span className={labelClass(profileActive)}>{t.tabs.profile}</span>
      </Link>
    </nav>
  );
}
