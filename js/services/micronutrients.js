// ===== MICRONUTRIENT ESTIMATION SERVICE (Premium) =====
// Estimates micronutrient intake based on food categories and known nutritional patterns
const MicronutrientService = {
    // Reference daily values (RDV) for adults
    RDV: {
        vitA: { name: 'Vitamine A', unit: 'µg', goal: 800, icon: '👁️' },
        vitC: { name: 'Vitamine C', unit: 'mg', goal: 90, icon: '🍊' },
        vitD: { name: 'Vitamine D', unit: 'µg', goal: 15, icon: '☀️' },
        vitE: { name: 'Vitamine E', unit: 'mg', goal: 15, icon: '🌰' },
        vitB12: { name: 'Vitamine B12', unit: 'µg', goal: 2.4, icon: '🥩' },
        calcium: { name: 'Calcium', unit: 'mg', goal: 1000, icon: '🦴' },
        iron: { name: 'Fer', unit: 'mg', goal: 14, icon: '🩸' },
        magnesium: { name: 'Magnésium', unit: 'mg', goal: 400, icon: '💤' },
        potassium: { name: 'Potassium', unit: 'mg', goal: 3500, icon: '🍌' },
        zinc: { name: 'Zinc', unit: 'mg', goal: 11, icon: '🛡️' },
        sodium: { name: 'Sodium', unit: 'mg', goal: 2300, icon: '🧂', isLimit: true },
        omega3: { name: 'Oméga-3', unit: 'g', goal: 1.6, icon: '🐟' }
    },

    // Micronutrient profile per food category (per 100g, approximate)
    _guessCategory(name) {
        if (!name) return null;
        const n = name.toLowerCase();
        const map = {
            fruits: ['banane','pomme','orange','fraise','kiwi','mangue','raisin','poire','cerise','ananas','melon','pastèque','myrtille','framboise','abricot','pêche','citron'],
            legumes: ['tomate','carotte','brocoli','courgette','poivron','épinard','salade','laitue','haricot vert','chou','aubergine','concombre','champignon','oignon','ail','petits pois','asperge','betterave','radis','navet','fenouil','artichaut','endive','céleri','maïs'],
            viandes: ['poulet','boeuf','steak','porc','veau','dinde','agneau','filet','escalope','blanc de poulet','cuisse','entrecôte','bavette','hachis'],
            poissons: ['saumon','thon','cabillaud','sardine','maquereau','truite','crevette','moule','bar','dorade','colin'],
            laitiers: ['lait','yaourt','fromage blanc','crème','beurre','skyr'],
            feculents: ['riz','pâtes','spaghetti','pain','baguette','pomme de terre','patate','semoule','quinoa','boulgour','avoine','flocon','muesli','céréales','pain de mie','tortilla','wrap'],
            noix: ['amande','noix','cacahuète','noisette','pistache','cajou','beurre de cacahuète','beurre de cacahuètes','beurre d\'amande','purée d\'amande'],
            fromages: ['camembert','gruyère','comté','emmental','mozzarella','parmesan','chèvre','roquefort','brie','cheddar','raclette','feta'],
            matieres_grasses: ['huile','olive','beurre','margarine','graisse','mayonnaise'],
            charcuterie: ['jambon','saucisse','saucisson','bacon','lard','pâté','rillette','chorizo','coppa'],
            boissons: ['eau','jus','café','thé','soda','coca','bière','vin'],
            desserts: ['gâteau','tarte','crème','glace','mousse','brownie','cookie','muffin','crêpe','pancake','compote'],
            confiseries: ['chocolat','bonbon','barre','nutella','confiture','miel'],
        };
        for (const [cat, words] of Object.entries(map)) {
            for (const w of words) {
                if (n.includes(w)) return cat;
            }
        }
        return null;
    },

    _categoryProfiles: {
        fruits:      { vitA: 5, vitC: 30, vitE: 0.5, potassium: 180, magnesium: 12, iron: 0.3, calcium: 10, sodium: 2 },
        legumes:     { vitA: 50, vitC: 20, vitE: 0.8, potassium: 250, magnesium: 18, iron: 0.8, calcium: 30, zinc: 0.4, sodium: 10 },
        viandes:     { vitB12: 2.5, iron: 2.5, zinc: 4, potassium: 300, magnesium: 22, sodium: 65, vitE: 0.3 },
        poissons:    { vitD: 5, vitB12: 3, omega3: 1.2, potassium: 350, magnesium: 28, iron: 0.5, calcium: 15, zinc: 0.6, sodium: 60 },
        laitiers:    { vitA: 30, vitB12: 0.8, vitD: 0.5, calcium: 200, potassium: 150, zinc: 0.8, magnesium: 12, sodium: 45 },
        feculents:   { iron: 0.8, magnesium: 25, potassium: 120, zinc: 0.6, vitE: 0.3, sodium: 5 },
        legumineuses:{ iron: 3, magnesium: 40, potassium: 400, zinc: 1.5, vitB12: 0, calcium: 40, sodium: 5 },
        noix:        { vitE: 8, magnesium: 150, potassium: 500, zinc: 3, iron: 3, calcium: 80, omega3: 0.3, sodium: 5 },
        boissons:    { potassium: 20, magnesium: 5, sodium: 5 },
        matieres_grasses: { vitE: 5, vitA: 40, omega3: 0.1, sodium: 5 },
        snacks:      { sodium: 200, iron: 0.5, magnesium: 10 },
        plats:       { sodium: 150, potassium: 200, iron: 1.2, magnesium: 15, calcium: 30, vitE: 0.3 },
        petit_dejeuner: { iron: 2, calcium: 50, magnesium: 20, vitB12: 0.5, sodium: 30 },
        sauces:      { sodium: 600, potassium: 80 },
        charcuterie: { sodium: 800, vitB12: 1, iron: 1, zinc: 2 },
        fromages:    { calcium: 500, vitA: 80, vitB12: 1.2, sodium: 400, zinc: 2.5 },
        desserts:    { calcium: 40, sodium: 50, iron: 0.5 },
        fast_food:   { sodium: 500, potassium: 200, iron: 1.5, calcium: 50, zinc: 1.5 },
        ethnique:    { sodium: 350, potassium: 250, iron: 1.5, magnesium: 20 },
        vegetarien:  { iron: 2, magnesium: 30, potassium: 300, vitC: 5, calcium: 100, sodium: 20 },
        cereales:    { iron: 3, magnesium: 40, zinc: 1.5, potassium: 200, sodium: 5 },
        confiseries: { sodium: 30, iron: 0.5 }
    },

    // Estimate micronutrients from today's food log
    estimateFromLog(date) {
        const log = Storage.getDayLog(date);
        const micros = {};
        Object.keys(this.RDV).forEach(k => micros[k] = 0);

        Object.values(log.meals).forEach(meal => {
            meal.forEach(entry => {
                const grams = entry.grams || entry.qty || 100;
                const factor = grams / 100;

                // If entry has explicit micro data (from OpenFoodFacts), use it
                if (entry.micros) {
                    Object.keys(entry.micros).forEach(k => {
                        if (micros[k] !== undefined) micros[k] += (entry.micros[k] || 0) * factor;
                    });
                    return;
                }

                // Otherwise estimate from category
                let cat = entry.category || entry.cat;
                if (!cat && entry.foodId) {
                    const dbFood = FoodDB.foods.find(f => f.id === entry.foodId);
                    if (dbFood) cat = dbFood.cat;
                }
                // Guess category from food name if still unknown
                if (!cat && entry.name) {
                    cat = this._guessCategory(entry.name);
                }
                if (!cat) {
                    // Smart fallback: estimate category from macros
                    if (entry.fat > 15) cat = 'matieres_grasses';
                    else if (entry.protein > 15) cat = 'viandes';
                    else if (entry.carbs > 40) cat = 'feculents';
                    else cat = 'plats';
                }

                const profile = this._categoryProfiles[cat] || this._categoryProfiles.plats;
                Object.keys(profile).forEach(k => {
                    if (micros[k] !== undefined) micros[k] += (profile[k] || 0) * factor;
                });
            });
        });

        // Round values
        Object.keys(micros).forEach(k => {
            micros[k] = Math.round(micros[k] * 10) / 10;
        });

        return micros;
    },

    // Render full micro-nutrient panel in modal
    showFullPanel(date) {
        if (!TrialService.hasFullAccess()) {
            TrialService.showFeatureLockedPrompt('micronutrients');
            return;
        }

        const micros = this.estimateFromLog(date);
        const items = Object.entries(this.RDV).map(([key, info]) => {
            const value = micros[key] || 0;
            const pct = Math.min(Math.round((value / info.goal) * 100), 150);
            const color = info.isLimit
                ? (pct > 100 ? 'var(--danger)' : 'var(--success)')
                : (pct >= 80 ? 'var(--success)' : pct >= 40 ? 'var(--accent)' : 'var(--text-secondary)');
            return `
                <div onclick="event.stopPropagation();MicronutrientService.showInfoPage('${key}')" style="display:flex;align-items:center;gap:8px;padding:8px 6px;cursor:pointer;border-radius:8px;transition:background 0.2s" onmouseover="this.style.background='var(--surface-alt, rgba(0,0,0,0.03))'" onmouseout="this.style.background='transparent'">
                    <span style="font-size:18px;width:24px;text-align:center">${info.icon}</span>
                    <span style="font-size:13px;font-weight:500;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${info.name}</span>
                    <div style="width:70px;height:5px;border-radius:3px;background:var(--border);overflow:hidden;flex-shrink:0">
                        <div style="width:${Math.min(pct, 100)}%;height:100%;border-radius:3px;background:${color};transition:width 0.4s"></div>
                    </div>
                    <span style="font-size:11px;color:${color};font-weight:600;width:55px;text-align:right">${value}${info.unit}</span>
                    <span style="font-size:11px;color:var(--text-secondary)">→</span>
                </div>
            `;
        }).join('');

        Modal.show(`
            <div class="modal-title" style="display:flex;align-items:center;gap:8px">
                <span>🧪</span> Micro-nutriments du jour
            </div>
            <div style="font-size:11px;color:var(--text-secondary);margin-bottom:12px">Estimation basée sur les catégories d'aliments. Clique pour en savoir plus.</div>
            <div style="max-height:60vh;overflow-y:auto">
                ${items}
            </div>
            <button class="btn btn-secondary" onclick="Modal.close()" style="width:100%;margin-top:12px">Fermer</button>
        `);
    },

    // Info pages for each micronutrient
    _microInfos: {
        vitA: { desc: 'Essentielle pour la vision, le système immunitaire et la peau. Puissant antioxydant.', importance: 'Protège la rétine, renforce les défenses immunitaires, maintient une peau saine.', sources: ['Carottes', 'Patate douce', 'Épinards', 'Foie', 'Beurre', 'Mangue'] },
        vitC: { desc: 'Antioxydant majeur. Booste l\'immunité et aide à absorber le fer.', importance: 'Synthèse du collagène, cicatrisation, protection contre le stress oxydatif.', sources: ['Poivron rouge', 'Kiwi', 'Orange', 'Brocoli', 'Fraises', 'Goyave'] },
        vitD: { desc: 'La "vitamine du soleil". Indispensable pour les os et l\'immunité.', importance: 'Fixation du calcium, force musculaire, humeur, prévention des maladies auto-immunes.', sources: ['Soleil (15 min/jour)', 'Saumon', 'Sardines', 'Jaune d\'œuf', 'Champignons', 'Huile de foie de morue'] },
        vitE: { desc: 'Antioxydant qui protège les cellules contre le vieillissement.', importance: 'Protection des membranes cellulaires, santé cardiovasculaire, peau.', sources: ['Amandes', 'Huile de tournesol', 'Noisettes', 'Avocat', 'Épinards', 'Graines de tournesol'] },
        vitB12: { desc: 'Vitale pour le système nerveux et la formation des globules rouges.', importance: 'Énergie, mémoire, production d\'ADN. Carence fréquente chez les végétariens.', sources: ['Viande rouge', 'Poisson', 'Œufs', 'Produits laitiers', 'Foie', 'Levure nutritionnelle (fortifiée)'] },
        calcium: { desc: 'Minéral clé pour des os et des dents solides.', importance: 'Densité osseuse, contraction musculaire, transmission nerveuse, coagulation.', sources: ['Fromage', 'Yaourt', 'Lait', 'Sardines', 'Brocoli', 'Amandes', 'Tofu'] },
        iron: { desc: 'Transporte l\'oxygène dans le sang via l\'hémoglobine.', importance: 'Énergie, performance physique, fonction cognitive. Carence = fatigue chronique.', sources: ['Viande rouge', 'Lentilles', 'Boudin noir', 'Épinards', 'Tofu', 'Quinoa'] },
        magnesium: { desc: 'Impliqué dans 300+ réactions enzymatiques dans le corps.', importance: 'Sommeil, récupération musculaire, gestion du stress, énergie.', sources: ['Chocolat noir', 'Amandes', 'Banane', 'Épinards', 'Avocats', 'Graines de courge'] },
        potassium: { desc: 'Électrolyte crucial pour le cœur et les muscles.', importance: 'Pression artérielle, fonction cardiaque, équilibre hydrique, crampes.', sources: ['Banane', 'Patate douce', 'Avocat', 'Épinards', 'Haricots blancs', 'Saumon'] },
        zinc: { desc: 'Minéral essentiel pour l\'immunité et la cicatrisation.', importance: 'Défenses immunitaires, testostérone, cicatrisation, goût et odorat.', sources: ['Huîtres', 'Viande rouge', 'Graines de courge', 'Lentilles', 'Noix de cajou', 'Fromage'] },
        sodium: { desc: 'Nécessaire en petite quantité, mais l\'excès augmente la tension.', importance: 'Équilibre hydrique, transmission nerveuse. ATTENTION : la plupart des gens en consomment trop.', sources: ['Sel de table', 'Pain', 'Charcuterie', 'Fromage', 'Plats préparés', 'Sauces'] },
        omega3: { desc: 'Acides gras essentiels anti-inflammatoires.', importance: 'Santé cardiovasculaire, fonction cérébrale, humeur, inflammation.', sources: ['Saumon', 'Sardines', 'Maquereau', 'Noix', 'Graines de lin', 'Graines de chia'] }
    },

    showInfoPage(key) {
        const info = this.RDV[key];
        const details = this._microInfos[key];
        if (!info || !details) return;

        const micros = this.estimateFromLog();
        const value = micros[key] || 0;
        const pct = Math.min(Math.round((value / info.goal) * 100), 150);
        const color = info.isLimit
            ? (pct > 100 ? 'var(--danger)' : 'var(--success)')
            : (pct >= 80 ? 'var(--success)' : pct >= 40 ? 'var(--accent)' : 'var(--danger)');
        const statusText = info.isLimit
            ? (pct > 100 ? 'Excès' : 'OK')
            : (pct >= 80 ? 'Bon' : pct >= 40 ? 'Moyen' : 'Insuffisant');

        Modal.show(`
            <div style="text-align:center;margin-bottom:12px">
                <div style="font-size:48px;margin-bottom:4px">${info.icon}</div>
                <h3 style="margin:0 0 4px">${info.name}</h3>
                <div style="font-size:13px;color:var(--text-secondary)">${details.desc}</div>
            </div>

            <div style="background:var(--surface);border-radius:12px;padding:12px;margin-bottom:12px">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                    <span style="font-size:12px;font-weight:600">Aujourd'hui</span>
                    <span style="font-size:14px;font-weight:800;color:${color}">${value} / ${info.goal} ${info.unit}</span>
                </div>
                <div style="height:8px;border-radius:4px;background:var(--border);overflow:hidden">
                    <div style="width:${Math.min(pct, 100)}%;height:100%;border-radius:4px;background:${color};transition:width 0.4s"></div>
                </div>
                <div style="text-align:center;font-size:11px;font-weight:700;color:${color};margin-top:4px">${pct}% — ${statusText}</div>
            </div>

            <div style="margin-bottom:12px">
                <div style="font-size:12px;font-weight:700;margin-bottom:4px">💡 Pourquoi c'est important</div>
                <div style="font-size:12px;color:var(--text-secondary);line-height:1.5">${details.importance}</div>
            </div>

            <div style="margin-bottom:12px">
                <div style="font-size:12px;font-weight:700;margin-bottom:6px">🥗 Où le trouver</div>
                <div style="display:flex;flex-wrap:wrap;gap:6px">
                    ${details.sources.map(s => `<span style="font-size:11px;padding:4px 10px;border-radius:8px;background:var(--primary-light);color:var(--primary);font-weight:500">${s}</span>`).join('')}
                </div>
            </div>

            <button class="btn btn-primary" onclick="Modal.close()" style="width:100%">Compris</button>
        `);
    },

    // Estimate micronutrients for a single food entry
    estimateForFood(entry) {
        const micros = {};
        Object.keys(this.RDV).forEach(k => micros[k] = 0);
        const grams = entry.grams || entry.qty || 100;
        const factor = grams / 100;

        if (entry.micros) {
            Object.keys(entry.micros).forEach(k => {
                if (micros[k] !== undefined) micros[k] += (entry.micros[k] || 0) * factor;
            });
        } else {
            let cat = entry.category || entry.cat;
            if (!cat && entry.foodId) {
                const dbFood = typeof FoodDB !== 'undefined' ? FoodDB.foods.find(f => f.id === entry.foodId) : null;
                if (dbFood) cat = dbFood.cat;
            }
            if (!cat) cat = 'plats';
            const profile = this._categoryProfiles[cat] || this._categoryProfiles.plats;
            Object.keys(profile).forEach(k => {
                if (micros[k] !== undefined) micros[k] += (profile[k] || 0) * factor;
            });
        }

        Object.keys(micros).forEach(k => micros[k] = Math.round(micros[k] * 10) / 10);
        return micros;
    },

    // Render inline micro badges for a food item
    renderFoodMicros(entry) {
        const micros = this.estimateForFood(entry);
        const significant = Object.entries(this.RDV)
            .map(([key, info]) => ({
                key, ...info,
                value: micros[key] || 0,
                pct: Math.round(((micros[key] || 0) / info.goal) * 100)
            }))
            .filter(n => n.pct >= 5 && !n.isLimit)
            .sort((a, b) => b.pct - a.pct)
            .slice(0, 4);

        if (significant.length === 0) return '';

        return `<div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap">
            ${significant.map(n => {
                const color = n.pct >= 20 ? 'var(--success)' : 'var(--text-secondary)';
                return `<span onclick="event.stopPropagation();MicronutrientService.showInfoPage('${n.key}')" style="font-size:9px;padding:2px 6px;border-radius:6px;background:var(--surface);border:1px solid var(--border);color:${color};font-weight:600;cursor:pointer">${n.icon} ${n.pct}%</span>`;
            }).join('')}
        </div>`;
    },

    // Render micro-nutrient panel (for premium users) — legacy, now used in full modal
    renderPanel(date) {
        if (!TrialService.hasFullAccess()) {
            return `
                <div class="card" style="padding:14px 16px;margin:8px 16px;text-align:center;opacity:0.7">
                    <div style="font-size:11px;font-weight:700;color:var(--primary);text-transform:uppercase;margin-bottom:4px">🔒 Micro-nutriments</div>
                    <div style="font-size:12px;color:var(--text-secondary)">Disponible avec Premium</div>
                </div>
            `;
        }

        const micros = this.estimateFromLog(date);
        const items = Object.entries(this.RDV).map(([key, info]) => {
            const value = micros[key] || 0;
            const pct = Math.min(Math.round((value / info.goal) * 100), 150);
            const color = info.isLimit
                ? (pct > 100 ? 'var(--danger)' : 'var(--success)')
                : (pct >= 80 ? 'var(--success)' : pct >= 40 ? 'var(--accent)' : 'var(--text-secondary)');
            return `
                <div onclick="MicronutrientService.showInfoPage('${key}')" style="display:flex;align-items:center;gap:6px;padding:4px 0;cursor:pointer">
                    <span style="font-size:14px;width:20px;text-align:center">${info.icon}</span>
                    <span style="font-size:11px;font-weight:500;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${info.name}</span>
                    <div style="width:60px;height:4px;border-radius:2px;background:var(--border);overflow:hidden;flex-shrink:0">
                        <div style="width:${Math.min(pct, 100)}%;height:100%;border-radius:2px;background:${color};transition:width 0.4s"></div>
                    </div>
                    <span style="font-size:10px;color:${color};font-weight:600;width:40px;text-align:right">${value}${info.unit}</span>
                </div>
            `;
        }).join('');

        return `
            <div class="card" style="padding:12px 16px;margin:8px 16px">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                    <span style="font-size:12px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:0.5px">Micro-nutriments</span>
                    <span style="font-size:10px;color:var(--text-secondary)">Estimation</span>
                </div>
                ${items}
            </div>
        `;
    }
};
