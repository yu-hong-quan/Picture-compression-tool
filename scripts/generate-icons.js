const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

const sizes = [16, 24, 32, 48, 64, 128, 256];

async function generateIcons() {
  try {
    const svgPath = path.join(__dirname, '../build/icon.svg');
    const svgBuffer = await fs.readFile(svgPath);

    // 生成不同尺寸的 PNG
    for (const size of sizes) {
      const outputPath = path.join(__dirname, `../build/icon-${size}.png`);
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`Generated ${size}x${size} icon`);
    }

    // 生成主图标
    await sharp(svgBuffer)
      .resize(256, 256)
      .png()
      .toFile(path.join(__dirname, '../build/icon.png'));
    console.log('Generated main icon');
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons(); 