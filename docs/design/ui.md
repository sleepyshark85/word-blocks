# UI — screens, layout, visual system, motion, accessibility, the editor

**Ghép Chữ** (Vietnamese mode) · **Word Blocks** (English mode).

Owner: game-designer. Read `gameplay.md` first — it defines the loop this document dresses,
and its **§0 records the mechanic correction** that produced revision 2 of both documents.
`acceptance-criteria.md` numbers everything here as testable behaviour.

Two tools verify the claims in this document and **both exit 0** (re-run 2026-09-23 against
revision 2):

| Tool | Verifies | Result |
|---|---|---|
| `tools/theme-contrast.mjs` | every (theme × surface × foreground) pair that can co-occur, in all three themes, plus role-hue separation | **PASS**, 0 failing pairs, 34 pairs × 3 themes |
| `tools/layout-sweep.mjs` | the **character-table** law over viewports 360–1400 × 600–1440 pt in steps of 4, × 8 safe-area shapes, × table sizes 1–24 | **PASS**, 10,358,248 layouts, 0 failures |

Nothing in §4 or §5 is asserted. Every number came out of one of those two programs, or —
in §6 — out of a render of the font that actually ships.

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
never a suggestion. It is the pedagogically correct hint: say the pieces, let him find the
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
   the prefix tree.
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

```
INPUT   Wv, Hv           viewport, pt (iOS) / dp (Android)
        insetT/B/L/R     safe-area insets
        cells            symbols on the table THIS STAGE shows (1..24)

W        = Wv - insetL - insetR
H        = Hv - insetT - insetB
gutter   = clamp(round(W * 0.045), 14, 44)
CW       = W - 2*gutter                          content width
tableW   = min(CW, 1280)                         ~200 mm two-handed reach cap

cols     = max c in {3,4,5,6} with c*72 + (c-1)*10 <= tableW
rows     = ceil(cells / cols)

TOP_BAR  = 56        GAP_STRIP = 14        PAD_BOTTOM = 16
CHROME   = TOP_BAR + GAP_STRIP + PAD_BOTTOM                      = 86

gap(t)    = clamp(round(t * 0.15), 10, 18)
stripH(t) = clamp(round(t * 1.05), 76, 140)

tile     = the largest t in [116..72] with
             cols*t + (cols-1)*gap(t)                        <= tableW
             stripH(t) + rows*t + (rows-1)*gap(t) + CHROME   <= H
           (if none exists, this viewport does not serve this table size)

gap      = gap(tile)   stripH = stripH(tile)
slack    = H - CHROME - stripH - (rows*tile + (rows-1)*gap)
gapY     = clamp(gap + floor(slack / (rows+1)), gap, round(tile*0.45))
tableH   = rows*tile + (rows-1)*gapY
rowW     = cols*tile + (cols-1)*gap

stripFont = floor((stripH - 16) / 1.55)
tileFont  = floor(min(tile * 0.52, (tile - 16) / 1.55))
shelf     = clamp(floor((CW - 96 - 32 - 24) / 5.4), 0, 44)
maxCells  = the largest `cells` in 1..24 this viewport serves
```

Four consequences worth naming:

- **Columns come from the motor floor, not from a proportion.** A 360 dp phone fits four
  72 pt tiles across and no more; a tablet fits six. Nothing is ever scaled below the floor to
  fit a fifth column.
- **The table is the flex element.** `tile` is the largest size at which the stack fits, and
  spare height on a tablet goes into `gapY` — the table breathes rather than huddling — because
  `tile` is capped by reach (116), not by room.
- **Tile size is computed once per stage and does not change** as the table morphs from onsets
  to rimes to tones, so a tile never resizes under his finger.
- **There is no caption term, because there is no caption strip** (§2.1, correction U4).

### 4.3 The fit rule

A viewport is served iff **F7** holds, and then all of F1–F6 and F8 hold for every table size
up to `maxCells`:

| | Rule | Why |
|---|---|---|
| **F1** | `rowW ≤ tableW` | no horizontal scroll, ever |
| **F2** | `tile ≥ 72` | the motor floor, ≈11.4 mm (§4.5) |
| **F3** | `slack ≥ 0` | the stack fits |
| **F4** | `stripFont ≥ 34` | the word he is building reads across a room |
| **F5** | `tileFont ≥ 24` | `ngh`, `ăng`, `uống` still legible on a tile |
| **F6** | `gap ≥ 10` | hit rects can never overlap (§4.5) |
| **F7** | `maxCells ≥ 20` | a served viewport holds at least the 20-cell table |
| **F8** | `shelf ≥ 22` | five shelf slots fit the top bar |

