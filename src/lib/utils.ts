import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes cleanly with conflict resolution.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculates current age in years from Date of Birth.
 */
export function calculateAge(dob: string | Date | null | undefined): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= 0 ? age : null;
}

/**
 * Formats standard date strings cleanly.
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Normalizes report filename for presentation:
 * Strips file extensions (.pdf, .webp, .png, etc.), replaces hyphens and underscores with spaces,
 * and capitalizes each word.
 * E.g. "dummy.webp" -> "Dummy", "annual-metabolic-panel_v2.pdf" -> "Annual Metabolic Panel V2"
 */
export function formatReportName(filename: string | null | undefined): string {
  if (!filename) return "Laboratory Report";
  // Remove file extension
  const withoutExt = filename.replace(/\.[a-zA-Z0-9]+$/, "");
  // Replace hyphens, underscores, dots with spaces
  const clean = withoutExt.replace(/[-_.]+/g, " ").trim();
  if (!clean) return "Laboratory Report";

  const acronyms = new Set(["cbc", "bmp", "cmp", "lft", "kft", "lipid", "tsh", "hba1c", "crp", "esr", "egfr", "bun"]);
  return clean
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase();
      if (acronyms.has(lower)) {
        return lower.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}
