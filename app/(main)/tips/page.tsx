"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Tip {
  id: string;
  category: "Hypertrophy" | "Strength" | "Nutrition" | "Mindset" | "Recovery";
  title: string;
  summary: string;
  content: string;
  explanation: string;
  application: string;
  author: string;
  references: string[];
}

const expertTips: Tip[] = [
  {
    id: "tip1",
    category: "Hypertrophy",
    title: "Mechanical Tension & Eccentric Control",
    summary: "Slow, controlled lowering phases maximize structural hypertrophy.",
    content: "Mechanical tension is the primary driver of muscle hypertrophy. While concentric phases contract the muscle, the eccentric (lowering) phase causes structural micro-tears under tension that trigger growth pathways.",
    explanation: "During eccentric contractions, fewer motor units are recruited for the same load, resulting in higher mechanical stress per active muscle fiber. Studies show that controlling eccentrics leads to greater hypertrophy than rapid drop tempos.",
    application: "On major compound lifts (Squat, Bench, Lat Pulldown), use a strict 3-second eccentric phase. Stop 1 inch before lock-out to keep absolute, constant tension on the working muscle.",
    author: "Jeff Nippard (Sports Scientist)",
    references: ["Schoenfeld et al., Journal of Strength and Conditioning Research, 2017", "Nippard Hypertrophy Guide V2, 2022"],
  },
  {
    id: "tip2",
    category: "Nutrition",
    title: "The Leucine Trigger & Protein Distribution",
    summary: "Distribute high-quality protein evenly in 3-4 hour intervals.",
    content: "Muscle protein synthesis (MPS) is maximized when a meal contains sufficient essential amino acids—specifically Leucine (approx. 3g)—to cross the 'Leucine Trigger' threshold.",
    explanation: "Reaching the Leucine Trigger initiates the mTORC1 pathway, turning on cellular machinery for muscle repair. Consuming one single huge protein meal is less anabolic than spacing protein intake every 3 to 4 hours.",
    application: "Target 30g to 45g of high-quality protein (Whey, Chicken, Eggs) every 3-4 hours. Do not let fasting windows exceed 5 hours during high training load cycles.",
    author: "Dr. Mike Israetel (Renaissance Periodization)",
    references: ["Morton et al., British Journal of Sports Medicine, 2018", "Israetel, Scientific Principles of Strength Training, 2019"],
  },
  {
    id: "tip3",
    category: "Strength",
    title: "Systemic Progressive Overload Protocols",
    summary: "Add load, reps, or set quality systematically to force adaptation.",
    content: "The human body will not adapt unless it is consistently presented with a stimulus that exceeds its current capacity. You must increase training volume or load over time.",
    explanation: "Progressive overload does not just mean adding weight. It can mean improving rep quality, decreasing rest intervals slightly, or increasing total sets. If you lift the same weights for the same reps indefinitely, your body will plateau.",
    application: "Keep a rigorous training log. If you completed 3 sets of 8 reps at 80kg bench press this week, aim for 3 sets of 9 reps, or 3 sets of 8 reps at 82.5kg next week.",
    author: "Mark Rippetoe (Author of Starting Strength)",
    references: ["Garhammer, J., Sports Medicine, 1989", "Rippetoe, Starting Strength Basic Barbell Training, 2011"],
  },
  {
    id: "tip4",
    category: "Recovery",
    title: "Parasympathetic Activation & Deep Sleep",
    summary: "Central nervous system recovery happens during Stage 3 & 4 sleep.",
    content: "Sleep is the single most powerful recovery enhancer available. Deep, slow-wave sleep stimulates growth hormone secretion and clears metabolic waste from the brain.",
    explanation: "Sleep deprivation increases systemic cortisol (a catabolic hormone that breaks down muscle) and reduces insulin sensitivity. It also shifts the nervous system into a chronic sympathetic (fight-or-flight) state, inhibiting repair.",
    application: "Establish a strict pre-sleep wind-down routine: turn off blue-light devices 60 minutes before bed. Aim for 7.5 to 8.5 hours of uninterrupted sleep, keeping the room dark and cool (18°C).",
    author: "Coach Greg Doucette (IFBB Pro)",
    references: ["Dattilo et al., Medical Hypotheses, 2011", "Walker, Why We Sleep, 2017"],
  },
  {
    id: "tip5",
    category: "Mindset",
    title: "Autoregulation & RPE Load Scaling",
    summary: "Use RPE to adjust working loads based on daily neurological readiness.",
    content: "Autoregulation uses a Rate of Perceived Exertion (RPE) system to dynamically scale weights according to your immediate strength capabilities on any given day.",
    explanation: "Your strength fluctuates daily due to stress, sleep quality, and cumulative fatigue. Forcing a pre-planned percentage of 1RM on a day you are neurologically fatigued increases injury risk. Scaling dynamically maximizes consistent progress.",
    application: "If your program prescribes 3 sets of 8 reps at 'RPE 8' (meaning you have exactly 2 reps left in reserve), select a weight that achieves this feeling, even if it is 5kg lighter or heavier than last week.",
    author: "Dr. Eric Helms (Author of Muscle & Strength Pyramids)",
    references: ["Helms et al., Journal of Strength and Conditioning Research, 2016", "The Muscle & Strength Pyramids, 2019"],
  },
  {
    id: "tip6",
    category: "Recovery",
    title: "Active Recovery & Lymphatic Clearance",
    summary: "Light blood circulation accelerates recovery faster than complete rest.",
    content: "Active recovery involves performing low-intensity exercises to increase blood flow throughout fatigued muscle groups, bringing in essential nutrients and accelerating recovery.",
    explanation: "The lymphatic system, which carries away metabolic waste from damaged tissues, has no pump. It relies entirely on skeletal muscle contractions. Complete sedentary rest delays clearance of waste compared to light movement.",
    application: "On non-training days, perform a 25-minute fast walk or light cycling (keeping heart rate below 120 bpm). Focus on full range of motion without accumulating muscle fatigue.",
    author: "Dr. Andy Galpin (Human Performance Researcher)",
    references: ["Dupuy et al., Frontiers in Physiology, 2018", "Galpin, Biology of Human Performance, 2021"],
  },
];

