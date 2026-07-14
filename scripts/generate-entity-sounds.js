/**
 * Generate short mono 16-bit PCM WAVs for each Biso entity.
 * Procedural DSP — distinct, animal-suggestive cues (not stock libraries).
 *
 * Run: node scripts/generate-entity-sounds.js
 */
const fs = require('fs');
const path = require('path');

const SR = 22050;
const OUT_DIR = path.join(__dirname, '..', 'assets', 'sounds', 'entities');
const POP_PATH = path.join(__dirname, '..', 'assets', 'sounds', 'pop.wav');

function clamp(n, lo = -1, hi = 1) {
  return Math.max(lo, Math.min(hi, n));
}

function writeWav(filePath, samples) {
  const dataSize = samples.length * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) {
    const s = clamp(samples[i]);
    buf.writeInt16LE((s < 0 ? s * 0x8000 : s * 0x7fff) | 0, 44 + i * 2);
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buf);
}

function alloc(seconds) {
  return new Float64Array(Math.max(1, Math.floor(SR * seconds)));
}

function noise() {
  return Math.random() * 2 - 1;
}

function envADSR(t, a, d, s, r, total) {
  if (t < a) return t / Math.max(1e-6, a);
  if (t < a + d) return 1 - (1 - s) * ((t - a) / Math.max(1e-6, d));
  if (t < total - r) return s;
  const u = (total - t) / Math.max(1e-6, r);
  return Math.max(0, s * u);
}

function softClip(x) {
  return Math.tanh(x * 1.4) / Math.tanh(1.4);
}

/** One-pole low-pass */
function makeLpf() {
  let y = 0;
  return (x, cutoff) => {
    const a = Math.exp((-2 * Math.PI * cutoff) / SR);
    y = (1 - a) * x + a * y;
    return y;
  };
}

/** One-pole high-pass */
function makeHpf() {
  let prevX = 0;
  let prevY = 0;
  return (x, cutoff) => {
    const a = Math.exp((-2 * Math.PI * cutoff) / SR);
    const y = 0.5 * (1 + a) * (x - prevX) + a * prevY;
    prevX = x;
    prevY = y;
    return y;
  };
}

function mixInto(out, start, fn, gain = 1) {
  for (let i = start; i < out.length; i++) {
    const t = (i - start) / SR;
    out[i] += fn(t, i) * gain;
  }
}

function normalize(samples, peak = 0.92) {
  let m = 0;
  for (let i = 0; i < samples.length; i++) m = Math.max(m, Math.abs(samples[i]));
  if (m < 1e-9) return samples;
  const g = peak / m;
  for (let i = 0; i < samples.length; i++) samples[i] *= g;
  return samples;
}

function fadeEdges(samples, ms = 4) {
  const n = Math.floor((ms / 1000) * SR);
  for (let i = 0; i < n && i < samples.length; i++) {
    samples[i] *= i / n;
    samples[samples.length - 1 - i] *= i / n;
  }
  return samples;
}

// --- Entity synthesizers -------------------------------------------------

/** Soft underwater fin flicker — no low thump / drum body */
function synthFish() {
  const out = alloc(0.36);
  const lpf = makeLpf();
  const hpf = makeHpf();
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    // Light water rush, mid-band only (cut lows so it never thuds)
    const flutter = 0.65 + 0.35 * Math.sin(2 * Math.PI * 14 * t);
    const water =
      lpf(noise() * flutter, 1400 + 600 * Math.sin(t * 22)) *
      envADSR(t, 0.015, 0.07, 0.4, 0.18, 0.36);
    // Soft high "fin" shimmer instead of a pitched body tone
    const fin =
      Math.sin(2 * Math.PI * (980 + 220 * Math.sin(t * 16)) * t) *
      envADSR(t, 0.01, 0.05, 0.25, 0.16, 0.36) *
      0.12;
    let fizz = 0;
    for (let b = 0; b < 5; b++) {
      const bt = t - (0.03 + b * 0.045);
      if (bt > 0 && bt < 0.06) {
        const f = 1100 + b * 260;
        fizz += Math.sin(2 * Math.PI * f * bt) * Math.exp(-bt * 70) * 0.14;
      }
    }
    // Strong high-pass removes any drum-like boom
    out[i] = softClip(hpf(water * 0.85 + fin + fizz, 280));
  }
  return fadeEdges(normalize(out, 0.8));
}

/** Slow gelatinous water pulse */
function synthJelly() {
  const out = alloc(0.55);
  const lpf = makeLpf();
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const pulse = envADSR(t, 0.08, 0.14, 0.45, 0.28, 0.55);
    const tone = Math.sin(2 * Math.PI * (55 + 18 * Math.sin(t * 3)) * t) * 0.55;
    const bloom = lpf(noise(), 320) * 0.45;
    const whoosh = Math.sin(2 * Math.PI * 110 * t) * Math.sin(Math.PI * t / 0.55) * 0.2;
    out[i] = softClip((tone + bloom + whoosh) * pulse);
  }
  return fadeEdges(normalize(out, 0.8));
}

