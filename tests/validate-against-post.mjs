// Checks src/logic.js against the combinations transcribed from the r/Maplestory post (Edit10) and the community sheet.
// Run: npm run validate
import { PATTERNS, evaluate } from '../src/logic.js';

// ---- Transcribed (columns: S Red / S Black / S Yellow). "any SS" rows are written out as the hands they allow. ----
const tables = {
  // [cap, columns, blackOnly?]. blackOnly tables only apply once S-Black is level 10 (the oracle below has no level info)
  extreme3: [3, { Red: ['SBB'], Yellow: ['DAS'] }],
  min4: [4, { Red: ['SAE'], Black: ['ASE', 'CSA'], Yellow: ['AES'] }],
  ss4: [4, { Red: ['SSE', 'SES'], Yellow: ['SES', 'ESS'] }],
  min5: [5, { Red: ['SEA', 'SAE'], Black: ['ASD', 'BSA'], Yellow: ['AES', 'CAS'] }],
  fullClear6: [6, { Red: ['SAC', 'SCA'], Black: ['ASB', 'BSA'], Yellow: ['ACS', 'BAS'] }],
  ss6: [6, { Red: ['SSE', 'SES'], Yellow: ['SES', 'ESS'] }],
  ss6black: [6, { Black: ['SSD', 'CSS'] }, true],
  fullClear7: [7, { Red: ['SAB', 'SBA'], Black: ['ASA'], Yellow: ['ABS', 'BAS'] }],
  ss7: [7, { Red: ['SSE', 'SES'], Yellow: ['SES', 'ESS'] }],
  ss7black: [7, { Black: ['SSD', 'CSS'] }, true],
  sheet8: [8, { Red: ['SAA'], Black: ['ASA'], Yellow: ['AAS'] }],
  ss8: [8, { Red: ['SSE', 'SES'], Yellow: ['SES', 'ESS'] }],
  ss8black: [8, { Black: ['SSC'] }, true],
  ss9: [9, { Red: ['SSC', 'SCS'], Yellow: ['SCS'] }], // Red lists SS+C, only SCS has been found
  doubleS10: [10, { Red: ['SSB', 'SBS'], Black: ['SSB', 'BSS'], Yellow: ['BSS', 'SBS'] }],
  ss11: [11, { Red: ['SSA'] }],
};
const tripleS = ['SSS']; // 12 deploys, spans all columns
const wave10 = { Red: ['SDD'], Black: ['BSB'], Yellow: ['BDS', 'DBS'] };
// "8 for S-Black, around 14 if you have S-Red" (Yellow is not stated, so 8)
const wave10Cap = { Red: 14, Black: 8, Yellow: 8 };
const COL = { Red: 0, Black: 1, Yellow: 2 };

let pass = 0, fail = 0;
const ok = (cond, msg) => { cond ? pass++ : (fail++, console.log('FAIL:', msg)); };

// 1. Positional reading: in each column the S sits in that column's slot
for (const [tbl, [, cols]] of Object.entries(tables))
  for (const [col, list] of Object.entries(cols))
    for (const c of list) ok(c[COL[col]] === 'S', `${tbl} ${col} ${c}: S not in ${col} slot`);
for (const [col, list] of Object.entries(wave10)) for (const c of list) ok(c[COL[col]] === 'S', `wave10 ${col} ${c}`);

// 2. Pattern set equals the tables (same combo, tier, deploy cap)
const expected = new Set();
const add = (tier, ranks, max) => expected.add(`${tier}|${ranks}|${max}`);
for (const [, [cap, cols]] of Object.entries(tables)) Object.values(cols).flat().forEach((c) => add('All Clear', c, cap));
tripleS.forEach((c) => add('All Clear', c, 12));
for (const [col, list] of Object.entries(wave10)) list.forEach((c) => add('Wave 10', c, wave10Cap[col]));
const actual = new Set(PATTERNS.map((x) => `${x.tier}|${x.ranks}|${x.max}`));
for (const e of expected) ok(actual.has(e), `missing from app: ${e}`);
for (const a of actual) ok(expected.has(a), `in app but not in the tables: ${a}`);
console.log(`tables: ${expected.size} combos checked against ${actual.size} app patterns`);

// 3. Exhaustive: every deploy count 0-16 x every slot state, vs an oracle built from the tables (no level info, so no blackOnly rows)
const R = '-EDCBAS'; // '-' = empty
const val = (r) => R.indexOf(r === '' ? '-' : r);
const dom = (slots, combo) => combo.split('').every((r, i) => val(slots[i]) >= val(r));
const fcList = [
  ...Object.values(tables).filter(([, , blackOnly]) => !blackOnly).flatMap(([cap, cols]) => Object.values(cols).flat().map((c) => [c, cap])),
  ...tripleS.map((c) => [c, 12]),
];
const wList = Object.entries(wave10).flatMap(([col, list]) => list.map((c) => [c, wave10Cap[col]]));
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

