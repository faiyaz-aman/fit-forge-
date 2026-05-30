"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, BarChart3, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function StatsPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg"
      >
        <Card className="border border-primary/20 bg-[#141416]/95 backdrop-blur-md relative overflow-hidden p-8 shadow-2xl">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/10 blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-primary/5 blur-2xl translate-y-1/2 -translate-x-1/2" />

          {/* Banner Tag */}
          <div className="absolute top-4 right-4 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5 neon-glow">
            <Sparkles className="w-3.5 h-3.5" />
            Coming Soon
          </div>

          <CardContent className="flex flex-col items-center justify-center text-center space-y-6 pt-6">
            {/* Animated central icon */}
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-lg relative neon-glow"
            >
              <BarChart3 className="w-10 h-10" />
            </motion.div>

            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-foreground">
                Volume & Strength <span className="text-primary">Analytics</span>
              </h2>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                We are developing deep analytical models to track your volume trends, estimated 1-Rep Max parameters, and muscle grouping distributions over time.
              </p>
            </div>

            {/* Premium feature preview elements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full pt-4 border-t border-border/40 text-left">
              <div className="space-y-1.5 p-3.5 rounded-xl bg-secondary/20 border border-border">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary block flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  1-Rep Max Tracker
                </span>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Trace historical 1RM developments for all primary compound movements based on RPE logs.
                </p>
              </div>

              <div className="space-y-1.5 p-3.5 rounded-xl bg-secondary/20 border border-border">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary block">
                  Volume Matching
                </span>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Track set distributions across chest, back, quad, and hamstring muscle clusters automatically.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
