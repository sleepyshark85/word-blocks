# The Vietnamese model — âm đầu + vần + thanh

Owner: literacy-designer. This document defines what a tile *is* in Vietnamese mode, which
combinations are legal, how tone is presented, and what the child hears when a word
resolves. It is the input to the content pack format (content-engineer) and to the tile
layout (game-designer). It is not a screen design.

**Revision 5, 2026-09-23 — read §0 first.** The owner played the built app and asked for the
standard alphabet as the character table, then corrected the design twice. The settled answer
is **letter-by-letter input over an unchanged đánh vần model**: `ch` is two taps and still one
âm đầu. §0 records all three scopings, because the first two were wrong in opposite
directions and the next reader will otherwise repeat them.

**Confidence marking.** Every rule below carries a confidence column. `high` means this is
standard Vietnamese primary-school orthography that I am confident is correct. `check`
means I believe it is correct but it should be confirmed with the owner or a Vietnamese
primary-school textbook before it is coded as a hard constraint. Nothing is stated
confidently that I am not confident about — a wrong rule here is worse than an open
question (`.claude/agents/literacy-designer.md:86`).

---

## 0. CORRECTION — revision 5. Letter-by-letter **input**, đánh vần **model**

**Revision 5, 2026-09-23. Tier 5 — the owner, from playing the built app.** This section
overrides §2 and §3 *as tile inventories*, §7.1 *as the tap-audio table*, and §8 entirely.
Everything else below — the three-slot machine (§1), the legality rules (§4), the tone model
(§5), the dialect rules (§6) and the chant (§7.2) — **survives unchanged**, and §0.3 says why
that is the whole point of this revision rather than an accident of it.

### 0.1 The record: the owner corrected this design twice, and the next reader must not repeat the first mistake

This is written out because two plausible, confidently-argued designs were built from his
first message and **both were wrong**, and the only thing that caught it was asking him.

| # | What was proposed | What the owner then said | Verdict |
|---|---|---|---|
| **1** | Read "display the full standard character table" as *delete the digraphs*. `chó` becomes `c` + `h` + `ó`; the onset/rime/tone model is abandoned for English-style letter spelling. | *"yes, he's learning **đánh vần** and using vietnamese characters, including combined characters like **ch, tr** …"* | **Wrong.** It threw away the model his son is being taught this term. |
| **2** | Over-correct: keep `ch`, `tr`, `ng` … as **tiles**, and treat his message as being about the *order* of the inventory only. | *"but, for character combining, he will still going through character by character, **event for combine ones like ch, tr** …(Choose C and choose H …). This to keep the table consistent"* | **Also wrong.** He does want to tap `c` then `h`. |
| **3** | **This document.** The **input** is letter by letter; the **model** is đánh vần. `ch` is entered as two taps and is still one onset. | — | Built. |

**The lesson, and it is the general form of this project's standing rule.** Both wrong answers
came from inferring a *model* from a sentence about a *surface*. He described what the board
should look like; two readings of that sentence each silently decided what the board *means*.
The question "is your son being taught đánh vần?" was answerable in one message and would have
prevented both. It is now `open-questions.md` Q9, answered — and the reason it is recorded as
an answered question rather than deleted is that the next person to read his first message
will read it the same two wrong ways.

### 0.2 What he actually complained about, and the cause is real

> also, the characters being displayed feel really random and un-organized and doesn't give
> my son a sense of character order in the table. Let's try this, display the full standard
> character table (Vietnamese: A, Ă, Â, B, C, D, Đ, E, Ê, G, H, I, K, L, M, N, O, Ô, Ơ, P, Q,
> R, S, T, U, Ư, V, X, Y and English: A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R,
> S, T, U, V, W, X, Y, Z) and he will pick the first character from there. The first pick
> displays in the list of picked character and the table refreshed and enable only characters
> that can combine to words supported by the app. And so on and so forth until he can form a
> word

`packs/vi-seed/pack.json` → `inventoryOrder` ships:

```
onset:  m b c ch s d g h t tr v gh gi k kh l ng nh qu r th x đ n ngh ph
rime:   ưa a o ê ao ong ô ăng  ach ai am anh at ay e em en eo i im it oa oi u ua ui uôi ân âu ây ăt ơ ưng on un
```

Both are **sorted by how many seed words sit behind each symbol**, most productive first,
with the tail falling back to whatever order the build script's sort produced. It is not
alphabetical, not phonetic, not anything a child or an adult could name. His diagnosis is
correct and the cause is a build-time sort that nobody looked at.

### 0.3 The model: **input changes, đánh vần does not**

> **A digraph is a sequence of taps and a single unit of the model.**
> `ch` is `c` then `h`. `ch` is still one âm đầu. The chant still says `chờ`.

| | Revision 4 | **Revision 5** |
|---|---|---|
| What is on the table | 26 onsets + 35 rimes + 6 tones = **67 cells** | **29 letters + 6 tones = 35 cells** |
| Order | frequency-descending | **his alphabet, exactly as he typed it** |
| How `ch` is entered | one tap | **two taps: `c`, `h`** |
| What `ch` *is* | one âm đầu | **one âm đầu — unchanged** |
| Word model | `(onset, rime, tone)` | **`(onset, rime, tone)` — unchanged** |
| §5.4 tone tiles show the chosen rime, marked | yes | **yes, verbatim.** The rime is still known |
| The chant (§7.2) | `chờ · o · cho · sắc · chó` | **unchanged** |
| Legality §4.1, dialect §6, `ngang` §5.3 | as written | **unchanged** |

Only two things actually change: **what a cell is**, and **how many taps a word takes**. That
is why this revision is much smaller than the first reading of his message implied, and it is
why the engine's word representation must not be touched (§0.13).

### 0.4 The table — 29 letters, then 6 tones. 35 cells.

**Run 1 — the alphabet, in the owner's order, every letter always in the same slot.**

| # | Tile | Kind | What it says when tapped *(see §0.9)* | Confidence |
|---|---|---|---|---|
| 1 | `a` | vowel | as a rime letter: the rime so far | high |
| 2 | `ă` | vowel | `á` — `ă` cannot be said level | **check** |
| 3 | `â` | vowel | `ớ` — same reason | **check** |
| 4 | `b` | consonant | `bờ` | high |
| 5 | `c` | consonant | `cờ` | high |
| 6 | `d` | consonant | `dờ` | high |
| 7 | `đ` | consonant | `đờ` | high |
| 8 | `e` | vowel | the rime so far | high |
| 9 | `ê` | vowel | the rime so far | high |
| 10 | `g` | consonant | `gờ` | high |
| 11 | `h` | consonant | `hờ`, **or the digraph it completes** (§0.9) | high |
| 12 | `i` | vowel | the rime so far, **or `giờ` after `g`** (§0.6) | high |
| 13 | `k` | consonant | `cờ` | high |
| 14 | `l` | consonant | `lờ` | high |
| 15 | `m` | consonant | `mờ` | high |
| 16 | `n` | consonant | `nờ` | high |
| 17 | `o` | vowel | the rime so far | high |
| 18 | `ô` | vowel | the rime so far | high |
| 19 | `ơ` | vowel | the rime so far | high |
| 20 | `p` | consonant | `pờ` — **only ever a step toward `ph`** (§0.6) | high |
| 21 | `q` | consonant | `quờ` — **only ever a step toward `qu`** (§0.6) | **check** on the clip |
| 22 | `r` | consonant | `rờ` | high |
| 23 | `s` | consonant | `sờ` | high |
| 24 | `t` | consonant | `tờ` | high |
| 25 | `u` | vowel | the rime so far, **or `quờ` after `q`** (§0.6) | high |
| 26 | `ư` | vowel | the rime so far | high |
| 27 | `v` | consonant | `vờ` | high |
| 28 | `x` | consonant | `xờ` | high |
| 29 | `y` | vowel | the rime so far | high |

