import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redisGet, redisSet } from "@/lib/redis";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "All";
    const searchQuery = searchParams.get("searchQuery") || "";

    // 1. Cache-Aside Pattern: Read all scientific tips from Upstash Redis
    const cacheKey = "scientific_tips:all";
    let tips = await redisGet<any[]>(cacheKey);

    if (!tips) {
      console.log("⚡ [Redis Cache Miss] Fetching scientific tips from Supabase...");
      tips = await prisma.tip.findMany();
      
      // Save in cache with 24-hour TTL (86,400 seconds)
      if (tips && tips.length > 0) {
        await redisSet(cacheKey, tips, 86400);
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
      const supabase = await createClient();
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (user) {
          // Fetch Profile
          const profile = await prisma.profile.findUnique({
            where: { userId: user.id }
          });
          if (profile) {
            userGoal = profile.goal;
            userExperience = profile.experienceLevel;
          }

          // Fetch recent soreness logs (last 3 days)
          const threeDaysAgo = new Date();
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
          const sorenessLogs = await prisma.sorenessLog.findMany({
            where: {
              userId: user.id,
              loggedAt: { gte: threeDaysAgo }
            },
            select: { muscleGroup: true, intensity: true }
          });
          sorenessLogs.forEach(log => {
            if (log.intensity >= 2) {
              soreMuscles.push(log.muscleGroup.toLowerCase());
            }
          });

          // Fetch today's scheduled workout day to extract focused muscle groups!
          const activePlan = await prisma.workoutPlan.findFirst({
            where: { userId: user.id, isActive: true },
            include: { days: { orderBy: { orderIndex: "asc" } } }
          });
          if (activePlan && activePlan.days.length > 0) {
            const completedCount = await prisma.workoutSession.count({
              where: { userId: user.id, status: "COMPLETED" }
            });
            const dayIndex = completedCount % activePlan.days.length;
            const currentDay = activePlan.days[dayIndex];
            if (currentDay && currentDay.focus) {
              todayFocus = currentDay.focus.toLowerCase();
            }
          }
        }
      }
    } catch (authError) {
      // Gracefully fall back to standard daily rotation and evidence-based ranking on auth mismatches or prerender phases
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
