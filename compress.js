const sharp = require('sharp');
const fs = require('fs');

async function optimize() {
  try {
    console.log("Optimizing icon-512.png...");
    await sharp('public/icon-512.png')
      .resize(512, 512)
      .png({ quality: 80, compressionLevel: 9 })
      .toFile('public/icon-512-opt.png');
    
    fs.renameSync('public/icon-512-opt.png', 'public/icon-512.png');
    console.log("icon-512.png optimized!");

    console.log("Optimizing logo.png...");
    if (fs.existsSync('public/logo.png')) {
      await sharp('public/logo.png')
        .png({ quality: 80, compressionLevel: 9 })
        .toFile('public/logo-opt.png');
      fs.renameSync('public/logo-opt.png', 'public/logo.png');
      console.log("logo.png optimized!");
    }
    
    console.log("Note: favicon.ico should ideally be a small multi-size ICO or replaced by favicon.svg. We recommend deleting favicon.ico since you have favicon.svg!");

  } catch (err) {
    console.error("Compression failed:", err);
  }
}

optimize();