`f j w z` are not Vietnamese letters and are not on the board. That is why Vietnamese is 29
and English 26, and it is correct.

**Run 2 — the six tones.** Unchanged in behaviour from §5.1–§5.4; **corrected in order**, see
§0.12. The order is `ngang · huyền · sắc · hỏi · ngã · nặng`.

**All 29 letters appear in at least one `vi-seed` word**, so the Vietnamese board has no
permanently dead cell. (English has four — `literacy-en.md` §0.5.)

### 0.5 The step boundary — how the app knows the onset has ended

This is the question the letter stream creates, and it has a clean answer.

> **Every Vietnamese rime begins with a vowel letter, and every onset is consonant letters —
> except `gi` and `qu`, which are the only two onsets containing a vowel letter.**

So the boundary is "the first vowel letter", with exactly two exceptions, and **both
exceptions are deterministic**:

| Exception | Why it is not ambiguous | Confidence |
|---|---|---|
| `q` + `u` | `q` never occurs without `u` in Vietnamese. After `q` the only live letter is `u`, and that `u` is onset. | high |
| `g` + `i` | `g` before a rime beginning `i`, `e` or `ê` is illegal — that spelling is `gh` (§4.1). So an `i` after `g` is always the onset `gi`. | high, **contingent on §4.1**, which is `high` |

**Verified against the pack.** For all 50 `vi-seed` words, expanded to letters: at **every one
of the reachable letter prefixes, all completing words agree on whether the current letter is
onset or rime. Zero disagreements.** Cross-checks from the same run: the 35 seed rimes contain
**zero** that begin with a consonant letter, and the 26 seed onsets contain **exactly two**
with a vowel letter — `gi` and `qu`, as stated.

**And the check was made to fail first, because the first version of it could not.** My
initial fault injection forced every onset's length to 1 and the checker still reported zero
disagreements — a green check I had not seen fail, which this project has now caught five
times (`CLAUDE.md`). It passed because that fault does not create an ambiguity: it relabels
every word consistently. The injection that *does* test the detector is a fabricated word
spelled `c` `h` `o` but parsed as onset `c` + rime `ho`:

```
REAL pack  -> disagreements: 0
FAULTED    -> disagreements: 1   ["ch", chân:2 chim:2 chó:2 chuối:2 *cho*:1]
```

The detector fires on a genuine ambiguity, so the zero above means something. **`*cho*` is not
a legal Vietnamese syllable** — no rime begins with `h` — which is precisely why the boundary
rule holds, and precisely what the validator must keep out of the pack.

**But the boundary is not re-derived at runtime, and must not be.** It is a property of the
stored `(onset, rime, tone)` triple, which is already in every word entry. Two reasons:

1. **A spelling can collapse and hide the rime.** `gì` is `gi` + rime `i`, written with one
   `i` (§1.2). Its letters are `g` `i` and there is no way to see the rime in them. Nothing in
   the seed list does this, but his mother can type `gì` tomorrow.
2. The project's standing rule: the engine never composes a spelling (§1.2). Deriving a
   boundary is composing.

**What this costs the chant: nothing.** The chant only runs at resolution, when exactly one
word is identified, so it reads `chờ · o · cho · sắc · chó` straight off the stored triple.

### 0.6 Onset-prefix liveness — the full enumeration

Computed from the pack. "Extends the onset" and "starts a rime" are the two kinds of live
letter; a state with both is a state where his next tap decides whether the onset is one
letter or two.

| Onset-prefix | A complete onset? | Live letters that **extend** it | Live letters that **start a rime** | Seed words behind it |
|---|---|---|---|---|
| `b` | yes | — | `a` `o` `u` `ơ` | bánh bò bóng bún bơ |
| `c` | **yes** | `h` | `a` `u` `ư` | cam cá cua cửa chim chó chuối chân |
| `ch` | yes | — | `i` `o` `u` `â` | chim chó chuối chân |
| `d` | yes | — | `ê` `ư` | dê dừa |
| `g` | **yes** | `h` `i` | `a` `â` | gà gấu ghế giày |
| `gh` | yes | — | `ê` | ghế |
| `gi` | yes | — | `a` | giày |
| `h` | yes | — | `o` `ô` | hoa hổ |
| `k` | **yes** | `h` | `e` | kem khỉ |
| `kh` | yes | — | `i` | khỉ |
| `l` | yes | — | `ê` | lê |
| `m` | yes | — | `e` `u` `â` `ă` `ư` | mây mèo mũ mũi mưa mắt |
| `n` | **yes** | `g` `h` | `o` | nón ngựa nhà |
| `ng` | yes | — | `ư` | ngựa |
| `nh` | yes | — | `a` | nhà |
| `p` | **NO** | `h` | **—** | phở |
| `ph` | yes | — | `ơ` | phở |
| `q` | **NO** | `u` | **—** | quạt |
| `qu` | yes | — | `a` | quạt |
| `r` | yes | — | `ă` | răng |
| `s` | yes | — | `a` `ư` | sao sách sữa |
| `t` | **yes** | `h` `r` | `a` `ô` | tai tô thỏ trăng trứng |
| `th` | yes | — | `o` | thỏ |
| `tr` | yes | — | `ă` `ư` | trăng trứng |
| `v` | yes | — | `i` `o` | voi vịt |
| `x` | yes | — | `e` | xe |
| `đ` | yes | — | `e` | đèn |

**The five branching states are `c`, `g`, `k`, `n`, `t`.** Every other consonant letter either
finishes the onset or continues it, never both.

**Answers to the three specific questions asked:**

1. **Bare `p` is never an onset.** Vietnamese initial `p` occurs only in loanwords (`pin`,
   `pi-a-nô`) and §2 already excluded it from v1. `p` is on the board **only as the first
   step toward `ph`**: after `p`, `h` is the one live letter and no vowel is live. Confidence
   `high`.
2. **Bare `q` is never an onset, ever, not just in v1.** `q` is always `qu`. After `q`, `u`
   is the one live letter. Confidence `high`.
3. **`g` before `i`/`e`/`ê` is never bare `g`.** §4.1: that spelling is `gh`. Confirmed by the
   data — after `g`, the only rime-starting letters that are live are `a` and `â`, never
   `i`/`e`/`ê`. So an `i` after `g` unambiguously makes the onset `gi`.

**Not reachable, and worth saying so.** `ngh` has no seed word (§4.2), so `h` is not live
after `n` `g` today. The rule is in place for the day his mother adds one: after `ng`, `h` is
live iff some stored word has onset `ngh`.

**Position 1 stands 19 of the 29 letters:** `a b c d đ g h k l m n o p q r s t v x`. The other
ten — `ă â e ê i ô ơ u ư y` — are **every vowel except `a` and `o`**, and that is because `áo`
and `ong` are the only vowel-initial words in the pack.

### 0.7 Rime-prefix liveness

Rimes are typed letter by letter too — `ao` is `a` then `o`, `ăng` is `ă` then `n` then `g` —
and the same enumeration applies. Over the 35 rimes in the pack:

