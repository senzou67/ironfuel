const SearchPage = {
    currentMeal: 'lunch',
    currentCategory: 'all',
    _onlineTimeout: null,
    _onlineResults: [],

    _escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    },

    render(params = {}) {
        if (params.meal) this.currentMeal = params.meal;

        // Reset category to 'all' on each page render to avoid stale filter
        this.currentCategory = 'all';

        const favorites = Storage.getFavorites();
        const recent = Storage.getRecent();
        const currentMeal = this.currentMeal || Storage.getCurrentMealType();
        const suggestions = Storage.getTopFoods(currentMeal, 5);

        const content = document.getElementById('page-content');
        content.innerHTML = `
            <div class="search-container fade-in">
                <div class="search-bar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                    </svg>
                    <input type="text" id="search-input" placeholder="Rechercher un aliment..." oninput="SearchPage.onSearch(this.value)" autofocus>
                    <button class="search-clear-btn" id="search-clear" onclick="SearchPage.clearSearch()">&times;</button>
                </div>

                <div class="category-chips-wrapper">
                    <button class="cat-scroll-btn left" onclick="SearchPage._scrollCats(-1)">‹</button>
                    <div class="category-chips" id="category-chips">
                        <button class="category-chip active" data-cat="all" onclick="SearchPage.setCategory('all')">Tout</button>
                        ${FoodDB.categories.map(c => `
                            <button class="category-chip" data-cat="${c.id}" onclick="SearchPage.setCategory('${c.id}')">
                                ${c.icon} ${c.name}
                            </button>
                        `).join('')}
                    </div>
                    <button class="cat-scroll-btn right" onclick="SearchPage._scrollCats(1)">›</button>
                </div>

                <div class="search-results" id="search-results">
                    ${suggestions.length >= 3 ? `
                        <div style="margin-bottom:16px">
                            <div class="section-header">SUGGESTIONS</div>
                            ${suggestions.map(s => {
                                const food = FoodDB.getById(s.foodId);
                                return food ? this.renderResultItem(food) : '';
                            }).join('')}
                        </div>
                    ` : ''}
                    <div style="margin-bottom:16px">
                        <div class="section-header" style="display:flex;align-items:center;justify-content:space-between">
                            <span>MES RECETTES</span>
                            <button onclick="SearchPage._manageRecipes()" style="background:none;border:none;color:var(--primary);font-size:11px;font-weight:600;cursor:pointer">${Storage.getRecipes().length > 0 ? 'Gérer' : '+ Créer'}</button>
                        </div>
                        ${Storage.getRecipes().length > 0 ? Storage.getRecipes().map(r => `
                            <div class="search-result-item" onclick="SearchPage._addRecipe(${r.id})" style="cursor:pointer">
                                <div class="result-info">
                                    <div class="result-name">📋 ${r.name}</div>
                                    <div class="result-detail">${r.items.length} aliments · ${r.items.reduce((s,i) => s + (i.calories||0), 0)} kcal</div>
                                </div>
                                <span style="font-size:11px;color:var(--primary);font-weight:600">+ Ajouter</span>
                            </div>
                        `).join('') : `
                            <div onclick="SearchPage._manageRecipes()" style="text-align:center;padding:14px;color:var(--text-secondary);font-size:13px;cursor:pointer;border:1.5px dashed var(--border);border-radius:12px">
                                📋 Crée ta première recette pour ajouter tes repas habituels en 1 clic
                            </div>
                        `}
                    </div>
                    ${recent.length > 0 ? `
                        <div style="margin-bottom:16px">
                            <div class="section-header">RECENTS</div>
                            ${recent.slice(0, 5).map(id => {
                                const food = FoodDB.getById(id);
                                return food ? this.renderResultItem(food) : '';
                            }).join('')}
                        </div>
                    ` : ''}
                    ${favorites.length > 0 ? `
                        <div>
                            <div class="section-header">FAVORIS</div>
                            ${favorites.map(id => {
                                const food = FoodDB.getById(id);
                                return food ? this.renderResultItem(food) : '';
                            }).join('')}
                        </div>
                    ` : ''}
                    ${recent.length === 0 && favorites.length === 0 && suggestions.length < 3 ? `
                        <div class="empty-state">
                            <div class="empty-state-icon">🔍</div>
                            <div class="empty-state-text">Recherchez un aliment ou parcourez les catégories</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    clearSearch() {
        const input = document.getElementById('search-input');
        if (input) { input.value = ''; input.focus(); }
        const clearBtn = document.getElementById('search-clear');
        if (clearBtn) clearBtn.style.display = 'none';
        this.onSearch('');
    },

    onSearch(query) {
        const resultsEl = document.getElementById('search-results');
        if (!resultsEl) return;

        // Show/hide clear button
        const clearBtn = document.getElementById('search-clear');
        if (clearBtn) clearBtn.style.display = query && query.length > 0 ? 'block' : 'none';

        // Clear pending online search
        clearTimeout(this._onlineTimeout);
        this._onlineResults = [];

        if (!query || query.length < 2) {
            // Show default view
            const favorites = Storage.getFavorites();
            const recent = Storage.getRecent();
            const currentMeal = this.currentMeal || Storage.getCurrentMealType();
            const suggestions = Storage.getTopFoods(currentMeal, 5);
            let html = '';

            if (suggestions.length >= 3) {
                html += `<div style="margin-bottom:16px">
                    <div class="section-header">SUGGESTIONS</div>
                    ${suggestions.map(s => {
                        const food = FoodDB.getById(s.foodId);
                        return food ? this.renderResultItem(food) : '';
                    }).join('')}
                </div>`;
            }
            if (recent.length > 0) {
                html += `<div style="margin-bottom:16px">
                    <div class="section-header">RECENTS</div>
                    ${recent.slice(0, 5).map(id => {
                        const food = FoodDB.getById(id);
                        return food ? this.renderResultItem(food) : '';
                    }).join('')}
                </div>`;
            }
            if (favorites.length > 0) {
                html += `<div>
                    <div class="section-header">FAVORIS</div>
                    ${favorites.map(id => {
                        const food = FoodDB.getById(id);
                        return food ? this.renderResultItem(food) : '';
                    }).join('')}
                </div>`;
            }
            if (recent.length === 0 && favorites.length === 0 && suggestions.length < 3) {
                html = `<div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <div class="empty-state-text">Recherchez un aliment ou parcourez les catégories</div>
                </div>`;
            }
            if (this.currentCategory !== 'all') {
                const foods = FoodDB.getByCategory(this.currentCategory);
                html = foods.map(food => this.renderResultItem(food)).join('');
            }
            resultsEl.innerHTML = html;
            return;
        }

        let results = FoodDB.search(query);

        // Also search community foods (scanned/manual/AI added)
        const communityFoods = Storage._get('community_foods', []);
        if (communityFoods.length > 0) {
            const q = query.toLowerCase();
            const communityMatches = communityFoods.filter(f => f.name && f.name.toLowerCase().includes(q)).map(f => ({
                id: 'community_' + (f.barcode || f.name),
                name: f.name,
                n: [f.calories || 0, f.protein || 0, f.carbs || 0, f.fat || 0],
                cat: 'plats',
                grams: f.grams || 100,
                _community: true,
                barcode: f.barcode
            }));
            // Add community results that aren't already in FoodDB results
            communityMatches.forEach(cf => {
                if (!results.some(r => r.name.toLowerCase() === cf.name.toLowerCase())) {
                    results.push(cf);
                }
            });
        }

        if (this.currentCategory !== 'all') {
            results = results.filter(f => f.cat === this.currentCategory);
        }

        // Also search cloud community DB (async)
        if (query.length >= 2) {
            this._searchCommunityCloud(query, results.map(r => r.name.toLowerCase()));
        }

        if (results.length === 0) {
            resultsEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">😕</div>
                    <div class="empty-state-text">Aucun aliment local trouve pour "${query}"</div>
                    <button class="btn btn-primary" onclick="App.navigate('customfood')" style="margin-top:12px">
                        Créer cet aliment
                    </button>
                </div>
                <div id="online-results"></div>
            `;
        } else {
            resultsEl.innerHTML = results.map(food => this.renderResultItem(food)).join('') +
                '<div id="online-results"></div>';
            // Fetch real food photos in background
            if (typeof FoodImageService !== 'undefined') {
                FoodImageService.fetchAndRender(results);
            }
        }

        // Trigger online search with debounce
        if (query.length >= 3) {
            this._onlineTimeout = setTimeout(() => this.searchOnline(query), 400);
        }
    },

    async searchOnline(query) {
        if (!navigator.onLine) return;
        const onlineEl = document.getElementById('online-results');
        if (!onlineEl) return;

        onlineEl.innerHTML = `
            <div style="margin-top:16px">
                <div class="section-header">RESULTATS EN LIGNE</div>
                <div style="text-align:center;padding:12px;color:var(--text-secondary)">
                    <div class="spinner" style="margin:0 auto 8px"></div>
                    Recherche en cours...
                </div>
            </div>
        `;

        try {
            const results = await OpenFoodFactsService.searchProducts(query);
            this._onlineResults = results;

            if (!document.getElementById('online-results')) return;

            if (results.length === 0) {
                onlineEl.innerHTML = '';
                return;
            }

            onlineEl.innerHTML = `
                <div style="margin-top:16px">
                    <div class="section-header">RESULTATS EN LIGNE <span class="online-badge">OpenFoodFacts</span></div>
                    ${results.map((food, i) => this.renderOnlineItem(food, i)).join('')}
                </div>
            `;
        } catch {
            const el = document.getElementById('online-results');
            if (el) el.innerHTML = '';
        }
    },

    setCategory(catId) {
        this.currentCategory = catId;
        document.querySelectorAll('.category-chip').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.cat === catId);
        });

        const input = document.getElementById('search-input');
        if (input && input.value.length >= 2) {
            this.onSearch(input.value);
        } else if (catId !== 'all') {
            const foods = FoodDB.getByCategory(catId);
            const resultsEl = document.getElementById('search-results');
            resultsEl.innerHTML = foods.map(food => this.renderResultItem(food)).join('');
            // Fetch real food photos in background
            if (typeof FoodImageService !== 'undefined') {
                FoodImageService.fetchAndRender(foods);
            }
        } else {
            // Back to 'all' with no search → re-render default view
            this.onSearch('');
        }
    },

    // Food category colors for thumbnail circles
    _catColors: {
        feculents: '#FF9800', proteines: '#F44336', legumes: '#4CAF50', fruits: '#8BC34A',
        laitiers: '#2196F3', matieres_grasses: '#FFC107', boissons: '#00BCD4',
        snacks: '#9C27B0', sauces: '#795548', plats: '#607D8B'
    },

    renderResultItem(food) {
        const cat = FoodDB.categories.find(c => c.id === food.cat);
        const isCustom = food.isCustom;
        const clickId = isCustom ? `'${food.id}'` : food.id;
        const isFav = Storage.isFavorite(food.id);
        const catColor = this._catColors[food.cat] || '#9E9E9E';
        const catIcon = cat ? cat.icon : '📦';

        // Check for photo: custom food photo > curated/cached image > category icon
        const customPhoto = isCustom && food.photo ? food.photo : null;
        const cachedImg = customPhoto || ((typeof FoodImageService !== 'undefined') ? FoodImageService.getCachedImage(food.name) : null);
        const thumbContent = cachedImg
            ? `<img src="${cachedImg}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:8px" onerror="this.parentElement.innerHTML='<span>${catIcon}</span>';this.parentElement.style.background='${catColor}20';this.parentElement.style.border='1.5px solid ${catColor}40'">`
            : `<span>${catIcon}</span>`;
        const thumbStyle = cachedImg
            ? 'background:none;border:none;overflow:hidden'
            : `background:${catColor}20;border:1.5px solid ${catColor}40`;

        return `
            <div class="search-result-item" onclick="SearchPage.selectFood(${clickId})">
                <div class="food-thumb" data-food-id="${food.id}" style="${thumbStyle}">
                    ${thumbContent}
                </div>
                <div class="result-info" style="flex:1;min-width:0">
                    <div class="result-name">${food.name}${isCustom ? ' <span class="custom-badge">perso</span>' : ''}</div>
                    <div class="result-detail">
                        P:${food.n[1]}g · G:${food.n[2]}g · L:${food.n[3]}g /100g
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
                    <span class="result-cal">${food.n[0]} kcal</span>
                    <button class="fav-star-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation();SearchPage.toggleFav(${clickId})" aria-label="Favori">
                        ${isFav ? '\u2B50' : '\u2606'}
                    </button>
                </div>
            </div>
        `;
    },

    renderOnlineItem(food, index) {
        const safeName = this._escapeHtml(food.name);
        const safeBrand = this._escapeHtml(food.brand);
        const safeImage = food.image ? food.image.replace(/"/g, '&quot;') : '';
        return `
            <div class="search-result-item online-item" onclick="SearchPage.selectOnlineFood(${index})">
                <div class="result-info" style="display:flex;align-items:center;gap:8px">
                    ${safeImage ? `<img src="${safeImage}" alt="" style="width:36px;height:36px;border-radius:6px;object-fit:cover;flex-shrink:0">` : ''}
                    <div>
                        <div class="result-name">${safeName}</div>
                        <div class="result-detail">
                            ${safeBrand ? safeBrand + ' · ' : ''}P:${food.n[1]}g · G:${food.n[2]}g · L:${food.n[3]}g /100g
                        </div>
                    </div>
                </div>
                <span class="result-cal">${food.n[0]} kcal</span>
            </div>
        `;
    },

    toggleFav(foodId) {
        const nowFav = Storage.toggleFavorite(foodId);
        App.showToast(nowFav ? 'Ajouté aux favoris \u2B50' : 'Retiré des favoris');
        // Re-render search results to update star state
        const input = document.getElementById('search-input');
        const query = input ? input.value : '';
        if (query.length >= 2) {
            this.onSearch(query);
        } else if (this.currentCategory !== 'all') {
            this.setCategory(this.currentCategory);
        } else {
            this.onSearch('');
        }
    },

    selectFood(foodId) {
        const food = FoodDB.getById(foodId);
        if (food) {
            Modal.showFoodModal(food, { mealType: this.currentMeal });
        }
    },

    selectOnlineFood(index) {
        const food = this._onlineResults[index];
        if (!food) return;
        Modal.showCustomFoodModal({
            name: food.name + (food.brand ? ` (${food.brand})` : ''),
            weight_g: 100,
            calories: food.n[0],
            protein: food.n[1],
            carbs: food.n[2],
            fat: food.n[3],
            fiber: food.n[4]
        });
    },

    _scrollCats(dir) {
        const el = document.getElementById('category-chips');
        if (el) el.scrollBy({ left: dir * 200, behavior: 'smooth' });
    },

    async _searchCommunityCloud(query, existingNames) {
        try {
            const res = await fetch('/.netlify/functions/community-foods?action=search&q=' + encodeURIComponent(query));
            if (!res.ok) return;
            const data = await res.json();
            if (!data.foods || data.foods.length === 0) return;
            const container = document.getElementById('online-results');
            if (!container) return;
            const newFoods = data.foods.filter(f => !existingNames.includes(f.name.toLowerCase()));
            if (newFoods.length === 0) return;
            container.innerHTML = `<div class="section-header" style="margin-top:12px">COMMUNAUTÉ</div>` +
                newFoods.map(f => `
                    <div class="search-result-item" onclick="Modal.showCustomFoodModal({name:'${f.name.replace(/'/g,"\\'")}',calories:${f.calories},protein:${f.protein},carbs:${f.carbs},fat:${f.fat},fiber:${f.fiber||0},weight_g:${f.grams||100}},{mealType:'${this.currentMeal}'})" style="cursor:pointer">
                        <div class="result-info">
                            <div class="result-name">🌐 ${f.name}</div>
                            <div class="result-detail">${f.calories} kcal · P:${f.protein}g · G:${f.carbs}g · L:${f.fat}g${f.votes > 1 ? ' · 👍 ' + f.votes : ''}</div>
                        </div>
                        <span class="result-calories">${f.calories}</span>
                    </div>
                `).join('') + container.innerHTML;
        } catch {}
    },

    _addRecipe(recipeId) {
        const mealType = this.currentMeal || Storage.getCurrentMealType();
        Storage.addRecipeToMeal(recipeId, mealType);
        const recipe = Storage.getRecipes().find(r => r.id === recipeId);
        App.showToast(`📋 ${recipe?.name || 'Recette'} ajoutée !`);
        App.haptic('success');
    },

    _manageRecipes() {
        const recipes = Storage.getRecipes();
        Modal.show(`
            <div class="modal-title">Mes recettes</div>
            ${recipes.length === 0 ? '<p style="color:var(--text-secondary);font-size:13px">Aucune recette. Crée-en une depuis un repas existant.</p>' : ''}
            ${recipes.map(r => `
                <div style="display:flex;align-items:center;gap:8px;padding:10px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px">
                    <div style="flex:1">
                        <div style="font-weight:700;font-size:14px">${r.name}</div>
                        <div style="font-size:11px;color:var(--text-secondary)">${r.items.length} aliments · ${r.items.reduce((s,i) => s + (i.calories||0), 0)} kcal</div>
                    </div>
                    <button onclick="SearchPage._editRecipe(${r.id})" style="background:none;border:none;color:var(--primary);cursor:pointer;font-size:12px;font-weight:600">Modifier</button>
                    <button onclick="Storage.deleteRecipe(${r.id});SearchPage._manageRecipes()" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:14px">✕</button>
                </div>
            `).join('')}
            <button class="btn btn-primary" onclick="SearchPage._createRecipe()" style="width:100%;margin-top:12px">+ Créer une recette</button>
        `);
    },

    _createRecipe() {
        Modal.show(`
            <div class="modal-title">Nouvelle recette</div>
            <div class="form-group">
                <label class="form-label">Nom de la recette</label>
                <input type="text" class="form-input" id="recipe-name" placeholder="Ex: Mon bowl protéiné">
            </div>
            <p style="color:var(--text-secondary);font-size:12px;margin-bottom:12px">Tu pourras ajouter des aliments après la création.</p>
            <button class="btn btn-primary" onclick="SearchPage._saveNewRecipe()" style="width:100%">Créer</button>
        `);
    },

    _saveNewRecipe() {
        const name = document.getElementById('recipe-name')?.value?.trim();
        if (!name) { App.showToast('Donne un nom à ta recette'); return; }
        Storage.saveRecipe({ name, items: [] });
        Modal.close();
        App.showToast('Recette créée ! Ajoute des aliments.');
        this._manageRecipes();
    },

    _editRecipe(recipeId) {
        const recipe = Storage.getRecipes().find(r => r.id === recipeId);
        if (!recipe) return;
        Modal.show(`
            <div class="modal-title">${recipe.name}</div>
            <div class="form-group">
                <label class="form-label">Nom</label>
                <input type="text" class="form-input" id="recipe-edit-name" value="${recipe.name}">
            </div>
            <div style="margin-bottom:12px">
                <label class="form-label">Aliments (${recipe.items.length})</label>
                ${recipe.items.length === 0 ? '<p style="color:var(--text-secondary);font-size:12px">Aucun aliment. Recherche et ajoute des aliments à cette recette.</p>' : ''}
                ${recipe.items.map((item, i) => `
                    <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">
                        <div style="flex:1;font-size:13px">${item.name} <span style="color:var(--text-secondary)">${item.grams || ''}g · ${item.calories} kcal</span></div>
                        <button onclick="SearchPage._removeRecipeItem(${recipeId},${i})" style="background:none;border:none;color:var(--danger);cursor:pointer">✕</button>
                    </div>
                `).join('')}
            </div>
            <div style="display:flex;gap:8px">
                <button class="btn btn-outline" onclick="SearchPage._addToRecipeMode(${recipeId})" style="flex:1">+ Ajouter un aliment</button>
                <button class="btn btn-primary" onclick="SearchPage._saveEditedRecipe(${recipeId})" style="flex:1">Enregistrer</button>
            </div>
        `);
    },

    _removeRecipeItem(recipeId, itemIdx) {
        const recipe = Storage.getRecipes().find(r => r.id === recipeId);
        if (!recipe) return;
        recipe.items.splice(itemIdx, 1);
        Storage.saveRecipe(recipe);
        this._editRecipe(recipeId);
    },

    _saveEditedRecipe(recipeId) {
        const recipe = Storage.getRecipes().find(r => r.id === recipeId);
        if (!recipe) return;
        const name = document.getElementById('recipe-edit-name')?.value?.trim();
        if (name) recipe.name = name;
        Storage.saveRecipe(recipe);
        Modal.close();
        App.showToast('Recette mise à jour !');
    },

    _addToRecipeMode(recipeId) {
        this._recipeMode = recipeId;
        Modal.close();
        App.showToast('Recherche un aliment et ajoute-le à la recette');
    },

    _addFoodToRecipe(food, grams) {
        const recipe = Storage.getRecipes().find(r => r.id === this._recipeMode);
        if (!recipe) return;
        const n = FoodDB.getNutrition(food, grams);
        recipe.items.push({
            name: food.name,
            foodId: food.id,
            grams: grams,
            calories: n.calories,
            protein: n.protein,
            carbs: n.carbs,
            fat: n.fat
        });
        Storage.saveRecipe(recipe);
        App.showToast(`${food.name} ajouté à "${recipe.name}"`);
        this._recipeMode = null;
    }
};
