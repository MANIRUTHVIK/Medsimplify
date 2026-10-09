"use client";

import React, { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { updateUserSettingsAction } from "../actions";
import { calculateAge } from "@/lib/utils";
import { Check, Loader2, AlertCircle } from "lucide-react";

interface SettingsFormProps {
  initialValues: {
    name: string;
    email: string;
    gender: string;
    dateOfBirth: string;
  };
}

export function SettingsForm({ initialValues }: SettingsFormProps) {
  const [name, setName] = useState(initialValues.name);
  const [gender, setGender] = useState(initialValues.gender);
  const [dateOfBirth, setDateOfBirth] = useState(initialValues.dateOfBirth);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const calculatedAge = dateOfBirth ? calculateAge(new Date(dateOfBirth)) : null;
  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (/\d/.test(name)) {
      errors.name = "Name cannot contain numbers. Please use only letters.";
    }
    if (name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters.";
    }

    if (dateOfBirth) {
      const selectedDate = new Date(dateOfBirth);
      const now = new Date();
      if (selectedDate > now) {
        errors.dateOfBirth = "Date of birth cannot be in the future.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setStatusMessage({
        type: "error",
        text: "Please correct the errors in the form before saving.",
      });
      return;
    }

    startTransition(async () => {
      const res = await updateUserSettingsAction({
        name: name.trim(),
        gender: gender || undefined,
        dateOfBirth: dateOfBirth || undefined,
      });

      if (res.success) {
        setStatusMessage({
          type: "success",
          text: "Patient demographics updated successfully.",
        });
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Failed to update profile settings.",
        });
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {statusMessage && (
        <div
          className={`p-3.5 rounded-[var(--radius)] text-xs flex items-center space-x-2.5 font-medium ${
            statusMessage.type === "success"
              ? "bg-status-success-bg border border-status-success-soft text-status-success-strong"
              : "bg-status-error-soft border border-status-error/30 text-status-error-strong"
          }`}
        >
          {statusMessage.type === "success" ? (
            <Check className="w-4 h-4 text-status-success shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-status-error shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-secondary mb-1.5">
            Full Name
          </label>
          <Input
            type="text"
            value={name}
            error={fieldErrors.name}
            onChange={(e) => {
              const val = e.target.value;
              setName(val);
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
            required
            className="text-xs"
          />
        </div>

        {/* Email (Read Only) */}
        <div>
          <label className="block text-xs font-semibold text-secondary mb-1.5">
            Registered Email
          </label>
          <Input
            type="email"
            value={initialValues.email}
            disabled
            className="text-xs bg-muted text-muted-foreground cursor-not-allowed"
          />
          <span className="text-[10px] text-muted-foreground mt-1 block">
            Email address is tied to your account authentication and cannot be changed.
          </span>
        </div>

        {/* Biological Gender */}
        <Select
          label="Biological Gender"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          selectSize="md"
          className="text-xs"
          helperText="Used to calibrate sex-stratified diagnostic reference intervals."
        >
          <option value="">Select Biological Gender</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other / Prefer not to say</option>
        </Select>

        {/* Date of Birth */}
        <div>
          <label className="block text-xs font-semibold text-secondary mb-1.5">
            Date of Birth
          </label>
          <Input
            type="date"
            value={dateOfBirth}
            error={fieldErrors.dateOfBirth}
            onChange={(e) => {
              const val = e.target.value;
              setDateOfBirth(val);
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
            max={today}
            className="text-xs"
          />
          {calculatedAge !== null && (
            <span className="text-[11px] text-secondary mt-1.5 block font-semibold">
              Calculated Patient Age: {calculatedAge} years
            </span>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          disabled={isPending}
          className="text-xs px-6 py-2.5 font-semibold"
        >
          {isPending ? (
            <span className="flex items-center space-x-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving Demographics...</span>
            </span>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}
