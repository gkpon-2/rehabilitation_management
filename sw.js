// 更新するたびに増やす（index.htmlのAPP_VERSION・version.jsonと合わせる）
const CACHE = 'rehab-v13';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './style.css',
  './helpers.js',
  './menu.js',
  './data.js',
  './today.js',
  './calendar.js',
  './timer.js',
  './editor.js',
  './modal.js',
  './system.js',
  './main.js',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './favicon-64.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

// ネット優先・失敗時キャッシュ。HTML/JS/CSS/version.json はHTTPキャッシュも飛ばして最新取得
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const u = e.request.url;
  const fresh = e.request.mode === 'navigate' || /\.(html|js|css)$|version\.json/.test(u);
  const req = fresh ? new Request(u, { cache: 'no-store' }) : e.request;
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});
