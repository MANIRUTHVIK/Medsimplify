"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  Mic,
  MicOff,
  CheckCircle2,
  User,
  ArrowRight,
  PlusCircle,
  X,
  FileText,
  AlertTriangle,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { askReportQuestionAction } from "../actions";
import { formatReportName, formatDate, formatTime } from "@/lib/utils";
import { Select } from "@/components/ui/select";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";

export interface CopilotReportItem {
  id: string;
  filename: string;
  uploadedAt: string | Date;
  summary?: string | null;
  abnormalCount: number;
  resultsCount?: number;
  totalCount?: number;
}

interface CopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: CopilotReportItem[];
  defaultReportId?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  actionItems?: string[];
  referenceCitation?: string;
}


export function CopilotModal({
  isOpen,
  onClose,
  reports,
  defaultReportId,
}: CopilotModalProps) {
  const [selectedReportId, setSelectedReportId] = useState<string>(
    () => defaultReportId || (reports.length > 0 ? reports[0].id : "")
  );

  // Sync state if defaultReportId prop changes externally
  const [prevDefaultReportId, setPrevDefaultReportId] = useState(defaultReportId);
  if (defaultReportId !== prevDefaultReportId) {
    setPrevDefaultReportId(defaultReportId);
    if (defaultReportId) {
      setSelectedReportId(defaultReportId);
    }
  }

  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef(0);

  const activeReport = reports.find((r) => r.id === selectedReportId) || reports[0];
  const activeReportName = activeReport ? formatReportName(activeReport.filename) : "Report";

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: "welcome",
        role: "assistant",
        content: `Hello! I'm your MedSimplify assistant. Pick any medical report from the selector above, and I can explain what your results mean in simple everyday words, point out any tests that need attention, and suggest questions for your doctor.`,
        timestamp: "Just now",
        actionItems: [
          "Pick a medical report to review.",
          "Ask questions about any specific test or what it means for your body.",
          "Get simple questions ready for your next doctor appointment.",
        ],
        referenceCitation: "Educational Health Guide",
      },
    ];
  });

  const handleSelectReport = (newId: string) => {
    if (newId === selectedReportId) return;
    setSelectedReportId(newId);
    const target = reports.find((r) => r.id === newId);
    if (target) {
      const name = formatReportName(target.filename);
      const flags = target.abnormalCount;
      setMessages((prev) => [
        ...prev,
        {
          id: `switch-${target.id}-${Date.now()}`,
          role: "assistant",
          content: `Switched context to **${name}** (${
            flags > 0 ? `${flags} results outside usual range` : "all within expected ranges"
          }). How can I help you understand this report?`,
          timestamp: formatTime(),
          referenceCitation: "Active Report Loaded",
        },
      ]);
    }
  };

  useEffect(() => {
    if (isOpen && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isOpen, isSubmitting]);

  if (!isOpen) return null;

  const handleSend = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isSubmitting) return;

    if (!selectedReportId) {
      setErrorMsg("Please select a lab report to ask questions about.");
      return;
    }

    setErrorMsg(null);
    counterRef.current += 1;
    const currentTime = formatTime();

    const userMsg: ChatMessage = {
      id: `user-${counterRef.current}-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: currentTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSubmitting(true);

    try {
      const result = await askReportQuestionAction(selectedReportId, trimmed);

      if (!result.success || !result.data) {
        setErrorMsg(result.error || "Unable to retrieve clinical answer. Please try again.");
        return;
      }

      const botMsg: ChatMessage = {
        id: `bot-${counterRef.current}-${Date.now()}`,
        role: "assistant",
        content: result.data.answer,
        timestamp: formatTime(),
        referenceCitation: "MedSimplify Report Guide",
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setErrorMsg("Network or processing error occurred. Please verify your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleVoice = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice speech recognition is not supported in your current browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SpeechRecognition as any)();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsListening(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl flex flex-col h-[85vh] max-h-[780px] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Top Header */}
        <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/25 text-primary flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">Clinical Copilot</h2>
                <span className="text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/25 px-2 py-0.5 rounded-full">
                  AI Assistant
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select any lab report to get simple explanations and helpful questions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Report Selector Bar */}
        <div className="px-4 py-3 border-b border-border bg-card shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileText className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-semibold text-foreground shrink-0">Active Report:</span>
            {reports.length > 0 ? (
              <div className="flex-1 min-w-0">
                <Select
                  value={selectedReportId}
                  onChange={(e) => handleSelectReport(e.target.value)}
                  selectSize="sm"
                  className="font-semibold text-xs bg-muted/30 hover:bg-muted/50 border-border focus:border-primary cursor-pointer shadow-2xs"
                >
                  {reports.map((r) => (
                    <option key={r.id} value={r.id}>
                      {formatReportName(r.filename)} ({r.abnormalCount > 0 ? `${r.abnormalCount} flags` : "Normal"}) • {formatDate(r.uploadedAt)}
                    </option>
                  ))}
                </Select>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground italic">No reports found</span>
            )}
          </div>

          {activeReport && (
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {activeReport.abnormalCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-status-error-soft text-status-error-strong border border-status-error-border">
                  <AlertTriangle className="w-3 h-3 text-status-error" />
                  <span>{activeReport.abnormalCount} Flags</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-status-success-soft text-status-success-strong border border-status-success-border">
                  <CheckCircle2 className="w-3 h-3 text-status-success" />
                  <span>Normal</span>
                </span>
              )}

              <Link
                href={`/dashboard/${activeReport.id}`}
                onClick={onClose}
                className="text-xs text-primary font-bold hover:underline"
              >
                Open Full Report
              </Link>
            </div>
          )}
        </div>

        {/* Quick Question Prompts Bar */}
        {reports.length > 0 && (
          <div className="px-4 py-2 border-b border-border bg-muted/10 shrink-0 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span className="text-[10px] font-bold uppercase text-muted-foreground shrink-0 mr-1">
              Ask:
            </span>
            <button
              onClick={() => handleSend("Explain my flagged results in simple everyday words")}
              disabled={isSubmitting}
              className="px-2.5 py-1 bg-card hover:bg-primary/10 text-foreground border border-border hover:border-primary/40 rounded-lg whitespace-nowrap cursor-pointer transition-colors"
            >
              &ldquo;Explain flagged results&rdquo;
            </button>
            <button
              onClick={() => handleSend("What questions should I ask my doctor about these results?")}
              disabled={isSubmitting}
              className="px-2.5 py-1 bg-card hover:bg-primary/10 text-foreground border border-border hover:border-primary/40 rounded-lg whitespace-nowrap cursor-pointer transition-colors"
            >
              &ldquo;Top questions for doctor&rdquo;
            </button>
            <button
              onClick={() => handleSend("What simple lifestyle habits or healthy foods could support these results?")}
              disabled={isSubmitting}
              className="px-2.5 py-1 bg-card hover:bg-primary/10 text-foreground border border-border hover:border-primary/40 rounded-lg whitespace-nowrap cursor-pointer transition-colors"
            >
              &ldquo;Healthy daily habits&rdquo;
            </button>
          </div>
        )}

        {/* Chat Conversation Body */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {reports.length === 0 ? (
            <div className="p-8 text-center space-y-3 my-auto">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
              <h3 className="font-bold text-foreground text-sm">No Reports Uploaded Yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Upload your laboratory results in the dashboard to enable interactive questions and clinical synthesis.
              </p>
              <Link
                href="/dashboard"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-semibold text-xs rounded-xl shadow-xs"
              >
                <span>Upload Report Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-start space-x-2 ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {/* Bot Avatar */}
                {m.role === "assistant" && (
                  <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary border border-primary/25 shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                )}

                {/* Message Bubble */}
                {m.role === "user" ? (
                  <div className="flex items-start space-x-2 justify-end max-w-[85%]">
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-none px-3.5 py-2.5 leading-relaxed shadow-xs">
                      {m.content}
                    </div>
                    <div className="w-6 h-6 rounded-lg bg-primary text-primary-foreground shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5 shadow-2xs">
                      <User className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/25 border border-border rounded-2xl rounded-tl-none p-3.5 text-foreground leading-relaxed space-y-2.5 max-w-[90%] shadow-2xs">
                    <MarkdownRenderer content={m.content} />

                    {/* Action Items Box */}
                    {m.actionItems && m.actionItems.length > 0 && (
                      <div className="bg-card rounded-xl p-3 border border-border text-[11px] space-y-1.5 shadow-2xs">
                        <div className="font-bold text-foreground flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                          <span>Helpful Next Steps:</span>
                        </div>
                        <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                          {m.actionItems.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Reference Citation & Prep Question */}
                    {m.referenceCitation && (
                      <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-1.5 border-t border-border">
                        <span className="truncate max-w-[240px]">{m.referenceCitation}</span>
                        <button
                          type="button"
                          onClick={() => handleSend("Can you formulate a specific question for my doctor regarding this?")}
                          className="text-primary hover:underline font-bold flex items-center gap-0.5 cursor-pointer transition-colors shrink-0 ml-2"
                        >
                          <PlusCircle className="w-3 h-3 text-primary" />
                          <span>Prep Question</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {isSubmitting && (
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary border border-primary/25 shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-primary animate-spin" />
              </div>
              <div className="bg-muted/30 border border-border rounded-2xl rounded-tl-none px-3.5 py-2.5 text-foreground text-xs flex items-center space-x-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span>Looking up a clear explanation for {activeReportName}...</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 text-xs bg-status-error-soft border border-status-error/30 text-status-error-strong rounded-xl font-medium">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Chat Input Bar */}
        <div className="p-3.5 border-t border-border bg-card shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex flex-col gap-2"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
              placeholder="Ask any question about your medical report in plain English..."
              rows={2}
              className="w-full text-xs rounded-xl border border-border focus:border-primary focus:ring-1 focus:ring-primary p-2.5 resize-none bg-muted/20 text-foreground placeholder:text-muted-foreground focus:outline-hidden transition-colors"
              disabled={isSubmitting || reports.length === 0}
            />
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={toggleVoice}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isListening
                    ? "bg-status-error-soft text-status-error-strong animate-pulse"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                title={isListening ? "Listening... click to stop" : "Voice dictation"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !input.trim() || reports.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Send Question</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