const categories = ["All", "Hypertrophy", "Strength", "Nutrition", "Mindset", "Recovery"];

export default function TipsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTip, setSelectedTip] = useState<Tip | null>(null);

  // Filter Tips
  const filteredTips = expertTips.filter((tip) => {
    const matchesCategory = selectedCategory === "All" || tip.category === selectedCategory;
    const matchesSearch =
      tip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tip.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tip.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 relative overflow-hidden">
      {/* Header Info */}
      <div className="flex flex-col space-y-1 select-none">
        <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
          Scientific Knowledge Library
        </h2>
        <p className="text-xs text-muted-foreground">
          Explore evidence-based athletic strategies curated by elite sports scientists.
        </p>
      </div>

      {/* Filter and Search Layout */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between select-none">
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                selectedCategory === cat
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-[#141416] border-border text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input Box */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search guidelines or coach..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 text-xs pl-10 border border-border bg-card w-full"
          />
        </div>
      </div>

      {/* Grid of Seeded Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 select-none">
        {filteredTips.length > 0 ? (
          filteredTips.map((tip) => (
            <Card
              key={tip.id}
              onClick={() => setSelectedTip(tip)}
              className="border-border bg-card hover:border-primary/30 transition-all cursor-pointer flex flex-col justify-between group overflow-hidden"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-widest">
                    {tip.category}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {tip.author.split(" ")[0]} {tip.author.split(" ")[1] || ""}
                  </span>
                </div>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground group-hover:text-primary transition-colors mt-2.5">
                  {tip.title}
                </CardTitle>
                <CardDescription className="text-xs line-clamp-2 mt-1 leading-relaxed">
                  {tip.summary}
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2 pb-3.5 border-t border-border/40 flex justify-between items-center text-[10px] font-mono text-muted-foreground">
                <span className="flex items-center gap-1 group-hover:text-primary transition-all">
                  <Info className="w-3.5 h-3.5" /> Study-Backed
                </span>
                <span className="flex items-center gap-0.5 text-foreground font-bold group-hover:translate-x-0.5 transition-transform">
                  Explore Science <ArrowRight className="w-3 h-3 text-primary" />
                </span>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-16 text-center text-xs text-muted-foreground">
            No scientific guidelines found for "{searchQuery}". Try another query.
          </div>
        )}
      </div>

      {/* ULTRA-PREMIUM RIGHT-SLIDING DETAILS DRAWER OVERLAY */}
      <AnimatePresence>
        {selectedTip && (
          <>
            {/* Drawer Backdrop blur */}
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
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 h-screen w-full max-w-md bg-[#0A0A0B] border-l border-border shadow-2xl z-50 overflow-y-auto no-scrollbar flex flex-col"
            >
              {/* Drawer Header brand */}
              <div className="flex items-center justify-between p-6 border-b border-border/60 select-none">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-primary flex items-center justify-center font-bold text-primary-foreground text-xs shadow-[0_0_8px_rgba(0,255,136,0.3)]">
                    F
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    FITFORGE PERFORMANCE CENTER
                  </span>
                </div>
                <button
                  onClick={() => setSelectedTip(null)}
                  className="p-1.5 rounded-lg border border-border bg-[#141416] hover:bg-secondary/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 p-6 space-y-6 select-none">
                {/* Category & Title */}
                <div className="space-y-2">
                  <span className="text-[9px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-widest inline-block">
                    {selectedTip.category}
                  </span>
                  <h3 className="text-lg font-bold uppercase tracking-wide text-foreground">
                    {selectedTip.title}
                  </h3>
                  <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                    Principal Author: <span className="font-bold text-foreground">{selectedTip.author}</span>
                  </div>
                </div>

                {/* Core Concept */}
                <div className="space-y-2 border-l-2 border-primary pl-4 py-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
                    Core Biological Mechanism
                  </span>
                  <p className="text-xs text-foreground leading-relaxed">
                    {selectedTip.content}
                  </p>
                </div>

                {/* Scientific Explanation */}
                <div className="space-y-2 bg-[#141416] border border-border p-4 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1">
                    <Brain className="w-3.5 h-3.5" /> Deep scientific context
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {selectedTip.explanation}
                  </p>
                </div>

                {/* Application Protocols */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
                    Exact Daily Application
                  </span>
                  <div className="flex gap-3 items-start bg-primary/[0.02] border border-primary/20 p-4 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground leading-relaxed font-medium">
                      {selectedTip.application}
                    </p>
                  </div>
                </div>

                {/* Literature References */}
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
                    Peer-Reviewed References
                  </span>
                  <ul className="space-y-1.5">
                    {selectedTip.references.map((ref, idx) => (
                      <li key={idx} className="text-[10px] text-muted-foreground font-mono leading-relaxed list-disc list-inside">
                        {ref}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button: Ask AI Coach about this */}
              <div className="p-6 border-t border-border/60 bg-[#0E0E10]/40 shrink-0">
                <Link href={`/chat?prompt=Tell me more about the scientific basis of ${encodeURIComponent(selectedTip.title)}`}>
                  <Button className="w-full flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider font-bold text-xs h-11">
                    <Sparkles className="w-4 h-4" />
                    Ask AI Coach About This
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
