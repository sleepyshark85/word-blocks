# UI — screens, layout, visual system, motion, accessibility, the editor

**Ghép Chữ** (Vietnamese mode) · **Word Blocks** (English mode).

Owner: game-designer. Read `gameplay.md` first — it defines the loop this document dresses,
and its **§0 records the mechanic correction** that produced revision 2 of both documents.
`acceptance-criteria.md` numbers everything here as testable behaviour.

**Revision 4, 2026-09-23 — read §0B first, then §0A.** The owner named his device (an
**iPhone 17 Plus**) and proposed **paging the table**, which removes revision 3's one real
cost. §0A records the four findings he reported from playing the built app; one of them (the
constant character table) rewrote §4, §5.8, §7, §8 and §9, and §0B pages it.

Two tools verify the claims in this document and **both exit 0** (re-run 2026-09-23 against
revision 3):

| Tool | Verifies | Result |
|---|---|---|
| `tools/theme-contrast.mjs` | every (theme × surface × foreground) pair that can co-occur, in all three themes, plus role-hue separation | **PASS**, 0 failing pairs, **36 pairs × 3 themes — 34 gated, 2 logged** |
| `tools/layout-sweep.mjs` | the **paged constant character-table** law over viewports 360–1400 × 600–1440 pt in steps of 4, × **9** safe-area shapes, × table sizes 1–budget, **plus a page plan for both packs at every served viewport** | **PASS**, **34,445,462 layouts + 979,350 page plans**, 0 failures |

Nothing in §4 or §5 is asserted. Every number came out of one of those two programs, or —
in §6 — out of a render of the font that actually ships, or — in §11 — out of the MP3 frame
headers of the clips in `packs/en-seed`.

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

**"Add a word" is the first row of the parent menu**, reachable from anywhere via the gate dot.
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

1. **The mode title is on every screen.** Top-left of the top bar, 13 pt `inkSoft`: `Ghép Chữ`
   or `Word Blocks`. Every screenshot the tester takes carries its own label.
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
5. **One documented exception:** the first-launch chooser shows both titles, because it must.

---

## 4. Layout

### 4.1 Device range

Designed across a **continuous range**, not a device list:

| | |
|---|---|
| Supported viewport width | **360 – 1400 pt/dp** |
| Supported viewport height | **600 – 1440 pt/dp** |
| Below 360 wide or 600 tall | a parent-facing "this screen is too small" card. No game. |
| Orientation | whichever serves at least the **20-cell table** (§4.3, F7) |

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
        runs             the pack's inventory as run lengths
                           VI [26 onsets, 35 rimes, 6 tones]   EN [26 letters, 10 digraphs]
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

TOP_BAR  = 56        GAP_STRIP = 12        PAD_BOTTOM = 12
CHROME   = TOP_BAR + GAP_STRIP + PAD_BOTTOM                      = 80

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

stripFont = floor((stripH - 16) / 1.55)
tileFont  = floor(min(tile * 0.52, (tile - 16) / 1.55))
shelf     = clamp(floor((CW - 96 - 32 - 24) / 5.4), 0, 44)
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
  reaching all 67 characters instead of 32.
- **The fixpoint is monotone and therefore terminates**: adding a rail row only lowers
  capacity, and lowering capacity only raises the page count. Measured across the whole sweep,
  it converges in **1 step, worst case** — the wrap is decided on the first pass everywhere
  except the smallest phones, which settle on the second.
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
| **F4** | `stripFont ≥ 34` | the word he is building reads across a room |
| **F5** | `tileFont ≥ 24` | `ngh`, `ăng`, `uống` still legible on a tile |
| **F6** | `gap ≥ 10` | hit rects can never overlap (§4.5) |
| **F7** | `planFor(v, runs) ≠ null` for **both** packs | **restated in revision 4 (U24).** A served viewport is one that can be *played*, which is a page plan, not a cell count |
| **F8** | `shelf ≥ 22` | five shelf slots fit the top bar |
| **F9** | `railCols ≥ 1` | at least one page button fits a rail row |

Five more rules are about the **page plan** rather than about one layout — the thing revision
4 adds, and therefore the thing most likely to be wrong:

| | Rule | Why |
|---|---|---|
| **F9p** | `pages ≤ railRows × railCols` | every page has a button, and the rail fits |
| **F10** | the fixpoint converged in ≤ `RAIL_MAX_ROWS + 1` steps | it is monotone, so this should be provable; the sweep proves it instead. **Measured: 1 step, worst case, over 979,350 plans** |
| **F11** | `max(pages) ≤ cells ≤ cap` | the one grid really does hold the largest page |
| **F12** | `sum(pages) = sum(runs)` | **every character is on exactly one page** — nothing dropped, nothing duplicated |
| **F13** | every page is non-empty | no blank page in the rail |

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

