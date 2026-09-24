# Gameplay — the mechanic, the loop, progression, session

**Ghép Chữ** (Vietnamese mode) · **Word Blocks** (English mode).

Owner: game-designer. Companions: `ui.md` (how it looks and moves),
`acceptance-criteria.md` (what "done" means), `open-questions-ui.md` (what needs the owner).

**Revision 6, 2026-09-24 — read §0D first, then §0C, §0B, §0A.** §0D is the owner's first
real-device run: **the language switch becomes his son's** and the parent door becomes
visible while its lock stays exactly as it was. §7.1 is rewritten and revision 3's argument
for keeping the switch away from the child is **withdrawn by the owner**.

**Revision 5, 2026-09-23 — then §0C, then §0B, then §0A.** §0C is the alphabet
correction and the one contradiction it closed: **undo is the whole strip, not the cell**
(§4.4). §0B is the owner's own remedy for the one cost revision 3 could not design away: he
named his device and proposed paging. §0A records the four findings he reported from playing
the built app. §0 is kept below all three, because the mechanic correction it records is still
the mechanic.

**The mechanic is unchanged in revision 5.** Discovery, liveness, the constant table, no fail
state, the shelf, the album, the idle ladder and the announcement are all exactly as revision 4
left them. What changed is **what a cell holds** and **how many taps a word takes**.

Designed around and not relitigating: `decisions.md`, `literacy-vi.md`, `literacy-en.md`,
`word-list.md`, `image-sourcing.md`, `spike-results.md`, `development-process.md`.

Platform constraints handed down by the orchestrator and treated as settled:
iOS + Android, phone + tablet; responsive across a continuous range, not named devices;
a bundled Vietnamese-capable font; React Native's built-in `Animated`, no Reanimated, no
gesture-handler.

---

## 0D. CORRECTION — revision 6. He ran it on a phone, and could not find either door.

**2026-09-24, the first real-device run.** Two findings, verbatim:

> - After going to either English or Vietnamese, I don't see any button or anything that can
>   let me go back to choose another language.
> - Where is the screen for me to add/edit/delete words/images/audio?

Both have the same cause: the language switch was parent-menu row 2, the editor was parent-menu
rows 1 and 3, and the parent menu was behind a 1.2 s hold on a 32 pt dot at 30 % opacity
followed by a multiplication. **The gate was correct. Hiding the gate had also hidden the door,
and those are separable.**

### 0D.1 The correction to the correction, and it is the owner's

The first remedy proposed to him kept the language switch behind the gate: *a 4-year-old must
not be able to change the language.* **He rejected it:**

> This is not true, I think he should be able to change the language himself

**That reasoning was never his, and revision 3 should not have written it as though it were.**
§7.1's *"a 4-year-old who can flip languages will flip them — repeatedly, in the middle of a
word"* is **withdrawn**. It was true of a chooser made entirely of words he could not read;
it is not an argument for locking a boy who is four and bilingual out of deciding which of
his two languages he is playing in. **That is a fact about this child's life, not a risk to
be managed.**

### 0D.2 So the two findings get two different answers

| | Answer |
|---|---|
| **The language switch** | **The child's.** A 72 pt control at the board's top-left, no gate, no hold, no multiplication. One tap opens the chooser, whose panels now **speak their own names** (`ui.md` §9.4a, §9.6) |
| **The editor** | **Stays behind the gate, and the door becomes legible.** Deleting his mother's words and re-recording her voice is genuinely destructive and genuinely hers. The lock is unchanged; the 32 pt dot becomes a **labelled door** reading `Cha mẹ` / `Parent` (`ui.md` §9.4b) |

### 0D.3 What revision 6 does not touch

**The no-mixing guarantee, in full.** A switch is still a teardown; no instant has two packs
loaded; no code path reads the other language's pack; the chooser is still the one screen that
shows both titles. **R1, R2, R3, R4 and R5 are unchanged** and the fact that the switch is now
cheap and frequent is exactly why they stay unchanged.

**The mechanic.** Discovery, liveness, the constant table, đánh vần, the strip, the shelf, the
album, the idle ladder, the announcement and the absence of any fail state are all as revision
5 left them. Revision 6 adds two controls to the top bar and moves the mode title 40 pt.

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

## 0A. CORRECTION — revision 3, and it is the owner's, from playing the built app

**Revision 3. 2026-09-23.** The owner played the app that Slices 0–3 built against
revision 2 and reported four things. Tier 5 is the only tier that can see any of them, so
they are authoritative over everything revision 2 argued. This section records what
revision 2 said, what he said, and what it cost — the same form as §0, because the history
being legible is worth more than the document reading as if it had always been right.

### 0A.1 Four findings, verbatim

> - I want to be able to change between English/Vietnamese whenever I want
> - by "disabled characters" I meant the disabled characters are still being shown in the
>   character table (regular character table in English and Vietnamese). That make the
>   whole picking characters process consistent. That also meant when the word start with
>   vowel, the toddle just need to pick the vowel, not the `.` character.
> - the sounds when picking English characters are not good enough, voices seem to be
>   mixed up with each other.
> - the pronoun phase is not perfect for Vietnamese. It's now showing `b ò huyền` => bò. I
>   think it should show: `b` then `b o` then `b ò` instead.

### 0A.2 What each one overturns

| # | Revision 2 said | He said | Where it lands |
|---|---|---|---|
| 1 | "Language is chosen once, deliberately, and it restarts everything" (§7.1). Changing it later was behind the gate **and** a two-touch confirm, framed as the setting with the worst blast radius. | he wants to switch **whenever he likes** | §7.1 rewritten. One gate answer, then a one-tap switch, and a 180 s grace so a second switch needs no arithmetic. **Switching is not mixing**: it is a teardown, so no instant exists in which both languages are loaded. R4 is untouched. |
| 2 | The Vietnamese table **morphs** onset → rime → tone (§3.2, `ui.md` §7.1), and the zero onset is a pressable **∅ socket** (§4.6). Both were re-argued for revision 2 rather than inherited. | **one regular character table**, always the same characters in the same places, unavailable ones shown disabled; and a vowel-initial word is tapped **vowel first**, not `.`-then-vowel | §3 rewritten. One constant table, three fixed runs, no morph, no ∅. This is the expensive one and §3.5 states the price in words-reachable, per device. |
| 3 | "One channel for tile sounds… a new tap stops the previous clip" plus a **second** channel for the announcement that **ducks** tile audio to −18 dB, and a `long` anchored clip ("kuh, cat") on a tile's first touch (`ui.md` §11.2, AC F19/D7–D9). | the English letter sounds are **not good enough; voices seem to be mixed up with each other** | `ui.md` §11 rewritten after measuring the shipped clips. The spec assumed a 350 ms `short` clip; the shipped ones are **2.0–2.8 s**. §0A.3 has the diagnosis. |
| 4 | The chant is "unchanged, and it is still the literacy payload" (§5.4) — parts, then whole — with the strip showing three cells `onset ┊ rime ┊ tone`, the third of which renders the tone's **name in words** (`ui.md` §7.2). | it shows `b ò huyền`; it should show **`b` then `b o` then `b ò`** | §5.4 rewritten as an **accumulating build**. The tone cell is deleted from the strip: its content was a word a 4-year-old cannot read, which the no-text rule should have caught and did not. |

### 0A.3 Finding 3, diagnosed before it was designed

The brief asked for a diagnosis rather than a redesign, so here is the measurement. Clip
lengths parsed from the MP3 frame headers of the shipped `en-seed` pack:

| Clip | Spec assumed (`ui.md` r2 §11.2) | **Measured, shipped pack** |
|---|---|---|
| English `short` ("kuh") | ~350 ms | **2040 – 2784 ms** (b 2208, c 2184, d 2040, f 2688, g 2784, h 2016) |
| English `long` ("kuh, cat") | ~1 s | **2904 – 3504 ms** |
| Vietnamese onset name (`bờ`) | — | 792 – 864 ms |

That is the finding, and it is arithmetic rather than taste. **A child tapping every
300–600 ms cuts every clip inside its first 20%.** What he hears is not six letter sounds;
it is six truncated stubs of a slow adult voice, and because the `long` form is two
utterances in one file, a cut anywhere past the letter leaves a fragment of an English
*word* colliding with the next letter's onset. "Voices mixed up with each other" is a
precise description of that, and three design decisions conspired to produce it:

1. **The `long` anchored clip fires on a tap.** A 3-second two-word utterance is far longer
   than the interval between a 4-year-old's taps, so it is nearly always cut mid-anchor.
2. **The announcement ducks rather than stops.** AC F19 required tile audio to continue at
   −18 dB under the motif — speech under music is two voices by construction.
3. **The knock and the seat click share the moment with the letter.** They are on their own
   channel (correctly, so the knock never cuts the clip) and therefore sound *over* it.

