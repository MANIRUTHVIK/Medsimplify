import React from "react";
import { Activity, CheckCircle, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

interface MetricsSummaryProps {
  stats: {
    total: number;
    normal: number;
    low: number;
    high: number;
  };
}

export function MetricsSummary({ stats }: MetricsSummaryProps) {
  const abnormal = stats.low + stats.high;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* Total Parameters */}
      <div className="bg-card border border-border hover:border-primary/40 rounded-[var(--radius)] p-5 shadow-xs transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Evaluated
          </span>
          <div className="w-8 h-8 rounded-[var(--radius)] bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-xs">
            <Activity className="w-4 h-4 text-primary" />
          </div>
        </div>
        <div className="text-2xl font-bold text-foreground mt-2.5">{stats.total}</div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {abnormal > 0 ? `${abnormal} flagged outside range` : "All within range"}
        </p>
      </div>

      {/* Normal */}
      <div className="bg-card border border-border rounded-[var(--radius)] p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-status-success-strong">
            Optimal (Normal)
          </span>
          <CheckCircle className="w-4 h-4 text-status-success" />
        </div>
        <div className="text-2xl font-bold text-status-success mt-2.5">{stats.normal}</div>
        <p className="text-[11px] text-muted-foreground mt-0.5">Within reference bounds</p>
      </div>

      {/* Below Reference (Low) */}
      <div className="bg-card border border-border rounded-[var(--radius)] p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
            Below Reference (Low)
          </span>
          <ArrowDownCircle className="w-4 h-4 text-amber-600" />
        </div>
        <div className="text-2xl font-bold text-amber-700 mt-2.5">{stats.low}</div>
        <p className="text-[11px] text-muted-foreground mt-0.5">Under expected minimum</p>
      </div>

      {/* Above Reference (High) */}
      <div className="bg-card border border-border rounded-[var(--radius)] p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-status-error-strong">
            Above Reference (High)
          </span>
          <ArrowUpCircle className="w-4 h-4 text-status-error" />
        </div>
        <div className="text-2xl font-bold text-status-error mt-2.5">{stats.high}</div>
        <p className="text-[11px] text-muted-foreground mt-0.5">Over expected maximum</p>
      </div>
    </div>
  );
}