`tools/layout-sweep.mjs` is the rule, executable. It is the Tier-4 artefact and it must stay
green. **Nothing scrolls and nothing is off-screen:** F1 and F3 together mean every symbol the
stage exposes is visible at once, which is what makes "you can see the letters that exist" true
rather than aspirational.

### 4.4 Verified output, representative devices

From `node tools/layout-sweep.mjs --devices`, 2026-09-23. `max` is the largest table the
viewport serves; the row shown is that table.

```
device                             orient max grid  tile gapY row    strip table shelf  font s/t
Android compact 360x640  (floor)   served  20  4x5   73   15   325    77    425    32    39/36
Android tall    360x800            served  24  4x6   73   21   325    77    543    32    39/36
Android large   412x915            served  24  4x6   83   26   368    87    628    41    45/43
iPhone SE 3     375x667            served  20  4x5   76   20   337    80    460    35    41/38
iPhone 15/16    393x852            served  24  4x6   80   19   356    84    575    37    43/41
iPhone 15 ProMax 430x932           served  24  4x6   88   22   391    92    638    44    49/45
iPad 11" portrait  834x1194        served  24  6x4  112   50   757   118    598    44    65/58
iPad 11" landscape 1194x834        served  24  6x4  116   30   781   122    554    44    68/60
iPad 13" landscape 1366x1024       served  24  6x4  116   52   781   122    620    44    68/60
Android tablet 800x1280  portrait  served  24  6x4  108   49   728   113    579    44    62/56
Android tablet 1280x800 landscape  served  24  6x4  116   22   781   122    530    44    68/60
iPhone 15 LANDSCAPE 852x393        LOCKED  12   --    --   --    --    --     --    --    --
```

Sweep verdict:

```
swept viewports 360..1400 x 600..1440 step 4, x 8 safe-area shapes, x cells=1..maxCells
  432297 viewport/inset combinations served
    of those, 428017 hold the full 24-cell table and 4280 top out at 20
  8271 rejected for this orientation -- the app locks portrait there
  10358248 layouts checked against 7 rules
tightest served layout: 360x608 insets {"insetT":24,"insetB":16} cells=17
  tile 72  grid 4x5  row 321/328  strip 76  table 404  slack 2  shelf 32  margin 0
PASS - 0 failing layout(s).
```

The iPad is the design target and it shows: **24 characters at 112 pt in a 6 × 4 grid**, with a
118 pt word strip above them. The 360 × 640 Android floor still gets **20 characters at 73 pt**
— smaller, never broken, and never scrolling.

**The one honest limitation.** 4,280 of the 432,297 served combinations top out at 20 cells,
which means the two shortest supported phones cap the child at stage 4 and the last four
symbols of the inventory are not on the board there (`gameplay.md` §6.1). A sixth row at those
heights would need a 59 pt tile, ≈9.4 mm, which is below every preschool touch guideline in
existence. **The tile floor does not move.**

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

**Spacing matters as much as size.** `gap ≥ 10 pt` (F6), and the hit rect extends **6 pt**
beyond the visual tile on all sides but is clipped so that **no two hit rects ever overlap** —
half the gap, at most. A fat finger landing between two tiles resolves to the nearer centre,
never to both.

### 4.6 Tablet buys size and cells; the ceiling is 24 either way

`literacy-vi.md` §8.1 caps the Vietnamese palette at **6 per row and 16 on screen**;
`literacy-en.md` §6.1 caps English at **8**. Those caps were written for revision 1's mechanic,
where the palette was a **search**: exactly one tile was right and the rest were distractors,
so the cost of a wide palette was a scan whose length scaled with its width.

**Under discovery, the scanning task is different and the cap must be re-derived rather than
inherited.** Every live tile is a correct move, so there is nothing to search for; the only
question is *which of these do I feel like pressing.* The effective set he must discriminate is
the **live** set, which the measurements in `gameplay.md` §3.3 put at 1–6 symbols after the
first tap, and the disabled set is visually recessive by construction (§5.8).

**Decision: the table ceiling is 24 cells, reached in five stages of 8 / 12 / 16 / 20 / 24, and
it does not grow on a tablet.** A tablet buys **size** — 112 pt against 73 pt — and a squarer
grid, not more characters. The ceiling is set by the smallest screen that can hold it and by a
judgement that 24 is the most a 4-year-old should ever be shown at once, not by what an iPad
could physically fit (it could fit 42).

