"use client";

// TypeScript interfaces for the FitForge workout system

export interface WorkoutPlan {
  id: string;
  name: string;              // e.g. "Forge Alpha PPL"
  splitType: string;         // e.g. "Push-Pull-Legs"
  scheduleType: "cycle" | "calendar"; // cycle = D1->D2->D3->repeat
  repeatEnabled: boolean;
  durationWeeks: number;
  startDate: string;         // ISO date when activated
  isActive: boolean;
  createdAt: string;
}

export interface PlanDay {
  id: string;
  planId: string;
  dayCode: string;           // "D1", "D2", "D3"
  title: string;             // "Push Day"
  focus: string;             // "Chest, Shoulders, Triceps"
  orderIndex: number;        // 0, 1, 2
  exercises?: PlanExercise[]; // Joined exercises
}

export interface PlanExercise {
  id: string;
  planDayId: string;
  exerciseName: string;      // "Barbell Bench Press"
  sets: number;
  repTarget: number;         // e.g. 8 (single target)
  repMin: number;            // e.g. 6
  repMax: number;            // e.g. 8
  targetWeight: number | null; // starting weight
  restSeconds: number;
  trackingType: "weight_reps" | "bodyweight_reps" | "time";
  notes: string;
  exerciseOrder: number;
}

export interface WorkoutSession {
  id: string;
  planId: string;
  planDayId: string;
  planDayTitle: string;      // "Push Day"
  scheduledDate: string;     // YYYY-MM-DD
  startedAt: string;         // ISO timestamp
  completedAt: string | null; // ISO timestamp
  status: "in_progress" | "completed" | "skipped";
  moodRating: number | null; // 1-5
  sorenessAreas?: string[];  // e.g. ["chest", "shoulders"]
  durationSeconds?: number;
  notes: string;
  logs?: ExerciseLog[];      // Joined logs
}

export interface ExerciseLog {
  id: string;
  sessionId: string;
  exerciseName: string;
  exerciseOrder: number;
  plannedSets: number;
  plannedReps: number;
  sets?: SetLog[];           // Joined set logs
}

export interface SetLog {
  id: string;
  exerciseLogId: string;
  setNumber: number;
  plannedWeight: number | null;
  actualWeight: number;
  plannedReps: number;
  actualReps: number;
  rpe: number | null;        // 1-10
  completed: boolean;
  note: string;
}

// LocalStorage Keys
const KEYS = {
  PLAN: "fitforge_active_plan",
  DAYS: "fitforge_plan_days",
  EXERCISES: "fitforge_plan_exercises",
  SESSIONS: "fitforge_sessions",
  EXERCISE_LOGS: "fitforge_exercise_logs",
  SET_LOGS: "fitforge_set_logs",
};

// Safe localStorage access wrapper
function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading key ${key} from localStorage:`, error);
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing key ${key} to localStorage:`, error);
  }
}

// ═══════════════════════════════════════════
// PLAN CRUD
// ═══════════════════════════════════════════

export function savePlan(plan: WorkoutPlan, days: PlanDay[], exercises: PlanExercise[]): void {
  // Set all other plans inactive first
  const activePlan = { ...plan, isActive: true, startDate: new Date().toISOString() };
  
  // Save active plan
  setStorageItem(KEYS.PLAN, activePlan);
  
  // Save days and exercises
  setStorageItem(KEYS.DAYS, days);
  setStorageItem(KEYS.EXERCISES, exercises);
}

export function getActivePlan(): { plan: WorkoutPlan; days: PlanDay[]; exercises: PlanExercise[] } | null {
  const plan = getStorageItem<WorkoutPlan | null>(KEYS.PLAN, null);
  if (!plan || !plan.isActive) return null;
  
  const days = getStorageItem<PlanDay[]>(KEYS.DAYS, []);
  const exercises = getStorageItem<PlanExercise[]>(KEYS.EXERCISES, []);
  
  // Filter days and exercises belonging to this plan
  const planDays = days.filter(d => d.planId === plan.id).sort((a, b) => a.orderIndex - b.orderIndex);
  const planExercises = exercises.filter(e => planDays.some(d => d.id === e.planDayId)).sort((a, b) => a.exerciseOrder - b.exerciseOrder);
  
  return { plan, days: planDays, exercises: planExercises };
}