The fix is three rules, not a new recording: one speech channel that cuts hard, `short` on
every tap with the anchored form demoted to an adult-initiated hint, and a knock that
precedes its letter instead of sitting on top of it. `ui.md` §11 specifies them. **A clip
budget goes to the content-engineer and the literacy-designer as an asset requirement**
(§0A.4) — no channel rule can rescue a 2.2-second letter sound.

### 0A.4 What revision 3 hands to the other agents

Neither of these is mine to decide; both are consequences of the owner's findings.

| To | What |
|---|---|
| literacy-designer / content-engineer | **The English `short` clip must be a letter sound, not a slow utterance of one.** Target ≤ **700 ms** of audio with ≤ 40 ms of leading silence and ≤ 120 ms of tail. Shipped today: 2.0–2.8 s. This is the asset side of finding 3 and it cannot be fixed in the app. |
| literacy-designer / content-engineer | **The English inventory must be the alphabet: all 26 letters, `a`–`z`, alphabetical.** `en-seed` ships 25 — `q` is absent because no seed word uses it. "The regular character table" is the alphabet, and a missing letter is exactly the inconsistency finding 2 is about. `q` simply sits there, always disabled, which is true and is fine. |
| literacy-designer | `literacy-vi.md` §5.4 ("the tone tile shows the *chosen rime*, marked") cannot hold as written on a constant table. §3.4 records the smallest departure I could find and what it costs. |
| content-engineer | `inventoryOrder` (E12) is now **load-bearing for what is playable**, not just for cell order: the device shows a prefix of it. `ui.md` §13.7 restates E12 and adds E15. |

---

## 0B. CORRECTION — revision 4. The owner answered Q6 and proposed the fix himself.

**Revision 4. 2026-09-23.** Revision 3 asked him one question — which device — and priced the
compromise it was forced into. He answered it and, in the same sentence, proposed the remedy:

> "he will use an **iPhone 17 plus** now, if the screen is too small, **maybe paging the table
> probably do it**"

**He is right, and paging is better than the compromise it replaces.** This is not a trade
where he gains one thing and loses another. Revision 3 made the table constant by *truncating*
it — each run kept only as many characters as one screen could hold, which cost a phone most
of the vocabulary (13 of 47 words on the smallest, 21 on his). **Paging truncates nothing.**
Every served device now shows every character in the pack.

| | Revision 3 | **Revision 4** |
|---|---|---|
| Characters on his iPhone 17 Plus | 32 of 67 | **all 67**, across 4 pages |
| Vietnamese words reachable there | **21 of 47** | **47 of 47** |
| Vietnamese words on the 360 × 640 floor | 13 of 47 | **47 of 47**, across 7 pages |
| Run truncation (`zonesFor`, the 0.48 split) | the core of the design | **deleted. There is nothing to allocate** |
| The 62 pt-ink / 72 pt-hit-rect lever | priced and offered to the owner | **dropped — §3.5** |
| Served viewport/inset combinations | 436,208 | **489,675** |

### 0B.1 The property paging must not break, and does not

A page is a **window onto the constant table, never a rearrangement of it.**

> **A character's page, and its row and column on that page, never change.** `ng` is always
> page 1, row 3, column 3. They are a pure function of the pack's `inventoryOrder` and the
> device — not of the word list, not of the strip, not of the session, not of what he tapped.

That is the whole of why paging is consistent with what he demanded in revision 3 and the
morphing band was not. The morph changed **what a cell contained**. A page changes **which
part of the board you are looking at**. `ui.md` §7.1a makes the difference perceptible rather
than merely true: the table **slides**, and a slide says *we moved along the board*, where the
morph's cross-fade said *these cells are now something else*.

### 0B.2 The device, measured rather than assumed

The exact logical size of an iPhone 17 Plus was not certain: the Plus class has been
430 × 932 since the 15 Plus, but it could follow the Pro Max line at 440 × 956. **I modelled
both, and they give the same design**, so the uncertainty does not matter and nothing is
waiting on it. Both are now named rows in `tools/layout-sweep.mjs`, so it is never guessed
again.

| | 430 × 932 (A) | 440 × 956 (B) |
|---|---|---|
| Cells per page | **28** | **28** |
| Vietnamese | **4 pages — 26 / 18 / 17 / 6** | **4 pages — 26 / 18 / 17 / 6** |
| English | **2 pages — 26 / 10** | **2 pages — 26 / 10** |
| Grid, tile | 4 × 7 at **75 pt** | 4 × 7 at **77 pt** |
| Page rail | 1 row of 4 buttons | 1 row of 4 buttons |

The only difference is two points of tile. **(B) is 440 dp wide and misses a fifth column by
4 pt** — five 72 pt tiles need 400 pt and the content width is exactly 400, but `gap(72)`
rounds to 11 rather than 10. Recorded because it is the kind of near-miss someone will later
"fix" by shaving the gap; the gap is the rule that keeps hit rects from overlapping (F6) and
it is not for shaving.

**On his device, English page 1 is the whole alphabet, `a`–`z`, in one grid.** That is
literally the thing he asked for in revision 3, delivered rather than approximated.

### 0B.3 What revision 4 changes

| # | Revision 3 said | Revision 4 |
|---|---|---|
| 1 | Each run is **truncated** to a prefix that fits one screen; `zonesFor()` splits the budget 0.48 / rest | **Nothing is truncated.** Runs are paged. `zonesFor` is deleted from the tool with a note in its place |
| 2 | §3.5: a phone plays a smaller *game* — 13–21 of 47 words | **§3.5 rewritten: every served device plays every word.** The per-device cost table is gone because the cost is gone |
| 3 | "Vietnamese is a tablet game, and a phone plays a third of it" | **Vietnamese is a tablet game *for comfort*, not for content.** A tablet shows all 67 at once with no rail and no pages; a phone shows the same 67 across 4 pages |
| 4 | The 62 pt ink lever, priced and offered | **Dropped.** It existed to buy back vocabulary; there is no vocabulary to buy back. The 72 pt floor stands, for the fourth revision |
| 5 | F7: a served viewport holds ≥ 20 cells | **F7: a served viewport can build a page plan for both packs.** "Served" now means "can actually be played" rather than "holds a number of cells" |
| 6 | The editor's §13.5 is the normal state of every phone | **Back to an edge case.** It fires only for a character that is not in `inventoryOrder` at all |

---

## 0C. CORRECTION — revision 5. The board is the alphabet, and one contradiction is closed.

**Revision 5. 2026-09-23.** The owner played the revision-4 build:

> "also, the characters being displayed feel really random and un-organized and **doesn't give
> my son a sense of character order** in the table. Let's try this, display the **full standard
> character table**"

and then, asked what that meant for `ch` and `tr`:

> "but, for character combining, he will still going through **character by character**, event
> for combine ones like ch, tr …(Choose C and choose H …). This to keep the table consistent"

**`literacy-vi.md` §0 and `literacy-en.md` §0 own the model** — letter-by-letter input over an
**unchanged đánh vần**. **`ui.md` §0C and `acceptance-criteria.md` §0D own the design.** This
section records only what revision 5 changes in *this* document, which is deliberately little:
the mechanic did not change, only what a cell holds and how many taps a word takes.

| # | Revision 4 said | **Revision 5** | Where |
|---|---|---|---|
| **G1** | The Vietnamese table is `[26 onsets][35 rimes][6 tones]`; English is `[26 letters][10 digraphs]` | **VI `[29 letters][6 tones]`, EN `[26 letters]`.** `ch` is two taps and is still one âm đầu. §3.2's constant table, §3.3's liveness, §3.4a's tone carriers and §3.7's "runs never share a page" all survive **unchanged** | §3.2, §3.7 |
| **G2** | §4.4: **tap a symbol in the strip** → it and everything after it returns | **§4.4 rewritten: tap the strip → one symbol returns.** See below | §4.4 |
| **G3** | §0B.2's device table: 4 VI pages `26/18/17/6` at 75 pt, 2 EN pages | **Measured in revision 5: 3 VI pages `15/14/6` at 3 × 5, tile 101 pt (A) / 104 pt (B); English is ONE page of 26 with no rail at all.** `ui.md` §4.4 is the measurement and supersedes §0B.2's numbers | §0B.2, §3.5 |
| **G4** | §4.5's strip drawing — an onset cell, a rime cell, a dashed cell | **Superseded by `ui.md` §7.2**, which is a six-cell strip with span bars and a marked onset/rime boundary. §4.5's *principle* — the strip is the word so far plus one dashed cell — is unchanged and is why it is not rewritten here | §4.5 |

### 0C.1 The contradiction this closes, recorded because it survived two revisions

**`ui.md` §2.2 has said since revision 3:** *"A short tap on the strip is **undo**
(`gameplay.md` §4.4), so the two gestures are: tap = take it back, hold = say what I have."*
The whole strip, one target.

