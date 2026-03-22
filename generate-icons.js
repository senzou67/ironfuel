// Run with: node generate-icons.js
// Generates SVG icons for IronFuel PWA

const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'assets', 'icons');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// SVG icon — burnt orange gradient with IF + flame
function createSVG(size) {
    const cx = size / 2;
    const cy = size / 2;
    const r = Math.round(size * 0.22);
    const fontSize = Math.round(size * 0.40);
    const flameSize = Math.round(size * 0.16);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#E64A19"/>
      <stop offset="100%" stop-color="#BF360C"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#bg)"/>
  <text x="${cx}" y="${cy + size*0.14}" font-family="Arial,sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle">IF</text>
  <text x="${cx}" y="${cy - size*0.14}" font-size="${flameSize}" text-anchor="middle">🔥</text>
</svg>`;
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
    const svg = createSVG(size);
    const filename = `icon-${size}.svg`;
    fs.writeFileSync(path.join(dir, filename), svg);
    console.log(`Created ${filename}`);
});

// Also create apple-touch-icon (180x180)
fs.writeFileSync(path.join(dir, 'apple-touch-icon.svg'), createSVG(180));
console.log('Created apple-touch-icon.svg');

console.log('\nDone! IronFuel SVG icons created in assets/icons/');
