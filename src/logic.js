// Rules come from the r/Maplestory "Go Go Sidekick winning combinations" post
// (data from MapleSEA/TMS runs). Real odds are unknown, so nothing here is probabilistic.
// A combo string is ranks for the Red, Black, Yellow slots, in that order.

export const RANKS = ['S', 'A', 'B', 'C', 'D', 'E'];
export const SLOTS = ['Red', 'Black', 'Yellow'];
export const DEPLOY_COST = 150;
const V = { S: 6, A: 5, B: 4, C: 3, D: 2, E: 1, '': 0 };
export const FC = 'All Clear';
export const W10 = 'Wave 10';

// Keys for the post's "Final Result" level plans (see PLAN). The advice shown is built from your actual hand.
const SA = 'S10+A9';
const SA7 = 'S10+A8';
const SA8 = 'S10+A7';
const MIN5 = 'S10+A10+1';
const MIN4 = 'S10+A10+2';
const MIN3 = 'Red10+Black10+Yellow3';
const DAS3 = 'D3+A10+S10 (Yellow first)';
const SS = 'S10+S5';
const SS4 = 'S10+S10+2';
const SS6 = 'S10+S9';
const SS7 = 'S10+S8';
const SS8 = 'S10+S7';
const SS9 = 'S10+S6';
const SSA11 = 'S10+S3+A1';
const SSS12 = 'S10+S2';
// S10 on Black (keys start with "Black ", used only once S-Black is level 10): second S level by deploy count
const BLK_SSD6 = 'Black SSD at 6';
const BLK_CSS6 = 'Black CSS at 6';
const BLK_SSD7 = 'Black SSD at 7';
const BLK_CSS7 = 'Black CSS at 7';
const BLK_SSC8 = 'Black SSC at 8';
const WV = 'S10+B7';
const WSTAR = 'S10 is enough';
// Marked "Unstable" (highlighted) on the community sheet
const TIGHT = 'extremely tight, collect points and upgrade exactly on time';
const p = (tier, ranks, max, levels, note = '', status = 'confirmed') => ({ tier, ranks, max, levels, note, status });

// Tables are listed smallest deploy cap first, so a hand that fits several tables uses the nearest one for its level plan.
// "any SS" rows (the third unit can be any rank) have the S10 on Red or Yellow; Black-column rows only apply once S-Black is level 10.
export const PATTERNS = [
  // Extreme Min All Clear: 3 deploys (Wave 1)
  p(FC, 'SBB', 3, MIN3, 'extremely RNG-based, not a guaranteed clear', 'unstable'),
  p(FC, 'DAS', 3, DAS3, 'Yellow DAS cleared with only 3 seconds left', 'unstable'),
  // E-Rank+ Min All Clear: 4 deploys (Wave 1), final S10 + A10 + 2. "A 1 second left type of clear."
  p(FC, 'SAE', 4, MIN4, `${TIGHT}, about 1 second to spare`, 'unstable'),
  p(FC, 'ASE', 4, MIN4, `${TIGHT}, about 1 second to spare`, 'unstable'),
  p(FC, 'CSA', 4, MIN4, `${TIGHT}, about 1 second to spare`, 'unstable'),
  p(FC, 'AES', 4, MIN4, `${TIGHT}, about 1 second to spare`, 'unstable'),
  p(FC, 'SSE', 4, SS4), p(FC, 'SES', 4, SS4), p(FC, 'ESS', 4, SS4), // any SS at 4 deploys, final S10 + S10 + 2
  // Min All Clear: 5 deploys (Wave 2), final S10 + A10 + 1
  p(FC, 'SEA', 5, MIN5), p(FC, 'ASD', 5, MIN5),
  p(FC, 'SAE', 5, MIN5, `${TIGHT}; 2 more deploys can find a more stable hand`, 'unstable'),
  p(FC, 'AES', 5, MIN5, `${TIGHT}; 2 more deploys can find a more stable hand`, 'unstable'),
  p(FC, 'BSA', 5, MIN5), p(FC, 'CAS', 5, MIN5),
  // All Clear: 6 deploys (Wave 2), final S10 + A9, and any SS (S10 + S9)
  p(FC, 'SAC', 6, SA), p(FC, 'SCA', 6, SA), p(FC, 'ASB', 6, SA), p(FC, 'ACS', 6, SA), p(FC, 'BAS', 6, SA),
  p(FC, 'BSA', 6, SA, TIGHT, 'unstable'),
  p(FC, 'SSE', 6, SS6), p(FC, 'SES', 6, SS6), p(FC, 'ESS', 6, SS6),
  p(FC, 'SSD', 6, BLK_SSD6, 'S-Black first, cleared with only 10 seconds left', 'unstable'),
  p(FC, 'CSS', 6, BLK_CSS6),
  // All Clear: 7 deploys (Wave 3), final S10 + A8, and any SS (S10 + S8); the SS rows work up to 8 deploys
  p(FC, 'SAB', 7, SA7), p(FC, 'SBA', 7, SA7), p(FC, 'ASA', 7, SA7), p(FC, 'ABS', 7, SA7), p(FC, 'BAS', 7, SA7),
  p(FC, 'SSE', 7, SS7), p(FC, 'SES', 7, SS7), p(FC, 'ESS', 7, SS7),
  p(FC, 'SSD', 7, BLK_SSD7), p(FC, 'CSS', 7, BLK_CSS7),
  // All Clear: 8 deploys (Wave 3), final S10 + A7 / S10 + S7
  p(FC, 'SAA', 8, SA8), p(FC, 'ASA', 8, SA8), p(FC, 'AAS', 8, SA8),
  p(FC, 'SSE', 8, SS8), p(FC, 'SES', 8, SS8), p(FC, 'ESS', 8, SS8),
  p(FC, 'SSC', 8, BLK_SSC8),
  // 9 deploys (Wave 4), final S10 + S6. Only SCS has been found; the Red column lists SS+C
  p(FC, 'SCS', 9, SS9),
  p(FC, 'SSC', 9, SS9, 'listed as Red SS+C on the sheet, but only SCS has been found so far', 'unconfirmed'),
  // All Clear, Double S: up to 10 deploys (Wave 4)
  p(FC, 'SSB', 10, SS), p(FC, 'SBS', 10, SS), p(FC, 'BSS', 10, SS),
  // 11 deploys: only SSA found so far (S10 + S3 + A1). 12 deploys: triple S (S10 + S2)
  p(FC, 'SSA', 11, SSA11),
  p(FC, 'SSS', 12, SSS12),
  // Wave 10: 8 deploys (Wave 3), around 14 with S Red. A star in the post means maxing that S is enough.
  p(W10, 'SDD', 14, WSTAR, 'maxing S Red is enough'),
  p(W10, 'BSB', 8, WV),
  p(W10, 'BDS', 8, WSTAR, 'maxing S Yellow is enough'),
  p(W10, 'DBS', 8, WV),
];

