"use client";

import React from "react";
import { TrendingUp, Info } from "lucide-react";
import { LabResultItem } from "@/types";

interface RangeDistributionProps {
  metrics: LabResultItem[];
  selectedCategory?: string;
  onAskAboutTest: (testName: string) => void;
}

export function RangeDistribution({
  metrics,
  selectedCategory = "ALL",
  onAskAboutTest,
}: RangeDistributionProps) {
  // Filter metrics with numeric values and valid bounds
  const validMetrics = metrics.filter(
    (m) =>
      typeof m.value === "number" &&
      !isNaN(m.value) &&
      (m.refLow !== null || m.refHigh !== null)
  );

  // Filter by selected category if provided
  const displayMetrics = validMetrics.slice(0, 10);

  if (displayMetrics.length === 0) {
    return null;
  }

  // Calculate pin position along the bar (0% to 100%)
  const calculatePinPosition = (item: LabResultItem): number => {
    const val = item.value;
    const low = item.refLow;
    const high = item.refHigh;

    if (low !== null && high !== null && high > low) {
      if (val < low) {
        // In the low band (0% to 22%)
        const ratio = Math.max(0, val / low);
        return Math.min(20, Math.max(4, ratio * 20));
      } else if (val > high) {
        // In the high band (75% to 100%)
        const overRatio = Math.min(2, (val - high) / (high - low));
        return Math.min(96, 75 + overRatio * 20);
      } else {
        // In the optimal corridor (22% to 75%)
        const midRatio = (val - low) / (high - low);
        return 22 + midRatio * 53;
      }
    } else if (low !== null) {
      // Greater than low
      return val >= low ? 60 : 15;
    } else if (high !== null) {
      // Less than high
      return val <= high ? 50 : 85;
    }
    return 50;
  };

  return (
    <section className="bg-card rounded-xl p-4 md:p-5 border border-border shadow-xs transition-all">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground tracking-tight">Range Distribution</h2>
            <p className="text-[10px] text-muted-foreground">Your results compared to usual healthy ranges</p>
          </div>
        </div>

        {/* Visual Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-foreground bg-muted/40 px-3.5 py-1.5 rounded-xl border border-border">
          <span className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-400 mr-1.5" />
            <span className="text-[11px] text-muted-foreground">Lower than usual</span>
          </span>
          <span className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 mr-1.5" />
            <span className="text-[11px] text-muted-foreground">Expected range</span>
          </span>
          <span className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 mr-1.5" />
            <span className="text-[11px] text-muted-foreground">Higher than usual</span>
          </span>
          <span className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-foreground bg-white mr-1.5" />
            <span className="text-[11px] text-muted-foreground">Your result</span>
          </span>
        </div>
      </div>

      {/* Range Distribution Rows */}
      <div className="mt-4 space-y-3">
        {displayMetrics.map((item, idx) => {
          const pinPos = calculatePinPosition(item);
          const isHigh = item.status === "High";
          const isLow = item.status === "Low";
          const isNormal = item.status === "Normal";

          return (
            <div
              key={idx}
              className="group p-3 rounded-xl hover:bg-muted/40 transition-colors border border-transparent hover:border-border cursor-pointer"
              onClick={() => onAskAboutTest(item.test)}
              title="Click to query this biomarker in Clinical Copilot"
            >
              <div className="flex justify-between items-center text-xs mb-1.5">
                <div>
                  <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                    {item.test}
                  </span>
                  <span className="text-muted-foreground text-[11px] ml-2">
                    {item.refLow !== null && item.refHigh !== null
                      ? `Standard Range: ${item.refLow} – ${item.refHigh} ${item.unit || ""}`
                      : item.refHigh !== null
                      ? `Standard Target: < ${item.refHigh} ${item.unit || ""}`
                      : `Standard Target: > ${item.refLow} ${item.unit || ""}`}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`font-extrabold text-sm ${
                      isHigh
                        ? "text-status-error-strong"
                        : isLow
                        ? "text-status-warning-strong"
                        : "text-status-success-strong"
                    }`}
                  >
                    {item.value} {item.unit || ""}
                  </span>
                  {item.deviation !== null && item.deviation !== 0 ? (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                        isHigh
                          ? "bg-status-error-soft text-status-error-strong border-status-error-border"
                          : "bg-status-warning-soft text-status-warning-strong border-status-warning-border"
                      }`}
                    >
                      {item.deviation > 0 ? `+${item.deviation}%` : `${item.deviation}%`}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-status-success-soft text-status-success-strong border border-status-success-border">
                      Optimal
                    </span>
                  )}
                </div>
              </div>

              {/* Horizontal Range Corridor */}
              <div className="relative w-full h-3 bg-muted/50 rounded-full overflow-hidden flex shadow-2xs">
                <div className="w-[22%] bg-status-warning-soft h-full" title="Below Normal Range" />
                <div className="w-[53%] bg-status-success-soft h-full" title="Optimal Reference Corridor" />
                <div className="w-[25%] bg-status-error-soft h-full" title="Above Normal Range" />
              </div>

              {/* Marker Pin */}
              <div className="relative w-full h-2">
                <div
                  className="absolute -top-3 transform -translate-x-1/2 flex flex-col items-center transition-all duration-300 group-hover:scale-125"
                  style={{ left: `${pinPos}%` }}
                >
                  <div
                    className={`w-3 h-3 rounded-full border-2 border-white shadow-xs ${
                      isHigh
                        ? "bg-status-error ring-2 ring-status-error-border"
                        : isLow
                        ? "bg-status-warning ring-2 ring-status-warning-border"
                        : "bg-status-success ring-2 ring-status-success-border"
                    }`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground mt-2 text-center">
        Click any row to query that biomarker in the Clinical Copilot.
      </p>
    </section>
  );
}
