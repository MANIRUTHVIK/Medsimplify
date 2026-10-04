# MedSimplify – Medical Report Analysis & Understanding Dashboard

---

## ABSTRACT
Medical reports such as blood tests, lipid profiles, metabolic panels and thyroid profiles are dense with clinical acronyms, measurements, and numerical reference intervals that non-specialist patients cannot decipher on their own. As a result, patients often either panic unnecessarily or overlook critical health markers.

**MedSimplify** is an intelligent, patient-centric health analytics dashboard designed to transform raw laboratory reports into visual, structured, and comprehensible health summaries. Users register their account with their gender and date of birth to give the system biological context. Uploading or dragging-and-dropping single or multiple reports in batch (PDFs or scanned photos) activates an automated processing queue. Direct PDF parsing (`pdf-parse`) and multimodal large language models (Google Gemini 1.5 Flash) extract test names, measured values, units, and reference ranges. When reference intervals are missing from a printed lab slip, MedSimplify automatically applies age- and gender-calibrated clinical intervals derived from medical knowledge.

Every parameter is evaluated through a deterministic TypeScript engine into Normal (Green), Low (Amber), or High (Red) statuses with exact percentage deviations. The dashboard displays interactive charts (Recharts), summary metrics, and automatically generates tailored **"Questions to Ask Your Doctor"**. A grounded conversational Q&A assistant (powered by Google Gemini with automatic Groq failover) lets patients ask questions regarding their reports and receive clinically safe, non-diagnostic guidance on lifestyle and diet. The system is built with Next.js 16 (App Router) adopting a modern Server Actions (`actions.ts`) architecture, Neon Serverless PostgreSQL with Prisma ORM, and Cloudinary for private, authenticated report file storage.

**Keywords:** Medical report analysis, Next.js App Router, Server Actions, Gemini Vision, Groq, Cloudinary, Neon PostgreSQL, Prisma ORM, health informatics.

---

## SYSTEM ARCHITECTURE & MODULE WORKFLOWS

### Key Architectural Guidelines
1. **Next.js App Router Reserved Files**:
   - `layout.tsx`: Shared UI layouts.
   - `page.tsx`: Unique route screens (`(auth)/login`, `(auth)/signup`, `dashboard`, `dashboard/[id]`, `dashboard/settings`).
   - `loading.tsx`: Route Suspense skeletons.
   - `error.tsx`: Client-side error boundary with retry.
   - `middleware.ts`: Edge session validation.
   - `route.ts`: Exclusively reserved for third-party webhooks or external HTTP consumers.
2. **Server Actions (`actions.ts`) over `route.ts`**:
   - All internal UI mutations and data fetching use Server Actions colocated within the feature directory (`app/dashboard/actions.ts`, `app/(auth)/login/actions.ts`).
   - Every Server Action authenticates and extracts user identity before querying the database.
   - Returns a structured envelope `{ success: boolean, data?: T, error?: string, message?: string }`.
3. **Colocation & Component Standards**:
   - Route-specific components live inside `_components/` in the route directory.
   - Generic UI primitives reside in `components/ui/`.
   - File names strictly adhere to `kebab-case`.
