import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/shared/dashboard-sidebar";
import { getUserReportsAction } from "./actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const reportsRes = await getUserReportsAction();
  const reports = reportsRes.success && reportsRes.data ? reportsRes.data : [];

  return (
    <div className="h-screen flex flex-col md:flex-row bg-background text-foreground overflow-hidden">
      <DashboardSidebar user={user} reports={reports} />
      <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}
