import { StatusType } from "@/types";

export interface ClassifiedResult {
  test: string;
  value: number;
  unit: string | null;
  refLow: number | null;
  refHigh: number | null;
  status: StatusType;
  deviation: number | null;
  isFallbackRange: boolean;
  interpretation: string | null;
}

/**
 * Deterministically checks clinical lab values against reference intervals.
 * Uses exact math, avoiding model hallucination.
 */
export function classifyResult(
  test: string,
  value: number,
  refLow: number | null | undefined,
  refHigh: number | null | undefined,
  unit: string | null | undefined,
  isFallbackRange = false,
  interpretation?: string | null
): ClassifiedResult {
  const low = refLow != null && !isNaN(refLow) ? refLow : null;
  const high = refHigh != null && !isNaN(refHigh) ? refHigh : null;

  let status: StatusType = "Normal";
  let deviation: number | null = null;

  if (low !== null && value < low) {
    status = "Low";
    deviation = low !== 0 ? Math.round(((value - low) / low) * 100 * 10) / 10 : null;
  } else if (high !== null && value > high) {
    status = "High";
    deviation = high !== 0 ? Math.round(((value - high) / high) * 100 * 10) / 10 : null;
  } else {
    status = "Normal";
    deviation = 0;
  }

  return {
    test: test.trim(),
    value,
    unit: unit ? unit.trim() : null,
    refLow: low,
    refHigh: high,
    status,
    deviation,
    isFallbackRange,
    interpretation: interpretation || null,
  };
}
