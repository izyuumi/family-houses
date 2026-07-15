"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useI18n } from "@/lib/i18n/context";
import { SignInButtons } from "@/components/sign-in-buttons";
import { Button } from "@/components/ui/button";
import { Home, Loader2, MailX } from "lucide-react";
import Link from "next/link";

export function InviteClient({ token }: { token: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const invitation = useQuery(api.invitations.getByToken, { token });
  const accept = useMutation(api.invitations.accept);
  const [error, setError] = useState<string | null>(null);
  const hasAccepted = useRef(false);

  const runAccept = useCallback(() => {
    if (hasAccepted.current) return;
    hasAccepted.current = true;
    setError(null);
    accept({ token })
      .then(() => router.replace("/"))
      .catch((err) => {
        setError(err instanceof Error ? err.message : t.common.errorGeneric);
        hasAccepted.current = false;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Once signed in, the accept mutation is authoritative — attempt it even if
  // the public validity check says the invitation was used (the Clerk-webhook
  // email match may have accepted it for this same user moments ago).
  useEffect(() => {
    if (!isLoaded || !isSignedIn || invitation === undefined) return;
    runAccept();
  }, [isLoaded, isSignedIn, invitation, runAccept]);

  const shell = (children: React.ReactNode) => (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-7 py-10">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-secondary text-primary">
          <Home className="h-[34px] w-[34px]" strokeWidth={1.8} />
        </div>
        <h1 className="text-[28px] font-bold tracking-[-0.02em]">
          {t.home.title}
        </h1>
      </div>
      {children}
    </main>
  );

  if (invitation === undefined || !isLoaded) {
    return shell(
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    );
  }

  if (!invitation.valid && !isSignedIn) {
    return shell(
      <div className="flex flex-col items-center gap-4">
        <MailX className="h-6 w-6 text-muted-foreground" />
        <p className="max-w-[300px] text-center text-[15px] text-muted-foreground">
          {t.invite.invalid}
        </p>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/">{t.common.back}</Link>
        </Button>
      </div>
    );
  }

  if (!isSignedIn) {
    return shell(
      <div className="flex w-full flex-col items-center gap-6">
        <p className="max-w-[300px] text-center text-[15px] text-muted-foreground">
          {t.invite.subtitle}
        </p>
        <SignInButtons redirectUrlComplete={`/invite/${token}`} />
      </div>
    );
  }

  if (error) {
    return shell(
      <div className="flex flex-col items-center gap-4">
        <p className="max-w-[300px] text-center text-[15px] text-destructive">
          {error}
        </p>
        <Button className="rounded-xl" onClick={runAccept}>
          {t.common.retry}
        </Button>
      </div>
    );
  }

  return shell(
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <p className="text-[15px] text-muted-foreground">{t.invite.accepting}</p>
    </div>
  );
}
