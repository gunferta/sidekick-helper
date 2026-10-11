---
name: sidekick-helper-source-sync
description: Procedure for updating the Go Go Sidekick helper when the Reddit post or the Google Sheet changes (new edit number, new changelog lines, new screenshot). Use when the user pastes a new version of the post, a sheet screenshot or changelog, or asks "did we miss anything", "update the logic", "is today's update covered". Covers reading the tables and notation, editing PATTERNS/PLAN, updating tests and the validation tables, and reporting ambiguities.
---

# Syncing the app with the Reddit post and the sheet

Read `sidekick-helper-project` first. Then:

## 1. Collect the sources
- The pasted Reddit text (note the highest "EditN" at the bottom: that is the version).
- The sheet **screenshot** (yellow cells = Unstable, blue cells = Double S required) and the changelog lines. Treat the screenshot as newer than the Reddit tables when they differ; the post even points to the sheet as the consolidated version.
- Do not trust web_fetch of the sheet for current content (stale cache). It is fine to fetch once to confirm the link works.

## 2. Read the notation correctly
See `references/reading-the-sheet.md`. Key points: columns are which color holds the S10 (S Red / S Black / S Yellow); strings are Red-Black-Yellow; "any SS" means a double S with any third rank; "SS+C" means third unit C or better; "?" means unknown (skip, or add as Unconfirmed); "-" means none; stars mean tight/unstable; "Final Upgrade 10 + 9" is the level plan.

## 3. Find the gaps before editing
1. Transcribe every table into the `tables` object at the top of `tests/validate-against-post.mjs` (cap, columns, and `true` as the third item for Black-column rows that only apply once S-Black is level 10).
2. Run `node tests/validate-against-post.mjs`. Its "missing from app" and "in app but not in the tables" lines are your to-do list.
3. Optionally snapshot behavior first (`sidekick-helper-verify/scripts/snapshot.mjs`) so you can show what changed afterwards.

## 4. Edit `src/logic.js`
- Add/remove entries in `PATTERNS` with `p(FC|W10, 'RBY', cap, planKey, note?, status?)`. Keep the list ordered by deploy cap ascending: ties in "closest combo" resolve by list order, which picks the nearest table's level plan.
- A combo that appears in several tables is one entry per table (different caps and plans).
- Dominance means better ranks also pass, so list only the lowest combos the sources list. Do not add entries that a listed one already covers unless they have a different cap or plan.
- Add a plan key + `PLAN` entry for any new "Final Upgrade" (array = levels by rank order, best rank first, ties Red > Yellow > Black; or `{ byColor: [R, B, Y], order: [...] }` when the source names a color order). Black-column rows use keys that start with `Black ` and only apply when S-Black is level 10.
- Status: `unstable` for highlighted/starred/"must be exactly on time"/"cleared with N seconds left"; `unconfirmed` for "?" or a cell generalized beyond what was found; otherwise confirmed. Any All Clear entry with a note must not be confirmed (a test enforces this).
- Strategy text changes (Fast/General/All Clear only, FAQ) usually map to a branch in `evaluate`; change the branch and its lines, keep wording honest for every hand.

## 5. Update tests
- Rewrite the tests whose expectations changed; keep one test per post rule. Expected level advice strings name real colors and ranks, e.g. `Level Red S to 10, then Yellow A to 7 (aim S10 + A7).` Ties go Red > Yellow > Black.
- Update the pills test (the exact list of unstable/unconfirmed entries) and `validate-against-post.mjs` scenarios.
- Run `npm test` and `npm run validate`; both must pass.

## 6. Verify, package, report
Run the three checks in `sidekick-helper-verify`, then zip only `src/logic.js` and the two test files (plus any UI file you were asked to change). In the reply: what changed (grouped by table), what you deliberately left out ("?" cells, unclear notes), assumptions you made, and at most one question. Mention that the UI was not rendered if you touched it.

## Known open questions (as of Reddit Edit10, sheet changelog through 10/10)
See `references/current-state.md`.
