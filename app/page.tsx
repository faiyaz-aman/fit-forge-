import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dumbbell, ArrowRight, ShieldCheck, Zap, Sparkles } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-foreground flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background ambient radial gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/3 blur-3xl" />

      {/* Navigation Header */}
      <header className="h-16 border-b border-border/40 backdrop-blur-sm z-10 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center font-bold text-primary-foreground text-xs neon-glow">
            F
          </div>
          <span className="font-sans font-bold text-sm tracking-wider uppercase">
            Fit<span className="text-primary">Forge</span>
          </span>
        </div>
        <Link href="/signin">
          <Button variant="ghost" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
            Sign In
          </Button>
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-3xl mx-auto z-10 space-y-8 py-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary uppercase tracking-widest text-[9px] neon-glow">
          <Sparkles className="w-3 h-3" />
          AI-Powered Strength Training
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight uppercase leading-none text-foreground leading-tight">
          FORGED IN <span className="text-primary">SCIENCE</span>,<br />
          BUILT FOR <span className="text-primary">RESULTS</span>
        </h1>

        <p className="text-xs md:text-sm text-muted-foreground max-w-md leading-relaxed">
          FitForge integrates high-fidelity workout parsing, micro-rest pacing, progressive overload suggestions, and direct AI nutrition analytics into a beautiful minimal shell.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-sm pt-2">
          <Link href="/signup" className="flex-1">
            <Button className="w-full h-11 flex items-center justify-center gap-2 group">
              Start Forging
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
          <Link href="/signin" className="flex-1">
            <Button variant="secondary" className="w-full h-11 border border-border">
              Sign In
            </Button>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 max-w-2xl text-left">
          <div className="space-y-2 border-t border-border/40 pt-4">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              AI Plan Parser
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Upload any training PDF, DOCX, or screenshot. Our AI instantly translates raw files into structured schedules.
            </p>
          </div>

          <div className="space-y-2 border-t border-border/40 pt-4">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Dumbbell className="w-4 h-4" />
              Coach Mode
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Immersive, full-screen exercise guidance with built-in rest ring alerts, plate loaders, and sound guides.
            </p>
          </div>

          <div className="space-y-2 border-t border-border/40 pt-4">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              Secure Metrics
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Track sleep, body fat, macro logs, and fully encrypted progress photos. Absolute control over your private records.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-14 border-t border-border/40 flex items-center justify-center text-[10px] text-muted-foreground tracking-wider uppercase font-mono">
        © 2026 FitForge Inc. All Rights Reserved.
      </footer>
    </div>
  );
}
