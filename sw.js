// sw.js（更新に強い版）
const CACHE_NAME = "tarot-app-v1"; // ←更新したら v2, v3…に上げる

// できるだけキャッシュしない（更新優先）
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // 古いキャッシュ削除
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : Promise.resolve())));
    await self.clients.claim();
  })());
});

// HTMLは“常にネット優先”（最新版を取りに行く）
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // GET以外は触らない
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // 同一オリジンのみ対象
  if (url.origin !== self.location.origin) return;

  // HTMLはネット優先（更新が反映されやすい）
  if (req.headers.get("accept")?.includes("text/html")) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: "no-store" });
        return fresh;
      } catch (e) {
        // オフライン時は最低限のフォールバック（キャッシュしてないので、そのままエラーでもOK）
        return fetch(req);
      }
    })());
    return;
  }

  // それ以外（画像など）は普通にネットから
  event.respondWith(fetch(req));
});
