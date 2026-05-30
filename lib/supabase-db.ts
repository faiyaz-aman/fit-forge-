import { createClient } from "./supabase/client";
import { getLocalDateString } from "./utils";

// Get active supabase browser client instance
const getClient = () => {
  try {
    return createClient();
  } catch (e) {
    console.error("Failed to initialize Supabase client:", e);
    return null;
  }
};

// Helper: Check if user is authenticated
export async function getAuthUserId(): Promise<string | null> {
  const supabase = getClient();
  if (!supabase) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch (e) {
    console.error("Error getting auth session:", e);
    return null;
  }
}

// ──────────────────────────────────────────────────────────────
// 1. PROFILES
// ──────────────────────────────────────────────────────────────
export async function syncProfile(profile: any) {
  const supabase = getClient();
  const userId = await getAuthUserId();
  if (!supabase || !userId) return null;

  const payload: any = {
    id: userId,
    name: profile.name,
    age: profile.age,
    sex: profile.sex,
    height_cm: profile.heightCm,
    weight_kg: profile.weightKg || profile.weight,
    experience_level: profile.experienceLevel,
    goal: profile.goal,
    equipment: profile.equipment,
    days_per_week: profile.daysPerWeek,
    session_minutes: profile.sessionMinutes,
    injuries: profile.injuries,
    updated_at: new Date().toISOString(),
  };

  if (profile.targetCalories !== undefined) payload.target_calories = profile.targetCalories;
  if (profile.targetProtein !== undefined) payload.target_protein = profile.targetProtein;
  if (profile.targetCarbs !== undefined) payload.target_carbs = profile.targetCarbs;
  if (profile.targetFat !== undefined) payload.target_fat = profile.targetFat;
  if (profile.targetWater !== undefined) payload.target_water = profile.targetWater;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload)
      .select()
      .single();

    if (error) {
      if (error.code === "42703" || error.message?.includes("column")) {
        console.warn("Target columns do not exist in profiles table. Syncing profile without targets.");
        const fallback = { ...payload };
        delete fallback.target_calories;
        delete fallback.target_protein;
        delete fallback.target_carbs;
        delete fallback.target_fat;
        delete fallback.target_water;

        const { data: fbData, error: fbError } = await supabase
          .from("profiles")
          .upsert(fallback)
          .select()
          .single();
        if (fbError) throw fbError;
        return fbData;
      }
      throw error;
    }
    return data;
  } catch (e) {
    console.error("Error syncing profile:", e);
    return null;
  }
}

export async function getProfile() {
  const supabase = getClient();
  const userId = await getAuthUserId();
  if (!supabase || !userId) return null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      name: data.name,
      age: data.age,
      sex: data.sex,
      heightCm: Number(data.height_cm),
      weightKg: Number(data.weight_kg),
      experienceLevel: data.experience_level,
      goal: data.goal,
      equipment: data.equipment,
      daysPerWeek: data.days_per_week,
      sessionMinutes: data.session_minutes,
      injuries: data.injuries,
      targetCalories: data.target_calories ? Number(data.target_calories) : undefined,
      targetProtein: data.target_protein ? Number(data.target_protein) : undefined,
      targetCarbs: data.target_carbs ? Number(data.target_carbs) : undefined,
      targetFat: data.target_fat ? Number(data.target_fat) : undefined,
      targetWater: data.target_water ? Number(data.target_water) : undefined,
    };
  } catch (e) {
    console.error("Error loading profile:", e);
    return null;
  }
}

