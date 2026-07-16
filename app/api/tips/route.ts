import { NextResponse } from "next/server";
import { redisGet, redisSet } from "@/lib/redis";
import { createClient } from "@/lib/supabase/server";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "All";
    const searchQuery = searchParams.get("searchQuery") || "";

    // 1. Cache-Aside Pattern: Read all scientific tips from Upstash Redis
    const cacheKey = "scientific_tips:all";
    let tips: any[] | null = null;

    try {
      tips = await redisGet<any[]>(cacheKey);
    } catch (redisError) {
      console.warn("⚠️ Redis cache get failed:", redisError);
    }

    const supabase = await createClient();

    if (!tips) {
      console.log("⚡ [Redis Cache Miss] Fetching scientific tips from Supabase...");
      try {
        if (supabase) {
          const { data: dbTips, error: dbError } = await supabase
            .from("Tip")
            .select("*");
          if (dbError) throw dbError;
          tips = dbTips;
        }
        
        // Save in cache with 24-hour TTL (86,400 seconds)
        if (tips && tips.length > 0) {
          try {
            await redisSet(cacheKey, tips, 86400);
          } catch (redisSetError) {
            console.warn("⚠️ Redis cache set failed:", redisSetError);
          }
        }
      } catch (dbError) {
        console.warn("⚠️ Supabase fetch failed, falling back to local file:", dbError);
      }
    }

    // Resilient Fallback: Read from local scientific_tips.json if database/cache is empty or failed
    if (!tips || tips.length === 0) {
      console.log("📂 Database empty or failed. Loading tips from local scientific_tips.json...");
      try {
        const jsonPath = path.join(process.cwd(), "scientific_tips.json");
        if (fs.existsSync(jsonPath)) {
          const rawData = fs.readFileSync(jsonPath, "utf8");
          const parsed = JSON.parse(rawData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            tips = parsed;
            console.log(`✅ Resilient fallback successfully loaded ${tips.length} tips from scientific_tips.json`);
          }
        } else {
          console.error(`❌ scientific_tips.json not found at path: ${jsonPath}`);
        }
      } catch (fileError) {
        console.error("❌ Failed to read or parse local scientific_tips.json:", fileError);
      }
    }

    if (!tips || tips.length === 0) {
      return NextResponse.json([]);
    }

    // 2. Personalized Context Gathering
    let userGoal: string | null = null;
    let userExperience: string | null = null;
    const soreMuscles: string[] = [];
    let todayFocus: string = "";

    try {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (user) {
          // Fetch Profile using Supabase client directly
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("goal, experience_level")
            .eq("id", user.id)
            .maybeSingle();

          if (profileError) throw profileError;

          if (profile) {
            userGoal = profile.goal;
            userExperience = profile.experience_level;
          }

          // Fetch recent soreness logs from completed workout_sessions (last 3 days)
          const { data: recentSessions, error: sessionsError } = await supabase
            .from("workout_sessions")
            .select("soreness_areas, started_at")
            .eq("user_id", user.id);

          if (sessionsError) throw sessionsError;

          if (recentSessions) {
            const threeDaysAgoTime = Date.now() - 3 * 24 * 60 * 60 * 1000;
            recentSessions.forEach((session: any) => {
              if (session.started_at) {
                const sessionTime = new Date(session.started_at).getTime();
                if (sessionTime >= threeDaysAgoTime) {
                  if (session.soreness_areas && Array.isArray(session.soreness_areas)) {
                    session.soreness_areas.forEach((area: string) => {
                      soreMuscles.push(area.toLowerCase());
                    });
                  }
                }
              }
            });
          }

          // Fetch today's scheduled workout day to extract focused muscle groups!
          const { data: activePlan, error: planError } = await supabase
            .from("workout_plans")
            .select("id")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .maybeSingle();

          if (planError) throw planError;

          if (activePlan) {
            const { data: planDays, error: daysError } = await supabase
              .from("plan_days")
              .select("focus, order_index")
              .eq("plan_id", activePlan.id)
              .order("order_index", { ascending: true });

            if (daysError) throw daysError;

            if (planDays && planDays.length > 0) {
              const { count: completedCount, error: countError } = await supabase
                .from("workout_sessions")
                .select("*", { count: "exact", head: true })
                .eq("user_id", user.id)
                .eq("status", "COMPLETED");

              if (countError) throw countError;

              const count = completedCount || 0;
              const dayIndex = count % planDays.length;
              const currentDay = planDays[dayIndex];
              if (currentDay && currentDay.focus) {
                todayFocus = currentDay.focus.toLowerCase();
              }
            }
          }
        }
      }
    } catch (authError) {
      console.warn("⚠️ Graceful fallback triggered during personalization fetch:", authError);
    }

    // 3. Compute Complex Scoring Matrices for Each Card
    // We calculate two scores: relevanceScore (for personalization) and highlightScore (for today's highlight suitability)
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);

    const processedTips = tips.map((tip, index) => {
      let score = 0;
      const cat = tip.category.toLowerCase();
      const tags = (tip.tags || []).map((t: string) => t.toLowerCase());

      // A. Goal Match (+30 points)
      if (userGoal) {
        const goal = userGoal.toUpperCase();
        if (goal === "STRENGTH" && (cat === "strength" || tags.includes("strength") || tags.includes("progressive overload") || tags.includes("rpe") || cat === "program design")) {
          score += 30;
        } else if (goal === "BULK" && (cat === "hypertrophy" || cat === "training science" || tags.includes("hypertrophy") || tags.includes("muscle growth") || cat === "muscle anatomy & function")) {
          score += 30;
        } else if (goal === "CUT" && (cat === "body composition & fat loss" || cat === "nutrition science" || tags.includes("fat loss") || tags.includes("caloric deficit"))) {
          score += 30;
        } else if (goal === "GENERAL_HEALTH" && (cat === "injury prevention" || cat === "recovery & adaptation" || cat === "psychology & habit building" || cat === "supplement education")) {
          score += 30;
        }
      }

      // B. Soreness recovery match (+25 points)
      if (soreMuscles.length > 0 && tip.tags) {
        const hasSoreMatch = soreMuscles.some(muscle => tags.includes(muscle));
        if (hasSoreMatch && (cat === "recovery & adaptation" || tags.includes("recovery") || tags.includes("stretch") || tags.includes("mobility"))) {
          score += 25;
        }
      }

      // C. Experience level match (+20 points)
      if (userExperience) {
        const exp = userExperience.toLowerCase();
        if (tip.tier && tip.tier.toLowerCase() === exp) {
          score += 20;
        }
      }

      // D. Today's Workout Focus Match (+50 points)
      let workoutMatch = false;
      if (todayFocus) {
        // Check if today's focused muscle is in the tip's tags (e.g. Chest, Quads, Back, etc.)
        const focusMuscles = todayFocus.split(",").map(m => m.trim().toLowerCase());
        workoutMatch = focusMuscles.some(muscle => tags.includes(muscle));
        if (workoutMatch) {
          score += 50;
        }
      }

      // E. Calculate Elite Daily Highlight Score
      // Formula: highlightScore = (dailyRotationModifier) + relevanceScore + evidenceLevelMultiplier + readingTimeWeight
      // 1. Daily Rotation Modifier: deterministic shift based on dayOfYear so baseline changes daily
      const rotationIndex = (dayOfYear * 13 + index) % 100; // 0 to 99 range
      
      // 2. Evidence level modifier: prioritize "strong" study-backed evidence for highlights
      const isStrongEvidence = tip.evidenceLevel && tip.evidenceLevel.toLowerCase() === "strong";
      const evidenceBonus = isStrongEvidence ? 40 : 15;

      // 3. Gym-floor Read Time balance: favor high impact, digestible cards for today's digest (2-3 min reads)
      const wordCount = (tip.summary || "").split(/\s+/).length + (tip.howItWorks || "").split(/\s+/).length;
      const readTime = Math.max(1, Math.round(wordCount / 180));
      const readTimeBonus = (readTime >= 2 && readTime <= 3) ? 20 : 5; // Sweet spot is 2-3 mins

      const highlightScore = rotationIndex + score + evidenceBonus + readTimeBonus;

      return {
        ...tip,
        relevanceScore: score,
        highlightScore,
        workoutMatch
      };
    });

    // Determine the single mathematically optimized Highlight Card
    // We sort by highlightScore descending. The #1 card is marked as today's highlight!
    const highlightSorted = [...processedTips].sort((a, b) => b.highlightScore - a.highlightScore);
    const highlightId = highlightSorted[0]?.id;

    const finalTips = processedTips.map(tip => ({
      ...tip,
      isTodayHighlight: tip.id === highlightId
    }));

    // For standard navigation lists, sort by relevanceScore descending
    // This places personalized, workout-relevant cards at the very top of their list!
    finalTips.sort((a, b) => {
      // Keep today's highlight pinned at position 0 if filters are not active
      if (category === "All" && searchQuery === "") {
        if (a.isTodayHighlight) return -1;
        if (b.isTodayHighlight) return 1;
      }
      return b.relevanceScore - a.relevanceScore;
    });

    // 4. In-Memory Category & Search Query Filters
    const filteredTips = finalTips.filter(tip => {
      const matchesCategory = category === "All" || tip.category.toLowerCase() === category.toLowerCase();
      
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === "" || 
        tip.title.toLowerCase().includes(searchLower) ||
        tip.summary.toLowerCase().includes(searchLower) ||
        tip.author.toLowerCase().includes(searchLower) ||
        (tip.tags && tip.tags.some((t: string) => t.toLowerCase().includes(searchLower)));
        
      return matchesCategory && matchesSearch;
    });

    return NextResponse.json(filteredTips);
  } catch (error: any) {
    console.error("❌ GET /api/tips personalized route error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while retrieving scientific library." },
      { status: 500 }
    );
  }
}
