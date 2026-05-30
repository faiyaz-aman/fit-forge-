"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Search,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Brain,
  Info,
  HelpCircle,
  Clock,
  Award,
  AlertTriangle,
  Heart,
  Check,
  Play,
  Volume2,
  VolumeX,
  Award as EvidenceIcon,
  BookMarked,
  Layers,
  ChevronRight,
  Flame
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HowToApply {
  beginner?: string;
  intermediate?: string;
  advanced?: string;
}

interface MythVsReality {
  myth?: string;
  reality?: string;
  whyPeopleBelieveIt?: string;
}

interface ScientificTip {
  id: string;
  category: string;
  subcategory: string;
  tier: string;
  tags: string[];
  title: string;
  hook: string;
  summary: string;
  whatIsIt: string;
  whyItMatters: string;
  howItWorks: string;
  howToApply: HowToApply;
  commonMistakes: string[];
  mythVsReality: MythVsReality;
  example: string;
  visualConcept: string;
  relatedCards: string[];
  keyTakeaway: string;
  author: string;
  references: string[];
  evidenceLevel: "strong" | "moderate" | "anecdotal" | string;
  relevanceScore?: number;
  isTodayHighlight?: boolean;
  workoutMatch?: boolean;
}

const categories = [
  "All",
  "Training Science",
  "Exercise Biomechanics",
  "Muscle Anatomy & Function",
  "Program Design",
  "Nutrition Science",
  "Body Composition & Fat Loss",
  "Recovery & Adaptation",
  "Injury Prevention",
  "Myths & Facts",
  "Supplement Education",
  "Goal-Based Paths",
  "Psychology & Habit Building",
  "Exercise Library"
];

