import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { List, LogOut } from "lucide-react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="h-dvh flex flex-col">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-14 shrink-0">
        <div className="w-full max-w-5xl flex justify-between items-center px-4 text-sm">
          <Link href="/protected" className="font-semibold">
            Family Houses
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/properties">
              <Button variant="ghost" size="sm">
                <List className="h-4 w-4 mr-1" />
                List
              </Button>
            </Link>
            <ThemeSwitcher />
            <form action="/auth/signout" method="post">
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </nav>
      <div className="flex-1 overflow-hidden">{children}</div>
    </main>
  );
}
