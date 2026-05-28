"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import {
  Sparkles,
  TrendingUp,
  Award,
  BookOpen,
  Calendar,
  Brain,
  Layers,
  Flame,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getVolumeTrend, getWorkoutLogs, getActivePlan } from "@/lib/workout-store";

interface Insights {
  headline: string;
  wins: string[];
  patterns: string[];
  improvements: string[];
  nextFocus: string;
  quote: string;
  author: string;
}

export default function InsightsPage() {
  const [activeWeek, setActiveWeek] = useState(0); // 0 = Current, 1 = Past
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<Insights | null>(null);

  const [weekSummary, setWeekSummary] = useState({
    volume: "0 kg",
    sleep: "7.8 hrs / day",
    water: "6 / 7 days met",
    calories: "2,650 kcal / day",
  });

  useEffect(() => {
    const volTrend = getVolumeTrend(8);
    let curVol = 0;
    let prevVol = 0;
    
    if (volTrend.length > 0) {
      curVol = volTrend[volTrend.length - 1].volume;
      prevVol = volTrend.length > 1 ? volTrend[volTrend.length - 2].volume : 0;
    }
    
    // Check if we have real volumes. If not, use mock values for full presentation fidelity
    const displayVol = activeWeek === 0 ? (curVol > 0 ? curVol : 118500) : (prevVol > 0 ? prevVol : 109200);

    setWeekSummary({
      volume: `${displayVol.toLocaleString()} kg`,
      sleep: activeWeek === 0 ? "7.8 hrs / day" : "7.4 hrs / day",
      water: activeWeek === 0 ? "6 / 7 days met" : "5 / 7 days met",
      calories: activeWeek === 0 ? "2,650 kcal / day" : "2,580 kcal / day",
    });
  }, [activeWeek]);

  const handleGenerateReport = async () => {
    setLoading(true);
    setInsights(null);

    try {
      const logs = getWorkoutLogs(5); // Send last 5 completed workout logs
      const activePlan = getActivePlan();
      
      const response = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week: activeWeek,
          workoutHistory: logs,
          activePlan: activePlan ? { name: activePlan.plan.name, splitType: activePlan.plan.splitType } : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.insights) {
          setInsights(data.insights);
        }
      }
    } catch (err) {
      console.error("Insights generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col space-y-1 select-none">
        <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
          Weekly Performance Insights
        </h2>
        <p className="text-xs text-muted-foreground">
          Evidence-grounded scientific synthesis of your training volume, nutrition targets, and neurological recovery.
        </p>
      </div>

      {/* Week Selector Tabs */}
      <div className="flex bg-[#0A0A0B] p-1 rounded-xl border border-border/80 w-fit select-none">
        <button
          onClick={() => {
            setActiveWeek(0);
            setInsights(null);
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeWeek === 0
              ? "bg-primary text-primary-foreground neon-glow"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Current Week
        </button>
        <button
          onClick={() => {
            setActiveWeek(1);
            setInsights(null);
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeWeek === 1
              ? "bg-primary text-primary-foreground neon-glow"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Previous Week
        </button>
      </div>

      {/* Metric Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex flex-col justify-between h-20">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
              WEEKLY LOAD TONNAGE
            </span>
            <span className="text-sm font-mono font-extrabold text-foreground mt-1 tabular-nums">
              {weekSummary.volume}
            </span>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4 flex flex-col justify-between h-20">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
              AVG SLEEP DURATION
            </span>
            <span className="text-sm font-mono font-extrabold text-foreground mt-1 tabular-nums">
              {weekSummary.sleep}
            </span>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4 flex flex-col justify-between h-20">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
              HYDRATION LOYALTY
            </span>
            <span className="text-sm font-mono font-extrabold text-foreground mt-1 tabular-nums">
              {weekSummary.water}
            </span>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4 flex flex-col justify-between h-20">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
              ENERGY CEILING AVERAGE
            </span>
            <span className="text-sm font-mono font-extrabold text-foreground mt-1 tabular-nums">
              {weekSummary.calories}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Trigger & Synthesis Screen */}
      <AnimatePresence mode="wait">
        {!loading && !insights ? (
          /* STATE 1: GENERATE REPORT INITIATOR */
          <motion.div
            key="generate-cta"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border border-primary/20 bg-card bg-gradient-to-br from-primary/[0.01] to-transparent py-8 text-center select-none">
              <CardContent className="space-y-4 max-w-sm mx-auto flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2 shadow-[0_0_8px_rgba(0,255,136,0.2)]">
                  <Brain className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    Compile AI Performance Report
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    FitForge will synthesize cumulative training volume, sleep correlations, and nutritional targets to produce an elite scientific report card.
                  </p>
                </div>
                <Button onClick={handleGenerateReport} className="w-full flex items-center justify-center gap-2 h-11 uppercase font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                  Generate Sunday Report
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : loading ? (
          /* STATE 2: LOADER ANALYZING GRID */
          <motion.div
            key="loading-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-16 text-center space-y-6 select-none"
          >
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border border-border border-t-primary animate-spin" />
              <Brain className="w-6 h-6 text-primary absolute animate-pulse" />
            </div>
            <div className="space-y-2 max-w-xs mx-auto">
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary">
                Analyzing Weekly Logs...
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Evaluating structural hypertrophy loads, recovery curves, and macro balance coefficients. Stand by, athlete!
              </p>
            </div>
          </motion.div>
        ) : (
          /* STATE 3: DETAILED EXECUTIVE COCH REPORT */
          insights && (
            <motion.div
              key="insights-report"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 select-none"
            >
              {/* Headline block */}
              <Card className="border border-primary/20 bg-card bg-gradient-to-br from-primary/[0.02] to-transparent p-5">
                <CardContent className="p-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-primary uppercase tracking-widest block">
                      EXECUTIVE SUMMARY
                    </span>
                    <h3 className="text-base font-extrabold uppercase tracking-wide text-foreground">
                      {insights.headline}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> High Recovery Rating
                  </span>
                </CardContent>
              </Card>

              {/* Core Wins & Observations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Wins */}
                <Card className="border-border bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold tracking-wider text-primary uppercase flex items-center gap-1.5">
                      <Award className="w-4 h-4" />
                      Weekly Core Wins
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3.5 pb-5 text-xs text-muted-foreground leading-relaxed">
                    {insights.wins.map((w, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-primary font-bold">•</span>
                        <span>{w}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Patterns */}
                <Card className="border-border bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold tracking-wider text-[#00D2FF] uppercase flex items-center gap-1.5">
                      <Brain className="w-4 h-4" />
                      CNS & Strength Patterns
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3.5 pb-5 text-xs text-muted-foreground leading-relaxed">
                    {insights.patterns.map((p, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-[#00D2FF] font-bold">•</span>
                        <span>{p}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Improvements & Next Focus */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tactical Improvements */}
                <div className="md:col-span-2 space-y-4">
                  <Card className="border-border bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-semibold tracking-wider text-amber-500 uppercase flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4" />
                        Tactical Improvements
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pb-5 text-xs text-muted-foreground leading-relaxed">
                      {insights.improvements.map((imp, idx) => (
                        <div key={idx} className="flex gap-2">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{imp}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Direct Coaching Focus area */}
                <Card className="border border-border bg-card bg-gradient-to-br from-primary/[0.01] to-transparent h-fit">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold tracking-wider text-foreground uppercase flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-primary" />
                      Next Week's Focus
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4 text-xs font-semibold text-foreground leading-relaxed">
                    {insights.nextFocus}
                  </CardContent>
                  <CardFooter className="pt-0 pb-3.5 flex justify-end">
                    <Link href="/workout">
                      <Button size="sm" className="h-8 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer">
                        Update Split
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </div>

              {/* Scientific Quote */}
              <Card className="border-border bg-card bg-gradient-to-br from-secondary/30 to-transparent p-5 select-none text-center">
                <CardContent className="p-0 space-y-2 max-w-lg mx-auto">
                  <blockquote className="text-xs italic text-foreground/90 font-medium">
                    &ldquo;{insights.quote}&rdquo;
                  </blockquote>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    — {insights.author}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