**Flagged to the literacy-designer as a reconcile item, as §2.1 of revision 1 was.** This
changes a number they own (16 → 24 on screen in Vietnamese, 8 → 24 in English). It does not
change the tile inventories, the ordering constraint, the legality rules, or anything
pedagogical. If they hold the line at 16, the table ceiling becomes 16 and the stages become
4 / 8 / 12 / 16 — the law, the sweep and every acceptance criterion take that without
modification, because `cells` is an input.

---

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
| `neutralFace` | `#888F9E` | `#9A8E80` | `#818C97` | gate dot, empty-cell outline, the ∅ tile |
| `hairline` | `#D4D5D8` | `#D6D5D3` | `#D3D6D8` | strip cell divider |
| `veil` | = `ground` | = `ground` | = `ground` | **vestigial** — the veiled prompt is deleted. Kept so the token set is unchanged; the reveal may reuse it as a scrim. |

**Every `role1/2/3` value is the owner's hex, unchanged.**

### 5.2 The contrast sweep

`tools/theme-contrast.mjs` sweeps **34 pairs × 3 themes** that can actually co-occur on screen,
with a threshold per *pair type* rather than one global number:

| Type | Threshold | Applies to |
|---|---|---|
| `glyph` | **4.5:1** | any letter he is learning to read — **including a disabled one** |
| `bodyText` | 4.5:1 | parent-facing text |
| `largeText` | 3.0:1 | AA large |
| `component` | 3.0:1 | silhouettes, outlines, chips, the gate dot, shelf slots |
| `shade` | 1.4:1 | a shading step *inside one object*, carrying no information |
| `decor` | — | hairlines. **Logged separately, never gates.** |

**Result: PASS, 0 failing pairs, all three themes.** Selected measured values (Popsicle):

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

**The bar pattern is the point.** Role is carried by three redundant channels: the pattern, the
fact that the Vietnamese table shows exactly one role at a time (§7.1), and colour. Colour is
the redundant one. That is what lets the sweep gate hard on normal-sighted separation
(ΔE00 ≥ 25, lowest measured 33.0) while treating **CVD separation as a printed diagnostic**:

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

iPad 11" portrait: 6 × 4, tile 112, gapY 50, row 757, strip 118, table 598, shelf 44,
`stripFont` 65, `tileFont` 58. Stage 5, the onset table — 23 written onsets plus ∅, which is
exactly 24 cells.

```
┌────────────────────────────────────────────────────────────────────┐
│▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔│ 4pt role1 rule
│ Ghép Chữ           [img][img][ ][ ][ ]                        ◔    │ 56pt top bar:
├────────────────────────────────────────────────────────────────────┤ title · SHELF · gate
│   ┌──────────────┬──────────────────────┬────────────────────┐     │
│   │      m       ┊          ·           ┊         ·          │     │ word strip, 118 tall
│   └━━━━━━━━━━━━━━┴━━━━━━━━━━━━━━━━━━━━━━┴━━━━━━━━━━━━━━━━━━━━┘     │ 3 cells: onset ┊ rime
│      role1 rule        role2 rule             role3 rule           │ ┊ tone, 5pt underlines
│                                                                    │
│   ╭──────────────────────────────────────────────────────────╮     │
│   │ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌ ── ┐ ┌────┐                 │     │  THE TABLE
│   │ │ b  │ │ c  │ │ ch │ │ d  │ ╎ đ  ╎ │ g  │                 │     │  6 cols x 4 rows
│   │ └────┘ └────┘ └────┘ └────┘ └ ── ┘ └────┘                 │     │  112pt tiles
│   │ ┌ ── ┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                 │     │
│   │ ╎ gh ╎ │ gi │ │ h  │ │ k  │ │ kh │ │ l  │                 │     │  SOLID box  = live
│   │ └ ── ┘ └────┘ └────┘ └────┘ └────┘ └────┘                 │     │  DASHED box = flat
│   │ ┌────┐ ┌ ── ┐ ┌ ── ┐ ┌────┐ ┌────┐ ┌────┐                 │     │
│   │ │ m  │ ╎ n  ╎ ╎ ng ╎ │ nh │ │ ph │ │ qu │                 │     │
│   │ └────┘ └ ── ┘ └ ── ┘ └────┘ └────┘ └────┘                 │     │
│   │ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌╌╌╌╌┐                 │     │
│   │ │ r  │ │ s  │ │ t  │ │ th │ │ tr │ ╎ ·  ╎                 │     │  ∅ = the last cell
│   │ └────┘ └────┘ └────┘ └────┘ └────┘ └╌╌╌╌┘                 │     │
│   ╰──────────────────────────────────────────────────────────╯     │
└────────────────────────────────────────────────────────────────────┘
```

