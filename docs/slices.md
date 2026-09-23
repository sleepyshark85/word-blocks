# Ghép Chữ / Word Blocks — Slices and Status

**This file is the source of truth for where the project stands.** It is updated at every
gate, not at the end. If a session is killed, this file plus `CLAUDE.md` is what the next
one reads.

Companion documents: `decisions.md` (what is closed), `development-process.md` (how the
squad works), `spike-results.md` (what was measured).

---

## Status

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

*Last updated: 2026-09-23 (Slices 2 and 3 rebuilt for the discovery mechanic). Earlier history:
all three design agents were killed mid-work by a weekly rate limit; what survived is catalogued
below and was verified by execution, not trusted.*

| # | Slice | State |
|---|---|---|
| **0** | Squad, spike, and approved design | **Closed at revision 2, 2026-09-23** — `gameplay.md`, `ui.md` and `acceptance-criteria.md` rewritten for the discovery mechanic; both design tools re-run, both exit 0 |
| **1** | Content pack: format, validator, seed pack with real assets | **In progress** — packs built and audio generated; **no images yet** |
| **2** | Engine: **prefix tree, live-set computation** | **Rebuilt for revision 2.** `npm test` 230/230; 800 fuzzed sessions per language with `checkInvariants` after **every** action, plus a 4,000-action soak; 0 violations. Awaiting independent verification |
| **3** | The game plays, both languages, on a real device | **Rebuilt for revision 2 and driven.** Chrome at iPad portrait + landscape, iPhone 393×852 and the 360×640 Android floor, both languages; five words to the album; the gate opens on a 1.2 s hold. **Not yet run on a real device — Tier 5 is owed.** Awaiting independent verification |
| **4** | The editor — add / edit / delete a word | Not started |
| **5** | Polish: motion, sound, accessibility | Not started |
| **6** | Store readiness, iOS + Android | Not started |

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

6. **No images curated yet.** Both packs deliberately fail `--strict`, which now counts
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

11. ~~No images anywhere.~~ `images: []` in every word. This is the long pole.

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

13. **The stage ladder would deadlock on the shipped packs, and the engine carries an extra
    clause for it. ACCEPTED by the orchestrator, 2026-09-23, and referred to the
    game-designer to fold into the criterion.** `acceptance-criteria.md` **H2** advances the stage after 8 new words at the
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

15. **At stage 5 the Vietnamese onset table has no flat tile at all** — a consequence of
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
| 4 | His mother adds a word with her own photo and her own voice, and it survives an app restart |
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
