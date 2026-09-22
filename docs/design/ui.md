# UI — screens, layout, visual system, motion, accessibility, the editor

**Ghép Chữ** (Vietnamese mode) · **Word Blocks** (English mode).

Owner: game-designer. Read `gameplay.md` first — it defines the loop this document dresses.
`acceptance-criteria.md` numbers everything here as testable behaviour.

Two tools verify the claims in this document and **both exit 0**:

| Tool | Verifies | Result |
|---|---|---|
| `tools/theme-contrast.mjs` | every (theme × surface × foreground) pair that can co-occur, in all three themes, plus role-hue separation | **PASS**, 0 failing pairs |
| `tools/layout-sweep.mjs` | the layout law over viewports 360–1400 × 600–1440 pt in steps of 4, × 8 safe-area shapes, × palette sizes 1–8 | **PASS**, 3,477,280 layouts, 0 failures |

Nothing in §4 or §5 is asserted. Every number came out of one of those two programs.

---

## 1. Two products in one binary

| | The game | The parent surfaces |
|---|---|---|
| User | a 4-year-old who cannot read | his mother, who can |
| Looks like | coloured blocks, one big photograph, no chrome | an ordinary, conventional, labelled mobile app |
| Text | present, but **never required of him** (§2) | freely |
| Type | Baloo 2, 36–83 pt | Be Vietnam Pro, 13–24 pt |
| Ground | the theme's bright `ground` | `groundAlt` (white) |
| Navigation | none | a back chevron and a title, everywhere |
| Optimised for | a **10-inch tablet**, flat or propped | a **phone**, one-handed |

They must not be confusable, by anyone, including the tester. That is why they share only
the colour tokens and nothing else.

---

## 2. What co-play changes, and what it deliberately does not

His mother plays with him. That is the highest-value mode for early literacy, and it
loosens one rule precisely:

> **Old rule:** no text he must read.
> **New rule:** nothing he needs is text-only, and nothing on screen asks *him* to read.

Used deliberately, in four places, and nowhere else.

### 2.1 The caption strip — the one piece of text on the play screen

A single centred line, 0.42 × tile pt, `inkSoft`, Be Vietnam Pro, directly under the word
plate. It is for her. Three states:

| When | Shows |
|---|---|
| Round open | the target word, plain — `mèo` / `cat` |
| During the chant | each part as it is spoken, then the whole: `mờ · eo · mèo` |
| Reveal held | the word, and the sentence if the pack has one |

She can therefore say the word before the audio does, prompt him, and point at a letter. He
cannot read it and never needs to: the picture and the audio carry everything.

**Parent setting `Show the word`, default ON.** Off replaces the word with N dots (one per
cell) so the strip still shows how long the answer is. Default on because she is present by
design; off exists because some parents will want him working purely from sound.

### 2.2 The parts hint — a hint an adult knows to use

**Press and hold the picture frame for 800 ms** → the app speaks the target's *parts* (the
đánh vần / the letter sounds), not the word. It is the pedagogically correct hint: say the
pieces, let him find them. It does not reveal, does not place anything, does not reset the
idle ladder and does not count as an assist.

A short tap on the frame still replays the whole word (`gameplay.md` §3.3). Two gestures,
one target, both useful, neither discoverable-by-accident in a harmful way.

### 2.3 The say-it-together beat

The reveal holds the word large on the full-bleed picture, silent, from **1400 ms to
2200 ms** — a deliberate gap long enough for her to say it with him — then speaks the word
once more at 2200 ms so the last thing heard is correct. Solo, it simply reads as a beat of
rest before the next round. No icon, no instruction, no two-player mechanic.

### 2.4 Capture the word he just asked for

**"Add a word" is the first row of the parent menu**, reachable from anywhere via the gate
dot, including mid-round. Entering the editor from play remembers the round; saving or
cancelling returns to it, unchanged, with the seated tiles still seated. The moment he says
*"where's the digger?"* is the best moment to add the digger, and it is two taps away.

### 2.5 What does not change

- **No two-player mode, no turn-taking, no pass-the-device.** The ask was warmth, not
  mechanics.
- **Solo play is complete.** The hint ladder still guarantees every round finishes
  (`gameplay.md` §6.5), the audio still carries the whole game, and no round needs an adult.
- **Nothing moves in front of the gate.** The editor, language and settings stay behind it.
- **No progress dashboard, no parent report, no streak.** There is still no score in this app
  for anybody.
- **Neither language is secondary.** He has both. Both modes ship complete, with the same
  ritual, the same chrome, the same states and the same acceptance criteria.

---

## 3. Structural defences against a language leak

Colour cannot be the leak detector, because both modes use the same role tokens (§5.6). So:

1. **The mode title is on every screen.** Top-left of the top bar, 13 pt `inkSoft`: `Ghép
   Chữ` or `Word Blocks`. Every screenshot the tester takes carries its own label, including
   the editor and the gate.
2. **No screen component is shared between modes.** The Vietnamese board and the English
   board are separate screens with separate state; there is no `<Board lang=…>`.
3. **Switching language unmounts and remounts the whole game**, reloads the pack and
   re-seeds the engine (`gameplay.md` §7.1).
4. **No fallback path exists.** A word missing an asset is skipped, never substituted. There
   is no default string, no `??`, no `||` onto the other pack.
5. **One documented exception:** the first-launch chooser shows both titles, because it must.
   `acceptance-criteria.md` §R names it as the single exemption.

---

## 4. Layout

### 4.1 Device range

Designed across a **continuous range**, not a device list:

| | |
|---|---|
| Supported viewport width | **360 – 1400 pt/dp** |
| Supported viewport height | **600 – 1440 pt/dp** |
| Below 360 wide or 600 tall | a parent-facing "this screen is too small" card. No game. |
| Orientation | whichever passes the fit rule (§4.3) at every palette size 1–8 |

In practice that means **phones lock to portrait** (a phone in landscape leaves ~330 pt of
height and fails F3 by 130 pt — arithmetic, not taste) and **tablets rotate freely**.
Evaluated once at startup from the screen metrics, never per frame, so the device cannot
flip-flop. The sweep rejected 5,908 viewport/inset combinations on exactly this basis and
served 434,660.

**Rotating mid-round changes only pixels.** The engine is pure and presentation replays
resolved state (`development-process.md` §3): seated tiles stay seated, lit segments stay
lit, the chant continues, audio does not restart. `acceptance-criteria.md` §P.

### 4.2 The layout law

One vertical stack. Both orientations. Both modes. Everything is fixed by a motor or
legibility constraint **except the picture frame, which absorbs all remaining height.**

```
INPUT   Wv, Hv           viewport, pt (iOS) / dp (Android)
        insetT/B/L/R     safe-area insets
        n                tiles in the largest row THIS ROUND will show (1..8)

W        = Wv - insetL - insetR
H        = Hv - insetT - insetB
gutter   = clamp(round(W * 0.045), 14, 44)
CW       = W - 2*gutter                          content width
palBand  = min(CW, 1280)                         ~200 mm two-handed reach cap

perLine  = [1,2,3,2,3,3,4,4][n-1]                4 breaks 2+2; 5-6 break 3+3; 7-8 break 4+4
lines    = ceil(n / perLine)                     never more than 2

tileByW  = floor(palBand / (perLine + 0.15*(perLine-1)))
capH     = 0.34*H - 24                           the band may not eat the picture
tileByH  = lines==1 ? floor(capH) : floor(capH / 2.15)
tile     = clamp(min(tileByW, tileByH), 72, 116)
gap      = clamp(round(tile * 0.15), 10, 18)
while (perLine*tile + (perLine-1)*gap > palBand && tile > 72) { tile--; recompute gap }

rowW     = perLine*tile + (perLine-1)*gap
bandH    = lines*tile + (lines-1)*gap + 24
plateH   = round(tile * 1.26)                    holds a 1.55 em Vietnamese glyph box
overlap  = round(plateH * 0.42)                  the plate sits over the frame's lower lip
frameW   = min(CW, 860)
topBar   = 36        gapFrameBand = 14        padBottom = 16

stackFixed = topBar + bandH + (plateH - overlap) + gapFrameBand + padBottom
frameH     = clamp(H - stackFixed, 200, 620)
slack      = H - stackFixed - frameH             distributed above the band, stack centred

plateFont  = floor((plateH - 16) / 1.55)
tileFont   = floor(min(tile * 0.52, (tile - 16) / 1.55))
```

Three consequences worth naming:

