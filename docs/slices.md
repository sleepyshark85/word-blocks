# Ghép Chữ / Word Blocks — Slices and Status

**This file is the source of truth for where the project stands.** It is updated at every
gate, not at the end. If a session is killed, this file plus `CLAUDE.md` is what the next
one reads.

Companion documents: `decisions.md` (what is closed), `development-process.md` (how the
squad works), `spike-results.md` (what was measured).

---

## Status

> ### ⚠ 2026-09-23 — THE CORE MECHANIC WAS CORRECTED. Slices 2 and 3 are built against the wrong design.
>
> The owner restated what he asked for in his first message: the app must **show a table of
> characters**, let the child **build a word character by character**, **disable characters that
> cannot lead to a word** (including at the first position), and **announce** when a word forms.
> The picture is the **reward**, never the prompt. Revision 1 did the opposite — it picked a
> target, showed its veiled photograph and offered a palette built for that target.
>
> **Design is re-issued as revision 2** by the game-designer: `gameplay.md` §0, `ui.md` §0 and
> `acceptance-criteria.md` §0 / §W each carry the correction log, and §W lists every revision-1
> acceptance criterion that is withdrawn and why.
>
> | | State after the correction |
> |---|---|
> | `gameplay.md` (601), `ui.md` (1529), `acceptance-criteria.md` (466) | **Revision 2.** 269 criteria + 14 Tier-5 questions + 24 withdrawn groups |
> | `tools/layout-sweep.mjs` | **Rewritten for the character table. Exit 0** — 10,358,248 layouts, 432,297 viewport/inset combinations served, 8,271 rejected |
> | `tools/theme-contrast.mjs` | **Extended** (disabled tile, shelf, chant highlight). **Exit 0**, 34 pairs x 3 themes. Emitted tokens are **byte-identical** to `src/theme/tokens.json` |
> | `npm test` | **253 / 254.** The single failure is `test/layout-parity.test.mjs` — `src/layout/layout.mjs` still implements revision 1's law. Expected and correct: it is the signal that the board must be rebuilt |
> | Slice 2 (engine) | **Partly obsolete.** Round generation, the word bag, the found-word win and the not-a-word settle have no meaning under discovery. A prefix tree over the pack replaces them |
> | Slice 3 (the game plays) | **Partly obsolete.** The board is a word strip plus a character table; there is no picture frame, veil, segment border, page rail or caption strip |
> | Slice 4 (editor) | Unchanged in shape, **plus three additions**: the cheer recording, the "not on the board yet" reason, and a preview that shows discovery |
> | Content packs | **Unchanged and still valid.** The correction changes how a word is reached, not what a word is |
>
> **Two findings the correction surfaced, both closed in revision 2:**
> 1. Revision 1's chant turned a glyph **gold on white** — measured **1.60-2.05:1**, unreadable,
>    and never in the contrast sweep. It is now a gold *face* with an ink glyph, 6.5-8.7:1, and
>    the pair is gated.
> 2. The six document defects the Slice-3 developer reported and the B9/F2 conflict the tester
>    reported are all closed — `ui.md` §0 (U4-U11) and `acceptance-criteria.md` §W.
>
> **One thing needs the owner, and nothing is blocked on it:** `open-questions-ui.md` **Q5** —
> the reason recorded for choosing Baloo 2 over Be Vietnam Pro for tiles was false in both
> directions (Baloo 2's `a` is double-storey; Be Vietnam Pro's is single). Baloo 2 ships;
> switching is one line if he wants the single-storey letterform.


*Last updated: 2026-09-23 (design revision 2 — the core mechanic was corrected; see the box
below). Earlier history: all three design agents were killed mid-work by a weekly rate limit;
what survived is catalogued below and was verified by execution, not trusted.*

| # | Slice | State |
|---|---|---|
| **0** | Squad, spike, and approved design | **Closed at revision 2, 2026-09-23** — `gameplay.md`, `ui.md` and `acceptance-criteria.md` rewritten for the discovery mechanic; both design tools re-run, both exit 0 |
| **1** | Content pack: format, validator, seed pack with real assets | **In progress** — packs built and audio generated; **no images yet** |
| **2** | Engine: ~~tile assembly, word matching, round generation~~ -> **prefix tree, live-set computation** | **Built against revision 1; partly obsolete.** `npm test` 179/179; ~9,400 fuzzed rounds per language, 50,000 invariant checks, 0 violations |
| **3** | The game plays, both languages, on a real device | **Built against revision 1; the board must be rebuilt.** `npm test` 254/254; driven in Chrome at iPad portrait/landscape, iPhone and 320×560; five rounds to the album in both languages. **Not yet run on a real device — Tier 5 is owed** |
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

**Nothing is built. No `src/` exists.** Slice 0 ends when the owner approves the design.

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
| 2 | Same seed and taps replay identically; thousands of fuzzed rounds violate no invariant; **every round is solvable with the palette offered** |
| 3 | **The game plays.** Pick a language, build a word, see the picture — on a real iPad |
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