// Deploys you can use before the Wave 10 result is lost: 8 for S Black (and Yellow), around 14 for S Red
const w10Cap = (slots) => Math.max(8, ...PATTERNS.filter((x) => x.tier === W10 && slots[x.ranks.indexOf('S')] === 'S').map((x) => x.max));

// ---- Leveling: costs 100 + 5 per current level (8->9 is 140), max level 10.
// Waves 1 and 2 take 1:30 each; waves 3+ are 1:00 each, while wave count still matches 300 points per wave. ----
export const LEVEL_CAP = 10;
export const POINTS_PER_MIN = 300;
export const POINTS_PER_WAVE = 300;
export const EARLY_WAVES = 2;
export const EARLY_WAVE_SECONDS = 90;
export const LATER_WAVE_SECONDS = 60;
export const upgradeCost = (from, to) => {
  let total = 0;
  for (let l = from; l < Math.min(to, LEVEL_CAP); l++) total += 100 + 5 * l;
  return total;
};
export const FULL_CLEAR_WAVE = 11;
export const FULL_CLEAR_POINTS = FULL_CLEAR_WAVE * POINTS_PER_WAVE;
export const totalSpentPoints = (deploys, levels = []) => {
  const levelCost = (levels || []).reduce((sum, level) => sum + upgradeCost(0, level), 0);
  const total = deploys * DEPLOY_COST + levelCost;
  return Math.min(total, FULL_CLEAR_POINTS);
};
export const estimatedWaveFromPoints = (points) => {
  const clamped = Math.min(Math.max(points, 0), FULL_CLEAR_POINTS);
  return Math.floor(clamped / POINTS_PER_WAVE);
};
const mins = (pts) => {
  if (pts <= 0) return 0;
  const earlyPts = Math.min(pts, POINTS_PER_WAVE * EARLY_WAVES);
  const laterPts = Math.max(0, pts - POINTS_PER_WAVE * EARLY_WAVES);
  const seconds = earlyPts * (EARLY_WAVE_SECONDS / POINTS_PER_WAVE) + laterPts * (LATER_WAVE_SECONDS / POINTS_PER_WAVE);
  return Math.max(1, Math.ceil(seconds / 60));
};
const fmt = (n) => n.toLocaleString('en-US');
// Target levels by rank order (best rank first; ties Red > Yellow > Black), from the post's final results
// Arrays are levels by rank order (best rank first); byColor is levels for the Red, Black, Yellow slots
const blackPlan = (second, level) => ({ byColor: [0, 10, 0].map((v, i) => (i === second ? level : v)), order: [1, second, second === 0 ? 2 : 0] });
const PLAN = new Map([
  [SA, [10, 9]], [SA7, [10, 8]], [SA8, [10, 7]], [MIN5, [10, 10, 1]], [MIN4, [10, 10, 2]], [MIN3, { byColor: [10, 10, 3] }],
  [DAS3, { byColor: [3, 10, 10], order: [2, 1, 0] }],
  [SS, [10, 5]], [SS4, [10, 10, 2]], [SS6, [10, 9]], [SS7, [10, 8]], [SS8, [10, 7]], [SS9, [10, 6]], [SSA11, [10, 3, 1]], [SSS12, [10, 2]],
  [BLK_SSD6, blackPlan(0, 9)], [BLK_CSS6, blackPlan(2, 9)], [BLK_SSD7, blackPlan(0, 8)], [BLK_CSS7, blackPlan(2, 8)], [BLK_SSC8, blackPlan(0, 7)],
  [WV, [10, 7]], [WSTAR, [10]],
]);
const SHORT_PLAN = [10, 10];
const COLOR_PRIORITY = [0, 2, 1];

