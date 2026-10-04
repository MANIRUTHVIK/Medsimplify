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
    <section className="bg-card rounded-2xl p-6 border border-border shadow-xs transition-all">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-xs">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-bold text-foreground text-base tracking-tight">
              Clinical Range Distribution & Midpoint Calibration
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Biomarkers normalized to physiological standard ranges (Optimal target zone in emerald)
          </p>
        </div>

        {/* Visual Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-foreground bg-muted/40 px-3.5 py-1.5 rounded-xl border border-border">
          <span className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-400 mr-1.5" />
            <span className="text-[11px] text-muted-foreground">Low Band</span>
          </span>
          <span className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 mr-1.5" />
            <span className="text-[11px] text-muted-foreground">Normal Zone (Optimal)</span>
          </span>
          <span className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 mr-1.5" />
            <span className="text-[11px] text-muted-foreground">High Band</span>
          </span>
          <span className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-foreground bg-white mr-1.5" />
            <span className="text-[11px] text-muted-foreground">Patient Value</span>
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
                        ? "text-rose-600"
                        : isLow
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {item.value} {item.unit || ""}
                  </span>
                  {item.deviation !== null && item.deviation !== 0 ? (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                        isHigh
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {item.deviation > 0 ? `+${item.deviation}% Above Target` : `${item.deviation}% Below Normal`}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Optimal Range
                    </span>
                  )}
                </div>
              </div>

              {/* Horizontal Range Corridor */}
              <div className="relative w-full h-3.5 bg-gray-100 rounded-full overflow-hidden flex shadow-2xs">
                <div className="w-[22%] bg-amber-200/90 h-full" title="Below Normal Range" />
                <div className="w-[53%] bg-emerald-300 h-full" title="Optimal Reference Corridor" />
                <div className="w-[25%] bg-rose-200 h-full" title="Above Normal Range" />
              </div>

              {/* Marker Pin */}
              <div className="relative w-full h-2">
                <div
                  className="absolute -top-3.5 transform -translate-x-1/2 flex flex-col items-center transition-all duration-300 group-hover:scale-125"
                  style={{ left: `${pinPos}%` }}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                      isHigh
                        ? "bg-rose-600 ring-2 ring-rose-200"
                        : isLow
                        ? "bg-amber-600 ring-2 ring-amber-200"
                        : "bg-emerald-600 ring-2 ring-emerald-200"
                    }`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground mt-3 text-center italic">
        Pins indicate patient measured values. Green zones denote laboratory-validated optimal reference corridors.
      </p>
    </section>
  );
}
