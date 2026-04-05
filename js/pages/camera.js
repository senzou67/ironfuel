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
            if (navigator.permissions) {
                try {
                    const perm = await navigator.permissions.query({ name: 'camera' });
                    if (perm.state === 'denied') {
                        App.showToast('Autorise la caméra dans les paramètres de ton navigateur');
                        return;
                    }
                } catch {}
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
            const canvas = document.createElement('canvas');
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = photo.src;
            });
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext('2d').drawImage(img, 0, 0);
            const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

            let foods = null;
            for (let attempt = 0; attempt < 2; attempt++) {
                try {
                    foods = await VisionService.analyzeImage(base64);
                    if (foods && foods.length > 0) break;
                } catch (e) {
                    if (attempt === 0) {
                        App.showToast('Retry en cours...');
                        continue;
                    }
                    throw e;
                }
            }

            document.getElementById('camera-loading').style.display = 'none';
            if (foods && foods.length > 0) {
                this.showResults(foods);
            } else {
                document.getElementById('camera-actions').style.display = 'block';
                App.showToast('Aucun aliment détecté. Réessaie avec une photo plus claire.');
            }
        } catch (err) {
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
                    <div class="ai-result-title">${food.name}</div>
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
        Modal.showCustomFoodModal(food);
    },

    cleanup() {
        this.stopCamera();
    }
};
