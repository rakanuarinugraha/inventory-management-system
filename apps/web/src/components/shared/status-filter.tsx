"use client";

import { cn } from "@/lib/utils";

export type StatusFilterValue = "active" | "inactive" | "all";

interface StatusFilterProps {
  value: StatusFilterValue;
  onChange: (value: StatusFilterValue) => void;
  className?: string;
}

const options: { value: StatusFilterValue; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "all", label: "All" },
];

export function StatusFilter({ value, onChange, className }: StatusFilterProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-border bg-card p-1",
        className
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            value === opt.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
