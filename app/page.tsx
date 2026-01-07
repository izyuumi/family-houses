import { AppleSignInButton } from "@/components/apple-sign-in-button";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-16 px-6">
        <h1 className="text-7xl md:text-8xl font-light tracking-tight">
          Houses
        </h1>
        <AppleSignInButton />
      </div>
    </main>
  );
}
