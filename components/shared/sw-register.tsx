"use client";

import { useEffect } from "react";

export function SWRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then(
        (registration) => {
          console.log("FitForge PWA Service Worker registered:", registration.scope);
        },
        (err) => {
          console.warn("FitForge PWA Service Worker registration failed:", err);
        }
      );
    }
  }, []);

  return null;
}
