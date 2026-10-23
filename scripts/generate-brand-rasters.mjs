import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

function crc32(buf) {
  let crc = ~0;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crc]);
}

function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = pixel(x, y, size);
      const i = row + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function ico(size, pixel) {
  const dibSize = 40;
  const xorSize = size * size * 4;
  const andRow = Math.ceil(size / 32) * 4;
  const andSize = andRow * size;
  const imageSize = dibSize + xorSize + andSize;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry[0] = size >= 256 ? 0 : size;
  entry[1] = size >= 256 ? 0 : size;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(imageSize, 8);
  entry.writeUInt32LE(22, 12);
  const dib = Buffer.alloc(dibSize);
  dib.writeUInt32LE(40, 0);
  dib.writeInt32LE(size, 4);
  dib.writeInt32LE(size * 2, 8);
  dib.writeUInt16LE(1, 12);
  dib.writeUInt16LE(32, 14);
  dib.writeUInt32LE(xorSize, 20);
  const xor = Buffer.alloc(xorSize);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = pixel(x, size - 1 - y, size);
      const i = (y * size + x) * 4;
      xor[i] = b;
      xor[i + 1] = g;
      xor[i + 2] = r;
      xor[i + 3] = a;
    }
  }
  return Buffer.concat([header, entry, dib, xor, Buffer.alloc(andSize)]);
}

const BALL = [27, 67, 50, 255];
const WHITE = [255, 255, 255, 255];
const CLEAR = [0, 0, 0, 0];

/** Green disc with inward seams, matching the Matches header icon. */
function faviconPixel(x, y, size) {
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  const rad = size * 0.46;
  const dx = x + 0.5 - cx;
  const dy = y + 0.5 - cy;
  if (dx * dx + dy * dy > rad * rad) return CLEAR;

  const t = dy / rad;
  if (Math.abs(t) < 0.62) {
    const endOffset = rad * 0.62;
    const midOffset = rad * 0.4;
    const offset = endOffset + (midOffset - endOffset) * (1 - (t / 0.62) * (t / 0.62));
    const stroke = Math.max(1.6, size * 0.085);
    if (Math.abs(Math.abs(dx) - offset) < stroke * 0.5) return WHITE;
  }

  return BALL;
}

writeFileSync("public/brand/mark-32.png", png(32, faviconPixel));
writeFileSync("public/brand/mark-180.png", png(180, faviconPixel));
writeFileSync("src/app/apple-icon.png", png(180, faviconPixel));
writeFileSync("src/app/favicon.ico", ico(32, faviconPixel));
console.log("wrote favicon rasters");
