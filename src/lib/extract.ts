export interface ExtractionResult {
  text: string;
  pageCount: number;
  needsVision: boolean;
}

/**
 * Extracts embedded text from a PDF buffer.
 * If text is sparse (scanned file), flags needsVision = true for Gemini Multimodal.
 */
export async function extractTextFromPDF(
  buffer: Buffer,
  mimeType: string
): Promise<ExtractionResult> {
  if (mimeType === "application/pdf") {
    try {
      // Dynamic require ensures compatibility in Next.js Server Components / Actions
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdf = require("pdf-parse");
      const data = await pdf(buffer);
      const cleanText = data.text ? data.text.trim() : "";

      if (cleanText.length > 50) {
        return {
          text: cleanText,
          pageCount: data.numpages || 1,
          needsVision: false,
        };
      }
    } catch (err) {
      console.warn("Direct PDF text parsing failed, proceeding to vision model:", err);
    }
  }

  return {
    text: "",
    pageCount: 1,
    needsVision: true,
  };
}
