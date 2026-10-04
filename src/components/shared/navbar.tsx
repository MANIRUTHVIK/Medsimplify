"use client";

import React from "react";
import Link from "next/link";
import { Activity } from "lucide-react";

interface NavbarProps {
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  onLogout?: () => void;
}

export function Navbar({ user }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border text-foreground transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href={user ? "/dashboard" : "/login"} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-[var(--radius)] bg-primary/10 border border-primary/25 flex items-center justify-center text-primary group-hover:scale-105 transition-transform shadow-xs">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-foreground">
              MedSimplify
            </span>
            <span className="text-[10px] font-semibold uppercase bg-primary/15 text-primary border border-primary/25 px-2 py-0.5 rounded-full tracking-wide">
              Clinical AI
            </span>
          </div>
        </Link>

        {/* Right side for guest / auth pages */}
        {!user && (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted rounded-[var(--radius)] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4.5 py-2.5 text-xs font-semibold bg-primary hover:bg-primary-hover text-primary-foreground rounded-[var(--radius)] shadow-xs transition-all active:scale-[0.99]"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
