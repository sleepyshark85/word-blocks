# Acceptance criteria

**Ghép Chữ** / **Word Blocks**. Owner: game-designer. These are what the app-developer
builds to and what the app-tester verifies. The developer may not edit them; the tester may
not fix what they catch (`development-process.md` §1).

**Form.** Every criterion is one observable behaviour, numbered, Given/When/Then, citable as
`AC-B4`. If verifying one requires reading source rather than running something, it is
written wrong — say so rather than pass it.

**Tier** column maps to `development-process.md` §5: 1 engine · 2 content · 3 E2E ·
4 layout · 5 on-device.

**Reading `<lang>`**: unless a criterion names a language, it must hold in **both** modes and
is verified twice. The child has both languages; neither is secondary.

---

## A · Launch, language and theme

| # | Given / When / Then | Tier |
|---|---|---|
| A1 | **Given** a first install, **when** the app opens, **then** the language chooser is shown with both `Ghép Chữ` and `Word Blocks` panels and three unlabelled theme buttons. | 3 |
| A2 | **Given** the chooser, **when** a panel is tapped once, **then** it expands, a sample word is spoken in that language, a confirm control appears, and **no language is committed**. | 3 |
| A3 | **Given** an expanded panel, **when** the confirm control is tapped, **then** the language is committed and round 1 of that language begins. Committing therefore requires **two** touches. | 3 |
| A4 | **Given** the chooser, **when** any theme button is tapped, **then** the chooser and both panels immediately re-render in that theme and no language is committed. | 3 |
| A5 | **Given** a committed language, **when** the app is relaunched, **then** it opens directly into a round and the chooser is **not** shown. | 3 |
| A6 | **Given** any state, **when** the app is relaunched, **then** the previously chosen theme is active, read from AsyncStorage. | 3 |
| A7 | **Given** the app is running, **when** the content pack is inspected, **then** no pack data has been written to AsyncStorage. AsyncStorage holds settings only. | 2 |
| A8 | **Given** a viewport smaller than 360 × 600 pt, **when** the app opens, **then** the screen-too-small card is shown and no game board is mounted. | 4 |
| A9 | **Given** parent menu → Language, **when** the other language is confirmed, **then** the game unmounts, the pack reloads, the engine re-seeds, and round 1 of the new language begins. | 3 |
| A10 | **Given** a language switch has completed, **when** memory is inspected, **then** no board component, tile, clip handle or queue entry from the previous language is retained. | 1 |

## B · The round and the prompt

| # | Given / When / Then | Tier |
|---|---|---|
| B1 | **Given** a round opens, **then** the picture frame shows one photograph of the target word under a `veil` at opacity 0.16. | 3 |
| B2 | **Given** a round opens, **then** the frame border shows exactly N unlit segments, N = the number of cells this round (2–3 Vietnamese, 2–4 English). | 3 |
| B3 | **Given** a round opens, **then** the palette contains every tile the target needs, plus distractors, and **never more than 6 tiles in a Vietnamese row or 8 in an English tray**. | 1 |
| B4 | **Given** any round, **when** the palette is inspected, **then** it contains no pair from `{c,k}`, `{g,gh}`, `{ng,ngh}`, and no dialect homophone pair for the pack's `dialect` (`literacy-vi.md` §6.1). | 1 |
| B5 | **Given** a round in progress, **when** the picture frame is **tapped**, **then** the whole target word is spoken once. | 3 |
| B6 | **Given** a round in progress, **when** the picture frame is **held for 800 ms**, **then** the target's *parts* are spoken in order and the word is not. | 3 |
| B7 | **Given** the parts hint has been used, **then** the idle-hint ladder timer is unchanged and no assist is recorded. | 1 |
| B8 | **Given** a round resolves, **then** the next round begins automatically with no tap required, unless it was the fifth of the page. | 3 |
| B9 | **Given** a word with ≥ 2 images, **when** it is met twice, **then** the reveal shows a different image each time, cycling `image[1..n]`. | 1 |
| B10 | **Given** a word with exactly 1 image, **when** it resolves, **then** the reveal shows that image and does not error. | 3 |
| B11 | **Given** any generated round, **when** the generator is run over the whole pack with a fixed seed, **then** **≥ 50%** of rounds have at least one alternate combination that is also a pack word (`gameplay.md` §4.5). | 1 |
| B12 | **Given** the same seed and the same sequence of taps, **when** the engine is replayed, **then** the identical sequence of rounds, palettes and outcomes is produced. | 1 |

## C · Vietnamese assembly