- **The tile is sized from the widest line the round actually uses.** A 3-tile Vietnamese
  onset row gets 99–116 pt tiles; an 8-tile English tray gets 73–116 pt. Motor comfort is
  bought wherever the content allows it. **Tile size is computed once per round and does not
  change mid-round**, so a tile never resizes under his finger when the band morphs.
- **Tiles do not scale with screen width; the gutter does.** Tile size is a motor constant
  (§4.5), not a proportion.
- **The picture is the flex element.** Everything else is a floor.

### 4.3 The fit rule

A viewport is served iff all seven hold for every palette size 1–8:

| | Rule | Why |
|---|---|---|
| **F1** | `rowW ≤ CW` | no horizontal scroll, ever |
| **F2** | `tile ≥ 72` | the motor floor, ≈11.5 mm (§4.5) |
| **F3** | `frameH ≥ 200` **and** `frameH ≥ 0.28 × H` | the payoff must not become a stamp |
| **F4** | `slack ≥ 0` | the stack fits |
| **F5** | `frameH − overlap ≥ 150` | picture still visible above the word plate |
| **F6** | `plateFont ≥ 30` | the assembled word stays readable across a room |
| **F7** | `tileFont ≥ 24` | `ngh`, `ăng`, `uôi` still legible on a tile |

`tools/layout-sweep.mjs` is the rule, executable. It is the Tier-4 artefact
(`development-process.md` §5) and it must stay green.

### 4.4 Verified output, representative devices

From `node tools/layout-sweep.mjs --devices`. `n` is the largest row in the round.

```
device                              orient n  tile gap  row band plate  frame WxH   font t/p
Android compact 360x640  (floor)    served 3   99  15   327  123  125   328x339     51/70
                                           6   83  12   273  202  105   328x271     43/57
                                           8   73  11   325  181   92   328x300     36/49
Android tall    360x800             served 3   99  15   327  123  125   328x467     51/70
                                           8   73  11   325  181   92   328x428     36/49
Android large   412x915             served 3  113  17   373  137  142   374x548     58/81
                                           8   83  12   368  202  105   374x504     43/57
iPhone SE 3     375x667             served 3  103  15   339  127  130   341x379     53/73
                                           6   91  14   301  220  115   341x294     47/63
                                           8   76  11   337  187   96   341x338     38/51
iPhone 15/16    393x852             served 3  108  16   356  132  136   357x482     56/77
                                           8   80  12   356  196  101   357x438     41/54
iPhone 15 ProMax 430x932            served 3  116  17   382  140  146   392x548     60/83
                                           8   88  13   391  213  111   392x496     45/61
iPad 11" portrait  834x1194         served 3  116  17   382  140  146   758x620     60/83
                                           8  116  17   515  273  146   758x620     60/83
iPad 11" landscape 1194x834         served 3  116  17   382  140  146   860x499     60/83
                                           8  113  17   503  267  142   860x375     58/81
iPad 13" landscape 1366x1024        served 8  116  17   515  273  146   860x556     60/83
Android tablet 800x1280  portrait   served 8  116  17   515  273  146   728x620     60/83
Android tablet 1280x800 landscape   served 8  107  16   476  254  135   860x354     55/76
iPhone 15 LANDSCAPE 852x393         LOCKED --  correctly rejected: frameH 200 < 0.28*H
```

The iPad is the design target and it shows: a **758 × 620 pt photograph** and **116 pt
tiles** in portrait. The 360 × 640 Android floor still gets a 328 × 300 photograph and 73 pt
tiles — smaller, never broken.

### 4.5 Touch target: 72 pt floor, 99–116 pt typical

**Number: `tile ≥ 72 pt/dp`, never less; 99–116 on a tablet and on any round with ≤6 tiles.**

| Surface | Point size | Physical |
|---|---|---|
| iOS @3x (1 pt ≈ 0.166 mm) | 72 pt | **≈ 11.9 mm** |
| Android (1 dp = 1/160 in = 0.159 mm) | 72 dp | **≈ 11.4 mm** |
| Tablet typical | 116 | **≈ 18.4 mm** |

Where it came from, honestly:

1. **Vatavu, Cramariuc & Schipor (2015), "Touch interaction for children aged 3 to 6 years",
   IJHCS** — the standard empirical source on preschool tap accuracy. Its finding, as I
   recall it, is that error rates fall steeply up to roughly **12 mm** and plateau by about
   20 mm. **Cited from memory and not verified from this machine.** Flagged rather than
   dressed up, per `development-process.md` §8.
2. **Apple HIG 44 pt and Material 48 dp** are adult minima. 72 exceeds them by 64% / 50%.
3. The literacy-designer independently arrived at **72 dp** from a different direction
   (`literacy-vi.md` §8.2). Two routes to the same number is the strongest evidence available
   here.

**The number that actually matters is 11.4 mm, and it is checkable with a ruler on the
device.** That is a Tier-5 item, and it is the honest check.

**Spacing matters as much as size.** `gap ≥ 10 pt`, and the hit rect extends **6 pt** beyond
the visual tile on all sides but is clipped so that **no two hit rects ever overlap** — half
the gap, at most. A fat finger landing between two tiles resolves to the nearer centre, never
to both.

### 4.6 Tablet buys size, never count

`literacy-vi.md` §8 and `literacy-en.md` §6 cap the palette at **6 per Vietnamese row** and
**8 in English**. Those caps are **cognitive, not spatial** — they are about what a
4-year-old can scan and hold, and a 10-inch screen does not change his working memory.

**The caps do not grow on a tablet, in any orientation, ever.** The extra room goes into
`tile` (up to 116) and `frameH` (up to 620), both capped so a tablet does not become absurd.
I have no disagreement with the literacy-designer's numbers and am not quietly overriding
them.

---

## 5. The visual system

Owner brief, verbatim: **"bright and fun. Don't use depressing color/design."** Nothing is
carried over from wildlife-shuffle. There is **no dark theme** — a 4-year-old does not need
one, it would double the contrast work, and a dark ground behind a photograph fights the
photograph.

### 5.1 Tokens — nothing is hardcoded

**A colour literal in a component is a bug.** It will be right in one theme and wrong in two.
Every component reads from the active theme's token set. The sets below are the verified
output of `node tools/theme-contrast.mjs --tokens`.

| Token | Popsicle *(default)* | Sunshine | Playground | Used for |
|---|---|---|---|---|
| `ground` | `#E9FBF2` | `#FFF7EA` | `#E6F3FF` | the play surface |
| `groundAlt` | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` | parent surfaces |
| `surface` | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` | cards, the word plate |
| `tileFace` | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` | **every tile's face, every theme** |
| `tileGlyph` | `#2A2F3A` | `#332B24` | `#22303D` | **every tile's letter** |
| `ink` | `#2A2F3A` | `#332B24` | `#22303D` | primary text |
| `inkSoft` | `#5A6272` | `#6B5E52` | `#526475` | caption strip, secondary text |
| `role1` | `#E8366F` watermelon | `#EF5B25` sunset | `#1E6FD9` blue | **onset** / EN **consonant** |
| `role1Edge` | `#E8366F` | `#EF5B25` | `#1E6FD9` | its 2 pt outline |
| `role1Deep` | `#7A1837` | `#862F10` | `#09336A` | its 1.5 pt keyline, its chip label |
| `role1Soft` | `#E9DFE0` | `#FDE1CE` | `#CAE1FA` | the band tint behind that row |
| `role2` | `#6B46E5` grape | `#1189B8` lagoon | `#F2701D` orange | **rime** / EN **vowel** |
| `role2Edge` | `#6B46E5` | `#1189B8` | `#DF671A` | |
| `role2Deep` | `#331F76` | `#054661` | `#8C3E0C` | |
| `role2Soft` | `#D7E2F0` | `#DEE8E3` | `#E8E1DF` | |
| `role3` | `#0FA36B` green | `#3E9B2F` leaf | `#00937A` teal | **tone** (Vietnamese only) |
| `role3Edge` | `#0FA36B` | `#3E9B2F` | `#00937A` | |
| `role3Deep` | `#045B39` | `#1E5415` | `#004C3E` | |
| `role3Soft` | `#CAEFDF` | `#E4EAD0` | `#C6E6EC` | |
| `reward` | `#FF9F1C` mango | `#FFC400` sun | `#FFC220` yellow | lit segments, confetti, badge |
| `rewardEdge` | `#C87C13` | `#B48900` | `#AF8412` | their outline on the ground |
| `accentFace` | `#6B46E5` | `#D4441E` | `#1E6FD9` | parent primary buttons |
| `neutralFace` | `#888F9E` | `#9A8E80` | `#818C97` | gate dot, empty-cell outline |
| `hairline` | `#D4D5D8` | `#D6D5D3` | `#D3D6D8` | cell divider |
| `veil` | = `ground` | = `ground` | = `ground` | the prompt photo's overlay, α 0.16 → 0 |

