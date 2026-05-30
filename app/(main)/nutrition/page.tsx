"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { syncNutritionLog, deleteNutritionLogCloud, getNutritionLogsCloud } from "@/lib/supabase-db";
import { getLocalDateString } from "@/lib/utils";
import {
  Utensils,
  Plus,
  Trash2,
  Camera,
  Sparkles,
  Search,
  Check,
  TrendingUp,
  Apple,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";



export default function NutritionPage() {
  const [logs, setLogs] = useState<any[]>([]);

  const [activeMealType, setActiveMealType] = useState("breakfast");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");



  // Load from localStorage and cloud on mount
  useEffect(() => {
    const initializeMeals = async () => {
      let userIdSuffix = "";
      try {
        const { getAuthUserId } = await import("@/lib/supabase-db");
        const userId = await getAuthUserId();
        if (userId) userIdSuffix = `-${userId}`;
      } catch (e) {}

      // Load dynamic targets from profile
      try {
        const storedProfile = localStorage.getItem("fitforge-profile");
        if (storedProfile) {
          const profile = JSON.parse(storedProfile);
          if (profile) {
            if (profile.targetCalories) setGoalCalories(Number(profile.targetCalories));
            if (profile.targetProtein) setGoalProtein(Number(profile.targetProtein));
            if (profile.targetCarbs) setGoalCarbs(Number(profile.targetCarbs));
            if (profile.targetFat) setGoalFat(Number(profile.targetFat));
          }
        }
      } catch (e) {}

      try {
        const stored = localStorage.getItem("fitforge_meals");
        if (stored) {
          setLogs(JSON.parse(stored));
        } else {
          // Seed default fallback with stable, non-colliding IDs scoped to the user
          const defaults = [
            { id: `default-breakfast${userIdSuffix}`, mealType: "breakfast", foodName: "Organic Rolled Oats with Whey", calories: 310, protein: 32, carbs: 34, fat: 4, loggedAt: getLocalDateString() },
            { id: `default-lunch${userIdSuffix}`, mealType: "lunch", foodName: "Grilled Chicken Breast & Jasmine Rice", calories: 450, protein: 50, carbs: 44, fat: 5, loggedAt: getLocalDateString() },
          ];
          setLogs(defaults);
          localStorage.setItem("fitforge_meals", JSON.stringify(defaults));
        }
      } catch (e) {}

      // Background sync from Supabase
      getNutritionLogsCloud().then(cloudMeals => {
        if (cloudMeals && cloudMeals.length > 0) {
          setLogs(cloudMeals);
          try {
            localStorage.setItem("fitforge_meals", JSON.stringify(cloudMeals));
          } catch (e) {}
        }
      }).catch(e => console.error("Failed to fetch nutrition from cloud:", e));
    };

    initializeMeals();
  }, []);

  // Helper to persist logs locally and sync in background to Supabase
  const updateLogsAndSync = (newLogs: any[], mealToSync?: any, action: "upsert" | "delete" = "upsert") => {
    setLogs(newLogs);
    try {
      localStorage.setItem("fitforge_meals", JSON.stringify(newLogs));
    } catch (e) {}

    if (mealToSync) {
      if (action === "upsert") {
        syncNutritionLog(mealToSync).catch(e => console.error("Cloud nutrition sync failed:", e));
      } else if (action === "delete") {
        deleteNutritionLogCloud(mealToSync.id).catch(e => console.error("Cloud nutrition delete failed:", e));
      }
    }
  };

  const todayStr = getLocalDateString();
  const todayLogs = logs.filter((log) => log.loggedAt === todayStr);

  // Total macro calculations
  const totalCalories = todayLogs.reduce((sum, log) => sum + log.calories, 0);
  const totalProtein = todayLogs.reduce((sum, log) => sum + log.protein, 0);
  const totalCarbs = todayLogs.reduce((sum, log) => sum + log.carbs, 0);
  const totalFat = todayLogs.reduce((sum, log) => sum + log.fat, 0);

  // Core Goal profiles (Bulk profile defaults)
  const [goalCalories, setGoalCalories] = useState(2800);
  const [goalProtein, setGoalProtein] = useState(180);
  const [goalCarbs, setGoalCarbs] = useState(340);
  const [goalFat, setGoalFat] = useState(80);

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName || !calories) return;

    const newLog = {
      id: `meal-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      mealType: activeMealType,
      foodName,
      calories: Number(calories),
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      loggedAt: getLocalDateString(),
    };

    updateLogsAndSync([...logs, newLog], newLog, "upsert");
    setFoodName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setShowAddModal(false);
  };

  const handleQuickAdd = (food: any) => {
    const newLog = {
      id: `meal-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      mealType: activeMealType,
      foodName: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      loggedAt: getLocalDateString(),
    };
    updateLogsAndSync([...logs, newLog], newLog, "upsert");
  };

  const handleDeleteLog = (id: string) => {
    const mealToDelete = logs.find(log => log.id === id);
    const remaining = logs.filter((log) => log.id !== id);
    updateLogsAndSync(remaining, mealToDelete, "delete");
  };

  const filterLogs = (type: string) => todayLogs.filter((log) => log.mealType === type);

  return (
    <div className="space-y-6">
      {/* Header Description */}
      <div className="flex flex-col space-y-1 select-none">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Nutrition & Macro Diary
        </h2>
        <p className="text-xs text-muted-foreground">
          Track energy targets and log meal sections to forge your physique.
        </p>
      </div>

      {/* Target Progress Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 select-none">
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex flex-col justify-between h-24">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
              Energy Tracker
            </span>
            <div className="flex justify-between items-end">
              <span className="text-xl font-mono font-extrabold text-foreground tabular-nums">
                {totalCalories} <span className="text-xs text-muted-foreground">/ {goalCalories} kcal</span>
              </span>
              <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                {Math.round((totalCalories / goalCalories) * 100)}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mt-1">
              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((totalCalories / goalCalories) * 100, 100)}%` }} />
            </div>
          </CardContent>
        </Card>

        {/* Protein target */}
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex flex-col justify-between h-24">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
              Protein Target
            </span>
            <div className="flex justify-between items-end">
              <span className="text-xl font-mono font-extrabold text-foreground tabular-nums">
                {totalProtein}g <span className="text-xs text-muted-foreground">/ {goalProtein}g</span>
              </span>
              <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                {Math.round((totalProtein / goalProtein) * 100)}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mt-1">
              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((totalProtein / goalProtein) * 100, 100)}%` }} />
            </div>
          </CardContent>
        </Card>

        {/* Carbs target */}
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex flex-col justify-between h-24">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
              Carb Target
            </span>
            <div className="flex justify-between items-end">
              <span className="text-xl font-mono font-extrabold text-foreground tabular-nums">
                {totalCarbs}g <span className="text-xs text-muted-foreground">/ {goalCarbs}g</span>
              </span>
              <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                {Math.round((totalCarbs / goalCarbs) * 100)}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mt-1">
              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((totalCarbs / goalCarbs) * 100, 100)}%` }} />
            </div>
          </CardContent>
        </Card>

        {/* Fat target */}
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex flex-col justify-between h-24">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
              Fat Target
            </span>
            <div className="flex justify-between items-end">
              <span className="text-xl font-mono font-extrabold text-foreground tabular-nums">
                {totalFat}g <span className="text-xs text-muted-foreground">/ {goalFat}g</span>
              </span>
              <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                {Math.round((totalFat / goalFat) * 100)}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mt-1">
              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((totalFat / goalFat) * 100, 100)}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Centered Single Column for Meal Categories */}
      <div className="max-w-2xl mx-auto space-y-6">
          {["breakfast", "lunch", "dinner", "snack"].map((meal) => {
            const mealLogs = filterLogs(meal);
            const mealCal = mealLogs.reduce((sum, log) => sum + log.calories, 0);

            return (
              <Card key={meal} className="border-border bg-card">
                <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
                      {meal}
                    </CardTitle>
                    <CardDescription className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-widest">
                      {mealLogs.length} logged
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono font-bold text-primary tabular-nums">
                      {mealCal} kcal
                    </span>
                    <Button
                      onClick={() => {
                        setActiveMealType(meal);
                        setShowAddModal(true);
                      }}
                      size="sm"
                      className="h-8 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Food
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-3.5 select-none">
                  {mealLogs.length > 0 ? (
                    mealLogs.map((log) => (
                      <div key={log.id} className="flex justify-between items-center text-xs group">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-foreground block">
                            {log.foodName}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono font-semibold block uppercase tracking-wider">
                            P: {log.protein}g • C: {log.carbs}g • F: {log.fat}g
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-foreground tabular-nums">
                            {log.calories} kcal
                          </span>
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      No foods logged for {meal}. Tap "Add Food" to start.
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* POPUP FOR ADD CUSTOM MEAL FORM */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0A0A0B]/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4"
            >
              <div className="flex flex-col space-y-1">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Log Custom Food
                </h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  Adding to {activeMealType} category
                </p>
              </div>

              <form onSubmit={handleAddLog} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    Food Name / Description
                  </label>
                  <Input
                    required
                    type="text"
                    placeholder="e.g. Grilled Ribeye"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      Calories (kcal)
                    </label>
                    <Input
                      required
                      type="number"
                      placeholder="e.g. 350"
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      Protein (g)
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g. 35"
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      Carbohydrates (g)
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g. 45"
                      value={carbs}
                      onChange={(e) => setCarbs(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      Fats (g)
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g. 12"
                      value={fat}
                      onChange={(e) => setFat(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowAddModal(false)}
                    className="h-9 text-xs border border-border"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="h-9 text-xs">
                    Log Item
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POPUP FOR AI PHOTO PARSING OVERLAY */}

    </div>
  );
}
