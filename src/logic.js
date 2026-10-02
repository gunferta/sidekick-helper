// Rules come from the r/Maplestory "Go Go Sidekick winning combinations" post
// (data from MapleSEA/TMS runs). Real odds are unknown, so nothing here is probabilistic.
// A combo string is ranks for the Red, Black, Yellow slots, in that order.

export const RANKS = ['S', 'A', 'B', 'C', 'D', 'E'];
export const SLOTS = ['Red', 'Black', 'Yellow'];
export const DEPLOY_COST = 150;
const V = { S: 6, A: 5, B: 4, C: 3, D: 2, E: 1, '': 0 };
export const FC = 'Full Clear';
export const W10 = 'Wave 10';

// Keys for the post's "Final Result" level plans (see PLAN). The advice shown is built from your actual hand.
const SA = 'S10+A9';
const SA7 = 'S10+A8';
const MIN5 = 'S10+A10+1';
const MIN3 = 'Red10+Black10+Yellow3';
const SS = 'S10+S5';
const WV = 'S10+B7';
const WSTAR = 'S10 is enough';
const p = (tier, ranks, max, levels, note = '') => ({ tier, ranks, max, levels, note });

// Tables are listed smallest deploy cap first, so a hand that fits several tables uses the nearest one for its level plan.
export const PATTERNS = [
  // Min Full Clear: 5 deploys (Wave 2), final S10 + A10 + 1
  p(FC, 'SDA', 5, MIN5), p(FC, 'ASC', 5, MIN5), p(FC, 'ACS', 5, MIN5),
  p(FC, 'SAE', 5, MIN5, 'may not be a guaranteed clear, 2 more deploys could find a more stable hand'),
  p(FC, 'BSA', 5, MIN5), p(FC, 'BAS', 5, MIN5),
  // Full Clear: 6 deploys (Wave 2), final S10 + A9
  p(FC, 'SAC', 6, SA), p(FC, 'SCA', 6, SA), p(FC, 'ASB', 6, SA), p(FC, 'ACS', 6, SA), p(FC, 'BAS', 6, SA),
  p(FC, 'BSA', 6, SA, 'extremely tight, collect points and upgrade exactly on time'),
  // Full Clear: 7 deploys (Wave 3), final S10 + A8
  p(FC, 'SAB', 7, SA7), p(FC, 'SBA', 7, SA7), p(FC, 'ASA', 7, SA7), p(FC, 'ABS', 7, SA7), p(FC, 'BAS', 7, SA7),
  // Full Clear, Double S: up to 10 deploys (Wave 4)
  p(FC, 'SSB', 10, SS), p(FC, 'SBS', 10, SS), p(FC, 'BSS', 10, SS),
  // Extreme Min Full Clear: 3 deploys (Wave 1)
  p(FC, 'SBB', 3, MIN3, 'extremely RNG-based, not a guaranteed clear'),
  // Wave 10: 8 deploys (Wave 3), around 14 with S Red. A star in the post means maxing that S is enough.
  p(W10, 'SDD', 14, WSTAR, 'maxing S Red is enough'),
  p(W10, 'BSB', 8, WV),
  p(W10, 'BDS', 8, WSTAR, 'maxing S Yellow is enough'),
  p(W10, 'DBS', 8, WV),
];

// Deploys you can use before the Wave 10 result is lost: 8 for S Black (and Yellow), around 14 for S Red
const w10Cap = (slots) => Math.max(8, ...PATTERNS.filter((x) => x.tier === W10 && slots[x.ranks.indexOf('S')] === 'S').map((x) => x.max));

// ---- Leveling: costs 100 + 5 per current level (8->9 is 140), max level 10.
// Wave 1 takes 1:30; waves 2+ are 1:00 each, while wave count still matches 300 points per wave. ----
export const LEVEL_CAP = 10;
export const POINTS_PER_MIN = 300;
export const POINTS_PER_WAVE = 300;
export const FIRST_WAVE_SECONDS = 90;
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
  const firstWaveBoost = Math.min(pts, POINTS_PER_WAVE) * (FIRST_WAVE_SECONDS / POINTS_PER_WAVE);
  const laterWaveBoost = Math.max(0, pts - POINTS_PER_WAVE) * (LATER_WAVE_SECONDS / POINTS_PER_WAVE);
  return Math.max(1, Math.ceil((firstWaveBoost + laterWaveBoost) / 60));
};
const fmt = (n) => n.toLocaleString('en-US');
// Target levels by rank order (best rank first; ties Red > Yellow > Black), from the post's final results
// Arrays are levels by rank order (best rank first); byColor is levels for the Red, Black, Yellow slots
const PLAN = new Map([[SA, [10, 9]], [SA7, [10, 8]], [MIN5, [10, 10, 1]], [SS, [10, 5]], [WV, [10, 7]], [WSTAR, [10]], [MIN3, { byColor: [10, 10, 3] }]]);
const SHORT_PLAN = [10, 10];
const COLOR_PRIORITY = [0, 2, 1];

