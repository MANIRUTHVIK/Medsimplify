"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  Sparkles,
  ChevronRight,
  Menu,
  X,
  Activity,
  Bot,
} from "lucide-react";
import { logoutAction } from "@/app/(auth)/login/actions";
import { CopilotModal, CopilotReportItem } from "@/app/dashboard/_components/copilot-modal";

interface DashboardSidebarProps {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  reports?: CopilotReportItem[];
}

export function DashboardSidebar({ user, reports = [] }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);

  const handleLogout = async () => {
    await logoutAction();
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    {
      label: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      exact: true,
      description: "Lab overview & uploads",
    },
    {
      label: "Reports",
      href: "/dashboard/reports",
      icon: FileText,
      exact: false,
      description: "Search & view all lab reports",
    },
    {
      label: "Profile & Settings",
      href: "/dashboard/settings",
      icon: Settings,
      exact: false,
      description: "Account & clinical standards",
    },
  ];

  const isLinkActive = (item: (typeof navItems)[0]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-3.5 bg-sidebar border-b border-border text-sidebar-foreground w-full">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-xs">
            <Activity className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-tight text-sidebar-foreground">
              MedSimplify
            </span>
            <span className="text-[9px] font-bold uppercase bg-primary/15 text-primary border border-primary/30 px-1.5 py-0.2 rounded-full">
              AI
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCopilotOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/25 text-xs font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Copilot</span>
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-lg border border-border text-sidebar-foreground hover:bg-sidebar-accent/15 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Mobile Drawer */}
      {mobileOpen && (
        <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-border text-sidebar-foreground flex flex-col justify-between p-4 shadow-xl md:hidden">
          <div className="space-y-5">
            {/* Logo at Top */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-xs">
                  <Activity className="w-4.5 h-4.5 text-primary" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight text-sidebar-foreground">
                    MedSimplify
                  </span>
                  <span className="text-[9px] font-bold uppercase bg-primary/15 text-primary border border-primary/30 px-1.5 py-0.2 rounded-full">
                    AI
                  </span>
                </div>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-sidebar-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Clinical Copilot Action Button */}
            <button
              onClick={() => {
                setMobileOpen(false);
                setCopilotOpen(true);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 transition-all text-xs font-bold shadow-xs cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Clinical Copilot</span>
              </div>
              <span className="text-[9px] font-extrabold uppercase bg-primary text-primary-foreground px-1.5 py-0.2 rounded-full">
                Ask AI
              </span>
            </button>

            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const active = isLinkActive(item);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-xs font-bold"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/15 hover:text-sidebar-primary"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 ${
                          active ? "text-sidebar-accent" : "text-sidebar-muted-foreground"
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-border space-y-3">
            <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                  {(user.name || user.email)[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-sidebar-foreground truncate">
                    {user.name || "Patient"}
                  </p>
                  <p className="text-[10px] text-sidebar-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Desktop Persistent Full-Height Sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 bg-sidebar border-r border-border text-sidebar-foreground sticky top-0 h-screen p-4 justify-between">
        <div className="space-y-5">
          {/* Logo on Top of Sidebar */}
          <Link href="/dashboard" className="flex items-center gap-2.5 pb-4 border-b border-border group">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary group-hover:scale-105 transition-transform shadow-xs">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-sidebar-foreground">
                MedSimplify
              </span>
              <span className="text-[9px] font-bold uppercase bg-primary/15 text-primary border border-primary/30 px-1.5 py-0.2 rounded-full tracking-wide">
                AI
              </span>
            </div>
          </Link>

          {/* Clinical Assistant Active Status */}
          <div className="px-3 py-2 rounded-xl bg-sidebar-accent/10 border border-sidebar-accent/25 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
              <span className="text-[11px] font-bold text-sidebar-foreground">
                Clinical Engine Active
              </span>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-sidebar-accent" />
          </div>

          {/* Clinical Copilot Interactive Button in Sidebar */}
          <button
            onClick={() => setCopilotOpen(true)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-all text-xs font-bold shadow-xs cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-2xs">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <span className="block leading-tight">Clinical Copilot</span>
                <span className="text-[10px] text-muted-foreground font-normal">Ask any report</span>
              </div>
            </div>
            <span className="text-[9px] font-extrabold uppercase bg-primary text-primary-foreground px-1.5 py-0.2 rounded-full group-hover:scale-105 transition-transform">
              Ask AI
            </span>
          </button>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sidebar-muted-foreground px-2.5 block mb-1.5">
              Clinical Navigation
            </span>
            {navItems.map((item) => {
              const active = isLinkActive(item);
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-xs font-bold"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/15 hover:text-sidebar-primary"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        active
                          ? "text-sidebar-accent"
                          : "text-sidebar-muted-foreground group-hover:text-sidebar-accent"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      active
                        ? "text-sidebar-accent"
                        : "text-sidebar-muted-foreground/60 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Card & Sign Out at Bottom */}
        <div className="pt-4 border-t border-border space-y-3">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                {(user.name || user.email)[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-sidebar-foreground truncate">
                  {user.name || "Patient"}
                </p>
                <p className="text-[10px] text-sidebar-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Copilot Modal */}
      <CopilotModal
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        reports={reports}
      />
    </>
  );
}