**`ui.md` §7.2 and this document's §4.4 said, at the same time:** tap **a cell** to return that
symbol and everything after it. Per cell.

**Both sentences shipped, in three documents, for two revisions, and neither review caught
it.** `acceptance-criteria.md` **D4, E8, E9, C10 and C11** were written against the per-cell
reading, so the criteria agreed with the wrong half.

**What settled it was not a preference, it was arithmetic.** Revision 5 sized the word strip
against the content width for the first time — revision 4 never did, because three cells always
fitted — and the number that came out is that **a 360 dp phone has 328 pt of content width and
five 72 pt cells need 392**. Per-cell undo was never buildable at the floor. The design had
been carrying a rule that the smallest supported device could not draw, and the contradiction
was the symptom.

**The lesson, in this project's standing form.** The two sentences were in different files and
each was locally reasonable; nothing compared them, because nothing *executed* them. The strip
had no rule in `tools/layout-sweep.mjs` until revision 5 — F4, F15, F16 and F17 are new — so
there was no gate that could have failed. **An unmeasured component is where a contradiction
lives**, and it lived here for two revisions in the one component the child touches most.

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
one thing that matters most — **the whole character table**. **Revision 3 makes this decision
much more consequential than it was.** Measured (`ui.md` §4.4, `tools/layout-sweep.mjs
--zones`): a tablet holds the **entire 67-cell Vietnamese table** — 26 onsets, 35 rimes, 6
tones, at 81–100 pt — and therefore all 47 seed words; a 360 × 640 phone holds **20 cells**
and 13 of them. Under the morphing table the phone was merely smaller; under a constant table
it is a smaller *game*. §3.5 has the full table and what I refused to trade for it. Why the
phone for the editor: his mother will add a word standing in the kitchen holding the thing
she is photographing.

### 2.1 Orientation is decided by the fit rule, not by device class

The app supports an orientation **iff the layout fit rule passes for the 20-cell table**
(`ui.md` §4.3, rule F7). Evaluated once at startup from the screen metrics, not per frame.

In practice: **phones lock to portrait** (a landscape phone serves a 16-cell table and is
rejected — arithmetic, not taste), and **tablets rotate freely**. There is **one layout**, a
vertical stack, in both orientations. Rotating re-flows the same fixed sequence into a
different grid — an iPad's 67-cell Vietnamese table is 7 × 10 in portrait and 12 × 6 in
landscape — and nothing else changes: the engine is pure and presentation replays resolved
state, so seated symbols stay seated and audio does not restart (`acceptance-criteria.md`
§P). **Reading order is row-major over the same inventory order in both orientations**, so
nothing he has learned about the *order* of the board is invalidated; cell positions do move,
which is inherent to rotating and was already true in revision 2.

---

## 3. The board

### 3.1 What is on screen

```
   top bar      ── the LANGUAGE CONTROL (72pt, his)  ·  the shelf (5 slots),
                   with the mode title under it  ·  the PARENT DOOR (65x32)
   word strip   ── what he has assembled so far, and the next empty cell
   the TABLE    ── the characters. Live ones stand up; the rest lie flat.
   the RAIL     ── one button per page, only when the table is paged (§3.7).
                   Absent entirely on a tablet, which shows the whole table.
```

Nothing else. No menu, no back, no skip, no settings, no help button, no mascot, no
instruction, **and no picture**. The rail is not a menu — it is more of the same board.

**Revision 6 puts exactly two controls in the top bar, and they belong to different people**
(§0D). On the left, the **language control** — 72 pt, his, no gate, one tap to the chooser
(§7.1). On the right, the **parent door** — a 65 × 32 pill carrying the word `Cha mẹ` /
`Parent`, the smallest thing on the board, the only object in the app that makes no sound
when it is touched, and still the hardest thing on screen for a small arm to reach on a flat
tablet (§7.2). Neither is within 89 pt of a tile on any served device.

### 3.2 Decision (revision 3): **one constant table. It never changes.**

Revision 2 said "the table is the inventory, and it is the same table every time", and then
immediately made it three tables that swap: onsets, then rimes, then tones. The owner played
that and said it plainly — he wants **the regular character table**, the same characters in
the same places at every step, with the unavailable ones shown and disabled. His stated
reason is consistency: *"that makes the whole picking characters process consistent."*