Every tile is visible. Every tile speaks when touched. Only the standing ones move.

### 7.1 The table morphs — onset → rime → tone

Exactly one role is on screen at a time. **This was re-argued for revision 2 rather than
inherited from revision 1's palette decision**, and it survives on stronger grounds:

1. **The tone tiles are undrawable before a rime exists.** `literacy-vi.md` §5.4 renders each
   tone tile as *the chosen rime, marked* — `eo èo éo ẻo ẽo ẹo`. A three-table screen would have
   to draw a table whose contents are not yet defined. This alone decides it.
2. **Arithmetic.** 24 onsets + 24 rimes + 6 tones is 54 cells at ≥72 pt. Nothing in the
   supported range fits that; the largest table any served viewport holds is 24.
3. **Two of the three would be entirely disabled.** Before a rime is chosen, every tone tile is
   flat. A screen that is two-thirds inert is exactly the dead-screen failure the brief forbids
   — and revision 2, which *displays* disabled tiles rather than hiding them, would make it
   worse than revision 1 did, not better.
4. **The morph is the lesson.** The tiles do not change place or size: `eo` becomes
   `eo èo éo ẻo ẽo ẹo` in situ, and he watches the row he was looking at put on six hats.

```
  ┌─ he taps `m` ────────────────────────────────────────────────────┐
  │  `m` flies into the onset cell.  The TABLE cross-fades to the     │
  │  RIME inventory: tint role1Soft -> role2Soft, bars solid -> split │
  │  and the live set becomes {a, ai, ay, eo, ua, ui} -- the six      │
  │  rimes that follow `m` in this pack.  The other 18 lie flat.      │
  └───────────────────────────────────────────────────────────────────┘
  ┌─ he taps `eo` ───────────────────────────────────────────────────┐
  │  The TABLE becomes the SIX TONED FORMS of `eo`, dotted bars,      │
  │  role3.  `èo` stands; the other five lie flat -- and he can see   │
  │  all six, which is the tone lesson in one screen.                 │
  │      ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                    │
  │      ╎ eo ╎ │ èo │ ╎ éo ╎ ╎ ẻo ╎ ╎ ẽo ╎ ╎ ẹo ╎                    │
  │      └ ── ┘ └────┘ └ ── ┘ └ ── ┘ └ ── ┘ └ ── ┘                    │
  └───────────────────────────────────────────────────────────────────┘
```

- **A stop-final rime produces a 2-cell tone table** (`literacy-vi.md` §5.2): only the rime's
  *legal* toned forms are rendered at all, so `ach` shows `ách ạch` and nothing else. Legality
  is absence; completability is flatness. The two never have to be told apart.
- **Reversal is free.** Tapping the seated rime in the strip returns it and the table morphs
  back to rimes; tapping the seated onset returns everything after it too (`gameplay.md` §4.4).
- **The role rule under the strip cells and the table's tint say which table is up**, so a
  parent can see the structure at a glance without a label.

### 7.2 The word strip

Three cells, divided by 1 pt `hairline`. The onset cell is `0.28 × stripW`, the rime cell
`0.44`, the tone cell `0.28`. Each carries a 5 pt underline in its role colour, so the strip
states the structure of a Vietnamese syllable even when empty.

```
  empty        ┌╌╌╌╌╌╌┬╌╌╌╌╌╌╌╌╌╌╌╌┬╌╌╌╌╌╌┐   cells dashed 2pt neutralFace,
               ╎  ·   ┊     ·      ┊  ·   ╎   one centred dot each
               └━━━━━━┴━━━━━━━━━━━━┴━━━━━━┘   5pt role1/role2/role3 underlines

  onset in     ┌──────┬╌╌╌╌╌╌╌╌╌╌╌╌┬╌╌╌╌╌╌┐
               │  m   ┊     ·      ┊  ·   ╎   glyph in ink on surface, 13.4:1
               └━━━━━━┴━━━━━━━━━━━━┴━━━━━━┘

  rime in      ┌──────┬────────────┬╌╌╌╌╌╌┐
               │  m   ┊     eo     ┊  ·   ╎
               └━━━━━━┴━━━━━━━━━━━━┴━━━━━━┘

  tone in      ┌──────┬────────────┬──────┐   the rime cell now shows the MARKED
               │  m   ┊    èo      ┊huyền ╎   form; the tone cell names the tone
               └━━━━━━┴━━━━━━━━━━━━┴━━━━━━┘

  announcing   ┌────────────────────────────┐ hairlines dissolve, glyphs slide
               │           mèo              │ together, each cell's FACE takes
               └━━━━━━━━━━━━━━━━━━━━━━━━━━━━┘ the gold in chant order (§5.9)
```

