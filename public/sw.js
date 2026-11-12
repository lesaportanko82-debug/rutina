// Листик Service Worker — v1.0
const CACHE_NAME = "listik-v1";
const STATIC_CACHE = "listik-static-v1";

// Assets to pre-cache on install
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
];

// ─── Install: pre-cache essential assets ───
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn("[SW] Pre-cache failed (non-fatal):", err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate: clean up old caches ───
self.addEventListener("activate", (event) => {
  const validCaches = [CACHE_NAME, STATIC_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !validCaches.includes(k))
          .map((k) => {
            console.log("[SW] Deleting old cache:", k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch: Network-first with cache fallback ───
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin (Supabase API, OpenAI, etc.)
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // Skip Supabase function calls
  if (url.pathname.includes("/functions/v1/")) return;

  // For HTML pages: network-first, fallback to cache, then offline shell
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() =>
          caches.match(request).then((cached) => {
            if (cached) return cached;
            // Offline fallback: return cached root
            return caches.match("/");
          })
        )
    );
    return;
  }

  // For JS/CSS/assets: stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => null);

        return cached || networkFetch;
      })
    )
  );
});

// ─── Background Sync placeholder ───
self.addEventListener("sync", (event) => {
  if (event.tag === "listik-sync") {
    // Data sync will be handled by the app's own sync module
    console.log("[SW] Background sync triggered");
  }
});

// ─── Push Notifications placeholder ───
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || "Листик", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      vibrate: [200, 100, 200],
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      const existing = windowClients.find((c) => c.url === url && "focus" in c);
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});
