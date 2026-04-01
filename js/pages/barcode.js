const BarcodePage = {
    stream: null,
    scanning: false,
    detector: null,
    _html5QrScanner: null,
    _useNative: false,

    render() {
        this._useNative = ('BarcodeDetector' in window);

        const content = document.getElementById('page-content');
        content.innerHTML = `
            <div class="barcode-container fade-in">
                <p style="color:var(--text-secondary);font-size:13px;margin-bottom:10px">
                    Scannez le code-barres d'un produit
                </p>

                <div class="barcode-scanner" id="barcode-scanner">
                    ${this._useNative
                        ? '<video id="barcode-video" autoplay playsinline></video><div class="scan-line"></div><button id="barcode-flash" class="flash-btn hidden" onclick="BarcodePage.toggleFlash()">💡</button>'
                        : '<div id="barcode-reader"></div>'
                    }
                </div>

                <div id="barcode-status" style="margin:16px 0;color:var(--text-secondary);font-size:14px">
                    Positionnez le code-barres dans le cadre
                </div>

                <div id="barcode-loading" style="display:none">
                    <div class="spinner"></div>
                    <p style="text-align:center;color:var(--text-secondary)">Recherche du produit...</p>
                </div>

                <div id="barcode-result" style="display:none"></div>

                <div class="form-group" style="margin-top:16px">
                    <label class="form-label">Ou saisissez le code manuellement</label>
                    <div style="display:flex;gap:8px">
                        <input type="text" class="form-input" id="manual-barcode" placeholder="3017620422003" inputmode="numeric">
                        <button class="btn btn-primary" onclick="BarcodePage.manualSearch()" style="white-space:nowrap">
                            OK
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.startScanning();
    },

    async startScanning() {
        if (this._useNative) {
            this._startNativeScanning();
        } else {
            this._startHtml5Scanning();
        }
    },

    async _startNativeScanning() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 } }
            });
            const video = document.getElementById('barcode-video');
            if (video) {
                video.srcObject = this.stream;
                this.scanning = true;
                this.detectBarcode();

                // Check torch capability
                const track = this.stream.getVideoTracks()[0];
                const capabilities = track.getCapabilities ? track.getCapabilities() : {};
                if (capabilities.torch) {
                    this._torchTrack = track;
                    this._torchOn = false;
                    const btn = document.getElementById('barcode-flash');
                    if (btn) btn.classList.remove('hidden');
                }
            }
        } catch (err) {
            const status = document.getElementById('barcode-status');
            if (status) status.textContent = 'Impossible d\'accéder à la caméra. Saisissez le code manuellement.';
        }
    },

    async _startHtml5Scanning() {
        try {
            const readerEl = document.getElementById('barcode-reader');
            if (!readerEl || typeof Html5Qrcode === 'undefined') {
                const status = document.getElementById('barcode-status');
                if (status) status.textContent = 'Scanner non disponible. Saisissez le code manuellement.';
                return;
            }

            this._html5QrScanner = new Html5Qrcode('barcode-reader');
            this.scanning = true;

            await this._html5QrScanner.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 100 },
                    aspectRatio: 1.0,
                    videoConstraints: {
                        facingMode: 'environment',
                        aspectRatio: 1.0
                    },
                    formatsToSupport: [
                        Html5QrcodeSupportedFormats.EAN_13,
                        Html5QrcodeSupportedFormats.EAN_8,
                        Html5QrcodeSupportedFormats.UPC_A,
                        Html5QrcodeSupportedFormats.UPC_E
                    ]
                },
                (decodedText) => {
                    if (this.scanning) {
                        this.scanning = false;
                        this.onBarcodeDetected(decodedText);
                    }
                },
                () => { /* ignore scan misses */ }
            );
        } catch (err) {
            const status = document.getElementById('barcode-status');
            if (status) status.textContent = 'Impossible d\'accéder à la caméra. Saisissez le code manuellement.';
        }
    },

    async detectBarcode() {
        if (!this.scanning) return;

        if (!this.detector) {
            try {
                this.detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
            } catch {
                this.detector = null;
            }
        }

        if (this.detector) {
            const video = document.getElementById('barcode-video');
            if (!video || video.readyState < 2) {
                requestAnimationFrame(() => this.detectBarcode());
                return;
            }

            try {
                const barcodes = await this.detector.detect(video);
                if (barcodes.length > 0) {
                    this.scanning = false;
                    this.onBarcodeDetected(barcodes[0].rawValue);
                    return;
                }
            } catch {}
        }

        if (this.scanning) {
            setTimeout(() => this.detectBarcode(), 500);
        }
    },

    async onBarcodeDetected(code) {
        const status = document.getElementById('barcode-status');
        const loading = document.getElementById('barcode-loading');
        if (status) status.textContent = `Code détecté : ${code}`;
        if (loading) loading.style.display = 'block';

        this.stopScanning();
        await this.fetchProduct(code);
    },

    toggleFlash() {
        if (!this._torchTrack) return;
        this._torchOn = !this._torchOn;
        this._torchTrack.applyConstraints({ advanced: [{ torch: this._torchOn }] });
        const btn = document.getElementById('barcode-flash');
        if (btn) btn.textContent = this._torchOn ? '🔦' : '💡';
    },

    async manualSearch() {
        const input = document.getElementById('manual-barcode');
        const code = input.value.trim();
        if (!code) return;

        this.stopScanning();
        document.getElementById('barcode-loading').style.display = 'block';
        document.getElementById('barcode-status').textContent = `Recherche : ${code}`;
        await this.fetchProduct(code);
    },

    async fetchProduct(code) {
        const loading = document.getElementById('barcode-loading');
        const resultEl = document.getElementById('barcode-result');

        try {
            const product = await OpenFoodFactsService.getProduct(code);

            loading.style.display = 'none';
            resultEl.style.display = 'block';

            const n = product.nutrition;
            resultEl.innerHTML = `
                <div class="ai-result-card">
                    ${product.image ? `<img src="${product.image}" alt="${product.name}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;float:right;margin-left:12px">` : ''}
                    <div class="ai-result-title">${product.name}</div>
                    ${product.brand ? `<div style="color:var(--text-secondary);font-size:13px">${product.brand}</div>` : ''}
                    ${product.nutriscore ? `
                        <div style="margin:8px 0">
                            <span style="background:${this.nutriscoreColor(product.nutriscore)};color:white;padding:2px 8px;border-radius:4px;font-weight:700;font-size:12px;text-transform:uppercase">
                                Nutri-Score ${product.nutriscore}
                            </span>
                        </div>
                    ` : ''}
                    <div style="clear:both"></div>
                    <div class="nutrition-preview" style="margin-top:12px">
                        <div class="nutrition-item cal">
                            <span class="nutrition-item-value">${n.calories}</span>
                            <span class="nutrition-item-label">kcal/100g</span>
                        </div>
                        <div class="nutrition-item prot">
                            <span class="nutrition-item-value">${n.protein}g</span>
                            <span class="nutrition-item-label">Prot.</span>
                        </div>
                        <div class="nutrition-item carb">
                            <span class="nutrition-item-value">${n.carbs}g</span>
                            <span class="nutrition-item-label">Gluc.</span>
                        </div>
                        <div class="nutrition-item fat">
                            <span class="nutrition-item-value">${n.fat}g</span>
                            <span class="nutrition-item-label">Lip.</span>
                        </div>
                    </div>
                    <button class="btn btn-primary" onclick="BarcodePage.addProduct()" style="margin-top:12px">
                        Ajouter au journal
                    </button>
                </div>
                <button class="btn btn-secondary" onclick="BarcodePage.rescan()" style="width:100%;margin-top:12px">
                    Scanner un autre produit
                </button>
            `;

            this._currentProduct = product;
        } catch (err) {
            loading.style.display = 'none';
            resultEl.style.display = 'block';
            resultEl.innerHTML = `
                <div class="card" style="text-align:center">
                    <p style="color:var(--danger);margin-bottom:12px">
                        ${err.message || 'Produit non trouvé'}
                    </p>
                    <button class="btn btn-primary" onclick="BarcodePage.rescan()">
                        Réessayer
                    </button>
                </div>
            `;
        }
    },

    addProduct() {
        if (!this._currentProduct) return;
        const n = this._currentProduct.nutrition;
        Modal.showCustomFoodModal({
            name: this._currentProduct.name + (this._currentProduct.brand ? ` (${this._currentProduct.brand})` : ''),
            weight_g: 100,
            calories: n.calories,
            protein: n.protein,
            carbs: n.carbs,
            fat: n.fat,
            fiber: n.fiber,
            barcode: this._currentProduct.barcode || null,
            source: 'barcode'
        });
    },

    rescan() {
        document.getElementById('barcode-result').style.display = 'none';
        document.getElementById('barcode-status').textContent = 'Positionnez le code-barres dans le cadre';
        this.scanning = true;
        this.startScanning();
    },

    nutriscoreColor(grade) {
        const colors = { a: '#038141', b: '#85BB2F', c: '#FECB02', d: '#EE8100', e: '#E63E11' };
        return colors[grade] || '#999';
    },

    stopScanning() {
        this.scanning = false;
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }
        if (this._html5QrScanner) {
            this._html5QrScanner.stop().catch(() => {});
            this._html5QrScanner = null;
        }
    },

    cleanup() {
        this.stopScanning();
    }
};
