# Ghép Chữ / Word Blocks

A word-building game for the owner's son, about 4, bilingual Vietnamese/English. He taps
tiles to assemble a word; when the word is real, he sees photographs of what it means and
hears it spoken. His mother maintains the word list herself — pictures, audio and all —
without a developer.

**Stack:** Expo / React Native / React, JavaScript (not TypeScript). **iPhone, Android
phone, iPad**, and Android tablet by implication. Fully offline at runtime: no network, no
ads, no analytics, no IAP.

## Where things stand

**Nothing is built. There is no `src/`.** The project is in Slice 0 — design.

**Read `docs/slices.md` first.** It carries the status table, what each slice contains, and
— in *Resuming this project in a fresh session* — exactly what to read and run when picking
this up with no conversation history. It is updated at every gate.

Design is largely settled. The language models, the word list, the stack, the name, the
devices and **both audio engines** are decided and recorded in `docs/design/decisions.md`.
The UI and the content-pack format were in flight at the last update. The owner has **not
yet approved the full design**, which is the gate that ends Slice 0.

## The two things this project keeps learning

**Amplitude is not intelligibility.** Two rounds of English letter-sound audio were
justified by a true measurement — signal up more than tenfold — and the owner rejected both
by ear. Nobody on this team can hear. Audio cannot be verified below the owner, and a
number that *correlates* with a property is not that property. The general form: when what
you can measure is a proxy for what you care about, say so out loud and get the real check
sooner.

**Relevance ranking is not judgement.** Openverse's top photo for "cat" was a catfish; for
"car" it returned an F1 car, a train, a dealership sign and a pin-up advertisement captioned
"BOMBS!" — 0 of 12 usable. Wikipedia *lead* images measure ~77% because a human chose each
one. Every image that reaches the pack is looked at. The tools assemble candidates; they do
not choose.

## Repo map

| Path | What it is |
|---|---|
| `docs/slices.md` | **Status, gates, and how to resume cold. Start here.** |
| `docs/design/decisions.md` | **What is closed.** Do not relitigate it. |
| `docs/design/spike-results.md` | What was measured. The three addenda are corrections — read them. |
| `docs/design/image-sourcing.md` | Photo evidence, measured yields, the licensing obligation |
| `docs/design/literacy-vi.md` | Vietnamese: onset + rime + tone, legality rules, đánh vần |
| `docs/design/literacy-en.md` | English: letter *sounds*, CVC phonics, word families |
| `docs/design/word-list.md` | Seed vocabulary, ~45 VI / ~40 EN |
| `docs/development-process.md` | The squad, the gates, verification tiers, and the rules incidents produced |
| `tools/` | Asset pipeline. Node + a Python venv; ImageMagick on PATH; **no ffmpeg needed** |
| `samples/` | **Gitignored.** ~65 MB of regenerable third-party media |

## The squad

Five subagents in `.claude/agents/`, run in sequence and gated on the owner:

- **literacy-designer** — the two language models, the word list, what is teachable at 4.
- **game-designer** — screens, visual system, motion, the editor's UX, the ACs.
- **content-engineer** — the editable pack format, storage, the asset pipeline, licensing.
- **app-developer** — implements an approved design. Does not invent scope.
- **app-tester** — verifies by execution. Does not fix what it finds.

Five rather than three because this app has two failure surfaces a game designer cannot
own: **content that can be linguistically wrong**, which a 4-year-old will learn and repeat,
and **content as a live user-editable database** rather than a build artifact.

## Working rules

- **Keep `docs/slices.md` current at every gate**, not at the end. A session can be killed
  at any moment; the status table is how the next one starts without re-deriving anything.
- **Ground everything in the real files.** Cite `path:line`.
- **Verify claims, do not relay them.** Every agent report is checked by execution before it
  reaches the owner — this has already caught a wrong blocker, a fabricated asset count and
  a self-contradicting index.
- **Never trust a green check you have not seen fail.** Inject the fault first.
- **Content is hostile input.** It is JSON on a phone, edited by a non-technical adult.
  Validate every read; make every write atomic. Losing her work once ends the app.
- **The language never mixes.** Chosen at launch. Treat any leak as severe.
- **Measure, don't assert.** "The assets will be huge" was wrong by more than an order of
  magnitude — ~8 MB at 150 words — and only arithmetic showed it.
- The rules engine is pure: `(state, action) => state`. No React, no timers, no
  `Math.random()` except through a seeded source.
- **No Reanimated, no gesture-handler.** This app is taps, not drags, and Reanimated's
  worklet serialization caused the crash in wildlife-shuffle's `docs/development-process.md`
  §6.9.
- **Bundle a Vietnamese-capable font.** `mả` and `mã` differ only by a tone mark; an Android
  OEM font that renders them alike is a *correctness* failure, not a cosmetic one.
