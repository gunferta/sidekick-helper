// Unit tests for the scenarios listed in the r/Maplestory "Go Go Sidekick winning combinations" post.
// Run: npm test   (uses Node's built-in test runner, nothing to install)
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SLOTS, evaluate, emptyRun, rollUnit, rollNothing, upgradeCost, totalSpentPoints, estimatedWaveFromPoints } from '../src/logic.js';

// Build a run that holds `combo` (Red, Black, Yellow; '-' = empty) after `deploys` deploys.
function reach(combo, deploys) {
  let run = emptyRun();
  combo.split('').forEach((r, i) => { if (r !== '-') run = rollUnit(run, i, r); });
  assert.ok(deploys >= run.deploys, `${combo} needs at least ${run.deploys} deploys`);
  while (run.deploys < deploys) run = rollNothing(run);
  return run;
}
const verdict = (combo, deploys, short = false, fcOnly = false) => {
  const run = reach(combo, deploys);
  return evaluate(run.deploys, run.slots, short, fcOnly);
};
const text = (v) => [v.title, ...v.lines].join(' ');
const fullClear = (v) => v.kind === 'stop' && v.title.startsWith('All Clear locked in');
const wave10Secured = (v) => v.title.startsWith('Wave 10 is secured');

describe('All Clear: 6 deploys, by Wave 2', () => {
  // The advice names the real color and rank of each unit you hold
  const fc6 = {
    SAC: 'Level Red S to 10, then Black A to 9 (aim S10 + A9).',
    SCA: 'Level Red S to 10, then Yellow A to 9 (aim S10 + A9).',
    ASB: 'Level Black S to 10, then Red A to 9 (aim S10 + A9).',
    ACS: 'Level Yellow S to 10, then Red A to 9 (aim S10 + A9).',
    BAS: 'Level Yellow S to 10, then Black A to 9 (aim S10 + A9).',
  };
  for (const [combo, advice] of Object.entries(fc6)) {
    it(`${combo} at 6 deploys is an All Clear: stop, ${advice}`, () => {
      const v = verdict(combo, 6);
      assert.ok(fullClear(v), text(v));
      assert.ok(text(v).includes(advice), text(v));
    });
    it(`${combo} earlier than 6 deploys: stop deploying immediately`, () => {
      assert.ok(fullClear(verdict(combo, 4)));
    });
  }
  it('SAB at 6 deploys uses its own 7-deploy plan (S10 + A8)', () => {
    const v = verdict('SAB', 6);
    assert.ok(fullClear(v));
    assert.ok(text(v).includes('Level Red S to 10, then Black A to 8 (aim S10 + A8).'), text(v));
  });
  it('is no longer an All Clear well past 7 deploys', () => {
    assert.ok(!fullClear(verdict('SAB', 9)));
  });
  it('SBA also works at 6 deploys (it beats SCA)', () => assert.ok(fullClear(verdict('SBA', 6))));
  it('BSA at 6 deploys is flagged: extremely tight, collect points and upgrade on time', () => {
    const v = verdict('BSA', 6);
    assert.equal(v.kind, 'stop');
    assert.match(v.title, /^Probably an All Clear/);
    assert.match(text(v), /extremely tight/);
  });
});

describe('All Clear: 7 deploys, by mid-Wave 3', () => {
  for (const combo of ['SAB', 'SBA', 'ABS', 'BAS']) {
    it(`${combo} still works at 7 deploys`, () => assert.ok(fullClear(verdict(combo, 7))));
  }
  it('SCA is not an S+A+B hand, so it only works up to 6 deploys', () => {
    assert.ok(fullClear(verdict('SCA', 6)));
    const v = verdict('SCA', 7);
    assert.ok(!fullClear(v));
    assert.ok(wave10Secured(v), text(v));
  });
  for (const combo of ['SAB', 'SBA', 'ABS', 'BAS']) {
    it(`${combo} at 7 deploys: S10 + A8`, () => assert.match(text(verdict(combo, 7)), /S10 \+ A8/));
  }
  it('SAC (A with a C) only works up to 6 deploys', () => {
    assert.ok(fullClear(verdict('SAC', 6)));
    assert.ok(!fullClear(verdict('SAC', 7)));
  });
  it('Black S needs ASA at 7 deploys, leveling Red before Yellow', () => {
    const v = verdict('ASA', 7);
    assert.ok(fullClear(v));
    assert.ok(text(v).includes('Level Black S to 10, then Red A to 8 (aim S10 + A8).'), text(v));
  });
  it('ASB is NOT an All Clear at 7 deploys (but still reaches Wave 10)', () => {
    const v = verdict('ASB', 7);
    assert.ok(!fullClear(v));
    assert.ok(wave10Secured(v), text(v));
  });
});