**Every `role1/2/3` value is the owner's hex, unchanged.** Nothing was desaturated to make
arithmetic pass — see §5.4 for how that was achieved.

### 5.2 The contrast sweep

`tools/theme-contrast.mjs` sweeps **33 pairs × 3 themes** that can actually co-occur on
screen, with a threshold per *pair type* rather than one global number:

| Type | Threshold | Applies to |
|---|---|---|
| `glyph` | **4.5:1** | the letter he is learning to read. WCAG AAA for large text. |
| `bodyText` | 4.5:1 | parent-facing text. AA normal. |
| `largeText` | 3.0:1 | AA large. |
| `component` | 3.0:1 | silhouettes, outlines, chips, the gate dot, lit segments. |
| `shade` | 1.15:1 | a shading step *inside one object*. Carries no information — the object's silhouette on the ground is separately gated at 3.0. Stated, not smuggled. |
| `decor` | — | hairlines and veils. **Logged separately, never gates.** |

**Result: PASS, 0 failing pairs, all three themes.** Selected measured values (Popsicle):

| Pair | Measured |
|---|---|
| tile glyph — `ink` on `tileFace` | **13.41:1** |
| word-plate glyph | 13.41:1 |
| tile glyph, dimmed state | 11.11:1 |
| onset identity-bar keyline on the tile | 7.86:1 |
| onset tile outline on the ground | 4.25:1 |
| rime tile outline on the ground | 5.38:1 |
| tone tile outline on the ground | 4.23:1 |
| word-plate outline on the ground | 5.71:1 |
| gate dot on the ground | 3.02:1 |
| lit vs unlit frame segment | 6.53:1 |
| lit segment outline on the ground | 3.91:1 |
| celebration badge text | 6.53:1 |
| parent body text | 13.41:1 |
| primary button label | 5.78:1 |

The glyph pair is **13.41 / 13.89 / 13.48** in the three themes — near-identical, by
construction, so **no theme makes reading harder than another.** That was the point of §5.4.

### 5.3 The sweep is a gate, not a report

It runs in CI and in the Tier-2 suite. Per `development-process.md` §5 — *never trust a green
check you have not seen fail* — the tester must inject a fault before relying on it:
change one `role*` hex to a near-ground pastel and confirm the run exits 1 naming that pair.
It did exactly that during design: the first version of this palette failed **21 pairs**, and
that failure is what produced §5.4.

### 5.4 The tile — where the colour goes, and why

The first version put the glyph *on* the role colour. To reach 4.5:1 it had to darken the
owner's hues onto a lightness ladder, which turned watermelon into `#931E44` and sunset into
`#893110`. That passes the sweep and **fails the brief.** The fix was to move the colour, not
to dull it.

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

- **~31% of the tile's area is the owner's saturated colour**, undarkened, on every tile.
- **The letter is on white at 13.4:1**, the best contrast available, identical in all themes.
- **The bar's inner edge is a `roleDeep` keyline**, so a bright hue never has to be dulled to
  make its own boundary read (`role2Deep on tileFace` ≥ 5.79:1 in every theme).
- The tile reads as a **toy block** — a coloured cap, a white face, a coloured base.

### 5.5 Role colour does work — and a second, non-colour channel does it too

Vietnamese has three tile types. Each carries a fixed **slot**, and the slot's meaning is
constant across all three themes even though the hex changes:

| Slot | Means | Bar pattern | Popsicle | Sunshine | Playground |
|---|---|---|---|---|---|
| `role1` | **onset** (âm đầu) / EN **consonant** | `solid` ▓▓▓▓▓▓ | watermelon | sunset | blue |
| `role2` | **rime** (vần) / EN **vowel** | `split` ▓▓ ▓▓ | grape | lagoon | orange |
| `role3` | **tone** (thanh) | `dotted` ▓ ▓ ▓ | green | leaf | teal |

**The bar pattern is the point.** Role is carried by three redundant channels: the pattern,
the fact that the Vietnamese band shows exactly one role at a time (`gameplay.md` §2.1), and
colour. Colour is the *redundant* one.

That is what lets the sweep gate hard on normal-sighted separation (ΔE00 ≥ 25, all pairs pass
— lowest 32.8) while treating **CVD separation as a printed diagnostic rather than a gate**.
The diagnostic names its own weakest cases, which are real and are accepted knowingly:

```
Popsicle: onset vs tone under deuteranopia = 1.59
Sunshine: onset vs tone under deuteranopia = 8.58
Sunshine: onset vs tone under protanopia   = 10.26
```

Popsicle's watermelon/green pair cannot be separated under red-green CVD by any slot
assignment — that is a property of two hues the owner chose by eye and liked. Darkening one
until the number passed would trade a real property (*bright and fun*) for a redundant one.
**Playground is red-green safe** (worst-case 18.1) and is the recommendation if the child
ever turns out to be colour-blind. That is a one-tap change on the album page.

### 5.6 English has two tile types, not one — the asymmetry is removed

The brief asked me to justify or remove English using a single hue while Vietnamese uses
three. **Removed.**

`literacy-en.md` §3.2 *requires* vowel tiles to be visually distinct from consonants. So
English has two tile types, and it uses the same two slots Vietnamese uses for its first two:

- consonant → `role1`, solid bar
- vowel → `role2`, split bar
- `role3` is **never rendered in English mode**

One token system, one meaning discipline, colour doing work in both languages. And `a` in
`cat` wears the same slot as the rime `eo` in `mèo` — both are the nucleus of the syllable,
which is a true correspondence rather than a coincidence.

### 5.7 The theme picker

**Three unlabelled colour buttons, 56 pt, on the first-launch chooser** — accepted as
recommended. Each is a rounded square showing that theme's `ground` with its three `role`
hues as a solid / split / dotted bar across it, so the button *is* a sample of the thing it
selects. No text, no name, instantly reversible, non-destructive.

**Extended in one place:** the same three buttons, at 44 pt, sit in the **bottom-left of the
album page**. The launch chooser is shown once, so without this he could never change his
mind; the album page is a rest moment between pages where nothing is interrupted; and letting
a 4-year-old choose his own colours is a real piece of ownership. A row in the parent menu
mirrors it for completeness.

Persisted in **AsyncStorage — settings only.** Content goes to the filesystem, never here.

---

## 6. Typography

**Baloo 2** for tiles, the word plate and the album. **Be Vietnam Pro** for the caption strip
and every parent surface. Both bundled; **the system font is never used for Vietnamese
text.** On Android the OEM font varies, and a dropped or flattened tone mark is a
*correctness* failure here, not a cosmetic one — `mả` and `mã` differ by nothing else.

### 6.0 Fredoka was rejected, and how

`decisions.md` originally named **Fredoka** for tiles. It cannot be used. Measured here with
`fontTools` against the upstream `google/fonts` release, not inferred from a subset
declaration:

```
font          coverage   missing
Fredoka         35/90        55    Ăă Đđ ĩ ũ Ơơ Ưư ạ ả ấ ầ ẩ ẫ ậ ắ ằ ẳ ẵ ặ ẹ ẻ ẽ ế ề ể ễ ệ
                                   ỉ ị ọ ỏ ố ồ ổ ỗ ộ ớ ờ ở ỡ ợ ụ ủ ứ ừ ử ữ ự ỳ ỵ ỷ ỹ
```

Its `latin-ext` covers `U+1E00–1E9F` and `U+1EF2–1EFF` and **skips `U+1EA0–U+1EF1`**, which
is where most Vietnamese precomposed letters live. The failure lands exactly on the pair the
gate below was written to catch: **`ã` is U+00E3 and exists in Fredoka; `ả` is U+1EA3 and does
not.** `mã` would render in Fredoka and `mả` in whatever the OS substituted — two words that
differ only by a tone mark, differing by *typeface*. `hổ`/`hô` is the same failure and both
are live in the seed list.

**This is the Q-series gate working, one slice early.** Recorded rather than quietly
corrected, because the pattern is the point (`development-process.md` §6): a declared subset
is a claim, and the claim was wrong.

### 6.0.1 How Baloo 2 was chosen

Five faces with a real `vietnamese` subset were downloaded from the upstream `google/fonts`
repository and **measured**, not compared by reputation. Full script output is reproducible;
the numbers below are what it printed.

