// ===== FCM NOTIFICATION SERVICE =====
// Handles Firebase Cloud Messaging for reliable daily push notifications
const NotificationService = {
    _messaging: null,
    _token: null,

    // VAPID key from Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
    // TODO: Replace with your actual VAPID key from Firebase Console
    VAPID_KEY: 'BBpXVV8ICUeC06bdcA2PPhbfmJJxk3dLBoL_9Dmu5k6HPS-72tu871RzDKGxL45WqWI0GmJN8EWR9-pkwgKCBZw',

    // Firebase config (same as auth.js)
    _getConfig() {
        return Storage._get('firebase_config', {
            apiKey: 'AIzaSyDHt1oEFkLZCK3Oo-1kRIL8kDPBwFTsH_0',
            authDomain: 'ironfuel-422fe.firebaseapp.com',
            projectId: 'ironfuel-422fe',
            messagingSenderId: '692208019425',
            appId: '1:692208019425:web:0ebcedcb10e7baaaf754a0'
        });
    },

    // Initialize FCM messaging
    init() {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            return;
        }

        // Check if Firebase config has required FCM fields
        const config = this._getConfig();
        if (!config.messagingSenderId || !config.appId) {
            return;
        }

        try {
            // Firebase should already be initialized by auth.js
            if (typeof firebase !== 'undefined' && firebase.messaging) {
                this._messaging = firebase.messaging();
            } else {
            }
        } catch (e) {
        }
    },

    // Request permission and get FCM token
    async requestPermission() {
        if (!('Notification' in window)) {
            App.showToast('Notifications non supportées sur ce navigateur');
            return null;
        }

        if (Notification.permission === 'denied') {
            App.showToast('Notifications bloquées — active-les dans les paramètres du navigateur');
            return null;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                App.showToast('Notifications refusées');
                return null;
            }

            App.showToast('Notifications activées ! 🔔');

            // Get FCM token
            const token = await this._getToken();
            if (token) {
                await this._saveToken(token);
                this._token = token;

                // Show test notification
                new Notification('IronFuel 💪', {
                    body: 'Les notifications sont activées ! Tu recevras une motivation chaque jour à 8h.',
                    icon: '/assets/icons/icon-192.png',
                    tag: 'notification-test'
                });
            }

            return token;
        } catch (e) {
            App.showToast('Erreur lors de l\'activation des notifications');
            return null;
        }
    },

    // Get FCM token from messaging service
    async _getToken() {
        if (!this._messaging) {
            return null;
        }

        if (!this.VAPID_KEY) {
            // Fallback: still try without VAPID (works in some browsers)
        }

        try {
            const sw = await navigator.serviceWorker.ready;
            const token = await this._messaging.getToken({
                vapidKey: this.VAPID_KEY || undefined,
                serviceWorkerRegistration: sw
            });
            return token;
        } catch (e) {
            return null;
        }
    },

    // Save FCM token to Firestore via REST API
    async _saveToken(token) {
        if (!AuthService.isLoggedIn()) {
            // Store locally for later sync
            Storage._set('fcm_token', token);
            return;
        }

        const user = AuthService.getCurrentUser();
        const config = this._getConfig();

        try {
            // Save to Firestore: users/{userId} with fcmToken field
            const idToken = await user.getIdToken();
            const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${user.uid}`;

            await fetch(url + '?updateMask.fieldPaths=fcmToken&updateMask.fieldPaths=fcmUpdatedAt', {
                method: 'PATCH',
                headers: {
                    'Authorization': 'Bearer ' + idToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: {
                        fcmToken: { stringValue: token },
                        fcmUpdatedAt: { timestampValue: new Date().toISOString() }
                    }
                })
            });

        } catch (e) {
            // Store locally as fallback
            Storage._set('fcm_token', token);
        }
    },

    // Ensure user is registered for notifications (called from dashboard)
    async ensureRegistered() {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
        if (Notification.permission !== 'granted') return;

        // Only re-register token periodically (every 7 days)
        const lastReg = Storage._get('fcm_last_reg', 0);
        if (Date.now() - lastReg < 7 * 24 * 60 * 60 * 1000) return;

        try {
            const token = await this._getToken();
            if (token) {
                await this._saveToken(token);
                this._token = token;
                Storage._set('fcm_last_reg', Date.now());
            }
        } catch (e) {
        }
    },

    // Handle foreground messages (when app is open)
    setupForegroundHandler() {
        if (!this._messaging) return;

        this._messaging.onMessage((payload) => {
            const { title, body } = payload.notification || {};
            if (title) {
                // Show in-app toast instead of system notification (app is already open)
                App.showToast(body || title);
            }
        });
    },

    // Get current permission status for UI
    getStatus() {
        if (!('Notification' in window)) return 'unsupported';
        return Notification.permission; // 'granted', 'denied', 'default'
    }
};
