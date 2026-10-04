# MedSimplify – Technical Architecture & Project Guide

## 1. Project Specifications
- **Title:** MedSimplify – Medical Report Analysis & Understanding Dashboard

## 2. Core Functional Requirements
1. **Previous Reports & Historical Q&A:** View past reports, ask follow-up questions with safe lifestyle guidance (e.g., diet, hydration, exercise).
2. **User Context (Gender & Date of Birth):** Collected during signup/settings; age and sex inform range interpretations.
3. **Reference Range Fallback:** If reference ranges are missing from the report, the system uses the patient's age, gender, and clinical LLM knowledge to supply standard reference intervals.
4. **Summary & Doctor Questions:** Summary cards (High, Low, Normal) + tailored questions to ask the physician.
5. **Drag & Drop Multi-Report Upload Queue:** Drag-and-drop client queue managing file staging, format validation, and sequential processing states.

## 3. Architecture & Code Conventions
- **Server Actions (`actions.ts`) First:** All internal UI queries and mutations use `"use server"` functions colocated in the feature directory.
- **Route Handlers (`route.ts`):** Exclusively reserved for external webhooks or third-party HTTP consumers.
- **Colocation:** Feature components placed in `_components/` within the route folder.
- **File Naming:** Consistent `kebab-case`.
- **Database & ORM:** Neon Serverless PostgreSQL with Prisma ORM.
- **File Storage:** Cloudinary private/authenticated delivery.
- **Design Tokens:** Deep Teal `#003748`, Clean White `#ffffff`, Accent Cyan `#30c5ca`, Dark Slate `#002531`, Open Sans typography.
