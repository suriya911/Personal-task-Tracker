/**
 * One-off: convert backdrop JPEGs to responsive WebP.
 *
 * These images are decorative — veiled at 55–65% opacity behind blurred glass
 * — so they tolerate aggressive compression with no visible loss, while the
 * source JPEGs were up to 1.27 MB each (73% of page weight).
 *
 * Emits two widths so phones don't download a desktop wallpaper:
 *   name-960.webp   (phones / most tablets)
 *   name-1920.webp  (laptops and desktops)
 *
 * Run: node scripts/convert-backdrops.mjs
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "backdrops",
);

const VARIANTS = [
  { width: 960, quality: 58 },
  { width: 1920, quality: 62 },
];

const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".jpg"));
let before = 0;
let after = 0;
const rows = [];

for (const f of files) {
  const src = path.join(DIR, f);
  const base = f.replace(/\.jpg$/, "");
  const inBytes = fs.statSync(src).size;
  before += inBytes;

  const sizes = [];
  for (const v of VARIANTS) {
    const out = path.join(DIR, `${base}-${v.width}.webp`);
    await sharp(src)
      .resize({ width: v.width, withoutEnlargement: true })
      .webp({ quality: v.quality, effort: 6 })
      .toFile(out);
    const bytes = fs.statSync(out).size;
    sizes.push(`${v.width}w:${String(Math.round(bytes / 1024)).padStart(3)}KB`);
    // Only the mobile variant counts toward the phone-load comparison.
    if (v.width === 960) after += bytes;
  }

  rows.push(
    `${base.padEnd(14)} ${String(Math.round(inBytes / 1024)).padStart(5)}KB -> ${sizes.join("  ")}`,
  );
}

console.log(rows.join("\n"));
console.log(
  `\nPHONE payload: ${(before / 1024 / 1024).toFixed(1)}MB -> ${(after / 1024 / 1024).toFixed(1)}MB  (-${Math.round((1 - after / before) * 100)}%)`,
);