export default function TipsPage() {
  const [tips, setTips] = useState<ScientificTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTip, setSelectedTip] = useState<ScientificTip | null>(null);
  const [activeApplyTab, setActiveApplyTab] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [bookmarkedTips, setBookmarkedTips] = useState<string[]>([]);
  const [personalized, setPersonalized] = useState(false);

  // Digestion Filter States
  const [timeFilter, setTimeFilter] = useState<"All" | "Quick" | "Deep">("All");
  const [sourceFilter, setSourceFilter] = useState<"All" | "Personalized" | "Bookmarked">("All");

  // Gym Floor Cheat Sheet Mode (Visual Compactor)
  const [cheatSheetMode, setCheatSheetMode] = useState(false);

  // Audio Playback simulation states
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioPlaybackProgress, setAudioPlaybackProgress] = useState(0);

  // Active Recall retention quiz states
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizIncorrectShake, setQuizIncorrectShake] = useState(false);

  // Fetch tips from cache-first personalized API route
  useEffect(() => {
    async function fetchTips() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (selectedCategory !== "All") queryParams.append("category", selectedCategory);
        if (searchQuery) queryParams.append("searchQuery", searchQuery);

        const res = await fetch(`/api/tips?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setTips(data);
          
          const hasScores = data.some((t: any) => t.relevanceScore && t.relevanceScore > 0);
          setPersonalized(hasScores);
        }
      } catch (err) {
        console.error("Failed to load scientific tips:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTips();
  }, [selectedCategory, searchQuery]);

  // Load Bookmarks locally
  useEffect(() => {
    const saved = localStorage.getItem("fitforge_bookmarked_tips");
    if (saved) {
      setBookmarkedTips(JSON.parse(saved));
    }
  }, []);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = bookmarkedTips.includes(id)
      ? bookmarkedTips.filter(t => t !== id)
      : [...bookmarkedTips, id];
    setBookmarkedTips(updated);
    localStorage.setItem("fitforge_bookmarked_tips", JSON.stringify(updated));
  };

  // Simulated Text-to-Speech Audio Loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (playingAudioId) {
      interval = setInterval(() => {
        setAudioPlaybackProgress(prev => {
          if (prev >= 100) {
            setPlayingAudioId(null);
            return 0;
          }
          return prev + 1.8; // progress over approx 60 seconds
        });
      }, 1000);
    } else {
      setAudioPlaybackProgress(0);
    }
    return () => clearInterval(interval);
  }, [playingAudioId]);

  const toggleAudio = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingAudioId === id) {
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(id);
      setAudioPlaybackProgress(0);
    }
  };

  // Open Sliding details panel
  const openTipDrawer = (tip: ScientificTip) => {
    setSelectedTip(tip);
    setCheatSheetMode(false); // Default to full details
    setQuizAnswer(null); // Reset active recall
    setQuizSubmitted(false);
    setQuizIncorrectShake(false);

    const defaultTab = (tip.tier && ["beginner", "intermediate", "advanced"].includes(tip.tier.toLowerCase()))
      ? (tip.tier.toLowerCase() as "beginner" | "intermediate" | "advanced")
      : "beginner";
    setActiveApplyTab(defaultTab);
  };

  // Word count dynamic read-timer
  const getReadTime = (tip: ScientificTip) => {
    const wordCount = (tip.summary || "").split(/\s+/).length + 
                      (tip.howItWorks || "").split(/\s+/).length + 
                      (tip.whatIsIt || "").split(/\s+/).length;
    return Math.max(1, Math.round(wordCount / 160)) + 1; // 160 words per minute + 1 min buffer
  };

  // Multiple-choice active recall question constructor based deterministically on card ID
  const getRetentionQuiz = (tip: ScientificTip) => {
    const isHypertrophy = tip.id.includes("growth") || tip.category.toLowerCase().includes("hypertrophy") || tip.category.toLowerCase().includes("anatomy");
    const isNutrition = tip.id.includes("leucine") || tip.category.toLowerCase().includes("nutrition");

    if (isNutrition) {
      return {
        question: "How does spacing high-quality protein meals every 3-4 hours optimize muscle growth?",
        options: [
          { key: "A", text: "It decreases stomach acidity, preventing metabolic indigestion." },
          { key: "B", text: "It repeatedly triggers the mTOR pathway by crossing the Leucine threshold." },
          { key: "C", text: "It boosts systemic cortisol, which burns local visceral fat stores." }
        ],
        correctKey: "B",
        rationale: "Correct! Spacing protein every 3-4 hours allows systemic amino acid levels to fall and rise, crossing the Leucine Trigger (~3g) multiple times in a day. This initiates muscle protein synthesis far better than one single giant protein bolus."
      };
    } else if (isHypertrophy) {
      return {
        question: "Which mechanism represents the absolute primary stimulus triggering muscle fiber hypertrophy?",
        options: [
          { key: "A", text: "Cumulative Muscle Soreness (DOMS) from structural micro-damage." },
          { key: "B", text: "High-rep local blood pooling ('The Pump') driving metabolic stress." },
          { key: "C", text: "Mechanical Tension — especially at long, stretched muscle lengths." }
        ],
        correctKey: "C",
        rationale: "Correct! While metabolic stress and damage contribute, Mechanical Tension (loading the muscle through full ROM, particularly in its stretched/lengthened state) is the absolute king of hypertrophy stimuli, directly activating mTOR signaling."
      };
    }

    // Generic fallback quiz
    return {
      question: `What is the most scientific way to apply this "${tip.title}" guideline?`,
      options: [
        { key: "A", text: "Chasing extreme muscle fatigue and soreness in every training set." },
        { key: "B", text: "Relying on arbitrary percentages of 1RM without autoregulating daily neurological fatigue." },
        { key: "C", text: "Applying progressive overload with strict control, specfically during eccentric phases." }
      ],
      correctKey: "C",
      rationale: `Correct! Progressive overload through strict control, concentric specificity, and controlled eccentrics (as supported by principal lead ${tip.author}) is the proven driver of biological adaptation.`
    };
  };

  const handleQuizAnswerSubmit = (key: string, correctKey: string) => {
    if (quizSubmitted) return;
    setQuizAnswer(key);
    
    if (key === correctKey) {
      setQuizSubmitted(true);
      setQuizIncorrectShake(false);
    } else {
      setQuizIncorrectShake(true);
      // Brief timeout to reset the shaking animation
      setTimeout(() => setQuizIncorrectShake(false), 500);
    }
  };

  // Perform filtration across category, search, time, and personalization source parameters
  const filteredTips = tips.filter(tip => {
    // 1. Source Filters
    if (sourceFilter === "Bookmarked" && !bookmarkedTips.includes(tip.id)) return false;
    if (sourceFilter === "Personalized" && (!tip.relevanceScore || tip.relevanceScore === 0)) return false;

    // 2. Read Time Filters
    const minutes = getReadTime(tip);
    if (timeFilter === "Quick" && minutes > 2) return false;
    if (timeFilter === "Deep" && minutes <= 2) return false;

    return true;
  });

  const highlightCard = tips.find(t => t.isTodayHighlight);

  return (
    <div className="space-y-6 relative overflow-hidden pb-16 select-none">
      
      {/* 1. HEADER ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div className="flex flex-col space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl flex items-center gap-2">
            Scientific Knowledge Library
            {personalized && (
              <span className="text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                Adaptive Rank Active
              </span>
            )}
          </h2>
          <p className="text-xs text-muted-foreground">
            Explore 466 evidence-based athletic strategies curated by elite sports scientists.
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search chest biomechanics, protein, RPE..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 text-xs pl-10 border border-border bg-card w-full rounded-xl focus:border-primary/50"
          />
        </div>
      </div>

      {/* 2. ADVANCED DIGESTION & NAVIGATION FILTERS */}
      <div className="bg-card/40 border border-border/40 p-4 rounded-2xl flex flex-wrap gap-4 items-center justify-between">
        
        {/* Source selector */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">Feed:</span>
          <div className="flex bg-black/40 border border-border/60 p-0.5 rounded-xl">
            {(["All", "Personalized", "Bookmarked"] as const).map(src => {
              const isActive = sourceFilter === src;
              return (
                <button
                  key={src}
                  onClick={() => setSourceFilter(src)}
                  className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer ${
                    isActive ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {src}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reading Time filter */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">Read Time:</span>
          <div className="flex bg-black/40 border border-border/60 p-0.5 rounded-xl">
            {[
              { id: "All", label: "All Lengths" },
              { id: "Quick", label: "Quick (<2m)" },
              { id: "Deep", label: "Deep Dive (3m+)" }
            ].map(time => {
              const isActive = timeFilter === time.id;
              return (
                <button
                  key={time.id}
                  onClick={() => setTimeFilter(time.id as any)}
                  className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer ${
                    isActive ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {time.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. CATEGORY Tag Bar */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar w-full py-1 border-b border-border/20">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border shrink-0 ${
              selectedCategory === cat
                ? "bg-primary border-primary text-primary-foreground shadow-[0_0_12px_rgba(0,255,136,0.2)]"
                : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-secondary/40"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 4. DYNAMIC SECTIONS LAYOUT */}
      <AnimatePresence mode="wait">
        {loading ? (
          // Skeletal grid loading state
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border border-border/60 bg-card rounded-2xl p-5 space-y-4 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="w-16 h-3 bg-muted rounded" />
                  <div className="w-10 h-3 bg-muted rounded" />
                </div>
                <div className="w-4/5 h-5 bg-muted rounded mt-2" />
                <div className="w-full h-3 bg-muted rounded" />
                <div className="w-2/3 h-3 bg-muted rounded" />
                <div className="flex justify-between items-center pt-4 border-t border-border/40">
                  <div className="w-20 h-3 bg-muted rounded" />
                  <div className="w-12 h-3 bg-muted rounded" />
                </div>
              </div>
            ))}
          </motion.div>
        ) : filteredTips.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* A. OPTIMIZED HERO HIGHLIGHT SECTION */}
            {selectedCategory === "All" && searchQuery === "" && sourceFilter === "All" && timeFilter === "All" && highlightCard && (
              <div className="border border-primary/30 bg-gradient-to-r from-card via-[#0E1511] to-card rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row gap-6 items-stretch justify-between shadow-[0_4px_40px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                
                {/* Visual Glow overlay */}
                <div className="absolute right-0 top-0 w-80 h-80 bg-primary/[0.02] rounded-full blur-3xl pointer-events-none group-hover:bg-primary/[0.04] transition-all duration-700" />
                
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[8px] font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-primary" /> Today's Elite Highlight
                      </span>
                      {highlightCard.workoutMatch && (
                        <span className="text-[8px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5 text-emerald-400" /> Workout Match
                        </span>
                      )}
                      <span className="text-[9px] font-mono text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {getReadTime(highlightCard)} min read
                      </span>
                    </div>

                    <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground uppercase group-hover:text-primary transition-colors leading-snug">
                      {highlightCard.title}
                    </h3>

                    <p className="text-[11px] text-muted-foreground italic leading-relaxed border-l-2 border-primary/40 pl-3">
                      "{highlightCard.hook}"
                    </p>

                    <p className="text-xs text-foreground/80 leading-relaxed">
                      {highlightCard.summary}
                    </p>
                  </div>

                  {/* Premium audio abstract listener widget */}
                  <div className="bg-black/40 border border-border/60 p-3 rounded-2xl flex items-center gap-4 max-w-sm mt-2">
                    <button
                      onClick={(e) => toggleAudio(highlightCard.id, e)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all shadow ${
                        playingAudioId === highlightCard.id 
                          ? "bg-rose-500/20 border border-rose-500/40 text-rose-400" 
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {playingAudioId === highlightCard.id ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 fill-primary-foreground ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-mono">
                        <span className="font-bold text-foreground flex items-center gap-1">
                          <Volume2 className="w-3.5 h-3.5 text-primary" /> Audio Abstract
                        </span>
                        <span className="text-muted-foreground font-mono">
                          {playingAudioId === highlightCard.id ? `${Math.round(audioPlaybackProgress)}%` : "Listen"}
                        </span>
                      </div>
                      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${playingAudioId === highlightCard.id ? audioPlaybackProgress : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side study leads */}
                <div className="flex flex-row lg:flex-col justify-between lg:justify-center items-center lg:items-end gap-6 w-full lg:w-48 border-t lg:border-t-0 lg:border-l border-border/40 pt-4 lg:pt-0 lg:pl-6 shrink-0">
                  <div className="text-left lg:text-right">
                    <span className="text-[9px] font-mono text-muted-foreground block uppercase">Study Director</span>
                    <span className="text-xs font-bold text-foreground">{highlightCard.author}</span>
                  </div>

                  <Button
                    onClick={() => openTipDrawer(highlightCard)}
                    className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-wider h-11 px-6 rounded-xl shadow-[0_0_15px_rgba(0,255,136,0.15)] w-full lg:w-auto justify-center"
                  >
                    Examine Science <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* B. MAIN CARDS CATALOG GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTips.map((tip, index) => {
                // Pin Today's highlight in Hero. Skip rendering in catalog if home filters are default.
                const isHomeDefault = selectedCategory === "All" && searchQuery === "" && sourceFilter === "All" && timeFilter === "All";
                if (isHomeDefault && tip.isTodayHighlight) return null;

                const isBookmarked = bookmarkedTips.includes(tip.id);

                return (
                  <Card
                    key={tip.id}
                    onClick={() => openTipDrawer(tip)}
                    className="border-border bg-card hover:border-primary/30 hover:shadow-[0_4px_25px_rgba(0,0,0,0.3)] transition-all cursor-pointer flex flex-col justify-between group overflow-hidden rounded-2xl relative"
                  >
                    <CardHeader className="pb-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {tip.category}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-muted-foreground font-mono flex items-center gap-0.5">
                            <Clock className="w-3 h-3 text-muted-foreground/80" /> {getReadTime(tip)}m
                          </span>
                          <button
                            onClick={(e) => toggleBookmark(tip.id, e)}
                            className="p-1 rounded hover:bg-secondary/60 text-muted-foreground hover:text-rose-500 transition-colors"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isBookmarked ? "fill-rose-500 text-rose-500" : ""}`} />
                          </button>
                        </div>
                      </div>

                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground group-hover:text-primary transition-colors mt-2 leading-tight">
                        {tip.title}
                      </CardTitle>

                      <CardDescription className="text-[11px] line-clamp-2 mt-1 leading-relaxed text-muted-foreground/80">
                        {tip.summary}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pb-3 select-none">
                      <div className="flex flex-wrap gap-1">
                        {tip.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[8px] bg-secondary/40 text-muted-foreground/75 px-1.5 py-0.5 rounded font-mono">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </CardContent>

                    <CardFooter className="pt-2 pb-3 border-t border-border/30 flex justify-between items-center text-[9px] font-mono text-muted-foreground select-none">
                      <span className="flex items-center gap-1 group-hover:text-primary transition-all">
                        <EvidenceIcon className="w-3.5 h-3.5 text-primary/70" /> Evidence: {tip.evidenceLevel.toUpperCase()}
                      </span>
                      <span className="flex items-center gap-0.5 text-foreground font-bold group-hover:translate-x-0.5 transition-transform">
                        Verify <ArrowRight className="w-3 h-3 text-primary" />
                      </span>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-20 text-center text-xs text-muted-foreground flex flex-col items-center gap-2 border border-dashed border-border/60 rounded-3xl bg-card"
          >
            <AlertTriangle className="w-8 h-8 text-amber-500/50 mb-1" />
            No scientific guidelines matching active filters.
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
                setTimeFilter("All");
                setSourceFilter("All");
              }}
              className="text-primary font-bold hover:underline cursor-pointer uppercase tracking-wider text-[10px] mt-2"
            >
              Clear Filters
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. SLIDING DRAWER DETAIL & STUDY INTERACTIVE HUB */}
      <AnimatePresence>
        {selectedTip && (
          <>
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTip(null)}
              className="fixed inset-0 bg-[#0A0A0B]/80 backdrop-blur-md z-40"
            />

            {/* Sliding Drawer Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed top-0 right-0 h-screen w-full max-w-lg bg-[#0A0A0B] border-l border-border shadow-2xl z-50 overflow-y-auto no-scrollbar flex flex-col"
            >
              {/* Head line brand */}
              <div className="flex items-center justify-between p-5 border-b border-border/40 select-none bg-card/25">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-primary flex items-center justify-center font-bold text-primary-foreground text-xs shadow-[0_0_8px_rgba(0,255,136,0.3)]">
                    F
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    FITFORGE EVIDENCE DIGEST
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Gym Floor Toggle */}
                  <button
                    onClick={() => setCheatSheetMode(!cheatSheetMode)}
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider cursor-pointer border flex items-center gap-1 transition-all ${
                      cheatSheetMode 
                        ? "bg-primary border-primary text-primary-foreground shadow-[0_0_10px_rgba(0,255,136,0.2)]" 
                        : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    {cheatSheetMode ? "Full Science View" : "Gym-Floor Cheat Mode"}
                  </button>
                  
                  <button
                    onClick={() => setSelectedTip(null)}
                    className="p-1.5 rounded-xl border border-border bg-card hover:bg-secondary/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dynamic scroll content */}
              <div className="flex-1 p-6 space-y-6 overflow-y-auto no-scrollbar">
                
                {/* 1. Header Information */}
                <div className="space-y-2 select-none">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {selectedTip.category}
                    </span>
                    <span className={`text-[9px] font-mono font-bold border px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      selectedTip.evidenceLevel.toLowerCase() === "strong"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      Evidence: {selectedTip.evidenceLevel}
                    </span>
                  </div>
                  
                  <h3 className="text-base md:text-lg font-bold uppercase tracking-wide text-foreground leading-snug">
                    {selectedTip.title}
                  </h3>
                  
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    Principal Investigator: <span className="font-bold text-foreground">{selectedTip.author}</span>
                  </div>
                </div>

                {/* DYNAMIC DIGEST COMPACTION: Gym floor Mode vs Full Science Mode */}
                <AnimatePresence mode="wait">
                  {cheatSheetMode ? (
                    // A. COMPACT GYM FLOOR SUMMARY
                    <motion.div
                      key="gym-floor"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="bg-primary/[0.03] border border-primary/30 p-5 rounded-2xl space-y-3 relative overflow-hidden">
                        <div className="absolute right-3 top-3">
                          <Flame className="w-5 h-5 text-primary/30" />
                        </div>
                        <span className="text-[9px] font-mono font-bold text-primary uppercase tracking-widest block">
                          GYM FLOOR CHEAT SHEET (5-SEC READ)
                        </span>
                        
                        <div className="space-y-3 select-none">
                          <div className="space-y-1">
                            <span className="text-[9px] text-muted-foreground block uppercase font-mono">1. Core Axiom</span>
                            <p className="text-xs text-foreground font-semibold leading-relaxed">
                              {selectedTip.keyTakeaway || selectedTip.summary}
                            </p>
                          </div>
                          
                          <div className="space-y-1">
                            <span className="text-[9px] text-muted-foreground block uppercase font-mono">2. Loading Protocol</span>
                            <p className="text-xs text-foreground leading-relaxed">
                              {selectedTip.howToApply.beginner || selectedTip.howToApply.intermediate || "Apply progressive load over structured lifting weeks."}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] text-rose-400 block uppercase font-mono">3. Fatal Mistake to Avoid</span>
                            <p className="text-xs text-rose-300 leading-relaxed font-mono">
                              {selectedTip.commonMistakes[0] || "Avoid rushing tempos and neglecting clean progressive logs."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    // B. COMPLETE DEEP SCIENCE VIEW
                    <motion.div
                      key="full-science"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      {/* Abstract Quotation */}
                      {selectedTip.hook && (
                        <div className="text-xs text-muted-foreground italic border-l-2 border-primary/40 pl-4 py-0.5">
                          "{selectedTip.hook}"
                        </div>
                      )}

                      {/* Side-by-Side Mechanism cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 select-none">
                        <div className="bg-card border border-border/60 p-4 rounded-xl space-y-1.5">
                          <span className="text-[8px] font-bold uppercase tracking-widest text-primary flex items-center gap-1">
                            <Info className="w-3 h-3" /> Biological Concept
                          </span>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {selectedTip.whatIsIt || selectedTip.summary}
                          </p>
                        </div>
                        
                        <div className="bg-card border border-border/60 p-4 rounded-xl space-y-1.5">
                          <span className="text-[8px] font-bold uppercase tracking-widest text-primary flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> Why It Matters
                          </span>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {selectedTip.whyItMatters || selectedTip.summary}
                          </p>
                        </div>
                      </div>

                      {/* Cellular mechanics explanation */}
                      {selectedTip.howItWorks && (
                        <div className="space-y-2 bg-[#121214]/60 border border-border/40 p-4 rounded-2xl select-none">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-primary flex items-center gap-1">
                            <Brain className="w-3.5 h-3.5 text-primary" /> Cellular Mechanics & Study Context
                          </span>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {selectedTip.howItWorks}
                          </p>
                        </div>
                      )}

                      {/* Blueprint diagram card */}
                      {selectedTip.visualConcept && (
                        <div className="border border-dashed border-primary/20 bg-primary/[0.01] p-4 rounded-xl space-y-2 select-none relative overflow-hidden">
                          <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
                            Mental Blueprint / Diagram Concept
                          </span>
                          <p className="text-[10px] text-foreground font-mono leading-relaxed">
                            {selectedTip.visualConcept}
                          </p>
                        </div>
                      )}

                      {/* Multi-tier loading instructions */}
                      {selectedTip.howToApply && (
                        <div className="space-y-3 select-none">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block">
                            Exact Application Protocols
                          </span>
                          
                          {/* Selector Row */}
                          <div className="flex bg-card border border-border/60 p-1 rounded-xl">
                            {["beginner", "intermediate", "advanced"].map((tab) => {
                              const isAvailable = (selectedTip.howToApply as any)[tab];
                              if (!isAvailable) return null;
                              
                              const isActive = activeApplyTab === tab;
                              const isRecommended = selectedTip.tier && selectedTip.tier.toLowerCase() === tab;

                              return (
                                <button
                                  key={tab}
                                  onClick={() => setActiveApplyTab(tab as any)}
                                  className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                    isActive
                                      ? "bg-primary text-primary-foreground shadow-sm"
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  {tab}
                                  {isRecommended && (
                                    <span className={`text-[7px] border px-1 rounded-sm uppercase ${
                                      isActive ? "bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                    }`}>
                                      Rec
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Detail Box */}
                          <div className="bg-primary/[0.02] border border-primary/10 p-4 rounded-2xl flex gap-3 items-start">
                            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <span className="text-[8px] font-mono font-bold text-primary uppercase tracking-wider block">
                                Level Protocol: {activeApplyTab.toUpperCase()}
                              </span>
                              <p className="text-[11px] text-foreground leading-relaxed font-medium">
                                {(selectedTip.howToApply as any)[activeApplyTab] || "Default to standard compound lifting procedures."}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Common Mistakes */}
                      {selectedTip.commonMistakes && selectedTip.commonMistakes.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-border/20 select-none">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-rose-400 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Pitfalls to Avoid
                          </span>
                          <ul className="space-y-2">
                            {selectedTip.commonMistakes.map((mistake, idx) => (
                              <li key={idx} className="flex gap-2 items-start text-[11px] text-muted-foreground leading-relaxed">
                                <span className="text-rose-500 shrink-0 font-bold mt-0.5">✕</span>
                                {mistake}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Myth vs Reality Card */}
                      {selectedTip.mythVsReality && selectedTip.mythVsReality.myth && (
                        <div className="border border-border/40 rounded-2xl overflow-hidden select-none">
                          <div className="bg-rose-500/[0.02] border-b border-border/30 p-4 space-y-1">
                            <span className="text-[8px] font-mono font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1">
                              <HelpCircle className="w-3 h-3" /> The Misconception (Myth)
                            </span>
                            <p className="text-[11px] text-rose-300/90 leading-relaxed italic">
                              "{selectedTip.mythVsReality.myth}"
                            </p>
                          </div>
                          <div className="bg-emerald-500/[0.02] border-b border-border/30 p-4 space-y-1">
                            <span className="text-[8px] font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Scientific Reality
                            </span>
                            <p className="text-[11px] text-emerald-300/90 leading-relaxed font-medium">
                              {selectedTip.mythVsReality.reality}
                            </p>
                          </div>
                          {selectedTip.mythVsReality.whyPeopleBelieveIt && (
                            <div className="bg-secondary/20 p-4 space-y-1 text-[10px]">
                              <span className="text-muted-foreground uppercase font-bold tracking-widest block text-[8px]">
                                Why Athletes Make This Mistake
                              </span>
                              <p className="text-muted-foreground leading-relaxed">
                                {selectedTip.mythVsReality.whyPeopleBelieveIt}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 3. COGNITIVE ACTIVE RECALL RETENTION CHECK QUIZ (ALWAYS AVAILABLE BELOW FOR OPTIMAL TIMING) */}
                {!cheatSheetMode && (
                  <div className="border border-border/60 bg-gradient-to-b from-[#0F1210] to-[#0A0A0B] p-5 rounded-2xl space-y-4 pt-4 border-t select-none mt-6">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <span className="text-[9px] font-mono font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                        <Brain className="w-4 h-4 text-primary animate-pulse" /> Active Recall Retention check
                      </span>
                      <span className="text-[7.5px] font-mono font-bold uppercase bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded">
                        Boost Retention +80%
                      </span>
                    </div>

                    {/* Quiz Block */}
                    {(() => {
                      const quiz = getRetentionQuiz(selectedTip);
                      return (
                        <div className="space-y-4">
                          <p className="text-[11px] font-semibold text-foreground leading-relaxed">
                            {quiz.question}
                          </p>

                          {/* Options grid */}
                          <div className={`space-y-2 ${quizIncorrectShake ? "animate-shake" : ""}`}>
                            {quiz.options.map((opt) => {
                              const isSelected = quizAnswer === opt.key;
                              const isCorrect = opt.key === quiz.correctKey;
                              
                              let optionClass = "border-border/60 hover:bg-secondary/40 text-muted-foreground";
                              if (quizSubmitted && isCorrect) {
                                optionClass = "bg-emerald-500/10 border-emerald-500 text-emerald-400";
                              } else if (isSelected && !isCorrect) {
                                optionClass = "bg-rose-500/10 border-rose-500 text-rose-400";
                              } else if (isSelected) {
                                optionClass = "bg-primary/10 border-primary text-primary";
                              }

                              return (
                                <button
                                  key={opt.key}
                                  disabled={quizSubmitted}
                                  onClick={() => handleQuizAnswerSubmit(opt.key, quiz.correctKey)}
                                  className={`w-full text-left p-3 border rounded-xl text-[10px] font-medium leading-relaxed transition-all cursor-pointer flex items-start gap-2.5 ${optionClass}`}
                                >
                                  <span className="font-mono font-bold text-[9px] border border-current px-1.5 py-0.5 rounded shrink-0">
                                    {opt.key}
                                  </span>
                                  <span>{opt.text}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Success rationale panel */}
                          <AnimatePresence>
                            {quizSubmitted && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-emerald-500/[0.02] border border-emerald-500/30 p-4 rounded-xl space-y-1.5"
                              >
                                <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest block flex items-center gap-1">
                                  🏆 retention verified (active recall boost)
                                </span>
                                <p className="text-[10px] text-emerald-300 leading-relaxed font-mono">
                                  {quiz.rationale}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Peer-Reviewed References */}
                {!cheatSheetMode && selectedTip.references && selectedTip.references.length > 0 && (
                  <div className="space-y-2 pt-4 border-t border-border/30 select-none">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block">
                      Peer-Reviewed References & Citations
                    </span>
                    <ul className="space-y-1.5">
                      {selectedTip.references.map((ref, idx) => (
                        <li key={idx} className="text-[9px] text-muted-foreground/80 font-mono leading-relaxed list-disc list-inside">
                          {ref}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Consult AI Button */}
              <div className="p-5 border-t border-border/40 bg-[#0E0E10]/40 shrink-0">
                <Link href={`/chat?prompt=Tell me more about the scientific basis of ${encodeURIComponent(selectedTip.title)}`}>
                  <Button className="w-full flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider font-bold text-[10px] h-11 rounded-xl shadow-[0_0_12px_rgba(0,255,136,0.15)]">
                    <Sparkles className="w-4 h-4" />
                    Consult AI Coach About This
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
