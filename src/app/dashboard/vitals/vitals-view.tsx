"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  CartesianGrid,
} from "recharts";
import { VitalSeries, VitalTimelinePoint } from "../actions";
import {
  TrendingUp,
  Calendar,
  FileText,
  Upload,
  ChevronRight,
} from "lucide-react";

interface VitalsViewProps {
  series: VitalSeries[];
  totalReports: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: VitalTimelinePoint;
  }>;
}

function VitalChartTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;

  const isHigh = p.status === "High";
  const isLow = p.status === "Low";

  return (
    <div className="bg-card border border-border rounded-xl p-3 text-xs shadow-md">
      <div className="flex items-center justify-between gap-3 mb-1">
        <span className="font-bold text-secondary">{p.formattedDate}</span>
        <span
          className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
            isHigh
              ? "bg-status-error-soft text-status-error-strong border border-status-error-border"
              : isLow
              ? "bg-status-warning-soft text-status-warning-strong border border-status-warning-border"
              : "bg-status-success-soft text-status-success-strong border border-status-success-border"
          }`}
        >
          {p.status}
        </span>
      </div>
      <div className="text-sm font-extrabold text-secondary">
        {p.value} <span className="text-xs font-normal text-muted-foreground">{p.unit || ""}</span>
      </div>
      {(p.refLow !== null || p.refHigh !== null) && (
        <div className="text-[11px] text-muted-foreground mt-0.5">
          Reference: {p.refLow ?? "N/A"} – {p.refHigh ?? "N/A"} {p.unit || ""}
        </div>
      )}
      <div className="text-[10px] text-muted-foreground mt-1 truncate max-w-[200px]">
        Source: {p.filename}
      </div>
    </div>
  );
}

export function VitalsView({ series, totalReports }: VitalsViewProps) {
  const [selectedTest, setSelectedTest] = useState<string>(() => {
    // Pick the first abnormal or first available test
    const abnormal = series.find((s) => s.latestStatus !== "Normal");
    return abnormal ? abnormal.test : series[0]?.test || "";
  });

  if (series.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-10 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/25 text-primary flex items-center justify-center mx-auto shadow-xs">
          <TrendingUp className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-secondary">No Historical Vitals Recorded Yet</h2>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Upload at least one laboratory report with numeric biomarkers to unlock longitudinal vitals
          and trajectory tracking over time.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs rounded-xl shadow-xs transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Lab Report</span>
        </Link>
      </div>
    );
  }

  const activeSeries = series.find((s) => s.test === selectedTest) || series[0];
  const chartPoints = activeSeries.points;

  const isHigh = activeSeries.latestStatus === "High";
  const isLow = activeSeries.latestStatus === "Low";

  // Calculate percentage change between earliest and latest point
  const firstPoint = chartPoints[0];
  const lastPoint = chartPoints[chartPoints.length - 1];
  const delta =
    chartPoints.length > 1 && firstPoint.value > 0
      ? Math.round(((lastPoint.value - firstPoint.value) / firstPoint.value) * 100)
      : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-xs">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-secondary tracking-tight">
                Longitudinal Biomarker Vitals &amp; Trajectories
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Track chronological shifts across {totalReports} uploaded diagnostic panels
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-muted/60 hover:bg-muted text-secondary border border-border transition-colors self-start sm:self-auto cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
          <span>View Reports Archive</span>
        </Link>
      </div>

      {/* Biomarker Pill Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {series.map((s) => {
          const isSelected = s.test === selectedTest;
          const isFlagged = s.latestStatus !== "Normal";

          return (
            <button
              key={s.test}
              onClick={() => setSelectedTest(s.test)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                isSelected
                  ? "bg-secondary text-secondary-foreground border-secondary shadow-xs"
                  : "bg-card hover:bg-muted text-secondary border-border"
              }`}
            >
              <span>{s.test}</span>
              {isFlagged ? (
                <span
                  className={`w-2 h-2 rounded-full ${
                    s.latestStatus === "High" ? "bg-status-error" : "bg-status-warning"
                  }`}
                />
              ) : (
                <span className="w-2 h-2 rounded-full bg-status-success" />
              )}
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {s.points.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Trajectory Chart Card */}
      <div className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-xs space-y-6">
        {/* Metric Header & Statistics */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-bold text-secondary">
                {activeSeries.test}
              </h2>
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold ${
                  isHigh
                    ? "bg-status-error-soft text-status-error-strong border border-status-error-border"
                    : isLow
                    ? "bg-status-warning-soft text-status-warning-strong border border-status-warning-border"
                    : "bg-status-success-soft text-status-success-strong border border-status-success-border"
                }`}
              >
                Latest: {activeSeries.latestValue} {activeSeries.unit || ""} ({activeSeries.latestStatus})
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Normal Target Corridor: {activeSeries.refLow ?? "N/A"} – {activeSeries.refHigh ?? "N/A"}{" "}
              {activeSeries.unit || ""}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            {delta !== null && (
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">
                  Trajectory Delta
                </span>
                <span
                  className={`font-bold ${
                    delta > 0
                      ? isHigh
                        ? "text-status-error-strong"
                        : "text-secondary"
                      : isLow
                      ? "text-status-warning-strong"
                      : "text-secondary"
                  }`}
                >
                  {delta > 0 ? `+${delta}%` : `${delta}%`} across timeline
                </span>
              </div>
            )}
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground uppercase block font-semibold">
                Recorded Points
              </span>
              <span className="font-bold text-secondary">
                {chartPoints.length} test {chartPoints.length === 1 ? "entry" : "entries"}
              </span>
            </div>
          </div>
        </div>

        {/* Recharts Timeline Visualizer */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartPoints}
              margin={{ top: 20, right: 20, left: -10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="formattedDate"
                tick={{ fontSize: 11, fill: "var(--sidebar-muted-foreground)" }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--sidebar-muted-foreground)" }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
                domain={["auto", "auto"]}
              />
              <Tooltip content={<VitalChartTooltip />} />

              {/* Normal Corridor Reference Lines */}
              {activeSeries.refLow !== null && (
                <ReferenceLine
                  y={activeSeries.refLow}
                  stroke="var(--status-warning)"
                  strokeDasharray="4 4"
                  label={{
                    value: `Min: ${activeSeries.refLow}`,
                    fill: "var(--status-warning-strong)",
                    fontSize: 10,
                    position: "insideBottomLeft",
                  }}
                />
              )}
              {activeSeries.refHigh !== null && (
                <ReferenceLine
                  y={activeSeries.refHigh}
                  stroke="var(--status-error)"
                  strokeDasharray="4 4"
                  label={{
                    value: `Max: ${activeSeries.refHigh}`,
                    fill: "var(--status-error-strong)",
                    fontSize: 10,
                    position: "insideTopLeft",
                  }}
                />
              )}

              {/* Shaded Target Corridor if both bounds exist */}
              {activeSeries.refLow !== null && activeSeries.refHigh !== null && (
                <ReferenceArea
                  y1={activeSeries.refLow}
                  y2={activeSeries.refHigh}
                  fill="var(--status-success-bg)"
                  fillOpacity={0.6}
                />
              )}

              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--chart-1)"
                strokeWidth={3}
                dot={{
                  r: 5,
                  fill: "var(--chart-2)",
                  strokeWidth: 2,
                  stroke: "var(--card)",
                }}
                activeDot={{
                  r: 7,
                  fill: "var(--chart-1)",
                  stroke: "var(--card)",
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend & Guide */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-border gap-2 text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-status-success inline-block" />
              <span>Green Band: Target Corridor</span>
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
              <span className="w-2.5 h-0.5 bg-status-warning inline-block" />
              <span>Dashed Gold: Minimum Reference</span>
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
              <span className="w-2.5 h-0.5 bg-status-error inline-block" />
              <span>Dashed Red: Maximum Reference</span>
            </span>
          </div>

          <span className="text-[11px] text-muted-foreground">
            Values are plotted against historical report upload dates
          </span>
        </div>
      </div>

      {/* Historical Biomarker Entries Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-secondary text-sm">
              Recorded Data Points for {activeSeries.test}
            </h3>
          </div>
          <span className="text-xs text-muted-foreground font-semibold">
            {chartPoints.length} chronological recordings
          </span>
        </div>

        <div className="divide-y divide-border">
          {chartPoints.map((pt, idx) => (
            <div
              key={idx}
              className="p-3.5 flex items-center justify-between hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-secondary min-w-[110px]">
                  {pt.formattedDate}
                </span>
                <span className="text-xs text-muted-foreground truncate max-w-[200px] hidden sm:inline">
                  {pt.filename}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="font-bold text-secondary text-sm">
                    {pt.value} {pt.unit || ""}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    pt.status === "High"
                      ? "bg-status-error-soft text-status-error-strong border border-status-error-border"
                      : pt.status === "Low"
                      ? "bg-status-warning-soft text-status-warning-strong border border-status-warning-border"
                      : "bg-status-success-soft text-status-success-strong border border-status-success-border"
                  }`}
                >
                  {pt.status}
                </span>
                <Link
                  href={`/dashboard/${pt.reportId}`}
                  className="p-1.5 text-muted-foreground hover:text-secondary rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  title="View full report"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
