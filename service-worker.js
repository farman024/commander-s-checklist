// ============================================================
// THE COMMANDER'S CHECKLIST — SERVICE WORKER
// Version: 1.0.0
// Strategy: Cache-first for static assets, network-first for pages
// ============================================================

const CACHE_NAME = "commanders-checklist-v1";
const OFFLINE_URL = "/offline.html";

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  "/",
  "/offline.html",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// ============================================================
// INSTALL — Pre-cache core assets
// ============================================================
self.addEventListener("install", (event) => {
  console.log("[SW] Installing Commander's Checklist SW...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Pre-caching core assets");
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Force the new SW to activate immediately without waiting
  self.skipWaiting();
});

// ============================================================
// ACTIVATE — Clean up old caches
// ============================================================
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log("[SW] Deleting old cache:", name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all open clients immediately
  self.clients.claim();
});

// ============================================================
// FETCH — Routing strategies
// ============================================================
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and browser extensions
  if (request.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;

  // --- Strategy 1: Cache-first for static assets ---
  // JS, CSS, fonts, images → serve from cache, update in background
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font" ||
    request.destination === "image" ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // --- Strategy 2: Network-first for HTML pages ---
  // Always try to get fresh HTML; fall back to cache or offline page
  if (request.destination === "document" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // --- Strategy 3: Stale-while-revalidate for everything else ---
  event.respondWith(staleWhileRevalidate(request));
});

// ============================================================
// CACHING STRATEGIES
// ============================================================

// Cache-first: Return cached response, fetch & update cache in background
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return new Response("Asset unavailable offline.", { status: 503 });
  }
}

// Network-first: Try network, fall back to cache, then offline page
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Last resort: show offline page
    const offlinePage = await caches.match(OFFLINE_URL);
    return offlinePage || new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>OFFLINE — Commander's Checklist</title>
          <style>
            body { background:#000; color:#00FF41; font-family: 'Courier New', monospace;
                   display:flex; align-items:center; justify-content:center; height:100vh;
                   text-align:center; margin:0; }
            h1 { font-size:18px; letter-spacing:0.2em; text-shadow:0 0 10px rgba(0,255,65,0.6); }
            p  { font-size:11px; color:#555; letter-spacing:0.1em; margin-top:12px; }
          </style>
        </head>
        <body>
          <div>
            <h1>// SYSTEM OFFLINE</h1>
            <p>> Reconnect to resume mission, Commander.</p>
          </div>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html" }, status: 503 }
    );
  }
}

// Stale-while-revalidate: Return cache immediately, fetch fresh in background
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) cache.put(request, networkResponse.clone());
    return networkResponse;
  }).catch(() => null);

  return cached || fetchPromise;
}

// ============================================================
// BACKGROUND SYNC — Queue failed log submissions (future use)
// ============================================================
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-logs") {
    console.log("[SW] Background sync: retrying log submission...");
    // TODO: When Supabase is integrated, flush queued logs here
    // event.waitUntil(flushPendingLogs());
  }
});

// ============================================================
// PUSH NOTIFICATIONS — Daily audit reminder (future use)
// ============================================================
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {
    title: "COMMANDER'S CHECKLIST",
    body: "> Daily audit not filed. Streak at risk.",
  };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      tag: "daily-audit",
      renotify: true,
      data: { url: "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === "/" && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow("/");
    })
  );
});
