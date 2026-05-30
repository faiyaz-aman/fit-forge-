"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { getActivePlan, savePlan, deactivatePlan, getCycleDayNumber, isTodayCompleted } from "@/lib/workout-store";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Upload,
  FileText,
  FileCode,
  Sparkles,
  Clipboard,
  Trash2,
  Plus,
  ArrowRight,
  RefreshCw,
  Calendar,
  Layers,
  Dumbbell,
  Check,
  Edit2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// High-fidelity standard exercise options for dropdown matches
const standardExercises = [
  "Barbell Bench Press",
  "Dumbbell Incline Bench Press",
  "Barbell Back Squat",
  "Romanian Deadlift",
  "Barbell Deadlift",
  "Weighted Pull-Up",
  "Dumbbell Shoulder Press",
  "Dumbbell Lateral Raise",
  "Incline Dumbbell Bicep Curl",
  "Tricep Overhead Extension",
  "Leg Press",
  "Chest Fly",
  "Lat Pulldown",
  "Seated Cable Row",
  "Leg Curl",
  "Calf Raise",
];

export default function WorkoutPage() {
  const [activePlan, setActivePlan] = useState<any>(null); // Seed active plan if exists
  const [currentCycleDay, setCurrentCycleDay] = useState<number>(1);
  const [todayDone, setTodayDone] = useState<boolean>(false);
  const [uploadState, setUploadState] = useState<"idle" | "parsing" | "preview" | "active">("idle");
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState("");
  const [useTextarea, setUseTextarea] = useState(false);
  const [error, setError] = useState("");

  // Load active plan on mount
  useEffect(() => {
    const active = getActivePlan();
    if (active) {
      const mapped = {
        id: active.plan.id,
        planName: active.plan.name,
        splitType: active.plan.splitType,
        durationWeeks: active.plan.durationWeeks,
        days: active.days.map((day) => {
          const dayExs = active.exercises
            .filter((ex) => ex.planDayId === day.id)
            .sort((a, b) => a.exerciseOrder - b.exerciseOrder);
          return {
            dayNumber: day.orderIndex + 1,
            name: day.title,
            focus: day.focus,
            orderIndex: day.orderIndex,
            exercises: dayExs.map((ex) => ({
              name: ex.exerciseName,
              sets: ex.sets,
              repMin: ex.repMin,
              repMax: ex.repMax,
              rest: ex.restSeconds,
              notes: ex.notes,
            })),
          };
        }),
      };
      setProgramData(mapped);
      setActivePlan(mapped);
      setCurrentCycleDay(getCycleDayNumber());
      setTodayDone(isTodayCompleted());
      setUploadState("active");
    }
  }, []);
  
  // Parsed Program state to review & edit
  const [programData, setProgramData] = useState({
    planName: "Forge Alpha Split",
    splitType: "Push-Pull-Legs (PPL)",
    durationWeeks: 12,
    days: [
      {
        dayNumber: 1,
        name: "Push Day",
        focus: "Chest, Shoulders, Triceps",
        orderIndex: 0,
        exercises: [
          { name: "Barbell Bench Press", sets: 4, repMin: 6, repMax: 8, rest: 90, notes: "Warm up with 2 lighter sets" },
          { name: "Dumbbell Incline Bench Press", sets: 3, repMin: 8, repMax: 10, rest: 90, notes: "Controlled 3s eccentric" },
          { name: "Dumbbell Shoulder Press", sets: 3, repMin: 10, repMax: 12, rest: 90, notes: "Avoid shrugging at lockout" },
          { name: "Tricep Overhead Extension", sets: 3, repMin: 12, repMax: 15, rest: 60, notes: "Keep elbows pinned close" },
        ],
      },
      {
        dayNumber: 2,
        name: "Pull Day",
        focus: "Lats, Upper Back, Biceps",
        orderIndex: 1,
        exercises: [
          { name: "Weighted Pull-Up", sets: 4, repMin: 6, repMax: 8, rest: 120, notes: "Full range dead hang at bottom" },
          { name: "Barbell Bench Press", sets: 3, repMin: 8, repMax: 10, rest: 90, notes: "Tuck elbows, pull to navel" },
          { name: "Dumbbell Lateral Raise", sets: 4, repMin: 12, repMax: 15, rest: 60, notes: "Lead with elbows in scapular plane" },
          { name: "Incline Dumbbell Bicep Curl", sets: 3, repMin: 10, repMax: 12, rest: 60, notes: "Squeeze bicep at peak extension" },
        ],
      },
      {
        dayNumber: 3,
        name: "Legs Day",
        focus: "Quads, Hamstrings, Glutes",
        orderIndex: 2,
        exercises: [
          { name: "Barbell Back Squat", sets: 4, repMin: 6, repMax: 8, rest: 120, notes: "Hit depth parallel or below" },
          { name: "Romanian Deadlift", sets: 3, repMin: 8, repMax: 10, rest: 90, notes: "Hinge at hips, keep spine neutral" },
          { name: "Leg Press", sets: 3, repMin: 10, repMax: 12, rest: 90, notes: "Avoid knee valgus (collapsing inwards)" },
          { name: "Calf Raise", sets: 4, repMin: 12, repMax: 15, rest: 45, notes: "Pause 2s at full stretch bottom" },
        ],
      },
    ],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleParse = async () => {
    if (!selectedFile && !rawText) return;
    setUploadState("parsing");
    setError("");

    try {
      let response;
      if (useTextarea) {
        response = await fetch("/api/ai/parse-plan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: rawText }),
        });
      } else if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        response = await fetch("/api/ai/parse-plan", {
          method: "POST",
          body: formData,
        });
      }

      if (!response || !response.ok) {
        throw new Error("Failed to parse workout plan. The server returned an error.");
      }

      const resData = await response.json();
      if (resData.success && resData.parsed) {
        setProgramData(resData.parsed);
        setUploadState("preview");
      } else {
        throw new Error(resData.error || "Failed to extract workout plan components.");
      }
    } catch (err: any) {
      console.error("Plan parsing failed:", err);
      setError(err.message || "An unexpected error occurred while parsing your routine. Please verify the file/text and try again.");
      setUploadState("idle");
    }
  };

  // Stepper & Review Editing functions
  const handlePlanNameChange = (val: string) => {
    setProgramData((prev) => ({ ...prev, planName: val }));
  };

  const handleSplitTypeChange = (val: string) => {
    setProgramData((prev) => ({ ...prev, splitType: val }));
  };

  const handleDurationChange = (val: number) => {
    setProgramData((prev) => ({ ...prev, durationWeeks: val }));
  };

  const handleExerciseChange = (dayIdx: number, exIdx: number, field: string, value: any) => {
    setProgramData((prev) => {
      const updatedDays = [...prev.days];
      const updatedEx = { ...updatedDays[dayIdx].exercises[exIdx], [field]: value };
      updatedDays[dayIdx].exercises[exIdx] = updatedEx;
      return { ...prev, days: updatedDays };
    });
  };

  const handleDeleteExercise = (dayIdx: number, exIdx: number) => {
    setProgramData((prev) => {
      const updatedDays = [...prev.days];
      updatedDays[dayIdx].exercises.splice(exIdx, 1);
      return { ...prev, days: updatedDays };
    });
  };

  const handleAddExercise = (dayIdx: number) => {
    setProgramData((prev) => {
      const updatedDays = [...prev.days];
      updatedDays[dayIdx].exercises.push({
        name: "Barbell Bench Press",
        sets: 3,
        repMin: 8,
        repMax: 12,
        rest: 90,
        notes: "",
      });
      return { ...prev, days: updatedDays };
    });
  };

  const moveExercise = (dayIdx: number, exIdx: number, direction: "up" | "down") => {
    setProgramData((prev) => {
      const updatedDays = [...prev.days];
      const exercises = [...updatedDays[dayIdx].exercises];
      const targetIdx = direction === "up" ? exIdx - 1 : exIdx + 1;
      
      if (targetIdx < 0 || targetIdx >= exercises.length) return prev;
      
      // Swap
      const temp = exercises[exIdx];
      exercises[exIdx] = exercises[targetIdx];
      exercises[targetIdx] = temp;
      
      updatedDays[dayIdx].exercises = exercises;
      return { ...prev, days: updatedDays };
    });
  };

  const handleConfirmSave = () => {
    // Save to store
    const planId = activePlan?.id || `plan-${Date.now()}`;
    const planEntity = {
      id: planId,
      name: programData.planName,
      splitType: programData.splitType,
      scheduleType: "cycle" as const,
      repeatEnabled: true,
      durationWeeks: programData.durationWeeks,
      startDate: new Date().toISOString(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const dayEntities: any[] = [];
    const exerciseEntities: any[] = [];

    programData.days.forEach((day, dayIdx) => {
      const dayId = `day-${planId}-${dayIdx}`;
      dayEntities.push({
        id: dayId,
        planId: planId,
        dayCode: `D${day.dayNumber}`,
        title: day.name,
        focus: day.focus,
        orderIndex: day.orderIndex,
      });

      day.exercises.forEach((ex, exIdx) => {
        exerciseEntities.push({
          id: `ex-${dayId}-${exIdx}`,
          planDayId: dayId,
          exerciseName: ex.name,
          sets: ex.sets,
          repTarget: ex.repMax,
          repMin: ex.repMin,
          repMax: ex.repMax,
          targetWeight: null,
          restSeconds: ex.rest,
          trackingType: "weight_reps",
          notes: ex.notes,
          exerciseOrder: exIdx,
        });
      });
    });

    savePlan(planEntity, dayEntities, exerciseEntities);

    setActivePlan(programData);
    setUploadState("active");
  };

  const handleReplacePlan = () => {
    deactivatePlan();
    setUploadState("idle");
    setSelectedFile(null);
    setRawText("");
  };

  const handleBuildManually = () => {
    setProgramData({
      planName: "My Custom Plan",
      splitType: "Custom Split",
      durationWeeks: 12,
      days: [
        {
          dayNumber: 1,
          name: "Day 1",
          focus: "Full Body / Custom",
          orderIndex: 0,
          exercises: [
            { name: "Barbell Bench Press", sets: 3, repMin: 8, repMax: 12, rest: 90, notes: "" }
          ]
        }
      ]
    });
    setUploadState("preview");
  };

  const handleAddDay = () => {
    setProgramData((prev) => {
      const nextDayNum = prev.days.length + 1;
      return {
        ...prev,
        days: [
          ...prev.days,
          {
            dayNumber: nextDayNum,
            name: `Day ${nextDayNum}`,
            focus: "Custom Focus",
            orderIndex: nextDayNum - 1,
            exercises: [
              { name: "Barbell Bench Press", sets: 3, repMin: 8, repMax: 12, rest: 90, notes: "" }
            ]
          }
        ]
      };
    });
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {/* STATE 1: UPLOAD PLAN SCREEN */}
        {uploadState === "idle" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Header Description */}
            <div className="flex flex-col space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Plan Setup & Upload
              </h2>
              <p className="text-xs text-muted-foreground">
                Upload your training split PDF, image, or copy-paste text notes. FitForge AI parses and matches them to dynamic instructions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Uploader Left Column */}
              <div className="md:col-span-2 space-y-4">
                <Card className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Upload Workout Document
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Drop files to launch the automatic structural extraction pipeline.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Mode Toggle Button */}
                    <div className="flex flex-wrap gap-3 items-center justify-between">
                      <div className="flex bg-[#0A0A0B] p-1 rounded-lg border border-border/60 w-fit">
                        <button
                          onClick={() => setUseTextarea(false)}
                          className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            !useTextarea
                              ? "bg-primary text-primary-foreground neon-glow"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          File Upload
                        </button>
                        <button
                          onClick={() => setUseTextarea(true)}
                          className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            useTextarea
                              ? "bg-primary text-primary-foreground neon-glow"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Copy-Paste Text
                        </button>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={handleBuildManually}
                        className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider border border-border hover:bg-primary/10 hover:text-primary transition-all flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Build Manually
                      </Button>
                    </div>

                    {!useTextarea ? (
                      /* Drag & Drop File Zone */
                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={triggerFileSelect}
                        className={`h-48 rounded-xl border border-dashed flex flex-col items-center justify-center gap-3 p-6 text-center transition-all duration-200 cursor-pointer select-none ${
                          dragActive
                            ? "border-primary bg-primary/5 neon-glow scale-[1.01]"
                            : "border-border hover:border-primary/50 hover:bg-secondary/20"
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                          <Upload className="w-5 h-5" />
                        </div>
                        {selectedFile ? (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-primary flex items-center gap-1.5 justify-center">
                              <FileText className="w-4 h-4" />
                              {selectedFile.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Tap to replace
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-foreground">
                              Drag and drop your routine file
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              PDF, DOCX, TXT, MD, or Images up to 10MB
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Copy-Paste Text Area */
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Paste Workout Plan Details
                        </label>
                        <textarea
                          placeholder="Example:&#10;Push Day:&#10;- Bench Press: 4 sets of 8 reps (90s rest)&#10;- Shoulder Press: 3 sets of 10 reps&#10;Pull Day:&#10;- Pullups: 4 sets to failure..."
                          value={rawText}
                          onChange={(e) => setRawText(e.target.value)}
                          className="w-full h-48 rounded-xl border border-border bg-[#141416] p-4 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        />
                      </div>
                    )}

                    {error && (
                      <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg flex items-start gap-2">
                        <span className="font-semibold select-none">⚠️ Error:</span>
                        <span>{error}</span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="justify-between border-t border-border/40 py-3">
                    <span className="text-[9px] font-mono text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      Powered by AI Plan Parser (Gemini / GPT-4o)
                    </span>
                    <Button
                      onClick={handleParse}
                      disabled={!selectedFile && !rawText}
                      className="flex items-center gap-2"
                    >
                      Parse Plan
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              {/* Instructions Panel Right Column */}
              <div className="space-y-4">
                <Card className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Parser Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-xs">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-primary" />
                        Complete Day Split
                      </h4>
                      <p className="text-[10px] text-muted-foreground leading-relaxed pl-5">
                        Extracts day number, custom focuses, splits (PPL, Full Body), and duration.
                      </p>
                    </div>

                    <div className="space-y-2 border-t border-border/40 pt-3">
                      <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-primary" />
                        Detailed Sets & Reps
                      </h4>
                      <p className="text-[10px] text-muted-foreground leading-relaxed pl-5">
                        Identifies exact sets, min-max rep ranges, tempo notes, and rest periods per exercise.
                      </p>
                    </div>

                    <div className="space-y-2 border-t border-border/40 pt-3">
                      <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-primary" />
                        Database Matches
                      </h4>
                      <p className="text-[10px] text-muted-foreground leading-relaxed pl-5">
                        Auto-links parsed lifts to our library to feed form cues and looped demonstration media.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        )}

        {/* STATE 2: PARSING LOADER */}
        {uploadState === "parsing" && (
          <motion.div
            key="parsing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-[400px] flex flex-col items-center justify-center text-center space-y-6 select-none"
          >
            {/* Spinning refresh indicator */}
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border border-border border-t-primary animate-spin" />
              <Sparkles className="w-6 h-6 text-primary absolute animate-pulse" />
            </div>

            <div className="space-y-2 max-w-sm">
              <h3 className="text-base font-bold text-foreground uppercase tracking-widest">
                Forging Workout Plan...
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our AI strength coach is reading your document, matching exercise tags, and structuring sets and rest chimes. This will take a moment.
              </p>
            </div>
          </motion.div>
        )}

        {/* STATE 3: SPLIT CONFIRMATION REVIEWER (SIDE-BY-SIDE) */}
        {uploadState === "preview" && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Split Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Confirm AI-Parsed Routine
                </h2>
                <p className="text-xs text-muted-foreground">
                  Review the side-by-side days. Adjust splits, sets, or reorder lifts before saving as your active routine.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={() => setUploadState("idle")} className="border border-border">
                  Cancel
                </Button>
                <Button onClick={handleConfirmSave} className="flex items-center gap-2">
                  Confirm & Save Plan
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Plan Meta Edit Bar */}
            <Card className="border-border bg-card">
              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Program Title
                  </label>
                  <Input value={programData.planName || ""} onChange={(e) => handlePlanNameChange(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Routine Split Type
                  </label>
                  <Input value={programData.splitType || ""} onChange={(e) => handleSplitTypeChange(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Plan Duration (Weeks)
                  </label>
                  <Input
                    type="number"
                    value={programData.durationWeeks ?? ""}
                    onChange={(e) => handleDurationChange(Number(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Days Stepper Side-by-Side Reviewer */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {programData.days.map((day, dayIdx) => (
                <Card key={day.dayNumber} className="border-border bg-[#141416]/50 flex flex-col justify-between h-fit min-h-[450px]">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        DAY {day.dayNumber}
                      </span>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {day.exercises.length} Exercises
                      </span>
                    </div>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider mt-2">
                      {day.name}
                    </CardTitle>
                    <CardDescription className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                      Focus: {day.focus}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 space-y-4 flex-1">
                    <div className="space-y-3.5">
                      {day.exercises.map((ex, exIdx) => (
                        <div
                          key={exIdx}
                          className="p-3 bg-[#141416] rounded-xl border border-border/80 space-y-2.5 relative group/item"
                        >
                          {/* Row 1: Lift Selector and Deletion */}
                          <div className="flex items-center justify-between gap-2">
                            <select
                              value={ex.name || ""}
                              onChange={(e) => handleExerciseChange(dayIdx, exIdx, "name", e.target.value)}
                              className="text-xs font-semibold text-foreground bg-secondary px-2.5 py-1 rounded border border-border max-w-[160px] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            >
                              <option value="" disabled>Select exercise...</option>
                              {standardExercises.map((se) => (
                                <option key={se} value={se}>
                                  {se}
                                </option>
                              ))}
                              {ex.name && !standardExercises.includes(ex.name) && (
                                <option value={ex.name}>{ex.name}</option>
                              )}
                            </select>

                            {/* Move & Delete Handles */}
                            <div className="flex items-center gap-1 opacity-60 group-hover/item:opacity-100 transition-opacity">
                              <button
                                onClick={() => moveExercise(dayIdx, exIdx, "up")}
                                disabled={exIdx === 0}
                                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => moveExercise(dayIdx, exIdx, "down")}
                                disabled={exIdx === day.exercises.length - 1}
                                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteExercise(dayIdx, exIdx)}
                                className="p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Row 2: Metrics Inputs (Sets, Reps, Rests) */}
                          <div className="grid grid-cols-4 gap-2 items-center">
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                                Sets
                              </span>
                              <input
                                type="number"
                                value={(ex.sets as any) === null || (ex.sets as any) === undefined || isNaN(ex.sets as any) || (ex.sets as any) === "" ? "" : ex.sets}
                                onChange={(e) => handleExerciseChange(dayIdx, exIdx, "sets", e.target.value === "" ? "" : Number(e.target.value))}
                                className="w-full text-center text-xs font-mono font-bold bg-secondary py-1 border border-border rounded text-foreground focus:outline-none focus:ring-primary focus:border-primary"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                                Min
                              </span>
                              <input
                                type="number"
                                value={(ex.repMin as any) === null || (ex.repMin as any) === undefined || isNaN(ex.repMin as any) || (ex.repMin as any) === "" ? "" : ex.repMin}
                                onChange={(e) => handleExerciseChange(dayIdx, exIdx, "repMin", e.target.value === "" ? "" : Number(e.target.value))}
                                className="w-full text-center text-xs font-mono font-bold bg-secondary py-1 border border-border rounded text-foreground focus:outline-none focus:ring-primary"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                                Max
                              </span>
                              <input
                                type="number"
                                value={(ex.repMax as any) === null || (ex.repMax as any) === undefined || isNaN(ex.repMax as any) || (ex.repMax as any) === "" ? "" : ex.repMax}
                                onChange={(e) => handleExerciseChange(dayIdx, exIdx, "repMax", e.target.value === "" ? "" : Number(e.target.value))}
                                className="w-full text-center text-xs font-mono font-bold bg-secondary py-1 border border-border rounded text-foreground focus:outline-none focus:ring-primary"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                                Rest (s)
                              </span>
                              <input
                                type="number"
                                value={(ex.rest as any) === null || (ex.rest as any) === undefined || isNaN(ex.rest as any) || (ex.rest as any) === "" ? "" : ex.rest}
                                step={10}
                                onChange={(e) => handleExerciseChange(dayIdx, exIdx, "rest", e.target.value === "" ? "" : Number(e.target.value))}
                                className="w-full text-center text-xs font-mono font-bold bg-secondary py-1 border border-border rounded text-foreground focus:outline-none focus:ring-primary"
                              />
                            </div>
                          </div>

                          {/* Row 3: Tempo / Cue Notes */}
                          <Input
                            placeholder="Add coaching tips or eccentric tempos..."
                            value={ex.notes || ""}
                            onChange={(e) => handleExerciseChange(dayIdx, exIdx, "notes", e.target.value)}
                            className="h-7 text-[10px] px-2 border-border bg-secondary"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0 border-t border-border/40 py-2">
                    <Button
                      variant="ghost"
                      onClick={() => handleAddExercise(dayIdx)}
                      className="w-full flex items-center justify-center gap-1.5 h-8 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/5 border border-dashed border-border"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Exercise
                    </Button>
                  </CardFooter>
                </Card>
              ))}

              <Card
                onClick={handleAddDay}
                className="border-dashed border-2 border-border/60 hover:border-primary/50 hover:bg-secondary/10 flex flex-col items-center justify-center min-h-[450px] cursor-pointer group transition-all"
              >
                <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary mt-2">
                  Add Training Day
                </span>
              </Card>
            </div>
          </motion.div>
        )}

        {/* STATE 4: ACTIVE PLAN INTERFACE */}
        {uploadState === "active" && activePlan && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Header description */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  Active Workout Program
                  <span className="text-xs font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                    Active
                  </span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Your current training split is active. You can review scheduled days, log workouts, or swap the split.
                </p>
              </div>
              <Button onClick={handleReplacePlan} variant="secondary" className="flex items-center gap-1.5 border border-border">
                <RefreshCw className="w-4 h-4" />
                Replace Active Plan
              </Button>
            </div>

            {/* Split Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Card className="border-border bg-card">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Routine Name
                    </p>
                    <h4 className="text-sm font-bold text-foreground mt-0.5 truncate max-w-[150px]">
                      {activePlan.planName}
                    </h4>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Dumbbell className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Split / Days
                    </p>
                    <h4 className="text-sm font-bold text-foreground mt-0.5">
                      {activePlan.days.length} Training Days
                    </h4>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Program Length
                    </p>
                    <h4 className="text-sm font-bold text-foreground mt-0.5">
                      {activePlan.durationWeeks} Weeks
                    </h4>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Split Schedule Outline */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {activePlan.days.map((day: any) => (
                <Card key={day.dayNumber} className={`border-border bg-card h-fit transition-all duration-300 ${day.dayNumber === currentCycleDay ? "ring-2 ring-primary bg-primary/[0.02]" : "opacity-80"}`}>
                  <CardHeader className="pb-3 border-b border-border/40 bg-[#0E0E10]/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                          DAY {day.dayNumber}
                        </span>
                        {day.dayNumber === currentCycleDay && (
                          todayDone ? (
                            <span className="text-[9px] font-bold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                              <Check className="w-3 h-3 text-[#10B981]" />
                              Completed
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-[#00E5FF] bg-[#00E5FF]/10 border border-[#00E5FF]/20 px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">
                              Today's Target
                            </span>
                          )
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                        <Dumbbell className="w-3.5 h-3.5" />
                        {day.exercises.length} Exercises
                      </span>
                    </div>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider mt-2">
                      {day.name}
                    </CardTitle>
                    <CardDescription className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">
                      Focus: {day.focus}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3.5">
                    {day.exercises.map((ex: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-foreground block">
                            {idx + 1}. {ex.name}
                          </span>
                          {ex.notes && (
                            <span className="text-[10px] text-muted-foreground block leading-tight">
                              💡 {ex.notes}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-primary block tabular-nums">
                            {ex.sets} × {ex.repMin}-{ex.repMax}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-mono font-semibold block uppercase tracking-wider">
                            Rest {ex.rest}s
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>

                  {day.dayNumber === currentCycleDay ? (
                    todayDone ? (
                      <CardFooter className="pt-0 border-t border-border/40 py-3 bg-[#0E0E10]/20 justify-end">
                        <Button disabled size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 opacity-100 cursor-not-allowed">
                          <Check className="w-3.5 h-3.5" />
                          Training Done
                        </Button>
                      </CardFooter>
                    ) : (
                      <CardFooter className="pt-0 border-t border-border/40 py-3 bg-[#0E0E10]/20 justify-end">
                        <Link href={`/workout/session-${day.dayNumber}`}>
                          <Button size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 neon-glow">
                            Log Today
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </CardFooter>
                    )
                  ) : (
                    <CardFooter className="pt-0 border-t border-border/40 py-3 bg-[#0E0E10]/10 justify-center">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1">
                        🔒 Locked • Complete previous days first
                      </span>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
