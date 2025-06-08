
// public/firebase-messaging-sw.js
// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
// Be sure to include your Firebase project's configuration details below.
const firebaseConfig = {
  apiKey: "YOUR_NEXT_PUBLIC_FIREBASE_API_KEY", // Replace with your actual config
  authDomain: "YOUR_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "YOUR_NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  storageBucket: "YOUR_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "YOUR_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  appId: "YOUR_NEXT_PUBLIC_FIREBASE_APP_ID",
  measurementId: "YOUR_NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID"
};

// NOTE: Replace the placeholder values above with your actual Firebase project configuration.
// You can find these details in your Firebase project settings.
// It's crucial that these values match your client-side Firebase config.

if (firebase.apps.length === 0) {
  firebase.initializeApp(firebaseConfig);
}

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title || 'Novo Episódio!';
  const notificationOptions = {
    body: payload.notification.body || 'Um novo episódio foi adicionado.',
    icon: payload.notification.icon || '/icons/icon-192x192.png', // Ensure you have this icon
    data: payload.data // This will make the data available when the notification is clicked
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click Received.', event.notification.data);
  event.notification.close();

  const targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === targetUrl && 'focus' in client) { // Check if client.url matches and focus is available
            return client.focus().then(client => client.navigate(targetUrl)); // Navigate after focus
        }
      }
      if (clients.openWindow) { // If no existing window is found, open a new one
        return clients.openWindow(targetUrl);
      }
    })
  );
});
