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

## Q4 · Is a 24-cell table too many characters at once? — **decided, and flagged to the literacy-designer**

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