describe('All Clear Double S: 10 deploys, by Wave 4', () => {
  const doubleS = {
    SSB: 'Level Red S to 10, then Black S to 5 (aim S10 + S5).',
    SBS: 'Level Red S to 10, then Yellow S to 5 (aim S10 + S5).',
    BSS: 'Level Yellow S to 10, then Black S to 5 (aim S10 + S5).',
  };
  for (const [combo, advice] of Object.entries(doubleS)) {
    it(`${combo} at 10 deploys is an All Clear, leveling Red > Yellow > Black`, () => {
      const v = verdict(combo, 10);
      assert.ok(fullClear(v), text(v));
      assert.ok(text(v).includes(advice), text(v));
    });
    it(`${combo} earlier than 10 deploys: stop deploying, S10 + S7 is mostly enough`, () => {
      const v = verdict(combo, 5);
      assert.ok(fullClear(v));
      assert.match(text(v), /S10 \+ S7 is mostly enough/);
    });
    it(`${combo} is not an All Clear after 10 deploys`, () => {
      assert.ok(!fullClear(verdict(combo, 11)));
    });
  }
  it('a weak third unit is only an All Clear in the 8-deploy sheet rows, not at 10', () => {
    assert.notEqual(verdict('SSE', 10).kind, 'stop');
  });
});

describe('Wave 10: 8 deploys, by Wave 3 (around 14 with S Red)', () => {
  const wave10 = {
    BSB: 'Level Black S to 10, then Red B to 7 (aim S10 + B7).',
    DBS: 'Level Yellow S to 10, then Black B to 7 (aim S10 + B7).',
    BDS: 'Level Yellow S to 10 (aim S10).', // starred: maxing S Yellow is enough
  };
  for (const [combo, advice] of Object.entries(wave10)) {
    it(`${combo} at 8 deploys: Wave 10 secured, stop. ${advice}`, () => {
      const v = verdict(combo, 8);
      assert.ok(wave10Secured(v) && v.kind === 'stop', text(v));
      assert.ok(text(v).includes(advice), text(v));
    });
    it(`${combo} earlier: keep fishing for an All Clear, up to 8 deploys total`, () => {
      const v = verdict(combo, 5);
      assert.ok(wave10Secured(v) && v.kind === 'go', text(v));
      assert.match(text(v), /up to 8 times in total/);
    });
    it(`${combo} at 9 deploys is no longer Wave 10`, () => {
      assert.ok(!wave10Secured(verdict(combo, 9)));
    });
  }
  it('SDD (S Red + two D) reaches Wave 10: maxing S Red is enough', () => {
    assert.ok(wave10Secured(verdict('SDD', 8)), text(verdict('SDD', 8)));
  });
  it('a better S Red hand than SDD still counts (SBB)', () => {
    assert.ok(wave10Secured(verdict('SBB', 6)));
  });
  it('S Red keeps the Wave 10 run for around 14 deploys', () => {
    for (const combo of ['SDD', 'SBB']) {
      assert.ok(wave10Secured(verdict(combo, 14)), `${combo} at 14`);
      assert.ok(!wave10Secured(verdict(combo, 15)), `${combo} at 15`);
    }
    assert.match(text(verdict('SDD', 5)), /around 14 times in total/);
  });
  it('S Red has no "Past 8 deploys" warning at 9 deploys', () => {
    assert.doesNotMatch(text(verdict('SBB', 9)), /Past 8 deploys/);
  });
  it('S Red Wave 10 says stop once no All Clear is reachable any more', () => {
    const v = verdict('SBB', 12);
    assert.ok(wave10Secured(v) && v.kind === 'stop', text(v));
  });
  it('S Red with an empty slot is not Wave 10 yet', () => {
    assert.ok(!wave10Secured(verdict('S-D', 5)));
  });
});

