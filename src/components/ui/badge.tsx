import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "normal" | "low" | "high" | "fallback" | "neutral" | "primary" | "secondary" | "badge";
}

export function Badge({
  className,
  variant = "neutral",
  children,
  ...props
}: BadgeProps) {
  const variants = {
    normal: "bg-status-success-bg text-status-success-strong border-status-success-soft",
    low: "bg-amber-50 text-amber-900 border-amber-200",
    high: "bg-status-error-soft text-status-error-strong border-status-error/30",
    fallback: "bg-status-info-bg text-status-info-strong border-status-info-border",
    neutral: "bg-status-neutral-bg text-status-neutral-strong border-status-neutral-border",
    primary: "bg-primary text-primary-foreground border-transparent",
    secondary: "bg-secondary text-secondary-foreground border-transparent",
    badge: "bg-badge text-white border-transparent",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
