import React from "react";
import { Navbar } from "@/components/shared/navbar";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}
