# Open questions — UI

Owner: game-designer. Companion to `open-questions.md`, which the literacy-designer owns.

**Almost nothing is in here, on purpose.** The owner is AFK and approval is delegated, so
everything a stated assumption could settle has been settled and recorded in `ui.md`,
`gameplay.md` and `acceptance-criteria.md` rather than routed upward. **If nobody answers, what
is written below is what ships.**

**Revision 2, 2026-09-23.** The mechanic was corrected from guided completion to discovery
(`gameplay.md` §0). Q1 was already closed; Q2 survives with a narrowed meaning; Q3 survives
unchanged; **Q4 and Q5 are new**, and Q5 is the one item that is genuinely the owner's taste
rather than a design call I can make for him.

**Revision 3, 2026-09-23.** The owner played the built app and reported four things
(`gameplay.md` §0A). All four are **decided, not asked** — they are his instructions, and the
design follows them. **Q4 is superseded**: he overruled its premise. **Q6 is new, and it is
the one thing in revision 3 I genuinely cannot decide for him**, because it turns on a fact
only he can see — which device his son actually plays on.

**Revision 4, 2026-09-23. `Q6 is CLOSED` — he answered it and proposed the remedy himself
(paging), which turned out to be better than either option Q6 offered him.** **Nothing in this
document is open.** Q2, Q3 and Q5 remain standing preferences he may exercise at any time; Q1,
Q4 and Q6 are closed. If nobody says anything further, what is written in `ui.md`,
`gameplay.md` and `acceptance-criteria.md` is what ships.

---

## Q1 · ~~The Vietnamese tile font is unverified~~ — CLOSED, and the answer was "no"

**Resolved 2026-09-23. Fredoka cannot be used for Vietnamese and has been replaced by Baloo 2.**
Measured, not inferred: Fredoka covers **35 of 86** characters of the fixture. Its `latin-ext`
skips `U+1EA0–U+1EF1`, so **`ã` (U+00E3) exists in it and `ả` (U+1EA3) does not** — `mã` would
have rendered in Fredoka and `mả` in an OS substitute, two words differing only by a tone mark
rendering in two different typefaces.

**No question remains about Fredoka.** Q5 below reopens a much narrower part of the replacement
decision, on evidence that was wrong.

---

## Q2 · `Show the word` — now a reveal setting, not a board setting

**Decided, and revision 2 narrowed it.** The board no longer has a caption strip
(`ui.md` §2.1): there is no target word to show her, and the word he is building is already on
screen in tiles at 39–68 pt, which she can read from across the room.

`Show the word` now governs **the reveal caption only** — the word and its sentence under the
full-screen photograph — and still defaults to **on**.

**The assumption:** his mother is usually there, and her being able to read the word and its
sentence aloud at the payoff moment is worth more than protecting him from seeing letters he
cannot read yet.

**No answer needed.** It is one tap in the parent menu either way.

---

## Q3 · Popsicle is not red-green colour-blind safe

**Decided:** ship all three themes as chosen, Popsicle default, and carry the limitation in the
open. `tools/theme-contrast.mjs` prints it rather than hiding it:

```
Popsicle: onset vs tone under deuteranopia = 1.59
Sunshine: onset vs tone under deuteranopia = 8.58
```

Popsicle's watermelon and green cannot be separated under red-green CVD by any slot assignment —
that is a property of two hues the owner picked by eye and liked. Darkening one until the
arithmetic passed would trade *bright and fun*, which is the brief, for a channel that is
already redundant: role is carried by the bar pattern, by one table at a time, and by colour
last.

**Revision 2 adds a second colour-free channel that matters more.** Live versus disabled — the
distinction the whole mechanic now rests on — is carried by **ink weight and outline solidity**,
not by hue at all (`ui.md` §5.8), and `acceptance-criteria.md` E6 and S8 require it to survive
greyscale.

**Only relevant if** the owner's son turns out to be colour-blind — roughly an 8% prior for a
boy, and something he would know. If so: switch to Playground, one tap on the album.

---

## Q4 · ~~Is a 24-cell table too many characters at once?~~ — **SUPERSEDED, revision 3**

