"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Sparkles,
  Send,
  User,
  Utensils,
  Dumbbell,
  Scale,
  Brain,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  sender: "user" | "coach";
  text: string;
  card?: {
    type: "workout" | "macros" | "recomp";
    title?: string;
    exercises?: Array<{ name: string; sets: string; reps: string; rest: string }>;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    stats?: Array<{ name: string; value: string; target: string }>;
  } | null;
  streaming?: boolean;
}

// Preset chips for rapid triggers
const presetChips = [
  { label: "Analyze CNS Fatigue", prompt: "Perform a CNS fatigue analysis and recommend if I need a deload week." },
  { label: "Bulk Macro Blueprint", prompt: "Generate a clean bulking macro target allocation for my profile." },
  { label: "Recomp Analytics", prompt: "Explain my latest body fat and recomposition progress trends." },
  { label: "Create PPL Routine", prompt: "Design an intense 3-day Push/Pull/Legs strength routine." },
];

function ChatContent() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "coach",
      text: "Forge your boundaries, champ! I am your real-time **FitForge AI Coach**. I have full context on your latest workout RPE trends, daily calorie intake logs, and Navy Body Fat estimations.\n\nWhat high-level training or recovery protocol are we optimizing today?",
      card: null,
    },
  ]);

  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of thread
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle URL search queries like `/chat?prompt=generate-deload-routine`
  useEffect(() => {
    const promptParam = searchParams?.get("prompt");
    if (promptParam) {
      let promptText = "";
      if (promptParam === "generate-deload-routine") {
        promptText = "Recommend a deload week split based on my high fatigue analytics.";
      } else {
        promptText = decodeURIComponent(promptParam);
      }
      handleSendMessage(promptText);
    }
  }, [searchParams]);

  // Simulates typewriter-style streaming of characters
  const simulateStreaming = (
    finalText: string,
    cardData: any,
    messageId: string
  ) => {
    let index = 0;
    const words = finalText.split(" ");
    
    // Add empty message to update
    setMessages((prev) => [
      ...prev,
      { id: messageId, sender: "coach", text: "", card: null, streaming: true },
    ]);

    const timer = setInterval(() => {
      if (index < words.length) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, text: words.slice(0, index + 1).join(" ") }
              : msg
          )
        );
        index++;
      } else {
        clearInterval(timer);
        // Complete stream & append cards
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, card: cardData, streaming: false }
              : msg
          )
        );
        setLoading(false);
      }
    }, 45); // highly smooth word-by-word streaming velocity
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    // Append User Message
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: textToSend,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: textToSend }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const coachMsgId = Math.random().toString();
          simulateStreaming(data.text, data.card, coachMsgId);
        }
      } else {
        throw new Error("API error");
      }
    } catch (err) {
      console.error("Failed to query AI Coach:", err);
      // Fallback message
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "coach",
          text: "I apologize, champ, my backend neural pathways encountered an issue. Let's try again in a moment.",
        },
      ]);
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputVal);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] md:h-[calc(100vh-5.5rem)] select-none">
      {/* Top Header Card */}
      <Card className="border-border bg-card shrink-0 select-none pb-3.5 pt-3.5 px-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                FITFORGE AI COACH TEAM
                <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest block">
                Elite Performance Coach • Active Context Sync
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Chat Thread Container */}
      <div className="flex-1 overflow-y-auto no-scrollbar pr-1 pl-1 space-y-4 mb-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 max-w-[85%] ${
                msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              {/* Profile Icon Badge */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border select-none ${
                  msg.sender === "user"
                    ? "bg-secondary/40 border-border text-foreground"
                    : "bg-primary/10 border-primary/20 text-primary"
                }`}
              >
                {msg.sender === "user" ? (
                  <User className="w-3.5 h-3.5" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Text Bubble */}
              <div className="space-y-3">
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-[#141416] border border-border text-foreground"
                  }`}
                >
                  {msg.text}
                  {msg.streaming && (
                    <span className="inline-block w-1.5 h-3 bg-primary ml-1 animate-pulse" />
                  )}
                </div>

                {/* DYNAMIC COMPONENT CARD RENDERER */}
                {msg.card && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-sm"
                  >
                    {/* CASE 1: Workout Split Table Card */}
                    {msg.card.type === "workout" && msg.card.exercises && (
                      <Card className="border border-primary/20 bg-card overflow-hidden">
                        <div className="bg-primary/5 px-3.5 py-2.5 border-b border-primary/10 flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-widest">
                          <Dumbbell className="w-3.5 h-3.5" />
                          <span>{msg.card.title || "Active Routine"}</span>
                        </div>
                        <CardContent className="p-3 space-y-2">
                          {msg.card.exercises.map((ex, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-[11px] border-b border-border/40 pb-1.5 last:border-b-0 last:pb-0"
                            >
                              <div className="space-y-0.5">
                                <span className="font-bold text-foreground block">{ex.name}</span>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {ex.sets} × {ex.reps}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-muted-foreground font-semibold">
                                Rest: {ex.rest}
                              </span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* CASE 2: Macros Calorie Target Bars Card */}
                    {msg.card.type === "macros" && (
                      <Card className="border border-primary/20 bg-card overflow-hidden">
                        <div className="bg-primary/5 px-3.5 py-2.5 border-b border-primary/10 flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-widest">
                          <Utensils className="w-3.5 h-3.5" />
                          <span>TARGET MACROS PROFILE</span>
                        </div>
                        <CardContent className="p-3.5 space-y-3.5">
                          <div className="flex justify-between items-baseline">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              Daily surfeit target
                            </span>
                            <span className="text-sm font-mono font-extrabold text-foreground tabular-nums">
                              {msg.card.calories} kcal
                            </span>
                          </div>
                          
                          {/* Protein progress */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-muted-foreground font-semibold">Protein</span>
                              <span className="font-mono text-foreground font-bold">{msg.card.protein}g</span>
                            </div>
                            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: "100%" }} />
                            </div>
                          </div>

                          {/* Carbs progress */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-muted-foreground font-semibold">Carbohydrates</span>
                              <span className="font-mono text-foreground font-bold">{msg.card.carbs}g</span>
                            </div>
                            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: "100%" }} />
                            </div>
                          </div>

                          {/* Fat progress */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-muted-foreground font-semibold">Fats</span>
                              <span className="font-mono text-foreground font-bold">{msg.card.fat}g</span>
                            </div>
                            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: "100%" }} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* CASE 3: Body Recomp Targets */}
                    {msg.card.type === "recomp" && msg.card.stats && (
                      <Card className="border border-primary/20 bg-card overflow-hidden">
                        <div className="bg-primary/5 px-3.5 py-2.5 border-b border-primary/10 flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-widest">
                          <Scale className="w-3.5 h-3.5" />
                          <span>{msg.card.title}</span>
                        </div>
                        <CardContent className="p-3 space-y-2">
                          {msg.card.stats.map((st, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[11px] py-1 border-b border-border/40 last:border-0">
                              <span className="font-semibold text-muted-foreground">{st.name}</span>
                              <div className="flex gap-3">
                                <span className="font-mono font-bold text-foreground">{st.value}</span>
                                <span className="font-mono text-muted-foreground font-semibold text-[10px]">
                                  (Target: {st.target})
                                </span>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {loading && !messages.some((m) => m.streaming) && (
          <div className="flex gap-2 items-center text-xs text-muted-foreground pl-10 select-none">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
            <span>AI Coach is compiling analytics...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input panel & presets */}
      <div className="shrink-0 space-y-4">
        {/* Preset chips for fast coaching guidance */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar select-none">
          {presetChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip.prompt)}
              className="flex items-center gap-1 px-3 py-1.5 border border-border bg-[#141416] hover:bg-secondary/40 hover:text-primary transition-all rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 cursor-pointer text-muted-foreground select-none"
            >
              <span>{chip.label}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          ))}
        </div>

        {/* Input box form */}
        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <Input
            required
            disabled={loading}
            placeholder="Type your athletic question (e.g. 'Explain my macro allocation')..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="flex-1 h-11 text-xs border border-border bg-card pr-3 pl-3"
          />
          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-11 p-0 shrink-0 flex items-center justify-center cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        Initializing AI Coach Context...
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
