# State of the sources the app was last synced to
Reddit post: **Edit10**. Sheet changelog: through **10/10 7:02 AM**.

## Implemented (cap = max deploys)
- 3: SBB (unstable, RNG), DAS (unstable, 3s left, level Yellow > Black > Red).
- 4 (S10 + A10 + 2, all unstable): SAE, ASE, CSA, AES; any SS (S10 + S10 + 2).
- 5 (S10 + A10 + 1): SEA, ASD, BSA, CAS; SAE and AES unstable.
- 6 (10 + 9): SAC, SCA, ASB, ACS, BAS, BSA (unstable); any SS Red/Yellow; Black column SSD* (unstable), CSS.
- 7 (10 + 8): SAB, SBA, ASA, ABS, BAS; any SS; Black column SSD, CSS.
- 8 (10 + 7): SAA, ASA, AAS; any SS; Black column SSC.
- 9 (10 + 6): SCS; SSC as Unconfirmed (the sheet lists Red "SS+C", only SCS was found).
- 10 (10 + 5): SSB, SBS, BSS. 11 (10 + 3 + 1): SSA. 12 (10 + 2): SSS.
- Wave 10: SDD (cap 14, "maxing S Red is enough"), BSB (8), BDS (8, star), DBS (8).

## Judgment calls and open questions to re-check on the next update
1. Yellow's Wave 10 deploy cap is assumed 8 (post only says Black 8, Red about 14).
2. The post's 4-deploy table lists CAS under Yellow but the sheet shows "-"; CAS is covered anyway by the 5-deploy row.
3. SSD* at 6 is tighter than SSD at 7, but the 7-deploy Black row covers 6 deploys too, so the app uses the 7-row plan (S10 + S8) for SSD at 6.
4. "?" cells (Black at 9, Black/Yellow at 11) are skipped. "Red SS+C might still work" at 10 and "EAS unknown" are not claimed. The "Yellow ESS clears with 7s left" note is not attached to a row.
5. The sheet's S-Black "level 5" strategy is applied by default; it says to ignore it if only settling for Wave 10, and the advice text says so.
6. Post text says the 7-deploy SS rows work up to 8 deploys; the sheet's 8-deploy Black cell says SSC. The app follows the sheet.
7. One known color-order inversion from sparse data: SSA passes at 11 while SAS (not listed) does not.
