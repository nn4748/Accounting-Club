const CACHE_NAME = "acc-club-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// شبكة أولاً دايمًا، عشان بيانات الفعاليات والتسجيل تطلع محدثة لحظيًا.
// الكاش يُستخدم بس لو النت انقطع فعليًا، كنسخة احتياطية من آخر زيارة.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (err) {
    data = { title: "نادي المحاسبة", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "نادي المحاسبة";
  const options = {
    body: data.body || "",
    icon: "/assets/icons/icon-192.png",
    badge: "/assets/icons/icon-192.png",
    dir: "rtl",
    lang: "ar",
    data: { url: data.url || "/index.html" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/index.html";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
      const absoluteUrl = new URL(targetUrl, self.location.origin).href;
      for (const client of clientsList) {
        if (client.url === absoluteUrl && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
