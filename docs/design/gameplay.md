# Gameplay — modes, loop, progression, session

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

## 0. The four sentences this design has to satisfy

1. **He cannot read** — but **his mother plays with him.** So the rule is not "no text": it
   is **nothing he needs is text-only, and nothing on screen asks *him* to read.** Every
   instruction he depends on is a picture, a position, a motion or a voice. Text exists, and
   it is aimed at her (§2.5).
2. **There is no way to lose.** Not softened — *absent*. No timer, no score, no lives, no
   buzzer, no "try again", and no state he can enter that he cannot leave.
3. **The languages never mix.** Chosen at launch. A leak must be structurally hard, not
   merely avoided — the two modes share no screen, no palette, no colour, no tile shape and
   no title (`ui.md` §3).
4. **It must fit every screen it lands on.** Not three test devices — a continuous range,
   with a fit rule that either passes or fails (`ui.md` §4).
5. **Neither language is secondary.** He has both. Both modes ship complete, with the same
   ritual, the same states and the same acceptance criteria.

---

## 1. Decision: optimise the child's game for a 10-inch tablet; optimise the editor for a phone

Said outright rather than compromised:

| | Optimised for | The other case |
|---|---|---|
| **The game** (the child) | a **10-inch tablet**, flat on a table or propped | a phone in portrait is **fully supported**, with smaller tiles and a shorter picture — the same layout, not a different one |
| **The editor** (his mother) | a **phone in one hand** | on a tablet it renders as a centred 520 pt column, not a stretched form |

Why the tablet for the game: it is where a toddler's app actually lives, it is where two
hands and a flat surface work, and the extra room buys the two things that matter most here
— **a bigger picture and bigger tiles** — which are precisely the payoff and the motor
constraint. Why the phone for the editor: his mother will add a word standing in the kitchen
holding the thing she is photographing, and she will do it on the phone in her hand.

**The tablet's extra room does not buy more tiles. See §5.5.**

## 1.1 Decision: orientation is decided by the fit rule, not by device class

The app supports an orientation **iff the layout fit rule (`ui.md` §4.3) passes for it at the
worst case of 8 tiles**. Evaluated once at startup from the screen metrics, not per frame.

In practice: **phones lock to portrait** (a phone in landscape has ~330 pt of usable height
and fails rule 3 by 130 pt — it is arithmetic, not taste), and **tablets rotate freely** in
both orientations.

There is **one layout**, a vertical stack, in both orientations. Landscape is not a separate
design; it is the same stack, shorter and wider, with the picture frame absorbing the
difference. That is deliberate — a second landscape layout is a second thing to keep correct
and a second place for a toddler to find a bug.

**Rotating mid-round changes nothing but the pixels.** The engine is pure and presentation
replays resolved state (`development-process.md` §3), so a rotation is a re-render: seated
tiles stay seated, lit segments stay lit, the chant continues, audio does not restart.
`acceptance-criteria.md` §P covers it as observable behaviour, because it is the single most
likely thing a 4-year-old does by accident.

---

## 2. One game, two layouts, no menu for the child

**There is one mode of play. The child never chooses anything except which tile to touch.**

A mode picker is a reading task, a memory task and a decision task, and a 4-year-old fails
all three. Everything that would be a mode is instead a *stage* the app moves through by
itself (§5), or a parent setting behind the gate (§7).

| | Ghép Chữ (Vietnamese) | Word Blocks (English) |
|---|---|---|
| What is assembled | onset → rime → tone, in that order | letters, any order, left to right |
| Assembly surface | a two-cell **word plate**: `onset ┊ rime` | 2–4 **slots** in a row |
| Palette | **one band showing one row at a time**: onsets, then rimes, then tones | **one band**, the whole tray at once |
| Tiles visible at once | ≤6 (one row) | ≤8 |
| Ordering | rime must precede tone (`literacy-vi.md` §5.4) | none |
| Tile shape | 22% corner radius, warm | 32% corner radius, cool |

These are genuinely different screens. `ui.md` §6 and §7 give both at real dimensions.

### 2.5 Decision: what co-play changes, and what it deliberately does not

His mother plays with him. That is the highest-value mode for early literacy, and it is worth
designing *for* rather than around. Five changes, and a list of things that stay put.

