"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { askReportQuestionAction } from "../actions";
import {
  Sparkles,
  Send,
  Loader2,
  Mic,
  MicOff,
  User,
  Copy,
  Check,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { formatReportName, formatTime } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatPanelProps {
  reportId: string;
  filename: string;
  abnormalCount: number;
  highItems?: string[];
  lowItems?: string[];
  initialHistory?: Array<{
    id: string;
    question: string;
    answer: string;
    askedAt: Date;
  }>;
  externalInputTrigger?: string;
  onClearExternalTrigger?: () => void;
}

export function ChatPanel({
  reportId,
  filename,
  abnormalCount,
  initialHistory = [],
  externalInputTrigger,
  onClearExternalTrigger,
}: ChatPanelProps) {
  const displayName = formatReportName(filename);
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef(0);
  const lastTriggerRef = useRef<string | null>(null);

  // Initialize messages list
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const list: ChatMessage[] = [];

    // Default welcoming message
    list.push({
      id: "welcome-bot",
      role: "assistant",
      content: `Hello! I'm your MedSimplify assistant for **${displayName}**.\n\n${
        abnormalCount > 0
          ? `I've reviewed your report and found **${abnormalCount} test result${
              abnormalCount > 1 ? "s" : ""
            }** that fall outside the usual range. Feel free to ask what any test measures, what your results mean in everyday words, or what questions you can ask your doctor.`
          : "All the test results in this report look to be within their expected ranges. How can I help you understand your report today?"
      }`,
      timestamp: "Just now",
    });

    initialHistory.forEach((h) => {
      list.push({
        id: `user-${h.id}`,
        role: "user",
        content: h.question,
        timestamp: formatTime(h.askedAt),
      });
      list.push({
        id: `bot-${h.id}`,
        role: "assistant",
        content: h.answer,
        timestamp: formatTime(h.askedAt),
      });
    });

    return list;
  });

  // Auto-scroll chat container to bottom smoothly (never scrolling window)
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isSubmitting]);

  const handleSend = useCallback(
    async (questionText: string) => {
      const trimmed = questionText.trim();
      if (!trimmed || isSubmitting) return;

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
        const result = await askReportQuestionAction(reportId, trimmed);

        if (!result.success || !result.data) {
          setErrorMsg(result.error || "Unable to retrieve clinical answer. Please try again.");
          return;
        }

        const botMsg: ChatMessage = {
          id: `bot-${counterRef.current}-${Date.now()}`,
          role: "assistant",
          content: result.data.answer,
          timestamp: formatTime(),
        };

        setMessages((prev) => [...prev, botMsg]);
      } catch {
        setErrorMsg("Network or processing error occurred. Please verify your connection.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [reportId, isSubmitting]
  );

  // Handle external question triggers (fired strictly once per trigger change)
  useEffect(() => {
    if (
      externalInputTrigger &&
      externalInputTrigger.trim() &&
      externalInputTrigger !== lastTriggerRef.current
    ) {
      lastTriggerRef.current = externalInputTrigger;
      handleSend(externalInputTrigger);
      onClearExternalTrigger?.();
    }
  }, [externalInputTrigger, handleSend, onClearExternalTrigger]);

  const handleCopyMessage = async (msgId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "welcome-bot-reset",
        role: "assistant",
        content: `Conversation restarted for **${displayName}**. How can I help you understand your test results today?`,
        timestamp: formatTime(),
      },
    ]);
  };

  // Voice dictation toggle
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
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
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
    <aside aria-label="Clinical Copilot" className="w-full h-full flex flex-col">
      <div className="bg-card flex flex-col h-full overflow-hidden">
        {/* Sleek Executive Header */}
        <div className="px-4 py-3 border-b border-border bg-card/90 backdrop-blur-sm shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-foreground tracking-tight">Clinical Copilot</h3>
                <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-status-success-strong bg-status-success-soft/70 px-1.5 py-0.2 rounded-full border border-status-success-border/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
                  Active
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground truncate max-w-[200px]" title={displayName}>
                {displayName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${abnormalCount > 0
                ? "bg-status-error-soft text-status-error-strong border-status-error-border"
                : "bg-status-success-soft text-status-success-strong border-status-success-border"
                }`}
            >
              {abnormalCount > 0 ? `${abnormalCount} Flags` : "Optimal"}
            </span>

            <button
              type="button"
              onClick={handleResetChat}
              title="Reset conversation"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Chat Conversation Body */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-muted/5 scroll-smooth"
        >
          {messages.map((m) => {
            const isUser = m.role === "user";

            return (
              <div
                key={m.id}
                className={`flex gap-2.5 items-start ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/25 text-primary flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                )}

                <div
                  className={`flex flex-col gap-1 max-w-[92%] sm:max-w-[88%] ${isUser ? "items-end" : "items-start"
                    }`}
                >
                  <div
                    className={
                      isUser
                        ? "bg-primary text-primary-foreground font-medium rounded-2xl rounded-tr-xs px-3.5 py-2.5 shadow-xs leading-relaxed text-xs break-words"
                        : "bg-card border border-border/80 rounded-2xl rounded-tl-xs p-3.5 shadow-2xs leading-relaxed text-xs w-full text-foreground"
                    }
                  >
                    {isUser ? (
                      m.content
                    ) : (
                      <MarkdownRenderer content={m.content} />
                    )}
                  </div>

                  {/* Message Footer: Timestamp & Copy */}
                  <div className="flex items-center gap-2 px-1 text-[10px] text-muted-foreground select-none">
                    <span suppressHydrationWarning>{m.timestamp}</span>
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(m.id, m.content)}
                        className="hover:text-foreground inline-flex items-center gap-1 transition-colors cursor-pointer"
                        title="Copy answer"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="w-3 h-3 text-status-success" />
                            <span className="text-status-success font-medium">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-6 h-6 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center shrink-0 mt-0.5 shadow-2xs font-bold text-[10px]">
                    <User className="w-3.5 h-3.5 text-secondary-foreground" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Submitting indicator */}
          {isSubmitting && (
            <div className="flex gap-2.5 items-start justify-start animate-in fade-in duration-200">
              <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/25 text-primary flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-tl-xs px-3.5 py-2.5 shadow-2xs flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
                <span>Looking up a clear, simple explanation for you...</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 text-xs bg-status-error-soft border border-status-error/30 text-status-error-strong rounded-xl font-medium">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Executive Input Bar */}
        <div className="p-3 border-t border-border bg-card shrink-0 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex flex-col gap-2"
          >
            <div className="relative flex items-center">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(input);
                  }
                }}
                placeholder="Ask any question about your results in plain English..."
                rows={2}
                disabled={isSubmitting}
                className="w-full text-xs rounded-xl border border-border bg-muted/20 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 p-2.5 pr-20 resize-none text-foreground placeholder:text-muted-foreground focus:outline-hidden transition-all leading-relaxed"
              />

              <div className="absolute right-2 bottom-2.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleVoice}
                  disabled={isSubmitting}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isListening
                    ? "bg-status-error-soft text-status-error-strong animate-pulse"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  title={isListening ? "Listening... click to stop" : "Voice dictation"}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !input.trim()}
                  className="p-1.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                  title="Send message (Enter)"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>

          {/* Clinical Disclaimer Footer */}
          <div className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1.5 select-none">
            <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
            <span>MedSimplify explains your report in everyday words. Always talk with your doctor for medical advice.</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
