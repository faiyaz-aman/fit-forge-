"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
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
  LogOut,
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

export function Sidebar() {
  const pathname = usePathname();

  // Hide nav inside active workout
  const isActiveWorkout = pathname?.startsWith("/workout/");
  if (isActiveWorkout) return null;

  const handleSignOut = async () => {
    try {
      const response = await fetch("/api/auth/signout", { method: "POST" });
      if (response.ok) {
        window.location.href = "/signin";
      }
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-[#0A0A0B] border-r border-border shrink-0 fixed top-0 left-0 z-30">
      {/* Brand Header */}
      <div className="flex items-center h-16 px-6 border-b border-border/60">
        <Link href="/home" className="flex items-center gap-2 cursor-pointer select-none">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center font-bold text-primary-foreground text-sm neon-glow">
            F
          </div>
          <span className="font-sans font-bold text-base tracking-wider uppercase text-foreground">
            Fit<span className="text-primary">Forge</span>
          </span>
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
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
                  layoutId="sidebarActiveBg"
                  className="absolute inset-0 bg-primary/5 border border-primary/20 rounded-lg"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Account Actions */}
      <div className="p-4 border-t border-border/60 bg-[#0E0E10]/40">
        <button
          onClick={handleSignOut}
          className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all select-none cursor-pointer"
        >
          <span className="font-medium">Sign Out</span>
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