**A zero-onset word** fills the first cell with the ∅ socket mark rather than collapsing the
strip, so the syllable's shape is the same three cells in every word.

---

## 8. Screen: Word Blocks (English)

iPhone 15, 393 × 852: 4 × 6, tile 80, gapY 19, row 356, strip 84, table 575, shelf 37,
`stripFont` 43, `tileFont` 41. Stage 5, 21 letters — the table has 21 cells and the last row is
short, because the grid is filled row-major and never padded.

```
┌──────────────────────────────────────────────┐
│▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔│
│ Word Blocks     [img][ ][ ][ ][ ]       ◔    │  shelf: 5 x 37pt
├──────────────────────────────────────────────┤
│   ┌───────┬───────┬╌╌╌╌╌╌╌┐                  │  strip grows to the RIGHT.
│   │   c   │   a   ┊   ·   ╎                  │  The length is NOT shown --
│   └━━━━━━━┴━━━━━━━┴━━━━━━━┘                  │  it is part of the discovery
│    solid    split   (next)                   │
│                                              │
│  ╭────────────────────────────────────────╮  │
│  │ ┌────┐ ┌ ── ┐ ┌ ── ┐ ┌ ── ┐             │  │  after `c` `a`, only
│  │ │ a  │ ╎ b  ╎ ╎ c  ╎ ╎ d  ╎             │  │  `n`, `p`, `t` complete a
│  │ └────┘ └ ── ┘ └ ── ┘ └ ── ┘             │  │  word -- can, cap, cat.
│  │ ┌ ── ┐ ┌ ── ┐ ┌ ── ┐ ┌ ── ┐             │  │  Everything else lies flat,
│  │ ╎ e  ╎ ╎ f  ╎ ╎ g  ╎ ╎ h  ╎             │  │  and every one of them still
│  │ └ ── ┘ └ ── ┘ └ ── ┘ └ ── ┘             │  │  says its sound when tapped.
│  │ ┌ ── ┐ ┌ ── ┐ ┌ ── ┐ ┌────┐             │  │
│  │ ╎ i  ╎ ╎ l  ╎ ╎ m  ╎ │ n  │             │  │  `a` stands because it is
│  │ └ ── ┘ └ ── ┘ └ ── ┘ └────┘             │  │  ALSO a vowel tile with a
│  │ ┌ ── ┐ ┌────┐ ┌ ── ┐ ┌ ── ┐             │  │  SPLIT bar in role2; the
│  │ ╎ o  ╎ │ p  │ ╎ r  ╎ ╎ s  ╎             │  │  consonants carry SOLID
│  │ └ ── ┘ └────┘ └ ── ┘ └ ── ┘             │  │  bars in role1.
│  │ ┌────┐ ┌ ── ┐ ┌ ── ┐ ┌ ── ┐             │  │
│  │ │ t  │ ╎ u  ╎ ╎ v  ╎ ╎ w  ╎             │  │
│  │ └────┘ └ ── ┘ └ ── ┘ └ ── ┘             │  │
│  │ ┌ ── ┐                                  │  │  21 cells in a 4x6 grid:
│  │ ╎ x  ╎                                  │  │  the last row is short
│  │ └ ── ┘                                  │  │
│  ╰────────────────────────────────────────╯  │
└──────────────────────────────────────────────┘
```

Differences from Vietnamese, all structural:

| | |
|---|---|
| Strip | grows rightwards, **length not shown**. A Vietnamese syllable is always three symbols and that is worth stating; an English word's length is part of what he is discovering. |
| Table | one inventory, **letters in alphabetical order** — the order he will meet in the alphabet song and the one his mother would expect. Digraph tiles (`sh ch th ck ng gg ll ss ff zz`) append after the letters at stage 6–7. |
| Ordering | none beyond left-to-right. A tap fills the next empty cell. |
| Role colours | two of three. `role3` never appears. |
| Chant | tile `short` clips left to right, then the whole word. |

---

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

### 9.2 Strip cell

