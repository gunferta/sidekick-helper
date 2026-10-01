// Unit tests for the scenarios listed in the r/Maplestory "Go Go Sidekick winning combinations" post.
// Run: npm test   (uses Node's built-in test runner, nothing to install)
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, emptyRun, rollUnit, rollNothing, upgradeCost, totalSpentPoints, estimatedWaveFromPoints } from '../src/logic.js';

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
const fullClear = (v) => v.kind === 'stop' && v.title.startsWith('Full Clear locked in');
const wave10Secured = (v) => v.title.startsWith('Wave 10 is secured');

describe('Full Clear: 6 deploys, by Wave 2', () => {
  for (const combo of ['SAB', 'SCA', 'ASB', 'ABS', 'BAS']) {
    it(`${combo} at 6 deploys is a Full Clear: stop, level S then A`, () => {
      const v = verdict(combo, 6);
      assert.ok(fullClear(v), text(v));
      assert.match(text(v), /Level S to 10, then A/);
      assert.match(text(v), /S10 \+ A9/);
    });
    it(`${combo} earlier than 6 deploys: stop deploying immediately`, () => {
      assert.ok(fullClear(verdict(combo, 4)));
    });
  }
  it('is no longer a Full Clear well past 7 deploys', () => {
    assert.ok(!fullClear(verdict('SAB', 9)));
  });
  it('SBA also works at 6 deploys (it beats SCA)', () => assert.ok(fullClear(verdict('SBA', 6))));
});

describe('Full Clear: 7 deploys, by mid-Wave 3', () => {
  for (const combo of ['SAB', 'SBA', 'ABS', 'BAS']) {
    it(`${combo} still works at 7 deploys`, () => assert.ok(fullClear(verdict(combo, 7))));
  }
  it('SCA is not an S+A+B hand, so it only works up to 6 deploys', () => {
    assert.ok(fullClear(verdict('SCA', 6)));
    const v = verdict('SCA', 7);
    assert.ok(!fullClear(v));
    assert.ok(wave10Secured(v), text(v));
  });
  it('Black S needs ASA at 7 deploys', () => assert.ok(fullClear(verdict('ASA', 7))));
  it('ASB is NOT a Full Clear at 7 deploys (but still reaches Wave 10)', () => {
    const v = verdict('ASB', 7);
    assert.ok(!fullClear(v));
    assert.ok(wave10Secured(v), text(v));
  });
});

describe('Full Clear Double S: 10 deploys, by Wave 4', () => {
  for (const combo of ['SSB', 'SBS', 'BSS']) {
    it(`${combo} at 10 deploys is a Full Clear, leveling Red > Yellow > Black`, () => {
      const v = verdict(combo, 10);
      assert.ok(fullClear(v), text(v));
      assert.match(text(v), /Red > Yellow > Black/);
      assert.match(text(v), /S10 \+ S5/);
    });
    it(`${combo} earlier than 10 deploys: stop deploying`, () => {
      assert.ok(fullClear(verdict(combo, 5)));
    });
    it(`${combo} is not a Full Clear after 10 deploys`, () => {
      assert.ok(!fullClear(verdict(combo, 11)));
    });
  }
  it('a weak third unit is not claimed any more (the "S7 E0 S10" line was removed from the post)', () => {
    assert.notEqual(verdict('SSE', 10).kind, 'stop');
  });
});

