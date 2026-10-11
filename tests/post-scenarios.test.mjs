// Unit tests for the scenarios listed in the r/Maplestory "Go Go Sidekick winning combinations" post.
// Run: npm test   (uses Node's built-in test runner, nothing to install)
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SLOTS, PATTERNS, evaluate, emptyRun, rollUnit, rollNothing, upgradeCost, totalSpentPoints, estimatedWaveFromPoints } from '../src/logic.js';

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
    SEA: 'Level Red S to 10, then Yellow A to 10, then Black E to 1 (aim S10 + A10 + E1).',
    SDA: 'Level Red S to 10, then Yellow A to 10, then Black D to 1 (aim S10 + A10 + D1).', // beats SEA
    ASC: 'Level Black S to 10, then Red A to 10, then Yellow C to 1 (aim S10 + A10 + C1).', // beats ASD
    ASD: 'Level Black S to 10, then Red A to 10, then Yellow D to 1 (aim S10 + A10 + D1).',
    BSA: 'Level Black S to 10, then Yellow A to 10, then Red B to 1 (aim S10 + A10 + B1).',
    CAS: 'Level Yellow S to 10, then Black A to 10, then Red C to 1 (aim S10 + A10 + C1).',
  };
  for (const [combo, advice] of Object.entries(min5)) {
    it(`${combo} at 5 deploys is an All Clear: ${advice}`, () => {
      const v = verdict(combo, 5);
      assert.ok(fullClear(v), text(v));
      assert.ok(text(v).includes(advice), text(v));
    });
  }
  it('BAS beats CAS (5-deploy table) and is also in the 6-deploy table, so it uses S10 + A9', () => {
    const v = verdict('BAS', 5);
    assert.ok(fullClear(v), text(v));
    assert.ok(text(v).includes('Level Yellow S to 10, then Black A to 9 (aim S10 + A9).'), text(v));
  });
  it('SAE and AES are unstable: extremely tight, collect points and upgrade on time', () => {
    for (const combo of ['SAE', 'AES']) {
      const v = verdict(combo, 5);
      assert.equal(v.kind, 'stop');
      assert.match(v.title, /^Probably an All Clear/);
      assert.match(text(v), /extremely tight/);
    }
    assert.ok(text(verdict('AES', 5)).includes('Level Yellow S to 10, then Red A to 10, then Black E to 1 (aim S10 + A10 + E1).'));
  });
  it('ACS at 5 deploys is an All Clear through the 6-deploy table', () => {
    const v = verdict('ACS', 5);
    assert.ok(fullClear(v), text(v));
    assert.ok(text(v).includes('Level Yellow S to 10, then Red A to 9 (aim S10 + A9).'), text(v));
  });
  it('SDA is no longer an All Clear at 6 deploys', () => assert.ok(!fullClear(verdict('SDA', 6))));
  it('CSA only works at 4 deploys, not 5', () => {
    assert.equal(verdict('CSA', 4).kind, 'stop');
    assert.notEqual(verdict('CSA', 5).kind, 'stop');
  });
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
    assert.equal(v.title, 'No S yet. Keep deploying.');
    assert.match(text(v), /0 of 10 deploys used/);
    assert.match(text(v), /Restart if there is still no S by deploy 10 \(end of Wave 4\)/);
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

describe('Sheet rows: 8 deploys and the S-Black column', () => {
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
  const any8 = {
    SSE: 'Level Red S to 10, then Black S to 7 (aim S10 + S7).',
    SES: 'Level Red S to 10, then Yellow S to 7 (aim S10 + S7).',
    ESS: 'Level Yellow S to 10, then Black S to 7 (aim S10 + S7).',
    CSS: 'Level Yellow S to 10, then Black S to 7 (aim S10 + S7).',
  };
  for (const [combo, advice] of Object.entries(any8)) {
    it(`${combo} at 8 deploys is an All Clear (any SS): ${advice}`, () => {
      const v = verdict(combo, 8);
      assert.ok(fullClear(v), text(v));
      assert.ok(text(v).includes(advice), text(v));
      assert.match(text(v), /S10 on Red or Yellow/);
    });
  }
  it('SSE, SES and ESS at 9 deploys are no longer an All Clear (9 needs a C)', () => {
    for (const combo of ['SSE', 'SES', 'ESS']) assert.ok(!fullClear(verdict(combo, 9)), combo);
  });
  it('the Red/Yellow double S rows stop applying once S-Black is the only S at level 10', () => {
    const run = reach('SSE', 8);
    assert.ok(!fullClear(evaluate(run.deploys, run.slots, false, false, [0, 10, 0])));
    assert.ok(fullClear(evaluate(run.deploys, run.slots, false, false, [10, 10, 0])));
    assert.ok(fullClear(evaluate(run.deploys, run.slots, false, false, [10, 0, 0])));
  });
  it('S-Black as the S10 at 8 deploys: only SSC works', () => {
    const ssc = reach('SSC', 8);
    const v = evaluate(ssc.deploys, ssc.slots, false, false, [0, 10, 0]);
    assert.ok(fullClear(v), text(v));
    assert.match(text(v), /Red S 0 to 7/);
    const ssd = reach('SSD', 8);
    assert.ok(!fullClear(evaluate(ssd.deploys, ssd.slots, false, false, [0, 10, 0])));
  });
  it('early double S: Red/Yellow first within 8 deploys, S-Black first has its own rule', () => {
    const plain = text(verdict('SSB', 5));
    assert.match(plain, /Within 8 deploys with the first S Red or Yellow, S10 \+ S7 is mostly enough/);
    assert.match(plain, /Within 6 deploys, S10 \+ S9 works for all three colors/);
    const run = reach('SSB', 5);
    const blackFirst = evaluate(run.deploys, run.slots, false, false, [0, 10, 0]);
    assert.match(text(blackFirst), /your first S is Black/);
    assert.match(text(blackFirst), /10-deploy table is the minimum/);
  });
});

