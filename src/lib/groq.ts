import Groq from "groq-sdk";
import { QA_SYSTEM_PROMPT, getQAContextPrompt, ChatHistoryMessage } from "./prompts/prompt_qa";
import { getAnalysisSystemPrompt } from "./prompts/prompt_analysis";
import { RawAnalysisResponse } from "./gemini";

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured in .env");
  }
  return new Groq({ apiKey });
}

/**
 * Primary patient Q&A powered by Groq with last 15 messages session history.
 */
export async function askGroqQA(
  question: string,
  reportContext: unknown,
  history: ChatHistoryMessage[] = []
): Promise<string> {
  const groq = getGroqClient();
  const candidateModels = Array.from(
    new Set(
      [
        process.env.GROQ_MODEL,
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "mixtral-8x7b-32768",
        "gemma2-9b-it",
      ].filter(Boolean) as string[]
    )
  );

  const contextText = getQAContextPrompt(reportContext);
  const recentHistory = history.slice(-15);

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    {
      role: "system",
      content: `${QA_SYSTEM_PROMPT}\n\n${contextText}`,
    },
    ...recentHistory.map((h) => ({
      role: h.role,
      content: h.content,
    })),
    {
      role: "user",
      content: question,
    },
  ];

  let lastError: unknown;
  for (const model of candidateModels) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        temperature: 0.2,
        messages,
      });

      const response = completion.choices[0]?.message?.content;
      if (response) return response;
    } catch (err: unknown) {
      lastError = err;
      // If model not found or rate limited, try next candidate
      console.warn(`Groq model ${model} failed, attempting next candidate:`, err instanceof Error ? err.message : err);
    }
  }

  throw lastError || new Error("All Groq model candidates failed");
}

/**
 * Fallback text-based report analysis using Groq for extracted PDF text.
 */
export async function extractReportWithGroq(
  text: string,
  patientContext?: { gender?: string | null; age?: number | null }
): Promise<RawAnalysisResponse> {
  const groq = getGroqClient();
  const candidateModels = Array.from(
    new Set(
      [
        process.env.GROQ_MODEL,
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "mixtral-8x7b-32768",
        "gemma2-9b-it",
      ].filter(Boolean) as string[]
    )
  );

  const systemInstruction = getAnalysisSystemPrompt(patientContext);

  let lastError: unknown;
  for (const model of candidateModels) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: `EXTRACTED LAB REPORT TEXT:\n${text}` },
        ],
      });

      const content = completion.choices[0]?.message?.content || "{}";
      return JSON.parse(content);
    } catch (err) {
      lastError = err;
      console.warn(`Groq extraction with ${model} failed:`, err instanceof Error ? err.message : err);
    }
  }

  throw lastError || new Error("All Groq model extraction candidates failed");
}
