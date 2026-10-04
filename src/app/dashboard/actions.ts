"use server";

import { z } from "zod";
import { db } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { uploadReportToCloudinary, deleteReportFromCloudinary } from "@/lib/cloudinary";
import { extractTextFromPDF } from "@/lib/extract";
import { analyzeReportAI, askPatientQAAI } from "@/lib/ai";
import { classifyResult } from "@/lib/classify";
import { calculateAge } from "@/lib/utils";
import { ActionResponse, ReportAnalysisData, LabResultItem } from "@/types";
import { revalidatePath } from "next/cache";
import { Gender } from "@prisma/client";
import { logger } from "@/lib/logger";

/**
 * Retrieves all reports belonging to the authenticated user.
 */
export async function getUserReportsAction(): Promise<
  ActionResponse<
    Array<{
      id: string;
      filename: string;
      uploadedAt: string;
      summary: string | null;
      resultsCount: number;
      abnormalCount: number;
    }>
  >
> {
  const user = await getCurrentUser();
  if (!user) {
    logger.error("getUserReportsAction unauthorized");
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  logger.info("getUserReportsAction started", { userId: user.id });

  try {
    const reports = await db.report.findMany({
      where: { userId: user.id },
      include: {
        results: {
          select: { status: true },
        },
      },
      orderBy: { uploadedAt: "desc" },
    });

    const formatted = reports.map((r) => {
      const abnormal = r.results.filter(
        (item) => item.status === "Low" || item.status === "High"
      ).length;

      return {
        id: r.id,
        filename: r.filename,
        uploadedAt: r.uploadedAt.toISOString(),
        summary: r.summary,
        resultsCount: r.results.length,
        abnormalCount: abnormal,
      };
    });

    logger.info("getUserReportsAction succeeded", { userId: user.id, count: formatted.length });
    return { success: true, data: formatted };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load reports";
    logger.error("getUserReportsAction failed", err, { userId: user.id });
    return { success: false, error: message };
  }
}

/**
 * Fetches a single report, its analyzed test items, and chat history.
 */
export async function getReportDetailAction(
  reportId: string
): Promise<
  ActionResponse<{
    report: ReportAnalysisData;
    chats: Array<{ id: string; question: string; answer: string; provider: string; askedAt: string }>;
  }>
> {
  const user = await getCurrentUser();
  if (!user) {
    logger.error("getReportDetailAction unauthorized");
    return { success: false, error: "Unauthorized" };
  }

  logger.info("getReportDetailAction started", { reportId, userId: user.id });

  try {
    const report = await db.report.findUnique({
      where: { id: reportId },
      include: {
        results: true,
        chats: { orderBy: { askedAt: "asc" } },
      },
    });

    if (!report || report.userId !== user.id) {
      logger.error("getReportDetailAction report not found or access denied", null, { reportId, userId: user.id });
      return { success: false, error: "Report not found or access denied." };
    }

    const doctorQuestions: string[] = report.doctorQuestions
      ? JSON.parse(report.doctorQuestions)
      : [];

    const results: LabResultItem[] = report.results.map((r) => ({
      id: r.id,
      test: r.test,
      value: r.value,
      unit: r.unit,
      refLow: r.refLow,
      refHigh: r.refHigh,
      status: r.status as "Normal" | "Low" | "High",
      deviation: r.deviation,
      isFallbackRange: r.isFallbackRange,
      interpretation: r.interpretation,
    }));

    const normal = results.filter((r) => r.status === "Normal").length;
    const low = results.filter((r) => r.status === "Low").length;
    const high = results.filter((r) => r.status === "High").length;

    logger.info("getReportDetailAction succeeded", { reportId, userId: user.id, resultsCount: results.length });
    return {
      success: true,
      data: {
        report: {
          reportId: report.id,
          filename: report.filename,
          uploadedAt: report.uploadedAt.toISOString(),
          summary: report.summary || "No summary available.",
          doctorQuestions,
          stats: {
            total: results.length,
            normal,
            low,
            high,
          },
          results,
        },
        chats: report.chats.map((c) => ({
          id: c.id,
          question: c.question,
          answer: c.answer,
          provider: c.provider,
          askedAt: c.askedAt.toISOString(),
        })),
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load report";
    logger.error("getReportDetailAction failed", err, { reportId, userId: user.id });
    return { success: false, error: message };
  }
}

/**
 * Uploads a report file to Cloudinary, extracts parameters with Gemini,
 * applies age/gender fallback ranges, deterministically classifies them, and saves to Neon DB.
 */
export async function uploadAndAnalyzeReportAction(
  formData: FormData
): Promise<ActionResponse<{ reportId: string }>> {
  const user = await getCurrentUser();
  if (!user) {
    logger.error("uploadAndAnalyzeReportAction unauthorized attempt");
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    logger.error("uploadAndAnalyzeReportAction no file provided", null, { userId: user.id });
    return { success: false, error: "No file was provided." };
  }

  const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/webp"];
  const isPdfExt = file.name.toLowerCase().endsWith(".pdf");
  const isImageExt = /\.(jpe?g|png|webp)$/i.test(file.name);

  if (!allowedTypes.includes(file.type) && !isImageExt && !isPdfExt) {
    logger.error("uploadAndAnalyzeReportAction unsupported file type", null, {
      userId: user.id,
      filename: file.name,
      fileType: file.type,
    });
    return {
      success: false,
      error: "Unsupported file type. Please upload a PDF, PNG, JPG, or WebP report.",
    };
  }

  logger.info("uploadAndAnalyzeReportAction started", {
    userId: user.id,
    filename: file.name,
    size: file.size,
    type: file.type,
  });

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const effectiveMime =
      file.type && file.type !== "application/octet-stream"
        ? file.type
        : file.name.toLowerCase().endsWith(".webp")
        ? "image/webp"
        : file.name.toLowerCase().endsWith(".png")
        ? "image/png"
        : file.name.toLowerCase().endsWith(".pdf")
        ? "application/pdf"
        : "image/jpeg";

    // 1. Upload to Cloudinary private storage
    const uploadRes = await uploadReportToCloudinary(buffer, file.name);

    // 2. Direct text extraction for digital PDFs
    const textExtraction = await extractTextFromPDF(buffer, effectiveMime);

    // 3. Compute patient age & gender context
    const age = calculateAge(user.dateOfBirth);
    const gender = user.gender;

    // 4. Multimodal AI Analysis with Age/Gender fallback context
    const rawAnalysis = await analyzeReportAI({
      text: textExtraction.text,
      fileBuffer: textExtraction.needsVision ? buffer : undefined,
      mimeType: effectiveMime,
      patientContext: { gender, age },
    });

    // 5. Deterministic classification of each test result
    const classifiedResults = (rawAnalysis.results || []).map((item) =>
      classifyResult(
        item.test,
        item.value,
        item.refLow,
        item.refHigh,
        item.unit,
        item.isFallbackRange,
        item.interpretation
      )
    );

    // 6. Save Report and Results in Neon PostgreSQL
    const savedReport = await db.report.create({
      data: {
        userId: user.id,
        filename: file.name,
        mime: effectiveMime,
        fileUrl: uploadRes.url,
        publicId: uploadRes.publicId,
        resourceType: uploadRes.resourceType,
        summary: rawAnalysis.summary,
        doctorQuestions: JSON.stringify(rawAnalysis.doctorQuestions || []),
        results: {
          create: classifiedResults.map((r) => ({
            test: r.test,
            value: r.value,
            unit: r.unit,
            refLow: r.refLow,
            refHigh: r.refHigh,
            status: r.status,
            deviation: r.deviation,
            isFallbackRange: r.isFallbackRange,
            interpretation: r.interpretation,
          })),
        },
      },
    });

    revalidatePath("/dashboard");
    logger.info("uploadAndAnalyzeReportAction succeeded", {
      reportId: savedReport.id,
      userId: user.id,
      resultsCount: classifiedResults.length,
    });
    return { success: true, data: { reportId: savedReport.id } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process report";
    logger.error("uploadAndAnalyzeReportAction failed", err, {
      filename: file?.name,
      userId: user?.id,
    });
    return { success: false, error: message };
  }
}

/**
 * Grounded conversational Q&A for an individual report.
 * Powered primarily by Groq with Gemini fallback.
 */
export async function askReportQuestionAction(
  reportId: string,
  question: string
): Promise<ActionResponse<{ answer: string; provider: string }>> {
  const user = await getCurrentUser();
  if (!user) {
    logger.error("askReportQuestionAction unauthorized attempt", null, { reportId });
    return { success: false, error: "Unauthorized" };
  }

  if (!question.trim()) {
    logger.error("askReportQuestionAction empty question", null, { reportId, userId: user.id });
    return { success: false, error: "Question cannot be empty." };
  }

  logger.info("askReportQuestionAction started", {
    reportId,
    userId: user.id,
    questionLength: question.length,
  });

  try {
    const report = await db.report.findUnique({
      where: { id: reportId },
      include: { results: true },
    });

    if (!report || report.userId !== user.id) {
      logger.error("askReportQuestionAction report not found or unauthorized", null, {
        reportId,
        userId: user.id,
      });
      return { success: false, error: "Report not found" };
    }

    const reportContext = {
      filename: report.filename,
      summary: report.summary,
      results: report.results.map((r) => ({
        test: r.test,
        value: r.value,
        unit: r.unit,
        refLow: r.refLow,
        refHigh: r.refHigh,
        status: r.status,
        deviation: r.deviation,
        isFallbackRange: r.isFallbackRange,
      })),
    };

    // Fetch conversation history for this report (up to last 15 messages)
    const priorChats = await db.qaHistory.findMany({
      where: { reportId: report.id },
      orderBy: { askedAt: "desc" },
      take: 8, // 8 Q&A interactions yield up to 16 messages
    });

    const chronological = [...priorChats].reverse();
    const history: Array<{ role: "user" | "assistant"; content: string }> = chronological
      .flatMap((c) => [
        { role: "user" as const, content: c.question },
        { role: "assistant" as const, content: c.answer },
      ])
      .slice(-15);

    const aiRes = await askPatientQAAI(question, reportContext, history);

    // Save chat interaction to Neon PostgreSQL
    await db.qaHistory.create({
      data: {
        reportId: report.id,
        question,
        answer: aiRes.answer,
        provider: aiRes.provider,
      },
    });

    logger.info("askReportQuestionAction succeeded", {
      reportId,
      provider: aiRes.provider,
      answerLength: aiRes.answer.length,
    });

    return {
      success: true,
      data: {
        answer: aiRes.answer,
        provider: aiRes.provider,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to answer question";
    logger.error("askReportQuestionAction failed", err, { reportId, userId: user?.id });
    return { success: false, error: message };
  }
}

/**
 * Deletes a report, its files from Cloudinary, and cascades database records.
 */
export async function deleteReportAction(reportId: string): Promise<ActionResponse<void>> {
  const user = await getCurrentUser();
  if (!user) {
    logger.error("deleteReportAction unauthorized attempt", null, { reportId });
    return { success: false, error: "Unauthorized" };
  }

  logger.info("deleteReportAction started", { reportId, userId: user.id });

  try {
    const report = await db.report.findUnique({
      where: { id: reportId },
    });

    if (!report || report.userId !== user.id) {
      logger.error("deleteReportAction report not found or unauthorized", null, {
        reportId,
        userId: user.id,
      });
      return { success: false, error: "Report not found" };
    }

    // 1. Delete from Cloudinary
    await deleteReportFromCloudinary(report.publicId, report.resourceType);

    // 2. Cascade delete from Neon DB
    await db.report.delete({
      where: { id: report.id },
    });

    revalidatePath("/dashboard");
    logger.info("deleteReportAction succeeded", { reportId, userId: user.id });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete report";
    logger.error("deleteReportAction failed", err, { reportId, userId: user?.id });
    return { success: false, error: message };
  }
}

const UpdateSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name cannot exceed 60 characters")
    .regex(/^[A-Za-z\s'-]+$/, "Name can only contain alphabetic letters, spaces, and hyphens (numbers and special characters are not allowed)")
    .optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  dateOfBirth: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), "Please enter a valid date")
    .refine((val) => {
      if (!val) return true;
      const dob = new Date(val);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return dob <= today;
    }, "Date of birth cannot be in the future")
    .refine((val) => {
      if (!val) return true;
      const dob = new Date(val);
      const minDate = new Date(1900, 0, 1);
      return dob >= minDate;
    }, "Date of birth must be after year 1900")
    .optional(),
});

/**
 * Updates patient profile settings (Name, Gender, Date of Birth).
 */
export async function updateUserSettingsAction(data: {
  name?: string;
  gender?: string;
  dateOfBirth?: string;
}): Promise<ActionResponse<void>> {
  const user = await getCurrentUser();
  if (!user) {
    logger.error("updateUserSettingsAction unauthorized attempt");
    return { success: false, error: "Unauthorized" };
  }

  logger.info("updateUserSettingsAction started", { userId: user.id, data });

  try {
    const parseResult = UpdateSettingsSchema.safeParse(data);
    if (!parseResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parseResult.error.issues) {
        const field = issue.path[0]?.toString() || "general";
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      logger.error("updateUserSettingsAction validation failed", parseResult.error, {
        userId: user.id,
        fieldErrors,
      });
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || "Validation failed",
        fieldErrors,
      };
    }

    const validated = parseResult.data;

    await db.user.update({
      where: { id: user.id },
      data: {
        name: validated.name !== undefined ? validated.name : undefined,
        gender: validated.gender ? (validated.gender as Gender) : undefined,
        dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : undefined,
      },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    logger.info("updateUserSettingsAction succeeded", { userId: user.id });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update profile";
    logger.error("updateUserSettingsAction failed", err, { userId: user?.id });
    return { success: false, error: message };
  }
}

export interface VitalTimelinePoint {
  date: string;
  formattedDate: string;
  value: number;
  unit: string | null;
  status: string;
  refLow: number | null;
  refHigh: number | null;
  reportId: string;
  filename: string;
}

export interface VitalSeries {
  test: string;
  unit: string | null;
  points: VitalTimelinePoint[];
  latestStatus: string;
  latestValue: number;
  refLow: number | null;
  refHigh: number | null;
}

/**
 * Aggregates biomarker test values across all historical lab reports sorted chronologically
 */
export async function getUserVitalsTrendsAction(): Promise<
  ActionResponse<{
    series: VitalSeries[];
    totalReports: number;
  }>
> {
  const user = await getCurrentUser();
  if (!user) {
    logger.error("getUserVitalsTrendsAction unauthorized");
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  logger.info("getUserVitalsTrendsAction started", { userId: user.id });

  try {
    const reports = await db.report.findMany({
      where: { userId: user.id },
      orderBy: { uploadedAt: "asc" },
      include: {
        results: true,
      },
    });

    const seriesMap = new Map<string, VitalSeries>();

    reports.forEach((report) => {
      const dateStr = report.uploadedAt.toISOString();
      const formattedDate = new Date(report.uploadedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      report.results.forEach((r) => {
        // Normalize test name for grouping
        const key = r.test.trim();
        const point: VitalTimelinePoint = {
          date: dateStr,
          formattedDate,
          value: r.value,
          unit: r.unit,
          status: r.status,
          refLow: r.refLow,
          refHigh: r.refHigh,
          reportId: report.id,
          filename: report.filename,
        };

        if (!seriesMap.has(key)) {
          seriesMap.set(key, {
            test: key,
            unit: r.unit,
            points: [point],
            latestStatus: r.status,
            latestValue: r.value,
            refLow: r.refLow,
            refHigh: r.refHigh,
          });
        } else {
          const s = seriesMap.get(key)!;
          s.points.push(point);
          s.latestStatus = r.status;
          s.latestValue = r.value;
          if (r.refLow !== null) s.refLow = r.refLow;
          if (r.refHigh !== null) s.refHigh = r.refHigh;
          if (r.unit) s.unit = r.unit;
        }
      });
    });

    // Return series sorted by number of data points and abnormal status priority
    const allSeries = Array.from(seriesMap.values()).sort((a, b) => {
      const aAbnormal = a.latestStatus !== "Normal" ? 1 : 0;
      const bAbnormal = b.latestStatus !== "Normal" ? 1 : 0;
      if (aAbnormal !== bAbnormal) return bAbnormal - aAbnormal;
      return b.points.length - a.points.length;
    });

    logger.info("getUserVitalsTrendsAction succeeded", {
      userId: user.id,
      seriesCount: allSeries.length,
      reportsCount: reports.length,
    });

    return {
      success: true,
      data: {
        series: allSeries,
        totalReports: reports.length,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load vitals trends";
    logger.error("getUserVitalsTrendsAction failed", err, { userId: user.id });
    return { success: false, error: message };
  }
}