// ──────────────────────────────────────────────────────────────
// 2. WORKOUT PLANS
// ──────────────────────────────────────────────────────────────
export async function syncWorkoutPlan(plan: any, days: any[], exercises: any[]) {
  const supabase = getClient();
  const userId = await getAuthUserId();
  if (!supabase || !userId) return false;

  try {
    // 1. If this plan is active, deactivate all other plans first
    if (plan.isActive) {
      await supabase
        .from("workout_plans")
        .update({ is_active: false })
        .eq("user_id", userId);
    }

    // 2. Upsert the plan itself
    const { error: planError } = await supabase
      .from("workout_plans")
      .upsert({
        id: plan.id,
        user_id: userId,
        name: plan.name,
        split_type: plan.splitType,
        schedule_type: plan.scheduleType,
        repeat_enabled: plan.repeatEnabled,
        duration_weeks: plan.durationWeeks,
        start_date: plan.startDate,
        is_active: plan.isActive,
        created_at: plan.createdAt,
      });

    if (planError) throw planError;

    // 3. Upsert days
    if (days.length > 0) {
      const dbDays = days.map(d => ({
        id: d.id,
        plan_id: plan.id,
        day_code: d.dayCode,
        title: d.title,
        focus: d.focus,
        order_index: d.orderIndex,
      }));

      const { error: daysError } = await supabase
        .from("plan_days")
        .upsert(dbDays);

      if (daysError) throw daysError;
    }

    // 4. Upsert exercises
    if (exercises.length > 0) {
      const dbExercises = exercises.map(e => ({
        id: e.id,
        plan_day_id: e.planDayId,
        exercise_name: e.exerciseName,
        sets: e.sets,
        rep_target: e.repTarget,
        rep_min: e.repMin,
        rep_max: e.repMax,
        target_weight: e.targetWeight,
        rest_seconds: e.restSeconds,
        tracking_type: e.trackingType,
        notes: e.notes,
        exercise_order: e.exerciseOrder,
      }));

      const { error: exError } = await supabase
        .from("plan_exercises")
        .upsert(dbExercises);

      if (exError) throw exError;
    }

    return true;
  } catch (e) {
    console.error("Error syncing workout plan:", e);
    return false;
  }
}

export async function getActiveWorkoutPlan() {
  const supabase = getClient();
  const userId = await getAuthUserId();
  if (!supabase || !userId) return null;

  try {
    // 1. Fetch active plan
    const { data: planData, error: planError } = await supabase
      .from("workout_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (planError) throw planError;
    if (!planData) return null;

    // 2. Fetch days
    const { data: daysData, error: daysError } = await supabase
      .from("plan_days")
      .select("*")
      .eq("plan_id", planData.id)
      .order("order_index", { ascending: true });

    if (daysError) throw daysError;

    const dayIds = (daysData || []).map((d: any) => d.id);

    // 3. Fetch exercises
    let exercisesData: any[] = [];
    if (dayIds.length > 0) {
      const { data: exData, error: exError } = await supabase
        .from("plan_exercises")
        .select("*")
        .in("plan_day_id", dayIds)
        .order("exercise_order", { ascending: true });

      if (exError) throw exError;
      exercisesData = exData || [];
    }

    return {
      plan: {
        id: planData.id,
        name: planData.name,
        splitType: planData.split_type,
        scheduleType: planData.schedule_type,
        repeatEnabled: planData.repeat_enabled,
        durationWeeks: planData.duration_weeks,
        startDate: planData.start_date,
        isActive: planData.is_active,
        createdAt: planData.created_at,
      },
      days: (daysData || []).map((d: any) => ({
        id: d.id,
        planId: d.plan_id,
        dayCode: d.day_code,
        title: d.title,
        focus: d.focus,
        orderIndex: d.order_index,
      })),
      exercises: exercisesData.map((e: any) => ({
        id: e.id,
        planDayId: e.plan_day_id,
        exerciseName: e.exercise_name,
        sets: e.sets,
        repTarget: e.rep_target,
        repMin: e.rep_min,
        repMax: e.rep_max,
        targetWeight: e.target_weight ? Number(e.target_weight) : null,
        restSeconds: e.rest_seconds,
        trackingType: e.trackingType || e.tracking_type,
        notes: e.notes || "",
        exerciseOrder: e.exercise_order,
      })),
    };
  } catch (e) {
    console.error("Error loading active workout plan:", e);
    return null;
  }
}

export async function deactivateActivePlan(planId: string) {
  const supabase = getClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("workout_plans")
      .update({ is_active: false })
      .eq("id", planId);

    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Error deactivating plan:", e);
    return false;
  }
}

