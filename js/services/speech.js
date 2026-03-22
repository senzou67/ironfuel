const SpeechService = {
    recognition: null,
    isListening: false,
    _stopTimeout: null,
    _onResultCb: null,
    _onEndCb: null,
    _finalText: '',
    _accumulatedText: '',

    init() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return false;

        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'fr-FR';
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
        return true;
    },

    isSupported() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    },

    // Continuous mode for hold-to-record
    async startContinuous(onInterim, onError) {
        // Always stop previous instance cleanly before starting new one
        if (this.isListening) {
            this.isListening = false;
            try { this.recognition.abort(); } catch(e) {}
            await new Promise(r => setTimeout(r, 100));
        }

        // Re-create recognition instance to avoid stale state
        this.recognition = null;
        if (!this.init()) {
            onError('La reconnaissance vocale n\'est pas supportée. Utilisez Chrome ou Edge.');
            return;
        }

        // Request microphone permission
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
        } catch (err) {
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                onError('Accès au microphone refusé. Autorisez le microphone dans les paramètres.');
            } else if (err.name === 'NotFoundError') {
                onError('Aucun microphone détecté.');
            } else {
                onError('Impossible d\'accéder au microphone : ' + err.message);
            }
            return;
        }

        // Reset state
        this._finalText = '';
        this._accumulatedText = '';
        this.isListening = true;

        // Safety timeout: 30 seconds for continuous mode
        this._clearTimeout();
        this._stopTimeout = setTimeout(() => {
            this.stop();
        }, 30000);

        this.recognition.onresult = (event) => {
            let fullTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
                fullTranscript += event.results[i][0].transcript;
            }
            this._accumulatedText = fullTranscript;
            if (onInterim) onInterim(fullTranscript);
        };

        this.recognition.onend = () => {
            // In continuous mode, if we're still supposed to be listening, restart
            if (this.isListening) {
                try {
                    this.recognition.start();
                } catch(e) {
                    this.isListening = false;
                    this._clearTimeout();
                }
            }
        };

        this.recognition.onerror = (event) => {
            if (event.error === 'no-speech') {
                // Ignore no-speech in continuous mode, keep listening
                return;
            }
            if (event.error === 'aborted') return;

            this._clearTimeout();
            this.isListening = false;

            let msg;
            switch(event.error) {
                case 'not-allowed':
                    msg = '🔒 Microphone bloqué. Autorisez-le dans les paramètres de votre navigateur (🔒 à côté de l\'URL).';
                    break;
                case 'network':
                    msg = '📡 Pas de connexion. La reconnaissance vocale nécessite Internet.';
                    break;
                case 'audio-capture':
                    msg = '🎙️ Aucun microphone détecté. Branchez un micro ou vérifiez les permissions.';
                    break;
                case 'service-not-allowed':
                    msg = '⚠️ Service vocal indisponible. Essayez Chrome ou Edge.';
                    break;
                default:
                    msg = `⚠️ Voix non captée. Parlez plus fort ou rapprochez-vous du micro.`;
            }
            if (onError) onError(msg);
        };

        try {
            this.recognition.start();
        } catch(e) {
            this.isListening = false;
            this._clearTimeout();
            if (onError) onError('Erreur lors du démarrage. Réessayez.');
        }
    },

    // Legacy single-shot start (kept for backward compat)
    async start(onResult, onInterim, onEnd, onError) {
        if (!this.recognition && !this.init()) {
            onError('La reconnaissance vocale n\'est pas supportée.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
        } catch (err) {
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                onError('Accès au microphone refusé.');
            } else {
                onError('Impossible d\'accéder au microphone.');
            }
            return;
        }

        this._finalText = '';
        this._accumulatedText = '';
        this._onResultCb = onResult;
        this._onEndCb = onEnd;
        this.isListening = true;

        this._clearTimeout();
        this._stopTimeout = setTimeout(() => {
            this.forceStop(onResult, onEnd);
        }, 15000);

        this.recognition.onresult = (event) => {
            let interim = '';
            let finalResult = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalResult += transcript;
                } else {
                    interim += transcript;
                }
            }

            if (interim && onInterim) onInterim(interim);

            if (finalResult) {
                this._finalText = finalResult;
                this._accumulatedText = finalResult;
                this._clearTimeout();
                try { this.recognition.stop(); } catch(e) {}
                this.isListening = false;
                if (onResult) onResult(finalResult);
            }
        };

        this.recognition.onend = () => {
            this._clearTimeout();
            if (this.isListening && !this._finalText) {
                const textEl = document.getElementById('voice-text');
                const lastInterim = textEl ? textEl.textContent : '';
                if (lastInterim && lastInterim !== 'Parlez maintenant...' && lastInterim !== 'Maintenez pour parler') {
                    this.isListening = false;
                    if (this._onResultCb) this._onResultCb(lastInterim);
                    if (this._onEndCb) this._onEndCb();
                    return;
                }
            }
            this.isListening = false;
            if (onEnd) onEnd();
        };

        this.recognition.onerror = (event) => {
            this._clearTimeout();
            this.isListening = false;
            let msg;
            switch(event.error) {
                case 'not-allowed': msg = '🔒 Microphone bloqué. Autorisez-le dans les paramètres du navigateur.'; break;
                case 'no-speech': msg = '🎙️ Aucune voix détectée. Parlez plus fort et rapprochez-vous du micro.'; break;
                case 'network': msg = '📡 Pas de connexion. La reconnaissance vocale nécessite Internet.'; break;
                case 'aborted': msg = 'Reconnaissance interrompue.'; break;
                case 'audio-capture': msg = '🎙️ Aucun microphone détecté. Vérifiez votre matériel.'; break;
                default: msg = '⚠️ Voix non captée. Essayez de parler plus clairement.';
            }
            if (onError) onError(msg);
        };

        try {
            this.recognition.start();
        } catch(e) {
            this.isListening = false;
            this._clearTimeout();
            if (onError) onError('Erreur lors du démarrage.');
        }
    },

    getAccumulatedText() {
        return this._accumulatedText || '';
    },

    stop() {
        this._clearTimeout();
        this.isListening = false; // Set before stop to prevent restart in onend
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch(e) {
                try { this.recognition.abort(); } catch(e2) {}
            }
            // Null out handlers to prevent stale callbacks
            this.recognition.onresult = null;
            this.recognition.onend = null;
            this.recognition.onerror = null;
        }
    },

    forceStop(onResult, onEnd) {
        if (this.isListening) {
            const lastText = this._accumulatedText;
            this.isListening = false;
            try { this.recognition.abort(); } catch(e) {}

            if (lastText) {
                if (onResult) onResult(lastText);
            }
            if (onEnd) onEnd();
        }
    },

    _clearTimeout() {
        if (this._stopTimeout) {
            clearTimeout(this._stopTimeout);
            this._stopTimeout = null;
        }
    },

    // Voice correction dictionary for commonly misrecognized food names
    _voiceCorrections: {
        'squirre': 'skyr', 'squire': 'skyr', 'skyeur': 'skyr', 'skirr': 'skyr', 'skire': 'skyr',
        'squirr': 'skyr', 'skir': 'skyr', 'skyrd': 'skyr', 'squirt': 'skyr',
        'whey': 'whey', 'oui': 'whey', 'ouais': 'whey',
        'muesli': 'muesli', 'musli': 'muesli', 'mussli': 'muesli',
        'quinoa': 'quinoa', 'quino': 'quinoa', 'kinoa': 'quinoa',
        'houmous': 'houmous', 'houmos': 'houmous', 'hummus': 'houmous',
        'açaï': 'acai', 'assaille': 'acai', 'assaï': 'acai',
        'edamame': 'edamame', 'et damame': 'edamame',
        'granola': 'granola', 'granol': 'granola',
        'tofu': 'tofu', 'tofou': 'tofu',
    },

    _applyVoiceCorrections(text) {
        let corrected = text;
        for (const [wrong, right] of Object.entries(this._voiceCorrections)) {
            const regex = new RegExp('\\b' + wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
            corrected = corrected.replace(regex, right);
        }
        return corrected;
    },

    // Parse voice input to extract food name and weight
    parseVoiceInput(text) {
        let normalized = text.toLowerCase().trim();

        // Apply voice corrections for commonly misrecognized words
        normalized = this._applyVoiceCorrections(normalized);

        // Strip common filler words
        normalized = normalized.replace(/\b(?:euh|hum|alors|donc|voilà|j'ai mangé|j'ai pris)\b/gi, '').trim();

        const patterns = [
            /(\d+)\s*(?:grammes?|g|gr)\s+(?:de\s+)?(.+)/i,
            /(.+?)\s+(\d+)\s*(?:grammes?|g|gr)/i,
            /(\d+)\s*(?:grammes?|g|gr)\s*(.+)/i
        ];

        for (const pattern of patterns) {
            const match = normalized.match(pattern);
            if (match) {
                const g1 = match[1], g2 = match[2];
                const num1 = parseInt(g1), num2 = parseInt(g2);

                if (!isNaN(num1) && isNaN(num2)) {
                    return { weight: num1, foodName: g2.replace(/\bde\s+/i, '').trim() };
                } else if (isNaN(num1) && !isNaN(num2)) {
                    return { weight: num2, foodName: g1.replace(/\bde\s+/i, '').trim() };
                }
            }
        }

        const numMatch = normalized.match(/(\d+)/);
        const foodName = normalized.replace(/\d+\s*(?:grammes?|g|gr)?/i, '').replace(/\bde\s+/i, '').trim();

        if (numMatch && foodName) {
            return { weight: parseInt(numMatch[1]), foodName };
        }

        // Handle "une banane", "un oeuf" — strip article, use default weight
        const cleaned = normalized.replace(/^(?:une?|des|du|la|le|les|l')\s+/i, '').trim();
        return { weight: 100, foodName: cleaned || normalized };
    },

    // Search food database with parsed input (single food)
    findFood(voiceText) {
        const parsed = this.parseVoiceInput(voiceText);
        const results = FoodDB.search(parsed.foodName);
        return { parsed, results };
    },

    // Parse and find multiple foods from a single voice input
    findMultipleFoods(text) {
        const normalized = text.toLowerCase().trim();

        // Step 1: Split on explicit separators: comma, "et", "plus", "aussi", "ensuite", "puis"
        const separators = /\s*(?:,|\.|\bet\b|\bplus\b|\baussi\b|\bensuite\b|\bpuis\b|\baprès\b)\s*/i;
        let parts = normalized.split(separators).filter(p => p.trim().length > 2);

        // Step 2: If only 1 part, try splitting on weight patterns (e.g. "200g de poulet 150g de riz")
        if (parts.length <= 1) {
            // Split before each weight mention: "200g", "200 grammes", "150g", "un/une"
            const weightSplit = normalized.split(/\s+(?=\d+\s*(?:grammes?|g|gr|kg|kilos?)\b)/i).filter(p => p.trim().length > 2);
            if (weightSplit.length > 1) {
                parts = weightSplit;
            } else {
                // Also try splitting on "un/une/deux/trois..." as food count indicators
                const countSplit = normalized.split(/\s+(?=(?:une?|deux|trois|quatre|cinq)\s+)/i).filter(p => p.trim().length > 2);
                if (countSplit.length > 1) {
                    parts = countSplit;
                }
            }
        }

        // If still only one part, try single food
        if (parts.length <= 1) {
            const single = this.findFood(text);
            if (single.results.length > 0) {
                return [single];
            }
            return [];
        }

        // Parse each part independently
        const allResults = [];
        for (const part of parts) {
            const trimmed = part.trim();
            if (!trimmed || trimmed.length < 2) continue;

            const parsed = this.parseVoiceInput(trimmed);
            const results = FoodDB.search(parsed.foodName);
            allResults.push({ parsed, results });
        }

        return allResults;
    }
};