| Rime-prefix | A complete rime? | Rimes it extends to | Live continuation letters |
|---|---|---|---|
| `a` | **yes** | ach, ai, am, anh, ao, at, ay | `c` `i` `m` `n` `o` `t` `y` |
| `ac` | no | ach | `h` |
| `an` | no | anh | `h` |
| `e` | **yes** | em, en, eo | `m` `n` `o` |
| `i` | **yes** | im, it | `m` `t` |
| `o` | **yes** | oa, oi, on, ong | `a` `i` `n` |
| `on` | **yes** | ong | `g` |
| `u` | **yes** | ua, ui, un, uôi | `a` `i` `n` `ô` |
| `uô` | no | uôi | `i` |
| `â` | no | ân, âu, ây | `n` `u` `y` |
| `ă` | no | ăng, ăt | `n` `t` |
| `ăn` | no | ăng | `g` |
| `ư` | no | ưa, ưng | `a` `n` |
| `ưn` | no | ưng | `g` |

Every other rime is terminal — no rime extends it, so the tone run goes live the moment it is
complete.

**The rule, stated for the engine.** After the onset is closed, at each rime letter:

- **Live letters** = the next letter of any rime that (a) starts with what he has typed, and
  (b) belongs to a stored word with the onset he has typed.
- **Live tones** = the legal, word-completing tones of that rime, *iff* what he has typed is
  already a complete rime of such a word.

**Six of the 35 rimes are also a proper prefix of another** — `a e i o on u` — so in those six
the tone run and the letter run can be live at the same time. Measured against the real pack,
that actually happens at **exactly three points**: after `b`+`o` (`n`→`bóng`, huyền→`bò`),
after `c`+`a` (`m`→`cam`, sắc→`cá`), and after `m`+`u` (`i`→`mũi`, ngã→`mũ`).

**Eight rime-prefixes are pass-through states that are not themselves rimes** — `ac an uô â
ă ăn ư ưn`. They are never a stopping point: no tone is ever live on them. Three of them
(`ă`, `â`, `ư`) are the bare vowels §3.1 says can never stand alone, which is the same fact
seen from the other side.

### 0.8 Tone — unchanged, and letter-by-letter input makes the case *stronger*

**Decided: the six tones are a second run of six cells after the 29 letters. §5.1–§5.5 stand
verbatim, and `gameplay.md` §3.4a stands verbatim.** No amendment is needed, because the
**rime is still known** — that is the dividend of keeping đánh vần.

The three options, priced:

| Option | Cells | Verdict |
|---|---|---|
| **A — a tone run of 6, live once the rime is complete** ✅ | **35** | **Chosen.** đánh vần's third step *is* the tone (`bờ · o · bo · huyền · bò`), so a control that appears after the rime is the method, not a departure from it. And it leaves the 29-letter table absolutely untouched — one run, one kind of thing, every letter always in the same slot, which is exactly what he means by "keep the table consistent". |
| B — tone-marked vowels as table entries | **89** | 12 Vietnamese vowel letters × 5 marks = **60 extra cells**. 72 of the 89 cells would be vowels, 60 of them differing from another cell only by a diacritic, shown to a child who cannot read. It also destroys what he asked for: "the full standard character table" is 29 letters, not 89. On the 360 × 640 floor it is ~8 pages. **Rejected on all three counts.** |
| C — tone applied to its carrier vowel the moment that vowel is typed | 35 | Breaks the chant he asked for in revision 4 (`b` → `b o` → `bò` puts the mark last), and forces a tone tap on vowels that have only one live form. Rejected. |

**Unchanged and worth restating because they are load-bearing:**

- **`ngang` is a tile he presses** (§5.3). Two of its four original supports survive — it *is*
  a tone, and the engine otherwise cannot tell "hasn't chosen" from "chose level" — and a
  third replaces the ritual argument that `gameplay.md` §3.4 retired: **every Vietnamese word
  now ends with exactly one tone tap**, and with letter counts varying from 2 to 5 that is the
  only invariant left. Measured: three untoned strings in the pack are proper prefixes of
  another (`bo`<`bong`, `ca`<`cam`, `mu`<`mui`) and in all three the shorter word is toned, so
  today the ambiguity happens not to bite — **that is luck, not design.** A terminal tone
  symbol makes the tree unambiguous by construction.
- **The tone cells show the chosen rime with each mark applied** (§5.4): `eo èo éo ẻo ẽo ẹo`.
  Not a floating diacritic.
- **The tone run shrinks itself on a stop-final rime** (§5.2): `ach` offers two cells, not six.
- **Before a rime is complete the tone cells are never live**, and carry the bare mark on a
  dotted circle (`gameplay.md` §3.4a).

### 0.9 What a letter says when tapped — the real tension, resolved

The tension is exact: if each letter speaks its own sound, `c` `h` is two sounds for one
Vietnamese phoneme; if the app waits for the digraph, the first tap is silent and breaks the
rule that every tap answers.

> **Decided: every tap speaks, and a tap that completes a digraph speaks the digraph —
> superseding, not adding.** The speech channel already cuts hard (`ui.md` §11, revision 3),
> so `chờ` cutting `cờ` is existing behaviour, not new machinery.

He hears `cờ`, then `chờ`. He never hears `cờ` **and** `hờ`. And "`c` and `h` say `chờ`" is a
true statement about Vietnamese and is the same formula synthetic phonics uses for English
`sh` (`literacy-en.md` §0.6).

| He taps | Then taps | Second tap plays | Not | Note |
|---|---|---|---|---|
| `c` (`cờ`) | `h` | **`chờ`** | `hờ` | |
| `g` (`gờ`) | `h` | **`gờ`** | `hờ` | `gh` is the same sound as `g` — worth hearing |
| `g` (`gờ`) | `i` | **`giờ`** | the rime `i` | |
| `k` (`cờ`) | `h` | **`khờ`** | `hờ` | |
| `n` (`nờ`) | `g` | **`ngờ`** | `gờ` | |
| `n` `g` (`ngờ`) | `h` | **`ngờ`** | `hờ` | `ngh` is the same sound as `ng` |
| `n` (`nờ`) | `h` | **`nhờ`** | `hờ` | |
| `p` (`pờ`) | `h` | **`phờ`** | `hờ` | |
| `q` (`quờ`) | `u` | **`quờ`** | the rime `u` | a repeat, not a contradiction |
| `t` (`tờ`) | `h` | **`thờ`** | `hờ` | |
| `t` (`tờ`) | `r` | **`trờ`** | `rờ` | |

**The same rule covers the rime, and that is what makes it one rule rather than two.**

> **A tap always speaks the unit it is currently building, as far as it has got.**
> Onset states speak the đánh vần name (`cờ`, `chờ`, `ngờ`). Rime states speak the rime-so-far
> read aloud (`ă` → `á`, `ăn` → `ăn`, `ăng` → `ăng`).

That is §7.1's onset-name/rime-reading split, extended from whole units to partial ones. The
app always knows which it is, because liveness knows the parse (§0.5).

**Two honest costs.**

1. **A partial rime is sometimes not a real Vietnamese syllable.** `ac` and `ăn` and `ưn` are
   mid-word states, and a clip of `ac` read level is not a sound Vietnamese has (a stop-final
   rime takes only sắc or nặng, §5.2). This is the same class of problem as §7.3's
   toneless-blend caution and it gets the same treatment: **every rime-prefix clip needs a
   human listening check before it ships.**
2. **`ă` and `â` cannot be said level at all**, which is why they are voiced `á` and `ớ` —
   confidence `check`, and the kind of thing the owner can settle by looking at his son's
   book.

### 0.10 The chant is unchanged

**§7.2 stands exactly as written**, and so does the owner's revision-4 accumulating build
(`gameplay.md` §0A.2 finding 4). The build is letters; the chant is đánh vần.

