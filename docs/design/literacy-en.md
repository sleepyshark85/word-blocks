# The English model — CVC phonics

Owner: literacy-designer. Companion to `literacy-vi.md`. Same confidence convention: `high`
means I am confident this is correct; `check` means confirm before hard-coding.

**Revision 5, 2026-09-23 — read §0 first.** The table is the 26-letter alphabet and a digraph
is entered as its letters: `ship` is `s` `h` `i` `p`, four taps and three sounds. **40 of 40
words still build, 5 change their tap sequence, the board loses ten cells, no audio is added
or removed, and the letter-*sounds* decision survives.**

---

## 0. CORRECTION — revision 5. The table is `a`–`z`, and a digraph is two taps and still one sound

**Revision 5, 2026-09-23. Tier 5 — the owner, from playing the built app.** English gets the
same treatment as Vietnamese, for the same reason, and it costs far less here. §§3.3, 6 and
parts of §5 below are superseded. **§2 — tiles carry letter *sounds*, not letter *names* — is
reaffirmed**, and §0.4 answers the new argument against it rather than ignoring it.

Read `literacy-vi.md` §0.1 first for the record of how this was scoped three times. The short
version: he asked for the standard alphabet as the table, and separately confirmed that his
son enters a digraph **by tapping its letters** — *"he will still going through character by
character, event for combine ones like ch, tr …(Choose C and choose H …). This to keep the
table consistent."*

### 0.1 What changes

**English was always letter-by-letter** (§1). Revision 5 changes exactly one thing: the ten
multi-letter tiles `sh ch th ck ng ll ss ff gg zz` stop being **tiles** and are entered as
their letters. They remain **single sounds**, exactly as `literacy-vi.md` keeps `ch` a single
âm đầu.

> `ship` is `s` `h` `i` `p` — four taps, three sounds.
> `duck` is `d` `u` `c` `k` — four taps, three sounds.
> `egg` is `e` `g` `g` — three taps, two sounds.

**This is the cheapest half of revision 5 by a wide margin, and that is not a coincidence.**
English phonics already teaches digraphs by pointing at two letters and saying one sound —
*"s-h says /ʃ/"* is the standard classroom formula. The digraph tile was a convenience, never
a doctrine. Vietnamese has no equivalent formula for `ch`, which is why `literacy-vi.md` §0
is a much longer and less comfortable document than this one.

### 0.2 Measured against the pack

| | Revision 4 | **Revision 5** |
|---|---|---|
| Board | 26 letters + 10 digraphs = **36 cells** | **26 cells, `a`–`z`, one run** |
| Words buildable | 40 of 40 | **40 of 40** |
| Words whose tap sequence changes | — | **5** — `ship` `fish` `duck` `sock` `egg` |
| Letters outside `a`–`z` needed | 0 | **0** |
| Taps per word | 2–4, mean 3.05 | **3–4, mean 3.17** — 33 words at 3, 7 at 4 |
| Decision points | 55 | **59** |
| Live at position 1 | 16 of 36 | **15 of 26** — `a b c d e f h l m n p r s v w` |
| Mean live-set size | 1.71 | **1.66** |
| Exactly one live tile | 40 / 55 = 73% | 44 / 59 = **75%** |
| **Grapheme-boundary ambiguities** | n/a | **0** |
| Dead ends | none | **none** |
| Word that is a proper prefix of another | none | **none** |

One word gains a tap — `egg`, from 2 to 3. It was the only 2-tile word in the pack and it was
an oddity.

**Paging.** Hand-computed from the capacities `tools/layout-sweep.mjs --pages` currently
reports; **re-run it after the packs are rebuilt — these are predictions**:

| Device | cells/page | Revision 4 (36 cells) | **Revision 5 (26 cells)** |
|---|---|---|---|
| Android 360 × 640 (the floor) | 16 | 3 pages | **2 pages** — `13 ¦ 13` |
| iPhone SE 3 375 × 667 | 20 | 3 pages | **2 pages** — `13 ¦ 13` |
| iPhone 15/16 393 × 852 | 24 | 3 pages | **2 pages** — `13 ¦ 13` |
| **iPhone 17 Plus** (his device) | 28 | 2 pages | **1 page, no rail** |
| Every tablet | 36+ | 1 page | **1 page, no rail** |

**On his device English mode becomes a single 26-cell alphabet grid with no page rail at
all.** That is literally the thing he asked for, delivered rather than approximated.

