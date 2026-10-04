import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserReportsAction } from "./actions";
import { UploadQueue } from "./_components/upload-queue";
import { ReportsList } from "./_components/reports-list";
import { calculateAge } from "@/lib/utils";
import Link from "next/link";
import { User, Calendar, Settings, ShieldCheck, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Clinical Dashboard - MedSimplify",
  description: "Upload and analyze laboratory reports with intelligent reference range validation and doctor discussion guidance.",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const reportsRes = await getUserReportsAction();
  const reports = reportsRes.success && reportsRes.data ? reportsRes.data : [];
  const age = calculateAge(user.dateOfBirth);

  const isProfileComplete = Boolean(user.gender && user.dateOfBirth);

  return (
    <div className="space-y-6">
      {/* Patient Header Card */}
      <div className="bg-card border border-border rounded-[var(--radius)] p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl font-bold text-secondary tracking-tight">
                Patient Health Portal
              </h1>
              <span className="text-xs bg-status-success-bg text-status-success-strong border border-status-success-soft px-2.5 py-0.5 rounded-full font-semibold flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
                <span>Secure Clinical Vault</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Welcome back, <span className="font-semibold text-secondary">{user.name}</span>. Review diagnostic metrics and query past lab reports.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2.5 bg-muted border border-border rounded-[var(--radius)] px-3.5 py-2 text-xs text-secondary font-medium">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>
                {user.gender ? (
                  <span className="capitalize">{user.gender.toLowerCase()}</span>
                ) : (
                  <span className="text-muted-foreground">Gender unassigned</span>
                )}
              </span>
              <span className="text-border">|</span>
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>
                {age !== null ? (
                  `${age} yrs`
                ) : (
                  <span className="text-muted-foreground">DOB unassigned</span>
                )}
              </span>
            </div>

            <Link
              href="/dashboard/settings"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold bg-card hover:bg-muted text-secondary border border-border rounded-[var(--radius)] px-3.5 py-2 shadow-xs transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Settings</span>
            </Link>
          </div>
        </div>

        {!isProfileComplete && (
          <div className="mt-5 p-3.5 bg-status-info-bg border border-status-info-border rounded-[var(--radius)] flex items-start space-x-2.5 text-xs text-status-info-strong">
            <AlertCircle className="w-4 h-4 text-status-info mt-0.5 shrink-0" />
            <div className="flex-1 leading-relaxed">
              <span className="font-semibold">Profile Advisory:</span> Setting your biological gender and date of birth allows MedSimplify to automatically provide age- and gender-calibrated clinical reference ranges when they are not printed in your laboratory report.
            </div>
            <Link
              href="/dashboard/settings"
              className="font-semibold underline hover:opacity-80 shrink-0"
            >
              Update Now
            </Link>
          </div>
        )}
      </div>

      {/* Sequential Multi-Report Upload Queue */}
      <UploadQueue />

      {/* Historical Reports List */}
      <ReportsList reports={reports} />
    </div>
  );
}
