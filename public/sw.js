const CACHE_NAME = "fitforge-v2";
const ASSETS_TO_CACHE = [
  "/favicon.ico",
  "/manifest.json"
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("FitForge Cache opened successfully.");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Clearing redundant FitForge caches.");
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch Event with dynamic local fallback for offline logging support
self.addEventListener("fetch", (event) => {
  // Never intercept page navigations to allow standard redirects, auth checks, and Safe Browsing
  if (event.request.mode === "navigate") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