### 0.3 The table — 26 letters, `a`–`z`. One run.

`inventoryOrder` becomes `{ letter: ["a" … "z"] }`; `inventoryOrder.digraph` is deleted.

| # | Tile | Kind | Sound | Key word | Notes |
|---|---|---|---|---|---|
| 1 | `a` | vowel | /æ/ | cat | short only, v1 |
| 2 | `b` | consonant | /b/ | bed | stop — clip it (§2.3) |
| 3 | `c` | consonant | /k/ | cat | hard `c` only, v1. Also the first letter of `ch`, `ck` (§0.5) |
| 4 | `d` | consonant | /d/ | dog | stop |
| 5 | `e` | vowel | /ɛ/ | bed | |
| 6 | `f` | consonant | /f/ | fan | continuant. Also the first letter of `ff` |
| 7 | `g` | consonant | /ɡ/ | dog | hard `g` only, v1. Also the first letter of `gg` |
| 8 | `h` | consonant | /h/ | hat | the **second** letter of `ch`, `sh`, `th` |
| 9 | `i` | vowel | /ɪ/ | pig | |
| 10 | `j` | consonant | /dʒ/ | — | **no seed word; permanently flat** |
| 11 | `k` | consonant | /k/ | duck, sock | live only as the second letter of `ck` in this pack |
| 12 | `l` | consonant | /l/ | leg | continuant. Also the first letter of `ll` |
| 13 | `m` | consonant | /m/ | map | continuant |
| 14 | `n` | consonant | /n/ | net | continuant. Also the first letter of `ng` |
| 15 | `o` | vowel | /ɒ ~ ɑ/ | dog | `en_US-amy` gives the American value |
| 16 | `p` | consonant | /p/ | pig | stop |
| 17 | `q` | consonant | /k/ | — | **permanently flat.** Only ever `qu`; on the board because a missing letter is the inconsistency revision 3 objected to (`gameplay.md` §0A.4) |
| 18 | `r` | consonant | /ɹ/ | rat | continuant |
| 19 | `s` | consonant | /s/ | sun | continuant. Also the first letter of `sh`, `ss` |
| 20 | `t` | consonant | /t/ | cat | stop. Also the first letter of `th` |
| 21 | `u` | vowel | /ʌ/ | bus | |
| 22 | `v` | consonant | /v/ | van | continuant |
| 23 | `w` | consonant | /w/ | web | |
| 24 | `x` | consonant | /ks/ | box | the accepted one-letter-two-sounds exception (§1) |
| 25 | `y` | consonant | /j/ | — | **no seed word; permanently flat** |
| 26 | `z` | consonant | /z/ | — | **no seed word; permanently flat** |

**Four letters — `j`, `q`, `y`, `z` — appear in no `en-seed` word and are never live
anywhere.** Eleven are never live *at position 1* (`g i j k o q t u x y z`) but do appear
later; note `k` is in the first group and not the second — it is live, inside `duck` and
`sock`. Four dead cells in a 40-word pack is not a defect: it is what a fixed alphabet
honestly looks like, it is exactly what revision 3 asked for, and his mother closes it by
adding `jam`, `yak` and `zip` whenever she likes.

For contrast: **all 29 Vietnamese letters appear in at least one `vi-seed` word**, so the
Vietnamese board has no permanently dead cell at all.

### 0.4 Decision: the tiles still carry **sounds**, not letter names

**Decided: sounds. Unchanged. §2 stands in full.** The new argument against it is real and is
answered here rather than left implicit.

*A standard alphabet chart is a naming artefact.* That is what an alphabet chart on a wall is
for; a child points at `c` and an adult says *"see"*. Putting the 26 letters in alphabetical
order on a board and then refusing to say their names looks inconsistent with what the board
is. It loses anyway, for three reasons, in order of weight:

1. **§2.1 does not depend on what the board looks like.** The task is to blend. `/k/ /æ/ /t/`
   blends to *cat*; *"see-ay-tee"* blends to nothing. Names make a tap teach the wrong
   operation, and rearranging the tiles does not change that.
2. **§2.2 is the reason the two modes can share one child.** Vietnamese `c` is `cờ` = /k/ +
   /ɤ/; English `c` as a *sound* is /k/. Same fact, with and without Vietnamese's obligatory
   vowel. English `c` as a *name* is `see`, which shares nothing with `cờ`. Revision 5 makes
   the two boards look more alike than they ever have — 29 letters in order beside 26 letters
   in order — and that similarity is an argument for making the glyph *mean* the same thing
   in both, not against.
