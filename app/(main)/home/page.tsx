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
import { hydrateLocalDataFromCloud, syncWaterLogs, getWaterLogsCloud, getNutritionLogsCloud } from "@/lib/supabase-db";
import { getLocalDateString } from "@/lib/utils";

export default function HomePage() {
  const [waterMl, setWaterMl] = useState(0);
  const [waterGoal, setWaterGoal] = useState(3200);

  const [activePlan, setActivePlan] = useState<any>(null);
  const [profileName, setProfileName] = useState("Champ");
  const [todayWorkout, setTodayWorkout] = useState<any>(null);
  const [completedToday, setCompletedToday] = useState(false);
  const [nutritionCalories, setNutritionCalories] = useState(0);
  const [nutritionProtein, setNutritionProtein] = useState(0);
  const [nutritionCarbs, setNutritionCarbs] = useState(0);
  const [nutritionFat, setNutritionFat] = useState(0);

  const [nutritionGoalCalories, setNutritionGoalCalories] = useState(2800);
  const [nutritionGoalProtein, setNutritionGoalProtein] = useState(180);
  const [nutritionGoalCarbs, setNutritionGoalCarbs] = useState(340);
  const [nutritionGoalFat, setNutritionGoalFat] = useState(80);
  const [streak, setStreak] = useState(0);

  // Load today's water and nutrition on mount
  useEffect(() => {
    const todayStr = getLocalDateString();

    // Synchronous local state load to prevent 0-value flickers
    try {
      const storedWater = localStorage.getItem("fitforge_water_logs");
      if (storedWater) {
        const list = JSON.parse(storedWater);
        const todayLog = list.find((l: any) => l.loggedAt === todayStr);
        if (todayLog) setWaterMl(todayLog.amountMl);
      } else {
        setWaterMl(0);
      }

      const storedMeals = localStorage.getItem("fitforge_meals");
      if (storedMeals) {
        const meals = JSON.parse(storedMeals);
        const todayMeals = meals.filter((m: any) => m.loggedAt === todayStr);
        const totalCal = todayMeals.reduce((sum: number, m: any) => sum + (Number(m.calories) || 0), 0);
        const totalProt = todayMeals.reduce((sum: number, m: any) => sum + (Number(m.protein) || 0), 0);
        const totalCrbs = todayMeals.reduce((sum: number, m: any) => sum + (Number(m.carbs) || 0), 0);
        const totalFt = todayMeals.reduce((sum: number, m: any) => sum + (Number(m.fat) || 0), 0);
        
        setNutritionCalories(totalCal);
        setNutritionProtein(totalProt);
        setNutritionCarbs(totalCrbs);
        setNutritionFat(totalFt);
      }

      const storedProfile = localStorage.getItem("fitforge-profile");
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        if (profile) {
          if (profile.name) setProfileName(profile.name);
          if (profile.targetCalories) setNutritionGoalCalories(Number(profile.targetCalories));
          if (profile.targetProtein) setNutritionGoalProtein(Number(profile.targetProtein));
          if (profile.targetCarbs) setNutritionGoalCarbs(Number(profile.targetCarbs));
          if (profile.targetFat) setNutritionGoalFat(Number(profile.targetFat));
          if (profile.targetWater) setWaterGoal(Number(profile.targetWater));
        }
      }
    } catch (e) {}
    
    // Background cloud water fetch
    getWaterLogsCloud().then(cloudLogs => {
      if (cloudLogs && cloudLogs.length > 0) {
        try {
          localStorage.setItem("fitforge_water_logs", JSON.stringify(cloudLogs));
        } catch (e) {}
        const todayLog = cloudLogs.find((l: any) => l.loggedAt === todayStr);
        if (todayLog) setWaterMl(todayLog.amountMl);
      }
    }).catch(e => console.error("Cloud water fetch failed:", e));

    // Background cloud nutrition fetch
    getNutritionLogsCloud().then(cloudMeals => {
      if (cloudMeals && cloudMeals.length > 0) {
        try {
          localStorage.setItem("fitforge_meals", JSON.stringify(cloudMeals));
        } catch (e) {}
        const todayMeals = cloudMeals.filter((m: any) => m.loggedAt === todayStr);
        const totalCal = todayMeals.reduce((sum: number, m: any) => sum + (Number(m.calories) || 0), 0);
        const totalProt = todayMeals.reduce((sum: number, m: any) => sum + (Number(m.protein) || 0), 0);
        const totalCrbs = todayMeals.reduce((sum: number, m: any) => sum + (Number(m.carbs) || 0), 0);
        const totalFt = todayMeals.reduce((sum: number, m: any) => sum + (Number(m.fat) || 0), 0);
        
        setNutritionCalories(totalCal);
        setNutritionProtein(totalProt);
        setNutritionCarbs(totalCrbs);
        setNutritionFat(totalFt);
      }
    }).catch(e => console.error("Cloud nutrition fetch failed:", e));
  }, []);

  useEffect(() => {
    const hydrateAndLoad = async () => {
      let userIdSuffix = "";
      try {
        const { getAuthUserId } = await import("@/lib/supabase-db");
        const userId = await getAuthUserId();
        if (userId) userIdSuffix = `-${userId}`;
      } catch (e) {}

      // If we don't have profile or active plan locally, try to hydrate from cloud
      let hasLocalProfile = null;
      let hasLocalPlan = null;
      try {
        hasLocalProfile = localStorage.getItem("fitforge-profile");
        hasLocalPlan = localStorage.getItem("fitforge_active_plan");
      } catch (e) {}
      
      if (!hasLocalProfile || !hasLocalPlan) {
        const success = await hydrateLocalDataFromCloud();
        if (success) {
          loadLocalStates(userIdSuffix);
          return;
        }
      }
      
      loadLocalStates(userIdSuffix);
    };

    const loadLocalStates = (userSuffix = "") => {
      // 0. Get user profile name and targets
      try {
        const storedProfile = localStorage.getItem("fitforge-profile");
        if (storedProfile) {
          const profile = JSON.parse(storedProfile);
          if (profile) {
            if (profile.name) setProfileName(profile.name);
            if (profile.targetCalories) setNutritionGoalCalories(Number(profile.targetCalories));
            if (profile.targetProtein) setNutritionGoalProtein(Number(profile.targetProtein));
            if (profile.targetCarbs) setNutritionGoalCarbs(Number(profile.targetCarbs));
            if (profile.targetFat) setNutritionGoalFat(Number(profile.targetFat));
            if (profile.targetWater) setWaterGoal(Number(profile.targetWater));
          }
        }
      } catch (e) {}

      // 0.5. Get nutrition logs
      try {
        const storedMeals = localStorage.getItem("fitforge_meals");
        const todayDateStr = getLocalDateString();
        if (storedMeals) {
          const meals = JSON.parse(storedMeals);
          const todayMeals = meals.filter((m: any) => m.loggedAt === todayDateStr);
          const totalCal = todayMeals.reduce((sum: number, m: any) => sum + (Number(m.calories) || 0), 0);
          const totalProt = todayMeals.reduce((sum: number, m: any) => sum + (Number(m.protein) || 0), 0);
          const totalCrbs = todayMeals.reduce((sum: number, m: any) => sum + (Number(m.carbs) || 0), 0);
          const totalFt = todayMeals.reduce((sum: number, m: any) => sum + (Number(m.fat) || 0), 0);
          
          setNutritionCalories(totalCal);
          setNutritionProtein(totalProt);
          setNutritionCarbs(totalCrbs);
          setNutritionFat(totalFt);
        } else {
          // Default fallbacks if empty (stable user-scoped non-colliding IDs)
          const defaults = [
            { id: `default-breakfast${userSuffix}`, mealType: "breakfast", foodName: "Organic Rolled Oats with Whey", calories: 310, protein: 32, carbs: 34, fat: 4, loggedAt: todayDateStr },
            { id: `default-lunch${userSuffix}`, mealType: "lunch", foodName: "Grilled Chicken Breast & Jasmine Rice", calories: 450, protein: 50, carbs: 44, fat: 5, loggedAt: todayDateStr },
          ];
          localStorage.setItem("fitforge_meals", JSON.stringify(defaults));
          setNutritionCalories(760);
          setNutritionProtein(82);
          setNutritionCarbs(78);
          setNutritionFat(9);
        }
      } catch (e) {}

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
    };

    hydrateAndLoad();
  }, []);

  const handleAddWater = (amount: number) => {
    setWaterMl((prev) => {
      const next = Math.min(prev + amount, 6000);
      const todayStr = getLocalDateString();
      
      // Update local storage
      try {
        const stored = localStorage.getItem("fitforge_water_logs");
        const list = stored ? JSON.parse(stored) : [];
        const todayIndex = list.findIndex((l: any) => l.loggedAt === todayStr);
        
        let todayLog;
        if (todayIndex > -1) {
          list[todayIndex].amountMl = next;
          todayLog = list[todayIndex];
        } else {
          todayLog = {
            id: `water-${Date.now()}`,
            amountMl: next,
            loggedAt: todayStr,
          };
          list.push(todayLog);
        }
        localStorage.setItem("fitforge_water_logs", JSON.stringify(list));
        
        // Sync to cloud in background
        syncWaterLogs([todayLog]).catch(e => console.error("Cloud water sync failed:", e));
      } catch (e) {}
      
      return next;
    });
  };

  const waterPercent = Math.min((waterMl / waterGoal) * 100, 100);

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="space-y-6">
      {/* Hero Greeting */}
      <div className="flex flex-col space-y-1 select-none">
        <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
          Forge Your Body, <span className="text-primary">{profileName}</span>
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
                <div className="space-y-2 border-l-2 border-bonprder/80 pl-4 py-1">
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
                    {nutritionCalories.toLocaleString()} / {nutritionGoalCalories.toLocaleString()} kcal
                  </span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((nutritionCalories / nutritionGoalCalories) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Macros Breakdown */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Protein (Goal: {nutritionGoalProtein}g)</span>
                  <span className="font-mono font-semibold text-foreground tabular-nums">
                    {nutritionProtein}g <span className="text-muted-foreground text-[10px]">({Math.round((nutritionProtein / nutritionGoalProtein) * 100)}%)</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Carbohydrates (Goal: {nutritionGoalCarbs}g)</span>
                  <span className="font-mono font-semibold text-foreground tabular-nums">
                    {nutritionCarbs}g <span className="text-muted-foreground text-[10px]">({Math.round((nutritionCarbs / nutritionGoalCarbs) * 100)}%)</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Fats (Goal: {nutritionGoalFat}g)</span>
                  <span className="font-mono font-semibold text-foreground tabular-nums">
                    {nutritionFat}g <span className="text-muted-foreground text-[10px]">({Math.round((nutritionFat / nutritionGoalFat) * 100)}%)</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
