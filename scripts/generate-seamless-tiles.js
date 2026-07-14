/**
 * Generate wrap-safe theme tiles with soft depth + low-contrast motifs.
 * Motifs wrap at edges so 2×2 (and infinite) tiling has no diamond seams.
 *
 * Usage: node scripts/generate-seamless-tiles.js
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const DIR = path.join(__dirname, '..', 'assets', 'backgrounds');
const W = 512;
const H = 448;

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createCanvas(w, h, rgb) {
  const png = new PNG({ width: w, height: h });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = rgb[0];
    png.data[i + 1] = rgb[1];
    png.data[i + 2] = rgb[2];
    png.data[i + 3] = 255;
  }
  return png;
}

function setWrap(png, x, y, rgb, a = 1) {
  const w = png.width;
  const h = png.height;
  const xx = ((x % w) + w) % w;
  const yy = ((y % h) + h) % h;
  const i = (w * yy + xx) << 2;
  if (a >= 0.99) {
    png.data[i] = rgb[0];
    png.data[i + 1] = rgb[1];
    png.data[i + 2] = rgb[2];
    png.data[i + 3] = 255;
    return;
  }
  png.data[i] = Math.round(png.data[i] * (1 - a) + rgb[0] * a);
  png.data[i + 1] = Math.round(png.data[i + 1] * (1 - a) + rgb[1] * a);
  png.data[i + 2] = Math.round(png.data[i + 2] * (1 - a) + rgb[2] * a);
  png.data[i + 3] = 255;
}

/** Soft wrap-safe value field (integer harmonics only — must tile). */
function depthField(x, y, w, h, phases) {
  const u = (x / w) * Math.PI * 2;
  const v = (y / h) * Math.PI * 2;
  let n = 0;
  n += Math.sin(u + phases[0]) * Math.cos(v + phases[1]);
  n += 0.55 * Math.sin(2 * u + phases[2]) * Math.cos(v + phases[3]);
  n += 0.35 * Math.sin(u + phases[4]) * Math.sin(2 * v + phases[5]);
  n += 0.22 * Math.sin(2 * u + 2 * v + phases[6]);
  return n;
}

function paintDepth(png, dark, light, phases, strength = 0.22) {
  const w = png.width;
  const h = png.height;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n = depthField(x, y, w, h, phases);
      const t = Math.max(0, Math.min(1, 0.5 + (n / 4.2) * strength * 4));
      const i = (w * y + x) << 2;
      png.data[i] = Math.round(dark[0] + (light[0] - dark[0]) * t);
      png.data[i + 1] = Math.round(dark[1] + (light[1] - dark[1]) * t);
      png.data[i + 2] = Math.round(dark[2] + (light[2] - dark[2]) * t);
      png.data[i + 3] = 255;
    }
  }
}

function stampDot(png, cx, cy, r, rgb, alpha = 1) {
  const rr = Math.ceil(r + 1.5);
  for (let dy = -rr; dy <= rr; dy++) {
    for (let dx = -rr; dx <= rr; dx++) {
      const d = Math.hypot(dx, dy);
      if (d > r + 0.8) continue;
      const edge = d >= r - 0.8 ? 1 - (d - (r - 0.8)) / 1.6 : 1;
      setWrap(png, Math.round(cx + dx), Math.round(cy + dy), rgb, Math.max(0, edge * alpha));
    }
  }
}

function stampWaveDown(png, cx, cy, radius, rgb, thick = 2.2, alpha = 0.55) {
  for (let a = 0.18 * Math.PI; a <= 0.82 * Math.PI; a += 0.018) {
    const x = cx + Math.cos(a) * radius;
    const y = cy + Math.sin(a) * radius;
    stampDot(png, x, y, thick * 0.55, rgb, alpha);
  }
}

function stampWaveUp(png, cx, cy, radius, rgb, thick = 2.2, alpha = 0.5) {
  for (let a = 1.18 * Math.PI; a <= 1.82 * Math.PI; a += 0.018) {
    const x = cx + Math.cos(a) * radius;
    const y = cy + Math.sin(a) * radius;
    stampDot(png, x, y, thick * 0.55, rgb, alpha);
  }
}

function stampChevron(png, cx, cy, size, rgb, thick = 1.8, alpha = 0.5) {
  const steps = Math.max(6, Math.floor(size * 1.4));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    stampDot(png, cx - size * 0.55 * t, cy - size * 0.15 + size * 0.75 * t, thick * 0.5, rgb, alpha);
    stampDot(png, cx + size * 0.55 * t, cy - size * 0.15 + size * 0.75 * t, thick * 0.5, rgb, alpha);
  }
}

function stampOval(png, cx, cy, rx, ry, rgb, alpha = 0.55) {
  const rr = Math.ceil(Math.max(rx, ry) + 1);
  for (let dy = -rr; dy <= rr; dy++) {
    for (let dx = -rr; dx <= rr; dx++) {
      const d = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
      if (d > 1.15) continue;
      const a = d > 0.85 ? 1 - (d - 0.85) / 0.3 : 1;
      setWrap(png, Math.round(cx + dx), Math.round(cy + dy), rgb, Math.max(0, a * alpha));
    }
  }
}

function poisson(rng, w, h, minDist, count) {
  const pts = [];
  let guard = 0;
  while (pts.length < count && guard++ < count * 40) {
    const x = rng() * w;
    const y = rng() * h;
    let ok = true;
    for (const p of pts) {
      let dx = Math.abs(p.x - x);
      let dy = Math.abs(p.y - y);
      if (dx > w / 2) dx = w - dx;
      if (dy > h / 2) dy = h - dy;
      if (Math.hypot(dx, dy) < minDist) {
        ok = false;
        break;
      }
    }
    if (ok) pts.push({ x, y });
  }
  return pts;
}

