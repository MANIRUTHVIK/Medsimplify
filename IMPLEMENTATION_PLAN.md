# MedSimplify – Technical Architecture & Implementation Plan

## 1. Project Overview & Clinical Mission
- **Project Name:** MedSimplify – Medical Report Analysis & Understanding Dashboard

---

## 2. Core Functional Requirements (Updated)

1. **User Account, Gender & Date of Birth Context**:
   - User signs up with name, email, password, **gender** (Male, Female, Other), and **Date of Birth (DOB)**.
   - Age and biological gender are automatically derived and used for personalized, clinically accurate range checking.
   - Profile settings allow updating gender and DOB at any time.

2. **Drag & Drop Multi-Report Upload & Processing Queue**:
   - Supports dragging and dropping single or multiple reports in batch (PDF, PNG, JPG, WEBP up to 15MB).
   - High-contrast animated drag state, instant file format/size validation, and staged file management.
   - Reports enter a visible client-side processing queue with real-time status indicators (Queued → Analyzing → Complete with direct report link → Error retry).

3. **Dual-Path Extraction with Age & Gender Reference Range Fallback**:
   - Digital text PDFs parsed via `pdf-parse`; scanned documents/photos parsed via **Google Gemini Multimodal Vision**.
   - **Contextual Fallback**: If a printed lab report does not specify reference ranges, the system uses the patient's **derived age, biological gender, and the LLM's medical knowledge** to provide the standard clinical reference interval and interpret the value accurately.

4. **Deterministic Classification, Summaries & Doctor Preparation**:
   - Deterministic classification: **Normal** (Green), **Low** (Amber), or **High** (Red) with percentage deviation.
   - Comprehensive clinical overview summary.
   - Generates tailored **"Questions to Ask Your Doctor"** based on the patient's abnormal findings.

5. **Historical Reports & Clinically Safe Grounded Q&A**:
   - Users can browse all past uploaded reports, compare metrics, and ask questions.
   - AI Chat Assistant answers safely in plain language with practical lifestyle/dietary guidance (e.g. *"How can I naturally improve low hemoglobin?"* or *"What causes elevated LDL?"*).
   - Includes safety disclaimers: strictly informational, never formulates medical diagnoses or prescribes medications.

---

## 3. Architectural Specification & Code Standards

### 3.1 Next.js App Router Reserved Files & Structure
- `layout.tsx`: Shared UI layout wrapping child routes (root layout, auth layout, dashboard layout).
- `page.tsx`: Unique UI page for a given route URL.
- `loading.tsx`: Suspense fallback skeleton screens.
- `error.tsx`: Client-side error boundary with retry mechanisms.
- `middleware.ts`: Edge-level session validation and route protection.
- `route.ts`: Exclusively reserved for third-party webhooks or external HTTP consumers (no internal UI calls).

### 3.2 Server Actions (`actions.ts`) First Principle
- **Internal UI Data Mutations & Queries**: All frontend interactions (register, login, upload, analyze, chat, delete, update settings) call Server Actions marked with `"use server"` colocated in `actions.ts`.
- **Full Type Safety**: Direct function calls with TypeScript inference.
- **Consistent Response Envelope**:
  ```ts
  export type ActionResponse<T> = {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
  };
  ```
- **In-Action Authentication**: Every server action authenticates and extracts `userId` before executing queries.

### 3.3 Colocation & Directory Layout
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   └── actions.ts
│   │   ├── signup/
│   │   │   ├── page.tsx
│   │   │   └── actions.ts
│   │   └── layout.tsx
│   ├── dashboard/
│   │   ├── page.tsx               # Main Dashboard & History View
│   │   ├── loading.tsx            # Skeleton screen
│   │   ├── error.tsx              # Error boundary
│   │   ├── actions.ts             # Dashboard Server Actions (upload, analyze, chat, delete)
│   │   ├── [id]/
│   │   │   └── page.tsx           # Single Report Deep Dive & Chat View
│   │   ├── settings/
│   │   │   ├── page.tsx           # Profile (Gender, DOB, Name) Settings
│   │   │   └── actions.ts
│   │   └── _components/           # Colocated dashboard components
│   │       ├── metrics-card.tsx
│   │       ├── results-table.tsx
│   │       ├── range-chart.tsx
│   │       ├── chat-panel.tsx
│   │       ├── upload-queue.tsx
│   │       └── doctor-questions.tsx
│   ├── layout.tsx                 # Root layout with Open Sans typography
│   └── page.tsx                   # Landing & Welcome hero page
├── components/
│   ├── ui/                        # Low-level reusable UI primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   └── dialog.tsx
│   └── shared/
│       ├── navbar.tsx
│       ├── footer.tsx
│       └── medical-disclaimer.tsx
├── hooks/
│   └── use-upload-queue.ts
├── lib/
│   ├── auth.ts                    # JWT + bcrypt session utilities
│   ├── cloudinary.ts              # Cloudinary private/authenticated SDK client
│   ├── gemini.ts                  # Google Gemini 1.5 Flash client & prompts
│   ├── groq.ts                    # Groq SDK client & fallback
│   ├── extract.ts                 # PDF text parsing (pdf-parse)
│   ├── classify.ts                # Deterministic range calculation
│   └── utils.ts                   # Tailwind cn helper, date & age calculators
├── db/
│   ├── schema.prisma              # Database schema (User, Report, Result, QAHistory)
│   └── index.ts                   # Singleton Prisma client instance
└── types/
    └── index.ts                   # Shared TypeScript definitions
```

---

## 4. Database Schema (Prisma / Neon PostgreSQL)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

model User {
  id           String    @id @default(cuid())
  name         String
  email        String    @unique
  passwordHash String
  gender       Gender?
  dateOfBirth  DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  reports      Report[]

  @@map("users")
}

model Report {
  id               String       @id @default(cuid())
  userId           String
  user             User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  filename         String
  mime             String
  fileUrl          String
  publicId         String
  resourceType     String
  summary          String?      @db.Text
  doctorQuestions  String?      @db.Text   // JSON array of suggested doctor questions
  uploadedAt       DateTime     @default(now())
  results          Result[]
  chats            QaHistory[]

  @@map("reports")
}

model Result {
  id               String   @id @default(cuid())
  reportId         String
  report           Report   @relation(fields: [reportId], references: [id], onDelete: Cascade)
  test             String
  value            Float
  unit             String?
  refLow           Float?
  refHigh          Float?
  status           String   // Low | Normal | High
  deviation        Float?
  isFallbackRange  Boolean  @default(false)
  interpretation   String?  @db.Text

  @@map("results")
}

model QaHistory {
  id        String   @id @default(cuid())
  reportId  String
  report    Report   @relation(fields: [reportId], references: [id], onDelete: Cascade)
  question  String   @db.Text
  answer    String   @db.Text
  provider  String   @default("gemini")
  askedAt   DateTime @default(now())

  @@map("qa_history")
}
```

---

## 5. Design System Tokens
- **Typography:** `Open Sans` (`next/font/google`)
- **Primary Brand Teal:** `#003748`
- **Accent Cyan / Turquoise:** `#30c5ca`
- **Clean White:** `#ffffff`
- **Dark Slate Background:** `#002531`
- **Clinical Semantic Indicators:**
  - Normal: `#10b981` (Emerald Green)
  - Low / Warning: `#f59e0b` (Amber)
  - High / Critical: `#ef4444` (Rose / Crimson)
