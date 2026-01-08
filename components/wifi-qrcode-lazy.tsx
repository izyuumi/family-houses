"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";
import type { WifiQRCodeProps } from "@/components/wifi-qrcode";

const WifiQRCode = dynamic(
  () => import("@/components/wifi-qrcode").then((mod) => mod.WifiQRCode),
  {
    ssr: false,
    loading: () => (
      <Button variant="outline" size="sm" disabled>
        <QrCode className="h-4 w-4" />
      </Button>
    ),
  }
);

export function WifiQRCodeLazy(props: WifiQRCodeProps) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <QrCode className="h-4 w-4" />
      </Button>
    );
  }

  return <WifiQRCode {...props} autoOpen onClose={() => setOpen(false)} />;
}
