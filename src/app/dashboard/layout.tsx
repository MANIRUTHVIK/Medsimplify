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
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground overflow-x-hidden">
      <DashboardSidebar user={user} reports={reports} />
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
