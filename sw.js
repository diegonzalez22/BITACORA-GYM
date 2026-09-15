/* Guarda la app en el celular para que abra sin señal */
var CACHE = "bitacora-gym-v2";
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

/* La app (html y js) se pide primero a la red para que las
   actualizaciones lleguen de una. Si no hay señal usa lo guardado.
   Los iconos sí salen del cache porque no cambian. */
function esApp(req) {
  return req.mode === "navigate" ||
         /\.(html|js|json)(\?|$)/.test(new URL(req.url).pathname) ||
         new URL(req.url).pathname.replace(/\/$/, "") === "";
}

self.addEventListener("fetch", function (ev) {
  if (ev.request.method !== "GET") return;

  if (esApp(ev.request)) {
    ev.respondWith(
      fetch(ev.request).then(function (res) {
        if (res && res.status === 200) {
          var copia = res.clone();
          caches.open(CACHE).then(function (c) { c.put(ev.request, copia); });
        }
        return res;
      }).catch(function () {
        return caches.match(ev.request).then(function (hit) {
          return hit || caches.match("./index.html");
        });
      })
    );
    return;
  }

  ev.respondWith(
    caches.match(ev.request).then(function (hit) {
      return hit || fetch(ev.request).then(function (res) {
        if (res && res.status === 200) {
          var copia = res.clone();
          caches.open(CACHE).then(function (c) { c.put(ev.request, copia); });
        }
        return res;
      });
    })
  );
});