**The owner overruled the premise.** He asked for the regular character table with the
unavailable characters shown, which means there is no cell ceiling to reconcile: the table is
the pack's inventory, capped only by what the device can physically hold (`ui.md` §4.6). The
question below is kept because the *worry* it records is the standing risk of revision 3 —
it is now `acceptance-criteria.md` **U7a**, and it is a Tier-5 question rather than an open
design one.

### The superseded question, as it stood

Not an owner question, recorded here because it is the one place revision 2 overrides a number
another agent owns.

`literacy-vi.md` §8.1 caps the Vietnamese palette at **6 per row and 16 on screen**;
`literacy-en.md` §6.1 caps English at **8**. Both were written for a mechanic where the palette
was a **search** — exactly one tile was right — so the cost of width scaled with width.

**Decided: the table ceiling is 24 cells, reached in five stages of 8 / 12 / 16 / 20 / 24.** The
reasoning is in `ui.md` §4.6: under discovery every live tile is a correct move, so there is
nothing to search for, and the set he must actually discriminate is the **live** set, measured
at 1–6 symbols after the first tap.

**The literacy-designer has the final word and this is flagged for the reconcile step.** If they
hold at 16, the ceiling becomes 16 and the stages become 4 / 8 / 12 / 16 — `ui.md`'s layout law,
`tools/layout-sweep.mjs` and every acceptance criterion take that with **no modification**,
because `cells` is an input rather than a constant. Nothing else in the design depends on the
number.

**`acceptance-criteria.md` U7 is the Tier-5 check that decides it for real:** does a 24-cell
table overwhelm him, or does he treat it like a keyboard? Neither I nor the literacy-designer
can answer that from here.

---

## Q5 · **NEW — the tile font's `a`: Baloo 2 is double-storey, and the reason given for choosing it was false**

**This is the one genuine owner-intent question in this document.** It is a taste and pedagogy
call about letterforms, the two candidates are both already bundled, and switching is one line.

**What happened.** `ui.md` §6.0.1 revision 1 gave four reasons for Baloo 2 and put this first:

> *"Single-storey `a` and `g`. These are the letterforms a child is taught to write… This is a
> letter-teaching app, so it is the first criterion, not a preference. It rules out Be Vietnam
> Pro for tiles."*

The Slice-3 developer reported that Be Vietnam Pro's `a` is single-storey, not double. **They
are right, and the error runs both ways.** Rendered here from the files that ship in
`assets/fonts/`:

| | `a` | `g` | `hổ`/`hô` @116 / @36 pt | ink span |
|---|---|---|---|---|
| **Baloo 2 SemiBold** *(ships today)* | **double**-storey | single-storey | 365 / 34 | **1.017 em** |
| **Be Vietnam Pro SemiBold** *(also bundled)* | **single**-storey | single-storey | **577 / 87** | 1.189 em |

So the criterion that was called decisive selected the face that fails it, and "ruled out" the
face that satisfies it.

**Decided, and this is what ships unless he says otherwise: Baloo 2 stays.** Re-argued honestly
in `ui.md` §6.0.1 on reasons that are true — it is the heavier, rounder, more block-like face,
which is what makes a tile read as a toy rather than as body text; it has the tightest vertical
ink span, which buys glyph size inside a fixed tile; and both faces clear the minimal-pair gate
with room, so that criterion does not decide.

**What the owner may want instead.** If he thinks a child learning to write should only ever see
a single-storey `a`, the tile face becomes **Be Vietnam Pro**:

- it is **already bundled** — no new asset, no licence question, no size cost;
- it **measures better** on every minimal pair (577/87 against 365/34 on the binding one);
- it is **drawn for Vietnamese**, which is why it is already the text face;
- the cost is charm: it is a text face and will look a little more like a document and a little
  less like a toy;
- and it is a **one-line change** plus a re-run of the Q-series, which is a few minutes.

**Nothing is blocked.** The app is correct either way, and `acceptance-criteria.md` Q10 records
the true state of the property instead of asserting a false one.

---

## Q6 · ~~Which device does he actually play on?~~ — **CLOSED. He answered, and proposed the fix.**

