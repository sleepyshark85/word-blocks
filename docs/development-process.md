# Team, Procedure and Development Process

How this project is built. The structure is inherited from **wildlife-shuffle**, which the
owner built with the same method; the differences are the ones this app's subject matter
forces. Read that project's `docs/development-process.md` for the incidents that produced
the shared rules — they are not repeated here, they are adopted.

---

## 1. The team

Five agents, defined in `.claude/agents/`.

| Agent | Owns | Cannot |
|---|---|---|
| **literacy-designer** | The two language models, tile inventories, word list, what is teachable at 4. | Design screens. Write code. Source assets. |
| **game-designer** | Screens, layout, visual system, motion, the editor's UX, the ACs. | Define language models or word lists. Specify the pack format. Touch `src/`. |
| **content-engineer** | Content pack format, storage/migration, the offline asset pipeline, licensing, budgets. | Choose words or tile decompositions. Design the editor's screens. Write `src/`. |
| **app-developer** | Implementation against approved ACs. | Redefine ACs. Change the word list. Mark its own work verified. Commit. |
| **app-tester** | Verification by execution. Bug hunting beyond the ACs. | Fix what it finds. Modify `src/`. Commit. |

**The separation is the point.** A developer that can edit the ACs will edit them to match
what it built. A tester that can fix what it finds stops reporting and starts patching. A
designer that writes code designs what is easy to write.

**Why five and not three.** Wildlife-shuffle needed three because its subject matter was
one puzzle mechanic. This app has two failure surfaces that a game designer is not
qualified to own and that carry more risk than the UI does:

- **The language content can be wrong.** Not ugly, not awkward — *wrong*, in a way a
  4-year-old will learn and repeat. That deserves a role whose only job is correctness of
  what is taught, held apart from whoever is making it look nice.
- **The content is a live, user-editable database, not a build artifact.** The owner's
  requirement that his wife add and edit words without a developer makes the pack format,
  its migrations and its failure modes a subsystem in its own right, with its own
  verification burden.

**The orchestrator** (the main session) owns git, owns what reaches the owner, and is the
only party that verifies claims across agents. No agent's report is taken at face value.

---

## 2. Sequence and gates

```
  literacy ──┐
             ├─→ reconcile ─→ OWNER APPROVES ─→ build ─→ test ─→ fix ─→ PR ─→ OWNER
  game     ──┤                                    ↑                 │
  content  ──┘                                    └─── max 2 rounds ─┘
```

The three design agents run in parallel from a shared brief of settled constraints, then
the orchestrator reconciles them — parallel design agents *will* contradict each other,
and finding the contradictions is the reconcile step's entire job, not a sign it went
wrong. If a slice is not green after two fix rounds it goes to the owner rather than
grinding.

---

## 3. The architectural rule everything rests on

Inherited wholesale from wildlife-shuffle, where resolving turns inside React `setState`
updaters produced most of v1's defects and double-executed every turn under StrictMode:

1. **A pure engine** — `(state, action) => state`. No React, no timers, no `Date.now()`,
   no `Math.random()` except through a seeded source carried in state.
2. **A React state layer** — holds engine state, dispatches actions, owns every timer with
   explicit cleanup.
3. **Presentation** — animation replays state the engine already resolved, never drives
   it. A dropped frame cannot corrupt a round.

**Determinism is load-bearing.** Same seed plus same taps produces the same rounds, or the
tester cannot replay a failure and the verification strategy collapses.

---

## 4. The rule this project adds: content is hostile input

Wildlife-shuffle's content was a constant in a source file. This app's content is a JSON
pack on a phone filesystem, edited by a non-technical adult, and it is the single largest
source of defects this app will have.

**Every read of the pack is a read of untrusted data.** Validate on load. Degrade to a
usable app rather than a crash. Never let one bad entry take down the pack — a child
seeing a blank screen because his mother typed a stray comma is the defect that matters
most here.

**Every write is atomic.** She will close the app mid-save, and the words she entered last
week must survive it. Losing her work once will end her willingness to maintain the list,
and the app dies with it.

**Two things must never leak across the language boundary.** The owner named this
explicitly: the language is chosen at launch and never mixes. Every fallback path, default
value, empty string and missing asset is a candidate leak, and the tester hunts them
specifically.

---

## 5. Verification tiers

| Tier | Method | Proves |
|---|---|---|
| **1 · Engine** | `node --test` + seeded invariant fuzzing | Rules, word matching, round generation, determinism |
| **2 · Content** | Pack validator + corruption fuzzing | The pack survives a human and a filesystem |
| **3 · E2E** | Expo web at device viewport | The loop: tap → state → render |
| **4 · Layout** | Arithmetic against the device sweep | Fit, including Vietnamese diacritic ascenders |
| **5 · On-device** | The owner, and eventually his son | Feel, touch, audio, and whether a 4-year-old will play it |