**F0, and why it had to be added.** F1–F8 are used twice: to compute the budget and to check
each table size. That makes the per-size check circular — a size that fails a rule is simply
not in the budget. I found this by injecting a fault (raising F4's floor from 34 to 45) and
watching the sweep print **PASS** anyway. F0 is the claim that survives the circularity.
Injecting a budget overclaim (`cells <= budget + 1`) now makes it exit 1 naming F0 on
`360×608 cells=21`. A green check nobody has seen fail is not a check, and this one had been
green for two revisions.

### 4.4 Verified output, representative devices

From `node tools/layout-sweep.mjs --devices` and `--pages`, 2026-09-23, both exit 0.
`¦` marks a run boundary. **Both candidate sizes for the iPhone 17 Plus are named rows in the
tool** so the device is never guessed again.

```
device                          per page  VI pages                       EN pages      grid  tile  rail
Android compact 360x640 (floor)  12       7  9/9/8 ¦ 12/12/11 ¦ 6        3  13/13 ¦ 10  4x3   73    2 rows
iPhone SE 3     375x667          16       6  13/13 ¦ 12/12/11 ¦ 6        3  13/13 ¦ 10  4x4   72    2 rows
Android tall    360x800          20       5  13/13 ¦ 18/17 ¦ 6           3  13/13 ¦ 10  4x5   72    2 rows
iPhone 15/16    393x852          20       5  13/13 ¦ 18/17 ¦ 6           3  13/13 ¦ 10  4x5   76    2 rows
Android large   412x915          28       4  26 ¦ 18/17 ¦ 6              2  26 ¦ 10     4x7   74    1 row
iPhone 15 Pro Max 430x932        28       4  26 ¦ 18/17 ¦ 6              2  26 ¦ 10     4x7   75    1 row
** iPhone 17 Plus (A) 430x932    28       4  26 ¦ 18/17 ¦ 6              2  26 ¦ 10     4x7   75    1 row
** iPhone 17 Plus (B) 440x956    28       4  26 ¦ 18/17 ¦ 6              2  26 ¦ 10     4x7   77    1 row
iPad 11" portrait  834x1194      67       -  ONE PAGE, NO RAIL, all 67   -  all 36      7x10  86    none
iPad 11" landscape 1194x834      67       -  ONE PAGE, NO RAIL, all 67   -  all 36     12x6   81    none
iPad 13" landscape 1366x1024     67       -  ONE PAGE, NO RAIL, all 67   -  all 36     10x7  100    none
Android tablet 800x1280 port.    67       -  ONE PAGE, NO RAIL, all 67   -  all 36      7x10  92    none
iPhone 15 LANDSCAPE 852x393      LOCKED (fails F7)
```

**The two candidate sizes give the same design.** (B) is 440 dp wide and misses a fifth column
by **4 pt**: five 72 pt tiles need 400 and the content width is exactly 400, but `gap(72)`
rounds to 11, not 10. Recorded because it is precisely the kind of near-miss somebody later
"fixes" by shaving the gap — and F6's gap is what stops hit rects overlapping, so it is not
for shaving.

Sweep verdict:

```
swept viewports 360..1400 x 600..1440 step 4, x 9 safe-area shapes
  489675 viewport/inset combinations served
  979350 page plans built (both packs per viewport), 740899 of them needing NO rail
  paging fixpoint: converged every time, worst case 1 step(s) (F10 allows 3)
    vi-seed page-count distribution:
       1 page(s)  291327
       3 page(s)  142348
       4 page(s)  27984
       5 page(s)  20070
       6 page(s)  4317
       7 page(s)  3629
  5964 rejected (F7: no page plan for both packs, or landscape phone)
  34445462 layouts checked against 8 rules, plus 5 plan rules
tightest served layout: 360x600 insets {"insetT":0,"insetB":0} cells=13
  tile 78  grid 3x5  row 258/328  strip 82  table 438  slack 0  shelf 32  margin 0
PASS - 0 failing layout(s).
```

Read that distribution as the shape of the product: **291,327 of 489,675 served combinations
(60%) need no pages at all** — every tablet, which shows all 67 characters at once and never
mentions a page. Vietnamese is never 2 pages, because runs never share one; it is 1, or 3 and
up. His iPhone is in the 27,984-strong 4-page band.

**The limitation revision 3 had is gone.** Revision 3's §4.4 had to record that a phone
reached 13–21 of 47 words. **Every served device now reaches all 47.** What a bigger screen
buys is comfort — no rail, no pages, 86–100 pt tiles — not content.

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

1. **The live set would go off-screen.** The characters that can be pressed are 1–6 of 67 and
   they are scattered across three runs. A child who cannot see a standing tile has a board
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
character table with a cap on it is not one. The table is now `min(pack inventory, device
budget)`: 36 for English, 67 for Vietnamese, 20–90 by device.

**This retires the reconcile item rather than resolving it, and that should be said plainly.**
Those caps were written for a mechanic in which the palette was a *search* — one tile was
right and the rest were distractors, so the cost of width scaled with width. Two mechanics
later, every standing tile is a correct move and the set he must discriminate is the **live**
set, which is 1–6 symbols. The rest of the board is flat, recessive by construction (§5.8),
and — this is the part the caps cannot speak to — **it is what he asked to see.** The number
that governs whether 67 cells is too many is not a palette cap from a different mechanic; it
is `acceptance-criteria.md` **U7a**, and only the child can answer it.

**What a tablet buys, now that the ceiling is gone:** the *whole game*. It is not a nicer
version of the phone board — the phone board is a different, smaller game (`gameplay.md`
§3.5). That is the sharpest consequence of revision 3 and it is in `open-questions-ui.md` as
the one thing I would most like the owner to confirm: **which device does he actually play on.**

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
| `neutralFace` | `#888F9E` | `#9A8E80` | `#818C97` | gate dot, the strip's dashed next-cell, the disabled tile's dashed outline. ~~the ∅ tile~~ — deleted, U13 |
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
| `component` | 3.0:1 | silhouettes, outlines, chips, the gate dot, shelf slots |
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
| gate dot on the ground | 3.02:1 |
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

### 5.5 Role colour does work — and a second, non-colour channel does it too

| Slot | Means | Bar pattern | Popsicle | Sunshine | Playground |
|---|---|---|---|---|---|
| `role1` | **onset** (âm đầu) / EN **consonant** | `solid` ▓▓▓▓▓▓ | watermelon | sunset | blue |
| `role2` | **rime** (vần) / EN **vowel** | `split` ▓▓ ▓▓ | grape | lagoon | orange |
| `role3` | **tone** (thanh) | `dotted` ▓ ▓ ▓ | green | leaf | teal |

**The bar pattern is the point.** Role is carried by three redundant channels: the pattern,
**the fixed position of each run in the constant table**, and colour. Colour is the redundant
one. That is what lets the sweep gate hard on normal-sighted separation (ΔE00 ≥ 25, lowest
measured 33.0) while treating **CVD separation as a printed diagnostic**:

> **Corrected in revision 3 (U20).** The second channel used to be *"the Vietnamese table
> shows exactly one role at a time"*. That is now false — all three roles are on screen
> together — so the argument had to be re-made rather than inherited, and the same sentence in
> `tools/theme-contrast.mjs` was corrected with it. Fixed position is the stronger channel of
> the two: onsets are always the first run, rimes the middle, tones the last, in cells that
> never move, and unlike the old channel it does not depend on what he has already tapped.

```
Popsicle: onset vs tone under deuteranopia = 1.59
Sunshine: onset vs tone under deuteranopia = 8.58
Sunshine: onset vs tone under protanopia   = 10.26
```

**Playground is red-green safe** (worst case 18.1) and is a one-tap change on the album.

### 5.6 English has two tile types, not one

`literacy-en.md` §3.2 requires vowel tiles to be visually distinct from consonants, so English
uses the same two slots Vietnamese uses for its first two: consonant → `role1`, solid bar;
vowel → `role2`, split bar; `role3` is **never rendered in English mode**. `a` in `cat` wears
the same slot as the rime `eo` in `mèo` — both are the nucleus of the syllable, which is a true
correspondence rather than a coincidence.

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
2. **Weight and roundness.** A tile glyph is one large lowercase letter on a white face; weight
   is what makes it read as a **block letter** rather than a thin line, and it is what makes
   "bright and fun" work at 36 pt. Be Vietnam Pro is a text face and looks like one on a toy
   block. This is now the *first* reason rather than the third.
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

### 6.2 The `a`/`g` letterform check is a human check, pinned by a hash (correction U9)

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

**Two boards, one design.** A tablet shows the whole 67-cell table at once, with no rail and
no pages. A phone shows it in four windows. The characters, their order and their slots are
identical; only how much is visible at a time differs.

**The owner's iPhone 17 Plus** (430 × 932 or 440 × 956 — same plan, `ui.md` §4.4): page 1 of
4, 4 × 7 at 75 pt, strip 79, rail 1 row of 4 buttons.

```
┌──────────────────────────────────────────────┐
│▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔│ 4pt role1 rule
│ Ghép Chữ      [img][ ][ ][ ][ ]         ◔    │ 56pt top bar
├──────────────────────────────────────────────┤
│   ┌───────┬╌╌╌╌╌╌╌┐                          │ word strip, 79 tall
│   │   b   ┊   ·   ╎                          │ the word SO FAR
│   └━━━━━━━┴╌╌╌╌╌╌╌┘                          │
│                                              │
│  ┌────┐┌────┐┌────┐┌────┐                    │ ── PAGE 1: THE ONSET RUN
│  │ m  ││ b  ││ c  │╎ ch ╎                    │    26 characters, 4x7
│  └────┘└────┘└────┘└ ── ┘                    │    role1, SOLID bars
│  ╎ s  ╎│ d  │╎ g  ╎╎ h  ╎                    │
│  ╎ t  ╎╎ tr ╎╎ v  ╎╎ gh ╎                    │    SOLID box = live
│  ╎ gi ╎╎ k  ╎╎ kh ╎╎ l  ╎                    │    DASHED box = flat
│  ╎ ng ╎╎ nh ╎╎ qu ╎╎ r  ╎                    │
│  ╎ th ╎╎ x  ╎╎ đ  ╎╎ n  ╎                    │
│  ╎ngh ╎╎ ph ╎                                │    26 of 28 slots used;
│                                              │    the last row is short
├──────────────────────────────────────────────┤
│  ┏━━━━┓┌────┐┌ ── ┐┌ ── ┐                    │ ── THE PAGE RAIL
│  ┃ m  ┃│ ưa ││ i  │╎ ◌̀ ╎                    │    one 72pt button per page
│  ┗━━━━┛└────┘└ ── ┘└ ── ┘                    │    §7.1b
│   HERE   live   live   flat                  │
└──────────────────────────────────────────────┘
```

At this moment — empty strip — page 1 stands (onsets begin words) and **page 2 also stands**,
because `ao` and `ong` begin the zero-onset words `áo` and `ong`. Page 4's button is flat: no
tone can be placed yet. **That rail is the only way he could ever discover `áo`**, and it is
doing it with no text and no number.

The tablet board is the same figure with the rail deleted and all 67 characters in a 7 × 10
grid at 86 pt (revision 3's §7 wireframe, unchanged).

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
  ┏━━━━┓   ┌────┐   ┌ ── ┐         one button per page, 72pt, RAIL_GAP 12,
  ┃ m  ┃   │ ưa │   ╎ ◌̀ ╎         wrapping to at most 2 rows (F9p)
  ┗━━━━┛   └────┘   └ ── ┘
  CURRENT  STANDING   FLAT
  reward   white face ground face   glyph = THE FIRST CHARACTER OF THAT PAGE,
  face,    + role bar + dashed      drawn with that run's bar and role colour --
  ink      + ink      + inkSoft     a sample of what is over there, not a number
  raised                            and not a word
  4pt
```

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

**The layout.** One grid, three contiguous runs in one fixed row-major sequence:
`[onsets][rimes][tones]`. **Revision 4: when the sequence does not fit one screen it is paged
along the run boundaries** (§7.1a–c), so a run boundary is also a page boundary and the board
he sees is always one run at a time — which, pleasingly, is what revision 2's morph was trying
to achieve and got wrong by changing the cells instead of moving the window. A run boundary
inside a page can still fall mid-row and is not marked by a line, a box or a tint — it is marked by the tile's own bar changing from solid to split to dotted (§5.5),
which is the channel that already survives greyscale and CVD. §5.8a records the tint I tried
and why the contrast sweep cut it.

**How many of each, per device — revision 4: all of them.** Revision 3 divided one screen's
budget between the three runs with a fixed 0.48 split (`zonesFor()`), which meant a phone
simply did not have most of the characters. **Paging deletes that problem and the function
with it.** Every run is complete on every served device; what differs is how many pages it
takes:

```
capacity = cells per page (28 on the iPhone 17 Plus)
onsets 26 -> ceil(26/28) = 1 page  [26]
rimes  35 -> ceil(35/28) = 2 pages [18][17]   balanced, not 28/7
tones   6 -> ceil(6/28)  = 1 page  [6]
```

- **Runs never share a page** (`gameplay.md` §3.7). It costs a page and leaves the tone page
  holding 6 characters in a 28-cell grid, and both are worth it: the rule is one sentence a
  child can hold, and one standing tile on an otherwise empty page is the clearest possible
  final step.
- **Balanced, not greedy**, so pages keep the same shape as he moves.
- **Each run is still a prefix-ordered list** (`inventoryOrder`, E12), but the order is no
  longer a *priority* order, because nothing is cut off. It is now purely where things live.

`gameplay.md` §3.5 has the per-device page plans. The words-reachable column is gone from
it, because the answer is now 47 of 47 everywhere.

### 7.2 The word strip, and the six tone carriers

**The strip is the word so far, plus one dashed cell for what is still missing.** Two cells,
not three. Revision 2's third cell named the tone in words — `m ┊ èo ┊ huyền` — which put a
word a pre-literate child cannot read on the child's screen, holding something that is not
part of his word. The owner saw it and said so (U14).

```
  empty        ┌╌╌╌╌╌╌╌╌╌╌╌╌┐                  one dashed cell, 2pt neutralFace,
               ╎     ·      ╎                  one centred dot
               └╌╌╌╌╌╌╌╌╌╌╌╌┘

  onset in     ┌──────┬╌╌╌╌╌╌╌╌╌╌╌╌┐           glyph in ink on surface, 13.4:1
               │  b   ┊     ·      ╎           5pt role1 underline under `b`
               └━━━━━━┴╌╌╌╌╌╌╌╌╌╌╌╌┘

  rime in      ┌──────┬──────┬╌╌╌╌╌╌┐          a tone is still needed, so the
               │  b   ┊  o   ┊  ·   ╎          dashed cell stays
               └━━━━━━┴━━━━━━┴╌╌╌╌╌╌┘          role1 + role2 underlines

  tone in      ┌────────────────────┐          the mark lands ON the rime and the
               │        bò          │          cells merge. No dashed cell: the
               └━━━━━━┴┅┅┅┅┅┅━━━━━━━┘          word is complete. The role3 tone is
                                               a 5pt DOTTED segment under the rime
                                               -- colour, not a word (§5.5)

  zero onset   ┌──────┬╌╌╌╌╌╌┐                 `ao` starts at the LEFT. There is no
               │  ao  ┊  ·   ╎                 empty first cell and nothing to tap
               └━━━━━━┴╌╌╌╌╌╌┘                 to skip the onset (U13)

  announcing   ┌────────────────────┐          see §10.4 -- the chant ACCUMULATES
               │        bò          │          b -> b o -> bo -> bò
               └━━━━━━━━━━━━━━━━━━━━┘
```

**The six tone cells.** They never move and never change role. Their **carrier** changes once
per word, and only ever while they are disabled:

```
  no rime placed (ALWAYS disabled)       rime `eo` placed (live ones stand)
  ┌ ── ┐┌ ── ┐┌ ── ┐┌ ── ┐┌ ── ┐┌ ── ┐   ┌ ── ┐┌────┐┌ ── ┐┌ ── ┐┌ ── ┐┌ ── ┐
  ╎ ◌  ╎╎ ◌̀ ╎╎ ◌́ ╎╎ ◌̉ ╎╎ ◌̃ ╎╎ ◌̣ ╎   ╎ eo ╎│ èo │╎ éo ╎╎ ẻo ╎╎ ẽo ╎╎ ẹo ╎
  └ ── ┘└ ── ┘└ ── ┘└ ── ┘└ ── ┘└ ── ┘   └ ── ┘└────┘└ ── ┘└ ── ┘└ ── ┘└ ── ┘
   ngang huyền sắc  hỏi   ngã  nặng       `literacy-vi.md` §5.4, exactly as written
   bare marks on a dotted circle;          -- he sees the OUTCOME of each choice, at
   ngang is the empty circle               the only moment he is choosing
```

- **The bare mark is drawn in `ink`, not `inkSoft`** — a diacritic is thinner than any letter,
  so it takes the darkest token. Measured 11.96–13.06:1 on the ground, gated as a `glyph` pair
  in `tools/theme-contrast.mjs`.
- **A stop-final rime still produces two live tones**, not two cells: all six cells are always
  there, and `ach` simply leaves `ách` and `ạch` standing with the other four flat. This is a
  change from revision 2, which rendered *only* the legal forms. **Legality and completability
  are now both flatness**, which loses `literacy-vi.md` §5.2's neat "the child never sees an
  option that cannot be right" — he sees it, lying down, which is what the owner asked for
  everywhere else on this board. The cells for illegal tones show the marked form the
  orthography would produce, taken from the rime's `toned` map; where that is `null` the cell
  falls back to the bare mark.
- **Reversal is free.** Tapping the rime in the strip returns it and the tone carriers go back
  to bare marks; tapping the onset returns everything after it (`gameplay.md` §4.4).

---

## 8. Screen: Word Blocks (English)

**iPhone 17 Plus**, the owner's device: 28 cells per page, so English is **2 pages —
`[26 letters] [10 digraphs]`**. Page 1 is the whole alphabet, `a`–`z`, in one 4 × 7 grid at
75–77 pt. That is literally the "regular character table" he asked for, on the device he
plays on, with nothing missing and nothing off-screen.

```
┌──────────────────────────────────────────────┐
│▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔│
│ Word Blocks     [img][ ][ ][ ][ ]       ◔    │  shelf: 5 x 37pt
├──────────────────────────────────────────────┤
│   ┌───────┬───────┬╌╌╌╌╌╌╌┐                  │  strip grows to the RIGHT.
│   │   c   │   a   ┊   ·   ╎                  │  The length is NOT shown --
│   └━━━━━━━┴━━━━━━━┴╌╌╌╌╌╌╌┘                  │  it is part of the discovery
│    solid    split   (next)                   │
│                                              │
│  ┌────┐┌ ── ┐┌ ── ┐┌ ── ┐                    │  THE ALPHABET, a..z, in order,
│  │ a  │╎ b  ╎╎ c  ╎╎ d  ╎                    │  every letter always in its cell
│  └────┘└ ── ┘└ ── ┘└ ── ┘                    │
│  ┌ ── ┐┌ ── ┐┌ ── ┐┌ ── ┐                    │  after `c` `a`, only n, p, t
│  ╎ e  ╎╎ f  ╎╎ g  ╎╎ h  ╎                    │  complete a word -- can, cap,
│  └ ── ┘└ ── ┘└ ── ┘└ ── ┘                    │  cat. Everything else lies flat
│  ┌ ── ┐┌ ── ┐┌ ── ┐┌ ── ┐                    │  and still says its sound.
│  ╎ i  ╎╎ j  ╎╎ k  ╎╎ l  ╎                    │
│  └ ── ┘└ ── ┘└ ── ┘└ ── ┘                    │  `a` stands because it is ALSO
│  ┌ ── ┐┌────┐┌ ── ┐┌ ── ┐                    │  a vowel tile with a SPLIT bar
│  ╎ m  ╎│ n  │╎ o  ╎│ p  │                    │  in role2; consonants carry
│  └ ── ┘└────┘└ ── ┘└────┘                    │  SOLID bars in role1.
│  ┌ ── ┐┌ ── ┐┌ ── ┐┌────┐                    │
│  ╎ q  ╎╎ r  ╎╎ s  ╎│ t  │                    │  `q` is on the board and always
│  └ ── ┘└ ── ┘└ ── ┘└────┘                    │  disabled -- no pack word uses
│  ┌ ── ┐┌ ── ┐┌ ── ┐┌ ── ┐                    │  it. A missing letter would be
│  ╎ u  ╎╎ v  ╎╎ w  ╎╎ x  ╎                    │  exactly the inconsistency the
│  └ ── ┘└ ── ┘└ ── ┘└ ── ┘                    │  owner objected to.
│  ┌ ── ┐┌ ── ┐                                │
│  ╎ y  ╎╎ z  ╎                                │  26 letters, 4x7, page 1 of 2
│  └ ── ┘└ ── ┘                                │
├──────────────────────────────────────────────┤
│  ┏━━━━┓┌ ── ┐                                │  THE PAGE RAIL: 2 buttons
│  ┃ a  ┃╎ ch ╎                                │  page 2 is the 10 digraphs,
│  ┗━━━━┛└ ── ┘                                │  flat here because none of
│   HERE   flat                                │  them can follow `c` `a`
└──────────────────────────────────────────────┘
```

Differences from Vietnamese, all structural:

| | |
|---|---|
| Strip | grows rightwards, **length not shown**. A Vietnamese syllable is always two runs plus a mark and that is worth stating; an English word's length is part of what he is discovering. |
| Table | **one run**: the alphabet in alphabetical order, then digraphs (`ch ck ff gg ll ng sh ss th zz`). The order he will meet in the alphabet song and the one his mother would expect. |
| Pages | **2 on his iPhone** — the alphabet, then the digraphs. 3 on smaller phones (`13/13 ¦ 10`). **1, with no rail, on a tablet.** Every device reaches all 40 words. |
| Ordering | none beyond left-to-right. A tap fills the next empty cell. |
| Role colours | two of three. `role3` never appears. |
| Chant | tile `short` clips left to right, then the whole word. |

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
carry all 26 letters in alphabetical order. **`q` has no word behind it today and that is
fine** — `ngh` is the Vietnamese precedent and it has been fine since revision 1. The validator
must **not** treat a character with zero words as an error; it is a normal, permanent state.

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

### 9.2 Strip cell

```
 empty (the next)   filled              chant-lit            merged
 ┌╌╌╌╌╌╌┐           ┌──────┐            ┌──────┐             (dividers gone,
 ╎  ·   ╎           │  m   │            │██m███│              glyphs slid together
 └╌╌╌╌╌╌┘           └──────┘            └──────┘              into one word)
 2pt dashed         ink on surface      reward FACE,
 neutralFace        13.4:1              ink glyph 6.5:1
 3.25:1             5pt role underline  + lifts 1.12x
 NOT a character:                       (correction U11 —
 it is not in the                        the GLYPH never
 table and cannot                        turns gold)
 be tapped (U13)

 marked (revision 3)     ┌──────┐   the tone does not get a cell. Its mark lands on
                         │  ò   │   the rime, and a 5pt DOTTED role3 segment joins the
                         └┅┅┅┅┅┅┘   role2 underline. Colour records the tone; no word does.
```

### 9.3 The word strip as a whole

```
 empty     → building         → announcing                    → cleared
   ╎·╎        ╎b╎o╎·╎            b  ·  b o  ·  bo  ·  bò         (after the picture
                                 the word ACCUMULATES, one       flies to the shelf)
                                 beat at a time -- §10.4
```

The strip is the same component in both modes. Vietnamese differs only in that its last
symbol is a **mark applied to the rime** rather than a new cell, so a completed Vietnamese
strip has one fewer cell than it had taps.

### 9.4 Top bar (56 pt, on the ground, above the strip)

```
 ┌────────────────────────────────────────────────────────────────┐
 │ Ghép Chữ           [img][img][  ][  ][  ]                  ◔   │
 └────────────────────────────────────────────────────────────────┘
   13pt inkSoft       THE SHELF: 5 slots, 32-44pt square,       gate dot,
   mode title         6pt gap. Filled = the photograph he       32pt,
   (leak detector)    found, 2pt rewardEdge ring (3.08:1).      neutralFace
                      Empty = 1.5pt inkSoft ring at 40%.        @30%, 3.02:1
                      Tapping a filled slot replays that word.
```

The shelf replaces revision 1's five-dot page rail, in the same place, doing the same job. It
is **a shape, not a score**: nothing accumulates across shelves, no number is shown, and it
resets when it tips into the album.

The gate dot is the **only** non-play affordance on the board, the smallest target in the app,
and on a flat tablet the point furthest from a seated child's hands. All three are deliberate.

### 9.5 The reveal — the payoff, full screen

```
 BOARD                        →  REVEAL (full screen, no chrome except the gate dot)
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
 FIRST-LAUNCH CHOOSER  (the one screen showing both languages)
 ┌──────────────────────────────────────┐
 │   ┌──────────────────────────────┐   │  Each panel: that mode's role1 as a
 │   │        Ghép Chữ              │   │  wide band, the title in Baloo 2 32pt.
 │   │   Tiếng Việt                 │   │  Tap -> expands, speaks `mèo`, reveals
 │   └──────────────────────────────┘   │  a confirm button. TWO touches, seconds
 │   ┌──────────────────────────────┐   │  apart, so a toddler cannot commit by
 │   │        Word Blocks           │   │  accident.
 │   │   English                    │   │
 │   └──────────────────────────────┘   │
 │          ◐      ◑      ◒             │  three 56pt theme buttons, unlabelled
 └──────────────────────────────────────┘
```

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
| a strip cell takes the gold | a `reward` View over the white face, **opacity** 0 → 1 |
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
| M10 | **merge — beat 3 of the chant** (dividers dissolve, glyphs slide together) | 240 ms slide, 180 ms fade | `enter` | *these are one word.* In Vietnamese this is the toneless blend and it is a **spoken** beat, not just a visual one (`audio.blend`) |
| M11 | **chant beat** | 320 ms, gold face + 1.0→1.12→1.0 on **everything placed so far**, not on one cell | `calm` | *this much of the word is speaking now.* Revision 2 lit one cell at a time, which showed three parts; lighting the accumulation shows a word being built (U15) |
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

**The Vietnamese chant, beat by beat (U15).** Revision 2 lit three static cells in turn and
showed `b`, `ò`, `huyền`. Revision 3 builds the word. Gaps come from `pack.chant.gapsMs`,
shipped as `{onset:250, rime:250, blend:400, tone:250, word:600}`, so they are hers to tune.

| Beat | Shown in the strip | Spoken | Motion | Gap after |
|---|---|---|---|---|
| 1 | **`b`** | `bờ` (onset name) | M11 on the onset cell | 250 |
| 2 | **`b` `o`** — two cells, both gold | `o` (rime name) | M11 extends to both cells | 250 |
| 3 | **`bo`** — dividers dissolve, glyphs slide into one word | **`audio.blend`** — `bo` | **M10** | 400 |
| 4 | **`bò`** — the mark drops onto the joined word | `huyền` (tone name) | **M12** | 250 |
| 5 | **`bò`** — held, whole, gold | `audio.word` — `bò` | M11 holds | 600 |

- **Beat 3 is a real beat with real audio** that was already in the packs and already being
  played; what revision 2 got wrong was showing three parts while speaking a blend.
- **`ngang` words skip beat 4** (`chant.skipToneStepFor`): `dê` is `dờ` → `d ê` → `dê` → `dê`.
- **Zero-onset words skip beat 1**: `áo` is `ao` → `ao` → `áo` → `áo`.
- **English already accumulated and is unchanged in form**: `short` clips left to right, each
  letter lighting as it speaks and the lit run growing, then merge, then the whole word.
- **Every beat boundary is driven by the clip's completion, not by a timer**, with the gap
  added after it. A 2.2-second clip and a 250 ms gap must not overlap the next beat — which is
  the same defect as §11.0, in the one place where it would corrupt the lesson itself.

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
| M17 shimmer | a single 900 ms α pulse across the live tiles, no sweep |
| M18 breathe | α only, no scale |
| M21 gate ring | a static ring that fills in 4 steps |

**Audio is identical in both modes**, including the motif and the cheer. That is the point: the
audio carries the whole game, so a child who has turned away, or whose parent has reduce-motion
on, loses nothing.

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

Achieved by: **every clip the table can produce is decoded and resident.** The table is
constant, so this is now a one-time cost at pack load rather than a per-tap concern — at most
67 symbols × 2 variants ≈ 134 clips. At the shipped sizes that is ≈ 2.0 MB decoded-on-demand
handles for Vietnamese; if that proves too much on the oldest Android, the eviction rule is
**keep the whole tone run and the current live set resident, evict by least-recently-touched**
— never evict what is standing.

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
| live tile touched | 1 | its `short` clip, at ≤ 60 ms |
| symbol seated | 2 | a 90 ms wooden seat click, at −6 dB, over the clip's tail |
| **flat tile touched** | 2 then 1 | **a 40 ms muted knock at −9 dB at ≤ 60 ms — wood, not drum — and then its own `short` clip in full, starting at +120 ms.** The two do not overlap |
| **undo** | 1 + 2 | that symbol's clip, plus a **descending two-note unclick**, 140 ms |
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
| **No information by colour alone** | Live vs disabled = **ink weight + outline solidity + glyph darkness**, with colour last (§5.8). Role = colour **+ bar pattern + one table at a time**. Nothing anywhere depends on hue. |
| **Greyscale** | S8 is extended in revision 2: live must be separable from disabled with colour removed. The bars do it. |
| **Contrast** | §5.2, gated in CI. The live glyph is 13.4:1 and **the disabled glyph is 5.4–5.9:1** — a disabled letter is still a letter he is learning. |
| **Colour-vision deficiency** | Printed diagnostic, honest about Popsicle's weak pair, with **Playground as the red-green-safe theme** and a one-tap switch on the album. |
| **Dynamic Type** | Parent surfaces scale to 2.0×. **Child surfaces do not** — the tile is a motor constant and the glyph must fill it. Deliberate exception, recorded. |
| **VoiceOver / TalkBack** | The **board exposes one accessibility element** describing the state ("Building a word. b, o placed. One tone can follow, on page 4."). **The page rail is a second element**, describing pages and which hold something live. Individual tiles are `accessibilityElementsHidden`: letting a screen reader speak letter *names* over a game whose entire thesis is letter *sounds* would teach the opposite of the app. **Parent surfaces are fully and conventionally labelled.** |
| **Handedness** | The table is centred, so handedness does not matter. The gate dot is top-right and the editor's `+` bottom-right, both adult targets. No mirror mode in v1. |
| **Screen too small** | Below 360 × 600 pt, or any viewport that cannot build a page plan for the chosen pack (F7), a parent-facing card. No half-broken game. **Revision 4 removes the softer case revision 3 had to add:** there is no longer a served device that plays a *smaller* game — every served device reaches every word. A viewport can serve English and not Vietnamese (the 360 × 640 floor needs 7 Vietnamese pages); the card then names the language, and because language is now switchable (§0A, U17) the other mode is two taps away rather than a reinstall. |

---

## 13. The editor — his mother's product

Reached by: gate dot → 1.2 s hold → gate → parent menu → **Add a word** (row 1) or **Words**.
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
the pack's `inventoryOrder` at all. **Revision 4 returns this to a true edge case** (U27).
Revision 3 made it the normal state of every phone — a 360 × 640 Android held 20 of 67
characters — and paging holds all 67 on every served device, so the *only* remaining cause is
a character the pack does not know about.

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
| **E16** | **The English inventory must be the alphabet**: all 26 letters, `a`–`z`, in order, then digraphs. `en-seed` omits `q`. **Revision 4 settles the general rule in §8.1:** every character in `inventoryOrder` is drawn, always, whether or not any word uses it; one with none is permanently flat and still speaks. **The validator must not flag a zero-word character as an error** — `ngh` has been that way since revision 1 |
| **E17** | **NEW in revision 3 — the Vietnamese rime entry's `toned` map is now read for *illegal* tones too.** All six tone cells are always drawn; a rime's illegal tones are rendered flat, showing the marked form the orthography would produce, and falling back to the bare mark where the map holds `null` (§7.2) |

---

## 14. Screen inventory

| # | Screen | Audience | Text? | Reached from |
|---|---|---|---|---|
| S1 | Language chooser (+ theme buttons) | parent | yes — **the one screen with both languages** | first launch, **and parent menu → Language at any time (revision 3)**. Same screen, same code path; the confirm step is dropped behind the gate |
| S2 | **Board — Ghép Chữ** (strip + character table) | child | the letters only | launch, after a reveal |
| S3 | **Board — Word Blocks** | child | the letters only | launch, after a reveal |
| S4 | **Announcement + reveal** (a full-screen overlay on S2/S3) | child | the word, large; the sentence if `Show the word` is on | a word forms |
| S5 | Album — the collection | child | none | the shelf fills; or the album card |
| S6 | End screen | both | none | parent menu → Finish session |
| S7 | Parental gate | parent | yes | 1.2 s hold on the gate dot, anywhere |
| S8 | Parent menu | parent | yes | through S7 |
| S9 | Word list | parent | yes | S8 → Words |
| S10 | Add/edit word, steps 1–5 | parent | yes | S9 → `+`, or S8 → Add a word |
| S11 | Decomposition help | parent | yes | S10 step 3, on failure |
| S12 | Add-a-rime | parent | yes | S11 |
| S13 | **Not on the board yet / swap a symbol** | parent | yes | S9, S10 step 3 |
| S14 | **Record the cheer** | parent | yes | after her first save; S8 → Voice & pace |
| S15 | Recently deleted | parent | yes | S9 |
| S16 | Voice & pace / Motion & sound | parent | yes | S8. **Language is no longer a screen of its own** — row 2 opens S1 |
| S17 | About & attributions | parent | yes | S8 |
| S18 | Screen-too-small card | parent | yes | viewport < 360 × 600, or fewer than 20 cells |

Eighteen screens. Three of them are the child's, and he never navigates between them.

**Revision 3 removes none and adds none.** It changes what S1 is reachable from, what S2/S3
contain, and it makes S13 a screen a phone-using parent will actually meet.
