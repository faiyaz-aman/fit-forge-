"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dumbbell, ArrowRight, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { hydrateLocalDataFromCloud } from "@/lib/supabase-db";
import { useEffect } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Unconditionally clear any stale Supabase auth tokens from localStorage
    // to prevent console warnings about invalid refresh tokens.
    if (typeof window !== "undefined") {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith("sb-") || key.includes("auth-token"))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      } catch (e) {}
    }

    const checkSession = async () => {
      const supabase = createClient();
      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const currentCookie = document.cookie
              .split("; ")
              .find(row => row.startsWith("fitforge-session="))
              ?.split("=")[1];
              
            if (currentCookie !== session.user.id) {
              if (typeof window !== "undefined") {
                localStorage.clear();
              }
              document.cookie = `fitforge-session=${session.user.id}; path=/; max-age=86400`;
              await hydrateLocalDataFromCloud();
            }
            window.location.href = "/home";
          }
        } catch (e) {}
      }
    };
    checkSession();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }
        
        if (data.user) {
          if (typeof window !== "undefined") {
            localStorage.clear();
          }
          document.cookie = `fitforge-session=${data.user.id}; path=/; max-age=86400`;
          await hydrateLocalDataFromCloud();
          window.location.href = "/home";
        }
      } else {
        // Safe local mock bypass
        document.cookie = "fitforge-session=active-mock-session; path=/; max-age=86400";
        setTimeout(() => {
          window.location.href = "/home";
        }, 1000);
      }
    } catch (err: any) {
      setError(err?.message || "Invalid email or password");
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B] p-4 relative overflow-hidden select-none">
      {/* Background ambient radial gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-primary/3 blur-3xl" />

      <div className="w-full max-w-[400px] z-10 space-y-6">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center space-y-2 mb-2">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center font-bold text-primary-foreground text-xl neon-glow mb-2">
            F
          </div>
          <h2 className="text-xl font-bold tracking-wider uppercase text-foreground">
            Fit<span className="text-primary">Forge</span>
          </h2>
          <p className="text-xs text-muted-foreground max-w-xs">
            Enter your credentials to forge your physique.
          </p>
        </div>

        {/* Login Panel */}
        <Card hoverGlow className="border-border bg-[#141416]/90 backdrop-blur">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Sign in with your registered email and password.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSignIn} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Email Address
                </label>
                <Input
                  required
                  type="email"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Password
                  </label>
                  <Link
                    href="/forgot"
                    className="text-[10px] text-primary hover:underline font-semibold"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    required
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-xs text-destructive font-medium">{error}</p>}

              <Button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 group mt-2"
              >
                {loading ? "Forging Session..." : "Sign In"}
                {!loading && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />}
              </Button>
            </form>

          </CardContent>
        </Card>

        {/* Footer Link */}
        <p className="text-center text-xs text-muted-foreground">
          New to FitForge?{" "}
          <Link href="/signup" className="text-primary hover:underline font-semibold">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}