| Face | Coverage (90-char fixture) | Vertical ink span | `a` | `g` | `mả`/`mã` differing px @116 pt |
|---|---|---|---|---|---|
| **Baloo 2** | **90/90** | **1.017 em** (tightest) | **single-storey** | **single-storey** | **935** (largest of the infant-form faces) |
| Quicksand | 90/90 | 1.071 em | single-storey | single-storey | 365 |
| Nunito | 90/90 | 1.001 em | single-storey | single-storey | 456 |
| Comfortaa | 90/90 | 1.268 em | single-storey | single-storey | 745 |
| Be Vietnam Pro | 90/90 | 1.189 em | *double-storey* | single-storey | 663 |
| ~~Fredoka~~ | **35/90** | — | — | binocular | **cannot render `ả`** |

All five draw every below-mark and above-mark correctly (checked as ink extents: `ộ` must
sit lower than `ô`, `ế` higher than `ê` — 8/8 and 6/6 for every candidate).

**Baloo 2, on four grounds, in order of weight:**

1. **Single-storey `a` and `g`.** These are the letterforms a child is taught to write and
   the ones his first readers are set in. This is a letter-teaching app, so it is the first
   criterion, not a preference. It rules out Be Vietnam Pro for *tiles* — which is why Be
   Vietnam Pro stays where it is best, as the text face.
2. **It is the heaviest of the infant-form candidates.** A tile glyph is one large lowercase
   letter on a white face; weight is what makes it read as a *block letter* rather than a
   thin line, and it is what makes "bright and fun" work at 36 pt. Quicksand and Nunito are
   wispy by comparison at equivalent optical weight.
3. **Tightest vertical span, 1.017 em** — measured. Stacked marks sit closest to the letter,
   so less of a tile's height is spent on headroom and the letter itself is larger inside the
   same tile. At a 72 pt tile that is real.
4. **Largest minimal-pair margin of the three infant-form faces** — 935 differing pixels on
   `mả`/`mã` against Quicksand's 365. Its marks are large and unambiguous, which is the whole
   game in Vietnamese.

Comfortaa was rejected for a 1.268 em span and a low x-height — the worst combination for a
glyph that must fill a fixed square.

**Bundle cost, measured.** The upstream Baloo 2 variable font is 683 KB because it carries
Devanagari. Subset to Latin + the Vietnamese block with `pyftsubset`, it is **117 KB** and
still scores 90/90 coverage and 935 on `mả`/`mã`. **Ship the subset, not the family.** 117 KB
against the ~8 MB asset budget (`spike-results.md`) is nothing.

### 6.1 The render gate — verified, not assumed

Before either font ships, it must pass a render test. This is a **Tier-2 blocking gate**, and
it fails the build, not a review comment.

Fixture string (lives in the repo, 90 characters plus the seed-list strings):

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
| T1 | every codepoint renders — no `.notdef` box, no blank |
| T2 | nothing is drawn by a fallback font (the rendered face is the bundled one) |
| T3 | **the minimal pairs differ.** `mả`/`mã`, `hổ`/`hô`, `ả`/`ã`, `ẻ`/`ẽ`, `ỏ`/`õ`, `ủ`/`ũ`, `ỷ`/`ỹ` rendered separately and diffed must differ by **≥ 200 pixels at 116 pt** and **≥ 40 pixels at 36 pt**. Two thresholds because the count scales with render size — one number would be either vacuous at 116 pt or unpassable at 36 pt. Measured for Baloo 2: **935 and 53**. The failure this separates is "the mark is not drawn", which scores ~0 at either size. |
| T4 | no glyph's ink exceeds the 1.55 em box (§6.3) — nothing clips, above or below |
| T5 | stacked forms `ươ ề ộ ẫ ặ ỡ ỹ` render as single composed glyphs, not base + floating mark |

**Baloo 2 passes T1, T2, T3 and T5 as measured in §6.0.1.** T4 is checked against the box in
§6.3. The gate stays in place anyway: it is what caught Fredoka, it must run against whatever
is actually bundled, and a font can change under a dependency bump. If the bundled face ever
fails, the tile face falls back to **Be Vietnam Pro**, which is drawn for Vietnamese and is
already bundled, losing only the single-storey letterforms.

### 6.2 What Baloo 2 buys that Fredoka would have cost

Fredoka's `g` is **binocular** and its `a` double-storey. The replacement is better on exactly
the axis that matters most for this app: **Baloo 2's `a` and `g` are single-storey**, the
letterforms a child is taught to write and the ones used in early readers. What was recorded
as an accepted cost is now a gain. The one thing lost with Fredoka is its specific rounded
character; Baloo 2 is rounded and chunkier, which suits a tile better.

### 6.3 Vertical metrics — marks above *and* below

Vietnamese stacks diacritics both ways. `ộ` is circumflex above **plus** dot below; `ỹ` is
tilde above **plus** a descender. Metrics that look fine in English clip both ends.

**Measured** from the bundled outlines with `fontTools`, not estimated:

| | Baloo 2 (tiles) | Be Vietnam Pro (text) |
|---|---|---|
| highest ink, and which glyph | **+0.815 em** (`ẵ`) | +0.949 em (`ổ`) |
| lowest ink, and which glyph | **−0.202 em** (`g`) | −0.240 em (`ộ`) |
| **worst vertical ink span** | **1.017 em** | **1.189 em** |
| minimum box at +12% breathing | 1.14 em | 1.33 em |

**The box stays at 1.55 em anyway**, for both faces and both languages. That is 52% headroom
over Baloo 2 and 30% over Be Vietnam Pro, and the reason to keep it is the situation this
document is in right now: **the typeface changed after the metrics were written.** A box
tuned to one font's outlines is a box that clips when the font is replaced. 1.55 em also
survives an OS-level fallback, which is the case where the metrics are not ours at all.
Tightening it to 1.40 would buy `tileFont` exactly **+1 pt** at the 72 pt floor (36 → 37,
where `tile × 0.52` then binds) — not worth a re-run, let alone a clipping risk.

**Rule, applied in both languages so a mode switch can never clip:**

```
glyphBox  = 1.55 * fontSize
baseline  = 1.19 * fontSize  from the top of the box
lineHeight (parent text) = 1.55 * fontSize, minimum 1.45
```

The layout law derives `tileFont` and `plateFont` from this directly (§4.2), which is why F6
and F7 exist. Worked: a 116 pt tile → `tileFont` 60 → box 93 pt inside a 116 pt tile, 11 pt
clear top and bottom. A 72 pt tile → `tileFont` 36 → box 56 pt, 8 pt clear.

Multi-character tiles (`ngh`, `ăng`, `uôi`, `sh`, `ck`) shrink to fit **82% of the tile
width**, floor 24 pt (F7). They never shrink vertically — the box stays 1.55 em.

### 6.4 Type scale

| Role | Face | Size | Line |
|---|---|---|---|
| Tile glyph | Baloo 2 SemiBold (wght 600) | `tileFont` = 36–60 | 1.55 em |
| Word plate | Baloo 2 SemiBold (wght 600) | `plateFont` = 48–83 | 1.55 em |
| Caption strip | Be Vietnam Pro Regular | `0.42 × tile` = 30–48 | 1.55 em |
| Mode title (top bar) | Be Vietnam Pro Medium | 13 | 18 |
| Parent screen title | Be Vietnam Pro SemiBold | 24 | 32 |
| Parent body | Be Vietnam Pro Regular | 17 | 26 |
| Parent secondary | Be Vietnam Pro Regular | 15 | 23 |
| Button label | Be Vietnam Pro SemiBold | 18 | 24 |
| Gate operands | Be Vietnam Pro Medium | 28 | 42 |

Parent surfaces honour Dynamic Type / font scale up to **2.0×**. **Child surfaces do not
scale** — the glyph must fill a tile whose size is a motor constant, and a scaled glyph would
either clip or shrink the tile. Stated as a deliberate exception in §12.

---

## 7. Screen: Ghép Chữ (Vietnamese)

Target `mèo` = `m` | `eo` | huyền. Stage 3, 4 onsets. iPad 11" portrait: tile 116, gap 17,
row 382, plate 146, frame 758 × 620.

