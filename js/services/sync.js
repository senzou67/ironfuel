// === FIREBASE SYNC SERVICE (REST API) ===
// Uses Firestore REST API instead of SDK to avoid "client is offline" in incognito
const SyncService = {
    _projectId: null,
    _syncing: false,
    _lastSyncTime: 0,
    _debugLogs: [],

    _log(msg, isError) {
        const line = (isError ? '❌ ' : '✅ ') + msg;
        this._debugLogs.push(line);
        this._updateDebugPanel();
    },

    _updateDebugPanel() {
        // Debug panel disabled in production
    },

    SYNC_KEYS: [
        'profile', 'goals', 'creature', 'creature_streak', 'creature_xp_last',
        'coins', 'owned_items', 'equipped_items', 'favorites', 'recent',
        'custom_foods', 'weight_log', 'food_stats', 'settings', 'theme',
        'daily_cal_bonus', 'daily_water_bonus', 'log_dates', 'trial',
        'gym_goals', 'my_supplements', 'custom_supplements',
        'user_meals', 'notification_prefs'
    ],

    init() {
        this._log('init() REST mode');
        if (typeof firebase === 'undefined' || !firebase.apps.length) {
            this._log('init ABORTED — no Firebase', true);
            return;
        }
        // Get project ID from Firebase config
        const app = firebase.app();
        this._projectId = app.options.projectId;
        this._log('Project: ' + this._projectId);
    },

    isReady() {
        return !!this._projectId && AuthService.isLoggedIn();
    },

    // Get auth token for REST API calls
    async _getToken() {
        const user = AuthService.getCurrentUser();
        if (!user) return null;
        try {
            return await user.getIdToken();
        } catch (e) {
            this._log('getIdToken FAILED: ' + e.message, true);
            return null;
        }
    },

    // Firestore REST API base URL
    _baseUrl() {
        return `https://firestore.googleapis.com/v1/projects/${this._projectId}/databases/(default)/documents`;
    },

    // Convert JS object to Firestore document fields
    _toFirestoreFields(obj) {
        const fields = {};
        for (const [key, val] of Object.entries(obj)) {
            if (val === null || val === undefined) continue;
            if (typeof val === 'string') {
                fields[key] = { stringValue: val };
            } else if (typeof val === 'number') {
                fields[key] = Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
            } else if (typeof val === 'boolean') {
                fields[key] = { booleanValue: val };
            } else {
                fields[key] = { stringValue: JSON.stringify(val) };
            }
        }
        return fields;
    },

    // Convert Firestore fields back to JS object
    _fromFirestoreFields(fields) {
        const obj = {};
        for (const [key, val] of Object.entries(fields)) {
            if (val.stringValue !== undefined) obj[key] = val.stringValue;
            else if (val.integerValue !== undefined) obj[key] = parseInt(val.integerValue);
            else if (val.doubleValue !== undefined) obj[key] = val.doubleValue;
            else if (val.booleanValue !== undefined) obj[key] = val.booleanValue;
            else if (val.nullValue !== undefined) obj[key] = null;
            else if (val.mapValue) obj[key] = this._fromFirestoreFields(val.mapValue.fields || {});
        }
        return obj;
    },

    // === SAVE ALL DATA TO CLOUD ===
    async saveAll() {
        this._log('saveAll() called');

        if (!this.isReady()) {
            this._log('saveAll ABORTED — not ready', true);
            return;
        }
        if (this._syncing) {
            this._log('saveAll ABORTED — already syncing', true);
            return;
        }
        this._syncing = true;

        try {
            const token = await this._getToken();
            if (!token) {
                this._log('saveAll ABORTED — no token', true);
                return;
            }

            const uid = AuthService.getCurrentUser()?.uid;

            // Gather data from localStorage
            const dataFields = {};
            for (const key of this.SYNC_KEYS) {
                const val = localStorage.getItem('nutritrack_' + key);
                if (val !== null) {
                    dataFields[key] = { stringValue: val };
                }
            }

            this._log('Gathered ' + Object.keys(dataFields).length + ' keys');

            // Gather meal logs + gym logs + supplement logs
            const logDates = JSON.parse(localStorage.getItem('nutritrack_log_dates') || '[]');
            const logs = {};
            for (const date of logDates) {
                const logVal = localStorage.getItem('nutritrack_log_' + date);
                if (logVal) logs[date] = logVal;
                // Also sync gym data for this date
                const gymVal = localStorage.getItem('nutritrack_gym_' + date);
                if (gymVal) logs['gym_' + date] = gymVal;
                // Also sync supplement data for this date
                const supplVal = localStorage.getItem('nutritrack_suppl_' + date);
                if (supplVal) logs['suppl_' + date] = supplVal;
            }
            this._log(Object.keys(logs).length + ' meal+gym logs');

            if (Object.keys(dataFields).length === 0) {
                this._log('NO DATA to save', true);
                return;
            }

            // Save main document via REST PATCH
            const url = `${this._baseUrl()}/users/${uid}`;
            this._log('PUT ' + url.split('/documents/')[1]);

            const body = {
                fields: {
                    data: {
                        mapValue: { fields: dataFields }
                    },
                    updatedAt: {
                        timestampValue: new Date().toISOString()
                    }
                }
            };

            const res = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errText = await res.text();
                this._log('Save FAILED HTTP ' + res.status + ': ' + errText.substring(0, 200), true);
                return;
            }

            this._log('Main doc SAVED');

            // Save meal logs as individual documents
            for (const [date, logStr] of Object.entries(logs)) {
                const logUrl = `${this._baseUrl()}/users/${uid}/logs/${date}`;
                const logBody = {
                    fields: {
                        data: { stringValue: logStr }
                    }
                };
                const logRes = await fetch(logUrl, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(logBody)
                });
                if (!logRes.ok) {
                    this._log('Log save FAILED for ' + date, true);
                }
            }

            if (Object.keys(logs).length > 0) {
                this._log('Logs SAVED');
            }

            this._log('saveAll COMPLETE (' + Object.keys(dataFields).length + ' keys + ' + Object.keys(logs).length + ' logs)');
            this._failCount = 0;
        } catch (e) {
            this._log('saveAll FAILED: ' + e.message, true);
            this._failCount = (this._failCount || 0) + 1;
            // Show toast on 3rd consecutive failure (avoid noise on transient errors)
            if (this._failCount >= 3 && typeof App !== 'undefined') {
                App.showToast('Sync \u00e9chou\u00e9e \u2014 v\u00e9rifie ta connexion');
                this._failCount = 0;
            }
        } finally {
            this._syncing = false;
            this._lastSyncTime = Date.now(); // Always update to prevent retry floods on persistent errors
        }
    },

    // === LOAD ALL DATA FROM CLOUD ===
    async loadAll() {
        this._log('loadAll() called');

        if (!this.isReady()) {
            this._log('loadAll ABORTED — not ready', true);
            return false;
        }

        try {
            const token = await this._getToken();
            if (!token) {
                this._log('loadAll ABORTED — no token', true);
                return false;
            }

            const uid = AuthService.getCurrentUser()?.uid;
            const url = `${this._baseUrl()}/users/${uid}`;
            this._log('GET ' + url.split('/documents/')[1]);

            const res = await fetch(url, {
                headers: { 'Authorization': 'Bearer ' + token }
            });

            if (res.status === 404) {
                this._log('No cloud data for this user');
                return false;
            }

            if (!res.ok) {
                const errText = await res.text();
                this._log('Load FAILED HTTP ' + res.status + ': ' + errText.substring(0, 200), true);
                return false;
            }

            const doc = await res.json();
            this._log('Doc received, fields: ' + (doc.fields ? Object.keys(doc.fields).join(',') : 'none'));

            if (!doc.fields || !doc.fields.data || !doc.fields.data.mapValue) {
                this._log('No .data field in document', true);
                return false;
            }

            const dataFields = doc.fields.data.mapValue.fields || {};
            this._log('Cloud data keys: ' + Object.keys(dataFields).join(','));

            // Restore to localStorage
            let restored = 0;
            for (const [key, val] of Object.entries(dataFields)) {
                if (val.stringValue !== undefined) {
                    try {
                        localStorage.setItem('nutritrack_' + key, val.stringValue);
                        restored++;
                    } catch (e) {
                        this._log('localStorage FAIL: ' + key, true);
                    }
                }
            }
            this._log('Restored ' + restored + ' keys');

            // Load meal logs from subcollection
            const logsUrl = `${this._baseUrl()}/users/${uid}/logs`;
            const logsRes = await fetch(logsUrl, {
                headers: { 'Authorization': 'Bearer ' + token }
            });

            let logCount = 0;
            if (logsRes.ok) {
                const logsData = await logsRes.json();
                const documents = logsData.documents || [];
                for (const logDoc of documents) {
                    const docId = logDoc.name.split('/').pop();
                    if (logDoc.fields?.data?.stringValue) {
                        try {
                            // Gym logs: gym_YYYY-MM-DD, suppl logs: suppl_YYYY-MM-DD, meal logs: YYYY-MM-DD
                            const lsKey = (docId.startsWith('gym_') || docId.startsWith('suppl_')) ? 'nutritrack_' + docId : 'nutritrack_log_' + docId;
                            localStorage.setItem(lsKey, logDoc.fields.data.stringValue);
                            logCount++;
                        } catch (e) {
                            this._log('localStorage FAIL log: ' + docId, true);
                        }
                    }
                }
            }

            this._log('loadAll COMPLETE: ' + restored + ' keys + ' + logCount + ' logs');
            return restored > 0;
        } catch (e) {
            this._log('loadAll FAILED: ' + e.message, true);
            return false;
        }
    },

    // === AUTO-SYNC on key changes ===
    async autoSync() {
        if (!this.isReady()) return;
        if (Date.now() - this._lastSyncTime < 3000) return; // 3s debounce for instant sync
        this._log('autoSync triggered');
        // Update local sync timestamp
        localStorage.setItem('nutritrack_last_sync_ts', new Date().toISOString());
        await this.saveAll();
    },

    // === POLLING: Check for remote changes every 5 seconds for near-instant sync ===
    _pollingInterval: null,
    _lastCloudTimestamp: null,

    startPolling() {
        if (this._pollingInterval) return;
        this._pollingInterval = setInterval(() => this._pollForChanges(), 30000); // 30s for multi-device sync
        this._log('Polling started (every 30s)');

        // Also sync when tab becomes visible (instant sync when switching devices/tabs)
        if (!this._visibilityHandler) {
            this._visibilityHandler = () => {
                if (!document.hidden && this.isReady()) {
                    this._log('Tab visible — polling now');
                    this._pollForChanges();
                }
            };
            document.addEventListener('visibilitychange', this._visibilityHandler);
        }
    },

    stopPolling() {
        if (this._pollingInterval) {
            clearInterval(this._pollingInterval);
            this._pollingInterval = null;
            this._log('Polling stopped');
        }
        if (this._visibilityHandler) {
            document.removeEventListener('visibilitychange', this._visibilityHandler);
            this._visibilityHandler = null;
        }
    },

    async _pollForChanges() {
        if (!this.isReady() || this._syncing) return;
        try {
            const token = await this._getToken();
            if (!token) return;
            const uid = AuthService.getCurrentUser()?.uid;
            const url = `${this._baseUrl()}/users/${uid}`;
            const res = await fetch(url, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (!res.ok) return;
            const doc = await res.json();
            const cloudTs = doc.fields?.updatedAt?.timestampValue;
            if (!cloudTs) return;

            // Compare with last known cloud timestamp
            if (this._lastCloudTimestamp && cloudTs !== this._lastCloudTimestamp) {
                this._log('Remote change detected, pulling...');
                const loaded = await this.loadAll();
                if (loaded && App.currentPage) {
                    // Refresh current page to show new data
                    const pageConfig = App.pages[App.currentPage];
                    if (pageConfig) pageConfig.render({});
                }
            }
            this._lastCloudTimestamp = cloudTs;
        } catch (e) {
            this._log('Poll error: ' + e.message, true);
        }
    },

    // === SYNC ON LOGIN ===
    async onLogin() {
        this._log('onLogin() called');
        if (!this.isReady()) {
            this._log('onLogin ABORTED — not ready', true);
            return;
        }

        try {
            const token = await this._getToken();
            if (!token) {
                this.startPolling();
                return;
            }

            const uid = AuthService.getCurrentUser()?.uid;
            const url = `${this._baseUrl()}/users/${uid}`;

            const res = await fetch(url, {
                headers: { 'Authorization': 'Bearer ' + token }
            });

            if (res.ok) {
                const doc = await res.json();
                if (doc.fields?.data?.mapValue?.fields) {
                    const cloudKeys = Object.keys(doc.fields.data.mapValue.fields);
                    const cloudTs = doc.fields?.updatedAt?.timestampValue;
                    const localTs = localStorage.getItem('nutritrack_last_sync_ts');
                    const localProfile = localStorage.getItem('nutritrack_profile');

                    this._log('onLogin: cloud=' + cloudKeys.length + ' keys, cloudTs=' + (cloudTs || 'none') + ', localTs=' + (localTs || 'none'));

                    if (!localProfile) {
                        // No local data at all → restore from cloud
                        this._log('Local empty → restoring from cloud');
                        await this.loadAll();
                    } else if (cloudTs && localTs && new Date(cloudTs) > new Date(localTs)) {
                        // Cloud is more recent → pull from cloud
                        this._log('Cloud is newer → restoring from cloud');
                        await this.loadAll();
                        // Re-render current page with new data
                        if (App.currentPage) {
                            const pageConfig = App.pages[App.currentPage];
                            if (pageConfig) pageConfig.render({});
                        }
                    } else {
                        // Local is more recent or same → push to cloud
                        this._log('Local is newer or equal → saving to cloud');
                        await this.saveAll();
                    }
                } else {
                    this._log('Cloud empty → pushing local');
                    await this.saveAll();
                }
            } else {
                this._log('Cloud fetch failed → pushing local');
                await this.saveAll();
            }
        } catch (e) {
            this._log('onLogin FAILED: ' + e.message, true);
        }

        // Always start polling for multi-device sync
        this.startPolling();
    }
};
