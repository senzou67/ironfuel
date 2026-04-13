import { hasAuthToken, checkRateLimit, jsonResponse, errorResponse } from './_shared.js';
import { enrichFoods } from './nutrition-lookup.js';

export async function onRequestPost(context) {
    const { env, request } = context;

    if (!hasAuthToken(request)) {
        return errorResponse('Authentification requise.', 401);
    }

    // Rate limit: 20 analyses/hour per IP
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    if (!await checkRateLimit(env, `analyze:${ip}`, 20)) {
        return errorResponse('Trop de requêtes. Réessaie dans quelques minutes.', 429);
    }

    const GEMINI_KEY = env.GEMINI_API_KEY;
    if (!GEMINI_KEY) return errorResponse('Clé API Gemini non configurée sur le serveur.');

    try {
        const { image } = await request.json();
        if (!image) return errorResponse('Image manquante.', 400);

        const prompt = `Analyse cette photo de nourriture. Identifie chaque aliment visible.

Reponds UNIQUEMENT avec un JSON valide, sans texte avant ou apres, au format:
{
  "foods": [
    {
      "name": "nom de l'aliment en francais",
      "name_en": "food name in English (for database lookup)",
      "weight_g": estimation du poids en grammes (nombre entier),
      "calories": calories totales estimees pour ce poids (nombre entier),
      "protein": proteines estimees en grammes (nombre avec 1 decimale),
      "carbs": glucides estimes en grammes (nombre avec 1 decimale),
      "fat": lipides estimes en grammes (nombre avec 1 decimale),
      "fiber": fibres estimees en grammes (nombre avec 1 decimale)
    }
  ]
}

Regles:
- Estime le poids de maniere realiste en te basant sur la taille apparente des portions.
- Si tu vois une assiette, estime par rapport a la taille standard d'une assiette (26cm).
- name_en doit etre le nom generique de l'aliment en anglais (ex: "grilled chicken breast", "white rice", "banana").`;

        // Stable models only — gemini-2.0-flash and gemini-2.0-flash-lite are restricted
        // for new API keys. gemini-2.5-flash is the most reliable choice.
        const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest'];
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
                            contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: image } }] }],
                            generationConfig: { temperature: 0.3, maxOutputTokens: 2048, responseMimeType: 'application/json' }
                        })
                    }
                );

                const rawText = await response.text();
                let data;
                try { data = JSON.parse(rawText); } catch { lastError = `Réponse invalide de Gemini (${model})`; console.error('[analyze] Invalid JSON from', model, rawText.substring(0, 200)); continue; }
                if (!response.ok) {
                    lastError = data.error?.message || `Erreur Gemini (${model}): ${response.status}`;
                    console.error('[analyze] Model failed:', model, 'status:', response.status, 'error:', lastError);
                    continue;
                }

                const candidate = data.candidates?.[0];
                if (!candidate || candidate.finishReason === 'SAFETY') { lastError = 'Gemini a refusé l\'image (filtre de sécurité)'; continue; }

                text = candidate.content?.parts?.[0]?.text?.trim();
                if (text) break;
                lastError = `Réponse vide de Gemini (${model})`;
            } catch (e) {
                lastError = e.message;
            }
        }

        if (!text) return errorResponse(lastError || 'Pas de réponse de Gemini.');

        let result = null;
        // Try parsing as-is first (responseMimeType: application/json)
        try { result = JSON.parse(text); } catch {}
        // Try extracting from markdown code block
        if (!result) {
            const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) { try { result = JSON.parse(jsonMatch[1].trim()); } catch {} }
        }
        // Try extracting first { ... } block
        if (!result) {
            const s = text.indexOf('{'), e = text.lastIndexOf('}');
            if (s !== -1 && e > s) { try { result = JSON.parse(text.substring(s, e + 1)); } catch {} }
        }
        // Try extracting first [ ... ] block (array of foods directly)
        if (!result) {
            const s = text.indexOf('['), e = text.lastIndexOf(']');
            if (s !== -1 && e > s) { try { const arr = JSON.parse(text.substring(s, e + 1)); result = { foods: arr }; } catch {} }
        }
        if (!result) return errorResponse('Réponse IA mal formée. Réessaie.');

        let enriched;
        try {
            enriched = await enrichFoods(result.foods || [], env.USDA_API_KEY || 'DEMO_KEY');
        } catch (enrichErr) {
            console.error('enrichFoods failed, using raw Gemini results:', enrichErr.message);
            enriched = (result.foods || []).map(f => ({
                name: f.name, weight_g: f.weight_g || 100,
                calories: f.calories || 0, protein: f.protein || 0,
                carbs: f.carbs || 0, fat: f.fat || 0, fiber: f.fiber || 0,
                source: 'estimate'
            }));
        }
        return jsonResponse({ foods: enriched });
    } catch (err) {
        return errorResponse(err.message || 'Erreur serveur.');
    }
}
