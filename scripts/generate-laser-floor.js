/**
 * Dark hardwood floor tile for laser mode — wrap-safe plank grain.
 * Usage: node scripts/generate-laser-floor.js
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const DIR = path.join(__dirname, '..', 'assets', 'backgrounds');
const W = 512;
const H = 448;
const PLANK_H = 56;

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function setPx(png, x, y, rgb) {
  const xx = ((x % W) + W) % W;
  const yy = ((y % H) + H) % H;
  const i = (W * yy + xx) << 2;
  png.data[i] = rgb[0];
  png.data[i + 1] = rgb[1];
  png.data[i + 2] = rgb[2];
  png.data[i + 3] = 255;
}

function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function hash01(x, y, salt = 0) {
  let n = Math.imul(x + salt * 374761393, 2246822519) ^ Math.imul(y + 1, 3266489917);
  n = Math.imul(n ^ (n >>> 15), 2246822519);
  return ((n >>> 0) % 10000) / 10000;
}

function main() {
  const png = new PNG({ width: W, height: H });
  const rng = mulberry32(0x1a5e7f);

  // Plank palette — cool charcoal oak so a red laser pops (warm advances).
  const planks = [
    [42, 36, 32],
    [48, 40, 34],
    [38, 33, 30],
    [52, 44, 37],
    [35, 31, 28],
    [45, 38, 33],
    [40, 35, 31],
    [50, 42, 36],
  ];
  const seam = [22, 18, 16];
  const highlight = [72, 62, 52];

  const rows = Math.ceil(H / PLANK_H);
  for (let row = 0; row < rows; row++) {
    const y0 = row * PLANK_H;
    const base = planks[row % planks.length];
    // Stagger plank joints like real flooring (deterministic).
    const offset = Math.floor(((row % 3) * W) / 3.2) + Math.floor(rng() * 40);
    const jointXs = [];
    for (let j = 0; j < 4; j++) {
      jointXs.push((offset + Math.floor((j * W) / 3.7) + Math.floor(rng() * 28)) % W);
    }

    for (let y = 0; y < PLANK_H; y++) {
      const gy = y0 + y;
      if (gy >= H) continue;
      const edge = Math.min(y, PLANK_H - 1 - y);
      const seamT = edge < 2 ? 1 - edge / 2 : 0;
      const across = 0.88 + 0.14 * Math.sin((y / PLANK_H) * Math.PI);

      for (let x = 0; x < W; x++) {
        const grain =
          0.5 +
          0.28 * Math.sin((x + row * 37) * 0.085 + Math.sin(gy * 0.04) * 2) +
          0.12 * Math.sin(x * 0.31 + gy * 0.07 + row) +
          0.08 * (hash01(x, gy, row) - 0.5);

        let col = mix(base, highlight, clamp((grain - 0.35) * 0.45, 0, 0.35));
        col = mix(col, base, 1 - across);

        let nearJoint = false;
        for (const jx of jointXs) {
          const d = Math.min(Math.abs(x - jx), W - Math.abs(x - jx));
          if (d <= 1) {
            nearJoint = true;
            col = mix(col, seam, d === 0 ? 0.85 : 0.45);
            break;
          }
        }

        if (seamT > 0 && !nearJoint) {
          col = mix(col, seam, seamT * 0.7);
        }

        if (hash01(x, gy, 9) < 0.004) {
          col = mix(col, seam, 0.55);
        }

        setPx(png, x, gy, col);
      }
    }
  }

  // Soft wrap-safe value wash so the floor isn't monotonous
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const u = (x / W) * Math.PI * 2;
      const v = (y / H) * Math.PI * 2;
      const n =
        Math.sin(u + 0.4) * Math.cos(v + 1.1) * 0.5 +
        Math.sin(2 * u + 1.7) * Math.cos(v + 0.3) * 0.25;
      const i = (W * y + x) << 2;
      const lift = n * 10;
      png.data[i] = clamp(png.data[i] + lift, 0, 255);
      png.data[i + 1] = clamp(png.data[i + 1] + lift * 0.9, 0, 255);
      png.data[i + 2] = clamp(png.data[i + 2] + lift * 0.8, 0, 255);
    }
  }

  const out = path.join(DIR, 'laser-floor-tile.png');
  fs.writeFileSync(out, PNG.sync.write(png, { colorType: 6 }));
  console.log('wrote', path.relative(process.cwd(), out), `${W}x${H}`);
}

main();
