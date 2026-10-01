// Rules come from the r/Maplestory "Go Go Sidekick winning combinations" post
// (data from MapleSEA/TMS runs). Real odds are unknown, so nothing here is probabilistic.
// A combo string is ranks for the Red, Black, Yellow slots, in that order.

export const RANKS = ['S', 'A', 'B', 'C', 'D', 'E'];
export const SLOTS = ['Red', 'Black', 'Yellow'];
const V = { S: 6, A: 5, B: 4, C: 3, D: 2, E: 1, '': 0 };
export const FC = 'Full Clear';
export const W10 = 'Wave 10';

const SA = 'Level S to 10, then A as high as you can (aim S10 + A9).';
const SS = 'Level only the S-ranks, priority Red > Yellow > Black (aim S10 + S5).';
const SS7 = 'Level only the S-ranks, priority Red > Yellow > Black (reported: S10 + S7).';
const WV = 'Level S to 10, then Red > Yellow > Black (aim S10 + B7).';
const MIN = 'Level S to 10, then A to 10, then C (reported S10 + A10 + C3).';
const p = (tier, ranks, max, levels, note = '') => ({ tier, ranks, max, levels, note });

export const PATTERNS = [
  // Full Clear: 6 deploys (by Wave 2), 7 deploys works too except Black S needs ASA
  p(FC, 'SAB', 7, SA), p(FC, 'SBA', 7, SA), p(FC, 'ABS', 7, SA), p(FC, 'BAS', 7, SA),
  p(FC, 'ASB', 6, SA), p(FC, 'ASA', 7, SA),
  // Full Clear, Double S: up to 10 deploys (by Wave 4)
  p(FC, 'SSB', 10, SS), p(FC, 'SBS', 10, SS), p(FC, 'BSS', 10, SS),
  // Reported in a comment on the post ("S7 E0 S10 is also a Full Clear"); not in its tables
  p(FC, 'SSE', 10, SS7, 'reported, not in the post tables'),
  p(FC, 'SES', 10, SS7, 'reported, not in the post tables'),
  p(FC, 'ESS', 10, SS7, 'reported, not in the post tables'),
  // Minimum Full Clear: 3 deploys (mid-Wave 1)
  p(FC, 'SBB', 3, SA, 'very RNG, not guaranteed'),
  p(FC, 'ASC', 3, MIN), p(FC, 'ACS', 3, MIN), p(FC, 'CAS', 3, MIN),
  // Wave 10: up to 8 deploys (by Wave 3)
  p(W10, 'SBB', 8, WV), p(W10, 'BSB', 8, WV), p(W10, 'BBS', 8, WV),
];

// ---- Leveling: costs 100 + 5 per current level (8->9 is 140), max level 10; points arrive at 300 per minute ----
export const LEVEL_CAP = 10;
export const POINTS_PER_MIN = 300;
export const upgradeCost = (from, to) => {
  let total = 0;
  for (let l = from; l < Math.min(to, LEVEL_CAP); l++) total += 100 + 5 * l;
  return total;
};
const mins = (pts) => Math.max(1, Math.ceil(pts / POINTS_PER_MIN));
const fmt = (n) => n.toLocaleString('en-US');
// Target levels by rank order (best rank first; ties Red > Yellow > Black), from the post's final results
const PLAN = new Map([[SA, [10, 9]], [SS, [10, 5]], [SS7, [10, 7]], [WV, [10, 7]], [MIN, [10, 10, 3]]]);
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

