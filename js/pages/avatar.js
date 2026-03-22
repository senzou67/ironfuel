const AvatarPage = {
    _activeTab: 'equip',

    render() {
        const content = document.getElementById('page-content');

        // Premium lock: show upgrade prompt if creature is locked
        if (TrialService.isFeatureLocked('creature')) {
            content.innerHTML = `
                <div class="paywall-overlay fade-in">
                    <div class="paywall-card">
                        <div style="font-size:64px;margin-bottom:12px">🐾</div>
                        <h2>Ta créature t'attend !</h2>
                        <p style="margin-bottom:16px">Passe à Premium pour débloquer ta créature, la personnaliser et la faire évoluer.</p>
                        <div class="paywall-features" style="margin-bottom:16px">
                            <div class="paywall-feature">✅ Créature unique qui évolue</div>
                            <div class="paywall-feature">✅ Cosmétiques & boutique</div>
                            <div class="paywall-feature">✅ Auras, vêtements, ailes</div>
                            <div class="paywall-feature">✅ Objectifs personnalisés</div>
                        </div>
                        <button class="btn btn-primary" onclick="App.navigate('settings')" style="width:100%;font-weight:700;font-size:16px;padding:14px">
                            Voir les offres Premium
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        const data = Creature.getData();
        if (!data.chosen) {
            // Show starter choice
            Creature._showStarterModal(() => AvatarPage.render());
            return;
        }

        const form = Creature.getForm();
        const mp = Creature.getMuscleProgress();
        const speciesName = Creature.getSpeciesName(data.type, form);
        const playerName = Storage.getProfile().name || 'Dresseur';
        const pal = Creature.PALETTES[data.type];
        const days = Creature.getActiveDays();
        const nextDays = Creature.getNextFormDays(form);
        const coins = Storage.getCoins();
        const streak = Storage.getCreatureStreak();

        let xpPct = 0, xpText = '';
        if (nextDays) {
            xpPct = Math.min(100, Math.round((days / nextDays) * 100));
            xpText = `Jour ${days} / ${nextDays} → ${Creature.getSpeciesName(data.type, form + 1)}`;
        } else {
            xpPct = 100;
            xpText = `MAX — Jour ${days}`;
        }

        // Freezes display
        let freezeIcons = '';
        for (let i = 0; i < 3; i++) {
            freezeIcons += i < streak.freezesOwned ? '❄️' : '<span style="opacity:0.2">❄️</span>';
        }

        // Update page title to creature name
        document.getElementById('page-title').textContent = playerName;

        content.innerHTML = `
            <div class="creature-page fade-in">
                <!-- Type-themed gradient background -->
                <div class="creature-scene" style="background:linear-gradient(180deg, ${pal.bg1} 0%, ${pal.bg2} 60%, var(--bg) 100%)">
                    <!-- Large creature -->
                    <div class="creature-display" data-type="${data.type}">
                        ${Creature.buildSVG(200)}
                    </div>

                    <!-- Name & species -->
                    <div class="creature-identity">
                        <div class="creature-player-name">${playerName}</div>
                        <div class="creature-species">${Creature.TYPE_EMOJI[data.type]} ${speciesName}</div>
                        ${(() => {
                            const titleItem = Storage.getEquippedItems().find(i => i.type === 'title');
                            if (!titleItem) return '';
                            const titleData = ShopPage._findItem(titleItem.id);
                            if (!titleData) return '';
                            const titleStyles = {
                                title_rookie: 'color:#9E9E9E',
                                title_warrior: 'color:#E64A19;text-shadow:0 0 4px rgba(230,74,25,0.3)',
                                title_champion: 'color:#FFB300;text-shadow:0 0 6px rgba(255,179,0,0.4)',
                                title_legend: 'color:#FFD700;text-shadow:0 0 8px rgba(255,215,0,0.5),0 0 16px rgba(255,215,0,0.2)',
                                title_titan: 'color:#B388FF;text-shadow:0 0 8px rgba(179,136,255,0.5),0 0 20px rgba(179,136,255,0.3)',
                                title_god: 'background:linear-gradient(90deg,#FFD700,#FF8F00,#FFD700);-webkit-background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 6px rgba(255,215,0,0.6));font-weight:900'
                            };
                            const style = titleStyles[titleItem.id] || '';
                            return '<div class="creature-title-badge" style="margin-top:4px;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;' + style + '">' + titleData.emoji + ' ' + titleData.name + '</div>';
                        })()}
                    </div>

                    <!-- Stats -->
                    <div class="creature-stats">
                        <div class="creature-stats-row">
                            <div class="creature-stat">
                                <span class="creature-stat-label">Forme</span>
                                <span class="creature-stat-value">${Creature.FORMS[form].label}</span>
                            </div>
                            <div class="creature-stat">
                                <span class="creature-stat-label">Série</span>
                                <span class="creature-stat-value">${streak.current}j 🔥</span>
                            </div>
                            <div class="creature-stat">
                                <span class="creature-stat-label">Gels</span>
                                <span class="creature-stat-value">${freezeIcons}</span>
                            </div>
                            <div class="creature-stat">
                                <span class="creature-stat-label">Coins</span>
                                <span class="creature-stat-value">${coins} 🪙</span>
                            </div>
                        </div>
                        <div class="creature-xp-section">
                            <div class="creature-xp-bar">
                                <div class="creature-xp-fill" style="width:${xpPct}%;background:${pal.main}"></div>
                            </div>
                            <div class="creature-xp-text">${xpText}</div>
                        </div>
                    </div>
                </div>

                <!-- Tabs -->
                <div class="creature-tabs">
                    <button class="creature-tab ${this._activeTab === 'equip' ? 'active' : ''}" onclick="AvatarPage.switchTab('equip')">
                        ⚔️ Équipement
                    </button>
                    <button class="creature-tab ${this._activeTab === 'shop' ? 'active' : ''}" onclick="AvatarPage.switchTab('shop')">
                        🛒 Boutique
                    </button>
                </div>

                <!-- Tab content -->
                <div class="creature-tab-content" id="creature-tab-content">
                    ${this._renderTabContent()}
                </div>
            </div>
        `;

        ShopPage._refreshCallback = () => this.render();

        // Force-restart SVG animations (WebKit/iOS bug: innerHTML SVGs don't animate)
        requestAnimationFrame(() => {
            document.querySelectorAll('.creature-display svg, .creature-card-svg svg').forEach(svg => {
                const parent = svg.parentNode;
                if (parent) {
                    const clone = svg.cloneNode(true);
                    parent.replaceChild(clone, svg);
                }
            });
        });

        // Inject floating particles
        this._spawnParticles();
    },

    _spawnParticles() {
        const scene = document.querySelector('.creature-scene');
        if (!scene) return;
        const data = Creature.getData();
        const colors = {
            fire: ['#FF6D3A', '#FFC107', '#FF9800'],
            water: ['#4FC3F7', '#0288D1', '#80DEEA'],
            earth: ['#8BC34A', '#A5D6A7', '#CDDC39']
        };
        const palette = colors[data.type] || colors.fire;
        const container = document.createElement('div');
        container.className = 'creature-particles';
        for (let i = 0; i < 12; i++) {
            const p = document.createElement('div');
            p.className = 'creature-particle';
            const size = (3 + Math.random() * 4) + 'px';
            p.style.cssText = `
                position:absolute;
                left:${(10 + Math.random() * 80)}%;
                bottom:${(5 + Math.random() * 20)}%;
                background:${palette[Math.floor(Math.random() * palette.length)]};
                animation-delay:${(Math.random() * 4)}s;
                animation-duration:${(3 + Math.random() * 3)}s;
                width:${size};height:${size};
                border-radius:50%;
                opacity:0;
                pointer-events:none;
            `;
            container.appendChild(p);
        }
        scene.appendChild(container);
    },

    switchTab(tab) {
        this._activeTab = tab;
        document.querySelectorAll('.creature-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`.creature-tab:${tab === 'equip' ? 'first-child' : 'last-child'}`).classList.add('active');
        const container = document.getElementById('creature-tab-content');
        if (container) container.innerHTML = this._renderTabContent();
        ShopPage._refreshCallback = () => this.render();
    },

    _renderTabContent() {
        if (this._activeTab === 'shop') {
            return `<div class="creature-shop-embed">${ShopPage.renderContent(true)}</div>`;
        }
        return this._renderEquipment();
    },

    _renderEquipment() {
        const equipped = Storage.getEquippedItems();
        const owned = Storage._get('owned_items', []);

        const slots = [
            { type: 'clothes', label: '👕 Vêtement', icon: '👕' },
            { type: 'wings', label: '🪽 Ailes', icon: '🪽' },
            { type: 'aura', label: '🔮 Aura', icon: '🔮' },
            { type: 'pet', label: '🐾 Compagnon', icon: '🐾' },
            { type: 'title', label: '🏷️ Titre', icon: '🏷️' }
        ];

        return `
            <div class="equip-grid">
                ${slots.map(slot => {
                    const equippedItem = equipped.find(e => e.type === slot.type);
                    const ownedOfType = owned.filter(o => o.type === slot.type);
                    const itemData = equippedItem ? ShopPage._findItem(equippedItem.id) : null;

                    return `
                        <div class="equip-slot">
                            <div class="equip-slot-header">
                                <span>${slot.label}</span>
                                ${equippedItem ? `<button class="equip-remove-btn" onclick="AvatarPage.unequipSlot('${slot.type}')">✕</button>` : ''}
                            </div>
                            <div class="equip-slot-content ${equippedItem ? 'filled' : 'empty'}">
                                ${equippedItem && itemData
                                    ? `<span class="equip-slot-emoji">${itemData.emoji}</span>
                                       <span class="equip-slot-name">${itemData.name}</span>`
                                    : `<span class="equip-slot-empty">Vide</span>`
                                }
                            </div>
                            ${ownedOfType.length > 1 ? `
                                <div class="equip-alternatives">
                                    ${ownedOfType.filter(o => !equippedItem || o.id !== equippedItem.id).map(o => {
                                        const d = ShopPage._findItem(o.id);
                                        return d ? `<button class="equip-alt-btn" onclick="AvatarPage.equipItem('${o.id}','${o.type}')" title="${d.name}">${d.emoji}</button>` : '';
                                    }).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    unequipSlot(type) {
        Storage.unequipItem(type);
        App.showToast('Item retiré');
        this.render();
    },

    equipItem(itemId, itemType) {
        Storage.equipItem({ id: itemId, type: itemType });
        App.showToast('Item équipé !');
        this.render();
    },

    cleanup() {
        ShopPage._refreshCallback = null;
    }
};
