"use client";

import { useEffect, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { BatteryLow, CircleAlert, Loader2, Lock, LockKeyhole, LockOpen, RefreshCw } from "lucide-react";

type LockDevice = {
  _id: string;
  propertyId: string;
  label: string;
  lockState?: string;
  doorState?: string;
  battery?: number;
  canControl: boolean;
};

export function lockStateLabel(
  device: Pick<LockDevice, "lockState" | "doorState">,
  t: ReturnType<typeof useI18n>["t"]
) {
  const locked = device.lockState === "lock" || device.lockState === "latchBoltLocked";
  if (device.lockState === "jammed") return t.locks.jammed;
  if (device.lockState === "unlock") return device.doorState === "open" ? t.locks.unlockedDoorOpen : t.locks.unlocked;
  if (locked) return device.doorState === "open" ? t.locks.lockedDoorOpen : t.locks.lockedDoorClosed;
  return t.locks.unknown;
}

export function LockControl({
  device,
  size = "default",
  onStateChange,
}: {
  device: LockDevice;
  size?: "default" | "compact";
  onStateChange?: () => void;
}) {
  const { t } = useI18n();
  const sendCommand = useAction(api.switchbot.sendLockCommand);
  const refreshStatus = useAction(api.switchbot.refreshPropertyStatus);
  const [pending, setPending] = useState(false);
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [keyboardConfirm, setKeyboardConfirm] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isUnlocked = device.lockState === "unlock";
  const isLocked = device.lockState === "lock" || device.lockState === "latchBoltLocked";
  const isJammed = device.lockState === "jammed";
  const isKnown = Boolean(device.lockState);

  const clearHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (progressTimer.current) clearInterval(progressTimer.current);
    holdTimer.current = null;
    progressTimer.current = null;
    setHolding(false);
    setProgress(0);
  };
  useEffect(() => () => {
    clearHold();
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
  }, []);

  const command = async (value: "lock" | "unlock") => {
    if (!device.canControl || pending) return;
    clearHold();
    setKeyboardConfirm(false);
    setPending(true);
    try {
      await sendCommand({ deviceDbId: device._id as never, command: value });
      onStateChange?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.common.errorGeneric);
    } finally {
      setPending(false);
    }
  };

  const beginHold = () => {
    if (!isLocked || reducedMotion || pending || !device.canControl) return;
    setHolding(true);
    const started = Date.now();
    progressTimer.current = setInterval(() => setProgress(Math.min(100, ((Date.now() - started) / 800) * 100)), 16);
    holdTimer.current = setTimeout(() => void command("unlock"), 800);
  };
  const keyboardUnlock = () => {
    if (!keyboardConfirm) {
      setKeyboardConfirm(true);
      confirmTimer.current = setTimeout(() => setKeyboardConfirm(false), 3000);
      return;
    }
    void command("unlock");
  };
  const refresh = async () => {
    try {
      await refreshStatus({ propertyId: device.propertyId as never });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.common.errorGeneric);
    }
  };
  const Icon = isJammed ? CircleAlert : isUnlocked || keyboardConfirm ? LockOpen : isKnown ? Lock : LockKeyhole;
  const circle = 94;

  if (!device.canControl) {
    return <span className="text-xs font-medium text-muted-foreground">{lockStateLabel(device, t)}</span>;
  }
  return (
    <div className={cn("relative flex items-center gap-2", size === "compact" && "justify-end")}>
      {device.battery !== undefined && device.battery <= 25 && (
        <BatteryLow className={cn("h-4 w-4", device.battery <= 10 ? "text-destructive" : "text-[hsl(var(--dial-left))]")} aria-label={`${t.locks.battery}: ${device.battery}%`} />
      )}
      <div className="relative">
        {holding && (
          <svg className="pointer-events-none absolute -inset-1 h-[calc(100%+8px)] w-[calc(100%+8px)] -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
            <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary/20" />
            <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray={`${(progress / 100) * circle} ${circle}`} className="text-primary" />
          </svg>
        )}
        <Button
          type="button"
          size={size === "compact" ? "icon" : "default"}
          variant={isUnlocked || isJammed || !isKnown ? "outline" : "default"}
          disabled={pending}
          aria-live="polite"
          aria-label={pending ? t.locks.unlocking : keyboardConfirm ? t.locks.pressAgain : isUnlocked ? t.locks.lock : isJammed ? t.common.retry : !isKnown ? t.common.retry : t.locks.unlock}
          className={cn(
            "relative z-[1] rounded-xl",
            size === "compact" ? "h-10 w-10" : "h-12 min-w-32",
            isUnlocked && "border-[hsl(var(--dial-left))] text-[hsl(var(--dial-left))] hover:bg-[hsl(var(--dial-left))]/10",
            keyboardConfirm && "ring-2 ring-primary/40",
            isJammed && "border-destructive text-destructive hover:bg-destructive/10"
          )}
          onPointerDown={isLocked ? beginHold : undefined}
          onPointerUp={isLocked ? clearHold : undefined}
          onPointerCancel={isLocked ? clearHold : undefined}
          onClick={() => {
            if (!isKnown || isJammed) void refresh();
            else if (isUnlocked) void command("lock");
            // Reduced motion disables the hold gesture; fall back to the
            // same two-step confirm used for keyboard activation.
            else if (isLocked && reducedMotion) keyboardUnlock();
          }}
          onKeyDown={(event) => {
            if (!isLocked || (event.key !== "Enter" && event.key !== " ")) return;
            event.preventDefault();
            keyboardUnlock();
          }}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : !isKnown || isJammed ? <RefreshCw className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
          {size === "default" && <span>{pending ? t.locks.unlocking : keyboardConfirm ? t.locks.pressAgain : isUnlocked ? t.locks.lock : isJammed ? t.common.retry : !isKnown ? t.common.retry : t.locks.unlock}</span>}
        </Button>
      </div>
      <span className="sr-only" aria-live="assertive">{keyboardConfirm ? t.locks.pressAgain : ""}</span>
    </div>
  );
}