| | Strip as he taps | Chant on resolution |
|---|---|---|
| `bò` | `b` → `b o` → `bò` | `bờ` · `o` · `bo` · `huyền` · `bò` |
| `chó` | `c` → `c h` → `c h o` → `chó` | `chờ` · `o` · `cho` · `sắc` · `chó` |
| `dê` | `d` → `d ê` → `dê` | `dờ` · `ê` · `dê` *(no tone step, §7.2)* |
| `áo` | `a` → `a o` → `áo` | `ao` · `sắc` · `áo` *(no onset step)* |

**The strip marks the onset/rime boundary; it does not merge cells.** When the first rime
letter is tapped, a divider appears between the onset letters and the rime letters. Merging
`c` `h` into one `ch` cell is the morph the owner rejected in revision 3 and must not come
back. Handed to the game-designer as a requirement; the drawing is theirs.

### 0.11 What it costs — measured against the pack, not estimated

| | Revision 4 | **Revision 5** |
|---|---|---|
| Board | 67 cells | **35 cells** |
| Words buildable | 50 of 50 | **50 of 50** |
| Words needing a glyph outside the 29 letters | — | **0** |
| Taps per word | 2–3, mean 2.96 | **3–6, mean 4.08** (+38%) |
| 6-tap words | — | `chuối`, `trăng`, `trứng` |
| Decision points | 76 | **116** |
| Mean live-set size | 1.64 | **1.42** |
| Decision points with exactly **one** live tile | 64 / 76 = **84%** | 98 / 116 = **84%** |
| Live at position 1 | 27 of 67 | **19 of 29** |
| Step-boundary ambiguities | n/a | **0** |
| **Dead ends** | none | **none** |

Three things to take from this.

1. **No word becomes a dead end, and none can.** A letter is live *iff* some stored word
   completes through it, so every live path ends in a word. `gameplay.md` §3.3's three
   properties are untouched; only the tree's depth changed.
2. **The mostly-flat board does not get worse — 84% in both models, and the mean live set
   falls.** That was the risk worth checking and it came back clean. `acceptance-criteria.md`
   U7a is the same Tier-5 question it already was, now asked of a board half the size.
3. **The cost is taps: +1.12 per word.** That is the honest price of "consistent table", and
   it is the price the owner has now asked for twice.

**Paging gets substantially better.** Hand-computed from the capacities
`tools/layout-sweep.mjs --pages` currently reports — **the tool must be re-run once the packs
are rebuilt; these are predictions, not measurements**:

| Device | cells/page | Revision 4 (67 cells) | **Revision 5 (35 cells)** |
|---|---|---|---|
| Android 360 × 640 (the floor) | 12 | 7 pages | **4 pages** — `10 ¦ 10 ¦ 9 ¦ 6` |
| iPhone SE 3 375 × 667 | 16 | 6 pages | **3 pages** — `15 ¦ 14 ¦ 6` |
| iPhone 15/16 393 × 852 | 20 | 5 pages | **3 pages** — `15 ¦ 14 ¦ 6` |
| **iPhone 17 Plus** (his device) | 28 | 4 pages | **3 pages** — `15 ¦ 14 ¦ 6` |
| Every tablet | 67+ | 1 page, no rail | **1 page, no rail** |

**A near-miss worth recording so nobody "fixes" it.** 29 letters against a 28-cell page misses
a single-page alphabet **by one cell** on his device. Do not buy it back by shaving the 72 pt
tile floor or the inter-tile gap — `gameplay.md` §0B.2 already warns about exactly this, and
the gap is what keeps hit rects from overlapping (F6). The 15/14 split is clean anyway: **page
1 is `a`…`m`, page 2 is `n`…`y`, page 3 is the hats.** That is a rule his mother can say out
loud, which is more than revision 4's `26 ¦ 18 ¦ 17 ¦ 6` ever was.

### 0.12 Audio — this revision **adds** clips, it does not save any

Stated plainly because the instinct is that a smaller board is cheaper audio, and it is not:
the tile clips are now indexed by *unit-in-progress*, and partial units need clips too.

| Set | Count | Status |
|---|---|---|
| Onset states (26 onsets + the two non-onset steps `p`, `q`) | 28 | 26 exist as the current onset clips. `q` reuses the existing `quờ`. **1 new: `pờ`** |
| Rime states (35 rimes + 8 pass-through prefixes) | 43 | 35 exist. **8 new: `ac` `an` `uô` `â`(→`ớ`) `ă`(→`á`) `ăn` `ư` `ưn`** |
| Tone names | 6 | exist, 648–888 ms |
| **Total tile clips** | **77** | was 67 |
| **New clips required** | **9** | **Retired: 0** |

Two cautions carried forward from §7.3 and one new:

1. Tune Piper `length-scale` per clip; partial units slower than whole ones.
2. Every step-3 toneless blend still needs a human listening check.
3. **New: every rime-prefix clip needs one too** (§0.9), because several are not real
   Vietnamese syllables read level.

### 0.13 The ordered inventories, for `inventoryOrder` and for the editor

**`inventoryOrder` becomes `{ letter: […29], tone: […6] }`.** The `onset` and `rime` arrays
leave `inventoryOrder` — nothing on the board is an onset or a rime any more. They remain in
`pack.tiles` as the **editor's vocabulary and the model's source of truth**, and they should
be ordered properly there too, because his mother reads them.

**Run 1 — `inventoryOrder.letter`, 29 entries:**

```
a  ă  â  b  c  d  đ  e  ê  g  h  i  k  l  m  n  o  ô  ơ  p  q  r  s  t  u  ư  v  x  y
```

**Run 2 — `inventoryOrder.tone`, 6 entries. This is a correction:**

| | Order |
|---|---|
| Ships as | `ngang  sac  huyen  hoi  nang  nga` |
| **Should be** | **`ngang  huyen  sac  hoi  nga  nang`** |

The shipped order is frequency again — `sắc` is the commonest tone in the seed list, which is
why it drifted to the front, and `nặng`/`ngã` are swapped for the same reason. **`huyền, sắc,
hỏi, ngã, nặng` is a set phrase** Vietnamese speakers recite for the five marks, with `ngang`
(also `không dấu`) before them. Confidence `check` on `huyền` vs `sắc` in second place: the
**dictionary collation** order is `ngang, huyền, hỏi, ngã, sắc, nặng` (`ba bà bả bã bá bạ`),
which is a defensible alternative and differs only in where `sắc` sits. Either way the shipped
order is wrong, and the owner can settle it in one glance at his son's book —
`open-questions.md` **Q11**.

**The editor's vocabulary, ordered — âm đầu, 26 entries.** Vietnamese dictionary order, each
digraph immediately after the base letter it extends. Agrees with the 29-letter alphabet
letter for letter.

```
b  c  ch  d  đ  g  gh  gi  h  k  kh  l  m  n  ng  ngh  nh  ph  qu  r  s  t  th  tr  v  x
```

**The editor's vocabulary, ordered — vần, 35 entries.** Same collation, applied to the rime as
written. **The ordering principle is: the rime's own spelling, in alphabet order** — not by
final, not by phonological type. That is the only key a child can use, because the first
letter of the rime is the thing he sees; and it makes the run read down as `a ă â e ê i o ô ơ
u ư`, which *is* the vowel chant he is learning.

| Block | Rimes |
|---|---|
| `a` | a · ach · ai · am · anh · ao · at · ay |
| `ă` | ăng · ăt |
| `â` | ân · âu · ây |
| `e` | e · em · en · eo |
| `ê` | ê |
| `i` | i · im · it |
| `o` | o · oa · oi · on · ong |
| `ô` | ô |
| `ơ` | ơ |
| `u` | u · ua · ui · un · uôi |
| `ư` | ưa · ưng |

Note this deliberately puts `oa` in the `o` block, not the `a` block, even though its nucleus
is `a` and its `o` is a medial glide. Ordering on the nucleus would be more phonologically
honest and less findable; **findable wins.**

