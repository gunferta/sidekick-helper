// Advice text must only name units the player actually holds. Usage: node audit-text.mjs <repo>
import { loadLogic, hands, name } from './_load.mjs';

const { evaluate, SLOTS } = await loadLogic();
const bad = new Map();
let total = 0, count = 0;
for (const short of [false, true]) for (const lv of [null, [0, 0, 0]]) for (let d = 0; d <= 16; d++) for (const h of hands()) {
  const t = evaluate(d, h, short, false, lv).lines.join(' ');
  total++;
  const held = h.filter(Boolean);
  const issues = [];
  for (const m of t.matchAll(/\b(Red|Black|Yellow) ([SABCDE])\b/g)) {
    if (h[SLOTS.indexOf(m[1])] !== m[2]) issues.push(`says ${m[1]} ${m[2]} but ${m[1]} is ${h[SLOTS.indexOf(m[1])] || 'empty'}`);
  }
  const aim = t.match(/\(aim ([^)]*)\)/);
  if (aim) {
    const pool = [...held];
    for (const m of aim[1].matchAll(/([SABCDE])\d+/g)) { const i = pool.indexOf(m[1]); i < 0 ? issues.push(`aims for ${m[1]} without holding one`) : pool.splice(i, 1); }
  }
  if (/A-rank/.test(t) && !held.includes('A')) issues.push('mentions the A-rank without an A');
  if (/second S/.test(t) && held.filter((x) => x === 'S').length < 2) issues.push('mentions a second S without two S');
  if (issues.length) { count++; const k = issues[0].replace(/ but .*/, ''); if (!bad.has(k)) bad.set(k, `${short ? 'short ' : ''}d=${d} ${name(h)}`); }
}
console.log(`${count} of ${total} states name a unit the hand does not hold`);
for (const [k, ex] of [...bad].slice(0, 20)) console.log(`  - ${k}  e.g. ${ex}`);
process.exit(count ? 1 : 0);
