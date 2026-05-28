"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dumbbell,
  Droplet,
  Flame,
  Utensils,
  TrendingUp,
  Award,
  BookOpen,
  ArrowRight,
  Plus,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import {
  getActivePlan,
  getTodayWorkout,
  isTodayCompleted,
  getStreak,
  getExerciseHistory,
} from "@/lib/workout-store";

export default function HomePage() {
  const [waterMl, setWaterMl] = useState(1250);
  const waterGoal = 3200;

  const [activePlan, setActivePlan] = useState<any>(null);
  const [todayWorkout, setTodayWorkout] = useState<any>(null);
  const [completedToday, setCompletedToday] = useState(false);
  const [streak, setStreak] = useState(0);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);

  useEffect(() => {
    // 1. Get active plan
    const active = getActivePlan();
    if (active) {
      setActivePlan(active.plan);
    }
    
    // 2. Get today's workout
    const todayW = getTodayWorkout();
    if (todayW) {
      setTodayWorkout(todayW);
    }
    
    // 3. Completed status
    setCompletedToday(isTodayCompleted());
    
    // 4. Streak
    setStreak(getStreak());
    
    // 5. Compute recent records dynamically from real logs
    const lifts = ["Barbell Bench Press", "Barbell Back Squat", "Romanian Deadlift", "Weighted Pull-Up", "Dumbbell Shoulder Press"];
    const records: any[] = [];
    lifts.forEach(liftName => {
      const history = getExerciseHistory(liftName, 1);
      if (history.length > 0) {
        const lastSession = history[0];
        const maxWeightSet = lastSession.sets.reduce((max, s) => s.actualWeight > max.actualWeight ? s : max, lastSession.sets[0]);
        if (maxWeightSet) {
          records.push({
            name: liftName,
            weight: maxWeightSet.actualWeight,
            reps: maxWeightSet.actualReps
          });
        }
      }
    });
    
    if (records.length > 0) {
      setRecentRecords(records);
    }
  }, []);

  const handleAddWater = (amount: number) => {
    setWaterMl((prev) => Math.min(prev + amount, 6000));
  };

  const waterPercent = Math.min((waterMl / waterGoal) * 100, 100);

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="space-y-6">
      {/* Hero Greeting */}
      <div className="flex flex-col space-y-1 select-none">
        <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
          Forge Your Body, <span className="text-primary">Champ</span>
        </h2>
        <p className="text-xs text-muted-foreground">
          {dateStr} — Consistency builds champions. You are on a {streak}-day streak!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Active Workout & Hydration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Workout Card */}
          {completedToday ? (
            <Card hoverGlow className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    Today's Training Done
                  </span>
                </div>
                <CardTitle className="text-lg font-bold uppercase tracking-wider text-foreground mt-2">
                  Workout Completed!
                </CardTitle>
                <CardDescription className="text-xs">
                  Awesome work today! You completed your scheduled routine for "{todayWorkout?.title || "today"}". Your lifts are logged and saved.
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-xs text-muted-foreground">
                  Consistency is the engine of progression. Check out your detailed sets logs and training wins in the history calendar.
                </p>
              </CardContent>
              <CardFooter className="pt-0">
                <Link href="/calendar" className="w-full">
                  <Button variant="secondary" className="w-full flex items-center justify-center gap-2 border border-border">
                    <Calendar className="w-4 h-4 text-primary" />
                    View Activity Calendar
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ) : todayWorkout ? (
            <Card hoverGlow className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
                    Today's Schedule
                  </span>
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                    ~450 kcal
                  </span>
                </div>
                <CardTitle className="text-lg font-bold uppercase tracking-wider text-foreground mt-2">
                  {todayWorkout.title}
                </CardTitle>
                <CardDescription className="text-xs">
                  Targeting {todayWorkout.focus}. {todayWorkout.exercises?.length || 0} exercises planned.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                <div className="space-y-2 border-l-2 border-border/80 pl-4 py-1">
                  {todayWorkout.exercises?.map((ex: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{idx + 1}. {ex.exerciseName}</span>
                      <span className="font-mono tabular-nums">{ex.sets} Sets × {ex.repMin}-{ex.repMax} Reps</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Link href="/workout/today" className="w-full">
                  <Button className="w-full flex items-center justify-center gap-2 group">
                    <Dumbbell className="w-4 h-4 transition-transform group-hover:rotate-12" />
                    Start Focused Workout
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ) : (
            <Card hoverGlow className="border-border bg-card border-dashed">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                    No Active Split
                  </span>
                </div>
                <CardTitle className="text-lg font-bold uppercase tracking-wider text-foreground mt-2">
                  Design Your Program
                </CardTitle>
                <CardDescription className="text-xs">
                  Establish a split routine to schedule daily exercises, track set history, and automate progression triggers.
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  FitForge strength engines require a workout routine to map today's exercises. Use our AI parser to extract document rules or construct your training split manually.
                </p>
              </CardContent>
              <CardFooter className="pt-0">
                <Link href="/workout" className="w-full">
                  <Button className="w-full flex items-center justify-center gap-2 group">
                    <Plus className="w-4 h-4" />
                    Set Up Workout Split
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          )}

          {/* Water Intake Tracker */}
          <Card className="border-border bg-card overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                Hydration Tracker
              </CardTitle>
              <CardDescription className="text-xs">
                Dynamic water ring tracker. Hydration improves strength output.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                {/* Visual Progress Wave */}
                <div className="relative h-20 bg-secondary/30 border border-border/60 rounded-xl overflow-hidden flex flex-col justify-center items-center select-none">
                  {/* Wave progress fill */}
                  <div
                    style={{ height: `${waterPercent}%` }}
                    className="absolute bottom-0 left-0 right-0 bg-[#00D2FF]/20 border-t border-[#00D2FF]/30 transition-all duration-500"
                  />
                  <div className="z-10 text-center">
                    <span className="text-lg font-mono font-bold text-foreground tabular-nums">
                      {waterMl}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      {" "}
                      / {waterGoal} ml
                    </span>
                  </div>
                  <span className="absolute top-2 right-3 text-[9px] font-mono font-semibold text-[#00D2FF] bg-[#00D2FF]/10 px-1.5 py-0.5 rounded">
                    {Math.round(waterPercent)}%
                  </span>
                </div>

                {/* Quick Add buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleAddWater(250)}
                    variant="secondary"
                    className="flex items-center justify-center gap-1.5 h-9 text-xs border border-border"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    250 ml
                  </Button>
                  <Button
                    onClick={() => handleAddWater(500)}
                    variant="secondary"
                    className="flex items-center justify-center gap-1.5 h-9 text-xs border border-border"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    500 ml
                  </Button>
                  <Button
                    onClick={() => handleAddWater(750)}
                    variant="secondary"
                    className="flex items-center justify-center gap-1.5 h-9 text-xs border border-border"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    750 ml
                  </Button>
                  <Button
                    onClick={() => handleAddWater(1000)}
                    variant="secondary"
                    className="flex items-center justify-center gap-1.5 h-9 text-xs border border-border"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    1.0 L
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Nutrition & Stats */}
        <div className="space-y-6">
          {/* Nutrition Ring Tracker */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                Nutrition Summary
              </CardTitle>
              <CardDescription className="text-xs">
                Calorie & macronutrient target breakdown.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Calorie Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground flex items-center gap-1">
                    <Utensils className="w-3.5 h-3.5 text-primary" />
                    Energy Target
                  </span>
                  <span className="font-mono font-bold text-foreground tabular-nums">
                    1,200 / 2,500 kcal
                  </span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "48%" }} />
                </div>
              </div>

              {/* Macros Breakdown */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Protein (Goal: 150g)</span>
                  <span className="font-mono font-semibold text-foreground tabular-nums">
                    80g <span className="text-muted-foreground text-[10px]">({Math.round((80 / 150) * 100)}%)</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Carbohydrates (Goal: 250g)</span>
                  <span className="font-mono font-semibold text-foreground tabular-nums">
                    120g <span className="text-muted-foreground text-[10px]">({Math.round((120 / 250) * 100)}%)</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Fats (Goal: 70g)</span>
                  <span className="font-mono font-semibold text-foreground tabular-nums">
                    35g <span className="text-muted-foreground text-[10px]">({Math.round((35 / 70) * 100)}%)</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Rotating Tip */}
          <Card className="border-border bg-card bg-gradient-to-br from-primary/[0.02] to-transparent">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-1.5 text-xs text-primary font-bold">
                <BookOpen className="w-3.5 h-3.5" />
                <span>COACH TIP OF THE DAY</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pb-4">
              <blockquote className="text-xs italic text-foreground/90 font-medium">
                "The key to hypertrophy is mechanical tension and progressive overload, focusing on controlled eccentrics."
              </blockquote>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                <span className="font-bold text-foreground">Application:</span> Aim for a 2-3 second eccentric (lowering) phase on all major lifts, ensuring you control the weight rather than letting gravity pull it down.
              </p>
            </CardContent>
            <CardFooter className="pt-0 border-t border-border/40 py-2 text-[10px] font-mono text-muted-foreground justify-between">
              <span>Author: Jeff Nippard</span>
              <span>Category: Hypertrophy</span>
            </CardFooter>
          </Card>

          {/* Hall of Fame / Recent PRs */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-1.5 text-xs text-primary font-bold">
                <Award className="w-3.5 h-3.5" />
                <span>RECENT RECORDS</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pb-4">
              {recentRecords.map((rec, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">{rec.name}</span>
                  <span className="font-mono text-primary font-bold">
                    {rec.weight} kg × {rec.reps} Rep{rec.reps > 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
