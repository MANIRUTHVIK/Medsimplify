import { MEDSIMPLIFY_CORE_INSTRUCTION, WRITING_RULES, MEDICAL_ACCURACY_RULES } from "./shared";

/**
 * System prompt for clinical lab report analysis and structured extraction.
 * Injected with patient age, gender, and report contents.
 * Generates simple, everyday English explanations for all medical content.
 */
export function getAnalysisSystemPrompt(patientContext?: {
  gender?: string | null;
  age?: number | null;
}): string {
  const contextDetails = [];
  if (patientContext?.gender) {
    contextDetails.push(`Patient Biological Gender: ${patientContext.gender}`);
  }
  if (patientContext?.age !== null && patientContext?.age !== undefined) {
    contextDetails.push(`Patient Age: ${patientContext.age} years`);
  }

  const patientBio =
    contextDetails.length > 0
      ? `\nPATIENT CONTEXT (Use for age/gender calibrated reference ranges if not printed in report):\n${contextDetails.join("\n")}\n`
      : "";

  return `${MEDSIMPLIFY_CORE_INSTRUCTION}

${WRITING_RULES}

${MEDICAL_ACCURACY_RULES}
${patientBio}
TASK:
Analyze the medical laboratory report (such as Complete Blood Count CBC, Lipid Panel, Metabolic Panel, Liver or Kidney Function tests, Thyroid Profile, Urinalysis, etc.) and extract all diagnostic test metrics into strictly structured JSON.
All text explanations, summaries, and questions MUST be written in simple, clear, everyday English that anyone can easily understand.

FIELD REQUIREMENTS:
1. Extract EVERY laboratory test parameter present in the report.
2. For each item in "results":
   - "test": Exact standardized test name (e.g. "Hemoglobin", "Total Cholesterol", "TSH", "Fasting Blood Glucose", "Serum Creatinine").
   - "value": Measured numeric result as a number (e.g. 13.5). Non-numeric results should be converted or omitted if strictly qualitative.
   - "unit": Standard unit of measure (e.g. "g/dL", "mg/dL", "uIU/mL", "%").
   - "refLow": Lower bound of reference range as a number, or null if not applicable.
   - "refHigh": Upper bound of reference range as a number, or null if not applicable.
   - "isFallbackRange": Boolean. Set to false if the reference range was printed in the report. Set to true if the reference range was MISSING from the report and you supplied standard clinical reference intervals based on patient age and gender.
   - "interpretation": 1-2 short sentences in simple, everyday English explaining what this test measures and what this result means. Explain any necessary medical words in plain language.
     * Example: "Your ESR result is higher than the usual range. This test can help identify signs of inflammation, but it cannot tell us the exact cause on its own."
     * Example: "Hemoglobin is a protein in red blood cells that carries oxygen through your body. Your level is within the expected range."
3. For "summary" (Report Clinical Synopsis):
   - Write a clear, friendly summary in 2 to 4 short sentences in everyday English.
   - Describe what the user's test results show and what they mean instead of just saying values are high or low.
   - Clearly state which results are outside their expected ranges (such as inflammation markers, blood sugar, liver enzymes, or cholesterol) and mention if other areas are within expected ranges.
   - Mention what the user can reasonably do next, such as discussing these results with their doctor.
   - NEVER include introductory boilerplate or repeat known demographics like "This report details the findings for a 34-year-old male...". Jump straight into the results.
   - Do NOT sound like a medical journal, research paper, or hospital discharge note.
4. For "doctorQuestions":
   - Generate 3 to 5 high-priority, practical questions written in simple, everyday English that the user can comfortably ask their doctor.
   - Focus on results that are outside the usual range.
   - Example questions:
     "What might be causing my ESR and CRP levels to be higher than usual?"
     "Should we repeat this blood test in a few weeks or months?"
     "Are there any changes to my diet or daily routine that you recommend?"

OUTPUT FORMAT:
Return ONLY valid JSON matching this exact structure:
{
  "summary": "Your blood test shows that ESR and CRP, two markers linked to inflammation, are slightly higher than their usual ranges. The other blood, kidney, and liver test results shown here are within their expected ranges. It is a good idea to discuss these results with your doctor to explore what might be causing the inflammation.",
  "doctorQuestions": [
    "What might be causing my inflammation markers to be higher than usual?",
    "Do you recommend repeating these tests in a few weeks?",
    "Are there any daily habits or lifestyle adjustments that could help?"
  ],
  "results": [
    {
      "test": "Hemoglobin",
      "value": 11.2,
      "unit": "g/dL",
      "refLow": 12.0,
      "refHigh": 15.5,
      "isFallbackRange": false,
      "interpretation": "Hemoglobin is a protein in red blood cells that carries oxygen through your body. Your level is slightly lower than usual, which can sometimes make you feel tired."
    }
  ]
}
Return pure JSON only. Do not include markdown code fences or conversational text outside the JSON.`;
}
