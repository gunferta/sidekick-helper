// A better hand must never do worse. Usage: node monotonic.mjs <repo>
import { loadLogic, hands, name, VAL, OPTS, grade, LABEL } from './_load.mjs';

const { evaluate } = await loadLogic();
const H = hands();
const lab = new Map();
for (let d = 0; d <= 16; d++) for (const h of H) lab.set(`${d}|${name(h)}`, grade(evaluate(d, h, false, false, null)));
const get = (d, h) => lab.get(`${d}|${name(h)}`);
const range = (a) => (a.length > 1 ? `${a[0]}-${a[a.length - 1]}` : `${a[0]}`);

// 1) slot-wise: at least as good in every slot
let slot = 0;
for (let d = 0; d <= 16; d++) for (const x of H) for (const y of H) {
  if (x.every((r, i) => VAL[y[i]] >= VAL[r]) && get(d, y) < get(d, x)) { slot++; if (slot <= 8) console.log(`SLOT VIOLATION d=${d}: ${name(x)} ${LABEL[get(d, x)]} but better ${name(y)} ${LABEL[get(d, y)]}`); }
}
console.log(`slot-by-slot violations: ${slot} (must be 0)`);

// 2) color-aware: raise a rank, or move a higher rank into a stronger color (Red > Yellow > Black)
const strength = [3, 1, 2]; // slot index 0 Red, 1 Black, 2 Yellow
const idx = new Map(H.map((h, i) => [name(h), i]));
const next = H.map((h) => {
  const out = [];
  for (let i = 0; i < 3; i++) if (VAL[h[i]] < 6) { const g = [...h]; g[i] = OPTS[VAL[h[i]] + 1]; out.push(idx.get(name(g))); }
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (strength[i] > strength[j] && VAL[h[j]] > VAL[h[i]]) { const g = [...h]; [g[i], g[j]] = [g[j], g[i]]; out.push(idx.get(name(g))); }
  return out;
});
const reach = H.map((_, s) => { const seen = new Set([s]); const st = [s]; while (st.length) { for (const m of next[st.pop()]) if (!seen.has(m)) { seen.add(m); st.push(m); } } seen.delete(s); return seen; });
const viol = new Map();
for (let d = 0; d <= 16; d++) H.forEach((x, xi) => { const lx = get(d, x); if (!lx) return; for (const yi of reach[xi]) if (get(d, H[yi]) < lx) { const k = `${name(x)} -> ${name(H[yi])}`; if (!viol.has(k)) viol.set(k, { ds: [], lx, ly: get(d, H[yi]) }); viol.get(k).ds.push(d); } });
console.log(`color-aware inversions: ${viol.size} hand pairs (informational: sparse source data, do not invent rows)`);
for (const [k, v] of [...viol].slice(0, 20)) console.log(`  ${k}: ${LABEL[v.lx]} -> ${LABEL[v.ly]} at deploys ${range(v.ds)}`);
process.exit(slot ? 1 : 0);
