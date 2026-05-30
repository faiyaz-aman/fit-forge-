"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  User,
  Heart,
  Scale,
  Check,
  Award,
} from "lucide-react";
import { syncProfile, syncWeightLogs, getProfile, getWeightLogsCloud } from "@/lib/supabase-db";

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<any>({
    name: "",
    age: 26,
    sex: "male", // male | female
    heightCm: 180,
    experienceLevel: "INTERMEDIATE",
    goal: "BULK",
    equipment: "FULL_GYM",
    targetCalories: 2800,
    targetProtein: 180,
    targetCarbs: 340,
    targetFat: 80,
    targetWater: 3200,
  });

  const [measurements, setMeasurements] = useState<any>({
    weight: 75.0,
    neck: 38.0,
    waist: 84.0,
    hips: 92.0, // Used for female Navy math
    chest: 102.0,
    leftArm: 37.0,
    rightArm: 37.2,
    leftThigh: 58.0,
    rightThigh: 58.2,
    leftCalf: 38.5,
    rightCalf: 38.5,
  });

  const [saved, setSaved] = useState(false);

  // Load persisted profile from localStorage on mount
  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem("fitforge-profile");
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        setProfileData((prev: any) => ({
          ...prev,
          ...parsed,
          targetCalories: parsed.targetCalories ?? prev.targetCalories ?? 2800,
          targetProtein: parsed.targetProtein ?? prev.targetProtein ?? 180,
          targetCarbs: parsed.targetCarbs ?? prev.targetCarbs ?? 340,
          targetFat: parsed.targetFat ?? prev.targetFat ?? 80,
          targetWater: parsed.targetWater ?? prev.targetWater ?? 3200,
        }));
      }
      const storedMeasurements = localStorage.getItem("fitforge-measurements");
      if (storedMeasurements) {
        setMeasurements((prev: any) => ({
          ...prev,
          ...JSON.parse(storedMeasurements),
        }));
      }
    } catch (e) {}

    // Cloud fetch
    getProfile().then(cloudProfile => {
      if (cloudProfile) {
        setProfileData((prev: any) => {
          const updated = {
            ...prev,
            ...cloudProfile,
            targetCalories: cloudProfile.targetCalories ?? prev.targetCalories ?? 2800,
            targetProtein: cloudProfile.targetProtein ?? prev.targetProtein ?? 180,
            targetCarbs: cloudProfile.targetCarbs ?? prev.targetCarbs ?? 340,
            targetFat: cloudProfile.targetFat ?? prev.targetFat ?? 80,
            targetWater: cloudProfile.targetWater ?? prev.targetWater ?? 3200,
          };
          try {
            localStorage.setItem("fitforge-profile", JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      }
    }).catch(e => console.error("Cloud profile fetch failed:", e));

    getWeightLogsCloud().then(cloudWeights => {
      if (cloudWeights && cloudWeights.length > 0) {
        const latest = cloudWeights.sort((a: any, b: any) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())[0];
        if (latest) {
          setMeasurements((prev: any) => {
            const updated = { ...prev, weight: latest.weight };
            try {
              localStorage.setItem("fitforge-measurements", JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        }
      }
    }).catch(e => console.error("Cloud weight fetch failed:", e));
  }, []);

  const handleProfileChange = (field: string, val: any) => {
    setProfileData((prev: any) => ({ ...prev, [field]: val }));
  };

  const handleMeasurementChange = (field: string, val: any) => {
    setMeasurements((prev: any) => ({ ...prev, [field]: val }));
  };

  // 1. Navy Body Fat Formula Calculation
  const calculateBodyFat = () => {
    const { sex, heightCm } = profileData;
    const { waist, neck, hips } = measurements;

    if (!waist || !neck || !heightCm) return 0;

    const heightIn = heightCm / 2.54;
    const waistIn = waist / 2.54;
    const neckIn = neck / 2.54;
    const hipsIn = hips / 2.54;

    try {
      if (sex === "male") {
        if (waistIn <= neckIn) return 0;
        const pct = 86.01 * Math.log10(waistIn - neckIn) - 70.041 * Math.log10(heightIn) + 36.76;
        return Math.max(2, Math.min(50, Number(pct.toFixed(1))));
      } else {
        if (waistIn + hipsIn <= neckIn) return 0;
        const pct = 163.205 * Math.log10(waistIn + hipsIn - neckIn) - 97.684 * Math.log10(heightIn) - 78.387;
        return Math.max(5, Math.min(60, Number(pct.toFixed(1))));
      }
    } catch {
      return 0;
    }
  };

  // Calculate dynamic TDEE target
  const calculateTDEE = () => {
    const { sex, age, heightCm } = profileData;
    const { weight } = measurements;

    let bmr = 0;
    if (sex === "male") {
      bmr = 10 * weight + 6.25 * heightCm - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * heightCm - 5 * age - 161;
    }

    const tdee = Math.round(bmr * 1.375);
    
    if (profileData.goal === "BULK") return tdee + 300;
    if (profileData.goal === "CUT") return tdee - 500;
    return tdee;
  };

  const autoCalculateTargets = () => {
    const calorieTarget = calculateTDEE();
    // Balanced high protein: 2.0g per kg of weight
    const proteinTarget = Math.round((measurements.weight || 70) * 2.0);
    // 25% fats
    const fatTarget = Math.round((calorieTarget * 0.25) / 9);
    // Carbs = remainder
    const carbsTarget = Math.round((calorieTarget - (proteinTarget * 4) - (fatTarget * 9)) / 4);

    setProfileData((prev: any) => ({
      ...prev,
      targetCalories: calorieTarget,
      targetProtein: proteinTarget,
      targetCarbs: carbsTarget,
      targetFat: fatTarget,
      targetWater: 3200,
    }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem("fitforge-profile", JSON.stringify(profileData));
      localStorage.setItem("fitforge-measurements", JSON.stringify(measurements));
    } catch (e) {}

    // Cloud profile sync
    syncProfile(profileData).catch(e => console.error("Cloud profile sync failed:", e));

    // Cloud weight sync
    const bodyFatVal = calculateBodyFat();
    syncWeightLogs([{
      id: `weight-${Date.now()}`,
      weight: measurements.weight,
      bodyFat: bodyFatVal > 0 ? bodyFatVal : null,
      loggedAt: new Date().toISOString()
    }]).catch(e => console.error("Cloud weight sync failed:", e));

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const bodyFat = calculateBodyFat();
  const tdee = calculateTDEE();
  const weightMovingAverage = ((measurements.weight || 70) * 0.98 + 0.02 * (measurements.weight || 70)).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header Description */}
      <div className="flex flex-col space-y-1 select-none border-b border-border/40 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Profile & Target Configuration
        </h2>
        <p className="text-xs text-muted-foreground">
          Log measurements to run body estimators, set custom calorie and macro goals, and save targets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Profile Parameters & Calculations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Physical Properties
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Display Name
                </label>
                <Input value={profileData.name || ""} onChange={(e) => handleProfileChange("name", e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    Age (Years)
                  </label>
                  <Input
                    type="number"
                    value={profileData.age ?? ""}
                    onChange={(e) => handleProfileChange("age", e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    Biological Sex
                  </label>
                  <select
                    value={profileData.sex || "male"}
                    onChange={(e) => handleProfileChange("sex", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-border bg-[#141416] px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Height (cm)
                </label>
                <Input
                  type="number"
                  value={profileData.heightCm ?? ""}
                  onChange={(e) => handleProfileChange("heightCm", e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Primary Fitness Goal
                </label>
                <select
                  value={profileData.goal || "GENERAL_HEALTH"}
                  onChange={(e) => handleProfileChange("goal", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border bg-[#141416] px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  <option value="GENERAL_HEALTH">General Health</option>
                  <option value="CUT">Cutting / Fat Loss</option>
                  <option value="BULK">Bulking / Muscle Gain</option>
                  <option value="MAINTAIN">Maintenance</option>
                  <option value="STRENGTH">Powerlifting / Strength</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Nutrition & Hydration Targets Card */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-primary" />
                Nutrition & Hydration Targets
              </CardTitle>
              <Button
                variant="secondary"
                size="sm"
                onClick={autoCalculateTargets}
                className="h-7 text-[10px] uppercase font-bold tracking-wider px-2 border border-border cursor-pointer"
              >
                Auto-Calculate
              </Button>
            </CardHeader>
            <CardContent className="p-5 grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Calories (kcal)
                </label>
                <Input
                  type="number"
                  value={profileData.targetCalories ?? ""}
                  onChange={(e) => handleProfileChange("targetCalories", e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Protein (g)
                </label>
                <Input
                  type="number"
                  value={profileData.targetProtein ?? ""}
                  onChange={(e) => handleProfileChange("targetProtein", e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Carbs (g)
                </label>
                <Input
                  type="number"
                  value={profileData.targetCarbs ?? ""}
                  onChange={(e) => handleProfileChange("targetCarbs", e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Fats (g)
                </label>
                <Input
                  type="number"
                  value={profileData.targetFat ?? ""}
                  onChange={(e) => handleProfileChange("targetFat", e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Water (ml)
                </label>
                <Input
                  type="number"
                  value={profileData.targetWater ?? ""}
                  onChange={(e) => handleProfileChange("targetWater", e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Body Measurements Logger Form */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" />
                Circumference Logs (cm)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Body Weight (kg)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={measurements.weight ?? ""}
                  onChange={(e) => handleMeasurementChange("weight", e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Neck Size
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={measurements.neck ?? ""}
                  onChange={(e) => handleMeasurementChange("neck", e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Waist Line
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={measurements.waist ?? ""}
                  onChange={(e) => handleMeasurementChange("waist", e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Hips Size
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={measurements.hips ?? ""}
                  onChange={(e) => handleMeasurementChange("hips", e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Chest Size
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={measurements.chest ?? ""}
                  onChange={(e) => handleMeasurementChange("chest", e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Left Bicep
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={measurements.leftArm ?? ""}
                  onChange={(e) => handleMeasurementChange("leftArm", e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Right Bicep
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={measurements.rightArm ?? ""}
                  onChange={(e) => handleMeasurementChange("rightArm", e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Left Thigh
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={measurements.leftThigh ?? ""}
                  onChange={(e) => handleMeasurementChange("leftThigh", e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>
            </CardContent>
            <CardFooter className="justify-between border-t border-border/40 py-3">
              <span className="text-[9px] font-mono text-muted-foreground">
                Last checked in: Today
              </span>
              <Button onClick={handleSave} className="flex items-center gap-1.5 h-9 text-xs px-4 cursor-pointer">
                {saved ? "Saved Logs!" : "Save Profile & Goals"}
                {saved && <Check className="w-3.5 h-3.5" />}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* RIGHT COLUMN: Navy Body Fat & Calories Target Details */}
        <div className="space-y-6 select-none">
          {/* Navy Body Fat Card */}
          <Card className="border-border bg-card bg-gradient-to-br from-primary/[0.02] to-transparent">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-1.5 text-xs text-primary font-bold">
                <Award className="w-3.5 h-3.5" />
                <span>NAVY BODY FAT ESTIMATOR</span>
              </div>
              <CardDescription className="text-xs">
                Auto-calculated from neck, waist, hips, and height using US Navy formulas.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-6 space-y-3">
              <div className="w-24 h-24 rounded-full border-[4px] border-primary/20 border-t-primary flex flex-col items-center justify-center text-center shadow-lg relative neon-glow">
                <span className="text-2xl font-mono font-extrabold text-foreground tabular-nums">
                  {bodyFat > 0 ? `${bodyFat}%` : "--"}
                </span>
                <span className="text-[8px] text-muted-foreground font-mono font-semibold block uppercase tracking-widest">
                  Body Fat %
                </span>
              </div>
              <span className="text-[9px] font-mono text-muted-foreground">
                Formula Margin: ±1.5% accuracy
              </span>
            </CardContent>
          </Card>

          {/* TDEE Summary Target */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center gap-1.5 text-xs text-primary font-bold">
                <Heart className="w-3.5 h-3.5 text-primary" />
                <span>ENERGY COEFFICIENT</span>
              </div>
              <CardDescription className="text-xs">
                Your estimated Daily Calorie Expenditure.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground">Recommended TDEE Target:</span>
                <span className="font-mono font-extrabold text-primary text-base tabular-nums">
                  {tdee} kcal
                </span>
              </div>

              {/* Smoothed Weight moving average info */}
              <div className="space-y-1.5 border-t border-border/40 pt-3">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>7-Day Smoothed Weight Average:</span>
                  <span className="font-mono font-bold text-foreground tabular-nums">
                    {weightMovingAverage} kg
                  </span>
                </div>
                <p className="text-[9px] text-muted-foreground leading-relaxed">
                  Moving averages filter out daily temporary fluctuations (water weight, sodium, sleep schedules) to focus on structural tissue changes.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