| # | Given / When / Then | Tier |
|---|---|---|
| C1 | **Given** a Vietnamese round opens, **then** the palette band shows the **onset row only** and the word plate has two cells. | 3 |
| C2 | **Given** a zero-onset target (`ong`, `áo`), **when** the round opens, **then** the plate has **one full-width cell** and **no onset row is ever rendered** in that round. | 3 |
| C3 | **Given** the onset row, **when** an onset tile is tapped, **then** it seats in the onset cell and the band cross-fades to the **rime row** within 280 ms. | 3 |
| C4 | **Given** the rime row, **when** a rime tile is tapped, **then** it seats in the rime cell and the band cross-fades to the **tone row**. | 3 |
| C5 | **Given** the tone row is shown, **then** each tone tile renders **the chosen rime with that tone's mark applied** (`eo èo éo ẻo ẽo ẹo`), not a bare diacritic. | 3 |
| C6 | **Given** a rime ending in `p`, `t`, `c` or `ch`, **when** the tone row appears, **then** it contains exactly **two** tiles (`sắc`, `nặng`) and no others. | 1 |
| C7 | **Given** `ngang` is chosen, **then** the rime cell shows the unmarked form and the round can resolve. `ngang` is a tile he presses, not the absence of one. | 1 |
| C8 | **Given** any point in a Vietnamese round, **then** there is **no inert or unresponsive tile on screen**. Every visible tile responds to a tap. | 3 |
| C9 | **Given** a seated rime, **when** the rime cell is tapped, **then** the rime returns to the band, the band cross-fades back to **rimes**, and any chosen tone is cleared. | 3 |
| C10 | **Given** a seated onset, **when** the onset cell is tapped, **then** the onset returns and the band cross-fades back to **onsets**, leaving the rime and tone seated. | 3 |
| C11 | **Given** a resolution, **then** the chant plays `onset · rime · toneless-blend · tone · word`, with the tone step **omitted** for `ngang` and the onset step omitted for a zero onset. | 3 |
| C12 | **Given** the chant reaches the toneless blend, **then** the plate's hairline dissolves and the two glyphs slide together. | 3 |
| C13 | **Given** the chant reaches the tone step, **then** the marked form cross-fades in and the mark animates down into place. | 3 |
| C14 | **Given** a Vietnamese round, **then** onset tiles carry a **solid** bar in `role1`, rime tiles a **split** bar in `role2`, tone tiles a **dotted** bar in `role3`. | 3 |
| C15 | **Given** any stage, **then** tile size is computed once at round start and **does not change** when the band morphs. | 4 |

## D · English assembly

| # | Given / When / Then | Tier |
|---|---|---|
| D1 | **Given** an English round opens, **then** the slot row shows exactly one socket per tile of the target (2 for `egg`, 3 for `cat`, 4 for `frog`). | 3 |
| D2 | **Given** all slots empty, **when** any tile is tapped, **then** it seats in the **leftmost empty** slot. | 3 |
| D3 | **Given** all slots full, **when** a band tile is tapped, **then** it takes the **leftmost** slot and the previous occupant returns to the band. | 3 |
| D4 | **Given** a seated tile, **when** its slot is tapped, **then** that tile returns to the band and the slot becomes empty. | 3 |
| D5 | **Given** any English round, **then** vowel tiles carry a **split** bar in `role2` and consonant tiles a **solid** bar in `role1`, and the two are distinguishable with the screen desaturated. | 3 |
| D6 | **Given** any English round, **then** **no tile carries `role3`** — the tone slot is never rendered in English mode. | 3 |
| D7 | **Given** a tile is touched for the **first** time in a round, **then** its `long` clip plays ("kuh, cat"). | 3 |
| D8 | **Given** a tile is touched again in the same round, **then** its `short` clip plays ("kuh"). | 3 |
| D9 | **Given** any tile was touched in the previous 900 ms, **when** any tile is touched, **then** the `short` clip plays regardless of whether it is that tile's first touch. | 3 |
| D10 | **Given** a resolution, **then** the chant uses `short` clips left to right, then the whole word — never the `long` anchored form. | 3 |
| D11 | **Given** any palette, **then** it never contains both `c` and `k`. | 1 |
| D12 | **Given** any palette, **then** `ck`, `ll`, `ss`, `ff`, `zz`, `ng` never appear in an initial position and `x` never appears initially. | 1 |
| D13 | **Given** a stage-1 round with target `cat`, **then** at least one distractor makes another real pack word (`hat`, `bat`, `rat`). | 1 |