```
┌──────────────────────────────────────────────────────────────┐
│▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔│ 4pt role1 rule
│ Ghép Chữ                  ● ● ○ ○ ○                      ◔   │ 36pt top bar, on the ground
├──────────────────────────────────────────────────────────────┤
│ ╭───┬────────────────────────────────────────────────┬─────╮ │  frame, 758x620
│ │ 1 │                                                │  3  │ │  border in 3 segments,
│ ├───┤                                                ├─────┤ │  one per cell, unlit
│ │   │        [ photograph of a cat ]                 │     │ │
│ │   │        under a 16% `veil`                      │     │ │
│ │ 2 │                                                │     │ │
│ ╰───┴────────────────────────────────────────────────┴─────╯ │
│        ┌──────────────┬───────────────────────────┐          │  word plate, 146 tall,
│        │              ┊                           │          │  overlapping the frame
│        │      ·       ┊             ·             │          │  by 61pt
│        └──────────────┴───────────────────────────┘          │
│                          mèo                                 │  caption strip (for her)
│                                                              │
│      ╭────────────────────────────────────────────────╮      │
│      │ ▓▓▓▓▓▓  ▓▓▓▓▓▓  ▓▓▓▓▓▓  ▓▓▓▓▓▓                  │      │  band, role1Soft tint
│      │ ┌────┐  ┌────┐  ┌────┐  ┌────┐                  │      │  solid bars = onsets
│      │ │ m  │  │ b  │  │ ch │  │ th │                  │      │  116pt tiles
│      │ └────┘  └────┘  └────┘  └────┘                  │      │
│      ╰────────────────────────────────────────────────╯      │
└──────────────────────────────────────────────────────────────┘
```

### 7.1 The band morphs — onset → rime → tone

Exactly one role is on screen at a time (`gameplay.md` §2.1). The band never changes size or
position; its contents cross-fade.

```
  ┌─ he taps `m` ────────────────────────────────────────────────┐
  │  `m` flies into the onset cell. The band cross-fades to the   │
  │  RIME row: tint role1Soft -> role2Soft, bars solid -> split.  │
  └───────────────────────────────────────────────────────────────┘
      ┌────┐  ┌────┐  ┌────┐  ┌────┐
      │ eo │  │ o  │  │ a  │  │ âu │        rimes, split bars, role2
      └────┘  └────┘  └────┘  └────┘
  ┌─ he taps `eo` ───────────────────────────────────────────────┐
  │  `eo` flies into the rime cell.  The band cross-fades to the  │
  │  TONE row -- and the tone tiles are THE CHOSEN RIME, MARKED.  │
  └───────────────────────────────────────────────────────────────┘
      ┌────┐  ┌────┐  ┌────┐         ┌────┐  ┌────┐  ┌────┐
      │ eo │  │ èo │  │ éo │         │ ẻo │  │ ẽo │  │ ẹo │    dotted bars, role3
      └────┘  └────┘  └────┘         └────┘  └────┘  └────┘    (3+3, perLine=3)
```

This is `literacy-vi.md` §5.4 delivered as a transition rather than a second widget: he
watches the row he was just looking at put on six different hats. Three consequences:

- **There is never an inert row on screen.** §5.4's "the tone row is dim until a rime is
  chosen" is satisfied by the tone row not existing yet. The dead-tap failure is designed out.
- **A stop-final rime produces a 2-tile tone row** (`literacy-vi.md` §5.2) and the band simply
  shows two fat 116 pt tiles. The palette gets *simpler* exactly where the structure gets
  harder, for free.
- **Reversal is free.** Tapping the seated rime in the plate cross-fades the band back to
  rimes; tapping the seated onset cross-fades back to onsets.

### 7.2 The word plate

Two cells, divided by a 1 pt `hairline`. The onset cell is `0.32 × plateW`, the rime cell the
rest. Each cell carries a 5 pt underline in its role colour, so the plate states the structure
of a Vietnamese syllable even when empty.

```
  empty        ┌──────┬────────────────┐      cells dashed 2pt neutralFace
               │  ·   ┊       ·        │      a single centred dot each
               └━━━━━━┴━━━━━━━━━━━━━━━━┘      5pt role1 / role2 underlines

  onset in     ┌──────┬────────────────┐
               │  m   ┊       ·        │      glyph in ink on surface, 13.4:1
               └━━━━━━┴━━━━━━━━━━━━━━━━┘

  rime in      ┌──────┬────────────────┐      the rime cell's underline switches to
               │  m   ┊      eo        │      role3 once the tone row is live
               └━━━━━━┴━━━━━━━━━━━━━━━━┘

  tone in      ┌──────┬────────────────┐
               │  m   ┊      èo        │
               └━━━━━━┴━━━━━━━━━━━━━━━━┘

  resolving    ┌───────────────────────┐      hairline dissolves, glyphs slide together
               │         mèo           │      chant step 3 -> 5
               └━━━━━━━━━━━━━━━━━━━━━━━┘
```

**Zero-onset rounds** (`ong`, `áo`): the plate has **one cell, full width**, and the onset row
is never rendered. The shape of the screen is the instruction; there is no `∅` tile to press.

### 7.3 The frame's segment border

The frame's border is divided into **N segments**, N = the number of cells this round (2 or 3
in Vietnamese, 2–4 in English). Each is a rounded 6 pt bar along one edge.

| State | Render |
|---|---|
| unlit | `ink` at 14% over the photo's edge |
| lit | `reward` fill + 2 pt `rewardEdge` outline (3.9:1 on the ground, 6.5:1 against unlit) |

Segment *i* lights when cell *i* is filled **correctly**. Simultaneously the `veil` steps down
by `0.16 / N`. The picture literally gets brighter as he works — readable across a room, with
the sound off, in one glance.

---

## 8. Screen: Word Blocks (English)

Target `cat`. Stage 3, 6 tiles. iPhone 15: tile 108, gap 16, row 356, plate 136, frame
357 × 358.

```
┌──────────────────────────────────────────────┐
│▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔│
│ Word Blocks        ● ● ○ ○ ○            ◔    │
├──────────────────────────────────────────────┤
│ ╭──┬──────────────────────────────┬────┬───╮ │
│ │1 │                              │ 2  │ 3 │ │  3 border segments
│ ├──┤    [ photograph of a cat ]   ├────┼───┤ │
│ │  │                              │    │   │ │
│ ╰──┴──────────────────────────────┴────┴───╯ │
│      ┌───────┐ ┌───────┐ ┌───────┐           │  3 slots, 0.94*tile wide,
│      │   ·   │ │   ·   │ │   ·   │           │  plateH tall, gap 6
│      └━━━━━━━┘ └━━━━━━━┘ └━━━━━━━┘           │  underline = that slot's
│                   cat                        │  expected role colour
│                                              │
│   ╭────────────────────────────────────────╮ │
│   │ ▓▓▓▓▓  ▓▓ ▓▓  ▓▓▓▓▓                    │ │  mixed roles in one band,
│   │ ┌────┐ ┌────┐ ┌────┐                   │ │  so the tint is `ground`,
│   │ │ c  │ │ a  │ │ t  │                   │ │  not a role tint
│   │ └────┘ └────┘ └────┘                   │ │
│   │ ┌────┐ ┌────┐ ┌────┐                   │ │  `a` has a SPLIT bar in role2
│   │ │ h  │ │ b  │ │ r  │                   │ │  (vowel); the rest are SOLID
│   │ └────┘ └────┘ └────┘                   │ │  in role1 (consonant)
│   ╰────────────────────────────────────────╯ │
└──────────────────────────────────────────────┘
```

Differences from Vietnamese, all structural:

| | |
|---|---|
| Slots | 2–4, shown as separate sockets. **The socket count is the word's length** — a real, soundless, textless clue. |
| Band | one tray, all tiles at once, up to 8. Mixed roles, so the band tint is `ground`. |
| Ordering | none. A tap fills the **leftmost empty** slot; if all are full it replaces the leftmost and that tile walks home. |
| Role colours | two of three. `role3` never appears. |
| Chant | tile `short` clips left to right, then the whole word (`gameplay.md` §5.2). |

`egg` (2 tiles) and `ant` (no onset) get 2 and 3 sockets respectively; `frog` gets 4. The
layout law handles all of them because slot count is an input, not a constant.

---

## 9. Component states

Every state, drawn. `t` = `tile`.

### 9.1 Tile, in the band

```
 rest          pressed           breathing(hint)      steady hint       flying
 ┌──────┐      ┌────┐            ┌──────┐             ┌══════┐          ┌──────┐
 │▓▓▓▓▓▓│      │▓▓▓▓│  0.92x     │▓▓▓▓▓▓│ α 1→.55→1   ║▓▓▓▓▓▓║ 3pt      │▓▓▓▓▓▓│  0.92→1.06
 │  m   │      │ m  │  base bar  │  m   │ scale 1→1.05║  m   ║ reward   │  m   │  →1.0
 │▓▓▓▓▓▓│      │▓▓▓▓│  hidden    │▓▓▓▓▓▓│ 1200/1600ms ║▓▓▓▓▓▓║ rim      │▓▓▓▓▓▓│
 └──────┘      └────┘            └──────┘             └══════┘          └──────┘
 base bar      translateY +3     see 10.7             see 10.7          260ms, 10.2
 0.13t         (the block is
                pressed down)
```

