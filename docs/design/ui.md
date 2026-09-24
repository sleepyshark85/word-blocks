# UI — screens, layout, visual system, motion, accessibility, the editor

**Ghép Chữ** (Vietnamese mode) · **Word Blocks** (English mode).

Owner: game-designer. Read `gameplay.md` first — it defines the loop this document dresses,
and its **§0 records the mechanic correction** that produced revision 2 of both documents.
`acceptance-criteria.md` numbers everything here as testable behaviour.

**Revision 6, 2026-09-24 — read §0D first, then §0C, §0B, §0A.** The owner ran the app on a
real iPhone for the first time and could not find the language switch or the editor. §0D is
that correction: **the language switch becomes the child's, on the board, with no gate**, and
**the parent door becomes visible while its lock stays exactly as it was.**

**Revision 5, 2026-09-23 — then §0C, then §0B, then §0A.** The owner played the
revision-4 build and said the table *"feel really random and un-organized and doesn't give my
son a sense of character order"*. He asked for the **standard alphabet**, and then said that
his son enters a digraph **letter by letter** — *"even for combine ones like ch, tr (Choose C
and choose H)"*. `literacy-vi.md` §0 and `literacy-en.md` §0 settle the content model;
**đánh vần is unchanged**. §0C is what that does to this document. Everything in revisions 2–4
stands unless §0C overrides it.

Two tools verify the claims in this document and **both exit 0** (re-run 2026-09-23 against
revision 5):

| Tool | Verifies | Result |
|---|---|---|
| `tools/theme-contrast.mjs` | every (theme × surface × foreground) pair that can co-occur, in all three themes, plus role-hue separation, the consonant/vowel pair under all three dichromacies, **and — new in revision 6 — the parent door and the language control** | **PASS**, 0 failing pairs, **141 gated checks across 3 themes, 6 decorative pairs logged**. The five new pairs are counted here and **introduce no new colour** — every token pair the two controls create is one this sweep already measured elsewhere |
| `tools/layout-sweep.mjs` | the **paged constant character-table** law over viewports 360–1400 × 600–1440 pt in steps of 4, × 9 safe-area shapes, × table sizes 1–budget, plus a page plan for both packs at every served viewport, the six-cell word strip, **and — new in revision 6 — the top bar's three children against the width the shipped font actually needs** | **PASS**, **34,023,720 layouts + 982,122 page plans**, 0 failures, **10 layout rules + 8 plan rules + 3 constant laws** |

Nothing in §4 or §5 is asserted. Every number came out of one of those two programs, or —
in §6 — out of a render of the font that actually ships, or — in §11 — out of the MP3 frame
headers of the clips in `packs/en-seed`.

**The four faults injected into revision 5's new checks, and what they did** (`CLAUDE.md`:
never trust a green check you have not seen fail):

| Injection | Into | Result |
|---|---|---|
| `VI_MAX_LETTERS` 5 → 7 — his mother adds `nghiêng` | `layout-sweep.mjs` **F17** | **exit 1**, 12 failures, first at `360×600 pages 15,14,6` |
| the strip cell's width cap deleted (`min(…, stripFitW, …)` → `min(…, TILE_MAX)`) | `layout-sweep.mjs` **F15** | **exit 1**, 12 failures, first at `368×604 cells=1` |
| `DE_MIN_ADJACENT_CVD` 20 → 25 | `theme-contrast.mjs` **ADJACENT** | **exit 1**, Popsicle consonant vs vowel under protanopia = **23.7** |
| the boundary divider drawn in `hairline` instead of `neutralFace` | `theme-contrast.mjs` **component** | **exit 1**, 3 failures, **1.30–1.38:1** against a 3.0 gate |

**The five faults injected into revision 6's new checks** (`CLAUDE.md`: never trust a green
check you have not seen fail). **Two of them were MISSED on the first pass and the reason is
worth more than the injections are:**

| Injection | Into | Result |
|---|---|---|
| `DOOR_LABEL_PT` 48.8 → 60.2 — the door's label is translated as `Người lớn` | `layout-sweep.mjs` **F22** | **exit 1**, `the parent door holds its label`, sweep not run |
| `BAR_PAD` 32 → 24 — the slop error this revision found and fixed | `layout-sweep.mjs` **F18** | **exit 1**, 12 failures, first at `444×684` landscape insets |
| `TITLE_PT` 81.4 → 200 — the mode title no longer fits under the shelf | `layout-sweep.mjs` **F19** | **exit 1**, first at `360×600 pages 15,14,6` |
| `LANG_W` 72 → 64 — the child's control drops below the motor floor | `layout-sweep.mjs` **F20** | **exit 1**, law fails, sweep not run |
| `TOP_BAR` 72 → 56 — the bar can no longer draw a 72 pt control | `layout-sweep.mjs` **F21** | **exit 1**, law fails, sweep not run |
| the door's label drawn in `neutralFace`, the grey of the dot it replaces | `theme-contrast.mjs` **bodyText** | **exit 1**, 3 failures, **3.01–3.04:1** against a 4.5 gate |

**Miss 1 — a check whose input moves with the thing it checks.** `DOOR_W` was first written as
`ceil(DOOR_LABEL_PT + 2*DOOR_PAD)`. Lengthening the label to `Người lớn` then **passed, exit
0**: the reservation grew with the label, the shelf shrank to pay for it, and nothing
noticed. `DOOR_W` is now a literal 65 and F22 asks whether the label fits inside it.

**Miss 2 — a fit rule cannot be seen to fail; it can only delete a device.** F18 and F19 were
first written into `RULES`, and `RULES` also *decides the cell budget*. Poisoning `TITLE_PT`
to 200 pt did not produce a failure: it made every 360 dp phone **unserved**, and the sweep
printed `PASS — 0 failing layouts`. This is the **F0 tautology** in a new place. Both rules are
now **plan rules**, asked only of viewports that are already served, so they can fail out loud.

---

## 0D. CORRECTION LOG — revision 6: the owner could not find either door

**2026-09-24. The app ran on a real iPhone for the first time.** Two findings, verbatim:

> - After going to either English or Vietnamese, I don't see any button or anything that can
>   let me go back to choose another language.
> - Where is the screen for me to add/edit/delete words/images/audio?

**One cause.** The language switch was parent-menu row 2; the editor was parent-menu rows 1
and 3; the parent menu was behind a 1.2 s hold on a **32 pt dot at 30 % opacity** and then a
multiplication. He commissioned this app, wrote its brief and read its design, and he could
not find the door. **His wife — the one person the editor exists for — has no chance.** An
editor nobody can reach is not an editor.

**The gate was never the problem. Hiding the gate had also hidden the door, and those are
separable.** That is the whole of this revision.

### 0D.1 The orchestrator's half of the remedy was wrong, and the owner overturned it

The orchestrator's brief said the language switch must stay behind the gate, *"a 4-year-old
must not be able to change the language"*. It put that to the owner, who rejected it in as
many words:

> This is not true, I think he should be able to change the language himself

**Recorded as the orchestrator's assumption and not the owner's, because it never was his.**
The child is four and bilingual and his father wants him to choose which language he is
playing in; that is a fact about this child's life, not a risk to be managed. Revision 3's
§7.1 argument — *"a 4-year-old who can flip languages will flip them"* — is **withdrawn**. It
was written when the only route to the chooser was a screen full of words he could not read;
the answer is to make the switch legible to him, not to lock it.

### 0D.2 What revision 6 changes

