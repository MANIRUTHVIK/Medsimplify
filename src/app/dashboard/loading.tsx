import React from "react";
import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-6 animate-pulse">
        {/* Skeleton Header */}
        <div className="bg-card border border-border rounded-xl p-5 h-28 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>Loading clinical records...</span>
          </div>
        </div>

        {/* Skeleton Upload Card */}
        <div className="bg-card border border-border rounded-xl p-6 h-48" />

        {/* Skeleton Table */}
        <div className="bg-card border border-border rounded-xl p-6 h-64" />
      </div>
    </div>
  );
}
