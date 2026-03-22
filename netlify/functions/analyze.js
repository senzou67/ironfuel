const ALLOWED_ORIGIN = process.env.URL || 'https://theironfuel.netlify.app';
const admin = (() => {
    try {
        const a = require('firebase-admin');
        if (!a.apps.length) {
            const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
            if (sa) a.initializeApp({ credential: a.credential.cert(JSON.parse(sa)) });
        }
        return a.apps.length ? a : null;
    } catch { return null; }
})();

exports.handler = async (event) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    // Verify Firebase auth token (prevent unauthorized API usage)
    if (admin) {
        const authHeader = event.headers.authorization || event.headers.Authorization || '';
        const token = authHeader.replace('Bearer ', '');
        if (!token) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'Authentification requise.' }) };
        }
        try {
            await admin.auth().verifyIdToken(token);
        } catch (e) {
            return { statusCode: 403, headers, body: JSON.stringify({ error: 'Token invalide.' }) };
        }
    }

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Clé API Gemini non configurée sur le serveur.' })
        };
    }

    try {
        const { image } = JSON.parse(event.body);
        if (!image) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Image manquante.' })
            };
        }

        const prompt = `Analyse cette photo de nourriture. Pour chaque aliment visible, donne-moi les informations suivantes au format JSON strict.

Reponds UNIQUEMENT avec un JSON valide, sans texte avant ou apres, au format:
{
  "foods": [
    {
      "name": "nom de l'aliment en francais",
      "weight_g": estimation du poids en grammes (nombre entier),
      "calories": calories totales pour ce poids (nombre entier),
      "protein": proteines en grammes (nombre avec 1 decimale),
      "carbs": glucides en grammes (nombre avec 1 decimale),
      "fat": lipides en grammes (nombre avec 1 decimale),
      "fiber": fibres en grammes (nombre avec 1 decimale)
    }
  ]
}

Estime le poids de maniere realiste en te basant sur la taille apparente des portions. Si tu vois une assiette, estime par rapport a la taille standard d'une assiette (26cm).`;

        const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
        let text = null;
        let lastError = null;

        for (const model of models) {
            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{
                                parts: [
                                    { text: prompt },
                                    { inlineData: { mimeType: 'image/jpeg', data: image } }
                                ]
                            }],
                            generationConfig: {
                                temperature: 0.3,
                                maxOutputTokens: 2048,
                                responseMimeType: 'application/json'
                            }
                        })
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
                    if (text) break;
                }

                const err = await response.json().catch(() => ({}));
                lastError = err.error?.message || `Erreur Gemini (${model}): ${response.status}`;
            } catch (e) {
                lastError = e.message;
            }
        }
        if (!text) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Pas de réponse de Gemini.' })
            };
        }

        // Parse JSON from response — strip markdown wrapping if present
        let jsonStr = text;

        // Try ```json ... ``` wrapping
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        } else {
            // Fallback: extract first { ... } block
            const braceStart = text.indexOf('{');
            const braceEnd = text.lastIndexOf('}');
            if (braceStart !== -1 && braceEnd > braceStart) {
                jsonStr = text.substring(braceStart, braceEnd + 1);
            }
        }

        const result = JSON.parse(jsonStr);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ foods: result.foods || [] })
        };

    } catch (err) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message || 'Erreur serveur.' })
        };
    }
};
