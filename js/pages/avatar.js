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
            xpText = `Jour ${days} / ${nextDays} → Évolution`;
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
            <div class="creature-page fade-in" style="padding-bottom:80px">
                <!-- Type-themed gradient background -->
                <div class="creature-scene" style="background:linear-gradient(180deg, ${pal.bg1} 0%, ${pal.bg2} 60%, var(--bg) 100%)">
                    <!-- Large creature -->
                    <div class="creature-display" data-type="${data.type}" style="background:none">
                        ${Creature.buildSVG(200)}
                    </div>

                    <!-- Name & species -->
                    <div class="creature-identity">
                        <div class="creature-player-name">${playerName}</div>
                        <div class="creature-species">${Creature.TYPE_EMOJI[data.type]} ${Creature.FORMS[form].label}</div>
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

                <!-- Coin Shop -->
                <div class="card" style="padding:14px 16px;margin:0 16px 12px">
                    <div style="font-size:14px;font-weight:700;margin-bottom:10px">Boutique 🪙</div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                        <button onclick="AvatarPage._buyItem('freeze',50)" style="padding:12px;border:1.5px solid var(--border);border-radius:12px;background:var(--surface);cursor:pointer;text-align:center">
                            <div style="font-size:24px;margin-bottom:4px">❄️</div>
                            <div style="font-size:12px;font-weight:600">Freeze streak</div>
                            <div style="font-size:11px;color:var(--accent);font-weight:700">50 🪙</div>
                        </button>
                        <button onclick="AvatarPage._buyItem('xp_boost',30)" style="padding:12px;border:1.5px solid var(--border);border-radius:12px;background:var(--surface);cursor:pointer;text-align:center">
                            <div style="font-size:24px;margin-bottom:4px">⚡</div>
                            <div style="font-size:12px;font-weight:600">+50 XP créature</div>
                            <div style="font-size:11px;color:var(--accent);font-weight:700">30 🪙</div>
                        </button>
                        <button onclick="AvatarPage._buyItem('double_coins',80)" style="padding:12px;border:1.5px solid var(--border);border-radius:12px;background:var(--surface);cursor:pointer;text-align:center">
                            <div style="font-size:24px;margin-bottom:4px">💰</div>
                            <div style="font-size:12px;font-weight:600">x2 coins 24h</div>
                            <div style="font-size:11px;color:var(--accent);font-weight:700">80 🪙</div>
                        </button>
                        <button onclick="AvatarPage._buyItem('lootbox',40)" style="padding:12px;border:1.5px solid var(--border);border-radius:12px;background:var(--surface);cursor:pointer;text-align:center">
                            <div style="font-size:24px;margin-bottom:4px">🎁</div>
                            <div style="font-size:12px;font-weight:600">Lootbox bonus</div>
                            <div style="font-size:11px;color:var(--accent);font-weight:700">40 🪙</div>
                        </button>
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
            fire: ['#EF5350', '#FFC107', '#FF9800'],
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

    _buyItem(type, cost) {
        const coins = Storage.getCoins();
        if (coins < cost) { App.showToast(`Pas assez de coins (${coins}/${cost} 🪙)`); return; }

        Storage.addCoins(-cost);
        App.haptic('success');

        if (type === 'freeze') {
            const s = Storage.getCreatureStreak();
            if (s.freezesOwned >= 3) { App.showToast('Maximum 3 freezes'); Storage.addCoins(cost); return; }
            s.freezesOwned++;
            Storage.setCreatureStreak(s);
            App.showToast('❄️ Freeze streak acheté !');
        } else if (type === 'xp_boost') {
            Storage.addCreatureXP(50);
            App.showToast('⚡ +50 XP créature !');
        } else if (type === 'double_coins') {
            localStorage.setItem('onefood_double_coins', new Date(Date.now() + 86400000).toISOString());
            App.showToast('💰 x2 coins activé pour 24h !');
        } else if (type === 'lootbox') {
            const rewards = [
                { emoji: '🪙', label: '+30 coins', fn: () => Storage.addCoins(30) },
                { emoji: '🪙', label: '+60 coins !', fn: () => Storage.addCoins(60) },
                { emoji: '⚡', label: '+100 XP', fn: () => Storage.addCreatureXP(100) },
                { emoji: '❄️', label: 'Freeze gratuit !', fn: () => { const s = Storage.getCreatureStreak(); s.freezesOwned = Math.min(3, s.freezesOwned + 1); Storage.setCreatureStreak(s); } },
            ];
            const r = rewards[Math.floor(Math.random() * rewards.length)];
            r.fn();
            Modal.show(`
                <div style="text-align:center;padding:12px 0">
                    <div style="font-size:56px;margin-bottom:8px;animation:creature-bounce 0.6s ease">${r.emoji}</div>
                    <div style="font-size:18px;font-weight:800">Lootbox ouverte !</div>
                    <div style="font-size:15px;color:var(--primary);font-weight:700;margin:8px 0 16px">${r.label}</div>
                    <button class="btn btn-primary" onclick="Modal.close()" style="width:100%">Super ! 🎉</button>
                </div>
            `);
        }
        this.render();
    },

    cleanup() {}
};
