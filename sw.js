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
    // FCM with notification field auto-displays — SW does NOT show again
    messaging.onBackgroundMessage(() => {});
} else {
    console.log('[SW] FCM not configured — set messagingSenderId & appId in sw.js');
}

const CACHE_NAME = 'onefood-v116';
const SW_VERSION = 116;
const ASSETS = [
    '/',
    '/index.html',
    // css/fonts.css is now inlined into index.html — no longer precached.
    '/css/style.css',
    '/lib/chart.min.js',
    '/lib/html5-qrcode.min.js',
    '/assets/fonts/inter-400.woff2',
    '/assets/fonts/inter-500.woff2',
    '/assets/fonts/inter-600.woff2',
    '/assets/fonts/inter-700.woff2',
    '/assets/fonts/inter-800.woff2',
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
    '/js/pages/chat.js',
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

// Fetch — tiered caching strategy:
//  • version.json / nuke.html   → network-only (cache-busting control plane)
//  • HTML documents              → network-first (always get fresh shell)
//  • Versioned assets (?v=NN)    → cache-first, immutable (fingerprinted URL)
//  • Fonts / images / icons      → cache-first with background revalidate
//  • Firebase / gstatic CDN      → stale-while-revalidate (runtime cache)
//  • Other same-origin JS/CSS    → stale-while-revalidate
self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;
    const url = new URL(e.request.url);

    // NEVER cache version.json or nuke.html — always go to network
    if (url.pathname === '/version.json' || url.pathname === '/nuke.html') {
        e.respondWith(fetch(e.request));
        return;
    }

    const isCDN = url.hostname !== location.hostname;
    const isFirebaseSDK = url.hostname === 'www.gstatic.com' && url.pathname.indexOf('/firebasejs/') !== -1;
    const isFirebaseAPI = /\.(googleapis|firebaseio)\.com$/.test(url.hostname);
    const isFontAsset = /\.(woff2?|ttf|otf|eot)$/i.test(url.pathname);
    const isImageAsset = /\.(png|jpe?g|gif|webp|avif|svg|ico)$/i.test(url.pathname);
    const isVersioned = url.searchParams.has('v');
    const isHTML = e.request.mode === 'navigate' ||
                   (e.request.headers.get('accept') || '').indexOf('text/html') !== -1;

    // Never cache Firebase API traffic (auth/firestore/FCM) — always live
    if (isFirebaseAPI) {
        e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
        return;
    }

    // CDN: stale-while-revalidate for Firebase SDK, network-first fallback otherwise
    if (isCDN) {
        if (isFirebaseSDK) {
            e.respondWith(staleWhileRevalidate(e.request));
            return;
        }
        e.respondWith(
            fetch(e.request).catch(() => caches.match(e.request))
        );
        return;
    }

    // Same-origin HTML → network-first (always fresh shell, fall back to cache offline)
    if (isHTML) {
        e.respondWith(
            fetch(e.request).then(response => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                }
                return response;
            }).catch(() => caches.match(e.request) || caches.match('/index.html'))
        );
        return;
    }

    // Versioned assets (?v=NN) are immutable — cache-first is safe and fast
    if (isVersioned) {
        e.respondWith(cacheFirst(e.request));
        return;
    }

    // Fonts / images / icons — cache-first (long TTL)
    if (isFontAsset || isImageAsset) {
        e.respondWith(cacheFirst(e.request));
        return;
    }

    // Other same-origin JS/CSS → stale-while-revalidate
    e.respondWith(staleWhileRevalidate(e.request));
});

// Cache-first: return cached copy immediately; fall back to network + populate cache.
function cacheFirst(request) {
    return caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
            if (response && response.ok) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
            }
            return response;
        });
    });
}

// Stale-while-revalidate: serve cached copy instantly, revalidate in background.
function staleWhileRevalidate(request) {
    return caches.match(request).then(cached => {
        const networkFetch = fetch(request).then(response => {
            if (response && response.ok) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
            }
            return response;
        }).catch(() => cached);
        return cached || networkFetch;
    });
}

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
