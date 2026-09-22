# Ghép Chữ / Word Blocks — Slices and Status

**This file is the source of truth for where the project stands.** It is updated at every
gate, not at the end. If a session is killed, this file plus `CLAUDE.md` is what the next
one reads.

Companion documents: `decisions.md` (what is closed), `development-process.md` (how the
squad works), `spike-results.md` (what was measured).

---

## Status

*Last updated: 2026-09-23*

| # | Slice | State |
|---|---|---|
| **0** | Squad, spike, and approved design | **In progress** — literacy done; UI and content pipeline in flight |
| **1** | Content pack: format, validator, seed pack with real assets | Not started |
| **2** | Engine: tile assembly, word matching, round generation | Not started |
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
| `gameplay.md`, `ui.md`, `acceptance-criteria.md` | game-designer | **In flight** |
| `content-pipeline.md`, pack validator | content-engineer | **In flight** |
| **Owner approval of the full design** | owner | **Not yet requested** |

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
