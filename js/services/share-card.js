// ===== SHARE CARD RENDERER =====
// Generates a portrait Instagram-story sized card (1080x1350) with the
// user's daily stats, ready to be shared as an image. Web Share API
// Level 2 (files) is used when available (iOS 15+, Android modern) —
// otherwise the image is downloaded and the user can share manually.
//
// The card is composed in Canvas 2D so no external image assets are
// required and no network round-trip is needed to generate it.
const ShareCard = {
    W: 1080,
    H: 1350,

    async share(opts = {}) {
        const blob = await this._renderBlob(opts);
        if (!blob) throw new Error('Impossible de générer l\'image');
        const filename = `onefood-${new Date().toISOString().slice(0, 10)}.png`;
        const file = new File([blob], filename, { type: 'image/png' });
        const shareData = {
            title: 'OneFood',
            text: opts.text || 'Mon suivi nutrition sur OneFood 🔥',
            files: [file]
        };
        // Web Share Level 2 — files
        if (navigator.canShare && navigator.canShare(shareData) && navigator.share) {
            try {
                await navigator.share(shareData);
                return { shared: true };
            } catch (err) {
                if (err && err.name === 'AbortError') return { shared: false, cancelled: true };
                // fall through to download
            }
        }
        // Fallback : download the file, user shares manually
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        return { shared: false, downloaded: true };
    },

    _renderBlob(opts) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            canvas.width = this.W;
            canvas.height = this.H;
            const ctx = canvas.getContext('2d');
            this._paint(ctx, opts);
            canvas.toBlob((blob) => resolve(blob), 'image/png', 0.92);
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
            // Meal mode (optional) — when set, the card is scoped to one
            // meal instead of the full day: streak badge → meal chip,
            // subtitle → meal name, progress ring is hidden (no per-meal
            // goal).
            mealLabel = '',
            mealIcon = ''
        } = opts;
        const isMeal = !!mealLabel;

        // Background — vertical red gradient
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#EF4444');
        bg.addColorStop(1, '#B91C1C');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        // Subtle diagonal shine
        const shine = ctx.createLinearGradient(0, 0, W, H);
        shine.addColorStop(0, 'rgba(255,255,255,0.10)');
        shine.addColorStop(0.5, 'rgba(255,255,255,0)');
        shine.addColorStop(1, 'rgba(0,0,0,0.15)');
        ctx.fillStyle = shine;
        ctx.fillRect(0, 0, W, H);

        // Font stack — system default with emoji fallback
        const F = "800 96px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        const FSans = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

        // Logo "1" tile (rounded white square, red "1")
        const logoSize = 88;
        this._roundRect(ctx, 60, 60, logoSize, logoSize, 22);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.fillStyle = '#EF4444';
        ctx.font = `800 62px ${FSans}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('1', 60 + logoSize / 2, 60 + logoSize / 2 + 3);

        // "OneFood" wordmark
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#ffffff';
        ctx.font = `800 46px ${FSans}`;
        ctx.fillText('OneFood', 170, 118);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = `500 22px ${FSans}`;
        ctx.fillText(isMeal ? `${mealIcon} ${mealLabel}` : 'Suivi nutrition & muscu', 170, 146);

        // User & date row
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.font = `600 30px ${FSans}`;
        ctx.fillText(name, 60, 240);
        if (dateStr) {
            ctx.fillStyle = 'rgba(255,255,255,0.65)';
            ctx.font = `500 24px ${FSans}`;
            ctx.fillText(dateStr, 60, 278);
        }

        // Top-right badge — streak on day cards, meal name on meal cards.
        // Auto-sized to fit the label.
        if (isMeal || streak > 0) {
            const label = isMeal
                ? `${mealIcon} ${mealLabel}`.trim()
                : `🔥 ${streak} j`;
            ctx.font = `700 38px ${FSans}`;
            const textWidth = ctx.measureText(label).width;
            const bw = Math.max(180, Math.min(360, textWidth + 60));
            const bx = W - 60 - bw, by = 210, bh = 74;
            this._roundRect(ctx, bx, by, bw, bh, 22);
            ctx.fillStyle = 'rgba(0,0,0,0.28)';
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, bx + bw / 2, by + bh / 2 + 2);
        }

        // Central calorie ring
        const cx = W / 2;
        const cy = 620;
        const R = 220;
        const pct = calorieGoal > 0 ? Math.min(1, calories / calorieGoal) : 0;

        // Track
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 28;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.stroke();

        // Progress
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 28;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
        ctx.stroke();
        ctx.lineCap = 'butt';

        // Big calorie number
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.font = `800 140px ${FSans}`;
        ctx.fillText(String(Math.round(calories)), cx, cy - 20);
        ctx.font = `600 32px ${FSans}`;
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText('kcal', cx, cy + 70);
        if (calorieGoal > 0) {
            ctx.font = `500 26px ${FSans}`;
            ctx.fillStyle = 'rgba(255,255,255,0.65)';
            ctx.fillText(`/ ${Math.round(calorieGoal)} obj.`, cx, cy + 108);
        }

        // Macros row
        const macros = [
            { label: 'Prot.', val: protein, unit: 'g' },
            { label: 'Gluc.', val: carbs,   unit: 'g' },
            { label: 'Lip.',  val: fat,     unit: 'g' },
            { label: 'Fib.',  val: fiber,   unit: 'g' }
        ];
        const rowY = 990;
        const rowH = 180;
        const gap = 20;
        const cellW = (W - 120 - gap * 3) / 4;
        macros.forEach((m, i) => {
            const x = 60 + i * (cellW + gap);
            this._roundRect(ctx, x, rowY, cellW, rowH, 22);
            ctx.fillStyle = 'rgba(255,255,255,0.14)';
            ctx.fill();

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.font = `800 56px ${FSans}`;
            ctx.fillText(Math.round(m.val) + m.unit, x + cellW / 2, rowY + 66);
            ctx.fillStyle = 'rgba(255,255,255,0.75)';
            ctx.font = `600 26px ${FSans}`;
            ctx.fillText(m.label, x + cellW / 2, rowY + 130);
        });

        // Footer
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = `600 30px ${FSans}`;
        ctx.fillText('1food.fr', W / 2, H - 100);
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = `500 22px ${FSans}`;
        ctx.fillText('Photo IA · Journal · Recettes · Muscu', W / 2, H - 65);
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
