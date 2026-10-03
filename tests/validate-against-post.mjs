// Checks src/logic.js against the combinations transcribed from the r/Maplestory post (after Edit4).
// Run: npm run validate
import { PATTERNS, evaluate } from '../src/logic.js';

// ---- Transcribed from the post (columns: S Red / S Black / S Yellow) ----
const post = {
  minFull5: { Red: ['SDA', 'SAE'], Black: ['ASC', 'BSA'], Yellow: ['AES', 'BAS'] },
  fullClear6: { Red: ['SAC', 'SCA'], Black: ['ASB', 'BSA'], Yellow: ['ACS', 'BAS'] },
  fullClear7: { Red: ['SAB', 'SBA'], Black: ['ASA'], Yellow: ['ABS', 'BAS'] },
  // Community Google Sheet rows that the post's own tables do not print
  sheet8: { Red: ['SAA', 'SSE', 'SES'], Black: ['ASA'], Yellow: ['AAS', 'SES', 'CSS'] },
  doubleS10: { Red: ['SSB', 'SBS'], Black: ['SSB', 'BSS'], Yellow: ['BSS', 'SBS'] },
  wave10: { Red: ['SDD'], Black: ['BSB'], Yellow: ['BDS', 'DBS'] },
  extremeMin3: { Red: ['SBB'] },
};
const fullClearTables = { minFull5: 5, fullClear6: 6, fullClear7: 7, sheet8: 8, doubleS10: 10, extremeMin3: 3 };
const tripleS = ['SSS']; // 12 deploys, unconfirmed (marked with a ? on the sheet)
// "8 for S-Black, around 14 if you have S-Red" (Yellow is not stated, so 8)
const wave10Cap = { Red: 14, Black: 8, Yellow: 8 };
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
for (const [tbl, cap] of Object.entries(fullClearTables)) all(post[tbl]).forEach((c) => add('All Clear', c, cap));
for (const [col, list] of Object.entries(post.wave10)) list.forEach((c) => add('Wave 10', c, wave10Cap[col]));
tripleS.forEach((c) => add('All Clear', c, 12));
const actual = new Set(PATTERNS.map((x) => `${x.tier}|${x.ranks}|${x.max}`));
for (const e of expected) ok(actual.has(e), `missing from app: ${e}`);
for (const a of actual) ok(expected.has(a), `in app but not in post tables: ${a}`);
console.log(`tables: ${expected.size} post combos checked against ${actual.size} app patterns`);


// 3. Exhaustive: every deploy count 0-16 x every slot state, vs an oracle built from the tables
const R = '-EDCBAS'; // '-' = empty
const val = (r) => R.indexOf(r === '' ? '-' : r);
const dom = (slots, combo) => combo.split('').every((r, i) => val(slots[i]) >= val(r));
const fcList = [...Object.entries(fullClearTables).flatMap(([tbl, cap]) => all(post[tbl]).map((c) => [c, cap])), ...tripleS.map((c) => ['SSS', 12])];
const wList = Object.entries(post.wave10).flatMap(([col, list]) => list.map((c) => [c, wave10Cap[col]]));
const label = (r) => (r.kind === 'stop' && /All Clear/.test(r.title) ? 'FC' : /^Wave 10/.test(r.title) ? 'W10' : 'none');
const opts = ['', 'E', 'D', 'C', 'B', 'A', 'S'];
let cases = 0;
for (let d = 0; d <= 16; d++)
  for (const a of opts) for (const b of opts) for (const c of opts) {
    const slots = [a, b, c];
    const exp = fcList.some(([x, m]) => d <= m && dom(slots, x)) ? 'FC'
      : wList.some(([x, m]) => d <= m && dom(slots, x)) ? 'W10' : 'none';
    const got = label(evaluate(d, slots, false));
    cases++;
    ok(got === exp, `deploys=${d} slots=${slots.join('') || '-'} expected ${exp} got ${got}`);
  }
console.log(`exhaustive: ${cases} states (deploys 0-16 x 343 slot combos)`);

