"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, ArrowRight, Check, Activity, Dumbbell, Compass, Heart } from "lucide-react";
import { syncProfile } from "@/lib/supabase-db";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    age: 25,
    sex: "male",
    heightCm: 175,
    weightKg: 70,
    experienceLevel: "INTERMEDIATE", // BEGINNER | INTERMEDIATE | ADVANCED
    goal: "GENERAL_HEALTH", // CUT | BULK | MAINTAIN | STRENGTH | GENERAL_HEALTH
    equipment: "FULL_GYM", // FULL_GYM | HOME | MINIMAL
    daysPerWeek: 4,
    sessionMinutes: 60,
    injuries: "",
  });

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      localStorage.setItem("fitforge-profile", JSON.stringify(formData));
      
      // Seed default measurements
      const initialMeasurements = {
        weight: formData.weightKg,
        neck: 38.0,
        waist: 84.0,
        hips: 92.0,
        chest: 102.0,
        leftArm: 37.0,
        rightArm: 37.2,
        leftThigh: 58.0,
        rightThigh: 58.2,
        leftCalf: 38.5,
        rightCalf: 38.5,
      };
      localStorage.setItem("fitforge-measurements", JSON.stringify(initialMeasurements));
    } catch (e) {}

    // Cloud sync
    try {
      await syncProfile(formData);
    } catch (e) {
      console.error("Cloud onboarding profile sync failed:", e);
    }
    
    window.location.href = "/home";
  };

  // Step 1: Physiological Stats
  const renderStep1 = () => (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          What should we call you?
        </label>
        <Input
          type="text"
          placeholder="e.g. Alex"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Age (Years)
          </label>
          <Input
            type="number"
            min={12}
            max={100}
            value={formData.age}
            onChange={(e) => handleInputChange("age", Number(e.target.value))}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Biological Sex
          </label>
          <select
            value={formData.sex}
            onChange={(e) => handleInputChange("sex", e.target.value)}
            className="flex h-10 w-full rounded-lg border border-border bg-[#141416] px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Height (cm)
          </label>
          <Input
            type="number"
            min={100}
            max={250}
            value={formData.heightCm}
            onChange={(e) => handleInputChange("heightCm", Number(e.target.value))}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Current Weight (kg)
          </label>
          <Input
            type="number"
            step="0.1"
            min={30}
            max={300}
            value={formData.weightKg}
            onChange={(e) => handleInputChange("weightKg", Number(e.target.value))}
          />
        </div>
      </div>
    </motion.div>
  );

  // Step 2: Training & Equipment
  const renderStep2 = () => (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Experience Level
        </label>
        <div className="grid grid-cols-3 gap-2">
          {["BEGINNER", "INTERMEDIATE", "ADVANCED"].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => handleInputChange("experienceLevel", level)}
              className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                formData.experienceLevel === level
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/30"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Primary Goal
        </label>
        <select
          value={formData.goal}
          onChange={(e) => handleInputChange("goal", e.target.value)}
          className="flex h-10 w-full rounded-lg border border-border bg-[#141416] px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        >
          <option value="GENERAL_HEALTH">General Health & Fitness</option>
          <option value="CUT">Fat Loss / Cutting (-20% Calories)</option>
          <option value="BULK">Muscle Gain / Bulking (+10% Calories)</option>
          <option value="MAINTAIN">Maintain Bodyweight</option>
          <option value="STRENGTH">Increase Raw Strength</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Equipment Available
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "FULL_GYM", name: "Full Gym" },
            { id: "HOME", name: "Home Gym" },
            { id: "MINIMAL", name: "Minimalist" },
          ].map((eq) => (
            <button
              key={eq.id}
              type="button"
              onClick={() => handleInputChange("equipment", eq.id)}
              className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                formData.equipment === eq.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/30"
              }`}
            >
              {eq.name}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );

  // Step 3: Availability & Constraints
  const renderStep3 = () => (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Slider
          label="Weekly Availability (Days per Week)"
          min={1}
          max={7}
          value={formData.daysPerWeek}
          onChange={(val) => handleInputChange("daysPerWeek", val)}
        />
      </div>

      <div className="space-y-2">
        <Slider
          label="Target Session Duration (Minutes)"
          min={15}
          max={180}
          step={5}
          value={formData.sessionMinutes}
          onChange={(val) => handleInputChange("sessionMinutes", val)}
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Injuries or Limitations
        </label>
        <Input
          type="text"
          placeholder="e.g. Left shoulder impingement, lower back tightness"
          value={formData.injuries}
          onChange={(e) => handleInputChange("injuries", e.target.value)}
        />
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B] p-4 relative overflow-hidden select-none">
      {/* Background ambient radial gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-primary/3 blur-3xl" />

      <div className="w-full max-w-[440px] z-10 space-y-6">
        {/* Progress tracker */}
        <div className="flex justify-between items-center px-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">
            Profile Setup Wizard
          </h2>
          <span className="text-xs font-mono font-bold text-primary">
            Step {step} of 3
          </span>
        </div>

        {/* Setup card */}
        <Card hoverGlow className="border-border bg-[#141416]/90 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              {step === 1 && <Activity className="w-4 h-4 text-primary" />}
              {step === 2 && <Dumbbell className="w-4 h-4 text-primary" />}
              {step === 3 && <Heart className="w-4 h-4 text-primary" />}
              {step === 1 ? "Physiological Stats" : step === 2 ? "Training Details" : "Health & Availability"}
            </CardTitle>
            <CardDescription className="text-xs">
              {step === 1
                ? "Help us calculate your base metabolic rate and physical metrics."
                : step === 2
                ? "Configure your routine according to your target goal and gear."
                : "Declare your weekly session limits and any physical considerations."}
            </CardDescription>
          </CardHeader>

          <CardContent className="min-h-[220px]">
            <AnimatePresence mode="wait">
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
            </AnimatePresence>
          </CardContent>

          <CardFooter className="flex items-center justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={prevStep}
              disabled={step === 1}
              className="flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Button>

            {step < 3 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-1.5"
              >
                Next
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                className="flex items-center gap-1.5"
              >
                Forge Profile
                <Check className="w-3.5 h-3.5" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