**What changes**

1. **A caption strip, for her.** One line of `inkSoft` text under the word plate, showing the
   target word — then each part as the chant speaks it, then the whole word and the sentence.
   She can say the word before the audio does, prompt him, and point at a letter. He cannot
   read it and never needs to. Parent setting `Show the word`, default **on**; off replaces
   the word with one dot per cell so the strip still shows how long the answer is.
   (`ui.md` §2.1.)
2. **A hint an adult knows to use.** Holding the picture frame for 800 ms speaks the target's
   *parts* — the đánh vần, or the letter sounds — rather than the word. It is the
   pedagogically correct hint: say the pieces, let him find them. It does not reveal, does
   not place anything, does not reset the idle ladder and does not count as an assist.
3. **A say-it-together beat.** The reveal holds the word large and **silent from 1400 ms to
   2200 ms**, then speaks it once more. Long enough for her to say it with him; solo it
   simply reads as a beat of rest.
4. **Capture the word he just asked for.** *Add a word* is the **first row of the parent
   menu**, reachable from anywhere via the gate dot, including mid-round. Entering the editor
   from play remembers the round and returns to it untouched. The moment he says *"where's
   the digger?"* is the best moment to add the digger, and it is two taps away.
5. **The editor and the game stop being two worlds** — still separated by the gate, but one
   step apart rather than a trip through settings.

**What deliberately does not change**

- **No two-player mode, no turn-taking, no pass-the-device.** The ask was warmth, not
  mechanics.
- **Solo play is complete.** Co-play is the best case, never the required case. The hint
  ladder still guarantees every round finishes (§6.5), the audio still carries the whole
  game, and no round needs an adult in the room.
- **Nothing moves in front of the gate.** The editor, the language and the settings stay
  behind it, because the child is holding the device most of the time.
- **No progress dashboard, no parent report, no streak.** There is still no score in this app
  for anybody, including her.
- **No information is caption-only.** Cover the caption strip and every round is still
  winnable. That is an acceptance criterion (`acceptance-criteria.md` M4), not a hope.

---

### 2.1 Decision: Vietnamese shows one palette row at a time, not three

`literacy-vi.md` §8.1 describes three labelled rows and caps each at 6 tiles. I keep the cap
and the categories; I do not render all three simultaneously. **The palette band shows
exactly one row — the next decision — and morphs to the next.**

Three reasons, in order of weight:

1. **Arithmetic.** Three rows of 6 tiles is six lines of tiles. At the motor-safe tile size
   that is 450–700 pt of palette, which does not fit a phone at all and eats the picture on
   a tablet. Two rows still does not fit a compact phone with a usable height near 500 pt.
   One row fits everything in the supported range with room to spare (`ui.md` §4.4).
2. **It is what §8.1 actually argues for.** Its own words: *"He never scans the whole screen
   for one choice — he scans one row."* Showing one row is that idea taken to its end.
3. **It deletes the inert state.** §5.4 requires the tone row to be dead until a rime is
   chosen. A dead row that he taps and that does nothing is the exact failure the brief
   names. With one band, **there is never anything inert on screen** — the tone row does not
   exist until the moment it is the right question.

The morph is also the best teaching moment in the mode. When the rime row becomes the tone
row, the tiles do not change place or size: `eo` becomes `eo èo éo ẻo ẽo ẹo` in situ. He
watches the row he was just looking at put on six different hats. That is exactly what
`literacy-vi.md` §5.4 asked the tone tiles to show, delivered as a transition rather than a
second widget.

**Flagged for the reconcile step**: this is a layout decision that changes §8.1's screen
shape. It does not change the tile inventory, the per-row cap of 6, the ordering constraint,
or anything pedagogical.

---

## 3. The round

### 3.1 What is on screen

```
   picture frame   ── the prompt. One photo of the target word, dimmed.
   word plate / slots ── where the answer is built, overlapping the frame's lower edge.
   palette band    ── the tiles, bottom-anchored, centred, within short-arm reach.
```

