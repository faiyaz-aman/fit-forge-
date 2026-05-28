"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  Flame,
  Award,
  AlertTriangle,
  Scale,
  Calendar,
  Activity,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Helper to generate seed workout calendar data for last 365 days
// 53 columns x 7 rows
const generateContributionData = () => {
  const data = [];
  const states = ["none", "none", "none", "partial", "completed", "none", "completed", "skipped"];
  
  // Total 53 weeks * 7 days = 371 days
  for (let i = 0; i < 371; i++) {
    // Generate some structured mock patterns (more active recently)
    let state = "none";
    if (i > 300) {
      state = states[Math.floor(Math.random() * states.length)];
    } else if (i > 150) {
      state = Math.random() > 0.6 ? "completed" : "none";
    } else {
      state = Math.random() > 0.85 ? "completed" : "none";
    }
    data.push({ id: i, state });
  }
  return data;
};

// Seed charts data
const weeklyVolumeData = [
  { label: "W1", volume: 12500 },
  { label: "W2", volume: 13800 },
  { label: "W3", volume: 14200 },
  { label: "W4", volume: 15100 },
  { label: "W5", volume: 14900 },
  { label: "W6", volume: 16200 },
  { label: "W7", volume: 16800 },
  { label: "W8", volume: 17400 },
];

const bodyCompositionData = [
  { label: "W1", weight: 84.5, fatPct: 18.2 },
  { label: "W2", weight: 84.1, fatPct: 18.0 },
  { label: "W3", weight: 83.8, fatPct: 17.7 },
  { label: "W4", weight: 83.5, fatPct: 17.5 },
  { label: "W5", weight: 83.2, fatPct: 17.1 },
  { label: "W6", weight: 83.6, fatPct: 17.0 },
  { label: "W7", weight: 83.0, fatPct: 16.6 },
  { label: "W8", weight: 82.7, fatPct: 16.2 },
];