### 0.14 One more correction, found while checking §5.5

§5.5 labels `hòa` as "new style (mark on the nucleus)". In `oa` the nucleus is `a` and the `o`
is the medial, so `hòa` has the mark on the **medial**, not the nucleus — and I should not
have attached the "old"/"new" labels at all, because Vietnamese writers use them
inconsistently and I am not confident which label goes with which form. **Not in doubt: both
`hòa` and `hoà` are in circulation, and the recommendation is unchanged — write `hòa`, the
mark on the first vowel letter.** One seed word is affected (`hoa`), and it is `ngang`, so no
mark is drawn either way.

### 0.15 What revision 5 hands to the other agents

| To | Requirement |
|---|---|
| content-engineer | `inventoryOrder` becomes `{ letter: [29 in §0.13], tone: [6 in §0.13] }`. `inventoryOrder.onset` and `.rime` are deleted. **Fix the tone order** (§0.13) |
| content-engineer | **Do not touch `word.syllables`.** `{onset, rime, tone}` stays exactly as it is — it is the model, the chant reads it, the carrier and the boundary come from it, and §4 validates it. **Add** a derived `letters` array and `onsetLetterCount` per syllable, written by the editor, never composed at runtime (§1.2, §0.5) |
| content-engineer | Validator: `letters` must recompose to onset+rime character for character; `onsetLetterCount` must equal the onset's letter count; every letter must be one of the 29; §4.1 and §5.2 unchanged |
| content-engineer | Tile audio is re-keyed from *units* to *unit-states*: 28 onset states, 43 rime states, 6 tones. **9 new clips** (§0.12), 0 retired. Every rime-prefix clip gets a listening check |
| game-designer | Table is 29 + 6 in two runs; every letter always in the same slot. `gameplay.md` §3.4a and §3.7 are unaffected. The strip **marks** the onset/rime boundary and never merges cells (§0.10). Re-run `tools/layout-sweep.mjs --pages` — §0.11's numbers are predictions |
| game-designer | The strip now holds up to **5 letters plus a mark**, not 3 cells. That is a layout change and it is the one thing §0 does not price |
| app-developer | Liveness is computed over letters, but **the parse comes from the stored triple** (§0.5). Never infer the onset/rime boundary from the letter stream |
| owner | `open-questions.md` **Q9** (answered — kept as the record of the two wrong readings), **Q11** (tone order) |

---

## 1. The machine

A Vietnamese syllable is assembled from exactly three slots:

```
     âm đầu        +        vần        +       thanh
     (onset)                (rime)             (tone)

       m           +         eo        +       huyền      →   mèo
       ∅           +         ong       +       ngang      →   ong
       qu          +         at        +       nặng       →   quạt
```

**Not letter by letter.** No Vietnamese child is taught to spell `mèo` as m-e-o-`̀`. The
digraphs `ch gh gi kh ng ngh nh ph qu th tr` are single units of the writing system, and a
tone mark has nowhere to live in a letter stream. Onset × rime × tone is how Vietnamese
Grade 1 actually teaches reading (đánh vần), and it is what this app implements.

### 1.1 One syllable per round, in v1

Vietnamese words are frequently polysyllabic (`ô tô`, `máy bay`, `con mèo`). **The v1
machine builds exactly one syllable**, so the seed list is monosyllabic only.

**Requirement handed to the content-engineer:** the pack must store a word as an *array* of
syllable triples from day one, even though v1 never writes an array of length ≠ 1:

```
word.syllables = [ {onset, rime, tone}, ... ]
```

Adding `máy bay` later is then two instances of the same machine side by side, not a schema
migration. Costs nothing now; a migration on a live pack on his mother's phone is expensive.

### 1.2 The rule that makes this implementable

**The engine matches on the `(onset, rime, tone)` triple. It never builds the word by
concatenating strings, and it never places a tone mark.** The final spelling is stored on
the word entry.

This is not fastidiousness. Vietnamese onset+rime concatenation is *not* string
concatenation in two places:

| Onset | Rime | Naive concatenation | Real spelling | Note |
|---|---|---|---|---|
| `gi` | `i` | gii | **gì** | the doubled `i` collapses (`gì`, `gỉ`) |
| `gi` | `iêng` | giiêng | **giêng** | `iê` after `gi` is written `ê` |
| `qu` | `ôc` | quôc | **quốc** | works, but only because `qu` swallowed the medial |
| `c` | `uôc` | cuôc | **cuốc** | homophone of `quốc`, different spelling |

Confidence: `high` for `gì`; `check` for `giêng` — I believe it is right and it is the
standard analysis, but it should be confirmed before it is hard-coded. Storing the spelling
as data makes both moot, which is why that is the recommendation.

---

## 2. Onset inventory (âm đầu)

> **Still the model; no longer the tiles (§0.3, §0.4).** An onset is entered as its letters
> and is still one âm đầu. This table is what the đánh vần clips say (§0.9), what the editor
> offers his mother, and what §4 validates. Its *order* is corrected in §0.13.

26 written onsets plus the zero onset. The "đánh vần name" column is what the tile says when
he taps it — the classroom sound-name, consonant + `ờ`.

| # | Tile | Đánh vần name | Northern sound | Southern sound | Notes |
|---|---|---|---|---|---|
| 1 | `b` | bờ | /ɓ/ | /ɓ/ | |
| 2 | `c` | cờ | /k/ | /k/ | **not** before i/y/e/ê — see §4 |
| 3 | `k` | cờ | /k/ | /k/ | **only** before i/y/e/ê |
| 4 | `qu` | quờ | /kw/ | /w/ | always carries its own `u` |
| 5 | `ch` | chờ | /c/ | /c/ | N: merges with `tr` in speech |
| 6 | `d` | dờ | /z/ | /j/ | |
| 7 | `đ` | đờ | /ɗ/ | /ɗ/ | a distinct letter, not `d` with a bar |
| 8 | `g` | gờ | /ɣ/ | /ɣ/ | **not** before i/e/ê |
| 9 | `gh` | gờ | /ɣ/ | /ɣ/ | **only** before i/e/ê |
| 10 | `gi` | giờ | /z/ | /j/ | N: homophone of `d` and `r` |
| 11 | `h` | hờ | /h/ | /h/ | |
| 12 | `kh` | khờ | /x/ | /x/ | |
| 13 | `l` | lờ | /l/ | /l/ | |
| 14 | `m` | mờ | /m/ | /m/ | |
| 15 | `n` | nờ | /n/ | /n/ | |
| 16 | `ng` | ngờ | /ŋ/ | /ŋ/ | **not** before i/e/ê |
| 17 | `ngh` | ngờ | /ŋ/ | /ŋ/ | **only** before i/e/ê |
| 18 | `nh` | nhờ | /ɲ/ | /ɲ/ | |
| 19 | `ph` | phờ | /f/ | /f/ | |
| 20 | `r` | rờ | /z/ | /ʐ/ | N: homophone of `d`/`gi` |
| 21 | `s` | sờ | /s/ | /ʂ/ | N: merges with `x` in speech |
| 22 | `t` | tờ | /t/ | /t/ | |
| 23 | `th` | thờ | /tʰ/ | /tʰ/ | |
| 24 | `tr` | trờ | /ʈ/→/c/ | /ʈ/ | |
| 25 | `v` | vờ | /v/ | /j/~/v/ | |
| 26 | `x` | xờ | /s/ | /s/ | |
| — | ∅ | *(no tile)* | — | — | `ong`, `áo`, `em` |
| — | `p` | pờ | /p/ | /p/ | **excluded from v1** — initial `p` occurs only in loanwords (`pin`, `pi-a-nô`). No picturable native noun starts with it. |

