import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsForm } from "./settings-form";
import { User, Shield } from "lucide-react";

export const metadata = {
  title: "Patient Profile & Clinical Settings - MedSimplify",
  description: "Update patient demographics including biological gender and date of birth for calibrated clinical reference ranges.",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const initialValues = {
    name: user.name || "",
    email: user.email,
    gender: (user.gender as string) || "",
    dateOfBirth: user.dateOfBirth
      ? new Date(user.dateOfBirth).toISOString().split("T")[0]
      : "",
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl space-y-6">
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-xs w-full">
          <div className="flex items-center space-x-2.5 mb-2 pb-4 border-b border-border">
            <User className="w-5 h-5 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-secondary tracking-tight">
                Patient Demographic Settings
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Calibrate clinical reference bounds based on patient physiology
              </p>
            </div>
          </div>

          <div className="p-4 bg-muted/40 border border-border rounded-[var(--radius)] text-xs text-foreground mb-6 flex items-start space-x-3">
            <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-secondary">Why are Gender and Date of Birth requested?</span>
              <br />
              Standard clinical reference ranges (such as Hemoglobin, Creatinine, Ferritin, and ALP) naturally vary across biological sexes and age brackets. When a laboratory report does not print an explicit reference interval, MedSimplify uses this demographic data to supply established medical standards.
            </div>
          </div>

          <SettingsForm initialValues={initialValues} />
        </div>
      </div>
    </div>
  );
}