// 4. Scenarios stated in the post and the sheet
const ev = (d, s, short = false, levels = null) => evaluate(d, s, short, false, levels);
ok(label(ev(3, ['S', 'B', 'B'])) === 'FC' && ev(3, ['S', 'B', 'B']).title.startsWith('Probably') && label(ev(4, ['S', 'B', 'B'])) !== 'FC', 'SBB at 3 is extremely RNG');
ok(label(ev(3, ['D', 'A', 'S'])) === 'FC' && ev(3, ['D', 'A', 'S']).title.startsWith('Probably') && label(ev(4, ['D', 'A', 'S'])) !== 'FC', 'DAS at 3 is unstable');
ok(label(ev(4, ['C', 'S', 'A'])) === 'FC' && label(ev(5, ['C', 'S', 'A'])) !== 'FC', 'CSA works at 4 deploys only');
ok(label(ev(4, ['S', 'A', 'E'])) === 'FC' && label(ev(5, ['A', 'S', 'E'])) !== 'FC', '4-deploy SAE works, ASE only at 4');
ok(label(ev(4, ['E', 'S', 'S'])) === 'FC' && label(ev(4, ['S', 'E', 'S'])) === 'FC', 'any SS works at 4');
ok(label(ev(5, ['S', 'E', 'A'])) === 'FC' && label(ev(5, ['S', 'D', 'A'])) === 'FC' && label(ev(6, ['S', 'E', 'A'])) !== 'FC', 'SEA works at 5 (SDA beats it)');
ok(label(ev(5, ['A', 'E', 'S'])) === 'FC' && ev(5, ['A', 'E', 'S']).title.startsWith('Probably'), 'AES flagged as unstable');
ok(label(ev(5, ['A', 'S', 'C'])) === 'FC' && label(ev(6, ['A', 'S', 'C'])) !== 'FC', 'ASC (beats ASD): only by 5 deploys');
ok(label(ev(5, ['B', 'S', 'A'])) === 'FC' && ev(6, ['B', 'S', 'A']).title.startsWith('Probably'), 'BSA: fine at 5, tight (flagged) at 6');
ok(label(ev(6, ['S', 'C', 'A'])) === 'FC' && label(ev(7, ['S', 'C', 'A'])) !== 'FC', 'SCA works at 6 deploys only');
ok(label(ev(7, ['S', 'A', 'B'])) === 'FC' && label(ev(7, ['S', 'B', 'A'])) === 'FC', 'S+A+B works at 7 (SAB, SBA)');
ok(label(ev(7, ['A', 'S', 'B'])) !== 'FC' && label(ev(7, ['A', 'S', 'A'])) === 'FC', 'ASB at 7 is NOT an All Clear (needs ASA)');
ok(label(ev(6, ['E', 'S', 'S'])) === 'FC' && label(ev(7, ['E', 'S', 'S'])) === 'FC' && label(ev(8, ['E', 'S', 'S'])) === 'FC' && label(ev(9, ['E', 'S', 'S'])) !== 'FC', 'any SS (ESS too) works through 8 deploys');
ok(label(ev(8, ['S', 'A', 'A'])) === 'FC' && label(ev(9, ['S', 'A', 'A'])) !== 'FC', 'SAA works at 8 deploys');
ok(label(ev(9, ['S', 'C', 'S'])) === 'FC' && label(ev(10, ['S', 'C', 'S'])) !== 'FC', 'SCS works at 9');
ok(ev(9, ['S', 'S', 'C']).title.startsWith('Probably'), 'SSC at 9 is only listed as Red SS+C (unconfirmed)');
ok(label(ev(10, ['S', 'S', 'B'])) === 'FC' && label(ev(11, ['S', 'S', 'B'])) !== 'FC', 'SSB works at 10');
ok(label(ev(11, ['S', 'S', 'A'])) === 'FC' && label(ev(12, ['S', 'S', 'A'])) !== 'FC', 'SSA works at 11');
ok(label(ev(12, ['S', 'S', 'S'])) === 'FC' && label(ev(13, ['S', 'S', 'S'])) !== 'FC', 'SSS works at 12');
ok(label(ev(14, ['S', 'D', 'D'])) === 'W10' && label(ev(15, ['S', 'D', 'D'])) === 'none', 'S Red Wave 10 lasts around 14 deploys');
ok(label(ev(8, ['B', 'S', 'B'])) === 'W10' && label(ev(9, ['B', 'S', 'B'])) === 'none', 'S Black Wave 10 lasts 8 deploys');
// S-Black as the S10 (level 10): the Black column takes over
const bl = [0, 10, 0];
ok(!/All Clear/.test(ev(6, ['S', 'S', 'E'], false, bl).title) && label(ev(6, ['S', 'S', 'D'], false, bl)) === 'FC' && label(ev(6, ['C', 'S', 'S'], false, bl)) === 'FC', 'S-Black first at 6: SSD and CSS, not SSE');
ok(label(ev(7, ['S', 'S', 'D'], false, bl)) === 'FC' && label(ev(8, ['S', 'S', 'D'], false, bl)) !== 'FC' && label(ev(8, ['S', 'S', 'C'], false, bl)) === 'FC', 'S-Black first: SSD at 7, SSC at 8');
ok(ev(10, ['', '', '']).kind === 'restart', 'no S by end of Wave 4 (10 deploys) = restart');
ok(ev(6, ['C', 'D', 'B'], true).kind === 'restart' && ev(6, ['', '', 'A'], true).kind === 'restart', 'short mode: no S+A / S+S at 6 = restart');
ok(ev(6, ['S', 'S', 'C'], true).kind === 'stop' && ev(3, ['S', 'D', 'A'], true).kind === 'stop', 'short mode: S+S at 6 / S+A stops');
ok(ev(6, ['', 'S', 'C'], true).kind !== 'stop' && ev(6, ['', 'S', 'C'], true).lines.join(' ').includes('only have one S'), 'short mode: one S = finish the run');
ok(ev(4, ['B', 'S', 'B']).kind === 'go' && ev(9, ['B', 'S', 'B']).lines.join(' ').includes('Past 8 deploys'), 'Wave 10 combo early = keep fishing; past 8 warns (S Black)');

console.log(`${pass} checks passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
