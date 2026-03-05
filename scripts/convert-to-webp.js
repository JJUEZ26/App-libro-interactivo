/**
 * Script de conversión de imágenes a WebP.
 * Reduce el tamaño de las portadas ~60-70% sin pérdida visual.
 * 
 * Uso: node scripts/convert-to-webp.js
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const QUALITY = 82; // Balance entre calidad y compresión
const MAX_WIDTH = 1200; // Ancho máximo (portadas no necesitan más)

async function convertImages() {
    const files = fs.readdirSync(IMAGES_DIR);
    const imageFiles = files.filter(f => /\.(png|jpg|jpeg)$/i.test(f) && !f.endsWith('.webp'));

    console.log(`\n📸 Encontradas ${imageFiles.length} imágenes para convertir\n`);

    let totalBefore = 0;
    let totalAfter = 0;

    for (const file of imageFiles) {
        const inputPath = path.join(IMAGES_DIR, file);
        const outputName = file.replace(/\.(png|jpg|jpeg)$/i, '.webp');
        const outputPath = path.join(IMAGES_DIR, outputName);

        const statBefore = fs.statSync(inputPath);
        const sizeBefore = statBefore.size;
        totalBefore += sizeBefore;

        try {
            await sharp(inputPath)
                .resize({ width: MAX_WIDTH, withoutEnlargement: true })
                .webp({ quality: QUALITY })
                .toFile(outputPath);

            const statAfter = fs.statSync(outputPath);
            const sizeAfter = statAfter.size;
            totalAfter += sizeAfter;

            const reduction = ((1 - sizeAfter / sizeBefore) * 100).toFixed(1);
            const sizeMBBefore = (sizeBefore / 1024 / 1024).toFixed(2);
            const sizeMBAfter = (sizeAfter / 1024 / 1024).toFixed(2);

            console.log(`  ✅ ${file} → ${outputName}`);
            console.log(`     ${sizeMBBefore} MB → ${sizeMBAfter} MB (−${reduction}%)\n`);
        } catch (err) {
            console.error(`  ❌ Error con ${file}:`, err.message);
        }
    }

    const totalMBBefore = (totalBefore / 1024 / 1024).toFixed(2);
    const totalMBAfter = (totalAfter / 1024 / 1024).toFixed(2);
    const totalReduction = ((1 - totalAfter / totalBefore) * 100).toFixed(1);

    console.log(`\n${'='.repeat(50)}`);
    console.log(`📊 TOTAL: ${totalMBBefore} MB → ${totalMBAfter} MB (−${totalReduction}%)`);
    console.log(`${'='.repeat(50)}\n`);
}

convertImages().catch(console.error);
