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
    <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-lg mx-auto">
      <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
      <h2 className="text-base font-bold text-slate-900">Dashboard Error Encountered</h2>
      <p className="text-xs text-slate-600 mt-2 mb-6 leading-relaxed">
        {error.message || "An unexpected error occurred while loading your clinical records."}
      </p>
      <Button
        onClick={() => reset()}
        className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-4 py-2"
      >
        <RefreshCw className="w-3.5 h-3.5 mr-2" />
        <span>Retry Dashboard</span>
      </Button>
    </div>
  );
}