describe('Min All Clear: 5 deploys, by Wave 2', () => {
  const min5 = {
    SDA: 'Level Red S to 10, then Yellow A to 10, then Black D to 1 (aim S10 + A10 + D1).',
    ASC: 'Level Black S to 10, then Red A to 10, then Yellow C to 1 (aim S10 + A10 + C1).',
    BSA: 'Level Black S to 10, then Yellow A to 10, then Red B to 1 (aim S10 + A10 + B1).',
    BAS: 'Level Yellow S to 10, then Black A to 10, then Red B to 1 (aim S10 + A10 + B1).',
  };
  for (const [combo, advice] of Object.entries(min5)) {
    it(`${combo} at 5 deploys is an All Clear: ${advice}`, () => {
      const v = verdict(combo, 5);
      assert.ok(fullClear(v), text(v));
      assert.ok(text(v).includes(advice), text(v));
    });
  }
  it('SAE and AES are unstable: extremely tight, collect points and upgrade on time', () => {
    const a = verdict('AES', 5);
    assert.match(a.title, /^Probably an All Clear/);
    assert.match(text(a), /extremely tight/);
    assert.ok(text(a).includes('Level Yellow S to 10, then Red A to 10, then Black E to 1 (aim S10 + A10 + E1).'), text(a));
    const v = verdict('SAE', 5);
    assert.equal(v.kind, 'stop');
    assert.match(v.title, /^Probably an All Clear/);
    assert.match(text(v), /extremely tight/);
  });
  it('ACS at 5 deploys is an All Clear through the 6-deploy table (the post lists it only there)', () => {
    const v = verdict('ACS', 5);
    assert.ok(fullClear(v), text(v));
    assert.ok(text(v).includes('Level Yellow S to 10, then Red A to 9 (aim S10 + A9).'), text(v));
  });
  it('SDA is no longer an All Clear at 6 deploys', () => assert.ok(!fullClear(verdict('SDA', 6))));
  it('CAS (dropped from the tables) is not claimed', () => assert.ok(!fullClear(verdict('CAS', 5))));
  it('CSA is not claimed', () => assert.notEqual(verdict('CSA', 5).kind, 'stop'));
});

describe('Extreme Min All Clear: 3 deploys, by Wave 1', () => {
  it('SBB at 3 deploys is flagged as extremely RNG; level Red, then Black, then Yellow', () => {
    const v = verdict('SBB', 3);
    assert.equal(v.kind, 'stop');
    assert.match(v.title, /^Probably an All Clear/);
    assert.match(text(v), /not a guaranteed clear/);
    assert.match(text(v), /S10 \+ B10 \+ B3/);
  });
  it('SBB at 4 deploys is no longer an All Clear', () => {
    const v = verdict('SBB', 4);
    assert.ok(!fullClear(v) && !/^Probably/.test(v.title), v.title);
  });
  it('plan shows Red 10, Black 10, Yellow 3 (Black before Yellow)', () => {
    const run = reach('SBB', 3);
    const v = evaluate(run.deploys, run.slots, false, false, [0, 0, 0]);
    assert.match(text(v), /Red S 0 to 10, Black B 0 to 10, Yellow B 0 to 3/);
  });
});

describe('Strategy from the post', () => {
  it('no S yet: keep deploying until an S shows up', () => {
    const v = verdict('---', 0);
    assert.equal(v.kind, 'go');
    assert.match(text(v), /Deploy until an S-rank/);
  });
  it('end of Wave 4 (10 deploys) with no S: restart the minigame', () => {
    assert.equal(verdict('BBB', 10).kind, 'restart');
    assert.notEqual(verdict('BBB', 9).kind, 'restart');
  });
  it('no S or A by Wave 2 (6 deploys): long shot, needs a double S or SAA/AAS', () => {
    const v = verdict('BBB', 6);
    assert.equal(v.kind, 'warn');
    assert.match(text(v), /SAA \/ AAS/);
  });
  it('an A without an S at 6 deploys keeps going', () => {
    assert.equal(verdict('A--', 6).kind, 'go');
  });
  it('once S arrives: level S to 10 first, do not level other ranks between deploys', () => {
    const v = verdict('S--', 2);
    assert.equal(v.kind, 'go');
    assert.match(text(v), /Level the S-rank to 10 first/);
    assert.match(text(v), /Do not level A\/B ranks between deploys/);
  });
  it('past 8 deploys the Wave 10 result is gone unless chasing a Double S', () => {
    const v = verdict('BSB', 9);
    assert.equal(v.kind, 'go');
    assert.match(text(v), /Past 8 deploys/);
  });
  it('a hand no listed combo can reach: play the run out (list is not exhaustive)', () => {
    const v = verdict('CSC', 15);
    assert.equal(v.kind, 'warn');
    assert.match(text(v), /not exhaustive/);
  });
});

