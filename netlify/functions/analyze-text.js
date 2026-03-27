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
    const headers = {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

    if (admin) {
        const authHeader = event.headers.authorization || event.headers.Authorization || '';
        const token = authHeader.replace('Bearer ', '');
        if (!token) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Authentification requise.' }) };
        try { await admin.auth().verifyIdToken(token); } catch { return { statusCode: 403, headers, body: JSON.stringify({ error: 'Token invalide.' }) }; }
    }

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Clé API Gemini non configurée.' }) };

    try {
        const { text } = JSON.parse(event.body);
        if (!text) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Texte manquant.' }) };

        const prompt = `L'utilisateur decrit ce qu'il a mange. Identifie chaque aliment et donne les informations nutritionnelles au format JSON strict.

Description de l'utilisateur : "${text}"

Reponds UNIQUEMENT avec un JSON valide, sans texte avant ou apres, au format:
{
  "foods": [
    {
      "name": "nom de l'aliment en francais",
      "weight_g": poids estime en grammes (nombre entier),
      "calories": calories totales pour ce poids (nombre entier),
      "protein": proteines en grammes (nombre avec 1 decimale),
      "carbs": glucides en grammes (nombre avec 1 decimale),
      "fat": lipides en grammes (nombre avec 1 decimale),
      "fiber": fibres en grammes (nombre avec 1 decimale)
    }
  ]
}

Regles importantes:
- Si l'utilisateur mentionne une quantite (ex: "200g de poulet"), utilise cette quantite.
- Si aucune quantite n'est mentionnee, utilise une portion standard typique (ex: 1 oeuf = 60g, 1 pomme = 180g, 1 assiette de pates = 250g cuites, 1 tranche de pain = 30g).
- Separe chaque aliment distinct (ex: "poulet et riz" = 2 aliments).
- Donne les valeurs pour le poids indique, pas pour 100g.
- Les noms doivent etre en francais.`;

        const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
        let result = null;

        for (const model of models) {
            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: { temperature: 0.3, maxOutputTokens: 2048, responseMimeType: 'application/json' }
                        })
                    }
                );
                const rawText = await response.text();
                let data;
                try { data = JSON.parse(rawText); } catch { continue; }
                if (!response.ok) continue;

                const candidate = data.candidates?.[0];
                if (!candidate || candidate.finishReason === 'SAFETY') continue;

                const raw = candidate.content?.parts?.[0]?.text?.trim();
                if (raw) {
                    let jsonStr = raw;
                    const m = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
                    if (m) jsonStr = m[1].trim();
                    else { const s = raw.indexOf('{'), e = raw.lastIndexOf('}'); if (s !== -1 && e > s) jsonStr = raw.substring(s, e + 1); }
                    try { result = JSON.parse(jsonStr); } catch { continue; }
                    break;
                }
            } catch {}
        }

        if (!result) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Pas de réponse de Gemini.' }) };
        return { statusCode: 200, headers, body: JSON.stringify({ foods: result.foods || [] }) };
    } catch (err) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || 'Erreur serveur.' }) };
    }
};
