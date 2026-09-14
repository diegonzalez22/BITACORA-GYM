/* Guarda la app en el celular para que abra sin señal */
var CACHE = "bitacora-gym-v1";
var ARCHIVOS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function (ev) {
  self.skipWaiting();
  ev.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(
        ARCHIVOS.map(function (u) {
          return c.add(u).catch(function () { return null; });
        })
      );
    })
  );
});

self.addEventListener("activate", function (ev) {
  ev.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(
        ks.map(function (k) { return k === CACHE ? null : caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

/* primero lo guardado, y en segundo plano se actualiza si hay señal */
self.addEventListener("fetch", function (ev) {
  if (ev.request.method !== "GET") return;
  ev.respondWith(
    caches.match(ev.request).then(function (hit) {
      var red = fetch(ev.request).then(function (res) {
        if (res && res.status === 200 && res.type === "basic") {
          var copia = res.clone();
          caches.open(CACHE).then(function (c) { c.put(ev.request, copia); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || red;
    })
  );
});
