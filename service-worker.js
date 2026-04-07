// ============================================================
// THE COMMANDER'S CHECKLIST — SERVICE WORKER (GITHUB PAGES)
// ============================================================

const CACHE_NAME = "commanders-checklist-v1";
const REPO_NAME = "/commander-s-checklist";

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  `${REPO_NAME}/`,
  `${REPO_NAME}/index.html`,
  `${REPO_NAME}/manifest.json`,
  `${REPO_NAME}/icon.svg`, // Matches your uploaded file
  `${REPO_NAME}/service-worker.js`
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
  self.clients.claim();
});

// ============================================================
// FETCH — Routing strategies
// ============================================================
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;

  // Strategy: Network-first with Cache Fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse.ok) {
          const cacheClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cacheClone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});

// ============================================================
// PUSH NOTIFICATIONS
// ============================================================
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {
    title: "COMMANDER'S CHECKLIST",
    body: "> Daily audit not filed. Streak at risk.",
  };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: `${REPO_NAME}/icon.svg`,
      badge: `${REPO_NAME}/icon.svg`,
      tag: "daily-audit",
      data: { url: `${REPO_NAME}/` },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(REPO_NAME) && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(`${REPO_NAME}/`);
    })
  );
});
