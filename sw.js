/* Service worker: caches the whole app on first visit so it works offline.
   Updates are installed in the background and only take over when the student taps "Update now". */
const VERSION = 'anatovia-v112';
const FILES = ['./', 'index.html', 'style.css', 'i18n.js', 'catalog.js', 'gl.js', 'packs.js', 'store.js', 'app.js', 'study.js', 'features.js', 'clinic-data.js', 'clinic.js', 'spinal-data.js', 'play.js', 'clinmed.js', 'firebase-config.js', 'account.js', 'tour.js', 'tests.js', 'nerves.js', 'calc.js', 'board.js', 'faculty.js', 'gate.js', 'fonts/cairo.woff', 'dental.js', 'tooth3d.js','nblock.js','pjourney.js','tooth-lm.js','tooth-parts.js', 'fprof.js', 'voice.js', 'notebook.js','extras.js','motion.js', 'bono.js', 'duel.js', 'share.js', 'report.js', 'landmarks.js', 'models/bones.js', 'manifest.webmanifest', 'icons/favicon.svg',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  // 'reload' = bypass the HTTP cache so the new version is complete and consistent.
  // No skipWaiting: a new version waits until the student taps "Update now" in the app.
  e.waitUntil(caches.open(VERSION).then((c) => Promise.all(FILES.map((f) => c.add(new Request(f, { cache: 'reload' }))))));
});
self.addEventListener('message', (e) => { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys(), cur = await caches.open(VERSION);
    for (const k of keys) {
      if (k === VERSION) continue;
      // keep the big lazily-downloaded files (3D models, tooth scans) so "download for offline" survives an update
      const old = await caches.open(k);
      for (const r of await old.keys()) {
        if (/\/(models|teeth3d)\//.test(r.url) && !(await cur.match(r))) { const res = await old.match(r); if (res) await cur.put(r, res); }
      }
      await caches.delete(k);
    }
    await self.clients.claim();
  })());
});
// Cache-first: the running version never changes under the student's feet. Anything not cached yet is fetched and stored.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(VERSION), hit = await c.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    } catch (err) {
      return (await c.match('index.html')) || Response.error();
    }
  })());
});