function generateSea() {
  // Cool water with value depth — motifs stay soft so tiling does not shout.
  const dark = [58, 118, 148];
  const light = [118, 178, 198];
  const hi = [168, 214, 228];
  const lo = [42, 96, 124];
  const png = createCanvas(W, H, light);
  paintDepth(png, dark, light, [0.4, 1.1, 2.2, 0.7, 3.1, 1.6, 0.2], 0.34);
  const rng = mulberry32(0x5ea001);
  for (const p of poisson(rng, W, H, 42, 36)) {
    stampWaveDown(png, p.x, p.y, 9 + rng() * 7, hi, 2.4 + rng(), 0.32 + rng() * 0.18);
  }
  for (const p of poisson(rng, W, H, 38, 28)) {
    stampWaveDown(png, p.x, p.y, 5 + rng() * 4, lo, 1.6 + rng() * 0.6, 0.22 + rng() * 0.12);
  }
  for (const p of poisson(rng, W, H, 34, 55)) {
    stampDot(png, p.x, p.y, 1.1 + rng() * 1.4, lo, 0.28 + rng() * 0.2);
  }
  for (const p of poisson(rng, W, H, 48, 18)) {
    stampDot(png, p.x, p.y, 2.2 + rng() * 2.2, hi, 0.12 + rng() * 0.1);
  }
  return png;
}

function generateGrass() {
  const dark = [86, 118, 62];
  const light = [138, 168, 96];
  const blade = [68, 98, 48];
  const tip = [168, 194, 122];
  const png = createCanvas(W, H, light);
  paintDepth(png, dark, light, [1.2, 0.3, 2.8, 1.5, 0.6, 2.1, 3.0], 0.32);
  const rng = mulberry32(0x9a55);
  for (const p of poisson(rng, W, H, 36, 50)) {
    const col = rng() < 0.4 ? tip : blade;
    stampChevron(png, p.x, p.y, 6 + rng() * 5, col, 1.7 + rng() * 0.5, 0.34 + rng() * 0.16);
  }
  for (const p of poisson(rng, W, H, 32, 48)) {
    stampDot(png, p.x, p.y, 1.0 + rng() * 1.2, blade, 0.25 + rng() * 0.18);
  }
  for (const p of poisson(rng, W, H, 52, 14)) {
    stampDot(png, p.x, p.y, 2.5 + rng() * 2, tip, 0.1 + rng() * 0.08);
  }
  return png;
}

function generateDesert() {
  const dark = [186, 142, 82];
  const light = [232, 204, 152];
  const hi = [246, 228, 186];
  const pebble = [168, 120, 68];
  const png = createCanvas(W, H, light);
  paintDepth(png, dark, light, [0.8, 2.4, 1.1, 3.2, 2.0, 0.5, 1.7], 0.3);
  const rng = mulberry32(0xde5e47);
  for (const p of poisson(rng, W, H, 42, 34)) {
    stampWaveUp(png, p.x, p.y, 9 + rng() * 6, hi, 2.2 + rng() * 0.8, 0.3 + rng() * 0.16);
  }
  for (const p of poisson(rng, W, H, 38, 30)) {
    if (rng() < 0.5) stampOval(png, p.x, p.y, 2.4 + rng() * 1.8, 1.4 + rng(), pebble, 0.35);
    else stampDot(png, p.x, p.y, 1.3 + rng() * 1.3, pebble, 0.3 + rng() * 0.15);
  }
  for (const p of poisson(rng, W, H, 56, 12)) {
    stampDot(png, p.x, p.y, 3 + rng() * 2.5, hi, 0.08 + rng() * 0.08);
  }
  return png;
}

function writePreview(name, png) {
  const out = new PNG({ width: W * 2, height: H * 2 });
  for (let ty = 0; ty < 2; ty++) {
    for (let tx = 0; tx < 2; tx++) {
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const si = (W * y + x) << 2;
          const di = (out.width * (ty * H + y) + (tx * W + x)) << 2;
          out.data[di] = png.data[si];
          out.data[di + 1] = png.data[si + 1];
          out.data[di + 2] = png.data[si + 2];
          out.data[di + 3] = 255;
        }
      }
    }
  }
  fs.writeFileSync(path.join(DIR, `_${name}-2x2-preview.png`), PNG.sync.write(out, { colorType: 6 }));
}

function edgeDelta(png) {
  const d = png.data;
  const get = (x, y) => {
    const i = (W * y + x) << 2;
    return [d[i], d[i + 1], d[i + 2]];
  };
  let lr = 0;
  for (let y = 0; y < H; y++) {
    const a = get(0, y);
    const b = get(W - 1, y);
    lr += Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
  }
  let tb = 0;
  for (let x = 0; x < W; x++) {
    const a = get(x, 0);
    const b = get(x, H - 1);
    tb += Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
  }
  return { lr: lr / H, tb: tb / W };
}

const generators = {
  sea: generateSea,
  grass: generateGrass,
  desert: generateDesert,
};

for (const [name, gen] of Object.entries(generators)) {
  const file = path.join(DIR, `${name}-tile.png`);
  const source = path.join(DIR, `${name}-tile.source.png`);
  if (!fs.existsSync(source) && fs.existsSync(file)) {
    fs.copyFileSync(file, source);
  }
  const png = gen();
  fs.writeFileSync(file, PNG.sync.write(png, { colorType: 6 }));
  writePreview(name, png);
  const { lr, tb } = edgeDelta(png);
  console.log(name, `${W}x${H}`, `LRdelta=${lr.toFixed(2)}`, `TBdelta=${tb.toFixed(2)}`);
}

console.log('seamless tiles written');
