"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QrCode } from "lucide-react";
import qrcode from "qrcode-generator";

export interface WifiQRCodeProps {
  ssid: string;
  password: string | null;
  propertyId: string;
  type: "main" | "guest";
  onPasswordRevealed?: (password: string) => void;
  autoOpen?: boolean;
  onClose?: () => void;
}

function escapeWifiString(str: string) {
  return str.replace(/[\\;,:\"]/g, (c) => "\\" + c);
}

function generateWifiString(ssid: string, password: string, security = "WPA") {
  return `WIFI:T:${security};S:${escapeWifiString(ssid)};P:${escapeWifiString(password)};;`;
}

function renderQRToCanvas(canvas: HTMLCanvasElement, text: string) {
  const qr = qrcode(0, "H");
  qr.addData(text);
  qr.make();

  const size = 200;
  const moduleCount = qr.getModuleCount();
  const cellSize = size / moduleCount;

  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "#000000";
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qr.isDark(row, col)) {
        ctx.fillRect(
          Math.round(col * cellSize),
          Math.round(row * cellSize),
          Math.ceil(cellSize),
          Math.ceil(cellSize)
        );
      }
    }
  }
}

export function WifiQRCode({
  ssid,
  password,
  propertyId,
  type,
  onPasswordRevealed,
  autoOpen = false,
  onClose,
}: WifiQRCodeProps) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showQR, setShowQR] = useState(autoOpen && Boolean(password));
  const [loading, setLoading] = useState(false);
  const [localPassword, setLocalPassword] = useState<string | null>(password);
  const autoOpenedRef = useRef(false);

  useEffect(() => {
    setLocalPassword(password);
  }, [password]);

  const handleOpen = useCallback(async () => {
    if (localPassword) {
      setShowQR(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/wifi/reveal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ propertyId, type }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.password) throw new Error("Missing password");
      setLocalPassword(json.password);
      onPasswordRevealed?.(json.password);
      setShowQR(true);
    } catch {
      toast.error(t.common.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [localPassword, onPasswordRevealed, propertyId, type, t]);

  useEffect(() => {
    if (!autoOpen || autoOpenedRef.current) return;
    autoOpenedRef.current = true;
    void handleOpen();
  }, [autoOpen, handleOpen]);

  useEffect(() => {
    if (!showQR || !canvasRef.current || !localPassword) return;

    const wifiString = generateWifiString(ssid, localPassword);
    renderQRToCanvas(canvasRef.current, wifiString);
  }, [showQR, ssid, localPassword]);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        disabled={loading || (autoOpen && !showQR)}
        aria-label={t.a11y.showQrCode}
      >
        <QrCode className="h-4 w-4" />
      </Button>
      <Dialog
        open={showQR}
        onOpenChange={(open) => {
          setShowQR(open);
          if (!open) onClose?.();
        }}
      >
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>{t.qrcode.title}</DialogTitle>
            <DialogDescription>{ssid}</DialogDescription>
          </DialogHeader>
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`${t.qrcode.title}: ${ssid}`}
            className="mx-auto rounded"
          />
          <p className="text-xs text-muted-foreground text-center">
            {t.qrcode.scanToConnect}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