## E · Not-yet, and the found-word win

| # | Given / When / Then | Tier |
|---|---|---|
| E1 | **Given** a tile is placed **correctly** for its cell, **then** its frame segment lights, the `veil` steps down by `0.16/N`, and a 90 ms seat click plays. | 3 |
| E2 | **Given** a tile is placed **incorrectly** for its cell, **then** it seats and stays, its own sound plays, and **nothing else happens**: no colour change, no motion, no sound beyond the tile's own, no segment, no veil step. | 3 |
| E3 | **Given** an incorrect placement, **then** nothing red, nothing grey, no X and no error glyph is rendered anywhere. | 3 |
| E4 | **Given** every cell is full and the combination is **the target**, **then** the chant and reveal run. | 3 |
| E5 | **Given** every cell is full and the combination is **a different pack word**, **then** all segments light at once with a rising two-note chime, the frame's photo flips to that word's picture, and **that word resolves in full**. | 3 |
| E6 | **Given** a found-word win, **then** the round counts as won, the page rail advances, and the original target is reinserted into the **front third** of the queue. | 1 |
| E7 | **Given** every cell is full and the combination is **not a word**, **then** the plate rocks ±4 pt three times over 520 ms — a rock, not a shake — and the parts are read back with **no whole-word step**. | 3 |
| E8 | **Given** the not-a-word settle, **then** only the **unlit** tiles lift and fly home, 140 ms apart, and every lit tile stays seated with its segment still lit. | 3 |
| E9 | **Given** the not-a-word settle completes, **then** the board is in a valid partial state and every returned tile is tappable again. He never has to clear it himself. | 3 |
| E10 | **Given** any sequence of taps whatsoever, **then** no state exists from which the round cannot be completed. | 1 |

## F · Reveal and celebration

| # | Given / When / Then | Tier |
|---|---|---|
| F1 | **Given** resolution, **then** the `veil` reaches opacity 0 and the frame reaches full-bleed by **420 ms**. | 3 |
| F2 | **Given** the reveal, **then** at 180 ms the photo cross-fades to a **different** image of the same word, when one exists. | 3 |
| F3 | **Given** the reveal, **then** the word is spoken at ~600 ms and motion ends by **1400 ms**. | 3 |
| F4 | **Given** the reveal has finished, **then** there is **silence from 1400 ms to 2200 ms** and the word is spoken again at 2200 ms. | 3 |
| F5 | **Given** the held reveal, **when** the picture is tapped, **then** the word replays, the picture bounces 1.04×, and the auto-advance timer resets. | 3 |
| F6 | **Given** the held reveal and no further taps, **then** the next round begins at 3000 ms. | 3 |
| F7 | **Given** any reveal, **then** no number, score, star, percentage, "well done" count or streak appears. | 3 |
| F8 | **Given** the reveal, **then** the caption strip shows the word and, if the pack has one, the sentence. | 3 |

## G · No fail state, and the hint ladder

| # | Given / When / Then | Tier |
|---|---|---|
| G1 | **Given** any screen in the game, **then** there is no timer, no countdown, no clock, no score, no lives and no progress bar other than the five-dot page rail. | 3 |
| G2 | **Given** 20 s with no correct placement, **then** the target word is spoken again unprompted. | 3 |
| G3 | **Given** 40 s idle, **then** the correct tile for the next empty cell breathes: 1200 ms on, 1600 ms pause, repeating. | 3 |
| G4 | **Given** 60 s idle, **then** that tile shows a steady `reward` rim. | 3 |
| G5 | **Given** 80 s idle, **then** that tile rises, pauses, flies into place over 420 ms, plays its sound and lights its segment. | 3 |
| G6 | **Given** an auto-place, **then** the ladder restarts at 20 s for the next empty cell, and every round therefore completes. | 3 |
| G7 | **Given** a correct placement, **then** the idle timer resets to 0. | 1 |
| G8 | **Given** an **incorrect** placement, **then** the idle timer does **not** reset, but the next escalation is deferred by 4 s. | 1 |
| G9 | **Given** any touch anywhere, **then** no auto-place fires within the following 4 s. | 3 |
| G10 | **Given** an auto-place occurred, **then** the round is not counted toward stage advancement and, at three auto-places, the word is reinserted into the front third of the queue. | 1 |

## H · Session, page, album, ending