/** Sharp click + quick water flake */
function synthShrimp() {
  const out = alloc(0.22);
  const hpf = makeHpf();
  const lpf = makeLpf();
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const click = (t < 0.012 ? noise() * Math.exp(-t * 280) : 0) * 1.4;
    const tick = t > 0.02 && t < 0.05 ? Math.sin(2 * Math.PI * 2400 * t) * Math.exp(-(t - 0.02) * 90) * 0.5 : 0;
    const water = lpf(noise(), 1400) * envADSR(t, 0.005, 0.03, 0.2, 0.12, 0.22) * 0.45;
    out[i] = softClip(hpf(click + tick + water, 120));
  }
  return fadeEdges(normalize(out, 0.88));
}

/** Shell scrapes / claw ticks */
function synthCrab() {
  const out = alloc(0.32);
  const hpf = makeHpf();
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    let v = 0;
    const taps = [0.0, 0.055, 0.12, 0.175];
    for (const tap of taps) {
      const u = t - tap;
      if (u >= 0 && u < 0.04) {
        v += noise() * Math.exp(-u * 70) * 0.7;
        v += Math.sin(2 * Math.PI * (1100 + tap * 900) * u) * Math.exp(-u * 55) * 0.35;
      }
    }
    const grit = hpf(noise(), 1800) * envADSR(t, 0.01, 0.05, 0.15, 0.15, 0.32) * 0.18;
    out[i] = softClip(v + grit);
  }
  return fadeEdges(normalize(out, 0.86));
}

/** Dry scuttle + soft flick */
function synthLizard() {
  const out = alloc(0.34);
  const lpf = makeLpf();
  const hpf = makeHpf();
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const rustle = lpf(noise() * (0.5 + 0.5 * Math.sin(t * 90)), 1600) * envADSR(t, 0.015, 0.08, 0.35, 0.16, 0.34);
    const flick =
      t > 0.08 && t < 0.12
        ? Math.sin(2 * Math.PI * 1900 * (t - 0.08)) * Math.exp(-(t - 0.08) * 70) * 0.35
        : 0;
    out[i] = softClip(hpf(rustle * 0.85 + flick, 100));
  }
  return fadeEdges(normalize(out, 0.82));
}

/** Hard carapace + short wing whir */
function synthBeetle() {
  const out = alloc(0.3);
  const lpf = makeLpf();
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const tick = t < 0.02 ? noise() * Math.exp(-t * 200) * 0.9 : 0;
    const whir =
      Math.sin(2 * Math.PI * 340 * t) * 0.25 +
      Math.sin(2 * Math.PI * 680 * t) * 0.12 +
      lpf(noise(), 900) * 0.2;
    const e = envADSR(t, 0.01, 0.05, 0.4, 0.16, 0.3);
    out[i] = softClip(tick + whir * e);
  }
  return fadeEdges(normalize(out, 0.84));
}

/** Airy soft wing flutter */
function synthButterfly() {
  const out = alloc(0.42);
  const lpf = makeLpf();
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const flap = 0.55 + 0.45 * Math.sin(2 * Math.PI * 9 * t);
    const air = lpf(noise(), 700 + 500 * flap) * flap * envADSR(t, 0.03, 0.1, 0.5, 0.2, 0.42);
    const soft = Math.sin(2 * Math.PI * 220 * t) * 0.08 * envADSR(t, 0.02, 0.08, 0.4, 0.2, 0.42);
    out[i] = softClip(air * 0.9 + soft);
  }
  return fadeEdges(normalize(out, 0.7));
}

/** Dry sand skitter + chitin */
function synthScorpion() {
  const out = alloc(0.36);
  const hpf = makeHpf();
  const lpf = makeLpf();
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const sand = hpf(noise(), 2200) * envADSR(t, 0.01, 0.06, 0.25, 0.18, 0.36) * 0.55;
    const legs = lpf(noise() * Math.sin(t * 70), 1200) * envADSR(t, 0.02, 0.08, 0.3, 0.16, 0.36) * 0.45;
    const click =
      t > 0.1 && t < 0.13 ? Math.sin(2 * Math.PI * 1600 * t) * Math.exp(-(t - 0.1) * 80) * 0.4 : 0;
    out[i] = softClip(sand + legs + click);
  }
  return fadeEdges(normalize(out, 0.8));
}

/** Tiny toddle ticks (ladybug) */
function synthBug() {
  const out = alloc(0.26);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    let v = 0;
    for (const tap of [0.0, 0.07, 0.14]) {
      const u = t - tap;
      if (u >= 0 && u < 0.03) {
        v += Math.sin(2 * Math.PI * (1450 + tap * 400) * u) * Math.exp(-u * 100) * 0.55;
        v += noise() * Math.exp(-u * 120) * 0.15;
      }
    }
    out[i] = softClip(v);
  }
  return fadeEdges(normalize(out, 0.78));
}