Confidence: `high` for the inventory and the đánh vần names. `check` for the finer sound
columns — the northern `ch`/`tr` and `s`/`x` mergers are the standard description of
conversational Hanoi speech, but they are a *speech* fact, and the only thing the app does
with them is refuse to put homophones in the same palette (§6), which is safe either way.

**`qu` is one tile, not `q` + a medial.** Vietnamese textbooks treat `qu` as a single âm
đầu. Some phonological analyses instead treat the `u` as an âm đệm (medial glide) belonging
to the rime. We follow the school convention because the child will meet the school
convention. Confidence `high` that the school convention is `qu` as one onset.

---

## 3. Rime inventory (vần)

> **Still the model; no longer the tiles (§0.3).** A rime is entered as its letters and is
> still one vần — §5.4's tone tiles depend on it being known. Its *order* is corrected in
> §0.13, and §0.7 adds the partial-rime states letter entry creates.

### 3.1 Structure

A vần is `âm đệm + âm chính + âm cuối` — optional medial glide, obligatory nucleus, optional
final. **For a 4-year-old the vần is one tile.** Its internal structure is the model the
pack must be able to *describe*, so that a rime his mother adds is representable; it is not
something he assembles.

| Part | Members | Notes |
|---|---|---|
| **âm đệm** (medial) | `o` `u` | written `o` before `a ă e`; `u` before `â ê y i ơ` and always after `q`. Confidence `check`. |
| **âm chính** (nucleus) | `a ă â e ê i/y o ô ơ u ư` | 11 simple |
| | `iê/yê/ia/ya` `uô/ua` `ươ/ưa` | 3 diphthongs, spelled differently open vs closed |
| **âm cuối** (final) | nasal `m n ng nh` | |
| | stop `p t c ch` | **checked** — restricts tone, see §5.2 |
| | glide `i/y` `o/u` | |

**`ă` and `â` never stand alone.** They always take a final (`ăn`, `ăng`, `ăt`, `âu`, `ân`,
`ây`). There is no open syllable `bă` or `bâ`. Confidence `high`.

**The diphthong spelling alternation.** `ia/ua/ưa` when the syllable is open; `iê/uô/ươ` when
a final follows (`mía` / `miếng`, `múa` / `muôn`, `mưa` / `mương`). Confidence `high`.

### 3.2 Seed rime tiles

The rimes the seed word list actually uses. The pack's rime inventory is data — this is the
starting set, not the universe.

| Rime | Type | Legal tones | Seed words |
|---|---|---|---|
| `a` | open V | all 6 | gà, nhà, cá |
| `e` | open V | all 6 | xe |
| `ê` | open V | all 6 | dê, lê, ghế |
| `i` | open V | all 6 | khỉ |
| `o` | open V | all 6 | bò, chó, thỏ, hổ |
| `ô` | open V | all 6 | tô |
| `ơ` | open V | all 6 | bơ |
| `u` | open V | all 6 | mũ |
| `ai` | V + glide | all 6 | tai |
| `ao` | V + glide | all 6 | sao, áo |
| `ay` | V + glide | all 6 | giày |
| `ây` | V + glide | all 6 | mây |
| `âu` | V + glide | all 6 | gấu |
| `eo` | V + glide | all 6 | mèo |
| `oi` | V + glide | all 6 | voi |
| `ui` | V + glide | all 6 | mũi |
| `ua` | diphthong, open | all 6 | cua |
| `ưa` | diphthong, open | all 6 | mưa, sữa, cửa, ngựa, dừa |
| `uôi` | diphthong + glide | all 6 | chuối |
| `oa` | medial + V | all 6 | hoa |
| `am` | V + nasal | all 6 | cam |
| `em` | V + nasal | all 6 | kem |
| `im` | V + nasal | all 6 | chim |
| `en` | V + nasal | all 6 | đèn |
| `ân` | V + nasal | all 6 | chân |
| `ăng` | V + nasal | all 6 | trăng, răng |
| `ong` | V + nasal | all 6 | ong, bóng |
| `ưng` | V + nasal | all 6 | trứng |
| `anh` | V + nasal | all 6 | bánh |
| `ach` | V + **stop** | **sắc, nặng only** | sách |
| `at` | V + **stop** | **sắc, nặng only** | quạt |
| `ăt` | V + **stop** | **sắc, nặng only** | mắt |
| `it` | V + **stop** | **sắc, nặng only** | vịt |

---

## 4. Orthographic legality — the rules the palette must enforce

### 4.1 c / k / q, g / gh, ng / ngh

> **Unchanged, and now doing extra work.** §0.5 and §0.6 lean on this rule: it is *why* an `i`
> after `g` is unambiguously the onset `gi`. It is enforced by liveness over stored spellings
> at play time and by the validator at edit time.

These are three pairs of spellings for **one sound each**. Which spelling is correct is
determined entirely by the rime that follows — the child cannot hear it, and must never be
asked to.

| Sound | Written | When | Confidence |
|---|---|---|---|
| /k/ | `k` | the rime's first vowel letter is `i`, `y`, `e` or `ê` | high |
| /k/ | `c` | otherwise | high |
| /k/ | `qu` | when the syllable has the labial medial: `qua`, `quả`, `quạt`, `quê` | high |
| /ɣ/ | `gh` | the rime's first vowel letter is `i`, `e` or `ê` | high |
| /ɣ/ | `g` | otherwise | high |
| /ŋ/ | `ngh` | the rime's first vowel letter is `i`, `e` or `ê` | high |
| /ŋ/ | `ng` | otherwise | high |

Worked examples: `kem` (rime `em`, first letter `e` → `k`), `kẹo` (rime `eo` → `k`), `cua`
(rime `ua`, first letter `u` → `c`), `ghế` (rime `ê` → `gh`), `gấu` (rime `âu` → `g`),
`nghé` (rime `e` → `ngh`), `ngựa` (rime `ưa` → `ng`), `ngoan` (rime `oan`, first letter `o` →
`ng`).

Note that `gh` and `ngh` take **i, e, ê** but not `y`, whereas `k` also takes `y` (`kỳ`,
`ký`). Confidence `check` on the `y` asymmetry — I believe it is right, but `y` as a bare
nucleus is rare enough that the seed list avoids it entirely rather than rely on it.

**Three hard rules for the round generator:**

1. **Never put `c` and `k` in the same palette. Never `g` and `gh`. Never `ng` and `ngh`.**
   They are homophones; only one is ever legal for a given rime; offering both asks the
   child to guess and then punishes him for guessing wrong.
2. **The palette generator derives the correct spelling from the target rime**, it does not
   store it per word and hope.
3. A palette containing `ngh` and the rime `a` teaches a spelling that does not exist. The
   validator must reject that combination in a generated round *and* in a pack entry his
   mother types.

### 4.2 `ngh` has no seed word, deliberately

There is no picturable monosyllabic noun in a 4-year-old's Vietnamese that begins with
`ngh`. (`nghé` — a buffalo calf — is the closest, and the only available picture is an adult
water buffalo, which teaches the wrong referent.) `ngh` is therefore taught by the *rule*
(the palette never offers it wrongly) and not by an example word. This is a finding, not an
omission: if his mother later adds an `ngh` word, the model already handles it.

---

## 5. Tone (thanh)

### 5.1 The six tones