| # | Given / When / Then | Tier |
|---|---|---|
| H1 | **Given** a page starts, **then** the rail shows five dots, all empty. | 3 |
| H2 | **Given** a round resolves, **then** exactly one further rail dot fills. | 3 |
| H3 | **Given** the fifth round resolves, **then** the album page is shown and **play does not resume by itself**. | 3 |
| H4 | **Given** the album page, **then** it shows the five pictures made this page and no score, star or count. | 3 |
| H5 | **Given** the album page, **when** a picture is tapped, **then** its word replays and it bounces. | 3 |
| H6 | **Given** the album page, **when** the play card is tapped, **then** a new page of five rounds begins and the rail resets. | 3 |
| H7 | **Given** the album page, **then** three 44 pt theme buttons are present and tapping one re-themes the app immediately without leaving the page. | 3 |
| H8 | **Given** parent menu → Finish session, **then** audio fades over 800 ms, the current round is abandoned, and the end screen is shown. | 3 |
| H9 | **Given** the end screen, **then** it shows this session's pictures and **contains no control that starts play**. | 3 |
| H10 | **Given** the end screen, **when** any picture or empty area is tapped repeatedly, **then** play does not resume. Resuming requires the gate. | 3 |
| H11 | **Given** stage advancement occurs, **then** **no level-up screen, banner, sound or badge is shown**. The palette silently widens. | 3 |
| H12 | **Given** a page of five words, **then** no word repeats within the page while unmet eligible words remain in the bag. | 1 |

## I · Parental gate and parent menu

| # | Given / When / Then | Tier |
|---|---|---|
| I1 | **Given** the game board, **then** the gate dot is 32 pt at 30% opacity in the top-right of the top bar, and it is the only non-play control on screen. | 3 |
| I2 | **Given** the gate dot, **when** it is **tapped**, **then** nothing happens. | 3 |
| I3 | **Given** the gate dot, **when** it is held, **then** a ring fills over 1200 ms and the gate opens at 1200 ms. | 3 |
| I4 | **Given** the hold is released before 1200 ms, **then** the ring resets and the gate does not open. | 3 |
| I5 | **Given** the gate, **then** it shows a multiplication with both operands **spelled in words** in the app's language, operands in 3–9. | 3 |
| I6 | **Given** the gate is opened twice, **then** the operands differ between openings (over 20 openings, at least 10 distinct pairs). | 3 |
| I7 | **Given** three wrong answers, **then** the keypad is disabled for 30 s with a visible countdown. | 3 |
| I8 | **Given** the correct answer, **then** the parent menu opens with **Add a word** as its first row. | 3 |
| I9 | **Given** the parent menu, **then** it contains exactly: Add a word · Words · Finish session · Language · Voice & pace · Motion & sound · About. No analytics, no account, no sync, no rating prompt. | 3 |
| I10 | **Given** any parent screen, **then** a back chevron and a screen title are present and the mode title is shown. | 3 |
| I11 | **Given** the app is running, **when** network traffic is captured for a full session including editor use, **then** **zero outbound requests** are made. | 3 |

## J · Editor — list and add

| # | Given / When / Then | Tier |
|---|---|---|
| J1 | **Given** the word list, **then** each row shows a 64 pt thumbnail, the word in Baloo 2, its decomposition in `inkSoft`, and a completeness dot. | 3 |
| J2 | **Given** a word that cannot yet be played, **then** it appears in a named section with a one-line reason — **never hidden and never deleted**. | 3 |
| J3 | **Given** the `+` control, **when** tapped, **then** step 1 is the **picture** step, offering Take a photo and Choose from library, and **no image-search option**. | 3 |
| J4 | **Given** any step of the add flow, **when** the app is killed immediately after advancing, **then** on relaunch the draft is present with everything entered so far. | 2 |
| J5 | **Given** step 3, **then** the decomposition is **shown as real game tiles** with their role bars, plus the composed spelling and a tick. | 3 |
| J6 | **Given** step 4, **then** the record option is **pre-selected**, and "use the built-in voice" is offered only if a shipped clip exists for that exact word. | 3 |
| J7 | **Given** step 4, **when** the record button is held, **then** recording starts, a live waveform is shown, and recording stops at 3 s. | 3 |
| J8 | **Given** a recording exists, **when** re-record is tapped, **then** the previous recording is replaced and there is no limit on retries. | 3 |
| J9 | **Given** step 5, **then** a **fully playable round** for the new word is shown, identical to what the child will see. | 3 |
| J10 | **Given** step 5 is confirmed, **then** the word is written atomically and appears in the list. | 2 |
| J11 | **Given** the add flow is entered from the parent menu during a round, **when** it is completed or cancelled, **then** the app returns to **that same round** with seated tiles still seated. | 3 |
| J12 | **Given** the picture step, **then** more than one image can be attached to one word. | 3 |
| J13 | **Given** the editor on a viewport wider than 700 pt, **then** it renders as a centred 520 pt column, not a stretched form. | 4 |
| J14 | **Given** a word added by the mother, **then** it enters the queue at the next bag refill and is playable without an app restart. | 3 |

