# Data model in src/logic.js

```
p(tier, ranks, max, planKey, note = '', status = 'confirmed')
```
- `tier`: `FC` = 'All Clear', `W10` = 'Wave 10'.
- `ranks`: 3 letters, Red-Black-Yellow. Matching is slot-wise "at least as good" (`V` maps S=6 ... E=1, empty=0).
- `max`: deploy cap. `done` when deploys <= max; `open` ("still possible") when the missing slots can be fixed within the remaining deploys (one slot per deploy).
- `planKey` -> `PLAN` map. Array = target levels by rank order (best rank first; ties Red > Yellow > Black). `{ byColor: [R,B,Y], order: [...] }` = levels per color and the order to name them.
- `status`: confirmed | unstable | unconfirmed. `note` shows as a pill tooltip and, for All Clear, makes the verdict "Probably an All Clear" (never "locked in").

## evaluate(deploys, slots, short, fcOnly = false, levels = null)
Returns `{ kind, title, lines, targets }`, `kind` in go / stop / restart / warn. Order of rules: 30-minute mode (stop at S+A at any time; at 6 deploys need S+A or S+S, else restart; a single S continues as the General Strategy), All Clear match (stop; plan lines built from the actual hand with `bestFit`), Wave 10 match (keep fishing while an All Clear is still reachable and deploys < cap, else stop), no S yet (restart at 10 deploys), S held with reachable targets (leveling advice), All-Clear-only mode with nothing reachable (restart), otherwise "play the run out".
- `fcOnly` ignores Wave 10 results and the 30-minute shortcut.
- `levels` (Red, Black, Yellow) unlocks level advice and these rules: leveling order Red > Yellow > Black; `blackFirst` (Black level 10 and no Red/Yellow S at 10) blocks the Red/Yellow double S rows (keys SS6, SS7, SS8, SS9, SSA11) and enables Black-only rows (plan keys beginning `Black `); the S-Black level 5 strategy (`levelStep` with `blackFive`).
- Wave 10 cap per S color: Red around 14, Black 8; Yellow is not stated by the sources and is set to 8 (an assumption).

## Costs and time
Upgrade cost from level L is 100 + 5L, max level 10 (0 to 10 = 1,225). Deploy cost is 150. 300 points per wave; waves 1 and 2 last 90 seconds, later waves 60 (`mins`, `estimatedWaveFromPoints`, `totalSpentPoints`).

## Roll mechanics (pure functions, tested)
`rollUnit(run, slotIndex, rank)` always costs a deploy and keeps the better unit; `rollNothing` only adds a deploy; neither mutates its input (undo relies on it).
