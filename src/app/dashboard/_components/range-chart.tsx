"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";

export interface ChartMetricItem {
  id?: string;
  test: string;
  value: number;
  unit: string | null;
  refLow: number | null;
  refHigh: number | null;
  status: string;
  deviation: number | null;
}

interface RangeChartProps {
  metrics: ChartMetricItem[];
}

interface TooltipPayloadItem {
  payload: ChartMetricItem & { normalizedValue: number };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

// Declared strictly outside render function to avoid Recharts unmount/re-render issues
function MetricChartTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0].payload;

  const statusColor =
    item.status === "High"
      ? "text-status-error-strong"
      : item.status === "Low"
      ? "text-status-warning-strong"
      : "text-status-success-strong";

  return (
    <div className="bg-card border border-border rounded-[var(--radius)] p-3 text-xs shadow-xs">
      <div className="font-semibold text-foreground mb-1">{item.test}</div>
      <div className="text-muted-foreground">
        Result: <span className="font-semibold text-foreground">{item.value} {item.unit || ""}</span>
      </div>
      <div className="text-muted-foreground">
        Reference: {item.refLow ?? "N/A"} - {item.refHigh ?? "N/A"} {item.unit || ""}
      </div>
      <div className={`font-semibold mt-1 ${statusColor}`}>
        Status: {item.status}
        {item.deviation !== null && Math.abs(item.deviation) > 0 && (
          <span className="ml-1">({item.deviation > 0 ? `+${item.deviation}%` : `${item.deviation}%`})</span>
        )}
      </div>
    </div>
  );
}

export function RangeChart({ metrics }: RangeChartProps) {
  // Take the most notable or first 8 numeric metrics that have valid bounds for visual clarity
  const chartData = metrics
    .filter((m) => typeof m.value === "number" && !isNaN(m.value))
    .slice(0, 10)
    .map((m) => {
      // Calculate normalized value relative to midpoint of reference range (100% = normal midpoint)
      let normalized = 100;
      if (m.refLow !== null && m.refHigh !== null && m.refHigh > m.refLow) {
        const mid = (m.refLow + m.refHigh) / 2;
        normalized = Math.round((m.value / mid) * 100);
      }
      return {
        ...m,
        normalizedValue: normalized,
      };
    });

  if (chartData.length === 0) {
    return null;
  }

  const getBarColor = (status: string) => {
    switch (status) {
      case "High":
        return "var(--status-error)";
      case "Low":
        return "var(--status-warning)";
      default:
        return "var(--status-success)";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-[var(--radius)] bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-xs">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <CardTitle className="text-base font-bold text-foreground tracking-tight">
              Metric Deviation & Reference Index
            </CardTitle>
          </div>
          <div className="flex items-center space-x-4 text-xs font-medium">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-status-success inline-block" />
              <span className="text-muted-foreground">Normal</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-status-warning inline-block" />
              <span className="text-muted-foreground">Low</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-status-error inline-block" />
              <span className="text-muted-foreground">High</span>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
            >
              <XAxis
                dataKey="test"
                tick={{ fontSize: 11, fill: "hsl(226, 28%, 60%)" }}
                angle={-20}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(226, 28%, 60%)" }}
                domain={[0, "auto"]}
              />
              <ReferenceLine y={100} stroke="hsl(220, 20%, 94%)" strokeDasharray="3 3" />
              <Tooltip content={<MetricChartTooltip />} />
              <Bar dataKey="normalizedValue" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell
                    key={`cell-${entry.id}`}
                    fill={getBarColor(entry.status)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2 text-center">
          Dotted line denotes 100% midpoint of clinical reference ranges. Bars reflect normalized parameter position.
        </p>
      </CardContent>
    </Card>
  );
}
