import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getReportDetailAction } from "../actions";
import { ReportView } from "./report-view";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Report Analysis - MedSimplify",
  description: "Detailed diagnostic evaluation and clinical reference classification.",
};

interface ReportDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const result = await getReportDetailAction(id);

  if (!result.success || !result.data) {
    return (
      <div className="bg-card border border-border rounded-[var(--radius)] p-8 text-center max-w-lg mx-auto shadow-xs">
        <AlertCircle className="w-10 h-10 text-status-error mx-auto mb-3" />
        <h2 className="text-base font-bold text-foreground">Report Not Available</h2>
        <p className="text-xs text-muted-foreground mt-2 mb-6 leading-relaxed">
          {result.error || "The requested diagnostic report could not be found or you do not have permission to view it."}
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2.5 rounded-[var(--radius)] shadow-xs transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <ReportView
      report={result.data.report}
      chats={result.data.chats}
      user={{
        name: user.name,
        email: user.email,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth?.toISOString() || null,
      }}
    />
  );
}
