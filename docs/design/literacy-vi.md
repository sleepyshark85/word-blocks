# The Vietnamese model — âm đầu + vần + thanh

Owner: literacy-designer. This document defines what a tile *is* in Vietnamese mode, which
combinations are legal, how tone is presented, and what the child hears when a word
resolves. It is the input to the content pack format (content-engineer) and to the tile
layout (game-designer). It is not a screen design.

**Confidence marking.** Every rule below carries a confidence column. `high` means this is
standard Vietnamese primary-school orthography that I am confident is correct. `check`
means I believe it is correct but it should be confirmed with the owner or a Vietnamese
primary-school textbook before it is coded as a hard constraint. Nothing is stated
confidently that I am not confident about — a wrong rule here is worse than an open
question (`.claude/agents/literacy-designer.md:86`).

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

| To | Requirement |
|---|---|
| content-engineer | `word.syllables` is an array of `{onset, rime, tone}` from day one (§1.1). Word entries store the final composed spelling (§1.2). Rime entries store six toned forms with nulls for illegal tones (§5.4). Pack carries a `dialect` field (§6). Tile audio labels are editable strings (§5.3). |
| content-engineer | The pack validator must reject: `ngh`/`gh`/`k` before a non-front rime and vice versa (§4.1); a non-`sắc`/`nặng` tone on a stop-final rime (§5.2); a palette containing a homophone pair for the selected dialect (§6.1). |
| game-designer | Three labelled rows. ≤6 tiles per logical row, ≤4 per visual line at 72 dp (§8.2). Tone row is inert until a rime is chosen (§5.4). Picture appears at chant step 5, not on the last tap (§7.2). Diacritic ascender headroom. |
| content-engineer | Tune Piper `length-scale` per clip; onset/rime clips slower than words (§7.3). Every step-3 toneless blend needs a human listening check. |
| owner | `open-questions.md` Q1 (dialect), Q2 (TTS voice dialect), Q5 (ngã in v1). |
