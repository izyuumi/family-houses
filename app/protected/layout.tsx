import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { Suspense } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="h-screen flex flex-col">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-14 shrink-0">
        <div className="w-full max-w-5xl flex justify-between items-center px-5 text-sm">
          <Link href="/" className="font-semibold">
            Family Houses
          </Link>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <Suspense>
              <AuthButton />
            </Suspense>
          </div>
        </div>
      </nav>
      <div className="flex-1 overflow-hidden p-4">
        <Suspense>{children}</Suspense>
      </div>
    </main>
  );
}