3. **The revision-3 audio defect points the same way.** `gameplay.md` §0A.4 requires the tap
   clip to be **≤ 700 ms, ≤ 40 ms lead, ≤ 120 ms tail**. A clipped, unvoiced /k/ meets that
   comfortably; a letter name is a full syllable with a long vowel (and *"double-you"* is
   three) and is harder to land inside the budget, not easier.

**Reversing this costs 26 clip replacements and no code**, because tile audio is per-tile pack
data. It is deliberately left that cheap. `open-questions.md` **Q10** records it with the
recommendation attached — a decision made, not a question dodged.

**Lowercase only (§2.5) is unchanged.** He typed the alphabet in capitals because that is how
one writes an alphabet in a sentence, not as a request for uppercase tiles; uppercase is a
second unrelated grapheme set at no gain. If he does want capitals it is a glyph-casing switch
in the pack, not a literacy change — for the game-designer to *ask*, not to assume.

### 0.5 Grapheme-prefix liveness — the full enumeration

The same question Vietnamese has (`literacy-vi.md` §0.6): a letter can be a complete grapheme
*and* the first letter of a digraph. In `en-seed`:

| Letter | A grapheme on its own? | Digraphs it begins | Live letters after it | What that means |
|---|---|---|---|---|
| `c` | yes, /k/ | `ch`, `ck` | `a` `r` `u` | `k` is **not** live after `c` at position 1 — `ck` is final-only, so no word starts `ck` |
| `f` | yes, /f/ | `ff` | `a` `i` `o` `r` | `ff` has no seed word |
| `g` | yes, /ɡ/ | `gg` | — | `g` is never live at position 1; inside `egg`, `g` after `e` then `g` again |
| `l` | yes, /l/ | `ll` | `e` `o` | `ll` has no seed word |
| `n` | yes, /n/ | `ng` | `e` `u` | `ng` has no seed word |
| `s` | yes, /s/ | `sh`, `ss` | `h` `o` `u` | `h`→`ship`; `o`→`sock`; `u`→`sun` |
| `t` | yes, /t/ | `th` | — | `t` is never live at position 1 in this pack |
| `z` | yes, /z/ | `zz` | — | `z` appears in no seed word |

**Measured: zero grapheme-boundary ambiguities.** Across all 40 words expanded to letters, at
every reachable letter prefix all completing words agree on whether the current letter starts
a new sound or continues one. And **every grapheme-prefix state is itself a grapheme** — there
is no English equivalent of Vietnamese's `ac`/`ăn` pass-through states, so **no new English
audio clips are needed at all**.

**The boundary is stored, not derived** — the same rule as `literacy-vi.md` §0.5. The word
entry's existing `tiles` array *is* the sound decomposition (`duck` = `d` `u` `ck`), and it
stays. The engine walks letters; it reads the sounds from `tiles`.

### 0.6 Decision: digraph completion re-voices, exactly as in Vietnamese

**Every tap speaks, and a tap that completes a digraph speaks the digraph — superseding, not
adding.** The speech channel already cuts hard (`ui.md` §11, revision 3), so this is existing
behaviour, not new machinery.