// ──────────────────────────────────────────────────────────────
// 3. WORKOUT SESSIONS & LOGS
// ──────────────────────────────────────────────────────────────
export async function syncWorkoutSession(session: any) {
  const supabase = getClient();
  const userId = await getAuthUserId();
  if (!supabase || !userId) return false;

  try {
    // 1. Upsert the main workout session
    const { error: sessionError } = await supabase
      .from("workout_sessions")
      .upsert({
        id: session.id,
        user_id: userId,
        plan_id: session.planId,
        plan_day_id: session.planDayId,
        plan_day_title: session.planDayTitle,
        scheduled_date: session.scheduledDate,
        started_at: session.startedAt,
        completed_at: session.completedAt,
        status: session.status,
        mood_rating: session.moodRating,
        soreness_areas: session.sorenessAreas || [],
        duration_seconds: session.durationSeconds || 0,
        notes: session.notes || "",
      });

    if (sessionError) throw sessionError;

    // 2. Sync session logs (exercises and sets) if they exist
    if (session.logs && session.logs.length > 0) {
      for (const log of session.logs) {
        // Upsert Exercise Log
        const { error: logError } = await supabase
          .from("exercise_logs")
          .upsert({
            id: log.id,
            session_id: session.id,
            exercise_name: log.exerciseName,
            exercise_order: log.exerciseOrder,
            planned_sets: log.plannedSets,
            planned_reps: log.plannedReps,
          });

        if (logError) throw logError;

        // Upsert Sets belonging to this exercise log
        if (log.sets && log.sets.length > 0) {
          const dbSets = log.sets.map((s: any) => ({
            id: s.id,
            exercise_log_id: log.id,
            set_number: s.setNumber,
            planned_weight: s.plannedWeight,
            actual_weight: s.actualWeight,
            planned_reps: s.plannedReps,
            actual_reps: s.actualReps,
            rpe: s.rpe,
            completed: s.completed,
            note: s.note || "",
          }));

          const { error: setsError } = await supabase
            .from("set_logs")
            .upsert(dbSets);

          if (setsError) throw setsError;
        }
      }
    }

    return true;
  } catch (e) {
    console.error("Error syncing workout session:", e);
    return false;
  }
}

export async function syncSetLogDirect(setLog: any) {
  const supabase = getClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("set_logs")
      .upsert({
        id: setLog.id,
        exercise_log_id: setLog.exerciseLogId,
        set_number: setLog.setNumber,
        planned_weight: setLog.plannedWeight,
        actual_weight: setLog.actualWeight,
        planned_reps: setLog.plannedReps,
        actual_reps: setLog.actualReps,
        rpe: setLog.rpe,
        completed: setLog.completed,
        note: setLog.note || "",
      });

    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Error syncing set log directly:", e);
    return false;
  }
}

export async function getAllWorkoutSessions() {
  const supabase = getClient();
  const userId = await getAuthUserId();
  if (!supabase || !userId) return [];

  try {
    // 1. Fetch sessions
    const { data: sessionsData, error: sessionsError } = await supabase
      .from("workout_sessions")
      .select("*")
      .eq("user_id", userId);

    if (sessionsError) throw sessionsError;
    if (!sessionsData || sessionsData.length === 0) return [];

    const sessionIds = sessionsData.map((s: any) => s.id);

    // 2. Fetch all exercise logs for these sessions
    const { data: logsData, error: logsError } = await supabase
      .from("exercise_logs")
      .select("*")
      .in("session_id", sessionIds);

    if (logsError) throw logsError;

    const logIds = (logsData || []).map((l: any) => l.id);

    // 3. Fetch all set logs
    let setsData: any[] = [];
    if (logIds.length > 0) {
      const { data: sData, error: sError } = await supabase
        .from("set_logs")
        .select("*")
        .in("exercise_log_id", logIds);

      if (sError) throw sError;
      setsData = sData || [];
    }

    // 4. Assemble the sessions
    const sessions = sessionsData.map((s: any) => {
      const sessionLogs = (logsData || [])
        .filter((l: any) => l.session_id === s.id)
        .sort((a: any, b: any) => a.exercise_order - b.exercise_order)
        .map((l: any) => {
          const sets = setsData
            .filter((set: any) => set.exercise_log_id === l.id)
            .sort((a: any, b: any) => a.set_number - b.set_number)
            .map((set: any) => ({
              id: set.id,
              exerciseLogId: set.exercise_log_id,
              setNumber: set.set_number,
              plannedWeight: set.planned_weight ? Number(set.planned_weight) : null,
              actualWeight: Number(set.actual_weight),
              plannedReps: set.planned_reps,
              actualReps: set.actual_reps,
              rpe: set.rpe,
              completed: set.completed,
              note: set.note || "",
            }));

          return {
            id: l.id,
            sessionId: l.session_id,
            exerciseName: l.exercise_name,
            exerciseOrder: l.exercise_order,
            plannedSets: l.planned_sets,
            plannedReps: l.planned_reps,
            sets,
          };
        });

      return {
        id: s.id,
        planId: s.plan_id,
        planDayId: s.plan_day_id,
        planDayTitle: s.plan_day_title,
        scheduledDate: s.scheduled_date,
        startedAt: s.started_at,
        completedAt: s.completed_at,
        status: s.status,
        moodRating: s.mood_rating,
        sorenessAreas: s.soreness_areas || [],
        durationSeconds: s.duration_seconds || 0,
        notes: s.notes || "",
        logs: sessionLogs,
      };
    });

    return sessions;
  } catch (e) {
    console.error("Error loading sessions from cloud:", e);
    return [];
  }
}