| | Revision 5 | **Revision 6** |
|---|---|---|
| Language switch | parent menu row 2, behind the gate | **the child's.** A 72 pt control at the board's top-left. No gate, no hold, no multiplication (§9.4a) |
| It opens | the chooser, committing on one tap | **the chooser, unchanged from first launch** — tap a panel, hear the language's own name, tap ▶ to commit |
| The parent surface | a 32 pt dot at 30 % opacity, unlabelled, tap does nothing | **a labelled door**: `Cha mẹ` / `Parent`, 65 × 32, top-right, tap shows the hold hint (§9.4b) |
| The lock behind it | 1.2 s hold → spelled-out multiplication → 180 s grace | **unchanged, deliberately** (§9.4b's ruling) |
| Top bar | 56 pt: title · shelf · dot | **72 pt**: language control · shelf with the mode title under it · door (§4.2, §9.4) |
| `CHROME` | 80 | **96** |
| Parent menu row 1 | *Add a word*, with *Words* three rows below | **`Words`** — one row that names add, edit and delete, which is the question he asked |
| Chooser panel tap | speaks a sample word, `mèo` / `cat` | **speaks the language's own name**, `Tiếng Việt` / `English` (§9.6, E23) |

### 0D.3 What it costs, measured

`tools/layout-sweep.mjs`, re-run. `TOP_BAR` 56 → 72 is the only chrome that moved:

| Device | Revision 5 | **Revision 6** |
|---|---|---|
| **iPhone 17 Plus 430 × 932** | VI 3 pages `[15 ¦ 14 ¦ 6]`, cap 28, tile **101**; EN 1 page, no rail, tile 84 | VI 3 pages `[15 ¦ 14 ¦ 6]`, cap 28, tile **99**; EN 1 page, no rail, tile 83 |
| **iPhone 17 Plus 440 × 956** | tile 104 | tile **102** |
| **360 × 640, the floor** | VI 3 pages, tile 73; EN 2 pages | **unchanged** |
| **iPad 11″ 834 × 1194** | 35 cells, one page, no rail, tile 116 | **unchanged** |
| **360 × 800 Android** | EN **1 page**, no rail | EN **2 pages** `[13 ¦ 13]` — the whole regression |
| Shelf slot | 32–44 pt | **29–41 pt** |
| Served viewport/inset combinations | 491,283 | **491,251** — 32 shapes lost |

**It costs no row, no page and no tile on the owner's device, and nothing at all at the floor
or on a tablet.** It costs 2 pt of tile on his phone, 3 pt of shelf slot everywhere, one
Android shape's single-page English board, and 32 of 491,283 viewport shapes.

**Two cheaper placements were measured and rejected**, so they are not re-proposed:

- **A 72 pt control row of its own** (or folding it into the page rail, which is the same
  84 pt): the **iPad's Vietnamese board goes from one page to two** `[29 ¦ 6]`, and 393 × 852
  and 430 × 932 both lose their single-page English board. 84 pt is four times the price for
  the same control.
- **Inside the word-strip row**: the strip already spends 328 of 328 pt of content width at
  the floor. Reserving 80 pt drops `stripCellW` to 34 and the strip glyph to **27 pt against
  F4's 34 pt floor** — the 360 dp phone stops being served.

---

## 0. CORRECTION LOG — what revision 2 changed in this document

**2026-09-23.** `gameplay.md` §0 has the full account of the mechanic correction. Here is
what it did to the UI, plus the six document defects the Slice-3 developer and the tester
reported, each closed.

| # | Change | Where |
|---|---|---|
| U1 | The picture frame, the veil and the N-segment border are **deleted from the board**. The picture is a full-screen reward overlay. | §4, §7, §8, §9 |
| U2 | The palette band is replaced by the **character table**, with a new live/disabled visual system. | §5.8, §7, §8, §9.1 |
| U3 | **The layout law is rewritten.** The old law laid out a frame + plate + band; the new one lays out a strip + table. Device numbers in §4.4 are all new. | §4.2–4.4 |
| U4 | **DEFECT CLOSED — "the layout law omits the caption strip."** It is closed by deletion: the caption strip's job was to show *her* the target word, and there is no target. It is gone from the board and lives on the reveal overlay, where it competes for nothing. | §4.2, §9.7 |
| U5 | **DEFECT CLOSED — "the §6.1 fixture is 86 codepoints, not 90."** Re-counted on this machine from `assets/fonts/FIXTURE.txt`: **124 non-space characters, 86 unique.** Every "90" in §6 and in `acceptance-criteria.md` Q5a is now 86. | §6.0.1, §6.1 |
| U6 | **DEFECT CLOSED — "`mả`/`mã` 935 px is not reproducible."** Correct. Re-measured against the **shipped subset**: **541 px at 116 pt, 68 px at 36 pt.** The 935 was measured against the upstream variable font and does not survive subsetting and a different rasteriser. | §6.0.1, §6.1 |
| U7 | **DEFECT CLOSED — "Q3's 36 pt floor of 40 px is too high."** Correct, and worse than reported: the binding pair `hổ`/`hô` measures **34 px** here (the developer measured 38.7 with a different rasteriser). The floor moves to **20 px**, which is 41% below the smallest real measurement and infinitely above the failure it exists to catch. | §6.1, AC Q3 |
| U8 | **DEFECT CLOSED — "Be Vietnam Pro's `a` is single-storey."** Correct, **and the error ran both ways**: Baloo 2's `a` is **double-storey**. The heaviest of the four reasons given for choosing Baloo 2 was therefore false in both directions. Re-argued honestly; Baloo 2 stays, on different grounds. | §6.0.1 |
| U9 | **DEFECT CLOSED — "Q10's `a` clause is human-verified, not automated."** Correct, and it cannot honestly be automated. Q10 is now a **human check pinned by the font file's SHA-256**, which is automatable and is the real guarantee. | §6.2, AC Q10 |
| U10 | **AC CONFLICT SETTLED — B9 vs F2.** Ruled in §9.7 and in `acceptance-criteria.md` §F: **F2 is withdrawn**, because its premise (a veiled prompt photograph that the reveal must not repeat) no longer exists. B9 survives, restated. | §9.7 |
| U11 | **Found by extending the contrast sweep:** revision 1's chant lit a glyph **gold on white**, which measures **1.60–2.05:1** and was never checked. The chant now takes a **gold face with an ink glyph** — 6.53 / 8.70 / 8.34:1. A real legibility bug, caught because the sweep grew a pair. | §5.9, §10.3 |

---

## 0C. CORRECTION LOG — revision 5, the alphabet, and a word that is now up to six taps

**2026-09-23.** `literacy-vi.md` §0 and `literacy-en.md` §0 have the owner's words and the
content model. The model changed in exactly two ways — **what a cell is**, and **how many taps
a word takes** — and everything downstream of those two facts is in this table.

| # | Revision 4 said | **Revision 5** | Where |
|---|---|---|---|
| **U28** | The Vietnamese table is three runs — **26 onsets, 35 rimes, 6 tones = 67 cells** — ordered by how many words sit behind each symbol | **Two runs: 29 letters in the owner's alphabet order, then 6 tones = 35 cells.** English is **one run of 26**, `a`–`z`. The frequency sort was the defect he reported and it was a build-time sort nobody had looked at | §4.2, §7, §8 |
| **U29** | `ch` is one tile, one tap | **`ch` is two taps — `c` then `h` — and is still one âm đầu.** The board is a letter board; the model underneath it is unchanged | §7, §7.2 |
| **U30** | **role1 = onset, role2 = rime, role3 = tone.** A role is a stage of the word | **role1 = consonant letter, role2 = vowel letter, role3 = tone.** A role is now a permanent property of the glyph, not of his progress. English already wanted this (`literacy-en.md` §3.2); Vietnamese now needs it, because **vowel-initial ≡ rime-initial** is the step-boundary rule (`literacy-vi.md` §0.5) | §5.5, §5.6, §7.1 |
| **U31** | Role separation under CVD was **printed, not gated**, because "the fixed position of each run" carried it | **The consonant/vowel pair is gated under all three dichromacies**, at dE00 ≥ 20. That argument died with the run boundaries: `a ă â b c d` puts a vowel beside a consonant in every row, and at the five branching onsets a consonant and a vowel are **live at the same time meaning opposite things**. Measured worst case **23.7** (Popsicle, protanopia). Tone stays ungated — it is a separate run and a separate page | §5.5, `tools/theme-contrast.mjs` |
| **U32** | The strip is **two or three cells** and was never sized against the content width, because three cells always fitted | **The strip is a real layout term for the first time: six cells, `STRIP_CELLS`, `STRIP_GAP` 8, `STRIP_PAD` 8, `STRIP_CELL_MIN` 40, and rules F4/F15/F16/F17.** This is the thing §0 of the literacy documents explicitly did not price | §4.2, §4.3, §4.4, §7.2 |
| **U33** | Tapping a symbol in the strip returns it **and everything after it** — per-cell undo | **Undo is the whole strip: one tap returns the last symbol, repeated taps walk back.** Not a preference — **geometry**. Five 72 pt cells need 392 pt and the 360 dp floor has 328 pt of content width, so a per-cell motor target is impossible at the floor. `STRIP_CELL_MIN` is therefore a **legibility** floor (40 pt = 34 pt glyph × the 1.15 a `ư` with a horn and a mark needs), not a motor one | §7.2, §9.2 |
| **U34** | — | **New: the span bar.** Letters that are one sound share **one continuous bar**; a new sound starts a **new bar**. `c` then `h` **grows** the bar; `c` then `a` **starts** a second one behind a divider. That is the whole answer to "he must see that `h` joined `c` rather than followed it" | §7.2, §9.2, §10.3 M22/M24 |
| **U35** | — | **New: the onset/rime boundary is MARKED and cells NEVER merge.** Three redundant channels: the bar breaks, the bar changes pattern and colour, and a 2 pt divider fades in. The only merge left in the app is **chant beat 3**, after the word is already made | §7.2, §10.4 |
| **U36** | — | **New: the superseding sound.** `c` says `cờ`; `h` then says `chờ`, replacing it. Visually: the bar grows, then **both cells pulse together** on the first frame of the new clip. The pulse is **scale, not gold** — the gold face is reserved for the chant, and a `neutralFace` divider measures **1.58–2.12:1** on gold (§5.8a) | §7.2, §10.3 M23 |
| **U37** | — | **New: the "what is missing" affordance has two forms.** A **dashed next-cell** means *another letter goes here*; a **dashed mark-slot above the carrier vowel** means *a mark goes here*. At the three points where both are true — `b`+`o`, `c`+`a`, `m`+`u` — **both are shown at once**, which is how the board says *this could end here, or it could go on* | §7.2, §9.2 |
| **U38** | The chant's beats light **cells** | **A chant beat lights a SPAN.** One rule, both languages: beat 1 of `chó` lights `c` and `h` together because they are one sound, and beat 1 of `ship` lights `s` and `h` together for the same reason. The beat count is a property of the **model**, not of the taps | §10.4 |
| **U39** | iPhone 17 Plus: VI **4 pages `[26, 18, 17, 6]`**, 28/page, 4×7 at 75 pt; EN **2 pages `[26, 10]`** | **Measured, not predicted: VI 3 pages `[15, 14, 6]`, 3×5 at 101 pt (A) / 104 pt (B); EN 1 page, no rail at all, 26 cells 4×7 at 84/87 pt.** The floor device goes 7 pages → **3**. Across the whole sweep, **93% of served combinations now need no rail**, up from 60% | §4.4, §7, §8 |
| **U40** | `zonesFor()` deleted; "served" means a page plan exists | **"Served" also means the word strip fits.** F4/F15/F16 join the fit rule, which costs **970 viewport/inset combinations out of 492,253 (0.20%) — every one of them a shape with 118 pt of left+right safe-area inset, not one real portrait phone.** Net of the smaller runs, served **rises** 489,675 → **491,283** | §4.3, §4.4 |

**The near-miss, recorded so nobody "fixes" it.** 29 letters against a 28-cell page misses a
single-page Vietnamese alphabet **by one cell** on his device. It is not bought back by shaving
the 72 pt motor floor (refused for the fifth revision running) or the inter-tile gap (F6 is what
stops hit rects overlapping). The `15 ¦ 14 ¦ 6` split is a better answer anyway: **page 1 is
`a`…`m`, page 2 is `n`…`y`, page 3 is the hats** — a rule his mother can say out loud.

**And one cost of that split, found by walking the pack against it and reported rather than
buried.** `h` lives on page 1 and `n`, `p`, `t` live on page 2, so **`nh`, `ng`, `ph` and `th`
are cross-page digraphs**: after tapping `t`, the `h` that completes `th` is one page away. This
is not a defect of paging — it is what an alphabet costs when it does not fit one screen — and
the rail is exactly the object that answers it: page 1's button stands the moment `h` goes live.
It is called out because it is the one place revision 5 asks more of him than revision 4 did,
and because **on a tablet, and in English on his own phone, it does not arise at all.**

---

## 0B. CORRECTION LOG — revision 4, the owner's own remedy: page the table

**2026-09-23.** `gameplay.md` §0B has his words and the full account. This is what paging did
to *this* document.

| # | Revision 3 said | Revision 4 | Where |
|---|---|---|---|
| **U21** | The table is `min(pack inventory, device cell budget)`; a run that does not fit is **truncated** by `zonesFor()`'s 0.48 split | **Nothing is truncated. The table is paged.** Runs never share a page; a long run splits into balanced consecutive pages. Every served device shows every character. `zonesFor()` is deleted from the tool, with a note in its place | §4.2, §4.4, §7.1 |
| **U22** | — | **New: the page rail.** One 72 pt button per page, made of tiles, standing or flat exactly as a table tile is, wrapping to at most 2 rows. It is the page control, the position indicator and the cross-page liveness signal, in one object | §4.2, §7.1b, §9.1a |
| **U23** | — | **New: the paging fixpoint.** The rail costs table height → lowers capacity → can raise the page count → can force the rail to wrap. The layout law iterates to a fixpoint; the sweep asserts convergence (**F10**) and measures it at **1 step, worst case, across all 489,675 served viewports** | §4.2, §4.3 |
| **U24** | F7: a served viewport holds ≥ 20 cells | **F7: a served viewport can build a page plan for both packs.** "Served" has to mean "can be played", not "holds a number of cells". Served combinations rise **436,208 → 489,675** | §4.3 |
| **U25** | §4.5 priced the **62 pt-ink / 72 pt-hit-rect lever** and handed it to the owner | **Dropped.** It existed to buy back vocabulary on a small screen; paging returns all of it. The 72 pt floor stands for the fourth revision, now with no cost attached to standing | §4.5 |
| **U26** | §4.4's device table is about cells and words | **Rewritten as pages.** Both candidate sizes for the iPhone 17 Plus are named rows in the tool and **give the same plan** — 4 pages, 28 per page, 1 rail row | §4.4 |
| **U27** | §13.5 "not on the board yet" is the normal state of every phone | **Back to a true edge case:** it fires only for a character absent from `inventoryOrder` altogether | §13.5 |

**A rule the sweep produced, by failing.** When paging first went in, the sweep reported 12
failures of a new rule **F14** ("a served viewport serves both packs") at 360 × 600. That was
not a layout bug — it was this document defining "served" as a cell count while the app's
actual requirement had become a page plan. The definition was wrong, not the arithmetic, and
the sweep is what said so. F14 is gone because F7 now means the right thing.

---

## 0A. CORRECTION LOG — revision 3, from the owner playing the built app

**2026-09-23.** `gameplay.md` §0A has the four findings verbatim and what each one
overturns. This table is what they did to *this* document. Every row names what revision 2
said, because a document that quietly becomes right is a document nobody can audit.

| # | Revision 2 said | Revision 3 | Where |
|---|---|---|---|
| **U12** | "**The table morphs** — onset → rime → tone. Exactly one role is on screen at a time. **This was re-argued for revision 2 rather than inherited, and it survives on stronger grounds.**" (§7.1) | **One constant table.** Every character, in a cell that never moves, three contiguous runs, unavailable ones shown flat. The morph is deleted. Two of §7.1's three grounds did not survive contact with the owner and one did not survive measurement — see §7.1. | §4, §5.8, §7, §7.1, §8, §9.1 |
| **U13** | The **∅ tile**, "the last cell of the onset table, drawn as an empty socket" | **Deleted.** A vowel-initial word starts on the vowel, because the rimes are permanently on the board. | §7, §7.2, §9.1 |
| **U14** | The Vietnamese strip is **three cells** — `onset ┊ rime ┊ tone` — and the tone cell **names the tone in words** (`m ┊ èo ┊ huyền`) | The strip is **the word so far plus one dashed cell**, in both languages. **No tone cell.** The tone is the mark, on the rime. The `huyền` in that cell was a word a pre-literate child cannot read, on the child's screen — a no-text violation this document shipped. | §7.2, §9.2, §9.3 |
| **U15** | The chant lights three static cells in turn | The chant **accumulates**: `b` → `b o` → `bo` → `bò`. Five beats, specified with what is shown and what is spoken. | §10.3 M11/M12, §10.4 |
| **U16** | "One channel for tile sounds… **the announcement owns a second channel**", tile audio **ducked to −18 dB** under the motif, `long` anchored clip on a tile's first touch | **One speech channel that cuts hard**; the motif **stops** speech rather than ducking it; **a tap always plays `short`**; the anchored form is demoted to the adult-initiated parts hint. Driven by a measurement, not a preference — §11.0. | §11.0–§11.4 |
| **U17** | "Language is chosen once… changing it later takes the same two-touch confirm" | **Switchable at any time by an adult**: parent menu row 2, one tap, reusing the chooser, with a 180 s gate grace. R3 and R4 both survive unchanged. | §3, §13, `gameplay.md` §7.1 |
| **U18** | The layout law caps the table at **24 cells** and the grid at **6 columns**; `CHROME = 86` | The table is the **pack's inventory capped by the device's cell budget** (20–90). Columns run 3–12, chosen to maximise the tile. `CHROME = 80`. **The 72 pt tile floor did not move.** | §4.2–§4.6 |
| **U19** | — | **Found by extending the contrast sweep, again.** A `roleSoft` tint behind each run was designed, and the sweep measured a role outline on its own tint at **2.62–2.92:1** in 5 of 9 (theme × run) pairs, under the 3.0 component gate. The tint is cut. Second time this sweep has caught a real bug by growing a pair (cf. U11). | §5.8a |
| **U20** | The contrast tool's CVD rationale rested on "role is carried by three channels — the bar pattern, **the fact that the Vietnamese band shows exactly one role at a time**, and colour" | That sentence is now **false** — all three roles are on screen together. Re-made rather than inherited: the second channel is **fixed position**, which is stronger because it does not depend on what he has tapped. | §5.5, `tools/theme-contrast.mjs` |

**One thing this document now says about its own sweep that it did not say before.** The
seven fit rules also *decide* the cell budget, so for a served table size they cannot fail —
the inner loop was tautological, which I found by injecting a fault (raising F4's floor from
34 to 45) and watching the sweep still print PASS. The sweep now carries **F0**, "the viewport
serves this table size", which is the non-tautological claim: that every size up to the
reported budget is genuinely held, and that the fit rule is monotone in cells. Injecting a
budget overclaim (`cells <= mc + 1`) makes it exit 1 naming F0. Recorded because a green check
nobody has seen fail is not a check, and this one had been green for two revisions.

---

## 1. Two products in one binary

| | The game | The parent surfaces |
|---|---|---|
| User | a 4-year-old who cannot read | his mother, who can |
| Looks like | a table of coloured blocks, and nothing else | an ordinary, conventional, labelled mobile app |
| Text | the letters themselves, and nothing he must read | freely |
| Type | Baloo 2, 36–68 pt | Be Vietnam Pro, 13–24 pt |
| Ground | the theme's bright `ground` | `groundAlt` (white) |
| Navigation | none | a back chevron and a title, everywhere |
| Optimised for | a **10-inch tablet**, flat or propped | a **phone**, one-handed |

They must not be confusable, by anyone, including the tester. That is why they share only the
colour tokens and nothing else.

---

## 2. What co-play changes, and what it deliberately does not

His mother plays with him. That is the highest-value mode for early literacy, and it loosens
one rule precisely:

> **Old rule:** no text he must read.
> **New rule:** nothing he needs is text-only, and nothing on screen asks *him* to read.

Revision 2 needs the loosening in **fewer** places, because the board carries no text at all
any more — only the letters, which are the game.

### 2.1 The board has no caption strip

Deleted. Its job was to show her the target word, and there is no target. What she sees
instead is better: **the word he is building, in tiles, at 58–68 pt**, which she can read
across the room, point at and say aloud before the audio does. The parent setting
`Show the word` survives with a narrowed meaning: it governs the **reveal caption** (§9.7) —
the word and its sentence under the photograph — and defaults to **on**.

### 2.2 The parts hint — a hint an adult knows to use

**Press and hold the word strip for 800 ms** → the app speaks the *parts* of what is currently
assembled — the đánh vần of the partial syllable, or the letter sounds — never a completion and
never a suggestion. **Revision 3 gives it a second job: it is the only place the English
anchored clips ("kuh, cat") are ever played** (§11.2). They are curriculum for an adult to use
with him, they are 2.9–3.5 s long, and firing them on a tap is what produced the owner's
"voices mixed up with each other". It is the pedagogically correct hint: say the pieces, let him find the
rest. It places nothing, does not reset the idle ladder and does not count as an assist.

The hold moved from the picture frame (which no longer exists) to the strip, which is the
biggest non-tile object on the board. A short tap on the strip is **undo** (`gameplay.md`
§4.4), so the two gestures are: tap = take it back, hold = say what I have. Both live on the
same object, and the child-discoverable one is the harmless one.

### 2.3 The say-it-together beat

The reveal holds the word large on the full-screen picture, silent, from **+1400 ms to
+2200 ms** — long enough for her to say it with him — then speaks the word once more so the
last thing heard is correct. Solo it reads as a beat of rest. No icon, no instruction.

### 2.4 The cheer — new in revision 2

The single best thing co-play can put into this app: **her voice, at the moment he makes a
word.** One 2-second recording per pack, layered over the announcement motif. Recorded on one
editor screen (§13.6), removable, re-recordable. Absent by default and nothing is missing
without it.

### 2.5 Capture the word he just asked for

**`Words` is the first row of the parent menu**, reachable from anywhere via the parent door
(§9.4b) — and, **new in revision 6, its label names all three verbs**, because the owner's
second finding was *"where is the screen for me to add/edit/delete words/images/audio?"*
Revision 5 split the editor across two rows, *Add a word* at the top and *Words* three rows
below, and two rows that both lead to the editor make neither of them the editor. One row
now, and the list it opens carries the `+`.
Entering the editor from the board remembers the board; saving or cancelling returns to it
unchanged, with the strip still assembled. The moment he says *"where's the digger?"* is the
best moment to add the digger, and it is two taps away.

### 2.6 What does not change

- **No two-player mode, no turn-taking, no pass-the-device.** The ask was warmth, not
  mechanics — and §2.4 is the warmth.
- **Solo play is complete.** The idle ladder still guarantees the app keeps playing
  (`gameplay.md` §6.4), the audio still carries the whole game, and nothing needs an adult.
- **Nothing moves in front of the gate.**
- **No progress dashboard, no parent report, no streak.** There is still no score in this app
  for anybody.
- **Neither language is secondary.**

---

## 3. Structural defences against a language leak

Colour cannot be the leak detector, because both modes use the same role tokens (§5.6). So:

1. **The mode title is on every screen.** 13 pt `inkSoft`: `Ghép Chữ` or `Word Blocks`. Every
   screenshot the tester takes carries its own label. **Revision 6 moves it from the left edge
   to directly under the shelf**, still in the top bar (§9.4) — the language control now owns
   the left edge — and adds a **second, wordless leak detector beside it**: the control's
   filled bar is the **top** one on a Vietnamese board and the **bottom** one on an English
   board, always, so a screenshot is labelled twice and one of the two labels survives being
   photographed at a distance.
2. **No screen component is shared between modes.** The Vietnamese table and the English table
   are separate screens with separate state; there is no `<Table lang=…>`.
3. **Switching language unmounts and remounts the whole game**, reloads the pack and rebuilds
   the prefix tree. **Revision 3 makes this happen far more often** (`gameplay.md` §7.1 — the
   owner wants to switch freely), so it moves from a rare path to a routine one: the teardown
   is what makes "switching is not mixing" true, there is no instant at which two packs are
   loaded, and **R4 is unchanged** — no code path reads the other language's pack. A switch
   also **stops all audio hard rather than fading**, because an 800 ms fade would play the
   outgoing language over the incoming board.
4. **No fallback path exists.** A word missing an asset is withheld from the tree, never
   substituted. No default string, no `??`, no `||` onto the other pack.
5. **One documented exception:** the chooser shows both titles, because it must. **Revision 6
   makes it reachable from the board in one tap** (§9.4a) rather than only at first launch and
   from the parent menu, so the exception is visited far more often. It is still **one screen
   and one code path**, it still loads no pack, and the panels' spoken names (E23) are two
   clips that live in the two packs and are played one at a time by a screen that owns
   neither board. **R3 and R4 are unchanged.**

---

## 4. Layout

### 4.1 Device range

Designed across a **continuous range**, not a device list:

| | |
|---|---|
| Supported viewport width | **360 – 1400 pt/dp** |
| Supported viewport height | **600 – 1440 pt/dp** |
| Below 360 wide or 600 tall | a parent-facing "this screen is too small" card. No game. |
| Orientation | whichever can build a page plan **and** the six-cell word strip for both packs (§4.3, F7 / F15 / F16) |

In practice **phones lock to portrait** and **tablets rotate freely**. Evaluated once at
startup from the screen metrics, never per frame, so the device cannot flip-flop. The sweep
served 432,297 viewport/inset combinations and rejected 8,271 on exactly this basis.

**Rotating mid-word changes only pixels.** The engine is pure and presentation replays
resolved state: seated symbols stay seated, the live set is unchanged, audio does not restart.
On a tablet the grid changes from 4 × 5 to 6 × 4 and the **reading order of the table is
identical** — row-major over the same fixed inventory order — so nothing he has learned about
where a letter lives is invalidated by a rotation.

### 4.2 The layout law

One vertical stack. Both orientations. Both modes. Three elements and nothing else.
**Revision 3 changes three things and leaves the rest alone** (U18): the column range,
the cell ceiling, and six points of chrome.

```
INPUT   Wv, Hv           viewport, pt (iOS) / dp (Android)
        insetT/B/L/R     safe-area insets
        runs             the pack's inventory as run lengths -- REVISION 5
                           VI [29 letters, 6 tones]            EN [26 letters]
        maxLetters       the pack's longest word, in letters (VI 5, EN 4) -- F17
        railRows         rows of page buttons (0 when the table is not paged)

RAIL_GAP = 12    RAIL_MAX_ROWS = 2
railCols = max(1, floor((CW + RAIL_GAP) / (72 + RAIL_GAP)))
railH(0) = 0
railH(n) = n*72 + (n-1)*RAIL_GAP + RAIL_GAP

W        = Wv - insetL - insetR
H        = Hv - insetT - insetB - railH(railRows)
gutter   = clamp(round(W * 0.045), 14, 44)
CW       = W - 2*gutter                          content width
tableW   = min(CW, 1280)                         ~200 mm two-handed reach cap

TOP_BAR  = 72        GAP_STRIP = 12        PAD_BOTTOM = 12   -- REVISION 6: 56 -> 72
CHROME   = TOP_BAR + GAP_STRIP + PAD_BOTTOM                      = 96

gap(t)    = clamp(round(t * 0.15), 10, 18)
stripH(t) = clamp(round(t * 1.05), 76, 140)

; the grid is SEARCHED over the column count, not fixed:
grid     = over cols in 3..min(12, cells), rows = ceil(cells/cols),
             tile(cols) = the largest t in [116..72] with
               cols*t + (cols-1)*gap(t)                      <= tableW
               stripH(t) + rows*t + (rows-1)*gap(t) + CHROME <= H
           pick the (cols, rows, tile) with the LARGEST tile;
           ties go to the squarer grid (min |cols - rows|)
           (if no cols works, this viewport does not serve this table size)

gap      = gap(tile)   stripH = stripH(tile)
slack    = H - CHROME - stripH - (rows*tile + (rows-1)*gap)
gapY     = clamp(gap + floor(slack / (rows+1)), gap, round(tile*0.45))
tableH   = rows*tile + (rows-1)*gapY
rowW     = cols*tile + (cols-1)*gap

; ---- THE WORD STRIP.  New terms in revision 5 (U32); the height half is unchanged ----
STRIP_CELLS = 6    STRIP_GAP = 8    STRIP_PAD = 8    STRIP_CELL_MIN = 40

stripCellH = stripH - 2*STRIP_PAD                     ; == stripH - 16, revision 4's term
stripFitW  = floor((tableW - (STRIP_CELLS-1)*STRIP_GAP) / STRIP_CELLS)
stripCellW = min(round(stripCellH * 0.82), stripFitW, 116)
stripRowW  = STRIP_CELLS*stripCellW + (STRIP_CELLS-1)*STRIP_GAP
stripFont  = floor(min(stripCellH / 1.55, stripCellW * 0.82))

tileFont  = floor(min(tile * 0.52, (tile - 16) / 1.55))
; ---- THE TOP BAR.  New in revision 6 (§0D): it carries TWO doors ----
LANG_W  = 72    DOOR_PAD = 8    DOOR_W = 65    BAR_PAD = 32    BAR_AIR = 12
SLOT_GAP = 6
shelf     = clamp(floor((CW - LANG_W - DOOR_W - BAR_PAD) / 5.4), 0, 44)
shelfRowW = 5*shelf + 4*SLOT_GAP
; measured from the shipped face, BeVietnamPro-Medium at 13 pt:
TITLE_PT       = 81.4     ; `Word Blocks`, the wider mode title (`Ghép Chữ` = 62.9)
DOOR_LABEL_PT  = 48.8     ; `Cha mẹ`,      the wider door label (`Parent`   = 43.2)
budget(railRows) = the largest `cells` in 1..90 this viewport serves at that rail height

; ---- THE PAGE PLAN, and the fixpoint that sizes it ----
pagePlan(runs, cap):
    for each run: k = ceil(len/cap); split into k pages of as equal size as
    possible, earlier pages taking the remainder.  RUNS NEVER SHARE A PAGE.

planFor(viewport, runs):
    total = sum(runs)
    if total <= budget(0):        -> ONE page, NO RAIL.   (this is every tablet)
    railRows = 1
    loop (at most RAIL_MAX_ROWS times):
        cap   = budget(railRows);  if cap < 12 -> NOT SERVED
        pages = pagePlan(runs, cap)
        need  = ceil(pages.length / railCols)
        if need > railRows: railRows = need; continue      ; the rail wrapped
        cells = max(pages)                                 ; ONE grid for every page
        return { pages, cap, railRows, cells }
    NOT SERVED                                             ; a third rail row
```

What changed, and why each one:

- **Columns run 3–12 and are searched, not capped at 6.** Revision 2 took "the most 72 pt
  tiles that fit across", which was right for a table that was always wider than tall and
  wrong for a 67-cell one: it would have forced 12 rows on an iPad. Searching for the largest
  tile gives an iPad's Vietnamese table **7 × 10 at 86 pt in portrait and 12 × 6 at 81 pt in
  landscape**, both above the floor, where the old rule served neither.
- **The ceiling is 90, not 24.** The old ceiling was a judgement about how much to show a
  4-year-old at once; the owner overruled the premise. No pack inventory exceeds 67 today, so
  90 is headroom, not a target.
- **`CHROME` drops 86 → 80.** `GAP_STRIP` 14→12 and `PAD_BOTTOM` 16→12. Six points, and it is
  worth exactly one more row of tiles on two real devices: **iPhone SE 3 goes 20 → 24 cells**
  and a **360 × 800 Android goes 24 → 28**. Measured by running the sweep both ways, not
  reasoned about.
- **Tile size is computed once per device and never changes**, because the table never
  changes. Revision 2 needed a clause promising a tile would not resize under his finger
  during a morph; there is no morph. **Revision 4 extends it across pages:** `cells` is the
  **largest** page, and every page renders at that tile size and column count, **top-aligned**,
  so row 1 sits at the same height on every page and a shorter page simply has empty space
  below it. A tile never resizes or reflows when he changes page.
- **The rail is charged before the table is laid out**, off the top of the available height.
  It costs one row of tiles on his iPhone (32 cells per page → 28), which is the price of
  reaching all 35 characters instead of 32. **In English on that device it costs nothing at
  all**, because 26 letters fit one page and there is no rail (§8).
- **The fixpoint is monotone and therefore terminates**: adding a rail row only lowers
  capacity, and lowering capacity only raises the page count. Measured across the whole sweep,
  it converges in **1 step, worst case** — the wrap is decided on the first pass everywhere
  except the smallest phones, which settle on the second.
- **The top bar is 72 pt because the child's language control is 72 pt** (§0D, §9.4a). It is
  a child target, and §4.5's floor is about his hand rather than about the control's
  importance — the same sentence that holds the page-rail buttons at 72. The **mode title
  moves out of the left edge**, where the control now lives, and is drawn **under the shelf**:
  44 pt of shelf + an 18 pt line = 62 ≤ 72, and it costs **no width at all**, because the
  shelf row (159–244 pt) is always wider than the title (81.4 pt). **F19** is what makes that
  a fact rather than a hope.
- **`BAR_PAD` is 32, not 24, and the 8 pt was bought with a measurement.** The shelf's `/5.4`
  divisor models five slots plus four gaps as 5.4 slot-widths — a gap of one tenth of a slot,
  which is true at the 44 pt ceiling and false at 23, where the four real 6 pt gaps cost 24 pt
  and the model reserves 9. At `BAR_PAD = 24` the worst top-bar air over the whole sweep was
  **0.2 pt**; at 32 it is **6.2 pt**. It costs the shelf slot 3 pt.
- **The strip is sized for six cells, always, on every device, in both languages** — not for
  the word he happens to be building. A cell that resized as the word grew would be a morph
  under his finger, which is the thing revision 3 deleted. Six is the *reserved track*; only
  the used cells are drawn, and the track is left-aligned from a fixed origin, so **nothing
  already written ever moves.** This is writing: it starts at the left and grows right.
- **`STRIP_CELLS = 6` is measured, not chosen.** At seven cells the strip glyph on a 360 dp
  phone falls to **31 pt** against F4's 34 pt floor (`tableW` 328, `stripCellW` 40). Six is
  therefore the longest word the smallest supported phone can show legibly, and it is handed
  to the content-engineer as **the cap the editor must enforce** — F17 is the rule that checks
  it against the real pack rather than against my arithmetic.
- **`stripCellH` is exactly revision 4's term** (`stripH − 16`), so the height half of the
  strip has not moved. What revision 5 adds is the **width** half, and on every phone it is the
  width that binds: his iPhone lays a 58 × 90 cell, limited by `stripFitW` (58), not by
  `round(stripCellH × 0.82)` (74).
- **A strip cell is not a 72 pt motor target and cannot be one** (U33). Five 72 pt cells need
  `5×72 + 4×8 = 392` pt; a 360 dp phone has 328 pt of content width. `STRIP_CELL_MIN = 40` is
  a legibility floor instead: 34 pt of glyph (F4) × the 1.15 a `ư` carrying both a horn and a
  tone mark needs = 39.1, rounded up.
- There is no caption term, because there is no caption strip (§2.1, correction U4).
- There is **no `stage` term**, because there are no stages (`gameplay.md` §3.6). `cells` is
  now a property of the pack and the device, decided once at startup.

### 4.3 The fit rule

A viewport is served iff **F7** holds, and then all of F1–F6 and F8 hold for every table size
up to `budget`:

| | Rule | Why |
|---|---|---|
| **F0** | `layout(cells)` is non-null for every `cells` ≤ `budget` | the sweep's own claim: the reported budget is genuinely served, and the fit rule is **monotone in cells**. **This is the only rule that is not tautological** — see below |
| **F1** | `rowW ≤ tableW` | no horizontal scroll, ever |
| **F2** | `tile ≥ 72` | the motor floor, ≈11.4 mm (§4.5) |
| **F3** | `slack ≥ 0` | the stack fits |
| **F18** | `LANG_W + max(shelfRowW, TITLE_PT) + (DOOR_LABEL_PT + 2·DOOR_PAD) + BAR_AIR ≤ CW` | **new in revision 6 — the top bar's three children fit, measured against the text the bar actually draws.** Worst air over the whole sweep: **18.2 pt** against a 12 pt gate, at `440 × 684`. A **plan** rule, not a fit rule — see below |
| **F19** | `TITLE_PT ≤ shelfRowW` | **new in revision 6** — the mode title is drawn *under* the shelf, so the shelf row is its box. This replaces the 96 pt the title used to reserve at the left edge. Worst slack **57.6 pt**. A plan rule |
| **F20** | `LANG_W ≥ TILE_MIN` | **new in revision 6, a constant law** — the language control is a child target and is held to the tile's floor, exactly as a page-rail button is (§4.5) |
| **F21** | `TOP_BAR ≥ LANG_W` | **new in revision 6, a constant law** — and the bar is tall enough to *draw* it. Without this the control could become a 72 pt hit rect around 56 pt of ink, which §4.5 refuses in as many words |
| **F22** | `DOOR_LABEL_PT + 2·DOOR_PAD ≤ DOOR_W` | **new in revision 6, a constant law** — the door's reserved width really does hold its label |
| **F4** | `stripFont ≥ 34` | the word he is building reads across a room. **Restated in revision 5**: the glyph is now limited by the strip *cell*, not by the strip's height, because six cells across a phone is what binds. Measured: under the old formula F4 was the only failing rule in **0 of 17,321,319** layouts — it never bound. It binds now |
| **F5** | `tileFont ≥ 24` | `ngh`, `ăng`, `uống` still legible on a tile |
| **F6** | `gap ≥ 10` | hit rects can never overlap (§4.5) |
| **F7** | `planFor(v, runs) ≠ null` for **both** packs | **restated in revision 4 (U24).** A served viewport is one that can be *played*, which is a page plan, not a cell count |
| **F8** | `shelf ≥ 22` | five shelf slots fit the top bar |
| **F9** | `railCols ≥ 1` | at least one page button fits a rail row |
| **F15** | `stripRowW ≤ tableW` | **new in revision 5.** Six strip cells and five gaps fit the content width. Revision 4 never asked this, because three cells always fitted |
| **F16** | `stripCellW ≥ 40` | **new in revision 5.** The legibility floor of a strip cell (U33). Not a motor floor — undo is the whole strip |

Five more rules are about the **page plan** rather than about one layout — the thing revision
4 adds, and therefore the thing most likely to be wrong:

| | Rule | Why |
|---|---|---|
| **F9p** | `pages ≤ railRows × railCols` | every page has a button, and the rail fits |
| **F10** | the fixpoint converged in ≤ `RAIL_MAX_ROWS + 1` steps | it is monotone, so this should be provable; the sweep proves it instead. **Measured: 1 step, worst case, over 979,350 plans** |
| **F11** | `max(pages) ≤ cells ≤ cap` | the one grid really does hold the largest page |
| **F12** | `sum(pages) = sum(runs)` | **every character is on exactly one page** — nothing dropped, nothing duplicated |
| **F13** | every page is non-empty | no blank page in the rail |
| **F17** | `maxLetters ≤ STRIP_CELLS` and `stripFont ≥ 34` at the plan's chosen layout | **new in revision 5, and the only strip rule that is not circular.** F4/F15/F16 also *decide* the cell budget, so for a served size they cannot fail — the same tautology F0 exists to break. F17 asks what the budget cannot: does the **pack's** longest word fit the strip the **device** laid out? Injecting `VI_MAX_LETTERS = 7` — his mother adding `nghiêng` — makes the sweep **exit 1 naming F17** at `360×600 pages 15,14,6` |

`tools/layout-sweep.mjs` is the rule, executable. It is the Tier-4 artefact and it must stay
green. **Nothing scrolls and nothing is off-screen:** F1 and F3 together mean every character
the board holds is visible at once, which is what makes the owner's "the disabled characters
are still being shown" true rather than aspirational.

**F7 changed meaning, and the sweep is what caught it.** When paging first went in, F7 still
asked for a cell count and the sweep reported **12 failures of a temporary rule F14** ("a
served viewport serves both packs") at 360 × 600 — viewports that held 16 cells and could not
page 67 characters into a rail that fits. The arithmetic was right and the *definition* was
wrong. F7 now means "can build a page plan", F14 is gone, and **53,467 more viewport/inset
combinations are served than in revision 3** because paging reaches devices truncation could
not.

**What the strip cost, measured rather than waved at.** Putting F4, F15 and F16 into the fit
rule means a viewport that cannot show the word he is building is not served — the same move
U24 made for the page plan, for the same reason: *served* has to mean *can be played*, and a
board you cannot write on cannot be played. The price is **970 viewport/inset combinations out
of 492,253 — 0.20%** — and **every one of them has 118 pt of left+right safe-area inset**, i.e.
an iPhone-landscape shape. `tableW` is 274 there; the strip lands a 39 pt cell and a 31 pt
glyph. **Not one real portrait phone is lost**, and the 360 × 600 floor keeps 8 pt of margin on
F16 and 5 pt on F4. Net of revision 5's smaller runs, the served count *rises*: 489,675 →
**491,283**.

**F0, and why it had to be added.** F1–F8 are used twice: to compute the budget and to check
each table size. That makes the per-size check circular — a size that fails a rule is simply
not in the budget. I found this by injecting a fault (raising F4's floor from 34 to 45) and
watching the sweep print **PASS** anyway. F0 is the claim that survives the circularity.
Injecting a budget overclaim (`cells <= budget + 1`) now makes it exit 1 naming F0 on
`360×608 cells=21`. A green check nobody has seen fail is not a check, and this one had been
green for two revisions.

### 4.4 Verified output, representative devices

From `node tools/layout-sweep.mjs --devices` and `--pages`, 2026-09-23, both exit 0.
`¦` marks a run boundary. **These are measurements. `literacy-vi.md` §0.11 and
`literacy-en.md` §0.2 carry hand-computed predictions and say so; four of their rows are
wrong in the app's favour and one device is wrong in both directions.**

```
device                          cap  VI pages        EN pages      VI grid  tile  strip cell  glyph  rail
Android compact 360x640 (floor)  16  3  15/14 ¦ 6    2  13/13       4x4      73    48 x 61     39     1 row
iPhone SE 3     375x667          20  3  15/14 ¦ 6    2  13/13       4x4      76    50 x 64     41     1 row
Android tall    360x800          24  3  15/14 ¦ 6    1  ALL 26      3x5      84    48 x 72     39     1 row (VI only)
iPhone 15/16    393x852          24  3  15/14 ¦ 6    1  ALL 26      3x5      89    52 x 77     42     1 row (VI only)
Android large   412x915          28  3  15/14 ¦ 6    1  ALL 26      3x5     100    55 x 89     45     1 row (VI only)
iPhone 15 Pro Max 430x932        28  3  15/14 ¦ 6    1  ALL 26      3x5     101    58 x 90     47     1 row (VI only)
** iPhone 17 Plus (A) 430x932    28  3  15/14 ¦ 6    1  ALL 26      3x5     101    58 x 90     47     1 row (VI only)
** iPhone 17 Plus (B) 440x956    28  3  15/14 ¦ 6    1  ALL 26      3x5     104    60 x 93     49     1 row (VI only)
iPad 11" portrait  834x1194      90  -  ONE PAGE 35  -  ALL 26      5x7     116    87 x 106    68     none
iPad 11" landscape 1194x834      84  -  ONE PAGE 35  -  ALL 26      9x4     108    80 x 97     62     none
iPad 13" landscape 1366x1024     90  -  ONE PAGE 35  -  ALL 26      7x5     116    87 x 106    68     none
Android tablet 800x1280 port.    90  -  ONE PAGE 35  -  ALL 26      5x7     116    87 x 106    68     none
iPhone 15 LANDSCAPE 852x393      LOCKED (fails F7)
```

**Prediction versus measurement, stated plainly because the difference is the point of
re-running the tool:**

| | `literacy-vi.md` §0.11 predicted | **Measured** |
|---|---|---|
| 360 × 640 floor, VI | 4 pages `10 ¦ 10 ¦ 9 ¦ 6`, 12 per page | **3 pages `15 ¦ 14 ¦ 6`, 16 per page** — better, and for a reason the hand computation could not see: 35 cells needs only **one** rail row where 67 needed two, and the row it gives back raises the capacity from 12 to 16 |
| iPhone SE 3, VI | 3 pages, cap 16 | 3 pages, **cap 20** |
| iPhone 17 Plus, VI | 3 pages, cap 28 | 3 pages, cap 28 ✓ — **and a 101 pt tile, not 75** |
| 360 × 800 and 393 × 852, EN | 2 pages `13 ¦ 13` | **1 page, no rail.** The 26-letter alphabet fits a mid-size Android and an iPhone 15 whole |
| iPhone 17 Plus, EN | 1 page, no rail | ✓ **confirmed** |

**The tile got much bigger, and that is the largest visible change after the ordering.** One
grid serves every page and it is sized by the **largest** page, which fell from 26 to 15. On
his device the Vietnamese board goes **4 × 7 at 75 pt → 3 × 5 at 101 pt** — a 16 mm tile, 79%
larger in area. The alphabet reads down in threes:

```
   a  ă  â        page 1, rows 1-5        n  o  ô          page 2
   b  c  d                                ơ  p  q
   đ  e  ê                                r  s  t
   g  h  i                                u  ư  v
   k  l  m                                x  y
```

**The tone page holds 6 cells in a 15-cell grid**, top-aligned, with three empty rows below.
That is deliberate and unchanged from revision 4: *one standing tile on an otherwise empty page
is the clearest possible final step*, and top-alignment is what keeps row 1 at the same height
on every page.

Sweep verdict:

```
swept viewports 360..1400 x 600..1440 step 4, x 9 safe-area shapes
  491283 viewport/inset combinations served
  982566 page plans built (both packs per viewport), 933590 of them needing NO rail
  paging fixpoint: converged every time, worst case 0 step(s) (F10 allows 3)
    vi-seed page-count distribution:
       1 page(s)  457433
       2 page(s)  168
       3 page(s)  32590
       4 page(s)  1092
  4356 rejected (F7: no page plan for both packs, or landscape phone)
  34463217 layouts checked against 10 rules, plus 6 plan rules

tightest served layout: 360x600 insets {"insetT":0,"insetB":0} cells=1
  tile 99  grid 3x1  row 327/328  strip 104  table 99  slack 317  shelf 32  margin 0
  word strip: 6 cells of 48x88pt, row 328/328, glyph 39pt (F4 floor 34, F16 floor 40)

PASS - 0 failing layout(s).
```

Read that distribution as the shape of the product. **457,433 of 491,283 served combinations —
93% — need no pages at all**, against 60% in revision 4. The Vietnamese board now tops out at
**4 pages** where revision 4 reached 7, and the fixpoint converges in **0 steps**: the rail
never wraps, on any served viewport, so `RAIL_MAX_ROWS = 2` is now headroom rather than a
constraint that binds. The 168 two-page plans are the narrow band where 29 letters fit one page
but 35 cells do not — `[29] [6]`.

**What a bigger screen buys is still comfort, not content.** Every served device reaches every
word in both packs; a tablet simply shows all 35 cells at 116 pt with no rail.

### 4.4a Why the table **pages** rather than scrolls

Revision 3 rejected scrolling and the rejection still stands — but revision 4 has to say why
**paging** is a different thing rather than scrolling with detents, because the objections
below are exactly what a page rail has to answer.

| | Scrolling | **Paging** |
|---|---|---|
| Where a character lives | a continuous offset; "`m` is there once you have scrolled right" | **a page and a slot, both fixed.** `ng` is page 1, row 3, column 3, always |
| Finding the live set | no way to know something is off-screen | the **rail** stands a button up for every page that has one (§7.1b) |
| Getting there | a drag — a sustained contact, a controlled path, a controlled release | **a tap** on a 72 pt button, or nothing at all when it auto-advances |
| Partial state | half a row visible at the edge | never: a page is whole or not shown |
| The dependency | needs `react-native-gesture-handler` | needs nothing |

The three original objections, and how paging answers each:

1. **The live set would go off-screen.** The characters that can be pressed are 1–6 of 35 and
   they are scattered across two runs.  *(Revision 5: mean live-set size **1.42**, and 84% of
   decision points have exactly one standing tile — `literacy-vi.md` §0.11. The set is smaller
   than revision 4's, which makes the rail matter more, not less.)* A child who cannot see a standing tile has a board
   with nothing on it, and he cannot form the hypothesis "there might be more below".
   → **Answered by the rail** (`gameplay.md` §3.9): a page with something live stands its
   button up, in the same visual language as the tiles, and the app never *leaves* him on a
   page with nothing live.
2. **It destroys the thing the constant table bought.** Spatial memory is "`m` is *there*", not
   "`m` is there once you have scrolled to the right place".
   → **Answered by the slot guarantee** (`gameplay.md` §0B.1): page and slot are pure
   functions of `inventoryOrder` and the device. Paging is a window, not a rearrangement.
3. **It is a drag gesture**, and this app is tap-only (`gameplay.md` §4.1) — which is also
   what keeps `react-native-gesture-handler` out of the manifest.
   → **Answered by construction**: a page change is a tap on a button, or an auto-advance.
   **There is no swipe, and adding one would put the dependency back.**

### 4.5 Touch target: 72 pt floor, 73–116 pt typical

**Number: `tile ≥ 72 pt/dp`, never less.**

| Surface | Point size | Physical |
|---|---|---|
| iOS @3x (1 pt ≈ 0.166 mm) | 72 pt | **≈ 11.9 mm** |
| Android (1 dp = 1/160 in = 0.159 mm) | 72 dp | **≈ 11.4 mm** |
| Tablet typical | 112–116 | **≈ 17.8–18.4 mm** |

Where it came from, honestly:

1. **Vatavu, Cramariuc & Schipor (2015), "Touch interaction for children aged 3 to 6 years",
   IJHCS** — the standard empirical source on preschool tap accuracy. Its finding, as I recall
   it, is that error rates fall steeply up to roughly **12 mm** and plateau by about 20 mm.
   **Cited from memory and not verified from this machine.** Flagged rather than dressed up.
2. **Apple HIG 44 pt and Material 48 dp** are adult minima. 72 exceeds them by 64% / 50%.
3. The literacy-designer independently arrived at **72 dp** from a different direction
   (`literacy-vi.md` §8.2). Two routes to the same number is the strongest evidence available.

**The number that actually matters is 11.4 mm, and it is checkable with a ruler on the
device.** Tier 5, and it is the honest check.

**Revision 2 considered lowering it and did not.** Under discovery a mis-tap is no longer a
wrong answer — it is a different word — so the *cost* of a mis-tap fell, and 64 pt or 59 pt
would buy a bigger table on the smallest phones. It was rejected because the cost of a mis-tap
is not zero (he may hit a disabled neighbour and get a sound instead of a move), and because
trading a measured ergonomic floor for four more cells on two devices is exactly the sort of
quiet erosion this document exists to prevent. Recorded so it is not re-proposed as new.

**Revision 3 had a far stronger reason to lower it, and still did not.** The constant table is
starved of cells on phones and a smaller tile is the obvious currency. The argument for
lowering is better than it was, and it is worth writing down properly rather than waving off:
the **hit rect already extends 6 pt beyond the ink on every side**, clipped to half the gap,
so a 62 pt tile at a 10 pt gap still presents a **72 pt hit target** — the motor floor,
untouched, measured against the same source. That would take the 360 × 640 floor from **20
cells to 24**, and the iPhone SE from 24 to 28.

**Refused, for one reason: a child aims at ink, not at hit rects.** Vatavu's 12 mm is a
finding about the target a child *perceives*. 62 pt is 9.8 mm of visible block, and a
forgiving rectangle recovers a near-miss but does not make the thing easier to aim at. Buying
four cells with the one number that was measured against a 4-year-old's hand is the trade this
document exists to refuse, and this is now the third revision to refuse it.

~~**Recorded as the reversible lever, with its price**: `TILE_MIN = 62` plus F2 rewritten as
`tile + 2*min(6, floor(gap/2)) ≥ 72` buys 24 cells and 16 words on the smallest phone.~~

**DROPPED in revision 4 (U25), and this is the good kind of dropped.** The lever existed for
one purpose — to buy back vocabulary on a screen too small to hold the inventory. **Paging
buys all of it back, on every served device** (`gameplay.md` §3.5), so there is nothing left
for a smaller tile to purchase. The 72 pt floor now stands for the fourth revision running,
and for the first time it stands at no cost at all.

The page rail's buttons are held to the same floor: **72 pt each, `RAIL_GAP` 12**, because a
page button is a thing a 4-year-old presses and the floor is about his hand, not about the
importance of the control.

**And so is the language control, new in revision 6** (§9.4a). It is 72 × 72 of ink, not a
72 pt hit rect around something smaller, and **F20** and **F21** are the two constant laws
that hold it there — F20 reads `TILE_MIN`, so lowering either number fails the other. It is
the single most expensive consequence of this revision: a 72 pt control does not fit a 56 pt
bar, which is why `TOP_BAR` moved and why §0D.3 has a cost table. **The floor was not lowered
to avoid paying it**, for the fifth revision running.

**The parent door is deliberately NOT held to it.** It is 65 × 32, which is under the adult
44 pt minimum in one dimension, and that is the point: it is an adult's target, it is the
smallest thing on the board, and it is in the corner furthest from a seated child's hands.
Its hit rect extends 6 pt on every side (77 × 44), which is the adult minimum with room to
spare, and no other control comes within 12 pt of it.

**Recorded so the refusal is not re-litigated a fifth time**: the ink floor was proposed in
revision 1, revision 2, and revision 3 (where it was priced and offered to the owner, who
answered with a better idea instead). It has never been taken, and the reason has never
changed — a child aims at ink, and 62 pt is 9.8 mm of ink.

**Spacing matters as much as size.** `gap ≥ 10 pt` (F6), and the hit rect extends **6 pt**
beyond the visual tile on all sides but is clipped so that **no two hit rects ever overlap** —
half the gap, at most. A fat finger landing between two tiles resolves to the nearer centre,
never to both.

### 4.6 The ceiling is the pack, not a number I chose

Revision 2 set the table ceiling at **24 cells** — "the most a 4-year-old should ever be shown
at once, not what an iPad could physically fit (it could fit 42)" — and flagged it to the
literacy-designer as a reconcile item against `literacy-vi.md` §8.1's cap of 16 on screen and
`literacy-en.md` §6.1's cap of 8.

**Revision 3 deletes the ceiling.** The owner asked for the regular character table, and a
character table with a cap on it is not one. The table is the pack's whole inventory, paged
when it does not fit: **revision 5 makes that 26 for English and 35 for Vietnamese**, against a
device budget of 12–90 cells per page.

**This retires the reconcile item rather than resolving it, and that should be said plainly.**
Those caps were written for a mechanic in which the palette was a *search* — one tile was
right and the rest were distractors, so the cost of width scaled with width. Two mechanics
later, every standing tile is a correct move and the set he must discriminate is the **live**
set, which is 1–6 symbols. The rest of the board is flat, recessive by construction (§5.8),
and — this is the part the caps cannot speak to — **it is what he asked to see.** The number
that governs whether 67 cells is too many is not a palette cap from a different mechanic; it
is `acceptance-criteria.md` **U7a**, and only the child can answer it. **Revision 5 halves the
number it is asked of** — 67 cells became 35 — and `literacy-vi.md` §0.11 measured that the
mostly-flat board does not get worse (84% single-live-tile in both models) while the mean live
set falls from 1.64 to 1.42. U7a is the same Tier-5 question, now asked of a board half the
size.

**What a tablet buys — and revision 5 mostly answers the question revision 3 asked.** Revision
3 had to say that the phone board was a *different, smaller game*; revision 4 fixed that with
paging, and revision 5 makes a tablet's advantage smaller again. **In English on his own iPhone
there is no difference at all** — one page, 26 letters, no rail — and in Vietnamese the
difference is three pages versus one and a 101 pt tile versus 116. The open question in
`open-questions-ui.md` about which device he plays on **is now much less load-bearing**, and
the answer he already gave (an iPhone 17 Plus) is served well.

**Tile sizes across the range, for scale:** 72–73 pt on the 360 dp floor, **101–104 pt on his
device**, 116 pt (the cap) on every tablet. The cap is reach, not room.

## 5. The visual system

Owner brief, verbatim: **"bright and fun. Don't use depressing color/design."** There is **no
dark theme** — a 4-year-old does not need one and it would double the contrast work.

### 5.1 Tokens — nothing is hardcoded

**A colour literal in a component is a bug.** It will be right in one theme and wrong in two.
The sets below are the verified output of `node tools/theme-contrast.mjs --tokens`, and they
are **byte-identical to revision 1's** — the mechanic changed, the palette did not.

| Token | Popsicle *(default)* | Sunshine | Playground | Used for |
|---|---|---|---|---|
| `ground` | `#E9FBF2` | `#FFF7EA` | `#E6F3FF` | the play surface, **and the face of a disabled tile** |
| `groundAlt` | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` | parent surfaces |
| `surface` | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` | cards, the word strip |
| `tileFace` | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` | **every live tile's face, every theme** |
| `tileGlyph` | `#2A2F3A` | `#332B24` | `#22303D` | **every live tile's letter** |
| `ink` | `#2A2F3A` | `#332B24` | `#22303D` | primary text |
| `inkSoft` | `#5A6272` | `#6B5E52` | `#526475` | **the disabled tile's letter**, secondary text |
| `role1` | `#E8366F` watermelon | `#EF5B25` sunset | `#1E6FD9` blue | **onset** / EN **consonant** |
| `role1Edge` | `#E8366F` | `#EF5B25` | `#1E6FD9` | its 2 pt outline **and its disabled underbar** |
| `role1Deep` | `#7A1837` | `#862F10` | `#09336A` | its 1.5 pt keyline, its chip label |
| `role1Soft` | `#E9DFE0` | `#FDE1CE` | `#CAE1FA` | the table's role tint |
| `role2` | `#6B46E5` grape | `#1189B8` lagoon | `#F2701D` orange | **rime** / EN **vowel** |
| `role2Edge` | `#6B46E5` | `#1189B8` | `#DF671A` | |
| `role2Deep` | `#331F76` | `#054661` | `#8C3E0C` | |
| `role2Soft` | `#D7E2F0` | `#DEE8E3` | `#E8E1DF` | |
| `role3` | `#0FA36B` green | `#3E9B2F` leaf | `#00937A` teal | **tone** (Vietnamese only) |
| `role3Edge` | `#0FA36B` | `#3E9B2F` | `#00937A` | |
| `role3Deep` | `#045B39` | `#1E5415` | `#004C3E` | |
| `role3Soft` | `#CAEFDF` | `#E4EAD0` | `#C6E6EC` | |
| `reward` | `#FF9F1C` mango | `#FFC400` sun | `#FFC220` yellow | **the chant's gold face**, confetti, shelf slots |
| `rewardEdge` | `#C87C13` | `#B48900` | `#AF8412` | their outline on the ground |
| `accentFace` | `#6B46E5` | `#D4441E` | `#1E6FD9` | parent primary buttons |
| `neutralFace` | `#888F9E` | `#9A8E80` | `#818C97` | **the parent door's outline and the language control's outline (revision 6)**, the strip's dashed next-cell, the disabled tile's dashed outline. ~~the gate dot~~ — replaced by the door, §9.4b. ~~the ∅ tile~~ — deleted, U13 |
| `hairline` | `#D4D5D8` | `#D6D5D3` | `#D3D6D8` | strip cell divider |
| `veil` | = `ground` | = `ground` | = `ground` | **vestigial** — the veiled prompt is deleted. Kept so the token set is unchanged; the reveal may reuse it as a scrim. |

**Every `role1/2/3` value is the owner's hex, unchanged.**

### 5.2 The contrast sweep

`tools/theme-contrast.mjs` sweeps **36 pairs × 3 themes** that can actually co-occur on screen
— 34 gated and 2 logged-only — with a threshold per *pair type* rather than one global
number. **Revision 3 adds exactly one gated pair** (the bare tone mark on the ground, §7.2)
and *rejected* nine more after measuring them (§5.8a):

| Type | Threshold | Applies to |
|---|---|---|
| `glyph` | **4.5:1** | any letter he is learning to read — **including a disabled one** |
| `bodyText` | 4.5:1 | parent-facing text |
| `largeText` | 3.0:1 | AA large |
| `component` | 3.0:1 | silhouettes, outlines, chips, **the parent door's outline, the language control's two bars**, shelf slots |
| `shade` | 1.4:1 | a shading step *inside one object*, carrying no information |
| `decor` | — | hairlines. **Logged separately, never gates.** |

**Result: PASS, 0 failing pairs, all three themes** (re-run 2026-09-23 against revision 3).
Selected measured values (Popsicle):

| Pair | Measured |
|---|---|
| **live tile glyph** — `ink` on `tileFace` | **13.41:1** |
| **disabled tile glyph** — `inkSoft` on `ground` | **5.71:1** (Sunshine 5.90, Playground 5.42) |
| assembled-word glyph in the strip | 13.41:1 |
| **chant highlight** — `ink` on the `reward` face | **6.53:1** (Sunshine 8.70, Playground 8.34) |
| onset identity-bar keyline on the tile | 10.43:1 |
| onset tile outline / disabled underbar on the ground | 3.77:1 |
| rime tile outline / disabled underbar on the ground | 5.38:1 |
| tone tile outline / disabled underbar on the ground | 3.02:1 |
| word-strip outline on the ground | 5.71:1 |
| the parent door's outline on the ground (revision 6) | 3.02:1 |
| shelf slot, just filled, on the ground | 3.08:1 |
| parent body text | 13.41:1 |
| primary button label | 5.78:1 |
| **bare tone mark on the ground** (`ink`, new in r3) | **12.48:1** (Sunshine 13.06, Playground 11.96) |
| *(decorative, logged)* live tile face on the ground | **1.07:1** — see §5.8 |

The live-glyph pair is **13.41 / 13.89 / 13.48** in the three themes, so **no theme makes
reading harder than another.**

### 5.3 The sweep is a gate, not a report

It runs in CI and in the Tier-2 suite. Per `development-process.md` §5 — *never trust a green
check you have not seen fail* — the tester must inject a fault before relying on it: change one
`role*` hex to a near-ground pastel and confirm the run exits 1 naming that pair. It did exactly
that during design (21 failing pairs in the first palette), **and it did it again in revision 2**:
extending the sweep to cover the chant highlight caught a 2.05:1 glyph that had shipped
unchecked (§5.9).

### 5.4 The live tile — where the colour goes, and why

```
        ┌───────────────────────┐  ← 2 pt roleEdge outline, radius 0.22*tile
        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ← 0.18*tile identity bar, role (the owner's bright hex)
        │───────────────────────│  ← 1.5 pt roleDeep keyline
        │                       │
        │          m            │  ← tileFace #FFFFFF, tileGlyph ink, 13.4:1
        │                       │
        │───────────────────────│
        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ← 0.13*tile base bar, role
        └───────────────────────┘
```

- **~31% of the tile's area is the owner's saturated colour**, undarkened, on every live tile.
- **The letter is on white at 13.4:1**, the best contrast available, identical in all themes.
- The bar's inner edge is a `roleDeep` keyline, so a bright hue never has to be dulled to make
  its own boundary read.
- The tile reads as a **toy block** — a coloured cap, a white face, a coloured base.

### 5.5 Role colour — what a role *is*, restated in revision 5

| Slot | Means | Bar pattern | Popsicle | Sunshine | Playground |
|---|---|---|---|---|---|
| `role1` | **consonant letter** — both languages | `solid` ▓▓▓▓▓▓ | watermelon | sunset | blue |
| `role2` | **vowel letter** — both languages | `split` ▓▓ ▓▓ | grape | lagoon | orange |
| `role3` | **tone** — Vietnamese only | `dotted` ▓ ▓ ▓ | green | leaf | teal |

**Revision 4 said role1 = onset, role2 = rime, role3 = tone.** A role was a *stage of the
word*. Revision 5 makes it a **permanent property of the glyph**, and that is not a cosmetic
re-labelling — it is what a constant table of letters requires and what the content model now
means:

1. **A letter is a letter in every word.** `h` is the same tile whether it is finishing `ch`,
   starting the rime of `hoa`, or sitting in `ship`. A colour that depended on the job it is
   doing *this time* would change under his finger, which is the morph the owner rejected.
2. **In Vietnamese, vowel-initial ≡ rime-initial.** `literacy-vi.md` §0.5: every rime begins
   with a vowel letter and every onset is consonant letters, with `gi` and `qu` the only two
   deterministic exceptions. So a vowel-coloured tile *is* the board saying "this one starts
   the next part of the word", with no extra machinery.
3. **English already required it** (`literacy-en.md` §3.2, §0.10) and now needs it more, with
   `j q y z` sitting permanently flat among live letters.

**The two exceptions, and why they teach rather than lie.** Tapping `i` after `g` builds the
onset `gi`; `u` after `q` builds `qu`. The tile stays vowel-coloured — *it is a vowel letter* —
and **the strip is where the truth goes**: the letter joins the onset's span bar, in the
consonant colour, rather than starting a new one (§7.2). **The table colours the letter; the
strip colours the job that letter took.** That is a distinction worth him noticing, and it is
exactly the two words Vietnamese spells oddly.

**The bar pattern is still the point, and in revision 5 it stops being redundant.** Revision 4
said role is carried by three channels — pattern, **fixed position**, and colour — and that
colour was the redundant one, which is why CVD separation was printed and not gated.

> **Corrected in revision 5 (U31).** *Fixed position no longer separates a consonant from a
> vowel.* `a ă â b c d` puts them side by side in every row of the alphabet, and at the five
> branching onsets `c g k n t` a consonant and a vowel are **live at the same time, meaning
> opposite things**: *this letter makes the sound bigger* versus *this letter starts the next
> part of the word* (`literacy-vi.md` §0.6). Position is silent there. Pattern (solid versus
> split) still speaks, and **colour is now gated under CVD for that one pair.**

```
ADJACENT pair: consonant vs vowel, gated at dE00 >= 20 in all three dichromacies
  Popsicle    protanopia 23.7   deuteranopia 53.6   tritanopia 30.0
  Sunshine    protanopia 48.4   deuteranopia 58.3   tritanopia 52.5
  Playground  protanopia 63.4   deuteranopia 72.3   tritanopia 52.2
```

20 is the largest round number below the measured worst case (23.7), so the gate has 3.7 of
headroom on the owner's own hexes and is not a number picked to pass. Raising it to 25 makes
the tool **exit 1**, which is how I know it is a check.

**Tone is deliberately *not* gated under CVD, and the limitation is unchanged from revision 4.**
Tone is a separate run, on its own page on every phone, never adjacent to a letter, and its
dotted bar is unique. Popsicle's consonant-vs-tone pair still measures 1.59 under deuteranopia;
it is printed, named, and carried.

```
Popsicle: consonant vs tone under deuteranopia = 1.59
Sunshine: consonant vs tone under deuteranopia = 8.58
Sunshine: consonant vs tone under protanopia   = 10.26
```

**Playground is red-green safe** (worst case 18.1) and is a one-tap change on the album.

### 5.6 Two tile types in both languages now, not one language's two and another's three

`literacy-en.md` §3.2 required vowel tiles to be visually distinct from consonants; revision 5
gives Vietnamese the same rule for the reason in §5.5, so **the two boards are now the same
visual system with one extra run on the Vietnamese side.** `role3` is never rendered in English
mode. `a` in `cat` wears the same slot as the `a` of `cam` — both are the nucleus of the
syllable, in both languages, which is a true correspondence rather than a convenience.

**Vietnamese has ten vowel letters on the board** — `a ă â e ê i o ô ơ u ư y` is twelve, and
all twelve are in `inventoryOrder` — and **English has five**, `a e i o u`, with `y` a
consonant in this pack (`literacy-en.md` §0.3, /j/). `y` is therefore `role1` in English and
`role2` in Vietnamese. That is not an inconsistency to fix: it is each language's own answer,
and the language never mixes.

### 5.7 The theme picker

Three unlabelled 56 pt colour buttons on the first-launch chooser, and the same three at 44 pt
in the **bottom-left of the album**. Each is a rounded square showing that theme's `ground` with
its three role hues as a solid / split / dotted bar, so the button *is* a sample of what it
selects. No text, non-destructive, instantly reversible. Persisted in AsyncStorage — settings
only.

### 5.8 **The disabled tile** — new in revision 2, and the hardest thing in this document

A disabled character must be three things at once: **not a punishment**, **still legible**, and
**instantly separable from a live one at a glance and in greyscale**. It is also doing real
teaching — the live set *is* the answer to "what can follow this?" — so it cannot be hidden,
greyed into illegibility, or removed.

**The metaphor: live tiles are standing up; disabled tiles are lying flat.**

```
   LIVE  (standing)                      DISABLED  (lying flat)
   ┌───────────────────────┐             ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
   │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ 0.18t bar                              1.5pt dashed
   │───────────────────────│ keyline     ╎                       ╎  neutralFace @55%
   │                       │             ╎                       ╎
   │          m            │ ink 13.4:1  ╎          b            ╎  inkSoft on ground
   │                       │             ╎                       ╎  5.4-5.9:1
   │───────────────────────│             ╎                       ╎
   │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ 0.13t bar   └━━━━━━━━━━━━━━━━━━━━━━━┘  3pt roleEdge underbar
   └───────────────────────┘ 2pt edge                                (3.0-5.4:1 on the ground)
   white face                            ground face — no white, no cap, no keyline
```

| | Live | Disabled |
|---|---|---|
| Face | `tileFace` white | `ground` — **the tile is the table** |
| Identity bars | two, `role`, 31% of the area | **none** |
| Underbar | — | one 3 pt `roleEdge` bar at the foot, so role survives |
| Outline | 2 pt solid `roleEdge` | 1.5 pt **dashed** `neutralFace` at 55% |
| Glyph | `ink`, **13.41:1** | `inkSoft`, **5.42–5.90:1** — gated at the same 4.5 `glyph` threshold as the live one |
| Elevation | reads raised: the cap bar is the top face of a block | reads flat |

**Why not opacity.** Fading a tile to 40% would drop the glyph below the legibility gate and
would read as *broken* rather than *not now*. Opacity is also the one channel a child reads as
"switched off", which is exactly the punishment framing to avoid. **The disabled letter is at
full opacity.**

**Why not the white face alone.** Measured: `surface` on `ground` is **1.06–1.13:1** — the
white face is nearly invisible against these very light grounds and **cannot be the
discriminator.** This is in the sweep as a logged decorative pair precisely so nobody assumes
otherwise. The discriminators, in order of strength:

1. **Ink weight.** A live tile carries two heavy bars covering 31% of its area; a disabled one
   carries a 3 pt line. That difference survives greyscale, blur, distance and CVD, and it is
   the primary channel.
2. **Outline solidity.** Solid versus dashed — a second non-colour channel.
3. **Glyph darkness.** `ink` versus `inkSoft` — a 2.3× ratio difference, both readable.
4. Colour, last and redundant, as everywhere else in this app.

`acceptance-criteria.md` S8 requires the app to be checked **in greyscale**, and revision 2
extends it: live must be separable from disabled with the colour removed.

**What a disabled tile does when tapped** (`gameplay.md` §4.3): plays its own sound in full, at
the same 60 ms latency, dips 2 pt and returns. The letters lying down are still his to press.

**Standing up and lying down is the teaching moment.** When his tap changes the live set, tiles
cross-fade between the two states over 200 ms with a 2 pt rise or fall (M6). He sees the board
answer him. Under the motion law this is opacity on two stacked faces plus a 2 pt translate —
no colour or layout animation (§10.1).

### 5.8a Correction U19 — a role tint behind each run, designed and then measured out

The constant table holds three contiguous runs and the obvious way to show where one ends is
a wash of its `roleSoft` tint behind it. I designed it, added the nine pairs it creates to
`tools/theme-contrast.mjs`, and the sweep failed **5 of 9** (theme × run) combinations:

| Pair | Popsicle | Sunshine | Playground |
|---|---|---|---|
| onset outline on the onset tint | 3.10 ok | **2.72 FAIL** | 3.62 ok |
| rime outline on the rime tint | 4.41 ok | 3.17 ok | **2.67 FAIL** |
| tone outline on the tone tint | **2.62 FAIL** | **2.86 FAIL** | **2.92 FAIL** |

Threshold 3.0 (`component`). The failure is structural rather than unlucky: **a tint made from
a hue desaturates the boundary of anything drawn in that same hue**, so the tint attacks
exactly the element — the tile's own outline and the disabled tile's underbar — that it was
added to support. The disabled *glyphs* all passed (4.55–5.07:1); the silhouettes did not.

**Cut.** The runs are carried by the bar pattern, by fixed position, and by colour on the
tiles themselves, and the disabled tile's face stays `ground` — which §5.8 needs, because
"the disabled tile *is* the table" is the primary live/disabled discriminator and a tint would
have broken it. The rejection is a comment in the tool as well as here, so it is not
re-proposed.

**This is the second time this sweep has caught a real bug by growing a pair** (U11 was the
first, a 1.60:1 gold glyph at the most important moment in the literacy ritual). That is the
argument for the sweep being a gate rather than a report, made twice.

### 5.8b Revision 5 — a continuous gold plate behind a chant-lit span, designed and measured out

**The third time.** A chant beat now lights a **span** of up to six cells (§10.4), and the
obvious drawing is one `reward` plate behind the whole span — gaps included — so that "these
cells are one sound" is a single shape. I added the pair it creates and it fails in all three
themes:

| Pair | Popsicle | Sunshine | Playground |
|---|---|---|---|
| the boundary divider (`neutralFace`) **on the gold plate** | **1.58 FAIL** | **2.01 FAIL** | **2.12 FAIL** |
| the same divider **on the ground** (what ships) | 3.02 ok | 3.20 ok | 3.42 ok |

Threshold 3.0 (`component`). The failure is structural again: the divider marking the
onset/rime boundary would **vanish inside the plate at exactly the moment the chant is
explaining what the boundary means.**

**Cut. The span lights cell by cell and the gaps stay on the ground**, which is where the
divider is gated. Two further decisions fall straight out of the same number and are recorded
here rather than left implicit:

- **The re-voice pulse (M23, `c`+`h` → `chờ`) is motion, not colour** — a scale pulse, never a
  gold face. A re-voiced span can still be carrying a dashed mark-slot or a divider, both
  `neutralFace`, both 1.58–2.12:1 on gold. **Gold is reserved for the chant, which only ever
  runs on a finished word**, by which time neither is on screen.
- The rejected drawing is a comment in `tools/theme-contrast.mjs` with its numbers, so it is
  not re-proposed.

### 5.9 Correction U11 — the chant does not turn the glyph gold

Revision 1 lit each part of the word by cross-fading its **glyph** from `ink` to `reward`. That
pair was never in the sweep. It measures **2.05 / 1.60 / 1.62:1** — unreadable, in all three
themes, at the single most important moment in the literacy ritual.

**Fixed by inverting it: the cell's face takes the `reward` gold and the glyph stays `ink`.**
Measured 6.53 / 8.70 / 8.34:1, and now in the sweep as a gated `glyph` pair. It is also the
better *picture*: a gold block reads across a room, a gold letter does not.

---

## 6. Typography

**Baloo 2** for tiles, the word strip and the album. **Be Vietnam Pro** for every parent
surface and the reveal caption. Both bundled; **the system font is never used for Vietnamese
text.** On Android the OEM font varies, and a dropped or flattened tone mark is a *correctness*
failure here — `mả` and `mã` differ by nothing else.

### 6.0 Fredoka was rejected, and how

`decisions.md` originally named **Fredoka**. It cannot be used: its `latin-ext` covers
`U+1E00–1E9F` and `U+1EF2–1EFF` and **skips `U+1EA0–U+1EF1`**, where most Vietnamese
precomposed letters live. **`ã` is U+00E3 and exists in Fredoka; `ả` is U+1EA3 and does not** —
`mã` would render in Fredoka and `mả` in whatever the OS substituted. `hổ`/`hô` is the same
failure and both are live in the seed list. Coverage measured at **35 of 86** fixture
characters.

**This is the Q-series gate working, one slice early.** A declared subset is a claim, and the
claim was wrong.

### 6.0.1 How Baloo 2 was chosen — **re-argued, because the original argument was false**

Correction U8. Revision 1 gave four reasons for Baloo 2 and put this first:

> *"Single-storey `a` and `g`. These are the letterforms a child is taught to write… This is a
> letter-teaching app, so it is the first criterion, not a preference. It rules out Be Vietnam
> Pro for tiles."*

**Both halves are wrong**, and they are wrong in opposite directions. Rendered on this machine
from the fonts that actually ship in `assets/fonts/`:

- **Baloo 2's `a` is DOUBLE-storey.** Its rendering shows a top arch, a pinched waist where only
  the right stem carries ink, and a separate bowl below — the classic two-storey construction.
- **Be Vietnam Pro's `a` is SINGLE-storey** — a symmetric bowl with a full-height stem, exactly
  as the Slice-3 developer reported.
- Both faces' `g` **is** single-storey (monocular).

So the criterion that was called decisive selected the wrong face, and the face it "ruled out"
was the one that satisfies it. Measured, not inferred, against the shipped files:

| Face | Coverage (86-char fixture) | Vertical ink span | `a` | `g` | `mả`/`mã` @116 pt | `hổ`/`hô` @116 / @36 |
|---|---|---|---|---|---|---|
| **Baloo 2 SemiBold** *(ships, tiles)* | **86/86** | **1.017 em** (tightest) | **double-storey** | single-storey | **541 px** | **365 / 34** |
| Be Vietnam Pro SemiBold *(ships, text)* | 86/86 | 1.189 em | **single-storey** | single-storey | 616 px | 577 / 87 |
| Quicksand | 86/86 | 1.071 em | single-storey | single-storey | — | — |
| Nunito | 86/86 | 1.001 em | single-storey | single-storey | — | — |
| Comfortaa | 86/86 | 1.268 em | single-storey | single-storey | — | — |
| ~~Fredoka~~ | **35/86** | — | double-storey | binocular | **cannot render `ả`** | — |

*(Pixel counts are a FreeType render of the shipped `.ttf` at SemiBold, thresholded at 32 of
255. They are **not portable between rasterisers** — the Slice-3 developer measured 469 and
38.7 for two of these pairs on the same files. That is the whole reason the acceptance
threshold sits far below every measurement rather than near one; see §6.1.)*

**Baloo 2 stays. The honest ranking, in order of weight:**

1. **Both candidates clear the minimal-pair gate with room, so it does not decide.** Baloo 2's
   tightest pair is 365 px at 116 pt against a 200 px floor and 34 px at 36 pt against a 20 px
   floor. Be Vietnam Pro is better here (577 / 87) and that is worth recording, but "better than
   comfortably sufficient" is not a reason to change a shipped font.
2. **Weight and roundness.** A tile glyph is one large letter on a white face — **lowercase in
   Vietnamese, uppercase in English since revision 5 (§8.2)** — and weight is what makes it read
   as a **block letter** rather than a thin line, and what makes "bright and fun" work at 36 pt.
   Be Vietnam Pro is a text face and looks like one on a toy block. This is now the *first*
   reason rather than the third. **Uppercase does not disturb this ranking**: neither face's
   uppercase is in doubt (26/26 in both, §6.1a) and weight is a property of the face, not of the
   case.
3. **Tightest vertical span, 1.017 em against 1.189.** Stacked marks sit closer to the letter, so
   less of a tile's height is spent on headroom and the glyph itself is larger inside the same
   tile. At a 72 pt tile that is real.
4. **It is already bundled, subset, and through the Q-series gate.** Changing it costs a re-run
   of every Q criterion for a benefit that is a preference.

**And the preference is genuinely the owner's, so it is recorded as his to take:**
`open-questions-ui.md` **Q5** — *if he wants a single-storey `a`, the tile face becomes Be Vietnam
Pro, which is already bundled, measures better on minimal pairs, and is a one-line change.*
Default: **Baloo 2 ships.** No answer needed for the app to be correct.

**Bundle cost, measured on the file that ships:** `assets/fonts/Baloo2-SemiBold.ttf` is
**90,716 bytes = 88.6 KB** at 86/86 coverage. (Revision 1 said 117 KB; that was the upstream
variable-font subset, not the shipped static face.) Against the ~8 MB asset budget it is
nothing.

### 6.1 The render gate — verified, not assumed

A **Tier-2 blocking gate**. It fails the build, not a review comment.

**Fixture: `assets/fonts/FIXTURE.txt`, 124 non-space characters, 86 unique codepoints**
(correction U5 — revision 1 said 90; re-counted here).

```
ă â đ ê ô ơ ư  Ă Â Đ Ê Ô Ơ Ư
à á ả ã ạ   ằ ắ ẳ ẵ ặ   ầ ấ ẩ ẫ ậ
è é ẻ ẽ ẹ   ề ế ể ễ ệ
ì í ỉ ĩ ị
ò ó ỏ õ ọ   ồ ố ổ ỗ ộ   ờ ớ ở ỡ ợ
ù ú ủ ũ ụ   ừ ứ ử ữ ự
ỳ ý ỷ ỹ ỵ
mả mã  ngựa  quốc  giêng  người  chuông  tiếng  sữa  cửa  quạt  ẹo ộ ể ỹ ưở
```

Five checks, each at **36 pt and at 116 pt**:

| # | Check |
|---|---|
| T1 | every codepoint renders — no `.notdef` box, no blank. **Measured: Baloo 2 86/86, Be Vietnam Pro 86/86.** |
| T2 | nothing is drawn by a fallback font |
| T3 | **the minimal pairs differ.** `mả`/`mã`, `hổ`/`hô`, `ả`/`ã`, `ẻ`/`ẽ`, `ỏ`/`õ`, `ủ`/`ũ`, `ỷ`/`ỹ` rendered separately and diffed must differ by **≥ 200 px at 116 pt** and **≥ 20 px at 36 pt**. |
| T4 | no glyph's ink exceeds the 1.55 em box (§6.3) |
| T5 | stacked forms `ươ ề ộ ẫ ặ ỡ ỹ` render as single composed glyphs, not base + floating mark |

**T3's thresholds, and why they moved (correction U7).** Measured for Baloo 2 SemiBold on the
shipped file:

| Pair | @116 pt | @36 pt |
|---|---|---|
| `mả`/`mã` | 541 | 68 |
| `ả`/`ã` | 541 | 68 |
| `ẻ`/`ẽ` | 563 | 64 |
| `ỏ`/`õ` | 564 | 70 |
| `ủ`/`ũ` | 543 | 67 |
| `ỷ`/`ỹ` | 533 | 63 |
| **`hổ`/`hô`** | **365** | **34** ← the binding case |

`hổ`/`hô` is the only **marked-against-unmarked** pair in the set; every other pair is
mark-against-mark, where two different shapes disagree over the whole mark area. A hook added
to nothing is the smallest real difference the gate will ever see, and at 36 pt it is 34 pixels.
Revision 1's floor of 40 therefore **failed a font that is correct**, which is the worst kind of
gate. The floor moves to **20 px at 36 pt** — 41% below the smallest true measurement, and
still infinitely above the failure it exists to catch, which is *the mark is not drawn at all*
and scores **0**. The 116 pt floor of 200 stands: the smallest measurement there is 365.

`ộ`/`ô` measures 282 / 27 and is deliberately **not** in T3's list: it is a below-mark, and
below-marks are gated by Q5b's ink-extent check, which compares where the ink ends rather than
how much of it there is and is not size-dependent.

If the bundled face ever fails, the tile face falls back to **Be Vietnam Pro**, which is drawn
for Vietnamese, is already bundled, and measures better on T3.

### 6.1a Revision 5 — uppercase `A`–`Z`, measured, and what the gate does *not* cover

The owner chose uppercase English glyphs (§8.2), so the render gate's assumptions were checked
rather than assumed. Measured with `fontTools` against the shipped files:

| | Be Vietnam Pro SemiBold *(the tile face)* | Baloo 2 SemiBold *(the one-line reversal)* |
|---|---|---|
| `A`–`Z` present | **26 of 26** | **26 of 26** |
| Widest uppercase | `W`, **1.039 em** | `W`, 0.832 em |
| Cap height | 740 / 1000 | 602 / 1000 |
| 25 sampled precomposed **Vietnamese uppercase** forms (`Ấ Ầ Ẩ Ẫ Ậ Ắ …`) | **0 missing** | **0 missing** |

Two things follow, and the second is the one that matters.

1. **Uppercase English is free and the reversal stays one line.** `W` at the largest English
   glyph size in the app (43 pt, his iPhone) draws 44.7 pt into an 84 pt tile, and 40.5 pt into
   a 48 pt strip cell at the floor. §8.2.4 has the full table; no layout rule moves.
2. **The Q-series does not gate Vietnamese uppercase, and the fixture is why.**
   `assets/fonts/FIXTURE.txt` carries **7** uppercase Vietnamese letters — `Ă Â Đ Ê Ô Ơ Ư` — and
   the ~130 precomposed marked capitals are **not in it**. The fonts cover them; **the gate has
   never rendered them.** That is exactly the distinction `CLAUDE.md` means by *a green check
   you have not seen fail*: Q5a would report 86/86 and say nothing whatever about `Ẫ`.

> **So §8.2.3's rule is a gate requirement, not a preference: a Vietnamese pack cannot be
> switched to uppercase until the fixture is extended and the Q-series re-run.** Recorded here,
> beside the gate it constrains, rather than only in §8.

### 6.2 The `a`/`g` letterform check is a human check, pinned by a hash (correction U9)

**Revision 5 narrows its scope and it is worth saying so rather than leaving it to be assumed.**
The single- versus double-storey `a` question is about **lowercase**, so after §8.2 it bears on
**Vietnamese only** — English tiles are `A`. It is not weakened: Vietnamese is the language with
29 letters, the tone marks and the tightest minimal pairs, so the check still sits where the
risk is. **`g` is unaffected either way**, because neither language puts a lowercase `g` on an
English tile any more and Vietnamese still does.

The Slice-3 developer is right that the single-storey clause of `acceptance-criteria.md` Q10 is
human-verified rather than automated, and it **cannot honestly be automated**: single- and
double-storey `a` have the same contour count, the same counter count and similar bounding
boxes, so any "automated" check would be a proxy dressed as a measurement — precisely the
failure `CLAUDE.md` names.

So it is written as what it is:

- **Q10 is a human check.** Someone renders `a` and `g` from the bundled file at 116 pt, looks
  at them, and commits the image to the repo as the record.
- **Q10a is the automated part, and it is the one that actually protects the property:** the
  bundled font file's **SHA-256 must equal the hash that was eyeballed.** A dependency bump, a
  re-subset or a swapped file changes the hash and re-opens the human check. Recorded here so
  the tester can compare without re-deriving:

```
241b89a416388b8970d595db2fb361665e464447d7a1526ca4fb80bfcbd532ce  Baloo2-SemiBold.ttf      (tiles)
0d0a638c0338c3d33787c00cd4d082bec7c030cd27b3b54e37b766fdfb82b7c1  BeVietnamPro-SemiBold.ttf
9122234c1fbc0d59a96d7f4e1ff119ec54fb2e970aa78ba9914567831085f575  BeVietnamPro-Medium.ttf
0f5cdd2fb255263145b47c9f863d88c48443e617a5a914763c1a081bcf0cf739  BeVietnamPro-Regular.ttf
```

**Verified state of the property today:** Baloo 2 `g` single-storey ✓, `a` **double**-storey ✗
against revision 1's claim — see §6.0.1 and `open-questions-ui.md` Q5.

### 6.3 Vertical metrics — marks above *and* below

Vietnamese stacks diacritics both ways. `ộ` is circumflex above **plus** dot below; `ỹ` is tilde
above **plus** a descender.

| | Baloo 2 (tiles) | Be Vietnam Pro (text) |
|---|---|---|
| highest ink, and which glyph | **+0.815 em** (`ẵ`) | +0.949 em (`ổ`) |
| lowest ink, and which glyph | **−0.202 em** (`g`) | −0.240 em (`ộ`) |
| **worst vertical ink span** | **1.017 em** | **1.189 em** |
| minimum box at +12% breathing | 1.14 em | 1.33 em |

**The box stays at 1.55 em** for both faces and both languages — 52% headroom over Baloo 2 and
30% over Be Vietnam Pro. The reason to keep it is the situation this document has been in
twice: **a font requirement was wrong and had to change after the metrics were written.** A box
tuned to one face's outlines clips when the face is replaced, and 1.55 em also survives an
OS-level fallback.

```
glyphBox  = 1.55 * fontSize
baseline  = 1.19 * fontSize  from the top of the box
lineHeight (parent text) = 1.55 * fontSize, minimum 1.45
```

The layout law derives `tileFont` and `stripFont` from this directly, which is why F4 and F5
exist. Worked: a 112 pt tile → `tileFont` 58 → box 90 pt inside 112 pt, 11 pt clear top and
bottom. A 73 pt tile → `tileFont` 36 → box 56 pt, 8 pt clear.

Multi-character tiles (`ngh`, `ăng`, `uống`, `sh`, `ck`) shrink to fit **82% of the tile
width**, floor 24 pt (F5). They never shrink vertically.

### 6.4 Type scale

| Role | Face | Size | Line |
|---|---|---|---|
| Tile glyph | Baloo 2 SemiBold (wght 600) | `tileFont` = 36–60 | 1.55 em |
| Word strip | Baloo 2 SemiBold (wght 600) | `stripFont` = 39–68 | 1.55 em |
| Reveal word (on the picture) | Baloo 2 SemiBold | 0.9 × `stripFont`, min 40 | 1.55 em |
| Reveal caption / sentence | Be Vietnam Pro Regular | 20 | 30 |
| Mode title (top bar) | Be Vietnam Pro Medium | 13 | 18 |
| Parent screen title | Be Vietnam Pro SemiBold | 24 | 32 |
| Parent body | Be Vietnam Pro Regular | 17 | 26 |
| Parent secondary | Be Vietnam Pro Regular | 15 | 23 |
| Button label | Be Vietnam Pro SemiBold | 18 | 24 |
| Gate operands | Be Vietnam Pro Medium | 28 | 42 |

Parent surfaces honour Dynamic Type / font scale up to **2.0×**. **Child surfaces do not** —
the tile is a motor constant and the glyph must fill it. Deliberate exception, recorded in §12.

---

## 7. Screen: Ghép Chữ (Vietnamese)

**Two boards, one design.** A tablet shows the whole 35-cell table at once — 29 letters and 6
tones — with no rail and no pages. A phone shows it in three windows. The characters, their
order and their slots are identical; only how much is visible at a time differs.

**The owner's iPhone 17 Plus** (430 × 932 or 440 × 956 — same plan): page 1 of 3, **3 × 5 at
99 pt** (101 before revision 6's 72 pt top bar, §0D.3), strip 104 with six 58 × 88 cells,
rail 1 row of 3 buttons. Drawn at the moment after
a single tap on `c`, because that is the state the whole revision has to make legible.

```
┌──────────────────────────────────────────────┐
│▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔│ 4pt role1 rule
│ ┌────┐                                       │ 72pt TOP BAR -- revision 6
│ │▓▓▓▓│      [img][ ][ ][ ][ ]     ┌────────┐ │ language control 72x72 (§9.4a)
│ │┌──┐│        Ghép Chữ           │ Cha mẹ │ │ parent door 65x32   (§9.4b)
│ │└──┘│                            └────────┘ │ mode title UNDER the shelf
│ └────┘                                       │
├──────────────────────────────────────────────┤
│  ┌──────┬╌╌╌╌╌╌┐                             │ WORD STRIP, 106 tall
│  │  c   ┊  ·   ╎                             │ six 58x90 slots reserved,
│  └━━━━━━┴╌╌╌╌╌╌┘                             │ two drawn, left-aligned
│    SOLID role1 bar.  One cell, one sound.    │ glyph 47pt, ink on white
│    Spoken: `cờ`                              │
│                                              │
│  ┌───────┐ ┌───────┐ ┌───────┐               │ ── PAGE 1:  a ... m
│  │▓▓ ▓▓▓▓│ ╎       ╎ ╎       ╎               │    15 cells, 3x5 at 101pt
│  │   a   │ ╎   ă   ╎ ╎   â   ╎               │
│  │▓▓ ▓▓▓▓│ ╎       ╎ ╎       ╎               │    `a` LIVE -- cam, cá.
│  └───────┘ └ ── ── ┘ └ ── ── ┘               │    SPLIT bar, role2 VOWEL:
│  ╎   b   ╎ ╎   c   ╎ ╎   d   ╎               │    "the vowel starts here"
│  ╎   đ   ╎ ╎   e   ╎ ╎   ê   ╎               │
│  ╎   g   ╎ │▓▓▓▓▓▓▓│ ╎   i   ╎               │    `h` LIVE -- chim, chó.
│  ╎       ╎ │   h   │ ╎       ╎               │    SOLID bar, role1 CONS:
│  ╎   k   ╎ │▓▓▓▓▓▓▓│ ╎   m   ╎               │    "make the sound bigger"
│            └───────┘                         │
├──────────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌ ──── ┐                │ ── THE PAGE RAIL
│  ┃  a   ┃  │  n   │  ╎  ◌   ╎                │    3 buttons, 72pt
│  ┗━━━━━━┛  └──────┘  └ ──── ┘                │    page 2 STANDS (`u`,`ư`)
│    HERE     standing    flat                 │    page 3 flat: no tone yet
└──────────────────────────────────────────────┘
```

**That one figure is the argument for revision 5's visual system.** After `c`, four letters are
live — `h` extends the onset, and `a u ư` start a rime (`literacy-vi.md` §0.6). On page 1 that
is `h` with a **solid consonant bar** and `a` with a **split vowel bar**, side by side, saying
two opposite things; `u` and `ư` are on page 2, which is why its rail button stands. **Nothing
here is text, a number or a word**, and in revision 4 the same fork was invisible, because
every tile on the onset page carried the same solid bar.

**Compare the same board in revision 4**: four pages, 28 cells of 75 pt, and the first page was
26 onsets sorted `m b c ch s d g h t tr v gh…`. The tile is now 79% larger in area, the order is
the alphabet, and there is one fewer page.

The tablet board is the same figure with the rail deleted and all 35 characters in a 5 × 7 grid
at 116 pt.

### 7.1a Paging is a **slide**, and that is the whole difference from the morph

The owner rejected a table that changed under him. He then proposed paging. Those are only
compatible if paging is perceptibly a *different kind of event*, and the motion is what makes
it so — this is a design obligation, not a flourish.

| | The morph (rejected) | **The page (revision 4)** |
|---|---|---|
| What changed | **what a cell contains** — `eo` became `èo` | **which part of the board is on screen** |
| Motion | cross-fade **in place**, 280 ms | **slide horizontally**, the whole table moving as one sheet |
| What it says | *these cells are now something else* | *we moved along the board* |
| Afterwards | the character you were looking at is **gone** | it is still there, one screen away, in the same slot |

**Durations say who did it**, reusing the convention the idle ladder already established:

- **he changed the page** (tapped a rail button): **300 ms**, `enter`
- **the app changed the page** (auto-advance, §7.1c): **420 ms**, `enter` — deliberately
  slower, so it reads as the app taking a turn rather than as his own tap landing

The rail's gold "you are here" marker slides with the table, over the same duration, so the
two are one gesture rather than two events.

### 7.1b The page rail — the control, the indicator and the liveness signal, in one object

**It is made of tiles.** That is the entire design idea: the rail speaks the only visual
language the child has already been taught, so "there is something for you over there" needs
no explanation, no icon and no reading.

```
  ┏━━━━┓   ┌────┐   ┌ ── ┐         one button per page, 72pt, RAIL_GAP 12.
  ┃ a  ┃   │ n  │   ╎ ◌  ╎         Vietnamese is 3 buttons on every phone;
  ┗━━━━┛   └────┘   └ ── ┘         English is 2, or none at all on his device
  CURRENT  STANDING   FLAT
  reward   white face ground face   glyph = THE FIRST CHARACTER OF THAT PAGE,
  face,    + role bar + dashed      drawn with that letter's own bar and role
  ink      + ink      + inkSoft     colour -- a sample of what is over there,
  raised                            not a number and not a word
  4pt
```

**Revision 5 makes the rail read as a sentence.** The three Vietnamese buttons are `a`, `n` and
the empty `ngang` circle: *the letters from a, the letters from n, and the hats.* Revision 4's
were `m`, `ưa` and `◌̀` — the first symbols of a frequency-sorted inventory, which named
nothing. The rail is now something his mother can say out loud, which is the test §0C sets for
the page split itself.

| State | Drawn as | Means |
|---|---|---|
| its page has ≥ 1 live character | **standing** — exactly a live tile: white face, that run's bar pattern and role colour, `ink` glyph | *there is something for you here* |
| its page has none | **flat** — exactly a disabled tile: `ground` face, 1.5 pt dashed outline, `inkSoft` glyph | *nothing here right now* |
| the page he is on | raised 4 pt, **`reward` gold face, `ink` glyph** — 6.53 / 8.70 / 8.34:1, the chant's already-gated pair | *you are here* |

- **Flat buttons are pressable**, exactly like flat tiles — `gameplay.md` §4.3's "the letters
  lying down are still his to press" applies to pages too, and breaking the rule here would
  break it everywhere.
- **A button press is never speech.** It plays the page sound (§11.3) and nothing else; the
  glyph on a button is a label, not a letter he is choosing, and speaking it would teach that
  pressing a character and pressing a page are the same act.
- **No number, no dots, no "3 of 4", no arrows.** Arrows were considered — they cost constant
  width regardless of page count — and rejected: an arrow can say *there is more that way* but
  cannot say *and there is something live in it*, which is the thing that actually matters.
- **The rail is always fully present.** It never scrolls, never collapses, never hides, and
  every page is always one tap away. **F9p** makes that a layout rule rather than a promise.
- **Absent entirely when the table is not paged.** A tablet has no rail, because there is
  nothing to page.

### 7.1c Auto-advance, and the restraint that makes it safe

> **The app slides the page only when the page he is on has no live character left.**

`gameplay.md` §3.8 has the argument. What this document owes it is the behaviour:

| | |
|---|---|
| When | after a symbol seats, and after an undo, evaluated once state has settled |
| Condition | the current page has **zero** live characters |
| Target | the **lowest-numbered page that has one** — deterministic, never a guess |
| Motion | slide, **420 ms**, slower than his own 300 ms page change (§7.1a) |
| Sound | the page sound (§11.3), so it is legible with the screen ignored |
| Never | it does **not** fire while anything on his current page is still live, however much is live elsewhere |
| Never | it does **not** fire during the announcement, the chant or the reveal |

**Getting back is never a special case.** Every page button is present and pressable, and
**tapping a symbol in the word strip slides to that symbol's page** as it returns it — so undo
is also the way back to where a character lives.

### 7.1 The table is constant — and what that cost

**Revision 2 said the opposite of this, and argued it hard:** "Exactly one role is on screen
at a time. This was re-argued for revision 2 rather than inherited, and it survives on
stronger grounds." It gave three. Here is what happened to each, because the honest version of
a reversal is not pretending the old argument was thin.

| Revision 2's ground | What became of it |
|---|---|
| **1. "The tone tiles are undrawable before a rime exists. This alone decides it."** `literacy-vi.md` §5.4 renders a tone tile as the chosen rime, marked. | **True, and still true.** It is resolved rather than refuted: the tone cells are constant and their **carrier** changes, and the bare-mark form appears only on a tile that is disabled by construction. §7.2 and `gameplay.md` §3.4a, with the cost. |
| **2. "Arithmetic. 24 onsets + 24 rimes + 6 tones is 54 cells at ≥ 72 pt. Nothing in the supported range fits that."** | **Wrong, by measurement.** It was true of phones and asserted of everything. The real inventory is 67 cells, and every tablet holds all 67 above the floor — 7 × 10 at 86 pt on an iPad 11", 10 × 7 at 100 pt on an iPad 13". The error was a 6-column cap in the layout law that nobody had questioned, not a fact about screens. This is the one I should have caught myself. |
| **3. "Two of the three would be entirely disabled — the dead-screen failure the brief forbids."** | **Real, and it is now the standing risk of this design.** It is not refuted; it is answered and then handed to Tier 5. §5.8's flat tile is not a dead tile — full-opacity glyph, speaks when pressed, dips when tapped — and the standing minority is high-ink against a recessive majority. Whether that is enough is `acceptance-criteria.md` **U7a**, and only the child can say. |

**The layout — revision 5.** One grid, **two** contiguous runs in one fixed row-major
sequence: `[29 letters][6 tones]` in Vietnamese, `[26 letters]` in English. **Revision 4: when the sequence does not fit one screen it is paged
along the run boundaries** (§7.1a–c), so a run boundary is also a page boundary and the board
he sees is always one run at a time — which, pleasingly, is what revision 2's morph was trying
to achieve and got wrong by changing the cells instead of moving the window. A run boundary
inside a page can still fall mid-row and is not marked by a line, a box or a tint — it is
marked by the tile's own bar changing to **dotted** (§5.5), which is the channel that already
survives greyscale and CVD. §5.8a records the tint I tried and why the contrast sweep cut it.

**Revision 5 changes what the bar pattern is doing inside a run, and it is worth being exact
about it.** In revision 4 the pattern marked the run: everything on the onset page was solid,
everything on the rime page split. Now the letter run **interleaves** solid and split cell by
cell, because the pattern marks the *letter* (§5.5). The run boundary is still visible — the
tone run is the only dotted thing on the board — but the letter run no longer looks uniform,
and that is the intent: the fork between "another consonant" and "the vowel starts here" is the
single most frequent decision on this board (five branching onsets, 116 decision points), and
it is now drawn in every row rather than at one seam.

**How many of each, per device — revision 4: all of them.** Revision 3 divided one screen's
budget between the three runs with a fixed 0.48 split (`zonesFor()`), which meant a phone
simply did not have most of the characters. **Paging deletes that problem and the function
with it.** Every run is complete on every served device; what differs is how many pages it
takes:

```
capacity = cells per page (28 on the iPhone 17 Plus)
letters 29 -> ceil(29/28) = 2 pages [15][14]   balanced, not 28/1
tones    6 -> ceil(6/28)  = 1 page  [6]

  page 1  a ă â b c d đ e ê g h i k l m      "the letters from a"
  page 2  n o ô ơ p q r s t u ư v x y        "the letters from n"
  page 3  ngang huyền sắc hỏi ngã nặng       "the hats"
```

**29 misses a single page by one cell**, and it is not bought back (§0C). The consequence worth
naming is that **`h` is on page 1 while `n`, `p` and `t` are on page 2**, so `nh`, `ng`, `ph`
and `th` are cross-page digraphs: the rail's page-1 button stands the moment `h` goes live, and
tapping it is the same 72 pt tap as any other. On a tablet, and in English on his own phone,
this does not arise.

- **Runs never share a page** (`gameplay.md` §3.7). It costs a page and leaves the tone page
  holding 6 characters in a 15-cell grid, and both are worth it: the rule is one sentence a
  child can hold, and one standing tile on an otherwise empty page is the clearest possible
  final step.
- **Balanced, not greedy**, so pages keep the same shape as he moves.
- **Each run is still a prefix-ordered list** (`inventoryOrder`, E12), but the order is no
  longer a *priority* order, because nothing is cut off. It is now purely where things live.

`gameplay.md` §3.5 has the per-device page plans; **§4.4 of this document supersedes their
numbers for revision 5**, because the runs changed. The words-reachable column stays gone: the
answer is 47 of 47 everywhere, and was already.

### 7.2 The word strip — spans, the boundary, and the two ways something can be missing

**Rewritten in revision 5.** Revision 4's strip held an onset, a rime and a tone and was never
sized against the content width. A word is now **three to six taps**, the onset may be two or
three of them, and the strip has to say three things it never had to say before: *these letters
are one sound*, *the next part of the word starts here*, and *this could end now, or it could
go on*. It has to say all three with **no text**, and **without ever merging a cell into
another**, which is the morph the owner rejected in revision 3.

#### 7.2.1 The geometry

```
  ┌────────────────────── tableW (392 on his iPhone) ─────────────────────┐
  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                │
  │ │  1   │ │  2   │ │  3   │ │  4   │ │  5   │ │  6   │   reserved      │  stripH 106
  │ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘   track        │  PAD 8 top/bottom
  │  58x90    gap 8                                                       │  cell glyph 47pt
  └───────────────────────────────────────────────────────────────────────┘
     ^ fixed origin.  The track is centred in tableW; the WORD is left-aligned
       inside it and only the used slots are drawn.
```

Six slots, on every device, in both languages, sized once at startup (§4.2, F15/F16/F17).
Three decisions in that one figure:

- **The track never resizes.** A cell that shrank as the word grew would be the morph again,
  and it would move letters he had already placed. Slot *k* is at the same x for every word.
- **Left-aligned, not centred.** Centring would slide every seated letter left on each new tap
  — motion that says nothing and contradicts "nothing you have placed ever moves". This is
  writing; writing starts at the left margin and grows rightwards. A two-letter word sits
  left-of-centre and that is correct.
- **Six is the measured ceiling** — seven drops the glyph to 31 pt at the 360 dp floor. The
  content-engineer's validator caps a word at six letters and the editor says so in her
  language (§13.3).

#### 7.2.2 The span bar — how two letters become one sound without merging

> **Letters that are one sound share one continuous bar. A new sound starts a new bar.**

The bar is revision 4's 5 pt role underline, promoted from a per-cell decoration to a
**per-span object**. It is the only thing in the strip that knows about sounds, and the cells
above it never move, never resize and never join.

```
  c                 ┌──────┬╌╌╌╌╌╌┐        one cell, one bar.  The bar is the
  taps `c`          │  c   ┊  ·   ╎        width of ONE cell.  role1, SOLID.
                    └━━━━━━┴╌╌╌╌╌╌┘        Spoken: `cờ`
                      ^^^^^^

  c h               ┌──────┬──────┬╌╌╌╌╌╌┐ THE BAR GREW.  Same two cells, same
  taps `h`          │  c   │  h   ┊  ·   ╎ positions, same size -- nothing
                    └━━━━━━━━━━━━━┴╌╌╌╌╌╌┘ merged.  ONE bar spans both.
                      ^^^^^^^^^^^^^        Spoken: `chờ`, REPLACING `cờ`

  c h o             ┌──────┬──────┬┃─────┬╌╌╌╌╌┐  THE BAR BROKE, changed
  taps `o`          │  c   │  h   ┃│  o  │  ·  ╎  pattern and colour, and a
                    └━━━━━━━━━━━━━┻┅┅┅┅┅┅┴╌╌╌╌╌┘  DIVIDER appeared.
                      ^^^^^^^^^^^^  ^^^^^^        Spoken: `o` (the rime so far)
                      role1 solid   role2 split
```

Three redundant channels mark the onset/rime boundary, and **no cell moves to produce any of
them**:

| Channel | What it is | Survives |
|---|---|---|
| the **break** | a 10 pt gap in the bar, centred on the cell gap | greyscale, blur, CVD |
| the **pattern and colour change** | `role1` solid → `role2` split (§5.5) | greyscale (pattern), CVD (gated, §5.5) |
| the **divider** | 2 pt × 0.5 × cellH, `neutralFace`, centred in the cell gap, fading in over 180 ms | greyscale; measured **3.02 / 3.20 / 3.42:1** on the ground |

**The divider means exactly one thing and appears exactly once per word**, which is what makes
it readable. Revision 4 drew a light hairline between *every* pair of cells (`│ b ┊ o │`); those
are gone. A line between two letters now says *the next part of the word starts here* and
nothing else.

**`gi` and `qu`, drawn.** Tapping `i` after `g` grows the **onset** bar — solid, `role1` — even
though the `i` tile on the table is vowel-coloured. No divider appears, because the rime has
not started. That is the picture of the exception, and it is available to be noticed:

```
  g i               ┌──────┬──────┬╌╌╌╌╌╌┐   ONE solid bar across a consonant
                    │  g   │  i   ┊  ·   ╎   and a vowel.  Spoken: `giờ`
                    └━━━━━━━━━━━━━┴╌╌╌╌╌╌┘   (literacy-vi.md §0.5, §0.9)
```

#### 7.2.3 The superseding sound — what he sees when `h` joins `c`

`literacy-vi.md` §0.9 rules that a tap speaks the unit it is building *so far*: `cờ`, then
`chờ`. The second clip **replaces** the first. The problem that creates is visual, not audible:
a child must see that `h` **joined** `c` rather than **followed** it, or the two sounds look
like a contradiction.

| t (ms) | What happens |
|---|---|
| 0 | **M1** — the `h` tile in the table presses in, 70 ms. The speech channel cuts `cờ` if it is still running (§11.2) and starts `chờ` within the 60 ms budget |
| 0 | **M3** — the `h` tile flies to slot 2, 260 ms, 1.06 overshoot |
| 260 | **M22, the tie** — the span bar, already drawn at its final two-cell width, reveals by `scaleX` from `58/124` to `1` **anchored at its left edge**, 220 ms, `enter`. The bar *grows out from under `c` to under `h`* |
| 260 | **M23, the re-voice** — **both cells pulse together**, one `scale` 1 → 1.08 → 1 on the span container so they move as one body, 260 ms, `pop`, started on the first audio frame of `chờ` |
| 480 | **M4** — the dashed next-cell fades into slot 3 |

**M23 is the load-bearing one and it is on `c` as much as on `h`.** A pulse on the new cell
alone would say *h arrived*; a pulse on both says *this sound is these two, and the one you
heard a moment ago is gone.* It is the only animation in the app that re-animates something
already seated, and that is precisely its meaning.

**It is motion, not gold** (§5.8b). The chant's `reward` face is reserved for a finished word,
and a span being built can still be carrying a `neutralFace` divider or mark-slot, both of
which measure 1.58–2.12:1 on gold.

**And the opposite outcome is drawn as the opposite motion.** A second tap that does *not*
extend the sound gets **M24, the break**: the new cell arrives with its **own** bar, in the
other colour and pattern, and the divider fades in between. One tap, two possible pictures, and
they look nothing like each other:

```
   JOINED   ━━━━━━━━━━━━━━━   the bar reaches across.   `c` `h`  ->  chờ
   BROKEN   ━━━━━━━━┃┅┅┅┅┅┅   a second bar starts.      `c` `a`  ->  a
```

#### 7.2.4 Two ways something can be missing, and the fork

Revision 4 had one affordance: a dashed cell meaning *something else goes here*. With the tone
landing **on** the rime rather than in a cell of its own, a dashed *cell* for a missing tone is
a lie about where it will go. Revision 5 splits it:

```
  a letter is missing        ┌──────┬──────┬╌╌╌╌╌╌┐   dashed cell, centred dot
                             │  c   │  h   ┊  ·   ╎   2pt neutralFace, 3.25:1
                             └━━━━━━━━━━━━━┴╌╌╌╌╌╌┘   "another letter goes here"

  a mark is missing          ┌──────┬──────┬──────┐   NO extra cell.  A dashed
                             │  c   │  h   │ ˚o˚  │   MARK-SLOT above the carrier
                             └━━━━━━━━━━━━━┻┅┅┅┅┅┅┘   vowel, 180ms fade-in
                                                      "a mark goes here"

  BOTH are possible          ┌──────┬──────┬──────┬╌╌╌╌╌╌┐   b o : `bò` needs a
  (b+o, c+a, m+u)            │  b   │  o˚  ┊      ┊  ·   ╎   mark, `bóng` needs
                             └━━━━━━┻┅┅┅┅┅┅┴╌╌╌╌╌╌┴╌╌╌╌╌╌┘   more letters.
                                      ^mark-slot   ^dashed    BOTH are drawn.
```

**At the three points where a letter and a tone are live at once** — `b`+`o` (`n`→`bóng`,
huyền→`bò`), `c`+`a` (`m`→`cam`, sắc→`cá`), `m`+`u` (`i`→`mũi`, ngã→`mũ`), measured against the
real pack in `literacy-vi.md` §0.7 — **both affordances are on screen together**, and that is
the whole answer to *how does the board show that a word could end here or continue*. It needs
no text, no arrow and no voice. It is two dashed shapes in one picture, and they are the two
things he can do.

The board says the same thing a second way, for free, on a phone: **the tone page's rail button
stands up** while letter tiles are also standing. On a tablet the six tone cells simply stand
in place beside the letters. The two signals are independent, so one of them is always
available.

**The same picture with only one affordance is the commoner case and reads as a closed
question.** 84% of decision points in the pack have exactly one live tile; those show one
dashed cell, or one mark-slot, and nothing else.

#### 7.2.5 The six tone carriers — unchanged

`literacy-vi.md` §0.8 keeps §5.4 verbatim, and so does this document. The six cells never move
and never change role; their **carrier** changes once per word, and only ever while they are
disabled:

```
  no rime placed (ALWAYS disabled)       rime `eo` complete (live ones stand)
  ┌ ── ┐┌ ── ┐┌ ── ┐┌ ── ┐┌ ── ┐┌ ── ┐   ┌ ── ┐┌────┐┌ ── ┐┌ ── ┐┌ ── ┐┌ ── ┐
  ╎ ◌  ╎╎ ◌̀ ╎╎ ◌́ ╎╎ ◌̉ ╎╎ ◌̃ ╎╎ ◌̣ ╎   ╎ eo ╎│ èo │╎ éo ╎╎ ẻo ╎╎ ẽo ╎╎ ẹo ╎
  └ ── ┘└ ── ┘└ ── ┘└ ── ┘└ ── ┘└ ── ┘   └ ── ┘└────┘└ ── ┘└ ── ┘└ ── ┘└ ── ┘
   ngang huyền sắc  hỏi   ngã  nặng       he sees the OUTCOME of each choice, at
   bare marks on a dotted circle          the only moment he is choosing
```

- **The order is corrected** to `ngang · huyền · sắc · hỏi · ngã · nặng` (`literacy-vi.md`
  §0.13). Revision 4 shipped `ngang sắc huyền hỏi nặng ngã`, which was frequency again.
  `open-questions.md` **Q11** is whether second place is `huyền` or `sắc`; **either answer is
  one line of `inventoryOrder.tone` and changes no cell of this design**, because the six cells
  are a run and a run is ordered by the pack.
- **The carrier is the rime, which is still known**, because đánh vần survived (`literacy-vi.md`
  §0.3). This is the single largest dividend of not throwing the model away, and it is the
  reason revision 5 does not touch §5.4 at all.
- **The carrier swaps when the rime is COMPLETE, not when its first letter lands.** `ăng` is
  `ă` then `n` then `g`; the tone cells hold bare marks through `ă` and `ăn`, which are
  pass-through states no tone can ever sit on (`literacy-vi.md` §0.7, eight of them), and swap
  to `ăng ằng ắng ẳng ẵng ặng` on the `g`. Anything else would flicker three carriers at him
  inside one rime.
- **The bare mark is drawn in `ink`**, not `inkSoft` — 11.96–13.06:1, gated as a `glyph` pair.
- **A stop-final rime still produces two live tones, not two cells** (§5.2). All six are always
  there; `ach` leaves `ách` and `ạch` standing and the other four flat.

#### 7.2.6 Undo is the strip, not the cell

> **One tap anywhere on the word strip returns the last symbol. Tapping again returns the one
> before it. The strip is one target.**

**Revision 4 said the opposite** — tap a cell to return it and everything after it — and it is
overruled by geometry, not by taste. Five 72 pt cells need `5 × 72 + 4 × 8 = 392` pt; the 360 dp
floor has **328 pt** of content width. **A per-cell motor target is impossible at the floor**,
and on his own iPhone the cell is 58 pt wide. Shaving the gap to buy it back is the thing F6
exists to prevent.

Three things fall out, and all three are improvements:

1. **It is a better model for a 4-year-old.** *Take the last one back* is one rule. *Tap the
   third block to return the third, fourth and fifth* is a model of a model.
2. **The target is enormous** — the full strip band, 392 × 106 on his phone, 328 × 77 at the
   floor. The most-used control in the app becomes the easiest thing on the screen to hit.
3. **`STRIP_CELL_MIN` becomes a legibility floor rather than a motor one**, which is what lets
   it be 40 pt: 34 pt of glyph (F4) × the 1.15 a `ư` carrying a horn and a tone mark needs.

**What undo does, in full:**

| | |
|---|---|
| Returns | exactly one symbol — the last letter, or the tone if one is placed |
| Motion | **M8**, the symbol flies home to its cell in the table, 300 ms, `exit` |
| Sound | its own clip, plus the descending two-note unclick |
| The bar | if the returned letter was the only one in its span, the span and its divider go with it (M24 reversed, 180 ms); if not, the bar **shrinks back** by `scaleX` anchored left, 220 ms — the tie undone the way it was made |
| The tone carriers | revert to bare marks the moment the rime is no longer complete |
| The page | the board slides to the returned symbol's page. **Undo is still the way back** (V23) |
| Empty strip | a tap does nothing and plays nothing (T20) |

**There is no clear-all gesture, and the strip keeps exactly two.** Tap = take the last one
back; **hold 800 ms = the parts hint** (§2.2), unchanged. A word is at most six symbols, so
emptying it is at most six taps, each with its own sound and its own flight home — which is
feedback, not friction. Adding a third gesture to the one object a child taps most would be the
expensive way to save four taps.

**A document defect this closes.** §2.2 has said since revision 3 that *"a short tap on the
strip is undo… tap = take it back, hold = say what I have"* — the whole strip, one target —
while §7.2 and `gameplay.md` §4.4 said tap *a cell* to return it and everything after it. The
two were never reconciled. Revision 5 resolves it in §2.2's favour, and the reason is
arithmetic rather than preference. **`gameplay.md` §4.4 and criteria D4, E8, E9, C10 and C11
inherit the change** (§W5).

#### 7.2.7 The strip, state by state

```
  empty            ╎  ·   ╎                      one dashed cell, centred dot

  one letter       │  b   ┊  ·   ╎                bar under `b`, role1 solid
                   ━━━━━━━

  joined sound     │  c   │  h   ┊  ·   ╎         ONE bar across both
                   ━━━━━━━━━━━━━━

  boundary         │  c   │  h   ┃│  o  ┊  ·  ╎   bar broke, colour and pattern
                   ━━━━━━━━━━━━━━ ┅┅┅┅┅┅          changed, divider in the gap

  mark missing     │  b   │  o˚  │                mark-slot over the carrier;
                   ━━━━━━━ ┅┅┅┅┅┅                 no dashed cell

  fork             │  b   │  o˚  ┊  ·   ╎         BOTH: mark-slot AND dashed cell

  complete         │  b   │  ò   │                the mark landed.  Cells still
                   ━━━━━━━ ┅┅┅┅┅┅                 separate.  No dashed cell.

  announcing       │      b  ò      │             chant beat 3 only: the cells
                   ━━━━━━━━━━━━━━━━━             close up into one word (§10.4)
```

**The only merge in the entire app is chant beat 3**, after the word is already made, as a
reward for making it. During building, nothing ever merges. That sentence is the whole of
revision 3's correction, carried forward intact.

**English is the same component with one run missing.** No tone, so no mark-slot and no
`role3`; `ship` is `s` `h` (one span) `i` (new span) `p` (new span), and the divider marks every
sound boundary rather than only one — which is right, because English has no onset/rime split
to single out. Four cells, three bars, three dividers.

---

## 8. Screen: Word Blocks (English)

**iPhone 17 Plus**, the owner's device: **one page, no rail at all.** 26 letters, `a`–`z`, in
one 4 × 7 grid at **84 pt** (430 × 932) or **87 pt** (440 × 956). Revision 4 needed two pages,
because the board also carried ten digraph tiles; `literacy-en.md` §0.1 deletes them and
`ship` becomes `s` `h` `i` `p`.

**That is the thing he asked for, delivered rather than approximated:** the standard character
table, whole, on one screen, on his own phone, with nothing missing, nothing off-screen and no
page control anywhere in the app.

```
┌──────────────────────────────────────────────┐
│▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔│
│ Word Blocks     [img][ ][ ][ ][ ]       ◔    │  shelf: 5 x 37pt
├──────────────────────────────────────────────┤
│  ┌──────┬──────┬╌╌╌╌╌╌┐                      │  strip: six 58x72 slots
│  │  s   │  h   ┊  ·   ╎                      │  reserved, three drawn.
│  └━━━━━━━━━━━━━┴╌╌╌╌╌╌┘                      │  ONE bar across `s` and `h`:
│    one span -- /ʃ/, one sound, two letters   │  "s-h says /ʃ/", the standard
│                                              │  classroom formula, drawn
│  ┌────┐┌────┐┌ ── ┐┌ ── ┐                    │  THE ALPHABET, a..z, 4x7 at 84pt
│  │ a  ││ b  │╎ c  ╎╎ d  ╎                    │  ONE PAGE.  NO RAIL.
│  └────┘└────┘└ ── ┘└ ── ┘                    │
│  ╎ e  ╎╎ f  ╎╎ g  ╎╎ h  ╎                    │  after `s` `h`, only `i` can
│  │ i  │╎ j  ╎╎ k  ╎╎ l  ╎                    │  follow -- ship.  `i` stands,
│  ╎ m  ╎╎ n  ╎╎ o  ╎╎ p  ╎                    │  everything else lies flat and
│  ╎ q  ╎╎ r  ╎╎ s  ╎╎ t  ╎                    │  still says its sound.
│  ╎ u  ╎╎ v  ╎╎ w  ╎╎ x  ╎                    │
│  ╎ y  ╎╎ z  ╎                                │  j q y z: no pack word uses
│                                              │  them.  Permanently flat, in
│                                              │  their slots, at full opacity,
│                                              │  speaking when pressed (§8.1).
└──────────────────────────────────────────────┘
```

Differences from Vietnamese, all structural:

| | |
|---|---|
| Runs | **one**, not two. `role3` never appears; there is no tone and no mark-slot |
| Pages | **1 on his iPhone, on a mid-size Android (360 × 800), on an iPhone 15/16, and on every tablet. 2 on the small phones** (`13 ¦ 13`). Revision 4 needed 2–3 everywhere |
| Strip | grows rightwards, **length not shown**. A Vietnamese syllable is always an onset, a rime and a mark; an English word's length is part of what he is discovering |
| Spans | **every** sound boundary gets a divider, not only one. English has no onset/rime split to single out, so `SHIP` is three spans and two dividers: `S H ┃ I ┃ P` |
| **Case** | **UPPERCASE**, where Vietnamese is lowercase. The owner's answer to Q7. It is a **glyph** decision and reaches nothing else — see §8.2 |
| Ordering | none beyond left-to-right. A tap fills the next empty cell |
| Chant | one beat per **sound**, each lighting its whole span (§10.4) |

**On ordering, and why the two boards differ on purpose.** English is `a`–`z` and nothing else;
Vietnamese interleaves its digraphs in the *editor's* vocabulary (`b c ch d đ g gh gi …`)
because Vietnamese dictionaries genuinely sort that way and English has no such convention
(`literacy-en.md` §0.7). Neither board shows a digraph tile any more, so this only reaches the
child through his mother's word list — but it is the rule, and it is each language's own.

**The four permanently flat letters are more visible now**, because the alphabet is the whole
board rather than page 1 of 2. §8.1 is why that is correct rather than a hole, and `J Q Y Z`
close the moment his mother adds `jam`, `yak` and `zip`.

### 8.1 Decision: a character with no words behind it is **shown, and permanently flat**

`en-seed` ships 25 letters and omits `q`, because no seed word uses it. That gap is exactly
the inconsistency the owner reported, and closing it needs a rule rather than a patch, because
the same situation arises three other ways: a letter his mother never uses, a letter whose
only word she deletes (L7), and `ngh`, which `literacy-vi.md` §4.2 deliberately ships with no
seed word at all.

**The rule, for both languages:**

> **Every character in the pack's `inventoryOrder` is on the board, in its slot, always.
> Whether any word uses it changes nothing about whether it is drawn.** A character with no
> words behind it is simply live in no state — permanently flat — and like every flat tile it
> keeps its glyph at full opacity and **speaks its sound when pressed**.

Three reasons this is the right answer rather than the convenient one:

1. **It is what "the regular character table" means.** An alphabet that omits the letters
   nobody happens to have used yet is not the alphabet, and a child who learns the board as
   *the alphabet* would be learning a false one.
2. **It makes the board stable against the word list.** If a character could vanish when its
   last word is deleted, his mother deleting one word would silently move every character
   after it — destroying the slot guarantee (`gameplay.md` §0B.1) from the editor. **L7
   already required this for deletions; `q` is the same rule applied from the start.**
3. **A permanently flat tile is not a dead tile.** It is a sound toy that always works, which
   is exactly what §5.8 says a flat tile is for, and `q` saying "kwuh" whenever he presses it
   is a small piece of teaching rather than a hole.

**Consequence handed to the content-engineer (E16):** `en-seed`'s `inventoryOrder.letter` must
carry all 26 letters in alphabetical order. **Revision 5 makes it four, not one** — `j`, `q`,
`y` and `z` have no word behind them (`literacy-en.md` §0.3) — and the rule is unchanged: the
validator must **not** treat a character with zero words as an error; it is a normal, permanent
state. **Vietnamese now has none at all**: all 29 letters appear in at least one `vi-seed` word,
where revision 4's board carried `ngh` with nothing behind it. The rule survives because it is
about the board, not about the count.

### 8.2 Decision (revision 5): English glyphs are **UPPERCASE**, and it is a pack field

**The owner answered `open-questions-ui.md` Q7 on 2026-09-23, against my recommendation:
`A B C D`.** That file records both sides in full, including why I argued for lowercase, so
that he can revisit it after watching his son use it rather than having to re-derive it.

> **The casing is a property of the PACK, applied at render, and it reaches the glyph and
> nothing else.**

#### 8.2.1 Where it applies, and where it must not

| Applies | Does **not** apply |
|---|---|
| the **table tile** glyph | **any pack data.** `pack.json`, `letters`, `tiles`, `inventoryOrder`, word ids and file names stay exactly as his mother typed them — lowercase |
| the **strip cell** glyph, including the merged word at chant beat 3 | **audio.** `A` says **/æ/**. Casing is a shape; the whole thesis of §2 is that a tile carries a *sound*, and uppercase must not smuggle letter *names* back in |
| the **page-rail button** glyph (moot on his device — English has no rail) | **the editor and every parent surface.** She sees what she typed. A form that shouts back at her is a form that looks broken |
| the **reveal's word** (§9.5) and the album card's word, so the child never sees two alphabets in one session | **ordering.** `inventoryOrder` is still alphabetical over the stored lowercase; nothing re-sorts |
| **English only** | **Vietnamese.** §8.2.3 |

#### 8.2.2 How it is specified, so it is not hard-coded

**A `toUpperCase()` in a component is a bug**, in exactly the sense §5.1 means when it says a
colour literal in a component is one: it will be right in one language and wrong in the other,
and it cannot be reversed without a developer.

| # | Requirement |
|---|---|
| 1 | The pack carries **one casing field per pack** — `en-seed` = upper, `vi-seed` = lower. The name and shape are the content-engineer's (**E22**); the UI needs a value it can read at pack load |
| 2 | It is read **once, at pack load**, into the same place the theme tokens live, and applied at **one** place in the tile/strip glyph component |
| 3 | **No component anywhere calls `toUpperCase()` or hard-codes a case.** A grep for it in `src/ui/` should return nothing |
| 4 | Changing it is **one field in `pack.json`** — no code, no rebuild, no re-record, no re-subset. That is the whole reason it is a pack field |
| 5 | An absent or unrecognised value falls back to **lowercase**, silently. Content is hostile input (`CLAUDE.md`) and a casing flag is never worth refusing to start over |

**No parent-menu row is added, and that is a decision rather than an omission.** Casing is a
one-time property of a language's content, not a play setting like volume or reduce-motion, and
putting it in AsyncStorage as well as the pack would create two sources of truth for one glyph
— which is precisely how a setting and a pack drift apart. The parent menu is already eight
rows and every one of them is something a parent changes *during* a session.

#### 8.2.3 Vietnamese stays lowercase, and the two must not be made to match

**This asymmetry is deliberate. It is a correctness constraint, not a style preference.**

- **`mả` / `mã` is the tightest pair in the §6.1 render gate — 34 px apart at 36 pt.** Stacking
  a tone mark on a capital compresses it further, because the mark sits against a cap height
  (0.74 em) rather than an x-height. `CLAUDE.md` calls a font that renders those two alike a
  *correctness* failure, and this design will not walk toward one for symmetry.
- **The gate does not cover it.** `assets/fonts/FIXTURE.txt` carries **7** uppercase Vietnamese
  letters — `Ă Â Đ Ê Ô Ơ Ư` — not the ~130 precomposed marked forms. Measured on the shipped
  files, **both bundled faces do cover them** (0 of 25 sampled forms missing), but *a font that
  contains a glyph is not a gate that has rendered it.*
- Vietnamese primary-school material is lowercase, which is what his son is being taught from.

> **Setting a Vietnamese pack to uppercase requires extending the §6.1 fixture and re-running
> the Q-series first.** Written here rather than left as folklore.

#### 8.2.4 It was measured before it was written

"Uppercase is free" is an assumption, so it was checked against the file that actually ships —
`assets/fonts/BeVietnamPro-SemiBold.ttf`, the tile face per `src/ui/typography.js:29` — and
against `Baloo2-SemiBold.ttf`, which is the one-line reversal §6.0.1 keeps available.

| | Be Vietnam Pro SemiBold | Baloo 2 SemiBold |
|---|---|---|
| `A`–`Z` present | **26 of 26** | **26 of 26** |
| Widest uppercase | **`W`, 1.039 em** | `W`, 0.832 em |
| Widest lowercase (what it replaces) | `m`, 0.895 em | `m`, 0.831 em |
| Cap height | 740 / 1000 | 602 / 1000 |

**`W` is the binding glyph and it is 16% wider than the `m` it replaces.** It still fits
everywhere, with room:

| | Cell | Glyph | `W` drawn | Slack |
|---|---|---|---|---|
| Tile, iPhone 17 Plus (EN, 4 × 7 at 84 pt) | 84 pt | 43 pt | 44.7 pt | **39.3 pt** |
| Tile, 360 × 640 floor (EN, 4 × 4 at 73 pt) | 73 pt | 36 pt | 37.4 pt | **35.6 pt** |
| Strip cell, iPhone 17 Plus | 58 pt | 46 pt | 47.8 pt | **10.2 pt** |
| Strip cell, 360 × 600 floor | 48 pt | 39 pt | 40.5 pt | **7.5 pt** |

**No layout rule changes and none needed to.** The strip's width term is
`stripFont = floor(stripCellW × 0.82)`, which tolerates a glyph up to **1.22 em** (`1 ÷ 0.82`);
`W` is 1.039 em, so there is **17% of headroom** against the widest glyph in either bundled
face. Vertically uppercase is strictly *easier* than what the box was sized for: no descenders,
no marks, cap height 0.74 em inside a glyph box of 1.55 em that exists for Vietnamese marks
above **and** below (§6.3).

**The tightest number is 7.5 pt of slack in a strip cell at the 360 × 600 floor**, and it is
named because it is what would bite first if the strip ever grew a seventh cell — which F17
already forbids.

**And the check was made to fail before it was believed.** "Uppercase fits" is exactly the kind
of claim that is green because nobody drew the widest glyph. Re-running the fit arithmetic with
a hypothetical wider face makes it **exit 1**, overflowing the strip cell at the 360 dp floor
by 0.8 pt while still fitting every tile — so the check discriminates, and the constraint is
the strip, not the table. That gives the number a future font swap actually needs:

> **The design tolerates a tile face whose widest glyph is up to `48 ÷ 39 = 1.231 em`.** Be
> Vietnam Pro SemiBold's `W` is **1.039 em** and Baloo 2 SemiBold's is **0.832 em**, so both
> bundled faces clear it. **A face wider than 1.231 em breaks English at the 360 dp floor**,
> and the failure would be a clipped letter in the word he is building — silent, and in the one
> place it matters most. `acceptance-criteria.md` **Q12** carries the number.

## 9. Component states

Every state, drawn. `t` = `tile`.

### 9.1 Tile, in the table

```
 LIVE rest      live pressed      DISABLED rest      disabled tapped   breathing(hint)
 ┌──────┐       ┌────┐            ┌ ── ─ ┐           ┌ ── ─ ┐          ┌──────┐
 │▓▓▓▓▓▓│       │▓▓▓▓│  0.92x     ╎      ╎           ╎      ╎ y+2      │▓▓▓▓▓▓│ α 1→.55→1
 │  m   │       │ m  │  base bar  ╎  b   ╎           ╎  b   ╎ 120ms    │  m   │ scale 1→1.05
 │▓▓▓▓▓▓│       │▓▓▓▓│  hidden    └━━━━━━┘           └━━━━━━┘          │▓▓▓▓▓▓│ 1200/1600ms
 └──────┘       └────┘                                                 └──────┘
 white face     translateY +3     ground face        sound plays        see 10.3 M15
 2 role bars    (pressed down)    3pt underbar       IN FULL; the
 ink glyph                        inkSoft glyph      tile does not
                                  dashed outline     move away

 CONSONANT tile (role1)          VOWEL tile (role2)            TONE tile (role3)
 ┌──────┐  SOLID bars              ┌──────┐  SPLIT bars            ┌──────┐  DOTTED bars
 │▓▓▓▓▓▓│                          │▓▓  ▓▓│                        │▓ ▓ ▓ │
 │  b   │  revision 5: the bar     │  a   │  a permanent property  │  ◌̀  │  Vietnamese
 │▓▓▓▓▓▓│  says WHAT THE LETTER    │▓▓  ▓▓│  of the glyph, not of  │▓ ▓ ▓ │  only; never
 └──────┘  IS, not what stage      └──────┘  his progress (§5.5)   └──────┘  in English
           the word is at

 standing up (M6)                 lying down (M6)              steady hint       flying
 disabled -> live, 200ms          live -> disabled, 200ms      ┌══════┐          ┌──────┐
 white face + bars fade IN,       bars fade OUT, glyph         ║▓▓▓▓▓▓║ 3pt      │▓▓▓▓▓▓│ 0.92
 glyph ink<-inkSoft, y -2         ink->inkSoft, y +2           ║  m   ║ reward   │  m   │ →1.06
                                                               ║▓▓▓▓▓▓║ rim      │▓▓▓▓▓▓│ →1.0
                                                               └══════┘          └──────┘
```

**There is no "wrong" state and no empty state.** A tile is live or flat; both are pressable,
both speak, and neither is ever red, crossed, greyed to illegibility or hidden.

**One extra state, Vietnamese tone cells only (revision 3, §7.2).** The carrier swaps when a
rime is seated or returned. It is a **160 ms opacity cross-fade of two stacked `Text` layers,
with no movement and no change of cell, size or bar** — the tile does not stand up, lie down
or acknowledge; only the glyph it carries changes.

```
 tone cell, no rime      -> rime `eo` seated       -> rime returned
 ┌ ── ┐  bare mark          ┌────┐  live              ┌ ── ┐  back to the mark
 ╎ ◌̀ ╎  ink 12.5:1         │ èo │  ink 13.4:1        ╎ ◌̀ ╎
 └━━━━┘  DISABLED, always   └━━━━┘  or flat           └━━━━┘
         (a tone cannot be placed before a rime, so the bare
          mark is never a choice -- gameplay.md §3.4a)
```

### 9.1a Page-rail button (revision 4)

```
 CURRENT           STANDING            FLAT                pressed
 ┏━━━━━━┓          ┌──────┐            ┌ ── ─ ┐            ┌────┐
 ┃▓▓▓▓▓▓┃ raised   │▓▓▓▓▓▓│            ╎      ╎            │▓▓▓▓│ 0.92x
 ┃  m   ┃ 4pt      │  ưa  │            ╎  ◌̀  ╎            │ ưa │ y+3
 ┃▓▓▓▓▓▓┃          │▓▓▓▓▓▓│            └━━━━━━┘            │▓▓▓▓│
 ┗━━━━━━┛          └──────┘                                └────┘
 reward FACE       exactly a LIVE      exactly a DISABLED  same press
 ink glyph         tile: white face,   tile: ground face,  as a tile
 6.53:1            role bar, ink       dashed, inkSoft     (M1/M2)
 "you are here"    "something live     "nothing here
                    on this page"       right now"
```

Identical geometry to a table tile — 72 pt, same radius, same bar pattern, same role colour —
because it **is** the same object doing a different job. The glyph is that page's first
character. There is no fourth state: a button is current, standing or flat.

### 9.2 Strip cell and span bar

```
 empty (the next)   filled              chant-lit            mark-slot (r5)
 ┌╌╌╌╌╌╌┐           ┌──────┐            ┌──────┐             ┌──────┐
 ╎  ·   ╎           │  m   │            │██m███│             │  ˚o˚ │
 └╌╌╌╌╌╌┘           └──────┘            └──────┘             └──────┘
 2pt dashed         ink on surface      reward FACE,          a dashed diacritic
 neutralFace        13.4:1              ink glyph 6.5:1       placeholder ABOVE
 3.25:1             part of a span      + lifts 1.12x         the carrier vowel,
 NOT a character:   bar below           (the GLYPH never      neutralFace 3.25:1
 it is not in the                        turns gold, U11)     on surface.
 table and cannot                                            "a mark goes here"
 be tapped (U13)
```

**The span bar — revision 5's new object.** It is not a property of a cell; it is a property of
a **run of cells that are one sound**, and it is what carries revision 5's whole explanation.

```
 one cell, one sound      two cells, ONE sound      two sounds
 ┌──────┐                 ┌──────┬──────┐           ┌──────┬──────┐┃┌──────┐
 │  b   │                 │  c   │  h   │           │  c   │  h   │┃│  o   │
 └━━━━━━┘                 └━━━━━━━━━━━━━┘           └━━━━━━━━━━━━━┘┃└┅┅┅┅┅┅┘
  5pt role1 SOLID          ONE 5pt bar, 124 wide     bar BREAKS (10pt), changes
  58 wide                  -- the cells did NOT      to role2 SPLIT, and a 2pt
                           merge, the BAR grew       neutralFace DIVIDER appears
                                                     in the gap (3.02-3.42:1)

 the tie growing (M22)                     the divider (M24)
 ┌──────┬──────┐                           2pt wide, 0.5 x cellH tall,
 │  c   │  h   │   scaleX 0.47 -> 1        vertically centred in the cell gap,
 └━━━━━━╌╌╌╌╌╌╌┘   ANCHORED LEFT           fades in over 180ms (opacity only)
   ^^^^^^^^^^^^    220ms, `enter`
   the bar reaches out from under `c`
```

| Span-bar state | Drawn as | Means |
|---|---|---|
| consonant span | 5 pt **solid** `role1Edge` under its cells | these letters are one consonant sound |
| vowel / rime span | 5 pt **split** `role2Edge` | these letters are the vowel part |
| tone | 5 pt **dotted** `role3Edge`, joining the vowel span when the mark lands | a tone was chosen — colour records it, no word does |
| growing (M22) | `scaleX` from `old/new` to 1, anchored left, 220 ms | *this letter joined the one before it* |
| breaking (M24) | a second bar fades in with its own colour and pattern, plus the divider | *a new part of the word starts here* |

```
 marked (revision 3, unchanged)   ┌──────┐   the tone does not get a cell. Its mark lands on
                                  │  ò   │   the carrier vowel, and a 5pt DOTTED role3 segment
                                  └┅┅┅┅┅┅┘   joins the vowel span. Colour records the tone.
```

### 9.3 The word strip as a whole

```
 empty     → building                    → announcing              → cleared
   ╎·╎        ╎c╎h╎·╎ → ╎c╎h┃o╎·╎ → ╎c╎h┃ó╎    chờ · o · cho · sắc · chó   (after the
              one bar    bar breaks,              the word ACCUMULATES,     picture flies
              across     divider in,              a SPAN at a time          to the shelf)
              c and h    mark-slot over `o`       -- §10.4
```

The strip is the same component in both modes and is **always six slots wide**, of which only
the used ones are drawn (§7.2.1). Vietnamese differs in two ways only: its last symbol is a
**mark applied to the carrier vowel** rather than a new cell, so a completed Vietnamese strip
has one fewer cell than it had taps; and it has exactly **one** divider, at the onset/rime
boundary, where English has one at every sound boundary.

### 9.4 Top bar (72 pt, on the ground, above the strip) — **rebuilt in revision 6**

```
 ┌──────────────────────────────────────────────────────────────────────┐
 │ ┌────────┐                                                           │
 │ │ ▓▓▓▓▓▓ │        [img][img][  ][  ][  ]            ┌──────────┐     │
 │ │ ┌────┐ │           Ghép Chữ                       │  Cha mẹ  │     │
 │ │ └────┘ │                                          └──────────┘     │
 │ └────────┘                                                           │
 └──────────────────────────────────────────────────────────────────────┘
   LANGUAGE          THE SHELF: 5 slots, 29-41pt square,      THE PARENT DOOR
   72 x 72           6pt gap. Filled = the photograph he      65 x 32, 1.5pt
   the CHILD'S       found, 2pt rewardEdge ring (3.08:1).     neutralFace outline,
   §9.4a             Empty = 1.5pt inkSoft ring at 40%.       label 13pt inkSoft
                     Tapping a filled slot replays it.        §9.4b
                     MODE TITLE under it, 13pt inkSoft,
                     centred (F19: the shelf row is its box)
```

**Three children, and each belongs to a different person.** The left is the child's, the
centre is his progress, the right is his parents'. The bar is `space-between`; nothing claims
flex-grow; the title may shrink and nothing else may (the defect that shipped `Word Blo…` for
three revisions lives in `test/topbar.test.mjs`, which now also has to measure the title
against the **shelf row** rather than against the left edge).

The shelf replaces revision 1's five-dot page rail, in the same place, doing the same job. It
is **a shape, not a score**: nothing accumulates across shelves, no number is shown, and it
resets when it tips into the album. **Revision 6 costs it 3 pt** — 32–44 becomes 29–41 — which
is the shelf's share of the two doors (§0D.3).

The **mode title moved under the shelf** and is otherwise untouched: 13 pt `inkSoft`, one
line, `Ghép Chữ` or `Word Blocks`, the leak detector that puts a label on every screenshot
(§3.1). It costs no width there, which is the whole reason it moved (§4.2, F19).

### 9.4a The language control — the child's, and it is not a tile

**This is the owner's correction (§0D.1): his son chooses his own language.** No gate, no
hold, no multiplication, no confirmation he cannot read.

```
  72 x 72, surface face, 18pt radius, 2pt neutralFace outline
 ┌──────────────┐      ┌──────────────┐
 │  ▓▓▓▓▓▓▓▓▓▓  │      │  ┌────────┐  │       TOP BAR  = Vietnamese, ALWAYS
 │              │      │  └────────┘  │       BOTTOM   = English,    ALWAYS
 │  ┌────────┐  │      │  ▓▓▓▓▓▓▓▓▓▓  │       in BOTH languages, in the
 │  └────────┘  │      │              │       chooser's own order (§9.6)
 └──────────────┘      └──────────────┘
   on a Vietnamese        on an English        each bar 44 x 20, 6pt radius, 8pt apart
   board                  board                FILLED `ink`  = the language you are in
                                               1.5pt `neutralFace` outline = the other
```

**Every decision in that figure, and why:**

| Decision | Why |
|---|---|
| **No glyph, no letter, no word** | A letter would be read as something to add to his word — it is a board full of letters. A word is the one channel he cannot use. So the control carries neither |
| **Filled vs outlined** | It is the live-tile / flat-tile distinction, which is the first thing he learns in this app and the only visual grammar he already has. "The full one is where I am; press the empty one" needs no explanation and no sound |
| **Two bars, stacked, in a fixed order** | It is a **picture of the destination**: the chooser is two stacked panels in exactly this order, so the transition explains itself. Position, not colour, carries which language is which — it survives greyscale, all three dichromacies and the theme picker |
| **Vietnamese on top, in both languages** | The order never flips, so the shape is learnable. It is also a **leak detector a tester can read at a glance**: on a Vietnamese screenshot the top bar is filled |
| **It is not a tile** | 18 pt radius against the tile's, a neutral outline instead of a role outline, **no identity bar** and no glyph. The one thing it must never be is the sixty-first character |
| **72 × 72** | §4.5's floor, unlowered. It is what made `TOP_BAR` 56 → 72 and it is the only thing this revision actually costs (§0D.3) |
| **Top-left** | Furthest from the parent door (opposite corner), on the opposite side from the page rail, and **above the word strip**: the shortest distance from its bottom edge to the nearest tile is `GAP_STRIP + stripH` = **89 pt at the 360 × 640 floor, 116 pt on the owner's iPhone, 134 pt on an iPad**. A finger reaching for a tile does not arrive here |
| **Hidden during the announcement and the reveal** | Switching language in the middle of a reveal is the messiest teardown in the app, and the reveal is over in about three seconds. The parent door stays, because a parent may need out |
| **One UI tap sound, never speech** | The language *names* are spoken on the chooser, where both are present and he can compare them. A name spoken on the board would be the outgoing language announcing the incoming one, which is a sentence with no meaning |

**Decision: it opens the chooser. It is not a toggle.** The orchestrator offered both; this is
the ruling and the reason.

1. **A toggle cannot be previewed, and he cannot read.** The only way he can know what he is
   choosing is to **hear it** — and hearing both names requires a screen that has both on it.
   The chooser is that screen, it is the only one `R3` permits to carry both titles, and
   revision 6 makes its panels speak their own names (§9.6, A2). Item 2 of this revision is
   what makes item 1 usable.
2. **The chooser makes an accidental press free.** Tapping the language he is *already in*
   returns him to the board with **the strip, the shelf, the session and the audio untouched**
   — no teardown, no reload, nothing abandoned. A toggle charges one part-built word for every
   stray press, and he will press everything.
3. **It is a screen he has already seen**, at first launch, unchanged, same code path.

**Decision: no confirmation dialog, and the chooser is the confirmation.** A confirmation he
cannot read is worse than the thing it guards. The chooser already asks twice — tap a panel,
it expands and speaks its name; tap the ▶ to commit — and the second touch is *after* he has
heard what he is choosing, which is the only confirmation that carries information for him.

**A switch mid-word costs one word, and that is the whole cost.** The teardown is exactly
revision 3's and is not weakened by any of this: audio hard-stops within 120 ms, the strip
clears, a running chant or reveal is abandoned, the shelf empties, **the album is kept per
pack**, the theme is untouched, and the board unmounts before any handle of the new language
is opened. **No instant has two packs loaded** (`R4`), so the no-mixing guarantee is
structural and unchanged.

### 9.4b The parent door — a visible door, and the lock stays exactly as it was

```
       ┌─────────────────┐                     ┌─────────────────┐
       │     Cha mẹ      │   press and hold    │ ▓▓▓▓▓▓▓▓░░░░░░░ │  ... 1200ms
       └─────────────────┘                     └─────────────────┘
         65 x 32, 16pt radius                    the fill sweeps LEFT -> RIGHT
         1.5pt neutralFace outline (3.02:1)      behind the label: scaleX only,
         label 13pt BeVietnamPro-Medium,         `neutralFace` at 22%, and it
         inkSoft (4.5 gate, 5.8-6.1:1)           says "this is filling up"
         8pt padding either side
```

**Why a word and not an icon.** A gear, a cog, a person, three dots — every one of them is a
*picture*, and pictures are the child's channel in this app. A gear is interesting to a
4-year-old. A word is furniture. **The door is deliberately made of the one material this app
denies him**, which is the same instrument the lock behind it uses and the reason `gameplay.md`
§7.2 says *"text is allowed here and on every screen behind it; the no-text rule protects the
child, not the mother."*

It is also **the only object in the app that never makes a sound when it is touched.** Every
tile talks, live or flat; the shelf replays a word; the rail clicks. He will find this once,
get a grey word and silence, and go back to the board.

**Ruling: the lock does not change, and only the door becomes visible.**

The orchestrator asked whether a visible door needs a different lock. It does not, and the
reason is that **hiding the door never was the lock**:

- A child who taps everything finds a 32 pt dot in a corner within a minute, and **1.2 s is
  nothing to a child who holds a tile for thirty seconds** (`acceptance-criteria.md` T-series
  is built on exactly that behaviour). The hold has never been the barrier.
- The barrier is, and remains, **reading a multiplication written out in words and answering
  it in digits** — the cleanest separation there is between a 4-year-old and a literate
  adult, and it needs nothing remembered in three months.
- So obscurity bought **nothing measurable**, and it cost the whole editor. Trading it away
  costs nothing.

What the visible door *does* change is that the child will now open the gate **screen** more
often, so the gate screen must be a free dead end: a large picture-only way back, the board
restored **with his part-built word still in the strip**, no sound, and a cooldown that is not
a reaction he can play with (`acceptance-criteria.md` Y14–Y17).

**And a tap stops being nothing.** Revision 5's `I2` said *"when the door is tapped, nothing
happens"*. **"Nothing happens" is a failure for an adult exactly as it is for a child** — it
is what the owner did, and it is why he concluded there was no button. A tap now shows the
**hold hint** for 1.6 s: the word `Giữ` / `Hold` and a 1.2 s ring, drawn under the door,
silent, in `inkSoft`. Repeated taps inside the 1.6 s do not restart it.

**And it is shown once, unprompted, to someone who is provably an adult.** The first board
after a language is committed shows the hold hint for 3 s, **once per install**, persisted as
a setting. At that instant the person holding the phone has just committed a language on a
two-touch screen, so they are an adult. That is the *"visible to an adult who is looking for
it, without instruction"* requirement met literally, for one boolean.

### 9.5 The reveal — the payoff, full screen

```
 BOARD                        →  REVEAL (full screen, no chrome except the PARENT DOOR;
                                          the language control is hidden -- §9.4a)
 ┌──────────────────┐            ┌──────────────────────────────┐
 │ ▔▔▔ [shelf]  ◔   │            │                          ◔   │
 │  ┌────┬────┬───┐ │            │                              │
 │  │ m  │ eo │ ̀  │ │            │     [ the photograph,        │
 │  └────┴────┴───┘ │   scale +  │       edge to edge ]         │
 │  ┌──┐┌──┐┌──┐    │   translate│                              │
 │  │  ││  ││  │    │   420ms    │           mèo                │  Baloo 2, 0.9x stripFont
 │  └──┘└──┘└──┘    │            │      Con mèo.                │  Be Vietnam Pro 20pt
 └──────────────────┘            └──────────────────────────────┘  (both only if
                                                                    `Show the word` is on)
```

The picture scales and translates **from the word strip's rectangle** to full screen, so the
word he made visibly becomes the thing it means. That is the whole design in one motion.

**The large word obeys the pack's casing flag (§8.2)** — `mèo` in Vietnamese, `SHIP` in
English — because it is the same word the strip was just holding and the motion is a *continuation*
of that rectangle. Two alphabets across one 420 ms transition would undo the thing the motion
exists to say. **The sentence below it does not**: it is running prose in Be Vietnam Pro at
20 pt, it only appears when *Show the word* is on, and it is aimed at the adult reading along.

### 9.6 Album, end screen, chooser

```
 ALBUM (the collection)                  END SCREEN (parent ended it)
 ┌──────────────────────────┐           ┌──────────────────────────┐
 │ Ghép Chữ              ◔  │           │ Ghép Chữ              ◔  │
 │  ┌──────┐   ┌──────┐     │           │  ┌────┐ ┌────┐ ┌────┐    │
 │  │ mèo  │   │ bò   │     │  newest   │  │    │ │    │ │    │    │  everything made
 │  └──────┘   └──────┘     │  first    │  └────┘ └────┘ └────┘    │  this session,
 │  ┌──────┐   ┌──────┐     │           │  ┌────┐ ┌────┐           │  still, α 0.7
 │  │ cá   │   │ gà   │     │           │  │    │ │    │           │
 │  └──────┘   └──────┘     │           │  └────┘ └────┘           │
 │  ┌──────┐                │           │                          │
 │  │ xe   │   …            │  scrolls  │      (no play control)   │
 │  └──────┘                │           │                          │
 │ ◐◑◒        ┌────────┐    │           └──────────────────────────┘
 │ theme      │   ▶    │    │             Returning to play needs the gate.
 │ buttons    └────────┘    │             THIS is how a parent ends a session.
 └──────────────────────────┘
   44pt each   photo card
```

Album grid: 2 per row in portrait, 3 in landscape, newest first, **scrolling** — it is a
collection and it grows without bound. Tapping a card replays its word, bounces it 1.04× and
**turns to that word's next photograph**. No count, no number, no percentage.

```
 THE CHOOSER  (the one screen showing both languages) -- REVISION 6
 ┌──────────────────────────────────────┐
 │   ┌──────────────────────────────┐   │  Each panel: that mode's role1 as a
 │   │        Ghép Chữ          ●   │   │  wide band, the title in the tile face
 │   │   Tiếng Việt                 │   │  at 32pt.  VIETNAMESE IS ALWAYS THE
 │   └──────────────────────────────┘   │  TOP PANEL -- §9.4a's control is a
 │   ┌──────────────────────────────┐   │  picture of this screen.
 │   │        Word Blocks           │   │
 │   │   English         ┌────┐     │   │  Tap -> expands, SPEAKS THE LANGUAGE'S
 │   │                   │ ▶  │     │   │  OWN NAME (`Tiếng Việt` / `English`,
 │   └───────────────────└────┘─────┘   │  A2), reveals the 72pt ▶ confirm.
 │          ◐      ◑      ◒             │  three 56pt theme buttons, unlabelled
 └──────────────────────────────────────┘
   ● = "you are here", 12pt rewardEdge dot, drawn only when the chooser was
       opened from the board.  Confirming THAT panel is a free return: no
       teardown, the strip and the shelf survive (§9.4a).
```

**Revision 6 changes two things here and nothing else.**

1. **The panel speaks the language's own name, not a sample word.** It said `mèo` and `cat`.
   The owner: *"for `mèo`, it should probably be `Tiếng Việt` and `English` then"*, and he is
   right for a reason worth writing down: **a sample word identifies a language only to
   someone who already knows that word and has connected it to a language.** A 4-year-old
   who knows `mèo` knows it is a cat, not that it is Vietnamese. The language's own name, in
   its own voice, is the direct signal — and it is what a parent would actually say. Now that
   the child chooses for himself (§9.4a), this is not a nicety: **it is the only channel that
   tells him what he is picking.** The two clips do not exist yet — handed to the
   content-engineer as **E23**, and because they are *speech*, `content-pipeline.md`'s rule
   applies and **the owner has to hear them before they ship**.
2. **The confirm control is a 72 pt ▶**, not a labelled button, because the child now uses
   this screen. `▶` is already the album's play control (the same figure, two blocks up), so
   it is a symbol he has met. The two-touch commit returns for a better reason than it had
   at first launch: **the first touch is the preview.** He taps, he hears `English`, and
   then he decides.

**When the chooser is opened from the board**, the current language's panel carries a
`rewardEdge` "you are here" dot, and confirming it is a **free return** — the session is not
torn down, the strip still holds what he had built, the shelf is intact and no audio stops.
Confirming the *other* panel is the full teardown of §9.4a.

### 9.7 Ruling: **B9 versus F2** (correction U10)

The tester found that `acceptance-criteria.md` **B9** ("a word with ≥2 images shows a different
image each time it is met") and **F2** ("at 180 ms the reveal cross-fades to a *different*
image of the same word") cannot both hold when a word has exactly two images: meeting it twice
consumes both, and the second meeting's reveal has nothing left that is "different" from its
own prompt.

**The conflict is dissolved by the correction, not arbitrated.** F2 existed because revision 1
showed a veiled prompt photograph on the board and the reveal had to be a *surprise* relative
to it. **There is no prompt.** Nothing is on screen before the reveal, so there is nothing for
the revealed photograph to differ from.

**Ruling:**

- **F2 is withdrawn.** Recorded as withdrawn rather than deleted, in `acceptance-criteria.md`
  §F, with this reason.
- **B9 survives and is the rule**, restated as a pure function so it is testable and
  deterministic: the reveal for the *k*-th encounter of a word shows `images[k mod n]`,
  `k` counting from 0. One image → that image, every time, no error. Two images → alternating.
  Four → a four-cycle.
- **Within a single held reveal**, tapping the picture advances to `images[(k+1) mod n]`,
  `images[(k+2) mod n]`, … — so "several photographs per word" is load-bearing in two places,
  not one, which is what `decisions.md` bought it for.

---

## 10. Motion

### 10.1 The law: transform and opacity only

**No Reanimated, no gesture-handler.** Every animation here is expressible in React Native's
built-in `Animated` with `useNativeDriver: true`:

> **Nothing animates layout, colour, width, height, border, shadow or text content.
> Everything is `transform` (translateX/Y, scale, rotate) or `opacity`.**

Auditable statically in Tier 1. Consequences, spelled out:

| Effect | How, under the law |
|---|---|
| a tile **stands up** or **lies down** | two stacked faces (white-with-bars, ground-with-underbar), cross-faded by **opacity**, plus a 2 pt `translateY` |
| a glyph goes from `ink` to `inkSoft` | two stacked `Text` layers, cross-faded by **opacity** |
| a strip cell takes the gold | a `reward` View over the white face, **opacity** 0 → 1, **per cell** — never one plate across the span (§5.8b) |
| **the span bar grows** (M22) | one `scaleX` on a bar already drawn at its final width, `transformOrigin` left. No width animation, no layout |
| **the boundary divider appears** (M24) | **opacity** 0 → 1 on a 2 pt View already positioned in the cell gap |
| **the re-voice pulse** (M23) | one `scale` on the span container, so both cells move as one body. No colour change |
| **the mark-slot appears** | **opacity** 0 → 1 on a dashed placeholder already positioned above the carrier glyph |
| **the table changes page** (M7a) | one `translateX` on the table container, plus one on the rail marker. No layout, no width, no opacity — the pages are laid out side by side and the window moves |
| **a tone cell swaps its carrier** (M7; replaces the table morph) | two stacked `Text` layers on that cell, cross-faded by **opacity**. No translate, no layout, nothing else on the board moves |
| the hairlines dissolve | **opacity** |
| the tone mark drops | the marked form as a second `Text` layer, **opacity** + `scale` 1.8 → 1 + `translateY` |
| the reveal | `scale` + `translate` on the picture card; no width/height |
| the picture flies to the shelf | `scale` + `translate` |

**No case in this specification requires Reanimated.**

### 10.2 Easings

| Name | Curve | Used for |
|---|---|---|
| `enter` | `Easing.bezier(0.22, 1, 0.36, 1)` | anything arriving |
| `exit` | `Easing.bezier(0.55, 0, 1, 0.45)` | anything leaving |
| `calm` | `Easing.inOut(Easing.ease)` | breathing, the shimmer, the dip |
| `settle` | `Animated.spring` `{ tension: 180, friction: 14 }` | a symbol seating |
| `pop` | `Animated.spring` `{ tension: 300, friction: 11 }` | press release, the hop |

### 10.3 The table — duration, curve, and what each one *says*

Animation that does not say anything is noise, and for this player it is noise that teaches him
to ignore the screen.

| # | Motion | Duration | Curve | What it communicates |
|---|---|---|---|---|
| M1 | tile press-in | 70 ms | `exit` | *I felt that.* Fires on touch-**down**, with the sound. |
| M2 | tile press-release | spring | `pop` | the block springs back; nothing was taken from him |
| M3 | live tile flies to the strip | 260 ms + 1.06 overshoot | `enter` | *it belongs there now* |
| M4 | strip cell fill | 140 ms opacity | `calm` | the cell is occupied |
| M5 | **disabled tile dip** | 120 ms, `translateY` +2 and back | `calm` | *I heard you; this one is lying down* — the smallest motion in the app, on purpose |
| M6 | **stand up / lie down** | 200 ms cross-fade + 2 pt rise or fall, **staggered 20 ms by cell index** | `calm` | *this is what can follow* — the teaching moment of the whole mechanic. The stagger makes it read as a wave across the board rather than a flicker. |
| **M7a** | **page slide** (revision 4) | **300 ms** when he taps a rail button, **420 ms** when the app auto-advances | `enter` | *we moved along the board* — **not** *these cells are now something else*. The whole table translates as one sheet and the rail's gold marker travels with it. The two durations are the app's existing convention for **who did it** (cf. M19) |
| M7 | **tone carrier swap** (revision 3, replaces the table morph) | 160 ms cross-fade of two `Text` layers, **no movement** | `calm` | *these hats now belong to this word.* The cell, its size, its bar and its position do not change — only the glyph. It is deliberately the quietest transition in the app, because the board must not look like it changed |
| M8 | **undo — symbols fly home** | 300 ms each, 90 ms stagger | `exit` | *taken back*, with the descending unclick |
| M9 | **the announcement hop** | 260 ms per symbol, 90 ms stagger, `translateY −14`, `scale 1→1.14→1` | `pop` | ***you made a thing*** |
| M10 | **merge — beat 3 of the chant** (the divider dissolves, the cells close up their gaps) | 240 ms `translateX`, 180 ms fade | `enter` | *these are one word.* In Vietnamese this is the toneless blend and it is a **spoken** beat (`audio.blend`). **Revision 5: it is the only merge left in the app**, it happens after the word is already made, and each cell translates left by `k × gap` — the leftmost does not move |
| M11 | **chant beat** | 320 ms, gold face **per cell** + 1.0→1.12→1.0 on **everything placed so far**, not on one cell | `calm` | *this much of the word is speaking now.* **Revision 5: a beat lights a SPAN**, so beat 1 of `chó` lights `c` and `h` together, because they are one sound (§10.4). The gold is per cell and the gaps stay on the ground (§5.8b) |
| **M22** | **the tie — a letter joins the sound before it** | **220 ms**, `scaleX` from `old/new` to 1, anchored **left** | `enter` | ***h joined c.*** The bar reaches out from under the letter he already placed to under the one he just placed. This is the single most important new animation in revision 5, because without it a superseding sound looks like a contradiction (§7.2.3) |
| **M23** | **the re-voice — both cells pulse as one body** | **260 ms**, `scale` 1 → 1.08 → 1 on the **span container** | `pop` | ***this sound is these two.*** Started on the first audio frame of the replacing clip. It is the only animation that re-animates something already seated, and that is its meaning: the sound you heard a moment ago is gone, not added to |
| **M24** | **the break — a new part of the word starts** | **180 ms** opacity on the divider, the new bar fading in with the arriving cell | `enter` | ***a new part starts here.*** Deliberately the visual opposite of M22: M22 reaches across a gap, M24 puts something in it |
| M12 | **tone mark drop, onto the merged word** | 260 ms, scale 1.8→1, y −10→0, 14% overshoot | `enter` | *this mark is the thing that changed.* It only reads if the word is already whole underneath it, which is why beat 3 merges before beat 4 marks |
| M13 | **the reveal** | 420 ms scale+translate from the strip to full screen | `enter` | *the thing is real, and it is yours* |
| M14 | reveal hold | +1400 → +2200 ms, still | — | the say-it-together beat (§2.3) |
| M15 | **picture flies to the shelf** | 520 ms, scale 1 → 0.08, translate to the slot | `exit` | *that one is kept* |
| M16 | **the shelf tips into the album** | 5 × 380 ms, 90 ms stagger | `exit`/`enter` | *that is a shelf full; here is everything you have made* |
| M17 | **the shimmer** (idle 20 s) | 900 ms sweep, α +0.25 peak, left to right across live tiles only | `calm` | *these ones* — without pointing at one |
| M18 | hint breathe (idle 40 s) | 1200 ms on, 1600 ms off, α 1→.55→1, scale 1→1.05 | `calm` | *this one* — slow, because there is no urgency |
| M19 | auto-play (idle 80 s) | rise 12 pt 200 ms · hold 160 ms · fly 420 ms | `enter` | *I'll take a turn* — slower than his own taps, so it reads as the app |
| M20 | confetti | 12 shapes, 300–1200 ms, drift outward and fade | `exit` | pure delight, and the only purely decorative motion in the app |
| M21 | gate-dot hold | ring fills 0→360° over 1200 ms | linear | *keep holding* — the only progress indicator in the app |

### 10.4 The announcement, frame by frame — and the chant that accumulates

| t (ms) | What |
|---|---|
| 0 | **the motif fires** (and the cheer, if recorded). **Any speech still playing is stopped, not ducked** (§11.2, U16). M9 begins: the strip's symbols hop in sequence, 90 ms apart |
| 300 | M10 preview: the dividers dissolve and the symbols slide into one word |
| 350 | M20: 12 confetti shapes in `role1` / `role2` / `reward` |
| 440 | the motif ends; the **chant** begins. Skipped on a re-discovery |
| chant end | M13: the picture scales from the strip's rectangle to full screen, 420 ms |
| +200 | **the word is spoken** |
| +1400 | motion ends. The word sits large on the picture. **Silence.** |
| +2200 | the word is spoken once more (§2.3) |
| +2200 → | held indefinitely; each tap replays the word, bounces 1.04× and turns to the next photograph |
| exit (3000 ms after the last tap) | M15: the picture flies into the shelf; the strip clears — **unless the word is a proper prefix of another**, in which case the strip keeps it (`gameplay.md` §5.5) |

**The Vietnamese chant, beat by beat — restated for revision 5 (U38).** Revision 4's five beats
were the owner's own request and they are unchanged *as beats*. What changes is what a beat
lights, because a beat's unit may now be two or three cells.

> **A chant beat lights a SPAN, not a cell. The beats are a property of the model, not of the
> taps.** `chó` is six taps — `c` `h` `o` and the sắc — and **five beats**, exactly as `bò` is.

Gaps come from `pack.chant.gapsMs`, shipped as
`{onset:250, rime:250, blend:400, tone:250, word:600}`, so they are hers to tune.

**`bò` — two letters, one span each. Identical to revision 4.**

| Beat | Shown in the strip | Spoken | Motion | Gap after |
|---|---|---|---|---|
| 1 | **`b`** gold | `bờ` | M11 on the onset span (1 cell) | 250 |
| 2 | **`b` `o`** — both gold, divider still there | `o` | M11 extends to the rime span | 250 |
| 3 | **`bo`** — the divider dissolves, the cells close up | **`audio.blend`** — `bo` | **M10** | 400 |
| 4 | **`bò`** — the mark drops onto the joined word | `huyền` | **M12** | 250 |
| 5 | **`bò`** — held, whole, gold | `audio.word` — `bò` | M11 holds | 600 |

**`chó` — the case revision 5 creates. Six taps, still five beats.**

| Beat | Shown in the strip | Spoken | Motion | Gap after |
|---|---|---|---|---|
| 1 | **`c` `h`** — *both cells gold at once*, one bar under them | `chờ` | M11 on the **two-cell onset span** | 250 |
| 2 | **`c` `h` ┃ `o`** — all three gold, the divider still visible | `o` | M11 extends to the rime span | 250 |
| 3 | **`cho`** — the divider dissolves, three cells close up | **`audio.blend`** — `cho` | **M10**, each cell left by `k × gap` | 400 |
| 4 | **`chó`** — the mark drops onto `o` | `sắc` | **M12** | 250 |
| 5 | **`chó`** — held, whole, gold | `audio.word` — `chó` | M11 holds | 600 |

**Beat 1 lighting two cells for one sound is the lesson**, and it is the same picture M22 drew
when he tapped `h`, replayed as a reward. The two moments reinforce each other: *when you
tapped, the bar reached across; now, when it speaks, both blocks light together.*

**`chuối` — five letters, the longest word in the pack.** Beat 1 lights `c` `h`; beat 2 lights
`u` `ô` `i`; beat 3 closes all five up; beat 4 drops the sắc onto `ô`; beat 5 says `chuối`.
**Still five beats**, and this is exactly why the đánh vần model was worth keeping.

- **`ngang` words skip beat 4** (`chant.skipToneStepFor`): `dê` is `dờ` → `d ê` → `dê` → `dê`.
- **Zero-onset words skip beat 1**: `áo` is `ao` → `ao` → `áo` → `áo`. Its two letters are one
  span from the first tap, so beat 2 lights both.
- **Every beat boundary is driven by the clip's completion, not by a timer**, with the gap added
  after it.

**The English chant, restated by the same rule.** Revision 4 said "each letter lighting as it
speaks"; that is now wrong for five of the forty words. **One beat per sound; a beat lights its
span.**

| Word | Beats | What lights |
|---|---|---|
| `cat` | `/k/ · /æ/ · /t/ · merge · cat` | one cell each |
| `ship` | `/ʃ/ · /ɪ/ · /p/ · merge · ship` | **beat 1 lights `s` and `h` together** |
| `duck` | `/d/ · /ʌ/ · /k/ · merge · duck` | **beat 3 lights `c` and `k` together** |
| `egg` | `/ɛ/ · /ɡ/ · merge · egg` | **beat 2 lights both `g`s together** — one sound, not two |

That is the same rule as Vietnamese, stated once and applied twice, and it is the standard
classroom formula in both: *"s-h says /ʃ/"*, *"c and h say chờ"*.

### 10.5 Reduce motion

Follows the OS setting, overridable in the parent menu. When on, **every** animation above
becomes a cross-fade of the **same duration**, so timing, audio sync and the acceptance criteria
are unchanged.

| | Reduced to |
|---|---|
| M1/M2 press | α 1 → 0.8 → 1, no scale |
| M3 flight | 260 ms cross-fade: the tile fades out of the table and into the cell |
| M5 disabled dip | α 1 → 0.85 → 1, no translation |
| M6 stand/lie | the cross-fade only, no rise or fall, **no stagger** |
| M9 announcement hop | α pulse per symbol, same 90 ms stagger, no translation or scale |
| M13 reveal | 300 ms cross-fade to the full-screen picture. **No scale, no confetti** |
| **M7a page slide** | a **300 / 420 ms cross-fade** between the two pages, same durations. The rail marker cross-fades too. **Direction is lost, which is a real loss** — so the page sound (§11.3) is what carries "it moved" here, and it is unchanged in both modes |
| M7 tone carrier swap | unchanged — it is already a cross-fade with no movement |
| **M22 the tie** | a **220 ms opacity cross-fade** from the one-cell bar to the two-cell bar, same duration. **Direction is lost and the bar's new length is not**, which is the part that carries the meaning — the static end state still says *one bar, two cells* |
| **M23 the re-voice** | **α 1 → 0.75 → 1 on the span**, 260 ms, no scale. Both cells still pulse **together**, which is the load-bearing half |
| **M24 the break** | unchanged — it is already opacity only |
| **M10 the merge** | a 240 ms cross-fade from the spaced cells to the closed-up word, same duration. No slide |
| M17 shimmer | a single 900 ms α pulse across the live tiles, no sweep |
| M18 breathe | α only, no scale |
| M21 gate ring | a static ring that fills in 4 steps |
| **M25 the door's hold fill** | **two steps, not a sweep**: 50 % at 600 ms, 100 % at 1200 ms. A hold with no feedback at all is worse than one that moves, so this one keeps information rather than being flattened to a fade |
| **M26 the language control's swap** | the two bars **cross-fade** between filled and outlined over 260 ms. There is no movement to lose: it is already a state change in place |
| **M27 the hold hint** | α only, 160 ms in and out, no rise. Unchanged in both modes |

**Audio is identical in both modes**, including the motif and the cheer. That is the point: the
audio carries the whole game, so a child who has turned away, or whose parent has reduce-motion
on, loses nothing.

### 10.6 The two doors — new in revision 6

Three motions, and each one has a sentence it has to say.

| # | What | Duration / easing | What it communicates |
|---|---|---|---|
| **M25** | The **parent door's hold fill** sweeps left → right behind the label: a `neutralFace` rectangle at 22 %, `scaleX` 0 → 1 from the left edge | **1200 ms, linear** | *This is filling up, and it will be full when it opens.* Linear because a progress indicator that eases is lying about the time left. Releasing early runs it back to 0 in **160 ms, `exit`**, which says *it emptied* rather than *it vanished* |
| **M26** | The **language control's two bars swap**: the filled one becomes an outline and the outline becomes filled, cross-faded in place | **260 ms, `calm`** | *You are now the other one.* It runs **on return from the chooser**, on the new board, so it is the first thing that happens in the new language — the board's own confirmation that the tap did what he asked |
| **M27** | The **hold hint** — the word `Giữ` / `Hold` and a 1.2 s ring — fades in under the door and out again | **160 ms in, 1600 ms hold, 160 ms out, `enter` / `exit`** | *It is not broken; it wants a longer press.* Opacity only, no rise, no bounce: it is information for an adult, not a flourish, and it must not read as something to play with |

**Nothing here is on the reward channel and nothing here makes a sound.** The door is silent
by design (§9.4b); the language control plays the one UI tap sound the app already has and no
speech (§9.4a). The celebration vocabulary — gold, scale, the motif — is untouched, because
none of this is an achievement.

---

## 11. Audio behaviour

**Rewritten in revision 3 (U16).** The owner: *"the sounds when picking English characters
are not good enough, voices seem to be mixed up with each other."* §11.0 is the diagnosis,
because the brief asked for one before a redesign, and because the answer turned out to be a
number this document had wrong by a factor of six.

### 11.0 Diagnosis — measured, not guessed

Clip lengths parsed from the MP3 frame headers of the clips actually in `packs/en-seed` and
`packs/vi-seed`:

| Clip | What `ui.md` r2 §11.2 assumed | **Measured, shipped** |
|---|---|---|
| English `short` — "kuh" | **~350 ms** | **2016 – 2784 ms** (b 2208, c 2184, d 2040, f 2688, g 2784, h 2016, j 2040, k 2184) |
| English `long` — "kuh, cat" | ~1 s | **2904 – 3504 ms** |
| Vietnamese onset name — `bờ` | — | 792 – 864 ms |

**That is the finding.** Every rule in revision 2's §11.2 was written for a 350 ms letter
sound. The shipped clips are six times that, and edge-tts at `-35%` spends much of it on a
slow drawl and its tail. A 4-year-old taps every 300–600 ms. **The cut-on-next rule then cuts
every clip inside its first 20%**, and what he hears is a run of truncated stubs of one slow
adult voice rather than a run of letter sounds.

Three design decisions turned that into "voices mixed up with each other", and all three are
mine:

1. **The `long` anchored clip fires on a tap.** "kuh, cat" is *two utterances in one file*, 2.9
   –3.5 s long. Cut anywhere past the letter, it leaves a fragment of an English **word**
   landing on the next letter's onset. Two words, two fragments, one after another — that is
   the literal description of what he reported.
2. **The announcement ducked instead of stopping.** AC F19 required tile audio to keep playing
   at −18 dB under the motif. Speech continuing underneath music is two voices at once, by
   specification.
3. **The knock and the seat click sound over the letter.** They are on a separate channel —
   correctly, so the knock never cuts the clip it belongs to — which means they sit *on top of
   it*. At −9 dB over a slow vowel that is another voice in the mix.

**Neither the channel rules nor a louder clip can fix a 2.2-second letter sound**, so the
asset budget in `gameplay.md` §0A.4 goes to the literacy-designer and the content-engineer:
`short` must be **≤ 700 ms** of audio with ≤ 40 ms of leading silence and ≤ 120 ms of tail.
§11.1–§11.3 are the half I own.

**And the honest caveat this project keeps re-learning:** *amplitude is not intelligibility*,
and neither is duration. A clip length is a number that correlates with the property the owner
cares about; it is not that property. Nobody here can hear. §11.0 is a real defect with a real
measurement behind it, and it still needs his ear afterwards (**AC U9a**).

### 11.1 Latency budget

**Budgeted against an iPhone 11 / A13 and a 2021 mid-range Android (Snapdragon 690)** — the
oldest devices plausibly in this house.

| Event | Budget |
|---|---|
| visual press state | **≤ 1 frame (16.7 ms)** from touch-down |
| **some** sound begins, live or flat | **≤ 60 ms** from touch-**down**, not touch-up |
| a **live** tile's own clip begins | ≤ 60 ms — it is the first sound |
| a **flat** tile's own clip begins | **≤ 160 ms** — its knock is the sound at 60 ms, and the clip follows it (§11.3) |
| the announcement motif begins | **≤ 60 ms** from the touch-down that completes the word |
| chant beat boundary drift | ≤ 30 ms after the previous clip **ends** |

Achieved by: **every clip the board can produce is decoded and resident.** The table is
constant, so this is a one-time cost at pack load rather than a per-tap concern.

> **CORRECTION, 2026-09-24 — that sentence is what made the app silent on a real iPhone.**
> "Every clip the board can produce" is **100** native players for `vi-seed` and **121** for
> `en-seed`, and iOS refuses somewhere below that: every construction past its ceiling threw,
> the failure was swallowed, and the whole audio system — the bundled seat click included —
> went quiet the moment a pack loaded. What is resident now is **every clip the *current
> board state* can ask for, inside a bound of 24 native players**, live cells first, with the
> touch-immediate UI sounds pinned and everything else built on demand and evicted
> least-recently-used. The table above is unchanged **for a warm clip**; a cold one costs one
> player construction first. `acceptance-criteria.md` **§0E** carries the arithmetic, the
> deviation and the diagnostic that reports it from the device.

**Revision 5 changes what "every clip" means, and it is more clips, not fewer** — stated here
because the instinct is that a 35-cell board is cheaper audio than a 67-cell one, and it is
not. Tile audio is keyed by **unit-in-progress**, not by tile: tapping `h` after `c` plays
`chờ`, and tapping `n` after `ă` plays `ăn`. `literacy-vi.md` §0.12 counts it — **28 onset
states + 43 rime states + 6 tones = 77 clips, 9 of them new, 0 retired.** English adds and
retires none: its ten digraph clips change role from *tile* to *re-voicing* (`literacy-en.md`
§0.9). At the shipped sizes that is ≈ 2.3 MB of Vietnamese handles; the eviction rule is
unchanged — **keep the whole tone run and the current live set resident, evict by
least-recently-touched** — never evict what is standing.

**The superseding clip is indexed by the prefix, not by the tile, and that must not be
re-derived at runtime.** Which clip `h` plays depends on what is already in the strip, and the
parse comes from the stored `(onset, rime, tone)` triple, never from the letter stream
(`literacy-vi.md` §0.5). The UI asks the engine "what unit am I building?" and plays that
unit's clip.

Sound fires on `onPressIn`. Nothing waits on an animation.

### 11.2 Channels and the cut rule — stated so it cannot be implemented two ways

**There are exactly three channels.**

| # | Channel | Carries | May sound while another channel sounds? |
|---|---|---|---|
| **1** | **SPEECH** | every clip containing a voice: tile clips (`short` and `long`), every chant beat including the blend, the tone name, the whole word, the reveal repeat, the parts hint | **Never two at once.** See the cut rule |
| **2** | **UI** | the seat click, the flat-tile knock, the undo unclick, the shelf bell, the album phrase | yes, over speech |
| **3** | **MOTIF** | the announcement motif, and the cheer layered on it | yes, over UI — but **never over speech**, because it stops speech first |

**The cut rule, exactly:**

> **A clip on the SPEECH channel is cut if and only if a new SPEECH clip is requested, or the
> announcement motif fires.** Nothing else cuts it — not a knock, not a click, not an
> animation, not a state change, not a timer.
>
> **The cut is synchronous and happens before the new clip starts**, in the same call:
> `pause()` then `seekTo(0)` on the outgoing player, *then* `seekTo(0)` + `play()` on the
> incoming one. There is no fade, no crossfade, no duck and no queue. At no instant are two
> SPEECH players un-paused.
>
> **A speech request is never dropped in favour of the clip already playing.** The newest tap
> always wins. A queue would play his sixth tap six seconds late, which reads as broken.

Consequences, spelled out because each one was wrong before:

| Rule | |
|---|---|
| **A tap always plays `short`.** | No exceptions, no first-touch special case, no 900 ms window. The `long` anchored form is **never** fired by a tile tap — see below. |
| **REVISION 5: a tap plays the clip of the unit it is building, and a tap that completes a digraph SUPERSEDES the previous clip.** `c` → `cờ`; `h` → **`chờ`**, cutting `cờ` if it is still running. He never hears `cờ` **and** `hờ`. | This is **already** what the cut rule does — a new SPEECH request cuts the old one, synchronously, newest wins — so revision 5 adds **no audio machinery at all**. `literacy-vi.md` §0.9 and `literacy-en.md` §0.6 are the tables of what plays. The only new obligation is visual, and it is M22 + M23 (§7.2.3): a child must *see* that `h` joined `c`, or the replacement sounds like a contradiction. |
| **A flat tile plays the unit it WOULD build**, on the same rule. | Tapping `h` with `c` seated plays `chờ` whether or not `ch` leads anywhere, because the board never punishes and the sound is true. |
| **The `long` clip has exactly one trigger: the parts hint** (hold the strip 800 ms, §2.2), which is a gesture an adult knows and a child does not, made when the board is quiet. It is also used in the editor's preview. | "kuh, cat" is curriculum for a parent to use *with* him, not a thing to fire 200 times a minute. This deletes revision 2's long/short state machine entirely (AC D7–D9 withdrawn) and with it the question of what a cut anchored clip sounds like. |
| **The motif STOPS speech; it does not duck it.** | AC F19 is withdrawn. Ducking was the specification that guaranteed two voices at the loudest moment in the app. |
| **Channel 2 is non-speech by definition.** No asset on it may contain a voice. | It is the only channel allowed to overlap, so it is the only one where a voice would collide. The **cheer is the single exception and it is deliberate** — it is her voice, on channel 3, layered on the motif, which is the point of it. |
| **The flat-tile knock precedes its letter** (§11.3). | It removes the last simultaneous pairing, and knock-then-letter is a *clearer* signature of "this one is lying down" than knock-over-letter was. |
| **Hold.** Holding a tile past 600 ms replays its `short` clip every 700 ms, **up to 6 times**, then stops. | Each repeat is a SPEECH request and therefore cuts the previous one — which is the rule, not an exception to it. The tile stays pressed with M18's breathe so the screen is not frozen. On release nothing is placed. |
| **Placement** = touch-down and touch-up within **600 ms** and within **24 pt** of the start point. | |
| **Multi-touch.** The game is **single-touch**. The first touch owns the gesture; further simultaneous touches are ignored until it ends. | Two fingers on two tiles plays one sound and seats one symbol. |
| **During the chant, tiles are not tappable**, so no tap can cut a chant beat. | The chant is the one sequence whose beats must complete. |
| **Vietnamese keeps both clip slots** (`long` = `short` today), so the parts hint has something to play in both modes. | |

### 11.3 Sound events, so the game works with the screen ignored

| Event | Channel | Sound |
|---|---|---|
| live tile touched | 1 | the `short` clip **of the unit it builds** — `cờ` for a bare `c`, `chờ` for `h` after `c` — at ≤ 60 ms, cutting whatever speech is running |
| symbol seated | 2 | a 90 ms wooden seat click, at −6 dB, over the clip's tail |
| **flat tile touched** | 2 then 1 | **a 40 ms muted knock at −9 dB at ≤ 60 ms — wood, not drum — and then its own `short` clip in full, starting at +120 ms.** The two do not overlap |
| **undo** (tap the strip) | 1 + 2 | the clip of **what is left after the return** — undoing `h` from `c h` says `cờ`, not `hờ` — plus a **descending two-note unclick**, 140 ms. The rule is the same one going backwards: *say the unit you are building now*. On an empty strip, nothing |
| **a word forms** | 3 | **speech is stopped**, then the motif, plus the cheer if recorded |
| chant | 1 | five beats, §10.4, each starting after the previous one **ends** |
| reveal | 1 | the word, then §2.3's repeat |
| shelf slot fills | 2 | a single soft bell, folded into M15 |
| shelf tips into the album | 2 | a four-note phrase, once |
| auto-play (M19) | 1 | that tile's clip, at the moment it lands |
| **page change, his or the app's** | 2 | a **soft non-speech page sound**, 120 ms, −6 dB — a paper/wood slide, not a click and not a knock. **It is the same sound whoever caused the change**, because the *duration of the motion* is what distinguishes them visually and a second sound would be one more thing to learn |
| **page-rail button pressed** | 2 | the page sound only. **Never speech** — the glyph on a button is a label, not a character he is choosing |
| parts hint (hold the strip) | 1 | the `long` anchored clips, or the đánh vần of what is assembled |

**Every one of these is distinguishable with the screen face-down**, which is an acceptance
criterion (§M), not an aspiration. The **four** critical distinctions are *seated* (click) vs
*flat* (knock-then-letter) vs *taken back* (descending) vs **the board moved** (the page
slide), and **the motif rises while the unclick falls**, so the two moments that matter most
can never be confused. The page sound is the only one of the four that is a *sustained* sound
rather than a transient, which is what keeps it separable from the click and the knock.

**Silent switch.** Audio uses the `playback` category, so the game speaks even when the ringer
switch is silenced. A parent's phone lives on silent and a silent word game is a broken word
game. A mute row exists in the parent menu.

### 11.4 The announcement motif — the spec

| | |
|---|---|
| Form | three notes, **rising**, a major triad: root · major third · perfect fifth |
| Timing | onsets at 0 / 130 / 260 ms; each note 180 ms; **440 ms total** |
| Voice | a soft mallet — marimba or glockenspiel; fast attack, short decay, no reverb tail |
| Level | peak −6 dBFS. **It stops the speech channel rather than ducking it** (revision 3, U16) |
| **New word** | a **fourth note an octave above the root** at 390 ms — audibly *more*, with no number and nothing to read |
| Language | **identical in both modes.** It is the app's signature, not a localised string, and it is the one sound that may cross the language boundary because it contains no language |
| The cheer | if the pack has one, it plays **at t = 0 over the motif**, ≤ 2 s, at −3 dBFS. The one voice in the app that is allowed to overlap anything, because it is hers and that is the point |
| Files | two bundled UI assets (`motif-3`, `motif-4`), plus an optional per-pack `cheer` |

**Why a motif and not a spoken catchphrase.** Catchy is repetition plus anticipation: he will
hum three notes after a day and will start to anticipate them a beat before they arrive, which
is the feeling the owner asked for. A spoken line is a second recorded asset per language, it
collides with the word audio 600 ms later, and it is the element that goes stale first. The
cheer gives back everything a catchphrase would have offered, in his mother's voice,
optionally.

## 12. Accessibility

| | Decision |
|---|---|
| **Reduce motion** | §10.5. OS-driven, parent-overridable. Audio unchanged, including the motif. |
| **Audio carries the game** | Every state change has a distinct, non-musical sound except the announcement, which is the one musical event and is therefore unmistakable. A tester must be able to play with the screen face-down and know what happened: which letter was touched, whether it was standing or flat, whether a symbol seated, whether one was taken back, and that a word formed. Acceptance criteria §M. |
| **No information by colour alone** | Live vs disabled = **ink weight + outline solidity + glyph darkness**, with colour last (§5.8). Role = colour **+ bar pattern**. The onset/rime boundary = **a break in the bar + a pattern change + a 2 pt divider**, three channels of which two survive total colour loss (§7.2.2). Nothing anywhere depends on hue. |
| **Consonant vs vowel under CVD** | **Newly gated in revision 5** (§5.5, U31), at dE00 ≥ 20 in all three dichromacies, because the two are now adjacent in every row and live simultaneously at the five branching onsets. Measured worst case **23.7**. The bar pattern (solid vs split) is the non-colour channel that makes the gate affordable rather than necessary. |
| **Greyscale** | S8 is extended in revision 2: live must be separable from disabled with colour removed. The bars do it. |
| **Contrast** | §5.2, gated in CI. The live glyph is 13.4:1 and **the disabled glyph is 5.4–5.9:1** — a disabled letter is still a letter he is learning. |
| **Colour-vision deficiency** | Printed diagnostic, honest about Popsicle's weak pair, with **Playground as the red-green-safe theme** and a one-tap switch on the album. |
| **Dynamic Type** | Parent surfaces scale to 2.0×. **Child surfaces do not** — the tile is a motor constant and the glyph must fill it. Deliberate exception, recorded. |
| **Uppercase and screen readers** | The casing flag (§8.2) cannot make a screen reader announce *"capital S"*, because **individual tiles are `accessibilityElementsHidden`** and the board is one element describing the state. The one element's text is authored, not read off the glyphs, so it says *"s, h — one sound"* whatever the tiles are drawn in. Recorded because "uppercase is only a glyph" has to survive contact with assistive tech to be true. |
| **VoiceOver / TalkBack** | The **board exposes one accessibility element** describing the state — revision 5 makes it describe **spans and the fork**: *"Building a word. c, h — one sound. Three letters can follow. A mark can also finish it, on page 3."* **The page rail is a second element**, describing pages and which hold something live. Individual tiles are `accessibilityElementsHidden`: letting a screen reader speak letter *names* over a game whose entire thesis is letter *sounds* would teach the opposite of the app. **Parent surfaces are fully and conventionally labelled.** |
| **The two doors, revision 6** | The **language control carries no text and no colour that matters**: position (top bar = Vietnamese, always) and fill-vs-outline carry it, so it survives greyscale, all three dichromacies and every theme. The **parent door is the opposite and deliberately so** — it is text, and it is invisible to the person it is hiding from. Both are conventionally labelled for VoiceOver / TalkBack, the door as a button that says it needs a long press; a screen reader is an adult's tool. Under **reduce motion** the door's hold fill does not sweep: it appears at 50 % after 600 ms and full at 1200 ms, in two steps, because a progress indicator that gives no feedback is worse than one that moves. |
| **Handedness** | The table is centred, so handedness does not matter. **The parent door is top-right and the child's language control top-left** (revision 6) — opposite corners, so neither hand reaches both, and the door is the harder one for a left-handed child to brush. The editor's `+` is bottom-right, an adult target. No mirror mode in v1. |
| **Screen too small** | Below 360 × 600 pt, or any viewport that cannot build a page plan **or lay out the six-cell word strip** for the chosen pack (F7, F15, F16), a parent-facing card. No half-broken game. Every served device still reaches every word. **Revision 5 makes the per-language case rarer, not commoner**: the 360 × 640 floor now serves Vietnamese in 3 pages where revision 4 needed 7. The card names the language when only one is served, and language is switchable (§0A, U17). |
| **Audio with the screen ignored** | Revision 5's new information — *these two letters are one sound* — is carried on the speech channel **for free**, because the superseding clip *is* the statement: he hears `chờ` where two separate sounds would have said `cờ` `hờ`. A child looking away loses the bar and the divider and loses **nothing of the lesson**. That is the test §12 sets, and it is the reason `literacy-vi.md` §0.9's rule is the right one rather than merely a tidy one. |

---

## 13. The editor — his mother's product

Reached by: **the parent door** (`Cha mẹ` / `Parent`, top-right, §9.4b) → 1.2 s hold → the
multiplication → parent menu → **`Words`, row 1**. **Revision 6 changes only how she finds
it**; nothing inside the editor moves.
**Optimised for a phone held in one hand.** On a tablet it renders as a centred **520 pt
column** on `groundAlt`, not a stretched form.

**The app makes no network call, ever, including here.** No image search, no runtime TTS. Her
sources are the camera, her photo library, and her voice.

Unchanged from revision 1 except §13.5 (a new reason, rewritten again in revision 3), §13.6
(the cheer) and the preview, which now shows discovery. **Revision 3 changes nothing about her
flows** — it changes what §13.5 says and how often she will see it.

### 13.1 Word list

```
┌────────────────────────────────────────┐
│ ←   Từ vựng                  Ghép Chữ  │
│ ┌────────────────────────────────────┐ │
│ │ 🔍  Tìm                            │ │
│ └────────────────────────────────────┘ │
│ ┌────┐                                 │
│ │ img│  mèo                        ●   │  64pt thumb, word in Baloo 2 24pt,
│ │    │  m · eo · huyền                 │  decomposition in 15pt inkSoft,
│ └────┘                                 │  green dot = playable
│ ┌────┐                                 │
│ │ img│  phở                        ◐   │  amber half-dot = not playable yet
│ │    │  cần ghi âm                     │  ("needs a recording")
│ └────┘                                 │
│ ── Chưa chơi được (3) ─────────────────│  a section, not an error list
│ ┌────┐                                 │
│ │ img│  máy bay                    ◐   │
│ └────┘  hai tiếng                      │
│ ┌────┐                                 │
│ │ img│  xoài                       ◐   │
│ └────┘  chữ `x` chưa có trên bảng      │  NEW in revision 2 -- §13.5
│ ── Đã xoá (1) ─────────────────────────│  recently deleted, 30 days
│                                   ┌──┐ │
│                                   │ +│ │  56pt FAB
│                                   └──┘ │
└────────────────────────────────────────┘
```

A word is never hidden because it is incomplete. It sits in a named section with a dot and a
one-line reason. **Nothing she types is ever thrown away.**

### 13.2 Add a word — one question per screen, autosaved every step

Forward-only with a persistent back chevron. **A draft is written after every screen**,
including before the word is valid, because she will be interrupted by a 4-year-old and losing
her work once ends her willingness to maintain the list — and the app dies with it.

```
 1. PICTURE            2. THE WORD          3. TILES (shown, not asked)
 ┌──────────────┐      ┌──────────────┐     ┌──────────────────────┐
 │  Ảnh của từ  │      │  Viết từ     │     │ ┌───┐ ┌────┐ ┌─────┐ │
 │              │      │              │     │ │ m │ │ eo │ │huyền│ │  real game tiles,
 │ ┌──────────┐ │      │ ┌──────────┐ │     │ └───┘ └────┘ └─────┘ │  with their bars
 │ │  Chụp    │ │      │ │  mèo     │ │     │                      │
 │ └──────────┘ │      │ └──────────┘ │     │        mèo      ✓    │
 │ ┌──────────┐ │      │              │     │                      │
 │ │  Chọn    │ │      │ bàn phím     │     │ ┌──────────────────┐ │
 │ └──────────┘ │      │ tiếng Việt   │     │ │      Tiếp        │ │
 │              │      │ của điện     │     │ └──────────────────┘ │
 │ + thêm ảnh   │      │ thoại        │     └──────────────────────┘
 └──────────────┘      └──────────────┘
   picture FIRST -- it is the step she has an opinion about, the most motivating,
   and the one she is standing in front of.  "+ thêm ảnh" adds more; each extra
   photograph is one more thing he sees on a re-discovery (gameplay.md 5.6).

 4. SOUND                              5. PREVIEW -- now shows DISCOVERY
 ┌────────────────────────────┐        ┌──────────────────────────┐
 │  Giọng nói                 │        │  the REAL board: the real │
 │                            │        │  table, her word live in  │
 │      ┌──────────┐          │        │  it, the announcement,    │
 │      │    ●     │          │        │  and her picture arriving │
 │      └──────────┘          │        │  AT THE END, not before.  │
 │   giữ để ghi âm (3 giây)   │        │                          │
 │                            │        │ ┌──────────┐ ┌─────────┐ │
 │   ▁▃▅▇▅▃▁▁▃▅▃▁             │        │ │ Đúng rồi │ │  Sửa    │ │
 │   ▶ nghe lại   ↺ ghi lại   │        │ └──────────┘ └─────────┘ │
 │                            │        └──────────────────────────┘
 │   ○ dùng giọng có sẵn      │  only offered if a shipped clip exists for
 └────────────────────────────┘  this exact word.  RECORDING IS PRE-SELECTED.
```

96 pt record button, hold to record, hard cap 3 s, waveform while recording, instant playback,
re-record unlimited. Her voice is the best audio this app can have.

**The preview is where she learns the most important thing about this app without being told
it: her photograph is not a clue, it is the prize.** She will otherwise choose photographs as
if they were hints. One screen, no explanation, and she sees it.

### 13.3 When the word does not decompose — the most important editor screen

It **never says "invalid"**, it never blocks the save, and it always offers the fix.

```
 TWO SYLLABLES                          UNKNOWN RIME
 ┌──────────────────────────┐           ┌──────────────────────────┐
 │  máy bay có hai tiếng.   │           │  Tôi biết `ch`.          │
 │  Trò chơi ghép một tiếng │           │  Chưa biết vần `uông`.   │
 │  mỗi lần.                │           │                          │
 │                          │           │  ┌───┐  ch  +  [uông]    │
 │  ┌────────┐ ┌─────────┐  │  one tap  │  └───┘                   │
 │  │  máy   │ │   bay   │  │  each     │  ┌────────────────────┐  │
 │  └────────┘ └─────────┘  │           │  │  Thêm vần `uông`   │  │
 │                          │           │  └────────────────────┘  │
 │  hoặc lưu kèm ảnh + tiếng│           │  hoặc lưu kèm ảnh+tiếng  │
 └──────────────────────────┘           └──────────────────────────┘

 ADD A RIME  (literacy-vi.md 5.4: composition happens ONCE, in front of a human)
 ┌──────────────────────────────────────────┐
 │  vần `uông` — sáu thanh                  │  the app generates all six,
 │  ┌──────┐┌──────┐┌──────┐                │  greys the illegal ones
 │  │ uông ││ uồng ││ uống │                │  (5.2's checked-syllable rule),
 │  └──────┘└──────┘└──────┘                │  and lets her TAP ANY ONE to
 │  ┌──────┐┌──────┐┌──────┐                │  correct its spelling.
 │  │ uổng ││ uỗng ││ uộng │                │
 │  └──────┘└──────┘└──────┘                │  Never composed at runtime.
 │  chạm để sửa                             │
 └──────────────────────────────────────────┘
```

**Nothing recognised at all?** She still saves: picture + sound, flagged, filed under *Chưa chơi
được*. The editor never blocks a save.

#### 13.3a Revision 5 — two new things she can hit, and neither of them says "invalid"

**1. A word longer than six letters.** `STRIP_CELLS = 6` is the measured ceiling (§4.2), so
`nghiêng` (n-g-h-i-ê-n-g) cannot be shown on the smallest supported phone at a legible size.
This is a **save-time** message, not a typing-time one, and it is phrased as a fact about the
screen rather than a fault of hers:

```
 TOO LONG FOR THE BOARD
 ┌────────────────────────────────────────┐
 │  `nghiêng` có 7 chữ cái.               │   7 letters.  The board holds 6.
 │  Bảng chữ chứa được 6.                 │
 │                                        │   The word is SAVED, with its
 │  ┌──────┬──────┬──────┬──────┬──────┬──┤   picture and her recording, and
 │  │  n   │  g   │  h   │  i   │  ê   │n▒│   filed under `Chưa chơi được`.
 │  └──────┴──────┴──────┴──────┴──────┴──┤   Nothing is lost and nothing is
 │         the strip, drawn to scale      │   blocked -- §13.4's rule.
 │                                        │
 │  ┌──────────────────┐ ┌──────────────┐ │
 │  │  Lưu để sau      │ │  Sửa từ      │ │
 │  └──────────────────┘ └──────────────┘ │
 └────────────────────────────────────────┘
```

**Drawing the strip to scale with the seventh letter falling off the end is the whole
explanation**, and it needs no number and no vocabulary. The content-engineer's validator
enforces the cap; the editor shows it.

**2. The letter decomposition is now hers to confirm, once.** `literacy-vi.md` §0.15 adds a
derived `letters` array and `onsetLetterCount` to each syllable, **written by the editor and
never composed at runtime**. She does not type them. The editor derives them from the
`(onset, rime, tone)` she has already confirmed, and shows them as the strip she has just seen:

```
 ┌────────────────────────────────────────┐
 │  `chó`  =  ch  +  o  +  sắc            │   what she already confirmed
 │                                        │
 │  Bé sẽ bấm:                            │   "he will tap:"
 │  ┌──────┬──────┬──────┬──────┐         │
 │  │  c   │  h   │  o   │  ´   │         │   FOUR taps
 │  └━━━━━━━━━━━━━┻┅┅┅┅┅┅┴┅┅┅┅┅┅┘         │   with the same span bars the
 │                                        │   board will draw
 │            ┌──────────┐                │
 │            │   Xong   │                │
 │            └──────────┘                │
 └────────────────────────────────────────┘
```

One screen, one confirm, no new vocabulary, and it is the **same picture the child will see** —
which is the only way a non-technical adult can check a decomposition she did not author. It
appears **only** when the decomposition is not one letter per unit, i.e. when a digraph or `gi`
/ `qu` is involved; `bò` skips it entirely.

### 13.4 Edit, delete, recover

- **Edit**: tap a row → the same five steps as tabs, any one editable, same autosave.
- **Delete**: swipe a row, or a Delete at the foot of the edit screen. Confirmation shows **the
  word and its picture** ("Xoá `mèo`?"), then a **6-second Undo** toast.
- **Recently deleted** holds it for **30 days**, restorable in one tap.
- **Nothing to remember after three months**: every screen states its purpose in one sentence at
  the top; every step is one question with a picture of the answer; completeness is a dot, never
  a checklist she has to recall.

### 13.5 "This letter is not on the board yet" — and revision 3 makes it load-bearing

A word can be linguistically perfect and still unreachable, because its character is not in
the pack's `inventoryOrder` at all. **Revision 4 returned this to a true edge case** (U27), and
**revision 5 makes it rarer still**: the Vietnamese board is the whole 29-letter alphabet and
the English board is the whole 26-letter alphabet, so there is no Vietnamese letter and no
English letter she can type that is off the board. The screen now fires only for a character
outside both alphabets — a Latin letter Vietnamese does not use (`f j w z`), or a digit, or
punctuation.

**That is a real simplification and it is worth taking.** `Đưa chữ lên bảng` now means
*extend the alphabet*, which is a decision a parent should make deliberately and rarely, rather
than *make room on this phone*, which was a chore the device imposed on her.

```
 ┌────────────────────────────────────────┐
 │  `xoài` dùng chữ `x`.                  │  one sentence, no jargon
 │  Chữ `x` chưa có trên bảng của máy này.│  "...not on THIS DEVICE's board"
 │                                        │
 │        ┌────┐                          │  the tile, drawn exactly as it
 │        ╎ x  ╎   <- lying flat          │  would look on the board, flat
 │        └━━━━┘                          │
 │                                        │
 │  ┌──────────────────────────────────┐  │  one tap MOVES `x` onto the board
 │  │   Đưa `x` lên bảng               │  │  by promoting it within
 │  └──────────────────────────────────┘  │  inventoryOrder -- see below
 │                                        │
 │  Máy này có 20 ô: 7 âm đầu, 7 vần,     │  the real numbers, for the device
 │  6 thanh. Máy tính bảng có đủ 67 ô.    │  she is holding -- and the fact
 └────────────────────────────────────────┘  that a tablet has room for all
```

**Revision 4 simplifies this screen back down.** The device-specific text below is no longer
needed — every device holds every character — so the screen says one thing: this character is
not in the alphabet the pack knows, here is what it would look like, shall I add it. **The
swap flow and the "this device has N cells" line are deleted**, because there is no longer a
board that can be full.

**What survives from revision 2 and 3:**

1. **It never says "invalid" and never blocks the save** (K6, unchanged).
2. **It draws the character as a flat tile**, exactly as it would look on the board, so she
   sees the thing she is adding.
3. **One tap appends it to its run in `inventoryOrder`** — appending is correct again, because
   there is no on-board prefix to get inside of. The word becomes playable everywhere, on
   every device, immediately.
4. **It may change where later characters sit.** Appending to the *end* of a run does not move
   anything already in that run, which is why append is the right operation: her edit cannot
   disturb a slot the child has already learned. (Adding to the middle would, which is why the
   editor never offers it.)

**Nothing she has typed is ever lost to a layout constraint** — and revision 4 removes the
layout constraint that could lose it.

### 13.6 New in revision 2: record the cheer

```
 ┌────────────────────────────────────────┐
 │  Tiếng reo mừng                        │
 │                                        │
 │  Khi bé ghép được một từ, bé sẽ nghe   │  "When he makes a word, he hears
 │  tiếng nhạc — và giọng của mẹ, nếu     │   the music — and your voice, if
 │  mẹ muốn.                              │   you want."
 │                                        │
 │      ┌──────────┐                      │
 │      │    ●     │   giữ để ghi (2 giây)│  96pt, same control as §13.2 step 4
 │      └──────────┘                      │
 │   ▶ nghe thử    ↺ ghi lại    ✕ bỏ      │  preview plays the MOTIF + her voice
 │                                        │  together, which is what he will hear
 └────────────────────────────────────────┘
```

Offered once — after she saves her first word — and thereafter only from *Voice & pace*. Never
required, removable in one tap, and the app is complete without it.

### 13.7 What the UI needs from the pack

Requirements, not a format — the content-engineer owns the storage. **E2 and E12–E14 are new or
changed in revision 2.**

| # | The UI needs |
|---|---|
| E1 | per word: display spelling; decomposition as **renderable tiles** with a role per tile; `enabled` + `disabledReason`; `draft`; `source`. `meetings` is app state, not pack data. **`stage` is no longer read by the UI** (`gameplay.md` §3.6) — the field may stay in the pack, and nothing renders it |
| E2 | **≥ 1 image. More is better and is now load-bearing twice** — `images[k mod n]` per encounter and the tap-to-advance inside a held reveal (§9.7). **Changed:** revision 1 required ≥2 for the reveal's in-flight photo swap; that swap is gone with the prompt, so one image is now fully correct and loses only variety. Either a **square-normalised source** (the pipeline's 512 × 512 centre crop) **or** a **focal point (x, y)**, so a `cover` crop into a full-screen frame never cuts the subject |
| E3 | per word: a whole-word clip; optionally a sentence clip; optionally a toneless-blend clip (Vietnamese chant step 3) |
| E4 | per tile: a `long` and a `short` clip **slot in both languages**, even where they are identical today |
| E5 | per tile: an **editable audio label string** (`literacy-vi.md` §5.3 — `ngang` vs `không dấu`) |
| E6 | a **rime inventory the editor can append to**, each rime carrying its six toned forms with `null` for the illegal ones |
| E7 | a **draft** record that can hold an invalid word |
| E8 | **atomic writes** that survive the app being killed mid-save |
| E9 | a **validator that returns a reason, not a boolean** — and the reasons must be renderable to a non-technical adult |
| E10 | an **attribution list** derivable from the pack, for the About screen |
| E11 | **no field on a word entry may reference the other language's pack.** The leak defence |
| **E12** | **Revision 4 restores this to its revision-2 meaning, with paging.** A stable, editable order per run (Vietnamese: onsets, rimes, tones; English: letters, digraphs). **Every character in it is on the board**, on a page and in a slot that are pure functions of the run lengths and the device (`gameplay.md` §0B.1). It must survive edits, be reorderable, and be the thing §13.5 **appends to** — appending to the end of a run moves nothing already in it. **Nothing else may determine which character sits on which page in which cell** — not the word list, not the session, not a random source. *(Revision 3 made this a priority order because the board was truncated; it is not truncated any more.)* |
| **E13** | **NEW — a derived, cacheable prefix tree** over the eligible words: the live set for a prefix, and "is this prefix a word", both in O(1) at tap time to hold the 60 ms budget. The UI does not care how it is stored; it cares that it is **rebuilt atomically when she saves a word**, so a word she just added is discoverable without an app restart |
| **E14** | **NEW — one optional `cheer` clip per pack** (§13.6): ≤ 2 s, her recording, removable, and **not** per word |
| **E15** | **NEW in revision 3 — every tile needs a `short` clip that is a sound, not an utterance of one.** ≤ **700 ms** of audio, ≤ 40 ms leading silence, ≤ 120 ms tail. Shipped today: **2016–2784 ms** for English (§11.0). The UI cannot fix this; the cut rule on a 2.2 s clip is what the owner heard. A validator gate on clip duration is the content-engineer's to design |
| **E16** | **The English inventory must be the alphabet**: all 26 letters, `a`–`z`, in order. **Revision 5 deletes `inventoryOrder.digraph`** (`literacy-en.md` §0.10) — the ten digraph *clips* are kept and re-keyed as re-voicing audio. `en-seed` omits `q`. **Revision 4 settles the general rule in §8.1:** every character in `inventoryOrder` is drawn, always, whether or not any word uses it; one with none is permanently flat and still speaks. **The validator must not flag a zero-word character as an error** — `ngh` has been that way since revision 1 |
| **E22** | **NEW in revision 5 — one glyph-casing field per pack**: `en-seed` **upper**, `vi-seed` **lower** (§8.2). Read once at pack load, applied at one place in the glyph component, **never as a `toUpperCase()` in a component**. It reaches the tile, strip, rail and reveal glyph and **nothing else** — not the stored data, not the audio, not `inventoryOrder`'s sort, not any parent surface. An absent or unrecognised value falls back to **lowercase** silently. Changing it must be **one field in `pack.json`**, no code |
| **E18** | **NEW in revision 5 — `inventoryOrder` becomes `{ letter: […], tone: […] }`.** Vietnamese: 29 letters in the owner's alphabet order, then 6 tones in `ngang huyền sắc hỏi ngã nặng` (`literacy-vi.md` §0.13 — the shipped order is frequency and is wrong). English: 26 letters, one run. `.onset`, `.rime` and `.digraph` leave `inventoryOrder`; the onset and rime vocabularies **stay in `pack.tiles`**, because they are the model and the editor's vocabulary, and they should be ordered properly there too — his mother reads them |
| **E19** | **NEW in revision 5 — a derived `letters` array and `onsetLetterCount` per syllable**, written by the editor, **never composed at runtime**. The engine walks `letters`; it reads the parse from the stored `(onset, rime, tone)`. §13.3a is the one screen where she confirms it |
| **E20** | **NEW in revision 5 — `letters.length ≤ 6`.** The word strip holds six cells on the smallest supported phone (§4.2, F17); seven drops the glyph to 31 pt against a 34 pt floor. The validator enforces it at save time and §13.3a draws it |
| **E21** | **NEW in revision 5 — tile audio is keyed by unit-STATE, not by tile.** Vietnamese needs 28 onset states + 43 rime states + 6 tones = 77 clips, **9 of them new** (`literacy-vi.md` §0.12); English needs none added and none retired, with the ten digraph clips re-keyed (`literacy-en.md` §0.9). Every rime-prefix clip needs a **human listening check** before it ships, because several are not real Vietnamese syllables read level. **Nobody on this team can hear** (`CLAUDE.md`) |
| **E23** | **NEW in revision 6 — one clip per pack carrying the LANGUAGE'S OWN NAME**, spoken in that language: `Tiếng Việt` in `vi-seed`, `English` in `en-seed`. It plays on the chooser when its panel is tapped (**A2**), and it is now **the only thing that tells a non-reading child which language he is choosing** (§9.4a, §9.6). Neither clip exists today. It is **speech**, so `content-pipeline.md`'s rule applies in full: **the owner must hear both before they ship** — nobody on this team can hear (`CLAUDE.md`). Same budget shape as a word clip; it is not a tile clip and no tile ever plays it. Absent → the panel expands silently and the chooser still works, which is the documented degradation, not a crash |
| **E17** | **NEW in revision 3 — the Vietnamese rime entry's `toned` map is now read for *illegal* tones too.** All six tone cells are always drawn; a rime's illegal tones are rendered flat, showing the marked form the orthography would produce, and falling back to the bare mark where the map holds `null` (§7.2) |

---

## 14. Screen inventory

| # | Screen | Audience | Text? | Reached from |
|---|---|---|---|---|
| S1 | Language chooser (+ theme buttons) | **the child**, and the parent | yes — **the one screen with both languages**, but nothing on it must be read: each panel **speaks its own name** (A2, E23) | **the language control on the board, revision 6** (§9.4a) — one tap, no gate; first launch; and parent menu → *Language*. One screen, one code path, and **the two-touch commit is back on all three routes**, because the first touch is the preview |
| S2 | **Board — Ghép Chữ** (strip + character table) | child | the letters only | launch, after a reveal |
| S3 | **Board — Word Blocks** | child | the letters only, **uppercase** (§8.2) | launch, after a reveal |
| S4 | **Announcement + reveal** (a full-screen overlay on S2/S3) | child | the word, large; the sentence if `Show the word` is on | a word forms |
| S5 | Album — the collection | child | none | the shelf fills; or the album card |
| S6 | End screen | both | none | parent menu → Finish session |
| S7 | Parental gate | parent | yes | **1.2 s hold on the parent door** (§9.4b) — the lock is revision 5's, unchanged; only the door is legible |
| S8 | Parent menu | parent | yes | through S7 |
| S9 | Word list | parent | yes | S8 → **`Words`, row 1** — the editor's one door, named for add, edit and delete (revision 6) |
| S10 | Add/edit word, steps 1–5 | parent | yes | S9 → `+`. *(Revision 6 removes the parent menu's *Add a word* shortcut: it is S8 → `Words` → `+`, one tap further and in the place she looks.)* |
| S11 | Decomposition help | parent | yes | S10 step 3, on failure |
| S12 | Add-a-rime | parent | yes | S11 |
| S13 | **Not on the board yet** (revision 5: only for a character outside the alphabet) | parent | yes | S9, S10 step 3 |
| S19 | **Confirm the taps** (§13.3a) — the strip drawn as the child will see it | parent | yes | S10, only when a digraph, `gi` or `qu` is involved |
| S20 | **Too long for the board** (§13.3a) — six letters is the ceiling | parent | yes | S10, on save |
| S14 | **Record the cheer** | parent | yes | after her first save; S8 → Voice & pace |
| S15 | Recently deleted | parent | yes | S9 |
| S16 | Voice & pace / Motion & sound | parent | yes | S8. **Language is no longer a screen of its own** — row 2 opens S1 |
| S17 | About & attributions | parent | yes | S8 |
| S18 | Screen-too-small card | parent | yes | viewport < 360 × 600, no page plan (F7), or no six-cell strip (F15/F16) |

**Twenty screens. Four of them are the child's now** — S2, S3, S5 and, new in revision 6,
**S1**, which he reaches himself from the board and which must therefore work with nothing
read. S4 is an overlay on his board rather than a screen he goes to, and he still never
navigates between S2, S3 and S5.

**Revision 3 removed none and added none. Revision 5 adds two, both his mother's**, both
one-screen, both drawn as the strip the child will see rather than described in words. It also
makes S13 **rarer** than revision 4 did: with the whole alphabet on the board, a character she
can type is almost never missing from it.
