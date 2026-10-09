"use client";

import React, { useState } from "react";
import { Search, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { LabResultItem } from "@/types";

interface ResultsTableProps {
  results: LabResultItem[];
  selectedCategory?: string;
  onAskAboutTest: (testName: string) => void;
}

export function ResultsTable({
  results,
  selectedCategory = "ALL",
  onAskAboutTest,
}: ResultsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ABNORMAL" | "NORMAL">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const pageSize = 8;

  // Filter based on search, statusFilter, and selectedCategory
  const filtered = results.filter((item) => {
    const matchesSearch =
      item.test.toLowerCase().includes(search.toLowerCase()) ||
      (item.interpretation && item.interpretation.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === "ABNORMAL") {
      if (item.status !== "Low" && item.status !== "High") return false;
    } else if (statusFilter === "NORMAL") {
      if (item.status !== "Normal") return false;
    }

    if (selectedCategory !== "ALL") {
      const lower = item.test.toLowerCase();
      if (selectedCategory === "ENDOCRINE") {
        return (
          lower.includes("glucose") ||
          lower.includes("a1c") ||
          lower.includes("hba1c") ||
          lower.includes("sugar") ||
          lower.includes("insulin") ||
          lower.includes("tsh") ||
          lower.includes("thyroid")
        );
      }
      if (selectedCategory === "LIVER") {
        return (
          lower.includes("bilirubin") ||
          lower.includes("sgot") ||
          lower.includes("sgpt") ||
          lower.includes("alt") ||
          lower.includes("ast") ||
          lower.includes("alkaline") ||
          lower.includes("liver") ||
          lower.includes("hepatic") ||
          lower.includes("albumin")
        );
      }
      if (selectedCategory === "KIDNEY") {
        return (
          lower.includes("creatinine") ||
          lower.includes("bun") ||
          lower.includes("urea") ||
          lower.includes("uric") ||
          lower.includes("microalbumin") ||
          lower.includes("egfr") ||
          lower.includes("kidney") ||
          lower.includes("renal")
        );
      }
      if (selectedCategory === "ELECTROLYTES") {
        return (
          lower.includes("sodium") ||
          lower.includes("potassium") ||
          lower.includes("chloride") ||
          lower.includes("calcium") ||
          lower.includes("magnesium") ||
          lower.includes("electrolyte")
        );
      }
      if (selectedCategory === "LIPID") {
        return (
          lower.includes("cholesterol") ||
          lower.includes("triglyceride") ||
          lower.includes("hdl") ||
          lower.includes("ldl") ||
          lower.includes("vldl") ||
          lower.includes("lipid")
        );
      }
      if (selectedCategory === "CBC") {
        return (
          lower.includes("hemoglobin") ||
          lower.includes("rbc") ||
          lower.includes("wbc") ||
          lower.includes("platelet") ||
          lower.includes("hematocrit")
        );
      }
    }

    return true;
  })
  .sort((a, b) => {
    // Sort High and Low (abnormal) parameters first before Normal
    const getSeverity = (status: string) => {
      if (status === "High") return 0;
      if (status === "Low") return 1;
      return 2;
    };
    return getSeverity(a.status) - getSeverity(b.status);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedResults = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const abnormalCount = results.filter((r) => r.status === "Low" || r.status === "High").length;
  const normalCount = results.filter((r) => r.status === "Normal").length;

  // Mini inline pin position helper
  const getMiniPinPosition = (item: LabResultItem): number => {
    const val = item.value;
    const low = item.refLow;
    const high = item.refHigh;

    if (low !== null && high !== null && high > low) {
      if (val < low) return 15;
      if (val > high) return 85;
      const ratio = (val - low) / (high - low);
      return 35 + ratio * 35;
    }
    return 50;
  };

  return (
    <section className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-border flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-foreground tracking-tight">
              Diagnostic Biomarker Parameters
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {filtered.length} Parameters
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Calibrated values against clinical target reference intervals
          </p>
        </div>

        {/* Controls: Search + Status Pill Filters */}
        <div className="flex items-center flex-wrap gap-2.5 w-full sm:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-60">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter biomarker or organ..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-hidden transition-colors"
            />
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
          </div>

          {/* Filter Pills */}
          <div className="inline-flex rounded-xl bg-muted/40 p-0.5 text-xs font-medium border border-border">
            <button
              onClick={() => {
                setStatusFilter("ALL");
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({results.length})
            </button>
            <button
              onClick={() => {
                setStatusFilter("ABNORMAL");
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                statusFilter === "ABNORMAL"
                  ? "bg-status-error text-white shadow-xs"
                  : "text-status-error-strong hover:text-status-error"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-status-error" />
              Critical Flags ({abnormalCount})
            </button>
            <button
              onClick={() => {
                setStatusFilter("NORMAL");
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === "NORMAL"
                  ? "bg-status-success text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Normal ({normalCount})
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/40 border-b border-border">
              <th className="py-3 px-5">Biomarker Parameter</th>
              <th className="py-3 px-4">Patient Result</th>
              <th className="py-3 px-4">Standard Corridor</th>
              <th className="py-3 px-6 min-w-[140px]">Range Distribution</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedResults.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  No diagnostic biomarkers match your active search or filters.
                </td>
              </tr>
            ) : (
              paginatedResults.map((item, idx) => {
                const isHigh = item.status === "High";
                const isLow = item.status === "Low";
                const isNormal = item.status === "Normal";
                const pinPos = getMiniPinPosition(item);
                const isExpanded = expandedRow === item.id || expandedRow === item.test;

                return (
                  <React.Fragment key={idx}>
                    <tr className="hover:bg-muted/30 transition-colors group">
                      {/* Biomarker Parameter */}
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-foreground text-sm flex items-center gap-2">
                          <span>{item.test}</span>
                          {isHigh && (
                            <span className="text-[10px] font-bold text-status-error-strong bg-status-error-soft border border-status-error-border px-1.5 py-0.2 rounded">
                              Elevated
                            </span>
                          )}
                          {isLow && (
                            <span className="text-[10px] font-bold text-status-warning-strong bg-status-warning-soft border border-status-warning-border px-1.5 py-0.2 rounded">
                              Low
                            </span>
                          )}
                        </div>
                        {item.interpretation && (
                          <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                            {item.interpretation}
                          </div>
                        )}
                      </td>

                      {/* Patient Result */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div
                          className={`font-extrabold text-sm ${
                            isHigh
                              ? "text-status-error-strong"
                              : isLow
                              ? "text-status-warning-strong"
                              : "text-status-success-strong"
                          }`}
                        >
                          {item.value}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            {item.unit || ""}
                          </span>
                        </div>
                        {item.deviation !== null && item.deviation !== 0 && (
                          <div
                            className={`text-[10px] font-semibold ${
                              isHigh ? "text-status-error-strong" : "text-status-warning-strong"
                            }`}
                          >
                            {item.deviation > 0 ? `+${item.deviation}% Dev` : `${item.deviation}% Dev`}
                          </div>
                        )}
                      </td>

                      {/* Standard Corridor */}
                      <td className="py-3.5 px-4 text-foreground whitespace-nowrap">
                        <div className="font-medium">
                          {item.refLow !== null && item.refHigh !== null
                            ? `${item.refLow} – ${item.refHigh} ${item.unit || ""}`
                            : item.refLow !== null
                            ? `> ${item.refLow} ${item.unit || ""}`
                            : item.refHigh !== null
                            ? `< ${item.refHigh} ${item.unit || ""}`
                            : "Standard Target"}
                        </div>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">
                          {item.isFallbackRange ? "Standard range for age/gender" : "Lab standard range"}
                        </span>
                      </td>

                      {/* Inline Horizontal Range Bar */}
                      <td className="py-3.5 px-6 min-w-[140px]">
                        <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden flex shadow-2xs">
                          <div className="w-[30%] bg-status-warning-soft h-full" />
                          <div className="w-[50%] bg-status-success-soft h-full" />
                          <div className="w-[20%] bg-status-error-soft h-full" />
                        </div>
                        <div className="relative w-full h-1 mt-0.5">
                          <div
                            className={`absolute -top-2.5 transform -translate-x-1/2 w-2.5 h-2.5 rounded-full border border-card shadow-xs ${
                              isHigh ? "bg-status-error" : isLow ? "bg-status-warning" : "bg-status-success"
                            }`}
                            style={{ left: `${pinPos}%` }}
                          />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isHigh && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-status-error-soft text-status-error-strong border border-status-error-border">
                            High
                          </span>
                        )}
                        {isLow && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-status-warning-soft text-status-warning-strong border border-status-warning-border">
                            Low
                          </span>
                        )}
                        {isNormal && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-status-success-soft text-status-success-strong border border-status-success-border">
                            Normal
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => onAskAboutTest(item.test)}
                          className="inline-flex items-center px-2.5 py-1 rounded-lg border border-primary/30 hover:border-primary bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-semibold text-xs transition-all shadow-xs cursor-pointer active:scale-[0.98]"
                          title="Ask AI assistant about this parameter"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          <span>Ask AI</span>
                        </button>
                        <button
                          onClick={() =>
                            setExpandedRow(isExpanded ? null : item.id || item.test)
                          }
                          className="inline-flex items-center p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                          title="Details & Clinical Context"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Details Row */}
                    {isExpanded && (
                      <tr className="bg-muted/20">
                        <td colSpan={6} className="p-4 border-b border-border">
                          <div className="bg-card p-3.5 rounded-xl border border-border text-xs space-y-2">
                            <div className="font-bold text-foreground flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-primary" />
                              <span>What {item.test} measures and next steps</span>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                              {item.interpretation ||
                                "This test measures typical levels in your body. If your result is outside the expected range, talk with your doctor about what it means."}
                            </p>
                            <div className="pt-2 flex flex-wrap items-center gap-2">
                              <button
                                onClick={() =>
                                  onAskAboutTest(
                                    `What simple steps or daily habits can help with my ${item.test} level?`
                                  )
                                }
                                className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 font-semibold transition-colors cursor-pointer"
                              >
                                What can help with my {item.test} level?
                              </button>
                              <button
                                onClick={() =>
                                  onAskAboutTest(
                                    `What questions should I ask my doctor about my ${item.test} result of ${item.value} ${item.unit || ""}?`
                                  )
                                }
                                className="text-[11px] px-2.5 py-1 rounded-lg bg-card border border-border hover:bg-muted text-foreground font-semibold transition-colors cursor-pointer"
                              >
                                Questions to ask my doctor about {item.test}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Pagination */}
      <div className="px-6 py-3 bg-muted/30 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing {Math.min(filtered.length, (currentPage - 1) * pageSize + 1)} -{" "}
          {Math.min(filtered.length, currentPage * pageSize)} of {filtered.length} parameters
        </span>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-lg border border-border bg-card text-foreground hover:bg-muted/40 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Previous
          </button>
          <span className="px-2 font-semibold text-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 rounded-lg border border-border bg-card text-foreground hover:bg-muted/40 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
