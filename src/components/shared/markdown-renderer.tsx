"use client";

import React from "react";
import { Info, ChevronRight } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Parses inline formatting: **bold**, *italic*, `code`, and highlights.
 */
function renderInlineFormatting(text: string): React.ReactNode[] {
  if (!text) return [];

  // Match **bold**, *italic*, `code`
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={index} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return (
        <em key={index} className="italic text-foreground/90">
          {part.slice(1, -1)}
        </em>
      );
    }

    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded-md bg-muted text-[11px] font-mono text-foreground border border-border"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

/**
 * Preprocesses markdown string to normalize line breaks, remove standalone bullets, etc.
 */
function preprocessLines(rawText: string): string[] {
  const rawLines = rawText.replace(/\r\n/g, "\n").split("\n");
  const lines: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const trimmed = rawLines[i].trim();

    // If a line is just an isolated bullet symbol, merge it with the subsequent line
    if ((trimmed === "•" || trimmed === "-" || trimmed === "*") && i + 1 < rawLines.length) {
      let nextIdx = i + 1;
      while (nextIdx < rawLines.length && !rawLines[nextIdx].trim()) {
        nextIdx++;
      }
      if (nextIdx < rawLines.length) {
        lines.push(`${trimmed} ${rawLines[nextIdx].trim()}`);
        i = nextIdx;
        continue;
      }
    }

    lines.push(rawLines[i]);
  }

  return lines;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  if (!content) return null;

  const lines = preprocessLines(content);
  const elements: React.ReactNode[] = [];

  let idx = 0;
  let blockKey = 0;

  while (idx < lines.length) {
    const line = lines[idx];
    const trimmed = line.trim();

    // 1. Skip completely blank lines
    if (!trimmed) {
      idx++;
      continue;
    }

    // 2. Horizontal divider: --- or *** or ___
    if (/^[-*_]{3,}$/.test(trimmed)) {
      elements.push(
        <hr key={`hr-${blockKey++}`} className="my-3 border-border/70" />
      );
      idx++;
      continue;
    }

    // 3. Markdown Tables: Lines starting with or containing |
    if (trimmed.startsWith("|") || (trimmed.includes("|") && lines[idx + 1]?.trim().includes("---"))) {
      const tableLines: string[] = [];
      while (idx < lines.length && lines[idx].trim().includes("|")) {
        tableLines.push(lines[idx]);
        idx++;
      }

      const rows = tableLines
        .map((l) =>
          l
            .trim()
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map((c) => c.trim())
        )
        .filter((r) => r.length > 0);

      if (rows.length > 0) {
        const headerRow = rows[0];
        const dataRows = rows.slice(1).filter(
          (r) => !r.every((cell) => /^[-:\s]+$/.test(cell))
        );

        elements.push(
          <div
            key={`table-${blockKey++}`}
            className="overflow-x-auto my-3 rounded-xl border border-border bg-card shadow-2xs"
          >
            <table className="w-full text-xs text-left border-collapse min-w-[280px]">
              <thead>
                <tr className="bg-muted/60 border-b border-border">
                  {headerRow.map((cell, cIdx) => (
                    <th
                      key={cIdx}
                      className="px-3 py-2 font-bold text-secondary text-[11px] uppercase tracking-wider whitespace-nowrap"
                    >
                      {renderInlineFormatting(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {dataRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-muted/30 transition-colors">
                    {row.map((cell, cIdx) => {
                      const lower = cell.toLowerCase().trim();
                      let statusBadge: React.ReactNode = null;

                      if (lower === "high" || lower === "critical high") {
                        statusBadge = (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-error-soft text-status-error-strong border border-status-error-border">
                            {cell}
                          </span>
                        );
                      } else if (lower === "low" || lower === "critical low") {
                        statusBadge = (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-warning-soft text-status-warning-strong border border-status-warning-border">
                            {cell}
                          </span>
                        );
                      } else if (lower === "normal" || lower === "optimal") {
                        statusBadge = (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-success-soft text-status-success-strong border border-status-success-border">
                            {cell}
                          </span>
                        );
                      }

                      return (
                        <td key={cIdx} className="px-3 py-2 text-foreground align-top">
                          {statusBadge || renderInlineFormatting(cell)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // 4. Headings: #, ##, ###, ####
    if (trimmed.startsWith("#")) {
      const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const headingText = match[2];

        if (level === 1) {
          elements.push(
            <h2
              key={`h1-${blockKey++}`}
              className="text-sm font-bold text-foreground mt-4 mb-2 pb-1 border-b border-border/60 flex items-center gap-1.5"
            >
              <span className="w-1.5 h-3.5 rounded-full bg-primary inline-block" />
              <span>{renderInlineFormatting(headingText)}</span>
            </h2>
          );
        } else if (level === 2) {
          elements.push(
            <h3
              key={`h2-${blockKey++}`}
              className="text-xs font-bold text-foreground mt-3.5 mb-1.5 pb-1 border-b border-border/40 flex items-center gap-1.5"
            >
              <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{renderInlineFormatting(headingText)}</span>
            </h3>
          );
        } else {
          elements.push(
            <h4
              key={`h3-${blockKey++}`}
              className="text-xs font-semibold text-secondary mt-3 mb-1"
            >
              {renderInlineFormatting(headingText)}
            </h4>
          );
        }
        idx++;
        continue;
      }
    }

    // 5. Blockquotes: > ...
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (idx < lines.length && lines[idx].trim().startsWith(">")) {
        quoteLines.push(lines[idx].trim().replace(/^>\s*/, ""));
        idx++;
      }
      elements.push(
        <div
          key={`quote-${blockKey++}`}
          className="border-l-2 border-primary bg-primary/5 px-3 py-2 rounded-r-xl my-2 text-xs text-foreground flex items-start gap-2 shadow-2xs"
        >
          <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            {quoteLines.map((ql, qIdx) => (
              <p key={qIdx}>{renderInlineFormatting(ql)}</p>
            ))}
          </div>
        </div>
      );
      continue;
    }

    // 6. Bullet Lists: •, -, *
    const isBullet = trimmed.startsWith("• ") || trimmed.startsWith("- ") || trimmed.startsWith("* ");
    const isNumbered = /^\d+\.\s/.test(trimmed);

    if (isBullet || isNumbered) {
      const listItems: Array<{ text: string; isNum: boolean; num?: string }> = [];

      while (idx < lines.length) {
        const curTrimmed = lines[idx].trim();
        const curIsBullet =
          curTrimmed.startsWith("• ") || curTrimmed.startsWith("- ") || curTrimmed.startsWith("* ");
        const curNumMatch = curTrimmed.match(/^(\d+)\.\s+(.*)$/);

        if (curIsBullet) {
          listItems.push({ text: curTrimmed.replace(/^[•\-*]\s+/, ""), isNum: false });
          idx++;
        } else if (curNumMatch) {
          listItems.push({ text: curNumMatch[2], isNum: true, num: curNumMatch[1] });
          idx++;
        } else {
          break;
        }
      }

      elements.push(
        <ul key={`list-${blockKey++}`} className="space-y-1.5 my-2 pl-0.5">
          {listItems.map((item, lIdx) => {
            // Check for key-value pair pattern like "Infections: Bacterial or viral..."
            const colonMatch = item.text.match(/^([^:]+):\s*(.*)$/);
            let renderedContent: React.ReactNode;

            if (colonMatch && !colonMatch[1].includes("**") && colonMatch[1].length < 35) {
              renderedContent = (
                <span>
                  <strong className="font-semibold text-foreground">
                    {colonMatch[1]}:
                  </strong>{" "}
                  {renderInlineFormatting(colonMatch[2])}
                </span>
              );
            } else {
              renderedContent = renderInlineFormatting(item.text);
            }

            return (
              <li key={lIdx} className="flex items-start gap-2 text-xs leading-relaxed text-foreground">
                {item.isNum ? (
                  <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {item.num}
                  </span>
                ) : (
                  <span className="text-primary font-bold mt-0.5 leading-none shrink-0">•</span>
                )}
                <div className="flex-1">{renderedContent}</div>
              </li>
            );
          })}
        </ul>
      );
      continue;
    }

    // 7. Regular paragraph
    elements.push(
      <p key={`p-${blockKey++}`} className="text-xs leading-relaxed text-foreground my-1.5">
        {renderInlineFormatting(trimmed)}
      </p>
    );
    idx++;
  }

  return <div className={`space-y-1 text-foreground ${className}`}>{elements}</div>;
}
