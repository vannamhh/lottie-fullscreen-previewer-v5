/**
 * Generates the 1024×1024 source artwork for the `.lottie` document icon.
 *
 * Written as a generator rather than a checked-in binary so the icon can be
 * tweaked and reproduced. Pure Node — no image library, no network.
 *
 *   node scripts/gen-document-icon.mjs out.png
 */
import zlib from 'node:zlib';
import fs from 'node:fs';

const W = 1024, SS = 3; // canvas size, supersample factor

// --- page geometry ---------------------------------------------------------
const PAGE = { x0: 160, y0: 60, x1: 864, y1: 964, radius: 44 };
const FOLD = 190; // size of the turned-down top-right corner

function inRoundRect(x, y, { x0, y0, x1, y1, radius }) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = Math.min(Math.max(x, x0 + radius), x1 - radius);
  const cy = Math.min(Math.max(y, y0 + radius), y1 - radius);
  const dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

/** True above the fold diagonal — this part of the page is cut away. */
function inCutCorner(x, y) {
  const ax = PAGE.x1 - FOLD, ay = PAGE.y0;
  const bx = PAGE.x1, by = PAGE.y0 + FOLD;
  return (x - ax) * (by - ay) - (bx - ax) * (y - ay) > 0;
}

/** The shaded triangle that reads as the underside of the folded corner. */
function inFoldShade(x, y) {
  const ax = PAGE.x1 - FOLD, ay = PAGE.y0;
  const bx = PAGE.x1, by = PAGE.y0 + FOLD;
  const cx = PAGE.x1 - FOLD, cy = PAGE.y0 + FOLD;
  const sign = (px, py, qx, qy, rx, ry) => (px - rx) * (qy - ry) - (qx - rx) * (py - ry);
  const d1 = sign(x, y, ax, ay, bx, by);
  const d2 = sign(x, y, bx, by, cx, cy);
  const d3 = sign(x, y, cx, cy, ax, ay);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}

const inPage = (x, y) => inRoundRect(x, y, PAGE) && !inCutCorner(x, y);

// --- glyph: the app's ring + play mark, echoed on the page -----------------
const GC_X = (PAGE.x0 + PAGE.x1) / 2;
const GC_Y = (PAGE.y0 + PAGE.y1) / 2 + 40;
const RING_R = 176, RING_W = 32;

const inRing = (x, y) => {
  const d = Math.hypot(x - GC_X, y - GC_Y);
  return d >= RING_R - RING_W / 2 && d <= RING_R + RING_W / 2;
};

const TRI = [[GC_X - 42, GC_Y - 76], [GC_X - 42, GC_Y + 76], [GC_X + 90, GC_Y]];
function inTriangle(x, y) {
  const sign = (px, py, qx, qy, rx, ry) => (px - rx) * (qy - ry) - (qx - rx) * (py - ry);
  const d1 = sign(x, y, ...TRI[0], ...TRI[1]);
  const d2 = sign(x, y, ...TRI[1], ...TRI[2]);
  const d3 = sign(x, y, ...TRI[2], ...TRI[0]);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}

// --- colours ---------------------------------------------------------------
const lerp = (a, b, t) => a + (b - a) * t;
const PAPER = [255, 255, 255];
const FOLD_SHADE = [222, 222, 230];
/** Without an outline the white page vanishes against Finder's white background. */
const EDGE = [186, 186, 196];
const EDGE_WIDTH = 5;
const GLYPH_TOP = [79, 70, 229];   // indigo-600
const GLYPH_BOT = [168, 85, 247];  // purple-500

const px = Buffer.alloc(W * W * 4);
const inv = 1 / (SS * SS);

// Pixel-level page mask, used to find the outline. Testing a ring of offsets
// against it is far cheaper than solving the true distance to the page edge,
// and at icon sizes the difference is not visible.
const pageMask = new Uint8Array(W * W);
for (let y = 0; y < W; y++) {
  for (let x = 0; x < W; x++) {
    if (inPage(x + 0.5, y + 0.5)) pageMask[y * W + x] = 1;
  }
}

const RING_OFFSETS = Array.from({ length: 24 }, (_, i) => {
  const angle = (i / 24) * Math.PI * 2;
  return [Math.round(Math.cos(angle) * EDGE_WIDTH), Math.round(Math.sin(angle) * EDGE_WIDTH)];
});

/** A page pixel with any non-page pixel within EDGE_WIDTH is on the outline. */
function isEdge(x, y) {
  for (const [dx, dy] of RING_OFFSETS) {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= W || ny >= W) return true;
    if (!pageMask[ny * W + nx]) return true;
  }
  return false;
}

for (let y = 0; y < W; y++) {
  for (let x = 0; x < W; x++) {
    let page = 0, fold = 0, glyph = 0, gradSum = 0;

    for (let sy = 0; sy < SS; sy++) {
      for (let sx = 0; sx < SS; sx++) {
        const px_ = x + (sx + 0.5) / SS, py_ = y + (sy + 0.5) / SS;
        if (!inPage(px_, py_)) continue;
        page++;
        if (inFoldShade(px_, py_)) fold++;
        if (inRing(px_, py_) || inTriangle(px_, py_)) {
          glyph++;
          gradSum += Math.min(1, Math.max(0, (py_ - (GC_Y - RING_R)) / (RING_R * 2)));
        }
      }
    }

    if (page === 0) continue;

    const a = page * inv;
    const foldRatio = fold / page;
    const glyphRatio = glyph / page;

    // paper, darkened where the corner folds over
    let r = lerp(PAPER[0], FOLD_SHADE[0], foldRatio);
    let g = lerp(PAPER[1], FOLD_SHADE[1], foldRatio);
    let b = lerp(PAPER[2], FOLD_SHADE[2], foldRatio);

    if (glyph > 0) {
      const t = gradSum / glyph;
      r = lerp(r, lerp(GLYPH_TOP[0], GLYPH_BOT[0], t), glyphRatio);
      g = lerp(g, lerp(GLYPH_TOP[1], GLYPH_BOT[1], t), glyphRatio);
      b = lerp(b, lerp(GLYPH_TOP[2], GLYPH_BOT[2], t), glyphRatio);
    }

    if (isEdge(x, y)) {
      [r, g, b] = EDGE;
    }

    const i = (y * W + x) * 4;
    px[i] = Math.round(r);
    px[i + 1] = Math.round(g);
    px[i + 2] = Math.round(b);
    px[i + 3] = Math.round(a * 255);
  }
}

// --- PNG encode (RGBA8) ----------------------------------------------------
const raw = Buffer.alloc((W * 4 + 1) * W);
for (let y = 0; y < W; y++) {
  raw[y * (W * 4 + 1)] = 0; // filter: none
  px.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4);
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(W, 4);
ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

const out = process.argv[2];
if (!out) {
  console.error('usage: node scripts/gen-document-icon.mjs <out.png>');
  process.exit(1);
}
fs.writeFileSync(out, png);
console.log(`wrote ${out} (${png.length} bytes)`);
