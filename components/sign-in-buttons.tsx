"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { AUTH_PROVIDERS } from "@/lib/auth-providers";
import { cn } from "@/lib/utils";

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.365 12.79c-.024-2.448 1.998-3.622 2.089-3.68-1.138-1.663-2.909-1.891-3.539-1.916-1.506-.152-2.94.887-3.704.887-.763 0-1.943-.865-3.194-.841-1.643.024-3.158.955-4.003 2.425-1.707 2.961-.436 7.343 1.227 9.745.813 1.176 1.783 2.497 3.057 2.45 1.226-.05 1.69-.793 3.172-.793 1.482 0 1.899.793 3.196.769 1.32-.025 2.156-1.2 2.964-2.38.933-1.366 1.317-2.688 1.34-2.756-.03-.014-2.572-.987-2.605-3.91zM13.93 5.61c.676-.819 1.132-1.957 1.008-3.09-.974.04-2.152.648-2.851 1.466-.626.724-1.174 1.883-1.027 2.993 1.086.084 2.195-.552 2.87-1.37z" />
    </svg>
  );
}

const PROVIDER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  apple: AppleLogo,
};

const PROVIDER_STYLES: Record<string, string> = {
  // Apple HIG: solid black button in light mode, white in dark mode.
  apple:
    "bg-black text-white hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/90",
};

interface SignInButtonsProps {
  /** Where to land after the OAuth round-trip completes. */
  redirectUrlComplete?: string;
}

export function SignInButtons({ redirectUrlComplete = "/" }: SignInButtonsProps) {
  const { t } = useI18n();
  const { signIn, isLoaded } = useSignIn();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const startSignIn = async (strategy: (typeof AUTH_PROVIDERS)[number]["strategy"], id: string) => {
    if (!signIn) return;
    setPendingId(id);
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete,
      });
    } catch {
      setPendingId(null);
    }
  };

  return (
    <div className="flex w-full max-w-[320px] flex-col gap-3">
      {AUTH_PROVIDERS.map((provider) => {
        const Icon = PROVIDER_ICONS[provider.id];
        return (
          <button
            key={provider.id}
            type="button"
            disabled={!isLoaded || pendingId !== null}
            onClick={() => void startSignIn(provider.strategy, provider.id)}
            className={cn(
              "flex h-[52px] w-full items-center justify-center gap-2.5 rounded-[14px] text-[15px] font-semibold transition-all active:scale-[0.98] disabled:opacity-60",
              PROVIDER_STYLES[provider.id] ??
                "border bg-card text-foreground hover:bg-muted"
            )}
          >
            {pendingId === provider.id ? (
              <Loader2 className="h-[18px] w-[18px] animate-spin" />
            ) : (
              Icon && <Icon className="h-[18px] w-[18px]" />
            )}
            {t.auth[provider.labelKey]}
          </button>
        );
      })}
    </div>
  );
}
