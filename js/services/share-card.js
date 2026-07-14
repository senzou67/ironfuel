// ===== SHARE CARD RENDERER =====
// Generates a portrait 1080x1350 (Instagram feed 4:5) share card.
//
// v152 : split red header + dark body so the brand-coloured macros
// pop against neutral space instead of clashing with a red background.
// v152 : output JPEG (was PNG) — Snapchat's iOS share sheet renders
// PNGs from Web Share as a white screen on some product versions;
// JPEG at q=0.9 also cuts file size ~3-4x which helps every target.
// v152 : emoji font stack ordered so "Apple Color Emoji" wins for
// symbols like ☀️ that were dropping to tofu boxes on iOS Canvas.
// v152 : meal mode can render a foods list (up to 6 items + "+N autres").
const ShareCard = {
    W: 1080,
    H: 1350,

    // Emoji-first font stack — Canvas 2D on iOS falls back correctly
    // only if the colour emoji font is listed first for glyphs like ☀️.
    EMOJI_STACK: "\"Apple Color Emoji\", \"Segoe UI Emoji\", \"Noto Color Emoji\", -apple-system, sans-serif",
    SANS_STACK:  "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Apple Color Emoji\", \"Segoe UI Emoji\", sans-serif",

    async share(opts = {}) {
        const blob = await this._renderBlob(opts);
        if (!blob) throw new Error('Impossible de générer l\'image');
        const filename = `onefood-${new Date().toISOString().slice(0, 10)}.jpg`;
        // Show a preview modal with two explicit paths :
        //  1. Partager → navigator.share (works for iMessage, WhatsApp,
        //     Insta, Twitter…). Snapchat is buggy on iOS Web Share and
        //     often returns a blank screen — so we ALSO expose…
        //  2. Enregistrer l'image → download to camera roll. User then
        //     opens Snap directly and picks from photos. Universally
        //     works for any target app.
        return this._showPreviewModal(blob, filename, opts);
    },

    _showPreviewModal(blob, filename, opts) {
        return new Promise((resolve) => {
            const url = URL.createObjectURL(blob);
            const cleanup = () => {
                setTimeout(() => URL.revokeObjectURL(url), 500);
                if (typeof Modal !== 'undefined') Modal.close();
            };
            const file = new File([blob], filename, { type: 'image/jpeg' });
            const fileOnly = { files: [file] };
            // Include the app URL in the text share so recipients see a
            // tappable link next to the image ("Rejoins-moi sur 1food.fr").
            // Web Share API supports {text, url, files} — messaging apps
            // (iMessage, WhatsApp, Insta DM…) render text + URL as a
            // clickable preview along with the image. If url= isn't
            // supported (rare), we also embed it in the text as fallback.
            const APP_URL = 'https://1food.fr';
            const baseText = opts.text || 'Mon suivi nutrition sur OneFood 🔥';
            const textWithUrl = `${baseText}\n\nDécouvre l'app : ${APP_URL}`;
            const withText = {
                title: 'OneFood',
                text: textWithUrl,
                url: APP_URL,
                files: [file]
            };
            const canFileShare = !!(navigator.canShare && navigator.canShare(fileOnly) && navigator.share);
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent || '') && !window.MSStream;

            // Full text share — includes description + app URL so the
            // recipient sees a tappable "1food.fr" link along with the
            // image. iOS surfaces app targets (Messages, WhatsApp, Insta,
            // Twitter…) which all render the URL as a clickable preview.
            this._pendingShare = async () => {
                // Some browsers reject a {text, url, files} triple even
                // when they support each individually. Try full payload,
                // then fall back to {text, files} (URL embedded in text).
                const attempts = [];
                if (navigator.canShare(withText)) attempts.push(withText);
                const fallback = { title: 'OneFood', text: textWithUrl, files: [file] };
                if (navigator.canShare(fallback)) attempts.push(fallback);
                for (const payload of attempts) {
                    try {
                        await navigator.share(payload);
                        cleanup(); resolve({ shared: true });
                        return;
                    } catch (err) {
                        if (err && err.name === 'AbortError') { return; }
                        // try next fallback
                    }
                }
                this._pendingSaveToPhotos();
            };
            // Save-to-Photos flow : on iOS the OS "Save Image" action shows
            // when the share payload has ONLY the file (no text). This
            // saves directly to the Photos gallery — from where Snap can
            // pick the image via its own "+" → Camera Roll. <a download>
            // was going to Files/Downloads which Snap can't access.
            this._pendingSaveToPhotos = async () => {
                if (canFileShare) {
                    try {
                        await navigator.share(fileOnly);
                        if (typeof App !== 'undefined' && App.showToast) {
                            App.showToast('👉 Choisis « Enregistrer l\'image » dans la feuille');
                        }
                        cleanup(); resolve({ shared: false, saved: true });
                        return;
                    } catch (err) {
                        if (err && err.name === 'AbortError') return;
                    }
                }
                // Non-iOS or share unavailable — open the image in a new
                // tab. The browser's native image viewer offers a proper
                // save action (long-press on iOS, right-click on desktop).
                window.open(url, '_blank');
                cleanup(); resolve({ shared: false, opened: true });
            };
            this._pendingCancel = () => { cleanup(); resolve({ shared: false, cancelled: true }); };

            if (typeof Modal === 'undefined') {
                // No modal system loaded — best-effort share directly.
                if (canFileShare) navigator.share(withText).catch(() => window.open(url, '_blank'));
                else window.open(url, '_blank');
                resolve({ shared: false });
                return;
            }

            Modal.show(`
                <div style="text-align:center">
                    <div style="font-size:14px;color:var(--text-secondary);margin-bottom:8px">Ton image est prête</div>
                    <img src="${url}" alt="Preview de ta carte OneFood" style="width:100%;max-width:280px;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,0.5);margin-bottom:6px" />
                    <div style="font-size:11px;color:var(--text-secondary);margin:2px 0 14px;font-style:italic">Astuce iOS : appuie longuement sur l'image ↑</div>
                    <div style="display:flex;flex-direction:column;gap:10px">
                        ${canFileShare ? `
                            <button class="btn btn-primary" onclick="ShareCard._pendingShare()" style="width:100%;padding:14px;font-size:15px">
                                📤 Partager (SMS · WhatsApp · Insta · …)
                            </button>
                        ` : ''}
                        <button class="btn btn-outline" onclick="ShareCard._pendingSaveToPhotos()" style="width:100%;padding:14px;font-size:15px">
                            📸 Enregistrer dans mes photos${isIOS ? '' : ' / ouvrir en grand'}
                        </button>
                        ${isIOS ? `
                            <div style="font-size:11px;color:var(--text-secondary);line-height:1.5;background:var(--surface-alt);padding:10px 12px;border-radius:10px;text-align:left">
                                <strong style="color:var(--text)">Pour Snap :</strong> tape « Enregistrer dans mes photos » → dans la feuille iOS qui s'ouvre, choisis <strong>« Enregistrer l'image »</strong>. Puis ouvre Snap et sélectionne l'image depuis ta pellicule.
                            </div>
                        ` : ''}
                        <button class="btn btn-secondary" onclick="ShareCard._pendingCancel()" style="width:100%;padding:10px;font-size:13px;margin-top:4px">
                            Annuler
                        </button>
                    </div>
                </div>
            `);
        });
    },

    _renderBlob(opts) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            canvas.width = this.W;
            canvas.height = this.H;
            const ctx = canvas.getContext('2d');
            this._paint(ctx, opts);
            // JPEG q=0.9 — universally decoded by every share target,
            // smaller than PNG, fixes Snapchat's white-screen quirk.
            canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
        });
    },

    _paint(ctx, opts) {
        const { W, H } = this;
        const {
            name = 'Toi',
            calories = 0, calorieGoal = 0,
            protein = 0, carbs = 0, fat = 0, fiber = 0,
            streak = 0,
            dateStr = '',
            mealLabel = '',
            mealIcon = '',
            items = []           // meal mode : array of {name, grams, calories}
        } = opts;
        const isMeal = !!mealLabel;
        const SANS = this.SANS_STACK;
        const EMO = this.EMOJI_STACK;

        // ============ TOP RED HEADER (0 → 340) ============
        const headerH = 340;
        const bg = ctx.createLinearGradient(0, 0, 0, headerH);
        bg.addColorStop(0, '#EF4444');
        bg.addColorStop(1, '#DC2626');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, headerH);
        // Subtle diagonal shine on the header
        const shine = ctx.createLinearGradient(0, 0, W, headerH);
        shine.addColorStop(0, 'rgba(255,255,255,0.10)');
        shine.addColorStop(1, 'rgba(0,0,0,0.10)');
        ctx.fillStyle = shine;
        ctx.fillRect(0, 0, W, headerH);

        // Logo "1" tile
        this._roundRect(ctx, 60, 60, 88, 88, 22);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.fillStyle = '#EF4444';
        ctx.font = `800 62px ${SANS}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('1', 104, 107);

        // "OneFood" wordmark
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#ffffff';
        ctx.font = `800 46px ${SANS}`;
        ctx.fillText('OneFood', 170, 118);

        // Subtitle
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = `500 22px ${SANS}`;
        if (isMeal) {
            // Draw emoji separately with emoji-first font so ☀️ etc.
            // render as colour glyphs, not outline tofu.
            ctx.font = `500 26px ${EMO}`;
            ctx.fillText(mealIcon || '🍽️', 170, 148);
            ctx.font = `600 24px ${SANS}`;
            ctx.fillText(mealLabel, 210, 148);
        } else {
            ctx.fillText('Suivi nutrition & muscu', 170, 146);
        }

        // Top-right badge — streak on day cards
        if (!isMeal && streak > 0) {
            const label = `🔥 ${streak} j`;
            ctx.font = `700 38px ${SANS}`;
            const tw = ctx.measureText(label).width;
            const bw = Math.max(180, Math.min(360, tw + 60));
            const bx = W - 60 - bw, by = 90, bh = 74;
            this._roundRect(ctx, bx, by, bw, bh, 22);
            ctx.fillStyle = 'rgba(0,0,0,0.28)';
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, bx + bw / 2, by + bh / 2 + 2);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
        }

        // User & date (bottom of header)
        ctx.fillStyle = '#ffffff';
        ctx.font = `700 34px ${SANS}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(name, 60, 240);
        if (dateStr) {
            ctx.fillStyle = 'rgba(255,255,255,0.75)';
            ctx.font = `500 24px ${SANS}`;
            ctx.fillText(dateStr, 60, 280);
        }

        // ============ DARK BODY (340 → 1350) ============
        const bodyGrad = ctx.createLinearGradient(0, headerH, 0, H);
        bodyGrad.addColorStop(0, '#141419');
        bodyGrad.addColorStop(1, '#0a0a0f');
        ctx.fillStyle = bodyGrad;
        ctx.fillRect(0, headerH, W, H - headerH);

        // Calories block — cleaner rectangular card instead of ring
        // (rings feel arbitrary without a per-meal goal, and the rectangle
        // leaves more room for the food list below).
        const kcalY = headerH + 40;
        const kcalH = 200;
        this._roundRect(ctx, 60, kcalY, W - 120, kcalH, 24);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.font = `800 120px ${SANS}`;
        ctx.fillText(String(Math.round(calories)), W / 2, kcalY + kcalH / 2 - 10);
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.font = `600 26px ${SANS}`;
        const kcalLabel = calorieGoal > 0
            ? `kcal · ${Math.round((calories / calorieGoal) * 100)}% de l'objectif`
            : 'kcal';
        ctx.fillText(kcalLabel, W / 2, kcalY + kcalH / 2 + 65);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        // Foods list (meal mode only, up to 6 shown)
        let macrosY = kcalY + kcalH + 40;
        if (isMeal && items && items.length > 0) {
            const listY = kcalY + kcalH + 30;
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            ctx.font = `700 20px ${SANS}`;
            ctx.fillText('DÉTAIL DU REPAS', 60, listY);

            const maxRows = 6;
            const rows = items.slice(0, maxRows);
            const rowH = 62;
            const y0 = listY + 20;
            rows.forEach((it, i) => {
                const y = y0 + i * rowH;
                // Row separator
                if (i > 0) {
                    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(60, y);
                    ctx.lineTo(W - 60, y);
                    ctx.stroke();
                }
                // Truncate long names — leave ~380px for the right column
                let nm = (it.name || '').replace(/^📋\s*/, '');
                ctx.fillStyle = '#ffffff';
                ctx.font = `600 26px ${SANS}`;
                const maxNameW = W - 60 - 60 - 340;
                while (ctx.measureText(nm).width > maxNameW && nm.length > 4) {
                    nm = nm.slice(0, -1);
                }
                if (nm.length < (it.name || '').length) nm = nm.trim() + '…';
                ctx.fillText(nm, 60, y + 42);

                // Right column : grams · kcal
                const g = it.grams ? `${Math.round(it.grams)}g` : '';
                const c = `${Math.round(it.calories || 0)} kcal`;
                ctx.textAlign = 'right';
                ctx.fillStyle = 'rgba(255,255,255,0.55)';
                ctx.font = `500 22px ${SANS}`;
                ctx.fillText(g, W - 60 - 160, y + 42);
                ctx.fillStyle = '#ffffff';
                ctx.font = `700 26px ${SANS}`;
                ctx.fillText(c, W - 60, y + 42);
                ctx.textAlign = 'left';
            });
            if (items.length > maxRows) {
                const y = y0 + rows.length * rowH + 8;
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.font = `500 22px ${SANS}`;
                ctx.textAlign = 'center';
                ctx.fillText(`+ ${items.length - maxRows} autre${items.length - maxRows > 1 ? 's' : ''}`, W / 2, y + 20);
                ctx.textAlign = 'left';
            }
            macrosY = y0 + Math.min(rows.length, maxRows) * rowH + (items.length > maxRows ? 44 : 20);
        }

        // Macros row — brand colours pop against dark body
        const macros = [
            { label: 'Prot.', val: protein, unit: 'g', color: '#60A5FA' },
            { label: 'Gluc.', val: carbs,   unit: 'g', color: '#F59E0B' },
            { label: 'Lip.',  val: fat,     unit: 'g', color: '#F87171' },
            { label: 'Fib.',  val: fiber,   unit: 'g', color: '#34D399' }
        ];
        // Clamp macrosY so we always leave room for the footer (~90px)
        macrosY = Math.min(macrosY, H - 250);
        const gap = 16;
        const cellW = (W - 120 - gap * 3) / 4;
        const rowH = 160;
        macros.forEach((m, i) => {
            const x = 60 + i * (cellW + gap);
            this._roundRect(ctx, x, macrosY, cellW, rowH, 20);
            ctx.fillStyle = 'rgba(255,255,255,0.04)';
            ctx.fill();
            // Coloured left accent bar
            this._roundRect(ctx, x, macrosY, 5, rowH, 3);
            ctx.fillStyle = m.color;
            ctx.fill();

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = m.color;
            ctx.font = `800 52px ${SANS}`;
            ctx.fillText(Math.round(m.val) + m.unit, x + cellW / 2, macrosY + 58);
            ctx.fillStyle = 'rgba(255,255,255,0.62)';
            ctx.font = `600 24px ${SANS}`;
            ctx.fillText(m.label, x + cellW / 2, macrosY + 118);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
        });

        // Footer
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = `700 30px ${SANS}`;
        ctx.fillText('1food.fr', W / 2, H - 80);
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.font = `500 20px ${SANS}`;
        ctx.fillText('Photo IA · Journal · Recettes · Muscu', W / 2, H - 48);
    },

    _roundRect(ctx, x, y, w, h, r) {
        const rr = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.arcTo(x + w, y, x + w, y + h, rr);
        ctx.arcTo(x + w, y + h, x, y + h, rr);
        ctx.arcTo(x, y + h, x, y, rr);
        ctx.arcTo(x, y, x + w, y, rr);
        ctx.closePath();
    }
};