```
 empty              filled              chant-lit            merged
 ┌╌╌╌╌╌╌┐           ┌──────┐            ┌──────┐             (hairlines gone,
 ╎  ·   ╎           │  m   │            │██m███│              glyphs slid together
 └╌╌╌╌╌╌┘           └──────┘            └──────┘              into one word)
 2pt dashed         ink on surface      reward FACE,
 neutralFace        13.4:1              ink glyph 6.5:1
 3.25:1                                 + lifts 1.12x
                                        (correction U11 —
                                         the GLYPH never
                                         turns gold)
```

### 9.3 The word strip as a whole

```
 empty        → building        → announcing              → cleared
                                   ┌────────────────┐        (after the picture
                                   │      mèo       │         flies to the shelf)
                                   └────────────────┘
                                   symbols hop 90ms apart,
                                   hairlines dissolve,
                                   cells merge, gold in
                                   chant order
```

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
| the table morphs (onset → rime → tone) | two absolutely-positioned tables of the same size, cross-faded by **opacity** + 8 pt `translateY` |
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
| M7 | table morph (onset→rime→tone) | 280 ms cross-fade, 8 pt rise | `enter` | *same board, new question* |
| M8 | **undo — symbols fly home** | 300 ms each, 90 ms stagger | `exit` | *taken back*, with the descending unclick |
| M9 | **the announcement hop** | 260 ms per symbol, 90 ms stagger, `translateY −14`, `scale 1→1.14→1` | `pop` | ***you made a thing*** |
| M10 | merge (hairlines + slide) | 240 ms slide, 180 ms fade | `enter` | *these are one word* |
| M11 | chant part lights | 320 ms, gold face + 1.0→1.12→1.0 | `calm` | *this part is speaking now* |
| M12 | tone mark drop | 260 ms, scale 1.8→1, y −10→0, 14% overshoot | `enter` | *this mark is the thing that changed* |
| M13 | **the reveal** | 420 ms scale+translate from the strip to full screen | `enter` | *the thing is real, and it is yours* |
| M14 | reveal hold | +1400 → +2200 ms, still | — | the say-it-together beat (§2.3) |
| M15 | **picture flies to the shelf** | 520 ms, scale 1 → 0.08, translate to the slot | `exit` | *that one is kept* |
| M16 | **the shelf tips into the album** | 5 × 380 ms, 90 ms stagger | `exit`/`enter` | *that is a shelf full; here is everything you have made* |
| M17 | **the shimmer** (idle 20 s) | 900 ms sweep, α +0.25 peak, left to right across live tiles only | `calm` | *these ones* — without pointing at one |
| M18 | hint breathe (idle 40 s) | 1200 ms on, 1600 ms off, α 1→.55→1, scale 1→1.05 | `calm` | *this one* — slow, because there is no urgency |
| M19 | auto-play (idle 80 s) | rise 12 pt 200 ms · hold 160 ms · fly 420 ms | `enter` | *I'll take a turn* — slower than his own taps, so it reads as the app |
| M20 | confetti | 12 shapes, 300–1200 ms, drift outward and fade | `exit` | pure delight, and the only purely decorative motion in the app |
| M21 | gate-dot hold | ring fills 0→360° over 1200 ms | linear | *keep holding* — the only progress indicator in the app |

### 10.4 The announcement, frame by frame

| t (ms) | What |
|---|---|
| 0 | **the motif fires** (and the cheer, if recorded). M9 begins: the strip's symbols hop in sequence, 90 ms apart |
| 300 | M10: the hairlines dissolve and the symbols slide into one word |
| 350 | M20: 12 confetti shapes in `role1` / `role2` / `reward` |
| 440 | the motif ends; the **chant** begins (M11, M12). Skipped on a re-discovery |
| chant end | M13: the picture scales from the strip's rectangle to full screen, 420 ms |
| +200 | **the word is spoken** |
| +1400 | motion ends. The word sits large on the picture. **Silence.** |
| +2200 | the word is spoken once more (§2.3) |
| +2200 → | held indefinitely; each tap replays the word, bounces 1.04× and turns to the next photograph |
| exit (3000 ms after the last tap) | M15: the picture flies into the shelf; the strip clears — **unless the word is a proper prefix of another**, in which case the strip keeps it (`gameplay.md` §5.5) |

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
| M17 shimmer | a single 900 ms α pulse across the live tiles, no sweep |
| M18 breathe | α only, no scale |
| M21 gate ring | a static ring that fills in 4 steps |

**Audio is identical in both modes**, including the motif and the cheer. That is the point: the
audio carries the whole game, so a child who has turned away, or whose parent has reduce-motion
on, loses nothing.

