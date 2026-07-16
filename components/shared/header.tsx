"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Bell,
  Menu,
  X,
  Home,
  Dumbbell,
  BarChart3,
  Camera,
  Utensils,
  MessageSquare,
  BookOpen,
  Calendar,
  User,
  Settings,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/home", label: "Dashboard", icon: Home },
  { href: "/workout", label: "Workout", icon: Dumbbell },
  { href: "/stats", label: "Analytics", icon: BarChart3 },
  { href: "/photos", label: "Progress Photos", icon: Camera },
  { href: "/nutrition", label: "Nutrition", icon: Utensils },
  { href: "/chat", label: "AI Coach Chat", icon: MessageSquare },
  { href: "/tips", label: "Knowledge Library", icon: BookOpen },
  { href: "/calendar", label: "History Log", icon: Calendar },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Header() {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

  const handleSignOut = async () => {
    try {
      const response = await fetch("/api/auth/signout", { method: "POST" });
      if (response.ok) {
        if (typeof window !== "undefined") {
          localStorage.clear();
        }
        window.location.href = "/signin";
      }
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  // Hide header inside active coach mode
  const isActiveWorkout = pathname?.startsWith("/workout/");
  if (isActiveWorkout) return null;

  return (
    <>
      <header className="h-16 border-b border-border bg-[#0A0A0B]/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-6 select-none">
        {/* Left Title / Mobile Brand & Hamburger Trigger */}
        <div className="flex items-center gap-2">
          {/* Hamburger Trigger for Mobile */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="md:hidden p-1.5 rounded-lg border border-border bg-[#141416] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="hidden min-[370px]:flex items-center gap-2">
            <div className="md:hidden w-6 h-6 rounded-md bg-primary flex items-center justify-center font-bold text-primary-foreground text-xs neon-glow">
              F
            </div>
            <h1 className="text-[11px] min-[400px]:text-xs sm:text-sm font-bold tracking-widest text-foreground uppercase md:normal-case md:text-base md:font-semibold">
              {title}
            </h1>
          </div>
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

      {/* Mobile Slide-out Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 bottom-0 left-0 w-72 bg-[#0A0A0B] border-r border-border z-50 flex flex-col md:hidden"
            >
              {/* Header of Drawer */}
              <div className="flex items-center justify-between h-16 px-6 border-b border-border/60">
                <Link href="/home" onClick={() => setIsDrawerOpen(false)} className="flex items-center gap-2 cursor-pointer select-none">
                  <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center font-bold text-primary-foreground text-sm neon-glow">
                    F
                  </div>
                  <span className="font-sans font-bold text-base tracking-wider uppercase text-foreground">
                    Fit<span className="text-primary">Forge</span>
                  </span>
                </Link>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg border border-border bg-[#141416] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Close navigation menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsDrawerOpen(false)}
                      className={cn(
                        "relative flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-all group select-none cursor-pointer",
                        isActive
                          ? "text-primary font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-4 h-4 transition-transform duration-200 group-hover:scale-105 z-10",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                      <span className="z-10">{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="mobileSidebarActiveBg"
                          className="absolute inset-0 bg-primary/5 border border-primary/20 rounded-lg"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Footer Actions */}
              <div className="p-4 border-t border-border/60 bg-[#0E0E10]/40">
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    handleSignOut();
                  }}
                  className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all select-none cursor-pointer"
                >
                  <span className="font-medium">Sign Out</span>
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
