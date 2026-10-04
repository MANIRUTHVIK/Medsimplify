"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signupAction } from "./actions";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    gender: "MALE",
    dateOfBirth: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Client-side quick validations
    const errors: Record<string, string> = {};

    if (/\d/.test(formData.name)) {
      errors.name = "Name cannot contain numbers. Please use only letters.";
    }

    if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters.";
    }

    if (!formData.email.trim() || !formData.email.includes("@")) {
      errors.email = "Please enter a valid email address.";
    }

    if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters long.";
    }

    if (formData.dateOfBirth) {
      const selectedDate = new Date(formData.dateOfBirth);
      const now = new Date();
      if (selectedDate > now) {
        errors.dateOfBirth = "Date of birth cannot be in the future.";
      }
    } else {
      errors.dateOfBirth = "Date of birth is required.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please correct the errors in the form before submitting.");
      return;
    }

    startTransition(async () => {
      const res = await signupAction(formData);
      if (res.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(res.error || "Failed to create account");
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
          <CardTitle className="text-2xl text-secondary font-bold">Create Health Account</CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Register to archive your diagnostic lab reports and receive personalized reference range evaluations.
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
              Full Name
            </label>
            <Input
              type="text"
              required
              placeholder="e.g. Jane Doe"
              value={formData.name}
              error={fieldErrors.name}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, name: val });
                if (/\d/.test(val)) {
                  setFieldErrors((prev) => ({ ...prev, name: "Name cannot contain numbers" }));
                } else if (fieldErrors.name) {
                  setFieldErrors((prev) => {
                    const copy = { ...prev };
                    delete copy.name;
                    return copy;
                  });
                }
              }}
            />
          </div>

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
              placeholder="At least 6 characters"
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

          {/* Biological Context for Reference Ranges */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">
                Gender (for lab ranges)
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-card border border-border rounded-[var(--radius)] text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">
                Date of Birth
              </label>
              <Input
                type="date"
                required
                max={today}
                value={formData.dateOfBirth}
                error={fieldErrors.dateOfBirth}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, dateOfBirth: val });
                  if (val && new Date(val) > new Date()) {
                    setFieldErrors((prev) => ({ ...prev, dateOfBirth: "Date of birth cannot be in the future" }));
                  } else if (fieldErrors.dateOfBirth) {
                    setFieldErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.dateOfBirth;
                      return copy;
                    });
                  }
                }}
              />
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" variant="primary" disabled={isPending} className="w-full py-2.5">
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </div>

          <div className="text-center pt-2 text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="sign-in-link font-semibold">
              Sign In
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