There is **no disabled state and no empty state** for a tile. A tile in the band is always
pressable; a tile that has been seated is simply not in the band.

### 9.2 Cell / slot

```
 empty              filled, unlit        filled, LIT          resolving         revealing
 ┌╌╌╌╌╌╌┐           ┌──────┐             ┌──────┐             ┌──────┐          (merged into
 ╎  ·   ╎           │  m   │             │  m   │             │  m   │           one word,
 └╌╌╌╌╌╌┘           └──────┘             └──────┘             └──────┘           see 10.4)
 2pt dashed         ink glyph            ink glyph            glyph cross-
 neutralFace        solid surface        + that frame         fades to gold
 3.25:1             13.4:1               segment is lit       over 160ms
 centred dot                             + veil steps down    and lifts 1.12x
```

**There is no "wrong" cell state.** A filled-but-not-correct cell looks exactly like a
filled-and-correct one *minus* the lit segment and the brightening. The difference is the
reward, not a mark. No red, no grey-out, no X, anywhere in this app.

### 9.3 The plate / slot row

```
 empty        → building       → assembled, not a word      → assembled, IS a word
                                  ┌──────┬────────┐            ┌────────────────┐
                                  │  b   ┊  eo    │            │      mèo       │
                                  └──────┴────────┘            └────────────────┘
                                  rocks +-4pt x3, 520ms        merges, gold, chant
                                  reads the parts back,        then the reveal
                                  unlit tiles fly home
                                  140ms apart
```

### 9.4 The picture frame

```
 prompt                    partial (1 of 3 lit)       resolved / revealing
 ╭─┬───────────┬─┬─╮       ╭█┬───────────┬─┬─╮        full-bleed, veil 0,
 │ │  photo    │ │ │       │█│  photo    │ │ │        a DIFFERENT photo of the
 │ │  veil .16 │ │ │       │█│  veil .107│ │ │        same word, light sprite,
 ╰─┴───────────┴─┴─╯       ╰█┴───────────┴─┴─╯        8 confetti, word spoken
 all segments unlit        segment 1 = reward          see 10.6
```

### 9.5 Top bar (36 pt, on the ground, above the frame)

```
 ┌───────────────────────────────────────────────────────────────┐
 │ Ghép Chữ              ● ● ○ ○ ○                          ◔    │
 └───────────────────────────────────────────────────────────────┘
   13pt inkSoft          page rail: 5 dots, 10pt,          gate dot,
   mode title            8pt gap; filled = inkSoft,        32pt, neutralFace
   (leak detector)       empty = inkSoft @ 22%             @ 30%, 3.02:1
```

The gate dot is the **only** non-play affordance on the game screen, it is the smallest
target in the app, and on a flat tablet it is the point furthest from a seated child's hands.
All three properties are deliberate.

### 9.6 Album page, end screen, chooser

```
 ALBUM PAGE (after 5 rounds)            END SCREEN (parent ended it)
 ┌──────────────────────────┐           ┌──────────────────────────┐
 │ Ghép Chữ              ◔  │           │ Ghép Chữ              ◔  │
 │  ┌──────┐   ┌──────┐     │           │  ┌────┐ ┌────┐ ┌────┐    │
 │  │ pic1 │   │ pic2 │     │           │  │    │ │    │ │    │    │  everything made
 │  └──────┘   └──────┘     │           │  └────┘ └────┘ └────┘    │  this session,
 │  ┌──────┐   ┌──────┐     │           │  ┌────┐ ┌────┐           │  still, α 0.7
 │  │ pic3 │   │ pic4 │     │           │  │    │ │    │           │
 │  └──────┘   └──────┘     │           │  └────┘ └────┘           │
 │       ┌──────┐           │           │                          │
 │       │ pic5 │           │           │      (no play control)   │
 │       └──────┘           │           │                          │
 │ ◐◑◒        ┌────────┐    │           └──────────────────────────┘
 │ theme      │   ▶    │    │             Returning to play needs the gate.
 │ buttons    └────────┘    │             THIS is how a parent ends a session.
 └──────────────────────────┘
   44pt each   photo-shaped card
               with a play chevron
```

Album grid: 2+2+1 in portrait, 3+2 in landscape. Each picture is tappable — it replays its
word and bounces 1.04×.

```
 FIRST-LAUNCH CHOOSER  (the one screen showing both languages)
 ┌──────────────────────────────────────┐
 │                                      │
 │   ┌──────────────────────────────┐   │  Each panel: that mode's role1 as a
 │   │        Ghép Chữ              │   │  wide band, the title in Baloo 2 32pt.
 │   │   Tiếng Việt                 │   │  Tap -> expands, speaks `mèo`, reveals
 │   └──────────────────────────────┘   │  a confirm button. TWO touches, seconds
 │   ┌──────────────────────────────┐   │  apart, so a toddler cannot commit by
 │   │        Word Blocks           │   │  accident.
 │   │   English                    │   │
 │   └──────────────────────────────┘   │
 │                                      │
 │          ◐      ◑      ◒             │  three 56pt theme buttons, unlabelled;
 │                                      │  each shows its ground + solid/split/
 └──────────────────────────────────────┘  dotted bars in its three role hues
```

### 9.7 Parental gate

```
 ┌──────────────────────────────────────┐
 │  ←                    Ghép Chữ       │
 │                                      │
 │        Nhập kết quả                  │  24pt Be Vietnam Pro SemiBold
 │                                      │
 │        bảy nhân sáu                  │  28pt Medium, operands 3-9 x 3-9,
 │                                      │  re-randomised every open
 │        ┌──────────────────┐          │
 │        │       42         │          │
 │        └──────────────────┘          │
 │        ┌────┬────┬────┐              │
 │        │ 1  │ 2  │ 3  │              │  56pt keys
 │        ├────┼────┼────┤              │
 │        │ 4  │ 5  │ 6  │              │  3 wrong -> 30s cooldown,
 │        ├────┼────┼────┤              │  keypad disabled, a countdown
 │        │ 7  │ 8  │ 9  │              │  shown
 │        ├────┼────┼────┤
 │        │ ⌫  │ 0  │ ✓  │
 │        └────┴────┴────┘
 └──────────────────────────────────────┘
```

Opened by a **1.2 s press-and-hold** on the gate dot. The hold stops the accidental open; the
gate stops the intentional one. It needs reading and multiplication and **nothing
remembered** — a PIN set today is a PIN forgotten in three months.

---

## 10. Motion

### 10.1 The law: transform and opacity only

**The stack has no Reanimated and no gesture-handler.** Every animation in this document is
expressible in React Native's built-in `Animated` with `useNativeDriver: true`, which means:

> **Nothing animates layout, colour, width, height, border, shadow or text content.
> Everything is `transform` (translateX/Y, scale, rotate) or `opacity`.**

That is a hard rule and it is **auditable statically in Tier 1** — grep for an `Animated`
driver on a non-transform property. Per `development-process.md` §5, a property that differs
between `.native` and `.web` should be audited structurally rather than tested behaviourally,
and this is one.

Consequences, spelled out so the developer does not have to rediscover them:

| Effect | How, under the law |
|---|---|
| the picture brightens | a `veil` View of `ground`, **opacity** 0.16 → 0 in N steps |
| a frame segment lights | a `reward` View stacked over the unlit one, **opacity** 0 → 1 |
| a glyph goes gold during the chant | two stacked `Text` layers, ink and `reward`, cross-faded by **opacity** |
| the hairline dissolves | **opacity** |
| the band morphs | two absolutely-positioned rows of the same size, cross-faded by **opacity** + 8 pt `translateY` |
| the tone mark drops | the marked form as a second `Text` layer, **opacity** + `scale` 1.8 → 1 + `translateY` |
| the reveal | `scale` + `translate` on the card; no width/height |

**No case in this specification requires Reanimated.** I am not asking for it back.

### 10.2 Easings

| Name | Curve | Used for |
|---|---|---|
| `enter` | `Easing.bezier(0.22, 1, 0.36, 1)` | anything arriving |
| `exit` | `Easing.bezier(0.55, 0, 1, 0.45)` | anything leaving |
| `calm` | `Easing.inOut(Easing.ease)` | breathing, rocking, veils |
| `settle` | `Animated.spring` `{ tension: 180, friction: 14 }` | a tile seating |
| `pop` | `Animated.spring` `{ tension: 300, friction: 11 }` | press release, badge |

