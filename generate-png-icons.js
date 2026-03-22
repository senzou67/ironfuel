const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'assets', 'icons');
const svgPath = path.join(iconsDir, 'icon-512.svg');

// SVG has emoji 🔥 which sharp can't render — create a clean SVG with just text
const cleanSVG = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#E64A19"/>
      <stop offset="100%" stop-color="#BF360C"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="113" fill="url(#bg)"/>
  <text x="256" y="310" font-family="Arial,Helvetica,sans-serif" font-size="200" font-weight="bold" fill="white" text-anchor="middle">IF</text>
  <text x="256" y="180" font-family="Arial,Helvetica,sans-serif" font-size="70" fill="#FFC107" text-anchor="middle" font-weight="bold">*</text>
</svg>`;

// Maskable icon needs safe zone (inner 80% circle)
const maskableSVG = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#E64A19"/>
      <stop offset="100%" stop-color="#BF360C"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <text x="256" y="310" font-family="Arial,Helvetica,sans-serif" font-size="180" font-weight="bold" fill="white" text-anchor="middle">IF</text>
</svg>`;

// OG image (1200x630)
const ogSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#E64A19"/>
      <stop offset="100%" stop-color="#BF360C"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="60" y="60" width="1080" height="510" rx="40" fill="rgba(255,255,255,0.1)"/>
  <text x="600" y="280" font-family="Arial,Helvetica,sans-serif" font-size="160" font-weight="bold" fill="white" text-anchor="middle">IronFuel</text>
  <text x="600" y="380" font-family="Arial,Helvetica,sans-serif" font-size="42" fill="rgba(255,255,255,0.85)" text-anchor="middle">Suivi Nutrition &amp; Musculation Intelligent</text>
  <text x="600" y="450" font-family="Arial,Helvetica,sans-serif" font-size="30" fill="#FFC107" text-anchor="middle">Photo IA  |  500+ aliments  |  Gamification</text>
</svg>`;

async function generate() {
    const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

    for (const size of sizes) {
        const svg = Buffer.from(cleanSVG(size));
        await sharp(svg)
            .resize(size, size)
            .png()
            .toFile(path.join(iconsDir, `icon-${size}.png`));
        console.log(`Generated icon-${size}.png`);
    }

    // Maskable icons (192 + 512)
    for (const size of [192, 512]) {
        const svg = Buffer.from(maskableSVG(size));
        await sharp(svg)
            .resize(size, size)
            .png()
            .toFile(path.join(iconsDir, `icon-${size}-maskable.png`));
        console.log(`Generated icon-${size}-maskable.png`);
    }

    // Apple touch icon (180x180)
    const appleSvg = Buffer.from(cleanSVG(180));
    await sharp(appleSvg)
        .resize(180, 180)
        .png()
        .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
    console.log('Generated apple-touch-icon.png');

    // OG image (1200x630)
    const ogBuffer = Buffer.from(ogSVG);
    await sharp(ogBuffer)
        .resize(1200, 630)
        .png()
        .toFile(path.join(__dirname, 'assets', 'og-image.png'));
    console.log('Generated og-image.png');

    console.log('\nDone! All PNG icons generated.');
}

generate().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