describe('"I don\'t have 1h": short on time, about 30 minutes', () => {
  it('6 deploys with no S or A: restart', () => assert.equal(verdict('BBB', 6, true).kind, 'restart'));
  it('5 deploys with no S or A: not yet', () => assert.equal(verdict('BBB', 5, true).kind, 'go'));
  it('6 deploys with S + A: stop, max S then A, third B+ means All Clear', () => {
    const v = verdict('SDA', 6, true);
    assert.equal(v.kind, 'stop');
    assert.match(text(v), /Max out the S-rank/);
    assert.match(text(v), /B or better: All Clear/);
    assert.match(text(v), /still reach Wave 10/);
  });
  it('6 deploys with S + S: stop, max the first S, second S to 5+', () => {
    const v = verdict('SSC', 6, true);
    assert.equal(v.kind, 'stop');
    assert.match(text(v), /second S to 5 or more/);
  });
  it('6 deploys with only one S: still finish the run (General Strategy), level the S first', () => {
    const v = verdict('SCC', 6, true);
    assert.notEqual(v.kind, 'stop');
    assert.match(text(v), /only have one S/);
    assert.match(text(v), /General Strategy/);
  });
  it('6 deploys with an A but no S: restart (needs S+A or S+S)', () => {
    const v = verdict('A--', 6, true);
    assert.equal(v.kind, 'restart');
    assert.match(text(v), /S\+A or S\+S/);
  });
});

describe('Points spent total', () => {
  it('includes both deploys and level-up costs', () => {
    assert.equal(totalSpentPoints(4, [3, 0, 7]), 4 * 150 + (100 + 5 * 0 + 100 + 5 * 1 + 100 + 5 * 2) + (100 + 5 * 0 + 100 + 5 * 1 + 100 + 5 * 2 + 100 + 5 * 3 + 100 + 5 * 4 + 100 + 5 * 5 + 100 + 5 * 6));
  });
  it('counts level costs from 0 to each current level', () => {
    assert.equal(totalSpentPoints(0, [0, 1, 10]), 0 + 0 + 100 + (100 + 5 * 0 + 100 + 5 * 1 + 100 + 5 * 2 + 100 + 5 * 3 + 100 + 5 * 4 + 100 + 5 * 5 + 100 + 5 * 6 + 100 + 5 * 7 + 100 + 5 * 8 + 100 + 5 * 9));
  });
  it('estimates wave progress from total points spent', () => {
    assert.equal(estimatedWaveFromPoints(0), 0);
    assert.equal(estimatedWaveFromPoints(299), 0);
    assert.equal(estimatedWaveFromPoints(300), 1);
    assert.equal(estimatedWaveFromPoints(599), 1);
    assert.equal(estimatedWaveFromPoints(600), 2);
    assert.equal(estimatedWaveFromPoints(3300), 11);
    assert.equal(estimatedWaveFromPoints(4000), 11);
  });
});

describe('Roll mechanics: a worse result is not taken', () => {
  it('any rank fills an empty slot and costs a deploy', () => {
    const r = rollUnit(emptyRun(), 0, 'E');
    assert.deepEqual(r, { deploys: 1, slots: ['E', '', ''] });
  });
  it('a better rank replaces the unit of that color', () => {
    assert.deepEqual(rollUnit(rollUnit(emptyRun(), 0, 'A'), 0, 'S').slots, ['S', '', '']);
  });
  it('a worse rank is ignored but the deploy still counts', () => {
    const r = rollUnit(rollUnit(emptyRun(), 0, 'S'), 0, 'B');
    assert.deepEqual(r, { deploys: 2, slots: ['S', '', ''] });
  });
  it('an equal rank changes nothing', () => {
    assert.deepEqual(rollUnit(rollUnit(emptyRun(), 1, 'A'), 1, 'A').slots, ['', 'A', '']);
  });
  it('only the rolled color changes', () => {
    const r = rollUnit(rollUnit(emptyRun(), 0, 'B'), 2, 'C');
    assert.deepEqual(r.slots, ['B', '', 'C']);
  });
  it('rolled nothing only adds a deploy', () => {
    const start = rollUnit(emptyRun(), 1, 'A');
    assert.deepEqual(rollNothing(start), { deploys: 2, slots: ['', 'A', ''] });
  });
  it('never mutates the previous run (undo relies on this)', () => {
    const start = rollUnit(emptyRun(), 0, 'C');
    rollUnit(start, 0, 'S'); rollNothing(start);
    assert.deepEqual(start, { deploys: 1, slots: ['C', '', ''] });
  });
});

