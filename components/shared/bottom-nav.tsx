"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Dumbbell, BarChart3, Camera, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/workout", label: "Workout", icon: Dumbbell },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/photos", label: "Photos", icon: Camera },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  // If inside active workout session, we hide navigation to focus on workout
  const isActiveWorkout = pathname?.startsWith("/workout/");
  if (isActiveWorkout) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0A0A0B]/85 backdrop-blur-md border-t border-border z-40 flex items-center justify-around px-2 pb-safe">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href || pathname?.startsWith(tab.href + "/");

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-colors cursor-pointer select-none"
          >
            <Icon
              className={cn(
                "w-5 h-5 transition-transform duration-200 z-10",
                isActive ? "text-primary scale-110" : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "text-[9px] mt-1 font-medium transition-colors z-10",
                isActive ? "text-primary font-bold" : "text-muted-foreground"
              )}
            >
              {tab.label}
            </span>
            {isActive && (
              <motion.div
                layoutId="bottomNavGlow"
                className="absolute inset-0 bg-primary/5 border border-primary/20 rounded-xl"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
