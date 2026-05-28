"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

// Seeded quick add foods
const quickAddFoods = [
  { name: "Grilled Chicken Breast (150g)", calories: 250, protein: 46, carbs: 0, fat: 5 },
  { name: "Cooked Jasmine Rice (150g)", calories: 200, protein: 4, carbs: 44, fat: 0 },
  { name: "Large Whole Egg (1 Pc)", calories: 75, protein: 6.5, carbs: 0.5, fat: 5 },
  { name: "Whey Protein Shake (1 Scoop)", calories: 120, protein: 25, carbs: 2, fat: 1 },
  { name: "Organic Rolled Oats (50g)", calories: 190, protein: 7, carbs: 32, fat: 3 },
  { name: "Canned Albacore Tuna (100g)", calories: 110, protein: 23, carbs: 0, fat: 1.5 },
];

export default function NutritionPage() {
  const [logs, setLogs] = useState<any[]>([
    { id: "1", mealType: "breakfast", foodName: "Organic Rolled Oats with Whey", calories: 310, protein: 32, carbs: 34, fat: 4 },
    { id: "2", mealType: "lunch", foodName: "Grilled Chicken Breast & Jasmine Rice", calories: 450, protein: 50, carbs: 44, fat: 5 },
  ]);

  const [activeMealType, setActiveMealType] = useState("breakfast");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPhotoScanner, setShowPhotoScanner] = useState(false);
  const [scanning, setScanning] = useState(false);

  // Form states
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Total macro calculations
  const totalCalories = logs.reduce((sum, log) => sum + log.calories, 0);
  const totalProtein = logs.reduce((sum, log) => sum + log.protein, 0);
  const totalCarbs = logs.reduce((sum, log) => sum + log.carbs, 0);
  const totalFat = logs.reduce((sum, log) => sum + log.fat, 0);

  // Core Goal profiles (Bulk profile defaults)
  const goalCalories = 2800;
  const goalProtein = 180;
  const goalCarbs = 340;
  const goalFat = 80;

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName || !calories) return;

    const newLog = {
      id: Math.random().toString(),
      mealType: activeMealType,
      foodName,
      calories: Number(calories),
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
    };

    setLogs((prev) => [...prev, newLog]);
    setFoodName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setShowAddModal(false);
  };

  const handleQuickAdd = (food: any) => {
    const newLog = {
      id: Math.random().toString(),
      mealType: activeMealType,
      foodName: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  const handleDeleteLog = (id: string) => {
    setLogs((prev) => prev.filter((log) => log.id !== id));
  };

  const triggerPhotoSelect = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScanning(true);
      setShowPhotoScanner(true);

      const reader = new FileReader();
      reader.onload = async () => {
        const base64Str = reader.result as string;

        try {
          const response = await fetch("/api/ai/analyze-meal-photo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image: base64Str,
              fileName: file.name,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.parsed) {
              const parsed = data.parsed;
              const newLog = {
                id: Math.random().toString(),
                mealType: activeMealType,
                foodName: `${parsed.foodName} (${parsed.estimatedGrams}g)`,
                calories: parsed.calories,
                protein: parsed.protein,
                carbs: parsed.carbs,
                fat: parsed.fat,
              };
              setLogs((prev) => [...prev, newLog]);
            }
          }
        } catch (err) {
          console.error("AI photo scan failed:", err);
        } finally {
          setScanning(false);
          setShowPhotoScanner(false);
        }
      };

      reader.readAsDataURL(file);
    }
  };

  const filterLogs = (type: string) => logs.filter((log) => log.mealType === type);

  return (
    <div className="space-y-6">
      {/* Header Description */}
      <div className="flex flex-col space-y-1 select-none">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Nutrition & Macro Diary
        </h2>
        <p className="text-xs text-muted-foreground">
          Track energy targets, log meal sections, and let our GPT-4 Vision camera parse plate photos to calculate calories.
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

      {/* Main Grid: Columns for Categories & Fast Seed selectors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meal Categories Left Column */}
        <div className="lg:col-span-2 space-y-6">
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

        {/* Fast Add & AI Scanning Right Column */}
        <div className="space-y-6 select-none">
          {/* AI Scanning Cam Panel */}
          <Card className="border-border bg-card bg-gradient-to-br from-primary/[0.02] to-transparent">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-1.5 text-xs text-primary font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI MEAL PHOTO SCANNER</span>
              </div>
              <CardDescription className="text-xs">
                Snap or upload a meal photo to let GPT-4 Vision estimate calories and macros instantly.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoScan}
                className="hidden"
              />
              <Button
                onClick={triggerPhotoSelect}
                className="w-full flex items-center justify-center gap-2 h-11"
              >
                <Camera className="w-4 h-4" />
                Scan Plate Photo
              </Button>
            </CardContent>
          </Card>

          {/* Quick Seed Foods */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-1.5 text-xs text-primary font-bold">
                <Apple className="w-3.5 h-3.5" />
                <span>FAST ADD BASICS</span>
              </div>
              <CardDescription className="text-[10px] text-muted-foreground">
                Tap to append standard bodybuilder foods into the active meal category (Active: <span className="font-bold text-primary uppercase">{activeMealType}</span>).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 space-y-1.5">
              {quickAddFoods.map((food, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAdd(food)}
                  className="flex items-center justify-between w-full p-2 rounded-lg border border-border bg-[#141416]/50 hover:bg-secondary/40 transition-colors text-left text-xs cursor-pointer group"
                >
                  <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {food.name.split(" ")[0]} {food.name.split(" ")[1]}
                  </span>
                  <span className="font-mono text-muted-foreground font-bold tabular-nums">
                    {food.calories} kcal
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
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
      <AnimatePresence>
        {showPhotoScanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0A0A0B]/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-card border border-border rounded-2xl w-full max-w-xs p-6 flex flex-col items-center justify-center text-center space-y-6 shadow-2xl"
            >
              {/* Spinning parser animation */}
              <div className="relative flex items-center justify-center select-none">
                <div className="w-16 h-16 rounded-full border border-border border-t-primary animate-spin" />
                <Camera className="w-5 h-5 text-primary absolute animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary">
                  {scanning ? "AI SCANNING MEAL PHOTO..." : "PARSING COMPLETE!"}
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Our sports nutrition AI is analyzing pixels, estimating portion weights, and calculating macronutrient coefficients. Stand by!
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
