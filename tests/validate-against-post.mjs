// Checks src/logic.js against the combinations transcribed from the r/Maplestory post.
// Run: npm run validate
import { PATTERNS, evaluate } from '../src/logic.js';

// ---- Transcribed from the post (columns: S Red / S Black / S Yellow) ----
const post = {
  fullClear6: { Red: ['SAB', 'SBA'], Black: ['ASB'], Yellow: ['ABS', 'BAS'] },
  fullClear7: { Red: ['SAB', 'SBA'], Black: ['ASA'], Yellow: ['ABS', 'BAS'] }, // "except Black needs ASA"
  doubleS10: { Red: ['SSB', 'SBS'], Black: ['SSB', 'BSS'], Yellow: ['BSS', 'SBS'] },
  wave10_8: { Red: ['SBB'], Black: ['BSB'], Yellow: ['BBS'] },
  minFull3: { Red: ['SBB'], Black: ['ASC'], Yellow: ['ACS', 'CAS'] }, // CSA unsure, excluded
};
const reported = ['SSE', 'SES', 'ESS']; // "S7 E0 S10 is also a Full Clear" (comment, not a table)
const COL = { Red: 0, Black: 1, Yellow: 2 };

let pass = 0, fail = 0;
const ok = (cond, msg) => { cond ? pass++ : (fail++, console.log('FAIL:', msg)); };

// 1. Positional reading: in each column the S sits in that column's slot
for (const [tbl, cols] of Object.entries(post))
  for (const [col, list] of Object.entries(cols))
    for (const c of list) ok(c[COL[col]] === 'S', `${tbl} ${col} ${c}: S not in ${col} slot`);

// 2. Pattern set equals the post's tables (same combo, tier, deploy cap)
const expected = new Set();
const add = (tier, ranks, max) => expected.add(`${tier}|${ranks}|${max}`);
const all = (t) => Object.values(t).flat();
for (const c of new Set([...all(post.fullClear6), ...all(post.fullClear7)]))
  add('Full Clear', c, all(post.fullClear7).includes(c) ? 7 : 6);
all(post.doubleS10).forEach((c) => add('Full Clear', c, 10));
all(post.minFull3).forEach((c) => add('Full Clear', c, 3));
all(post.wave10_8).forEach((c) => add('Wave 10', c, 8));
const actual = new Set(PATTERNS.filter((x) => !reported.includes(x.ranks)).map((x) => `${x.tier}|${x.ranks}|${x.max}`));
for (const e of expected) ok(actual.has(e), `missing from app: ${e}`);
for (const a of actual) ok(expected.has(a), `in app but not in post tables: ${a}`);
console.log(`tables: ${expected.size} post combos checked against ${actual.size} app patterns`);

// 2b. SBB shows as both Wave 10 (8 deploys) and Min Full Clear (3 deploys), as in the post
ok(PATTERNS.some((x) => x.ranks === 'SBB' && x.tier === 'Wave 10' && x.max === 8), 'SBB W10');
ok(PATTERNS.some((x) => x.ranks === 'SBB' && x.tier === 'Full Clear' && x.max === 3), 'SBB min FC');

// 3. Exhaustive: every deploy count 0-12 x every slot state, vs an oracle built from the tables
const R = '-EDCBAS'; // '-' = empty
const val = (r) => R.indexOf(r === '' ? '-' : r);
const dom = (slots, combo) => combo.split('').every((r, i) => val(slots[i]) >= val(r));
const fcList = [
  ...[...new Set([...all(post.fullClear6), ...all(post.fullClear7)])].map((c) => [c, all(post.fullClear7).includes(c) ? 7 : 6]),
  ...all(post.doubleS10).map((c) => [c, 10]), ...reported.map((c) => [c, 10]),
  ...all(post.minFull3).map((c) => [c, 3]),
];
const wList = all(post.wave10_8).map((c) => [c, 8]);
const label = (r) => (r.kind === 'stop' && /Full Clear/.test(r.title) ? 'FC' : /^Wave 10/.test(r.title) ? 'W10' : 'none');
const opts = ['', 'E', 'D', 'C', 'B', 'A', 'S'];
let cases = 0;
for (let d = 0; d <= 12; d++)
  for (const a of opts) for (const b of opts) for (const c of opts) {
    const slots = [a, b, c];
    const exp = fcList.some(([x, m]) => d <= m && dom(slots, x)) ? 'FC'
      : wList.some(([x, m]) => d <= m && dom(slots, x)) ? 'W10' : 'none';
    const got = label(evaluate(d, slots, false));
    cases++;
    ok(got === exp, `deploys=${d} slots=${slots.join('') || '-'} expected ${exp} got ${got}`);
  }
console.log(`exhaustive: ${cases} states (deploys 0-12 x 343 slot combos)`);

// 4. Scenarios stated in the post's text
const ev = (d, s, short = false) => evaluate(d, s, short);
ok(label(ev(6, ['S', 'A', 'B'])) === 'FC', 'SAB at 6 = Full Clear');
ok(label(ev(7, ['A', 'S', 'B'])) !== 'FC', 'ASB at 7 is NOT a Full Clear (needs ASA)');
ok(label(ev(7, ['A', 'S', 'B'])) === 'W10', 'ASB at 7 still reaches Wave 10');
ok(label(ev(7, ['A', 'S', 'A'])) === 'FC', 'ASA at 7 = Full Clear');
ok(label(ev(3, ['A', 'S', 'C'])) === 'FC' && label(ev(4, ['A', 'S', 'C'])) !== 'FC', 'ASC: Full Clear only by 3 deploys');
ok(label(ev(3, ['C', 'S', 'A'])) === 'none', 'CSA is not claimed (post unsure)');
ok(ev(3, ['S', 'B', 'B']).title.startsWith('Probably'), 'SBB at 3 flagged as not guaranteed');
ok(label(ev(8, ['S', 'B', 'B'])) === 'W10' && label(ev(9, ['S', 'B', 'B'])) === 'none', 'SBB Wave 10 up to 8 deploys');
ok(label(ev(10, ['S', 'S', 'B'])) === 'FC' && label(ev(11, ['S', 'S', 'B'])) === 'none', 'Double S up to 10 deploys');
ok(ev(10, ['', '', '']).kind === 'restart', 'no S by end of Wave 4 (10 deploys) = restart');
ok(ev(6, ['C', 'D', 'B'], true).kind === 'restart', 'short mode: no S/A at 6 = restart');
ok(ev(6, ['', 'S', 'C'], true).kind === 'stop', 'short mode: S at 6 = stop and level');
ok(ev(4, ['B', 'S', 'B']).kind === 'go', 'Wave 10 combo early = keep fishing');
ok(ev(9, ['S', 'B', 'B']).lines.join(' ').includes('Past 8 deploys'), 'past 8 deploys warns Wave 10 is lost');

console.log(`${pass} checks passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