function planLine(slots, levels, plan) {
  if (!levels || !plan) return null;
  const order = [0, 1, 2].sort((a, b) => V[slots[b]] - V[slots[a]] || COLOR_PRIORITY.indexOf(a) - COLOR_PRIORITY.indexOf(b));
  const parts = [];
  let pts = 0;
  order.forEach((slot, k) => {
    const target = plan[k] ?? 0;
    if (levels[slot] < target) { pts += upgradeCost(levels[slot], target); parts.push(`${SLOTS[slot]} ${levels[slot]} to ${target}`); }
  });
  if (!parts.length) return 'Your levels already meet the plan. Nothing left to upgrade.';
  return `Level-ups left: ${parts.join(', ')}. That is ${fmt(pts)} points, about ${mins(pts)} min of points.`;
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
  const planNote = (plan) => planLine(slots, levels, plan);
  const out = (kind, title, lines) => ({ kind, title, lines: lines.filter(Boolean), targets });

  if (shortMode && deploys >= 6) {
    if (!hasS && !hasA) {
      return out('restart', 'Restart the minigame', [
        'No S or A after 6 deploys, so this run is not worth finishing.',
        'Press the X at the top right of the minigame window to restart.',
      ]);
    }
    if (!hasS) {
      // An A with no S: the post's 30-minute shortcut assumes an S to level, so it cannot finish yet.
      if (targets.length) {
        return out('go', 'You have an A but no S yet', [
          'The 30-minute shortcut needs an S-rank to level, so it cannot finish this run yet.',
          'Keep deploying while a combination is still reachable (below), or restart if you are out of time.',
        ]);
      }
      return out('restart', 'Restart the minigame', [
        'You have an A but no S, and no listed combination is still reachable.',
        'Press the X at the top right of the minigame window to restart.',
      ]);
    }
    if (!hasA) {
      return out('stop', 'Stop deploying and level up', [
        'Max out the S-rank, then your next best unit.',
        planNote(SHORT_PLAN),
        'The post only describes the S + A case, so treat the result as unconfirmed.',
      ]);
    }
    return out('stop', 'Stop deploying and level up', [
      'Max out the S-rank, then level the A-rank as far as you can.',
      planNote(SHORT_PLAN),
      'Third member B or better: Full Clear. Otherwise you still reach Wave 10.',
    ]);
  }

  if (fc.length) {
    const sure = fc.find((r) => !r.note);
    if (sure) {
      return out('stop', 'Full Clear locked in. Stop deploying.', [
        sure.levels,
        planNote(PLAN.get(sure.levels)),
        'More deploys only cost you level-ups now.',
      ]);
    }
    return out('stop', 'Probably a Full Clear. Stop deploying.', [
      fc[0].levels,
      planNote(PLAN.get(fc[0].levels)),
      `The post flags this one: ${fc[0].note}.`,
    ]);
  }

  if (w10.length) {
    if (deploys < 8 && openFC.length) {
      const ls = levelStep(slots, levels);
      const title = ls && !ls.done
        ? `Wave 10 is secured. Level ${SLOTS[ls.i]} to 10, then keep fishing for a Full Clear.`
        : 'Wave 10 is secured. Keep fishing for a Full Clear.';
      return out('go', title, [
        `You can deploy up to 8 times in total without losing Wave 10 (${8 - deploys} left).`,
        ls ? ls.text : 'Level the S-rank to 10 first, and leave other ranks alone until you finish deploying.',
        ls && 'Leave other ranks alone until you finish deploying.',
      ]);
    }
    return out('stop', 'Wave 10 is secured. Stop deploying.', [w10[0].levels, planNote(PLAN.get(w10[0].levels))]);
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
      ls ? ls.text : 'Level the S-rank to 10 first. It locks in a safe Wave 7 even if the run goes badly.',
      ls && !ls.done && 'A level 10 S locks in a safe Wave 7 even if the run goes badly. Then start rolling again.',
      'Do not level A/B ranks between deploys: level-ups are not retroactive if the slot changes rank.',
      !fcOnly && deploys > 8 && 'Past 8 deploys the Wave 10 result is gone. Only worth it to chase a Double S.',
    ]);
  }

  if (fcOnly) {
    return out('restart', 'No Full Clear is reachable. Restart the minigame.', [
      'Press the X at the top right of the minigame window to restart.',
      'To gamble instead, the post says deploying as much as possible keeps a chance at a double or triple S.',
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
