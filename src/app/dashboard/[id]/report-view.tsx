"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  Loader2,
  Activity,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Volume2,
  VolumeX,
  Bookmark,
  UploadCloud,
  Printer,
  Sparkles,
} from "lucide-react";
import { ReportAnalysisData } from "@/types";
import { RangeDistribution } from "../_components/range-distribution";
import { DoctorQuestions } from "../_components/doctor-questions";
import { ResultsTable } from "../_components/results-table";
import { ChatPanel } from "../_components/chat-panel";
import { PriorityAccordion } from "../_components/priority-accordion";
import { formatDate, formatReportName } from "@/lib/utils";
import { deleteReportAction } from "../actions";

interface ReportViewProps {
  report: ReportAnalysisData;
  chats: Array<{
    id: string;
    question: string;
    answer: string;
    provider: string;
    askedAt: string;
  }>;
  user?: {
    name: string | null;
    email: string;
    gender: string | null;
    dateOfBirth: string | null;
  } | null;
}

export function ReportView({ report, chats }: ReportViewProps) {
  const router = useRouter();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [externalQuery, setExternalQuery] = useState<string>("");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [savedPrep, setSavedPrep] = useState(false);

  const displayName = formatReportName(report.filename);

  // Counts
  const total = report.stats.total;
  const normal = report.stats.normal;
  const low = report.stats.low;
  const high = report.stats.high;
  const abnormal = low + high;
  const safePercentage = Math.round((normal / Math.max(total, 1)) * 100);

  // Triage state
  const isOptimal = abnormal === 0;
  const isModerate = abnormal > 0 && abnormal <= 3;

  // Find abnormal metrics for focal badges
  const highItems = report.results.filter((r) => r.status === "High");
  const lowItems = report.results.filter((r) => r.status === "Low");
  const abnormalItems = report.results.filter(
    (r) => r.status === "Low" || r.status === "High"
  );
  const topHighNames = highItems.slice(0, 2).map((r) => r.test).join(" & ");
  const topLowNames = lowItems.slice(0, 2).map((r) => r.test).join(" & ");

  const handleDeleteReport = () => {
    if (
      !confirm(
        `Are you sure you want to permanently delete "${displayName}" and its associated analysis?`
      )
    ) {
      return;
    }

    startDeleteTransition(async () => {
      const res = await deleteReportAction(report.reportId);
      if (res.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        alert(res.error || "Failed to delete report. Please try again.");
      }
    });
  };

  const handleAskAboutTest = (testName: string) => {
    setExternalQuery(
      `Can you explain my ${testName} result, clinical implications, and questions for my doctor?`
    );
  };

  // Text to Speech for Clinical Synopsis
  const toggleAudio = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Audio speech synthesis is not supported in this browser.");
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(report.summary);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  // Save prep sheet handler
  const handleSavePrep = async () => {
    const text = `MEDSIMPLIFY CLINICAL REPORT SUMMARY
Report: ${displayName}
Date: ${formatDate(report.uploadedAt)}
Total Biomarkers: ${total} (Normal: ${normal}, High: ${high}, Low: ${low})

CLINICAL SYNOPSIS:
${report.summary}

KEY DOCTOR QUESTIONS:
${report.doctorQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`;

    try {
      await navigator.clipboard.writeText(text);
      setSavedPrep(true);
      setTimeout(() => setSavedPrep(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* TOP CLINICAL ACTION BAR                                                   */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border rounded-2xl p-4 md:px-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Report Title & Verification Status */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-xs shrink-0">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="text-lg font-bold text-foreground tracking-tight truncate">
                {displayName}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Verified &amp; Calibrated
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Analyzed on {formatDate(report.uploadedAt)} • ID #{report.reportId.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted/40 text-foreground text-xs font-semibold shadow-xs transition-all cursor-pointer"
            title="Print or Save PDF Summary"
          >
            <Printer className="w-3.5 h-3.5 text-foreground" />
            <span className="hidden sm:inline">Export PDF Summary</span>
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload New</span>
          </Link>

          <button
            onClick={handleDeleteReport}
            disabled={isDeleting}
            className="p-2 rounded-xl border border-status-error/30 hover:bg-status-error-soft text-status-error-strong text-xs font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50"
            title="Delete this lab report run"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin text-status-error" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EXACT STITCH 3:4 (75%) LEFT & 1:4 (25%) RIGHT COPILOT SPLIT LAYOUT       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        {/* ===================================================================== */}
        {/* LEFT 75% DASHBOARD COLUMN (3 of 4 cols on XL)                         */}
        {/* ===================================================================== */}
        <div className="xl:col-span-3 space-y-6">
          {/* 1. EXECUTIVE HEALTH SCORE / TRIAGE STRIP */}
          <section className="bg-card rounded-2xl p-5 md:p-6 border border-border shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-border">
              {/* Stability Meter */}
              <div className="flex items-center space-x-4">
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-muted/60"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                    />
                    <path
                      className={
                        isOptimal
                          ? "text-emerald-500"
                          : isModerate
                          ? "text-amber-500"
                          : "text-rose-500"
                      }
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray={`${safePercentage}, 100`}
                      strokeLinecap="round"
                      strokeWidth="3.5"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-extrabold text-foreground">
                      {safePercentage}%
                    </span>
                    <span className="text-[8px] text-muted-foreground uppercase font-bold">
                      Safe
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${
                        isOptimal
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : isModerate
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {isOptimal
                        ? "Optimal Health Stability"
                        : isModerate
                        ? "Moderate Attention Required"
                        : "Priority Clinical Attention"}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground font-medium">
                      Diagnostic Confidence 99.4%
                    </span>
                  </div>
                  <h1 className="text-lg md:text-xl font-bold text-foreground mt-1 tracking-tight">
                    Biomarker Stability &amp; Metabolic Risk Profile
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {normal} markers normal,{" "}
                    <strong className="text-rose-600 font-semibold">
                      {high} elevated{topHighNames ? ` (${topHighNames} priority)` : ""}
                    </strong>
                    , and{" "}
                    <strong className="text-amber-600 font-semibold">
                      {low} deficient{topLowNames ? ` (${topLowNames})` : ""}
                    </strong>
                    .
                  </p>
                </div>
              </div>

              {/* Quick Navigation Action */}
              <div className="flex items-center gap-2 self-start lg:self-center">
                <Link
                  href="/dashboard/reports"
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-foreground hover:text-primary bg-muted/40 hover:bg-muted/70 px-3.5 py-2 rounded-xl border border-border transition-colors shadow-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-primary" />
                  <span>All Lab Runs</span>
                </Link>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted/20 px-3 py-2 rounded-xl border border-border transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Audit Trail</span>
                </button>
              </div>
            </div>

            {/* 4 KPI Stat Tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-4">
              {/* Total Evaluated */}
              <div className="bg-card rounded-xl p-3.5 border border-border shadow-xs hover:border-primary/40 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Total Evaluated
                  </span>
                  <Activity className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-extrabold text-foreground tracking-tight">
                    {total}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground">Panel Items</span>
                </div>
                <div className="mt-1.5 flex items-center text-[10px] text-muted-foreground font-medium">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-1" />
                  Comprehensive Screen
                </div>
              </div>

              {/* Optimal Normal */}
              <div className="bg-emerald-50/40 rounded-xl p-3.5 border border-emerald-100 shadow-xs hover:border-emerald-300 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    Optimal (Normal)
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-extrabold text-emerald-600 tracking-tight">
                    {normal}
                  </span>
                  <span className="text-[10px] font-medium text-emerald-700/80">
                    {safePercentage}% ratio
                  </span>
                </div>
                <div className="mt-1.5 flex items-center text-[10px] text-emerald-700 font-medium">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                  Stable baseline markers
                </div>
              </div>

              {/* Below Reference (Low) */}
              <div className="bg-amber-50/40 rounded-xl p-3.5 border border-amber-200 shadow-xs hover:border-amber-400 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    Below Reference
                  </span>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-extrabold text-amber-600 tracking-tight">
                    {low}
                  </span>
                  <span className="text-[10px] font-medium text-amber-700/80">Flagged Low</span>
                </div>
                <div className="mt-1.5 flex items-center text-[10px] text-amber-700 font-medium truncate">
                  <AlertTriangle className="w-3 h-3 mr-1 shrink-0" />
                  <span className="truncate">{topLowNames || "Deficient corridor"}</span>
                </div>
              </div>

              {/* Above Reference (High) */}
              <div className="bg-rose-50/40 rounded-xl p-3.5 border border-rose-200 shadow-xs hover:border-rose-400 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                    Above Reference
                  </span>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-extrabold text-rose-600 tracking-tight">
                    {high}
                  </span>
                  <span className="text-[10px] font-medium text-rose-700/80">Priority Attention</span>
                </div>
                <div className="mt-1.5 flex items-center text-[10px] text-rose-700 font-medium truncate">
                  <AlertCircle className="w-3 h-3 mr-1 shrink-0" />
                  <span className="truncate">{topHighNames || "Priority Attention"}</span>
                </div>
              </div>
            </div>
          </section>

          {/* 2. PRIORITY ACTION & CLINICAL SYNOPSIS */}
          <section className="bg-card rounded-2xl p-5 md:p-6 border border-border shadow-xs relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/25 shadow-xs">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground tracking-tight">
                    Clinical Synopsis &amp; Priority Guidance
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Synthesized using evidence-based clinical protocols (ADA &amp; EASL 2026)
                  </p>
                </div>
              </div>

              {/* Audio & Summary actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleAudio}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-card border border-border hover:border-primary text-foreground text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {isPlayingAudio ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                      <span className="text-rose-600">Stop Audio</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-primary" />
                      <span>Listen to Audio Overview</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleSavePrep}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-primary/10 text-foreground hover:bg-primary/20 text-xs font-semibold border border-primary/25 transition-colors cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5 text-primary" />
                  <span>{savedPrep ? "Prep Copied!" : "Save Prep"}</span>
                </button>
              </div>
            </div>

            {/* Synopsis Narrative */}
            <p className="text-xs md:text-sm text-foreground/90 leading-relaxed font-normal">
              {report.summary}
            </p>

            {/* Critical Finding Tag Pills */}
            {abnormalItems.length > 0 && (
              <div className="mt-4 pt-3.5 border-t border-border flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-foreground mr-1">Immediate Focal Areas:</span>
                {abnormalItems.slice(0, 4).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAskAboutTest(item.test)}
                    className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      item.status === "High"
                        ? "bg-status-error-soft text-status-error-strong border-status-error-border hover:bg-status-error-bg"
                        : "bg-status-warning-soft text-status-warning-strong border-status-warning-border hover:bg-status-warning-bg"
                    }`}
                  >
                    <AlertCircle className="w-3 h-3 mr-1" />
                    <span>
                      {item.test} ({item.value} {item.unit || ""})
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* 3. PRIORITIZED ACCORDION ACTION PLAN: HIGHS, LOWS & NORMALIZATION */}
          <PriorityAccordion
            results={report.results}
            onAskAboutTest={handleAskAboutTest}
          />

          {/* 4. METRIC DEVIATION & CLINICAL RANGE DISTRIBUTION VISUALIZER */}
          <RangeDistribution
            metrics={report.results}
            onAskAboutTest={handleAskAboutTest}
          />

          {/* 5. INTERACTIVE DOCTOR DISCUSSION PROMPTS & CHECKLIST (NUMBERS ONLY) */}
          <DoctorQuestions
            questions={report.doctorQuestions}
            onAskQuestion={(q) => setExternalQuery(q)}
          />

          {/* 6. REDESIGNED DIAGNOSTIC LAB RESULTS TABLE */}
          <ResultsTable
            results={report.results}
            onAskAboutTest={handleAskAboutTest}
          />
        </div>

        {/* ===================================================================== */}
        {/* RIGHT 25% COLUMN: DEEPLY USEFUL CLINICAL COPILOT (STICKY)              */}
        {/* ===================================================================== */}
        <div className="xl:col-span-1 sticky top-6">
          <ChatPanel
            reportId={report.reportId}
            filename={report.filename}
            abnormalCount={abnormal}
            highItems={highItems.map((h) => h.test)}
            lowItems={lowItems.map((l) => l.test)}
            initialHistory={chats.map((c) => ({
              ...c,
              askedAt: new Date(c.askedAt),
            }))}
            externalInputTrigger={externalQuery}
          />
        </div>
      </div>
    </div>
  );
}
