const CustomFoodPage = {
    _photoData: null,

    // Optional params.name pre-fills the name field — used when arriving from
    // the "Créer cet aliment" CTA in the search results so the user doesn't
    // re-type what they just searched.
    // Re-run the category guess when the user finishes typing the name.
    // We only override the dropdown if the user hasn't manually changed it
    // (data-auto="1" → still on the auto-suggested value).
    _onNameBlur() {
        const name = (document.getElementById('cf-name')?.value || '').trim();
        const sel = document.getElementById('cf-category');
        if (!sel || sel.dataset.auto !== '1') return;
        const guess = this._guessCategory(name);
        if (guess && sel.value !== guess) sel.value = guess;
    },

    // Guess the most likely food category from the food name. The dropdown
    // used to default to "Fruits" (first option), so a user creating "Œuf dur"
    // who forgot to change it got fruit-category micronutrients — totally
    // unrelated to the actual food. This heuristic suggests a sensible
    // default that the user can still override.
    _guessCategory(name) {
        if (!name) return 'plats';
        const n = String(name).toLowerCase();
        const rules = [
            { kw: ['oeuf', 'œuf', 'poulet', 'dinde', 'boeuf', 'bœuf', 'porc', 'jambon', 'lardon', 'viande', 'saucisse', 'steak', 'magret', 'agneau', 'veau'], cat: 'viandes' },
            { kw: ['saumon', 'thon', 'cabillaud', 'sardine', 'poisson', 'crevette', 'truite', 'maquereau', 'lieu', 'merlu', 'colin'], cat: 'poissons' },
            { kw: ['yaourt', 'fromage', 'skyr', 'mozzarella', 'lait ', 'crème', 'creme', 'beurre', 'kefir', 'ricotta'], cat: 'laitiers' },
            { kw: ['pain', 'pâte', 'pates', 'pâtes', 'riz', 'quinoa', 'avoine', 'flocon', 'farine', 'semoule', 'tartine', 'biscotte', 'couscous', 'boulghour', 'sarrasin'], cat: 'feculents' },
            { kw: ['pomme', 'banane', 'orange', 'fraise', 'raisin', 'mangue', 'kiwi', 'poire', 'abricot', 'cerise', 'pêche', 'peche', 'fruit', 'ananas', 'mûre', 'mure', 'myrtille', 'framboise', 'pastèque', 'pasteque'], cat: 'fruits' },
            { kw: ['salade', 'carotte', 'tomate', 'courgette', 'haricot vert', 'épinard', 'épinards', 'brocoli', 'poivron', 'oignon', 'concombre', 'légume', 'legume', 'aubergine', 'champignon', 'chou'], cat: 'legumes' },
            { kw: ['lentille', 'pois chiche', 'haricot rouge', 'haricot blanc', 'soja', 'tofu', 'fève', 'feve'], cat: 'legumineuses' },
            { kw: ['amande', 'noix', 'noisette', 'cacahuète', 'cacahuete', 'cajou', 'pistache', 'graine'], cat: 'noix' },
            { kw: ['huile', 'margarine', 'avocat'], cat: 'matieres_grasses' },
            { kw: ['eau ', 'jus', 'thé', ' the ', 'café', 'cafe', 'bière', 'biere', 'vin', 'boisson', 'coca', 'limonade', 'soda'], cat: 'boissons' },
            { kw: ['gâteau', 'gateau', 'biscuit', 'chocolat', 'bonbon', 'chips', 'barre'], cat: 'snacks' }
        ];
        for (const r of rules) {
            if (r.kw.some(k => n.includes(k))) return r.cat;
        }
        return 'plats';
    },

    render(params = {}) {
        const prefillName = (params && typeof params.name === 'string') ? params.name : '';
        const safeName = prefillName.replace(/"/g, '&quot;').replace(/</g, '&lt;');
        const guessedCat = this._guessCategory(prefillName);
        const content = document.getElementById('page-content');
        content.innerHTML = `
            <div class="custom-food-container fade-in">
                <h2 style="font-size:20px;margin-bottom:4px">Créer un aliment</h2>
                <p style="color:var(--text-secondary);font-size:14px;margin-bottom:16px">
                    Ajoutez un aliment personnalisé avec ses macronutriments
                </p>

                <div class="custom-food-photo" id="custom-photo-area">
                    <div class="photo-placeholder" id="photo-placeholder" onclick="document.getElementById('custom-photo-input').click()">
                        <span style="font-size:32px">📸</span>
                        <span style="font-size:13px;color:var(--text-secondary)">Ajouter une photo</span>
                    </div>
                    <img id="custom-photo-preview" style="display:none;width:100%;height:150px;object-fit:cover;border-radius:12px" alt="">
                    <input type="file" id="custom-photo-input" accept="image/*" capture="environment" style="display:none" onchange="CustomFoodPage.onPhoto(event)">
                </div>

                <div class="form-group">
                    <label class="form-label" for="cf-name">Nom de l'aliment *</label>
                    <input type="text" class="form-input" id="cf-name" placeholder="Ex: Gâteau maison" value="${safeName}"${prefillName ? '' : ' autofocus'} onblur="CustomFoodPage._onNameBlur()">
                </div>

                <div class="form-group">
                    <label class="form-label" for="cf-category">Catégorie</label>
                    <select class="form-select" id="cf-category" data-auto="1" onchange="this.dataset.auto='0'">
                        ${FoodDB.categories.map(c =>
                            `<option value="${c.id}"${c.id === guessedCat ? ' selected' : ''}>${c.icon} ${c.name}</option>`
                        ).join('')}
                    </select>
                    <div style="font-size:11px;color:var(--text-secondary);margin-top:4px">La catégorie détermine les micro-nutriments estimés (vitamines, minéraux).</div>
                </div>

                <div class="card" style="margin:16px 0">
                    <div class="card-title">Valeurs nutritionnelles pour 100g</div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                        <div class="form-group">
                            <label class="form-label">Calories (kcal) *</label>
                            <input type="number" class="form-input" id="cf-calories" placeholder="0" min="0" max="9999">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Protéines (g) *</label>
                            <input type="number" class="form-input" id="cf-protein" placeholder="0" min="0" max="999" step="0.1">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Glucides (g) *</label>
                            <input type="number" class="form-input" id="cf-carbs" placeholder="0" min="0" max="999" step="0.1">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Lipides (g) *</label>
                            <input type="number" class="form-input" id="cf-fat" placeholder="0" min="0" max="999" step="0.1">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Fibres (g)</label>
                            <input type="number" class="form-input" id="cf-fiber" placeholder="0" min="0" max="999" step="0.1">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Poids unitaire (g)</label>
                            <input type="number" class="form-input" id="cf-unit" placeholder="100" min="1" max="5000">
                        </div>
                    </div>
                </div>

                <button class="btn btn-primary" onclick="CustomFoodPage.save()" style="width:100%">
                    Sauvegarder l'aliment
                </button>
            </div>
        `;
        // When arriving with a pre-filled name (search → "Créer cet aliment"),
        // jump straight to the calories field so the user can start typing
        // macros immediately. Otherwise focus the name field.
        if (prefillName) {
            setTimeout(() => {
                const cal = document.getElementById('cf-calories');
                if (cal) cal.focus();
            }, 50);
        }
    },

    onPhoto(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            // Resize to 200x200 thumbnail to save storage
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 200;
                canvas.height = 200;
                const ctx = canvas.getContext('2d');
                const size = Math.min(img.width, img.height);
                const sx = (img.width - size) / 2;
                const sy = (img.height - size) / 2;
                ctx.drawImage(img, sx, sy, size, size, 0, 0, 200, 200);
                CustomFoodPage._photoData = canvas.toDataURL('image/jpeg', 0.6);

                const preview = document.getElementById('custom-photo-preview');
                const placeholder = document.getElementById('photo-placeholder');
                if (preview) {
                    preview.src = CustomFoodPage._photoData;
                    preview.style.display = 'block';
                }
                if (placeholder) placeholder.style.display = 'none';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    save() {
        const name = document.getElementById('cf-name').value.trim();
        const calories = parseFloat(document.getElementById('cf-calories').value);
        const protein = parseFloat(document.getElementById('cf-protein').value);
        const carbs = parseFloat(document.getElementById('cf-carbs').value);
        const fat = parseFloat(document.getElementById('cf-fat').value);
        const fiber = parseFloat(document.getElementById('cf-fiber').value) || 0;
        const unitWeight = parseInt(document.getElementById('cf-unit').value) || 100;
        const category = document.getElementById('cf-category').value;

        if (!name) {
            App.showToast('Veuillez entrer un nom');
            return;
        }
        if (!Storage._isValidFood({ name, calories, protein, carbs, fat, grams: 100 })) {
            App.showToast('Nom ou valeurs nutritionnelles invalides');
            return;
        }
        if (isNaN(calories) || isNaN(protein) || isNaN(carbs) || isNaN(fat)) {
            App.showToast('Veuillez remplir les valeurs nutritionnelles');
            return;
        }

        const food = {
            name,
            cat: category,
            n: [Math.round(calories), Math.round(protein * 10) / 10, Math.round(carbs * 10) / 10, Math.round(fat * 10) / 10, Math.round(fiber * 10) / 10],
            u: unitWeight
        };

        if (this._photoData) {
            food.photo = this._photoData;
        }

        Storage.addCustomFood(food);
        this._photoData = null;

        App.showSuccessCheck();
        App.showToast(`${name} créé !`);
        App.navigate('search');
    },

    cleanup() {
        this._photoData = null;
    }
};