Nothing else. No menu, no back, no skip, no settings, no help button, no mascot, no text.
The only non-play affordance is a 32 pt gate dot in the top-right corner at 30% opacity —
deliberately the hardest thing on screen for a small arm to reach on a flat tablet, which is
a feature (§7.2).

### 3.2 Decision: the prompt is a visible picture; the payoff is the *reveal*, not the picture

The target picture is shown **from the first frame of the round**, in the frame, under a 16%
paper-coloured veil. It is the only prompt that works with the sound off, and with a child
who cannot read.

**This is a deliberate reading of `literacy-vi.md` §7.2 and `literacy-en.md` §4.2**, which
say the picture "appears" at the last chant step. What appears at that step is the *reveal*:
the frame goes full-bleed, the veil clears, and it shows **a different photograph of the same
word** (`image-sourcing.md`: several per word — that variety is doing real work here, not
decorating). The prompt is a dim thumbnail of the idea; the payoff is the idea arriving at
full size, in full light, with the word spoken. Reconciled, not contradicted — flagged here
so the reconcile step does not have to find it.

Requirement to the content-engineer: **a word needs ≥2 images for the full reveal.** With one
image the reveal still works (same photo, veil cleared, scaled up) and loses only the
surprise. With ≥2, the prompt uses `image[0]` and the reveal cycles `image[1..n]` round-robin
across meetings of that word.

### 3.3 Decision: tapping the frame replays the word

The frame is the game's only button and the biggest thing on screen, which is why he will
find it — he will tap the picture. Tapping it plays the target word once at the parent-set
pace. That is the "say it again" affordance, and it needs no glyph, no label and no teaching.

### 3.4 Starting a round

**He never starts a round.** The app opens into round 1 (after the one-time language choice,
§7.1). A round ends, celebrates, the next slides in. No lobby, no play button, no
tap-to-continue. The only place the flow stops and waits is the **album page** (§6.3), which
is the designed stopping point for a parent.

---

## 4. Placing tiles

### 4.1 Decision: tap only. No drag anywhere in the game.

A tap seats a tile. There is no drag, no long-press-to-drag, no rearranging by dragging.

- It is what a 4-year-old is good at. Drag needs a sustained contact, a controlled path and a
  controlled release, and he has none of the three.
- It removes `react-native-gesture-handler` from the app entirely, which the orchestrator
  has already decided to drop.
- Every placement is therefore a discrete, deterministic action that the pure engine can
  replay — which is what `development-process.md` §3 wants anyway.

Where a tile goes on tap:
- **Vietnamese** — into its own cell. The band only ever offers tiles for the cell that is
  next, so there is no ambiguity.
- **English** — into the **leftmost empty slot**. If every slot is full, into the **leftmost
  slot**, and its previous occupant walks home to the tray.

### 4.2 Decision: a tile always goes where he puts it. Nothing is ever refused.

Refusal is the most common way a toddler app teaches a child that the screen is against him.

- Every tile touch **plays that tile's sound**, always, in every state, even when the tile is
  already seated, even during a hold, even on the tenth tap.
- Every tile tap **seats the tile**. It is never bounced, never greyed, never ignored.
- Tapping a **seated** tile lifts it home. That is the undo, and there is no undo button.
- Tapping a seated **onset** in Vietnamese also rewinds the band to the onset row; tapping
  the seated **rime** rewinds the band from tones to rimes. Reversal is free, everywhere.

### 4.3 Decision: correctness is shown immediately, and only as reward

A placement is judged the instant it lands.

| | Correct for that cell/slot | Not correct for that cell/slot |
|---|---|---|
| The tile | soft "thunk", settles, stays | settles, stays, **no further event** |
| Frame border | one of its N segments lights gold | nothing |
| The picture | the veil steps down by 16%/N | nothing |
| Sound | the tile's own sound + a 90 ms wooden seat click | the tile's own sound only |

**The negative case is the absence of a reward, not the presence of a rejection.** No red, no
shake, no buzzer, no "uh-oh", no motion at all. He hears his tile and sees it sit exactly
where he put it — which is true, and neutral.

This is the answer to *"nothing happens is also a failure"*: something always happens (a
sound, a seat, a settle), and something **extra** happens when he is right. The difference is
legible across a room with the sound off: **the picture is getting brighter.**

