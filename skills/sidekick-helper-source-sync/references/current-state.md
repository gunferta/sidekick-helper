# State of the sources the app was last synced to
Previous valid-combinations code baseline: **2026-10-10**, corresponding commit **3c8c14c** ("Updated with Oct 10th data"). The latest valid-combinations changes are applied in the working tree on **2026-10-19**; they are not committed.
At the previous sync, Reddit post: **Edit10**. Sheet changelog: through **10/10 7:02 AM**.
Latest supplied chart screenshot: captured **2026-10-19** (`update-folder/`). Its latest dated changelog entry is **10/18 9:03 AM**. These source changes are now reflected in the working tree.

## Implemented (cap = max deploys)
- 3: SBB (unstable, RNG), DAS (unstable, 3s left, level Yellow > Black > Red).
- 4 (S10 + A10 + 2, all unstable): SAE, ASE, CSA, AES; any SS (S10 + S10 + 2).
- 5 (S10 + A10 + 1): SEA, ASD, BSA, DAS; SAE and AES unstable.
- 6 (10 + 9): SAC, SCA, ASB, ACS, BAS, BSA (unstable); any SS Red/Yellow; Black column SSD* (unstable), CSS.
- 7 (10 + 8): SAB, SBA, ASA, ABS, BAS; any SS; Black column SSD, CSS.
- 8 (10 + 7): SAA, ASA (unstable in Black column), AAS; any SS; Black column SSC.
- 9 (10 + 6): Red SSD / SCS; Yellow SCS. SSC is no longer listed.
- 10 (10 + 5): Red SSC / SBS; Black SSB / BSS; Yellow BSS / SBS.
- 11 (10 + 3 + 1): Red SS+A (`SSA`, `SAS`); Yellow ASS. 12 (10 + 2): SSS.
- Wave 10: SDD (cap 14, "maxing S Red is enough"), BSB (8), BDS (8, star), DBS (8).

## Judgment calls and open questions to re-check on the next update
1. Yellow's Wave 10 deploy cap is assumed 8 (post only says Black 8, Red about 14).
2. The post's 4-deploy table lists CAS under Yellow but the sheet shows "-"; the current 5-deploy table lists Yellow `DAS`, not CAS. `DAS` dominates `CAS`, so CAS still passes by dominance. The distinct 3-deploy DAS result is unstable; from 4 deploys onward the confirmed 5-deploy row supplies the plan/status.
3. SSD* at 6 is tighter than SSD at 7, but the 7-deploy Black row covers 6 deploys too, so the app uses the 7-row plan (S10 + S8) for SSD at 6.
4. "?" cells (Black at 9, Black at 11) are skipped. "EAS unknown" is not claimed. The "Yellow ESS clears with 7s left" note is not attached to a row.
5. The sheet's S-Black "level 5" strategy is applied by default; it says to ignore it if only settling for Wave 10, and the advice text says so.
6. Post text says the 7-deploy SS rows work up to 8 deploys; the sheet's 8-deploy Black cell says SSC. The app follows the sheet.
7. The 11-deploy `SS+A` entry is expanded to its minimum Red-S hands (`SSA`, `SAS`); Yellow `ASS` is recorded separately. Dominance also covers better ranks in the same slots. The verify script reports arrangement-only inversions `SSD` → `SDS` at 9 and `SSC` → `SCS` at 10; these are informational and should not be filled in without source evidence.
