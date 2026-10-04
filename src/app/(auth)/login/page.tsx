"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginAction } from "./actions";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!formData.email.trim() || !formData.email.includes("@")) {
      errors.email = "Please enter a valid email address.";
    }
    if (!formData.password) {
      errors.password = "Password is required.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fill in all required fields properly.");
      return;
    }

    startTransition(async () => {
      const res = await loginAction(formData);
      if (res.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(res.error || "Failed to sign in");
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
      }
    });
  };

  return (
    <div className="w-full max-w-md">
      <Card className="border border-border shadow-[var(--auth-card-shadow)] bg-card p-6 sm:p-8">
        <CardHeader className="mb-6 pb-4">
          <CardTitle className="text-2xl text-secondary font-bold">Sign In</CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Access your previously uploaded reports, clinical evaluations, and chat history.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <div className="p-3 text-xs bg-status-error-soft text-status-error-strong border border-status-error/30 rounded-[var(--radius)] font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-secondary mb-1.5">
              Email Address
            </label>
            <Input
              type="email"
              required
              placeholder="name@example.com"
              value={formData.email}
              error={fieldErrors.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (fieldErrors.email) {
                  setFieldErrors((prev) => {
                    const copy = { ...prev };
                    delete copy.email;
                    return copy;
                  });
                }
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondary mb-1.5">
              Password
            </label>
            <Input
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              error={fieldErrors.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                if (fieldErrors.password) {
                  setFieldErrors((prev) => {
                    const copy = { ...prev };
                    delete copy.password;
                    return copy;
                  });
                }
              }}
            />
          </div>

          <div className="pt-2">
            <Button type="submit" variant="primary" disabled={isPending} className="w-full py-2.5">
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </div>

          <div className="text-center pt-2 text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="sign-in-link font-semibold">
              Create Account
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