/** Soft hop thud + fluff */
function synthBunny() {
  const out = alloc(0.28);
  const lpf = makeLpf();
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const thud = Math.sin(2 * Math.PI * 95 * t) * Math.exp(-t * 28) * 0.7;
    const body = Math.sin(2 * Math.PI * 160 * t) * Math.exp(-t * 18) * 0.25;
    const fluff = lpf(noise(), 900) * envADSR(t, 0.005, 0.04, 0.2, 0.14, 0.28) * 0.35;
    out[i] = softClip(thud + body + fluff);
  }
  return fadeEdges(normalize(out, 0.86));
}

/** Bright chirp with soft wing rustle */
function synthBird() {
  const out = alloc(0.32);
  const lpf = makeLpf();
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const f = 2100 + 900 * Math.sin(t * 22) + 400 * t;
    const chirp =
      Math.sin(2 * Math.PI * f * t) *
      envADSR(t, 0.008, 0.04, 0.55, 0.12, 0.22) *
      (t < 0.22 ? 1 : 0);
    const chirp2 =
      t > 0.12
        ? Math.sin(2 * Math.PI * (2400 + 500 * Math.sin((t - 0.12) * 30)) * (t - 0.12)) *
          envADSR(t - 0.12, 0.006, 0.03, 0.4, 0.1, 0.18) *
          0.7
        : 0;
    const wing = lpf(noise(), 1100) * envADSR(t, 0.02, 0.08, 0.25, 0.14, 0.32) * 0.22;
    out[i] = softClip(chirp * 0.85 + chirp2 + wing);
  }
  return fadeEdges(normalize(out, 0.88));
}

/** Continuous honeybee buzz with slight wobble */
function synthBee() {
  const out = alloc(0.4);
  const lpf = makeLpf();
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const wobble = 1 + 0.04 * Math.sin(2 * Math.PI * 28 * t) + 0.02 * Math.sin(2 * Math.PI * 7 * t);
    const f = 245 * wobble;
    // Soft square via odd harmonics = insectile buzz
    let buzz = 0;
    for (let h = 1; h <= 7; h += 2) {
      buzz += Math.sin(2 * Math.PI * f * h * t) / (h * 1.1);
    }
    const air = lpf(noise(), 2800) * 0.12;
    const e = envADSR(t, 0.02, 0.05, 0.85, 0.1, 0.4);
    out[i] = softClip((buzz * 0.55 + air) * e);
  }
  return fadeEdges(normalize(out, 0.82));
}

/** Quick chatter + scrabble */
function synthSquirrel() {
  const out = alloc(0.34);
  const hpf = makeHpf();
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    let chat = 0;
    const chirps = [0.0, 0.05, 0.1, 0.16, 0.22];
    for (let c = 0; c < chirps.length; c++) {
      const u = t - chirps[c];
      if (u >= 0 && u < 0.035) {
        const f = 2800 + c * 220 + 180 * Math.sin(u * 80);
        chat += Math.sin(2 * Math.PI * f * u) * Math.exp(-u * 70) * 0.45;
      }
    }
    const scrabble = hpf(noise(), 2500) * envADSR(t, 0.01, 0.05, 0.2, 0.14, 0.34) * 0.28;
    out[i] = softClip(chat + scrabble);
  }
  return fadeEdges(normalize(out, 0.85));
}

/** Soft plucky catch cue */
function synthPop() {
  const out = alloc(0.2);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const pluck = Math.sin(2 * Math.PI * (520 * Math.exp(-t * 8)) * t) * Math.exp(-t * 14);
    const spark = Math.sin(2 * Math.PI * 1400 * t) * Math.exp(-t * 40) * 0.35;
    const air = noise() * Math.exp(-t * 50) * 0.12;
    out[i] = softClip(pluck * 0.9 + spark + air);
  }
  return fadeEdges(normalize(out, 0.9));
}

const ENTITIES = {
  fish: synthFish,
  jelly: synthJelly,
  shrimp: synthShrimp,
  crab: synthCrab,
  lizard: synthLizard,
  beetle: synthBeetle,
  butterfly: synthButterfly,
  scorpion: synthScorpion,
  bug: synthBug,
  bunny: synthBunny,
  bird: synthBird,
  bee: synthBee,
  squirrel: synthSquirrel,
};

function main() {
  for (const [id, fn] of Object.entries(ENTITIES)) {
    const file = path.join(OUT_DIR, `${id}.wav`);
    writeWav(file, fn());
    console.log('wrote', path.relative(process.cwd(), file));
  }
  writeWav(POP_PATH, synthPop());
  console.log('wrote', path.relative(process.cwd(), POP_PATH));
}

main();
