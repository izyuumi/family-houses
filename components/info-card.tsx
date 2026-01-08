"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Copy, Check, Info, Wifi, MapPin } from "lucide-react";
import { WifiQRCode } from "@/components/wifi-qrcode";

interface Property {
  id: string;
  name: string;
  address: string;
  wifi_ssid: string | null;
  guest_wifi_ssid: string | null;
}

interface InfoCardProps {
  property: Property;
}

export function InfoCard({ property }: InfoCardProps) {
  const [wifiPassword, setWifiPassword] = useState<string | null>(null);
  const [guestWifiPassword, setGuestWifiPassword] = useState<string | null>(null);
  const [loadingWifi, setLoadingWifi] = useState(false);
  const [loadingGuestWifi, setLoadingGuestWifi] = useState(false);
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [copiedGuestWifi, setCopiedGuestWifi] = useState(false);

  const revealWifi = async (type: "main" | "guest") => {
    if (type === "main") {
      setLoadingWifi(true);
    } else {
      setLoadingGuestWifi(true);
    }

    const res = await fetch("/api/wifi/reveal", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ propertyId: property.id, type }),
    });
    const json = await res.json();

    if (type === "main") {
      setLoadingWifi(false);
      if (json.password !== undefined) setWifiPassword(json.password);
    } else {
      setLoadingGuestWifi(false);
      if (json.password !== undefined) setGuestWifiPassword(json.password);
    }
  };

  const copyPassword = async (password: string, type: "main" | "guest") => {
    await navigator.clipboard.writeText(password);
    if (type === "main") {
      setCopiedWifi(true);
      setTimeout(() => setCopiedWifi(false), 2000);
    } else {
      setCopiedGuestWifi(true);
      setTimeout(() => setCopiedGuestWifi(false), 2000);
    }
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
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div>
            <div className="text-muted-foreground text-xs">Address</div>
            <div>{property.address}</div>
          </div>
        </div>

        <div className="pt-3 border-t space-y-4">
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
                {wifiPassword === null ? "••••••••" : wifiPassword || "—"}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={loadingWifi || wifiPassword !== null}
                onClick={() => revealWifi("main")}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                size="sm"
                disabled={!wifiPassword}
                onClick={() => wifiPassword && copyPassword(wifiPassword, "main")}
              >
                {copiedWifi ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              {property.wifi_ssid && (
                <WifiQRCode
                  ssid={property.wifi_ssid}
                  password={wifiPassword}
                  propertyId={property.id}
                  type="main"
                  onPasswordRevealed={setWifiPassword}
                />
              )}
            </div>
          </div>

          {property.guest_wifi_ssid && (
            <div className="flex items-start gap-2">
              <Wifi className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <div className="text-muted-foreground text-xs">Guest Wi-Fi</div>
                <div className="text-sm">
                  <span className="font-medium">SSID:</span>{" "}
                  {property.guest_wifi_ssid}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Password:</span>{" "}
                  {guestWifiPassword === null ? "••••••••" : guestWifiPassword || "—"}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loadingGuestWifi || guestWifiPassword !== null}
                  onClick={() => revealWifi("guest")}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  disabled={!guestWifiPassword}
                  onClick={() => guestWifiPassword && copyPassword(guestWifiPassword, "guest")}
                >
                  {copiedGuestWifi ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <WifiQRCode
                  ssid={property.guest_wifi_ssid}
                  password={guestWifiPassword}
                  propertyId={property.id}
                  type="guest"
                  onPasswordRevealed={setGuestWifiPassword}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