### 10.3 The table — duration, curve, and what each one *says*

Animation that does not say anything is noise, and for this player it is noise that teaches
him to ignore the screen.

| # | Motion | Duration | Curve | What it communicates |
|---|---|---|---|---|
| M1 | tile press-in | 70 ms | `exit` | *I felt that.* Fires on touch-**down**, with the sound. |
| M2 | tile press-release | spring | `pop` | the block springs back; nothing was taken from him |
| M3 | tile flight to a cell | 260 ms + 1.06 overshoot | `enter` | *it belongs there now* |
| M4 | cell fill | 140 ms opacity | `calm` | the socket is occupied |
| M5 | segment lights + veil step | 220 ms | `calm` | **that one was right** — the only "correct" signal |
| M6 | band morph (onset→rime→tone) | 280 ms cross-fade, 8 pt rise | `enter` | *same row, new question* — this is the tone lesson |
| M7 | not-a-word rock | ±4 pt × 3, 520 ms total | `calm` | *not yet* — slow, never a fast shake |
| M8 | unlit tiles fly home | 300 ms each, 140 ms stagger | `exit` | *these two are right; keep those* |
| M9 | chant part lift | 320 ms, 1.0→1.12→1.0 + gold | `calm` | *this part is speaking now* |
| M10 | merge (hairline + slide) | 240 ms slide, 180 ms fade | `enter` | *these are one word* |
| M11 | tone mark drop | 260 ms, scale 1.8→1, y −10→0, 14% overshoot | `enter` | *this mark is the thing that changed* |
| M12 | **the reveal** | 1400 ms total, §10.6 | `enter` | *the thing is real, and it is yours* |
| M13 | reveal hold | 1400 → 2200 ms, still | — | the say-it-together beat (§2.3) |
| M14 | round transition | old shrinks into its rail dot 380 ms; new slides in from the right 320 ms | `exit`/`enter` | *that one is kept; here is a new one* |
| M15 | hint breathe | 1200 ms on, 1600 ms off, α 1→.55→1, scale 1→1.05 | `calm` | *this one* — slow, because there is no urgency |
| M16 | auto-place | rise 12 pt 200 ms · hold 160 ms · fly 420 ms | `enter` | *I'll do this one* — slower than his own taps, so it reads as the app |
| M17 | album card arrival | 5 × 320 ms, 90 ms stagger | `enter` | *here is everything you made* |
| M18 | gate-dot hold | ring fills 0→360° over 1200 ms | linear | *keep holding* — the only progress indicator in the app |

### 10.4 The reveal, frame by frame

| t | What |
|---|---|
| 0 | `veil` opacity → 0 (220 ms). A white sprite fires at α 0.22 → 0 over 220 ms. The card begins `scale`+`translate` toward full-bleed. |
| 180 | the photo cross-fades to **a different photograph of the same word** |
| 420 | full-bleed reached. A radial light sprite: `scale` 0.4 → 1.6, α 0.55 → 0, over 520 ms |
| 300–1200 | 8 confetti shapes in `role1`/`role2`/`reward` drift outward and fade |
| 600 | the word is spoken |
| 1400 | motion ends. The word sits large on the picture. **Silence.** |
| 2200 | the word is spoken once more (§2.3) |
| 3000 | M14, unless he is still tapping the picture — each tap replays the word, bounces it 1.04× and resets this timer |

### 10.5 Reduce motion

Follows the OS setting, overridable in the parent menu. When on, **every** animation above
becomes a cross-fade of the **same duration**, so timing, audio sync and the acceptance
criteria are unchanged.

| | Reduced to |
|---|---|
| M1/M2 press | α 1 → 0.8 → 1, no scale |
| M3 flight | 260 ms cross-fade: the tile fades out of the band and into the cell |
| M7 rock | 400 ms α dip to 0.7 — no translation at all |
| M12 reveal | 300 ms cross-fade + the photo swap. **No confetti, no light sprite, no scale.** |
| M15 breathe | α only, no scale |
| M18 gate ring | a static ring that fills in 4 steps |

**Audio is identical in both modes.** That is the point: the audio carries the whole game, so
a child who has turned away, or whose parent has reduce-motion on, loses nothing.

---

## 11. Audio behaviour

### 11.1 Latency budget

**Budgeted against an iPhone 11 / A13 and a 2021 mid-range Android (Snapdragon 690).** Those
are the oldest devices plausibly in this house.

| Event | Budget |
|---|---|
| visual press state | **≤ 1 frame (16.7 ms)** from touch-down |
| tile sound begins | **≤ 60 ms** from touch-**down**, not touch-up |
| chant step boundary drift | ≤ 30 ms |

Achieved by: **every clip for the current round's palette is decoded and resident in memory**
— at most 8 tiles × 2 variants + 6 chant clips ≈ 22 clips ≈ 260 KB — **preloaded during the
previous round's celebration**, which is 1.4 s of dead time that is already paid for.

Sound fires on `onPressIn`. Nothing waits on an animation.

### 11.2 Six taps in four seconds

| Rule | |
|---|---|
| **One channel for tile sounds.** | A new tap **stops the previous clip immediately**. No queue, no overlap. A queue means his sixth tap plays six seconds later, which reads as broken. |
| **Long vs short.** | English `c-long` ("kuh, cat", ~1 s) plays on the **first** touch of that tile in the round. `c-short` ("kuh", ~350 ms) on every touch after — **and always short if any tile was touched in the previous 900 ms.** A burst of six taps is therefore six short clips, ~2.1 s of the 4 s, each audible. |
| **Vietnamese has the same two slots.** | Shipping with `long` = `short` today. If the owner adopts the `"mờ, mèo"` sound-plus-word form (`decisions.md`, open item 2), it is a content change with **no UI change**. |
| **The chant owns a second channel** and cannot be interrupted by tile taps — and tiles are not tappable during the chant anyway. |
| **Hold.** | Holding a tile past 600 ms replays its **short** clip every 700 ms, **up to 6 times**, then stops. The tile stays pressed with M15's breathe so the screen is not frozen. On release nothing is placed — a hold is not a tap. |
| **Placement** = touch-down and touch-up within **600 ms** and within **24 pt** of the start point. |
| **Multi-touch.** | The game is **single-touch**. The first touch owns the gesture; further simultaneous touches are ignored until it ends. Two fingers on two tiles plays one sound and seats one tile. |

### 11.3 Sound events, so the game works with the screen ignored

| Event | Sound |
|---|---|
| tile touched | its own clip |
| tile seated | a 90 ms wooden seat click *(correct placements only — the click is part of the reward)* |
| segment lights | folded into the seat click |
| complete, not a word | the parts read back, then silence. No buzzer. |
| found-word win | a rising two-note chime, then that word's chant |
| reveal | the word, then §2.3's repeat |
| page complete | a four-note phrase, once |
| auto-place (M16) | that tile's clip, at the moment it lands |

**Silent switch.** Audio uses the `playback` category, so the game speaks even when the
ringer switch is silenced. A parent's phone lives on silent and a silent word game is a
broken word game. A mute row exists in the parent menu for the case where she wants quiet.

---

## 12. Accessibility

| | Decision |
|---|---|
| **Reduce motion** | §10.5. OS-driven, parent-overridable. Audio unchanged. |
| **Audio carries the game** | Every state change has a distinct, non-musical sound (§11.3). A tester must be able to play a full round with the screen face-down and know what happened. That is an acceptance criterion, not an aspiration. |
| **No information by colour alone** | Role = colour **+ bar pattern** (§5.5) **+ one row at a time**. Correct = position + a lit segment + a brightening picture + a sound. Nothing anywhere depends on hue. |
| **Contrast** | §5.2. Gated in CI. The glyph he is learning is 13.4:1 in every theme. |
| **Colour-vision deficiency** | Printed diagnostic, honest about Popsicle's weak pair, with **Playground as the red-green-safe theme** and a one-tap switch on the album page. |
| **Dynamic Type** | Parent surfaces scale to 2.0×. **Child surfaces do not** — the tile is a motor constant and the glyph must fill it. Deliberate exception, recorded. |
| **VoiceOver / TalkBack** | The **game screens expose one accessibility element** describing the round ("Build the word. Picture: a cat. Two of three parts placed."). Individual tiles are `accessibilityElementsHidden`. Letting a screen reader speak letter *names* over a game whose entire thesis is letter *sounds* would teach the opposite of the app. **Parent surfaces are fully and conventionally labelled.** |
| **Handedness** | The child's tiles are centred, so handedness does not matter. The gate dot is top-right and the editor's `+` is bottom-right, both adult targets. No mirror mode in v1. |
| **Screen too small** | Below 360 × 600 pt, a parent-facing card. No half-broken game. |

