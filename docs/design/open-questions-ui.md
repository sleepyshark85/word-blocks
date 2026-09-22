# Open questions — UI

Owner: game-designer. Companion to `open-questions.md`, which the literacy-designer owns.

**Almost nothing is in here, on purpose.** The owner is AFK and approval is delegated, so
everything a stated assumption could settle has been settled and recorded in `ui.md`,
`gameplay.md` and `acceptance-criteria.md` rather than routed upward. **Q1 is now closed** —
it was the one real risk and the answer was that Fredoka is unusable. Two items remain, each
with the decision I have already taken and the assumption it rests on. **If nobody answers,
what is written below is what ships.**

---

## Q1 · ~~The Vietnamese tile font is unverified~~ — CLOSED, and the answer was "no"

**Resolved 2026-09-23. Fredoka cannot be used for Vietnamese and has been replaced by
Baloo 2.** Measured, not inferred: Fredoka covers **35 of 90** characters of the fixture. Its
`latin-ext` skips `U+1EA0–U+1EF1`, so **`ã` (U+00E3) exists in it and `ả` (U+1EA3) does not** —
`mã` would have rendered in Fredoka and `mả` in an OS substitute, two words differing only by
a tone mark rendering in two different typefaces. `hổ`/`hô` likewise, and both are in the seed
list.

Five replacements with a real `vietnamese` subset were downloaded and measured.
**Baloo 2 chosen**: 90/90 coverage, single-storey `a` and `g` (the letterforms a child is
taught to write — the first criterion for a letter-teaching app), the tightest vertical ink
span of any candidate at 1.017 em, and the largest minimal-pair margin of the infant-form
faces at 935 differing pixels on `mả`/`mã`. Subsets from 683 KB to **117 KB** with no loss.
Full working in `ui.md` §6.0–6.0.1.

**No question remains.** Be Vietnam Pro stays as the text face. The Q-series gate stays in
place — it is what caught this, and it must run against whatever is actually bundled.

---

## Q2 · `Show the word` — is the default right?

**Decided:** the caption strip shows the target word from the moment the round opens, and
the setting defaults to **on**.

**The assumption:** his mother is usually there, and her being able to read the word is worth
more than protecting him from pattern-matching a glyph. A 4-year-old matching the `m` in the
caption to the `m` tile is an early-literacy behaviour, not cheating.

**The counter-argument, stated honestly:** it does remove some of the phonics work on rounds
where he is playing alone. If the owner would rather he worked purely from sound, the switch
already exists — it is one tap in the parent menu, and off replaces the word with one dot per
cell so the strip still shows the answer's length.

**No answer needed.** This is a setting, it costs nothing either way, and the default is a
coin-flip I have called toward the parent who is in the room.

---

## Q3 · Popsicle is not red-green colour-blind safe

**Decided:** ship all three themes as chosen, Popsicle default, and carry the limitation in
the open.

`tools/theme-contrast.mjs` prints it rather than hiding it:

```
Popsicle: onset vs tone under deuteranopia = 1.59
Sunshine: onset vs tone under deuteranopia = 8.58
```

Popsicle's watermelon and green cannot be separated under red-green CVD by any slot
assignment — that is a property of two hues the owner picked by eye and liked. Darkening one
until the arithmetic passed would trade *bright and fun*, which is the brief, for a channel
that is already redundant.

**Already handled:** role is carried by three channels, not one — the bar pattern
(solid / split / dotted), the fact that the Vietnamese band shows one role at a time, and
colour. `acceptance-criteria.md` S8 requires every role to remain identifiable **in
greyscale**. And **Playground is red-green safe** (worst case ΔE00 18.1), reachable in one
tap from the album page.

**Only relevant if** the owner's son turns out to be colour-blind — roughly an 8% prior for a
boy, and something he would know. If so: switch to Playground. Nothing else changes.

---

## Not questions — decisions taken on a stated assumption

Recorded here so the shape of what was settled is visible without reading three documents.

| Decided | Assumption it rests on | Where |
|---|---|---|
| Game optimised for a 10-inch tablet; editor for a phone | he plays on a tablet, she edits on the phone in her hand | `gameplay.md` §1 |
| Phones lock portrait, tablets rotate freely | decided by the fit rule, not a device list — a landscape phone fails F3 by 130 pt | `ui.md` §4.1, 4.3 |
| Tile floor 72 pt ≈ 11.4 mm | Vatavu et al. 2015 cited from memory; the real check is a ruler on the device, Tier 5 | `ui.md` §4.5 |
| Tablet buys bigger tiles and a bigger picture, never more tiles | the literacy caps are cognitive, not spatial | `ui.md` §4.6 |
| Vietnamese shows one palette row at a time | three rows do not fit, and it deletes the inert-tone-row dead state | `gameplay.md` §2.1 |
| Tap only, no drag anywhere | a 4-year-old cannot drag; it also removes gesture-handler | `gameplay.md` §4.1 |
| Any real word he builds wins the round | turns "wrong answer" into "different answer" | `gameplay.md` §4.4 |
| Not-a-word → slow rock, read-back, self-tidy | "nothing happens" is a failure mode too | `gameplay.md` §4.4 C |
| Hint ladder at 20/40/60/80 s instead of a skip button | a skip button gets pressed constantly | `gameplay.md` §6.5 |
| Five-round page → album page → no play control on the end screen | this *is* how a parent ends a session without a tantrum | `gameplay.md` §6.6–6.7 |
| Gate = spelled-out multiplication, 1.2 s hold to open | needs reading and arithmetic; needs nothing remembered in three months | `gameplay.md` §7.2 |
| Baloo 2 for tiles, Be Vietnam Pro for text | measured: coverage, span, letterform, minimal-pair margin, bundle size | `ui.md` §6.0.1 |
| The glyph sits on white at 13.4:1; the colour is in the bars | moving the colour, rather than dulling it, is what let all nine owner hexes ship unchanged | `ui.md` §5.4 |
| English uses `role1`/`role2` — the asymmetry is removed | `literacy-en.md` §3.2 requires vowels to be visually distinct, so English has two tile types, not one | `ui.md` §5.6 |
| The mode title on every screen is the leak detector | colour cannot be, now that both modes share role tokens | `ui.md` §3 |
| Game screens expose one accessibility element; tiles are hidden | a screen reader speaking letter *names* would teach the opposite of the app | `ui.md` §12 |
| Audio plays through the silent switch | a parent's phone lives on silent, and a silent word game is a broken word game | `ui.md` §11.3 |
| No dark theme | a 4-year-old does not need one, and a dark ground fights the photograph | `ui.md` §5 |
