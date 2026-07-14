const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const DIR = path.join(__dirname, '..', 'assets', 'backgrounds');
const SCALE = 3; // nearest-neighbor upscale — keeps flat art sharp
// Portrait sheet large enough for phone @3x; cover scales uniformly (no stretch).
const OUT_W = 1290;
const OUT_H = 2796;

function readPng(file) {
  return PNG.sync.read(fs.readFileSync(file));
}

function nearestUpscale(src, scale) {
  const w = src.width * scale;
  const h = src.height * scale;
  const out = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) {
    const sy = Math.floor(y / scale);
    for (let x = 0; x < w; x++) {
      const sx = Math.floor(x / scale);
      const si = (src.width * sy + sx) << 2;
      const di = (w * y + x) << 2;
      out.data[di] = src.data[si];
      out.data[di + 1] = src.data[si + 1];
      out.data[di + 2] = src.data[si + 2];
      out.data[di + 3] = src.data[si + 3];
    }
  }
  return out;
}

function tileInto(src, tw, th) {
  const out = new PNG({ width: tw, height: th });
  const sw = src.width;
  const sh = src.height;
  for (let y = 0; y < th; y++) {
    const sy = y % sh;
    for (let x = 0; x < tw; x++) {
      const sx = x % sw;
      const si = (sw * sy + sx) << 2;
      const di = (tw * y + x) << 2;
      out.data[di] = src.data[si];
      out.data[di + 1] = src.data[si + 1];
      out.data[di + 2] = src.data[si + 2];
      out.data[di + 3] = src.data[si + 3];
    }
  }
  return out;
}

for (const name of ['sea', 'grass', 'desert']) {
  const srcPath = path.join(DIR, `${name}.png`);
  const backup = path.join(DIR, `${name}-tile.png`);
  if (!fs.existsSync(backup)) {
    fs.copyFileSync(srcPath, backup);
  }
  const tileSrc = readPng(backup);
  const hi = nearestUpscale(tileSrc, SCALE);
  const sheet = tileInto(hi, OUT_W, OUT_H);
  fs.writeFileSync(srcPath, PNG.sync.write(sheet, { colorType: 6 }));
  const kb = Math.round(fs.statSync(srcPath).size / 1024);
  console.log(
    `${name}: ${tileSrc.width}x${tileSrc.height} → ${hi.width}x${hi.height} tile → ${OUT_W}x${OUT_H} sheet (${kb}kb)`,
  );
}