Only tier 5 proves the product. Tier 5 is also the only tier that can tell you the game is
**boring**, which is this app's most likely way to fail and the one no harness detects.

**Some defects no tier below 5 can represent at all.** Anything that differs between a
`.native` and a `.web` module — worklet serialization above all — cannot happen on web.
When a property is like that, audit it structurally in Tier 1 rather than testing the
behaviour anywhere. This rule cost wildlife-shuffle a crashed TestFlight build; it is
adopted here for free.

**Never trust a green check you have not seen fail.** Before relying on a new test, lint or
validator, inject the fault it is supposed to catch and confirm it fails.

---

## 6. Claims are verified, not relayed

Every agent report is checked against the files and by execution before it is acted on or
passed to the owner. The orchestrator verifies its own claims too.

Three corrections were already made during the pre-design spike, before a single agent ran,
and they are recorded in `docs/design/spike-results.md` because the pattern is the point:

- Two TTS voice models downloaded with **byte-identical sizes**. That looked like a
  download bug. Checking the MD5s and the declared language showed they were genuinely
  different — same architecture, coincidental size. *Suspicion checked, not acted on.*
- An asset index script reported **30,000 folders**. GitHub's contents API silently ignores
  pagination for large directories, so the loop re-read the same page thirty times.
  Deduplicating gave exactly 1,000 — the API's cap, and a suspiciously round number, which
  is what prompted a recount through the trees API. True answer: 1,595.
- A claim that "every probe miss resolves" was **written before it was checked**, and was
  wrong: `Nose` was in the index and still 404'd, because skin-toned assets nest an extra
  path level. The contradiction was the finding.

**Rule:** a number that looks like a limit usually is one. **Rule:** when the index says a
thing exists and the fetch says it does not, the disagreement is the finding — chase it,
do not average it.

---

## 7. Git and PR workflow

- **One branch per slice**, named `slice-N-<topic>`, cut from `main`.
- **Never commit to `main` directly.**
- **Stage explicitly.** Never `git add -A`.
- **Agents do not commit.** Only the orchestrator does.
- **Commit messages** explain *why*, cite `path:line`, and give measured numbers rather
  than adjectives.
- **Before pushing, run the suite against what was committed**, not the working tree.
- **Branch each slice from `main`**, not from the previous slice's branch.
- **After merging, verify the code is actually on `main`.**

---

## 7a. The session can be killed at any moment

This project is built across sessions that end without warning — killed, compacted, or
simply closed. **Nothing that exists only in a conversation exists.** A decision the owner
made by ear, a claim an agent retracted, a blocker that turned out not to be one: if it is
not in a file, the next session will re-derive it wrongly or ask the owner again.

Two files carry the state, and **both are updated at every gate rather than at the end**:

| File | Carries |
|---|---|
| `docs/slices.md` | The status table, what each slice contains, and how to resume cold |
| `CLAUDE.md` | What the project is, where it stands, the repo map, the standing rules |

**A gate is:** an agent reporting back, an owner decision, a slice changing state, a claim
being verified or overturned, or any discovery that would change what someone does next.
Updating is part of the work, not reporting on it — if `docs/slices.md` still says
"in flight" after an agent has landed, the project's state is wrong for everyone who reads
it next.

`docs/design/decisions.md` carries owner decisions with their source, and exists so nobody
re-asks a question he has already answered. He reviewed the audio three times; a fourth
round of the same question is a process failure, not diligence.

**The test for these documents is not "is it accurate", it is "could a session with no
history act correctly on it".** That is why `docs/slices.md` ends with the exact commands to
run, the environment to rebuild, and an explicit note that `samples/` is gitignored and may
simply be absent.

---

## 8. Working agreements

- **Keep `docs/slices.md` and `CLAUDE.md` current at every gate** (§7a). This outranks
  finishing the task in progress — a correct status with unfinished work beats finished work
  nobody can find.
- **Ground everything in the real files.** Cite `path:line`.
- **Measure, don't assert.** "The assets will be huge" is an instinct; "8 MB at 150 words"
  is a finding. The owner's instinct was wrong by more than an order of magnitude, and only
  arithmetic could show it.
- **Flag ambiguity, don't resolve it silently.**
- **Report failure plainly.** If tests fail, say so with the output. If a step was skipped,
  say that. Never mark your own work verified.
- **Correct errors without ceremony.** State the correction, carry the consequence, move on.