---

## 11. Audio behaviour

### 11.1 Latency budget

**Budgeted against an iPhone 11 / A13 and a 2021 mid-range Android (Snapdragon 690)** — the
oldest devices plausibly in this house.

| Event | Budget |
|---|---|
| visual press state | **≤ 1 frame (16.7 ms)** from touch-down |
| tile sound begins, **live or disabled** | **≤ 60 ms** from touch-**down**, not touch-up |
| the announcement motif begins | **≤ 60 ms** from the touch-down that completes the word |
| chant step boundary drift | ≤ 30 ms |

Achieved by: **every clip the current table can produce is decoded and resident** — at most 24
symbols × 2 variants ≈ 48 clips ≈ 560 KB — **preloaded when the table changes**, which happens
at most once per tap and always has 200 ms of morph to hide in. The motif and the cheer are
bundled UI audio and are resident for the whole session.

Sound fires on `onPressIn`. Nothing waits on an animation.

### 11.2 Six taps in four seconds

| Rule | |
|---|---|
| **One channel for tile sounds.** | A new tap **stops the previous clip immediately**. No queue, no overlap. A queue means his sixth tap plays six seconds later, which reads as broken. |
| **Long vs short.** | English `c-long` ("kuh, cat", ~1 s) plays on the **first** touch of that tile in the session; `c-short` ("kuh", ~350 ms) after — **and always short if any tile was touched in the previous 900 ms.** A burst of six taps is six short clips, each audible. |
| **Vietnamese has the same two slots.** | Shipping with `long` = `short` today. |
| **Disabled tiles use the same channel and the same rules.** A flat `b` sounds exactly like a standing `b`. |
| **The announcement owns a second channel** and cannot be interrupted by tile taps — and tiles are not tappable during it anyway. |
| **Hold.** | Holding a tile past 600 ms replays its **short** clip every 700 ms, **up to 6 times**, then stops. The tile stays pressed with M18's breathe so the screen is not frozen. On release nothing is placed — a hold is not a tap. |
| **Placement** = touch-down and touch-up within **600 ms** and within **24 pt** of the start point. |
| **Multi-touch.** | The game is **single-touch**. The first touch owns the gesture; further simultaneous touches are ignored until it ends. Two fingers on two tiles plays one sound and seats one symbol. |

### 11.3 Sound events, so the game works with the screen ignored

| Event | Sound |
|---|---|
| live tile touched | its own clip |
| symbol seated | a 90 ms wooden seat click |
| **disabled tile touched** | its own clip, then a soft muted knock at **−9 dB** — *wood, not drum* |
| **undo** | that symbol's clip, plus a **descending two-note unclick**, 140 ms |
| **a word forms** | **the motif** (§11.4), plus the cheer if recorded |
| chant | the parts, then the whole word |
| reveal | the word, then §2.3's repeat |
| shelf slot fills | a single soft bell, folded into M15 |
| shelf tips into the album | a four-note phrase, once |
| auto-play (M19) | that tile's clip, at the moment it lands |

**Every one of these is distinguishable with the screen face-down**, which is an acceptance
criterion (§M), not an aspiration. The three critical distinctions are: *seated* (click) vs
*flat* (knock) vs *taken back* (descending), and **the motif rises while the unclick falls**, so
the two moments that matter most can never be confused.

**Silent switch.** Audio uses the `playback` category, so the game speaks even when the ringer
switch is silenced. A parent's phone lives on silent and a silent word game is a broken word
game. A mute row exists in the parent menu.

### 11.4 The announcement motif — the spec

| | |
|---|---|
| Form | three notes, **rising**, a major triad: root · major third · perfect fifth |
| Timing | onsets at 0 / 130 / 260 ms; each note 180 ms; **440 ms total** |
| Voice | a soft mallet — marimba or glockenspiel; fast attack, short decay, no reverb tail |
| Level | peak −6 dBFS, ducking tile audio to −18 dB for its duration |
| **New word** | a **fourth note an octave above the root** at 390 ms — audibly *more*, with no number and nothing to read |
| Language | **identical in both modes.** It is the app's signature, not a localised string, and it is the one sound that may cross the language boundary because it contains no language |
| The cheer | if the pack has one, it plays **at t = 0 over the motif**, ≤ 2 s, at −3 dBFS |
| Files | two bundled UI assets (`motif-3`, `motif-4`), plus an optional per-pack `cheer` |

