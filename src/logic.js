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
const WV = 'Level S to 10, then Red > Yellow > Black (aim S10 + B7).';
const MIN = 'Level S to 10, then A to 10, then C (reported S10 + A10 + C3).';
const p = (tier, ranks, max, levels, note = '') => ({ tier, ranks, max, levels, note });

export const PATTERNS = [
  // Full Clear: 6 deploys (by Wave 2), 7 deploys works too except Black S needs ASA
  p(FC, 'SAB', 7, SA), p(FC, 'SBA', 7, SA), p(FC, 'ABS', 7, SA), p(FC, 'BAS', 7, SA),
  p(FC, 'ASB', 6, SA), p(FC, 'ASA', 7, SA),
  // Full Clear, Double S: up to 10 deploys (by Wave 4)
  p(FC, 'SSB', 10, SS), p(FC, 'SBS', 10, SS), p(FC, 'BSS', 10, SS),
  // Minimum Full Clear: 3 deploys (mid-Wave 1)
  p(FC, 'SBB', 3, SA, 'very RNG, not guaranteed'),
  p(FC, 'ASC', 3, MIN), p(FC, 'ACS', 3, MIN), p(FC, 'CAS', 3, MIN),
  // Wave 10: up to 8 deploys (by Wave 3)
  p(W10, 'SBB', 8, WV), p(W10, 'BSB', 8, WV), p(W10, 'BBS', 8, WV),
];

export function evaluate(deploys, slots, short) {
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
  const w10 = rows.filter((r) => r.tier === W10 && r.done);
  const openFC = rows.filter((r) => r.tier === FC && r.open).sort(byDistance);
  const openW = rows.filter((r) => r.tier === W10 && r.open).sort(byDistance);
  const targets = [...openFC, ...openW];
  const out = (kind, title, lines) => ({ kind, title, lines: lines.filter(Boolean), targets });

  if (short && deploys >= 6) {
    if (!hasS && !hasA) {
      return out('restart', 'Restart the minigame', [
        'No S or A after 6 deploys, so this run is not worth finishing.',
        'Press the X at the top right of the minigame window to restart.',
      ]);
    }
    return out('stop', 'Stop deploying and level up', [
      'Max out the S-rank, then level the A-rank as far as you can.',
      'Third member B or better: Full Clear. Otherwise you still reach Wave 10.',
    ]);
  }

  if (fc.length) {
    return out('stop', 'Full Clear locked in. Stop deploying.', [
      fc[0].levels,
      'More deploys only cost you level-ups now.',
    ]);
  }

  if (w10.length) {
    if (deploys < 8 && openFC.length) {
      return out('go', 'Wave 10 is secured. Keep fishing for a Full Clear.', [
        `You can deploy up to 8 times in total without losing Wave 10 (${8 - deploys} left).`,
        'Level the S-rank to 10 first, and leave other ranks alone until you finish deploying.',
      ]);
    }
    return out('stop', 'Wave 10 is secured. Stop deploying.', [w10[0].levels]);
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
    return out('go', 'Level your S-rank, then keep deploying', [
      'Level the S-rank to 10 first. It locks in a safe Wave 7 even if the run goes badly.',
      'Do not level A/B ranks between deploys: level-ups are not retroactive if the slot changes rank.',
      deploys > 8 && 'Past 8 deploys the Wave 10 result is gone. Only worth it to chase a Double S.',
    ]);
  }

  return out('warn', 'No listed combination is reachable. Play the run out.', [
    'The post says its list is not exhaustive, and S-ranks are rare.',
    'Level the S-rank first, then see the run through.',
  ]);
}
