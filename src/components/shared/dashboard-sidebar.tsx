"use client";

import React, { useState, useRef } from "react";
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
  PanelLeftClose,
  PanelLeftOpen,
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

  // Desktop: collapsed = icon-rail, expanded = full sidebar
  // Pinned = user clicked toggle (stays expanded). Hovered = mouse-over while pinned=false.
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sidebar is "open" if pinned OR hovered
  const isOpen = pinned || hovered;

  const handleMouseEnter = () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    setHovered(true);
  };
  const handleMouseLeave = () => {
    leaveTimerRef.current = setTimeout(() => setHovered(false), 120);
  };

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
      label: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      exact: false,
      description: "Account & clinical standards",
    },
  ];

  const isLinkActive = (item: (typeof navItems)[0]) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  const initials = (user.name || user.email)[0].toUpperCase();

  return (
    <>
      {/* ─────────────────────────── MOBILE TOP BAR ─────────────────────────── */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-sidebar border-b border-border text-sidebar-foreground w-full shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <span className="font-bold text-sm text-sidebar-foreground tracking-tight">MedSimplify</span>
          <span className="text-[9px] font-bold uppercase bg-primary/15 text-primary border border-primary/30 px-1.5 py-0.5 rounded-full">AI</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCopilotOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/25 text-xs font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Copilot</span>
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-lg border border-border text-sidebar-foreground hover:bg-muted/50 cursor-pointer transition-colors"
            aria-label="Toggle navigation"
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
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-primary" />
                </div>
                <span className="font-bold text-sm text-sidebar-foreground">MedSimplify</span>
              </Link>
              <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg hover:bg-muted text-sidebar-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => { setMobileOpen(false); setCopilotOpen(true); }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Clinical Copilot</span>
              </div>
              <span className="text-[9px] font-extrabold uppercase bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">Ask AI</span>
            </button>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = isLinkActive(item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-sidebar-foreground hover:bg-muted/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${active ? "text-primary-foreground" : "text-sidebar-muted-foreground"}`} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-sidebar-foreground truncate">{user.name || "Patient"}</p>
                  <p className="text-[10px] text-sidebar-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              <button onClick={handleLogout} title="Sign Out" className="p-1.5 text-sidebar-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer shrink-0">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ─────────────────────────── DESKTOP SIDEBAR ─────────────────────────── */}
      {/*
        Icon-rail by default (w-14). Expands to w-56 when pinned or hovered.
        Transition is smooth via CSS transition on width.
      */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
          hidden md:flex flex-col shrink-0
          bg-sidebar border-r border-border text-sidebar-foreground
          h-screen sticky top-0
          transition-all duration-200 ease-out
          overflow-hidden
          ${isOpen ? "w-56" : "w-14"}
        `}
      >
        {/* ── TOP: Logo + toggle ── */}
        <div className={`flex items-center border-b border-border shrink-0 ${isOpen ? "px-4 py-3.5 gap-2.5 justify-between" : "px-0 py-3.5 justify-center"}`}>
          {isOpen ? (
            <>
              <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4 text-primary" />
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm font-bold tracking-tight text-sidebar-foreground truncate">MedSimplify</span>
                  <span className="text-[9px] font-bold uppercase bg-primary/15 text-primary border border-primary/30 px-1.5 py-0.5 rounded-full shrink-0">AI</span>
                </div>
              </Link>
              {/* Pin toggle */}
              <button
                onClick={() => setPinned((p) => !p)}
                title={pinned ? "Collapse sidebar" : "Pin sidebar open"}
                className="p-1 rounded-lg text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-muted/50 transition-colors cursor-pointer shrink-0"
              >
                {pinned ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </button>
            </>
          ) : (
            <Link href="/dashboard" className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 border border-primary/25">
              <Activity className="w-4 h-4 text-primary" />
            </Link>
          )}
        </div>

        {/* ── MIDDLE: Copilot button + Nav ── */}
        <div className="flex-1 flex flex-col gap-3 py-3 overflow-y-auto overflow-x-hidden">

          {/* Copilot button */}
          <div className={isOpen ? "px-3" : "px-2"}>
            <button
              onClick={() => setCopilotOpen(true)}
              title="Clinical Copilot"
              className={`
                w-full flex items-center gap-2.5
                bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25
                transition-all cursor-pointer font-bold text-xs shadow-xs rounded-xl
                ${isOpen ? "px-3 py-2.5 justify-between" : "justify-center p-2.5"}
              `}
            >
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="w-6 h-6 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-2xs shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                {isOpen && <span className="truncate">Clinical Copilot</span>}
              </div>
              {isOpen && (
                <span className="text-[9px] font-extrabold uppercase bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full shrink-0">
                  AI
                </span>
              )}
            </button>
          </div>

          {/* Status badge (only when expanded) */}
          {isOpen && (
            <div className="px-3">
              <div className="px-3 py-1.5 rounded-xl bg-status-success-bg border border-status-success-border flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
                  <span className="text-[10px] font-bold text-status-success-strong">Engine Active</span>
                </div>
                <Sparkles className="w-3 h-3 text-status-success" />
              </div>
            </div>
          )}

          {/* Nav */}
          <nav className={`space-y-0.5 ${isOpen ? "px-3" : "px-2"}`}>
            {isOpen && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-sidebar-muted-foreground px-2 block mb-2">
                Navigation
              </span>
            )}
            {navItems.map((item) => {
              const active = isLinkActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  title={!isOpen ? item.label : undefined}
                  className={`
                    flex items-center gap-2.5 rounded-xl text-xs font-semibold
                    transition-colors cursor-pointer group
                    ${isOpen ? "px-3 py-2.5 justify-between" : "justify-center p-2.5"}
                    ${active
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground hover:bg-muted/60 hover:text-sidebar-primary"
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 shrink-0 ${active ? "text-primary-foreground" : "text-sidebar-muted-foreground group-hover:text-sidebar-accent"}`} />
                    {isOpen && <span>{item.label}</span>}
                  </div>
                  {isOpen && (
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${active ? "text-primary-foreground/70" : "text-sidebar-muted-foreground/40 opacity-0 group-hover:opacity-100"}`} />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ── BOTTOM: User card ── */}
        <div className={`border-t border-border py-3 ${isOpen ? "px-3" : "px-2"}`}>
          {isOpen ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-sidebar-foreground truncate">{user.name || "Patient"}</p>
                  <p className="text-[10px] text-sidebar-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 text-sidebar-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                title={`${user.name || user.email} — click to sign out`}
                onClick={handleLogout}
                className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs cursor-pointer hover:bg-status-error-soft hover:text-status-error-strong hover:border-status-error-border transition-colors"
              >
                {initials}
              </button>
            </div>
          )}
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
