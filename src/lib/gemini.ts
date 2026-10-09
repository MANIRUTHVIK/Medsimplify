import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAnalysisSystemPrompt } from "./prompts/prompt_analysis";
import { QA_SYSTEM_PROMPT, getQAContextPrompt, ChatHistoryMessage } from "./prompts/prompt_qa";

export interface RawExtractedItem {
  test: string;
  value: number;
  unit: string | null;
  refLow: number | null;
  refHigh: number | null;
  isFallbackRange: boolean;
  interpretation: string | null;
}

export interface RawAnalysisResponse {
  summary: string;
  doctorQuestions: string[];
  results: RawExtractedItem[];
}

export async function extractReportWithGemini(input: {
  text?: string;
  fileBuffer?: Buffer;
  mimeType?: string;
  patientContext?: { gender?: string | null; age?: number | null };
}): Promise<RawAnalysisResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in .env");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const candidateModels = [
    process.env.GEMINI_MODEL,
    "gemini-3.8-flash",
    "gemini-3.1-pro",
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
  ].filter(Boolean) as string[];

  const systemInstruction = getAnalysisSystemPrompt(input.patientContext);
  const promptParts: (string | { inlineData: { data: string; mimeType: string } })[] = [
    systemInstruction,
  ];

  if (input.text && input.text.trim().length > 0) {
    promptParts.push(`\nEXTRACTED REPORT TEXT:\n${input.text}`);
  }

  if (input.fileBuffer && input.mimeType) {
    promptParts.push({
      inlineData: {
        data: input.fileBuffer.toString("base64"),
        mimeType: input.mimeType,
      },
    });
  }

  let lastError: unknown;
  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      const response = await model.generateContent(promptParts);
      const rawText = response.response.text().trim();

      let cleaned = rawText;
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```/, "").replace(/```$/, "").trim();
      }

      return JSON.parse(cleaned);
    } catch (err) {
      lastError = err;
      console.warn(`Gemini extraction with ${modelName} failed, trying fallback:`, err instanceof Error ? err.message : err);
    }
  }

  throw lastError || new Error("All Gemini extraction models failed");
}

export async function askGeminiQA(
  question: string,
  reportContext: unknown,
  history: ChatHistoryMessage[] = []
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in .env");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const candidateModels = [
    process.env.GEMINI_MODEL,
    "gemini-3.8-flash",
    "gemini-3.1-pro",
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
  ].filter(Boolean) as string[];

  const contextText = getQAContextPrompt(reportContext);
  const recentHistory = history.slice(-14);
  const rawGeminiHistory = recentHistory.map((h) => ({
    role: h.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: h.content }],
  }));

  // Gemini strictly requires the first turn to be 'user'
  while (rawGeminiHistory.length > 0 && rawGeminiHistory[0].role !== "user") {
    rawGeminiHistory.shift();
  }

  // Ensure alternating roles: user -> model -> user -> model
  const geminiHistory: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];
  for (const item of rawGeminiHistory) {
    if (!item.parts[0]?.text?.trim()) continue;
    if (geminiHistory.length === 0) {
      if (item.role === "user") {
        geminiHistory.push(item);
      }
    } else {
      const prev = geminiHistory[geminiHistory.length - 1];
      if (prev.role !== item.role) {
        geminiHistory.push(item);
      }
    }
  }

  let lastError: unknown;
  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: `${QA_SYSTEM_PROMPT}\n\n${contextText}`,
      });

      const chat = model.startChat({
        history: geminiHistory,
      });

      const response = await chat.sendMessage(question);
      return response.response.text();
    } catch (err) {
      lastError = err;
      console.warn(`Gemini QA model ${modelName} failed, trying fallback:`, err instanceof Error ? err.message : err);
    }
  }

  throw lastError || new Error("All Gemini models failed");
}