describe('Wave 10: 8 deploys, by Wave 3 (around 14 with S Red)', () => {
  for (const combo of ['BSB', 'BDS', 'DBS']) {
    it(`${combo} at 8 deploys: Wave 10 secured, stop, aim S10 + B7`, () => {
      const v = verdict(combo, 8);
      assert.ok(wave10Secured(v) && v.kind === 'stop', text(v));
      assert.match(text(v), /S10 \+ B7/);
    });
    it(`${combo} earlier: keep fishing for a Full Clear, up to 8 deploys total`, () => {
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
  it('S Red Wave 10 says stop once no Full Clear is reachable any more', () => {
    const v = verdict('SBB', 12);
    assert.ok(wave10Secured(v) && v.kind === 'stop', text(v));
  });
  it('S Red with an empty slot is not Wave 10 yet', () => {
    assert.ok(!wave10Secured(verdict('S-D', 5)));
  });
});

describe('Minimum Full Clear: 3 deploys, by mid-Wave 1', () => {
  for (const combo of ['ASC', 'ACS', 'CAS']) {
    it(`${combo} at 3 deploys is a Full Clear: S10 + A10 + C3`, () => {
      const v = verdict(combo, 3);
      assert.ok(fullClear(v), text(v));
      assert.match(text(v), /A to 10/);
      assert.match(text(v), /C3/);
    });
    it(`${combo} at 4 deploys is no longer a Full Clear`, () => assert.ok(!fullClear(verdict(combo, 4))));
  }
  it('CSA is not claimed (the post is unsure it is possible)', () => {
    const v = verdict('CSA', 3);
    assert.notEqual(v.kind, 'stop');
  });
  it('SBB at 3 deploys is flagged as RNG, not guaranteed', () => {
    const v = verdict('SBB', 3);
    assert.equal(v.kind, 'stop');
    assert.match(v.title, /^Probably a Full Clear/);
    assert.match(text(v), /not guaranteed/);
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
  it('6 deploys with an S: stop, max S then A, third B+ means Full Clear', () => {
    const v = verdict('SCC', 6, true);
    assert.equal(v.kind, 'stop');
    assert.match(text(v), /Max out the S-rank/);
    assert.match(text(v), /B or better: Full Clear/);
    assert.match(text(v), /still reach Wave 10/);
  });
  it('6 deploys with only an A: stop and level it', () => assert.equal(verdict('A--', 6, true).kind, 'stop'));
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
  it('S, A, B inside 7 deploys is a Full Clear and says stop', () => {
    let run = emptyRun();
    run = rollUnit(run, 1, 'C'); run = rollUnit(run, 2, 'B'); run = rollNothing(run);
    run = rollUnit(run, 0, 'S'); run = rollUnit(run, 1, 'A');
    const v = evaluate(run.deploys, run.slots, false);
    assert.deepEqual(run.slots, ['S', 'A', 'B']);
    assert.ok(fullClear(v), text(v));
  });
});

describe('Full Clear only mode', () => {
  it('a Wave 10 hand is not a goal: keep going for a Full Clear', () => {
    const normal = verdict('SBB', 5);
    const fc = verdict('SBB', 5, false, true);
    assert.ok(wave10Secured(normal));
    assert.ok(!wave10Secured(fc));
    assert.equal(fc.kind, 'go');
    assert.ok(fc.targets.length > 0 && fc.targets.every((t) => t.tier === 'Full Clear'));
  });
  it('keeps fishing past 8 deploys while a Double S is reachable, with no Wave 10 warning', () => {
    assert.equal(verdict('BSB', 8).kind, 'stop');           // normal mode settles for Wave 10
    const v = verdict('BSB', 9, false, true);
    assert.equal(v.kind, 'go');
    assert.doesNotMatch(text(v), /Past 8 deploys/);
  });
  it('no Full Clear reachable any more: restart instead of settling', () => {
    const v = verdict('SBB', 10, false, true);
    assert.equal(v.kind, 'restart');
    assert.match(v.title, /No Full Clear is reachable/);
  });
  it('real Full Clears still say stop', () => {
    assert.ok(fullClear(verdict('SAB', 6, false, true)));
    assert.ok(fullClear(verdict('SSB', 10, false, true)));
  });
  it('turns off the short-on-time shortcut', () => {
    assert.equal(verdict('SCC', 6, true).kind, 'stop');
    assert.equal(verdict('SCC', 6, true, true).kind, 'go');
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
  it('Full Clear locked in: shows the level-ups left for the plan (S10 + A9)', () => {
    const v = withLevels('SAB', 6, [0, 0, 0]);
    assert.ok(fullClear(v));
    assert.match(text(v), /Red 0 to 10, Black 0 to 9/);
    assert.match(text(v), /2,305 points/);
  });
  it('plan already met', () => {
    assert.match(text(withLevels('SAB', 6, [10, 9, 0])), /already meet the plan/);
  });
  it('Wave 10 plan is S10 + B7, Double S plan is S10 + S5', () => {
    assert.match(text(withLevels('SBB', 12, [0, 0, 0])), /Red 0 to 10, Yellow 0 to 7/); // ties: Red > Yellow > Black
    assert.match(text(withLevels('SSB', 10, [0, 0, 0])), /Red 0 to 10, Black 0 to 5/);
  });
});
