// Build script: copies static files to public/ for Cloudflare deployment
// Excludes node_modules, .git, netlify, and other non-static files
const fs = require('fs');
const path = require('path');

const SRC = __dirname;
const DEST = path.join(__dirname, 'public');

const EXCLUDE = new Set([
    'node_modules', '.git', '.wrangler', 'netlify', '.claude',
    'public', 'build.js', 'package.json', 'package-lock.json',
    'wrangler.toml', 'wrangler.jsonc', '.gitignore', '.assetsignore',
    '.github', 'netlify.toml', 'RECAP-IRONFUEL.md', 'bump.sh',
    'generate-icons.js', 'generate-png-icons.js', 'desktop',
    'functions', 'worker.js'
]);

function copyDir(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

    for (const entry of fs.readdirSync(src)) {
        if (EXCLUDE.has(entry)) continue;

        const srcPath = path.join(src, entry);
        const destPath = path.join(dest, entry);
        const stat = fs.statSync(srcPath);

        if (stat.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Clean and rebuild
if (fs.existsSync(DEST)) fs.rmSync(DEST, { recursive: true });
copyDir(SRC, DEST);

// Count files
let count = 0;
function countFiles(dir) { for (const e of fs.readdirSync(dir)) { const p = path.join(dir, e); if (fs.statSync(p).isDirectory()) countFiles(p); else count++; } }
countFiles(DEST);
console.log(`✅ Built ${count} files to public/`);