// The S to level first: Red, then Yellow, then Black.
// blackFive: the sheet's S-Black strategy. A lone S-Black that is not a winning hand gets just level 5, then you keep deploying;
// if another S shows up before deploy 10, max that color to 10 instead and put the rest back into Black.
function levelStep(slots, levels, deploys = 0, blackFive = false) {
  const i = COLOR_PRIORITY.find((c) => slots[c] === 'S');
  if (i === undefined || !levels) return null;
  const lv = levels[i];
  if (blackFive && i === 1 && lv < LEVEL_CAP) {
    const rest = 'If another S shows up before deploy 10, max that color to 10 and put the rest back into Black.';
    if (lv === 5 && deploys < 10) return { i, target: 5, done: true, black5: true, text: `Black S is at level 5. Keep deploying. ${rest}` };
    if (lv < 5 && deploys <= 5) {
      return { i, target: 5, done: false, black5: true, text: `Black S is level ${lv}. It is your first S and not a winning Black hand, so level it to just 5 and keep deploying. ${rest} If you only want Wave 10, level Black to 10 instead.` };
    }
  }
  if (lv >= LEVEL_CAP) return { i, target: LEVEL_CAP, done: true, text: `${SLOTS[i]} S is already level 10, so start rolling.` };
  const pts = upgradeCost(lv, LEVEL_CAP);
  return { i, target: LEVEL_CAP, done: false, text: `${SLOTS[i]} S is level ${lv}. Getting to 10 costs ${fmt(pts)} points, about ${mins(pts)} min of points.` };
}

// Among the combos your hand matches, the one closest to it (fewest spare rank steps)
const bestFit = (list, slots) => {
  const slack = (pt) => pt.ranks.split('').reduce((t, r, i) => t + V[slots[i]] - V[r], 0);
  return [...list].sort((x, y) => slack(x) - slack(y))[0];
};

// Level-up advice built from the units you actually hold, so the colors and ranks it names always match
function planAdvice(slots, levels, plan) {
  if (!plan) return null;
  const byColor = !Array.isArray(plan);
  const order = byColor ? plan.order || [0, 1, 2] : [0, 1, 2].sort((a, b) => V[slots[b]] - V[slots[a]] || COLOR_PRIORITY.indexOf(a) - COLOR_PRIORITY.indexOf(b));
  const steps = order
    .map((slot, k) => ({ slot, rank: slots[slot], target: byColor ? plan.byColor[slot] : plan[k] ?? 0 }))
    .filter((st) => st.rank && st.target > 0);
  if (!steps.length) return null;
  const aim = steps.map((st) => `${st.rank}${st.target}`).join(' + ');
  if (!levels) return `Level ${steps.map((st) => `${SLOTS[st.slot]} ${st.rank} to ${st.target}`).join(', then ')} (aim ${aim}).`;
  const todo = steps.filter((st) => levels[st.slot] < st.target);
  if (!todo.length) return 'Your levels already meet the plan. Nothing left to upgrade.';
  const pts = todo.reduce((t, st) => t + upgradeCost(levels[st.slot], st.target), 0);
  return `Level-ups left: ${todo.map((st) => `${SLOTS[st.slot]} ${st.rank} ${levels[st.slot]} to ${st.target}`).join(', ')} (aim ${aim}). That is ${fmt(pts)} points, about ${mins(pts)} min of points.`;
}

