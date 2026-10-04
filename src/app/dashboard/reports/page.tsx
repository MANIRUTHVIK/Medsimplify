import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserReportsAction } from "../actions";
import { ReportsView } from "./reports-view";

export const metadata = {
  title: "Reports Archive - MedSimplify",
  description: "Search, filter, and review all analyzed laboratory reports and clinical findings.",
};

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const reportsResult = await getUserReportsAction();
  const reports = reportsResult.success && reportsResult.data ? reportsResult.data : [];

  return (
    <div className="w-full space-y-6">
      <ReportsView reports={reports} />
    </div>
  );
}