describe('A full run, roll by roll', () => {
  it('S Red lands at deploy 8: Wave 10 is secured and it keeps fishing for a Double S', () => {
    let run = emptyRun();
    run = rollUnit(run, 0, 'C');   // 1
    run = rollUnit(run, 1, 'B');   // 2
    run = rollUnit(run, 2, 'E');   // 3
    run = rollUnit(run, 0, 'A');   // 4  Red C -> A
    run = rollNothing(run);        // 5
    run = rollUnit(run, 2, 'B');   // 6  Yellow E -> B
    run = rollUnit(run, 2, 'D');   // 7  worse than B, ignored
    assert.deepEqual(run, { deploys: 7, slots: ['A', 'B', 'B'] });
    run = rollUnit(run, 0, 'S');   // 8  Red A -> S
    assert.deepEqual(run.slots, ['S', 'B', 'B']);
    const v = evaluate(run.deploys, run.slots, false);
    assert.ok(wave10Secured(v) && v.kind === 'go', text(v)); // S Red: Wave 10 lasts around 14 deploys
  });
  it('S, A, B inside 7 deploys is an All Clear and says stop', () => {
    let run = emptyRun();
    run = rollUnit(run, 1, 'C'); run = rollUnit(run, 2, 'B'); run = rollNothing(run);
    run = rollUnit(run, 0, 'S'); run = rollUnit(run, 1, 'A');
    const v = evaluate(run.deploys, run.slots, false);
    assert.deepEqual(run.slots, ['S', 'A', 'B']);
    assert.ok(fullClear(v), text(v));
  });
});

describe('All Clear only mode', () => {
  it('a Wave 10 hand is not a goal: keep going for an All Clear', () => {
    const normal = verdict('SBB', 5);
    const fc = verdict('SBB', 5, false, true);
    assert.ok(wave10Secured(normal));
    assert.ok(!wave10Secured(fc));
    assert.equal(fc.kind, 'go');
    assert.ok(fc.targets.length > 0 && fc.targets.every((t) => t.tier === 'All Clear'));
  });
  it('keeps fishing past 8 deploys while a Double S is reachable, with no Wave 10 warning', () => {
    assert.equal(verdict('BSB', 8).kind, 'stop');           // normal mode settles for Wave 10
    const v = verdict('BSB', 9, false, true);
    assert.equal(v.kind, 'go');
    assert.doesNotMatch(text(v), /Past 8 deploys/);
  });
  it('no All Clear reachable any more: restart instead of settling', () => {
    assert.equal(verdict('SBB', 10, false, true).kind, 'go'); // a Triple S is still in reach
    const v = verdict('SBB', 12, false, true);
    assert.equal(v.kind, 'restart');
    assert.match(v.title, /No All Clear is reachable/);
  });
  it('real All Clears still say stop', () => {
    assert.ok(fullClear(verdict('SAB', 6, false, true)));
    assert.ok(fullClear(verdict('SSB', 10, false, true)));
  });
  it('turns off the short-on-time shortcut', () => {
    assert.equal(verdict('SDA', 6, true).kind, 'stop');
    assert.equal(verdict('SDA', 6, true, true).kind, 'go');
  });
  it('never reports Wave 10 for any state', () => {
    const opts = ['', 'E', 'D', 'C', 'B', 'A', 'S'];
    for (let d = 0; d <= 12; d++)
      for (const a of opts) for (const b of opts) for (const c of opts) {
        const v = evaluate(d, [a, b, c], false, true);
        assert.ok(!/^Wave 10/.test(v.title), `${d} ${a}${b}${c}`);
      }
  });
});