**Answered 2026-09-23:** *"he will use an **iPhone 17 plus** now, if the screen is too small,
**maybe paging the table probably do it**."*

**Both halves are settled and neither needs anything further.**

**The device.** The exact logical size of an iPhone 17 Plus was not certain — the Plus class
has been 430 × 932 since the 15 Plus, but it could follow the Pro Max line at 440 × 956. **I
modelled both and they give the same design**: 28 cells per page, Vietnamese in 4 pages
`[26 ¦ 18/17 ¦ 6]`, English in 2 `[26 ¦ 10]`, one rail row of 4 buttons, tile 75 vs 77. Both
are now named rows in `tools/layout-sweep.mjs --pages`, so it is measured rather than recalled.
**Nothing turns on resolving the ambiguity.**

**The remedy.** Paging is better than the compromise it replaces, and the table below is the
whole answer to the question this entry used to ask:

| | Revision 3 (truncate the runs) | **Revision 4 (page the table)** |
|---|---|---|
| Characters on his phone | 32 of 67 | **all 67** |
| Vietnamese words there | 21 of 47 | **47 of 47** |
| On the 360 × 640 floor | 13 of 47 | **47 of 47** |
| The 62 pt ink lever | priced, offered to him | **dropped — nothing left to buy** |

**So the question this entry existed to ask no longer exists.** It asked him to choose between
a measured ergonomic floor and his son's vocabulary. He declined the trade and named a third
option, which is the right answer to a forced choice between two bad ones.

**What is left is a Tier-5 question, not an open design one:** `acceptance-criteria.md` **U18**
— does he work out that the board continues on another page, from the rail standing up, with
nobody telling him? That is the risk paging introduces and it cannot be answered here.

### The superseded question, as it stood


**This is the only genuine question revision 3 produces, and it is a question of fact rather
than taste.**

The owner asked for one constant character table showing every character. Vietnamese has 67 of
them (26 onsets + 35 rimes + 6 tones) and they do not fit a phone at the 72 pt touch floor.
Measured with `tools/layout-sweep.mjs --zones`:

| Device | Cells | VI runs | **VI words reachable, of 47** |
|---|---|---|---|
| Android 360 × 640 | 20 | 7 / 7 / 6 | **13** |
| iPhone SE 3 375 × 667 | 24 | 9 / 9 / 6 | 16 |
| iPhone 15/16, 360 × 800 | 28 | 11 / 11 / 6 | 19 |
| iPhone 15 Pro Max, Pixel-class | 32 | 12 / 14 / 6 | 21 |
| **Any tablet** | 84–90 | **26 / 35 / 6** | **47** |

English is fine everywhere (31 of 40 at worst, all 40 at 32 cells). **Vietnamese on a phone is
a third of the game.**

**What I decided, so nothing is blocked:** the table is constant, the tile floor stays at
72 pt, and the game is optimised for the tablet it was always optimised for. A phone plays a
smaller Vietnamese game and the editor says so in his wife's language when she meets it
(`ui.md` §13.5).

**What I want from him: one sentence about the hardware.**

- **If it is a tablet** — nothing to do. He gets the whole board at 86–100 pt, which is the
  best this design has ever been.
- **If it is a phone and 13–21 words is not enough**, there is exactly one lever and I have
  priced it rather than pulled it: the hit rect already extends 6 pt beyond the ink, so a
  **62 pt ink tile inside an unchanged 72 pt hit target** takes a 360 × 640 phone from 20
  cells to 24 and from 13 words to 16. I refused it because a child aims at ink and 62 pt is
  9.8 mm of it, and because this is the third revision in which trading the measured motor
  floor for cells has been proposed. **It is one constant** (`TILE_MIN` in
  `tools/layout-sweep.mjs`, plus F2 rewritten as `tile + 2*min(6, floor(gap/2)) ≥ 72`).
- **If the real answer is "both"** — the design already handles it. The pack is identical; each
  device shows as much of it as it can hold, and the album and word list are the same on both.

**The second-order question, which he may prefer to answer instead:** the Vietnamese rime
inventory is 35 and it is what makes the table large. That is the literacy-designer's number,
not mine. A smaller rime set would fit a phone; whether it should shrink is a pedagogy
question, and I have not asked for it because shrinking the language to fit a screen is the
wrong way round.

