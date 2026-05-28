"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Flame, Bell } from "lucide-react";

export function Header() {
  const pathname = usePathname();

  // Map path to screen title
  const getTitle = () => {
    if (pathname?.startsWith("/home")) return "Dashboard";
    if (pathname?.startsWith("/workout")) return "Workout Plan";
    if (pathname?.startsWith("/stats")) return "Analytics";
    if (pathname?.startsWith("/photos")) return "Progress Gallery";
    if (pathname?.startsWith("/nutrition")) return "Nutrition Diary";
    if (pathname?.startsWith("/chat")) return "AI Coach Chat";
    if (pathname?.startsWith("/tips")) return "Knowledge Library";
    if (pathname?.startsWith("/calendar")) return "Calendar Logs";
    if (pathname?.startsWith("/profile")) return "Profile Settings";
    if (pathname?.startsWith("/settings")) return "Settings";
    return "FitForge";
  };

  const title = getTitle();

  // Hide header inside active coach mode
  const isActiveWorkout = pathname?.startsWith("/workout/");
  if (isActiveWorkout) return null;

  return (
    <header className="h-16 border-b border-border bg-[#0A0A0B]/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-6 select-none">
      {/* Left Title / Mobile Brand */}
      <div className="flex items-center gap-3">
        <div className="md:hidden w-6 h-6 rounded-md bg-primary flex items-center justify-center font-bold text-primary-foreground text-xs neon-glow">
          F
        </div>
        <h1 className="text-sm font-bold tracking-widest text-foreground uppercase md:normal-case md:text-base md:font-semibold">
          {title}
        </h1>
      </div>

      {/* Right Streak & Quick Info */}
      <div className="flex items-center gap-3">
        {/* Active Streak */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141416] border border-border">
          <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span className="text-[10px] font-mono font-bold text-foreground tabular-nums">5</span>
        </div>

        {/* Notifications Icon */}
        <button className="relative w-8 h-8 rounded-lg border border-border bg-[#141416] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-2.5 right-2.5 w-1 h-1 rounded-full bg-primary neon-glow" />
        </button>
      </div>
    </header>
  );
}
