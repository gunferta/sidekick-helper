// Usage: node diff-snapshots.mjs before.json after.json
import fs from 'node:fs';

const a = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const b = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const groups = new Map();
for (const k of Object.keys(b)) {
  if (a[k] === b[k]) continue;
  const [mode, d, hand] = k.split('|');
  const g = `${mode} | ${hand} | ${a[k] ?? '(new)'}  ->  ${b[k]}`;
  if (!groups.has(g)) groups.set(g, []);
  groups.get(g).push(Number(d));
}
const range = (x) => (x.length > 1 ? `${x[0]}-${x[x.length - 1]}` : `${x[0]}`);
let changed = 0;
for (const v of groups.values()) changed += v.length;
console.log(`${changed} states changed in ${groups.size} groups`);
for (const [g, ds] of [...groups].sort((x, y) => y[1].length - x[1].length).slice(0, 40)) console.log(`  deploys ${range(ds)}: ${g}`);