### 4.4 Decision: what a complete-but-wrong combination does

When every cell is full, one of three things happens.

**A. It is the target.** → Resolve (§5).

**B. It is a different real word in the pack** — `hat` when the target was `cat`; `bò` when
the target was `bó`. → **Found-word win.** Every segment lights at once with a rising two-note
chime, the frame's photo flips to the picture of the word he actually built, and *that* word
resolves in full: chant, reveal, celebration. The round is over and he won it. The original
target goes back into the front third of the queue (§6.3) and he meets it again within a few
rounds.

This is `literacy-en.md` §6.2's strongest idea taken literally, and it is the deepest no-fail
guarantee available: **no combination of tiles is "wrong" — there are only words the app
knows and words it does not.**

**C. It is not a word.** → **The settle.** The plate rocks ±4 pt three times over 520 ms — a
slow rock, never a fast shake, because a fast shake means *error* in every interface he will
ever meet. The app reads back what he built, part by part, with no whole-word step and no
falling tone at the end. Then the **unlit tiles lift 6 pt and fly home, one at a time, 140 ms
apart**, while the lit ones stay seated and keep their gold. The board has tidied itself and
told him, wordlessly, *these are right, keep going*.

He is never left staring at a full board that does nothing, and he never has to clear it.

### 4.5 Requirement to the round generator (literacy-designer / content-engineer)

Case B is worth engineering for. **Prefer distractor sets whose alternate combinations are
also pack words.** English gets this nearly free from word families (`cat/hat/bat/rat`).
Vietnamese gets it from shared rimes and tones (`bò`/`bó`, `thỏ`/`hổ`, `ong`/`bóng`) —
`word-list.md` already flags these pairs.

A preference with a measurable target, not a hard constraint: **≥50% of generated rounds
should have at least one alternate real word reachable.** Measurable in Tier 1.

---

## 5. Resolution — the chant and the reveal

The ritual is identical in both languages because `literacy-en.md` §4.2 asked for it and it
costs nothing: **parts → whole → picture → sentence.**

### 5.1 Vietnamese — `mèo`

| Step | Audio | Visual | Gap after |
|---|---|---|---|
| 1 | `mờ` | the onset cell lifts 1.12× and its glyph goes gold | 250 ms |
| 2 | `eo` | the rime cell lifts | 250 ms |
| 3 | `meo` | **the hairline between the cells dissolves and the glyphs slide together** | 400 ms |
| 4 | `huyền` | the toned form cross-fades in; the mark drops 10 pt from 1.8× scale | 250 ms |
| 5 | `mèo` | **reveal** — the frame goes full-bleed, new photo, light, confetti | 600 ms |
| 6 | `Con mèo.` *(if present)* | picture held | — |

`ngang` words skip step 4 entirely (`literacy-vi.md` §5.3). Zero-onset words skip step 1 and
the plate has one cell, not two — and the onset row never appears in that round at all.

### 5.2 English — `cat`

| Step | Audio | Visual | Gap after |
|---|---|---|---|
| 1–n | each tile's **short** clip, left to right | that slot lifts and goes gold | 200 ms |
| n+1 | `cat` | the slots slide together, hairlines dissolve, one word | 350 ms |
| n+2 | — | **reveal** | 600 ms |
| n+3 | `The cat says meow.` *(if present)* | picture held | — |

The chant uses **short** clips (`c-short` = "kuh"), never the long anchored form
(`"kuh, cat"`). Chanting `"kuh, cat" · "ah, apple" · "tuh, ten" → "cat"` would be four
seconds of noise ending in a word he has already heard twice. The long form belongs on first
touch of a tile, where its job is teaching; the chant's job is blending. (`decisions.md`:
English clip pairs, closed.)

### 5.3 The reveal — the payoff moment of the app

Full motion spec in `ui.md` §9.6. What it *is*, in one line: **the picture stops being a
thumbnail and becomes the room.**

1. `0 ms` — the veil's remaining opacity snaps to 0 and a white flash sprite fires at 22%,
   falling to 0 over 220 ms. The frame begins scaling and translating toward full-bleed.
