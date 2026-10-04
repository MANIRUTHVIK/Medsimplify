"use client";

import React, { useState, useRef } from "react";
import { uploadAndAnalyzeReportAction } from "../actions";
import { Button } from "@/components/ui/button";
import {
  UploadCloud,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowRight,
  FileUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatReportName } from "@/lib/utils";

interface QueueItem {
  id: string;
  file: File;
  status: "queued" | "processing" | "completed" | "error";
  error?: string;
  reportId?: string;
}

const ALLOWED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

export function UploadQueue() {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndAddFiles = (files: File[]) => {
    setValidationError(null);
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      const isValidExt = ALLOWED_EXTENSIONS.includes(ext);
      const isValidMime = ALLOWED_MIME_TYPES.includes(file.type);

      if (!isValidExt && !isValidMime) {
        errors.push(`"${file.name}" has an unsupported format. Please upload PDF, PNG, JPG, or WEBP.`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`"${file.name}" exceeds the 15MB limit.`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setValidationError(errors[0]);
    }

    if (validFiles.length > 0) {
      const newItems: QueueItem[] = validFiles.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        status: "queued",
      }));
      setQueue((prev) => [...prev, ...newItems]);
    }
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    validateAndAddFiles(Array.from(e.target.files));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  };

  const handleRemoveItem = (id: string) => {
    if (isProcessing) return;
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const processQueue = async () => {
    if (isProcessing || queue.length === 0) return;
    setIsProcessing(true);

    const itemsToProcess = [...queue];

    for (let i = 0; i < itemsToProcess.length; i++) {
      const item = itemsToProcess[i];
      if (item.status === "completed") continue;

      // Update current status to processing
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: "processing" } : q))
      );

      const formData = new FormData();
      formData.append("file", item.file);

      try {
        const res = await uploadAndAnalyzeReportAction(formData);

        if (res.success && res.data) {
          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? { ...q, status: "completed", reportId: res.data?.reportId }
                : q
            )
          );
        } else {
          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? { ...q, status: "error", error: res.error || "Analysis failed" }
                : q
            )
          );
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error";
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, status: "error", error: msg } : q
          )
        );
      }
    }

    setIsProcessing(false);
    router.refresh();
  };

  const pendingCount = queue.filter((q) => q.status !== "completed").length;
  const completedCount = queue.filter((q) => q.status === "completed").length;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base md:text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-primary" />
            <span>Upload Laboratory Diagnostic Reports</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Drag and drop or select reports. Supports single or multi-file batch uploads.
          </p>
        </div>

        {/* Format Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border">
            PDF
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border">
            PNG
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border">
            JPG
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border">
            WEBP
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
            Up to 15MB
          </span>
        </div>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="mb-4 p-3 bg-status-error-soft border border-status-error/30 rounded-xl flex items-center justify-between text-xs text-status-error-strong font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-status-error shrink-0" />
            <span>{validationError}</span>
          </div>
          <button
            onClick={() => setValidationError(null)}
            className="text-status-error-strong hover:opacity-75 cursor-pointer ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 cursor-pointer text-center transition-all duration-200 group ${
          isDragging
            ? "border-primary bg-primary/10 ring-4 ring-primary/20 scale-[1.008]"
            : "border-border hover:border-primary/80 bg-muted/20 hover:bg-muted/40"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,image/png,image/jpeg,image/jpg,image/webp,.webp"
          onChange={handleFilesSelected}
          className="hidden"
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center justify-center space-y-2.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xs ${
              isDragging
                ? "bg-primary text-primary-foreground scale-110 animate-pulse"
                : "bg-primary/10 text-primary border border-primary/25 group-hover:scale-110"
            }`}
          >
            <UploadCloud className="w-6 h-6" />
          </div>

          <div>
            <span className="text-sm font-bold text-foreground block">
              {isDragging ? (
                <span className="text-primary font-extrabold animate-pulse">
                  Drop your report files now!
                </span>
              ) : (
                <span>
                  Drag &amp; drop laboratory reports here, or{" "}
                  <span className="text-primary underline underline-offset-2">browse</span>
                </span>
              )}
            </span>
            <span className="text-xs text-muted-foreground block mt-1">
              Supports scanned images or digital laboratory PDFs for OCR and AI analysis
            </span>
          </div>

          <div className="pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-card border border-border text-foreground group-hover:border-primary/50 shadow-2xs transition-colors">
              <FileUp className="w-3.5 h-3.5 text-primary" />
              <span>Select files from computer</span>
            </span>
          </div>
        </div>
      </div>

      {/* Action Strip when files are staged */}
      {queue.length > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-muted/30 border border-border rounded-xl">
          <div className="text-xs text-foreground font-semibold flex items-center gap-2">
            <span>
              Staged: <strong className="text-primary">{queue.length}</strong> reports
            </span>
            {completedCount > 0 && (
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px] font-bold">
                {completedCount} Completed
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setQueue([])}
              disabled={isProcessing}
              className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Clear All
            </button>
            <Button
              onClick={processQueue}
              variant="primary"
              disabled={isProcessing || pendingCount === 0}
              className="py-1.5 px-4 font-semibold text-xs shadow-xs"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Analyzing Reports...
                </>
              ) : pendingCount === 0 ? (
                "All Processed"
              ) : (
                `Analyze ${pendingCount} Report(s)`
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Visual Queue Table */}
      {queue.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="divide-y divide-border border border-border rounded-xl overflow-hidden text-xs bg-card">
            {queue.map((item) => (
              <div
                key={item.id}
                className="p-3 flex items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-foreground truncate">
                      {formatReportName(item.file.name)}
                    </p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                      <span>{(item.file.size / (1024 * 1024)).toFixed(2)} MB</span>
                      <span>•</span>
                      <span className="uppercase text-[10px] font-mono">
                        {item.file.name.split(".").pop()}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {item.status === "queued" && (
                    <>
                      <span className="text-[11px] text-muted-foreground bg-muted/60 border border-border px-2.5 py-0.5 rounded-md font-medium">
                        Queued
                      </span>
                      {!isProcessing && (
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 text-muted-foreground hover:text-status-error hover:bg-status-error-soft rounded-md transition-colors cursor-pointer"
                          title="Remove from queue"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                  {item.status === "processing" && (
                    <span className="text-[11px] text-primary bg-primary/10 border border-primary/25 px-2.5 py-0.5 rounded-md flex items-center gap-1 font-semibold animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin text-primary" />
                      Analyzing...
                    </span>
                  )}
                  {item.status === "completed" && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Complete
                      </span>
                      {item.reportId && (
                        <Link
                          href={`/dashboard/${item.reportId}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-primary hover:text-primary-foreground bg-primary/10 hover:bg-primary border border-primary/25 rounded-md transition-all shadow-2xs"
                        >
                          <span>View Analysis</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  )}
                  {item.status === "error" && (
                    <span className="text-[11px] text-status-error-strong bg-status-error-soft border border-status-error/30 px-2.5 py-0.5 rounded-md flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-3 h-3 text-status-error" />
                      {item.error || "Failed"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
