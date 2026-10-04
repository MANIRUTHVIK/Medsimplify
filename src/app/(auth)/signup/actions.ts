"use server";

import { z } from "zod";
import { db } from "@/db";
import { hashPassword, signToken, COOKIE_NAME, AUTH_COOKIE_OPTIONS } from "@/lib/auth";
import { cookies } from "next/headers";
import { ActionResponse } from "@/types";
import { Gender } from "@prisma/client";
import { logger } from "@/lib/logger";

const SignupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(60, "Full name cannot exceed 60 characters")
    .regex(/^[A-Za-z\s'-]+$/, "Name can only contain alphabetic letters, spaces, and hyphens (numbers and special characters are not allowed)"),
  email: z
    .string()
    .trim()
    .min(1, "Email address is required")
    .email("Please enter a valid email address (e.g. name@example.com)"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password cannot exceed 100 characters"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((val) => !isNaN(Date.parse(val)), "Please enter a valid date")
    .refine((val) => {
      const dob = new Date(val);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return dob <= today;
    }, "Date of birth cannot be in the future")
    .refine((val) => {
      const dob = new Date(val);
      const minDate = new Date(1900, 0, 1);
      return dob >= minDate;
    }, "Date of birth must be after year 1900")
    .optional(),
});

export async function signupAction(formData: {
  name: string;
  email: string;
  password: string;
  gender?: string;
  dateOfBirth?: string;
}): Promise<ActionResponse<{ userId: string }>> {
  logger.info("signupAction started", { email: formData.email, name: formData.name });
  try {
    const parseResult = SignupSchema.safeParse(formData);

    if (!parseResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parseResult.error.issues) {
        const fieldName = issue.path[0]?.toString() || "general";
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      }
      const firstError = parseResult.error.issues[0]?.message || "Validation failed";
      logger.error("signupAction validation failed", parseResult.error, { fieldErrors });
      return {
        success: false,
        error: firstError,
        fieldErrors,
      };
    }

    const validated = parseResult.data;
    const emailLower = validated.email.toLowerCase();

    const existing = await db.user.findUnique({
      where: { email: emailLower },
    });

    if (existing) {
      logger.error("signupAction failed: email already exists", null, { email: emailLower });
      return {
        success: false,
        error: "An account with this email address already exists.",
        fieldErrors: { email: "An account with this email address already exists." },
      };
    }

    const passwordHash = await hashPassword(validated.password);

    const user = await db.user.create({
      data: {
        name: validated.name,
        email: emailLower,
        passwordHash,
        gender: validated.gender ? (validated.gender as Gender) : null,
        dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : null,
      },
    });

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);

    logger.info("signupAction succeeded", { userId: user.id, email: user.email });
    return { success: true, data: { userId: user.id } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to register account";
    logger.error("signupAction unhandled exception", err, { email: formData.email });
    return { success: false, error: message };
  }
}
