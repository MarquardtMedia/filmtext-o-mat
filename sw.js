/* Filmtext-o-Mat · Service Worker · © 2026 Ulf Marquardt
   Network first, stored copy as fallback: online, everybody always gets the newest uploaded
   version; offline, the last loaded version keeps working. Only the program files pass through
   here – films and projects never touch the network. */
const CACHE = "filmtext-o-mat-v3";
const SHELL = ["./", "index.html", "manifest.webmanifest",
               "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;            // e.g. the Ko-fi link: not our business
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then(hit => hit || (req.mode === "navigate" ? caches.match("index.html") : undefined))
        .then(hit => hit || Response.error()))
  );
});
