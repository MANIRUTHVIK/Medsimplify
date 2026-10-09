"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex items-start justify-center">
      <div className="bg-card border border-border rounded-xl p-8 text-center max-w-lg w-full shadow-xs mt-16">
        <AlertCircle className="w-10 h-10 text-status-error mx-auto mb-3" />
        <h2 className="text-base font-bold text-foreground">Dashboard Error Encountered</h2>
        <p className="text-xs text-muted-foreground mt-2 mb-6 leading-relaxed">
          {error.message || "An unexpected error occurred while loading your clinical records."}
        </p>
        <Button
          onClick={() => reset()}
          className="bg-primary hover:bg-primary-hover text-primary-foreground text-xs px-4 py-2"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-2" />
          <span>Retry Dashboard</span>
        </Button>
      </div>
    </div>
  );
}
