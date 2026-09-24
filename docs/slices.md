# Ghép Chữ / Word Blocks — Slices and Status

**This file is the source of truth for where the project stands.** It is updated at every
gate, not at the end. If a session is killed, this file plus `CLAUDE.md` is what the next
one reads.

Companion documents: `decisions.md` (what is closed), `development-process.md` (how the
squad works), `spike-results.md` (what was measured).

---

## Status

> ### 2026-09-24 — **SLICE 4 IS BUILT. SHE CAN ADD, EDIT AND DELETE A WORD, AND AN INTERRUPTED SAVE CANNOT COST HER ONE.**
>
> `ui.md` §13, `acceptance-criteria.md` §J / §K / §L, X7 / X8 and I12, against revision 5.
> **She types a word and the app derives the rest**: `letters` and `onsetLetterCount` are
> written by the editor and never composed at runtime (`content-pipeline.md` §3.7, E19).
>
> | | State |
> |---|---|
> | `bash scripts/check.sh` | **ALL GREEN.** `npm test` **385/385** (was 320) |
> | The editor's model | `src/editor/` — pure, Node-tested, no React and no filesystem. `model.mjs` is the **only** file in it that names both languages; `vi.mjs` and `en.mjs` each see one (R4) |
> | The fixture nobody can weaken | **all 47 `vi-seed` and all 40 `en-seed` decompositions are re-derived from the spelling alone** — the triple, the letters *and* the stored boundary — by a module written months after the content. Weakening the test means changing the content |
> | The parse never places a mark | a candidate is an onset's **stored** glyph beside a rime's **stored** `toned[tone]`. `tone.mjs`'s placer is reached only when that fails, to write §13.3's sentence and to seed the six forms she then corrects (K3, K4, K5) |
> | `gì` | **works, and carries `build.spellingException`.** The onset `gi` and the rime `i` share one `i`; the letters are `g` `i` and the rime is not visible in them, which is exactly why the boundary is stored. The same rule reads `giêng` |
> | Atomic writes | `packStore.mjs` is written against a **nine-function port** so the guarantee can be executed. `test/editor-store.test.mjs` **kills the write halfway, kills it between the write and the rename, and kills the second save with the first on disk** — the previous words survive every one, byte for byte |
> | L5 | the trash entry is written **before** the live word is removed, so a kill mid-delete leaves the word *fully present*; the stale entry is not offered and is swept at editor open |
> | X7 | **new — the validator now enforces the six-letter cap.** A pack carrying a seven-letter word used to validate clean while the app withheld the word, so the only signal she got was a word that stopped appearing. Poisoned: **1 error, exit 1**; with the rule deleted, **exit 0** |
> | X8 | the *Too long for the board* screen draws the strip **to scale with the seventh letter past the board's edge**, and the word is saved with its picture and recording under *Chưa chơi được* |
> | Driven in Chromium | 430 × 932, 360 × 640 and 834 × 1194: the list with 47 thumbnails and decompositions, the confirm-the-taps screen (`c h │ o │ ◌́` — **4 lần bấm**), too-long, two-syllable, unknown-rime, off-alphabet, add-a-rime, delete → toast → undo, and the **preview board** with her word live. `Word Blocks` reads in full in the top bar |
> | **J11 + J14 together** | she saved and deleted and restored a word mid-build and **came back to the same board with `c` `h` still on the strip**. `createSession({ build })` walks the prefix through the **new** tree and keeps the part it can |
> | Fault injections | **21, every one exit 1**, and **three were MISSED on the first pass**: an `over` flag that had become dead code and proved nothing, a second tone-mark placer written with `'\u0301'` as an **escape** that the combining-character audit walked straight past, and a top-bar test whose arithmetic modelled a stylesheet it never read. All three gates were fixed and then bit. The 21 are 18 code injections, the same second placer written with the literal mark instead of the escape, an `inventoryOrder` made to follow the word list (L7), and a pack carrying a seven-letter word (X7: **1 error, exit 1** with the rule, **exit 0** without) |
> | Two defects the browser found that no test could | the **undo toast rendered inside the scroll view**, 4,359 pt down a 47-word list — a toast she would never see; and `undoRemove` **restored the word inside a `setToast` updater**, which is the exact anti-pattern `development-process.md` §3 names. Updaters stay pure |
> | `acceptance-criteria.md` C12 | **arithmetic corrected.** It said `chó` is six taps and `bò` four; under revision 5 they are **four** and **three**. The point it makes is untouched |
> | The top bar | **`Word Blocks` no longer truncates.** The title had `flex: 1` and the 32 pt gate-dot column had `flex: 1`, so the slack was split in two and the title got **74 pt** against the **81.4 pt** the text measures at 13 pt in Be Vietnam Pro Medium. `test/topbar.test.mjs` measures both mode titles from the shipped font file against the box the component gives them, on every served viewport |
> | Stale criteria found, **reported not absorbed** | **J1** names Baloo 2, which is not the shipped face; **K11 / K11a / §13.5 are unbuildable as written** — see below; **J5**'s "real game tiles" are no longer board cells |
> | **K11 is blocked** | *"one tap appends the character to its run in `inventoryOrder` and the word becomes playable on every device"* cannot hold in revision 5. §13.5 says the screen fires **only** for a character outside the alphabet (`f j w z`, a digit, punctuation) — and `content-pipeline.md` §3.7 makes `inventoryOrder.letter` an **error** for exactly those. The alphabet is a code constant in `src/engine/rules.mjs` and `tools/lib/rules.mjs`, not pack data. **Built: the screen names the character, draws it flat, and saves the word under *Chưa chơi được*.** The add is not offered, because it cannot work. Recommendation: restate K11 as informational for revision 5, or make the alphabet pack data — which is a content-engineer decision, not this slice's |
> | J15 | *"never offered again automatically"* outlives the session she declined it in: `cheerOffered` is a **setting**, not component state. `src/settings/settings.js` still declares scalars only, and its own citation was corrected — it pointed at a test file that does not exist |
> | **Not verified** | **still never run on a real device.** The camera, the photo library and the microphone are `expo-image-picker` and `expo-audio` on native and are **stubbed in the browser build** — J3's picker and J7's recording are the two things Tier 3 cannot say anything true about |
> | Recorded limitation | a rime she adds has **no đánh vần clip**, so the state it creates is silent until one exists (`content-pipeline.md` §5's documented degradation). `ui.md` §13 does not ask the editor to record tile audio |
>
> **One deviation, recorded rather than smuggled.** The editor **folds the typed word to
> lower case** at the boundary, once (`src/editor/shared.mjs`). `letters`, `tiles` and the
> English `letters.join('') === text` identity are all lower case and all hard errors in
> the loader, so a capital she types would make her own word unplayable. D24 forbids
> *upper*-casing what she typed and is untouched; she sees the folded form on the very next
> screen.

> ### 2026-09-24 — **`src/` IS REBUILT TO DESIGN REVISION 5. THE BOARD IS THE ALPHABET AND IT PLAYS.**
>
> The app half of revision 5, against `literacy-vi.md` §0, `literacy-en.md` §0, `ui.md` §0C
> / §7.2 / §8.2 and `acceptance-criteria.md` §0D / §X / §W5. **Input is letter by letter;
> the model is đánh vần.** `chó` is `c` `h` `o` sắc — four taps, two sounds, five chant
> beats.
>
> | | State |
> |---|---|
> | `bash scripts/check.sh` | **ALL GREEN.** `npm test` **320/320** (was 292), both pack validators, the validator suite, the contrast sweep, the layout sweep, the bundle freshness check |
> | `src/layout/layout.mjs` | **Revision 5 ported.** `stripCellH` / `stripCellW` / `stripRowW` / `stripCells`, the restated **F4** and the new **F15 / F16 / F17**, runs `VI_RUNS [29,6]` and `EN_RUNS [26]`. `test/layout-parity.test.mjs` is green: **16 assertions restated** to the measured revision-5 figures |
> | A defect found in the Tier-4 tool | `tools/layout-sweep.mjs`'s **`orientationOK` still held revision 4's runs** `[26,35,6]` / `[26,10]` while the sweep below it used revision 5's. The app reads `orientationOK` for P7/P8, so rotation would have been decided against a 67-cell board that no longer exists. Fixed by moving `VI_RUNS`/`EN_RUNS` above it and exporting them; **the sweep still exits 0** |
> | The engine | `word.letters` + `word.onsetLetterCount` are **validated and turned into spans once, at load** (`src/engine/spans.mjs`). **The onset/rime boundary is read from the stored triple and never from the letter stream** (C4f) — the test that proves it is `gi`/`qu`, where a first-vowel rule gets both wrong |
> | Tap audio | **Keyed by unit-state**: `tiles` first, then `prefixAudio`. `c` says `cờ`, `h` then says **`chờ`**, superseding it; `s` then `h` says **/ʃ/**. Driven in Chromium: the second tap fetched the `sh` blob, not `h`'s |
> | Undo | **The whole strip, one symbol per tap** (D4/E8/E9/C10/C11), and the clip is **what is left** — `cho` · `chờ` · `cờ` · nothing. `tapStripCell` is gone from the reducer |
> | The strip | Rewritten: six slots sized once, **one bar per sound**, the boundary marked three ways (break, pattern, 2 pt divider), the dashed next-cell and the dashed mark-slot, **M22 / M23 / M24**. Cells never merge while building; the only merge left is chant beat 3 |
> | Q11 / Q12 / Q12a / Q13 | **New font gates, measured on the shipped file**: `A`–`Z` is 26/26 in both bundled faces, the widest capital is **`W` at 1.039 em** against the **1.231 em** the floor's 48 pt strip cell over its 39 pt glyph tolerates (7.5 pt of slack), and `FIXTURE.txt` is asserted to carry **only** the seven unmarked uppercase Vietnamese letters — which is what makes Q13 a gate rather than folklore |
> | The chant | **A beat lights a SPAN.** `chó` beat 1 lights `c` and `h`; `ship` beat 1 lights `s` and `h`; `egg` beat 2 lights both `g`s |
> | Q7 | **English glyphs are UPPERCASE.** One pack field — **`display.glyphCase`**, the content-engineer's name and shape (E22, `content-pipeline.md` §3.8) — read once at load through the same `readGlyphCase` the validator uses, and applied at **one** place in the glyph component. **No `toUpperCase()` in any component** (D21, audited). Vietnamese is refused uppercase with a reason (D18, Q13) |
> | One difference with §3.8, reported not absorbed | its table says the app **obeys** `vi` + `upper` and only the validator objects. **AC D18 says no Vietnamese glyph is ever rendered uppercase anywhere in the app**, so the app refuses it and logs an error his mother can read. The two agree the pack is wrong; they differ only on what is drawn, and this builds to the numbered criterion |
> | Driven, not asserted | Chromium at **430 × 932** (both languages), **360 × 640** (paged `[15 ¦ 14 ¦ 6]`, rail of 3) and **834 × 1194** (35 cells, 5 × 7, no rail): a word made, chant beat 3 caught mid-flight, the photograph shown, `SHIP` uppercase on the reveal, nothing scrolling or clipped at either extreme |
> | Fault injections | **16 app-level faults, every one now exit 1 — and two of them were MISSED on the first pass**, which is the process working: the boundary injection was a no-op patch that proved nothing, and nothing anywhere tested a seven-letter word. Both got a real check (`gi`/`qu` in the strip, and a `tooManyLetters` hostile case) and both then failed. The superseding sound, the stored boundary, one-span-per-letter, undo's clip, the chant's span, a `toUpperCase()` in a component, the casing field ignored, Vietnamese allowed uppercase, M22 un-anchored, M23 flattened, a per-cell touch target, the board reverting to 26 onsets, a one-point drift from the tool, a seven-letter word let through, the engine reading a flat top-level key instead of `display.glyphCase`, and a casing typo throwing instead of degrading. Plus **F17 in the tool** (`VI_MAX_LETTERS` 5 → 7): **exit 1, 12 failures**, first at `360×600 pages 15,14,6` |
> | **Not verified** | **Still never run on a real device.** U23 — *does the superseding sound read as joining or as the app changing its mind?* — is the one thing revision 5 cannot verify below the owner. The eight rime-prefix clips still owe a human listen |
>
> **One documentation slip, reported not absorbed.** `acceptance-criteria.md` C12 says "`chó`
> is six taps and five beats, exactly as `bò` is four taps". By its own model those are
> **four** and **three** — letters plus one tone — and C4e and `literacy-vi.md` §0.11 (3–6
> taps, mean 4.08) agree with the code. The point C12 is making is untouched; the arithmetic
> in the prose is wrong.

> ### 2026-09-23 — **THE CONTENT PACKS ARE REBUILT TO DESIGN REVISION 5.** The board is the alphabet.
>
> The owner played revision 4 and said the character table "feel really random and
> un-organized and doesn't give my son a sense of character order", then specified the
> standard alphabet with a digraph entered **letter by letter** — *"Choose C and choose H"*.
> **đánh vần is unchanged**: `ch` is two taps and still one âm đầu. `literacy-vi.md` §0 and
> `literacy-en.md` §0 are the design; this is the content half of it, and the app half is
> **not done**.
>
> | | State |
> |---|---|
> | `packs/vi-seed` / `packs/en-seed` | **Rebuilt and valid, exit 0.** `inventoryOrder` is `{letter, tone}`; the retired `onset`/`rime`/`digraph` runs are gone; both tile inventories are in dictionary order; every word carries a derived `letters` (+ `onsetLetterCount` in Vietnamese) |
> | Tone order | **`ngang huyền sắc hỏi ngã nặng`** — the set phrase, the **owner's** answer to `open-questions.md` Q11, asked directly. It shipped as frequency order |
> | Audio | **9 new Vietnamese clips**, 600–840 ms, all decode-clean: the onset state `pờ` and eight rime prefixes `ac an ă ăn â uô ư ưn`. `q` reuses the `qu` blob. **Nothing retired. English needs none** |
> | **Owed: a human listen** | the eight rime-prefix clips (`literacy-vi.md` §0.9). Several are not real Vietnamese syllables read level, and `ă`/`â` are voiced `á`/`ớ` at confidence `check` |
> | Validator | **100 cases** (was 62). 38 new, every one seen to fail first; seven rules were deleted in turn to confirm the new cases test their rules and not the weather |
> | Size | **+54.6 KiB to `vi-seed`, +1.6 KiB to `en-seed`** — +0.6 % and +0.02 %. `content-pipeline.md` §10 |
> | **Glyph casing (E22)** | **`"display": { "glyphCase": "upper" \| "lower" }`** — top-level, beside `media`. `en-seed` **upper** (the owner's answer to `open-questions-ui.md` Q7), `vi-seed` **lower**. Generated, not hand-written. `content-pipeline.md` §3.8 |
> | Casing severities | absent → nothing; an unrecognised **value** → warning, pack still valid (AC D23); a malformed **shape** → error. `vi` + `upper` → **error**, until `assets/fonts/FIXTURE.txt` covers the 55 marked capitals `vi-seed` would need (AC **Q13**) — the gate is a computation and lifts by itself when the fixture is extended |
> | Bundle | `assets/packs/index.js` regenerated. The gate's staleness check is the defect that made the owner see emoji instead of photographs |
> | **Licensing predicate** | **`tools/lib/licence.mjs` is now the only place this project answers "what does this licence oblige".** `pack-validate.mjs` and `pack-attributions.mjs` had disagreed on the same two public-domain photographs — one passing the pack, the other refusing to publish it. Both import it now. A public-domain work with no author passes; a CC BY / CC BY-SA / GFDL one still fails hard; an **unrecognised** licence is treated as requiring credit |
> | `ATTRIBUTION.md` | **Both regenerated.** They still said *"No third-party photographs in this pack yet"* while 269 curated photographs were in the packs — a licensing claim that was simply false |
> | ~~**Not done — the app**~~ | **DONE, 2026-09-24** — see the block above. Liveness over letters, the strip's boundary marker and the unit-state tap audio are built, and `display.glyphCase` is carried in both manifests for Q7 (the field is the content-engineer's — `content-pipeline.md` §3.8 / E22 — and the app reads it through the same `readGlyphCase`) |
>
> ~~**`bash scripts/check.sh` is NOT green in the working tree**~~ — **it is green as of
> 2026-09-24**: `src/layout/layout.mjs` now carries revision 5's law and the two failing
> layout-parity assertions were restated to the measured figures, along with fourteen others
> that still compiled and asserted revision 4.

> ### 2026-09-23 — **DESIGN REVISION 5 IS ISSUED. `src/` IMPLEMENTS REVISION 4 AND `npm test` NOW FAILS BY DESIGN.**
>
> The owner played the revision-4 build: *"the characters being displayed feel really random and
> un-organized and doesn't give my son a sense of character order"*, then *"for character
> combining, he will still going through character by character, even for combine ones like ch,
> tr (Choose C and choose H)"*. `literacy-vi.md` §0 and `literacy-en.md` §0 settle the model
> (**letter-by-letter input, đánh vần unchanged**); `ui.md` §0C and `acceptance-criteria.md` §0D
> are the design half.
>
> | | State |
> |---|---|
> | `ui.md` / `acceptance-criteria.md` | **Revision 5.** 445 numbered criteria (was 351), no duplicate ids, 30 Tier-5 questions. **New group §X, the word strip**, 40 criteria. **§W5** lists 23 restated ids — those are the ones that still compile and now mean something else |
> | `tools/layout-sweep.mjs` | **Exit 0.** Runs are `VI [29, 6]` and `EN [26]`; **10 layout rules and 6 plan rules** (F4 restated, F15, F16, F17 new). 34,463,217 layouts + 982,566 page plans, **491,283 served** (up from 489,675) |
> | `tools/theme-contrast.mjs` | **Exit 0.** role1/role2/role3 re-mapped to **consonant / vowel / tone**; **the first CVD-gated check in the tool** (consonant vs vowel, dE00 ≥ 20, worst measured 23.7). 132 gated checks, 2 logged |
> | **Measured paging, not predicted** | **iPhone 17 Plus: VI 3 pages `[15 ¦ 14 ¦ 6]` at 3×5, tile 101 pt (A) / 104 (B); EN ONE page, 26 cells, 4×7, NO RAIL.** The 360×640 floor goes 7 pages → 3. **93% of served combinations need no rail** (was 60%) |
> | The word strip | **Priced for the first time.** Six cells, 58 × 90 on his device, 48 × 61 at the floor. Costs **970 of 492,253 served combinations (0.20%)**, all of them 118 pt-side-inset shapes |
> | Fault injections | **Four, all exit 1**: F17 (`VI_MAX_LETTERS` 5→7), F15 (strip width cap removed), ADJACENT CVD (gate 20→25 fails at 23.7), the boundary divider in `hairline` (1.30–1.38:1) |
> | `npm test` | **FAILS: 2 of 18 in `test/layout-parity.test.mjs`** — *"the app layout law is identical to the tool"* and *"V4–V8 the page plan and the fixpoint are identical to the tool"*. **This is correct.** `src/layout/layout.mjs` is revision 4 and does not carry `stripCellH/stripCellW/stripRowW/stripCells`, F15/F16/F17, or the new runs. The test is doing exactly its job: it is the file that says `src/` is behind the design |
> | Slice 3 (the board) | **Must be rebuilt to revision 5.** `src/engine/table.mjs`, `src/layout/layout.mjs`, `src/ui/CharacterTable.js`, `src/ui/PageRail.js` and the strip component all change; **`src/engine/`'s word representation must NOT change** — `(onset, rime, tone)` is the model and the parse comes from it (`literacy-vi.md` §0.5) |
> | Packs | **The content-engineer is rebuilding them in parallel** — `inventoryOrder` becomes `{letter, tone}`, a derived `letters` array and `onsetLetterCount` are added, the tone order is corrected, and **9 new Vietnamese clips** are needed (`literacy-vi.md` §0.12). Both packs are currently revision-4 shaped |
> | **Q7 answered by the owner** | **English glyphs are UPPERCASE — `A B C D`** — against the game-designer's lowercase recommendation. **Vietnamese stays lowercase and must**: `mả`/`mã` is 34 px apart at 36 pt and marks on capitals compress that. Specified as a **pack-level casing field** (`ui.md` §8.2, E22, AC D17–D24) — **no `toUpperCase()` in a component**, and reversing it is one field in `pack.json` |
> | Uppercase, measured not assumed | `A`–`Z` is **26/26 in both bundled faces**. Widest glyph `W` = **1.039 em**, against a tolerance of **1.231 em** derived from the floor's strip cell. Fits everywhere; tightest slack **7.5 pt**. **Injection at 1.25 em exits 1**, overflowing the floor's strip cell — so the check discriminates. `ui.md` §6.1a records that **the Q-series does NOT gate Vietnamese uppercase**: the fixture carries 7 uppercase Vietnamese letters, not the ~130 marked capitals |
> | `gameplay.md` | **Revision 5, new §0C.** §4.4 rewritten: **undo is the whole strip, one symbol per tap.** This closes a contradiction that shipped in three documents for two revisions — `ui.md` §2.2 said whole-strip since revision 3 while §7.2, `gameplay.md` §4.4 and criteria D4/E8/E9/C10/C11 said per-cell. **Settled by arithmetic**: five 72 pt cells need 392 pt and the 360 dp floor has 328 |
> | **Not verified** | **Still never run on a real device.** U23–U27 are new Tier-5 questions and U23 — *does the superseding sound read as joining or as the app changing its mind?* — is the one revision 5 cannot verify below the owner |

> ### 2026-09-23 — **SLICES 2 AND 3 ARE REBUILT TO DESIGN REVISION 4.** `src/` no longer implements revision 2.
>
> The owner played the built app (Tier 5), reported four findings, and then answered the one
> question revision 3 asked him by proposing the remedy himself: *"he will use an iPhone 17
> plus now, if the screen is too small, maybe paging the table probably do it"*. Revisions 3
> and 4 of `gameplay.md` / `ui.md` / `acceptance-criteria.md` are those two corrections. This
> is the build that matches them.
>
> | | State |
> |---|---|
> | `bash scripts/check.sh` | **ALL GREEN.** `npm test` **291/291** (was 233), both pack validators, the validator suite, the contrast sweep, the layout sweep, the bundle freshness check |
> | `test/layout-parity.test.mjs` | **Green.** It was the file that said `src/` was still revision 2. The app now carries the whole revision-4 law — `gridFor`, `pagePlan`, `planFor`, the rail and the fixpoint — swept field-by-field against `tools/layout-sweep.mjs` |
> | The morphing band, the `∅` socket, the stage ladder | **Deleted.** `src/engine/stages.mjs` is gone; `globalStage`, `stageProgress` and the assist counter are gone from the session, and `checkInvariants` now **fails** if any of them comes back |
> | The constant table | `src/engine/table.mjs` — one flat sequence, every character in a permanent `(page, slot)`, a pure function of `inventoryOrder` and the device |
> | Paging (§V, 35 criteria) | `src/ui/CharacterTable.js` slides one sheet by `translateX`; `src/ui/PageRail.js` is the rail, made of the same `Tile`. Auto-advance is in the **reducer** (`settlePage`), so V12–V15 are Tier-1 facts rather than choreography |
> | The accumulating chant | Five beats, each carrying **the strip as it must look at that beat**. Driven in a browser: the strip reads `b` → `b o` → `bo` → `bò`, which is the owner's sentence |
> | Audio | One SPEECH channel that cuts hard. `src/audio/channels.mjs` is the rule, **platform-free**, driven in Node by `test/audio-channels.test.mjs`; `engine.js` is four lines of `expo-audio` |
> | Language switch | Parent menu **row 2**, one tap, the chooser reused, a hard stop ≤120 ms, the album kept per pack, the gate's 180 s grace held **above** the teardown |
> | `en-seed` | **`q` is on the board** — 26 letters + 10 digraphs = 36 (D1a/D1b). Its two clips came from the owner-approved `samples/audio/en-final`, `short` 624 ms, inside E15's budget |
> | Driven, not asserted | Chromium at **430×932 and 440×956** (the device, both candidate sizes), iPad 834×1194, the 360×640 floor, both languages: a word made, the picture shown, the gate answered, the language switched and switched back, no scroll, no clipping |
> | **Not verified** | **Still never run on a real device.** Everything above is Node + Chromium. Tier 5 is owed, and U9a (does it *sound* right) can only be the owner's |
>
> **One AC conflict, reported not absorbed: F7 versus P7.** Paging made a **landscape**
> 430×932 phone pass the fit rule (5 pages, 18 per page, 9×2 at 72 pt), which revision 3's
> truncated board never could. `gameplay.md` §2.1 says an orientation is served *iff the fit
> rule passes*; **P7 says a phone is locked to portrait**. Both cannot hold on the owner's own
> device. P7/P8 are the numbered criteria, so `orientationPolicy` implements them, with the
> extra clause stated in the design's own terms rather than as a device list: **rotate freely
> iff the portrait board needs no rail** — which is `gameplay.md` §3.5's definition of a
> tablet. If the game-designer would rather serve landscape phones, it is a one-line change.

> ### 2026-09-23 — THE CORE MECHANIC WAS CORRECTED, AND SLICES 2 AND 3 WERE REBUILT AGAINST IT.
>
> The owner restated what he asked for in his first message: the app must **show a table of
> characters**, let the child **build a word character by character**, **disable characters that
> cannot lead to a word** (including at the first position), and **announce** when a word forms.
> The picture is the **reward**, never the prompt. Revision 1 did the opposite — it picked a
> target, showed its veiled photograph and offered a palette built for that target.
>
> **Design was re-issued as revision 2** by the game-designer, verified by the orchestrator, and
> **the engine and the board have now been rebuilt to it.**
>
> | | State |
> |---|---|
> | `gameplay.md`, `ui.md`, `acceptance-criteria.md` | **Revision 2.** 269 criteria + 14 Tier-5 questions + 24 withdrawn groups |
> | `tools/layout-sweep.mjs` | Rewritten for the character table. **Exit 0** — 10,358,248 layouts |
> | `tools/theme-contrast.mjs` | Extended. **Exit 0**, 34 pairs × 3 themes; the emitted tokens are byte-identical to `src/theme/tokens.json` |
> | `bash scripts/check.sh` | **ALL GREEN.** `npm test` 233/233, both pack validators, the pack-validator suite, the contrast sweep and the layout sweep, one exit code |
> | Slice 2 (engine) | **Rebuilt.** `src/engine/tree.mjs` is the prefix tree; `round.mjs` is deleted; `session.mjs` and `stages.mjs` are rewritten |
> | Slice 3 (the board) | **Rebuilt and driven.** Strip + character table + shelf + album; the reveal is a full-screen overlay |
> | Content packs | **Unchanged and still valid** — but see defect 10 below, which the rebuild surfaced |
>
> **What was deleted, not reimplemented** (`gameplay.md` §0.5): round generation, the word bag,
> the target, the found-word win, the not-a-word settle, the assist ladder, the five-round page,
> the picture frame, the veil, the segment border, the page rail and the caption strip. The three
> most intricate states in the engine are gone.
>
> **The tile face is now Be Vietnam Pro** (`decisions.md`, *Tile typeface*). Baloo 2 stays
> bundled and `src/ui/typography.js`'s `FONT.tile` is the one line that reverses it;
> `test/font.test.mjs` reads that line, so the whole Q-series re-runs against whichever face is
> wired in. Measured on the shipped file: 86/86 coverage, minimal pairs 513–545 px at 116 pt and
> 53–57 px at 36 pt against floors of 200 and 20.

> ### 2026-09-23 — FINDING 3'S ASSET HALF: THE ENGLISH CLIPS WERE 73% SILENCE.
>
> The owner: *"the sounds when picking English characters are not good enough, voices seem to
> be mixed up with each other."* The design half is `ui.md` revision 3 §11. **The asset half
> was E15 / AC N15 — `short` ≤ 700 ms — and it failed today.** Diagnosed by decoding, not by
> inference (`content-pipeline.md` §9.3a–c):
>
> | | |
> |---|---|
> | Cause | Microsoft's read-aloud endpoint pads **~285 ms before and ~1320 ms after every clip**, the same whatever the text. edge-tts adds none of it; **gTTS does not do it**, so `vi-seed` is untouched |
> | Why it was missed | the files are 48 kbps **CBR** — 144 B per frame regardless of content — so a bytes-per-frame envelope is flat by construction and reads as "sound all the way through" |
> | Fix | `tools/audio-trim.mjs`: **lossless** MP3 frame-boundary cut, so the bytes the owner approved by ear in round 3 survive. A cut orphans the first retained frame from Layer III's **bit reservoir**, so the tool emits **priming frames** carrying the exact missing history bytes. Falls back to tail-only, then to the original bytes, rather than ship a malformed clip |
> | **A defect found in review, and fixed** | the first version used a 2-frame *guard* instead. A guard protects *later* frames, not the first retained one, and **there is no free cut point**: `main_data_begin == 0` at frame 0 in all 140 clips and at **no later frame in any of them**. It shipped **29 of 70** clips emitting `part2_3_length too large for available bit count` **on their first frame** — the start of the letter sound. Sample comparison could not see it, because libmpg123 **conceals** an underrun. Now **0 of 70 and 0 of 110**, against the originals' 0 of 70, with **every duration unchanged** |
> | `en-seed` `short` | **1896–2832 ms → 576–1392 ms** (median 2184 → 768). `long` 2616–3768 → **1272–2328**. Word clips 2016–2352 → **672–1032**. Pack audio 1652 → **745 KiB** |
> | Generator | `gen-audio.mjs` trims at generation time, so this cannot come back by regenerating |
> | Gates | **Two, independent.** (1) duration, from the MPEG frame table, budget in the manifest — poisoned with a 2208 ms clip → **exit 1**. (2) **every clip must decode with no decoder diagnostics** — poisoned with an unprimed 768 ms cut, *inside* the duration ceiling → **exit 1**. Nine harness cases, each seen to fail with its own check removed. The decode gate covers `vi-seed` too |
> | **Still open, and the owner's** | **24 of 35 `short` clips remain over E15's 700 ms.** What is left is the sound itself, not padding. The levers are the **rate** (`+0%` measured: ~20 of 35 would pass) and the **text** (`sss` → `s`, the literacy-designer's). Neither pulled — `decisions.md` closed the voice and the rate, and he has rejected two rounds by ear |
> | **Not verified** | **whether it sounds better.** A duration is a proxy. Finding 3 is not closed until he has heard it (AC U9a) |

*Last updated: 2026-09-23 (Slices 2 and 3 rebuilt to design revision 4: the constant table, paging, the accumulating chant, one speech channel, the language switch). Earlier history:
all three design agents were killed mid-work by a weekly rate limit; what survived is catalogued
below and was verified by execution, not trusted.*

| # | Slice | State |
|---|---|---|
| **0** | Squad, spike, and approved design | **Revision 5, 2026-09-24.** Rewritten three times from the owner's device testing: r3 one constant table and no ∅ socket, r4 paging on his iPhone 17 Plus, **r5 the board is the standard alphabet and a digraph is spelled letter by letter over an unchanged đánh vần model**. Both design tools exit 0; F0/F12/F15/F17 each seen to fail when poisoned |
| **1** | Content pack: format, validator, seed pack with real assets | **Done.** 269 photographs across **89 of 90 words** (only `tô` has none); `inventoryOrder` is `{letter, tone}`; English audio re-cut 2184→768 ms median and decoder-clean; 222 credit-requiring images all credited incl. 8 GFDL; one licence predicate shared by both tools. Validator harness 100 cases |
| **2** | Engine: **prefix tree, live-set computation** | **Rebuilt for revision 5.** Liveness runs over **letters**; the onset/rime boundary is read from the stored triple and never inferred (`gì`, `qu`); a tap speaks the unit built so far, so `c` then `h` says `chờ`. Pure, fuzzed, deterministic |
| **3** | The game plays, both languages, on a real device | **Rebuilt for revision 5 and driven** in Chromium at 430×932 (both languages), 360×640 (paged, rail of 3) and 834×1194 (35 cells, no rail): the letter board, the span bar, the marked boundary, whole-strip undo, the superseding tap sound, uppercase English glyphs and the photograph. `npm test` 317/317; 14 fault injections, all caught. **Still not run on a real device — Tier 5 is owed.** Previously: **rebuilt for revision 4 and driven** in Chromium at 430×932, 440×956, 834×1194 and 360×640, both languages, including the language switch and the gate grace. Previously: **rebuilt for revision 2.** Chrome at iPad portrait + landscape, iPhone 393×852 and the 360×640 Android floor, both languages; five words to the album; the gate opens on a 1.2 s hold. **Not yet run on a real device — Tier 5 is owed.** Awaiting independent verification |
| **4** | The editor — add / edit / delete a word | **Built and driven in Chromium**, 430×932 / 360×640 / 834×1194, both languages: the list, the five-step add flow, the four help screens, add-a-rime, delete → 6 s toast → undo → Recently deleted, the preview board, and the cheer. `npm test` 385/385; **19 fault injections, all exit 1, three of them missed on the first pass and fixed**; the atomic-write law proved by killing a write halfway. **Not run on a real device — J3's picker and J7's recording are stubbed in the browser and Tier 5 is owed.** K11 reported blocked |
| **5** | Polish: motion, sound, accessibility | Not started. **Owed to the owner first:** a listen on the 8 new Vietnamese rime-prefix clips, and 24 English `short` clips still over the 700 ms target |
| **6** | Store readiness, iOS + Android | Not started. **Never run on a real device** — the picker, the microphone and a real mid-save kill are all unverified below Tier 5 |

### Slice 0 detail

| Item | Owner | State |
|---|---|---|
| Five agent definitions in `.claude/agents/` | orchestrator | **Done** |
| `development-process.md` | orchestrator | **Done** |
| Feasibility spike — audio and images measured | orchestrator | **Done** |
| Audio decided, three owner review rounds | orchestrator + owner | **Done** |
| Images decided | orchestrator + owner | **Done** — photo pipeline proven, Pexels key still optional |
| `literacy-vi.md`, `literacy-en.md`, `word-list.md` | literacy-designer | **Done** — verified by orchestrator |
| Stack, name, devices | orchestrator + owner | **Done** |
| Visual direction — 3 themes, Popsicle default | orchestrator + owner | **Done** — see `decisions.md` |
| `gameplay.md`, `ui.md`, `acceptance-criteria.md` | game-designer | **In flight** |
| `content-pipeline.md`, pack validator | content-engineer | **In flight** |
| `gameplay.md` (601), `ui.md` (1529) | game-designer | **Revision 2** — rewritten for the discovery mechanic; line counts verified |
| `acceptance-criteria.md` (466) | game-designer | **Revision 2** — 283 unique ids counted (269 + 14 Tier-5); 24 withdrawn groups in §W |
| `tools/theme-contrast.mjs`, `tools/layout-sweep.mjs` | game-designer | **Revision 2** — layout sweep rewritten for the character table, contrast sweep extended. Re-run 2026-09-23, **both exit 0** |
| `content-pipeline.md` (1044), `open-questions-content.md` (228) | content-engineer | **Done** |
| `tools/pack-validate.test.mjs` | content-engineer | **Done** — 50 tests, 50 pass, verified by the orchestrator |
| `pack-import-media`, `pack-attributions`, `pack-backup` | content-engineer | **Done** |
| **Owner approval of the full design** | orchestrator | **APPROVED 2026-09-23.** Delegated by the owner while AFK. Every agent claim was re-run by the orchestrator before approval: 223→227 ACs counted, `theme-contrast.mjs` and `layout-sweep.mjs` exit 0, `pack-validate.test.mjs` 50/50 |

**Slice 0 was closed, then re-opened and re-closed on 2026-09-23** by the mechanic correction
above. Design is complete and verified at **revision 2**; what was built in Slices 2 and 3 is
partly obsolete against it.

### What the killed agents left behind — verified by execution

| Artefact | State |
|---|---|
| `tools/pack-validate.mjs` | **Works.** Exit 1 on error, 0 on clean. Proven to fail on a pack broken on purpose (corrupt JSON → quarantine message) |
| `tools/build-seed-pack.mjs`, `gen-audio.mjs`, `tts.py`, `lib/media.mjs` | Present, produced real output |
| `tools/theme-contrast.mjs` | **Runs and FAILS: 8 failing pairs across 3 themes.** The agent died mid-tuning |
| `tools/fetch-candidates.mjs` | Absorbed `fetch-wiki-candidates.mjs`, which is why that file shows as deleted. `--lang vi` sources from vi.wikipedia.org as decided. **Not a loss** |
| `packs/vi-seed` | 50 words, 47 playable, 891 KiB audio, **0 images**. 1 content ERROR (below) |
| `packs/en-seed` | 40 words, 1.3 MiB audio, **0 images**, 20 warnings (silent tiles `zz`, `gg`) |

### Known defects — carry these forward

1. ~~`packs/vi-seed/words/ho.json` is linguistically wrong.~~ **FIXED.** The pack now reads
   `h` + `ô` + `hỏi`, `word-list.md` carries the correction inline, and the toneless blend
   audio was regenerated from "ho" to "hô". Both validators exit 0. *The status line stayed
   stale for several commits after the fix and was caught by the app-developer reading it —
   §7a exists precisely so that does not happen, and it happened anyway.*
2. ~~`theme-contrast.mjs` fails with 8 pairs.~~ **Fixed.** Exit 0 across 3 themes, and all
   nine owner role hexes ship unchanged — the fix moved the colour (white tile face, ink
   glyph, bright role bars) rather than darkening the palette to satisfy arithmetic.
3. **`Fredoka` cannot render Vietnamese — verified, blocking.** Google Fonts serves it with
   no `vietnamese` subset; its latin-ext skips `U+1EA0–U+1EF1`. Of 67 Vietnamese characters,
   **41 are missing**. Critically `ã` (U+00E3) is present and `ả` (U+1EA3) is not, so `mã`
   and `mả` would render in *different typefaces* — the exact correctness failure the font
   requirement exists to prevent. **Resolved: Baloo 2.** Five candidates were downloaded
   from upstream `google/fonts` and measured — coverage, vertical ink span, letterform,
   minimal-pair pixel margin, subset size. Baloo 2 takes it on 90/90 coverage, **single-storey
   `a` and `g`** (the letterforms a child is taught to write, which is the first criterion in
   a letter-teaching app), the tightest ink span at 1.017 em, and the largest `mả`/`mã` margin
   of the infant-form faces at 935 px. It subsets 683 KB → **117 KB** with no loss. Working in
   `ui.md` §6.0–6.0.1; gated by `acceptance-criteria.md` Q1–Q10.

4. ~~The validator under-reports a dangling image.~~ **Fixed.** A missing file is an error,
   with `DANGLING IMAGE` / `DANGLING AUDIO` tests. Resolution happens once at pack load, so
   the child never sees the failure and his mother always does: survivors are used, then the
   bundled emoji, and a word with nothing left is withheld from the round generator.
5. **The repository carries ~384 MB of curation scratch in its history.** Early commits
   used `git add -A packs`, which swept `.candidates/` — contact sheets and raw downloads —
   into history before it was gitignored. The working tree is clean and `.gitignore` now
   covers `packs/*/.candidates/`, so it cannot recur, but every clone pays for it.

   **Deliberately not fixed.** Purging it means rewriting pushed history and force-pushing,
   which is destructive and outward-facing, and is the owner's call rather than the
   orchestrator's. If he wants it: `git filter-repo --path-glob 'packs/*/.candidates/*'
   --invert-paths` then a force-push, with every clone re-cloned afterwards.

6. ~~**No images curated yet.**~~ **FIXED** — 269 photographs, 89 of 90 words. Both packs deliberately fail `--strict`, which now counts
   *photographs* rather than fallbacks. Candidate fetch is re-running with the licence fix.

7. **The validator demands an author for PUBLIC DOMAIN images.** A CC0 or public-domain
   photograph carries no attribution obligation, but `pack-validate.mjs` raises the same
   "no creator" error for it as for CC BY. It cost a good pile-of-oranges photograph under
   `cam` before this was noticed. The rule should apply to licences that actually require
   attribution, not to every third-party image.

8. **`pack-import-media.mjs --remove-image` removes the wrong image, and `--pick` appends
   rather than replaces.** Together these mean curation is not reversible: you cannot drop a
   picture you regret, and re-picking silently duplicates. Worked around by editing word
   files directly.

9. **The curation-yield report can exceed 100%.** `pack-validate.mjs` joins images kept
   (from the pack) against candidates offered (from the on-disk `.candidates/` directory).
   Delete a candidate directory and the join breaks: it printed
   `TOTAL 14 kept / 6 offered 233%` with an `unrecorded 11 kept / 0 offered` line, without
   complaint. **A statistic that can exceed its own maximum is not validated.** Two sources
   again (`development-process.md` §6a) — the honest fix is for the pack to carry what it
   needs rather than re-deriving it from a directory that is explicitly disposable.

10. **PUBLISHING BLOCKER (not for private use):** neither edge-tts nor gTTS grants the right
   to redistribute generated audio inside a product. Cheap to close, because a recording and
   a generated clip are the same object in the schema — but it must be closed *before* any
   store submission. `open-questions-content.md` C4.

11. ~~No images anywhere.~~ **FIXED.**

16. **`q` ships with a generated clip and no word, deliberately.** `ui.md` §8.1 and AC
    D1a/D1b put every character of `inventoryOrder` on the board; `literacy-en.md` §3.5
    keeps `q` out of v1 *words*. The validator's rule moved with it: a wordless character is
    a **warning**, a `q` inside a word is an **error**, and a wordless character with **no
    clip** is an error too (D1b — a flat tile must still speak). Poisoned all three.

17. **An `expo-audio` web-shim artefact, not a defect in the app.** The hard cut (N3) pauses
    a player whose `play()` promise has not settled; `AudioModule.web.js:139` calls
    `media.play()` and returns nothing, so the browser logs one unhandled rejection per cut.
    It cannot be caught from the app, it does not occur on the native players, and it is the
    newest tap winning — which is the rule. Seen in every browser run; harmless.

12. ~~Neither pack carries an `inventoryOrder`, and the fallback order makes most of the
    vocabulary unreachable.~~ **FIXED, 2026-09-23.** Both manifests now declare
    `inventoryOrder`: Vietnamese ordered by how many playable words sit behind each symbol
    then alphabetically, English alphabetical with single letters before digraphs (D1 and
    `ui.md` §8 specify alphabetical, and a 4-year-old expects `d` after `c`, not `ch`).
    Buildable words, measured:

    | | at 8 / 12 / 16 / 20 / 24 cells | of |
    |---|---|---|
    | `vi-seed` | was 5 / 9 / 14 / 18 / 25 → **13 / 20 / 23 / 30 / 38** | 47 playable |
    | `en-seed` | 2 / 3 / 14 / 31 / 35 (unchanged — alphabetical is specified) | 40 playable |

    Stage 1 in Vietnamese went from 5 words to 13, and now opens on `bò chó gà mưa sữa dê
    cửa ong sao áo bóng cá dừa`, which is a far better first minute.

    **It broke seven tests, and the tests were wrong.** They sourced "a flat tile" from the
    shipped pack — `tableView(...).cells.find((c) => !c.live)` — and ordering by
    productivity put the 23 productive onsets first, so at every stage every onset on the
    board leads to a word and nothing is flat. *A test that depends on today's content
    passing today stops meaning anything the moment the content improves.* Fixed by
    **constructing** the fixture instead: `test/helpers/fixtures.mjs` withholds the words
    behind one on-table symbol, which is exactly L7's deletion case, and **asserts that it
    delivered a flat tile** so it can never quietly stop. Proven: stub the withholding out
    and the seven tests fail with the fixture's own message rather than passing vacuously.

13. ~~**The stage ladder would deadlock on the shipped packs.**~~ **CLOSED BY DELETION,
    revision 4.** There is no stage ladder: `gameplay.md` §3.6 deletes it, H1–H4 are its
    inverse, and `checkInvariants` fails if `stage`, `stageProgress` or `assists` reappears
    in the session. The extra clause went with it. The original report follows.
    ~~ACCEPTED by the orchestrator, 2026-09-23, and referred to the game-designer.~~ `acceptance-criteria.md` **H2** advances the stage after 8 new words at the
    current stage. At 8 cells the packs expose 5 and 2 words, so H2 alone holds the child at
    stage 1 for ever. `src/engine/session.mjs` therefore advances on *8 new words **or** every
    word this table can reach* — which preserves H2 wherever H2 can be satisfied, and cannot
    advance early, because exhausting a table is strictly harder than not exhausting it.
    **Reported as a deviation for the game-designer to accept or replace.** Defect 12 makes the
    eight-word case reachable again, but the deadlock itself should still be closed in the
    criterion rather than left to the content.

14. **`acceptance-criteria.md` C17 contradicts B3/B4. WITHDRAWN for position 1 by the
    orchestrator, 2026-09-23.** C17 says no
    never-together pair (`{c,k}`, `{g,gh}`, `{ng,ngh}`, and the dialect sets) may be **live**
    together; B3 says a symbol is live **iff** the eligible set holds a completion. `vi-seed`
    has words under both `c` (4) and `k` (1), both `g` (2) and `gh` (1), and under every dialect
    set, so the two cannot both hold — and enforcing C17 would make `kem`, `ghế` and others
    permanently unreachable, which contradicts L7's "the board does not reshuffle" as well.

    **Recommendation: withdraw C17 for position 1.** Its premise was revision 1's palette, where
    exactly one tile was right and `c` versus `k` was an unhearable guess. Under discovery `c`
    leads to `cá` and `k` to `kem` — both real words, both with pictures — and the spelling is
    *selected by the word he chooses* rather than guessed. The orthographic rule that matters,
    `k` only before i/y/e/ê, is enforced structurally by the tree: only rimes that make a real
    word after `k` are ever live, which is `literacy-vi.md` §4.1 rule 3 delivered better than a
    palette filter ever did. `test/tree.test.mjs` asserts that property directly. **D11 — `c`
    and `k` never both live — does hold in English and is tested at every reachable prefix**,
    because no `en-seed` word uses `k`.

15. **The Vietnamese onset run has no flat tile at all** (revision 2 called this "at stage 5") — a consequence of
    defect 12's fix, and **not a regression.** It is the strongest form of `gameplay.md`
    §3.3: every letter he can press starts a word. The lesson the flat state carries lives
    at positions 2 and 3 and lives there *structurally* — an onset is followed by 1–6 rimes
    out of 8–24 on the table, a rime by one legal tone out of 2–6 — so those tables always
    have flats. Recorded in `src/engine/lang/vi.mjs` and, more usefully, **asserted**:
    `test/tree.test.mjs` walks the path of every eligible word in both packs and requires
    that a flat tile appears somewhere along it. If a pack ever did get dense enough to
    erase the signal, the suite says so instead of nobody noticing.

**Stale line removed, 2026-09-23.** This used to read *"Nothing is built. No `src/` exists."*
It was written before Slice 2 and survived two slices of work — exactly the staleness
`development-process.md` §7a exists to prevent, and exactly the way defect 1 above survived its
own fix. `src/` is built: engine, state layer and board, rebuilt for revision 2.

---

## Why the slices are cut this way

**The content pack comes before the engine**, which inverts wildlife-shuffle's order, and
the reason is specific to this app: the engine consumes packs, the pack format is the data
contract everything else is written against, and **asset curation is the long pole**.
Roughly 200 images must each be looked at by a human eye (`image-sourcing.md` measured
free-text search at ~28% usable and found unsafe results), and that work is serial and
cannot be parallelised away. Starting it late would leave a finished app with no words in
it.

Both Slice 1 and Slice 2 are provable headless, so neither hides behind a renderer.

| Slice | Gate — the thing that would actually embarrass the app |
|---|---|
| 1 | The validator rejects a pack it should reject (proven by feeding it a broken one), and 45 VI + 40 EN words have real curated assets |
| 2 | Same seed and taps replay identically; thousands of fuzzed **sessions** violate no invariant; **every live path ends in a word and no reachable state is stuck** |
| 3 | **The game plays.** Tap letters, watch the board answer, make a word, see the picture — on a real iPad |
| 4 | His mother adds a word with her own photo and her own voice, and it survives an app restart — **the restart half is proved in Node by killing the write; the photo and the voice are owed a device** |
| 5 | The reveal reads as a reward; audio carries the game with the screen ignored |
| 6 | Submittable to both stores |

Slices 1–3 are a complete, usable app for the child. Slice 4 is what makes it *hers* and is
the owner's explicit requirement, so it is not optional despite coming fourth.

---

## Resuming this project in a fresh session

Read in this order:

1. **`CLAUDE.md`** — what this is and where it stands.
2. **`docs/slices.md`** (this file) — the status table above.
3. **`docs/design/decisions.md`** — what is closed. Do not relitigate any of it.
4. **`docs/design/spike-results.md`** — what was measured, including three addenda where
   owner review overturned an earlier choice. Read the addenda; they are the corrections.
5. `docs/development-process.md` §4–6 — the rules, and the incidents that produced them.

Then, before believing anything:

```bash
git fetch && git status && git log --oneline -10
ls docs/design/            # which design documents actually exist
ls samples/                # spike output is gitignored; it may be absent
```

**`samples/` is not in the repository.** It is ~65 MB of regenerable third-party media
under mixed licences. If it is missing, the audio and image decisions in `decisions.md`
still hold — the bytes are reproducible from the documented parameters via `tools/`.

### Environment the pipeline needs

Not committed, must be rebuilt if absent:

```bash
python3 -m venv .venv && .venv/bin/pip install edge-tts gTTS soundfile numpy
# ImageMagick (`magick`) must be on PATH. ffmpeg is NOT required.
```

`piper-tts` is **no longer needed** — Piper is not used for any shipped asset.

### What the owner still owes

- Approval of the full design (blocks Slice 1).
- Optional: a free Pexels or Unsplash API key — better photos, less curation.

### What the owner has already settled — never re-ask

Name, stack, devices, both audio engines and their speeds, photographs over illustrations.
All recorded in `decisions.md` with their source. He has reviewed audio three times; do not
send him a fourth round of the same question.
