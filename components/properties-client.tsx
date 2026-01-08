"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Home, MapPin, LogOut, Map } from "lucide-react";

interface Property {
  id: string;
  name: string;
  address: string;
}

interface PropertiesClientProps {
  properties: Property[];
}

export function PropertiesClient({ properties }: PropertiesClientProps) {
  const { t } = useI18n();

  return (
    <main className="min-h-dvh p-4 max-w-xl mx-auto">
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          <h1 className="text-xl font-semibold">{t.properties.title}</h1>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <Map className="h-4 w-4" />
            </Button>
          </Link>
          <LanguageSwitcher />
          <ThemeSwitcher />
          <form action="/auth/signout" method="post">
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </header>

      <div className="mt-2 space-y-3">
        {properties.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            {t.properties.noProperties}
          </p>
        )}

        {properties.map((p: Property) => (
          <Link key={p.id} href={`/properties/${p.id}`}>
            <Card className="p-4 transition-all active:scale-[0.99] hover:border-foreground/30">
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {p.address}
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-6 text-center">
        {t.properties.adminNote}
      </p>
    </main>
  );
}
