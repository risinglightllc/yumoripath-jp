const https = require('https');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SOURCE_URL = 'https://pub-629428d185ca4960a0a73c850d32294b.r2.dev/company_166224/images/d210a32e-7da8-4537-b316-4abbbb90113b.jpg';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'static', 'favicon');

const SIZES = [
  { name: 'favicon-16x16.png',   size: 16  },
  { name: 'favicon-32x32.png',   size: 32  },
  { name: 'favicon-192x192.png', size: 192 },
  { name: 'apple-touch-icon.png', size: 180 },
];

async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        https.get(res.headers.location, (res2) => {
          const chunks = [];
          res2.on('data', chunk => chunks.push(chunk));
          res2.on('end', () => resolve(Buffer.concat(chunks)));
          res2.on('error', reject);
        });
        return;
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }, reject);
  });
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('Downloading source image...');
  const imageBuffer = await downloadImage(SOURCE_URL);
  console.log(`Downloaded ${imageBuffer.length} bytes`);

  const image = sharp(imageBuffer);

  for (const { name, size } of SIZES) {
    const outputPath = path.join(OUTPUT_DIR, name);
    await image
      .clone()
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(outputPath);
    console.log(`Generated ${name}`);
  }

  console.log('Done! Favicon files created in public/static/favicon/');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