## K · Editor — when the word does not decompose

| # | Given / When / Then | Tier |
|---|---|---|
| K1 | **Given** a two-syllable Vietnamese word, **then** the editor explains it in one sentence and offers each syllable as a one-tap correction. | 3 |
| K2 | **Given** a word with an unknown rime, **then** the editor names what it recognised and what it did not, and offers **Add this rime**. | 3 |
| K3 | **Given** the add-a-rime screen, **then** all six toned forms are generated and shown, with the illegal ones greyed per the checked-syllable rule. | 3 |
| K4 | **Given** the add-a-rime screen, **when** any toned form is tapped, **then** it becomes editable and her correction is stored. | 3 |
| K5 | **Given** a rime she added, **then** its toned forms are stored composed, and **no runtime code composes a spelling or places a tone mark**. | 1 |
| K6 | **Given** any decomposition failure, **then** the word **"invalid" (or its translation) is never shown**, and the save is never blocked. | 3 |
| K7 | **Given** nothing at all is recognised, **then** she can still save picture + sound, and the word is filed as not-yet-playable. | 3 |
| K8 | **Given** the validator rejects an entry, **then** it returns a **reason string the UI renders**, not a boolean. | 2 |
| K9 | **Given** a pack with one corrupt entry, **when** the app loads it, **then** the app runs with the remaining words and the corrupt entry is listed as not-yet-playable. **The child never sees a blank screen.** | 2 |

## L · Editor — delete and recovery

| # | Given / When / Then | Tier |
|---|---|---|
| L1 | **Given** a word row, **when** delete is chosen, **then** a confirmation shows **the word and its picture**. | 3 |
| L2 | **Given** a deletion, **then** a 6-second Undo toast is shown and undoing restores the word exactly. | 3 |
| L3 | **Given** a deletion older than the toast, **then** the word is in **Recently deleted** and restorable for 30 days. | 3 |
| L4 | **Given** a seed word is deleted, **then** it is removed from the queue at the next refill and the app does not error. | 2 |
| L5 | **Given** the app is killed mid-delete, **then** on relaunch the word is either fully present or fully in Recently deleted — never half-written. | 2 |
| L6 | **Given** every word has been deleted, **then** the game shows a parent-facing empty-state card, not a crash and not a blank board. | 2 |

## M · Co-play

| # | Given / When / Then | Tier |
|---|---|---|
| M1 | **Given** a round opens with `Show the word` on (the default), **then** the caption strip shows the target word in `inkSoft` under the plate. | 3 |
| M2 | **Given** `Show the word` is off, **then** the caption strip shows one dot per cell and no letters. | 3 |
| M3 | **Given** the chant, **then** the caption strip shows each part as it is spoken, then the whole word. | 3 |
| M4 | **Given** any caption-strip state, **then** the round is completable with the caption strip covered — no information is caption-only. | 5 |
| M5 | **Given** a full round, **when** it is played with the screen face-down, **then** the audio alone conveys: which tile was touched, that a placement was correct, that a combination was not a word, and that the word resolved. | 5 |
| M6 | **Given** the app, **then** there is no two-player mode, no turn indicator, no pass-the-device prompt and no parent score. | 3 |

## N · Audio

| # | Given / When / Then | Tier |
|---|---|---|
| N1 | **Given** a tile, **when** it is touched, **then** its sound begins within **60 ms of touch-down** — not touch-up. | 5 |
| N2 | **Given** a tile, **when** it is touched, **then** the pressed visual state renders within one frame (16.7 ms). | 5 |
| N3 | **Given** a tile clip is playing, **when** another tile is touched, **then** the first clip **stops immediately** and the second starts. No overlap, no queue. | 3 |
| N4 | **Given** six tiles touched within 4 s, **then** six distinct clips are heard, each cut by the next, and nothing is still playing 1 s after the last touch. | 5 |
| N5 | **Given** a tile is held past 600 ms, **then** its short clip repeats every 700 ms, **at most 6 times**, then stops. | 3 |
| N6 | **Given** a tile is held for 30 s, **then** the audio has stopped, the tile shows a pressed breathing state, and on release **nothing is placed**. | 3 |
| N7 | **Given** touch-down and touch-up more than 600 ms apart, or more than 24 pt apart, **then** no tile is placed. | 3 |
| N8 | **Given** the chant is playing, **then** tile taps do not interrupt it and tiles are not placeable. | 3 |
| N9 | **Given** the device ringer switch is set to silent, **then** the game still speaks. | 5 |
| N10 | **Given** parent menu → mute, **then** all game audio is silenced and the game remains completable via the hint ladder. | 3 |
| N11 | **Given** a round starts, **then** every clip for that round's palette is already decoded in memory, loaded during the previous celebration. | 1 |
| N12 | **Given** both languages, **then** each tile has a `long` and a `short` clip slot, even where they are identical. | 2 |

