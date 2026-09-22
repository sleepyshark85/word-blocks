# Ghép Chữ / Word Blocks — Slices and Status

**This file is the source of truth for where the project stands.** It is updated at every
gate, not at the end. If a session is killed, this file plus `CLAUDE.md` is what the next
one reads.

Companion documents: `decisions.md` (what is closed), `development-process.md` (how the
squad works), `spike-results.md` (what was measured).

---

## Status

*Last updated: 2026-09-23 (Slice 2 built, under independent test) — all three design agents were killed mid-work by a weekly
rate limit. What survived is catalogued below; it was verified by execution, not trusted.*

| # | Slice | State |
|---|---|---|
| **0** | Squad, spike, and approved design | **In progress** — `ui.md` and `acceptance-criteria.md` still missing |
| **1** | Content pack: format, validator, seed pack with real assets | **In progress** — packs built and audio generated; **no images yet** |
| **2** | Engine: tile assembly, word matching, round generation | **Built, in test.** `npm test` 179/179; ~9,400 fuzzed rounds per language, 50,000 invariant checks, 0 violations |
| **3** | The game plays, both languages, on a real device | Not started |
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
| `gameplay.md` (571), `ui.md` (1208) | game-designer | **Done** — line counts verified |
| `acceptance-criteria.md` | game-designer | **Done** — 223 unique AC ids, count verified |
| `tools/theme-contrast.mjs`, `tools/layout-sweep.mjs` | game-designer | **Done** — both exit 0 when re-run by the orchestrator |
| `content-pipeline.md` (1044), `open-questions-content.md` (228) | content-engineer | **Done** |
| `tools/pack-validate.test.mjs` | content-engineer | **Done** — 50 tests, 50 pass, verified by the orchestrator |
| `pack-import-media`, `pack-attributions`, `pack-backup` | content-engineer | **Done** |
| **Owner approval of the full design** | orchestrator | **APPROVED 2026-09-23.** Delegated by the owner while AFK. Every agent claim was re-run by the orchestrator before approval: 223→227 ACs counted, `theme-contrast.mjs` and `layout-sweep.mjs` exit 0, `pack-validate.test.mjs` 50/50 |

**Slice 0 is closed.** Design is complete and verified. Building has started.

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
5. **No images curated yet.** Both packs deliberately fail `--strict`, which now counts
   *photographs* rather than fallbacks. Candidate fetch is re-running with the licence fix.

6. **PUBLISHING BLOCKER (not for private use):** neither edge-tts nor gTTS grants the right
   to redistribute generated audio inside a product. Cheap to close, because a recording and
   a generated clip are the same object in the schema — but it must be closed *before* any
   store submission. `open-questions-content.md` C4.

7. ~~No images anywhere.~~ `images: []` in every word. This is the long pole.

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
