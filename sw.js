/* 오프라인 캐시 — 데이터 파일을 추가하면 FILES에도 넣고 CACHE 버전을 올릴 것 */
var CACHE = 'las-v2';
var FILES = ['./', './index.html', './manifest.webmanifest', './assets/style.css', './assets/app.js',
  './assets/icon-192.png', './assets/icon-512.png', './assets/apple-touch-icon.png',
  './data/00-core.js', './data/theory.js', './data/blanks.js',
  './data/q1.js', './data/q2.js', './data/q3.js', './data/q4.js', './data/q5.js'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); })); self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }));
  self.clients.claim();
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(function (r) {
    return r || fetch(e.request).then(function (res) {
      var u = new URL(e.request.url); if ((res.ok && u.origin === location.origin) || u.hostname === 'cdn.jsdelivr.net') { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, cp); }); }
      return res;
    }).catch(function () { return caches.match('./index.html'); });
  }));
});
