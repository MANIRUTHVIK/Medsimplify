import { extractReportWithGemini, askGeminiQA, RawAnalysisResponse } from "./gemini";
import { extractReportWithGroq, askGroqQA } from "./groq";
import { ChatHistoryMessage } from "./prompts/prompt_qa";

/**
 * Extracts lab data with Gemini Multimodal as primary, and Groq as text fallback.
 */
export async function analyzeReportAI(input: {
  text?: string;
  fileBuffer?: Buffer;
  mimeType?: string;
  patientContext?: { gender?: string | null; age?: number | null };
}): Promise<RawAnalysisResponse> {
  const provider = (process.env.LLM_PROVIDER || "gemini").toLowerCase();

  if (provider === "groq" && input.text && input.text.length > 50) {
    try {
      return await extractReportWithGroq(input.text, input.patientContext);
    } catch (groqErr) {
      console.warn("Groq extraction failed, falling back to Gemini:", groqErr);
      return await extractReportWithGemini(input);
    }
  }

  try {
    return await extractReportWithGemini(input);
  } catch (geminiErr) {
    console.warn("Gemini extraction failed, attempting Groq fallback:", geminiErr);
    if (input.text && input.text.length > 50) {
      return await extractReportWithGroq(input.text, input.patientContext);
    }
    throw geminiErr;
  }
}

/**
 * Handles grounded patient Q&A based on configured LLM_PROVIDER (defaults to Gemini).
 * Automatic failover between Gemini and Groq if either fails.
 */
export async function askPatientQAAI(
  question: string,
  reportContext: unknown,
  history: ChatHistoryMessage[] = []
): Promise<{ answer: string; provider: "groq" | "gemini" }> {
  const provider = (process.env.LLM_PROVIDER || "gemini").toLowerCase();

  if (provider === "gemini") {
    try {
      const answer = await askGeminiQA(question, reportContext, history);
      return { answer, provider: "gemini" };
    } catch (geminiErr) {
      console.warn("Gemini Q&A failed, falling back to Groq:", geminiErr);
      const answer = await askGroqQA(question, reportContext, history);
      return { answer, provider: "groq" };
    }
  }

  try {
    const answer = await askGroqQA(question, reportContext, history);
    return { answer, provider: "groq" };
  } catch (groqErr) {
    console.warn("Groq Q&A failed, falling back to Gemini:", groqErr);
    const answer = await askGeminiQA(question, reportContext, history);
    return { answer, provider: "gemini" };
  }
}

