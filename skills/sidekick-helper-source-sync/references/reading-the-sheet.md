# Reading the post tables and the sheet

## Strings and columns
- A combo string is three ranks in **Red, Black, Yellow** order. `BSA` = Red B, Black S, Yellow A. Verified: in every table the letter S sits in the slot of the column it is listed under (a test checks this).
- Columns "S Red / S Black / S Yellow" say which color is the **S10** (the S you level to 10 first). For a single-S hand that is simply the S. For a double S it is the first S you max.
- `E`, `D`... are ranks (S > A > B > C > D > E). An empty slot ("standby") is lower than E.

## Cell notation
| Cell | Meaning |
|---|---|
| `any SS` (blue) | double S with any third rank (write out SSE, SES, ESS as needed; the third slot must hold at least an E) |
| `SS+C` | double S whose third unit is C or better |
| `SSD / CSS` | two alternatives in one cell |
| `-` | no combination |
| `?` | unknown or untested. Skip it, or add as `unconfirmed` |
| yellow fill | "Unstable Combinations" (tight timing). Use status `unstable` |
| blue fill | "Double S required" |
| `*` | extra caution in the notes under the table (tight, cleared with seconds left) |
| red text, "see below" | an explanation block under the sheet (S-Black rules) |
| `Final Upgrade 10 + 9` | level plan: S10, then the second unit (A or second S) to 9. Three numbers add the third unit's level |

## Deploy caps
"Total Deploys" (sheet) / "(N Deploys / Wave W)" (post) is the **maximum** deploys to hold that combination. Getting it earlier is fine and says to stop deploying. A hand passes when it reaches the combo within that many deploys. The wave label is informational only; the app counts deploys.

## Dominance
A hand passes if every slot is at least as good as the listed combo. So the tables list only the lowest combos found. `SDA` stopped needing a row once `SEA` was listed, because `SDA` beats `SEA`.

## Sheet-only versus post-only
The post prints the main tables; the sheet is consolidated and adds rows (8, 9, 11, 12 deploys, 4-deploy any SS, the Black-column rows, the S-Black level 5 strategy). When they disagree, the sheet screenshot is newer. Note any disagreement to the user.

## S-Black rules (sheet, red text and the black box)
- S10 on Black has fewer records. Rows for it live in the Black column (SSD*/CSS at 6, SSD/CSS at 7, SSC at 8; after that use the 10-deploy table).
- If the first S is Black and obtained within 5 deploys and it is not a winning Black hand: level it to just 5, keep deploying; if another S arrives before deploy 10, max that color to 10 instead and put the rest back into Black. Ignore if only settling for Wave 10.
- If S-Black is already level 10, the Red/Yellow "any SS" rows no longer apply; only the Black-column rows do.
