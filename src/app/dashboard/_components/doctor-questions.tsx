"use client";

import React, { useState } from "react";
import { Stethoscope, Copy, Check, Edit3, Sparkles } from "lucide-react";

interface DoctorQuestionsProps {
  questions: string[];
  onAskQuestion?: (questionText: string) => void;
}

export function DoctorQuestions({ questions, onAskQuestion }: DoctorQuestionsProps) {
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [activeNoteIdx, setActiveNoteIdx] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  if (!questions || questions.length === 0) return null;

  const handleCopyAll = async () => {
    const textToCopy = questions
      .map((q, i) => `${i + 1}. ${q}${notes[i] ? `\n   Note: ${notes[i]}` : ""}`)
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
    }
  };

  // Helper to categorize question dynamically
  const getQuestionCategory = (q: string, idx: number) => {
    const lower = q.toLowerCase();
    if (lower.includes("glucose") || lower.includes("hba1c") || lower.includes("diabetes")) {
      return { tag: "Glycemic Management", color: "bg-rose-50 text-rose-700 border-rose-200" };
    }
    if (lower.includes("bilirubin") || lower.includes("liver") || lower.includes("hepatic")) {
      return { tag: "Hepatic Follow-up", color: "bg-rose-50 text-rose-700 border-rose-200" };
    }
    if (lower.includes("sodium") || lower.includes("electrolyte") || lower.includes("fluid")) {
      return { tag: "Electrolyte Watch", color: "bg-amber-50 text-amber-700 border-amber-200" };
    }
    if (lower.includes("creatinine") || lower.includes("renal") || lower.includes("kidney")) {
      return { tag: "Renal Routine", color: "bg-amber-50 text-amber-700 border-amber-200" };
    }
    if (lower.includes("cholesterol") || lower.includes("lipid") || lower.includes("cardiac")) {
      return { tag: "Cardiovascular Risk", color: "bg-amber-50 text-amber-700 border-amber-200" };
    }
    return idx === 0
      ? { tag: "High Priority", color: "bg-rose-50 text-rose-700 border-rose-200" }
      : { tag: "Clinical Consultation", color: "bg-primary/10 text-primary border-primary/25" };
  };

  return (
    <section className="bg-card rounded-2xl p-5 border border-border shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-xs">
            <Stethoscope className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-base tracking-tight">
              Questions to Discuss with Your Doctor
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Structured consultation prompts to guide your next clinical appointment
            </p>
          </div>
        </div>

        {/* Copy Questions Button */}
        <button
          onClick={handleCopyAll}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-border bg-muted/30 hover:bg-muted text-foreground text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-[0.99]"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Copy All Questions</span>
            </>
          )}
        </button>
      </div>

      <div className="mt-4 space-y-2.5">
        {questions.map((q, idx) => {
          const category = getQuestionCategory(q, idx);

          return (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-all flex items-start gap-3"
            >
              {/* Clean Number Badge instead of checkbox */}
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-primary/25">
                {idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-foreground">
                    Consultation Prompt #{idx + 1}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${category.color}`}
                  >
                    {category.tag}
                  </span>
                </div>

                <p className="text-xs text-foreground mt-1 leading-relaxed">
                  &ldquo;{q}&rdquo;
                </p>

                {/* Personal Note if exists */}
                {notes[idx] && (
                  <div className="mt-2 p-2 bg-card border border-border rounded-lg text-xs text-foreground">
                    <span className="font-semibold text-primary text-[11px] block">Your Note:</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{notes[idx]}</p>
                  </div>
                )}

                {/* Inline Note Editor */}
                {activeNoteIdx === idx && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Type personal question note or reminder..."
                      defaultValue={notes[idx] || ""}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = (e.target as HTMLInputElement).value;
                          setNotes((prev) => ({ ...prev, [idx]: val }));
                          setActiveNoteIdx(null);
                        }
                      }}
                      className="flex-1 text-xs bg-card border border-border rounded-lg px-2.5 py-1 text-foreground focus:border-primary focus:outline-hidden"
                    />
                    <button
                      onClick={(e) => {
                        const inputEl = (e.currentTarget.previousSibling as HTMLInputElement);
                        setNotes((prev) => ({ ...prev, [idx]: inputEl?.value || "" }));
                        setActiveNoteIdx(null);
                      }}
                      className="px-2.5 py-1 text-xs bg-primary text-primary-foreground rounded-lg font-semibold cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setActiveNoteIdx(null)}
                      className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Bottom Actions */}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                  <button
                    onClick={() => setActiveNoteIdx(activeNoteIdx === idx ? null : idx)}
                    className="hover:text-foreground flex items-center gap-1 font-medium cursor-pointer transition-colors"
                  >
                    <Edit3 className="w-3 h-3 text-primary" />
                    <span>{notes[idx] ? "Edit note" : "Add note"}</span>
                  </button>
                  {onAskQuestion && (
                    <>
                      <span>•</span>
                      <button
                        onClick={() => onAskQuestion(q)}
                        className="hover:text-primary flex items-center gap-1 font-semibold text-primary cursor-pointer transition-colors"
                      >
                        <Sparkles className="w-3 h-3 text-primary" />
                        <span>Ask Copilot Now</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