He is right, and the argument he is making is stronger than the one revision 2 made against
it. Revision 2 justified the morph on its teaching value ("he watches the row put on six
hats"). But a board that is a different board at every step cannot be *learned*, and
revision 2's own best argument — §3.2's "spatial memory starts working, `m` is in the same
cell today as yesterday" — was quietly false, because `m` was only in the same cell at
position 1. At position 2 that cell held a rime.

**The table is one grid. Every character in the pack is in it, from the first launch, in a
cell that never moves.** It is divided into three contiguous **runs**:

```
    [ onsets ........ ][ rimes .......... ][ tones ]      Vietnamese
    [ a b c d e ... z ][ digraphs ....... ]               English
```

The runs are contiguous in one fixed row-major sequence. They are not boxed, tinted or
labelled — a run's identity is carried by the tile's own bar pattern and colour
(`ui.md` §5.5) and by the fact that it is always in the same place. A tinted band behind
each run was designed and rejected; `ui.md` §5.8a records why, because the contrast sweep
measured it failing.

**Revision 4: on a screen too small to show the whole sequence at once, the table is paged**
(§3.7). A page is a window onto this same sequence — the runs, the order and every
character's slot are unchanged; only how much of it you can see at one time differs. On a
tablet there are no pages at all.

Three things fall out that revision 2 could not have:

- **Spatial memory now actually pays.** `m` is in the same cell at every position, in every
  word, on every launch. That was the claim; now it is true.
- **The picking process is one gesture repeated.** Look at the board, find a standing tile,
  press it. Position 1 and position 3 feel identical. That is the owner's word, *consistent*,
  and for a 4-year-old it is worth more than any single screen's cleverness.
- **The `∅` socket is gone.** With rimes permanently on the board, a word that starts with a
  vowel is started by tapping the vowel — §3.4.

### 3.3 Decision: liveness is unchanged, and it still makes garbage impossible

Liveness is the part of revision 2 that was right and is untouched. A character is **live**
iff tapping it can still lead to a real word, at every position:

| State | Live set |
|---|---|
| nothing placed | every **onset** that begins a word, **and** every **rime** that begins a zero-onset word (`ao`, `ong`) |
| onset placed | every **rime** that follows it |
| rime placed (with or without an onset) | every **tone** that completes a real word, and that the rime legally takes |
| English, any prefix | every letter with at least one completion |

Everything else on the board lies flat. The three properties revision 2 proved still hold
and are still testable: every live path ends in a word; he can never be stuck; **there is no
wrong tap.**

What changed is that **the live set is now a much smaller fraction of what is on screen.**
At position 2 of a Vietnamese word, 1–6 rimes stand up out of a 67-cell board. That is the
real cost of the constant table and it is the thing to watch him for (`acceptance-criteria.md`
U7a): a board that is 92% flat could read as a broken board. Three things defend against it,
all of which exist because revision 2 took the disabled tile seriously:

1. **A flat tile is not a dead tile.** It keeps its letter at full opacity, it speaks when
   pressed, and it dips to acknowledge him (§4.3). "The letters lying down are still his to
   press" is now doing much more work than it was.
2. **The standing tiles are a bright, high-ink minority** — two saturated bars covering 31%
   of a white tile, against flat tiles that are the colour of the table (`ui.md` §5.8).
   Standing tiles pop out pre-attentively; he does not scan, he sees.
3. **The shimmer at 20 s crosses the live tiles only** (§6.4), which on a mostly-flat board
   is a much stronger signal than it was on a mostly-live one.

### 3.4 Decision: no `∅`. A vowel-initial word is started by tapping the vowel.

Revision 2 gave the zero onset a tile — "an empty socket, a dashed rounded outline with a
centred dot" — so that `ong` and `áo` could be started. The owner calls it "the `.`
character" and says the toddler should just pick the vowel. **Deleted.**

It works because the rimes are now permanently on the board: at position 1 the live set is
*onsets that begin a word* **plus** *rimes that begin a zero-onset word*. `áo` is `ao` then
`sắc`. Two taps instead of three, and no placeholder.

**On a paged board this is the one case where position 1 spans two pages.** Measured on his
iPhone's plan: both zero-onset rimes in `vi-seed` (`ao`, `ong`) are on the first rime page, so
with an empty strip the rail shows page 1 **and** page 2 standing. That is exactly the
situation §3.9's rail exists for — the only way he ever discovers `áo` is by seeing that
button stand up.

What it costs, stated rather than smoothed over: **the uniform three-tap ritual is gone for
zero-onset words**, and `literacy-vi.md` §5.3's "three taps, every time" argument for the
`ngang` tile loses one of its four supports. The other three (it *is* a tone; the engine
cannot otherwise tell "hasn't chosen" from "chose level"; he gets an explicit winning action)
are unaffected, so `ngang` stays a tile he presses. Two of the 47 seed words are zero-onset,
so this affects `áo` and `ong` and nothing else today.

### 3.4a Decision: the tone tiles keep their cells and change their carrier

This is the one place where a constant table and `literacy-vi.md` genuinely conflict, and
the brief was right to insist it be resolved rather than argued away.

**The conflict.** `literacy-vi.md` §5.4 renders each tone tile as *the chosen rime with that
tone's mark applied* — `eo èo éo ẻo ẽo ẹo` — because "a tone mark on its own is an
abstraction a 4-year-old cannot read". `ui.md` r2 §7.1 made that the *first and decisive*
reason the table had to morph: a tone table cannot be drawn before a rime exists. That
argument is sound and it does not go away.

**What I chose.** The six tone cells are constant — same cells, same order, same role, never
moving. Their **carrier** is not:

| When | The tone cell shows | Is it ever live? |
|---|---|---|
| no rime placed | the bare mark on a dotted circle — `◌̀ ◌́ ◌̉ ◌̃ ◌̣`, and `ngang` an empty circle | **no. Never.** A tone cannot be placed before a rime. |
| a rime is placed | that rime, marked — `eo èo éo ẻo ẽo ẹo` | yes, for the legal, completing ones |

**Why this is honest rather than a dodge.** The pedagogical objection to a bare diacritic is
that a child cannot *read* it. He is never asked to. The bare-mark form appears **only on a
disabled tile**, by construction — the instant a tone cell can be chosen, it is carrying the
real rime and `literacy-vi.md` §5.4 holds exactly as written. What the bare mark does is hold
the cell's place and teach, by repetition, that this corner of the board is where hats live.

**What it costs**, and I am not going to pretend it is nothing:

- **The six tone cells are the only cells in the app whose glyph changes mid-word.** The
  owner's instruction was "same characters in the same places"; six cells keep the place and
  change the character once per word. That is a real, if small, exception to the thing he
  asked for, and it is the smallest one I could find that does not either make the tone
  unreadable or bring the morph back.
- **A dotted circle is an abstraction**, and `literacy-vi.md` §5.4 rejected exactly that
  rendering. It is defensible only because it is never a choice. If the owner would rather
  see nothing at all in a tone cell until a rime is placed, that is a one-line change and it
  costs the cell's legibility as a landmark.
- The alternatives I rejected: **a fixed carrier letter** (`a à á ả ã ạ`) collides with the
  rime `a`, which is a real tile two runs away — two identical-looking tiles meaning
  different things is worse than an abstraction; **tone marks as pure symbols forever** loses
  §5.4 entirely and is the thing the literacy-designer specifically ruled out.

### 3.5 What the constant table costs — **revision 4: nothing in vocabulary**

**This section was the expensive part of revision 3 and paging deletes it.** It is kept, with
the old numbers visible, because the correction is the point.

~~Under a constant table, 20 cells is 20 cells split across all three runs, so a
360 × 640 phone reaches 13 of 47 words and an iPhone 17 Plus reaches 21.~~ **That was the cost
of *truncating* the runs to fit one screen. Paging does not truncate.** Measured with
`tools/layout-sweep.mjs --pages`:

| Device | Cells per page | Vietnamese pages | **VI words** | English pages | **EN words** |
|---|---|---|---|---|---|
| Android 360 × 640 (the floor) | 12 | 7 — `9/9/8 ¦ 12/12/11 ¦ 6` | **47 of 47** | 3 — `13/13 ¦ 10` | 40 of 40 |
| iPhone SE 3 375 × 667 | 16 | 6 — `13/13 ¦ 12/12/11 ¦ 6` | **47** | 3 — `13/13 ¦ 10` | 40 |
| Android 360 × 800, iPhone 15/16 | 20 / 20 | 5 — `13/13 ¦ 18/17 ¦ 6` | **47** | 3 — `13/13 ¦ 10` | 40 |
| **iPhone 17 Plus** (430 × 932 or 440 × 956) | **28** | **4 — `26 ¦ 18/17 ¦ 6`** | **47** | **2 — `26 ¦ 10`** | **40** |
| Android 412 × 915, iPhone 15 Pro Max | 28 | 4 — `26 ¦ 18/17 ¦ 6` | **47** | 2 — `26 ¦ 10` | 40 |
| **Every tablet** | 67 | **none — one page, no rail** | **47** | none — one page | 40 |

`¦` marks a run boundary; every page inside a run is balanced.

**Every served device plays every word.** What a bigger screen buys is now **comfort, not
content**: a tablet shows all 67 characters at once with no rail and nothing to learn about
pages; his iPhone shows the same 67 in four windows. That is a much better place for the
design to have landed, and it is his idea, not mine.

**Decision: the 62 pt-ink / 72 pt-hit-rect lever is dropped.** Revision 3 priced it and handed
it to the owner because it was the only way to buy back vocabulary on a small screen. Paging
buys all of it back, so the lever has nothing left to purchase. **The 72 pt tile floor stands
— fourth revision, fourth refusal**, and this time without a cost attached to the refusal.

**What paging does cost, stated honestly:**

- **A new thing to learn.** He has to understand that the board continues somewhere else.
  Auto-advance (§3.8) means he can make his first several words without ever discovering that,
  and the rail teaches it by standing up when there is something on another page.
- **One row of screen** for the page rail, which is why a page holds 28 characters on his
  phone rather than 32.
- **Manual paging is genuinely needed at the rime step.** Measured against `vi-seed` on his
  4-page plan: **7 of 24 onsets** lead to live rimes spread across *both* rime pages. So the
  rail's liveness signal (§3.9) is load-bearing about 29% of the time, not decorative.
- **The smallest phones are now 6–7 pages**, which is a lot of windows for a 4-year-old. They
  are served and complete, and they are not the device.

### 3.6 Decision: the stage ladder is deleted

Revision 2 grew the table in five stages of 8 / 12 / 16 / 20 / 24 cells, advancing silently
after eight new words. **Gone.** The table is the device's budget, from the first launch,
forever.

It is deleted because it directly contradicts the instruction. A table that grows is not a
table that is always the same, and "he learns where each character lives" cannot survive four
cells appearing between one word and the next and reflowing the grid. The stage ladder's real
job — *do not show a 4-year-old everything at once* — is now done by liveness, which shows
him three standing tiles on a board of sixty-seven, and does it without ever moving anything.

What goes with it: `globalStage`, the eight-new-words rule, the "advancement is never
announced" guarantee (there is nothing to announce), and the assist-tracking that existed
only to hold the stage back (`gameplay.md` r2 §6.1, AC H1–H4, G10). The idle ladder still
does not need to record assists, and no longer does.

**What is lost, honestly:** a genuinely gentle first session. A first launch now puts the
whole board in front of him at once. I judge liveness to be a better filter than a small
table — it shows him exactly the tiles that work rather than an arbitrary prefix — but
`acceptance-criteria.md` **U7a** is the Tier-5 question that decides whether I am right, and
it is the single biggest risk revision 3 introduces.

### 3.7 Decision: how the table pages — runs never share a page

**Paging is conditional.** If the whole inventory fits the screen, there are no pages, no
rail, and nothing to learn: that is every tablet, and it is the best version of the board.
Otherwise:

```
capacity  = cells that fit one page, WITH the rail charged
for each run (VI: onsets, rimes, tones -- EN: letters, digraphs):
    k = ceil(len(run) / capacity)
    split it into k consecutive pages of as equal size as possible,
    earlier pages taking the remainder
runs NEVER share a page
```

On his iPhone 17 Plus: **`[26 onsets] [18 rimes] [17 rimes] [6 tones]`** — four pages.
English: **`[26 letters] [10 digraphs]`** — two, and the first is the whole alphabet.

**Why runs never share a page**, even though it costs a page and leaves the tone page holding
6 characters in a 28-cell grid:

- It is the rule *he* can learn, and it is one sentence: **letters page, sounds pages, hats
  page.** A packing rule that spills six tones onto the end of a rime page saves a page and
  costs the only structural fact about the board a 4-year-old could hold in his head.
- **The tone page being sparse is a feature.** The tone step is where exactly one tile is
  usually live; one standing tile on an otherwise empty page is the clearest final step this
  design has ever had.
- It keeps the plan a pure function of two numbers (run lengths, capacity), which is what
  makes the slot guarantee (§0B.1) provable rather than asserted.

**Balanced, not greedy.** 35 rimes over two pages is 18/17, not 28/7. A 7-cell page beside a
28-cell one would look like the board had run out, and balanced pages keep the grid the same
shape as he moves.

**One grid for every page.** The tile size and the column count are computed **once**, from
the largest page, and every page uses them. Shorter pages are **top-aligned**, so row 1 is at
the same height on every page and a tile never resizes or reflows when he changes page. The
tone page simply has empty space below it.

### 3.8 Decision: the page auto-advances — but only out of a dead page

**Yes, it auto-advances.** The argument against is real and I am taking it seriously: the
thing under his finger changes without him acting, and that is the part of the morph he
disliked. Three reasons it is still right, and then the restraint that makes it safe.

1. **Without it, pages are a prerequisite.** Every Vietnamese word crosses at least two page
   boundaries. A 4-year-old who has not yet worked out that the board continues elsewhere
   would be unable to finish a single word. That is worse than anything the morph did — the
   morph at least always showed him something he could press.
2. **It is a view change, and the motion says so.** The table **slides** (`ui.md` §10.3 M7a),
   it does not cross-fade in place. A slide states *we moved along the board*; the morph's
   cross-fade stated *these cells are now something else*. That is a perceptible difference,
   not a lawyerly one, and it is exactly the distinction he drew.
3. **Nothing he can see has changed its identity.** The characters he was looking at are still
   there, in the same slots, one screen to the left.

**The restraint, which is the whole safety argument:**

> **The app slides the page only when the page he is on has no live character left.** If
> anything on his current page can still be pressed, the board does not move, however many
> live characters are elsewhere.

So it never pulls the board out from under a tile he was reaching for. In practice it fires
exactly twice per Vietnamese word — after the onset (the onset page is now entirely dead) and
after the rime — which is precisely when staying put would strand him.

**How he tells it happened**, three channels, no text:

- the table **slides** in the direction it moved, 420 ms — **slower than a page he changes
  himself** (300 ms), the same convention the idle auto-play already uses to say *the app did
  that, not you*;
- the **rail's gold "you are here" marker slides with it**;
- a soft non-speech **page sound**, so it is legible with the screen ignored (`ui.md` §11.3).

**How he always gets back:** every page button is on screen, always, and always pressable —
including the flat ones. And **tapping the strip returns the last symbol and slides to that
symbol's page** (§4.4), so undo doubles as navigation back to where that character lives.

### 3.9 Decision: the rail says where the live characters are, and the app never strands him

This is the failure the brief named: if every live character is on a page he is not looking
at, he is staring at a dead board with no way to know. Two mechanisms, one of which is a
guarantee rather than an affordance.

**The affordance — the page rail is made of tiles.** Each page has one button, drawn in the
visual language he has already learned from the table:

| Page button | Looks like | Means |
|---|---|---|
| its page has ≥ 1 live character | **standing** — white face, that run's role bar and pattern, ink glyph | *there is something for you here* |
| its page has none | **lying flat** — ground face, dashed outline, `inkSoft` glyph | *nothing here right now* |
| it is the page he is on | raised 4 pt, **`reward` gold face, ink glyph** | *you are here* |

The glyph on a button is **the first character of that page**, so the rail reads as
`b · ưa · i · ◌̀` — a sample of what is over there, not a number and not a word. Standing
versus flat is the **same distinction he learned in his first three taps on the table**, which
is why it needs no explanation. Flat buttons are still pressable, exactly like flat tiles.

**The guarantee — he is never left on a dead page.** After every state change, if the current
page has no live character, the board slides to the lowest-numbered page that has one (§3.8).
He can *navigate* to a dead page himself and potter about pressing letters that talk; the app
will never *leave* him there. Combined with `gameplay.md` §3.3's "he can never be stuck", the
statement is now: **there is always a live character, and it is always either on his page or
one tap of the rail away, and the rail is showing him which button.**

**The idle ladder extends to the rail.** At 20 s the shimmer crosses the live tiles *and*
pulses any standing page button whose page he is not on; at 40 s, if the live set is entirely
on another page, the breathing tile is that page's **button** rather than a tile he cannot
see. The 80 s auto-play changes page first if it has to.

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

### 4.4 Decision (revision 5): undo is **the whole strip**, one symbol per tap, and there is no undo button

Revision 1 had no undo. Revision 2 must have one, because he will want a character back.

> **Tap the word strip → the last symbol returns to the table. Tap again → the one before it.**
> The strip is **one** target, not one target per cell.

- The returned symbol **flies home** over 300 ms (`exit`, M8) and the table restands for the
  shorter prefix.
- **The clip that plays is the clip of what is LEFT**, not of what was taken. Undoing `h` from
  `c h` says `cờ`, not `hờ` — the same rule as a tap, running backwards: *say the unit you are
  building now* (`literacy-vi.md` §0.9).
- A soft descending two-note *unclick* (140 ms) plays under it. It communicates *taken back*,
  and it is the only descending motif in the app, so it can never be confused with the
  announcement, which only rises.
- The board **slides to the returned symbol's page** if it is not already there, so undo is
  also the way back (`ui.md` §7.1c).
- **On an empty strip, a tap does nothing and plays nothing.**
- **There is no clear-all gesture.** A word is at most six symbols, so emptying it is at most
  six taps, each with its own sound and its own flight home — feedback, not friction. The
  strip keeps exactly two gestures: **tap = take the last one back, hold 800 ms = the parts
  hint** (`ui.md` §2.2).

No button, no glyph, no label. The affordance is the same one the game already teaches: the
strip is made of the same tiles the table is.

**Revision 2 said the opposite and revision 5 overrules it, on geometry rather than taste.**
It said *tap any symbol → that symbol and everything after it returns*, so tapping the first
one cleared the strip. That was a reasonable model when a Vietnamese word was three cells. It
is not available any more:

| | |
|---|---|
| What per-cell undo requires | a **72 pt** motor target per cell (`ui.md` §4.5 — the floor, refused for the fifth revision) |
| What five of those cost | `5 × 72 + 4 × 8 = 392` pt |
| What the supported floor has | **328 pt** of content width at 360 dp |
| On the owner's own iPhone | the strip cell is **58 pt** wide |

**So per-cell undo is not a thing the smallest supported phone can draw, and it is below the
motor floor on his own device.** `ui.md` §7.2.6 has the full ruling; `STRIP_CELL_MIN` is a
*legibility* floor of 40 pt as a result, not a motor one.

**Three things get better, which is why this is not merely damage control.**

1. *Take the last one back* is **one rule a 4-year-old can hold.** *Tap the third block to
   return the third, fourth and fifth* is a model of a model.
2. **The target becomes enormous** — the whole strip band, 392 × 106 pt on his phone,
   328 × 77 at the floor. The most-used control in the app becomes the easiest thing on the
   screen to hit.
3. **The illegal-prefix worry disappears rather than being managed.** Revision 2 removed
   "everything after it" to avoid leaving a prefix that was never on the tree. Removing only
   the last symbol cannot leave one at all, so the rule that existed to prevent an illegal
   state is no longer needed to prevent it.

### 4.5 Decision (revision 3): the strip is the word so far, in both languages

Revision 2 gave Vietnamese a fixed three-cell strip — `onset ┊ rime ┊ tone` — and rendered
the third cell as **the tone's name in words**: `m ┊ èo ┊ huyền`. The owner saw exactly that
and said it was wrong. He is right twice over: `huyền` is a word he cannot read, on the
child's screen, which the no-text rule should have caught and did not; and the third cell
shows something that is *not part of the word*, which makes the strip a diagram instead of a
word.

**The strip now holds the word so far, left to right, plus one dashed cell for what is
still needed. Both languages. The same component.**

| | Vietnamese | English |
|---|---|---|
| empty | one dashed cell | one dashed cell |
| after `b` | `b` + dashed | `c` + dashed |
| after the rime | `b` `o` + dashed — a tone is still needed | `c` `a` + dashed |
| after the tone | `bò` — merged, no dashed cell, the word is complete | `c` `a` `t` + dashed, until it is a word |
| zero onset | `ao` + dashed → `áo`. **No empty first cell.** | — |

- **No tone cell, ever.** The tone is the mark, and the mark lands on the rime where it
  belongs. That a tone was chosen is recorded in colour, not in text: when the tone seats, a
  5 pt **dotted `role3` segment** is added under the rime's segment (`ui.md` §7.2). Role
  colour survives; the word he cannot read does not.
- **Each placed symbol keeps a 5 pt underline in its role colour**, so the strip still shows
  a parent the structure of a Vietnamese syllable without a label.
- **The dashed cell is not a character and is not in the table.** It is where the next thing
  goes. It is the same affordance English has always had, and the owner's objection was to a
  `.` he had to *tap*, which no longer exists anywhere.

What is given up: revision 2's argument that "the Vietnamese strip tells him the shape of
every answer, which is true of every word in the language". It did, and that was worth
something. It cost a word of Vietnamese text on a pre-literate child's screen and a cell
holding something that is not part of his word, and the owner weighed those and chose. Note
that the shape is not actually lost — it is in the table, permanently, as three runs.

## 5. When a word forms — the announcement

This is the payoff of the whole loop and the owner asked for it twice. It is specified here as
timing and meaning; `ui.md` §10.6 has the frame-by-frame and `ui.md` §11.4 the audio.

### 5.1 Decision: one signature motif, every time, forever

**A rising three-note figure on a soft mallet voice, 440 ms** — the same three notes in both
languages, on the first word and the thousandth.

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

### 5.4 Decision (revision 3): the chant **accumulates**. `b` → `b o` → `bo` → `bò`.

Revision 2 said the chant was "unchanged, and still the literacy payload", and it lit three
separate cells in turn — `b`, `ò`, `huyền`. That is three parts sitting next to each other,
not a word being built, and it put the tone's name on screen. The owner: *"it should show
`b` then `b o` then `b ò`."*

That is real đánh vần. The classroom chant for `bò` is **bờ – o – bo – huyền – bò**: the
onset, the toneless blend, then the tone. The blend step already exists — `literacy-vi.md`
§7.2 step 3 specifies it, `audio.blend` is already generated and in the packs, and revision 2
was already *playing* it. What revision 2 got wrong was the **visual**: it kept three static
cells lit in turn instead of showing the word growing.

**The chant, re-specified.** Every beat shows the word as far as it has been built, and
nothing that is not part of it. Gaps are `pack.chant.gapsMs`, which ships as
`{onset:250, rime:250, blend:400, tone:250, word:600}` — the chant reads them, so his mother
can slow it down without a developer.

| Beat | Shown in the strip | Spoken | Gap after | What it says |
|---|---|---|---|---|
| 1 | **`b`** — only the onset, in its cell, gold face | `bờ` | 250 ms | *this is the first sound* |
| 2 | **`b` `o`** — the rime joins it, both cells gold, still two cells | `o` | 250 ms | *and this is the second* |
| 3 | **`bo`** — the divider dissolves, the two glyphs slide into one word | **`audio.blend`** — `bo` | 400 ms | ***together they say this*** |
| 4 | **`bò`** — the mark drops onto the joined word | `huyền` | 250 ms | *and the hat changes it* |
| 5 | **`bò`** — held, whole, gold | `bò` (`audio.word`) | 600 ms | *and this is the word* |

Then the picture (§5.3, unchanged). Total ≈ 2.4 s of chant at the shipped gaps plus the clip
lengths.

- **The owner's three states are beats 1, 2 and 4.** Beat 3 is the blend he did not name but
  which his `b o` → `bo` already implies, and which the classroom chant and the existing
  audio both have. Beat 5 is the word, which was already there.
- **Nothing is ever on screen that is not part of the word.** No tone name, no floating mark,
  no third cell. This is the rule the tone cell broke.
- **The mark drops onto the assembled word, not onto a separate tile** (M12, unchanged, now
  aimed at the merged word). *This mark is the thing that changed* is the whole point of beat
  4, and it only reads if the word is already whole underneath it.
- **`ngang` words skip beat 4** (`pack.chant.skipToneStepFor`, unchanged): `dê` is `dờ` → `d
  ê` → `dê` → `dê`. Beat 3's blend is already the word.
- **Zero-onset words skip beat 1**: `áo` is `ao` → `ao` → `áo` → `áo`, which is beats 2–5 with
  beat 2 having nothing to join.
- **English is unchanged in form and now matches in principle**: the `short` clips left to
  right, each letter lighting as it speaks, then the cells merge and the whole word is
  spoken. It was already accumulating; Vietnamese now is too.
- On a **re-discovery** the chant is still skipped entirely (§5.6) — beats 1–4 are the lesson
  and the lesson is not news the third time.

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

### 6.1 Decision (revision 3): there are no stages and no levels — the table is constant

Revision 2's five-stage ladder is deleted; the reasoning is in §3.6 and the per-device cell
budgets are in §3.5. What remains of this section is the one thing the stages were also
doing, which still needs saying:

**There is no progression system in this app at all.** No stage, no level, no unlock, no
score, no streak, no number that goes up. The only thing that accumulates is the **album**
(§6.2), which is a shelf of photographs and cannot go down.

The table he sees on day one is the table he sees on day two hundred. What changes is what
*he* can do with it, and nothing on screen measures that.

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
defers the next escalation by 4 s**, so nothing ever flies out from under his finger. On a
paged board every rung also applies to the rail (§3.9).

| Idle | What happens |
|---|---|
| 20 s | **the shimmer** — a soft wave of light crosses the live tiles, left to right, 900 ms. It says *these ones*, with no words and no pointing at one answer. |
| 40 s | one live tile **breathes**: 1200 ms of opacity 1 → 0.55 → 1 and scale 1 → 1.05, then a 1600 ms pause, repeating. Chosen by the seeded RNG among the live set, preferring a symbol whose subtree contains a word he has not yet found. Slow on purpose — a fast pulse reads as urgency and this game has none. |
| 60 s | the breathe becomes a steady gold rim on that tile |
| 80 s | that tile **rises 12 pt, pauses 160 ms and flies into the strip by itself** over 420 ms — slower than a child-initiated flight, so it reads as the app doing it. It plays its sound. The ladder restarts at 20 s. |

Because every live path ends in a word, the ladder cannot fail and does not need to know
anything: **left alone, the app finds a word by itself, announces it and shows the picture.**
That is a far friendlier idle state than revision 1's — the screen is not waiting for him, it
is playing. Nothing in the child's UI ever says he needed help.

**Revision 3: the assist is no longer recorded anywhere.** It was recorded only to hold
`globalStage` back, and there is no stage (§3.6). The app does not count what he did by
himself, which is one less number in a game that has no numbers.

---

## 7. Language, and the surfaces that are not play

### 7.1 Decision (revision 6): the language is the CHILD's, and it is on the board

**Revision 3** put the switch behind the gate and argued it at length: *"a 4-year-old who can
flip languages will flip them… a wrong flip is unrecoverable by him."* **The owner overruled
it** (§0D.1): *"I think he should be able to change the language himself."* The whole of §7.1
is rewritten; the old argument is withdrawn, not merely superseded, because it attributed a
judgement to him that was never his.

**Why the old argument failed, kept because it is instructive.** Every clause of it was really
a complaint about the *chooser*, not about the child. *"He cannot read his way back"* is true
only of a screen made of words. Revision 6 fixes the screen — the panels **speak their own
names** (`ui.md` §9.6, A2) and the board's control is **a picture of that screen** — and once
the screen is legible to him there is nothing left to protect him from. The unrecoverable
state was the app's fault, not his.

| | Revision 5 | **Revision 6** |
|---|---|---|
| Whose it is | the adult's | **the child's**, and his parents' too |
| Where | parent menu, row 2 | **the board**, top-left, a 72 pt control, always visible |
| What it costs to reach | a 1.2 s hold + a multiplication, or a 180 s grace | **one tap** |
| What it opens | the chooser, committing on one tap | **the chooser, exactly as at first launch** — tap a panel, hear its name, tap ▶ |
| Cancelling | there was nothing to cancel | **confirming the language he is already in is a free return**: the board comes back with the strip, the shelf and the session untouched |

**Decision: the control opens the chooser. It is not a toggle.** A toggle is one tap and
unambiguous with two languages, and it was the obvious answer. It is wrong here for two
reasons. **He cannot read, so the only way he can know what he is choosing is to hear it** —
and hearing both names requires a screen that carries both, which is the chooser and only the
chooser. And **a toggle charges a part-built word for every stray press**, where the chooser
charges nothing: the current language is marked, and choosing it is a return rather than a
reload. He will press everything; the accidental case has to be free.

**Decision: no confirmation, because the chooser is the confirmation.** A confirmation he
cannot read is worse than the thing it guards. The chooser's two touches already do the job,
and the first of them is the part that carries information for him: he taps `English`, he
*hears* `English`, and then he decides.

**Decision: a switch mid-word costs one word, and that is acceptable.** He will press it with
three letters in the strip, on purpose, repeatedly. The teardown is revision 3's, unchanged
and now routine:

1. **All audio stops immediately** — a hard stop on every channel, not the 800 ms fade
   *Finish session* uses. A fade would play the outgoing language's voice over the incoming
   language's board, which is a leak.
2. **A part-built word is discarded.** The strip clears. It is two or three taps he can make
   again, and he chose to spend them.
3. **A running chant or reveal is abandoned**, not queued or resumed. (The control is hidden
   for the few seconds a reveal is on screen, so this is the rare case, not the common one.)
4. **The board unmounts and every audio handle is released before any handle of the new
   language is opened** (AC R6, unchanged and now load-bearing constantly).
5. **The shelf empties.** It is per-session and per-language and has no meaning in the other
   pack.
6. **The album does not.** It is per-pack. His Vietnamese album is exactly as he left it,
   including the encounter counts that choose which photograph he sees next (B9).
7. **The theme is untouched.** It is a setting, not content.
8. **The chosen language is persisted immediately**, so a crash or a relaunch opens where he
   was.

**Decision: it must not be a target he hits reaching for a tile.** It is above the word strip,
in the opposite corner from the parent door and on the opposite side from the page rail. The
shortest distance from its bottom edge to the nearest tile is `GAP_STRIP + stripH`: **89 pt at
the 360 × 640 floor, 116 pt on the owner's iPhone, 134 pt on an iPad** (`ui.md` §9.4a). It
also holds the full **72 pt motor floor** — it is a thing a 4-year-old presses, so §4.5's
number applies to it exactly as it does to a page-rail button, and paying for that is what
took the top bar from 56 pt to 72 (`ui.md` §0D.3 prices it).

**Switching is not mixing, and the no-mixing rule is not weakened by any of this.** The switch
is a **teardown**, so there is no instant at which two languages are loaded, and no code path
reads the other language's pack (**R4 stands, exactly as written**). One session shows one
language. The chooser remains the single documented screen on which both titles appear
(**R3**) — it is simply reachable in one tap now instead of five.

### 7.2 The parental gate — a visible door, and an unchanged lock

**Revision 6 changes the door and not the lock** (`ui.md` §9.4b), and the separation is the
point. What the owner could not find was the **door**; what keeps his son out is the **lock**;
obscurity was doing none of the second job.

**The door.** A **65 × 32 pill in the top-right of the board**, 1.5 pt `neutralFace` outline,
carrying the word `Cha mẹ` / `Parent` at 13 pt in `inkSoft`. **A word, not an icon**: an icon
is a picture, and pictures are the child's channel here — a gear is interesting to a
4-year-old and a word is furniture. It is the only object in the app that makes **no sound**
when it is touched, while every tile talks. Those two properties are the child-proofing of the
door itself, and they cost nothing.

**A tap is no longer nothing.** Revision 5 said a tap does nothing, and *"nothing happens"* is
a failure for an adult exactly as it is for a child — it is precisely what the owner did.
A tap now shows the **hold hint** — `Giữ` / `Hold` and a 1.2 s ring, silent, for 1.6 s. And
the hint is shown **once, unprompted**, on the first board after a language is committed,
because at that moment the person holding the phone has just completed a two-touch screen and
is provably an adult.

**The lock is unchanged, and this is the ruling the orchestrator asked for.** Press and hold
**1.2 s** to open; a multiplication written out in words, in the app's language, answered in
digits on a keypad; operands 3–9 × 3–9, re-randomised on every open; three wrong answers →
30 s cooldown; **a 180-second grace** after a correct answer.

Why the visible door does not need a different lock:

- **Hiding the door never was the lock.** A child who taps everything finds a 32 pt dot in a
  corner in under a minute, and 1.2 s is nothing to a child who holds a tile for thirty
  seconds. The hold has never been the barrier.
- **The barrier is reading and multiplication**, which is the cleanest separation available
  between a 4-year-old and a literate adult, and it needs **nothing remembered** — a PIN set
  today is a PIN forgotten in three months.
- So obscurity bought nothing measurable and cost the entire editor. Giving it up is free.

**What does change is the consequence of him opening the gate screen, which will now happen.**
The gate must be a dead end that costs nothing: a large picture-only way back, the board
restored **with his part-built word still in the strip**, no sound, and a cooldown that is not
a reaction he can play with.

**The 180 s grace keeps its life but changes its reason.** It existed so that switching
language repeatedly did not cost a multiplication each time; the language switch has left the
gate, so that reason is gone. It stays for a better one: **his mother adds four words in one
sitting**, and asking her to multiply between each is a tax on the only surface this app has
for her. It is still bounded, it still expires on its own, and it still **ends the instant the
board is returned to or the app is backgrounded** — a child alone with an unlocked gate for
three minutes is the failure this must not have.

**Text is allowed here and on every screen behind it.** The no-text rule protects the child,
not the mother.

### 7.3 The parent menu

Behind the gate. **Six rows in revision 6** (was seven), never nested deeper than two levels.
**The gate stays open for 180 s after a correct answer** (§7.2), so his mother adding three
words in a sitting answers one multiplication, not three.

| Row | What |
|---|---|
| **Words — add, edit, delete** | **Revision 6 folds `Add a word` into this row.** The owner's second finding was *"where is the screen for me to add/edit/delete words/images/audio?"* and revision 5's answer was two rows, three apart, that both led to the editor — which makes neither of them the editor. One row now, and it **names the three verbs he asked about**. It opens the word list (`ui.md` §13.1), whose primary control is the `+`; the camera-first add flow is one tap further and it is in the place she will look for it |
| **Language** | §7.1 — **no longer a parent-only control.** The child's copy is on the board; this row stays because it costs nothing and it is where an adult who has not noticed the board control will look. Same screen, same code path |
| **Finish session** | §6.3 |
| **Voice & pace** | playback rate 0.8× / 1.0×; "say the sentence after the word" on/off; **the cheer** (record / replace / remove, §5.2); volume |
| **Motion & sound** | reduce motion (defaults to the OS setting, overridable); mute; theme |
| **About** | version, and the per-image attribution list generated from the pack |

No analytics, no account, no sync, no rating prompt, **and no network call anywhere in the app,
including the editor.**

**Reached by:** the **parent door** (`Cha mẹ` / `Parent`, top-right of the board) → hold 1.2 s
→ the multiplication → here. Revision 6 changed only the first of those four steps, and it is
the one that had defeated the owner.

### 7.4 What revision 2 adds to the editor

The editor is otherwise unchanged (`ui.md` §13). Three additions, all small:

1. **Record the cheer** — one screen, reachable from *Voice & pace* and offered once, in the
   add flow, the first time she saves a word (§5.2).
2. **A new not-yet-playable reason: "this letter is not on the board yet."** A word can be
   linguistically perfect and still unreachable, because its symbols fall outside the part of
   `inventoryOrder` this device's board can hold. The editor says so in her words and offers a
   one-tap *move it onto the board*, which **promotes the symbol within `inventoryOrder`**
   rather than appending it — appending was right when the table was a growing prefix of a
   24-cell ceiling and is wrong now, because on a 20-cell phone an appended symbol lands
   outside the board and nothing visible happens. **Revision 3 makes this screen much more
   important:** it is now the only place a parent learns that this phone plays 13 of the 47
   words (§3.5), and it must say so in her words, with the number, on the device she is
   holding.
3. **The preview step shows discovery, not completion.** Step 5 plays the real thing: the real
   table, her word live in it, her picture arriving at the end. She sees what he will see,
   including the fact that **her photograph is never shown until he has made the word** — which
   is the single most important thing about this app that she needs to understand, and the
   preview is where she learns it without being told.

---

## 8. Decisions and why

Revision-3 decisions are marked **r3**; revision-2 ones **new**; the rest carried forward and
were re-checked rather than inherited.

Revision-6 decisions are marked **r6**.

| Decision | Why |
|---|---|
| **r6** · The language switch is the **child's**, on the board, with no gate | The owner's instruction, overturning an assumption that was put to him as though it were his. He is four and bilingual; choosing which of his languages he is playing in is a feature of his life. |
| **r6** · It opens the chooser rather than toggling | He cannot read, so the only way he can know what he is choosing is to **hear** it, and both names live on one screen. A toggle also charges a part-built word for every stray press; the chooser charges nothing, because choosing the language he is already in is a free return. |
| **r6** · No confirmation on the switch | A confirmation he cannot read is worse than the thing it guards. The chooser's two touches already are one, and the first touch is the preview. |
| **r6** · The control holds the full 72 pt motor floor, and the top bar grows to pay for it | §4.5's floor is about his hand, not about the control's importance — the same sentence that holds the page-rail buttons at 72. Measured price: 2 pt of tile on the owner's phone, 3 pt of shelf slot, one Android shape's single-page English board, 32 of 491,283 viewport shapes. Nothing at the floor and nothing on a tablet. |
| **r6** · The parent door becomes a **word**, and the lock does not change | Hiding the door was never the lock: a child finds a 32 pt dot in a minute and holds it for thirty seconds without trying. The lock is reading plus multiplication, and it is untouched. A word is the one material this app denies him, so the label is the child-proofing. |
| **r6** · A tap on the door shows the hold hint instead of doing nothing | "Nothing happens" is a failure for an adult exactly as it is for a child — it is what the owner did, and it is why he concluded there was no button. |
| **r6** · The door's hint is shown once, unprompted, after the language is committed | At that instant the person holding the phone has just completed a two-touch screen and is provably an adult. It is the *"discoverable without instruction"* requirement met literally, for one boolean setting. |
| **r6** · Parent-menu row 1 is `Words — add, edit, delete` | Two rows that both lead to the editor make neither of them the editor. The row now names the three verbs the owner asked about in his own question. |
| **r6** · The chooser panel speaks the **language's name**, not a sample word | A sample word identifies a language only to someone who already knows that word *and* has connected it to a language. The name, in its own voice, is the direct signal — and it is now the only thing that tells a non-reading child what he is picking. |
| ~~**r3** · The language switch is the adult's, behind the gate, with a 180 s grace~~ **WITHDRAWN BY THE OWNER, revision 6.** | *"I think he should be able to change the language himself."* Every clause of the old argument was really a complaint about the chooser being made of words. Fix the screen and there is nothing left to protect him from. |
| **r4** · The table pages when it does not fit; a page is a window, never a rearrangement | The owner's own proposal, and it is strictly better than revision 3's truncation: every served device now shows every character and reaches every word. Page and slot are pure functions, so the constancy he demanded is preserved exactly. |
| **r4** · Runs never share a page | "Letters page, sounds pages, hats page" is a rule a 4-year-old can hold. It costs one page and a sparse tone page, and the sparse tone page turns out to be the clearest final step in the design. |
| **r4** · One grid for every page, top-aligned | A tile that resized or reflowed between pages would reintroduce the instability the constant table was built to remove. |
| **r4** · Auto-advance, but **only out of a page with nothing live** | Without it, pages are a prerequisite for finishing any word. With the restraint, it never moves the board while he still has something to press. A slide says *we moved*; the morph's cross-fade said *these are now something else*. |
| **r4** · The rail is made of tiles, and stands or lies exactly as they do | It reuses the one distinction he learns in his first three taps, so "there is something for you on another page" needs no explanation and no reading. |
| **r4** · The app never leaves him on a page with nothing live | A guarantee, not an affordance. He may wander onto a dead page; he is never put there. |
| **r4** · The 62 pt ink lever is dropped and `zonesFor` is deleted | Both existed to ration a board that could not hold everything. It holds everything now. |
| **r3** · One constant table; the morph is deleted | The owner's instruction, and his reason is better than the one revision 2 argued against it: a board that is a different board at every step cannot be learned, and revision 2's own spatial-memory claim was false while the table morphed. |
| **r3** · No `∅` socket; a vowel-initial word starts on the vowel | The owner's instruction. It works because rimes are permanently on the board, and it costs the uniform three-tap ritual for two seed words. |
| **r3** · The tone cells keep their place and swap their carrier | The only honest resolution of `literacy-vi.md` §5.4 against a constant table. The bare mark appears **only on a disabled tile**, so he is never asked to read an abstraction (§3.4a). |
| **r3** · A role tint behind each run was designed and rejected | `tools/theme-contrast.mjs` measured a role outline on its own role tint at 2.62–2.92:1 in 5 of 9 theme × run pairs, under the 3.0 gate. The sweep grew a pair and the pair failed. |
| **r3** · The stage ladder is deleted | A table that grows is not a table that is always the same. Liveness is a better filter than an arbitrary prefix, and it moves nothing. |
| **r3** · Six points of chrome, not one point of tile | `GAP_STRIP` 14→12 and `PAD_BOTTOM` 16→12 buy a whole extra row on the iPhone SE and a 360 × 800 Android. The 72 pt floor was refused for the third time — **and a fourth time in revision 4, where paging removed the reason to want it lowered at all.** |
| **r3** · The strip is the word so far, in both languages; the tone cell is deleted | The tone cell showed `huyền` — a word he cannot read, on the child's screen, holding something that is not part of his word. The no-text rule should have caught it. |
| **r3** · The chant accumulates: `b` → `b o` → `bo` → `bò` | It is what đánh vần actually is, the blend clip was already in the packs, and revision 2 lit three static cells instead of building a word. |
| **r3** · A tile tap always plays the `short` clip; the anchored form is demoted to the parts hint | Measured: the shipped `short` clips are 2.0–2.8 s and `long` 2.9–3.5 s. A 3-second two-word utterance fired on a tap is always cut mid-word, which is what "voices mixed up" is. |
| **r3** · The motif **stops** speech instead of ducking it | Ducked speech under a mallet motif is two voices at once by construction. F19 is withdrawn. |
| ~~**r3** · The language switch is the adult's, behind the gate, with a 180 s grace~~ **SUPERSEDED, revision 6** — see the r6 rows at the top of this table. | The grace survives with a different reason: his mother adding several words in one sitting. |
| **new** · Discovery replaces guided completion | The owner's instruction, twice stated. Disabling by prefix constrains the board without choosing for him, which is what revision 1's palette was trying and failing to do. |
| ~~**new** · The table is the stage's inventory~~ **SUPERSEDED, revision 3.** | The instinct was right and the execution was not: it was still three tables and five sizes. It is now one table, one size, forever. |
| **new** · Disabled = the tile lies flat, keeps its letter, and still speaks | It must not read as punishment, it must stay visible because the live set is the lesson, and "nothing happens" is a failure. A flat tile that talks is a physical rule a 4-year-old reads in one tap. |
| **new** · One signature three-note motif, plus a fourth note for a new word | Catchy is repetition and anticipation. A spoken catchphrase would go stale first and collide with the word audio. |
| **new** · The announcement fires on his tap, before the chant | The instant of recognition belongs to him; the lesson follows it. |
| **new** · Optional parent-recorded cheer over the motif | The most-heard moment in the app can be his mother saying well done, for one editor screen. |
| **new** · A prefix word announces and continues; the strip keeps it | A commit gesture is a thing he must know to press. Withholding a word he made is the one thing this mechanic must never do. |
| **new** · Re-discovery: full motif, short chant, the next photograph | He will build `mèo` twenty times; it must stay rewarding, and the đánh vần is not news the third time. |
| **new** · Undo is a tap on the strip; **revision 5: it takes the LAST symbol, one per tap** | He will want a character back. No button, no glyph. Per-cell undo needs a 72 pt cell and the 360 dp floor cannot draw five of them — §4.4, §0C.1. Removing only the last symbol also cannot leave an illegal prefix, so the rule that existed to prevent one is no longer needed. |
| **new** · No rounds. A shelf of five, then the album. | Nothing serves him a word, so nothing can end a round. The shelf keeps the parent's stopping point and replaces a dot with a photograph. |
| **new** · The album is a collection that only grows | The only progress signal in the app, and the only one that cannot go down. |
| **new** · The idle ladder plays a symbol rather than pointing at the answer | There is no answer to point at, and since every live path ends in a word, the app taking a turn is delightful rather than a rescue. |
| ~~**new** · The zero onset is a pressable empty socket~~ **OVERTURNED, revision 3.** | "The toddle just need to pick the vowel, not the `.` character." With rimes permanently on the board he can start `ong` by tapping `ong`, which is what he was going to try anyway. |
| **new** · The caption strip is deleted from the board | Its job was to show her the target word. There is no target, and the assembled word is already on screen at full size. |
| ~~Vietnamese still shows one table at a time — re-argued, not inherited~~ **OVERTURNED BY THE OWNER, revision 3.** | It was argued on three grounds. The first (tone tiles are undrawable before a rime exists) was true and is resolved in §3.4a. The second (54 cells fits nothing) was **wrong by measurement** — a tablet holds 67 at 81–100 pt; it was true only of phones. The third (two-thirds of the board would be inert) is real and is now the standing risk, answered in §3.3 and tested by U7a. |
| Game optimised for a 10-inch tablet; editor for a phone | Two products, two ergonomics. **Revision 3 makes it decisive rather than merely nicer:** a tablet holds the whole 67-cell Vietnamese table and all 47 words; a 360 × 640 phone holds 20 cells and 13 words (§3.5). |
| One vertical stack in both orientations; phones portrait-locked | A landscape phone serves a 16-cell table and fails F7. |
| Tap only, no drag | A 4-year-old cannot drag. It also removes gesture-handler. |
| One game, no child-facing mode picker | Choosing is a reading, memory and decision task. He fails all three. |
| ~~Global stage never decreases, and is never announced~~ **DELETED, revision 3.** | There is no stage. The best version of "a number that can go up can fail to go up" is not having the number (§3.6). |
| Gate = spelled-out multiplication, 1.2 s hold to open | Needs reading and arithmetic; needs nothing remembered in three months. **Unchanged in revision 6, deliberately** — only the door in front of it became legible. |
| Language chooser needs two touches — **on every route, restored in revision 6** | Revision 3 dropped it behind the gate as theatre, because an adult had already been proved. **The child uses this screen now**, and the two touches stopped being theatre the moment the first one became the preview: he taps, he hears `Tiếng Việt`, he decides (§7.1). |
| Parent surfaces look nothing like the game | Two products, one binary; they must not be confusable, by anyone, including the tester. |
| No two-player mechanic | The ask was warmth, not a mode. The cheer is the warmth, and it costs no mechanics. |
