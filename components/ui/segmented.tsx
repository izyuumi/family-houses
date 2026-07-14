"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

interface SegmentedProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: SegmentedOption<T>[];
  className?: string;
  "aria-label"?: string;
}

export function Segmented<T extends string>({
  value,
  onValueChange,
  options,
  className,
  "aria-label": ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "flex rounded-lg bg-muted p-1 dark:bg-background",
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onValueChange(option.value)}
          className={cn(
            "touch-target flex h-[38px] flex-1 items-center justify-center gap-1.5 rounded-[9px] text-[13px] font-semibold transition-all duration-150 motion-reduce:transition-none [&_svg]:size-3.5 [&_svg]:shrink-0",
            value === option.value
              ? "bg-card text-foreground shadow-[0_1px_3px_rgba(16,40,43,.1)] dark:bg-border"
              : "text-muted-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
