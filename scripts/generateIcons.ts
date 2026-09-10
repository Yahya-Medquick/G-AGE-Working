import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const ICONS_DIR = path.join(process.cwd(), 'public', 'icons');

if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

function getSvgIcon(size: number): string {
  // SVG design matching G-AGE AI brand identity:
  // Sleek rounded background, glowing lightbulb with graduation cap & "G-AGE" lettering
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="50%" stop-color="#1a1f2e"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="bulbGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="50%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>
    <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  
  <!-- Background with slight squircle radius -->
  <rect width="512" height="512" rx="100" fill="url(#bgGrad)"/>
  
  <!-- Subtle border accent -->
  <rect x="6" y="6" width="500" height="500" rx="94" fill="none" stroke="#3a7bd5" stroke-width="6" opacity="0.4"/>

  <!-- Glowing Aura behind bulb -->
  <circle cx="256" cy="270" r="100" fill="#38bdf8" opacity="0.25" filter="url(#glow)"/>

  <!-- Lightbulb Body -->
  <path d="M 200 340 L 312 340 C 312 340 336 300 350 260 C 364 220 346 170 310 148 C 274 126 226 130 196 156 C 166 182 154 228 170 266 C 182 296 200 340 200 340 Z" fill="url(#bulbGrad)" filter="url(#glow)"/>

  <!-- Lightbulb Base / Screw thread -->
  <rect x="220" y="348" width="72" height="14" rx="7" fill="#94a3b8" />
  <rect x="224" y="368" width="64" height="14" rx="7" fill="#64748b" />
  <path d="M 234 388 L 278 388 C 278 398 234 398 234 388 Z" fill="#475569" />

  <!-- Graduation Mortarboard / Cap -->
  <!-- Cap Diamond -->
  <polygon points="256,90 390,140 256,186 122,140" fill="url(#capGrad)" stroke="#64748b" stroke-width="4"/>
  <!-- Cap Skull Base -->
  <path d="M 190 162 L 190 195 C 190 220 322 220 322 195 L 322 162 Z" fill="#1e293b" />
  <!-- Tassel Button & String -->
  <circle cx="256" cy="138" r="7" fill="#f59e0b"/>
  <path d="M 256 138 Q 200 150 176 210" fill="none" stroke="#f59e0b" stroke-width="4"/>
  <polygon points="170,210 182,210 186,250 166,250" fill="#f59e0b"/>

  <!-- G-AGE Brand Text inside bulb -->
  <text x="256" y="268" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="42" letter-spacing="2" filter="url(#glow)">G-AGE</text>
  <text x="256" y="296" text-anchor="middle" fill="#93c5fd" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="18" letter-spacing="4">AI ENGINE</text>

  <!-- Robot hand / cradle accent below -->
  <path d="M 140 430 C 200 460 312 460 372 430 C 350 405 320 395 285 410 C 256 422 256 422 227 410 C 192 395 162 405 140 430 Z" fill="#334155" opacity="0.8"/>
</svg>`;
}

async function generateAllIcons() {
  console.log('Generating PWA icons...');
  for (const size of SIZES) {
    const svg = getSvgIcon(512);
    const dest = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(dest);
    console.log(`✓ Generated: ${dest} (${size}x${size})`);
  }

  // Also generate root public/icon.png and apple-touch-icon.png for compatibility
  const svg512 = getSvgIcon(512);
  await sharp(Buffer.from(svg512))
    .resize(512, 512)
    .png()
    .toFile(path.join(process.cwd(), 'public', 'icon.png'));

  await sharp(Buffer.from(svg512))
    .resize(180, 180)
    .png()
    .toFile(path.join(process.cwd(), 'public', 'apple-touch-icon.png'));

  console.log('All icons generated successfully!');
}

generateAllIcons().catch(err => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
