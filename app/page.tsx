"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";

export default function PremiumLandingPage() {
  const [spotlightPos, setSpotlightPos] = useState({ x: "50%", y: "50%" });
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showStickyCta, setShowStickyCta] = useState(false);
  
  // Real Dashboard Interactive States
  const [dashboardWater, setDashboardWater] = useState(3400);
  const [completedWorkouts, setCompletedWorkouts] = useState<string[]>([]);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  
  // Showcase Sticky Scroll States
  const showcaseRef = useRef<HTMLDivElement>(null);
  const [showcaseProgress, setShowcaseProgress] = useState(0);
  const [activeModule, setActiveModule] = useState(0);
  const [activeCaption, setActiveCaption] = useState<number | null>(null);
  const [phoneTransform, setPhoneTransform] = useState(
    "perspective(1000px) rotateX(15deg) rotateY(-20deg) scale(0.95)"
  );

  // Horizontal Protocol Scroll States
  const protocolRef = useRef<HTMLDivElement>(null);
  const switcherScrollRef = useRef<HTMLDivElement>(null);
  const [protocolProgress, setProtocolProgress] = useState(0);

  // Track screen size & scroll coordinates
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Update mouse spotlight & check scroll for sticky floating CTA
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setSpotlightPos({ x: `${x}%`, y: `${y}%` });
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleScrollThrottled = () => {
      setShowStickyCta(window.scrollY > 600);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScrollThrottled);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScrollThrottled);
    };
  }, []);

  // Reveal elements on viewport enter
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll(".reveal-on-scroll");
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  // Scroll animations listener (Phone showcase lock & horizontal protocol lock)
  useEffect(() => {
    const handleScroll = () => {
      // 1. Phone Showcase Sticky Scroll Frame
      if (showcaseRef.current) {
        const rect = showcaseRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        let progress = 0;
        if (rect.top <= 0) {
          progress = Math.min(1, Math.abs(rect.top) / (rect.height - windowHeight));
        }
        setShowcaseProgress(progress);

        if (rect.top < windowHeight && rect.bottom > 0) {
          // Keep phone aligned with smooth 3D perspective shifts
          let rotX = 15;
          let rotY = -20;
          let scale = 0.95;

          if (progress < 0.20) {
            // Phase 1: Intro Centered
            const ratio = progress / 0.20;
            rotX = 25 - ratio * 13; // 25 -> 12
            rotY = -30 + ratio * 18; // -30 -> -12
            scale = 0.85 + ratio * 0.20; // 0.85 -> 1.05
          } else if (progress >= 0.20 && progress < 0.35) {
            // Phase 2: Shifting
            const ratio = (progress - 0.20) / 0.15;
            rotX = 12 - ratio * 2; // 12 -> 10
            rotY = -12 - ratio * 3; // -12 -> -15
            scale = 1.05 - ratio * 0.05; // 1.05 -> 1.0
          } else {
            // Phase 3: Caption Lock
            const ratio = (progress - 0.35) / 0.65;
            rotX = 10 - ratio * 15; // 10 -> -5
            rotY = -15 + ratio * 30; // -15 -> 15
            scale = 1.0;
          }

          setPhoneTransform(
            `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`
          );

          // Intro delayed reveals: Text comes *after* phone starts locking in the center
          if (progress < 0.35) {
            setActiveCaption(null);
            setActiveModule(0);
          } else if (progress >= 0.35 && progress < 0.55) {
            setActiveCaption(0);
            setActiveModule(0);
          } else if (progress >= 0.55 && progress < 0.75) {
            setActiveCaption(1);
            setActiveModule(1);
          } else {
            setActiveCaption(2);
            setActiveModule(2);
          }
        }
      }

      // 2. Horizontal Protocol Lock Scroll Progress
      if (protocolRef.current) {
        const rect = protocolRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        let progress = 0;
        if (rect.top <= 0) {
          progress = Math.min(1, Math.abs(rect.top) / (rect.height - windowHeight));
        }
        setProtocolProgress(progress);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Interactive quick add water handler on mockup dashboard
  const handleAddWaterMock = (amount: number) => {
    setDashboardWater((prev) => Math.min(prev + amount, 5000));
  };

  // Toggle workout checklist items in mockup dashboard
  const toggleWorkoutMock = (item: string) => {
    if (completedWorkouts.includes(item)) {
      setCompletedWorkouts((prev) => prev.filter((i) => i !== item));
    } else {
      setCompletedWorkouts((prev) => [...prev, item]);
    }
  };

  // Magnetic Button effect coordinates calculations
  const handleMagneticMove = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px) scale(1.05)`;
  };

  const handleMagneticLeave = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    const btn = e.currentTarget;
    btn.style.transform = "translate(0px, 0px) scale(1)";
  };

  // Bento Card 3D Tilt calculation
  const handleCardTilt = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 25;
    const rotateY = (centerX - x) / 25;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleCardLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  };

  // Pricing Card mouse tracker for laser spotlight borders and 3D tilting
  const handlePricingMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    handleCardTilt(e);
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
  };

  // Scroll switcher handler (dynamic horizontal wheel/touch scroll selection)
  const handleSwitcherScroll = () => {
    if (switcherScrollRef.current) {
      const scrollLeft = switcherScrollRef.current.scrollLeft;
      const width = switcherScrollRef.current.clientWidth;
      if (scrollLeft > width / 3) {
        setBillingCycle("yearly");
      } else {
        setBillingCycle("monthly");
      }
    }
  };

  // Trigger smooth scroll alignment to billing cycle
  const scrollToCycle = (cycle: "monthly" | "yearly") => {
    if (switcherScrollRef.current) {
      const width = switcherScrollRef.current.clientWidth;
      switcherScrollRef.current.scrollTo({
        left: cycle === "monthly" ? 0 : width,
        behavior: "smooth"
      });
      setBillingCycle(cycle);
    }
  };

  // Calculate Showcase shifting metrics and opacities
  let phoneTranslateX = 0;
  let textOpacity = 0;
  if (!isMobile) {
    if (showcaseProgress < 0.20) {
      phoneTranslateX = -50;
      textOpacity = 0;
    } else if (showcaseProgress >= 0.20 && showcaseProgress < 0.35) {
      const ratio = (showcaseProgress - 0.20) / 0.15;
      phoneTranslateX = -50 + ratio * 50;
      textOpacity = ratio;
    } else {
      phoneTranslateX = 0;
      textOpacity = 1;
    }
  } else {
    phoneTranslateX = 0;
    textOpacity = 1;
  }

  // Calculate Protocol horizontal slide with 0.10 lock buffer (translated via vw)
  let protocolTranslate = 0;
  if (protocolProgress > 0.10) {
    const activeProgress = (protocolProgress - 0.10) / 0.90; // 0 to 1
    protocolTranslate = activeProgress * (isMobile ? 220 : 160);
  }

  return (
    <div className="bg-[#0A0F0D] text-[#dfe4e0] min-h-screen selection:bg-primary-container selection:text-on-primary-container font-body-md overflow-x-clip relative">
      
      {/* Sticky Compact Glassmorphic "Start Forging Free" Action Bar */}
      <div 
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 transform ${
          showStickyCta ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0 pointer-events-none"
        }`}
      >
        <Link 
          href="/signup"
          className="inline-flex items-center justify-center gap-2 bg-[#22f58c] text-[#00391b] font-label-mono text-[10px] md:text-[11px] uppercase tracking-widest font-extrabold px-6 py-3 rounded-full shadow-[0_8px_32px_rgba(34,245,140,0.3)] border border-[#22f58c]/30 backdrop-blur-md hover:bg-[#60ff99] hover:scale-105 active:scale-95 transition-all duration-300"
        >
          Start Forging Free
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>

      {/* Smooth Pointer Halo (No inner dot, highly liquid lag glide) */}
      <div 
        className="pointer-events-none fixed z-50 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#22f58c] opacity-20 blur-xl hidden md:block" 
        style={{ left: mousePos.x, top: mousePos.y }}
      />

      {/* Large Ambient Cursor Spotlight background */}
      <div 
        className="cursor-spotlight hidden md:block" 
        style={{ "--x": spotlightPos.x, "--y": spotlightPos.y } as React.CSSProperties}
      />

      {/* Small Sticky Glassmorphic Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-[#0f1412]/50 backdrop-blur-xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        <div className="flex justify-between items-center px-6 md:px-16 max-w-[1280px] mx-auto py-2.5">
          
          {/* Logo */}
          <a href="#" className="font-headline-md text-2xl font-extrabold text-[#dfe4e0] tracking-tighter flex items-center gap-2">
            <span className="material-symbols-outlined text-[#22f58c] text-[24px]" style={{ fontVariationSettings: '"FILL" 1' }}>
              fitness_center
            </span>
            FitForge
          </a>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8 font-label-mono text-[11px] tracking-widest uppercase font-semibold">
            <a href="#showcase" className="text-[#8A9590] hover:text-[#22f58c] transition-colors duration-300">Showcase</a>
            <a href="#features" className="text-[#8A9590] hover:text-[#22f58c] transition-colors duration-300">Features</a>
            <a href="#protocol" className="text-[#8A9590] hover:text-[#22f58c] transition-colors duration-300">Protocol</a>
            <a href="#pricing" className="text-[#8A9590] hover:text-[#22f58c] transition-colors duration-300">Pricing</a>
          </div>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-6 font-label-mono text-[11px] uppercase tracking-widest font-semibold">
            <Link href="/signin" className="text-[#dfe4e0] hover:text-[#22f58c] transition-colors">
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="bg-[#22f58c] text-[#00391b] px-5 py-2 rounded-full font-bold hover:bg-[#60ff99] transition-all hover:shadow-[0_0_15px_rgba(34,245,140,0.4)] magnetic-btn"
              onMouseMove={handleMagneticMove}
              onMouseLeave={handleMagneticLeave}
            >
              Start Free
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden text-[#22f58c] focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="material-symbols-outlined text-[24px]">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0A0F0D]/95 backdrop-blur-md border-b border-white/10 px-6 py-6 flex flex-col gap-4 font-label-mono text-xs uppercase tracking-widest font-bold">
            <a 
              href="#showcase" 
              className="text-[#dfe4e0] hover:text-[#22f58c] py-1.5"
              onClick={() => setMobileMenuOpen(false)}
            >
              Showcase
            </a>
            <a 
              href="#features" 
              className="text-[#dfe4e0] hover:text-[#22f58c] py-1.5"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </a>
            <a 
              href="#protocol" 
              className="text-[#dfe4e0] hover:text-[#22f58c] py-1.5"
              onClick={() => setMobileMenuOpen(false)}
            >
              Protocol
            </a>
            <a 
              href="#pricing" 
              className="text-[#dfe4e0] hover:text-[#22f58c] py-1.5"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </a>
            <hr className="border-white/10 my-2" />
            <Link 
              href="/signin" 
              className="text-[#dfe4e0] py-2 hover:text-[#22f58c]"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="bg-[#22f58c] text-[#00391b] text-center py-3 rounded-full font-bold hover:bg-[#60ff99] transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Start Free
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 overflow-hidden dot-matrix-bg">
        <div className="max-w-[1280px] mx-auto px-6 md:px-16 grid md:grid-cols-12 gap-8 items-center relative z-10 w-full">
          
          {/* Content Column */}
          <div className="md:col-span-7 flex flex-col items-start gap-8 z-20">
            
            {/* Pill Badge */}
            <div className="reveal-on-scroll inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1c211e]/60 backdrop-blur-md border border-white/5 shadow-sm">
              <span className="material-symbols-outlined text-[#22f58c] text-[16px]">bolt</span>
              <span className="font-label-mono text-[10px] md:text-xs text-[#dfe4e0] tracking-widest uppercase font-semibold">
                AI-Powered Strength Training
              </span>
            </div>

            {/* Headline */}
            <h1 className="reveal-on-scroll font-hero-xl-mobile md:font-hero-xl text-[48px] md:text-[88px] font-extrabold tracking-tighter text-[#dfe4e0] uppercase leading-[52px] md:leading-[88px]">
              FORGED IN SCIENCE, BUILT FOR <span className="text-[#22f58c] drop-shadow-[0_0_15px_rgba(34,245,140,0.5)]">RESULTS.</span>
            </h1>

            {/* Subheadline */}
            <p className="reveal-on-scroll font-body-lg text-lg text-[#8A9590] max-w-xl leading-relaxed">
              The only training app that parses any PDF plan, paces your micro-rests, and evolves with your lifts — powered by AI.
            </p>

            {/* CTAs */}
            <div className="reveal-on-scroll flex flex-wrap items-center gap-4 mt-2">
              <Link 
                href="/signup" 
                className="bg-[#22f58c] text-[#00391b] font-label-mono text-[10px] md:text-xs uppercase tracking-widest px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-[#60ff99] hover:shadow-[0_0_20px_rgba(34,245,140,0.5)] z-10 transition-all magnetic-btn"
                onMouseMove={handleMagneticMove}
                onMouseLeave={handleMagneticLeave}
              >
                Start Forging 
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </Link>
              <a 
                href="#showcase" 
                className="bg-transparent text-[#dfe4e0] border border-white/10 font-label-mono text-[10px] md:text-xs uppercase tracking-widest px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-[#262b29] transition-colors z-10 relative"
              >
                Watch Demo
                <span className="material-symbols-outlined text-[20px]">play_arrow</span>
              </a>
            </div>

            {/* Trust Row */}
            <div className="reveal-on-scroll flex flex-wrap items-center gap-4 mt-8 pt-6 border-t border-white/10 font-label-mono text-xs text-[#8A9590]">
              <div className="flex items-center text-[#22f58c]">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>star_half</span>
              </div>
              <span className="font-bold text-[#dfe4e0]">4.9</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/10"></span>
              <span>24k+ athletes</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/10"></span>
              <span>Featured in Men&apos;s Health</span>
            </div>

          </div>

          {/* Image Column */}
          <div className="md:col-span-5 relative mt-12 md:mt-0 flex justify-center z-10">
            <div className="absolute inset-0 bg-[#22f58c]/20 blur-[100px] rounded-full pointer-events-none w-3/4 h-3/4 m-auto"></div>
            <img 
              alt="Futuristic titanium dumbbell floating mockup" 
              className="animate-float relative z-10 w-full max-w-[450px] h-auto object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] filter contrast-125 saturate-50 rounded-2xl border border-white/10" 
              src="https://lh3.googleusercontent.com/aida/ADBb0ui2_2yTrgA_cH7fYaxEFSPZt8w-bKJIzc4OWdsgPTjWM3e839L7VQoJyerf_R18mSO67eK-2bGmRN14ZRwibW8Ih2K2vvYmykmaXnJMhIkf5Q28siLHSOuGyDSm71Fq5kQI4rY9kmCX_zCq97loKZQGmLSpNAdinopBD_aNTGo5pnMKMvnQIQUZ6QsAGsyr8EQoQAaXPpQDeTBAvlPXENpWibZkO1HY7QQ3KXJwj1jW_MaHQL7Imz-kHhiC"
            />
          </div>

        </div>
      </section>

      {/* 3D Phone Mockup Showcase (Locked Sticky Scroll) */}
      <section ref={showcaseRef} className="sticky-container relative bg-[#0A0F0D] border-t border-white/5" id="showcase">
        <div className="spotlight-bg absolute inset-0 z-0 pointer-events-none"></div>
        
        {/* Sticky inner viewport container */}
        <div className="sticky-content z-10 w-full px-6 md:px-16 max-w-[1280px] mx-auto flex items-center">
          <div className="grid md:grid-cols-12 gap-8 items-center w-full relative">
            
            {/* Left Column: Stacked text captions that fade/reveals sequentially */}
            <div 
              className="md:col-span-6 relative h-[250px] md:h-[350px] flex flex-col justify-center transition-all duration-500 ease-out"
              style={{ opacity: textOpacity } as React.CSSProperties}
            >
              
              {/* Caption 0: Telemetry */}
              <div 
                className={`absolute inset-0 flex flex-col justify-center transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) transform ${
                  activeCaption === 0 
                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" 
                    : "opacity-0 translate-y-6 scale-95 pointer-events-none"
                }`}
              >
                <span className="font-label-mono text-xs text-[#22f58c] uppercase block mb-3 font-extrabold tracking-widest">Telemetry Metrics</span>
                <h2 className="font-headline-lg text-4xl md:text-5xl font-extrabold text-[#dfe4e0] mb-4">Track every rep.</h2>
                <p className="font-body-md text-sm md:text-base text-[#8A9590] leading-relaxed max-w-lg">
                  Engineered precision captures velocity, range of motion, and load in real-time. Experience cyberpunk gym metrics natively designed to fuel performance.
                </p>
              </div>

              {/* Caption 1: Recovery */}
              <div 
                className={`absolute inset-0 flex flex-col justify-center transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) transform ${
                  activeCaption === 1 
                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" 
                    : "opacity-0 translate-y-6 scale-95 pointer-events-none"
                }`}
              >
                <span className="font-label-mono text-xs text-[#22f58c] uppercase block mb-3 font-extrabold tracking-widest">Biometric Windows</span>
                <h2 className="font-headline-lg text-4xl md:text-5xl font-extrabold text-[#dfe4e0] mb-4">Pace every rest.</h2>
                <p className="font-body-md text-sm md:text-base text-[#8A9590] leading-relaxed max-w-lg">
                  Bio-feedback heart rate algorithms calculate optimal rest and recovery windows between sets. Strict auditory signals prevent premature output drops.
                </p>
              </div>

              {/* Caption 2: Analytics */}
              <div 
                className={`absolute inset-0 flex flex-col justify-center transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) transform ${
                  activeCaption === 2 
                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" 
                    : "opacity-0 translate-y-6 scale-95 pointer-events-none"
                }`}
              >
                <span className="font-label-mono text-xs text-[#22f58c] uppercase block mb-3 font-extrabold tracking-widest">Overload Engine</span>
                <h2 className="font-headline-lg text-4xl md:text-5xl font-extrabold text-[#dfe4e0] mb-4">Visualize every gain.</h2>
                <p className="font-body-md text-sm md:text-base text-[#8A9590] leading-relaxed max-w-lg">
                  Your raw mechanical data, refined into progressive actionable intelligence. Calculates overload multipliers based on velocity dropoffs automatically.
                </p>
              </div>

            </div>

            {/* Right Column: Phone Mockup stops and rotates in view */}
            <div 
              className="md:col-span-6 flex justify-center relative transition-transform duration-500 ease-out"
              style={{ transform: `translateX(${phoneTranslateX}%)` } as React.CSSProperties}
            >
              <div 
                className="relative w-[280px] h-[550px] md:w-[350px] md:h-[700px] z-10 transition-transform duration-500 ease-out" 
                style={{ transform: phoneTransform } as React.CSSProperties}
              >
                <div className="absolute inset-0 bg-[#262b29] rounded-[3rem] border-4 border-[#313633] shadow-2xl overflow-hidden flex flex-col">
                  
                  {/* Dynamic Island Notch */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-1/3 h-5 bg-[#0a0f0d] rounded-full z-30"></div>
                  
                  {/* Screen Content */}
                  <div className="flex-1 bg-[#0a0f0d] p-6 pt-12 flex flex-col gap-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#22f58c]/10 via-[#0a0f0d] to-[#0a0f0d] pointer-events-none"></div>
                    
                    {/* Screen Module 1: Workout Active */}
                    <div className={`phone-module flex flex-col gap-6 ${activeModule === 0 ? "active" : ""}`}>
                      <div className="flex justify-between items-center z-10">
                        <div className="font-label-mono text-[10px] text-[#22f58c] font-bold">WORKOUT_ACTIVE</div>
                        <span className="material-symbols-outlined text-[#dfe4e0] text-sm">battery_full</span>
                      </div>
                      <div className="z-10 mt-4">
                        <h3 className="font-stat-display text-lg text-[#dfe4e0] mb-1 font-bold">Bench Press</h3>
                        <div className="text-5xl font-extrabold tracking-tighter text-gradient">
                          225<span className="text-xl text-[#8A9590] ml-1 font-normal">LBS</span>
                        </div>
                      </div>
                      
                      {/* Velocity chart */}
                      <div className="flex-1 z-10 relative mt-4 border border-white/5 rounded-xl p-4 bg-[#0f1412]/50 backdrop-blur-sm h-40 flex flex-col justify-between">
                        <div className="font-label-mono text-[10px] text-[#8A9590]">VELOCITY PROFILE</div>
                        <div className="h-20 flex items-end justify-between gap-1 mt-2">
                          <div className="w-full bg-[#22f58c]/20 rounded-t-sm h-[40%]"></div>
                          <div className="w-full bg-[#22f58c]/40 rounded-t-sm h-[60%]"></div>
                          <div className="w-full bg-[#22f58c]/80 rounded-t-sm h-[85%] relative">
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#22f58c] rounded-full shadow-[0_0_8px_#22F58C]"></div>
                          </div>
                          <div className="w-full bg-[#22f58c]/30 rounded-t-sm h-[50%]"></div>
                          <div className="w-full bg-[#22f58c]/15 rounded-t-sm h-[30%]"></div>
                        </div>
                      </div>
                    </div>

                    {/* Screen Module 2: Rest Recovery */}
                    <div className={`phone-module flex flex-col gap-6 ${activeModule === 1 ? "active" : ""}`}>
                      <div className="flex justify-between items-center z-10">
                        <div className="font-label-mono text-[10px] text-[#22f58c] font-bold">REST_WINDOW</div>
                        <span className="material-symbols-outlined text-[#dfe4e0] text-sm">vibration</span>
                      </div>
                      <div className="z-10 mt-6 text-center">
                        <div className="relative w-36 h-36 mx-auto">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" fill="transparent" r="45" stroke="rgba(255,255,255,0.06)" strokeWidth="4"></circle>
                            <circle cx="50" cy="50" fill="transparent" r="45" stroke="#22f58c" strokeDasharray="283" strokeDashoffset="140" strokeWidth="4"></circle>
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-extrabold text-[#dfe4e0]">0:45</span>
                            <span className="font-label-mono text-[10px] text-[#22f58c]">RECOVERY</span>
                          </div>
                        </div>
                      </div>
                      <div className="z-10 bg-[#262b29]/50 p-4 rounded-xl border border-white/5">
                        <div className="flex justify-between items-center mb-2 text-xs">
                          <span className="text-[#dfe4e0]">Heart Rate</span>
                          <span className="font-label-mono text-[#22f58c] font-bold">142 BPM</span>
                        </div>
                        <div className="w-full bg-[#313633] h-1 rounded-full overflow-hidden">
                          <div className="bg-[#22f58c] h-full w-2/3"></div>
                        </div>
                      </div>
                    </div>

                    {/* Screen Module 3: Analytics Summary */}
                    <div className={`phone-module flex flex-col gap-4 ${activeModule === 2 ? "active" : ""}`}>
                      <div className="flex justify-between items-center z-10">
                        <div className="font-label-mono text-[10px] text-[#22f58c] font-bold">SYSTEM_REPORT</div>
                        <span className="material-symbols-outlined text-[#dfe4e0] text-sm">insights</span>
                      </div>
                      <div className="z-10 mt-2">
                        <h3 className="font-stat-display text-sm text-[#dfe4e0] mb-2 font-bold">Performance Yield</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-[#262b29] p-3 rounded-lg border border-white/5">
                            <div className="text-[#8A9590] text-[9px] uppercase font-label-mono">Volume</div>
                            <div className="text-[#dfe4e0] text-xs font-bold">14,250 lbs</div>
                          </div>
                          <div className="bg-[#262b29] p-3 rounded-lg border border-white/5">
                            <div className="text-[#8A9590] text-[9px] uppercase font-label-mono">Avg Vel</div>
                            <div className="text-[#22f58c] text-xs font-bold">0.65 m/s</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 z-10 border border-[#22f58c]/20 rounded-xl p-4 bg-[#22f58c]/5 mt-1 flex flex-col justify-center">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="material-symbols-outlined text-[#22f58c] text-xs">auto_awesome</span>
                          <span className="font-label-mono text-[#22f58c] text-[9px] font-bold">AI SUGGESTION</span>
                        </div>
                        <p className="text-[11px] text-[#dfe4e0] leading-relaxed">
                          Increase Bench Press load by 2.5% next session. Velocity loss remains under threshold.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section className="py-24 md:py-36 px-6 md:px-16 bg-[#0a0f0d] relative z-20 border-t border-white/5" id="features">
        <div className="max-w-[1280px] mx-auto">
          
          <div className="mb-20 md:w-2/3 reveal-on-scroll">
            <span className="font-label-mono text-[#22f58c] text-xs uppercase block mb-3 font-semibold tracking-widest">Diagnostics Suite</span>
            <h2 className="font-headline-lg text-4xl md:text-6xl font-extrabold text-[#dfe4e0] mb-6 leading-tight">
              Engineered for <br /><span className="text-gradient">peak output.</span>
            </h2>
            <p className="font-body-lg text-lg text-[#8A9590] leading-relaxed max-w-2xl">
              We don&apos;t do generic templates. FitForge uses kinetic data and machine learning to parse, construct, and evolve your training protocol.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(320px,_auto)]">
            
            {/* Card A: AI Plan Parser */}
            <div 
              className="bento-card rounded-2xl p-8 md:col-span-8 md:row-span-2 flex flex-col md:flex-row gap-8 group reveal-on-scroll"
              onMouseMove={handleCardTilt}
              onMouseLeave={handleCardLeave}
            >
              <div className="flex-1 flex flex-col justify-between z-10">
                <div>
                  <span className="font-label-mono text-[10px] text-[#22f58c] font-bold mb-4 inline-block px-3 py-1 bg-[#22f58c]/10 border border-[#22f58c]/20 rounded-full">
                    SYSTEM.PARSE
                  </span>
                  <h3 className="font-headline-md text-2xl md:text-3xl font-extrabold text-[#dfe4e0] mb-4">
                    AI Plan Parser
                  </h3>
                  <p className="font-body-md text-sm md:text-base text-[#8A9590] leading-relaxed">
                    Upload any PDF, screenshot, or spreadsheet. Our neural net extracts sets, reps, and tempos, instantly translating them into a structured digital protocol.
                  </p>
                </div>
                <Link 
                  href="/signup" 
                  className="mt-8 px-5 py-2.5 border border-white/10 rounded-full text-[#dfe4e0] font-label-mono text-xs w-max hover:border-[#22f58c] hover:text-[#22f58c] transition-colors flex items-center gap-2 uppercase font-semibold"
                >
                  Learn More <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>

              {/* Graphic container */}
              <div className="flex-1 relative min-h-[220px] bg-[#262b29]/50 rounded-xl border border-white/5 overflow-hidden flex items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center p-6">
                  
                  {/* Floating PDF document */}
                  <div className="w-20 h-28 bg-[#0f1412] border border-[#8A9590]/30 rounded-md absolute left-1/4 -translate-x-1/2 rotate-[-10deg] shadow-lg flex flex-col p-3 gap-2 opacity-50 group-hover:-translate-y-2 transition-transform duration-500">
                    <div className="w-7 h-7 bg-[#FF5C5C]/20 rounded-sm mb-1 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#FF5C5C] text-sm">picture_as_pdf</span>
                    </div>
                    <div className="w-full h-1 bg-[#8A9590]/20 rounded-full"></div>
                    <div className="w-3/4 h-1 bg-[#8A9590]/20 rounded-full"></div>
                  </div>

                  {/* Flow Arrow */}
                  <span className="material-symbols-outlined text-[#22f58c] text-3xl z-10 mx-4 bg-[#0f1412] p-2.5 rounded-full border border-[#22f58c]/30 shadow-[0_0_15px_rgba(34,245,140,0.2)]">
                    arrow_forward
                  </span>

                  {/* Dynamic digital card */}
                  <div className="w-28 h-28 bg-[#0f1412] border border-[#22f58c]/50 rounded-md absolute right-1/4 translate-x-1/2 rotate-[5deg] shadow-[0_0_20px_rgba(34,245,140,0.1)] flex flex-col p-2.5 group-hover:-translate-y-2 transition-transform duration-500 delay-100">
                    <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-1.5">
                      <span className="material-symbols-outlined text-[#22f58c] text-xs">calendar_month</span>
                      <div className="w-3 h-1 bg-[#22f58c] rounded-full"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-1 flex-1">
                      <div className="bg-[#22f58c]/20 rounded-sm"></div>
                      <div className="bg-[#313633] rounded-sm"></div>
                      <div className="bg-[#22f58c]/20 rounded-sm"></div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Card B: Coach Mode */}
            <div 
              className="bento-card rounded-2xl p-6 md:col-span-4 md:row-span-1 flex flex-col justify-between group z-10 reveal-on-scroll"
              onMouseMove={handleCardTilt}
              onMouseLeave={handleCardLeave}
            >
              <div>
                <span className="material-symbols-outlined text-[#22f58c] mb-4 text-3xl">timer</span>
                <h3 className="font-stat-display text-xl font-bold text-[#dfe4e0] mb-2">Coach Mode</h3>
                <p className="font-body-md text-xs text-[#8A9590] leading-relaxed">
                  Strict auditory cues and visual haptics ensure you never miss a rest window.
                </p>
              </div>
              <div className="mt-6 flex justify-center">
                <div className="relative w-28 h-28">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" fill="transparent" r="45" stroke="rgba(255,255,255,0.06)" strokeWidth="6"></circle>
                    <circle className="transition-all duration-1000 ease-out" cx="50" cy="50" fill="transparent" r="45" stroke="#22F58C" strokeDasharray="283" strokeDashoffset="180" strokeWidth="6"></circle>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="font-label-mono text-[9px] text-[#22f58c]">REST</span>
                    <span className="font-stat-display text-base text-[#dfe4e0] font-bold">0:45</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card C: Local First */}
            <div 
              className="bento-card rounded-2xl p-6 md:col-span-4 md:row-span-1 flex flex-col justify-between z-10 reveal-on-scroll"
              onMouseMove={handleCardTilt}
              onMouseLeave={handleCardLeave}
            >
              <div>
                <span className="material-symbols-outlined text-[#22f58c] mb-4 text-3xl">database</span>
                <h3 className="font-stat-display text-xl font-bold text-[#dfe4e0] mb-2">Local First</h3>
                <p className="font-body-md text-xs text-[#8A9590] leading-relaxed">
                  Your kinetic data is stored locally. No cloud latency when you&apos;re in the zone.
                </p>
              </div>
              <div className="mt-6 border-t border-white/5 pt-4 flex items-center justify-between">
                <span className="font-label-mono text-[9px] text-[#8A9590] uppercase font-bold">Sync Status</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#22f58c] shadow-[0_0_8px_#22f58c] animate-pulse"></div>
                  <span className="font-label-mono text-[9px] text-[#22f58c] font-bold">OFFLINE SECURE</span>
                </div>
              </div>
            </div>

            {/* Card D: Progressive Overload AI */}
            <div 
              className="bento-card rounded-2xl p-8 md:col-span-8 md:row-span-1 flex flex-col md:flex-row gap-8 items-center group z-10 reveal-on-scroll"
              onMouseMove={handleCardTilt}
              onMouseLeave={handleCardLeave}
            >
              <div className="flex-1">
                <span className="font-label-mono text-xs text-[#22f58c] mb-2 block font-semibold">ALGORITHM</span>
                <h3 className="font-headline-md text-2xl font-extrabold text-[#dfe4e0] mb-3">Progressive Overload AI</h3>
                <p className="font-body-md text-sm text-[#8A9590] leading-relaxed">
                  Stop guessing weights. Our algorithm calculates precise micro-loads based on velocity degradation.
                </p>
              </div>
              
              {/* Vector graph */}
              <div className="flex-1 w-full h-28 relative">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 200 100">
                  <defs>
                    <linearGradient id="lineGrad" x1="0%" x2="100%" y1="0%" y2="0%">
                      <stop offset="0%" stopColor="rgba(34,245,140,0.2)"></stop>
                      <stop offset="100%" stopColor="#22F58C"></stop>
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur result="coloredBlur" stdDeviation="3"></feGaussianBlur>
                      <feMerge>
                        <feMergeNode in="coloredBlur"></feMergeNode>
                        <feMergeNode in="SourceGraphic"></feMergeNode>
                      </feMerge>
                    </filter>
                  </defs>
                  <line stroke="rgba(255,255,255,0.05)" strokeWidth="1" x1="0" x2="200" y1="25" y2="25"></line>
                  <line stroke="rgba(255,255,255,0.05)" strokeWidth="1" x1="0" x2="200" y1="50" y2="50"></line>
                  <path className="group-hover:stroke-[3px] transition-all duration-300" d="M0,80 Q20,70 40,75 T80,50 T120,40 T160,20 T200,10" fill="none" filter="url(#glow)" stroke="url(#lineGrad)" strokeWidth="2"></path>
                  <circle cx="200" cy="10" fill="#22F58C" r="4.5"></circle>
                </svg>
              </div>
            </div>

          </div>
          
        </div>
      </section>

      {/* System Architecture Protocol Sticky Scroll-Locked horizontal section (left-aligned fix!) */}
      <section ref={protocolRef} className="relative bg-[#0A0F0D] border-t border-white/5 sticky-container" id="protocol">
        <div className="sticky-content flex flex-col justify-center items-start overflow-hidden">
          
          <div className="w-full max-w-[1280px] mx-auto px-6 md:px-16 mb-12 flex flex-col justify-center">
            <p className="font-label-mono text-xs text-[#22f58c] mb-2 uppercase tracking-widest font-bold">System Architecture</p>
            <h2 className="font-headline-lg text-4xl md:text-5xl font-extrabold text-[#dfe4e0] uppercase leading-none">THE PROTOCOL</h2>
          </div>

          {/* Sliding horizontal container locked on scroll - start from 01 horizontally! */}
          <div className="w-full flex justify-start overflow-visible">
            <div 
              className="flex gap-6 px-6 md:px-16 w-max min-w-max flex-shrink-0 transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${protocolTranslate}vw)` } as React.CSSProperties}
            >
              {/* Step 01 */}
              <div 
                className="min-w-[280px] md:min-w-[380px] flex-shrink-0 glass-panel rounded-xl p-8 hover:-translate-y-1 transition-transform duration-300 group"
                onMouseMove={handleCardTilt}
                onMouseLeave={handleCardLeave}
              >
                <div className="font-hero-xl text-[64px] md:text-[88px] font-extrabold text-outline-neon leading-none mb-6 group-hover:opacity-100 transition-opacity">01</div>
                <h3 className="font-headline-md text-xl md:text-2xl font-bold mb-4 text-[#dfe4e0]">Upload your plan</h3>
                <p className="font-body-md text-sm text-[#8A9590] leading-relaxed">
                  Import your current regimen or select a pre-forged protocol from our elite database. The system immediately analyzes volume and intensity metrics.
                </p>
              </div>

              {/* Step 02 */}
              <div 
                className="min-w-[280px] md:min-w-[380px] flex-shrink-0 glass-panel rounded-xl p-8 hover:-translate-y-1 transition-transform duration-300 group"
                onMouseMove={handleCardTilt}
                onMouseLeave={handleCardLeave}
              >
                <div className="font-hero-xl text-[64px] md:text-[88px] font-extrabold text-outline-neon leading-none mb-6 group-hover:opacity-100 transition-opacity">02</div>
                <h3 className="font-headline-md text-xl md:text-2xl font-bold mb-4 text-[#dfe4e0]">Execute with precision</h3>
                <p className="font-body-md text-sm text-[#8A9590] leading-relaxed">
                  Log sets, reps, and RPE via the tactile interface. Our algorithm adjusts rest periods dynamically based on your real-time heart rate feedback.
                </p>
              </div>

              {/* Step 03 */}
              <div 
                className="min-w-[280px] md:min-w-[380px] flex-shrink-0 glass-panel rounded-xl p-8 hover:-translate-y-1 transition-transform duration-300 group"
                onMouseMove={handleCardTilt}
                onMouseLeave={handleCardLeave}
              >
                <div className="font-hero-xl text-[64px] md:text-[88px] font-extrabold text-outline-neon leading-none mb-6 group-hover:opacity-100 transition-opacity">03</div>
                <h3 className="font-headline-md text-xl md:text-2xl font-bold mb-4 text-[#dfe4e0]">Fuel &amp; Recovery</h3>
                <p className="font-body-md text-sm text-[#8A9590] leading-relaxed">
                  Sync macros and sleep data. FitForge correlates your nutritional input with your mechanical output to predict optimal recovery windows.
                </p>
              </div>

              {/* Step 04 */}
              <div 
                className="min-w-[280px] md:min-w-[380px] flex-shrink-0 glass-panel rounded-xl p-8 hover:-translate-y-1 transition-transform duration-300 group"
                onMouseMove={handleCardTilt}
                onMouseLeave={handleCardLeave}
              >
                <div className="font-hero-xl text-[64px] md:text-[88px] font-extrabold text-outline-neon leading-none mb-6 group-hover:opacity-100 transition-opacity">04</div>
                <h3 className="font-headline-md text-xl md:text-2xl font-bold mb-4 text-[#22f58c]">Watch progress compound</h3>
                <p className="font-body-md text-sm text-[#8A9590] leading-relaxed">
                  Observe physical changes quantified in cold, hard data. Volume trends, 1RM projections, and systemic load visualized in your command center.
                </p>
              </div>

              {/* Padding gap spacer */}
              <div className="min-w-[16px] md:min-w-[64px] flex-shrink-0"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Real Dashboard Command Center Mockup (Quantified Physique) */}
      <section className="py-24 md:py-36 relative overflow-hidden bg-[#0A0F0D] border-t border-white/5">
        <div className="glow-spotlight top-1/2 right-0 -translate-y-1/2 translate-x-1/4"></div>
        
        <div className="max-w-[1280px] mx-auto px-6 md:px-16 text-center mb-20 relative z-10 reveal-on-scroll">
          <span className="font-label-mono text-[#22f58c] text-xs uppercase block mb-3 font-semibold tracking-widest">Operator Console</span>
          <h2 className="font-headline-lg text-4xl md:text-6xl font-extrabold mb-6 leading-none">
            YOUR ENTIRE PHYSIQUE,<br /><span className="text-[#22f58c]">QUANTIFIED.</span>
          </h2>
          <p className="font-body-lg text-base md:text-lg text-[#8A9590] max-w-2xl mx-auto leading-relaxed">
            Experience your exact real dashboard enhanced with diagnostic tactical indicators, interactive logs, and neon progressive overloading trackers.
          </p>
        </div>

        {/* 3D Dashboard Mockup Container */}
        <div className="max-w-[1080px] mx-auto px-6 relative perspective-1000 z-10 reveal-on-scroll">
          <div className="dash-perspective glass-panel rounded-xl p-6 md:p-8 border border-[#22f58c]/25 shadow-[0_0_60px_rgba(34,245,140,0.15)] relative">
            
            {/* Operator Greeting & Streak info */}
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 border-b border-white/5 pb-6 gap-4">
              <div>
                <h3 className="font-stat-display text-lg md:text-2xl font-bold tracking-tight text-[#dfe4e0]">
                  Forge Your Body, <span className="text-[#22f58c]">Operator J. Doe_042</span>
                </h3>
                <p className="font-label-mono text-[10px] md:text-xs text-[#8A9590] mt-1">
                  Monday, June 1 — Consistency builds champions. You are on a <span className="text-[#22f58c] font-bold font-mono">14</span>-day streak!
                </p>
              </div>
              <div className="flex items-center gap-2 self-start md:self-auto">
                <span className="px-3.5 py-1 bg-[#0a0f0d] rounded-full border border-white/5 font-label-mono text-[10px] text-[#8A9590] flex items-center gap-2 font-bold tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-[#22f58c] animate-pulse"></span> SYSTEM SECURED
                </span>
              </div>
            </div>

            {/* Dashboard grid reflecting real split setup */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LEFT COLUMN: Active Workout Split & Hydration Log */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Active Workout Card */}
                <div className="glass-panel border border-[#22f58c]/20 bg-[#0a0f0d]/40 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                  <div className="flex items-center justify-between z-10 mb-4">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#22f58c] bg-[#22f58c]/10 border border-[#22f58c]/20 px-2 py-0.5 rounded flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22f58c] animate-pulse"></span> Today&apos;s Split
                    </span>
                    <span className="text-xs font-semibold text-[#8A9590] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[#FF5C5C] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                      ~450 kcal
                    </span>
                  </div>

                  <div className="z-10 flex-1">
                    <h4 className="font-stat-display text-lg font-bold text-[#dfe4e0] uppercase tracking-wider mb-2">
                      Hypertrophy Block A: Legs
                    </h4>
                    <p className="text-xs text-[#8A9590] mb-4">
                      Targeting Quads, Glutes &amp; Calves. Click items to log complete.
                    </p>

                    {/* Exercise List checklist */}
                    <div className="space-y-2.5 border-l border-white/10 pl-4 py-1.5">
                      {[
                        "Barbell Back Squats (4 Sets × 8 Reps)",
                        "Leg Press (3 Sets × 12 Reps)",
                        "Seated Calf Raises (4 Sets × 15 Reps)"
                      ].map((item, index) => (
                        <div 
                          key={index}
                          onClick={() => toggleWorkoutMock(item)}
                          className="flex items-center justify-between text-xs text-[#8A9590] cursor-pointer hover:text-[#22f58c] transition-colors select-none group"
                        >
                          <span className={`font-semibold flex items-center gap-2 ${completedWorkouts.includes(item) ? "text-[#22f58c] line-through opacity-60" : "text-[#dfe4e0]"}`}>
                            <span className="material-symbols-outlined text-[16px]">
                              {completedWorkouts.includes(item) ? "check_box" : "check_box_outline_blank"}
                            </span>
                            {item}
                          </span>
                          <span className="font-mono text-[10px] bg-[#262b29] px-2 py-0.5 rounded group-hover:bg-[#22f58c]/20 transition-colors">ACTIVE</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Hydration tracker with active wave progress & clickable add buttons */}
                <div className="glass-panel border border-white/5 bg-[#0a0f0d]/40 rounded-xl p-6">
                  <div className="flex flex-col space-y-1 mb-4">
                    <p className="font-label-mono text-[9px] text-[#8A9590] font-bold uppercase tracking-widest">Hydration Tracker</p>
                    <p className="text-xs text-[#8A9590]">Hydration optimizes kinetic torque yields.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    
                    {/* Visual Progress Wave panel */}
                    <div className="relative h-20 bg-[#161D19]/40 border border-white/5 rounded-xl overflow-hidden flex flex-col justify-center items-center select-none">
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-[#22f58c]/15 border-t border-[#22f58c]/30 transition-all duration-500"
                        style={{ height: `${Math.min((dashboardWater / 4000) * 100, 100)}%` }}
                      />
                      <div className="z-10 text-center">
                        <span className="text-xl font-mono font-bold text-[#dfe4e0] tracking-tight">
                          {dashboardWater.toLocaleString()}
                        </span>
                        <span className="text-xs text-[#8A9590] font-semibold"> / 4,000 ML</span>
                      </div>
                      <span className="absolute top-2 right-3 text-[9px] font-mono font-bold text-[#22f58c] bg-[#22f58c]/10 px-2 py-0.5 rounded border border-[#22f58c]/20">
                        {Math.round(Math.min((dashboardWater / 4000) * 100, 100))}%
                      </span>
                    </div>

                    {/* Quick Add buttons */}
                    <div className="grid grid-cols-2 gap-2 font-label-mono text-[10px] uppercase font-extrabold">
                      <button 
                        onClick={() => handleAddWaterMock(250)}
                        className="flex items-center justify-center gap-1 h-9 rounded-lg border border-white/5 bg-[#262b29]/50 text-[#dfe4e0] hover:border-[#22f58c]/40 hover:bg-[#22f58c]/10 hover:text-[#22f58c] active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">add</span> 250ml
                      </button>
                      <button 
                        onClick={() => handleAddWaterMock(500)}
                        className="flex items-center justify-center gap-1 h-9 rounded-lg border border-white/5 bg-[#262b29]/50 text-[#dfe4e0] hover:border-[#22f58c]/40 hover:bg-[#22f58c]/10 hover:text-[#22f58c] active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">add</span> 500ml
                      </button>
                      <button 
                        onClick={() => handleAddWaterMock(750)}
                        className="flex items-center justify-center gap-1 h-9 rounded-lg border border-white/5 bg-[#262b29]/50 text-[#dfe4e0] hover:border-[#22f58c]/40 hover:bg-[#22f58c]/10 hover:text-[#22f58c] active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">add</span> 750ml
                      </button>
                      <button 
                        onClick={() => handleAddWaterMock(1000)}
                        className="flex items-center justify-center gap-1 h-9 rounded-lg border border-[#22f58c]/20 bg-[#22f58c]/5 text-[#22f58c] hover:bg-[#22f58c]/15 hover:shadow-[0_0_10px_rgba(34,245,140,0.2)] active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">add</span> 1.0 L
                      </button>
                    </div>

                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: Nutrition Targets & Macro logs */}
              <div className="space-y-6">
                
                {/* Nutrition Card */}
                <div className="glass-panel border border-white/5 bg-[#0a0f0d]/40 rounded-xl p-6 flex flex-col justify-between h-full">
                  <div className="mb-6">
                    <p className="font-label-mono text-[9px] text-[#8A9590] font-bold uppercase tracking-widest">Nutrition Summary</p>
                    <p className="text-xs text-[#8A9590]">Target macro and energy breakups.</p>
                  </div>

                  <div className="space-y-5">
                    {/* Calorie Progress */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-[#dfe4e0] flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[#22f58c] text-base">restaurant</span>
                          Energy Target
                        </span>
                        <span className="font-mono text-[#22f58c] font-bold">2,350 / 2,800 kcal</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#262b29] rounded-full overflow-hidden">
                        <div className="h-full neon-gradient rounded-full" style={{ width: "84%" }}></div>
                      </div>
                    </div>

                    {/* Macro lists */}
                    <div className="space-y-3.5 pt-4 border-t border-white/5 font-label-mono text-[10px] uppercase font-bold tracking-wider">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#8A9590]">Protein (Goal: 180g)</span>
                          <span className="font-mono text-[#dfe4e0] font-extrabold">154g (85%)</span>
                        </div>
                        <div className="h-1 w-full bg-[#262b29] rounded-full overflow-hidden">
                          <div className="h-full bg-[#22f58c] rounded-full" style={{ width: "85%" }}></div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#8A9590]">Carbs (Goal: 340g)</span>
                          <span className="font-mono text-[#dfe4e0] font-extrabold">295g (86%)</span>
                        </div>
                        <div className="h-1 w-full bg-[#262b29] rounded-full overflow-hidden">
                          <div className="h-full bg-[#22f58c] rounded-full" style={{ width: "86%" }}></div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#8A9590]">Fat (Goal: 80g)</span>
                          <span className="font-mono text-[#dfe4e0] font-extrabold">64g (80%)</span>
                        </div>
                        <div className="h-1 w-full bg-[#262b29] rounded-full overflow-hidden">
                          <div className="h-full bg-[#22f58c] rounded-full" style={{ width: "80%" }}></div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="py-24 md:py-36 px-6 md:px-16 max-w-[1280px] mx-auto relative border-t border-white/5" id="pricing">
        <div className="text-center mb-12 reveal-on-scroll">
          <span className="font-label-mono text-xs text-[#22f58c] mb-3 block font-semibold">/// ACCESS GRANTED</span>
          <h2 className="font-headline-lg text-4xl md:text-6xl font-extrabold text-[#dfe4e0] mb-6 tracking-tighter">
            Choose Your Arsenal.
          </h2>
          <p className="font-body-lg text-lg text-[#8A9590] max-w-2xl mx-auto leading-relaxed">
            Engineered for every level of commitment. Upgrade your hardware, elevate your stats.
          </p>
        </div>

        {/* Modern Liquid Segment Selector Switcher (Hover Activated & Symmetrical!) */}
        <div className="reveal-on-scroll flex justify-center mb-20 relative z-20 select-none">
          <div className="relative flex p-1 bg-[#161d19]/60 backdrop-blur-md border border-white/5 rounded-full shadow-lg w-[280px] md:w-[320px]">
            
            {/* Liquid Slider capsule background (Geometrically Perfect Split!) */}
            <div 
              className="absolute top-1 bottom-1 rounded-full bg-[#22f58c] shadow-[0_0_15px_rgba(34,245,140,0.4)] transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)"
              style={{
                left: billingCycle === "yearly" ? "calc(50% + 2px)" : "4px",
                right: billingCycle === "yearly" ? "4px" : "calc(50% + 2px)"
              } as React.CSSProperties}
            />
            
            {/* Monthly Option Button */}
            <button
              onMouseEnter={() => setBillingCycle("monthly")}
              onClick={() => setBillingCycle("monthly")}
              className={`relative z-10 w-1/2 text-center font-label-mono text-[10px] md:text-xs uppercase font-extrabold tracking-widest py-2.5 rounded-full transition-colors duration-300 cursor-pointer ${
                billingCycle === "monthly" ? "text-[#00391b]" : "text-[#8A9590] hover:text-[#dfe4e0]"
              }`}
            >
              Monthly
            </button>
            
            {/* Yearly Option Button */}
            <button
              onMouseEnter={() => setBillingCycle("yearly")}
              onClick={() => setBillingCycle("yearly")}
              className={`relative z-10 w-1/2 text-center flex items-center justify-center gap-1.5 font-label-mono text-[10px] md:text-xs uppercase font-extrabold tracking-widest py-2.5 rounded-full transition-colors duration-300 cursor-pointer ${
                billingCycle === "yearly" ? "text-[#00391b]" : "text-[#8A9590] hover:text-[#dfe4e0]"
              }`}
            >
              Yearly
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full transition-all duration-300 ${
                billingCycle === "yearly" ? "bg-[#00391b]/25 text-[#00391b]" : "bg-[#22f58c]/10 text-[#22f58c] border border-[#22f58c]/20 animate-pulse"
              }`}>
                -20%
              </span>
            </button>

          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch relative z-10 max-w-[1080px] mx-auto">
          
          {/* Free Tier */}
          <div className="reveal-on-scroll hover:translate-y-[-8px] transition-all duration-500 ease-out flex">
            <div 
              className="pricing-card-premium p-8 flex flex-col h-full w-full"
              onMouseMove={handlePricingMouseMove}
              onMouseLeave={handleCardLeave}
            >
              <div className="mb-8 relative z-10">
                <span className="font-label-mono text-[9px] uppercase tracking-widest text-[#8A9590] block mb-1">Standard Spec</span>
                <h3 className="font-stat-display text-xl font-bold mb-2 text-[#dfe4e0]">Free</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="font-headline-md text-5xl font-extrabold text-[#dfe4e0] tracking-tighter">$0</span>
                  <span className="font-label-mono text-xs text-[#8A9590] ml-1">/mo</span>
                </div>
                <p className="font-body-md text-sm text-[#8A9590] mt-4 leading-relaxed">Basic telemetry for casual operators.</p>
              </div>
              <ul className="space-y-4 mb-8 flex-grow relative z-10">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#22f58c] text-lg font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="font-body-md text-sm text-[#dfe4e0]">Standard Workout Logging</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#22f58c] text-lg font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="font-body-md text-sm text-[#dfe4e0]">Basic Progress Charts</span>
                </li>
                <li className="flex items-start gap-3 text-[#8A9590]">
                  <span className="material-symbols-outlined text-[#353a38] text-lg">remove</span>
                  <span className="font-body-md text-sm">Advanced Predictive Analytics</span>
                </li>
              </ul>
              <Link 
                href="/signup" 
                className="block w-full py-2.5 px-6 text-center border border-white/10 rounded-full font-label-mono text-[10px] uppercase font-bold hover:bg-[#22f58c] hover:text-[#00391b] hover:border-[#22f58c] hover:shadow-[0_0_20px_rgba(34,245,140,0.3)] transition-all z-10 relative cursor-pointer"
              >
                Start Free
              </Link>
            </div>
          </div>

          {/* Pro Tier (Accentuated, flowing laser glow) */}
          <div className="relative py-4 md:py-0 reveal-on-scroll hover:translate-y-[-8px] transition-all duration-500 ease-out flex">
            <div 
              className="pricing-card-premium pricing-pro-card-premium p-8 flex flex-col h-full w-full"
              onMouseMove={handlePricingMouseMove}
              onMouseLeave={handleCardLeave}
            >
              <div className="absolute top-0 right-0 bg-[#22f58c] text-[#00391b] font-label-mono text-[9px] uppercase tracking-wider py-1.5 px-5 rounded-bl-xl font-extrabold z-20">
                Most Popular
              </div>
              <div className="mb-8 mt-2 relative z-10">
                <span className="font-label-mono text-[9px] uppercase tracking-widest text-[#22f58c] block mb-1">Advanced Tactical</span>
                <h3 className="font-stat-display text-xl font-bold text-[#22f58c] mb-2">Pro</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-5xl font-extrabold text-[#dfe4e0] tracking-tighter">
                    {billingCycle === "monthly" ? "$9" : "$7"}
                    <span className="text-2xl font-semibold text-[#8A9590]">
                      {billingCycle === "monthly" ? "" : ".20"}
                    </span>
                  </span>
                  <span className="font-label-mono text-xs text-[#8A9590] ml-1">/mo</span>
                </div>
                {billingCycle === "yearly" && (
                  <div className="font-label-mono text-[9px] text-[#22f58c] font-bold mt-1.5 uppercase tracking-widest animate-entrance">
                    Billed $86.40 annually
                  </div>
                )}
                <p className="font-body-md text-sm text-[#8A9590] mt-4 leading-relaxed">Full tactical suite for dedicated athletes.</p>
              </div>
              <ul className="space-y-4 mb-8 flex-grow relative z-10">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#22f58c] text-lg font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="font-body-md text-sm text-[#dfe4e0]">Everything in Free</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#22f58c] text-lg font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="font-body-md text-sm text-[#dfe4e0]">Predictive Velocity AI</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#22f58c] text-lg font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="font-body-md text-sm text-[#dfe4e0]">Haptic rest pacing controls</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#22f58c] text-lg font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="font-body-md text-sm text-[#dfe4e0]">Unlimited Custom Protocols</span>
                </li>
              </ul>
              <Link 
                href="/signup" 
                className="block w-full py-3 px-6 text-center bg-[#22f58c] text-[#00391b] rounded-full font-label-mono text-[10px] uppercase font-bold transition-all hover:bg-[#60ff99] shadow-[0_0_20px_rgba(34,245,140,0.5)] magnetic-btn z-10 relative cursor-pointer"
                onMouseMove={handleMagneticMove}
                onMouseLeave={handleMagneticLeave}
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>

          {/* Elite Tier */}
          <div className="reveal-on-scroll hover:translate-y-[-8px] transition-all duration-500 ease-out flex">
            <div 
              className="pricing-card-premium p-8 flex flex-col h-full w-full"
              onMouseMove={handlePricingMouseMove}
              onMouseLeave={handleCardLeave}
            >
              <div className="mb-8 relative z-10">
                <span className="font-label-mono text-[9px] uppercase tracking-widest text-[#8A9590] block mb-1">Elite Operator</span>
                <h3 className="font-stat-display text-xl font-bold mb-2 text-[#dfe4e0]">Elite</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-5xl font-extrabold text-[#dfe4e0] tracking-tighter">
                    {billingCycle === "monthly" ? "$19" : "$15"}
                    <span className="text-2xl font-semibold text-[#8A9590]">
                      {billingCycle === "monthly" ? "" : ".20"}
                    </span>
                  </span>
                  <span className="font-label-mono text-xs text-[#8A9590] ml-1">/mo</span>
                </div>
                {billingCycle === "yearly" && (
                  <div className="font-label-mono text-[9px] text-[#22f58c] font-bold mt-1.5 uppercase tracking-widest animate-entrance">
                    Billed $182.40 annually
                  </div>
                )}
                <p className="font-body-md text-sm text-[#8A9590] mt-4 leading-relaxed">Unrestricted access for elite performers.</p>
              </div>
              <ul className="space-y-4 mb-8 flex-grow relative z-10">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#22f58c] text-lg font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="font-body-md text-sm text-[#dfe4e0]">Everything in Pro</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#22f58c] text-lg font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="font-body-md text-sm text-[#dfe4e0]">1-on-1 Virtual Coaching</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#22f58c] text-lg font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="font-body-md text-sm text-[#dfe4e0]">Priority Hardware Sync</span>
                </li>
              </ul>
              <Link 
                href="/signup" 
                className="block w-full py-2.5 px-6 text-center border border-white/10 rounded-full font-label-mono text-[10px] uppercase font-bold hover:bg-[#22f58c] hover:text-[#00391b] hover:border-[#22f58c] hover:shadow-[0_0_20px_rgba(34,245,140,0.3)] transition-all z-10 relative cursor-pointer"
              >
                Go Elite
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-24 md:py-36 px-6 md:px-16 relative overflow-hidden flex flex-col items-center justify-center min-h-[550px] border-t border-white/5 bg-[#0a0f0d]">
        <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none">
          <div className="w-[750px] h-[750px] bg-[#22f58c] rounded-full blur-[160px] mix-blend-screen"></div>
        </div>
        
        <div className="relative z-10 text-center max-w-4xl mx-auto flex flex-col items-center reveal-on-scroll">
          <h2 className="font-hero-xl-mobile md:font-hero-xl text-[48px] md:text-[88px] font-extrabold mb-8 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-[#8A9590] uppercase leading-none">
            READY TO FORGE?
          </h2>
          <p className="font-body-lg text-lg text-[#8A9590] mb-12 max-w-xl mx-auto leading-relaxed">
            Join the elite operators optimizing their output. The data doesn&apos;t lie. Secure your profile today.
          </p>
          
          <div className="reveal-up active mb-16">
            <Link 
              href="/signup" 
              className="inline-flex items-center justify-center gap-2 bg-[#22f58c] text-[#00391b] font-headline-md text-sm uppercase tracking-widest px-8 py-3 rounded-full font-extrabold shadow-[0_0_40px_rgba(34,245,140,0.5)] hover:shadow-[0_0_60px_rgba(34,245,140,0.7)] transition-all animate-pulse-cta magnetic-btn"
              onMouseMove={handleMagneticMove}
              onMouseLeave={handleMagneticLeave}
            >
              Start Forging Free
              <span className="material-symbols-outlined text-xl font-bold" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0f0d] w-full py-16 md:py-24 border-t border-white/5 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-16 gap-8 mx-auto max-w-[1280px]">
          
          <div className="flex flex-col items-center md:items-start gap-3 mb-8 md:mb-0">
            <span className="font-headline-md text-2xl text-[#dfe4e0] font-extrabold tracking-tighter flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#22f58c] text-2xl" style={{ fontVariationSettings: '"FILL" 1' }}>fitness_center</span>
              FitForge
            </span>
            <p className="font-label-mono text-xs text-[#8A9590]">© 2026 FitForge. Forged in Science.</p>
          </div>

          <div className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-4 font-label-mono text-xs uppercase font-bold">
            <a className="text-[#8A9590] hover:text-[#dfe4e0] transition-colors" href="#">Privacy Policy</a>
            <a className="text-[#8A9590] hover:text-[#dfe4e0] transition-colors" href="#">Terms of Service</a>
            <a className="text-[#8A9590] hover:text-[#dfe4e0] transition-colors" href="#">Contact</a>
          </div>

          {/* Email Subscription Form */}
          <div className="mt-8 md:mt-0 w-full md:w-auto">
            <form 
              onSubmit={(e) => e.preventDefault()}
              className="flex gap-2.5 w-full max-w-sm mx-auto md:mx-0"
            >
              <input 
                className="bg-[#262b29] border border-white/5 text-[#dfe4e0] font-body-md text-xs rounded-lg px-4 py-2.5 focus:ring-[#22f58c] focus:border-[#22f58c] w-full outline-none" 
                placeholder="Enter comms channel..." 
                type="email"
                required
              />
              <button 
                className="bg-[#22f58c] text-[#00391b] px-4 py-2.5 rounded-lg font-label-mono text-xs font-bold hover:bg-[#60ff99] transition-colors"
                type="submit"
              >
                Subscribe
              </button>
            </form>
          </div>

        </div>
      </footer>

    </div>
  );
}
