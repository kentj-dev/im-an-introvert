/**
 * Generates the extension icons as PNGs with zero image dependencies.
 *
 * The mark is a small hooded figure: a person wrapped in a blanket, which is
 * about as on-brand as "I'm an Introvert" gets. Shapes are described in
 * normalised 0..1 coordinates and rasterised with 3x3 supersampling so the
 * 16px icon still looks smooth.
 *
 * Run: npm run icons
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const OUT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/icons');
const SIZES = [16, 32, 48, 128];

const INK = [47, 58, 52, 255]; // calm dark green-grey background
const PAPER = [244, 246, 242, 255]; // off-white figure
const BLANKET = [122, 198, 158, 255]; // muted green blanket, echoes the popup accent

const clamp01 = (n) => Math.min(1, Math.max(0, n));
const roundedRect = (x, y, r) => {
  const dx = Math.max(Math.abs(x - 0.5) - (0.5 - r), 0);
  const dy = Math.max(Math.abs(y - 0.5) - (0.5 - r), 0);
  return Math.hypot(dx, dy) <= r;
};
const circle = (x, y, cx, cy, r) => Math.hypot(x - cx, y - cy) <= r;
const ellipse = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

/** Returns the colour of the mark at a point, or null for transparent. */
function sample(x, y) {
  if (!roundedRect(x, y, 0.22)) return null;

  // Head sits on top of the blanket, so it is tested first.
  if (circle(x, y, 0.5, 0.42, 0.15)) return PAPER;

  const hood = circle(x, y, 0.5, 0.42, 0.25) && y <= 0.46;
  const shoulders = ellipse(x, y, 0.5, 1.02, 0.34, 0.36) && y >= 0.46;
  if (hood || shoulders) return BLANKET;

  return INK;
}

function renderRGBA(size) {
  const data = Buffer.alloc(size * size * 4);
  const steps = 3;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let hits = 0;
      for (let sy = 0; sy < steps; sy++) {
        for (let sx = 0; sx < steps; sx++) {
          const x = (px + (sx + 0.5) / steps) / size;
          const y = (py + (sy + 0.5) / steps) / size;
          const c = sample(clamp01(x), clamp01(y));
          if (!c) continue;
          r += c[0];
          g += c[1];
          b += c[2];
          a += c[3];
          hits++;
        }
      }
      const total = steps * steps;
      const i = (py * size + px) * 4;
      if (hits === 0) continue;
      data[i] = Math.round(r / hits);
      data[i + 1] = Math.round(g / hits);
      data[i + 2] = Math.round(b / hits);
      data[i + 3] = Math.round(a / total);
    }
  }
  return data;
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, body) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(body.length);
  const typed = Buffer.concat([Buffer.from(type, 'ascii'), body]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed));
  return Buffer.concat([length, typed, crc]);
}

function toPng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // no per-row filter
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const size of SIZES) {
  const file = path.join(OUT_DIR, `icon-${size}.png`);
  writeFileSync(file, toPng(size, renderRGBA(size)));
  console.log(`wrote ${path.relative(process.cwd(), file)}`);
}