export function deactivatePlan(): void {
  const plan = getStorageItem<WorkoutPlan | null>(KEYS.PLAN, null);
  if (plan) {
    plan.isActive = false;
    setStorageItem(KEYS.PLAN, plan);
  }
}

export function updatePlanExercise(exerciseId: string, updates: Partial<PlanExercise>): void {
  const exercises = getStorageItem<PlanExercise[]>(KEYS.EXERCISES, []);
  const updatedExercises = exercises.map(ex => {
    if (ex.id === exerciseId) {
      return { ...ex, ...updates };
    }
    return ex;
  });
  setStorageItem(KEYS.EXERCISES, updatedExercises);
}

// ═══════════════════════════════════════════
// SCHEDULING SYSTEM (Cyclic logic)
// ═══════════════════════════════════════════

export function getTodayWorkout(): PlanDay | null {
  const active = getActivePlan();
  if (!active || active.days.length === 0) return null;
  
  const { days, exercises } = active;
  
  // Check if there is already an in-progress or completed session for today
  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const sessions = getStorageItem<WorkoutSession[]>(KEYS.SESSIONS, []);
  const todaySession = sessions.find(s => s.scheduledDate === todayStr && s.status !== "skipped");
  
  if (todaySession) {
    const matchedDay = days.find(d => d.id === todaySession.planDayId);
    if (matchedDay) {
      const dayExercises = exercises.filter(e => e.planDayId === matchedDay.id);
      return { ...matchedDay, exercises: dayExercises };
    }
  }
  
  // Cyclic scheduling logic: D1 -> D2 -> D3 -> repeat
  // 1. Get all completed sessions
  const completedSessions = sessions
    .filter(s => s.status === "completed")
    .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime());
  
  let targetIndex = 0;
  
  if (completedSessions.length > 0) {
    const lastSession = completedSessions[completedSessions.length - 1];
    const lastDay = days.find(d => d.id === lastSession.planDayId);
    if (lastDay) {
      // Find what's next in the cycle
      const lastIndex = days.findIndex(d => d.id === lastDay.id);
      targetIndex = (lastIndex + 1) % days.length;
    }
  }
  
  const selectedDay = days[targetIndex];
  const dayExercises = exercises.filter(e => e.planDayId === selectedDay.id);
  
  return { ...selectedDay, exercises: dayExercises };
}

export function getCycleDayNumber(): number {
  const active = getActivePlan();
  if (!active || active.days.length === 0) return 1;
  
  const todayWorkout = getTodayWorkout();
  if (!todayWorkout) return 1;
  
  return todayWorkout.orderIndex + 1;
}

export function getNextWorkoutDay(): PlanDay | null {
  const active = getActivePlan();
  if (!active || active.days.length === 0) return null;
  
  const todayWorkout = getTodayWorkout();
  if (!todayWorkout) return active.days[0];
  
  const nextIndex = (todayWorkout.orderIndex + 1) % active.days.length;
  const nextDay = active.days[nextIndex];
  
  const exercises = getStorageItem<PlanExercise[]>(KEYS.EXERCISES, []);
  const nextExercises = exercises.filter(e => e.planDayId === nextDay.id);
  
  return { ...nextDay, exercises: nextExercises };
}

// ═══════════════════════════════════════════
// SESSION LOGGING CRUD
// ═══════════════════════════════════════════

