"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function ErrorContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(searchParams.get("error"));
  }, [searchParams]);

  return (
    <>
      {error ? (
        <p className="text-sm text-muted-foreground">
          {t.error.codeError}: {error}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t.error.unspecifiedError}
        </p>
      )}
    </>
  );
}

function ErrorTitle() {
  const { t } = useI18n();
  return <CardTitle className="text-2xl">{t.error.title}</CardTitle>;
}

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <ErrorTitle />
            </CardHeader>
            <CardContent>
              <Suspense>
                <ErrorContent />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