2. `180 ms` — the photo cross-fades to a **different photograph of the same word**.
3. `420 ms` — full-bleed reached. A radial light sprite expands from the centre, 0.4× → 1.6×
   scale, opacity 0.55 → 0, over 520 ms.
4. `300–1200 ms` — eight soft confetti shapes in the mode accent and gold drift outward and
   fade.
5. `600 ms` — the word is spoken over the top of it.
6. `1400 ms` — motion is over. **The picture is held with no auto-advance for 2.2 s**, and it
   stays as long as he keeps tapping it; each tap replays the word and bounces the photo 1.04×.

Nothing here is a score. Nothing counts. The reward for building a word is seeing the thing
bigger and brighter, and hearing its name.

---

## 6. Progression and session

### 6.1 Decision: the palette widens silently. There are no levels.

Stage is `literacy-vi.md` §8.3 / `literacy-en.md` §6.2 and is not mine to redefine. What is
mine is that **the child is never told about it.** No level-up screen, no "Stage 2!", no
unlocking, no stars. A level-up screen is a score with a costume on, and the moment there is
a number that can go up there is a number that can fail to go up.

The palette simply gets one tile wider, some day, between two rounds, and he does not notice.

### 6.2 Decision: global stage, with a per-word bump

```
roundStage(word) = min( globalStage , word.minStage + min(word.meetings, 2) )
```

- `globalStage` starts at **1**, advances by 1 after **8 rounds resolved at the current stage
  with no auto-place assist** (§6.5), and **never decreases**. Never decreasing is the point:
  a bad day must not cost him ground, because that is the one number he *would* notice.
- `word.meetings` is how many times he has resolved that word. A word met twice comes back
  with a wider palette; a word met for the first time comes in easy even at stage 5. This is
  `literacy-vi.md` §8.3's "escalation should be per-word", and v1 does track it — two
  integers, and the difference between a list that teaches and a list that shuffles.
- Cap of +2, so a favourite word does not run away from him.

### 6.3 The word queue

A **bag**: every word with `minStage ≤ globalStage`, shuffled by the seeded RNG, drawn
without replacement; refilled and reshuffled when empty. He meets every eligible word once
before he meets any word twice.

Two re-insertions, each at a uniformly random position in the **front third** of the bag:
- a target displaced by a **found-word win** (§4.4 B) — he did not build it, so it comes back
  soon;
- a word that needed **three auto-places** to finish — he did not get it, and spacing it 40
  rounds away is how it stays not-got.

Determinism (`development-process.md` §3): bag order is a pure function of the seed and the
resolved-round history. Same seed, same taps, same words.

### 6.4 A page is five rounds

A round is roughly 45 s (estimate, to be replaced by Tier 5). Five rounds ≈ 4 minutes, which
is what "holds him for five minutes" looks like at this age. Progress is a **rail of five
dots** at the top, one filling per round.

**Five dots is a shape, not a score.** Nothing accumulates across pages, nothing is compared,
no number is shown, and the rail resets every page. Its entire job is to answer *how much is
left* — the question a 4-year-old asks, and the one a parent needs answered to say "one more
page, then we stop."

### 6.5 Decision: the quiet hint ladder replaces a skip button

A 4-year-old stuck with no way out is a fail state wearing a different hat. But a skip button
is a button he will press constantly, and it teaches him that pressing the corner beats
thinking.

So there is no button. An **idle timer** escalates by itself. It resets on every *correct*
placement. It does **not** reset on incorrect placements — a child mashing tiles is exactly
the child who needs help — but **any touch anywhere defers the next escalation by 4 s**, so
nothing ever flies out from under his finger.

| Idle | What happens |
|---|---|
| 20 s | the target word is spoken again, unprompted |
| 40 s | the correct tile for the next empty cell **breathes**: 1200 ms of opacity 1→0.55→1 and scale 1→1.05→1, then a 1600 ms pause, repeating. Slow on purpose — a fast pulse reads as urgency, and this game has none. |
| 60 s | the breathe becomes a steady gold rim on that tile |
| 80 s | the tile **rises 12 pt, pauses 160 ms, and flies into place by itself** over 420 ms — slower than a child-initiated flight, so it reads as the app doing it rather than him. It plays its sound and lights its segment. The ladder restarts at 20 s for the next cell. |