describe('Edit10 and the sheet: small hands, any SS, and the late rows', () => {
  const min4 = {
    SAE: 'Level Red S to 10, then Black A to 10, then Yellow E to 2 (aim S10 + A10 + E2).',
    ASE: 'Level Black S to 10, then Red A to 10, then Yellow E to 2 (aim S10 + A10 + E2).',
    AES: 'Level Yellow S to 10, then Red A to 10, then Black E to 2 (aim S10 + A10 + E2).',
    CSA: 'Level Black S to 10, then Yellow A to 10, then Red C to 2 (aim S10 + A10 + C2).',
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
  it('ASE is not an All Clear at 5 deploys, and EAS (unknown) is not claimed', () => {
    assert.ok(!fullClear(verdict('ASE', 5)));
    assert.notEqual(verdict('EAS', 4).kind, 'stop');
  });
  it('DAS at 3 deploys: unstable, level Yellow, then Black, then Red (D3 A10 S10)', () => {
    const v = verdict('DAS', 3);
    assert.equal(v.kind, 'stop');
    assert.match(v.title, /^Probably an All Clear/);
    assert.match(text(v), /3 seconds left/);
    assert.ok(text(v).includes('Level Yellow S to 10, then Black A to 10, then Red D to 3 (aim S10 + A10 + D3).'), text(v));
    assert.ok(!/^Probably an All Clear/.test(verdict('DAS', 4).title));
  });
  it('any double S at 4 deploys: S10 + S10 + 2, then at 5 it falls back to the 6-deploy S10 + S9', () => {
    assert.ok(text(verdict('SSE', 4)).includes('Level Red S to 10, then Black S to 10, then Yellow E to 2 (aim S10 + S10 + E2).'));
    assert.ok(text(verdict('ESS', 4)).includes('Level Yellow S to 10, then Black S to 10, then Red E to 2 (aim S10 + S10 + E2).'));
    assert.ok(text(verdict('SES', 5)).includes('Level Red S to 10, then Yellow S to 9 (aim S10 + S9).'));
  });
  it('5 deploys: SEA is an All Clear now (it replaced SDA, which still passes)', () => {
    assert.ok(fullClear(verdict('SEA', 5)));
    assert.ok(fullClear(verdict('SDA', 5)));
  });
  it('6 and 7 deploys: any double S, including ESS at 7 (S10 + S9 then S10 + S8)', () => {
    for (const combo of ['SSE', 'SES', 'ESS']) {
      assert.ok(text(verdict(combo, 6)).includes('(aim S10 + S9)'), combo);
      assert.ok(text(verdict(combo, 7)).includes('(aim S10 + S8)'), combo);
    }
    assert.ok(text(verdict('ESS', 7)).includes('Level Yellow S to 10, then Black S to 8 (aim S10 + S8).'));
    assert.ok(fullClear(verdict('DSS', 7)) && fullClear(verdict('DSS', 8)));
  });
  it('S-Black as the S10: SSD (tight) and CSS at 6, SSD and CSS at 7, SSC at 8', () => {
    const lv = [0, 10, 0];
    const run = (combo, d) => { const r = reach(combo, d); return evaluate(r.deploys, r.slots, false, false, lv); };
    // SSD* at 6 is the tighter row (S10 + S9), but the 7-deploy row (S10 + S8) also covers 6 deploys, so that plan is used
    const ssd6 = run('SSD', 6);
    assert.ok(fullClear(ssd6), text(ssd6));
    assert.ok(text(ssd6).includes('Level-ups left: Red S 0 to 8'), text(ssd6));
    const css6 = run('CSS', 6);
    assert.ok(fullClear(css6) && text(css6).includes('Yellow S 0 to 9'), text(css6));
    assert.ok(fullClear(run('SSD', 7)) && fullClear(run('CSS', 7)));
    assert.ok(!fullClear(run('SSD', 8)) && fullClear(run('SSC', 8)));
    assert.ok(!fullClear(run('SSE', 6)));
  });
  it('9 deploys: SCS is found (S10 + S6); SSC is only listed as Red SS+C, so it is unconfirmed', () => {
    const scs = verdict('SCS', 9);
    assert.ok(fullClear(scs), text(scs));
    assert.ok(text(scs).includes('Level Red S to 10, then Yellow S to 6 (aim S10 + S6).'), text(scs));
    const ssc = verdict('SSC', 9);
    assert.match(ssc.title, /^Probably an All Clear/);
    assert.match(text(ssc), /Unconfirmed combination/);
    assert.ok(!fullClear(verdict('SCS', 10)));
  });
  it('11 deploys: SSA (S10 + S3 + A1). 12 deploys: SSS (S10 + S2)', () => {
    const ssa = verdict('SSA', 11);
    assert.ok(fullClear(ssa), text(ssa));
    assert.ok(text(ssa).includes('Level Red S to 10, then Black S to 3, then Yellow A to 1 (aim S10 + S3 + A1).'), text(ssa));
    assert.ok(!fullClear(verdict('SSA', 12)));
    const sss = verdict('SSS', 12);
    assert.ok(fullClear(sss), text(sss));
    assert.ok(text(sss).includes('Level Red S to 10, then Yellow S to 2 (aim S10 + S2).'), text(sss)); // ties: Red > Yellow > Black
    assert.ok(!fullClear(verdict('SSS', 13)));
  });
  it('S-Black first (the sheet strategy): level it to just 5, keep deploying, switch if another S shows up', () => {
    const run = reach('CSE', 4);
    const start = evaluate(run.deploys, run.slots, false, false, [0, 0, 0]);
    assert.equal(start.title, 'Level Black to 5 before you roll again');
    assert.match(text(start), /just 5/);
    assert.match(text(start), /If you only want Wave 10, level Black to 10/);
    const five = evaluate(run.deploys, run.slots, false, false, [0, 5, 0]);
    assert.equal(five.title, 'Black is level 5. Start rolling.');
    assert.match(text(five), /max that color to 10 and put the rest back into Black/);
    const late = reach('CSE', 7);
    assert.equal(evaluate(late.deploys, late.slots, false, false, [0, 5, 0]).title, 'Black is level 5. Start rolling.');
    assert.equal(evaluate(late.deploys, late.slots, false, false, [0, 0, 0]).title, 'Level Black to 10 before you roll again');
  });
  it('a winning Black hand is leveled to 10 as usual (BSB is Wave 10)', () => {
    const run = reach('BSB', 5);
    assert.match(evaluate(run.deploys, run.slots, false, false, [0, 0, 0]).title, /Level Black to 10/);
  });
  it('level every S at once: you need a solo S7+ or an S5 + S2 to make it past Wave 7', () => {
    assert.match(text(verdict('S-C', 6)), /solo S7\+ or an S5 \+ S2/);
  });
});

describe('Pills: confirmed, unstable, unconfirmed', () => {
  it('every combo has a status, and combos with a warning note are never "confirmed" (star notes on Wave 10 hands are just hints)', () => {
    for (const pt of PATTERNS) {
      assert.ok(['confirmed', 'unstable', 'unconfirmed'].includes(pt.status), `${pt.ranks} ${pt.max}`);
      if (pt.tier === 'All Clear') assert.equal(pt.status === 'confirmed', !pt.note, `${pt.ranks} at ${pt.max} deploys`);
    }
  });
  it('the unstable ones match the sheet highlights and the post stars', () => {
    const unstable = PATTERNS.filter((x) => x.status === 'unstable').map((x) => `${x.ranks}@${x.max}`).sort();
    assert.deepEqual(unstable, ['AES@4', 'AES@5', 'ASE@4', 'BSA@6', 'CSA@4', 'DAS@3', 'SAE@4', 'SAE@5', 'SBB@3', 'SSD@6']);
  });
  it('SSC at 9 (listed as Red SS+C, only SCS found) is the only unconfirmed one', () => {
    assert.deepEqual(PATTERNS.filter((x) => x.status === 'unconfirmed').map((x) => `${x.ranks}@${x.max}`), ['SSC@9']);
  });
  it('the "Still possible" targets carry their status', () => {
    const v = evaluate(0, ['', '', ''], false);
    assert.ok(v.targets.length > 0 && v.targets.every((x) => ['confirmed', 'unstable', 'unconfirmed'].includes(x.status)));
  });
});

describe('Wave timing: waves 1 and 2 take 90 seconds, later waves 60', () => {
  it('1,225 points (S to level 10) is about 6 minutes, not 5', () => {
    assert.match(text(verdict('S-C', 6)), /./); // sanity
    const run = reach('S-C', 6);
    const v = evaluate(run.deploys, run.slots, false, false, [0, 0, 0]);
    assert.match(text(v), /1,225 points, about 6 min/);
  });
  it('550 points stays about 3 minutes (inside the first two waves)', () => {
    const run = reach('S-C', 6);
    assert.match(text(evaluate(run.deploys, run.slots, false, false, [6, 0, 0])), /550 points, about 3 min/);
  });
});
