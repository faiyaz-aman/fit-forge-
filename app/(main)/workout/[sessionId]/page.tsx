"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  getActivePlan,
  getTodayWorkout,
  startSession,
  saveSetLog,
  completeSession,
  getLastSession,
  analyzeProgression
} from "@/lib/workout-store";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Dumbbell,
  Play,
  CheckCircle2,
  ChevronLeft,
  Timer,
  Plus,
  Minus,
  Check,
  Video,
  Award,
  Zap,
  RotateCcw,
  BookOpen,
  Info,
  Flame,
  AlertTriangle,
  Smile,
  Meh,
  Frown,
  Share2,
  ArrowRight,
  Mic,
  MicOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// High-fidelity active workout details seed
const mockActiveWorkout = {
  dayName: "Push Day",
  focus: "Chest, Shoulders, Triceps",
  exercises: [
    {
      id: "ex-1",
      name: "Barbell Bench Press",
      primaryMuscle: "Chest",
      instructions: "Keep shoulder blades retracted, press bar in a slight J-curve.",
      restSeconds: 90,
      prevSession: "80kg × 8 @ RPE 8",
      targetCue: "Aim for 82.5kg × 8 reps today",
      demoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-training-with-barbell-in-gym-43093-large.mp4",
      cues: [
        "Retract shoulder blades back and down.",
        "Brace core and drive feet into floor.",
        "Bar touches mid-chest (nipple line).",
        "Tuck elbows slightly (45 degree angle).",
        "Push the floor away at lockout."
      ],
      mistakes: [
        "Bouncing the bar off your sternum.",
        "Flaring elbows wide (90 degrees).",
        "Lifting hips off the bench."
      ],
      sets: [
        { id: "set-1-1", setNumber: 1, type: "WARMUP", weight: 60, reps: 10, rpe: 6, completed: false },
        { id: "set-1-2", setNumber: 2, type: "WORKING", weight: 82.5, reps: 8, rpe: 8, completed: false },
        { id: "set-1-3", setNumber: 3, type: "WORKING", weight: 82.5, reps: 7, rpe: 9, completed: false },
        { id: "set-1-4", setNumber: 4, type: "FAILURE", weight: 82.5, reps: 6, rpe: 10, completed: false },
      ],
    },
    {
      id: "ex-2",
      name: "Dumbbell Incline Bench Press",
      primaryMuscle: "Chest",
      instructions: "Lower slowly (3 sec down), elbows tucked in scapular plane.",
      restSeconds: 90,
      prevSession: "30kg × 10 @ RPE 7",
      targetCue: "Control the stretch at the bottom",
      demoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-incline-dumbbell-bench-press-43097-large.mp4",
      cues: [
        "Set bench angle to 30 degrees.",
        "Lower dumbbells to upper chest slowly.",
        "Keep dumbbells moving in a vertical path.",
        "Squeeze chest hard at the peak extension.",
        "Keep spine neutral, no excessive arching."
      ],
      mistakes: [
        "Setting incline bench angle too high.",
        "Allowing dumbbells to drift over face.",
        "Dropping weights too fast on descent."
      ],
      sets: [
        { id: "set-2-1", setNumber: 1, type: "WORKING", weight: 32, reps: 10, rpe: 8, completed: false },
        { id: "set-2-2", setNumber: 2, type: "WORKING", weight: 32, reps: 9, rpe: 9, completed: false },
        { id: "set-2-3", setNumber: 3, type: "WORKING", weight: 30, reps: 10, rpe: 9, completed: false },
      ],
    },
    {
      id: "ex-3",
      name: "Dumbbell Lateral Raise",
      primaryMuscle: "Shoulders",
      instructions: "Raise arms wide in a 30-deg forward angle, avoid shrugging traps.",
      restSeconds: 60,
      prevSession: "12.5kg × 15 @ RPE 8",
      targetCue: "Lead with your elbows",
      demoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-training-shoulders-with-dumbbell-43098-large.mp4",
      cues: [
        "Stand tall with chest flared forward.",
        "Lead the raise with your elbows.",
        "Stop at shoulder level (palms down).",
        "Control weight slowly on eccentric.",
        "Tilt dumbbells slightly down at the top."
      ],
      mistakes: [
        "Using swing momentum (cheating reps).",
        "Raising dumbbells higher than elbows.",
        "Shrugging traps to pull weights up."
      ],
      sets: [
        { id: "set-3-1", setNumber: 1, type: "WORKING", weight: 14, reps: 15, rpe: 8, completed: false },
        { id: "set-3-2", setNumber: 2, type: "WORKING", weight: 14, reps: 13, rpe: 9, completed: false },
        { id: "set-3-3", setNumber: 3, type: "DROP", weight: 10, reps: 15, rpe: 10, completed: false },
      ],
    },
  ],
};