| He taps | Then taps | Second tap plays | Not | Seed words |
|---|---|---|---|---|
| `s` (/s/) | `h` | **/ʃ/** | /h/ | ship, fish |
| `c` (/k/) | `h` | **/tʃ/** | /h/ | — |
| `t` (/t/) | `h` | **/θ/** | /h/ | — |
| `c` (/k/) | `k` | **/k/** — the same sound again, which is the lesson | /k/ twice | duck, sock |
| `n` (/n/) | `g` | **/ŋ/** | /ɡ/ | — |
| `g` (/ɡ/) | `g` | **/ɡ/** — one sound, not two | /ɡ/ twice | egg |
| `f` `l` `s` `z` | itself | **the same single sound** | it twice | — |

He hears /s/, then /ʃ/. He never hears /s/ **and** /h/. **"s-h says /ʃ/" is the standard
classroom formula**, so this is not a workaround — it is how the thing is taught.

**Position rules move from the palette to the validator.** §3.3's "`ck ll ss ff zz ng` are
final-only" and §3.1's "`x` final-only, `y` initial-only" can no longer be enforced by
withholding a tile, because every letter is always on the board. They are enforced by liveness
over stored spellings — `c` then `k` is dead at position 1 because no word starts `ck` — and
by the validator at save time.

### 0.7 On ordering: English does **not** interleave its digraphs, and Vietnamese does

`en-seed` ships `a…z` then `ch ck ff gg ll ng sh ss th zz` — the alphabet, then the digraphs,
alphabetised among themselves. Vietnamese's onset vocabulary, by contrast, is corrected to
`b c ch d đ g gh gi h k kh …` — each digraph immediately after its base letter
(`literacy-vi.md` §0.13).

**That inconsistency is correct and deliberate.** Vietnamese orthography genuinely treats `ch`
and `ng` as letters of the alphabet and Vietnamese dictionaries sort them that way. English
does not: there is no English convention placing `ch` after `c`, and every English alphabet
chart is exactly 26 letters. **Inserting `ch` after `c` would break the alphabet he asked
for.** So the shipped English order was already right, and revision 5 simply deletes the
trailing run rather than reordering it.

The general principle, worth stating once: **follow each language's own dictionary order.**
That is the only ordering either child or parent can name, and it is what "standard character
table" means in each writing system.

### 0.8 Word families and stages

§5's word families are **unchanged and still the best structure English mode has.** What
changed is what they are for.

| | Was | Now |
|---|---|---|
| Families pick **distractors** (§6.2) | the strongest idea in revision 1's English mode | **gone with the palette.** No target, so no distractors |
| Families shape the **word list** | yes | **yes, and it matters more.** A dense family is what puts several letters on their feet at once |
| Stages 1–7 (§5.2, §6.2) | a ladder the app climbed | **documentation grouping only.** `gameplay.md` §3.6 deleted the stage ladder in revision 3 |

The measurable version: 44 of the 59 decision points show exactly one standing tile, and
nearly all of the other 15 are family branch points — `c a ·` stands `p` and `t` (`cap`,
`cat`); `b a ·` stands `g` and `t` (`bag`, `bat`); `p ·` stands `a`, `e`, `i` and `o` (`pan`,
`pen`, `pig`/`pin`, `pot`). **A dense family is what makes the board feel alive.** Revision 5
is therefore an argument for *deepening* the existing families rather than adding new ones.

### 0.9 Audio — no clips added, none removed, and the blocking item is unchanged

| Set | Count | Status |
|---|---|---|
| 26 letter-sound clips, `a`–`z` | 26 | **25 exist** (`q` absent). §3.4 still applies: **Piper cannot synthesise a phoneme**, and `gameplay.md` §0A.3 measured the shipped ones at **2.0–2.8 s against a ≤ 700 ms budget**. This is the open defect, not a new one |
| 10 digraph clips | 10 | **keep them.** They are now what a *re-voiced* second tap plays (§0.6). Do not delete them with the tiles |
| whole-word clips | 40 | fine from Piper |
| sentence clips | 40, optional | fine from Piper |

**Net asset change: zero.** The ten digraph clips change role and keep their budget. The
**26 letter sounds remain the single blocking audio item in the app** (`open-questions.md`
Q4), and revision 5 makes them slightly more visible, because a 26-cell alphabet grid is now
the first thing he sees in English mode.

### 0.10 What revision 5 hands to the other agents

| To | Requirement |
|---|---|
| content-engineer | `inventoryOrder` becomes `{ letter: ["a" … "z"] }`; `inventoryOrder.digraph` is deleted. The ten digraph **clips** are kept and re-keyed as re-voicing audio (§0.6, §0.9) |
| content-engineer | **Do not touch `word.tiles`.** It is the sound decomposition and it stays. **Add** a derived `letters` array. The engine walks `letters`; it reads sounds from `tiles`; the editor writes both |
| content-engineer | Validator: `letters` must equal the spelling character for character and recompose to `tiles`; every letter in `a`–`z`; §3.3's position rules still rejected at save time |
| content-engineer | The 26 letter-sound clips must be re-cut to **≤ 700 ms** (`gameplay.md` §0A.4). Unchanged and still blocking |
| game-designer | One run, 26 cells; one page on his device, no rail. Vowel tiles visually distinct from consonants (§3.2) is unchanged and matters more now that `j q y z` sit permanently flat |
| game-designer | The strip **marks** grapheme spans and never merges cells — same as `literacy-vi.md` §0.10. Re-run `tools/layout-sweep.mjs --pages`; §0.2's numbers are predictions |
| owner | `open-questions.md` **Q10** (letter names vs sounds — decided, free to reverse), **Q4** (recording the 26 sounds), and whether he wants uppercase glyphs (§0.4) |

---

## 1. The machine

English assembles **letter by letter**, and that is correct here — unlike Vietnamese, where
it would be wrong.

```
     c    +    a    +    t     →    cat
     s    +    u    +    n     →    sun
    sh    +    i    +    p     →    ship     (one digraph tile = one sound)
     f    +    r    +  o  + g  →    frog     (a blend is two tiles, not one)
```

**One tile is one sound, never one letter.** That distinction drives the whole inventory:

| | Letters | Sounds | Tiles | Why |
|---|---|---|---|---|
| `cat` | 3 | 3 | `c` `a` `t` | straightforward |
| `ship` | 4 | 3 | `sh` `i` `p` | `sh` is a **digraph** — two letters, **one** sound |
| `frog` | 4 | 4 | `f` `r` `o` `g` | `fr` is a **blend** — two letters, **two** sounds, still audible separately |
| `duck` | 4 | 3 | `d` `u` `ck` | `ck` is one sound |
| `egg` | 3 | 2 | `e` `gg` | doubled consonant is one sound |
| `box` | 3 | 3 tiles / 4 sounds | `b` `o` `x` | `x` is one letter spelling /ks/ — the one accepted exception |

Confidence `high`. The digraph-vs-blend distinction is the standard synthetic-phonics
distinction and getting it backwards is a recognised way phonics materials go wrong.

---

## 2. Decision: tiles carry letter **sounds**, not letter **names**

> **REAFFIRMED by §0.4** against the new argument that a standard alphabet table invites
> names. Everything below stands. The reversal is 26 clip replacements and no code, and it is
> `open-questions.md` Q10.

**Decided: sounds. Letter names are not spoken anywhere in v1.**

This is the single most consequential decision in this document, so here is the full case.

### 2.1 Names do not blend

The child's task is to blend. `/k/ /æ/ /t/` blends to *cat*. `"see" "ay" "tee"` blends to
*seeaytee*, which is nothing. A tile that says its name is a tile that actively teaches the
wrong operation. This is the most common failure mode in letter-tile apps and the reason
synthetic phonics teaches sounds first and names later. Confidence `high`.

### 2.2 The Vietnamese collision — and why sounds resolve it

The brief names this exactly: Vietnamese `cờ` and English `see` for the same glyph `c`.

| Glyph | Vietnamese mode says | English mode, **names** | English mode, **sounds** |
|---|---|---|---|
| `c` | cờ /kɤ/ | see /siː/ | /k/ |
| `m` | mờ /mɤ/ | em /ɛm/ | /m/ |
| `b` | bờ /ɓɤ/ | bee /biː/ | /b/ |
| `t` | tờ /tɤ/ | tee /tiː/ | /t/ |

With names, the same glyph carries two unrelated utterances across modes, and the child
switches modes. With sounds, **the two modes agree**: Vietnamese đánh vần names a consonant
by its sound plus a schwa (`cờ` = /k/ + /ɤ/), and English synthetic phonics names it by the
bare sound (/k/). They are the *same pedagogy*, differing only by whether Vietnamese's
obligatory vowel is attached.

That convergence is worth stating plainly: **letter names are the outlier, not Vietnamese.**
Choosing sounds does not merely avoid a collision — it makes the glyph mean the same thing
in both modes, which is the strongest possible support for the no-mixing rule. The languages
never mix, but the child is one child, and he is better off if `c` is not two different
facts.

### 2.3 The honest caveat: the schwa problem

Stop consonants — /b/ /d/ /g/ /k/ /p/ /t/ — **cannot be produced in isolation.** Releasing
them always produces some vowel, so "the sound of `c`" comes out as *cuh* and `c-a-t` becomes
*cuh-a-tuh*, which does not blend either. This is a real, acknowledged limitation of
synthetic phonics, not a reason to switch to names. Mitigations:

1. Record the stops **clipped and unvoiced** — as short a release as is audible.
2. **The word is always said last and whole.** The resolution sequence (§4) ends on `cat`
   spoken normally, so the correct blend is what he hears last and remembers.
3. Prefer **continuant** consonants in the early stages, because they *can* be held cleanly:
   `m s f n l r v z`. Stages 1–2 of the word list lean this way where a picturable word
   allows it.

### 2.4 When letter names come back

Not in v1, and not in this app's scope. He will learn them from the alphabet song and from
his mother; the app's job is the part that is harder and easier to get wrong.

### 2.5 Case: lowercase only

**Decided: lowercase only in v1.** Uppercase is a second, visually unrelated grapheme set
(`a`/`A`, `g`/`G`, `r`/`R`), and teaching both doubles the load for no gain at 4. Lowercase
is what the books he will read are set in. It also keeps English mode visually consistent
with Vietnamese mode, which is inherently lowercase. Confidence `high` that lowercase-first
is standard early-phonics practice.

---

## 3. Tile inventory

> **SUPERSEDED as a tile inventory by §0.3.** The board is `a`–`z`, 26 cells, one run. §3.1
> and §3.2 survive as the *sound* each letter carries; §3.3 survives as the re-voicing table
> (§0.6) and as a validator rule, not as tiles.

### 3.1 Consonants (stage 1 onward)

| Tile | Sound | Continuant? | Notes |
|---|---|---|---|
| `b` | /b/ | no | stop |
| `c` | /k/ | no | stop. `c` = /k/ only in v1 (see §3.5) |
| `d` | /d/ | no | stop |
| `f` | /f/ | **yes** | |
| `g` | /ɡ/ | no | stop. hard /ɡ/ only in v1 |
| `h` | /h/ | yes-ish | |
| `j` | /dʒ/ | no | |
| `k` | /k/ | no | homophone of `c` — **never in the same palette** |
| `l` | /l/ | **yes** | |
| `m` | /m/ | **yes** | |
| `n` | /n/ | **yes** | |
| `p` | /p/ | no | stop |
| `r` | /ɹ/ | **yes** | never before a vowel in the same tile — see §3.5 |
| `s` | /s/ | **yes** | |
| `t` | /t/ | no | stop |
| `v` | /v/ | **yes** | |
| `w` | /w/ | yes | |
| `x` | /ks/ | no | **final position only** (`box`, `fox`) |
| `y` | /j/ | yes | **initial position only** in v1 (`yes`, `yak`) |
| `z` | /z/ | **yes** | |
| `q` | — | — | **excluded from v1.** Only ever `qu`, and there is no picturable CVC word. |

### 3.2 Vowels (short only, v1)

| Tile | Sound | Key word |
|---|---|---|
| `a` | /æ/ | cat |
| `e` | /ɛ/ | bed |
| `i` | /ɪ/ | pig |
| `o` | /ɒ ~ ɑ/ | dog |
| `u` | /ʌ/ | bus |

**Vowel tiles must be visually distinct from consonant tiles** — different colour, same
shape. This is near-universal in phonics materials and it gives him a free structural cue
that a word needs one of these in the middle. Requirement handed to the game-designer.

Confidence `check` on the `o` transcription: /ɒ/ is British, /ɑ/ American. The Piper voice is
`en_US-amy`, so the child hears the American value. Irrelevant to the tile, relevant to
whoever records replacement audio.

### 3.3 Digraphs (stage 6) — each one tile

> **SUPERSEDED as tiles by §0.3/§0.6.** These are entered as their letters and the second tap
> **re-voices** to the digraph's sound. The ten clips are kept for exactly that. The
> final-only position rules move from the palette to the validator.

| Tile | Sound | Key word | Position |
|---|---|---|---|
| `sh` | /ʃ/ | ship, fish | either |
| `ch` | /tʃ/ | chin, chick | either |
| `th` | /θ/ or /ð/ | bath, this | either — **two sounds, one spelling** |
| `ck` | /k/ | duck, sock | **final only** (never starts a word) |
| `ng` | /ŋ/ | ring, king | **final only** |
| `ll` `ss` `ff` `zz` `gg` | as the single letter | bell, egg | **final only** |

The `ck` and `ll/ss/ff/zz` final-only restriction is real English orthography and is worth
enforcing in the palette for the same reason as Vietnamese §4: offering a tile that cannot
legally go where he might put it is a trap.

`th` spelling two different sounds (/θ/ in *bath*, /ð/ in *this*) is a genuine irregularity.
The tile plays **/θ/** (the unvoiced one), because every stage-6 seed word uses it.
Confidence `high`.

### 3.4 The audio problem English has and Vietnamese does not

**Piper cannot synthesise "the sound of `c`."** You cannot type a phoneme. Typing `c` gives
Piper the letter and it will say *"see"* — the letter name, which is exactly what §2 rules
out. Typing `cuh` gives an exaggerated schwa. This is not a tuning problem; it is a category
problem.

| Set | Vietnamese | English |
|---|---|---|
| onset/letter clips | `mờ`, `chờ` — **ordinary text, Piper handles it** (proven in `spike-results.md`) | **no text spells /k/** |

**Recommendation: the owner records the ~26 English letter-sound clips himself.** It is
roughly 10 minutes of his time, it is the *only* set TTS cannot do correctly, and a parent's
voice is pedagogically better than any synthesised voice anyway (`spike-results.md`,
§Audio). The alternative — driving Piper at the espeak phoneme level — is unproven on this
machine and should be spiked before it is relied on. See `open-questions.md` Q4.

**Whole words are fine from Piper.** `cat`, `bird`, `The cat says meow.` were all
synthesised successfully in the spike. Only the isolated phonemes are the problem.

### 3.5 Excluded from v1, and why

| Excluded | Why | When it returns |
|---|---|---|
| r-controlled vowels (`car`, `bird`, `jar`) | `ar` `er` `ir` `or` `ur` are not consonant + short vowel; the vowel is swallowed. `jar` looks like a perfect CVC word and is not. | after CVCe |
| CVCe / magic-e (`cake`, `bike`, `nose`) | breaks one-tile-one-sound: the `e` is silent and changes a vowel it is not adjacent to. Needs a different tile mechanic. | post-v1, deliberately |
| soft `c` (`city`), soft `g` (`gem`) | same glyph, second sound — the exact confusion §2 exists to avoid | post-v1 |
| vowel digraphs (`rain`, `boat`, `see`) | a large, irregular set | post-v1 |
| `q` | no picturable CVC word | — |

---

## 4. The resolution sequence

### 4.1 Tile press

> **AMENDED by §0.6.** Still the sound, never the name — and a tap that completes a digraph
> plays the **digraph's** sound, superseding the letter's.

Plays the tile's **sound**: `/k/`, `/æ/`, `/ʃ/`. Never a letter name.

### 4.2 On resolution — `cat`

| Step | Audio | Gap after | Visual |
|---|---|---|---|
| 1 | /k/ | 200 ms | first tile lifts |
| 2 | /æ/ | 200 ms | second tile lifts |
| 3 | /t/ | 350 ms | third tile lifts |
| 4 | **`cat`** | 600 ms | **picture appears here** |
| 5 | `The cat says meow.` *(optional)* | — | picture held |

Deliberately parallel to the Vietnamese chant (`literacy-vi.md` §7.2): parts, then whole,
then picture, then sentence. The languages never mix but the *ritual* is the same, so he
does not relearn how the game works when the language changes. That is a content-model
requirement for the game-designer, and it costs nothing.

Note the gaps are shorter than Vietnamese (200 ms vs 250 ms) because there is no tone step
and English phoneme clips are shorter. Starting values for tuning, not a specification.

---

## 5. Word families and progression

### 5.1 Why families

A word family is a shared rime (`-at`: cat, hat, bat, rat, mat). Changing one tile makes a
new word, and the *picture changes* — which is the most legible possible demonstration that
letters carry meaning. Families are the strongest structure available in English and the
progression is built on them.

| Vowel | Families used in the seed list |
|---|---|
| a | `-at` `-ap` `-ag` `-an` |
| e | `-ed` `-en` `-et` `-eb` `-eg` |
| i | `-ig` `-in` |
| o | `-og` `-ox` `-ot` |
| u | `-us` `-un` `-up` `-ug` `-ut` |

### 5.2 Decision: CVC-only at first, and what comes after

> **SUPERSEDED as a progression by §0.8.** The stage ladder was deleted by `gameplay.md` §3.6
> in revision 3; stages are a grouping for the word list and nothing the app reads. The
> *ordering argument* (digraphs before blends) still explains the seed list's shape.

**Decided: yes, v1 opens CVC-only, with all five short vowels.** Reasons: it is the smallest
complete system (every tile is one sound, every word is three tiles), it has enough
picturable nouns, and it is where English phonics actually starts.

**Short `i` is the sparsest vowel for picturable CVC nouns** — `pig`, `pin`, `bin` and
little else that a 4-year-old can recognise uncaptioned. `wig`, `fig`, `bib`, `lid`, `kit`,
`zip` are all words and none of them has a usable picture. This is a finding, not a gap in
the list: stage 3 is short and that is correct.

The order after CVC:

| Stage | Adds | Example words | Why this order |
|---|---|---|---|
| 1–5 | CVC, one vowel per stage: a → e → i → o → u | cat, bed, pig, dog, bus | `a` first: most picturable nouns. `u` last: `/ʌ/` is the least distinct vowel. |
| **6** | **consonant digraphs** as single tiles | ship, fish, duck, sock, egg | keeps one-tile-one-sound intact. Natural next step. |
| **7** | **initial blends** as separate tiles | frog, crab, drum | first time two tiles make one *onset* — this is the real new idea, and it must come after digraphs or he will read `fr` as a digraph |
| 8 (post-v1) | final blends | nest, milk, lamp | |
| 9 (post-v1) | CVCe / magic-e | cake, bike, nose | needs a new mechanic (§3.5) |

**Digraphs before blends is not arbitrary.** If blends come first he learns "two letters
next to each other = two sounds", and then `sh` contradicts it. Teaching the one-sound case
first means the blend is introduced as the exception, which is the easier direction.

---

## 6. How many tiles — the progression

> **SUPERSEDED by §0.2 and §0.3.** No palette, no ladder: the board is 26 cells, paged to the
> device. §6.2's homophone rule (`c` and `k` never together) is retired — every letter is
> always on the board and there is no wrong tap.

### 6.1 The cap is lower than Vietnamese

Vietnamese caps at 6 per row / 16 on screen because its three rows are *categorically
different* — an onset tile, a rime tile and a tone tile do not look alike, so he scans one
row for one kind of thing. English has no such structure: 8 single lowercase glyphs in one
tray all look alike, discrimination cost per tile is higher, and he scans the whole tray.

**English caps at 8 tiles on screen.**

### 6.2 The progression

Three answer slots, always; tiles in a tray below.

| Stage | Tiles on screen | Of which distractors | Word type |
|---|---|---|---|
| 1 | **4** | 1 | CVC, short a |
| 2 | **5** | 2 | CVC, + short e |
| 3 | **6** | 3 | CVC, + short i |
| 4 | **6** | 3 | CVC, + short o |
| 5 | **7** | 4 | CVC, + short u |
| 6 | **8** | 5 | + digraphs (3 tiles, one of which is `sh`/`ch`/`ck`) |
| 7 | **8** | 4 | + blends (**4 tiles to place**, so only 4 distractors) |

**Distractors must come from the same word family wherever possible.** At stage 1 with
target `cat`, the right distractor is `h` or `b` or `r` — so the wrong answers are `hat`,
`bat`, `rat`, which are *also real words with pictures*. Two payoffs: he cannot build
garbage, and a "wrong" answer can be rewarded with the picture of the word he actually
built. **That is the strongest single idea in the English mode** and the word list is
ordered to support it (`word-list.md` §4).

**Never put `c` and `k` in the same palette** — they are homophones in v1 (both /k/) and the
child cannot hear which is correct, exactly as with Vietnamese `c`/`k` (`literacy-vi.md`
§4.1). Same rule, same reason, both languages.

### 6.3 Layout arithmetic

Same viewport as `literacy-vi.md` §8.2: 328 dp usable, 72 dp minimum tile, 4 per visual
line. 8 tiles is therefore two lines of 4, plus three answer slots above. The game-designer
owns the layout; this is the constraint.

---

## 7. What this document hands to the other agents

> **SUPERSEDED by §0.10.**

| To | Requirement |
|---|---|
| content-engineer | Tile audio is **phoneme clips, not letter names** (§2). The ~26 letter-sound clips are the one set Piper cannot produce and should be **recorded by the owner** (§3.4, `open-questions.md` Q4). |
| content-engineer | Validator rejects: `ck`/`ll`/`ss`/`ff`/`zz`/`ng` in initial position; `x` in initial position; `c` and `k` in one palette (§3.3, §6.2). |
| game-designer | Vowel tiles visually distinct from consonants (§3.2). Lowercase only (§2.5). ≤8 tiles, 4 per visual line (§6). Same resolution ritual as Vietnamese — parts, whole, picture, sentence (§4.2). |
| game-designer | Distractors drawn from the same word family, and a *wrong but real* word should be rewarded with its own picture rather than treated as a failure (§6.2). |
| owner | `open-questions.md` Q4 (recording letter sounds), Q3 (which language he meets first). |