Every round therefore completes. There is no state in which the app waits forever, and
nothing in the child's UI ever says he needed help — the assist is recorded only for §6.2 and
§6.3.

### 6.6 The album page — the designed stopping point

After the fifth round, play stops and does not resume by itself. The five pictures he made
fly in and settle into a grid: **his page in the album.**

- Tapping any picture replays its word and bounces it. He can sit here as long as he likes.
- One control: a photo-shaped card with a play chevron, bottom centre, starts the next page.
- Nothing else. No score, no stars, no "5 of 5".

This is the moment a parent uses. Negotiating an exit mid-round is a tantrum; negotiating it
at the album page is "we finished the page."

### 6.7 How a parent ends the session

Two routes, both through the parental gate (§7.2), because otherwise the child ends the
session by accident at the worst possible moment.

1. **Gate dot → Finish session.** Audio fades over 800 ms, the current round is abandoned
   without ceremony, and the app goes to the **end screen**: everything he made this session,
   as a still, dim grid.
2. **Album page → gate dot → Finish session.** Same screen.

**The end screen has no play button.** That is the mechanism, and it is the whole point: the
phone or tablet can be handed back to the child from the end screen with something pleasant
to look at and no way to restart. Restarting requires the gate, which requires an adult.

---

## 7. Language, and the surfaces that are not play

### 7.1 Language is chosen once, deliberately, and it restarts everything

**First launch** shows the language chooser — the only screen that is neither play nor behind
the gate, and it is shown exactly once.

Two full-height panels, **Ghép Chữ** and **Word Blocks**. Touching a panel expands it, speaks
a sample word in that language (`mèo` / `cat`) and reveals a confirm control. **Two deliberate
touches, seconds apart.** A toddler who grabs the device on first launch cannot commit by
accident, and if he does, a parent changes it in twenty seconds.

**Three unlabelled colour buttons sit below the panels** — the theme picker. Each shows that
theme's ground with its three role hues as solid / split / dotted bars, so the button *is* a
sample of what it selects. No text, non-destructive, instantly reversible, and the same three
buttons reappear on the album page at 44 pt so he can change his mind without an adult.
Letting a 4-year-old choose his own colours is a real piece of ownership over his app.
Default **Popsicle**. Persisted in AsyncStorage — settings only (`ui.md` §5.7).

No "device language", no "auto", no third option. Changing language later is behind the gate,
takes the same two-touch confirm, and **tears the game down and rebuilds it**: the pack is
unloaded, the engine re-seeded, the queue rebuilt. No screen, cache or in-memory object
survives the switch.

**The chooser is the only screen in the app on which both languages appear, and it is the
single documented exception to the no-mixing rule.** Everything else — including the app
title, the parent menu, the editor and the gate — is in one language only.
`acceptance-criteria.md` §R tests exactly that, with the chooser named as the exemption.

### 7.2 The parental gate

**Trigger:** a 32 pt circle in the top-right corner, floating over the picture frame at 30%
opacity. Small, low-contrast, in the least interesting part of the screen, and — on a flat
tablet — the point furthest from a seated child's hands. **Press and hold 1.2 s** to open it.
The hold stops the accidental press; the gate stops the intentional one.

**The gate:** a multiplication written out in words, in the app's language, answered in digits
on a keypad.

```
        Nhập kết quả:                    Enter the answer

          bảy nhân sáu                     seven times six

              [ 42 ]                            [ 42 ]
        ┌───┬───┬───┐                     ┌───┬───┬───┐
        │ 1 │ 2 │ 3 │  …                  │ 1 │ 2 │ 3 │  …
```

Operands 3–9 × 3–9, re-randomised on every open so it cannot be learned by watching. Three
wrong answers → 30 s cooldown with the keypad disabled.

It needs **reading and multiplication**, which is the cleanest separation between a
4-year-old and a literate adult. It needs **nothing remembered** — a PIN set today is a PIN
forgotten in three months (`game-designer.md`: assume she will not return for three months),
and there is nothing behind this gate worth a password.

**Text is allowed here and on every screen behind it.** The no-text rule protects the child,
not the mother. Parent surfaces are ordinary, readable, labelled, conventional interfaces in
the app's chosen language. Conflating the two products is the main way this design fails, so
they do not look alike at all (`ui.md` §10.1).