// ──────────────────────────────────────────────────────────────
// 4. NUTRITION LOGS
// ──────────────────────────────────────────────────────────────
export async function syncNutritionLog(meal: any) {
  const supabase = getClient();
  const userId = await getAuthUserId();
  if (!supabase || !userId) return false;

  try {
    const { error } = await supabase
      .from("nutrition_logs")
      .upsert({
        id: meal.id,
        user_id: userId,
        meal_name: `${meal.mealType || "breakfast"}::${meal.foodName || meal.name}`,
        calories: Math.round(Number(meal.calories) || 0),
        protein: Math.round(Number(meal.protein) || 0),
        carbs: Math.round(Number(meal.carbs) || 0),
        fat: Math.round(Number(meal.fat) || 0),
        logged_at: meal.loggedAt || getLocalDateString(),
      });

    if (error) throw error;
    return true;
  } catch (e: any) {
    console.error("Error syncing nutrition:", e?.message || e?.details || e?.hint || e);
    return false;
  }
}

export async function deleteNutritionLogCloud(mealId: string) {
  const supabase = getClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("nutrition_logs")
      .delete()
      .eq("id", mealId);

    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Error deleting nutrition from cloud:", e);
    return false;
  }
}

export async function getNutritionLogsCloud() {
  const supabase = getClient();
  const userId = await getAuthUserId();
  if (!supabase || !userId) return [];

  try {
    const { data, error } = await supabase
      .from("nutrition_logs")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    if (!data) return [];

    return data.map((m: any) => {
      const parts = m.meal_name.split("::");
      const mealType = parts.length > 1 ? parts[0] : "breakfast";
      const foodName = parts.length > 1 ? parts.slice(1).join("::") : m.meal_name;
      return {
        id: m.id,
        mealType,
        foodName,
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat,
        loggedAt: m.logged_at,
      };
    });
  } catch (e) {
    console.error("Error loading nutrition from cloud:", e);
    return [];
  }
}

// ──────────────────────────────────────────────────────────────
// 5. WATER LOGS
// ──────────────────────────────────────────────────────────────
export async function syncWaterLogs(waterLogs: any[]) {
  const supabase = getClient();
  const userId = await getAuthUserId();
  if (!supabase || !userId || waterLogs.length === 0) return false;

  try {
    const dbLogs = waterLogs.map((l: any) => ({
      id: l.id,
      user_id: userId,
      amount_ml: l.amountMl,
      logged_at: l.loggedAt,
    }));

    const { error } = await supabase
      .from("water_logs")
      .upsert(dbLogs);

    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Error syncing water logs:", e);
    return false;
  }
}

export async function getWaterLogsCloud() {
  const supabase = getClient();
  const userId = await getAuthUserId();
  if (!supabase || !userId) return [];

  try {
    const { data, error } = await supabase
      .from("water_logs")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    if (!data) return [];

    return data.map((w: any) => ({
      id: w.id,
      amountMl: w.amount_ml,
      loggedAt: w.logged_at,
    }));
  } catch (e) {
    console.error("Error loading water from cloud:", e);
    return [];
  }
}

