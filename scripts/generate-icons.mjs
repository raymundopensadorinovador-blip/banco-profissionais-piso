import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

const publicDir = path.join(process.cwd(), "public");
const source = path.join(publicDir, "logo-bp.png");
const iconsDir = path.join(publicDir, "icons");

await fs.mkdir(iconsDir, { recursive: true });

const outputs = [
  { file: "icon-72.png", size: 72 },
  { file: "icon-96.png", size: 96 },
  { file: "icon-128.png", size: 128 },
  { file: "icon-144.png", size: 144 },
  { file: "icon-152.png", size: 152 },
  { file: "icon-180.png", size: 180 },
  { file: "icon-192.png", size: 192 },
  { file: "icon-384.png", size: 384 },
  { file: "icon-512.png", size: 512 },
];

for (const output of outputs) {
  await sharp(source)
    .resize(output.size, output.size, {
      fit: "cover",
      position: "center",
    })
    .png()
    .toFile(path.join(iconsDir, output.file));
}

await sharp(source)
  .resize(180, 180, {
    fit: "cover",
    position: "center",
  })
  .png()
  .toFile(path.join(publicDir, "apple-touch-icon.png"));

await sharp(source)
  .resize(32, 32, {
    fit: "cover",
    position: "center",
  })
  .png()
  .toFile(path.join(publicDir, "favicon.png"));

console.log("Ícones gerados com sucesso.");