import fs from 'fs';

function normalize(str) {
  // Fold accented chars to ASCII
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Read keep list and build normalized set
const keepRaw = fs.readFileSync('C:/Users/User/Documents/dieta-app/keep-foods.txt', 'utf8');
const keepNames = keepRaw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
const keepNormSet = new Set(keepNames.map(n => normalize(n)));

console.log('Keep list entries:', keepNormSet.size);

// Restore original alimentos.ts from backup
const original = fs.readFileSync('C:/Users/User/Documents/dieta-app-backup-temp/src/lib/alimentos.ts', 'utf8');

// Parse all food entries
const bancoMatch = original.match(/export const bancoAlimentos[^=]*=\s*\[/);
if (!bancoMatch) throw new Error('Array not found');
const searchStart = bancoMatch.index + bancoMatch[0].length - 1;

const entries = [];
let depth = 0, currentStart = -1;
for (let i = searchStart; i < original.length; i++) {
  const ch = original[i];
  if (ch === '{') { if (depth === 0) currentStart = i; depth++; }
  else if (ch === '}') { depth--; if (depth === 0 && currentStart >= 0) { entries.push({start: currentStart, end: i+1, text: original.slice(currentStart, i+1)}); currentStart = -1; } }
  else if (ch === ']' && depth === 0) break;
}

// Match entries
const toKeep = [];
const unmatched = [];

for (const entry of entries) {
  const m = entry.text.match(/nome:"([^"]+)"/);
  if (!m) continue;
  const dbNome = m[1];
  const dbNorm = normalize(dbNome);
  
  if (keepNormSet.has(dbNorm)) {
    toKeep.push(entry);
  } else {
    unmatched.push(dbNome);
  }
}

// Rebuild file
const newArrayBody = toKeep.map((e, i) => {
  const id = String(i + 1).padStart(3, '0');
  return e.text.replace(/id:"a\d+"/, `id:"a${id}"`);
}).join(',\n');

depth = 0;
let closeBracket = -1;
for (let i = searchStart; i < original.length; i++) {
  const ch = original[i];
  if (ch === '[') depth++;
  else if (ch === ']') { depth--; if (depth === 0) { closeBracket = i; break; } }
}

let newContent = original.slice(0, searchStart + 1) + '\n' + newArrayBody + '\n' + original.slice(closeBracket);
newContent = newContent.replace(/,\s*\n\s*\]/, '\n]');

fs.writeFileSync('C:/Users/User/Documents/dieta-app/src/lib/alimentos.ts', newContent, 'utf8');

console.log(`\nTotal DB entries: ${entries.length}`);
console.log(`Kept: ${toKeep.length}`);
console.log(`Unmatched: ${unmatched.length}`);
if (unmatched.length > 0) {
  console.log('\nUnmatched DB entries:');
  for (const u of unmatched) {
    console.log('  "' + u + '" -> norm: "' + normalize(u) + '"');
  }
}