---

## Not questions — decisions taken on a stated assumption

Recorded here so the shape of what was settled is visible without reading three documents.
**Revision-2 decisions are marked ·2·.**

| Decided | Assumption it rests on | Where |
|---|---|---|
| ·2· Discovery replaces guided completion | the owner's instruction, twice stated, and it is a better answer to the garbage worry than the palette was | `gameplay.md` §0 |
| ·2· Disabled = lies flat, keeps its letter at full opacity, still speaks | it must not read as punishment, the disabled set is doing the teaching, and "nothing happens" is a failure | `ui.md` §5.8 |
| ·2· One three-note motif, plus a fourth note for a new word | catchy is repetition and anticipation, not novelty | `ui.md` §11.4 |
| ·2· Optional parent-recorded cheer | the most-heard moment in the app can be his mother's voice, for one editor screen | `ui.md` §13.6 |
| ·2· A prefix word announces and continues; no commit gesture | a "done" button is a thing he must know to press | `gameplay.md` §5.5 |
| ·2· Undo = tap the strip; it takes that symbol and everything after it | one rule, no illegal prefix, no button, no glyph | `gameplay.md` §4.4 |
| ·2· No rounds. A shelf of five, then the album. | nothing serves him a word, so nothing can end a round — but a parent still needs a stopping point | `gameplay.md` §6.2 |
| ·2· The idle ladder plays a symbol rather than pointing at an answer | there is no answer to point at, and every live path ends in a word | `gameplay.md` §6.4 |
| ·2· The zero onset is a pressable empty socket | he must be able to start `ong` himself | `gameplay.md` §4.6 |
| ·2· The caption strip is deleted from the board | its job was to show her the target word; there is no target | `ui.md` §2.1 |
| ·2· The two shortest supported phones cap at stage 4 (20 cells) | a sixth row there would need a 59 pt tile, below every preschool guideline. The fix is a bigger screen, not a smaller tile | `ui.md` §4.4 |
| Vietnamese still shows one table at a time | tone tiles render the *chosen rime, marked*, so a three-table screen would contain an undrawable table — re-argued for revision 2, not inherited | `ui.md` §7.1 |
| Game optimised for a 10-inch tablet; editor for a phone | he plays on a tablet, she edits on the phone in her hand | `gameplay.md` §2 |
| Phones lock portrait, tablets rotate freely | decided by the fit rule: a landscape phone serves 12 cells and fails F7 | `ui.md` §4.1, §4.3 |
| Tile floor 72 pt ≈ 11.4 mm, **and it did not move for revision 2** | Vatavu et al. 2015 cited from memory; the real check is a ruler on the device, Tier 5. Lowering it would have bought four cells on two devices and was rejected | `ui.md` §4.5 |
| Tap only, no drag anywhere | a 4-year-old cannot drag; it also removes gesture-handler | `gameplay.md` §4.1 |
| Gate = spelled-out multiplication, 1.2 s hold to open | needs reading and arithmetic; needs nothing remembered in three months | `gameplay.md` §7.2 |
| The glyph sits on white at 13.4:1; the colour is in the bars | moving the colour, rather than dulling it, is what let all nine owner hexes ship unchanged | `ui.md` §5.4 |
| ·2· The chant lights the **face** gold, not the glyph | a gold glyph on white measures 1.60–2.05:1. Caught by extending the sweep, not by review | `ui.md` §5.9 |
| English uses `role1`/`role2` — the asymmetry is removed | `literacy-en.md` §3.2 requires vowels to be visually distinct | `ui.md` §5.6 |
| The mode title on every screen is the leak detector | colour cannot be, now that both modes share role tokens | `ui.md` §3 |
| Board exposes one accessibility element; tiles are hidden | a screen reader speaking letter *names* over a game about letter *sounds* would teach the opposite of the app | `ui.md` §12 |
| Audio plays through the silent switch | a parent's phone lives on silent, and a silent word game is a broken word game | `ui.md` §11.3 |
| No dark theme | a 4-year-old does not need one, and it would double the contrast work | `ui.md` §5 |
