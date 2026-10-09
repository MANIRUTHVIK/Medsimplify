"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Calendar,
  Trash2,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Search,
  Upload,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { formatDate, formatReportName } from "@/lib/utils";
import { deleteReportAction } from "../actions";
import { UploadQueue } from "../_components/upload-queue";
import { Select } from "@/components/ui/select";

interface ReportSummary {
  id: string;
  filename: string;
  uploadedAt: string;
  summary: string | null;
  resultsCount: number;
  abnormalCount: number;
}

interface ReportsViewProps {
  reports: ReportSummary[];
}

export function ReportsView({ reports }: ReportsViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "FLAGGED" | "NORMAL">("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "metrics" | "flagged">("newest");
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleDelete = (reportId: string, filename: string) => {
    const displayName = formatReportName(filename);
    if (!confirm(`Are you sure you want to permanently delete "${displayName}"?`)) {
      return;
    }

    startDeleteTransition(async () => {
      const res = await deleteReportAction(reportId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Failed to delete report.");
      }
    });
  };

  // Filter and sort reports
  const filteredReports = reports
    .filter((r) => {
      const displayName = formatReportName(r.filename);
      const matchesSearch =
        r.filename.toLowerCase().includes(search.toLowerCase()) ||
        displayName.toLowerCase().includes(search.toLowerCase()) ||
        (r.summary && r.summary.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === "FLAGGED" && r.abnormalCount === 0) return false;
      if (statusFilter === "NORMAL" && r.abnormalCount > 0) return false;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      }
      if (sortBy === "metrics") {
        return b.resultsCount - a.resultsCount;
      }
      if (sortBy === "flagged") {
        return b.abnormalCount - a.abnormalCount;
      }
      // default: newest
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    });

  const flaggedCount = reports.filter((r) => r.abnormalCount > 0).length;
  const normalCount = reports.filter((r) => r.abnormalCount === 0).length;

  const [showUploadZone, setShowUploadZone] = useState(false);

  if (reports.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center shadow-xs space-y-4 max-w-xl mx-auto mt-6">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/25 text-primary flex items-center justify-center mx-auto shadow-xs">
          <FileText className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">No Reports Uploaded Yet</h2>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Upload your laboratory tests (PDF, PNG, JPG, WEBP) to start extracting metrics and tracking biomarker trends.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={() => setShowUploadZone((prev) => !prev)}
            className="inline-flex items-center gap-2 px-4.5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>{showUploadZone ? "Hide Upload Zone" : "Upload Laboratory Report"}</span>
          </button>
        </div>
        {showUploadZone && (
          <div className="mt-6 text-left">
            <UploadQueue />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-xs">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight">
                All Laboratory Diagnostic Reports
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Search, filter, and review all your analyzed medical diagnostic panels
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowUploadZone((prev) => !prev)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs rounded-xl shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>{showUploadZone ? "Hide Upload Zone" : "Upload New Report"}</span>
        </button>
      </div>

      {/* Expandable Drag & Drop Upload Queue */}
      {showUploadZone && (
        <div className="transition-all animate-in fade-in slide-in-from-top-2 duration-200">
          <UploadQueue />
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports by filename or diagnostic summary..."
              className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-border bg-muted/30 focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground focus:outline-hidden transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-muted-foreground shrink-0">Sort:</span>
            <div className="w-44 sm:w-48">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                selectSize="sm"
                icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
                className="font-semibold text-xs bg-card hover:bg-muted/40 shadow-2xs"
              >
                <option value="newest">Newest Uploaded</option>
                <option value="oldest">Oldest Uploaded</option>
                <option value="flagged">Most Flagged Items</option>
                <option value="metrics">Most Parameters</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center justify-between pt-3 border-t border-border flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                  : "bg-muted/40 hover:bg-muted text-foreground border border-border"
              }`}
            >
              All Reports ({reports.length})
            </button>
            <button
              onClick={() => setStatusFilter("FLAGGED")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === "FLAGGED"
                  ? "bg-status-error text-white shadow-2xs font-bold"
                  : "bg-status-error-soft text-status-error-strong hover:bg-status-error-bg border border-status-error-border"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-status-error" />
              <span>Flagged Attention ({flaggedCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter("NORMAL")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === "NORMAL"
                  ? "bg-status-success text-white shadow-2xs font-bold"
                  : "bg-status-success-soft text-status-success-strong hover:bg-status-success-bg border border-status-success-border"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
              <span>All Normal ({normalCount})</span>
            </button>
          </div>

          <span className="text-xs text-muted-foreground font-medium">
            Showing {filteredReports.length} of {reports.length} panels
          </span>
        </div>
      </div>

      {/* Reports List Cards */}
      {filteredReports.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center shadow-xs space-y-3">
          <Search className="w-8 h-8 text-muted-foreground/40 mx-auto" />
          <h3 className="font-bold text-foreground text-sm">No Matching Reports</h3>
          <p className="text-xs text-muted-foreground">
            No lab reports matched your search &ldquo;{search}&rdquo; with the selected filter.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("ALL");
            }}
            className="text-xs text-primary font-bold hover:underline cursor-pointer"
          >
            Clear Search &amp; Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredReports.map((report) => {
            const hasFlags = report.abnormalCount > 0;
            const displayName = formatReportName(report.filename);

            return (
              <div
                key={report.id}
                className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs hover:border-primary/40 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-bold text-sm text-foreground truncate max-w-md">
                      {displayName}
                    </span>

                    {/* Status Pill */}
                    {hasFlags ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-status-error-soft text-status-error-strong border border-status-error-border">
                        <AlertTriangle className="w-3 h-3 text-status-error" />
                        <span>{report.abnormalCount} Flagged Biomarkers</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-status-success-soft text-status-success-strong border border-status-success-border">
                        <CheckCircle2 className="w-3 h-3 text-status-success" />
                        <span>All Biomarkers Normal</span>
                      </span>
                    )}

                    <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                      {report.resultsCount} Biomarkers
                    </span>
                  </div>

                  {report.summary && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pl-10.5">
                      {report.summary}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground pl-10.5 pt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      {formatDate(report.uploadedAt)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Link
                    href={`/dashboard/${report.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl shadow-xs transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <span>View Analysis</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => handleDelete(report.id, report.filename)}
                    disabled={isDeleting}
                    title="Delete report"
                    className="p-2 text-muted-foreground hover:text-status-error-strong hover:bg-status-error-soft rounded-xl transition-colors cursor-pointer border border-transparent hover:border-status-error-border disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
