const CameraPage = {
    stream: null,

    render() {
        const content = document.getElementById('page-content');
        content.innerHTML = `
            <div class="camera-container fade-in">
                <div class="camera-preview" id="camera-preview">
                    <video id="camera-video" autoplay playsinline></video>
                    <canvas id="camera-canvas"></canvas>
                    <img id="camera-photo" style="display:none" alt="Photo capturee">
                    <button id="flash-toggle" class="flash-btn hidden" onclick="CameraPage.toggleFlash()">💡</button>
                </div>

                <div class="camera-controls" id="camera-controls">
                    <button class="camera-btn" id="capture-btn" onclick="CameraPage.capture()">
                        <div class="camera-btn-inner"></div>
                    </button>
                </div>

                <div id="camera-actions" style="display:none">
                    <div style="display:flex;gap:12px;margin:16px 0">
                        <button class="btn btn-secondary" style="flex:1" onclick="CameraPage.retake()">
                            Reprendre
                        </button>
                        <button class="btn btn-primary" style="flex:1" onclick="CameraPage.analyze()">
                            Analyser
                        </button>
                    </div>
                </div>

                <div id="camera-loading" style="display:none">
                    <div class="spinner"></div>
                    <p style="text-align:center;color:var(--text-secondary);font-size:14px">
                        Analyse en cours...
                    </p>
                </div>

                <div id="camera-results" style="display:none"></div>

                <div style="margin-top:16px">
                    <label class="btn btn-outline" style="cursor:pointer;display:block;text-align:center">
                        📁 Importer une photo
                        <input type="file" accept="image/*" style="display:none" onchange="CameraPage.importPhoto(event)">
                    </label>
                </div>
            </div>
        `;

        this.startCamera();
    },

    async startCamera() {
        try {
            // Check permission status first (avoid repeated prompts)
            let needsPrePrompt = false;
            if (navigator.permissions) {
                try {
                    const perm = await navigator.permissions.query({ name: 'camera' });
                    if (perm.state === 'denied') {
                        App.showToast('Autorise la caméra dans les paramètres de ton navigateur');
                        return;
                    }
                    // 'prompt' = never asked → show our explanation first (Apple guideline 5.1.1)
                    needsPrePrompt = (perm.state === 'prompt');
                } catch {}
            } else {
                // Permissions API not supported (Safari < 16) — show pre-prompt once
                needsPrePrompt = !sessionStorage.getItem('camera_explained');
            }

            if (needsPrePrompt && typeof Modal !== 'undefined') {
                const accepted = await new Promise((resolve) => {
                    Modal.show(`
                        <div style="text-align:center">
                            <div style="font-size:48px;margin-bottom:12px">📸</div>
                            <div class="modal-title">Photo IA</div>
                            <p style="color:var(--text-secondary);font-size:14px;line-height:1.5;margin-bottom:12px">
                                Pour analyser tes repas en photo, OneFood a besoin d'accéder à ton appareil photo.
                            </p>
                            <p style="color:var(--text-secondary);font-size:12px;line-height:1.4;margin-bottom:16px">
                                Les photos sont envoyées à Google Gemini pour analyse puis <strong>immédiatement supprimées</strong>.
                                Aucune image n'est stockée par OneFood.
                            </p>
                            <div style="display:flex;gap:8px">
                                <button class="btn btn-secondary" id="cam-prompt-deny" style="flex:1">Refuser</button>
                                <button class="btn btn-primary" id="cam-prompt-accept" style="flex:1">Autoriser</button>
                            </div>
                        </div>
                    `);
                    const finish = (ok) => { try { Modal.close(); } catch {} resolve(ok); };
                    setTimeout(() => {
                        const a = document.getElementById('cam-prompt-accept');
                        const d = document.getElementById('cam-prompt-deny');
                        if (a) a.onclick = () => finish(true);
                        if (d) d.onclick = () => finish(false);
                    }, 0);
                });
                if (!accepted) {
                    App.showToast('Photo IA désactivée — autorise la caméra plus tard si tu changes d\'avis.');
                    return;
                }
                try { sessionStorage.setItem('camera_explained', '1'); } catch {}
            }

            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } }
            });
            const video = document.getElementById('camera-video');
            if (video) video.srcObject = this.stream;

            // Check torch capability
            const track = this.stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities ? track.getCapabilities() : {};
            if (capabilities.torch) {
                this._torchTrack = track;
                this._torchOn = false;
                const btn = document.getElementById('flash-toggle');
                if (btn) btn.classList.remove('hidden');
            }
        } catch (err) {
            if (err.name === 'NotAllowedError') {
                App.showToast('Autorise l\'accès caméra dans les paramètres de ton navigateur');
            } else {
                App.showToast('Impossible d\'accéder à la caméra');
            }
        }
    },

    toggleFlash() {
        if (!this._torchTrack) return;
        this._torchOn = !this._torchOn;
        this._torchTrack.applyConstraints({ advanced: [{ torch: this._torchOn }] });
        const btn = document.getElementById('flash-toggle');
        if (btn) btn.textContent = this._torchOn ? '🔦' : '💡';
    },

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }
    },

    capture() {
        const video = document.getElementById('camera-video');
        const canvas = document.getElementById('camera-canvas');
        const photo = document.getElementById('camera-photo');
        if (!video || !canvas) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);

        photo.src = canvas.toDataURL('image/jpeg', 0.8);
        photo.style.display = 'block';
        video.style.display = 'none';

        document.getElementById('camera-controls').style.display = 'none';
        document.getElementById('camera-actions').style.display = 'block';

        this.stopCamera();
    },

    retake() {
        const video = document.getElementById('camera-video');
        const photo = document.getElementById('camera-photo');
        if (video) video.style.display = 'block';
        if (photo) photo.style.display = 'none';

        document.getElementById('camera-controls').style.display = 'flex';
        document.getElementById('camera-actions').style.display = 'none';
        document.getElementById('camera-results').style.display = 'none';

        this.startCamera();
    },

    importPhoto(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const photo = document.getElementById('camera-photo');
            const video = document.getElementById('camera-video');
            photo.src = e.target.result;
            photo.style.display = 'block';
            if (video) video.style.display = 'none';

            document.getElementById('camera-controls').style.display = 'none';
            document.getElementById('camera-actions').style.display = 'block';

            this.stopCamera();
        };
        reader.readAsDataURL(file);
    },

    async analyze() {
        const photo = document.getElementById('camera-photo');
        if (!photo || !photo.src) return;

        document.getElementById('camera-actions').style.display = 'none';
        document.getElementById('camera-loading').style.display = 'block';

        try {
            // Robust image loading: works for JPEG / PNG / WebP / HEIC (iOS) when
            // the browser supports it. createImageBitmap is faster + more
            // tolerant than <img> and properly decodes EXIF rotation.
            let bitmap;
            try {
                const blob = await (await fetch(photo.src)).blob();
                if (typeof createImageBitmap !== 'undefined') {
                    bitmap = await createImageBitmap(blob);
                } else {
                    const img = new Image();
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                        img.src = photo.src;
                    });
                    bitmap = img;
                }
            } catch (e) {
                throw new Error('Format d\'image non supporté. Essaie une photo JPEG/PNG.');
            }

            // Resize to max 1280px and compress aggressively to limit upload size
            // (Gemini doesn't need pixel-perfect images for food recognition)
            const MAX_SIZE = 1280;
            let w = bitmap.width, h = bitmap.height;
            if (!w || !h) throw new Error('Image vide ou corrompue.');
            if (w > MAX_SIZE || h > MAX_SIZE) {
                const ratio = Math.min(MAX_SIZE / w, MAX_SIZE / h);
                w = Math.round(w * ratio);
                h = Math.round(h * ratio);
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
            // Quality 0.78 keeps 1280×960 JPEG under ~250KB → fast upload
            const base64 = canvas.toDataURL('image/jpeg', 0.78).split(',')[1];

            let foods = null;
            let lastError = null;
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    foods = await VisionService.analyzeImage(base64);
                    if (foods && foods.length > 0) break;
                    lastError = new Error('Aucun aliment détecté');
                } catch (e) {
                    lastError = e;
                    // 429 / auth errors won't get better with retry — bail out
                    if (/limite|expirée|429|401/i.test(e.message)) break;
                }
                if (attempt < 2 && (!foods || foods.length === 0)) {
                    App.showToast(`Nouvel essai... (${attempt + 2}/3)`);
                    // Exponential backoff: 800ms, 1600ms
                    await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
                }
            }
            if ((!foods || foods.length === 0) && lastError && lastError.message !== 'Aucun aliment détecté') {
                throw lastError;
            }

            document.getElementById('camera-loading').style.display = 'none';
            if (foods && foods.length > 0) {
                try { AnalyticsService.logPhotoIA(true, foods.length); } catch {}
                this.showResults(foods);
            } else {
                try { AnalyticsService.logPhotoIA(false, 0, 'no_food_detected'); } catch {}
                document.getElementById('camera-actions').style.display = 'block';
                App.showToast('Aucun aliment détecté. Cadre l\'assiette de plus près avec un bon éclairage.');
            }
        } catch (err) {
            try { AnalyticsService.logPhotoIA(false, 0, err.message?.substring(0, 50) || 'unknown'); } catch {}
            document.getElementById('camera-loading').style.display = 'none';
            document.getElementById('camera-actions').style.display = 'block';
            App.showToast(err.message || 'Erreur — réessaie');
        }
    },

    showResults(foods) {
        const resultsEl = document.getElementById('camera-results');
        resultsEl.style.display = 'block';

        if (!foods || foods.length === 0) {
            resultsEl.innerHTML = `
                <div class="card" style="text-align:center">
                    <p>Aucun aliment détecté. Essayez avec une photo plus claire.</p>
                    <button class="btn btn-primary mt-16" onclick="CameraPage.retake()">Reprendre</button>
                </div>
            `;
            return;
        }

        resultsEl.innerHTML = `
            <h3 style="margin:0 0 12px;font-size:16px">Aliments détectés :</h3>
            ${foods.map((food, i) => `
                <div class="ai-result-card">
                    <div class="ai-result-title">${_esc(food.name)}</div>
                    <div class="ai-result-weight">~${food.weight_g}g ${food.source === 'usda' ? '· <span style="color:var(--success);font-weight:600">USDA</span>' : food.source === 'openfoodfacts' ? '· <span style="color:var(--success);font-weight:600">OFF</span>' : '· estimé'}</div>
                    <div class="nutrition-preview">
                        <div class="nutrition-item cal">
                            <span class="nutrition-item-value">${food.calories}</span>
                            <span class="nutrition-item-label">Calories</span>
                        </div>
                        <div class="nutrition-item prot">
                            <span class="nutrition-item-value">${food.protein}g</span>
                            <span class="nutrition-item-label">Prot.</span>
                        </div>
                        <div class="nutrition-item carb">
                            <span class="nutrition-item-value">${food.carbs}g</span>
                            <span class="nutrition-item-label">Gluc.</span>
                        </div>
                        <div class="nutrition-item fat">
                            <span class="nutrition-item-value">${food.fat}g</span>
                            <span class="nutrition-item-label">Lip.</span>
                        </div>
                        <div class="nutrition-item fiber">
                            <span class="nutrition-item-value">${food.fiber || 0}g</span>
                            <span class="nutrition-item-label">Fib.</span>
                        </div>
                    </div>
                    <button class="btn btn-primary" onclick="CameraPage.addResult(${i})" style="margin-top:8px">
                        Ajouter au journal
                    </button>
                </div>
            `).join('')}
            <button class="btn btn-secondary" onclick="CameraPage.retake()" style="width:100%;margin-top:12px">
                Nouvelle photo
            </button>
        `;

        this._results = foods;
    },

    addResult(index) {
        const food = this._results[index];
        if (!food) return;
        Modal.showCustomFoodModal(food, { dateStr: App._localDateKey(App.getSelectedDate()) });
    },

    cleanup() {
        this.stopCamera();
    }
};
