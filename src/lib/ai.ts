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
 * Handles grounded patient Q&A: Groq as primary, Gemini as automatic failover,
 * retaining the last 15 messages of conversation history.
 */
export async function askPatientQAAI(
  question: string,
  reportContext: unknown,
  history: ChatHistoryMessage[] = []
): Promise<{ answer: string; provider: "groq" | "gemini" }> {
  try {
    const answer = await askGroqQA(question, reportContext, history);
    return { answer, provider: "groq" };
  } catch (groqErr) {
    console.warn("Groq Q&A failed, falling back to Gemini:", groqErr);
    const answer = await askGeminiQA(question, reportContext, history);
    return { answer, provider: "gemini" };
  }
}

