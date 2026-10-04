import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          ref={ref}
          className={cn(
            "w-full px-3.5 py-2.5 text-sm bg-card border rounded-[var(--radius)] text-foreground placeholder:text-muted-foreground transition-colors focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:bg-muted disabled:opacity-60",
            error ? "border-destructive" : "border-border",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-destructive mt-1 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
