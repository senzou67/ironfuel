// Firebase Cloud Messaging — import Firebase in SW for background push
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize Firebase in SW
// TODO: Set messagingSenderId and appId from Firebase Console → Project Settings → General
const FCM_CONFIG = {
    apiKey: 'AIzaSyDHt1oEFkLZCK3Oo-1kRIL8kDPBwFTsH_0',
    authDomain: 'ironfuel-422fe.firebaseapp.com',
    projectId: 'ironfuel-422fe',
    messagingSenderId: '692208019425',
    appId: '1:692208019425:web:0ebcedcb10e7baaaf754a0'
};

// Only init FCM if config is complete (avoid error spam before configuration)
if (FCM_CONFIG.messagingSenderId && FCM_CONFIG.appId) {
    firebase.initializeApp(FCM_CONFIG);
    const messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
        console.log('[SW] Background message:', payload);
        const { title, body } = payload.notification || {};
        if (title) {
            self.registration.showNotification(title, {
                body: body || '',
                icon: '/assets/icons/icon-192.png',
                badge: '/assets/icons/icon-96.svg',
                tag: payload.data?.tag || 'daily-motivation',
                vibrate: [200, 100, 200],
                actions: [
                    { action: 'open', title: 'Ouvrir IronFuel' }
                ]
            });
        }
    });
} else {
    console.log('[SW] FCM not configured — set messagingSenderId & appId in sw.js');
}

const CACHE_NAME = 'ironfuel-v68';
const SW_VERSION = 68;
const ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/js/db.js',
    '/js/storage.js',
    '/js/services/nutrition.js',
    '/js/services/vision.js',
    '/js/services/speech.js',
    '/js/services/openfoodfacts.js',
    '/js/services/foodimages.js',
    '/js/services/analytics.js',
    '/js/services/auth.js',
    '/js/services/trial.js',
    '/js/services/sync.js',
    '/js/services/notifications.js',
    '/js/services/paypal.js',
    '/js/components/navbar.js',
    '/js/components/modal.js',
    '/js/components/charts.js',
    '/js/components/mealcard.js',
    '/js/components/fooditem.js',
    '/js/components/avatar.js',
    '/js/pages/dashboard.js',
    '/js/pages/diary.js',
    '/js/pages/search.js',
    '/js/pages/camera.js',
    '/js/pages/voice.js',
    '/js/pages/barcode.js',
    '/js/pages/history.js',
    '/js/pages/profile.js',
    '/js/pages/settings.js',
    '/js/pages/customfood.js',
    '/js/pages/gym.js',
    '/js/pages/supplements.js',
    '/js/pages/weight.js',
    '/js/services/micronutrients.js',
    '/js/pages/shop.js',
    '/js/pages/avatar.js',
    '/assets/icons/icon-192.svg',
    '/assets/icons/icon-512.svg',
    '/assets/icons/icon-192.png',
    '/assets/icons/icon-512.png',
    '/privacy.html',
    '/terms.html'
];

const CDN_ASSETS = [
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
    'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
    'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js'
];

// Install — cache all assets
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            const all = [...ASSETS, ...CDN_ASSETS];
            return cache.addAll(all).catch(() => {
                return Promise.allSettled(all.map(url => cache.add(url)));
            });
        })
    );
    self.skipWaiting();
});

// Activate — clean old caches + force-navigate ALL open clients
// This is the KEY to breaking the old-cache cycle:
// When a new SW activates, it force-navigates all windows to reload with fresh content.
// Using client.navigate() instead of postMessage because OLD index.html
// doesn't have the FORCE_RELOAD listener — postMessage goes to /dev/null.
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
         .then(() => {
            // Force-navigate all open windows to reload with new content
            return self.clients.matchAll({ type: 'window' }).then(clients => {
                clients.forEach(client => {
                    // navigate() forces a fresh load through the NEW sw
                    if (client.url && 'navigate' in client) {
                        client.navigate(client.url);
                    }
                });
            });
        })
    );
});

// Fetch — cache-first for versioned assets, network-first for HTML/API
self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;
    const url = new URL(e.request.url);

    // NEVER cache version.json or nuke.html — always go to network
    if (url.pathname === '/version.json' || url.pathname === '/nuke.html') {
        e.respondWith(fetch(e.request));
        return;
    }

    // Network-first for CDN assets
    if (url.hostname !== location.hostname) {
        e.respondWith(
            fetch(e.request).catch(() => caches.match(e.request))
        );
        return;
    }

    // Cache-first for versioned assets (?v=XX) — immutable until version bump
    if (url.search && /[?&]v=\d+/.test(url.search)) {
        e.respondWith(
            caches.match(e.request).then(cached => {
                if (cached) return cached;
                return fetch(e.request).then(response => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                    }
                    return response;
                });
            })
        );
        return;
    }

    // Network-first for HTML and non-versioned assets
    e.respondWith(
        fetch(e.request).then(response => {
            if (response.ok) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
            }
            return response;
        }).catch(() => {
            return caches.match(e.request);
        })
    );
});

// Message handler — FCM handles push notifications now (see onBackgroundMessage above)
// Legacy SCHEDULE_NOTIFICATION messages are ignored — FCM server sends daily pushes via daily-notification.js
self.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Notification click handler
self.addEventListener('notificationclick', (e) => {
    e.notification.close();
    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            // Focus existing window if open
            for (const client of clientList) {
                if ('focus' in client) return client.focus();
            }
            // Otherwise open new window
            return clients.openWindow('/');
        })
    );
});
