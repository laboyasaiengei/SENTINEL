importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCZOI7sTRGn2xw6VWPkXblb8KW4TM_BcwU",
  authDomain: "dev-caesar.firebaseapp.com",
  projectId: "dev-caesar",
  storageBucket: "dev-caesar.firebasestorage.app",
  messagingSenderId: "339298618142",
  appId: "1:339298618142:web:69e5af56d4fb66840f170f"
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const d = payload.data || {};
  return self.registration.showNotification(d.title || 'SENTINEL', {
    body: d.body || '',
    data: { url: d.url || './' }
  });
});
/* ---------- アイコンバッジ（未読件数） ---------- */
const BADGE_DB = "sentinel-badge", BADGE_STORE = "kv", BADGE_KEY = "count";

function badgeDb_() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(BADGE_DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(BADGE_STORE);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
async function getBadgeCount_() {
  const db = await badgeDb_();
  return new Promise((resolve) => {
    const q = db.transaction(BADGE_STORE).objectStore(BADGE_STORE).get(BADGE_KEY);
    q.onsuccess = () => resolve(Number(q.result) || 0);
    q.onerror = () => resolve(0);
  });
}
async function setBadgeCount_(n) {
  const db = await badgeDb_();
  return new Promise((resolve) => {
    const tx = db.transaction(BADGE_STORE, "readwrite");
    tx.objectStore(BADGE_STORE).put(n, BADGE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}
async function applyBadge_(n) {
  try {
    if (n > 0 && self.navigator.setAppBadge) await self.navigator.setAppBadge(n);
    else if (self.navigator.clearAppBadge) await self.navigator.clearAppBadge();
  } catch (_) {}
}
async function bumpBadge_() {
  // アプリが前面表示中なら、見えているので加算しない
  const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  if (wins.some((c) => c.visibilityState === "visible")) return;
  const n = (await getBadgeCount_()) + 1;
  await setBadgeCount_(n);
  await applyBadge_(n);
}
async function clearBadge_() {
  await setBadgeCount_(0);
  await applyBadge_(0);
}

// push受信のたびに件数を+1
self.addEventListener("push", (event) => {
  event.waitUntil(bumpBadge_().catch(() => {}));
});

// アプリ側（SENTINEL.html）から「既読にした」を受け取って0に戻す
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "clear-badge") {
    event.waitUntil(clearBadge_().catch(() => {}));
  }
});

/* ---------- 通知タップ時（既存の処理＋バッジ消去） ---------- */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    event.notification?.data?.url ||
    event.notification?.data?.link ||
    "./";

  event.waitUntil(
    Promise.all([
      clearBadge_().catch(() => {}),
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        return clients.openWindow ? clients.openWindow(targetUrl) : undefined;
      })
    ])
  );
});
