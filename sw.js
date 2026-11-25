/* DrRachata AR: Research Tracker — service worker
   ทำให้แอปเปิดได้แม้ไม่มีอินเทอร์เน็ต และอัปเดตเป็นเวอร์ชันใหม่อัตโนมัติเมื่อออนไลน์
   เมื่อแก้ไข index.html แล้วอัปโหลดใหม่ ให้เปลี่ยนเลข VERSION ด้านล่างทุกครั้ง */
const VERSION = 'ar-tracker-v1.0.1';
const SHELL = ['./', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './apple-touch-icon.png', './favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // หน้าแอป: ดึงเวอร์ชันล่าสุดจากเน็ตก่อน ถ้าออฟไลน์ใช้สำเนาในเครื่อง
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // ไฟล์อื่น (ไอคอน ฟอนต์): ใช้สำเนาในเครื่องก่อน แล้วอัปเดตเบื้องหลัง
  if (url.origin === location.origin || url.host.endsWith('fonts.googleapis.com') || url.host.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return r; }).catch(() => hit);
      return hit || net;
    }));
  }
});
