"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import { FileText, Calendar, Trash2, ArrowRight, AlertTriangle } from "lucide-react";
import { deleteReportAction } from "../actions";
import { formatDate, formatReportName } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface ReportSummary {
  id: string;
  filename: string;
  uploadedAt: string;
  summary: string | null;
  resultsCount: number;
  abnormalCount: number;
}

interface ReportsListProps {
  reports: ReportSummary[];
}

export function ReportsList({ reports }: ReportsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (reportId: string, filename: string) => {
    const displayName = formatReportName(filename);
    if (!confirm(`Are you sure you want to permanently delete "${displayName}"?`)) return;

    startTransition(async () => {
      const res = await deleteReportAction(reportId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Failed to delete report.");
      }
    });
  };

  if (reports.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-10 text-center shadow-xs">
        <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
        <h4 className="text-base font-bold text-foreground">No reports uploaded yet</h4>
        <p className="text-xs text-muted-foreground mt-1.5 max-w-sm mx-auto leading-relaxed">
          Upload your laboratory reports above to automatically extract metrics and review clinical interpretations.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground tracking-tight">Recent Lab Reports</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Access and query your historical health tests</p>
        </div>
        <span className="text-xs font-semibold bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full">
          {reports.length} Total
        </span>
      </div>

      <div className="divide-y divide-border">
        {reports.map((report) => {
          const displayName = formatReportName(report.filename);

          return (
            <div
              key={report.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-semibold text-sm text-foreground truncate">
                    {displayName}
                  </span>
                  {report.abnormalCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-status-error-soft text-status-error-strong border border-status-error-border px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3 text-status-error" />
                      {report.abnormalCount} flagged
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    {formatDate(report.uploadedAt)}
                  </span>
                  <span>•</span>
                  <span>{report.resultsCount} lab metrics analyzed</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <Link
                  href={`/dashboard/${report.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl shadow-xs transition-all active:scale-[0.99]"
                >
                  <span>View Breakdown</span>
                  <ArrowRight className="w-3.5 h-3.5 text-primary-foreground" />
                </Link>

                <button
                  onClick={() => handleDelete(report.id, report.filename)}
                  disabled={isPending}
                  className="p-2 text-muted-foreground hover:text-status-error-strong hover:bg-status-error-soft rounded-xl transition-colors cursor-pointer border border-transparent hover:border-status-error-border disabled:opacity-50"
                  title="Delete report"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
