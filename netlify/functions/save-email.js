// Save user email with consent & metadata to Firestore
const admin = require('firebase-admin');

// Init Firebase Admin (once per cold start)
if (!admin.apps.length) {
    try {
        const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
        admin.initializeApp({
            credential: admin.credential.cert(sa),
            projectId: sa.project_id || process.env.FIREBASE_PROJECT_ID
        });
    } catch (e) {
        console.error('Firebase Admin init failed:', e.message);
    }
}

function getDb() {
    try { return admin.firestore(); } catch { return null; }
}

const ALLOWED_ORIGIN = process.env.URL || 'https://theonefood.netlify.app';

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method not allowed' };
    }

    try {
        const { userId, email, displayName, consent, streak, signupDate } = JSON.parse(event.body || '{}');

        if (!email) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email required' }) };
        }

        const db = getDb();
        if (!db) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Database not available' }) };
        }

        const emailKey = email.toLowerCase().trim();
        const docId = emailKey.replace(/[^a-z0-9@._-]/g, '_');

        await db.collection('emails').doc(docId).set({
            email: emailKey,
            userId: userId || 'anonymous',
            displayName: displayName || '',
            emailConsent: !!consent,
            consentDate: consent ? admin.firestore.FieldValue.serverTimestamp() : null,
            streak: streak || 0,
            signupDate: signupDate || new Date().toISOString(),
            source: 'login',
            lastSeenAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log('✅ Email saved:', emailKey, 'consent:', consent);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true })
        };
    } catch (err) {
        console.error('Save email error:', err.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message })
        };
    }
};
