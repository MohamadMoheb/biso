const fs = require('fs');
const path = require('path');

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(tsx?|md|json)$/.test(name)) out.push(p);
  }
  return out;
}

const files = walk('.');
let dirty = [];

for (const file of files) {
  let s = fs.readFileSync(file, 'utf8');
  const orig = s;
  const issues = [];

  if (s.includes('\uFFFD')) {
    issues.push('U+FFFD');
    s = s.replace(/\uFFFD/g, '-');
  }

  // Common Windows mojibake for en/em dash and bullets when UTF-8 was read as Latin-1
  if (/Ã.|â€™|â€œ|â€|â€“|â€”|Â·|Â /.test(s)) {
    issues.push('latin1-mojibake');
    s = s
      .replace(/â€™/g, "'")
      .replace(/â€˜/g, "'")
      .replace(/â€œ/g, '"')
      .replace(/â€/g, '"')
      .replace(/â€“/g, '-')
      .replace(/â€”/g, '-')
      .replace(/Â·/g, ' / ')
      .replace(/Â /g, ' ')
      .replace(/Ã©/g, 'e');
  }

  // Normalize fancy separators that often get corrupted in this repo's tooling
  if (s.includes('\u00B7')) {
    // middle dot
    s = s.replace(/\u00B7/g, '/');
    issues.push('middle-dot');
  }
  if (s.includes('\u2014') || s.includes('\u2013')) {
    s = s.replace(/[\u2014\u2013]/g, '-');
    issues.push('dash');
  }

  if (s !== orig) {
    fs.writeFileSync(file, s, 'utf8');
    dirty.push({ file, issues: [...new Set(issues)] });
  } else if (issues.length) {
    dirty.push({ file, issues, note: 'detected-only' });
  }
}

console.log(JSON.stringify(dirty, null, 2));
console.log('files changed', dirty.filter((d) => !d.note).length);

// Final scan for remaining FFFD / ?? emoji assigns in app+src
for (const file of walk('app').concat(walk('src'))) {
  const s = fs.readFileSync(file, 'utf8');
  if (s.includes('\uFFFD') || /emoji:\s*'\?\?'/.test(s) || />\?\?</.test(s)) {
    console.log('STILL BAD', file);
  }
}