// Restored: the uploaded test file no longer had these, updated for the edited post
describe('Level tracking', () => {
  const withLevels = (combo, deploys, levels) => {
    const run = reach(combo, deploys);
    return evaluate(run.deploys, run.slots, false, false, levels);
  };
  it('upgrade costs: 100 + 5 per level, capped at 10', () => {
    assert.equal(upgradeCost(0, 1), 100);
    assert.equal(upgradeCost(8, 9), 140);
    assert.equal(upgradeCost(9, 10), 145);
    assert.equal(upgradeCost(0, 10), 1225);
    assert.equal(upgradeCost(10, 10), 0);
    assert.equal(upgradeCost(6, 12), 550); // cannot go past 10
  });
  it('S Red with Black empty, Red below 10: level Red first, with the cost', () => {
    const v = withLevels('S-C', 6, [6, 0, 0]);
    assert.equal(v.kind, 'go');
    assert.match(v.title, /Level Red to 10 before you roll again/);
    assert.match(text(v), /550 points/);
    assert.match(text(v), /about 3 min/);
  });
  it('once Red is level 10: start rolling', () => {
    const v = withLevels('S-C', 6, [10, 0, 0]);
    assert.equal(v.kind, 'go');
    assert.match(v.title, /Red is level 10\. Start rolling/);
  });
  it('with two S units, Red is leveled first, then Yellow, then Black', () => {
    // third slot still empty, so it is not a finished Double S yet
    assert.match(withLevels('S-S', 6, [0, 0, 0]).title, /Level Red/);
    assert.match(withLevels('-SS', 6, [0, 0, 0]).title, /Level Yellow/);
    assert.match(withLevels('-SS', 6, [0, 0, 10]).title, /Yellow is level 10/);
  });
  it('without level info the old advice is unchanged', () => {
    assert.equal(verdict('S-C', 6).title, 'Level your S-rank, then keep deploying');
  });
  it('Wave 10 secured (S Red, SBB): level the S to 10 before fishing on', () => {
    const v = withLevels('SBB', 5, [3, 0, 0]);
    assert.equal(v.kind, 'go');
    assert.match(v.title, /^Wave 10 is secured\. Level Red to 10/);
  });
  it('All Clear locked in: shows the level-ups left for the plan (SAB: S10 + A8)', () => {
    const v = withLevels('SAB', 6, [0, 0, 0]);
    assert.ok(fullClear(v));
    assert.match(text(v), /Red S 0 to 10, Black A 0 to 8/);
    assert.match(text(v), /2,165 points/);
  });
  it('plan already met', () => {
    assert.match(text(withLevels('SAB', 6, [10, 9, 0])), /already meet the plan/);
  });
  it('Wave 10 plans name the real units: S10 + B7, or just S10 when maxing S is enough', () => {
    assert.match(text(withLevels('BSB', 8, [0, 0, 0])), /Black S 0 to 10, Red B 0 to 7/);
    const star = text(withLevels('SBB', 12, [0, 0, 0]));
    assert.match(star, /Red S 0 to 10/);
    assert.doesNotMatch(star, /B 0 to/);
  });
  it('Double S plan is S10 + S5', () => {
    assert.match(text(withLevels('SSB', 10, [0, 0, 0])), /Red S 0 to 10, Black S 0 to 5/);
  });
});

describe('Level advice only names units you actually hold', () => {
  const ranks = ['', 'E', 'D', 'C', 'B', 'A', 'S'];
  // Returns what is wrong with the advice for this hand, if anything
  function problems(slots, t) {
    const found = [];
    const held = slots.filter(Boolean);
    for (const m of t.matchAll(/\b(Red|Black|Yellow) ([SABCDE])\b/g)) {
      if (slots[SLOTS.indexOf(m[1])] !== m[2]) found.push(`says ${m[1]} ${m[2]} but ${m[1]} is ${slots[SLOTS.indexOf(m[1])] || 'empty'}`);
    }
    const aim = t.match(/\(aim ([^)]*)\)/);
    if (aim) {
      const pool = [...held];
      for (const m of aim[1].matchAll(/([SABCDE])\d+/g)) {
        const i = pool.indexOf(m[1]);
        i === -1 ? found.push(`aims for ${m[1]} without holding one`) : pool.splice(i, 1);
      }
    }
    if (/A-rank/.test(t) && !held.includes('A')) found.push('mentions the A-rank without an A');
    if (/second S/.test(t) && held.filter((x) => x === 'S').length < 2) found.push('mentions a second S without two S');
    return found;
  }
  it('holds for every deploy count, every hand, with and without level info, normal and short mode', () => {
    const bad = [];
    for (const short of [false, true]) for (const lv of [null, [0, 0, 0]]) for (let d = 0; d <= 16; d++)
      for (const a of ranks) for (const b of ranks) for (const c of ranks) {
        const slots = [a, b, c];
        const v = evaluate(d, slots, short, false, lv);
        const found = problems(slots, v.lines.join(' '));
        if (found.length) bad.push(`${short ? 'short ' : ''}d=${d} ${slots.join('') || '-'}: ${found[0]}`);
      }
    assert.equal(bad.length, 0, bad.slice(0, 5).join('\n'));
  });
  it('S + S + B never mentions an A', () => {
    const v = verdict('BSS', 6);
    assert.ok(fullClear(v));
    assert.doesNotMatch(text(v), /\bA\d|A-rank|\bA to/);
    assert.ok(text(v).includes('Level Yellow S to 10, then Black S to 5 (aim S10 + S5).'), text(v));
  });
  it('S Red with D, D never mentions a B', () => {
    const v = verdict('SDD', 8);
    assert.doesNotMatch(text(v), /\bB\d|B-rank/);
  });
  it('a stronger rank than the table lists is named by its real rank (DAS holds an A, not a B)', () => {
    const v = verdict('DAS', 8);
    assert.ok(text(v).includes('Level Yellow S to 10, then Black A to 7 (aim S10 + A7).'), text(v));
  });
  it('short mode with S + S + A levels the second S, not the A', () => {
    const v = verdict('SSA', 6, true);
    assert.equal(v.kind, 'stop');
    assert.ok(text(v).includes('Level Red S to 10, then Black S to 5'), text(v));
    assert.doesNotMatch(text(v), /A-rank/);
  });
});

