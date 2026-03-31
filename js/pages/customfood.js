const CustomFoodPage = {
    _photoData: null,

    render() {
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
                    <label class="form-label">Nom de l'aliment *</label>
                    <input type="text" class="form-input" id="cf-name" placeholder="Ex: Gâteau maison">
                </div>

                <div class="form-group">
                    <label class="form-label">Catégorie</label>
                    <select class="form-select" id="cf-category">
                        ${FoodDB.categories.map(c =>
                            `<option value="${c.id}">${c.icon} ${c.name}</option>`
                        ).join('')}
                    </select>
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
