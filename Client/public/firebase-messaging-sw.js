importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyBEdktjKb5xvPODebEjbqK1hZzp7NsQyrU",
    authDomain: "admeasy-6f0ab.firebaseapp.com",
    projectId: "admeasy-6f0ab",
    messagingSenderId: "609550052160",
    appId: "1:609550052160:web:d341776038965834bd28a5",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: payload.data || {}
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification click received.');
    
    event.notification.close();

    // Always navigate to notifications page when notification is clicked
    const urlToOpen = new URL('/notifications', self.location.origin).href;

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((clientList) => {
            // Check if there's already a window/tab open with the app
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                // If we have an open window from our origin, focus it
                if (client.url.startsWith(self.location.origin) && 'focus' in client) {
                    // Focus the existing window
                    client.focus();
                    // Send a message to navigate (we'll handle this in the main app)
                    client.postMessage({ type: 'NAVIGATE_TO_NOTIFICATIONS' });
                    return Promise.resolve();
                }
            }
            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});