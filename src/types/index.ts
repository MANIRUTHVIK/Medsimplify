export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
};

export type StatusType = "Normal" | "Low" | "High";

export interface LabResultItem {
  id?: string;
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

export interface ReportAnalysisData {
  reportId: string;
  filename: string;
  uploadedAt: string;
  summary: string;
  doctorQuestions: string[];
  stats: {
    total: number;
    normal: number;
    low: number;
    high: number;
  };
  results: LabResultItem[];
}