### 7.3 The parent menu

Behind the gate. Six rows, never nested deeper than two levels.

| Row | What |
|---|---|
| **Add a word** | straight into the editor's add flow, camera step first (§2.5) |
| **Words** | the content editor (`ui.md` §13) |
| **Finish session** | §6.7 |
| **Language** | §7.1, two-touch confirm, with "this restarts the game" stated |
| **Voice & pace** | playback rate 0.8× / 1.0×; "say the sentence after the word" on/off; **`Show the word`** (§2.5), default on; volume |
| **Motion & sound** | reduce motion (defaults to the OS setting, overridable); mute; theme |
| **About** | version, and the per-image attribution list generated from the pack (`image-sourcing.md`) |

No analytics, no account, no sync, no "rate this app", **and no network call anywhere in the
app, including the editor** (`decisions.md`: runtime network — none).

---

## 8. Decisions and why

| Decision | Why |
|---|---|
| Game optimised for a 10-inch tablet; editor optimised for a phone | Two products, two ergonomics. The child plays two-handed on a flat screen; his mother adds a word one-handed while holding the thing she photographed. |
| Tablet room buys bigger tiles and a bigger picture, never more tiles | The literacy caps are cognitive, not spatial (§5.5 of `ui.md`). |
| One vertical stack in both orientations; phones portrait-locked | A landscape phone fails the fit rule by 130 pt. A second landscape layout is a second thing to keep correct. |
| Orientation decided by the fit rule, not a device list | The target is a continuous range, and a device list rots. |
| Vietnamese shows one palette row at a time | Three rows do not fit; §8.1 already argues he scans one row; and it removes the inert-tone-row dead state entirely. |
| Tap only, no drag | A 4-year-old cannot drag. It also removes gesture-handler. |
| One game, no child-facing mode picker | Choosing is a reading, memory and decision task. He fails all three. |
| Prompt picture visible from frame one | The only prompt that survives the sound being off and a child who cannot read. |
| Reveal = full-bleed + a *different* photo of the same word | Makes the payoff scale, motion and surprise rather than first sight, and makes "several per word" load-bearing rather than decorative. |
| Tapping the frame replays the word | It is the biggest thing on screen and he will tap it anyway. One rule, zero glyphs. |
| Tiles are never refused | Refusal teaches a 4-year-old that the screen is against him. |
| Correct = reward; incorrect = *absence* of reward | Instant, honest, legible feedback with no negative event anywhere in the system. |
| The picture brightens by 1/N per correct tile | Soundless, textless, cross-the-room progress. |
| Any real word he builds wins | Turns "wrong answer" into "different answer" — the strongest no-fail guarantee available. |
| Not-a-word → slow rock, read-back, self-tidy | Something always happens; the board never traps him; the tiles he got right stay visible. |
| Hint ladder instead of a skip button | A skip button gets pressed constantly. An idle ladder guarantees completion without ever being asked for. |
| Global stage never decreases | A bad day must not cost him ground. |
| Per-word stage bump, capped at +2 | A familiar word deserves a harder palette; a new word does not, even at stage 5. |
| Five-round page, then an album | A 4-minute unit with a natural stop — the parent's only non-confrontational exit. |
| The end screen has no play button | This *is* "how a parent ends a session": the device can be handed back safely. |
| Gate = spelled-out multiplication, 1.2 s hold to open | Needs reading and arithmetic; needs nothing remembered in three months. |
| Language chooser needs two touches seconds apart | A toddler cannot commit by accident, and this is the setting with the worst blast radius. |
| Parent surfaces look nothing like the game | Two products, one binary; they must not be confusable, by anyone, including the tester. |
| Text exists, aimed at his mother, never required of him | She is in the room by design. A word she can read aloud is worth more than a rule that forbids it — but cover the caption and every round still wins. |
| Theme picker on the chooser *and* the album page | The chooser is shown once; without the album buttons he could never change his mind. The album page is a rest moment, so nothing is interrupted. |
| No two-player mechanic | The ask was warmth, not a mode. A turn indicator would make her a player the app manages rather than a parent in the room. |
