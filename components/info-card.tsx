"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Copy, Check, Info, Wifi, MapPin, StickyNote } from "lucide-react";

interface Property {
  id: string;
  name: string;
  address: string;
  notes: string | null;
  wifi_ssid: string | null;
}

interface InfoCardProps {
  property: Property;
}

export function InfoCard({ property }: InfoCardProps) {
  const [wifi, setWifi] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const revealWifi = async () => {
    setLoading(true);
    const res = await fetch("/api/wifi/reveal", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ propertyId: property.id }),
    });
    const json = await res.json();
    setLoading(false);
    if (json.password !== undefined) setWifi(json.password);
  };

  const copyWifi = async () => {
    if (!wifi) return;
    await navigator.clipboard.writeText(wifi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Info className="h-4 w-4" />
          Property Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <div className="text-muted-foreground text-xs">Address</div>
              <div>{property.address}</div>
            </div>
          </div>

          {property.notes && (
            <div className="flex items-start gap-2">
              <StickyNote className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <div className="text-muted-foreground text-xs">Notes</div>
                <div className="whitespace-pre-wrap">{property.notes}</div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 border-t">
          <div className="flex items-start gap-2">
            <Wifi className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <div className="text-muted-foreground text-xs">Wi-Fi</div>
              <div className="text-sm">
                <span className="font-medium">SSID:</span>{" "}
                {property.wifi_ssid || "—"}
              </div>
              <div className="text-sm">
                <span className="font-medium">Password:</span>{" "}
                {wifi === null ? "••••••••" : wifi || "—"}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={loading || wifi !== null}
                onClick={revealWifi}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                size="sm"
                disabled={!wifi}
                onClick={copyWifi}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