| Tile | Name | Mark | On `a` | On `eo` | Northern | Southern |
|---|---|---|---|---|---|---|
| 1 | **ngang** | *(none)* | a | eo | mid level | mid level |
| 2 | **huyền** | grave `◌̀` | à | èo | low falling | low falling |
| 3 | **sắc** | acute `◌́` | á | éo | high rising | high rising |
| 4 | **hỏi** | hook above `◌̉` | ả | ẻo | mid dipping-rising | **merged with ngã** |
| 5 | **ngã** | tilde `◌̃` | ã | ẽo | high broken/glottalised | **merged with hỏi** |
| 6 | **nặng** | dot below `◌̣` | ạ | ẹo | low glottalised | low falling |

Confidence `high` on the inventory, the marks and the hỏi/ngã merger in the south.
Confidence `check` on the precise phonetic descriptions — they are the standard textbook
descriptions but the app does not depend on them.

### 5.2 The checked-syllable rule

**A rime ending in `p`, `t`, `c` or `ch` can carry only `sắc` or `nặng`.** `sách` and `sạch`
exist; `sàch`, `sảch`, `sãch`, `sach` do not. Confidence `high` — this is a hard,
exceptionless constraint of Vietnamese phonology.

This is load-bearing for the UI: **the tone row is generated from the selected rime's legal
tone set**, so for `sách` the tone row shows two tiles, not six. The child never sees an
option that cannot be right. Legality enforces itself and no separate "wrong tone" error
state is needed.

### 5.3 Decision: `ngang` is a tile he presses

**Decided: yes, `ngang` is a real tile.** Reasons:

1. **It is a tone.** Vietnamese has six tones and `ngang` is one of them. Teaching "no mark
   means no tone" teaches something false, and the app's whole job is not to do that.
2. **The engine cannot otherwise tell "hasn't chosen yet" from "chose level".** With tone as
   an optional slot, every round has an ambiguous state and the engine needs a timer or a
   "done" button to disambiguate. Both are worse.
3. **Uniform ritual.** Onset, rime, tone — three taps, every time. A 4-year-old benefits
   from the same shape every round far more than he benefits from saving one tap.
4. It gives him an explicit winning action on the *easiest* words, instead of the word
   resolving by itself while he is still looking at the tone row.

**But the audio does not name it.** The classroom chant for a `ngang` word is `dờ - ê - dê`,
with no tone-naming step. So: pressing the tile plays its own name; the resolution sequence
(§7) omits the tone step for `ngang`. Tradition and mechanics each get what they need.

Tile's own audio label: `"ngang"`. Vietnamese teachers commonly say `"không dấu"` ("no mark")
to small children and the owner's wife may prefer that. The label is a per-tile string in
the pack, so she can change it without a developer — that is what "content is editable data"
buys, and it is the right place to spend it.

### 5.4 Decision: the tone tile shows the *chosen rime*, marked

> **Unchanged, verbatim (§0.8).** The rime is still known, so this holds exactly as written.
> This is the clearest single dividend of keeping đánh vần.

A tone mark on its own (`◌̀`, or a mark on a dotted circle) is an abstraction a 4-year-old
cannot read. **The tone tiles render the rime he has already selected, with each tone
applied:**

```
he has chosen rime "eo"  →  tone row shows:   eo   èo   éo   ẻo   ẽo   ẹo
he has chosen rime "ach" →  tone row shows:   ách  ạch          (2 tiles, §5.2)
```

He sees the actual outcome of each choice, not a floating diacritic. Consequences handed to
other agents:

- **game-designer:** this imposes an order — rime before tone. The tone row is inert/dim
  until a rime is selected. Onset may be chosen at any point.
- **content-engineer:** a rime entry carries its six toned forms explicitly, with illegal
  ones null:

  ```
  rime "ach": { ngang: null, huyen: null, sac: "ách", hoi: null, nga: null, nang: "ạch" }
  ```

  The editor generates these when his mother adds a rime, shows them to her, and lets her
  correct them. **Composition happens once, in the editor, in front of a human — never at
  runtime.**

### 5.5 Where the mark sits on stacked vowels

> **CORRECTED by §0.14** — the `oa`/`oe`/`uy` paragraph mislabels which form is "new style".
> The *recommendation* (`hòa`) is unchanged; ignore the labels.

Stated for completeness and for the editor's generator. **No runtime code implements this** —
the pack stores the composed strings (§1.2, §5.4).

| Nucleus | Mark goes on | Examples |
|---|---|---|
| single vowel | that vowel | `bò`, `cá`, `mũ` |
| `ia` `ua` `ưa` (open) | the **first** vowel | `mía`, `múa`, `mưa`, `sữa`, `cửa` |
| `iê` `uô` `ươ` (closed) | the **second** vowel | `tiếng`, `chuông`, `người` |
| nucleus + final consonant | the last vowel of the nucleus | `bánh`, `mắt`, `trứng` |
| `oa` `oe` `uy` | **contested — see below** | `hòa` vs `hoà` |

**`oa`/`oe`/`uy` is a genuine, unresolved orthographic disagreement among Vietnamese
writers**, not something I am unsure of: "new style" writes `hòa`, `hòe`, `thúy` (mark on the
nucleus); "old style" writes `hoà`, `hoè`, `thuý` (mark on the first vowel). Both are in
circulation, both are produced by common input methods, and Vietnamese adults argue about
it.

**Recommendation: new style (`hòa`), because it is what current textbooks and default input
methods produce.** Because the spelling is data, if the owner disagrees he changes one string
and nothing else. Only one seed word is affected (`hoa`, which is `ngang` and so carries no
mark at all) — so this costs the seed list nothing and only matters for words his mother
adds.

---

## 6. Dialect: the northern/southern problem

**No dialect of Vietnamese distinguishes everything the orthography distinguishes.** This is
not a defect of any speaker; it is the nature of a writing system serving several dialects.
It has one very concrete consequence for this app.

| Written distinction | Northern | Southern |
|---|---|---|
| `hỏi` vs `ngã` | distinct | **merged** |
| `d` vs `gi` vs `r` | **all merged** to /z/ | `d`=`gi` /j/, `r` distinct |
| `s` vs `x` | **merged** in conversational Hanoi | distinct |
| `ch` vs `tr` | **merged** in conversational Hanoi | distinct |
| final `-n` vs `-ng`, `-t` vs `-c` | distinct | **merged** after some vowels |

Confidence `high` on hỏi/ngã and on d/gi/r. Confidence `check` on the s/x and ch/tr
descriptions (they are the standard account of conversational vs careful Hanoi speech) and
on the southern final mergers (real, but the conditioning environments are more detailed than
stated here).

### 6.1 The rule this produces

> **No round may be won or lost on a distinction the child's dialect does not make.**

Concretely, the distractor generator reads a `dialect` field and never places two tiles from
the same homophone set in one palette:

| Dialect | Sets that must not co-occur in a palette |
|---|---|
| **northern** | {`d`, `gi`, `r`}, {`s`, `x`}, {`ch`, `tr`} |
| **southern** | {`hỏi`, `ngã`}, {`d`, `gi`} |
| **both** | {`c`, `k`}, {`g`, `gh`}, {`ng`, `ngh`} — already illegal per §4.1 |

If a southern child sees `thỏ` and `thõ` side by side, the game is asking him to hear a
difference he does not produce and has no way to get right. He will fail, and he has no
patience for failure.

**`ngã` is still taught** — he must eventually spell `sữa` and `mũi` correctly. It is taught
by *memory attached to a picture*, which is exactly what this app is, and never by ear. The
palette rule only prevents `hỏi` and `ngã` from being the sole difference between two
offered answers.

### 6.2 What the owner must decide

The dialect. See `open-questions.md` Q1 — including the fact that **the Piper voice
`vi_VN-vais1000` has a dialect and nobody has listened to it yet**, and if it is northern
while the child is southern, every syllable he hears will differ from his mother's.

