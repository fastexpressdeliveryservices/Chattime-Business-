const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

// Standard SVG for normal icon
const standardSvg = fs.readFileSync(path.join(publicDir, 'icon.svg'), 'utf8');

// Maskable SVG with full-bleed background & inner safe zone
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none">
  <defs>
    <linearGradient id="ctBgGrad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#450a0a" />
      <stop offset="40%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="ctAccentGrad" x1="96" y1="96" x2="416" y2="416" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#f87171" />
      <stop offset="50%" stop-color="#ef4444" />
      <stop offset="100%" stop-color="#b91c1c" />
    </linearGradient>
    <linearGradient id="ctGlowGrad" x1="128" y1="128" x2="384" y2="384" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ef4444" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#991b1b" stop-opacity="0.0" />
    </linearGradient>
  </defs>

  <!-- Full-bleed background without rounded corners for adaptive Android masking -->
  <rect width="512" height="512" fill="url(#ctBgGrad)" />
  <circle cx="256" cy="256" r="220" fill="url(#ctGlowGrad)" />

  <!-- Inner safe zone (scaled 0.76 around center 256, 256) -->
  <g transform="translate(256 256) scale(0.76) translate(-256 -256)">
    <path
      d="M256 96C162 96 86 164 86 248C86 285.5 101.3 319.8 126.8 346.4C121.8 370.7 108.1 394.9 106.3 398C103.5 402.8 107.2 408.8 112.7 408.3C144.1 405.2 173.8 393.6 194.8 383.1C214.4 389.8 235.3 393.4 257 393.4C351 393.4 428 325.4 428 248C428 164 351 96 256 96Z"
      fill="url(#ctAccentGrad)"
    />

    <circle cx="257" cy="245" r="94" fill="#020617" />
    <circle cx="257" cy="245" r="81" stroke="#f87171" stroke-width="7" stroke-opacity="0.5" stroke-dasharray="19 11" />

    <path
      d="M257 186V245L298 269"
      stroke="#ffffff"
      stroke-width="18"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle cx="257" cy="245" r="13" fill="#ef4444" />

    <circle cx="364" cy="148" r="26" fill="#020617" />
    <circle cx="364" cy="148" r="17" fill="#ef4444" />
    <circle cx="364" cy="148" r="7" fill="#fecaca" />
  </g>
</svg>`;

async function generateAll() {
  console.log('Generating red ChatTime PWA icons...');

  // 1. pwa-512x512.png
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Created pwa-512x512.png');

  // 2. pwa-192x192.png
  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Created pwa-192x192.png');

  // 3. apple-touch-icon.png (180x180 PNG)
  await sharp(Buffer.from(standardSvg))
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // 4. pwa-maskable-512x512.png
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Created pwa-maskable-512x512.png');

  // 5. app-logo.jpg (512x512 JPEG)
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .jpeg({ quality: 95 })
    .toFile(path.join(publicDir, 'app-logo.jpg'));
  console.log('Created app-logo.jpg');

  // 6. brand logo in src/assets/images
  const brandLogoPath = path.join(rootDir, 'src/assets/images/chattime_brand_logo_1790475904458.jpg');
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .jpeg({ quality: 95 })
    .toFile(brandLogoPath);
  console.log('Updated chattime_brand_logo_1790475904458.jpg');

  // 7. favicon.ico
  await sharp(Buffer.from(standardSvg))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Created favicon.ico');

  console.log('All red ChatTime icons generated successfully!');
}

generateAll().catch((err) => {
  console.error('Generation error:', err);
  process.exit(1);
});
