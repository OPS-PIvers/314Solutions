const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const sizes = {
  large: 1920,
  medium: 1024,
  small: 640,
  thumbnail: 320
};

const imageFiles = [
  'banner.jpeg',
  'icon.jpeg',
  'doc2lms-preview.png',
  'peer-eval-preview.png',
  'spartan-cup-preview.png'
];

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

async function processImage(inputPath, outputDir) {
  const basename = path.basename(inputPath, path.extname(inputPath));
  const image = sharp(inputPath);
  const metadata = await image.metadata();

  console.log(`Processing ${inputPath} (${metadata.width}x${metadata.height})...`);

  for (const [sizeName, width] of Object.entries(sizes)) {
    if (metadata.width < width) {
      console.log(`  Skipping ${sizeName} (${width}px) - source image is smaller`);
      continue;
    }

    const resized = image.clone().resize(width, null, {
      withoutEnlargement: true,
      fit: 'inside'
    });

    await resized
      .jpeg({ quality: 85, progressive: true })
      .toFile(path.join(outputDir, `${basename}-${sizeName}.jpg`));

    await resized
      .webp({ quality: 85 })
      .toFile(path.join(outputDir, `${basename}-${sizeName}.webp`));

    console.log(`  Created ${sizeName} version (${width}px)`);
  }

  await image
    .webp({ quality: 90 })
    .toFile(path.join(outputDir, `${basename}-original.webp`));

  console.log(`  Created original size WebP version`);
}

async function main() {
  const outputDir = path.join(__dirname, 'images');
  await ensureDir(outputDir);

  console.log('Generating responsive images...\n');

  for (const file of imageFiles) {
    const filePath = path.join(__dirname, file);
    try {
      await processImage(filePath, outputDir);
      console.log(`✓ Completed ${file}\n`);
    } catch (err) {
      console.error(`✗ Failed to process ${file}:`, err.message, '\n');
    }
  }

  console.log('Done! All images have been processed.');
  console.log(`Optimized images saved to: ${outputDir}/`);
}

main().catch(console.error);
