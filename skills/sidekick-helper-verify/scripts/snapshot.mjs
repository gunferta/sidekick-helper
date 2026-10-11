// Save the verdict for every (deploys, hand, mode) so two versions can be diffed. Usage: node snapshot.mjs <repo> <out.json>
import fs from 'node:fs';
import { loadLogic, hands, name } from './_load.mjs';

const { evaluate } = await loadLogic();
const out = process.argv[3] || 'snapshot.json';
const snap = {};
for (const [mode, short, fcOnly] of [['normal', false, false], ['allclear-only', false, true], ['short', true, false]]) {
  for (let d = 0; d <= 16; d++) for (const h of hands()) {
    const r = evaluate(d, h, short, fcOnly, null);
    snap[`${mode}|${d}|${name(h)}`] = `${r.kind}: ${r.title}`;
  }
}
fs.writeFileSync(out, JSON.stringify(snap));
console.log(`saved ${Object.keys(snap).length} states to ${out}`);