---

## 7. The đánh vần audio sequence

> **§7.1 is superseded by §0.9** (a tap speaks the *unit-so-far*, and a digraph completion
> re-voices). **§7.2 — the chant — is unchanged**, and §7.3's two cautions still apply plus one
> more (§0.12).

### 7.1 Tile-press feedback (any time, always)

| Tile type | Plays |
|---|---|
| onset | its đánh vần name — `mờ`, `chờ`, `quờ` (§2) |
| rime | the rime read aloud — `eo`, `ăng`, `ưa` |
| tone | the tone's name — `huyền`, `ngã`, `ngang` |

### 7.2 On resolution — the chant

The standard Vietnamese classroom chant, in order. Gaps are a starting point for the
game-designer to tune, not a specification.

**Word with a tone mark — `mèo` (m + eo + huyền):**

| Step | Audio | Gap after | Visual |
|---|---|---|---|
| 1 | `mờ` | 250 ms | onset tile lifts |
| 2 | `eo` | 250 ms | rime tile lifts |
| 3 | `meo` | 400 ms | onset+rime shown joined, **no mark yet** |
| 4 | `huyền` | 250 ms | the mark animates into place |
| 5 | `mèo` | 600 ms | **picture appears here, not before** |
| 6 | `Con mèo.` *(optional)* | — | picture held |

**`ngang` word — `dê` (d + ê + ngang):** the tone step is omitted, and step 3 is already the
word.

| Step | Audio | Visual |
|---|---|---|
| 1 | `dờ` | onset lifts |
| 2 | `ê` | rime lifts |
| 3 | `dê` | **picture appears** |
| 4 | `dê` *(reward repeat)* | picture held |

**Zero-onset word — `áo` (∅ + ao + sắc):** no onset step.

| Step | Audio |
|---|---|
| 1 | `ao` |
| 2 | `sắc` |
| 3 | `áo` — picture appears |

### 7.3 Audio assets this requires

| Set | Count | Source |
|---|---|---|
| onset names (`bờ` … `xờ`) | 26 | Piper. The spike synthesised `mờ` successfully (`spike-results.md`). |
| rime readings | one per rime in the pack (~32 at seed) | Piper |
| tone names | 6 | Piper. Spike synthesised `huyền`. |
| per word: toneless blend (step 3) | 1 per word | Piper |
| per word: full word (step 5) | 1 per word | Piper, **or the parent's recorded voice** |
| per word: sentence (step 6) | 1 per word, optional | Piper |

**Vietnamese has no TTS problem.** Every clip above is ordinary Vietnamese text that Piper
can read — `mờ`, `eo`, `huyền` were all produced in the spike. (English does have one; see
`literacy-en.md` §3.4.)

Two cautions carried from the spike:

1. **Vietnamese syllables came out at 0.17–0.30 s.** That is adult-fluent and too fast for a
   4-year-old learning the chant. Treat `length-scale` as a per-clip tuning parameter, and
   tune the *isolated onset and rime clips* slower than the full word — the chant's job is
   to be decomposable.
2. **The step-3 toneless blend is sometimes not a real word** (`sưa` for `sữa`, `cua`→fine,
   `ngua` for `ngựa`). Vietnamese orthography is transparent so Piper should read them
   correctly, but *should* is not *does*: every step-3 clip needs a listening check before
   it ships. This is the seed list's single largest QA item.

---

## 8. How many tiles — the progression

> **SUPERSEDED.** The stage ladder was deleted by `gameplay.md` §3.6 in revision 3, and the
> per-row caps by the constant table. The board is 35 cells, paged to the device (§0.11).

### 8.1 The cap is per row, not per screen

Vietnamese mode has three labelled rows (onsets / rimes / tones). He never scans the whole
screen for one choice — he scans one row. So the meaningful limit is **6 tiles per row**,
with an absolute screen cap of **16**.

### 8.2 Arithmetic, for the game-designer

On a 360 dp portrait viewport with 16 dp side gutters, 328 dp of usable width:

| Tile size | Gap | Tiles per visual line | Total width |
|---|---|---|---|
| 72 dp | 10 dp | 4 | 318 dp ✓ |
| 60 dp | 10 dp | 5 | 340 dp ✗ (overflows) |
| 56 dp | 8 dp | 5 | 312 dp ✓ but below a comfortable preschool target |

Material's minimum touch target is 48 dp and a 4-year-old's finger placement is worse than
an adult's, so **72 dp is the floor, which means 4 tiles per visual line.** A 6-tile row is
therefore 3 + 3 across two lines. The game-designer owns the layout; this is the constraint
it has to satisfy, plus headroom for Vietnamese diacritic ascenders (`ẽ`, `ộ`) which push the
line box taller than Latin text.

### 8.3 The progression

Each stage widens the palette *and* widens the structure. Every round always contains the
tiles the target needs; the rest are distractors.

| Stage | Onsets | Rimes | Tones | Screen total | Structure introduced | Tones available |
|---|---|---|---|---|---|---|
| **1** | 2 | 2 | 1 | 5 | single-letter onset, open one-vowel rime | ngang, huyền |
| **2** | 3 | 3 | 2 | 8 | glide-final rimes (`ai ao ay ây âu eo oi ui`), `ua`/`ưa` | + sắc |
| **3** | 4 | 4 | 3 | 11 | digraph onsets (`ch kh nh th tr ng`), zero onset, nasal finals | + nặng |
| **4** | 5 | 5 | ≤4 | ≤14 | stop finals (`p t c ch`) — tone row shrinks to 2 here | + hỏi |
| **5** | 6 | 6 | ≤6 | ≤16 | spelling-rule onsets (`k gh gi qu`), medial rimes (`oa`) | + ngã |

**Stage 1 is deliberately almost trivially easy.** 5 tiles, 2×2×1 = 4 possible answers, one
of which is right. He should win the first round in under ten seconds, because the thing
that kills this app is not that it is too easy — it is that he quits.

**The tone row shrinks by itself.** Because tone tiles are generated from the rime's legal
set (§5.2), a stop-final rime at stage 4 produces a 2-tile tone row. The palette gets
*simpler* exactly where the structure gets harder. That is free and it is worth not
accidentally engineering away.

**Escalation should be per-word, not global.** A child who has seen `mèo` ten times should
get it at a wider palette than a word he is meeting for the first time. Whether v1 tracks
that is the game-designer's and app-developer's call; the content model supports it because
stage is a property of the round, not of the word.

---

## 9. What this document hands to the other agents

> **SUPERSEDED by §0.15.**

| To | Requirement |
|---|---|
| content-engineer | `word.syllables` is an array of `{onset, rime, tone}` from day one (§1.1). Word entries store the final composed spelling (§1.2). Rime entries store six toned forms with nulls for illegal tones (§5.4). Pack carries a `dialect` field (§6). Tile audio labels are editable strings (§5.3). |
| content-engineer | The pack validator must reject: `ngh`/`gh`/`k` before a non-front rime and vice versa (§4.1); a non-`sắc`/`nặng` tone on a stop-final rime (§5.2); a palette containing a homophone pair for the selected dialect (§6.1). |
| game-designer | Three labelled rows. ≤6 tiles per logical row, ≤4 per visual line at 72 dp (§8.2). Tone row is inert until a rime is chosen (§5.4). Picture appears at chant step 5, not on the last tap (§7.2). Diacritic ascender headroom. |
| content-engineer | Tune Piper `length-scale` per clip; onset/rime clips slower than words (§7.3). Every step-3 toneless blend needs a human listening check. |
| owner | `open-questions.md` Q1 (dialect), Q2 (TTS voice dialect), Q5 (ngã in v1). |