## O · Motion

| # | Given / When / Then | Tier |
|---|---|---|
| O1 | **Given** the source, **when** it is audited, **then** **every** `Animated` value drives only `transform` or `opacity`, and every animation sets `useNativeDriver: true`. | 1 |
| O2 | **Given** the manifest, **then** neither `react-native-reanimated` nor `react-native-gesture-handler` is a dependency. | 1 |
| O3 | **Given** the source, **then** no animation drives `backgroundColor`, `borderColor`, `width`, `height`, `top`, `left`, or a shadow property. | 1 |
| O4 | **Given** OS reduce-motion is on, **then** every animation becomes a cross-fade of the **same duration**, confetti and the light sprite are not rendered, and all timings in §F still hold. | 3 |
| O5 | **Given** reduce-motion, **then** the audio is byte-identical to the non-reduced case. | 3 |
| O6 | **Given** parent menu → Motion, **then** reduce-motion can be turned on or off independently of the OS setting. | 3 |
| O7 | **Given** the not-a-word settle, **then** the plate translates by **±4 pt at 520 ms total** — measurably a slow rock, not a fast error shake. | 3 |
| O8 | **Given** an auto-place (G5), **then** its flight takes 420 ms, measurably slower than the 260 ms of a child-initiated placement. | 3 |
| O9 | **Given** any animation is interrupted by a new interaction, **then** it is cancelled cleanly and leaves no residual transform. | 3 |

## P · Layout, devices, rotation

| # | Given / When / Then | Tier |
|---|---|---|
| P1 | **Given** `node tools/layout-sweep.mjs`, **when** it is run, **then** it exits 0 over viewports 360–1400 × 600–1440 in steps of 4, × 8 safe-area shapes, × palette sizes 1–8. | 4 |
| P2 | **Given** any served viewport, **then** `tile ≥ 72` pt/dp. | 4 |
| P3 | **Given** any served viewport, **then** the tile row fits the content width with no horizontal scrolling. | 4 |
| P4 | **Given** any served viewport, **then** `frameH ≥ 200` and `≥ 28%` of the usable height. | 4 |
| P5 | **Given** an iPad in portrait at stage 5 Vietnamese, **then** tiles are 116 pt and the picture is 758 × 620. | 4 |
| P6 | **Given** a 360 × 640 Android phone at stage 7 English (8 tiles), **then** tiles are 73 pt, the row is 325 of 328 pt, and the picture is 328 × 300. | 4 |
| P7 | **Given** a phone, **then** the app is locked to portrait and does not rotate. | 3 |
| P8 | **Given** a tablet, **then** both orientations are served. | 3 |
| P9 | **Given** a tablet mid-round with two tiles seated and two segments lit, **when** the device is rotated, **then** the same tiles are seated, the same segments are lit, audio does not restart, and no progress is lost. | 3 |
| P10 | **Given** a tablet during the chant, **when** the device is rotated, **then** the chant continues from where it was. | 3 |
| P11 | **Given** any viewport, **then** no interactive element's hit rect overlaps another's. | 4 |
| P12 | **Given** a tablet, **then** the palette band is horizontally centred and no tile is within 40 pt of a screen corner. | 4 |
| P13 | **Given** any viewport, **then** the mode title is rendered in the top bar. | 3 |

## Q · Typography and Vietnamese rendering