---

## 13. The editor — his mother's product

Reached by: gate dot → 1.2 s hold → gate → parent menu → **Add a word** (row 1) or **Words**.
**Optimised for a phone held in one hand.** On a tablet it renders as a centred **520 pt
column** on `groundAlt`, not a stretched form.

**The app makes no network call, ever, including here.** There is no image search and no TTS
at runtime. Her sources are the camera, her photo library, and her voice.

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
│ ── Chưa chơi được (2) ─────────────────│  a section, not an error list
│ ┌────┐                                 │
│ │ img│  máy bay                    ◐   │
│ └────┘  hai tiếng                      │
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
including before the word is valid, because she will be interrupted by a 4-year-old and
losing her work once ends her willingness to maintain the list — and the app dies with it.

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
   and the one she is standing in front of. "+ thêm ảnh" adds more (image-sourcing.md:
   several per word), and the reveal needs >= 2 (gameplay.md 3.2).

 4. SOUND                              5. PREVIEW
 ┌────────────────────────────┐        ┌──────────────────────────┐
 │  Giọng nói                 │        │  the REAL round, playable │
 │                            │        │  exactly as he will see   │
 │      ┌──────────┐          │        │  it -- frame, plate,      │
 │      │    ●     │          │        │  band, tiles, audio       │
 │      └──────────┘          │        │                          │
 │   giữ để ghi âm (3 giây)   │        │ ┌──────────┐ ┌─────────┐ │
 │                            │        │ │ Đúng rồi │ │  Sửa    │ │
 │   ▁▃▅▇▅▃▁▁▃▅▃▁             │        │ └──────────┘ └─────────┘ │
 │   ▶ nghe lại   ↺ ghi lại   │        └──────────────────────────┘
 │                            │
 │   ○ dùng giọng có sẵn      │  only offered if a shipped clip exists for
 └────────────────────────────┘  this exact word. There is no runtime TTS.
                                 RECORDING IS PRE-SELECTED, because for a word
                                 she is adding there usually is no clip.
```

96 pt record button, hold to record, hard cap 3 s, waveform while recording, instant
playback, re-record unlimited. Her voice is the best audio this app can have
(`spike-results.md`).

### 13.3 When the word does not decompose — the most important editor screen

It **never says "invalid"**, it never blocks the save, and it always offers the fix.

```
 TWO SYLLABLES                          UNKNOWN RIME
 ┌──────────────────────────┐           ┌──────────────────────────┐
 │  máy bay có hai tiếng.   │           │  Tôi biết `ch`.          │
 │  Trò chơi ghép một tiếng │           │  Chưa biết vần `uông`.   │
 │  mỗi lần.                │           │                          │
 │                          │           │  ┌───┐  ch  +  [uông]    │
 │  ┌────────┐ ┌─────────┐  │           │  └───┘                   │
 │  │  máy   │ │   bay   │  │  one tap  │  ┌────────────────────┐  │
 │  └────────┘ └─────────┘  │  each     │  │  Thêm vần `uông`   │  │
 │                          │           │  └────────────────────┘  │
 │  hoặc lưu kèm ảnh + tiếng│           │  hoặc lưu kèm ảnh+tiếng  │
 └──────────────────────────┘           └──────────────────────────┘

 ADD A RIME  (literacy-vi.md 5.4: composition happens ONCE, in front of a human)
 ┌──────────────────────────────────────────┐
 │  vần `uông` — sáu thanh                  │
 │  ┌──────┐┌──────┐┌──────┐                │  the app generates all six,
 │  │ uông ││ uồng ││ uống │                │  greys the illegal ones
 │  └──────┘└──────┘└──────┘                │  (5.2's checked-syllable rule),
 │  ┌──────┐┌──────┐┌──────┐                │  and lets her TAP ANY ONE to
 │  │ uổng ││ uỗng ││ uộng │                │  correct its spelling.
 │  └──────┘└──────┘└──────┘                │
 │  chạm để sửa                             │  Never composed at runtime.
 └──────────────────────────────────────────┘
```

**Nothing recognised at all?** She still saves: picture + sound, flagged, filed under
*Chưa chơi được*. The editor never blocks a save.

### 13.4 Edit, delete, recover

- **Edit**: tap a row → the same five steps as tabs, any one editable, same autosave.
- **Delete**: swipe a row, or a Delete at the foot of the edit screen. Confirmation shows
  **the word and its picture** ("Xoá `mèo`?"), then a **6-second Undo** toast.
- **Recently deleted** holds it for **30 days**, restorable in one tap. She is not a
  developer and a mis-tap must not destroy work.
- **Nothing to remember after three months**: every screen states its purpose in one sentence
  at the top; every step is one question with a picture of the answer; completeness is a dot,
  never a checklist she has to recall.

### 13.5 What the UI needs from the pack

Requirements, not a format — the content-engineer owns the storage.

| # | The UI needs |
|---|---|
| E1 | per word: display spelling; decomposition as **renderable tiles** with a role per tile; `stage`; `enabled` + `disabledReason`; `draft`; `source`. **`meetings` is app state, not pack data** — it is per-child progression and does not belong in a file his mother edits |
| E2 | **≥ 1 image, ideally ≥ 2** (the reveal's photo swap, `gameplay.md` §3.2). Either a **square-normalised source** (the pipeline's 512 × 512 centre crop satisfies this) **or** a **focal point (x, y)**, so a `cover` crop into a 758 × 620 or a 328 × 300 frame never cuts the subject |
| E3 | per word: a whole-word clip; optionally a sentence clip; optionally a toneless-blend clip (Vietnamese chant step 3) |
| E4 | per tile: a `long` and a `short` clip **slot in both languages**, even where they are identical today (§11.2). **Reconcile note:** `content-pipeline.md` §3.1 currently gives `audio.long`/`audio.short` to English letter tiles and only `audio.name` to Vietnamese onset/rime/tone tiles. The UI needs both slots in both languages, so that adopting the `"mờ, mèo"` sound-plus-word form (`decisions.md`, open item 2) is a content change with no UI change. Until then Vietnamese may ship with the two pointing at the same file. |
| E5 | per tile: an **editable audio label string** (`literacy-vi.md` §5.3 — `ngang` vs `không dấu`) |
| E6 | a **rime inventory the editor can append to**, each rime carrying its six toned forms with `null` for the illegal ones |
| E7 | a **draft** record that can hold an invalid word, so §13.2 can autosave after every step |
| E8 | **atomic writes** that survive the app being killed mid-save |
| E9 | a **validator that returns a reason, not a boolean** — "two syllables", "unknown rime `uông`", "nothing recognised" — because §13.3 renders the reason. Satisfied by `content-pipeline.md`'s `disabledReason`; the strings must be renderable to a non-technical adult, not developer diagnostics |
| E10 | an **attribution list** derivable from the pack, for the About screen (`image-sourcing.md`) |
| E11 | **no field on a word entry may reference the other language's pack.** Not a preference — it is the leak defence (`word-list.md` §1). |

---

## 14. Screen inventory

| # | Screen | Audience | Text? | Reached from |
|---|---|---|---|---|
| S1 | First-launch chooser (+ theme buttons) | parent | yes — **the one screen with both languages** | first launch only |
| S2 | **Game board — Ghép Chữ** | child | caption strip only | launch, round end |
| S3 | **Game board — Word Blocks** | child | caption strip only | launch, round end |
| S4 | Reveal / celebration (an overlay on S2/S3) | child | the word, large | resolution |
| S5 | Album page | child | none | after round 5 |
| S6 | End screen | both | none | parent menu → Finish session |
| S7 | Parental gate | parent | yes | 1.2 s hold on the gate dot, anywhere |
| S8 | Parent menu | parent | yes | through S7 |
| S9 | Word list | parent | yes | S8 → Words |
| S10 | Add/edit word, steps 1–5 | parent | yes | S9 → `+`, or S8 → Add a word |
| S11 | Decomposition help | parent | yes | S10 step 3, on failure |
| S12 | Add-a-rime | parent | yes | S11 |
| S13 | Recently deleted | parent | yes | S9 |
| S14 | Voice & pace / Motion & sound / Language | parent | yes | S8 |
| S15 | About & attributions | parent | yes | S8 |
| S16 | Screen-too-small card | parent | yes | viewport < 360 × 600 |

Sixteen screens. Three of them are the child's, and he never navigates between them.
