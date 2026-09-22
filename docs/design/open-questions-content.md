# Open questions — content pipeline

Raised by the content-engineer. Companion to `open-questions.md` (the literacy-designer's).
Only things that genuinely turn on somebody else: the owner, or the literacy-designer.
Everything I could decide is decided and is in `content-pipeline.md`.

**Every question carries a recommendation. If nobody answers, the recommendation is what
gets built.** Nothing here blocks the build.

---

## C1 · A defect in `literacy-vi.md` §3.1 — the medial `u` before `i`

**For the literacy-designer. Not blocking; already worked around.**

§3.1 lists the medial `u` as occurring *"before `â ê y i ơ`"*. That list includes `i`, and
it is what caused the only wrong spelling the seed build produced.

The tone-mark placer (`literacy-vi.md` §5.5) skips past a medial glide to mark the
nucleus. Treating `u` before `i` as a medial makes `ui` + ngã come out as **`uĩ`**, so the
seed word `mũi` would have been built as **`muĩ`**.

In `ui` the `u` is the nucleus and the `i` is a final glide — `mũi`, `túi`, `cúi`. The
genuine medial-before-`i` case is spelled **`uy`** (`quy`, `thúy`), never `ui`.

**Done:** the placer ignores the medial list entirely and uses vowel-cluster position
instead (`tools/lib/rules.mjs`). All 33 seed rimes now compose correctly.

**Recommendation:** strike `i` from §3.1's medial list, or add a note that the `u`+`i`
sequence is nucleus+glide. §3.1 already carries confidence `check`, so this is the check
coming back.

**Also in passing:** `literacy-vi.md:155` still lists `hổ` among the seed words for the
rime `o`. `word-list.md:141` was corrected to `ô`; that line was not.

---

## C2 · Sound and anchor word for the ten English digraph tiles — ANSWERED

**Closed. Recorded because of where the answer now lives.**

`samples/audio/en-final/manifest.json` carries `sound` + `anchor` for the 26 letters —
`c → "kuh", "cat"`. The pack also needs tiles for `sh ch th ck ng ll ss ff zz gg`
(`literacy-en.md` §3.3), and those had no approved strings. The builder left them `null`
rather than inventing them, because `decisions.md` records anchor words as **curriculum,
not audio config**, and "Still open" #3 already flags `igloo` as meaningless to this
child.

**Answered while this document was being written.** All ten now carry a sound and an anchor — `sh → "shh", ship`;
`ck → "kuh", duck` (final-position anchor, as required) — and their 20 clips are
generated. `packs/en-seed` validates with zero warnings.

**One thing to know about where they live.** They are in `packs/en-seed/pack.json` and in
no document. The builder would have overwritten them on the next rebuild, so it now
preserves hand-supplied `sound` / `anchor` / `label` / `audio` on any tile that still
exists (`content-pipeline.md` §9.1), with a regression test.

That is a workaround, not a home. **Recommendation:** put the ten strings into
`literacy-en.md` §3.3 as two more columns, the way the 26 letters live in
`samples/audio/en-final/manifest.json`. Then the curriculum is owned by the
literacy-designer, reviewable in a diff, and the builder reads it rather than protecting
it.

---

## C3 · Vietnamese dialect — the pack is holding a conservative default

**For the owner. Already asked as `open-questions.md` Q1; this is the content-side cost.**

`pack.json` carries `"dialect": "unset"`, and `rules.neverTogether` is generated from it.
With no answer, the pack forbids **every** pair either dialect merges:

```
["c","k"] ["g","gh"] ["ng","ngh"]        both dialects, orthography (§4.1)
["d","gi","r"] ["s","x"] ["ch","tr"]     northern mergers
["hoi","nga"]                            southern merger
```

That is safe and it is lossy: it removes seven distractor pairings the round generator
could otherwise use, which makes palettes less varied than they need to be for whichever
dialect he actually speaks.

Answering is one field. `node tools/build-seed-pack.mjs --dialect northern` regenerates
the rule list, and the validator rejects a pack whose `neverTogether` has gone stale
against its `dialect`, so the two cannot drift.

**Recommendation:** ship `unset` until he answers. It costs variety, never correctness.

---

## C4 · Publishing: the audio is the licensing problem, not the photographs

**For the owner. `decisions.md` "Still open" #5 says decide before Slice 6. This sharpens
what is actually at stake.**

That entry says publishing *"changes licensing and attribution obligations"*, which reads
as though the photographs are the issue. They are the easy half.

| | Status |
|---|---|
| Photographs | Explicit public licences. ~⅓ share-alike, measured. Obligation is an attributions screen, which is **generated** from the pack and already works. |
| Fluent Emoji 3D | MIT. One notice. |
| **edge-tts / gTTS audio** | **No published grant to redistribute the audio inside a product.** |

`edge-tts` drives Microsoft's Edge read-aloud endpoint; `gTTS` drives Google Translate's.
`spike-results.md` already records gTTS as *"the unofficial Google Translate endpoint —
undocumented, rate-limited and liable to change"*. Neither publishes terms covering
shipping the generated audio in an app.

**For a private family app this is a non-issue.** For a store listing it is the open
question, and it is the one that would be expensive to discover late — after curation,
after the child is attached to the app.

**It is cheap to close**, because the pipeline was built for exactly this: a recording and
a generated clip are the same kind of object (`content-pipeline.md` §3.6). Re-recording
is 67 tile clips + 50 words + 31 blends in Vietnamese, 70 tile clips + 40 words in
English. A recording session, not a rebuild — and `spike-results.md` says a parent's voice
beats any synthesised voice for this child anyway.

**Recommendation:** stay private for v1 and decide before any store submission. If he
wants to publish, plan the recording session rather than hunting for a licence that does
not exist.

---

## C5 · Restrict the photo licence filter to non-share-alike?

**For the owner. Not blocking. Only matters if C4 goes towards publishing.**

The fetcher currently accepts `cc0`, `pdm`, `by` and `by-sa`, excluding `nc` and `nd`.
Measured over the 79 candidates fetched in the spike:

| Licence family | Candidates |
|---|---|
| CC BY (all versions) | 30 |
| **CC BY-SA (all versions)** | **26** |
| CC0 / public domain | 12 |
| unrecorded | 4 |

Dropping share-alike would remove about a third of the pool. Given the ~30% usable yield
from Commons category members, several words would end up with one photograph or none —
and the ones most at risk are the cultural words (`phở`, `nón`, `bún`), whose only
non-Wikipedia sources are Commons.

**Recommendation: keep `by-sa`.** The obligation is discharged by a generated credits
screen, which exists. The share-alike term reaches the cropped photographs, not the app's
code (`content-pipeline.md` §11), so it does not constrain anything else.

**GFDL is the one to watch, and it is not on that table because it does not announce
itself.** A `chó` candidate came back `GFDL 1.2` while the licence filter and the
attribution table treated it as just another free licence. It is the heaviest obligation
the pipeline can pick up: the **full GNU Free Documentation Licence text must ship with
the work**, and a 1.2-only file cannot be relicensed as CC BY-SA. The validator now warns
on it by name and the attributions file calls it out separately.

Harmless while this is a private family app. **Recommendation: do not filter it at fetch
time** — the curator should still get to see the picture — but treat a GFDL image as a
placeholder. If the owner publishes, replace those few pictures rather than ship a copy of
the GFDL; and for most of them the honest replacement is a photograph the mother takes
herself, which is better content anyway.

---

## C6 · A Pexels or Unsplash key — still the highest-value five minutes

**For the owner. Already `image-sourcing.md` open item 1; restated because curation is now
demonstrably the bottleneck.**

Everything else in the pipeline is automated and resumable. The human step is not, and it
is the expensive one: at 3 images × 90 words, somebody looks at roughly 900 candidates.

What the phở fetch actually returned, of six candidates: one good lead image, two usable
bowls, one bánh mì, one photograph of two men at a table, one restaurant dish that is not
phở. Three of six, and that is *after* de-duplication removed three identical shots of the
same stone pot.

Pexels and Unsplash are professionally shot, clean-background and well-tagged. Expected to
beat 77% substantially and to cut the looking.

**Recommendation:** get the key. If it arrives, adding a source to `fetch-candidates.mjs`
is small; the pack format, the importer and the attribution generator all already carry
`source` / `license` / `creator` / `sourceUrl` and need no change.

---

## C7 · `ffmpeg` — closed, no action needed

Recorded so nobody spends the owner's `sudo` on it.

`spike-results.md` first called `ffmpeg` *"the one thing worth the owner's hands"*, then
downgraded it to optional. It can now be closed entirely: `soundfile` on this machine is
built against **libsndfile 1.2.2, which reads and writes mp3**. Verified by decoding
`c-long.mp3` and re-encoding it (13,248 B out). Generation, measurement, normalisation and
re-encoding all work in the venv.

The only thing `ffmpeg` would still buy is Opus, at roughly a third the size. The budget
says that is not worth a dependency: audio is 10% of the Vietnamese pack and 15% of the
English one, and the whole first install is ~18 MB.

**Recommendation: do not install it.**

---

## C8 · Loudness across the English letter clips — needs an ear

**For the owner. One listen, and only if something sounds wrong.**

Measured across all 52 English clips: peak −9.3 to −1.1 dBFS, RMS −27.5 to −21.5 dBFS. No
normalisation pass is needed — Piper's full-scale problem does not apply to edge-tts.

The residual is a **6.1 dB spread in RMS across the 26 letters**: the loudest letter is
about twice as loud as the quietest.

`decisions.md` closed this class of question: *amplitude is not intelligibility*, nobody
on this team can hear, and two rounds were already spent inferring an audible property
from a number. So this is not a recommendation to change anything — it is a note that if
he ever says "some letters are quiet", the cause is measured and the fix is a per-clip
gain, which the venv can already apply.

**Recommendation: ship as generated. Do not pre-emptively normalise.**

---

## What I decided rather than asked

| Decision | Where |
|---|---|
| One pack per language, as a directory | `content-pipeline.md` §1 |
| One JSON file per word | §2 |
| Content-addressed media, referenced by relative path | §2 |
| 1 / 3 / 6 images per word; `images[0]` is the prototype; rotation by encounter count, no RNG | §5 |
| Missing image → fallback emoji → withhold the word; missing word audio → withhold; missing tile audio → silent | §5 |
| A dangling reference is an error; an empty array is a warning | §5 |
| Recording and TTS share one import path and one object shape | §3.6 |
| Drafts: `draft: true` + `enabled: false`, decomposition relaxed, media safety not | §4.3 |
| Atomic write = tmp → fsync → rename → fsync dir; word file written last | §4.2 |
| A newer schema opens read-only; migration is copy, validate, swap | §7 |
| The backup is a zip of the directory, verified on write, refused if damaged | §8 |
| 512×512 q82 JPEG; mp3 left as generated | §9 |
| Throttle 1.2 s/host, honour `Retry-After`, disk cache + `state.json` | §9.5 |
| Attribution generated from the pack, never maintained | §11 |
