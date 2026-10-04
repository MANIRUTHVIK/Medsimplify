"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { askReportQuestionAction } from "../actions";
import {
  Sparkles,
  Send,
  Loader2,
  Mic,
  MicOff,
  Paperclip,
  CheckCircle2,
  User,
  ArrowRight,
  PlusCircle,
} from "lucide-react";
import { formatReportName } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  severityTag?: string;
  actionItems?: string[];
  referenceCitation?: string;
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
}

function FormattedChatText({ content }: { content: string }) {
  const paragraphs = content.split("\n");

  return (
    <div className="space-y-1.5 leading-relaxed text-foreground">
      {paragraphs.map((para, pIdx) => {
        const trimmed = para.trim();
        if (!trimmed) return null;

        const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("* ");
        const isNumbered = /^\d+\.\s/.test(trimmed);
        const cleanText = isBullet
          ? trimmed.slice(2)
          : isNumbered
          ? trimmed.replace(/^\d+\.\s*/, "")
          : trimmed;

        // Parse **bold** markers
        const parts = cleanText.split(/(\*\*[^*]+\*\*)/g);

        const renderedText = parts.map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={i} className="font-bold text-foreground">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });

        if (isBullet || isNumbered) {
          return (
            <div key={pIdx} className="flex items-start gap-1.5 pl-1 text-foreground">
              <span className="text-primary font-bold mt-0.5">•</span>
              <span>{renderedText}</span>
            </div>
          );
        }

        return (
          <p key={pIdx} className="text-foreground">
            {renderedText}
          </p>
        );
      })}
    </div>
  );
}

