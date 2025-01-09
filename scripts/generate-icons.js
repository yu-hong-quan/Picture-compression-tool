const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const pngToIco = require('png-to-ico');

const sizes = [16, 24, 32, 48, 64, 128, 256];
const buildDir = path.join(__dirname, '../build');

async function ensureBuildDir() {
  try {
    await fs.access(buildDir);
  } catch {
    await fs.mkdir(buildDir);
  }
}

async function generateIcons() {
  try {
    await ensureBuildDir();

    // 检查源文件是否存在
    const svgPath = path.join(buildDir, 'icon.svg');
    try {
      await fs.access(svgPath);
    } catch {
      throw new Error(`找不到源图标文件: ${svgPath}\n请确保 build 目录中存在 icon.svg 文件`);
    }

    // 生成不同尺寸的图标
    for (const size of sizes) {
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(path.join(buildDir, `icon-${size}.png`));
      console.log(`✨ 生成图标: ${size}x${size}`);
    }

    // 生成主图标
    await sharp(svgPath)
      .resize(256, 256)
      .png()
      .toFile(path.join(buildDir, 'icon.png'));
    console.log('✨ 生成主图标');

    // 生成 ICO 文件
    const pngPaths = sizes.map(size => path.join(buildDir, `icon-${size}.png`));
    const pngBuffers = await Promise.all(pngPaths.map(p => fs.readFile(p)));
    const icoBuffer = await pngToIco(pngBuffers);
    await fs.writeFile(path.join(buildDir, 'icon.ico'), icoBuffer);
    console.log('✨ 生成 ICO 图标');

    console.log('✅ 所有图标生成完成!');
  } catch (error) {
    console.error('❌ 生成图标时出错:', error);
    process.exit(1);
  }
}

generateIcons(); 