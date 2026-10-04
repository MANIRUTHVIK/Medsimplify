import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserVitalsTrendsAction } from "../actions";
import { VitalsView } from "./vitals-view";

export const metadata = {
  title: "Longitudinal Vitals & Biomarker Trends - MedSimplify",
  description: "Track chronological lab results, reference range corridors, and health trajectories.",
};

export default async function VitalsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const result = await getUserVitalsTrendsAction();
  const series = result.success && result.data ? result.data.series : [];
  const totalReports = result.success && result.data ? result.data.totalReports : 0;

  return (
    <div className="space-y-6">
      <VitalsView series={series} totalReports={totalReports} />
    </div>
  );
}