| # | Given / When / Then | Tier |
|---|---|---|
| Q1 | **Given** the fixture string, **when** rendered in the bundled tile font at 36 pt and 116 pt, **then** every codepoint renders with no `.notdef` and no blank. | 2 |
| Q2 | **Given** the fixture, **then** the rendering face is the **bundled** font, not a system fallback. | 2 |
| Q3 | **Given** `mả` and `mã` rendered separately in the bundled tile font and diffed, **then** they differ by **≥ 200 pixels at 116 pt** and **≥ 40 pixels at 36 pt**. Repeated for `hổ/hô`, `ả/ã`, `ẻ/ẽ`, `ỏ/õ`, `ủ/ũ`, `ỷ/ỹ`. *(Two thresholds because the count scales with render size. Baloo 2 measures 935 and 53; a font that does not draw the mark scores ~0 at both.)* | 2 |
| Q4 | **Given** `ộ`, `ặ`, `ể`, `ỹ`, `ẫ`, `ẵ`, **then** no ink falls outside the 1.55 em glyph box — nothing clips above or below. *(Baloo 2's worst span is 1.017 em, Be Vietnam Pro's 1.189 em.)* | 2 |
| Q5 | **Given** `ươ`, `ề`, `ộ`, `ẫ`, `ỡ`, **then** each renders as one composed glyph, not a base plus a floating mark. | 2 |
| Q5a | **Given** the bundled tile font, **when** its `cmap` is read, **then** it covers **all 90** characters of the fixture. *(Fredoka covered 35/90 and was rejected on this criterion — `ui.md` §6.0.)* | 2 |
| Q5b | **Given** each below-marked glyph, **then** its ink extends lower than its unmarked base (`ộ` below `ô`, `ặ` below `ă`, `ậ` below `â`, `ợ` below `ơ`, `ự` below `ư`, `ẹ` below `e`, `ị` below `i`, `ạ` below `a`), and each above-marked glyph extends higher than its base (`ế` above `ê`, `ể` above `ê`, `ỗ` above `ô`, `ữ` above `ư`, `ẵ` above `ă`, `ầ` above `â`). | 2 |
| Q5c | **Given** the bundled tile font file, **then** it is a **subset** carrying Latin plus the Vietnamese block, not the full upstream family, and it is **≤ 150 KB**. *(Baloo 2 subsets from 683 KB to 117 KB with coverage and Q3 unchanged.)* | 2 |
| Q6 | **Given** any tile, **then** its glyph box is `1.55 × fontSize` with the baseline at `1.19 × fontSize` from the box top. | 4 |
| Q7 | **Given** a multi-character tile (`ngh`, `ăng`, `uôi`, `sh`, `ck`), **then** the glyph shrinks to fit 82% of the tile width, never below 24 pt, and never shrinks vertically. | 4 |
| Q8 | **Given** the tile font fails Q1–Q5, **then** the build fails. It is a gate, not a review note. | 2 |
| Q9 | **Given** no bundled font is present at runtime, **then** the app does not silently fall back to the system font for Vietnamese text. | 1 |
| Q10 | **Given** the tile font, **then** its lowercase `a` and `g` are **single-storey** — the letterforms a child is taught to write. | 2 |

## R · Language isolation

| # | Given / When / Then | Tier |
|---|---|---|
| R1 | **Given** a Vietnamese session, **when** every screen is captured, **then** no English word, tile, letter-sound clip or asset appears on any of them. | 3 |
| R2 | **Given** an English session, **then** no Vietnamese word, tile, diacritic, onset clip or tone name appears anywhere. | 3 |
| R3 | **Given** the whole app, **then** the **first-launch chooser is the only screen showing both languages** — the single exemption. | 3 |
| R4 | **Given** the source, **then** no code path reads the other language's pack, and there is no fallback, default or coalescing operator onto it. | 1 |
| R5 | **Given** a word missing an asset, **then** it is **skipped**, never substituted from the other pack, and the round generator draws another word. | 1 |
| R6 | **Given** a language switch, **then** every audio handle from the previous language is released before any new one is opened. | 1 |
| R7 | **Given** the parent surfaces, **then** they are rendered entirely in the app's chosen language. | 3 |
| R8 | **Given** a word entry, **when** it is inspected, **then** it contains **no field naming or referencing the other language's word**. | 2 |
| R9 | **Given** a fuzzed pack where a Vietnamese entry carries an English field, **then** the validator rejects that entry and the app still runs. | 2 |

## S · Colour, theme and contrast