export default function WorkoutSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  
  const [storeSessionId, setStoreSessionId] = useState<string | null>(null);
  const [workout, setWorkout] = useState<any>({ dayName: "", focus: "", exercises: [] });
  const [duration, setDuration] = useState(0);
  const [activeExerciseIdx, setActiveExerciseIdx] = useState(0);
  const [sessionTab, setSessionTab] = useState<"log" | "cues">("log");
  
  // Celebration Screen states
  const [showCelebration, setShowCelebration] = useState(false);
  const [moodLog, setMoodLog] = useState<number>(3); // 1-5
  const [soreMuscles, setSoreMuscles] = useState<string[]>([]);
  const [shared, setShared] = useState(false);

  // Timer States
  const [showTimer, setShowTimer] = useState(false);
  const [timerDuration, setTimerDuration] = useState(90);
  const [timerTimeLeft, setTimerTimeLeft] = useState(90);
  const [timerActive, setTimerActive] = useState(false);

  // Voice Logging System States
  const [isListening, setIsListening] = useState(false);
  const [voiceLogResult, setVoiceLogResult] = useState("");
  const [voiceError, setVoiceError] = useState("");

  // Load session from store
  useEffect(() => {
    const active = getActivePlan();
    if (!active) {
      router.push("/workout");
      return;
    }

    let targetDayId = "";
    if (sessionId === "today") {
      const todayW = getTodayWorkout();
      if (todayW) {
        targetDayId = todayW.id;
      } else {
        targetDayId = active.days[0].id;
      }
    } else if (sessionId.startsWith("session-")) {
      const dayNum = parseInt(sessionId.split("-")[1], 10);
      const dayIdx = dayNum - 1;
      if (active.days[dayIdx]) {
        targetDayId = active.days[dayIdx].id;
      } else {
        targetDayId = active.days[0].id;
      }
    } else {
      targetDayId = active.days[0].id;
    }

    if (targetDayId) {
      const curSession = startSession(targetDayId);
      
      // Map store session logs into the layout structure
      const mappedExercises = curSession.logs!.map((log, idx) => {
        // Find corresponding plan exercise if exists to get rest & notes
        const planEx = active.exercises.find(e => e.planDayId === targetDayId && e.exerciseName.toLowerCase() === log.exerciseName.toLowerCase());
        
        const lastSessionRecord = getLastSession(log.exerciseName);
        let prevSessionStr = "No previous performance";
        if (lastSessionRecord && lastSessionRecord.sets && lastSessionRecord.sets.length > 0) {
          const firstSet = lastSessionRecord.sets[0];
          prevSessionStr = `${firstSet.actualWeight}kg × ${firstSet.actualReps} @ RPE ${firstSet.rpe || 8}`;
        }
        
        const progression = analyzeProgression(log.exerciseName);
        let targetCueStr = "Focus on form and progression";
        if (progression.recommendation === "increase") {
          targetCueStr = `💥 +2.5kg Progressive Overload recommended: Aim for ${progression.suggestedWeight}kg!`;
        } else if (progression.recommendation === "deload") {
          targetCueStr = `📉 Deload: Focus on recovery at ${progression.suggestedWeight}kg.`;
        }

        // Muscle-specific cues & mistakes (seed defaults)
        const lowerName = log.exerciseName.toLowerCase();
        let primaryMuscle = "Full Body";
        let cues = ["Control the eccentric phase.", "Brace your core.", "Maintain alignment."];
        let mistakes = ["Using momentum.", "Partial range of motion."];
        
        if (lowerName.includes("bench") || lowerName.includes("fly") || lowerName.includes("pushup")) {
          primaryMuscle = "Chest";
          cues = ["Retract shoulder blades back and down.", "Brace core and drive feet into floor.", "Bar touches mid-chest (nipple line).", "Tuck elbows slightly (45 degree angle)."];
          mistakes = ["Bouncing the bar off your chest.", "Flaring elbows wide (90 degrees).", "Lifting hips off the bench."];
        } else if (lowerName.includes("pull") || lowerName.includes("row") || lowerName.includes("chin")) {
          primaryMuscle = "Lats";
          cues = ["Pull with your elbows, not hands.", "Squeeze shoulder blades together at peak.", "Control lowering (3s eccentric).", "Full stretch at bottom."];
          mistakes = ["Using body swing momentum.", "Shrugging shoulders upward."];
        } else if (lowerName.includes("squat") || lowerName.includes("press") || lowerName.includes("extension")) {
          primaryMuscle = "Quads";
          cues = ["Brace core deeply before descent.", "Push knees out inline with toes.", "Drive feet hard through mid-foot.", "Keep chest upright."];
          mistakes = ["Knees caving inwards (valgus).", "Heels rising off the floor."];
        } else if (lowerName.includes("deadlift") || lowerName.includes("curl") || lowerName.includes("hinge")) {
          primaryMuscle = "Hamstrings";
          cues = ["Hinge at hips, soft knee bend.", "Keep spine neutral throughout.", "Bar stays close to legs.", "Squeeze glutes at lockout."];
          mistakes = ["Rounding lower spine.", "Squatting the weight up."];
        } else if (lowerName.includes("shoulder") || lowerName.includes("press") || lowerName.includes("lateral")) {
          primaryMuscle = "Shoulders";
          cues = ["Keep core braced, avoid arching spine.", "Lower weight under control to ear level.", "Press straight overhead.", "Shrug traps slightly at lockout."];
          mistakes = ["Excessive spinal extension (arching back).", "Bouncing weight at bottom."];
        }

        return {
          id: log.id,
          name: log.exerciseName,
          primaryMuscle,
          instructions: planEx?.notes || "Keep clean form and track performance.",
          restSeconds: planEx?.restSeconds || 90,
          prevSession: prevSessionStr,
          targetCue: targetCueStr,
          demoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-training-with-barbell-in-gym-43093-large.mp4",
          cues,
          mistakes,
          sets: log.sets!.map(set => ({
            id: set.id,
            setNumber: set.setNumber,
            type: "WORKING",
            weight: set.actualWeight,
            reps: set.actualReps,
            rpe: set.rpe || 8,
            completed: set.completed,
          })),
        };
      });

      const dayTitle = active.days.find(d => d.id === targetDayId)?.title || "Workout Session";
      const dayFocus = active.days.find(d => d.id === targetDayId)?.focus || "Strength Split";

      setWorkout({
        dayName: dayTitle,
        focus: dayFocus,
        exercises: mappedExercises,
      });

      setStoreSessionId(curSession.id);
    }
  }, [sessionId]);

  const startVoiceLogging = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("Voice recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceLogResult("");
      setVoiceError("");
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setVoiceError("Voice command failed. Try again.");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setVoiceLogResult(speechToText);
      parseVoiceCommand(speechToText);
    };

    recognition.start();
  };

  const parseVoiceCommand = (text: string) => {
    const cleanText = text.toLowerCase();
    
    let setNum = 1;
    let weight = 0;
    let reps = 0;
    let rpe = 8;

    // 1. Extract Set Number
    const setMatch = cleanText.match(/(?:set|step)\s*(\d+|one|two|three|four|five|1|2|3|4|5)/);
    if (setMatch) {
      const setStr = setMatch[1];
      if (setStr === "one" || setStr === "1") setNum = 1;
      else if (setStr === "two" || setStr === "2") setNum = 2;
      else if (setStr === "three" || setStr === "3") setNum = 3;
      else if (setStr === "four" || setStr === "4") setNum = 4;
      else if (setStr === "five" || setStr === "5") setNum = 5;
      else setNum = parseInt(setStr) || 1;
    }

    // 2. Extract Weight (kg or lbs)
    const weightMatch = cleanText.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilos|kilograms|lbs|pounds|kilo)/);
    if (weightMatch) {
      weight = parseFloat(weightMatch[1]);
    } else {
      const numMatches = cleanText.match(/\b(\d+(?:\.\d+)?)\b/g);
      if (numMatches && numMatches.length > 0) {
        weight = parseFloat(numMatches[0]);
      }
    }

    // 3. Extract Reps
    const repsMatch = cleanText.match(/(\d+)\s*(?:reps|repetitions|rep|wrapped)/);
    if (repsMatch) {
      reps = parseInt(repsMatch[1]);
    } else {
      const numMatches = cleanText.match(/\b(\d+)\b/g);
      if (numMatches && numMatches.length > 1) {
        reps = parseInt(numMatches[1]);
      }
    }

    // 4. Extract RPE
    const rpeMatch = cleanText.match(/rpe\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten|1|2|3|4|5|6|7|8|9|10)/);
    if (rpeMatch) {
      const rpeStr = rpeMatch[1];
      if (rpeStr === "one" || rpeStr === "1") rpe = 1;
      else if (rpeStr === "two" || rpeStr === "2") rpe = 2;
      else if (rpeStr === "three" || rpeStr === "3") rpe = 3;
      else if (rpeStr === "four" || rpeStr === "4") rpe = 4;
      else if (rpeStr === "five" || rpeStr === "5") rpe = 5;
      else if (rpeStr === "six" || rpeStr === "6") rpe = 6;
      else if (rpeStr === "seven" || rpeStr === "7") rpe = 7;
      else if (rpeStr === "eight" || rpeStr === "8") rpe = 8;
      else if (rpeStr === "nine" || rpeStr === "9") rpe = 9;
      else if (rpeStr === "ten" || rpeStr === "10") rpe = 10;
      else rpe = parseInt(rpeStr) || 8;
    }

    if (weight > 0 || reps > 0) {
      const setIdx = activeExercise.sets.findIndex((s: any) => s.setNumber === setNum);
      if (setIdx !== -1) {
        if (weight > 0) handleSetMetricChange(activeExerciseIdx, setIdx, "weight", weight);
        if (reps > 0) handleSetMetricChange(activeExerciseIdx, setIdx, "reps", reps);
        if (rpe > 0) handleSetMetricChange(activeExerciseIdx, setIdx, "rpe", rpe);
        
        handleToggleComplete(activeExerciseIdx, setIdx);

        if (window.speechSynthesis) {
          const speakText = `Logged ${weight} kilos for ${reps} reps at RPE ${rpe} on Set ${setNum}!`;
          const utterance = new SpeechSynthesisUtterance(speakText);
          utterance.rate = 1.05;
          window.speechSynthesis.speak(utterance);
        }
      } else {
        setVoiceError(`Set ${setNum} not found.`);
      }
    } else {
      setVoiceError("Could not parse. Try: 'Log set 1, 80 kilos for 8 reps RPE 9'");
    }
  };

  // Auto-increment duration stopwatch
  useEffect(() => {
    if (showCelebration) return;
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [showCelebration]);

  // Countdown timer logic
  useEffect(() => {
    let interval: any = null;
    if (timerActive && timerTimeLeft > 0) {
      interval = setInterval(() => {
        setTimerTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timerTimeLeft === 0) {
      setTimerActive(false);
      // Optional sound chime or haptic vibration
    }
    return () => clearInterval(interval);
  }, [timerActive, timerTimeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSetMetricChange = (exIdx: number, setIdx: number, field: string, value: any) => {
    setWorkout((prev: any) => {
      const updatedEx = [...prev.exercises];
      const updatedSets = [...updatedEx[exIdx].sets];
      updatedSets[setIdx] = { ...updatedSets[setIdx], [field]: value };
      updatedEx[exIdx] = { ...updatedEx[exIdx], sets: updatedSets };

      // Real-time persistence: save to localStorage immediately
      const currentSet = updatedSets[setIdx];
      saveSetLog(currentSet.id, {
        actualWeight: field === "weight" ? Number(value) : currentSet.weight,
        actualReps: field === "reps" ? Number(value) : currentSet.reps,
        rpe: field === "rpe" ? (value === "" ? null : Number(value)) : currentSet.rpe,
        completed: field === "completed" ? Boolean(value) : currentSet.completed,
      });

      return { ...prev, exercises: updatedEx };
    });
  };

  const handleToggleComplete = (exIdx: number, setIdx: number) => {
    const currentSet = workout.exercises[exIdx].sets[setIdx];
    const newStatus = !currentSet.completed;

    handleSetMetricChange(exIdx, setIdx, "completed", newStatus);

    if (newStatus) {
      const restTime = workout.exercises[exIdx].restSeconds;
      setTimerDuration(restTime);
      setTimerTimeLeft(restTime);
      setShowTimer(true);
      setTimerActive(true);
    }
  };

  const handleQuickWeightAdjust = (exIdx: number, setIdx: number, amount: number) => {
    const currentSet = workout.exercises[exIdx].sets[setIdx];
    const newWeight = Math.max(0, currentSet.weight + amount);
    handleSetMetricChange(exIdx, setIdx, "weight", newWeight);
  };

  const handleQuickRepAdjust = (exIdx: number, setIdx: number, amount: number) => {
    const currentSet = workout.exercises[exIdx].sets[setIdx];
    const newReps = Math.max(0, currentSet.reps + amount);
    handleSetMetricChange(exIdx, setIdx, "reps", newReps);
  };

  const addExtraRest = (amount: number) => {
    setTimerTimeLeft((prev) => prev + amount);
    setTimerDuration((prev) => prev + amount);
  };

  const skipRest = () => {
    setTimerActive(false);
    setShowTimer(false);
  };

  const handleFinishWorkout = () => {
    setShowCelebration(true);
  };

  const toggleSoreMuscle = (muscle: string) => {
    setSoreMuscles((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
    );
  };

  const activeExercise = workout.exercises[activeExerciseIdx];

  // Loading safety fallback
  if (!workout || !workout.exercises || workout.exercises.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0B] text-foreground p-6 select-none">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-border border-t-primary animate-spin" />
          <Dumbbell className="w-4 h-4 text-primary absolute animate-pulse" />
        </div>
        <p className="text-xs text-muted-foreground mt-4 uppercase tracking-widest font-bold">
          Assembling Gym Session...
        </p>
      </div>
    );
  }

  // Calculate session summary stats
  const totalVolume = workout.exercises.reduce((sum: number, ex: any) => {
    return (
      sum +
      ex.sets.reduce((setSum: number, s: any) => {
        return setSum + (s.completed ? s.weight * s.reps : 0);
      }, 0)
    );
  }, 0);

  const completedSetsCount = workout.exercises.reduce((sum: number, ex: any) => {
    return sum + ex.sets.filter((s: any) => s.completed).length;
  }, 0);

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-32">
      <AnimatePresence mode="wait">
        {!showCelebration ? (
          /* WORKOUT PLAYING SCREEN */
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Top Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-4 select-none">
              <Link href="/home">
                <Button variant="ghost" className="h-9 px-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                  <ChevronLeft className="w-4 h-4" />
                  Quit Workout
                </Button>
              </Link>
              <div className="text-center">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary">
                  {workout.dayName}
                </h2>
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5 tabular-nums">
                  ⏱️ {formatTime(duration)}
                </p>
              </div>
              <Button onClick={handleFinishWorkout} size="sm" className="h-9 text-xs px-4">
                Finish Lift
              </Button>
            </div>

            {/* Exercises Tabs Horizontal Stepper */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 select-none">
              {workout.exercises.map((ex: any, idx: number) => {
                const completedSets = ex.sets.filter((s: any) => s.completed).length;
                const isSelected = activeExerciseIdx === idx;

                return (
                  <button
                    key={ex.id}
                    onClick={() => {
                      setActiveExerciseIdx(idx);
                      setSessionTab("log");
                    }}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/5 text-primary neon-glow"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest block opacity-75">
                      EXERCISE {idx + 1}
                    </span>
                    <span className="text-xs font-semibold block mt-0.5 truncate max-w-[120px]">
                      {ex.name}
                    </span>
                    <span className="text-[9px] font-mono font-bold mt-1 block opacity-60">
                      {completedSets} / {ex.sets.length} SETS
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Segment Selector for Sets Logging or AI Form cues */}
            <div className="flex bg-[#0A0A0B] p-1 rounded-xl border border-border/80 w-full select-none">
              <button
                onClick={() => setSessionTab("log")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  sessionTab === "log"
                    ? "bg-primary text-primary-foreground neon-glow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                Log Sets
              </button>
              <button
                onClick={() => setSessionTab("cues")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  sessionTab === "cues"
                    ? "bg-primary text-primary-foreground neon-glow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Form & Muscles
              </button>
            </div>

            <AnimatePresence mode="wait">
              {sessionTab === "log" ? (
                /* TAB 1: ACTIVE SETS LOGGING SHEET */
                <motion.div
                  key="logTab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <Card className="border-border bg-card">
                    <CardHeader className="pb-3 border-b border-border/40">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {activeExercise.primaryMuscle} Focus
                        </span>
                        <span className="text-[9px] font-mono text-muted-foreground">
                          🔄 Rest: {activeExercise.restSeconds}s
                        </span>
                      </div>
                      <CardTitle className="text-base font-bold text-foreground mt-2 uppercase tracking-wide">
                        {activeExercise.name}
                      </CardTitle>
                      <CardDescription className="text-[11px] leading-relaxed italic text-muted-foreground mt-1">
                        💡 {activeExercise.instructions}
                      </CardDescription>
                    </CardHeader>

                    {/* AI Overload Helper banner */}
                    <div className="px-5 py-2.5 bg-primary/[0.02] border-b border-border/40 flex items-center justify-between text-xs select-none">
                      <div className="flex items-center gap-1.5 font-semibold text-primary">
                        <Zap className="w-3.5 h-3.5 text-primary" />
                        <span>AI OVERLOAD TARGET:</span>
                      </div>
                      <span className="font-semibold text-foreground italic">{activeExercise.targetCue}</span>
                    </div>

                    <CardContent className="p-4 space-y-3">
                      {activeExercise.sets.map((set: any, setIdx: number) => (
                        <div
                          key={set.id}
                          className={`p-3 rounded-xl border transition-all duration-200 relative flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                            set.completed
                              ? "border-primary/30 bg-primary/[0.02] opacity-80"
                              : "border-border bg-[#141416]/40"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-foreground bg-[#141416] w-6 h-6 rounded-full flex items-center justify-center border border-border">
                                {set.setNumber}
                              </span>
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                                {set.type}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground italic md:hidden">
                              Prev: {activeExercise.prevSession}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 justify-between md:justify-start">
                            <div className="flex flex-col space-y-0.5">
                              <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
                                Weight (kg)
                              </span>
                              <div className="flex items-center gap-1 bg-[#0A0A0B] border border-border rounded-lg p-0.5">
                                <button
                                  onClick={() => handleQuickWeightAdjust(activeExerciseIdx, setIdx, -2.5)}
                                  disabled={set.completed}
                                  className="w-6 h-6 rounded bg-[#141416] hover:text-primary disabled:opacity-40 flex items-center justify-center cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={set.weight}
                                  disabled={set.completed}
                                  onChange={(e) =>
                                    handleSetMetricChange(activeExerciseIdx, setIdx, "weight", Number(e.target.value))
                                  }
                                  className="w-12 text-center text-xs font-mono font-bold bg-transparent border-0 text-foreground focus:outline-none focus:ring-0"
                                />
                                <button
                                  onClick={() => handleQuickWeightAdjust(activeExerciseIdx, setIdx, 2.5)}
                                  disabled={set.completed}
                                  className="w-6 h-6 rounded bg-[#141416] hover:text-primary disabled:opacity-40 flex items-center justify-center cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-col space-y-0.5">
                              <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
                                Reps
                              </span>
                              <div className="flex items-center gap-1 bg-[#0A0A0B] border border-border rounded-lg p-0.5">
                                <button
                                  onClick={() => handleQuickRepAdjust(activeExerciseIdx, setIdx, -1)}
                                  disabled={set.completed}
                                  className="w-6 h-6 rounded bg-[#141416] hover:text-primary disabled:opacity-40 flex items-center justify-center cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input
                                  type="number"
                                  value={set.reps}
                                  disabled={set.completed}
                                  onChange={(e) =>
                                    handleSetMetricChange(activeExerciseIdx, setIdx, "reps", Number(e.target.value))
                                  }
                                  className="w-10 text-center text-xs font-mono font-bold bg-transparent border-0 text-foreground focus:outline-none focus:ring-0"
                                />
                                <button
                                  onClick={() => handleQuickRepAdjust(activeExerciseIdx, setIdx, 1)}
                                  disabled={set.completed}
                                  className="w-6 h-6 rounded bg-[#141416] hover:text-primary disabled:opacity-40 flex items-center justify-center cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="w-full md:w-32 flex flex-col space-y-0.5">
                            <Slider
                              disabled={set.completed}
                              min={1}
                              max={10}
                              label="RPE (Intensity)"
                              value={set.rpe || 8}
                              onChange={(val) => handleSetMetricChange(activeExerciseIdx, setIdx, "rpe", val)}
                            />
                          </div>

                          <div className="flex items-center justify-end gap-3 mt-1 md:mt-0">
                            <span className="text-[10px] text-muted-foreground italic hidden md:block">
                              Prev: {activeExercise.prevSession}
                            </span>
                            <button
                              onClick={() => handleToggleComplete(activeExerciseIdx, setIdx)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                                set.completed
                                  ? "bg-primary text-primary-foreground neon-glow scale-95"
                                  : "border border-border bg-[#0A0A0B] text-muted-foreground hover:border-primary hover:text-primary"
                              }`}
                            >
                              {set.completed ? <Check className="w-4 h-4" /> : <Play className="w-3.5 h-3.5 fill-muted-foreground/30" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                /* TAB 2: COACH FORM CUES & DYNAMIC MUSCLE DIAGRAMS */
                <motion.div
                  key="cuesTab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Demo Looping Visualizer */}
                  <Card className="border-border bg-card overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-primary" />
                        Form Visualizer
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 bg-black relative flex items-center justify-center h-48 select-none">
                      <video
                        src={activeExercise.demoUrl}
                        loop
                        muted
                        autoPlay
                        className="w-full h-full object-cover opacity-70"
                      />
                      <span className="absolute bottom-2.5 right-3 text-[9px] font-mono font-semibold text-foreground bg-black/60 px-2 py-0.5 rounded border border-border">
                        Looped Demonstration
                      </span>
                    </CardContent>
                  </Card>

                  {/* Form cues & Common Mistakes Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Form Cues */}
                    <Card className="border-border bg-card h-fit">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold tracking-wider text-primary uppercase flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          5 Form Cues
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-xs pb-4">
                        {activeExercise.cues.map((cue: any, idx: number) => (
                          <div key={idx} className="flex gap-2 text-muted-foreground">
                            <span className="font-mono text-primary font-bold">{idx + 1}.</span>
                            <span>{cue}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Common Mistakes */}
                    <Card className="border-border bg-card h-fit border-destructive/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold tracking-wider text-destructive uppercase flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Mistakes to Avoid
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-xs pb-4">
                        {activeExercise.mistakes.map((mistake: any, idx: number) => (
                          <div key={idx} className="flex gap-2 text-muted-foreground">
                            <span className="text-destructive font-bold">•</span>
                            <span>{mistake}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Dynamic Muscle Silhouette Highlight */}
                  <Card className="border-border bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        Muscles Targeted
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
                      {/* CSS-generated Body Anatomical Silhouette Diagram */}
                      <div className="relative w-28 h-56 bg-secondary/20 rounded-2xl flex flex-col items-center justify-between p-4 border border-border select-none overflow-hidden">
                        {/* Head */}
                        <div className="w-6 h-6 rounded-full bg-border" />
                        {/* Upper Torso */}
                        <div className="w-14 h-16 rounded-xl bg-border relative flex items-center justify-center">
                          {/* Chest Muscle Highlight */}
                          {activeExercise.primaryMuscle === "Chest" && (
                            <motion.div
                              animate={{ opacity: [0.3, 0.8, 0.3] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className="absolute inset-x-2 top-2 h-6 bg-primary rounded-md neon-glow"
                            />
                          )}
                          {/* Lat Muscle Highlight */}
                          {activeExercise.primaryMuscle === "Lats" && (
                            <motion.div
                              animate={{ opacity: [0.3, 0.8, 0.3] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className="absolute inset-y-2 -inset-x-1 w-16 bg-primary/70 rounded-lg neon-glow"
                            />
                          )}
                        </div>
                        {/* Arms */}
                        <div className="flex justify-between w-20 absolute top-12">
                          <div className={`w-3.5 h-16 rounded-full bg-border relative`}>
                            {activeExercise.primaryMuscle === "Shoulders" && (
                              <motion.div
                                animate={{ opacity: [0.3, 0.8, 0.3] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute top-0 w-full h-5 bg-primary rounded-full neon-glow"
                              />
                            )}
                          </div>
                          <div className={`w-3.5 h-16 rounded-full bg-border relative`}>
                            {activeExercise.primaryMuscle === "Shoulders" && (
                              <motion.div
                                animate={{ opacity: [0.3, 0.8, 0.3] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute top-0 w-full h-5 bg-primary rounded-full neon-glow"
                              />
                            )}
                          </div>
                        </div>
                        {/* Lower Torso/Hips */}
                        <div className="w-12 h-10 rounded-b-md bg-border" />
                        {/* Legs */}
                        <div className="flex gap-2 w-12 h-20">
                          <div className="flex-1 rounded-b-xl bg-border relative overflow-hidden">
                            {activeExercise.primaryMuscle === "Quads" && (
                              <motion.div
                                animate={{ opacity: [0.3, 0.8, 0.3] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute top-0 inset-x-0 h-12 bg-primary neon-glow"
                              />
                            )}
                          </div>
                          <div className="flex-1 rounded-b-xl bg-border relative overflow-hidden">
                            {activeExercise.primaryMuscle === "Quads" && (
                              <motion.div
                                animate={{ opacity: [0.3, 0.8, 0.3] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute top-0 inset-x-0 h-12 bg-primary neon-glow"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-primary tracking-widest uppercase bg-primary/10 px-3 py-1 rounded-full">
                        Primary Target: {activeExercise.primaryMuscle}
                      </span>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* WORKOUT COMPLETION CELEBRATION SCREEN */
          <motion.div
            key="celebration"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6 text-center select-none"
          >
            {/* PR Fanfare Badge header */}
            <div className="inline-flex w-16 h-16 rounded-full bg-primary/10 border border-primary/20 items-center justify-center text-primary neon-glow mb-2 animate-bounce">
              <Award className="w-8 h-8 text-primary" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold uppercase tracking-tight text-foreground">
                Workout <span className="text-primary">Completed!</span>
              </h2>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Excellent performance! You hit your planned overload goals. Let's record your recovery.
              </p>
            </div>

            {/* Strava Summary Share Card Grid */}
            <Card className="border-border bg-card overflow-hidden max-w-sm mx-auto text-left relative">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/5 blur-2xl" />
              <CardHeader className="pb-3 border-b border-border/40 bg-[#0E0E10]/40">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center font-bold text-primary-foreground text-xs">
                    F
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase">
                    FITFORGE SUMMARY
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-5 grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">
                    TOTAL VOLUME
                  </span>
                  <span className="text-lg font-mono font-extrabold text-primary block tabular-nums">
                    +{totalVolume} kg
                  </span>
                </div>
                <div className="space-y-1 border-x border-border/60">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">
                    TIME ELAPSED
                  </span>
                  <span className="text-lg font-mono font-extrabold text-foreground block tabular-nums">
                    {formatTime(duration)}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">
                    LIFTS LOGGED
                  </span>
                  <span className="text-lg font-mono font-extrabold text-foreground block tabular-nums">
                    {completedSetsCount} sets
                  </span>
                </div>
              </CardContent>
              <CardFooter className="py-2 border-t border-border/40 text-[9px] font-mono text-muted-foreground justify-between mt-0 bg-[#0E0E10]/20">
                <span>Push Day Session</span>
                <span className="text-primary font-bold">5-DAY STREAK ACTIVE</span>
              </CardFooter>
            </Card>

            {/* Quick Share buttons */}
            <div className="flex justify-center">
              <Button
                onClick={() => setShared(true)}
                variant="secondary"
                size="sm"
                className="flex items-center gap-1.5 border border-border h-8 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                <Share2 className="w-3.5 h-3.5" />
                {shared ? "Link Copied!" : "Share Workout Card"}
              </Button>
            </div>

            {/* Onboard Recovery Logger (Mood + Soreness) */}
            <div className="max-w-md mx-auto space-y-6 pt-4 text-left border-t border-border/40">
              {/* Mood emojis */}
              <div className="space-y-2 text-center">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  How did this session feel?
                </label>
                <div className="flex justify-center gap-4 pt-1">
                  {[
                    { val: 1, label: "Felt Heavy", icon: Frown },
                    { val: 3, label: "Standard", icon: Meh },
                    { val: 5, label: "Felt Strong", icon: Smile },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSel = moodLog === item.val;

                    return (
                      <button
                        key={item.val}
                        onClick={() => setMoodLog(item.val)}
                        className={`flex flex-col items-center gap-1.5 p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isSel
                            ? "border-primary bg-primary/5 text-primary neon-glow"
                            : "border-border bg-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-[9px] font-semibold uppercase tracking-wider">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Soreness Body Map Selector */}
              <div className="space-y-3">
                <div className="text-center">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Mark Sore Muscle Groups
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {["Chest", "Shoulders", "Triceps", "Lats", "Upper Back", "Biceps", "Quads", "Hamstrings"].map(
                    (muscle) => {
                      const isSore = soreMuscles.includes(muscle);

                      return (
                        <button
                          key={muscle}
                          onClick={() => toggleSoreMuscle(muscle)}
                          className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                            isSore
                              ? "border-destructive bg-destructive/5 text-destructive font-bold"
                              : "border-border bg-[#141416]/50 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {muscle}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </div>

            {/* Dashboard Redirect action */}
            <div className="pt-6 max-w-sm mx-auto">
              <Button 
                onClick={() => {
                  if (storeSessionId) {
                    completeSession(storeSessionId, {
                      moodRating: moodLog,
                      sorenessAreas: soreMuscles,
                      notes: "Logged session via gym interface.",
                      durationSeconds: duration
                    });
                  }
                  router.push("/home");
                }} 
                className="w-full flex items-center justify-center gap-2"
              >
                Return to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POPUP CIRCULAR REST TIMER MODAL */}
      <AnimatePresence>
        {showTimer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0A0A0B]/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card border border-border rounded-2xl w-full max-w-xs p-6 flex flex-col items-center justify-center text-center space-y-6 shadow-2xl"
            >
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary">
                  SET COMPLETE
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Resting for {activeExercise.name}
                </p>
              </div>

              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="64"
                    stroke="var(--border)"
                    strokeWidth="4"
                    fill="transparent"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="64"
                    stroke="var(--primary)"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={402}
                    strokeDashoffset={402 - (402 * timerTimeLeft) / timerDuration}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-mono font-bold text-foreground tabular-nums">
                    {formatTime(timerTimeLeft)}
                  </span>
                  <span className="text-[8px] text-muted-foreground font-mono font-semibold block uppercase tracking-widest mt-0.5">
                    Remaining
                  </span>
                </div>
              </div>

              <div className="flex gap-2 w-full">
                <Button onClick={() => addExtraRest(30)} variant="secondary" className="flex-1 text-xs h-9 border border-border">
                  +30 sec
                </Button>
                <Button onClick={skipRest} className="flex-1 text-xs h-9">
                  Skip Rest
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING ACTION VOICE MICROPHONE BUTTON */}
      {!showCelebration && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2.5">
          <AnimatePresence>
            {(isListening || voiceLogResult || voiceError) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="bg-card border border-border p-3.5 rounded-2xl shadow-2xl max-w-[240px] text-[10px] space-y-1.5 select-none"
              >
                {isListening && (
                  <div className="flex items-center gap-1.5 text-primary font-bold">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                    <span>LISTENING ACTIVE...</span>
                  </div>
                )}
                {voiceLogResult && (
                  <div className="space-y-0.5">
                    <span className="font-bold text-muted-foreground uppercase tracking-widest block">Heard:</span>
                    <span className="font-semibold text-foreground italic">"{voiceLogResult}"</span>
                  </div>
                )}
                {voiceError && (
                  <span className="text-destructive font-bold uppercase tracking-widest block">
                    ⚠️ {voiceError}
                  </span>
                )}
                <span className="text-[8px] text-muted-foreground block leading-tight font-medium">
                  Try: "Log set 1, 82.5 kilos, 8 reps, RPE 8"
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            onClick={startVoiceLogging}
            className={`w-12 h-12 rounded-full p-0 flex items-center justify-center shadow-2xl transition-all cursor-pointer ${
              isListening
                ? "bg-destructive hover:bg-destructive text-destructive-foreground animate-pulse"
                : "bg-primary hover:bg-primary text-primary-foreground hover:scale-105"
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 animate-pulse" />}
          </Button>
        </div>
      )}
    </div>
  );
}