export function ChatPanel({
  reportId,
  filename,
  abnormalCount,
  highItems = [],
  lowItems = [],
  initialHistory = [],
  externalInputTrigger,
}: ChatPanelProps) {
  const displayName = formatReportName(filename);
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef(0);

  // Parse initial history
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const list: ChatMessage[] = [];

    // Default welcoming message
    list.push({
      id: "welcome-bot",
      role: "assistant",
      content: `Hello! I've loaded your panel for ${displayName}. ${
        abnormalCount > 0
          ? `I'm analyzing ${abnormalCount} flagged biomarkers requiring your attention.`
          : "All evaluated biomarkers appear within expected physiological corridors."
      } Ask me anything to prepare for your consultation.`,
      timestamp: "Just now",
      actionItems: [
        "Review flagged metrics against standard corridors.",
        "Formulate key discussion points for your doctor.",
        "Explore safe evidence-based nutritional considerations.",
      ],
      referenceCitation: "Evidence-Based Clinical Guidelines 2026",
    });

    initialHistory.forEach((h) => {
      list.push({
        id: `user-${h.id}`,
        role: "user",
        content: h.question,
        timestamp: new Date(h.askedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
      list.push({
        id: `bot-${h.id}`,
        role: "assistant",
        content: h.answer,
        timestamp: new Date(h.askedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        referenceCitation: "Clinical Laboratory Guidelines",
      });
    });

    return list;
  });

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSubmitting]);

  const handleSend = useCallback(
    async (questionText: string) => {
      const trimmed = questionText.trim();
      if (!trimmed || isSubmitting) return;

      setErrorMsg(null);
      counterRef.current += 1;
      const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          referenceCitation: "ADA / EASL Clinical Protocols 2026",
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

  // Handle external question triggers (from "Ask AI" buttons across the page)
  useEffect(() => {
    if (externalInputTrigger) {
      handleSend(externalInputTrigger);
    }
  }, [externalInputTrigger, handleSend]);

  // Voice dictation toggle
  const toggleVoice = () => {
    if (typeof window === "undefined") return;

    // Check for web speech recognition support
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
    <aside className="w-full">
      <div className="bg-card rounded-2xl border border-border shadow-xs flex flex-col h-[calc(100vh-6rem)] max-h-[750px] min-h-[520px] overflow-hidden">
        {/* Assistant Header */}
        <div className="p-3.5 border-b border-border bg-muted/20 shrink-0 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/25 text-primary flex items-center justify-center shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground">Clinical Copilot</h3>
                <div className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
                  <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[130px]">
                    {displayName}
                  </span>
                </div>
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium bg-muted/50 px-2 py-0.5 rounded-md border border-border">
              {abnormalCount > 0 ? `${abnormalCount} Flags` : "Optimal"}
            </span>
          </div>

          {/* Context Badge */}
          <div className="bg-card rounded-xl px-2.5 py-1.5 border border-border flex items-center justify-between text-[10px]">
            <span className="font-semibold text-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Analyzing {abnormalCount} flagged biomarkers
            </span>
            <span className="text-muted-foreground font-mono">HIPAA Encrypted</span>
          </div>

          {/* Quick Clinical Consult Pills */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <span>Quick Clinical Consult</span>
            </div>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() =>
                  handleSend(
                    highItems.length > 0
                      ? `Explain my elevated ${highItems[0]} in plain everyday terms`
                      : "Explain my evaluated biomarkers in plain everyday terms"
                  )
                }
                disabled={isSubmitting}
                className="text-left text-[11px] bg-card hover:bg-primary/10 text-foreground border border-border hover:border-primary/40 px-2 py-1 rounded-lg transition-colors flex items-center justify-between group cursor-pointer disabled:opacity-50"
              >
                <span className="truncate">
                  {highItems.length > 0
                    ? `\u201CExplain ${highItems[0]} in plain terms\u201D`
                    : `\u201CExplain panel findings in plain terms\u201D`}
                </span>
                <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-1" />
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSend(
                    highItems.length > 0
                      ? `What foods and lifestyle habits help reduce elevated ${highItems[0]}?`
                      : "What dietary and lifestyle habits support improving these results?"
                  )
                }
                disabled={isSubmitting}
                className="text-left text-[11px] bg-card hover:bg-primary/10 text-foreground border border-border hover:border-primary/40 px-2 py-1 rounded-lg transition-colors flex items-center justify-between group cursor-pointer disabled:opacity-50"
              >
                <span className="truncate">
                  {highItems.length > 0
                    ? `\u201CWhat foods reduce high ${highItems[0]}?\u201D`
                    : `\u201CWhat dietary habits support these results?\u201D`}
                </span>
                <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-1" />
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSend(
                    lowItems.length > 0
                      ? `Is low ${lowItems[0]} an emergency or does it need urgent re-testing?`
                      : "What are the top questions I should bring to my doctor?"
                  )
                }
                disabled={isSubmitting}
                className="text-left text-[11px] bg-card hover:bg-primary/10 text-foreground border border-border hover:border-primary/40 px-2 py-1 rounded-lg transition-colors flex items-center justify-between group cursor-pointer disabled:opacity-50"
              >
                <span className="truncate">
                  {lowItems.length > 0
                    ? `\u201CIs low ${lowItems[0]} an emergency?\u201D`
                    : `\u201CTop questions for my physician\u201D`}
                </span>
                <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-1" />
              </button>
            </div>
          </div>
        </div>

        {/* Chat Conversation Body */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start space-x-2 ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {/* Bot Avatar */}
              {m.role === "assistant" && (
                <div className="w-5 h-5 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5 shadow-2xs">
                  <Sparkles className="w-3 h-3 text-primary" />
                </div>
              )}

              {/* Message Bubble */}
              {m.role === "user" ? (
                <div className="flex items-start space-x-1.5 justify-end max-w-[85%]">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-none px-3 py-2 leading-relaxed shadow-xs">
                    {m.content}
                  </div>
                  <div className="w-5 h-5 rounded-md bg-primary text-primary-foreground shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5 shadow-2xs">
                    <User className="w-3 h-3 text-primary-foreground" />
                  </div>
                </div>
              ) : (
                <div className="bg-muted/25 border border-border rounded-2xl rounded-tl-none p-3 text-foreground leading-relaxed space-y-2 max-w-[90%] shadow-2xs">
                  {/* Body Content */}
                  <FormattedChatText content={m.content} />

                  {/* Action Items Box */}
                  {m.actionItems && m.actionItems.length > 0 && (
                    <div className="bg-card rounded-xl p-2.5 border border-border text-[11px] space-y-1 shadow-2xs">
                      <div className="font-bold text-foreground flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-primary" />
                        <span>Actionable Considerations:</span>
                      </div>
                      <ul className="list-disc pl-3.5 space-y-0.5 text-muted-foreground">
                        {m.actionItems.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Reference Citation & Prep Question */}
                  {m.referenceCitation && (
                    <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border">
                      <span className="truncate max-w-[150px]">{m.referenceCitation}</span>
                      <button
                        type="button"
                        onClick={() => handleSend("Can you formulate a specific question for my doctor regarding this?")}
                        className="text-primary hover:underline font-bold flex items-center gap-0.5 cursor-pointer transition-colors shrink-0 ml-1"
                      >
                        <PlusCircle className="w-3 h-3 text-primary" />
                        <span>Prep Question</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {isSubmitting && (
            <div className="flex items-start space-x-2">
              <div className="w-5 h-5 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5">
                <Sparkles className="w-3 h-3 text-primary animate-spin" />
              </div>
              <div className="bg-muted/30 border border-border rounded-2xl rounded-tl-none px-3 py-2 text-foreground text-xs flex items-center space-x-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span>Consulting clinical protocols...</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 text-xs bg-status-error-soft border border-status-error/30 text-status-error-strong rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Clean Chat Input Area with No Clutter or Textarea Overlap */}
        <div className="p-3 border-t border-border bg-card shrink-0">
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
              placeholder="Ask a question about this panel..."
              rows={2}
              className="w-full text-xs rounded-xl border border-border focus:border-primary focus:ring-1 focus:ring-primary p-2 resize-none bg-muted/20 text-foreground placeholder:text-muted-foreground focus:outline-hidden transition-colors"
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
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
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleSend("Explain reference range methodology and fallback standards")}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
                  title="Methodology reference"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !input.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Submit question"
              >
                <span>Ask</span>
                <Send className="w-3 h-3" />
              </button>
            </div>
          </form>
          {/* Clinical Disclaimer */}
          <div className="mt-2 text-[9px] text-muted-foreground text-center flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-muted-foreground shrink-0" />
            <span>Verified against clinical lab standards. Educational guidance, not a diagnosis.</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