export function startSession(planDayId: string): WorkoutSession {
  const active = getActivePlan();
  const sessions = getStorageItem<WorkoutSession[]>(KEYS.SESSIONS, []);
  const todayStr = new Date().toISOString().split("T")[0];
  
  // Check if session already exists for today that is in_progress
  const existing = sessions.find(s => s.scheduledDate === todayStr && s.status === "in_progress");
  if (existing) {
    // Return existing with its logs loaded
    return loadSessionFullData(existing);
  }
  
  const dayTitle = active?.days.find(d => d.id === planDayId)?.title || "Workout Session";
  
  const newSession: WorkoutSession = {
    id: `session-${Date.now()}`,
    planId: active?.plan.id || "manual",
    planDayId,
    planDayTitle: dayTitle,
    scheduledDate: todayStr,
    startedAt: new Date().toISOString(),
    completedAt: null,
    status: "in_progress",
    moodRating: null,
    notes: "",
    sorenessAreas: [],
    durationSeconds: 0,
  };
  
  sessions.push(newSession);
  setStorageItem(KEYS.SESSIONS, sessions);
  
  // Create exercise logs for this session based on the plan day exercises
  const exercises = getStorageItem<PlanExercise[]>(KEYS.EXERCISES, []);
  const dayExercises = exercises.filter(e => e.planDayId === planDayId).sort((a, b) => a.exerciseOrder - b.exerciseOrder);
  
  const newExerciseLogs: ExerciseLog[] = [];
  const newSetLogs: SetLog[] = [];
  
  dayExercises.forEach((ex, idx) => {
    const exLogId = `exlog-${Date.now()}-${idx}`;
    const exLog: ExerciseLog = {
      id: exLogId,
      sessionId: newSession.id,
      exerciseName: ex.exerciseName,
      exerciseOrder: ex.exerciseOrder,
      plannedSets: ex.sets,
      plannedReps: ex.repTarget,
    };
    newExerciseLogs.push(exLog);
    
    // Get last performance of this exercise to suggest weight/reps
    const lastPerf = getLastSession(ex.exerciseName);
    
    // Create planned set logs
    for (let s = 1; s <= ex.sets; s++) {
      let suggestedWeight = ex.targetWeight;
      let suggestedReps = ex.repTarget;
      
      // If we have history, use the last logged performance for this set
      if (lastPerf && lastPerf.sets && lastPerf.sets[s - 1]) {
        suggestedWeight = lastPerf.sets[s - 1].actualWeight;
        suggestedReps = lastPerf.sets[s - 1].actualReps;
      } else if (lastPerf && lastPerf.sets && lastPerf.sets.length > 0) {
        // Fallback to the last set's weight/reps
        const lastSet = lastPerf.sets[lastPerf.sets.length - 1];
        suggestedWeight = lastSet.actualWeight;
        suggestedReps = lastSet.actualReps;
      }
      
      // Check if progressive overload analyzer suggests a weight increase
      const progression = analyzeProgression(ex.exerciseName);
      if (progression.recommendation === "increase" && suggestedWeight !== null) {
        suggestedWeight = progression.suggestedWeight;
      }
      
      const setLog: SetLog = {
        id: `setlog-${Date.now()}-${idx}-${s}`,
        exerciseLogId: exLogId,
        setNumber: s,
        plannedWeight: suggestedWeight,
        actualWeight: suggestedWeight || 0,
        plannedReps: suggestedReps,
        actualReps: suggestedReps,
        rpe: null,
        completed: false,
        note: "",
      };
      newSetLogs.push(setLog);
    }
  });
  
  const allExLogs = getStorageItem<ExerciseLog[]>(KEYS.EXERCISE_LOGS, []);
  const allSetLogs = getStorageItem<SetLog[]>(KEYS.SET_LOGS, []);
  
  setStorageItem(KEYS.EXERCISE_LOGS, [...allExLogs, ...newExerciseLogs]);
  setStorageItem(KEYS.SET_LOGS, [...allSetLogs, ...newSetLogs]);
  
  return { ...newSession, logs: newExerciseLogs.map(l => ({ ...l, sets: newSetLogs.filter(s => s.exerciseLogId === l.id) })) };
}

function loadSessionFullData(session: WorkoutSession): WorkoutSession {
  const allExLogs = getStorageItem<ExerciseLog[]>(KEYS.EXERCISE_LOGS, []);
  const allSetLogs = getStorageItem<SetLog[]>(KEYS.SET_LOGS, []);
  
  const exLogs = allExLogs.filter(l => l.sessionId === session.id).sort((a, b) => a.exerciseOrder - b.exerciseOrder);
  const logsWithSets = exLogs.map(l => {
    const sets = allSetLogs.filter(s => s.exerciseLogId === l.id).sort((a, b) => a.setNumber - b.setNumber);
    return { ...l, sets };
  });
  
  return { ...session, logs: logsWithSets };
}

