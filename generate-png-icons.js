// Regenerate PNG icons from the new flat-red SVG design.
// Usage: npm i sharp --no-save && node generate-png-icons.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'assets', 'icons');
const BRAND_COLOR = '#EF4444';

function cleanSVG(size, rounded = true) {
    const cx = size / 2;
    const r = rounded ? Math.round(size * 0.22) : 0;
    const fontSize = Math.round(size * (rounded ? 0.62 : 0.54));
    const baseline = Math.round(cx + fontSize * 0.34);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" ${r ? `rx="${r}"` : ''} fill="${BRAND_COLOR}"/>
  <text x="${cx}" y="${baseline}" font-family="Arial,Helvetica,sans-serif" font-size="${fontSize}" font-weight="900" fill="#fff" text-anchor="middle">1</text>
</svg>`;
}

// Open Graph 1200×630 — flat red, centered "OneFood" wordmark
const ogSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${BRAND_COLOR}"/>
  <text x="600" y="340" font-family="Arial,Helvetica,sans-serif" font-size="170" font-weight="900" fill="#fff" text-anchor="middle">OneFood</text>
  <text x="600" y="420" font-family="Arial,Helvetica,sans-serif" font-size="36" fill="rgba(255,255,255,0.85)" text-anchor="middle">Suivi Nutrition &amp; Musculation Intelligent</text>
</svg>`;

async function generate() {
    const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
    for (const size of sizes) {
        await sharp(Buffer.from(cleanSVG(size, true)))
            .resize(size, size)
            .png()
            .toFile(path.join(iconsDir, `icon-${size}.png`));
        console.log(`Generated icon-${size}.png`);
    }

    // Maskable (no rounded corners, OS will apply shape mask)
    for (const size of [192, 512]) {
        await sharp(Buffer.from(cleanSVG(size, false)))
            .resize(size, size)
            .png()
            .toFile(path.join(iconsDir, `icon-${size}-maskable.png`));
        console.log(`Generated icon-${size}-maskable.png`);
    }

    // Apple touch icon (180)
    await sharp(Buffer.from(cleanSVG(180, true)))
        .resize(180, 180)
        .png()
        .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
    console.log('Generated apple-touch-icon.png');

    // OG image (1200×630)
    await sharp(Buffer.from(ogSVG))
        .resize(1200, 630)
        .png()
        .toFile(path.join(__dirname, 'assets', 'og-image.png'));
    console.log('Generated og-image.png');

    console.log('\nDone! Flat red PNG icons regenerated.');
}

generate().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
