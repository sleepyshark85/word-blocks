# Gameplay — the mechanic, the loop, progression, session

**Ghép Chữ** (Vietnamese mode) · **Word Blocks** (English mode).

Owner: game-designer. Companions: `ui.md` (how it looks and moves),
`acceptance-criteria.md` (what "done" means), `open-questions-ui.md` (what needs the owner).

Designed around and not relitigating: `decisions.md`, `literacy-vi.md`, `literacy-en.md`,
`word-list.md`, `image-sourcing.md`, `spike-results.md`, `development-process.md`.

Platform constraints handed down by the orchestrator and treated as settled:
iOS + Android, phone + tablet; responsive across a continuous range, not named devices;
a bundled Vietnamese-capable font; React Native's built-in `Animated`, no Reanimated, no
gesture-handler.

---

## 0. CORRECTION — the mechanic was wrong, and this is what changed

**Revision 2. 2026-09-23.** Slices 0–3 were built and shipped against revision 1 of this
document. Revision 1 was wrong about the single most important thing in the app, and this
section is here so that the history is legible rather than quietly overwritten.

### 0.1 What revision 1 did

It picked a target word, showed its photograph under a veil as the *prompt*, and offered a
**palette built for that target** — the tiles the word needs plus a few distractors. The
child completed a word the app had chosen. **Guided completion.**

That followed from one decision taken in the opening conversation: *constrain the palette to
the round, because with a full inventory a 4-year-old produces garbage and quits.* Everything
in revision 1 — the veil, the segment border, the found-word win, the not-a-word settle, the
five-round page, the per-word stage bump — is downstream of it.

### 0.2 What the owner actually asked for, in his words

