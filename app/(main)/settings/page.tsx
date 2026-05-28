"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import {
  Settings,
  Scale,
  Volume2,
  Database,
  Trash2,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const [weightUnit, setWeightUnit] = useState("kg");
  const [lengthUnit, setLengthUnit] = useState("cm");
  const [volumeUnit, setVolumeUnit] = useState("ml");
  const [ttsFeedback, setTtsFeedback] = useState(true);
  const [saved, setSaved] = useState(false);

  // Load persisted settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("fitforge-settings");
      if (stored) {
        const s = JSON.parse(stored);
        if (s.weightUnit) setWeightUnit(s.weightUnit);
        if (s.lengthUnit) setLengthUnit(s.lengthUnit);
        if (s.volumeUnit) setVolumeUnit(s.volumeUnit);
        if (typeof s.ttsFeedback === "boolean") setTtsFeedback(s.ttsFeedback);
      }
    } catch (e) {
      // If localStorage is not available, use defaults silently
    }
  }, []);

  const handleSaveSettings = () => {
    try {
      localStorage.setItem("fitforge-settings", JSON.stringify({
        weightUnit, lengthUnit, volumeUnit, ttsFeedback
      }));
    } catch (e) {
      // localStorage write failed silently
    }
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 1500);
  };

  const handleResetData = () => {
    try {
      localStorage.removeItem("fitforge-settings");
    } catch (e) {}
    setWeightUnit("kg");
    setLengthUnit("cm");
    setVolumeUnit("ml");
    setTtsFeedback(true);
    alert("All FitForge local settings and caches have been cleared!");
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Title */}
      <div className="flex flex-col space-y-1 select-none">
        <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
          System Settings
        </h2>
        <p className="text-xs text-muted-foreground">
          Configure measurement coefficients, audio coaching preferences, and clean database tables.
        </p>
      </div>

      <div className="space-y-6">
        {/* Card 1: Metric Scale Preferences */}
        <Card className="border-border bg-card select-none">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-xs text-primary font-bold">
              <Scale className="w-4 h-4" />
              <span>MEASUREMENT COEFFICIENTS</span>
            </div>
            <CardDescription className="text-xs">
              Define the default unit configurations calculated throughout workout tonnage, body fat scales, and water metrics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Weight Pref */}
            <div className="flex justify-between items-center text-xs">
              <div>
                <span className="font-semibold text-foreground block">Weight Scale</span>
                <span className="text-[10px] text-muted-foreground">Affects compounds load indices.</span>
              </div>
              <div className="flex bg-[#0A0A0B] p-1 rounded-lg border border-border">
                <button
                  onClick={() => setWeightUnit("kg")}
                  className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    weightUnit === "kg" ? "bg-primary text-primary-foreground neon-glow" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  kg
                </button>
                <button
                  onClick={() => setWeightUnit("lb")}
                  className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    weightUnit === "lb" ? "bg-primary text-primary-foreground neon-glow" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  lbs
                </button>
              </div>
            </div>

            {/* Length Pref */}
            <div className="flex justify-between items-center text-xs border-t border-border/40 pt-4">
              <div>
                <span className="font-semibold text-foreground block">Height & Length</span>
                <span className="text-[10px] text-muted-foreground">Affects Navy Body Fat body circumference metrics.</span>
              </div>
              <div className="flex bg-[#0A0A0B] p-1 rounded-lg border border-border">
                <button
                  onClick={() => setLengthUnit("cm")}
                  className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    lengthUnit === "cm" ? "bg-primary text-primary-foreground neon-glow" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  cm
                </button>
                <button
                  onClick={() => setLengthUnit("inch")}
                  className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    lengthUnit === "inch" ? "bg-primary text-primary-foreground neon-glow" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  inches
                </button>
              </div>
            </div>

            {/* Volume Pref */}
            <div className="flex justify-between items-center text-xs border-t border-border/40 pt-4">
              <div>
                <span className="font-semibold text-foreground block">Fluid Volumes</span>
                <span className="text-[10px] text-muted-foreground">Affects fluid targets and wave indicators.</span>
              </div>
              <div className="flex bg-[#0A0A0B] p-1 rounded-lg border border-border">
                <button
                  onClick={() => setVolumeUnit("ml")}
                  className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    volumeUnit === "ml" ? "bg-primary text-primary-foreground neon-glow" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ml
                </button>
                <button
                  onClick={() => setVolumeUnit("oz")}
                  className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    volumeUnit === "oz" ? "bg-primary text-primary-foreground neon-glow" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  fl oz
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Voice Cues Preference */}
        <Card className="border-border bg-card select-none">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-xs text-primary font-bold">
              <Volume2 className="w-4 h-4" />
              <span>VOICE FEEDBACK PREFERENCES</span>
            </div>
            <CardDescription className="text-xs">
              Toggle default client audio cues and text-to-speech spoken confirmations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <div>
                <span className="font-semibold text-foreground block">Text-to-Speech Confirmations</span>
                <span className="text-[10px] text-muted-foreground">
                  Aloud confirmations after completing hands-free voice-logged sets.
                </span>
              </div>
              <div className="flex bg-[#0A0A0B] p-1 rounded-lg border border-border">
                <button
                  onClick={() => setTtsFeedback(true)}
                  className={`px-3.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    ttsFeedback ? "bg-primary text-primary-foreground neon-glow" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setTtsFeedback(false)}
                  className={`px-3.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    !ttsFeedback ? "bg-primary text-primary-foreground neon-glow" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Muted
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Storage manager */}
        <Card className="border border-destructive/20 bg-destructive/[0.01] select-none">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-xs text-destructive font-bold">
              <Database className="w-4 h-4" />
              <span>LOCAL CACHE & SEED MANAGER</span>
            </div>
            <CardDescription className="text-xs">
              Reset system data, clear cached plan files, and wipe all local exercise performance indicators.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="text-xs space-y-0.5 text-center sm:text-left">
              <span className="font-semibold text-foreground block">System Factory Reset</span>
              <span className="text-[10px] text-muted-foreground leading-relaxed">
                Clears all weight averages, encrypted timeline photos, calorie trackers, and streaks.
              </span>
            </div>
            <Button
              variant="danger"
              onClick={handleResetData}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 h-9 font-bold text-xs uppercase cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Reset Cache
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Save Settings Trigger */}
      <div className="flex justify-end pt-2 select-none">
        <Button onClick={handleSaveSettings} className="h-10 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 w-full sm:w-auto">
          {saved ? <Check className="w-4 h-4 text-primary-foreground" /> : <Settings className="w-4 h-4" />}
          {saved ? "Settings Saved!" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
