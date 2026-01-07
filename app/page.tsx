import { AppleSignInButton } from "@/components/apple-sign-in-button";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-stone-50 via-amber-50 to-orange-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-stone-900">
      <div className="flex flex-col items-center gap-16 px-6">
        <h1 className="text-7xl md:text-8xl font-light tracking-tight text-stone-800 dark:text-stone-100">
          Houses
        </h1>
        <AppleSignInButton />
      </div>
    </main>
  );
}
