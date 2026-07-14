/**
 * Flatten rounded/transparent corners on theme tiles so they tile without seams.
 * Usage: node scripts/fix-background-tiles.js
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const DIR = path.join(__dirname, '..', 'assets', 'backgrounds');

function sampleBg(data, w, h) {
  // Average opaque pixels near the center — stable fill for round-corner gaps.
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  const x0 = Math.floor(w * 0.35);
  const x1 = Math.floor(w * 0.65);
  const y0 = Math.floor(h * 0.35);
  const y1 = Math.floor(h * 0.65);
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (w * y + x) << 2;
      if (data[i + 3] < 250) continue;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n++;
    }
  }
  if (!n) return [128, 128, 128];
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

function flattenTile(file) {
  const src = PNG.sync.read(fs.readFileSync(file));
  const { width: w, height: h, data } = src;
  const [br, bg, bb] = sampleBg(data, w, h);
  let filled = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] >= 250) continue;
    // Soft-edge AA: blend toward bg then force opaque.
    const a = data[i + 3] / 255;
    data[i] = Math.round(data[i] * a + br * (1 - a));
    data[i + 1] = Math.round(data[i + 1] * a + bg * (1 - a));
    data[i + 2] = Math.round(data[i + 2] * a + bb * (1 - a));
    data[i + 3] = 255;
    filled++;
  }
  fs.writeFileSync(file, PNG.sync.write(src, { colorType: 6 }));
  console.log(
    path.basename(file),
    `${w}x${h}`,
    `bg rgb(${br},${bg},${bb})`,
    `filled ${filled} px`,
  );
}

for (const name of ['sea', 'grass', 'desert']) {
  flattenTile(path.join(DIR, `${name}-tile.png`));
}
