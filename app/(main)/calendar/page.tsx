"use client";

import React, { useState, useEffect } from "react";
import { getWorkoutLogs } from "@/lib/workout-store";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Dumbbell,
  Utensils,
  Droplet,
  Camera,
  X,
  Clock,
  Flame,
  Award,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LogItem {
  id: string;
  type: "workout" | "nutrition" | "water" | "photos";
  title: string;
  details: string;
  meta?: any;
}

// Seed chronological activity data mapping to specific days in May 2026
const seedActivityLogs: Record<number, LogItem[]> = {
  28: [
    { id: "w-1", type: "workout", title: "Push Day Session", details: "Volume: 17,400 kg | Sets: 10 logged | Duration: 48m", meta: { volume: 17400, sets: 10, duration: "48m", split: "Push Day" } },
    { id: "n-1", type: "nutrition", title: "Clean Bulking Meals", details: "Logged 2,450 kcal | P: 162g • C: 290g • F: 72g", meta: { calories: 2450, p: 162, c: 290, f: 72 } },
    { id: "wt-1", type: "water", title: "Hydration Intake", details: "Logged 3,200 ml of fluids", meta: { ml: 3200 } },
    { id: "p-1", type: "photos", title: "Progress Photo Captured", details: "Front & Side encrypted snaps saved", meta: { count: 2 } },
  ],
  27: [
    { id: "w-2", type: "workout", title: "Pull Day Session", details: "Volume: 16,800 kg | Sets: 11 logged | Duration: 52m", meta: { volume: 16800, sets: 11, duration: "52m", split: "Pull Day" } },
    { id: "n-2", type: "nutrition", title: "Clean Bulking Meals", details: "Logged 2,750 kcal | P: 175g • C: 320g • F: 82g", meta: { calories: 2750, p: 175, c: 320, f: 82 } },
    { id: "wt-2", type: "water", title: "Hydration Intake", details: "Logged 2,800 ml of fluids", meta: { ml: 2800 } },
  ],
  26: [
    { id: "wt-3", type: "water", title: "Hydration Intake", details: "Logged 2,500 ml of fluids", meta: { ml: 2500 } },
  ],
  25: [
    { id: "w-3", type: "workout", title: "Legs Day Session", details: "Volume: 16,200 kg | Sets: 11 logged | Duration: 58m", meta: { volume: 16200, sets: 11, duration: "58m", split: "Legs Day" } },
    { id: "n-3", type: "nutrition", title: "Clean Bulking Meals", details: "Logged 2,800 kcal | P: 180g • C: 340g • F: 80g", meta: { calories: 2800, p: 180, c: 340, f: 80 } },
    { id: "wt-4", type: "water", title: "Hydration Intake", details: "Logged 3,400 ml of fluids", meta: { ml: 3400 } },
    { id: "p-2", type: "photos", title: "Progress Photo Captured", details: "Back encrypted snap saved", meta: { count: 1 } },
  ],
  22: [
    { id: "w-4", type: "workout", title: "Push Day Session", details: "Volume: 14,900 kg | Sets: 10 logged | Duration: 44m", meta: { volume: 14900, sets: 10, duration: "44m", split: "Push Day" } },
    { id: "n-4", type: "nutrition", title: "High Protein Intake", details: "Logged 2,600 kcal | P: 165g • C: 310g • F: 75g", meta: { calories: 2600, p: 165, c: 310, f: 75 } },
  ]
};

