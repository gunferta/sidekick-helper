---
name: sidekick-helper-project
description: Context and working rules for the MapleStory GMS "Go Go Sidekick" helper app (React + Vite, repo gunferta/sidekick-helper, hosted on GitHub Pages). Use whenever the user mentions the sidekick helper, Go Go Sidekick, deploys/rolls/S-A-B ranks, "All Clear" vs "Wave 10", the winning-combinations Reddit post or Google Sheet, or asks to change the app, its logic, its tests or its text. Read this first, then use sidekick-helper-source-sync for data updates and sidekick-helper-verify before shipping.
---

# Go Go Sidekick helper: project context

## What the app does
The player logs each roll (a "deploy") of the three sidekick slots **Red, Black, Yellow** (ranks S/A/B/C/D/E, or empty = "standby"), plus each slot's level. The app says whether to keep deploying, stop and level, or restart, and lists which winning combinations are still reachable. Odds are unknown, so there is no probability model: everything comes from combinations that players have cleared, listed in a Reddit post and a community Google Sheet.

Sources of truth (both, the sheet is the fuller one):
- Reddit post "Go Go Sidekick winning combinations" (r/Maplestory, thread id 1wu7hyv). Reddit cannot be fetched; the user pastes the text.
- Google Sheet "Go Go Sidekick! Winning Combinations" (id 1TX9w1WcmTQi8iB5JdoL7M0ABmpMglWOSwJvSdjEyRo8). web_fetch returns an old cached copy, so trust the user's screenshot and changelog. Cell colors matter and are not in fetched text.

## Vocabulary (use these words in user-facing text)
- **All Clear**: you clear Wave 10. Never write "Full Clear" (the user replaced it everywhere).
- **Wave 10**: you reach it but do not kill all the mobs before the timer runs out.
- **Deploy**: one roll. A worse result than the unit already in that color is not taken, but the deploy still counts.
- Combo strings are ranks in **Red, Black, Yellow** order: `SAE` = Red S, Black A, Yellow E.
- Pills in the UI: Confirmed, Unstable (sheet highlight / "must be exactly on time"), Unconfirmed (only a "?" or one data point).

## Repo layout and who owns what
- `src/logic.js`: all data and rules (PATTERNS, PLAN, evaluate, leveling, wave estimate). **You own this.**
- `tests/post-scenarios.test.mjs` (node:test, `npm test`) and `tests/validate-against-post.mjs` (`npm run validate`): **you own these.**
- `src/App.jsx`, `src/styles.css`, `src/main.jsx`, `src/generated/git-info.js`, `scripts/write-git-info.mjs`, `.github/workflows/`, `package.json`, `README`: **the user owns these** and edits wording, footer, "Last updated" text and styling by hand. Do not overwrite them from an old copy.
- The user's files use CRLF in some places (styles.css, main.jsx). Preserve line endings when editing.

## Rules of engagement
1. Before touching UI files, ask the user to upload their latest `src` (zip). Adopt their versions into your working copy, then patch on top. Their upload wins over your memory of the file.
2. Ship **only the files you changed**, zipped with repo-relative paths (`src/logic.js`, `tests/...`), via present_files. Never send the whole project back.
3. Run `npm test`, `npm run validate` and the checks in sidekick-helper-verify before shipping. There is no network and usually no node_modules: the tests use Node's built-in runner, so they run anyway. You cannot render the UI; say so, and ask the user to try `npm run dev` after UI edits.
4. Advice text is built from the real hand, never from fixed sentences tied to a table row. Any change to wording must keep it true for every hand (the audit script checks this).
5. Be honest about ambiguity: when the post and sheet disagree or a cell is unclear, pick the cautious reading, mark it Unconfirmed/Unstable, and tell the user in one line.

## How to talk to this user
Short answers, plain words, lead with what changed and what is still uncertain. One question at most, at the end. They like numbered/itemized replies to numbered suggestions, and they approve or reject each item, so implement exactly the approved items. They do not want code pasted unless they ask for a snippet. They read results on a phone-sized screen sometimes, so keep tables small.

## Where the logic lives (quick map)
See `sidekick-helper-source-sync/references/data-model.md` for the full model. In short: `PATTERNS` (a table of combos with a deploy cap, tier, status, note and a plan key) + `PLAN` (target levels per key) + `evaluate(deploys, slots, short, fcOnly, levels)` which returns `{ kind: 'go'|'stop'|'restart'|'warn', title, lines, targets }`.
