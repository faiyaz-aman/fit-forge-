"use client";

import { useEffect } from "react";

export function SWRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") {
        navigator.serviceWorker.register("/sw.js").then(
          (registration) => {
            console.log("FitForge PWA Service Worker registered:", registration.scope);
          },
          (err) => {
            console.warn("FitForge PWA Service Worker registration failed:", err);
          }
        );
      } else {
        // Active unregister in development mode to prevent caching conflicts and ERR_FAILED loops!
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          let hasUnregistered = false;
          const unregisterPromises = registrations.map((registration) => {
            return registration.unregister().then((success) => {
              if (success) {
                console.log("Cleaned stale Service Worker in development mode:", registration.scope);
                hasUnregistered = true;
              }
            });
          });

          Promise.all(unregisterPromises).then(() => {
            if (hasUnregistered) {
              // Force clean refresh to fetch fresh pages directly from local Next.js dev server
              window.location.reload();
            }
          });
        });
      }
    }
  }, []);

  return null;
}