export default function StatsPage() {
  const [activeTooltip, setActiveTooltip] = useState<{ chart: string; index: number | null }>({
    chart: "",
    index: null,
  });
  
  const contributionGrid = generateContributionData();

  // SVG dimensions for custom charts
  const width = 600;
  const height = 220;
  const paddingX = 50;
  const paddingY = 30;

  // Compute Volume coordinates
  const volMax = Math.max(...weeklyVolumeData.map((d) => d.volume)) * 1.05;
  const volMin = Math.min(...weeklyVolumeData.map((d) => d.volume)) * 0.95;
  
  const getVolCoordinates = () => {
    return weeklyVolumeData.map((d, i) => {
      const x = paddingX + (i / (weeklyVolumeData.length - 1)) * (width - paddingX * 2);
      const y = height - paddingY - ((d.volume - volMin) / (volMax - volMin)) * (height - paddingY * 2);
      return { x, y, ...d };
    });
  };
  const volCoords = getVolCoordinates();

  // Volume SVG Path points
  const volPath = volCoords.reduce((path, p, i) => {
    return path + `${i === 0 ? "M" : "L"} ${p.x} ${p.y} `;
  }, "");

  const volAreaPath = volCoords.reduce((path, p, i) => {
    if (i === 0) {
      return `M ${p.x} ${height - paddingY} L ${p.x} ${p.y} `;
    }
    if (i === volCoords.length - 1) {
      return path + `L ${p.x} ${p.y} L ${p.x} ${height - paddingY} Z`;
    }
    return path + `L ${p.x} ${p.y} `;
  }, "");

  // Compute Weight Composition coordinates
  const weightMax = Math.max(...bodyCompositionData.map((d) => d.weight)) + 1;
  const weightMin = Math.min(...bodyCompositionData.map((d) => d.weight)) - 1;
  const fatMax = Math.max(...bodyCompositionData.map((d) => d.fatPct)) + 1;
  const fatMin = Math.min(...bodyCompositionData.map((d) => d.fatPct)) - 1;

  const getCompCoordinates = () => {
    return bodyCompositionData.map((d, i) => {
      const x = paddingX + (i / (bodyCompositionData.length - 1)) * (width - paddingX * 2);
      const yWeight = height - paddingY - ((d.weight - weightMin) / (weightMax - weightMin)) * (height - paddingY * 2);
      const yFat = height - paddingY - ((d.fatPct - fatMin) / (fatMax - fatMin)) * (height - paddingY * 2);
      return { x, yWeight, yFat, ...d };
    });
  };
  const compCoords = getCompCoordinates();

  const weightPath = compCoords.reduce((path, p, i) => {
    return path + `${i === 0 ? "M" : "L"} ${p.x} ${p.yWeight} `;
  }, "");

  const fatPath = compCoords.reduce((path, p, i) => {
    return path + `${i === 0 ? "M" : "L"} ${p.x} ${p.yFat} `;
  }, "");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-1 select-none">
        <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
          Visual Analytics & Stats
        </h2>
        <p className="text-xs text-muted-foreground">
          Track progression volume, body fat curves, and active gym streaks.
        </p>
      </div>

      {/* Deload Detector Warning Banner */}
      <Card className="border border-amber-500/20 bg-amber-500/[0.02] bg-gradient-to-r from-amber-500/[0.03] to-transparent">
        <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded bg-amber-500/10 text-amber-500 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500 block">
                FATIGUE ALERT: SYSTEM RECOMMENDS A DELOAD WEEK
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                Your last 4 workout logs show a consistent RPE threshold above <span className="font-bold text-foreground">9.1</span> coupled with a <span className="font-bold text-foreground">12% drop in working volume</span>. Central nervous system fatigue is limiting your active progression.
              </p>
            </div>
          </div>
          <Link href="/chat?prompt=generate-deload-routine" className="w-full md:w-auto">
            <Button
              variant="secondary"
              className="w-full md:w-auto h-9 text-xs border border-amber-500/20 hover:bg-amber-500/10 text-amber-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Get Deload Split
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Grid of Key Performance Indexes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex flex-col justify-between h-20">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
              ESTIMATED 1RM BENCH
            </span>
            <div className="flex justify-between items-baseline mt-1">
              <span className="text-xl font-mono font-extrabold text-foreground tabular-nums">
                116.5 <span className="text-[11px] text-muted-foreground font-sans font-normal">kg</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                +4.2%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4 flex flex-col justify-between h-20">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
              AVG WEEKLY VOLUME
            </span>
            <div className="flex justify-between items-baseline mt-1">
              <span className="text-xl font-mono font-extrabold text-foreground tabular-nums">
                15,360 <span className="text-[11px] text-muted-foreground font-sans font-normal">kg</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                +6.8%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4 flex flex-col justify-between h-20">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
              NAVY BODY FAT EST.
            </span>
            <div className="flex justify-between items-baseline mt-1">
              <span className="text-xl font-mono font-extrabold text-foreground tabular-nums">
                16.2 <span className="text-[11px] text-muted-foreground font-sans font-normal">%</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                -2.0%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4 flex flex-col justify-between h-20">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
              ACTIVE STREAK
            </span>
            <div className="flex justify-between items-baseline mt-1">
              <span className="text-xl font-mono font-extrabold text-foreground tabular-nums">
                14 <span className="text-[11px] text-muted-foreground font-sans font-normal">days</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <Flame className="w-3 h-3 fill-orange-500" /> Hot
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom High-Fidelity Charts Column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Training Tonnage Volume Progression */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-1.5 text-xs text-primary font-bold">
              <TrendingUp className="w-4 h-4" />
              <span>TOTAL TONNAGE PROGRESSION</span>
            </div>
            <CardDescription className="text-xs">
              Weekly cumulative tonnage (sets × reps × weight) lifted across all workout blocks.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3">
            <div className="relative w-full overflow-x-auto no-scrollbar">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none overflow-visible">
                <defs>
                  <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00FF88" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#00FF88" stopOpacity="0.0" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = paddingY + ratio * (height - paddingY * 2);
                  const val = volMax - ratio * (volMax - volMin);
                  return (
                    <g key={idx} className="opacity-40">
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={width - paddingX}
                        y2={y}
                        stroke="#1F1F23"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={paddingX - 8}
                        y={y + 4}
                        fill="#A1A1AA"
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        {Math.round(val).toLocaleString()}
                      </text>
                    </g>
                  );
                })}

                {/* Gradient Fill */}
                <path d={volAreaPath} fill="url(#volGradient)" />

                {/* Main Curve Path */}
                <path
                  d={volPath}
                  fill="none"
                  stroke="#00FF88"
                  strokeWidth="2.5"
                  filter="url(#glow)"
                />

                {/* Coordinates Dots & Interaction Zones */}
                {volCoords.map((pt, idx) => (
                  <g key={idx}>
                    {/* Hover hotspot */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="16"
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setActiveTooltip({ chart: "volume", index: idx })}
                      onMouseLeave={() => setActiveTooltip({ chart: "", index: null })}
                    />
                    
                    {/* Actual visual coordinate dot */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={activeTooltip.chart === "volume" && activeTooltip.index === idx ? "5" : "3.5"}
                      fill={activeTooltip.chart === "volume" && activeTooltip.index === idx ? "#00FF88" : "#0A0A0B"}
                      stroke="#00FF88"
                      strokeWidth="2.5"
                      className="transition-all duration-150"
                    />

                    {/* Bottom labels */}
                    <text
                      x={pt.x}
                      y={height - 8}
                      fill="#A1A1AA"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {pt.label}
                    </text>
                  </g>
                ))}
              </svg>

              {/* Glowing Interactive Tooltip Overlay */}
              <AnimatePresence>
                {activeTooltip.chart === "volume" && activeTooltip.index !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute bg-card border border-primary/20 shadow-2xl p-2.5 rounded-lg text-[10px] top-6 left-12 space-y-0.5 select-none z-10 pointer-events-none"
                  >
                    <span className="font-bold text-muted-foreground uppercase tracking-widest block">
                      {weeklyVolumeData[activeTooltip.index].label} Load Volume
                    </span>
                    <span className="font-mono text-xs font-bold text-primary block tabular-nums">
                      {weeklyVolumeData[activeTooltip.index].volume.toLocaleString()} kg
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Body Composition Progression */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-1.5 text-xs text-primary font-bold">
              <Scale className="w-4 h-4" />
              <span>WEIGHT & BODY FAT CURVES</span>
            </div>
            <CardDescription className="text-xs">
              Correlating body weight (emerald line) against calculated Navy body fat % (blue line) over 8 weeks.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3">
            <div className="relative w-full overflow-x-auto no-scrollbar">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none overflow-visible">
                <defs>
                  <filter id="blueGlow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = paddingY + ratio * (height - paddingY * 2);
                  const wVal = weightMax - ratio * (weightMax - weightMin);
                  const fVal = fatMax - ratio * (fatMax - fatMin);
                  return (
                    <g key={idx} className="opacity-40">
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={width - paddingX}
                        y2={y}
                        stroke="#1F1F23"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                      {/* Weight Y-axis */}
                      <text
                        x={paddingX - 8}
                        y={y + 4}
                        fill="#00FF88"
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        {wVal.toFixed(1)}
                      </text>
                      {/* Fat % Y-axis */}
                      <text
                        x={width - paddingX + 8}
                        y={y + 4}
                        fill="#00D2FF"
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="start"
                      >
                        {fVal.toFixed(1)}%
                      </text>
                    </g>
                  );
                })}

                {/* Weight Curve Path */}
                <path
                  d={weightPath}
                  fill="none"
                  stroke="#00FF88"
                  strokeWidth="2"
                  filter="url(#glow)"
                />

                {/* Body Fat Curve Path */}
                <path
                  d={fatPath}
                  fill="none"
                  stroke="#00D2FF"
                  strokeWidth="2"
                  filter="url(#blueGlow)"
                />

                {/* Coordinates Zones */}
                {compCoords.map((pt, idx) => (
                  <g key={idx}>
                    {/* Hotspot */}
                    <circle
                      cx={pt.x}
                      cy={pt.yWeight}
                      r="16"
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setActiveTooltip({ chart: "comp", index: idx })}
                      onMouseLeave={() => setActiveTooltip({ chart: "", index: null })}
                    />

                    {/* Weight Point */}
                    <circle
                      cx={pt.x}
                      cy={pt.yWeight}
                      r={activeTooltip.chart === "comp" && activeTooltip.index === idx ? "4.5" : "3"}
                      fill={activeTooltip.chart === "comp" && activeTooltip.index === idx ? "#00FF88" : "#0A0A0B"}
                      stroke="#00FF88"
                      strokeWidth="2"
                    />

                    {/* Fat Point */}
                    <circle
                      cx={pt.x}
                      cy={pt.yFat}
                      r={activeTooltip.chart === "comp" && activeTooltip.index === idx ? "4.5" : "3"}
                      fill={activeTooltip.chart === "comp" && activeTooltip.index === idx ? "#00D2FF" : "#0A0A0B"}
                      stroke="#00D2FF"
                      strokeWidth="2"
                    />

                    {/* Labels */}
                    <text
                      x={pt.x}
                      y={height - 8}
                      fill="#A1A1AA"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {pt.label}
                    </text>
                  </g>
                ))}
              </svg>

              {/* Glowing Interactive Tooltip Overlay */}
              <AnimatePresence>
                {activeTooltip.chart === "comp" && activeTooltip.index !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute bg-card border border-primary/20 shadow-2xl p-2.5 rounded-lg text-[10px] top-6 left-12 space-y-1 select-none z-10 pointer-events-none"
                  >
                    <span className="font-bold text-muted-foreground uppercase tracking-widest block">
                      {bodyCompositionData[activeTooltip.index].label} Composition
                    </span>
                    <div className="flex gap-4">
                      <span className="font-mono text-xs font-bold text-primary block tabular-nums">
                        W: {bodyCompositionData[activeTooltip.index].weight} kg
                      </span>
                      <span className="font-mono text-xs font-bold text-[#00D2FF] block tabular-nums">
                        BF: {bodyCompositionData[activeTooltip.index].fatPct}%
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 3: 53-Week Heatmap Gym Attendance Calendar */}
      <Card className="border-border bg-card select-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-primary font-bold">
              <Calendar className="w-4 h-4" />
              <span>CONSISTENCY HEATMAP GRID</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono font-semibold uppercase tracking-wider">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-[#1F1F23] rounded-sm" /> None
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-primary/20 rounded-sm" /> Partial
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-primary rounded-sm" /> Gym Day
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-amber-500/30 rounded-sm" /> Skipped
              </div>
            </div>
          </div>
          <CardDescription className="text-xs">
            Reviewing your gym loyalty index for the past 365 days. Keeping consistent breaks boundaries.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4 pt-1">
          <div className="w-full overflow-x-auto no-scrollbar pb-2">
            {/* Grid Layout of 53 Weeks */}
            <div className="grid grid-flow-col grid-rows-7 gap-1.5 min-w-[700px]">
              {contributionGrid.map((day) => {
                let cellColor = "bg-[#1F1F23]";
                if (day.state === "completed") cellColor = "bg-primary shadow-[0_0_4px_rgba(0,255,136,0.3)]";
                if (day.state === "partial") cellColor = "bg-primary/25";
                if (day.state === "skipped") cellColor = "bg-amber-500/30 border border-amber-500/20";
                
                return (
                  <div
                    key={day.id}
                    className={`w-2.5 h-2.5 rounded-[2px] transition-colors duration-200 cursor-pointer ${cellColor}`}
                  />
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
