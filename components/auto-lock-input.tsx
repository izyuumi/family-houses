"use client";

import { useI18n } from "@/lib/i18n/context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type AutoLockData =
  | { type: "digits"; value: string }
  | { type: "switchbot" };

interface AutoLockInputProps {
  value: string;
  onChange: (value: string) => void;
}

function parseAutoLockData(value: string): AutoLockData | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as AutoLockData;
  } catch {
    return null;
  }
}

function serializeAutoLockData(data: AutoLockData): string {
  return JSON.stringify(data);
}

export function AutoLockInput({ value, onChange }: AutoLockInputProps) {
  const { t } = useI18n();
  const data = parseAutoLockData(value);
  const lockType = data?.type ?? null;

  const handleTypeChange = (newType: "digits" | "switchbot" | null) => {
    if (newType === null) {
      onChange("");
    } else if (newType === "digits") {
      onChange(serializeAutoLockData({ type: "digits", value: "" }));
    } else {
      onChange(serializeAutoLockData({ type: "switchbot" }));
    }
  };

  const handleDigitsChange = (digits: string) => {
    onChange(serializeAutoLockData({ type: "digits", value: digits }));
  };

  return (
    <div className="space-y-3">
      {/* Segmented Control for Type Selection */}
      <div className="flex rounded-lg bg-muted p-1 gap-1">
        <button
          type="button"
          onClick={() => handleTypeChange("digits")}
          className={cn(
            "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all",
            lockType === "digits"
              ? "bg-card text-foreground shadow-[0_1px_3px_rgba(16,40,43,.1)] dark:bg-border"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t.form.autoLockTypeDigits}
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange("switchbot")}
          className={cn(
            "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all",
            lockType === "switchbot"
              ? "bg-card text-foreground shadow-[0_1px_3px_rgba(16,40,43,.1)] dark:bg-border"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t.form.autoLockTypeSwitchbot}
        </button>
      </div>

      {/* Digits Input */}
      {data?.type === "digits" && (
        <div className="space-y-2">
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={data.value}
            onChange={(e) => handleDigitsChange(e.target.value)}
            placeholder={t.form.autoLockDigitsPlaceholder}
            className="text-center text-lg tracking-[0.3em] font-mono"
          />
        </div>
      )}

      {/* SwitchBot Selected */}
      {data?.type === "switchbot" && (
        <div className="px-3 py-2 bg-muted/30 rounded-md border border-dashed">
          <p className="text-sm text-muted-foreground">
            {t.form.autoLockSwitchbotHint}
          </p>
        </div>
      )}

      {/* Clear Button */}
      {lockType && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleTypeChange(null)}
          className="text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4 mr-1" />
          {t.form.autoLockClear}
        </Button>
      )}
    </div>
  );
}

export function formatAutoLockForDisplay(value: string): string {
  const data = parseAutoLockData(value);
  if (!data) return "";

  if (data.type === "digits") {
    return data.value;
  }

  return "SwitchBot";
}

export function getAutoLockType(value: string): "digits" | "switchbot" | null {
  const data = parseAutoLockData(value);
  return data?.type ?? null;
}
