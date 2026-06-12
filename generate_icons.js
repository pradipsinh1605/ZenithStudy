const sharp = require("sharp");
const path = require("path");

const svgPath = path.join(__dirname, "public", "logo.svg");

const sizes = [
  { name: "favicon-16.png", size: 16 },
  { name: "favicon-32.png", size: 32 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "android-chrome-192.png", size: 192 },
  { name: "android-chrome-512.png", size: 512 },
  { name: "icon-192.png", size: 192 },
];

async function generate() {
  for (const s of sizes) {
    const srcSvg = s.name.startsWith("favicon") ? path.join(__dirname, "public", "favicon.svg") : svgPath;
    await sharp(srcSvg)
      .resize(s.size, s.size)
      .png()
      .toFile(path.join(__dirname, "public", s.name));
    console.log(`Generated ${s.name}`);
  }
}

generate().catch(console.error);
