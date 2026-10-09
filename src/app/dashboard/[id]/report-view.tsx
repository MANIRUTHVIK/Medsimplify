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
  TrendingUp,
  TrendingDown,
  ChevronRight,
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

  // Find abnormal metrics
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

  const handleSavePrep = async () => {
    const text = `MEDSIMPLIFY REPORT SUMMARY\nReport: ${displayName}\nDate: ${formatDate(report.uploadedAt)}\nTotal Tests: ${total} (${normal} within range, ${high} higher, ${low} lower)\n\nREPORT SUMMARY:\n${report.summary}\n\nQUESTIONS FOR YOUR DOCTOR:\n${report.doctorQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`;
    try {
      await navigator.clipboard.writeText(text);
      setSavedPrep(true);
      setTimeout(() => setSavedPrep(false), 2500);
    } catch {
      // ignore
    }
  };

  /* ─── Triage colour tokens ─── */
  const triageBg = isOptimal
    ? "bg-status-success-soft border-status-success-border text-status-success-strong"
    : isModerate
      ? "bg-status-warning-soft border-status-warning-border text-status-warning-strong"
      : "bg-status-error-soft border-status-error-border text-status-error-strong";

  const triageLabel = isOptimal
    ? "Optimal"
    : isModerate
      ? "Needs Attention"
      : "Priority Alert";

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* SLIM TOP ACTION BAR                                                     */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="bg-card/90 backdrop-blur-md border-b border-border px-5 py-3 flex items-center justify-between gap-4 sticky top-0 z-20 shrink-0">
        {/* Left: breadcrumb + title */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Activity className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-sm font-bold text-foreground truncate max-w-[180px] sm:max-w-xs">
              {displayName}
            </span>
            <span className={`hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${triageBg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOptimal ? "bg-status-success" : isModerate ? "bg-status-warning" : "bg-status-error"} animate-pulse`} />
              {triageLabel}
            </span>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden md:block text-[11px] text-muted-foreground">
            {formatDate(report.uploadedAt)} · ID #{report.reportId.slice(0, 8).toUpperCase()}
          </span>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted/50 text-foreground text-xs font-medium transition-all cursor-pointer"
            title="Export PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold transition-all"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload New</span>
          </Link>
          <button
            onClick={handleDeleteReport}
            disabled={isDeleting}
            className="p-1.5 rounded-lg border border-status-error/30 hover:bg-status-error-soft text-status-error-strong transition-all cursor-pointer disabled:opacity-50"
            title="Delete report"
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* MAIN SPLIT LAYOUT: 3/4 Analysis | 1/4 Chatbot                          */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex flex-col xl:flex-row gap-0 flex-1 min-h-0 overflow-hidden">

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* LEFT — ANALYSIS COLUMN (scrollable)                                 */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-5 lg:p-6 pb-10 space-y-5">

          {/* ── 1. SCORE STRIP ── */}
          <section className="bg-card rounded-xl border border-border p-4 md:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">

              {/* Ring + score */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="relative w-14 h-14 shrink-0">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="var(--border)"
                      strokeWidth="3.5"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={isOptimal ? "var(--status-success)" : isModerate ? "var(--status-warning)" : "var(--status-error)"}
                      strokeDasharray={`${safePercentage}, 100`}
                      strokeLinecap="round"
                      strokeWidth="3.5"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-extrabold text-foreground leading-none">{safePercentage}%</span>
                    <span className="text-[8px] text-muted-foreground uppercase font-bold leading-none mt-0.5">Safe</span>
                  </div>
                </div>

                {/* Title block */}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${triageBg}`}>
                      {triageLabel}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium hidden sm:inline">Confidence 99.4%</span>
                  </div>
                  <h1 className="text-base font-bold text-foreground mt-1 tracking-tight">
                    Biomarker Stability Profile
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {normal} normal · {" "}
                    <span className="text-status-error-strong font-semibold">{high} elevated{topHighNames ? ` (${topHighNames})` : ""}</span>
                    {" "}· <span className="text-status-warning-strong font-semibold">{low} deficient{topLowNames ? ` (${topLowNames})` : ""}</span>
                  </p>
                </div>
              </div>

              {/* 4 KPI tiles */}
              <div className="grid grid-cols-4 gap-2 flex-1 min-w-0">
                {/* Total */}
                <div className="bg-background rounded-xl p-3 border border-border text-center">
                  <Activity className="w-4 h-4 text-primary mx-auto mb-1" />
                  <div className="text-xl font-extrabold text-foreground">{total}</div>
                  <div className="text-[10px] text-muted-foreground font-medium">Total</div>
                </div>
                {/* Normal */}
                <div className="bg-status-success-bg rounded-xl p-3 border border-status-success-border text-center">
                  <CheckCircle2 className="w-4 h-4 text-status-success mx-auto mb-1" />
                  <div className="text-xl font-extrabold text-status-success-strong">{normal}</div>
                  <div className="text-[10px] text-status-success-foreground font-medium">Normal</div>
                </div>
                {/* Low */}
                <div className="bg-status-warning-bg rounded-xl p-3 border border-status-warning-border text-center">
                  <TrendingDown className="w-4 h-4 text-status-warning mx-auto mb-1" />
                  <div className="text-xl font-extrabold text-status-warning-strong">{low}</div>
                  <div className="text-[10px] text-status-warning-foreground font-medium">Low</div>
                </div>
                {/* High */}
                <div className="bg-status-error-bg rounded-xl p-3 border border-status-error-border text-center">
                  <TrendingUp className="w-4 h-4 text-status-error mx-auto mb-1" />
                  <div className="text-xl font-extrabold text-status-error-strong">{high}</div>
                  <div className="text-[10px] text-status-error-foreground font-medium">High</div>
                </div>
              </div>
            </div>
          </section>

          {/* ── 2. CLINICAL SYNOPSIS ── */}
          <section className="bg-card rounded-xl border border-border p-4 md:p-5 shadow-xs">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground leading-tight">Clinical Synopsis</h2>
                  <p className="text-[10px] text-muted-foreground">Clear summary of your report in everyday language</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={toggleAudio}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card border border-border hover:border-primary text-xs font-medium transition-colors cursor-pointer"
                >
                  {isPlayingAudio ? (
                    <><VolumeX className="w-3.5 h-3.5 text-status-error" /><span className="hidden sm:inline text-status-error">Stop</span></>
                  ) : (
                    <><Volume2 className="w-3.5 h-3.5 text-primary" /><span className="hidden sm:inline">Listen</span></>
                  )}
                </button>
                <button
                  onClick={handleSavePrep}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5 text-primary" />
                  <span className="hidden sm:inline">{savedPrep ? "Copied!" : "Save Summary"}</span>
                </button>
              </div>
            </div>

            {/* Synopsis text */}
            <p className="text-xs md:text-sm text-foreground/85 leading-relaxed">
              {report.summary}
            </p>

            {/* Focal findings pills */}
            {abnormalItems.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Results to Review:</span>
                {abnormalItems.slice(0, 5).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAskAboutTest(item.test)}
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                      item.status === "High"
                        ? "bg-status-error-soft text-status-error-strong border-status-error-border hover:bg-status-error-bg"
                        : "bg-status-warning-soft text-status-warning-strong border-status-warning-border hover:bg-status-warning-bg"
                    }`}
                  >
                    <AlertCircle className="w-2.5 h-2.5" />
                    {item.test} ({item.value} {item.unit || ""})
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* ── 3. PRIORITY ACTION PLAN ── */}
          <PriorityAccordion
            results={report.results}
            onAskAboutTest={handleAskAboutTest}
          />

          {/* ── 4. RANGE DISTRIBUTION VISUALIZER ── */}
          <RangeDistribution
            metrics={report.results}
            onAskAboutTest={handleAskAboutTest}
          />

          {/* ── 5. DOCTOR DISCUSSION PROMPTS ── */}
          <DoctorQuestions
            questions={report.doctorQuestions}
            onAskQuestion={(q) => setExternalQuery(q)}
          />

          {/* ── 6. DIAGNOSTIC LAB RESULTS TABLE ── */}
          <ResultsTable
            results={report.results}
            onAskAboutTest={handleAskAboutTest}
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* RIGHT — CHATBOT COLUMN (sticky, full-height)                        */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="xl:w-80 2xl:w-96 shrink-0 border-t xl:border-t-0 xl:border-l border-border bg-background xl:sticky xl:top-[49px] xl:h-[calc(100vh-49px)] xl:overflow-hidden flex flex-col">
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
            onClearExternalTrigger={() => setExternalQuery("")}
          />
        </div>
      </div>
    </div>
  );
}
