// Cloudflare Pages Functions middleware — CORS for all /api/* routes
export async function onRequest(context) {
    const ALLOWED_ORIGIN = context.env.URL || 'https://1food.fr';
    const corsHeaders = {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    };

    // Handle CORS preflight
    if (context.request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Pass CORS headers and env to downstream functions
    context.data.corsHeaders = corsHeaders;
    context.data.ALLOWED_ORIGIN = ALLOWED_ORIGIN;

    // Execute the actual function
    const response = await context.next();

    // Add CORS headers to the response
    const newResponse = new Response(response.body, response);
    Object.entries(corsHeaders).forEach(([k, v]) => {
        newResponse.headers.set(k, v);
    });

    return newResponse;
}