// Black is level 10 and no Red or Yellow S is: the S-Black was leveled first
const blackFirst = (slots, levels) => Boolean(levels) && slots[1] === 'S' && levels[1] >= LEVEL_CAP && ![0, 2].some((i) => slots[i] === 'S' && levels[i] >= LEVEL_CAP);

const earlyDoubleS = (slots, levels) =>
  blackFirst(slots, levels)
    ? 'You got your Double S early, but your first S is Black. With S-Black as the S10 only SSD or CSS work within 7 deploys and SSC at 8; after that the 10-deploy table is the minimum.'
    : 'You got your Double S early. Within 8 deploys with the first S Red or Yellow, S10 + S7 is mostly enough. Within 6 deploys, S10 + S9 works for all three colors.';

// fcOnly: All Clear is the only goal, so Wave 10 results are ignored and the short-on-time shortcut is off.
// levels (optional): level of the Red, Black, Yellow slots, enables the leveling advice.
export function evaluate(deploys, slots, short, fcOnly = false, levels = null) {
  const shortMode = short && !fcOnly;
  const hasS = slots.includes('S');
  const hasA = slots.includes('A');

  const rows = PATTERNS.map((pt) => {
    const gaps = [];
    pt.ranks.split('').forEach((r, i) => { if (V[slots[i]] < V[r]) gaps.push(i); });
    const left = pt.max - deploys;
    // The 6 to 9 deploy double S clears need the S10 on Red or Yellow. Once Black is the only S at level 10 they no longer apply, and the Black rows take over.
    const blackOnly = pt.levels.startsWith('Black ');
    const blocked = blackOnly ? !blackFirst(slots, levels) : [SS6, SS7, SS8, SS9, SSA11].includes(pt.levels) && blackFirst(slots, levels);
    return { ...pt, gaps, left, done: !gaps.length && left >= 0 && !blocked, open: gaps.length > 0 && left >= gaps.length && !blocked };
  });
  const byDistance = (a, b) => a.gaps.length - b.gaps.length || b.left - a.left;
  const fc = rows.filter((r) => r.tier === FC && r.done);
  const w10 = fcOnly ? [] : rows.filter((r) => r.tier === W10 && r.done);
  const openFC = rows.filter((r) => r.tier === FC && r.open).sort(byDistance);
  const openW = fcOnly ? [] : rows.filter((r) => r.tier === W10 && r.open).sort(byDistance);
  const targets = [...openFC, ...openW];
  const planNote = (plan) => planAdvice(slots, levels, plan);
  let shortNote = null;
  const out = (kind, title, lines) => ({ kind, title, lines: [shortNote, ...lines].filter(Boolean), targets });

  if (shortMode && (deploys >= 6 || (hasS && hasA))) {
    // Fast Strategy: stop immediately once you hold S+A; after 6 deploys keep the run only with S+A or S+S
    const sCount = slots.filter((x) => x === 'S').length;
    if (!hasS) {
      return out('restart', 'Restart the minigame', [
        hasA
          ? 'You have an A but no S after 6 deploys. The 30-minute strategy only continues with S+A or S+S.'
          : 'No S or A after 6 deploys, so this run is not worth finishing.',
        'Press the X at the top right of the minigame window to restart.',
      ]);
    }
    if (sCount >= 2) {
      return out('stop', 'Stop deploying and level up', [
        'Max out the S-rank, then level your second S to 5 or more.',
        planNote([10, 5]),
        'Third member B or better: All Clear. Otherwise you still reach Wave 10.',
      ]);
    }
    if (hasA) {
      return out('stop', 'Stop deploying and level up', [
        'Max out the S-rank, then level the A-rank as far as you can.',
        planNote(SHORT_PLAN),
        'Third member B or better: All Clear. Otherwise you still reach Wave 10.',
      ]);
    }
    // One S only: the post still recommends finishing the run with the General Strategy
    shortNote = 'You only have one S after 6 deploys. The post still recommends finishing the run (General Strategy: level the S to 10 first).';
  }

  if (fc.length) {
    const sure = bestFit(fc.filter((r) => !r.note), slots);
    if (sure) {
      return out('stop', 'All Clear locked in. Stop deploying.', [
        planNote(PLAN.get(sure.levels)),
        sure.levels === SS && deploys < 10 && earlyDoubleS(slots, levels),
        [SS6, SS7, SS8, SS9].includes(sure.levels) && 'These double S clears need the S10 on Red or Yellow. With S-Black as the S10 only SSD or CSS work within 7 deploys, SSC at 8, and after that the 10-deploy table is the minimum.',
        'More deploys only cost you level-ups now.',
      ]);
    }
    const best = bestFit(fc, slots);
    return out('stop', 'Probably an All Clear. Stop deploying.', [
      planNote(PLAN.get(best.levels)),
      `${best.status === 'unconfirmed' ? 'Unconfirmed' : 'Unstable'} combination: ${best.note}.`,
    ]);
  }

  if (w10.length) {
    const cap = Math.max(...w10.map((r) => r.max));
    if (deploys < cap && openFC.length) {
      const ls = levelStep(slots, levels);
      const title = ls && !ls.done
        ? `Wave 10 is secured. Level ${SLOTS[ls.i]} to 10, then keep fishing for an All Clear.`
        : 'Wave 10 is secured. Keep fishing for an All Clear.';
      return out('go', title, [
        `You can deploy ${cap > 8 ? 'around' : 'up to'} ${cap} times in total without losing Wave 10 (${cap - deploys} left).`,
        ls ? ls.text : 'Level the S-rank to 10 first, and leave other ranks alone until you finish deploying.',
        ls && 'Leave other ranks alone until you finish deploying.',
      ]);
    }
    const best = bestFit(w10, slots);
    return out('stop', 'Wave 10 is secured. Stop deploying.', [planNote(PLAN.get(best.levels)), best.note && `The post notes: ${best.note}.`]);
  }

  if (!hasS) {
    if (deploys >= 10) {
      return out('restart', 'Restart the minigame', [
        'You are at the end of Wave 4 with no S-rank.',
        'Press the X at the top right of the minigame window to restart.',
      ]);
    }
    if (deploys >= 6 && !hasA) {
      return out('warn', 'Long shot. Restarting is reasonable.', [
        'With no S or A by Wave 2 you need a double S, or SAA / AAS, within the next 3 deploys.',
        'Restart with the X in the minigame window, or keep going if you want to gamble.',
      ]);
    }
    return out('go', 'No S yet. Keep deploying.', [
      `${deploys} of 10 deploys used. Restart if there is still no S by deploy 10 (end of Wave 4).`,
      'Note how many deploys it took to get an S.',
      hasA && 'You already have an A, so an S in the right slot may finish an All Clear.',
    ]);
  }

  if (targets.length) {
    const ls = levelStep(slots, levels, deploys, true);
    const title = !ls ? 'Level your S-rank, then keep deploying'
      : ls.done ? `${SLOTS[ls.i]} is level ${ls.target}. Start rolling.` : `Level ${SLOTS[ls.i]} to ${ls.target} before you roll again`;
    return out('go', title, [
      ls ? ls.text : 'Level the S-rank to 10 first. You need at least a solo S7+ or an S5 + S2 to make it past Wave 7.',
      ls && !ls.done && !ls.black5 && 'Level every S the moment you get it. You need at least a solo S7+ or an S5 + S2 to make it past Wave 7. Then start rolling again.',
      'Do not level A/B ranks between deploys: level-ups are not retroactive if the slot changes rank.',
      !fcOnly && deploys > w10Cap(slots) && `Past ${w10Cap(slots)} deploys the Wave 10 result is gone. Only worth it to chase a Double S.`,
    ]);
  }

  if (fcOnly) {
    return out('restart', 'No All Clear is reachable. Restart the minigame.', [
      'Press the X at the top right of the minigame window to restart.',
      'To gamble instead, the post says to keep deploying for a slim chance at a Triple S (after Wave 4 an All Clear needs one), and to level every S the moment you get it.',
    ]);
  }

  return out('warn', 'No listed combination is reachable. Play the run out.', [
    'The post says its list is not exhaustive, and S-ranks are rare.',
    'Level the S-rank first, then see the run through.',
  ]);
}

// ---- Roll mechanics (mirrors the game: a worse result is not taken) ----
export const ORDER = { '': 0, E: 1, D: 2, C: 3, B: 4, A: 5, S: 6 };
export const emptyRun = () => ({ deploys: 0, slots: ['', '', ''] });
// Every roll costs a deploy; the slot of the rolled color keeps the better unit.
export const rollUnit = (run, i, rank) => ({
  deploys: run.deploys + 1,
  slots: run.slots.map((x, j) => (j === i && ORDER[rank] > ORDER[x] ? rank : x)),
});
export const rollNothing = (run) => ({ deploys: run.deploys + 1, slots: [...run.slots] });