**Why a motif and not a spoken catchphrase.** Catchy is repetition plus anticipation: he will
hum three notes after a day and will start to anticipate them a beat before they arrive, which
is the feeling the owner asked for. A spoken line is a second recorded asset per language, it
collides with the word audio 600 ms later, and it is the element that goes stale first. The
cheer gives back everything a catchphrase would have offered, in his mother's voice, optionally.

---

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
| **VoiceOver / TalkBack** | The **board exposes one accessibility element** describing the state ("Building a word. m, eo placed. Six letters can follow."). Individual tiles are `accessibilityElementsHidden`: letting a screen reader speak letter *names* over a game whose entire thesis is letter *sounds* would teach the opposite of the app. **Parent surfaces are fully and conventionally labelled.** |
| **Handedness** | The table is centred, so handedness does not matter. The gate dot is top-right and the editor's `+` bottom-right, both adult targets. No mirror mode in v1. |
| **Screen too small** | Below 360 × 600 pt, or any viewport serving fewer than 20 cells, a parent-facing card. No half-broken game. |

---

## 13. The editor — his mother's product

Reached by: gate dot → 1.2 s hold → gate → parent menu → **Add a word** (row 1) or **Words**.
**Optimised for a phone held in one hand.** On a tablet it renders as a centred **520 pt
column** on `groundAlt`, not a stretched form.

**The app makes no network call, ever, including here.** No image search, no runtime TTS. Her
sources are the camera, her photo library, and her voice.

Unchanged from revision 1 except §13.5 (a new reason), §13.6 (the cheer) and the preview, which
now shows discovery.

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

### 13.5 New in revision 2: "this letter is not on the board yet"

A word can now be linguistically perfect and still unreachable, because the table is a fixed
inventory and a symbol outside it can never be tapped. The editor must say so, in her words:

```
 ┌────────────────────────────────────────┐
 │  `xoài` dùng chữ `x`.                  │  one sentence, no jargon
 │  Chữ `x` chưa có trên bảng chữ cái.    │
 │                                        │
 │        ┌────┐                          │  the tile, drawn exactly as it
 │        ╎ x  ╎   <- lying flat          │  would look on the board, flat
 │        └━━━━┘                          │
 │                                        │
 │  ┌──────────────────────────────────┐  │  one tap appends `x` to the
 │  │   Thêm `x` vào bảng              │  │  pack's inventory order
 │  └──────────────────────────────────┘  │
 │                                        │
 │  Bảng có 24 ô. Đang dùng 21.           │  and it says how much room is left,
 └────────────────────────────────────────┘  because 24 is a real ceiling (§4.6)
```

If the table is already full at 24, the same screen says so and offers to **swap**: it lists the
inventory with the count of words behind each symbol, and she taps the one to retire. Retiring a
symbol never deletes a word — the affected words move to *Chưa chơi được* with the same
one-line reason, and come back if she puts the symbol back. **Nothing she has typed is ever
lost to a layout constraint.**

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
| E1 | per word: display spelling; decomposition as **renderable tiles** with a role per tile; `stage`; `enabled` + `disabledReason`; `draft`; `source`. `meetings` is app state, not pack data |
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
| **E12** | **NEW — a stable, editable `inventoryOrder` per position** (Vietnamese: onsets, rimes, tones; English: tiles). The table takes the first `cells` of it, so this list *is* the board. It must survive edits, be reorderable, and be the thing §13.5 appends to. **Nothing else may determine which symbol sits in which cell**, because spatial constancy is the pedagogical point (`gameplay.md` §3.2). |
| **E13** | **NEW — a derived, cacheable prefix tree** over the eligible words: the live set for a prefix, and "is this prefix a word", both in O(1) at tap time to hold the 60 ms budget. The UI does not care how it is stored; it cares that it is **rebuilt atomically when she saves a word**, so a word she just added is discoverable without an app restart |
| **E14** | **NEW — one optional `cheer` clip per pack** (§13.6): ≤ 2 s, her recording, removable, and **not** per word |

---

## 14. Screen inventory

| # | Screen | Audience | Text? | Reached from |
|---|---|---|---|---|
| S1 | First-launch chooser (+ theme buttons) | parent | yes — **the one screen with both languages** | first launch only |
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
| S16 | Voice & pace / Motion & sound / Language | parent | yes | S8 |
| S17 | About & attributions | parent | yes | S8 |
| S18 | Screen-too-small card | parent | yes | viewport < 360 × 600, or fewer than 20 cells |

Eighteen screens. Three of them are the child's, and he never navigates between them.