// 4. Scenarios stated in the post's text
const ev = (d, s, short = false) => evaluate(d, s, short);
ok(label(ev(6, ['S', 'A', 'B'])) === 'FC', 'SAB at 6 = All Clear (it beats SAC)');
ok(label(ev(6, ['S', 'C', 'A'])) === 'FC' && label(ev(7, ['S', 'C', 'A'])) !== 'FC', 'SCA works at 6 deploys only');
ok(label(ev(7, ['S', 'A', 'B'])) === 'FC' && label(ev(7, ['S', 'B', 'A'])) === 'FC', 'S+A+B works at 7 (SAB, SBA)');
ok(label(ev(7, ['S', 'A', 'C'])) !== 'FC', 'SAC only works up to 6');
ok(label(ev(7, ['A', 'S', 'B'])) !== 'FC', 'ASB at 7 is NOT an All Clear (needs ASA)');
ok(label(ev(7, ['A', 'S', 'B'])) === 'W10', 'ASB at 7 still reaches Wave 10');
ok(label(ev(7, ['A', 'S', 'A'])) === 'FC', 'ASA at 7 = All Clear');
ok(label(ev(5, ['A', 'S', 'C'])) === 'FC' && label(ev(6, ['A', 'S', 'C'])) !== 'FC', 'ASC: Min All Clear only by 5 deploys');
ok(label(ev(5, ['B', 'S', 'A'])) === 'FC' && ev(6, ['B', 'S', 'A']).title.startsWith('Probably'), 'BSA: fine at 5, tight (flagged) at 6');
ok(label(ev(5, ['S', 'A', 'E'])) === 'FC' && ev(5, ['S', 'A', 'E']).title.startsWith('Probably'), 'SAE flagged as not guaranteed');
ok(label(ev(5, ['C', 'S', 'A'])) === 'none', 'CSA is not claimed');
ok(ev(3, ['S', 'B', 'B']).title.startsWith('Probably') && label(ev(4, ['S', 'B', 'B'])) !== 'FC', 'SBB at 3 flagged as extremely RNG');
ok(label(ev(5, ['A', 'E', 'S'])) === 'FC' && ev(5, ['A', 'E', 'S']).title.startsWith('Probably'), 'AES flagged as unstable');
ok(label(ev(8, ['S', 'A', 'A'])) === 'FC' && label(ev(9, ['S', 'A', 'A'])) !== 'FC', 'SAA works at 8 deploys (sheet)');
ok(label(ev(8, ['A', 'S', 'A'])) === 'FC' && label(ev(8, ['A', 'A', 'S'])) === 'FC', 'ASA and AAS work at 8 deploys (sheet)');
ok(label(ev(8, ['S', 'S', 'E'])) === 'FC' && label(ev(8, ['S', 'E', 'S'])) === 'FC' && label(ev(8, ['C', 'S', 'S'])) === 'FC', 'SSE, SES, CSS work at 8 deploys (sheet)');
ok(ev(12, ['S', 'S', 'S']).title.startsWith('Probably') && label(ev(13, ['S', 'S', 'S'])) !== 'FC', 'SSS at 12 is unconfirmed');
ok(label(ev(14, ['S', 'D', 'D'])) === 'W10' && label(ev(15, ['S', 'D', 'D'])) === 'none', 'S Red Wave 10 lasts around 14 deploys');
ok(label(ev(8, ['B', 'S', 'B'])) === 'W10' && label(ev(9, ['B', 'S', 'B'])) === 'none', 'S Black Wave 10 lasts 8 deploys');
ok(label(ev(10, ['S', 'S', 'B'])) === 'FC' && label(ev(11, ['S', 'S', 'B'])) !== 'FC', 'Double S up to 10 deploys');
ok(ev(10, ['', '', '']).kind === 'restart', 'no S by end of Wave 4 (10 deploys) = restart');
ok(ev(6, ['C', 'D', 'B'], true).kind === 'restart', 'short mode: no S/A at 6 = restart');
ok(ev(6, ['', '', 'A'], true).kind === 'restart', 'short mode: A but no S at 6 = restart');
ok(ev(6, ['S', 'D', 'A'], true).kind === 'stop', 'short mode: S+A at 6 = stop and level');
ok(ev(6, ['S', 'S', 'C'], true).kind === 'stop', 'short mode: S+S at 6 = stop and level');
ok(ev(6, ['', 'S', 'C'], true).kind !== 'stop' && ev(6, ['', 'S', 'C'], true).lines.join(' ').includes('only have one S'), 'short mode: one S = finish the run');
ok(ev(4, ['B', 'S', 'B']).kind === 'go', 'Wave 10 combo early = keep fishing');
ok(ev(9, ['B', 'S', 'B']).lines.join(' ').includes('Past 8 deploys'), 'past 8 deploys warns Wave 10 is lost (S Black)');

console.log(`${pass} checks passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