export function saveSetLog(setId: string, updates: Partial<SetLog>): void {
  const allSetLogs = getStorageItem<SetLog[]>(KEYS.SET_LOGS, []);
  const updated = allSetLogs.map(s => {
    if (s.id === setId) {
      return { ...s, ...updates };
    }
    return s;
  });
  setStorageItem(KEYS.SET_LOGS, updated);
}

export function completeSession(
  sessionId: string, 
  data: { moodRating?: number | null; sorenessAreas?: string[]; notes?: string; durationSeconds?: number }
): WorkoutSession {
  const sessions = getStorageItem<WorkoutSession[]>(KEYS.SESSIONS, []);
  let completed: WorkoutSession | null = null;
  
  const updated = sessions.map(s => {
    if (s.id === sessionId) {
      completed = {
        ...s,
        status: "completed" as const,
        completedAt: new Date().toISOString(),
        moodRating: data.moodRating !== undefined ? data.moodRating : s.moodRating,
        sorenessAreas: data.sorenessAreas !== undefined ? data.sorenessAreas : s.sorenessAreas,
        notes: data.notes !== undefined ? data.notes : s.notes,
        durationSeconds: data.durationSeconds !== undefined ? data.durationSeconds : s.durationSeconds,
      };
      return completed;
    }
    return s;
  });
  
  setStorageItem(KEYS.SESSIONS, updated);
  
  if (!completed) {
    throw new Error(`Session with ID ${sessionId} not found`);
  }
  
  // Make sure any uncompleted set is marked as completed or deleted? We keep them as logged
  return loadSessionFullData(completed);
}

export function getSessionsByDate(dateStr: string): WorkoutSession[] {
  const sessions = getStorageItem<WorkoutSession[]>(KEYS.SESSIONS, []);
  const daySessions = sessions.filter(s => s.scheduledDate === dateStr);
  return daySessions.map(loadSessionFullData);
}

export function isTodayCompleted(): boolean {
  const todayStr = new Date().toISOString().split("T")[0];
  const sessions = getStorageItem<WorkoutSession[]>(KEYS.SESSIONS, []);
  return sessions.some(s => s.scheduledDate === todayStr && s.status === "completed");
}

// ═══════════════════════════════════════════
// HISTORY & EXERCISE LEVEL LOGS
// ═══════════════════════════════════════════

export function getWorkoutLogs(limit?: number): WorkoutSession[] {
  const sessions = getStorageItem<WorkoutSession[]>(KEYS.SESSIONS, []);
  const completed = sessions
    .filter(s => s.status === "completed")
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
  
  const sliced = limit ? completed.slice(0, limit) : completed;
  return sliced.map(loadSessionFullData);
}

export function getExerciseHistory(exerciseName: string, limit?: number): { sessionDate: string; sessionId: string; sets: SetLog[] }[] {
  const allExLogs = getStorageItem<ExerciseLog[]>(KEYS.EXERCISE_LOGS, []);
  const allSetLogs = getStorageItem<SetLog[]>(KEYS.SET_LOGS, []);
  const sessions = getStorageItem<WorkoutSession[]>(KEYS.SESSIONS, []);
  
  // Find all logs matching this exercise name (case insensitive match)
  const matchedExLogs = allExLogs.filter(l => l.exerciseName.toLowerCase() === exerciseName.toLowerCase());
  
  const history: { sessionDate: string; sessionId: string; sets: SetLog[] }[] = [];
  
  matchedExLogs.forEach(log => {
    const session = sessions.find(s => s.id === log.sessionId && s.status === "completed");
    if (session) {
      const sets = allSetLogs.filter(s => s.exerciseLogId === log.id && s.completed).sort((a, b) => a.setNumber - b.setNumber);
      if (sets.length > 0) {
        history.push({
          sessionDate: session.completedAt ? session.completedAt.split("T")[0] : session.scheduledDate,
          sessionId: session.id,
          sets,
        });
      }
    }
  });
  
  // Sort from most recent to oldest
  history.sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
  
  return limit ? history.slice(0, limit) : history;
}

export function getLastSession(exerciseName: string): { sessionDate: string; sessionId: string; sets: SetLog[] } | null {
  const history = getExerciseHistory(exerciseName, 1);
  return history.length > 0 ? history[0] : null;
}

// ═══════════════════════════════════════════
// ANALYTICS & MATH
// ═══════════════════════════════════════════