| # | Given / When / Then | Tier |
|---|---|---|
| S1 | **Given** `node tools/theme-contrast.mjs`, **when** it is run, **then** it exits 0 across all three themes. | 2 |
| S2 | **Given** the sweep, **when** any `role*` hex is changed to a near-ground pastel, **then** it exits **1** naming that pair. *(Never trust a green check you have not seen fail.)* | 2 |
| S3 | **Given** the source, **when** it is audited, **then** **no component contains a colour literal**. Every colour comes from the active theme's tokens. | 1 |
| S4 | **Given** any theme, **then** the tile glyph contrast is ≥ 13:1 and within 0.5 of every other theme's. No theme makes reading harder. | 2 |
| S5 | **Given** any theme, **then** onset is `role1`/solid, rime is `role2`/split, tone is `role3`/dotted. The slot→meaning mapping is identical in all three. | 3 |
| S6 | **Given** any theme, **then** the three role hues are pairwise ΔE00 ≥ 25 to a normal-sighted observer. | 2 |
| S7 | **Given** the whole app in any theme, **then** **no red error state, no grey-out, no X mark and no failure colour** appears anywhere. | 3 |
| S8 | **Given** the app rendered in greyscale, **then** every role remains identifiable by bar pattern alone. | 3 |
| S9 | **Given** any theme, **then** the ground is light and no dark-theme surface is rendered. | 3 |

## T · What a toddler actually does

| # | Given / When / Then | Tier |
|---|---|---|
| T1 | **Given** six tiles tapped within 400 ms, **then** the engine records six placements in order, the board is consistent, and no tile is lost or duplicated. | 1 |
| T2 | **Given** the same tile double-tapped within 120 ms, **then** it is seated and then lifted, ending in the band, and its sound plays twice. | 3 |
| T3 | **Given** a tile held for 30 s, **then** N6 holds and the app remains responsive throughout. | 3 |
| T4 | **Given** two fingers land on two tiles simultaneously, **then** exactly one tile is seated and exactly one sound plays. | 3 |
| T5 | **Given** a finger dragged across the whole band without lifting, **then** **no** tile is seated (no drag gesture exists) and at most one sound plays. | 3 |
| T6 | **Given** a touch that starts on a tile and ends off-screen, **then** nothing is seated and no state is corrupted. | 3 |
| T7 | **Given** the app is backgrounded mid-chant, **when** it returns, **then** audio has stopped, the chant does not resume mid-word, and the board is in the pre-chant state or resolved — never half-merged. | 3 |
| T8 | **Given** an incoming call during the reveal, **when** it ends, **then** the app is on a valid screen and the round is either held or advanced, never blank. | 5 |
| T9 | **Given** the device is locked and unlocked mid-round, **then** the board is unchanged and the idle ladder resumes from where it was. | 3 |
| T10 | **Given** 200 random taps at random screen coordinates over 60 s, **then** the app does not crash, does not leave the game, and does not reach the parent menu. | 3 |
| T11 | **Given** the gate dot is tapped 50 times rapidly, **then** the gate does not open. | 3 |
| T12 | **Given** the reveal is tapped 30 times, **then** the word replays each time with no audio pile-up and the next round begins after the last tap plus 3000 ms. | 3 |
| T13 | **Given** the device is rotated repeatedly during a chant on a tablet, **then** no audio restarts and no tile is lost. | 3 |
| T14 | **Given** the app is force-killed mid-round, **when** relaunched, **then** it opens on a fresh round with the page rail and progression intact. No corrupt board is restored. | 2 |
| T15 | **Given** system volume at zero, **then** the game remains completable — the hint ladder still fires and the picture still brightens. | 3 |
| T16 | **Given** an hour of continuous play, **then** memory does not grow without bound and no audio handle is leaked. | 5 |

## U · The things only a child can tell us (Tier 5)

Not automatable. Listed because `development-process.md` §5 says only Tier 5 proves the
product, and because the most likely way this app fails is that it is **boring**, which no
harness detects.

| # | Question | How we would know |
|---|---|---|
| U1 | Does he win round 1 in under 10 seconds? | watch him |
| U2 | Does he play for five minutes without being asked to? | watch him |
| U3 | Does he understand that the picture getting brighter means he is right? | he looks at it after a correct tap |
| U4 | Are 72 pt tiles big enough for his aim on the smallest device in the house? | count mis-taps on the wrong tile |
| U5 | Is the "kuh, cat" clip intelligible to him? | he repeats it |
| U6 | Does the not-a-word settle read as friendly or as rejection? | does he try again, or put it down |
| U7 | Does the hint ladder arrive too early, too late, or unnoticed? | watch what he does at 40 s |
| U8 | Does his mother find the editor without being shown it twice? | hand her the phone and say nothing |
| U9 | Can she add a word in under three minutes, three months after the last time? | ask her in three months |
| U10 | Does the reveal still delight him on the twentieth word? | watch his face |
