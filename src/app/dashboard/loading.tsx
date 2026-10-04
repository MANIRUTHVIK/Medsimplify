import React from "react";
import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Skeleton Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 h-28 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
          <span>Loading clinical records...</span>
        </div>
      </div>

      {/* Skeleton Upload Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 h-48" />

      {/* Skeleton Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 h-64" />
    </div>
  );
}