describe('Community sheet rows', () => {
  const sheet8A = {
    SAA: 'Level Red S to 10, then Yellow A to 7 (aim S10 + A7).',
    ASA: 'Level Black S to 10, then Red A to 7 (aim S10 + A7).',
    AAS: 'Level Yellow S to 10, then Red A to 7 (aim S10 + A7).',
  };
  for (const [combo, advice] of Object.entries(sheet8A)) {
    it(`${combo} at 8 deploys is an All Clear: ${advice}`, () => {
      const v = verdict(combo, 8);
      assert.ok(fullClear(v), text(v));
      assert.ok(text(v).includes(advice), text(v));
    });
    it(`${combo} at 9 deploys is no longer an All Clear`, () => assert.ok(!fullClear(verdict(combo, 9))));
  }
  const sheet8S = {
    SSE: 'Level Red S to 10, then Black S to 7 (aim S10 + S7).',
    SES: 'Level Red S to 10, then Yellow S to 7 (aim S10 + S7).',
    CSS: 'Level Yellow S to 10, then Black S to 7 (aim S10 + S7).',
  };
  for (const [combo, advice] of Object.entries(sheet8S)) {
    it(`${combo} at 8 deploys is an All Clear (double S, weak third unit): ${advice}`, () => {
      const v = verdict(combo, 8);
      assert.ok(fullClear(v), text(v));
      assert.ok(text(v).includes(advice), text(v));
      assert.match(text(v), /S10 on Red or Yellow, not Black/);
    });
    it(`${combo} at 9 deploys is no longer an All Clear`, () => assert.ok(!fullClear(verdict(combo, 9))));
  }
  it('the 8-deploy double S rows do not apply once S-Black is the only S at level 10', () => {
    const run = reach('SSE', 8);
    const withBlack10 = evaluate(run.deploys, run.slots, false, false, [0, 10, 0]);
    assert.ok(!fullClear(withBlack10), text(withBlack10));
    assert.ok(fullClear(evaluate(run.deploys, run.slots, false, false, [10, 10, 0])));
    assert.ok(fullClear(evaluate(run.deploys, run.slots, false, false, [10, 0, 0])));
  });
  it('SSS at 12 deploys is unconfirmed; at 10 it is already a normal double S All Clear', () => {
    const v = verdict('SSS', 12);
    assert.equal(v.kind, 'stop');
    assert.match(v.title, /^Probably an All Clear/);
    assert.match(text(v), /unconfirmed/);
    assert.ok(fullClear(verdict('SSS', 10)));
    assert.ok(!/All Clear/.test(verdict('SSS', 13).title.replace('Wave 10', '')) || /^Wave 10/.test(verdict('SSS', 13).title));
  });
  it('early double S: Red/Yellow first within 8 deploys, S-Black first has its own rule', () => {
    const plain = text(verdict('SSB', 5));
    assert.match(plain, /Within 8 deploys with the first S Red or Yellow, S10 \+ S7 is mostly enough/);
    assert.match(plain, /Within 6 deploys, S10 \+ S9 works for all three colors/);
    const run = reach('SSB', 5);
    const blackFirst = evaluate(run.deploys, run.slots, false, false, [0, 10, 0]);
    assert.match(text(blackFirst), /your first S is Black/);
    assert.match(text(blackFirst), /past 6 deploys the 10-deploy table is the minimum/);
  });
});

