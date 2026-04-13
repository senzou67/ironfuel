// Worker entry point — routes /api/* requests to function handlers
import { jsonResponse, errorResponse } from './functions/api/_shared.js';

// Import all function handlers
import * as analyze from './functions/api/analyze.js';
import * as analyzeText from './functions/api/analyze-text.js';
import * as communityFoods from './functions/api/community-foods.js';
import * as createCheckout from './functions/api/create-checkout.js';
import * as verifyPayment from './functions/api/verify-payment.js';
import * as stripeWebhook from './functions/api/stripe-webhook.js';
import * as createPaypalOrder from './functions/api/create-paypal-order.js';
import * as capturePaypalOrder from './functions/api/capture-paypal-order.js';
import * as paypalWebhook from './functions/api/paypal-webhook.js';
import * as createPortalSession from './functions/api/create-portal-session.js';
import * as sendNotification from './functions/api/send-notification.js';
import * as dailyNotification from './functions/api/daily-notification.js';
import * as saveEmail from './functions/api/save-email.js';
import * as trialCheck from './functions/api/trial-check.js';
import * as adminApi from './functions/api/admin-api.js';
import * as errorLog from './functions/api/error-log.js';

const ROUTES = {
    '/api/analyze': analyze,
    '/api/analyze-text': analyzeText,
    '/api/community-foods': communityFoods,
    '/api/create-checkout': createCheckout,
    '/api/verify-payment': verifyPayment,
    '/api/stripe-webhook': stripeWebhook,
    '/api/create-paypal-order': createPaypalOrder,
    '/api/capture-paypal-order': capturePaypalOrder,
    '/api/paypal-webhook': paypalWebhook,
    '/api/create-portal-session': createPortalSession,
    '/api/send-notification': sendNotification,
    '/api/daily-notification': dailyNotification,
    '/api/save-email': saveEmail,
    '/api/trial-check': trialCheck,
    '/api/admin-api': adminApi,
    '/api/error-log': errorLog,
};

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;

        // Static assets are handled automatically by Cloudflare Workers Assets

        // API routing
        if (path.startsWith('/api/')) {
            const ALLOWED_ORIGIN = env.URL || 'https://1food.fr';
            const corsHeaders = {
                'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            };

            // CORS preflight
            if (request.method === 'OPTIONS') {
                return new Response(null, { status: 204, headers: corsHeaders });
            }

            // Match route (strip query string)
            const routePath = path.replace(/\/+$/, '');
            const handler = ROUTES[routePath];

            if (!handler) {
                return new Response(JSON.stringify({ error: 'Not found' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            // Build context object matching Pages Functions API
            const context = {
                request,
                env,
                data: { corsHeaders, ALLOWED_ORIGIN },
            };

            try {
                let response;
                const method = request.method;

                if (method === 'POST' && handler.onRequestPost) {
                    response = await handler.onRequestPost(context);
                } else if (method === 'GET' && handler.onRequestGet) {
                    response = await handler.onRequestGet(context);
                } else if (handler.onRequest) {
                    response = await handler.onRequest(context);
                } else {
                    response = new Response(JSON.stringify({ error: 'Method not allowed' }), {
                        status: 405,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Add CORS headers
                const newResponse = new Response(response.body, response);
                Object.entries(corsHeaders).forEach(([k, v]) => {
                    newResponse.headers.set(k, v);
                });
                return newResponse;
            } catch (err) {
                return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }
        }

        // Not an API route and not a static asset — return 404
        return new Response('Not found', { status: 404 });
    },

    // Cron trigger for daily notifications
    async scheduled(event, env, ctx) {
        if (dailyNotification.default?.scheduled) {
            await dailyNotification.default.scheduled(event, env, ctx);
        }
    }
};