// Epley 1RM estimation formula: weight × (1 + reps/30)
export function calculateE1RM(weight: number, reps: number): number {
  if (reps === 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function getE1RMTrend(exerciseName: string): { date: string; e1rm: number }[] {
  const history = getExerciseHistory(exerciseName);
  
  const trend = history.map(h => {
    // Find the max estimated 1RM from all completed sets in this session
    let maxE1RM = 0;
    h.sets.forEach(set => {
      const e1rm = calculateE1RM(set.actualWeight, set.actualReps);
      if (e1rm > maxE1RM) {
        maxE1RM = e1rm;
      }
    });
    
    return {
      date: h.sessionDate,
      e1rm: Math.round(maxE1RM * 10) / 10,
    };
  });
  
  // Return sorted chronological (oldest to newest) for chart display
  return trend.reverse();
}

export function getVolumeTrend(weeks: number = 8): { weekLabel: string; volume: number }[] {
  const sessions = getWorkoutLogs();
  const volumeByWeek: { [key: string]: number } = {};
  
  // Initialize weeks labels
  const now = new Date();
  const weekLabels: string[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    // e.g. "Wk -3" or "W/C May 18"
    const month = d.toLocaleString("default", { month: "short" });
    const date = d.getDate();
    const label = `${month} ${date}`;
    weekLabels.push(label);
    volumeByWeek[label] = 0;
  }
  
  sessions.forEach(session => {
    if (!session.completedAt || !session.logs) return;
    const sessionDate = new Date(session.completedAt);
    
    // Find which week bucket this session falls into
    const diffMs = now.getTime() - sessionDate.getTime();
    const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
    
    if (diffWeeks >= 0 && diffWeeks < weeks) {
      const labelIdx = weeks - 1 - diffWeeks;
      const weekLabel = weekLabels[labelIdx];
      
      let sessionVolume = 0;
      session.logs.forEach(log => {
        if (!log.sets) return;
        log.sets.forEach(set => {
          if (set.completed) {
            sessionVolume += set.actualWeight * set.actualReps;
          }
        });
      });
      
      if (weekLabel in volumeByWeek) {
        volumeByWeek[weekLabel] += sessionVolume;
      }
    }
  });
  
  return weekLabels.map(label => ({
    weekLabel: label,
    volume: volumeByWeek[label],
  }));
}

export function analyzeProgression(exerciseName: string): { 
  recommendation: "increase" | "maintain" | "deload"; 
  suggestedWeight: number; 
  reason: string; 
} {
  const history = getExerciseHistory(exerciseName, 3);
  
  // 1. Get planning metadata for target reps
  const active = getActivePlan();
  let repTarget = 8; // Default fallback
  let repMax = 8;
  
  if (active) {
    // Find in active plan
    for (const d of active.days) {
      const ex = active.exercises.find(e => e.planDayId === d.id && e.exerciseName.toLowerCase() === exerciseName.toLowerCase());
      if (ex) {
        repTarget = ex.repTarget;
        repMax = ex.repMax || ex.repTarget;
        break;
      }
    }
  }
  
  if (history.length < 1) {
    return {
      recommendation: "maintain",
      suggestedWeight: 0,
      reason: "No history found. Perform your first session to establish a baseline.",
    };
  }
  
  const lastSession = history[0];
  const lastWeight = lastSession.sets.length > 0 ? Math.max(...lastSession.sets.map(s => s.actualWeight)) : 0;
  
  if (history.length < 2) {
    return {
      recommendation: "maintain",
      suggestedWeight: lastWeight,
      reason: "Need at least 2 sessions to analyze progression trends.",
    };
  }
  
  // Analyze last session performance
  const lastSets = lastSession.sets;
  const allSetsCompleted = lastSets.every(s => s.completed);
  const hitRepMaxOnAll = lastSets.every(s => s.actualReps >= repMax);
  const avgRpe = lastSets.reduce((acc, s) => acc + (s.rpe || 8), 0) / lastSets.length;
  
  // Progression trigger 1: Hit repMax on all working sets with average RPE <= 8
  if (allSetsCompleted && hitRepMaxOnAll && avgRpe <= 8.5) {
    return {
      recommendation: "increase",
      suggestedWeight: lastWeight + 2.5,
      reason: `Excellent job! You completed all sets at ${lastWeight}kg hitting the target max reps (${repMax}) with an RPE of ${avgRpe.toFixed(1)}. Ready for progressive overload (+2.5kg).`,
    };
  }
  
  // Progression trigger 2: Did it in the last 2 sessions consistently
  if (history.length >= 2) {
    const prevSession = history[1];
    const prevWeight = Math.max(...prevSession.sets.map(s => s.actualWeight));
    const prevHitRepMax = prevSession.sets.every(s => s.actualReps >= repMax);
    
    if (hitRepMaxOnAll && prevHitRepMax && lastWeight === prevWeight) {
      return {
        recommendation: "increase",
        suggestedWeight: lastWeight + 2.5,
        reason: `Consistent performance! You hit target reps (${repMax}) across your last 2 sessions at ${lastWeight}kg. Time to increase the challenge by +2.5kg.`,
      };
    }
  }
  
  // Deload trigger: 3 sessions of decreasing performance or stalling with very high RPE >= 9.5
  if (history.length >= 3) {
    const prev1 = history[1];
    const prev2 = history[2];
    
    const missRepsLast = lastSets.filter(s => s.actualReps < repTarget).length >= lastSets.length / 2;
    const missRepsPrev1 = prev1.sets.filter(s => s.actualReps < repTarget).length >= prev1.sets.length / 2;
    const missRepsPrev2 = prev2.sets.filter(s => s.actualReps < repTarget).length >= prev2.sets.length / 2;
    
    if (missRepsLast && missRepsPrev1 && missRepsPrev2) {
      const deloadWeight = Math.max(lastWeight - 5, 2.5);
      return {
        recommendation: "deload",
        suggestedWeight: deloadWeight,
        reason: `Stall detected. You have missed your target reps (${repTarget}) on multiple sets for 3 consecutive sessions. We recommend a 10% deload to ${deloadWeight}kg to allow recovery and form focus.`,
      };
    }
  }
  
  return {
    recommendation: "maintain",
    suggestedWeight: lastWeight,
    reason: `Maintain current weight of ${lastWeight}kg. Focus on hitting all sets for ${repMax} reps with good form before increasing.`,
  };
}

export function getStreak(): number {
  const sessions = getStorageItem<WorkoutSession[]>(KEYS.SESSIONS, []);
  const completedDates = sessions
    .filter(s => s.status === "completed")
    .map(s => s.scheduledDate)
    .sort();
  
  if (completedDates.length === 0) return 0;
  
  // Remove duplicate dates
  const uniqueDates = Array.from(new Set(completedDates));
  
  let streak = 0;
  let today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let checkDate = new Date(today);
  
  // Format check date as YYYY-MM-DD
  const formatDate = (d: Date) => d.toISOString().split("T")[0];
  
  // If user completed a workout today
  if (uniqueDates.includes(formatDate(checkDate))) {
    streak++;
  } else {
    // Check if they completed yesterday to keep streak alive
    checkDate.setDate(checkDate.getDate() - 1);
    if (uniqueDates.includes(formatDate(checkDate))) {
      streak++;
    } else {
      return 0; // Streak broken
    }
  }
  
  // Count backward
  while (true) {
    checkDate.setDate(checkDate.getDate() - 1);
    const dateStr = formatDate(checkDate);
    if (uniqueDates.includes(dateStr)) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

export function getAdherence(weeks: number = 4): number {
  const sessions = getStorageItem<WorkoutSession[]>(KEYS.SESSIONS, []);
  const completed = sessions.filter(s => s.status === "completed");
  
  // If there's an active plan, we expect 3 sessions per week or based on active split
  // Let's assume standard split frequency of 4 days a week or count based on days in plan
  const active = getActivePlan();
  const targetPerWeek = active ? Math.max(active.days.length, 3) : 3;
  const targetTotal = targetPerWeek * weeks;
  
  // Count completed sessions in the last N weeks
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - weeks * 7);
  
  const completedInPeriod = completed.filter(s => {
    if (!s.completedAt) return false;
    return new Date(s.completedAt) >= cutoffDate;
  }).length;
  
  const ratio = completedInPeriod / targetTotal;
  return Math.min(Math.round(ratio * 100), 100);
}
