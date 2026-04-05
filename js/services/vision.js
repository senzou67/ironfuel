const VisionService = {
    _prompt: `Analyse cette photo de nourriture. Pour chaque aliment visible, donne-moi les informations suivantes au format JSON strict.

Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après, au format:
{
  "foods": [
    {
      "name": "nom de l'aliment en français",
      "weight_g": estimation du poids en grammes (nombre entier),
      "calories": calories totales pour ce poids (nombre entier),
      "protein": protéines en grammes (nombre avec 1 décimale),
      "carbs": glucides en grammes (nombre avec 1 décimale),
      "fat": lipides en grammes (nombre avec 1 décimale),
      "fiber": fibres en grammes (nombre avec 1 décimale)
    }
  ]
}

Estime le poids de manière réaliste en te basant sur la taille apparente des portions. Si tu vois une assiette, estime par rapport à la taille standard d'une assiette (26cm).`,

    async analyzeImage(base64Image) {
        return this._analyzeWithServer(base64Image);
    },

    async _analyzeWithServer(base64Image) {
        // Get Firebase auth token for API authentication
        const reqHeaders = { 'Content-Type': 'application/json' };
        try {
            const user = AuthService.getCurrentUser();
            if (user) {
                const token = await user.getIdToken();
                reqHeaders['Authorization'] = 'Bearer ' + token;
            }
        } catch(e) {}

        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: reqHeaders,
            body: JSON.stringify({ image: base64Image })
        });

        const rawText = await response.text();
        let data;
        try { data = JSON.parse(rawText); } catch {
            throw new Error('Erreur serveur — réessaie dans quelques secondes.');
        }
        if (!response.ok) {
            throw new Error(data.error || `Erreur serveur: ${response.status}`);
        }
        return data.foods || [];
    },

    async _analyzeWithGemini(base64Image, apiKey) {
        const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
        let lastError = null;

        for (const model of models) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { text: this._prompt },
                                { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
                            ]
                        }],
                        generationConfig: {
                            temperature: 0.3,
                            maxOutputTokens: 2048,
                            responseMimeType: 'application/json'
                        }
                    })
                });

                const rawText = await response.text();
                let data;
                try { data = JSON.parse(rawText); } catch { lastError = `Réponse invalide (${model})`; continue; }

                if (!response.ok) {
                    lastError = data.error?.message || `Erreur API Gemini (${model}): ${response.status}`;
                    continue;
                }

                const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
                if (text) return this._parseResponse(text);
                lastError = `Réponse vide (${model})`;
            } catch (e) {
                lastError = e.message;
            }
        }

        throw new Error(lastError || 'Pas de réponse de Gemini');
    },

    async _analyzeWithOpenAI(base64Image, apiKey) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'text', text: this._prompt },
                        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}`, detail: 'high' } }
                    ]
                }],
                max_tokens: 1000,
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `Erreur API OpenAI: ${response.status}`);
        }

        const data = await response.json();
        const text = data.choices[0].message.content.trim();
        return this._parseResponse(text);
    },

    _parseResponse(text) {
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

        let result;
        try { result = JSON.parse(jsonStr); } catch {
            throw new Error('L\'IA n\'a pas pu analyser cette image. Réessaie avec une photo plus claire.');
        }
        return result.foods || [];
    }
};
