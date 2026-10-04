"use server";

import { z } from "zod";
import { db } from "@/db";
import { verifyPassword, signToken, COOKIE_NAME, AUTH_COOKIE_OPTIONS } from "@/lib/auth";
import { cookies } from "next/headers";
import { ActionResponse } from "@/types";
import { logger } from "@/lib/logger";

const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address (e.g. name@example.com)"),
  password: z
    .string()
    .min(1, "Password is required"),
});

export async function loginAction(formData: {
  email: string;
  password: string;
}): Promise<ActionResponse<{ userId: string }>> {
  logger.info("loginAction started", { email: formData.email });
  try {
    const parseResult = LoginSchema.safeParse(formData);
    if (!parseResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parseResult.error.issues) {
        const fieldName = issue.path[0]?.toString() || "general";
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      }
      logger.error("loginAction validation failed", parseResult.error, { email: formData.email, fieldErrors });
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || "Validation failed",
        fieldErrors,
      };
    }

    const validated = parseResult.data;
    const emailLower = validated.email.toLowerCase();

    const user = await db.user.findUnique({
      where: { email: emailLower },
    });

    if (!user) {
      logger.error("loginAction user not found", null, { email: emailLower });
      return {
        success: false,
        error: "Invalid email or password.",
        fieldErrors: { password: "The credentials provided do not match our records." },
      };
    }

    const isValid = await verifyPassword(validated.password, user.passwordHash);
    if (!isValid) {
      logger.error("loginAction password mismatch", null, { email: emailLower });
      return {
        success: false,
        error: "Invalid email or password.",
        fieldErrors: { password: "The credentials provided do not match our records." },
      };
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);

    logger.info("loginAction succeeded", { userId: user.id, email: user.email });
    return { success: true, data: { userId: user.id } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to sign in";
    logger.error("loginAction unhandled exception", err, { email: formData.email });
    return { success: false, error: message };
  }
}

export async function logoutAction(): Promise<ActionResponse<void>> {
  logger.info("logoutAction started");
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
    logger.info("logoutAction succeeded");
    return { success: true };
  } catch (err: unknown) {
    logger.error("logoutAction failed", err);
    return { success: false, error: "Failed to sign out" };
  }
}