describe('Edit8 and Edit9: 4-deploy row and double S at 6 and 7 deploys', () => {
  const min4 = {
    SAE: 'Level Red S to 10, then Black A to 10, then Yellow E to 2 (aim S10 + A10 + E2).',
    ASE: 'Level Black S to 10, then Red A to 10, then Yellow E to 2 (aim S10 + A10 + E2).',
    AES: 'Level Yellow S to 10, then Red A to 10, then Black E to 2 (aim S10 + A10 + E2).',
  };
  for (const [combo, advice] of Object.entries(min4)) {
    it(`${combo} at 4 deploys is an unstable All Clear (1 second to spare): ${advice}`, () => {
      const v = verdict(combo, 4);
      assert.equal(v.kind, 'stop');
      assert.match(v.title, /^Probably an All Clear/);
      assert.match(text(v), /extremely tight/);
      assert.ok(text(v).includes(advice), text(v));
    });
  }
  it('ASE is not an All Clear at 5 deploys; SEA and EAS (untested) are not claimed at 4', () => {
    assert.ok(!/All Clear/.test(verdict('ASE', 5).title) || /Wave 10/.test(verdict('ASE', 5).title));
    assert.notEqual(verdict('SEA', 4).kind, 'stop');
    assert.notEqual(verdict('EAS', 4).kind, 'stop');
  });
  it('ASD replaced ASC in the 5-deploy table (ASC still passes because it beats ASD)', () => {
    const asd = verdict('ASD', 5);
    assert.ok(fullClear(asd), text(asd));
    assert.ok(text(asd).includes('Level Black S to 10, then Red A to 10, then Yellow D to 1 (aim S10 + A10 + D1).'), text(asd));
    assert.ok(fullClear(verdict('ASC', 5)));
  });

  const ss6 = {
    SSE: 'Level Red S to 10, then Black S to 9 (aim S10 + S9).',
    SES: 'Level Red S to 10, then Yellow S to 9 (aim S10 + S9).',
    ESS: 'Level Yellow S to 10, then Black S to 9 (aim S10 + S9).',
  };
  for (const [combo, advice] of Object.entries(ss6)) {
    it(`${combo} at 6 deploys: any double S is an All Clear (S10 + S9). ${advice}`, () => {
      const v = verdict(combo, 6);
      assert.ok(fullClear(v), text(v));
      assert.ok(text(v).includes(advice), text(v));
    });
  }
  it('at 7 deploys: SSE, SES and DSS work (S10 + S8), ESS does not', () => {
    assert.ok(text(verdict('SSE', 7)).includes('Level Red S to 10, then Black S to 8 (aim S10 + S8).'));
    assert.ok(text(verdict('SES', 7)).includes('Level Red S to 10, then Yellow S to 8 (aim S10 + S8).'));
    const dss = verdict('DSS', 7);
    assert.ok(fullClear(dss), text(dss));
    assert.ok(text(dss).includes('Level Yellow S to 10, then Black S to 8 (aim S10 + S8).'), text(dss));
    assert.ok(!fullClear(verdict('ESS', 7)));
  });
  it('DSS is not an All Clear at 8 deploys (it needs a C or better in Red there: CSS)', () => {
    assert.ok(!fullClear(verdict('DSS', 8)));
    assert.ok(fullClear(verdict('CSS', 8)));
  });
  it('S-Black first: only SSD works within 6 deploys, flagged as cleared with 10 seconds left', () => {
    const run = reach('SSD', 6);
    const v = evaluate(run.deploys, run.slots, false, false, [0, 10, 0]);
    assert.equal(v.kind, 'stop');
    assert.match(v.title, /^Probably an All Clear/);
    assert.match(text(v), /10 seconds left/);
    assert.ok(text(v).includes('Level-ups left: Red S 0 to 9'), text(v));
    const sse = reach('SSE', 6);
    assert.ok(!fullClear(evaluate(sse.deploys, sse.slots, false, false, [0, 10, 0])));
    const late = reach('SSD', 7);
    assert.ok(!/All Clear/.test(evaluate(late.deploys, late.slots, false, false, [0, 10, 0]).title.replace('Wave 10', '')) || /^Wave 10/.test(evaluate(late.deploys, late.slots, false, false, [0, 10, 0]).title));
  });
  it('short on time: stop immediately once you hold S + A, even before 6 deploys', () => {
    const v = verdict('SDA', 3, true);
    assert.equal(v.kind, 'stop');
    assert.match(text(v), /Max out the S-rank, then level the A-rank/);
    assert.notEqual(verdict('S-C', 3, true).kind, 'stop'); // one S and no A keeps going
  });
  it('level every S at once: you will not pass Wave 6 otherwise, even with two S-Ranks', () => {
    const v = verdict('S-C', 6);
    assert.match(text(v), /even with two S-Ranks/);
  });
});
