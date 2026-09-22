# The English model — CVC phonics

Owner: literacy-designer. Companion to `literacy-vi.md`. Same confidence convention: `high`
means I am confident this is correct; `check` means confirm before hard-coding.

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

| To | Requirement |
|---|---|
| content-engineer | Tile audio is **phoneme clips, not letter names** (§2). The ~26 letter-sound clips are the one set Piper cannot produce and should be **recorded by the owner** (§3.4, `open-questions.md` Q4). |
| content-engineer | Validator rejects: `ck`/`ll`/`ss`/`ff`/`zz`/`ng` in initial position; `x` in initial position; `c` and `k` in one palette (§3.3, §6.2). |
| game-designer | Vowel tiles visually distinct from consonants (§3.2). Lowercase only (§2.5). ≤8 tiles, 4 per visual line (§6). Same resolution ritual as Vietnamese — parts, whole, picture, sentence (§4.2). |
| game-designer | Distractors drawn from the same word family, and a *wrong but real* word should be rewarded with its own picture rather than treated as a failure (§6.2). |
| owner | `open-questions.md` Q4 (recording letter sounds), Q3 (which language he meets first). |