// The S to level first: Red, then Yellow, then Black
function levelStep(slots, levels) {
  const i = COLOR_PRIORITY.find((c) => slots[c] === 'S');
  if (i === undefined || !levels) return null;
  const lv = levels[i];
  if (lv >= LEVEL_CAP) return { i, done: true, text: `${SLOTS[i]} S is already level 10, so start rolling.` };
  const pts = upgradeCost(lv, LEVEL_CAP);
  return { i, done: false, text: `${SLOTS[i]} S is level ${lv}. Getting to 10 costs ${fmt(pts)} points, about ${mins(pts)} min of points.` };
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
  const order = byColor ? [0, 1, 2] : [0, 1, 2].sort((a, b) => V[slots[b]] - V[slots[a]] || COLOR_PRIORITY.indexOf(a) - COLOR_PRIORITY.indexOf(b));
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

// fcOnly: Full Clear is the only goal, so Wave 10 results are ignored and the short-on-time shortcut is off.
// levels (optional): level of the Red, Black, Yellow slots, enables the leveling advice.
export function evaluate(deploys, slots, short, fcOnly = false, levels = null) {
  const shortMode = short && !fcOnly;
  const hasS = slots.includes('S');
  const hasA = slots.includes('A');

  const rows = PATTERNS.map((pt) => {
    const gaps = [];
    pt.ranks.split('').forEach((r, i) => { if (V[slots[i]] < V[r]) gaps.push(i); });
    const left = pt.max - deploys;
    return { ...pt, gaps, left, done: !gaps.length && left >= 0, open: gaps.length > 0 && left >= gaps.length };
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

  if (shortMode && deploys >= 6) {
    // Fast Strategy: after 6 deploys keep the run only with S+A or S+S
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
        'Third member B or better: Full Clear. Otherwise you still reach Wave 10.',
      ]);
    }
    if (hasA) {
      return out('stop', 'Stop deploying and level up', [
        'Max out the S-rank, then level the A-rank as far as you can.',
        planNote(SHORT_PLAN),
        'Third member B or better: Full Clear. Otherwise you still reach Wave 10.',
      ]);
    }
    // One S only: the post still recommends finishing the run with the General Strategy
    shortNote = 'You only have one S after 6 deploys. The post still recommends finishing the run (General Strategy: level the S to 10 first).';
  }

  if (fc.length) {
    const sure = bestFit(fc.filter((r) => !r.note), slots);
    if (sure) {
      return out('stop', 'Full Clear locked in. Stop deploying.', [
        planNote(PLAN.get(sure.levels)),
        sure.levels === SS && deploys < 10 && 'You got your Double S early, so S10 + S7 is enough.',
        'More deploys only cost you level-ups now.',
      ]);
    }
    const best = bestFit(fc, slots);
    return out('stop', 'Probably a Full Clear. Stop deploying.', [
      planNote(PLAN.get(best.levels)),
      `The post flags this one: ${best.note}.`,
    ]);
  }

  if (w10.length) {
    const cap = Math.max(...w10.map((r) => r.max));
    if (deploys < cap && openFC.length) {
      const ls = levelStep(slots, levels);
      const title = ls && !ls.done
        ? `Wave 10 is secured. Level ${SLOTS[ls.i]} to 10, then keep fishing for a Full Clear.`
        : 'Wave 10 is secured. Keep fishing for a Full Clear.';
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
    return out('go', 'Keep deploying', [
      'Deploy until an S-rank shows up, and note how many deploys it took.',
      hasA && 'You already have an A, so an S in the right slot may finish a Full Clear.',
      'Restart if there is still no S after deploy 10.',
    ]);
  }

  if (targets.length) {
    const ls = levelStep(slots, levels);
    const title = !ls ? 'Level your S-rank, then keep deploying'
      : ls.done ? `${SLOTS[ls.i]} is level 10. Start rolling.` : `Level ${SLOTS[ls.i]} to 10 before you roll again`;
    return out('go', title, [
      ls ? ls.text : 'Level the S-rank to 10 first. It gets you safely past Wave 6.',
      ls && !ls.done && 'A level 10 S gets you safely past Wave 6. Then start rolling again.',
      'Do not level A/B ranks between deploys: level-ups are not retroactive if the slot changes rank.',
      !fcOnly && deploys > w10Cap(slots) && `Past ${w10Cap(slots)} deploys the Wave 10 result is gone. Only worth it to chase a Double S.`,
    ]);
  }

  if (fcOnly) {
    return out('restart', 'No Full Clear is reachable. Restart the minigame.', [
      'Press the X at the top right of the minigame window to restart.',
      'To gamble instead, the post says to keep deploying for a slim chance at a Triple S (after Wave 4 a Full Clear needs one), and to level every S the moment you get it.',
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
