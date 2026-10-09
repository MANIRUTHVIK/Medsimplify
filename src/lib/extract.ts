export interface ExtractionResult {
  text: string;
  pageCount: number;
  needsVision: boolean;
}

/**
 * Polyfill browser canvas / geometry primitives expected by pdfjs-dist in Node.js
 */
function ensurePdfEnvironment() {
  const g = globalThis as unknown as Record<string, unknown>;
  if (typeof g.DOMMatrix === "undefined") {
    g.DOMMatrix = class DOMMatrix {
      a = 1;
      b = 0;
      c = 0;
      d = 1;
      e = 0;
      f = 0;
      m11 = 1;
      m12 = 0;
      m21 = 0;
      m22 = 1;
      m41 = 0;
      m42 = 0;
    };
  }
  if (typeof g.ImageData === "undefined") {
    g.ImageData = class ImageData {
      data: Uint8ClampedArray;
      width: number;
      height: number;
      constructor(width = 1, height = 1) {
        this.width = width;
        this.height = height;
        this.data = new Uint8ClampedArray(width * height * 4);
      }
    };
  }
  if (typeof g.Path2D === "undefined") {
    g.Path2D = class Path2D {};
  }
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
      ensurePdfEnvironment();

      // Dynamic require ensures compatibility in Next.js Server Components / Actions
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfModule = require("pdf-parse");

      let cleanText = "";
      let pageCount = 1;

      // pdf-parse v2 exposes PDFParse class
      if (pdfModule && typeof pdfModule.PDFParse === "function") {
        const parser = new pdfModule.PDFParse({ data: buffer });
        try {
          const result = await parser.getText();
          cleanText = result?.text ? result.text.trim() : "";
          pageCount = result?.pages?.length || 1;
        } finally {
          if (typeof parser.destroy === "function") {
            try {
              await parser.destroy();
            } catch {
              // Ignore cleanup errors
            }
          }
        }
      } else if (typeof pdfModule === "function") {
        // pdf-parse v1 style
        const data = await pdfModule(buffer);
        cleanText = data.text ? data.text.trim() : "";
        pageCount = data.numpages || 1;
      }

      if (cleanText.length > 50) {
        return {
          text: cleanText,
          pageCount,
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
