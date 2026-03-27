const AvatarPage = {
    render() {
        const content = document.getElementById('page-content');

        // Premium lock: show upgrade prompt if creature is locked
        if (TrialService.isFeatureLocked('creature')) {
            content.innerHTML = `
                <div class="paywall-overlay fade-in">
                    <div class="paywall-card">
                        <div style="font-size:64px;margin-bottom:12px">🐾</div>
                        <h2>Ta créature t'attend !</h2>
                        <p style="margin-bottom:16px">Passe à Premium pour débloquer ta créature et la faire évoluer.</p>
                        <div class="paywall-features" style="margin-bottom:16px">
                            <div class="paywall-feature">Créature unique qui évolue</div>
                            <div class="paywall-feature">4 formes d'évolution</div>
                            <div class="paywall-feature">3 types : Feu, Plante, Eau</div>
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
            Creature._showStarterModal(() => AvatarPage.render());
            return;
        }

        const form = Creature.getForm();
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

                <!-- Evolution preview -->
                <div class="card" style="padding:14px 16px;margin:0 16px 12px">
                    <div style="font-size:14px;font-weight:700;margin-bottom:10px">Évolutions</div>
                    <div style="display:flex;gap:8px;justify-content:center;align-items:flex-end">
                        ${[0,1,2,3].map(f => {
                            const name = Creature.getSpeciesName(data.type, f);
                            const isActive = f === form;
                            const isLocked = f > form;
                            return `
                                <div style="text-align:center;opacity:${isLocked ? '0.35' : '1'};flex:1">
                                    <div style="margin:0 auto;${isActive ? `border:2px solid ${pal.main};border-radius:12px;padding:4px;background:${pal.bg1}` : 'padding:6px'}">
                                        ${Creature.buildSVG(isActive ? 64 : 48, { creatureData: { type: data.type, form: f, chosen: true }, mood: isActive ? 'happy' : 'encouraging' })}
                                    </div>
                                    <div style="font-size:10px;font-weight:${isActive ? '700' : '500'};color:${isActive ? pal.main : 'var(--text-secondary)'};margin-top:4px">${name}</div>
                                    <div style="font-size:9px;color:var(--text-secondary)">${Creature.FORMS[f].label}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;

        // Force-restart SVG animations (WebKit/iOS bug)
        requestAnimationFrame(() => {
            document.querySelectorAll('.creature-display svg').forEach(svg => {
                const parent = svg.parentNode;
                if (parent) {
                    const clone = svg.cloneNode(true);
                    parent.replaceChild(clone, svg);
                }
            });
        });

        this._spawnParticles();
    },

    _spawnParticles() {
        const scene = document.querySelector('.creature-scene');
        if (!scene) return;
        const data = Creature.getData();
        const colors = {
            fire: ['#FF6D3A', '#FFC107', '#FF9800'],
            water: ['#4FC3F7', '#0288D1', '#80DEEA'],
            plant: ['#8BC34A', '#A5D6A7', '#CDDC39']
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

    cleanup() {}
};
