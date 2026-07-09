import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const ASSET_DIR = path.join(process.cwd(), "dist", "assets");
const MAX_JS_CHUNK_BYTES = 500 * 1024;
const HERO_IMAGE_ASSET = "agent-marketplace-hero.webp";
const MAX_HERO_IMAGE_BYTES = 400 * 1024;

function formatKb(bytes) {
  return `${Math.round((bytes / 1024) * 10) / 10} kB`;
}

const entries = await readdir(ASSET_DIR);
const jsAssets = [];

for (const entry of entries) {
  if (!entry.endsWith(".js")) continue;
  const fullPath = path.join(ASSET_DIR, entry);
  const info = await stat(fullPath);
  jsAssets.push({ name: entry, bytes: info.size });
}

const oversize = jsAssets.filter((asset) => asset.bytes > MAX_JS_CHUNK_BYTES).sort((a, b) => b.bytes - a.bytes);
const largest = [...jsAssets].sort((a, b) => b.bytes - a.bytes).slice(0, 5);

if (oversize.length > 0) {
  console.error(`Build asset budget failed: ${oversize.length} JS chunk(s) exceed ${formatKb(MAX_JS_CHUNK_BYTES)}.`);
  for (const asset of oversize) {
    console.error(`- ${asset.name}: ${formatKb(asset.bytes)}`);
  }
  process.exit(1);
}

let heroImageInfo;

try {
  heroImageInfo = await stat(path.join(ASSET_DIR, HERO_IMAGE_ASSET));
} catch {
  console.error(`Build asset budget failed: missing optimized hero image ${HERO_IMAGE_ASSET}.`);
  process.exit(1);
}

if (heroImageInfo.size > MAX_HERO_IMAGE_BYTES) {
  console.error(
    `Build asset budget failed: ${HERO_IMAGE_ASSET} is ${formatKb(heroImageInfo.size)}, above ${formatKb(
      MAX_HERO_IMAGE_BYTES,
    )}.`,
  );
  process.exit(1);
}

console.log(`Build asset budget PASS: ${jsAssets.length} JS chunks under ${formatKb(MAX_JS_CHUNK_BYTES)}.`);
console.log(`Largest JS chunks: ${largest.map((asset) => `${asset.name} ${formatKb(asset.bytes)}`).join(", ")}`);
console.log(
  `Hero image budget PASS: ${HERO_IMAGE_ASSET} ${formatKb(heroImageInfo.size)} under ${formatKb(
    MAX_HERO_IMAGE_BYTES,
  )}.`,
);
