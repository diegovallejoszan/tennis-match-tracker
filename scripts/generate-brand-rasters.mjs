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

function markPixel(x, y, size) {
  const forest = [45, 106, 79, 255];
  const ball = [27, 67, 50, 255];
  const seam = [244, 247, 242, 255];
  const arc = [212, 225, 87, 255];
  const cx = (size - 1) / 2;
  const cy = cx + size * 0.03;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.hypot(dx, dy);
  const radius = size * 0.28;
  if (dist < radius) {
    const seamBand = Math.abs(Math.abs(dx) - radius * 0.38);
    if (seamBand < Math.max(1, size * 0.025) && Math.abs(dy) < radius * 0.82) {
      return seam;
    }
    return ball;
  }
  const ax = x - size * 0.72;
  const ay = y - size * 0.2;
  const ad = Math.hypot(ax, ay);
  if (ad > size * 0.1 && ad < size * 0.16 && y < size * 0.28 && x > size * 0.62) {
    return arc;
  }
  return forest;
}

writeFileSync("public/brand/mark-32.png", png(32, markPixel));
writeFileSync("public/brand/mark-180.png", png(180, markPixel));
writeFileSync("src/app/favicon.ico", ico(32, markPixel));
console.log("wrote mark pngs and favicon.ico");