export default function CalendarPage() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    // Load real workout logs from the store
    const completed = getWorkoutLogs();
    setSessions(completed);
  }, []);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Logic to build dynamic calendar grid
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startOffset = new Date(currentYear, currentMonth, 1).getDay();
  
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
    setSelectedDay(null);
  };

  const getLogsForDay = (day: number) => {
    const targetDateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    
    // Find sessions on this day
    const daySessions = sessions.filter((s) => s.scheduledDate === targetDateStr);
    
    const logs: LogItem[] = [];
    
    daySessions.forEach((s) => {
      let volume = 0;
      let totalSets = 0;
      
      if (s.logs) {
        s.logs.forEach((log: any) => {
          if (log.sets) {
            log.sets.forEach((set: any) => {
              if (set.completed) {
                volume += set.actualWeight * set.actualReps;
                totalSets++;
              }
            });
          }
        });
      }
      
      const durationMins = s.durationSeconds ? `${Math.round(s.durationSeconds / 60)}m` : "45m";
      
      logs.push({
        id: s.id,
        type: "workout",
        title: s.planDayTitle || "Workout Session",
        details: `Volume: ${volume.toLocaleString()} kg | Sets: ${totalSets} logged | Duration: ${durationMins}`,
        meta: {
          volume,
          sets: totalSets,
          duration: durationMins,
          split: s.planDayTitle,
        },
      });
    });
    
    // Check if there is nutrition, water, or photo data in mock seeds
    if (currentMonth === 4 && currentYear === 2026) {
      const mockNutritionWater = seedActivityLogs[day] || [];
      const nonWorkouts = mockNutritionWater.filter(l => l.type !== "workout");
      logs.push(...nonWorkouts);
    }
    
    return logs;
  };

  // Compile full grid array
  const gridCells = [];
  for (let i = 0; i < startOffset; i++) {
    gridCells.push({ dayNumber: null, logs: [] });
  }
  for (let i = 1; i <= totalDays; i++) {
    const logs = getLogsForDay(i);
    gridCells.push({ dayNumber: i, logs });
  }

  const selectedDayLogs = selectedDay ? getLogsForDay(selectedDay) : [];

  return (
    <div className="space-y-6 relative overflow-hidden">
      {/* Header section */}
      <div className="flex flex-col space-y-1 select-none">
        <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
          Activity History Log
        </h2>
        <p className="text-xs text-muted-foreground">
          Review chronological entries of previous active sessions, calorie logs, and photo captures.
        </p>
      </div>

      {/* Main Grid View */}
      <Card className="border border-border bg-card select-none">
        <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-border/40 bg-[#0E0E10]/20">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
              {monthNames[currentMonth]} {currentYear}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrevMonth}
              className="h-8 w-8 p-0 border border-border cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleNextMonth}
              className="h-8 w-8 p-0 border border-border cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest pb-3">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Grid Cells */}
          <div className="grid grid-cols-7 gap-2">
            {gridCells.map((cell, idx) => {
              if (!cell.dayNumber) {
                return <div key={`empty-${idx}`} className="aspect-square bg-secondary/10 rounded-xl opacity-30" />;
              }

              const isSelected = selectedDay === cell.dayNumber;
              const hasLogs = cell.logs.length > 0;
              const hasWorkout = cell.logs.some(l => l.type === "workout");

              return (
                <button
                  key={`day-${cell.dayNumber}`}
                  onClick={() => setSelectedDay(cell.dayNumber)}
                  className={`aspect-square rounded-xl border flex flex-col justify-between p-2.5 transition-all cursor-pointer text-left relative group ${
                    isSelected
                      ? "border-primary bg-primary/5 text-primary neon-glow"
                      : "border-border bg-[#141416]/40 hover:border-primary/40 hover:bg-secondary/20 text-foreground"
                  }`}
                >
                  <span className={`text-[11px] font-mono font-bold ${
                    isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  }`}>
                    {cell.dayNumber}
                  </span>

                  {/* Indicators / Micro icons */}
                  {hasLogs && (
                    <div className="flex flex-wrap gap-1 mt-auto">
                      {cell.logs.map((log) => {
                        let colorClass = "bg-primary text-primary-foreground";
                        if (log.type === "nutrition") colorClass = "bg-green-500 text-white";
                        if (log.type === "water") colorClass = "bg-blue-500 text-white";
                        if (log.type === "photos") colorClass = "bg-purple-500 text-white";
                        
                        return (
                          <span
                            key={log.id}
                            className={`w-1.5 h-1.5 rounded-full ${
                              log.type === "workout" ? "bg-primary" :
                              log.type === "nutrition" ? "bg-[#00D2FF]" :
                              log.type === "water" ? "bg-blue-500" : "bg-purple-500"
                            }`}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Highlights workouts calendar glowing */}
                  {hasWorkout && !isSelected && (
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* RIGHT-SLIDING DAILY OVERVIEW HISTORY DETAILS DRAWER */}
      <AnimatePresence>
        {selectedDay && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDay(null)}
              className="fixed inset-0 bg-[#0A0A0B]/80 backdrop-blur-md z-40"
            />

            {/* Sliding Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 h-screen w-full max-w-sm bg-[#0A0A0B] border-l border-border shadow-2xl z-50 overflow-y-auto no-scrollbar flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border/60 select-none">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                    DAILY WORKOUT DIARY
                  </h3>
                  <span className="text-[10px] text-muted-foreground font-mono font-semibold block uppercase tracking-widest mt-0.5">
                    {monthNames[currentMonth]} {selectedDay}, {currentYear}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="p-1.5 rounded-lg border border-border bg-[#141416] hover:bg-secondary/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Log List */}
              <div className="flex-1 p-6 space-y-6 select-none">
                {selectedDayLogs.length > 0 ? (
                  selectedDayLogs.map((log) => {
                    const isWorkout = log.type === "workout";
                    const isNutrition = log.type === "nutrition";
                    const isWater = log.type === "water";
                    const isPhotos = log.type === "photos";

                    return (
                      <div
                        key={log.id}
                        className="bg-[#141416] border border-border/80 p-4 rounded-xl space-y-3.5"
                      >
                        {/* Header icon */}
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${
                            isWorkout ? "bg-primary/10 border-primary/20 text-primary" :
                            isNutrition ? "bg-[#00D2FF]/10 border-[#00D2FF]/20 text-[#00D2FF]" :
                            isWater ? "bg-blue-500/10 border-blue-500/20 text-blue-500" :
                            "bg-purple-500/10 border-purple-500/20 text-purple-500"
                          }`}>
                            {isWorkout && <Dumbbell className="w-4 h-4" />}
                            {isNutrition && <Utensils className="w-4 h-4" />}
                            {isWater && <Droplet className="w-4 h-4" />}
                            {isPhotos && <Camera className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-foreground block">
                              {log.title}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-widest">
                              {log.type} entry
                            </span>
                          </div>
                        </div>

                        {/* Description Text */}
                        <p className="text-xs text-muted-foreground leading-relaxed pl-1">
                          {log.details}
                        </p>

                        {/* CASE 1: WORKOUT SPECIFIC DATA */}
                        {isWorkout && log.meta && (
                          <div className="grid grid-cols-3 gap-2 border-t border-border/40 pt-3 text-center">
                            <div className="space-y-0.5">
                              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block">Volume</span>
                              <span className="text-[11px] font-mono font-extrabold text-foreground tabular-nums">+{log.meta.volume} kg</span>
                            </div>
                            <div className="space-y-0.5 border-x border-border/40">
                              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block">Duration</span>
                              <span className="text-[11px] font-mono font-extrabold text-foreground tabular-nums">{log.meta.duration}</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block">Lifts</span>
                              <span className="text-[11px] font-mono font-extrabold text-foreground tabular-nums">{log.meta.sets} sets</span>
                            </div>
                          </div>
                        )}

                        {/* CASE 2: NUTRITION TARGETS */}
                        {isNutrition && log.meta && (
                          <div className="space-y-2.5 border-t border-border/40 pt-3">
                            <div className="flex justify-between items-baseline text-[10px]">
                              <span className="text-muted-foreground font-semibold">Daily Calorie Target</span>
                              <span className="font-mono text-foreground font-bold">{log.meta.calories} kcal</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center text-[10px] bg-[#0A0A0B] p-2 rounded-lg border border-border/60">
                              <div>
                                <span className="text-[8px] text-muted-foreground block font-bold">Protein</span>
                                <span className="font-mono text-foreground font-semibold">{log.meta.p}g</span>
                              </div>
                              <div>
                                <span className="text-[8px] text-muted-foreground block font-bold">Carbs</span>
                                <span className="font-mono text-foreground font-semibold">{log.meta.c}g</span>
                              </div>
                              <div>
                                <span className="text-[8px] text-muted-foreground block font-bold">Fat</span>
                                <span className="font-mono text-foreground font-semibold">{log.meta.f}g</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-24 text-center text-xs text-muted-foreground select-none">
                    No active workout or nutrition log entries recorded for this date.
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
