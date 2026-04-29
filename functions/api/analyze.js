import { hasAuthToken, checkRateLimit, jsonResponse, errorResponse } from './_shared.js';
import { enrichFoods } from './nutrition-lookup.js';

export async function onRequestPost(context) {
    const { env, request } = context;

    if (!hasAuthToken(request)) {
        return errorResponse('Authentification requise.', 401);
    }

    // Rate limit: 40 analyses/hour per IP — covers typical day of meal logging
    // (4 meals × ~3 photo retries on average) with comfort margin.
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    if (!await checkRateLimit(env, `analyze:${ip}`, 40)) {
        return errorResponse('Trop d\'analyses — limite horaire atteinte. Réessaie dans une heure.', 429);
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

Regles importantes pour l'estimation du poids (sois PRECIS, ne surestime JAMAIS) :
- Si tu vois une assiette, compare a la taille standard (26cm de diametre).
- Portions de reference REALISTES pour des aliments seuls (partie comestible, sans coquille ni os) :
  * 1 oeuf (dur/poche/mollet) = 50g (jamais plus de 55g)
  * 1 tranche de pain = 30g | 1/4 baguette = 65g
  * 1 filet de poulet cuit = 130g | 1 cuisse de poulet = 180g
  * 1 pavé de saumon = 130g | 1 steak haché = 100-150g
  * 1 portion de pates/riz cuits = 180-250g | 1 bol de cereales = 40g de sec
  * 1 pomme moyenne = 180g | 1 banane moyenne = 120g | 1 avocat = 150g
  * 1 tranche de jambon = 30g | 1 tranche de fromage = 30g
  * 1 yaourt = 125g | 1 verre de lait = 200g
  * 1 portion de salade = 50-100g | 1 tomate moyenne = 120g
- En cas de doute, PRIVILEGIE une estimation BASSE plutot que haute.
- Les valeurs caloriques et macros DOIVENT etre calculees en fonction de la partie comestible uniquement.
- name_en doit etre le nom generique de l'aliment en anglais (ex: "hard boiled egg", "grilled chicken breast", "white rice", "banana").`;

        // Latest stable Gemini models. Older gemini-2.0-* are deprecated for new API keys.
        const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest'];
        // Per-model timeout: 22s (leaves room for fallback within Cloudflare's 30s CPU limit).
        const PER_MODEL_TIMEOUT_MS = 22000;
        let result = null;
        let lastError = null;

        // Try each model. Parse INSIDE the loop so a model that returns
        // unparseable text (plain prose, truncated JSON, etc.) falls back
        // to the next model instead of failing the whole request.
        for (const model of models) {
            const ac = new AbortController();
            const timer = setTimeout(() => ac.abort(), PER_MODEL_TIMEOUT_MS);
            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: image } }] }],
                            generationConfig: { temperature: 0.3, maxOutputTokens: 2048, responseMimeType: 'application/json' }
                        }),
                        signal: ac.signal
                    }
                );

                const rawText = await response.text();
                let data;
                try { data = JSON.parse(rawText); } catch { lastError = `Réponse invalide de Gemini (${model})`; console.error('[analyze] Invalid JSON from', model, rawText.substring(0, 200)); continue; }
                if (!response.ok) {
                    const errMsg = data.error?.message || '';
                    // Model deprecated / restricted for this API key — try next model silently
                    if (/no longer available|not found|not supported|deprecated|PERMISSION_DENIED/i.test(errMsg)) {
                        console.error('[analyze] Model unavailable:', model, '—', errMsg);
                        lastError = 'Modèle IA temporairement indisponible. Réessaie.';
                        continue;
                    }
                    lastError = errMsg || `Erreur Gemini (${model}): ${response.status}`;
                    console.error('[analyze] Model failed:', model, 'status:', response.status, 'error:', lastError);
                    continue;
                }

                const candidate = data.candidates?.[0];
                if (!candidate) { lastError = `Pas de candidat (${model})`; continue; }
                if (candidate.finishReason === 'SAFETY') { lastError = 'Photo refusée par le filtre de sécurité Google. Reprends une autre photo.'; continue; }
                if (candidate.finishReason === 'RECITATION') { lastError = `Réponse incomplète (${model})`; continue; }

                const text = candidate.content?.parts?.[0]?.text?.trim();
                if (!text) { lastError = `Réponse vide de Gemini (${model})`; continue; }

                // Try to parse the response. If unparseable, try the NEXT model.
                let parsed = null;
                try { parsed = JSON.parse(text); } catch {}
                if (!parsed) {
                    const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
                    if (m) { try { parsed = JSON.parse(m[1].trim()); } catch {} }
                }
                if (!parsed) {
                    const s = text.indexOf('{'), e = text.lastIndexOf('}');
                    if (s !== -1 && e > s) { try { parsed = JSON.parse(text.substring(s, e + 1)); } catch {} }
                }
                if (!parsed) {
                    const s = text.indexOf('['), e = text.lastIndexOf(']');
                    if (s !== -1 && e > s) { try { const arr = JSON.parse(text.substring(s, e + 1)); parsed = { foods: arr }; } catch {} }
                }

                if (parsed && (Array.isArray(parsed) || Array.isArray(parsed.foods))) {
                    result = Array.isArray(parsed) ? { foods: parsed } : parsed;
                    break;
                }
                // Parse failed — log preview and try next model
                lastError = `Réponse IA mal formée (${model})`;
                console.error('[analyze] Unparseable response from', model, '—', text.substring(0, 200));
            } catch (e) {
                if (e.name === 'AbortError') {
                    lastError = `Timeout sur ${model} (${PER_MODEL_TIMEOUT_MS/1000}s)`;
                    console.error('[analyze]', lastError);
                } else {
                    lastError = e.message;
                }
            } finally {
                clearTimeout(timer);
            }
        }

        if (!result) return errorResponse(lastError || 'Pas de réponse de Gemini.');

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
