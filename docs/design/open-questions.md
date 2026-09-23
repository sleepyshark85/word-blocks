# Open questions for the owner

Raised by the literacy-designer. Only questions that **genuinely turn on the owner** —
things about his son, his family, his dialect or his willingness to spend ten minutes are in
here. Everything I could decide, I decided, and it is in `literacy-vi.md`, `literacy-en.md`
and `word-list.md`.

Every question carries a recommendation. If the owner says nothing, the recommendation is
what gets built.

---

## Q1 · Northern or southern Vietnamese? **(blocking)**

The one question that changes content, not just polish.

No dialect of Vietnamese distinguishes everything the spelling distinguishes
(`literacy-vi.md` §6):

| Written | Northern | Southern |
|---|---|---|
| `hỏi` vs `ngã` | distinct | **merged — one tone** |
| `d` vs `gi` vs `r` | **all one sound** | `d`=`gi`, `r` distinct |
| `s` vs `x`, `ch` vs `tr` | **merged in conversational Hanoi** | distinct |

The app must never make a round turn on a distinction the child does not make — he will
fail, and he has no patience for failure. The distractor generator reads a `dialect` field
and refuses to put homophones in the same palette. It needs a value.

**Recommendation: whatever his mother speaks at home.** Not what is "standard" — the child
is learning to map his own speech onto letters, and his mother's voice is the reference.

---

## Q2 · What dialect is the Piper Vietnamese voice? **(needs an ear, not a decision)**

`vi_VN-vais1000` was downloaded and works (`spike-results.md`), and **nobody has listened to
it to find out what dialect it speaks.** If it is northern and the child is southern, every
single syllable he hears from the app will differ from his mother's.

**Recommendation:** the owner listens to the four sample files already on disk —
`samples/audio/vi/meo.wav`, `chim.wav`, `onset-m.wav`, `tone-huyen.wav` — and says which it
sounds like. Thirty seconds.

If it is the wrong dialect there are two honest answers: accept it (the spelling is still
correct, only the accent is foreign) or record the words himself. Recording ~47 Vietnamese
words plus 26 onsets, 32 rimes and 6 tone names is not a small job; accepting the accent is
a reasonable choice and worth making consciously rather than by default.

---

## Q3 · How much Vietnamese does his son already have, and which language does he meet first?

Two things ride on this:

- **Where stage 1 starts.** A child who already recognises some letters can start at 4–6
  tiles; a child meeting them for the first time should start at 5 tiles with four possible
  answers (`literacy-vi.md` §8.3). Starting too hard is the common way this kind of app
  loses a 4-year-old in the first two minutes.
- **Whether both modes ship in v1** or one comes first.

**Recommendation: ship Vietnamese first.** Its model is the one that is genuinely different
from every other letter game, it is the one the owner cannot buy off a shelf, and English
mode is the simpler build once the machine exists. Also, English mode has an audio
dependency Vietnamese does not (Q4).

If the owner's answer is "hardly any Vietnamese yet", start at stage 1 and let the first
five words be almost free wins.

---

## Q4 · Will the owner record 26 English letter sounds? **(blocks English mode)**

**Piper cannot synthesise "the sound of `c`."** There is no text that spells a phoneme —
typing `c` makes it say *"see"*, the letter **name**, which is exactly what
`literacy-en.md` §2 rules out. Typing `cuh` gives an exaggerated schwa. This is a category
problem, not a tuning problem, and it is the **only** asset in either language that TTS
cannot produce correctly. Vietnamese has no equivalent gap — `mờ`, `eo` and `huyền` are
ordinary text and Piper read them fine in the spike.

