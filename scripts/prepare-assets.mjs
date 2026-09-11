/**
 * Turns the source artwork in images/ into the sizes the extension ships.
 *
 * images/fb.png and images/insta.png are 980x980 (insta.png alone is 500 KB),
 * which is wasteful for a 40px popup row, and Chrome's toolbar wants real
 * 16/32/48/128 icons rather than one big logo it has to squash.
 *
 * Pure Node: a minimal PNG decoder, a premultiplied box filter, and the PNG
 * encoder. No image dependencies. Run: npm run assets
 */
import { deflateSync, inflateSync } from 'node:zlib';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(root, 'images');
const ASSETS = path.join(root, 'src/assets');
const ICONS = path.join(root, 'src/icons');

/* ------------------------------------------------------------------ decode */

/** Reads an 8-bit RGBA, non-interlaced PNG into {width, height, data}. */
function decodePng(buffer) {
  if (buffer.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');

  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const depth = buffer[24];
  const colorType = buffer[25];
  const interlace = buffer[28];
  if (depth !== 8 || colorType !== 6 || interlace !== 0) {
    throw new Error(`unsupported PNG (depth ${depth}, colorType ${colorType})`);
  }

  const parts = [];
  let offset = 8;
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT') parts.push(buffer.subarray(offset + 8, offset + 8 + length));
    if (type === 'IEND') break;
    offset += length + 12;
  }

  const raw = inflateSync(Buffer.concat(parts));
  const stride = width * 4;
  const data = Buffer.alloc(height * stride);

  // Undo the per-row filters (PNG spec, filter types 0-4).
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const out = data.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? data.subarray((y - 1) * stride, y * stride) : null;

    for (let x = 0; x < stride; x++) {
      const rawByte = line[x];
      const left = x >= 4 ? out[x - 4] : 0;
      const up = prev ? prev[x] : 0;
      const upLeft = prev && x >= 4 ? prev[x - 4] : 0;
      let value;
      switch (filter) {
        case 0:
          value = rawByte;
          break;
        case 1:
          value = rawByte + left;
          break;
        case 2:
          value = rawByte + up;
          break;
        case 3:
          value = rawByte + ((left + up) >> 1);
          break;
        case 4: {
          const p = left + up - upLeft;
          const dl = Math.abs(p - left);
          const du = Math.abs(p - up);
          const dul = Math.abs(p - upLeft);
          value = rawByte + (dl <= du && dl <= dul ? left : du <= dul ? up : upLeft);
          break;
        }
        default:
          throw new Error(`unknown PNG filter ${filter}`);
      }
      out[x] = value & 0xff;
    }
  }

  return { width, height, data };
}

/* ---------------------------------------------------------------- resample */

/**
 * Box-filter downscale. Colours are averaged premultiplied by alpha,
 * otherwise transparent pixels drag a dark halo into soft edges.
 */
function resize(image, size) {
  const out = Buffer.alloc(size * size * 4);
  const scaleX = image.width / size;
  const scaleY = image.height / size;

  for (let y = 0; y < size; y++) {
    const y0 = Math.floor(y * scaleY);
    const y1 = Math.max(y0 + 1, Math.floor((y + 1) * scaleY));
    for (let x = 0; x < size; x++) {
      const x0 = Math.floor(x * scaleX);
      const x1 = Math.max(x0 + 1, Math.floor((x + 1) * scaleX));

      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let count = 0;
      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
          const i = (sy * image.width + sx) * 4;
          const alpha = image.data[i + 3] / 255;
          r += image.data[i] * alpha;
          g += image.data[i + 1] * alpha;
          b += image.data[i + 2] * alpha;
          a += image.data[i + 3];
          count++;
        }
      }

      const i = (y * size + x) * 4;
      const alpha = a / count;
      const unpremultiply = alpha > 0 ? 255 / alpha : 0;
      out[i] = Math.min(255, Math.round((r / count) * unpremultiply));
      out[i + 1] = Math.min(255, Math.round((g / count) * unpremultiply));
      out[i + 2] = Math.min(255, Math.round((b / count) * unpremultiply));
      out[i + 3] = Math.round(alpha);
    }
  }

  return { width: size, height: size, data: out };
}

/* ------------------------------------------------------------------ encode */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = -1;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
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

function encodePng(image) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(image.width, 0);
  ihdr.writeUInt32BE(image.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const stride = image.width * 4;
  const raw = Buffer.alloc(image.height * (stride + 1));
  for (let y = 0; y < image.height; y++) {
    raw[y * (stride + 1)] = 0;
    image.data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* -------------------------------------------------------------------- main */

const write = (file, image) => {
  writeFileSync(file, encodePng(image));
  const kb = (readFileSync(file).length / 1024).toFixed(1);
  console.log(`${path.relative(root, file)}  ${image.width}px  ${kb} KB`);
};

mkdirSync(ASSETS, { recursive: true });
mkdirSync(ICONS, { recursive: true });

// Popup artwork at 2x the largest on-screen size (48px rows, 56px platform header).
for (const [source, name] of [
  ['fb.png', 'facebook'],
  ['insta.png', 'instagram'],
  ['logo.png', 'logo'],
]) {
  const image = decodePng(readFileSync(path.join(SOURCE, source)));
  write(path.join(ASSETS, `${name}.png`), resize(image, 128));
}

// Toolbar and extension icons, all from the brand logo.
const logo = decodePng(readFileSync(path.join(SOURCE, 'logo.png')));
for (const size of [16, 32, 48, 128]) {
  write(path.join(ICONS, `icon-${size}.png`), size === 128 ? logo : resize(logo, size));
}
