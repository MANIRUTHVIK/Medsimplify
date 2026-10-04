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

  // Helper to generate clinical normalization guidance for common lab tests
  const getNormalizationAdvice = (item: LabResultItem) => {
    const lower = item.test.toLowerCase();
    const isHigh = item.status === "High";

    if (lower.includes("a1c") || lower.includes("glucose") || lower.includes("sugar")) {
      return {
        cause: isHigh
          ? "Indicates prolonged elevation in circulating blood glucose saturation over recent months."
          : "Lower than expected blood sugar concentration, which can lead to lightheadedness or fatigue.",
        actions: isHigh
          ? [
              "Incorporate complex, high-soluble fiber foods (oats, legumes, leafy greens) to smooth glycemic curves.",
              "Reduce refined sugars, sweetened beverages, and simple starches.",
              "Engage in 20-30 minutes of daily post-meal moderate walking to activate muscle glucose uptake.",
              "Coordinate with your doctor regarding HbA1c re-testing cadence and glucose management protocols.",
            ]
          : [
              "Consume regular, balanced meals containing complex carbohydrates and healthy proteins.",
              "Carry a portable fast-acting glucose source if experiencing hypoglycemia episodes.",
              "Review medication timing with your healthcare provider.",
            ],
      };
    }

    if (lower.includes("bilirubin") || lower.includes("liver") || lower.includes("alt") || lower.includes("ast") || lower.includes("sgpt") || lower.includes("sgot")) {
      return {
        cause: isHigh
          ? "Elevated circulating bile pigment, reflecting biliary clearance slowdown, liver stress, or rapid RBC breakdown."
          : "Low hepatic enzyme levels, usually within normal clinical variation.",
        actions: [
          "Avoid alcohol and non-essential hepatotoxic supplements or unnecessary OTC analgesics (e.g. high-dose acetaminophen).",
          "Stay consistently hydrated with 2-2.5L of water daily to support liver filtration and bile synthesis.",
          "Emphasize antioxidant-rich foods like cruciferous vegetables (broccoli, brussels sprouts) and green tea.",
          "Request a physician review for potential liver ultrasound or viral screening if elevated concurrently.",
        ],
      };
    }

    if (lower.includes("cholesterol") || lower.includes("lipid") || lower.includes("triglyceride") || lower.includes("ldl")) {
      return {
        cause: isHigh
          ? "Elevated blood lipids that can gradually deposit along arterial walls over time if unmanaged."
          : "Low circulating lipid levels, generally considered low cardiovascular risk.",
        actions: [
          "Replace saturated and trans fats with heart-healthy monounsaturated fats (extra virgin olive oil, avocados, walnuts).",
          "Add 5-10g of soluble fiber daily (chia seeds, flaxseed, psyllium husk) to actively bind intestinal cholesterol.",
          "Maintain weekly aerobic cardiovascular exercise (at least 150 minutes of moderate activity).",
          "Consult with your doctor to calculate your overall 10-year ASCVD risk profile.",
        ],
      };
    }

    if (lower.includes("sodium") || lower.includes("potassium") || lower.includes("chloride") || lower.includes("electrolyte")) {
      return {
        cause: isHigh
          ? "Elevated electrolyte concentration, often related to mild dehydration or altered renal filtration."
          : "Depressed serum electrolyte levels, potentially related to excess fluid intake, diuretic medications, or losses.",
        actions: [
          "Review daily fluid and mineral balance; avoid sudden drastic swings in plain water consumption.",
          "Check whether current blood pressure or heart medications (e.g. ACE inhibitors, diuretics) are influencing electrolytes.",
          "Incorporate mineral-appropriate whole foods (e.g. bananas, coconut water for potassium; balanced seasoning for sodium).",
          "Discuss medication adjustments and repeat metabolic testing with your physician.",
        ],
      };
    }

    if (lower.includes("hemoglobin") || lower.includes("rbc") || lower.includes("hematocrit")) {
      return {
        cause: isHigh
          ? "Elevated red cell mass or secondary concentration, sometimes linked to chronic dehydration or hypoxia."
          : "Reduced oxygen-carrying capacity (anemia), which may contribute to fatigue or shortness of breath.",
        actions: isHigh
          ? [
              "Maintain optimal daily hydration to rule out hemoconcentration.",
              "Avoid smoking or secondhand smoke exposure.",
              "Review with your doctor to check for secondary causes.",
            ]
          : [
              "Incorporate dietary iron sources (lean meats, spinach, lentils) paired with vitamin C to maximize absorption.",
              "Ensure adequate intake of folate and vitamin B12.",
              "Ask your doctor for a complete iron panel (ferritin, iron saturation) to pinpoint the specific anemia etiology.",
            ],
      };
    }

    if (lower.includes("creatinine") || lower.includes("bun") || lower.includes("urea") || lower.includes("renal")) {
      return {
        cause: isHigh
          ? "Elevated muscle breakdown byproduct, indicating reduced glomerular filtration rate in the kidneys."
          : "Lower than standard creatinine, commonly seen with low muscle mass or high hydration.",
        actions: [
          "Avoid NSAID painkillers (e.g. ibuprofen, naproxen) which restrict renal blood flow.",
          "Maintain consistent moderate hydration without water-loading.",
          "Moderate excessive concentrated protein supplements.",
          "Have your physician calculate your eGFR (estimated Glomerular Filtration Rate) alongside urine microalbumin.",
        ],
      };
    }

    // Generic fallback for any other biomarker
    return {
      cause: isHigh
        ? `Measured result is +${item.deviation ? item.deviation : ""}% above standard laboratory reference corridors.`
        : `Measured result is ${item.deviation ? item.deviation : ""}% below expected baseline physiological corridor.`,
      actions: [
        "Record any recent symptom changes, energy fluctuations, or dietary shifts to discuss at your next appointment.",
        "Maintain regular sleep, whole-food nutrition, and consistent hydration.",
        "Bring this lab report to your primary physician to determine if repeat confirmatory testing is indicated.",
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
              Prioritized Action Plan: Highs, Lows &amp; Normalization Steps
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review flagged biomarkers first with evidence-based guidance to help restore optimal baseline levels
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {highItems.length > 0 && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-status-error-soft text-status-error-strong border border-status-error-border">
              {highItems.length} Elevated
            </span>
          )}
          {lowItems.length > 0 && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-status-warning-soft text-status-warning-strong border border-status-warning-border">
              {lowItems.length} Deficient
            </span>
          )}
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-status-success-soft text-status-success-strong border border-status-success-border">
            {normalItems.length} Optimal
          </span>
        </div>
      </div>

      {/* Accordion Container */}
      <div className="space-y-4">
        {/* SECTION 1: ELEVATED BIOMARKERS (HIGH PRIORITY) */}
        {highItems.length > 0 && (
          <div className="border border-status-error-border rounded-xl overflow-hidden bg-status-error-bg/30">
            <button
              onClick={() => toggleItem("section_high")}
              className="w-full p-4 flex items-center justify-between bg-status-error-bg hover:bg-status-error-soft/60 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <AlertCircle className="w-4 h-4 text-status-error-strong" />
                <span className="font-bold text-sm text-status-error-strong tracking-tight">
                  High Priority: Elevated Biomarkers ({highItems.length})
                </span>
                <span className="text-[11px] font-medium text-status-error-foreground hidden sm:inline">
                  — Parameters exceeding standard laboratory maximum
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
                              (Ref: &lt; {item.refHigh ?? "Normal"} {item.unit || ""})
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 text-muted-foreground transition-transform ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </div>

                        {/* Collapsible Action Plan & Normalization Steps */}
                        {isOpen && (
                          <div className="mt-3.5 pt-3 border-t border-border text-xs space-y-3">
                            <div>
                              <span className="font-bold text-foreground text-[11px] block uppercase tracking-wider mb-1">
                                Clinical Context:
                              </span>
                              <p className="text-muted-foreground leading-relaxed">
                                {advice.cause}
                              </p>
                            </div>

                            <div className="bg-primary/5 rounded-xl p-3 border border-primary/20 space-y-2">
                              <span className="font-bold text-foreground text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
                                <Apple className="w-3.5 h-3.5 text-primary" />
                                Actionable Steps to Normalize {item.test}:
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
                                    `What are the most effective evidence-based lifestyle changes to reduce my elevated ${item.test} (${item.value} ${item.unit || ""})?`
                                  );
                                }}
                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                              >
                                <Sparkles className="w-3 h-3 text-primary-foreground" />
                                <span>Ask Copilot for Custom Plan</span>
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

        {/* SECTION 2: DEFICIENT BIOMARKERS (LOW PRIORITY) */}
        {lowItems.length > 0 && (
          <div className="border border-status-warning-border rounded-xl overflow-hidden bg-status-warning-bg/30">
            <button
              onClick={() => toggleItem("section_low")}
              className="w-full p-4 flex items-center justify-between bg-status-warning-bg hover:bg-status-warning-soft/60 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-status-warning-strong" />
                <span className="font-bold text-sm text-status-warning-strong tracking-tight">
                  Deficient Biomarkers ({lowItems.length})
                </span>
                <span className="text-[11px] font-medium text-status-warning-foreground hidden sm:inline">
                  — Parameters below established physiological baseline
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
                              (Ref: &gt; {item.refLow ?? "Normal"} {item.unit || ""})
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 text-muted-foreground transition-transform ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </div>

                        {/* Collapsible Action Plan & Normalization Steps */}
                        {isOpen && (
                          <div className="mt-3.5 pt-3 border-t border-border text-xs space-y-3">
                            <div>
                              <span className="font-bold text-foreground text-[11px] block uppercase tracking-wider mb-1">
                                Clinical Context:
                              </span>
                              <p className="text-muted-foreground leading-relaxed">
                                {advice.cause}
                              </p>
                            </div>

                            <div className="bg-primary/5 rounded-xl p-3 border border-primary/20 space-y-2">
                              <span className="font-bold text-foreground text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
                                <Activity className="w-3.5 h-3.5 text-primary" />
                                Actionable Steps to Replenish &amp; Normalize {item.test}:
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
                                    `What foods or lifestyle habits help bring low ${item.test} (${item.value} ${item.unit || ""}) back into normal range?`
                                  );
                                }}
                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                              >
                                <Sparkles className="w-3 h-3 text-primary-foreground" />
                                <span>Ask Copilot for Plan</span>
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

        {/* SECTION 3: OPTIMAL (NORMAL) METRICS */}
        {normalItems.length > 0 && (
          <div className="border border-status-success-border rounded-xl overflow-hidden bg-status-success-bg/30">
            <button
              onClick={() => toggleItem("section_normal")}
              className="w-full p-4 flex items-center justify-between bg-status-success-bg hover:bg-status-success-soft/60 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-status-success-strong" />
                <span className="font-bold text-sm text-status-success-strong tracking-tight">
                  Optimal Biomarkers ({normalItems.length})
                </span>
                <span className="text-[11px] font-medium text-status-success-foreground hidden sm:inline">
                  — Parameters safely within validated target corridors
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
                      onAskAboutTest(`What makes ${item.test} optimal and how can I maintain it?`)
                    }
                    title="Click to query maintenance habits"
                  >
                    <div>
                      <span className="font-bold text-foreground text-xs block">
                        {item.test}
                      </span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        {item.refLow !== null && item.refHigh !== null
                          ? `${item.refLow} – ${item.refHigh} ${item.unit || ""}`
                          : "Optimal Corridor"}
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
