// Run with: node generate-icons.js
// Generates SVG icons for OneFood PWA — flat bright red, single "1" character.
// Modernized: no gradient, no emoji, no outline.

const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'assets', 'icons');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const BRAND_COLOR = '#EF4444';

function createSVG(size) {
    const cx = size / 2;
    const r = Math.round(size * 0.22);
    const fontSize = Math.round(size * 0.62);
    // Baseline trick: y ≈ cx + fontSize * 0.34 so digit is optically centered.
    const baseline = Math.round(cx + fontSize * 0.34);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="${BRAND_COLOR}"/>
  <text x="${cx}" y="${baseline}" font-family="system-ui,-apple-system,Inter,Arial,sans-serif" font-size="${fontSize}" font-weight="900" fill="#fff" text-anchor="middle">1</text>
</svg>`;
}

// Maskable variant: no rounded corners, add 10% safe-zone padding inside
function createMaskableSVG(size) {
    const cx = size / 2;
    const fontSize = Math.round(size * 0.54);
    const baseline = Math.round(cx + fontSize * 0.34);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BRAND_COLOR}"/>
  <text x="${cx}" y="${baseline}" font-family="system-ui,-apple-system,Inter,Arial,sans-serif" font-size="${fontSize}" font-weight="900" fill="#fff" text-anchor="middle">1</text>
</svg>`;
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
    const svg = createSVG(size);
    fs.writeFileSync(path.join(dir, `icon-${size}.svg`), svg);
    console.log(`Created icon-${size}.svg`);
});

// apple-touch-icon (180x180)
fs.writeFileSync(path.join(dir, 'apple-touch-icon.svg'), createSVG(180));
console.log('Created apple-touch-icon.svg');

// Maskable variants (for Android adaptive icons)
[192, 512].forEach(size => {
    const svg = createMaskableSVG(size);
    fs.writeFileSync(path.join(dir, `icon-${size}-maskable.svg`), svg);
    console.log(`Created icon-${size}-maskable.svg`);
});

console.log('\nDone! Flat red OneFood SVG icons created in assets/icons/');
