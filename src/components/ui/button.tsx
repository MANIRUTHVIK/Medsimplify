import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none rounded-[var(--radius)] text-sm cursor-pointer select-none active:scale-[0.99]";

    const variants = {
      primary:
        "bg-primary text-primary-foreground hover:bg-primary-hover border border-transparent shadow-xs font-semibold",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary-hover border border-transparent shadow-xs font-semibold",
      outline:
        "bg-card text-foreground hover:bg-muted border border-border shadow-xs",
      danger:
        "bg-destructive text-white hover:opacity-90 border border-transparent font-medium",
      ghost:
        "text-foreground hover:bg-muted font-medium",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2.5 text-sm",
      lg: "px-6 py-3 text-base",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