// ──────────────────────────────────────────────────────────────
// 6. WEIGHT LOGS
// ──────────────────────────────────────────────────────────────
export async function syncWeightLogs(weightLogs: any[]) {
  const supabase = getClient();
  const userId = await getAuthUserId();
  if (!supabase || !userId || weightLogs.length === 0) return false;

  try {
    const dbLogs = weightLogs.map((l: any) => ({
      id: l.id,
      user_id: userId,
      weight: l.weight,
      body_fat: l.bodyFat,
      logged_at: l.loggedAt,
    }));

    const { error } = await supabase
      .from("weight_logs")
      .upsert(dbLogs);

    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Error syncing weight logs:", e);
    return false;
  }
}

export async function getWeightLogsCloud() {
  const supabase = getClient();
  const userId = await getAuthUserId();
  if (!supabase || !userId) return [];

  try {
    const { data, error } = await supabase
      .from("weight_logs")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    if (!data) return [];

    return data.map((w: any) => ({
      id: w.id,
      weight: Number(w.weight),
      bodyFat: w.body_fat ? Number(w.body_fat) : null,
      loggedAt: w.logged_at,
    }));
  } catch (e) {
    console.error("Error loading weight from cloud:", e);
    return [];
  }
}

// ──────────────────────────────────────────────────────────────
// 7. GENERAL DATA HYDRATION (Incognito/New Device support)
// ──────────────────────────────────────────────────────────────
export async function hydrateLocalDataFromCloud() {
  const userId = await getAuthUserId();
  if (!userId) return false;

  try {
    console.log("🔄 Starting full cloud data hydration into localStorage...");

    // 1. Profile
    const profile = await getProfile();
    if (profile) {
      localStorage.setItem("fitforge-profile", JSON.stringify(profile));
    }

    // 2. Active Plan
    const activePlanObj = await getActiveWorkoutPlan();
    if (activePlanObj) {
      const { plan, days, exercises } = activePlanObj;
      localStorage.setItem("fitforge_active_plan", JSON.stringify(plan));
      localStorage.setItem("fitforge_plan_days", JSON.stringify(days));
      localStorage.setItem("fitforge_plan_exercises", JSON.stringify(exercises));
    }

    // 3. Workout Sessions
    const sessions = await getAllWorkoutSessions();
    if (sessions.length > 0) {
      // Decompose into lists for localStorage keys
      const planSessions: any[] = [];
      const exLogs: any[] = [];
      const setLogs: any[] = [];

      sessions.forEach((s: any) => {
        const { logs, ...sessionWithoutLogs } = s;
        planSessions.push(sessionWithoutLogs);

        if (logs) {
          logs.forEach((l: any) => {
            const { sets, ...logWithoutSets } = l;
            exLogs.push(logWithoutSets);

            if (sets) {
              setLogs.push(...sets);
            }
          });
        }
      });

      localStorage.setItem("fitforge_sessions", JSON.stringify(planSessions));
      localStorage.setItem("fitforge_exercise_logs", JSON.stringify(exLogs));
      localStorage.setItem("fitforge_set_logs", JSON.stringify(setLogs));
    }

    // 4. Nutrition
    const meals = await getNutritionLogsCloud();
    if (meals.length > 0) {
      localStorage.setItem("fitforge_meals", JSON.stringify(meals));
    }

    // 5. Water
    const water = await getWaterLogsCloud();
    if (water.length > 0) {
      localStorage.setItem("fitforge_water_logs", JSON.stringify(water));
    }

    // 6. Weight
    const weight = await getWeightLogsCloud();
    if (weight.length > 0) {
      localStorage.setItem("fitforge_weight_logs", JSON.stringify(weight));
      // Also sync current measurements weight if exist
      const storedMeas = localStorage.getItem("fitforge-measurements");
      const latestMeas = weight.sort((a: any, b: any) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())[0];
      
      let measurementsObj = storedMeas ? JSON.parse(storedMeas) : {};
      if (latestMeas) {
        measurementsObj.weight = latestMeas.weight;
        localStorage.setItem("fitforge-measurements", JSON.stringify(measurementsObj));
      }
    }

    console.log("✅ Cloud data hydration completed successfully!");
    return true;
  } catch (e) {
    console.error("Error during cloud data hydration:", e);
    return false;
  }
}
