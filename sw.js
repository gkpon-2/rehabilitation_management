// 更新するたびにこの数字を増やしてください（index.htmlのAPP_VERSION・version.jsonと合わせる）
const CACHE = 'rehab-v11';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon-64.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();           // 新版をすぐ待機解除
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())   // すぐ操作権を取る＝開いている画面に即反映
  );
});

// ページからの依頼で即時有効化（更新の取りこぼし防止）
self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

// ネット優先・失敗時のみキャッシュ
// ページ本体(HTML)とversion.jsonはHTTPキャッシュも飛ばして常に最新を取りに行く
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const isPage = e.request.mode === 'navigate'
    || e.request.url.includes('index.html')
    || e.request.url.includes('version.json');
  const req = isPage ? new Request(e.request.url, { cache: 'no-store' }) : e.request;
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
