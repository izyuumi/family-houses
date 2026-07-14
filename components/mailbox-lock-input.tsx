"use client";

import { useI18n } from "@/lib/i18n/context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, ArrowRight, RotateCcw, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

export type MailboxLockData =
  | { type: "digits"; value: string }
  | { type: "dial"; steps: { direction: "right" | "left"; value: string }[] };

interface MailboxLockInputProps {
  value: string;
  onChange: (value: string) => void;
}

function parseMailboxLockData(value: string): MailboxLockData | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as MailboxLockData;
  } catch {
    return null;
  }
}

function serializeMailboxLockData(data: MailboxLockData): string {
  return JSON.stringify(data);
}

export function MailboxLockInput({ value, onChange }: MailboxLockInputProps) {
  const { t } = useI18n();
  const data = parseMailboxLockData(value);
  const lockType = data?.type ?? null;

  const handleTypeChange = (newType: "digits" | "dial" | null) => {
    if (newType === null) {
      onChange("");
    } else if (newType === "digits") {
      onChange(serializeMailboxLockData({ type: "digits", value: "" }));
    } else {
      onChange(
        serializeMailboxLockData({
          type: "dial",
          steps: [{ direction: "right", value: "" }],
        })
      );
    }
  };

  const handleDigitsChange = (digits: string) => {
    onChange(serializeMailboxLockData({ type: "digits", value: digits }));
  };

  const handleStepDirectionToggle = (index: number) => {
    if (data?.type !== "dial") return;
    const newSteps = [...data.steps];
    newSteps[index] = {
      ...newSteps[index],
      direction: newSteps[index].direction === "right" ? "left" : "right",
    };
    onChange(serializeMailboxLockData({ type: "dial", steps: newSteps }));
  };

  const handleStepValueChange = (index: number, stepValue: string) => {
    if (data?.type !== "dial") return;
    const newSteps = [...data.steps];
    newSteps[index] = { ...newSteps[index], value: stepValue };
    onChange(serializeMailboxLockData({ type: "dial", steps: newSteps }));
  };

  const addStep = () => {
    if (data?.type !== "dial") return;
    const lastDirection =
      data.steps[data.steps.length - 1]?.direction ?? "right";
    const newDirection = lastDirection === "right" ? "left" : "right";
    onChange(
      serializeMailboxLockData({
        type: "dial",
        steps: [...data.steps, { direction: newDirection, value: "" }],
      })
    );
  };

  const removeStep = (index: number) => {
    if (data?.type !== "dial" || data.steps.length <= 1) return;
    const newSteps = data.steps.filter((_, i) => i !== index);
    onChange(serializeMailboxLockData({ type: "dial", steps: newSteps }));
  };

  const formattedPreview =
    data &&
    formatMailboxLockForDisplayLocalized(
      value,
      t.form.mailboxLockRight,
      t.form.mailboxLockLeft
    );

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
          {t.form.mailboxLockTypeDigits}
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange("dial")}
          className={cn(
            "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all",
            lockType === "dial"
              ? "bg-card text-foreground shadow-[0_1px_3px_rgba(16,40,43,.1)] dark:bg-border"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t.form.mailboxLockTypeDial}
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
            placeholder={t.form.mailboxLockDigitsPlaceholder}
            className="text-center text-lg tracking-widest font-mono"
          />
        </div>
      )}

      {/* Dial Steps */}
      {data?.type === "dial" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {data.steps.map((step, index) => (
              <div key={index} className="contents">
                {/* Arrow between steps */}
                {index > 0 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}

                {/* Step Card */}
                <div className="flex items-center gap-1.5 rounded-xl border bg-background px-2 py-1.5">
                  {/* Direction Toggle Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStepDirectionToggle(index)}
                    className={cn(
                      "h-8 px-2 gap-1 font-medium",
                      step.direction === "right"
                        ? "text-primary"
                        : "text-dial-left"
                    )}
                  >
                    {step.direction === "right" ? (
                      <RotateCw className="h-4 w-4" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                    <span className="min-w-[2rem]">
                      {step.direction === "right"
                        ? t.form.mailboxLockRight
                        : t.form.mailboxLockLeft}
                    </span>
                  </Button>

                  {/* Number Input */}
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={step.value}
                    onChange={(e) => handleStepValueChange(index, e.target.value)}
                    placeholder="0"
                    className="w-14 h-8 text-center font-mono text-base"
                    aria-label={`${t.form.mailboxLockCombination} ${index + 1}`}
                  />

                  {/* Remove Button */}
                  {data.steps.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStep(index)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      aria-label={`${t.a11y.removeStep} ${index + 1}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {/* Add Step Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStep}
              className="h-8 gap-1"
              aria-label={t.a11y.addStep}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Live Preview */}
      {formattedPreview && (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-md border border-dashed">
          <span className="text-xs text-muted-foreground shrink-0">
            {t.form.mailboxLockPreview}
          </span>
          <span className="font-mono text-sm">{formattedPreview}</span>
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
          {t.form.mailboxLockClear}
        </Button>
      )}
    </div>
  );
}

export function formatMailboxLockForDisplay(value: string): string {
  const data = parseMailboxLockData(value);
  if (!data) return "";

  if (data.type === "digits") {
    return data.value;
  }

  return data.steps
    .map((step, index) => {
      const dir = step.direction === "right" ? "R" : "L";
      return `${index > 0 ? " \u2192 " : ""}${dir}${step.value}`;
    })
    .join("");
}

export function formatMailboxLockForDisplayLocalized(
  value: string,
  rightLabel: string,
  leftLabel: string
): string {
  const data = parseMailboxLockData(value);
  if (!data) return "";

  if (data.type === "digits") {
    return data.value;
  }

  return data.steps
    .map((step, index) => {
      const dir = step.direction === "right" ? rightLabel : leftLabel;
      return `${index > 0 ? " \u2192 " : ""}${dir}${step.value}`;
    })
    .join("");
}
