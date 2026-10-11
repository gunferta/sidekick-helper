---
name: sidekick-helper-verify
description: Checks to run before shipping any change to the Go Go Sidekick helper's logic or tests: the test suites, a check that advice text only names units the player actually holds, a check that a better hand never does worse than a worse hand, and a before/after behavior snapshot diff. Use after editing src/logic.js, when the user reports odd advice ("it tells me to level A when I have a B", "SSA fails but SAA passes"), or when asked whether the passing hands make sense.
---

# Verifying the sidekick helper

All scripts take the repo root as the first argument (default `.`), import `src/logic.js` directly, and need only Node 18+. No install step.

## Always run
```
npm test                       # node:test unit tests (tests/post-scenarios.test.mjs)
npm run validate               # tables transcribed from the sources vs PATTERNS, plus an exhaustive oracle
node scripts/audit-text.mjs <repo>      # advice text vs the actual hand
node scripts/monotonic.mjs <repo>       # better hand must not do worse
```
(`scripts/` here means this skill's scripts folder.) If `npm` is unavailable use `node --test tests/post-scenarios.test.mjs` and `node tests/validate-against-post.mjs`.

## What each check proves
- **audit-text**: for every deploy count 0-16, every hand (343), normal and 30-minute mode, with and without level info: any "Color Rank" phrase in the advice must match the hand, "(aim S10 + A9)" may only name ranks you hold, and "A-rank" or "second S" may only appear when you hold one. Expect `0 of N states`. It caught the old bug where static table text named an A to someone holding a B.
- **monotonic**: (1) slot-wise: a hand at least as good in every slot must never get a worse verdict. Must be 0; this follows from dominance, so a hit means a cap or pattern was mis-entered. (2) color-aware (a better rank moved into a stronger color, Red > Yellow > Black): informational. A few pairs come from sparse sheet data (note them, do not "fix" without a source). Also prints how many arrangement-only gaps exist (better multiset in a weaker color), which is expected because Red/Yellow S10 rows are easier than Black.
- **snapshot + diff-snapshots**: dump verdict kinds for all states before editing, again after, and diff to see exactly which hands changed. Use it to write the "what changed" part of the reply.
```
node scripts/snapshot.mjs <repo> before.json
# ...edit...
node scripts/snapshot.mjs <repo> after.json
node scripts/diff-snapshots.mjs before.json after.json
```

## When the user reports a mismatch
Ask for deploys + the three ranks (Red/Black/Yellow) + levels if they use them, run `evaluate` on exactly that state, and compare with the sources. Check, in order: a cap too small/large, a missing table row, a dominance side effect (a better listed combo matching first), the Black-first block (Black at level 10), fcOnly/short mode.

## Labels used by the scripts
A state counts as All Clear when `kind === 'stop'` and the title contains "All Clear" (this includes "Probably an All Clear"); Wave 10 when the title starts with "Wave 10". If wording in titles changes, update the regexes in the scripts and the test helper `label`.
