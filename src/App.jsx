import { useMemo, useState } from 'react';
import { RANKS, SLOTS, LEVEL_CAP, evaluate, rollUnit, rollNothing, totalSpentPoints, estimatedWaveFromPoints } from './logic.js';
import { gitCommitTime } from './generated/git-info.js';

function Combo({ ranks, gaps = [] }) {
  return (
    <span className="combo" aria-label={ranks.split('').map((r, i) => `${SLOTS[i]} ${r}`).join(', ')}>
      {ranks.split('').map((r, i) => (
        <span key={i} className={`chip slot-${SLOTS[i]}${gaps.includes(i) ? ' gap' : ''}`}>{r}</span>
      ))}
    </span>
  );
}

export default function App() {
  const [deploys, setDeploys] = useState(0);
  const [slots, setSlots] = useState(['', '', '']);
  const [levels, setLevels] = useState([0, 0, 0]);
  const [history, setHistory] = useState([]);
  const [mode, setMode] = useState('roll');
  const [short, setShort] = useState(false);
  const [fcOnly, setFcOnly] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const result = useMemo(() => evaluate(deploys, slots, short, fcOnly, levels), [deploys, slots, short, fcOnly, levels]);
  const shown = showAll ? result.targets : result.targets.slice(0, 6);
  const totalSpent = totalSpentPoints(deploys, levels);
  const estimatedWave = estimatedWaveFromPoints(totalSpent);

  const snapshot = () => setHistory((h) => [...h, { deploys, slots, levels }]);
  const roll = (i, r) => {
    snapshot();
    const next = rollUnit({ deploys, slots }, i, r);
    setDeploys(next.deploys); setSlots(next.slots);
  };
  const rollNoGain = () => { snapshot(); setDeploys(rollNothing({ deploys, slots }).deploys); };
  const edit = (i, r) => setSlots((s) => s.map((x, j) => (j === i ? r : x)));
  const undo = () => {
    const last = history[history.length - 1];
    if (!last) return;
    setDeploys(last.deploys); setSlots(last.slots); setLevels(last.levels); setHistory((h) => h.slice(0, -1));
  };
  const reset = () => { setDeploys(0); setSlots(['', '', '']); setLevels([0, 0, 0]); setHistory([]); };
  const lastUpdatedText = new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles', timeZoneName: 'short',
  }).format(new Date(gitCommitTime));

  return (
    <main>
      <h1>MapleStory Go Go Sidekick Helper</h1>
      <p className="sub">Log each roll and it tells you if you should keep going or reset.</p>

      <section className="panel">
        <div className="row">
          <span className="label">Deploys used</span>
          <div className="stepper">
            <button onClick={() => setDeploys((d) => Math.max(0, d - 1))} aria-label="One fewer deploy">−</button>
            <output>{deploys}</output>
            <button onClick={() => setDeploys((d) => d + 1)} aria-label="One more deploy">+</button>
          </div>
          <small className="cost">
            {totalSpent.toLocaleString()} points spent
            {estimatedWave > 0 ? ` (~wave ${estimatedWave})` : ' (before wave 1)'}
          </small>
        </div>

        <div className="row">
          <div className="seg" role="radiogroup" aria-label="Input mode">
            <button role="radio" aria-checked={mode === 'roll'} className={mode === 'roll' ? 'on' : ''} onClick={() => setMode('roll')}>Log a roll</button>
            <button role="radio" aria-checked={mode === 'edit'} className={mode === 'edit' ? 'on' : ''} onClick={() => setMode('edit')}>Set my units</button>
          </div>
          <button className="ghost" onClick={undo} disabled={!history.length}>Undo</button>
        </div>

        {mode === 'roll' && (
          <div className="row">
            <p className="note">If a roll upgraded a unit, tap its color and new rank. If nothing changed, tap Rolled nothing. Each tap counts as one deploy. Highlighted is what you hold now.</p>
            <button onClick={rollNoGain}>Rolled nothing</button>
          </div>
        )}

        {SLOTS.map((name, i) => (
          <div className="row" key={name}>
            <span className={`label slot-${name}`}><i className={`dot slot-${name}`} />{name}</span>
            <div className="seg" role={mode === 'edit' ? 'radiogroup' : 'group'} aria-label={`${name} slot rank`}>
              {(mode === 'edit' ? ['', ...RANKS] : RANKS).map((r) => (
                <button key={r || 'none'} className={slots[i] === r ? 'on' : ''}
                  role={mode === 'edit' ? 'radio' : undefined} aria-checked={mode === 'edit' ? slots[i] === r : undefined}
                  aria-label={mode === 'roll' ? `Rolled ${r} ${name}` : undefined}
                  onClick={() => (mode === 'edit' ? edit(i, r) : roll(i, r))}>
                  {r || 'Standby'}
                </button>
              ))}
            </div>
            <div className="lv" role="group" aria-label={`${name} slot level`}>
              <small>Lv</small>
              <button onClick={() => setLevels((l) => l.map((x, j) => (j === i ? Math.max(0, x - 1) : x)))} aria-label={`${name} level down`}>−</button>
              <output>{levels[i]}</output>
              <button onClick={() => setLevels((l) => l.map((x, j) => (j === i ? Math.min(LEVEL_CAP, x + 1) : x)))} aria-label={`${name} level up`}>+</button>
            </div>
          </div>
        ))}

        <div className="row foot">
          <label className="check">
            <input type="checkbox" checked={short && !fcOnly} disabled={fcOnly} onChange={(e) => setShort(e.target.checked)} />
            Short on time (30 mins)
          </label>
          <div className="actions">
            <button className={`toggle${fcOnly ? ' on' : ''}`} aria-pressed={fcOnly} onClick={() => setFcOnly((v) => !v)}>
              Full Clear only: {fcOnly ? 'On' : 'Off'}
            </button>
            <button className="ghost" onClick={reset}>New run</button>
          </div>
        </div>
        {fcOnly && <p className="note">Wave 10 results are ignored. It tells you to keep deploying while a Full Clear is still reachable.</p>}
      </section>

      <section className={`verdict ${result.kind}`} aria-live="polite">
        <h2>{result.title}</h2>
        {result.lines.map((l) => <p key={l}>{l}</p>)}
      </section>

      {result.kind === 'go' && result.targets.length > 0 && (
        <section className="panel">
          <h2>Still possible</h2>
          <ul className="targets">
            {shown.map((t) => (
              <li key={t.tier + t.ranks + t.max}>
                <Combo ranks={t.ranks} gaps={t.gaps} />
                <div>
                  <b>{t.tier}</b>: needs {t.gaps.map((i) => `${SLOTS[i]} ${t.ranks[i]}`).join(', ')}
                  <small>{t.left} deploy{t.left === 1 ? '' : 's'} left{t.note ? `, ${t.note}` : ''}</small>
                </div>
              </li>
            ))}
          </ul>
          {result.targets.length > 6 && (
            <button className="ghost" onClick={() => setShowAll((v) => !v)}>
              {showAll ? 'Show fewer' : `Show all ${result.targets.length}`}
            </button>
          )}
          <p className="note">Highlighted letters are the slots you still need. Better ranks than listed also count.</p>
        </section>
      )}

      <footer>
        Source of truth:{' '}
        <a href="https://www.reddit.com/r/Maplestory/comments/1wu7hyv/go_go_sidekick_winning_combinations/" target="_blank" rel="noreferrer">
          r/Maplestory, "Go Go Sidekick winning combinations"
        </a>
        , which uses MapleSEA/TMS data. Real odds are unknown, so this only checks which listed combinations are
        still reachable, assuming each deploy can improve one slot and a rolled unit competes with the slot of its
        own color. Slot order is Red, Black, Yellow.
        <br />Last updated: {lastUpdatedText}
      </footer>
    </main>
  );
}
