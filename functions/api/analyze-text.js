import { verifyAuth, jsonResponse, errorResponse } from './_shared.js';
import { enrichFoods } from './nutrition-lookup.js';

export async function onRequestPost(context) {
    const { env, request } = context;

    if (!await verifyAuth(request, env)) {
        return errorResponse('Authentification requise.', 401);
    }

    const GEMINI_KEY = env.GEMINI_API_KEY;
    if (!GEMINI_KEY) return errorResponse('Clé API Gemini non configurée.');

    try {
        const { text } = await request.json();
        if (!text) return errorResponse('Texte manquant.', 400);

        const prompt = `L'utilisateur decrit ce qu'il a mange. Identifie chaque aliment.

Description de l'utilisateur : "${text}"

Reponds UNIQUEMENT avec un JSON valide, sans texte avant ou apres, au format:
{
  "foods": [
    {
      "name": "nom de l'aliment en francais",
      "name_en": "food name in English (for database lookup)",
      "weight_g": poids en grammes (nombre entier),
      "calories": calories estimees pour ce poids (nombre entier),
      "protein": proteines estimees en grammes (nombre avec 1 decimale),
      "carbs": glucides estimes en grammes (nombre avec 1 decimale),
      "fat": lipides estimes en grammes (nombre avec 1 decimale),
      "fiber": fibres estimees en grammes (nombre avec 1 decimale)
    }
  ]
}

Regles:
- Si l'utilisateur mentionne une quantite (ex: "200g de poulet"), utilise cette quantite.
- Si aucune quantite n'est mentionnee, utilise une portion standard typique (ex: 1 oeuf = 60g, 1 pomme = 180g, 1 assiette de pates = 250g cuites, 1 tranche de pain = 30g).
- Separe chaque aliment distinct (ex: "poulet et riz" = 2 aliments).
- name_en doit etre le nom generique de l'aliment en anglais (ex: "grilled chicken breast", "white rice", "banana").`;

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

        if (!result) return errorResponse('Pas de réponse de Gemini.');

        const enriched = await enrichFoods(result.foods || [], env.USDA_API_KEY || 'DEMO_KEY');
        return jsonResponse({ foods: enriched });
    } catch (err) {
        return errorResponse(err.message || 'Erreur serveur.');
    }
}
