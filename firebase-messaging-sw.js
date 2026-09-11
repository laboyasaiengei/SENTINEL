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
  const notification = payload.notification || {};
  const data = payload.data || {};

  const title = notification.title || data.title || "SENTINEL";
  const options = {
    body: notification.body || data.body || "SENTINELから通知があります。",
    icon: "./icons/home-icon.png",
    badge: "./icons/home-icon.png",
    data
  };

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    event.notification?.data?.url ||
    event.notification?.data?.link ||
    "./";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return clients.openWindow ? clients.openWindow(targetUrl) : undefined;
    })
  );
});