> "The game is not suggesting words with already picked image, but should be the other way
> around. The game show a table of characters, the toddler chooses character by character to
> form a word, some characters may be disabled based on the characters have been chosen (for
> beginning characters as well, where they doesn't start a word the app has). And when a word
> is formed, there should be an announcement from the game (a fun and catchy announcement)."

And, from his first message: *"The game is about choosing characters. When the combined
characters forms a word, the app let him see a picture describe the meaning of the word."*

### 0.3 The mechanic, restated — **discovery, not completion**

1. A **table of characters** is on screen. Not a palette built for a target: the inventory.
2. He taps characters one at a time and they assemble into a word.
3. **Characters that cannot lead to a real word are disabled** — including at the very first
   position, where only characters that *begin* some word in the pack are live.
4. Because of (3), **garbage is structurally impossible.** Every live path ends in a real
   word. This is a better answer to the original worry than revision 1's, because it
   constrains the board without choosing for him.
5. When the assembled characters **are** a word: a **fun, catchy announcement**, then the
   picture.

The picture is now purely the **reward**. It is never a prompt, it is not on the board, and
it is not on screen until he has made something.

Mechanically this is a **prefix tree over the pack's words** — Vietnamese over
`(onset, rime, tone)` triples, English over tile sequences. The live set at any point is the
set of next symbols with at least one completion.

### 0.4 What survives revision 1 unchanged

The two literacy models (onset + rime + tone; English letter *sounds*), no fail state, no
timer, no score, co-play with his mother, the three themes with Popsicle default, Baloo 2 /
Be Vietnam Pro, the tile visual system and its contrast solution, the parental gate, the
language chosen at launch and never mixing, tap-only, the 72 pt motor floor, the audio
latency budget, the accessibility rules, and the whole editor except three additions.

### 0.5 What revision 2 deletes, and why

| Deleted | Because |
|---|---|
| the target word, and therefore the **round** | nothing picks a word any more; he does |
| the **veiled prompt photograph** and the picture frame on the board | the picture is the reward; putting it up front gave the answer away and ate 620 pt of screen |
| the frame's **N-segment border** and the **veil stepping down** | they signalled "this tile was right for the target". There is no target |
| the **found-word win** (`gameplay.md` r1 §4.4 B) | every word he builds is now the word he built. The special case *was* the general case all along |
| the **not-a-word settle** — the rock, the read-back, the self-tidy | a not-a-word state cannot be reached. The three most intricate states in revision 1 are gone, not reimplemented |
| the **word queue / bag**, and re-insertion rules | nothing is served to him |
| the **per-word stage bump** (`roundStage(word)`) | stage is a property of the table now, not of a round |
| the **five-round page** and its dot rail | replaced by the shelf and the album, §6 |
| the **caption strip** on the board | its job was to show *her* the target word. There is no target; the assembled word is already on screen, in tiles, full size. (This is also the fix for the Slice-3 defect that the layout law never budgeted for it — it is not budgeted for because it no longer exists.) |

### 0.6 What revision 2 adds

The **character table** and its live/disabled states (`ui.md` §5.8), the **announcement**
(§5), **undo** (§4.4), **re-discovery** (§5.6), the **prefix-word continuation** (§5.5), the
**shelf** and the **album as a collection** (§6), a rewritten **idle ladder** (§6.4), and
three editor additions (§7.4).

---

## 1. The four sentences this design has to satisfy

1. **He cannot read** — but **his mother plays with him.** The rule is *nothing he needs is
   text-only, and nothing on screen asks him to read.* Revision 2 makes this easier: the only
   glyphs on the board are the letters themselves, which are the game.
2. **There is no way to lose.** Not softened — *absent*. No timer, no score, no lives, no
   buzzer, no "try again", and no state he can enter that he cannot leave. Revision 2
   strengthens this from a promise into a structural property (§3.3).
3. **The languages never mix.** Chosen at launch. The two modes share no screen, no table, no
   colour, no tile shape and no title (`ui.md` §3).
4. **It must fit every screen it lands on.** Not three test devices — a continuous range,
   with a fit rule that either passes or fails (`ui.md` §4.3).
5. **Neither language is secondary.** Both modes ship complete, with the same ritual, the same
   states and the same acceptance criteria.

---

## 2. Decision: optimise the child's game for a 10-inch tablet; optimise the editor for a phone

Unchanged from revision 1, and revision 2 makes the tablet case better rather than worse.

| | Optimised for | The other case |
|---|---|---|
| **The game** (the child) | a **10-inch tablet**, flat on a table or propped | a phone in portrait is **fully supported**, with smaller tiles and a shorter table — the same layout, not a different one |
| **The editor** (his mother) | a **phone in one hand** | on a tablet it renders as a centred 520 pt column, not a stretched form |

Why the tablet: it is where a toddler's app actually lives, and the extra room now buys the
one thing that matters most — **a bigger table with bigger tiles**. Measured (`ui.md` §4.4):
an iPad shows the full 24-cell table as **6 × 4 at 112 pt**; the 360 × 640 Android floor shows
it as **4 × 5 at 73 pt** and tops out at 20 cells. Why the phone for the editor: his mother
will add a word standing in the kitchen holding the thing she is photographing.

### 2.1 Orientation is decided by the fit rule, not by device class

The app supports an orientation **iff the layout fit rule passes for the 20-cell table**
(`ui.md` §4.3, rule F7). Evaluated once at startup from the screen metrics, not per frame.

In practice: **phones lock to portrait** (a landscape phone serves only a 12-cell table and is
rejected — arithmetic, not taste), and **tablets rotate freely**. There is **one layout**, a
vertical stack, in both orientations. Rotating changes the grid from 4 × 5 to 6 × 4 and
nothing else; the engine is pure and presentation replays resolved state, so seated symbols
stay seated and audio does not restart (`acceptance-criteria.md` §P).

---

## 3. The board

### 3.1 What is on screen

```
   top bar      ── mode title · the shelf (5 slots) · the gate dot
   word strip   ── what he has assembled so far, and the next empty cell
   the TABLE    ── the characters. Live ones stand up; the rest lie flat.
```

Nothing else. No menu, no back, no skip, no settings, no help button, no mascot, no
instruction, **and no picture**. The only non-play affordance is a 32 pt gate dot at 30%
opacity in the top-right — deliberately the hardest thing on screen for a small arm to reach
on a flat tablet, which is a feature (§7.2).

### 3.2 Decision: the table is the inventory, and it is the same table every time

**The table's contents do not depend on any word.** They depend only on the language, the
position (Vietnamese: onset, then rime, then tone) and the child's stage. Two consequences
worth having:

- **Spatial memory starts working.** `m` is in the same cell today as yesterday. Revision 1's
  palette was reshuffled every round, so nothing he learned about *where* things are was ever
  worth anything. This is the largest single pedagogical gain of the correction.
- **He is choosing, not searching.** In revision 1 exactly one tile was right and the rest
  were distractors, so the cost of a wide palette was a search. Here **every live tile is a
  correct move**, so a wide table is a wide *choice*. That is why the table can be four times
  the size of revision 1's palette without being four times harder.

### 3.3 Decision: garbage is impossible by construction, not by supervision

The live set at any point is `{ s : the pack contains a word beginning with prefix + s }`.
Three properties fall straight out, and all three are testable:

1. **Every live path ends in a word.** Starting from empty and tapping only live symbols, he
   always reaches a word.
2. **He can never be stuck.** Either the current prefix is a word, or at least one symbol is
   live, or both. There is no third case.
3. **There is no wrong tap.** Not "a wrong tap is handled gently" — there is no such thing as
   a wrong tap. The three most delicate states of revision 1 (rejection, not-a-word,
   found-word) are deleted rather than softened.

Measured over the shipped packs (`tools/` + the seed packs, 2026-09-23):

| | Vietnamese `vi-seed` | English `en-seed` |
|---|---|---|
| playable words | 47 | 40 |
| live symbols at position 1 | **24** onsets (incl. the zero onset) | **16** letters |
| live symbols at position 2 | 1–6 rimes, **mean 1.96** | 1–5 letters |
| live symbols at position 3 | **exactly 1 tone, in 47 of 47 cases** | 1–2 letters |
| words that are a proper prefix of another word | 0 (structural — see §5.5) | 0 today |

**The seed tree is wide and shallow: the real choice is at position 1.** For most Vietnamese
onsets, picking a letter commits the rest of the word. That is not a defect — "tap a letter,
get a picture" is exactly the owner's first sentence, and it is a very good first minute for a
4-year-old. It deepens by itself as words are added. Two notes handed on:

- **To the literacy-designer / content-engineer:** the tone step is currently a forced move in
  every single Vietnamese word. Tone minimal pairs (`bò`/`bó`/`bỏ`, `mà`/`mã`/`mả`,
  `thỏ`/`thọ`) are what turn position 3 into a real choice and they are the highest-value
  additions to the word list. This is a content lever, not a mechanic problem.
- **The forced tone is still a tap he makes.** It is never auto-committed. `literacy-vi.md`
  §5.3's argument for the `ngang` tile is the same argument: the uniform three-tap ritual is
  worth more to a 4-year-old than one saved tap, and a single live tone tile against five
  dimmed ones is the clearest possible statement of *this word wears this hat*.

### 3.4 Decision: he never starts anything, and the board is always ready

The app opens into the table (after the one-time language choice, §7.1). There is no lobby,
no play button, no tap-to-continue, no round start and no round end. The only place the flow
stops and waits is the **album** (§6.2), which is the designed stopping point for a parent.

---

## 4. Choosing characters

### 4.1 Decision: tap only. No drag anywhere in the game.

A tap seats a symbol. There is no drag, no long-press-to-drag, no rearranging.

- It is what a 4-year-old is good at. Drag needs a sustained contact, a controlled path and a
  controlled release, and he has none of the three.
- It removes `react-native-gesture-handler` from the app entirely.
- Every placement is a discrete, deterministic action the pure engine can replay.

### 4.2 Decision: what a live tap does

| | |
|---|---|
| Sound | the symbol's own clip, **within 60 ms of touch-down** (`ui.md` §11.1) |
| The tile | presses in, then flies to the next empty cell of the word strip (260 ms) |
| The strip | the cell fills; a new empty cell appears at the right (English) |
| The table | recomputes: symbols that can still lead to a word **stand up**; the rest **lie flat**. 200 ms. |
| The seat | a 90 ms wooden seat click |

**The table's response is the teaching.** The live set after his tap *is* the answer to "what
can follow this?", and he watches it change under his finger. Revision 1 had nothing like it.

### 4.3 Decision: what a disabled tap does — and it is not nothing

"Nothing happens" is a failure; he will think the app is broken. So a tap on a flat tile:

| | |
|---|---|
| Sound | **its own clip, in full, at the same latency** — every letter in the app is always a sound toy |
| The tile | dips 2 pt and returns, 120 ms, `calm` |
| Then | a soft muted knock at −9 dB — *tap on wood, not on a drum* |
| Never | no red, no shake, no buzzer, no "uh-oh", no grey-out, no toast, no motion elsewhere |

He learns, in one tap, that flat tiles talk but do not move. That is a physical rule a
4-year-old reads instantly, and it is not a rejection: **the letters that are lying down are
still his to press.** It also means the disabled set is doing real work — it is the only place
in the app where he meets a letter that is not part of the word he is making.

### 4.4 Decision: undo is the word strip, and there is no undo button

Revision 1 had no undo. Revision 2 must have one, because he will want a character back.

- **Tap any symbol in the strip → that symbol and everything after it returns to the table.**
  So tapping the last one is undo, and tapping the first one clears the strip.
- Everything after it goes too, because a middle symbol cannot be removed without leaving a
  prefix that was never on the tree. One rule, no illegal state.
- The removed symbols **fly home one at a time, 90 ms apart** (`exit`), each playing its own
  clip, and the table restands for the shorter prefix.
- A soft descending two-note *unclick* (140 ms) plays under it. It communicates *taken back*,
  and it is the only descending motif in the app, so it can never be confused with the
  announcement, which only rises.

No button, no glyph, no label. The affordance is the same one the game already teaches: the
strip is made of the same tiles the table is.

### 4.5 Decision: the strip states the shape of a word, honestly, in each language

| | Vietnamese | English |
|---|---|---|
| The strip | **three cells, always**: `onset ┊ rime ┊ tone` | the symbols placed, **plus one empty cell** |
| Because | a Vietnamese syllable is always exactly three slots (`literacy-vi.md` §1), and showing that is teaching, not a hint | an English word is 2–4 tiles and he is not told which — the length *is* part of the discovery |
| Zero onset | the first cell is filled by the **∅ tile** (§4.6), so the ritual is still three taps | — |

Neither strip ever tells him what the answer is. The Vietnamese strip tells him the *shape* of
every answer, which is true of every word in the language.

### 4.6 Decision: the zero onset is a tile in discovery mode

`literacy-vi.md` §2 lists the zero onset as "(no tile)", which was right when the app chose
the word: a zero-onset round simply rendered a one-cell plate. In discovery he has to be able
to *start* `ong` and `áo` himself, so there must be something to press.

**The ∅ tile is the last cell of the onset table, drawn as an empty socket** — a dashed
rounded outline with a centred dot, the same mark the strip's empty cells use. Its sound is a
soft low wooden *open* (140 ms), not a speech clip, because it has no đánh vần name. It is
live only when some eligible word has no onset. Flagged to the literacy-designer as the one
place revision 2 touches the Vietnamese tile inventory; it changes no rule, only whether the
zero onset is pressable.

---

## 5. When a word forms — the announcement

This is the payoff of the whole loop and the owner asked for it twice. It is specified here as
timing and meaning; `ui.md` §10.6 has the frame-by-frame and `ui.md` §11.4 the audio.

### 5.1 Decision: one signature motif, every time, forever

**A rising three-note figure on a soft mallet voice, 440 ms** — the same three notes in both
languages, at every stage, on the first word and the thousandth.

Catchy is **repetition plus anticipation**, not novelty. A motif he can hum after a day is
worth more than a library of variations he never learns to expect, and it is short enough to
survive a thousand plays. A spoken catchphrase was considered and rejected: it is a second
recorded asset per language, it collides with the word audio 600 ms later, and it is the
element that would go stale first.

**A fourth note, an octave up, is added when the word is new to him** (§5.6). So "I made a
word" and "I made a *new* word" are audibly different, with no number, no score and nothing to
read.

### 5.2 Decision: his mother's voice is the best version of this, so the editor can record it

One optional recording per pack — a cheer, 2 s, hers: *"Giỏi quá!"*, *"Yes!"*, anything. If it
exists it plays **over** the motif at t = 0. If it does not, the motif plays alone and nothing
is missing. Recorded on one screen in the editor (§7.4), and re-recordable in twenty seconds.

This is the cheapest warmth in the whole app: the announcement is the moment he will hear most
often, and it can be his mother saying well done.

### 5.3 The sequence, the first time he makes a word

| t (ms) | Audio | Visual | What it says |
|---|---|---|---|
| 0 | **the motif** (+ the cheer, if recorded) | the strip's symbols hop in sequence, 90 ms apart, `translateY −14`, `scale 1→1.14→1` | *you made a thing* |
| 300 | — | the strip's dividers dissolve; the symbols slide together into one word | *these are one word* |
| 350 | — | 12 confetti in the mode accent and `reward` drift outward | |
| 440 | **the chant** begins — §5.4 | each part's cell takes the gold face in turn | *and this is how it is built* |
| chant end | — | the word lifts and the **picture arrives**, scaling from the strip to full screen over 420 ms | *and this is what it means* |
| +200 | **the word, spoken** | picture held | |
| +1400 → +2200 | **silence** | the word sits large on the picture | the say-it-together beat (§5.7) |
| +2200 | the word, once more | | so the last thing heard is correct |
| +2200 → | held | each tap replays the word and **turns to the next photograph** | |
| exit | | the picture flies into the shelf (520 ms); the strip clears | *that one is kept* |

Total, first discovery, Vietnamese `mèo`: ≈ 5.4 s. Re-discovery: ≈ 3.2 s.

**The announcement fires on his tap, not after the chant.** The instant of recognition belongs
to him; the chant is the lesson that follows it. Revision 1 had this backwards — the payoff
arrived at the end of a five-step ritual.

### 5.4 The chant is unchanged, and it is still the literacy payload

Identical to revision 1 because `literacy-vi.md` §7.2 and `literacy-en.md` §4.2 specify it and
it is correct: **parts → whole.** Vietnamese `mèo`: `mờ` · `eo` · `meo` · `huyền` · `mèo`, with
the tone step omitted for `ngang` and the onset step omitted for a zero onset. English `cat`:
the **short** clips left to right, then `cat`. The picture now arrives *after* the chant's last
step rather than on it, which is the same beat with the reward moved 200 ms later and made
much bigger.

### 5.5 Decision: a word that is also a prefix — **announce, then continue**

If the assembled symbols are a word *and* at least one longer word continues them (`he` →
`hen`), the announcement, the chant and the picture all run in full. **Nothing is withheld and
there is no commit gesture** — a "done" button is a thing he must know to press, and a
4-year-old who does not press it has been failed by the design.

What differs is only the exit: **the picture flies to the shelf and the word stays in the
strip**, with the continuing symbols standing up in the table. `he` → picture of *he* → the
board returns with `he` assembled and `n` standing. He can continue, or tap the strip to clear
(§4.4), or do nothing and let the idle ladder continue for him (§6.4). All three are fine.

This is the best teaching moment the correction produced and it costs one rule.

In **Vietnamese it cannot occur**: a word is exactly three symbols, so no word is a proper
prefix of another. Measured today in English: zero cases in `en-seed`. The rule exists because
his mother will add `he`, `be` and `at`.

### 5.6 Decision: re-discovery — a different photograph, a shorter ritual, no new slot

He will build `mèo` twenty times. That is not a failure mode, it is what a 4-year-old does
with something he likes, and it must stay rewarding.

| | First discovery | Every later one |
|---|---|---|
| Motif | three notes **+ the fourth, an octave up** | three notes |
| Chant | full — parts, then whole | **whole word only**, straight to the picture |
| Picture | `images[0]` | **`images[encounter mod n]` — the next photograph** |
| Shelf | a slot fills | the existing album card bounces, no slot fills |
| Duration | ≈ 5.4 s | ≈ 3.2 s |

The parts chant is dropped on repeats because by the third `mèo` the đánh vần is no longer
news, and the delay is what would make him stop. The **different photograph is what keeps the
twentieth `mèo` worth making**, which is what `decisions.md`'s "several photographs per word"
was bought for. A word with one image simply shows that image every time and loses only the
variety.

### 5.7 The say-it-together beat, kept

The reveal holds the word large and **silent from +1400 ms to +2200 ms**, then speaks it once
more. Long enough for his mother to say it with him; solo it reads as a beat of rest.

---

## 6. Progression and session

### 6.1 Decision: the table widens silently. There are no levels.

`stage` is the child's, not a word's, and it governs exactly one thing: **how many cells the
table has.**

| Stage | Cells | Grid (phone / tablet) |
|---|---|---|
| 1 | 8 | 4 × 2 / 6 × 2 |
| 2 | 12 | 4 × 3 / 6 × 2 |
| 3 | 16 | 4 × 4 / 6 × 3 |
| 4 | 20 | 4 × 5 / 6 × 4 |
| 5 | 24 | 4 × 6 / 6 × 4 |

- The cells are filled from the pack's **inventory order** for that position — `literacy-vi.md`
  §8.3 / `literacy-en.md` §6.2 own that order, and the table takes the first *n* of it.
- A word is **eligible** iff every one of its symbols is on the table. The prefix tree is built
  over the eligible set, so the live/disabled computation and the table can never disagree.
- `globalStage` starts at **1**, advances by 1 after **8 new words discovered at the current
  stage with no auto-play assist**, and **never decreases.** A bad day must not cost him
  ground.
- **He is never told.** No level-up screen, no "Stage 2!", no unlock, no star, no sound. Four
  new cells appear between one word and the next, and he does not notice. A level-up screen is
  a score with a costume on.
- Revision 1's **per-word stage bump is deleted**. It existed to make a familiar word's
  *round* harder, and there are no rounds.

**The two smallest supported phones top out at stage 4.** Measured (`ui.md` §4.4): a
360 × 640 Android and a 375 × 667 iPhone SE serve a 20-cell table at the 72 pt motor floor and
not a 24-cell one. 4,280 of the 432,297 served viewport/inset combinations are in that class.
The consequence is concrete and is recorded rather than smoothed over: **on those two screens
the last four symbols of the inventory are not on the board, and the words behind them — four
of the 47 Vietnamese words — are not reachable there.** The fix is a bigger screen, not a
smaller tile; dropping the tile to fit a sixth row would mean 59 pt (≈ 9.4 mm), which is below
every preschool touch guideline there is.

### 6.2 Decision: no rounds, no page. A **shelf** of five, then the album.

The brief asks whether a word ends a round and whether there is a round at all. **There is
not.** There is nothing to end: he is exploring, and an exploration that stops every 45 seconds
to congratulate itself is an exploration with a metronome in it.

What replaces the five-round page and its dot rail:

- **The shelf.** Five slots in the top bar, exactly where revision 1's dot rail was, and doing
  the same job — *how much is left before we stop* — but each slot fills with **the photograph
  he just found** instead of an abstract dot. It is strictly better than the rail: it is a
  picture, it is his, and it is not a number.
- **Only a new word fills a slot.** Re-discoveries bounce the album card instead (§5.6).
- **When the fifth slot fills, the shelf tips into the album** — the five pictures fly down and
  land in the grid — **and play pauses there.** That is the parent's stopping point, and it is
  the same negotiation revision 1 bought with the five-round page: *we finished the shelf.*
- **The album is a collection, not a score.** Every word he has ever discovered, newest first,
  as photographs. Tapping one replays its word, bounces it and turns to its next photograph.
  No count, no number, no percentage, no "12 of 47". It gets longer, which is the only
  progress signal in the app and the only one that cannot go down.
- One control leaves it: a photo-shaped card with a play chevron, bottom centre. The three
  44 pt theme buttons stay in the bottom-left, as in revision 1.

### 6.3 What a session looks like

**How he starts:** he opens the app and the table is there. No choice, no menu, no button.

**What holds him for five minutes:** the first tap plays a letter sound; the second changes the
whole board; the third makes a word and the app cheers and hands him a photograph. That loop
is 12–20 seconds at the seed pack's tree depth, so five minutes is roughly 15–25 words —
three to five shelves. Revision 1's estimate was 45 s per round for five rounds; **discovery is
roughly three times faster per word**, which is the right direction for this age.

**How it ends when a parent needs it to:** three exits, in increasing order of bluntness.

1. **The shelf fills** and play pauses at the album. Wait for this and there is no negotiation.
2. **Gate dot → Finish session.** Audio fades over 800 ms, the board is abandoned without
   ceremony, and the app goes to the **end screen**: everything he made this session, still and
   dim.
3. Take the device away. Nothing in this app punishes that: there is no progress to lose, no
   streak, nothing half-finished, and a word part-built is just three taps he can make again.

**The end screen has no play button.** That is the whole mechanism: the device can be handed
back to the child with something pleasant to look at and no way to restart. Restarting needs
the gate, which needs an adult.

### 6.4 Decision: the idle ladder now plays the game rather than rescuing him

Revision 1's ladder pointed at *the correct tile*, which no longer exists. The replacement is
better, because under discovery **the app can simply take a turn.**

An idle timer escalates by itself. It resets on every seated symbol. **Any touch anywhere
defers the next escalation by 4 s**, so nothing ever flies out from under his finger.

| Idle | What happens |
|---|---|
| 20 s | **the shimmer** — a soft wave of light crosses the live tiles, left to right, 900 ms. It says *these ones*, with no words and no pointing at one answer. |
| 40 s | one live tile **breathes**: 1200 ms of opacity 1 → 0.55 → 1 and scale 1 → 1.05, then a 1600 ms pause, repeating. Chosen by the seeded RNG among the live set, preferring a symbol whose subtree contains a word he has not yet found. Slow on purpose — a fast pulse reads as urgency and this game has none. |
| 60 s | the breathe becomes a steady gold rim on that tile |
| 80 s | that tile **rises 12 pt, pauses 160 ms and flies into the strip by itself** over 420 ms — slower than a child-initiated flight, so it reads as the app doing it. It plays its sound. The ladder restarts at 20 s. |

Because every live path ends in a word, the ladder cannot fail and does not need to know
anything: **left alone, the app finds a word by itself, announces it and shows the picture.**
That is a far friendlier idle state than revision 1's — the screen is not waiting for him, it
is playing. Nothing in the child's UI ever says he needed help; the assist is recorded only to
hold `globalStage` (§6.1).

---

## 7. Language, and the surfaces that are not play

### 7.1 Language is chosen once, deliberately, and it restarts everything

Unchanged. **First launch** shows the language chooser — the only screen that is neither play
nor behind the gate, shown exactly once. Two full-height panels, **Ghép Chữ** and **Word
Blocks**. Touching a panel expands it, speaks a sample word (`mèo` / `cat`) and reveals a
confirm control: **two deliberate touches, seconds apart**, so a toddler cannot commit by
accident. Three unlabelled 56 pt theme buttons sit below; default **Popsicle**, persisted in
AsyncStorage — settings only.

Changing language later is behind the gate, takes the same two-touch confirm, and **tears the
game down and rebuilds it**: the pack is unloaded, the tree rebuilt, no screen or in-memory
object survives. **The chooser is the only screen on which both languages appear** and is the
single documented exception to the no-mixing rule (`acceptance-criteria.md` §R).

### 7.2 The parental gate

Unchanged. A 32 pt circle in the top-right at 30% opacity, **press and hold 1.2 s** to open.
The gate is a multiplication written out in words, in the app's language, answered in digits on
a keypad; operands 3–9 × 3–9, re-randomised on every open; three wrong answers → 30 s cooldown.

It needs **reading and multiplication**, which is the cleanest separation between a 4-year-old
and a literate adult, and it needs **nothing remembered** — a PIN set today is a PIN forgotten
in three months.

**Text is allowed here and on every screen behind it.** The no-text rule protects the child, not
the mother.

### 7.3 The parent menu

Behind the gate. Seven rows, never nested deeper than two levels.

| Row | What |
|---|---|
| **Add a word** | straight into the editor's add flow, camera step first |
| **Words** | the content editor (`ui.md` §13) |
| **Finish session** | §6.3 |
| **Language** | §7.1, two-touch confirm, with "this restarts the game" stated |
| **Voice & pace** | playback rate 0.8× / 1.0×; "say the sentence after the word" on/off; **the cheer** (record / replace / remove, §5.2); volume |
| **Motion & sound** | reduce motion (defaults to the OS setting, overridable); mute; theme |
| **About** | version, and the per-image attribution list generated from the pack |

No analytics, no account, no sync, no rating prompt, **and no network call anywhere in the app,
including the editor.**

### 7.4 What revision 2 adds to the editor

The editor is otherwise unchanged (`ui.md` §13). Three additions, all small:

1. **Record the cheer** — one screen, reachable from *Voice & pace* and offered once, in the
   add flow, the first time she saves a word (§5.2).
2. **A new not-yet-playable reason: "this letter is not on the board yet."** A word can now be
   linguistically perfect and still unreachable, because its symbols are outside the stage's
   inventory or outside the 24-cell ceiling. The editor says so in her words and offers a
   one-tap *put it on the board*, which appends the symbol to the pack's inventory order.
3. **The preview step shows discovery, not completion.** Step 5 plays the real thing: the real
   table, her word live in it, her picture arriving at the end. She sees what he will see,
   including the fact that **her photograph is never shown until he has made the word** — which
   is the single most important thing about this app that she needs to understand, and the
   preview is where she learns it without being told.

---

## 8. Decisions and why

Revision-2 decisions are marked **new**; the rest carried forward and were re-checked against
the new mechanic rather than inherited.

| Decision | Why |
|---|---|
| **new** · Discovery replaces guided completion | The owner's instruction, twice stated. Disabling by prefix constrains the board without choosing for him, which is what revision 1's palette was trying and failing to do. |
| **new** · The table is the stage's inventory, never a per-word palette | A constant table makes spatial memory pay, and it is the difference between choosing and searching. |
| **new** · Disabled = the tile lies flat, keeps its letter, and still speaks | It must not read as punishment, it must stay visible because the live set is the lesson, and "nothing happens" is a failure. A flat tile that talks is a physical rule a 4-year-old reads in one tap. |
| **new** · One signature three-note motif, plus a fourth note for a new word | Catchy is repetition and anticipation. A spoken catchphrase would go stale first and collide with the word audio. |
| **new** · The announcement fires on his tap, before the chant | The instant of recognition belongs to him; the lesson follows it. |
| **new** · Optional parent-recorded cheer over the motif | The most-heard moment in the app can be his mother saying well done, for one editor screen. |
| **new** · A prefix word announces and continues; the strip keeps it | A commit gesture is a thing he must know to press. Withholding a word he made is the one thing this mechanic must never do. |
| **new** · Re-discovery: full motif, short chant, the next photograph | He will build `mèo` twenty times; it must stay rewarding, and the đánh vần is not news the third time. |
| **new** · Undo is a tap on the strip; it takes that symbol and everything after it | He will want a character back. One rule, no illegal prefix, no button, no glyph. |
| **new** · No rounds. A shelf of five, then the album. | Nothing serves him a word, so nothing can end a round. The shelf keeps the parent's stopping point and replaces a dot with a photograph. |
| **new** · The album is a collection that only grows | The only progress signal in the app, and the only one that cannot go down. |
| **new** · The idle ladder plays a symbol rather than pointing at the answer | There is no answer to point at, and since every live path ends in a word, the app taking a turn is delightful rather than a rescue. |
| **new** · The zero onset is a pressable empty socket in Vietnamese | He must be able to start `ong` himself. It changes no linguistic rule. |
| **new** · The caption strip is deleted from the board | Its job was to show her the target word. There is no target, and the assembled word is already on screen at full size. |
| Vietnamese still shows one table at a time — re-argued, not inherited | Tone tiles render **the chosen rime, marked**, so the tone table is undrawable before a rime exists. Three tables would also be 54 cells, which fits nothing. And two of the three would be entirely disabled, which is the inert-screen failure the brief forbids. |
| Game optimised for a 10-inch tablet; editor for a phone | Two products, two ergonomics. The tablet now buys a 6 × 4 table at 112 pt against a phone's 4 × 5 at 73 pt. |
| One vertical stack in both orientations; phones portrait-locked | A landscape phone serves a 12-cell table and fails F7. |
| Tap only, no drag | A 4-year-old cannot drag. It also removes gesture-handler. |
| One game, no child-facing mode picker | Choosing is a reading, memory and decision task. He fails all three. |
| Global stage never decreases, and is never announced | A bad day must not cost him ground, and a number that can go up can fail to go up. |
| Gate = spelled-out multiplication, 1.2 s hold to open | Needs reading and arithmetic; needs nothing remembered in three months. |
| Language chooser needs two touches seconds apart | A toddler cannot commit by accident, and this is the setting with the worst blast radius. |
| Parent surfaces look nothing like the game | Two products, one binary; they must not be confusable, by anyone, including the tester. |
| No two-player mechanic | The ask was warmth, not a mode. The cheer is the warmth, and it costs no mechanics. |
