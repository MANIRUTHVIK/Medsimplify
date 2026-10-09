"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Apple,
  Activity,
  HeartPulse,
} from "lucide-react";
import { LabResultItem } from "@/types";

interface PriorityAccordionProps {
  results: LabResultItem[];
  onAskAboutTest: (question: string) => void;
}

export function PriorityAccordion({ results, onAskAboutTest }: PriorityAccordionProps) {
  const highItems = results.filter((r) => r.status === "High");
  const lowItems = results.filter((r) => r.status === "Low");
  const normalItems = results.filter((r) => r.status === "Normal");

  // Keep open by default: all high and low items
  const [openItems, setOpenItems] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {
      section_high: true,
      section_low: true,
      section_normal: false,
    };
    // Open first 2 abnormal items
    [...highItems, ...lowItems].slice(0, 2).forEach((item) => {
      initial[item.test] = true;
    });
    return initial;
  });

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper to generate simple everyday English guidance for common lab tests
  const getNormalizationAdvice = (item: LabResultItem) => {
    const lower = item.test.toLowerCase();
    const isHigh = item.status === "High";

    if (lower.includes("a1c") || lower.includes("glucose") || lower.includes("sugar")) {
      return {
        cause:
          item.interpretation ||
          (isHigh
            ? "Your blood test shows that your blood sugar levels have been higher than usual over recent months."
            : "Your blood sugar is lower than expected, which can sometimes make you feel tired, dizzy, or lightheaded."),
        actions: isHigh
          ? [
              "Eat foods rich in fiber, such as oats, beans, and leafy greens, to help keep blood sugar steady.",
              "Cut back on sugary drinks, sweets, and refined snacks.",
              "Take a light 20 to 30-minute walk after meals to help your body use sugar for energy.",
              "Talk with your doctor about how often to recheck your blood sugar and what steps to take next.",
            ]
          : [
              "Eat regular, balanced meals with complex carbohydrates and healthy protein.",
              "Keep a small, healthy snack or quick source of sugar nearby if you feel low blood sugar symptoms.",
              "Check in with your doctor about the timing of your meals and any medicines you take.",
            ],
      };
    }

    if (
      lower.includes("bilirubin") ||
      lower.includes("liver") ||
      lower.includes("alt") ||
      lower.includes("ast") ||
      lower.includes("sgpt") ||
      lower.includes("sgot")
    ) {
      return {
        cause:
          item.interpretation ||
          (isHigh
            ? "This liver marker is higher than usual. It can be a sign that your liver is working harder or experiencing temporary stress."
            : "This liver enzyme level is low, which is usually part of normal variation."),
        actions: [
          "Avoid alcohol and check with your doctor before starting new supplements or over-the-counter pain medicines.",
          "Drink plenty of water (around 8 glasses a day) to stay well hydrated.",
          "Add antioxidant-rich vegetables to your meals, such as broccoli, leafy greens, and berries.",
          "Ask your doctor if you should repeat this test or have any follow-up checks.",
        ],
      };
    }

    if (
      lower.includes("cholesterol") ||
      lower.includes("lipid") ||
      lower.includes("triglyceride") ||
      lower.includes("ldl")
    ) {
      return {
        cause:
          item.interpretation ||
          (isHigh
            ? "Your cholesterol or blood fat level is higher than the expected range. Over time, high levels can build up along blood vessel walls."
            : "Your circulating cholesterol levels are low, which generally points to low cardiovascular risk."),
        actions: [
          "Choose heart-healthy fats (like olive oil, avocados, and nuts) instead of fried and fatty foods.",
          "Add more soluble fiber to your meals, such as oats, beans, flaxseed, and berries.",
          "Aim for at least 30 minutes of moderate activity, such as brisk walking, most days of the week.",
          "Talk with your doctor about your overall heart health and what targets are right for you.",
        ],
      };
    }

    if (
      lower.includes("sodium") ||
      lower.includes("potassium") ||
      lower.includes("chloride") ||
      lower.includes("electrolyte")
    ) {
      return {
        cause:
          item.interpretation ||
          (isHigh
            ? "Your electrolyte level is higher than usual, which is often linked to mild dehydration or changes in fluid balance."
            : "Your electrolyte level is lower than usual, which can happen with fluid loss, certain medications, or drinking large amounts of water without electrolytes."),
        actions: [
          "Drink water steadily throughout the day rather than drinking large amounts all at once.",
          "Ask your doctor if any blood pressure or heart medicines you take could be affecting your electrolyte levels.",
          "Eat a balanced variety of whole foods, such as bananas, potatoes, and yogurt.",
          "Talk with your doctor to see if you should recheck this test.",
        ],
      };
    }

    if (lower.includes("hemoglobin") || lower.includes("rbc") || lower.includes("hematocrit")) {
      return {
        cause:
          item.interpretation ||
          (isHigh
            ? "Your red blood cell level is higher than usual. This is sometimes linked to mild dehydration or spending time at higher altitudes."
            : "Your level is lower than usual, which means fewer red blood cells carrying oxygen. This can make you feel tired or short of breath."),
        actions: isHigh
          ? [
              "Drink plenty of fluids through the day to stay well hydrated.",
              "Avoid smoking and secondhand smoke exposure.",
              "Review these findings with your doctor to check for common causes.",
            ]
          : [
              "Eat iron-rich foods (like beans, lentils, spinach, and lean meats) paired with vitamin C (like citrus fruits or peppers) to help absorption.",
              "Include foods with folate and vitamin B12 in your diet.",
              "Ask your doctor if you should check your iron stores (like ferritin) to find out why your level is lower.",
            ],
      };
    }

    if (
      lower.includes("creatinine") ||
      lower.includes("bun") ||
      lower.includes("urea") ||
      lower.includes("renal")
    ) {
      return {
        cause:
          item.interpretation ||
          (isHigh
            ? "Your kidney test is higher than usual. This means your kidneys may be filtering blood a bit more slowly right now."
            : "Your level is lower than standard, which is commonly seen with lower muscle mass or high fluid intake."),
        actions: [
          "Be careful with pain relievers like ibuprofen or naproxen, which can put extra stress on the kidneys.",
          "Drink enough water to stay comfortably hydrated throughout the day.",
          "Avoid excessive concentrated protein supplements.",
          "Discuss this result with your doctor to see if repeat testing is recommended.",
        ],
      };
    }

    // Generic fallback for any other biomarker
    return {
      cause:
        item.interpretation ||
        (isHigh
          ? "Your result is higher than the usual range. This test helps track this specific health marker, but cannot tell the whole story on its own."
          : "Your result is lower than the usual range. This test helps track this specific health marker, but cannot tell the whole story on its own."),
      actions: [
        "Write down any symptoms or changes in energy you have noticed so you can mention them to your doctor.",
        "Keep up healthy everyday habits, including regular sleep, balanced meals, and staying hydrated.",
        "Share this report with your doctor to discuss what these findings mean for you.",
      ],
    };
  };

  return (
    <section className="bg-card rounded-2xl p-5 md:p-6 border border-border shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-xs">
            <HeartPulse className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-base tracking-tight">
              Your Results and Next Steps
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Start with the results that need attention. Understand what they mean and discuss any concerns with your doctor.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {highItems.length > 0 && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-status-error-soft text-status-error-strong border border-status-error-border">
              {highItems.length} High
            </span>
          )}
          {lowItems.length > 0 && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-status-warning-soft text-status-warning-strong border border-status-warning-border">
              {lowItems.length} Low
            </span>
          )}
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-status-success-soft text-status-success-strong border border-status-success-border">
            {normalItems.length} Expected Range
          </span>
        </div>
      </div>

      {/* Accordion Container */}
      <div className="space-y-4">
        {/* SECTION 1: HIGHER THAN USUAL */}
        {highItems.length > 0 && (
          <div className="border border-status-error-border rounded-xl overflow-hidden bg-status-error-bg/30">
            <button
              onClick={() => toggleItem("section_high")}
              className="w-full p-4 flex items-center justify-between bg-status-error-bg hover:bg-status-error-soft/60 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <AlertCircle className="w-4 h-4 text-status-error-strong" />
                <span className="font-bold text-sm text-status-error-strong tracking-tight">
                  Results Higher than Usual ({highItems.length})
                </span>
                <span className="text-[11px] font-medium text-status-error-foreground hidden sm:inline">
                  — Results that are above the expected range
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-status-error-strong transition-transform duration-200 ${
                  openItems.section_high ? "rotate-180" : ""
                }`}
              />
            </button>

            {openItems.section_high && (
              <div className="p-3.5 space-y-3 divide-y divide-status-error-border/40">
                {highItems.map((item) => {
                  const isOpen = !!openItems[item.test];
                  const advice = getNormalizationAdvice(item);

                  return (
                    <div key={item.test} className="pt-3 first:pt-0">
                      <div
                        onClick={() => toggleItem(item.test)}
                        className="p-3 bg-card hover:bg-card/90 rounded-xl border border-status-error-border shadow-xs cursor-pointer transition-all"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-foreground text-sm">
                              {item.test}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-status-error-soft text-status-error-strong border border-status-error-border">
                              High
                            </span>
                            {item.deviation !== null && (
                              <span className="text-[11px] font-extrabold text-status-error-strong">
                                +{item.deviation}% Above Normal
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-3 text-xs">
                            <span className="font-extrabold text-status-error-strong text-sm">
                              {item.value} {item.unit || ""}
                            </span>
                            <span className="text-muted-foreground text-[11px]">
                              (Expected: &lt; {item.refHigh ?? "Normal"} {item.unit || ""})
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 text-muted-foreground transition-transform ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </div>

                        {/* Collapsible Guidance & Next Steps */}
                        {isOpen && (
                          <div className="mt-3.5 pt-3 border-t border-border text-xs space-y-3">
                            <div>
                              <span className="font-bold text-foreground text-[11px] block uppercase tracking-wider mb-1">
                                What this test shows:
                              </span>
                              <p className="text-muted-foreground leading-relaxed">
                                {advice.cause}
                              </p>
                            </div>

                            <div className="bg-primary/5 rounded-xl p-3 border border-primary/20 space-y-2">
                              <span className="font-bold text-foreground text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
                                <Apple className="w-3.5 h-3.5 text-primary" />
                                Helpful steps for {item.test}:
                              </span>
                              <ul className="space-y-1.5 text-foreground pl-1">
                                {advice.actions.map((act, i) => (
                                  <li key={i} className="flex items-start gap-2 leading-relaxed">
                                    <span className="text-primary font-bold">•</span>
                                    <span>{act}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="flex justify-end pt-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAskAboutTest(
                                    `What simple steps or daily habits can help with my higher ${item.test} result (${item.value} ${item.unit || ""})?`
                                  );
                                }}
                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                              >
                                <Sparkles className="w-3 h-3 text-primary-foreground" />
                                <span>Ask Copilot about {item.test}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: LOWER THAN USUAL */}
        {lowItems.length > 0 && (
          <div className="border border-status-warning-border rounded-xl overflow-hidden bg-status-warning-bg/30">
            <button
              onClick={() => toggleItem("section_low")}
              className="w-full p-4 flex items-center justify-between bg-status-warning-bg hover:bg-status-warning-soft/60 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-status-warning-strong" />
                <span className="font-bold text-sm text-status-warning-strong tracking-tight">
                  Results Lower than Usual ({lowItems.length})
                </span>
                <span className="text-[11px] font-medium text-status-warning-foreground hidden sm:inline">
                  — Results that are below the expected range
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-status-warning-strong transition-transform duration-200 ${
                  openItems.section_low ? "rotate-180" : ""
                }`}
              />
            </button>

            {openItems.section_low && (
              <div className="p-3.5 space-y-3 divide-y divide-status-warning-border/40">
                {lowItems.map((item) => {
                  const isOpen = !!openItems[item.test];
                  const advice = getNormalizationAdvice(item);

                  return (
                    <div key={item.test} className="pt-3 first:pt-0">
                      <div
                        onClick={() => toggleItem(item.test)}
                        className="p-3 bg-card hover:bg-card/90 rounded-xl border border-status-warning-border shadow-xs cursor-pointer transition-all"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-foreground text-sm">
                              {item.test}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-status-warning-soft text-status-warning-strong border border-status-warning-border">
                              Low
                            </span>
                            {item.deviation !== null && (
                              <span className="text-[11px] font-extrabold text-status-warning-strong">
                                {item.deviation}% Below Normal
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-3 text-xs">
                            <span className="font-extrabold text-status-warning-strong text-sm">
                              {item.value} {item.unit || ""}
                            </span>
                            <span className="text-muted-foreground text-[11px]">
                              (Expected: &gt; {item.refLow ?? "Normal"} {item.unit || ""})
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 text-muted-foreground transition-transform ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </div>

                        {/* Collapsible Guidance & Next Steps */}
                        {isOpen && (
                          <div className="mt-3.5 pt-3 border-t border-border text-xs space-y-3">
                            <div>
                              <span className="font-bold text-foreground text-[11px] block uppercase tracking-wider mb-1">
                                What this test shows:
                              </span>
                              <p className="text-muted-foreground leading-relaxed">
                                {advice.cause}
                              </p>
                            </div>

                            <div className="bg-primary/5 rounded-xl p-3 border border-primary/20 space-y-2">
                              <span className="font-bold text-foreground text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
                                <Activity className="w-3.5 h-3.5 text-primary" />
                                Helpful steps for {item.test}:
                              </span>
                              <ul className="space-y-1.5 text-foreground pl-1">
                                {advice.actions.map((act, i) => (
                                  <li key={i} className="flex items-start gap-2 leading-relaxed">
                                    <span className="text-primary font-bold">•</span>
                                    <span>{act}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="flex justify-end pt-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAskAboutTest(
                                    `What simple steps or foods can help with my lower ${item.test} result (${item.value} ${item.unit || ""})?`
                                  );
                                }}
                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                              >
                                <Sparkles className="w-3 h-3 text-primary-foreground" />
                                <span>Ask Copilot about {item.test}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: WITHIN EXPECTED RANGE */}
        {normalItems.length > 0 && (
          <div className="border border-status-success-border rounded-xl overflow-hidden bg-status-success-bg/30">
            <button
              onClick={() => toggleItem("section_normal")}
              className="w-full p-4 flex items-center justify-between bg-status-success-bg hover:bg-status-success-soft/60 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-status-success-strong" />
                <span className="font-bold text-sm text-status-success-strong tracking-tight">
                  Results Within Expected Range ({normalItems.length})
                </span>
                <span className="text-[11px] font-medium text-status-success-foreground hidden sm:inline">
                  — Results that fall within the usual range
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-status-success-strong transition-transform duration-200 ${
                  openItems.section_normal ? "rotate-180" : ""
                }`}
              />
            </button>

            {openItems.section_normal && (
              <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {normalItems.map((item) => (
                  <div
                    key={item.test}
                    className="p-3 bg-card rounded-xl border border-status-success-border/60 flex items-center justify-between shadow-2xs hover:border-status-success transition-all cursor-pointer"
                    onClick={() =>
                      onAskAboutTest(`What does ${item.test} do in the body and how can I keep it in a healthy range?`)
                    }
                    title="Click to learn about keeping this in a healthy range"
                  >
                    <div>
                      <span className="font-bold text-foreground text-xs block">
                        {item.test}
                      </span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        {item.refLow !== null && item.refHigh !== null
                          ? `${item.refLow} – ${item.refHigh} ${item.unit || ""}`
                          : "Expected Range"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-status-success-strong text-xs block">
                        {item.value} {item.unit || ""}
                      </span>
                      <span className="text-[10px] font-semibold text-status-success-strong bg-status-success-soft px-1.5 py-0.2 rounded border border-status-success-border">
                        Normal
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