**Recommendation: the owner records them.** Roughly 26 clips, about ten minutes, and it is
pedagogically better than synthesis anyway (`spike-results.md`: "a parent's recorded voice
beats any synthesised voice for this child"). Guidance: clip the stops short — `/t/`, not
*"tuh"*.

Fallback if he would rather not: drive Piper at the espeak phoneme level. **Unproven on this
machine** and it should be spiked before anyone relies on it.

---

## Q5 · Should `ngã` words ship in v1 if the answer to Q1 is "southern"?

In southern Vietnamese `hỏi` and `ngã` are the same sound. A southern child must still learn
to *spell* `sữa` and `mũi` with `ngã`, but he can only learn it by memory attached to a
picture — never by ear.

**Recommendation: keep them, at stage 5, and never let `hỏi` and `ngã` be the only
difference between two offered answers** (`literacy-vi.md` §6.1). That is already the design.
Three seed words are affected: `mũ`, `mũi`, `sữa`.

Flagged only because the owner may prefer his son not meet a distinction he cannot hear
until he is older. That is a legitimate parenting call and not mine to make.

---

## Q6 · Six words whose *concept* is ambiguous

These are not spelling questions. The picture decides which word the child learns, and for
these six there is more than one defensible picture.

| Word | The problem | Recommendation |
|---|---|---|
| `bánh` (vi) | genuinely generic in Vietnamese — cake, bread, pastry, `bánh mì`, `bánh chưng` | replace with something specific his son eats; ask the owner for the word |
| `xe` (vi) | "vehicle" generally; a picture of a car teaches `ô tô` | keep, picture a car — a 4-year-old says `xe` for a car |
| `hoa` (vi) | "flower" generally; one hibiscus teaches *hibiscus* | keep, and use **several varied flowers** — `image-sourcing.md`'s "several per word" is exactly the fix |
| `cam` (vi) | Fluent has only `Tangerine`, which is not an orange | photo |
| `bat` (en) | English `bat` is both an animal and a baseball bat | picture the animal; the word list should note that `bat` has a second meaning the app is not teaching |
| `nut` (en) | Fluent `Nut and bolt` is the **hardware** sense — the wrong word entirely | photo, or `Peanuts`; never `Nut and bolt` |

**Recommendation: the owner reads the 87-row list in `word-list.md` once and crosses out
anything his son would not recognise.** He is the only person who knows. Ten minutes of his
time removes the single largest source of quiet wrongness in the whole app.

---

## Q7 · Photos for the Vietnamese cultural words

`phở`, `nón` (lá), `bún` have no emoji and no acceptable English-Wikipedia image
(`image-sourcing.md` notes the Anglo-centrism directly). They are also words this child
actually uses, which makes their absence conspicuous.

**Recommendation:** source them from `vi.wikipedia.org`, and treat a photo his mother takes
of an actual bowl of phở at their table as strictly better. They stay out of the shipping 47
until a picture exists (`word-list.md` §4, appendix).

---

## Q8 · Confirm: one syllable per word in v1?

Vietnamese words are often two syllables — `ô tô`, `máy bay`, `con mèo`. The v1 machine
builds **one**, so the seed list is monosyllabic only. The pack format already stores
syllables as an array so that adding two-syllable words later is not a migration on a live
pack (`literacy-vi.md` §1.1).

**Recommendation: confirm one syllable for v1.** It is the right scope, and the cost of
being wrong has already been designed out.

---

## Q9 · Is his son being taught đánh vần? **(ANSWERED — kept as a record)**

**Asked 2026-09-23, during revision 5. His answer, verbatim:**

> yes, he's learning đánh vần and using vietnamese characters, including combined characters
> like ch, tr ...

**This question is kept rather than deleted because two designs were built before it was
asked, and both were wrong in opposite directions.** The first deleted the digraphs and
abandoned đánh vần; the second kept digraph tiles and read his complaint as being only about
ordering. He then clarified a second time — *"for character combining, he will still going
through character by character, event for combine ones like ch, tr …(Choose C and choose H
…). This to keep the table consistent"* — and the settled answer is **letter-by-letter input
over an unchanged đánh vần model** (`literacy-vi.md` §0).

**The lesson for whoever reads his original message next:** it describes a *surface*, and both
wrong answers came from silently inferring a *model* from it. Ask.

---

## Q10 · English tiles: letter **sounds** or letter **names**? **(decided — free to reverse)**

A standard 26-letter alphabet table is, in most of the world, a *naming* artefact — a child
points at `c` and an adult says *"see"*. Now that the English board is exactly that chart, it
is fair to ask whether the tiles should say names.

**Recommendation, and what is built: sounds.** The reasoning is in `literacy-en.md` §0.4 and
§2 — names do not blend (`"see-ay-tee"` is nothing), and sounds make `c` mean the same thing
in both languages, where names would make it mean two unrelated things to one child.

**If the owner disagrees after hearing it, reversing costs 26 clip replacements and no code
change.** Tile audio is per-tile pack data. This is deliberately the cheapest reversal in the
app.

**A separate, smaller question in the same area:** he typed the alphabet in capitals. That is
read as ordinary prose, not as a request for uppercase tiles — `literacy-en.md` §2.5 keeps
lowercase, because uppercase is a second unrelated grapheme set at no gain at age 4. If he
actually wants capitals it is a glyph-casing switch in the pack and not a literacy change.

---

## Q11 · What order does his son recite the six tones in?

The pack ships `ngang · sắc · huyền · hỏi · nặng · ngã`, which is **frequency order** — `sắc`
is the commonest tone in the seed list — and it is the same defect he spotted in the letter
order (`literacy-vi.md` §0.2). It is being corrected; the only question is to what.

| Candidate | Order | Note |
|---|---|---|
| **Recitation (recommended, and built)** | `ngang · huyền · sắc · hỏi · ngã · nặng` | *"huyền, sắc, hỏi, ngã, nặng"* is a set phrase Vietnamese speakers say as a unit, with `ngang` (`không dấu`) before it |
| Dictionary collation | `ngang · huyền · hỏi · ngã · sắc · nặng` | the order a Vietnamese dictionary sorts in — `ba bà bả bã bá bạ`. Differs only in where `sắc` sits |

**Recommendation: recitation order.** The board is a teaching surface, not an index, and the
recitation is what he hears in class. **Confidence `check` on `huyền` vs `sắc` in second
place** — both orders are in real use and I am not certain which his son's book prints. This
is a one-glance answer for a Vietnamese parent whose son is in đánh vần lessons right now, and
it is a fixed sequence a child memorises, so it is worth getting right rather than guessing.

---

## What is *not* in this file

Decided, not asked. Listed so the owner can see the shape of what was settled without
reading three documents:

| Decision | Where |
|---|---|
| `ngang` is a tile he presses, not the absence of one | `literacy-vi.md` §5.3 |
| Tone tiles show the chosen rime with the mark applied, so he sees the outcome | `literacy-vi.md` §5.4 |
| The engine never composes a spelling or places a tone mark — spellings are data | `literacy-vi.md` §1.2 |
| English tiles carry letter **sounds**, never letter names; lowercase only | `literacy-en.md` §2 |
| Two separate word lists, sharing only a build-time asset key | `word-list.md` §1 |
| English is CVC-only first, then digraphs, then blends; magic-e is post-v1 | `literacy-en.md` §5.2 |
| ≤6 tiles per Vietnamese row / ≤16 on screen; ≤8 in English | `literacy-vi.md` §8, `literacy-en.md` §6 |
| 40–50 words per language, not 150 | `word-list.md` §2 |

**Revision 5 additions to that list** (`literacy-vi.md` §0, `literacy-en.md` §0):

| Decision | Where |
|---|---|
| The table is the 29-letter Vietnamese alphabet / the 26-letter English alphabet, in dictionary order | `literacy-vi.md` §0.4, `literacy-en.md` §0.3 |
| A digraph is **two taps and still one sound**; the second tap re-voices to the digraph | `literacy-vi.md` §0.9, `literacy-en.md` §0.6 |
| The onset/rime boundary is **stored, never derived at runtime** — it is the first vowel letter, with `gi` and `qu` the only exceptions | `literacy-vi.md` §0.5 |
| Tone stays a run of six cells, live once the rime is complete; tone-marked vowels in the table would need 89 cells | `literacy-vi.md` §0.8 |
| English does **not** interleave its digraphs into the alphabet; Vietnamese does. Each language follows its own dictionary order | `literacy-en.md` §0.7 |
