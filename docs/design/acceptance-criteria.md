# Acceptance criteria

**Ghép Chữ** / **Word Blocks**. Owner: game-designer. These are what the app-developer builds
to and what the app-tester verifies. The developer may not edit them; the tester may not fix
what they catch (`development-process.md` §1).

**Form.** Every criterion is one observable behaviour, numbered, Given/When/Then, citable as
`AC-B4`. If verifying one requires reading source rather than running something, it is written
wrong — say so rather than pass it.

**Tier** column maps to `development-process.md` §5: 1 engine · 2 content · 3 E2E · 4 layout ·
5 on-device.

**Reading `<lang>`**: unless a criterion names a language, it must hold in **both** modes and is
verified twice. The child has both languages; neither is secondary.

---

## 0. REVISION 2 — the mechanic changed, and so did these

**2026-09-23.** `gameplay.md` §0 records the correction: the app no longer picks a target word
and offers a palette to complete it. It shows a **table of characters**, disables those that
cannot lead to a word, and announces when a word forms. `ui.md` §0 records what that did to the
UI and closes six document defects.

**Id policy, so citations in code, commits and test names stay meaningful:**

- **Group letters are stable.** §B is still the board, §F is still the payoff, §Q is still the
  font. A criterion whose behaviour survived the correction kept its exact id — most of §A,
  §I, §J, §L, §N, §O, §Q, §R and §T are untouched.
- **Where revision 1's behaviour is gone, the id is listed in §W with the reason.** Numbers
  inside a group have been reassigned where a criterion had no successor, so **a test citing a
  revision-1 id must be checked against §W rather than assumed to still mean what it meant.**
  §W exists precisely so that a stale citation is detectable instead of silently wrong.
- **`F2` is retired outright and is not reassigned**, because it is the one the tester raised
  as a contradiction and its absence should be visible in the numbering.

**Count: 269 numbered criteria in §A–§T, 14 Tier-5 questions in §U, and 24 withdrawn groups in
§W.**

---

## A · Launch, language and theme

| # | Given / When / Then | Tier |
|---|---|---|
| A1 | **Given** a first install, **when** the app opens, **then** the language chooser is shown with both `Ghép Chữ` and `Word Blocks` panels and three unlabelled theme buttons. | 3 |
| A2 | **Given** the chooser, **when** a panel is tapped once, **then** it expands, a sample word is spoken in that language, a confirm control appears, and **no language is committed**. | 3 |
| A3 | **Given** an expanded panel, **when** the confirm control is tapped, **then** the language is committed and the board of that language is shown. Committing therefore requires **two** touches. | 3 |
| A4 | **Given** the chooser, **when** any theme button is tapped, **then** the chooser and both panels immediately re-render in that theme and no language is committed. | 3 |
| A5 | **Given** a committed language, **when** the app is relaunched, **then** it opens directly onto the board and the chooser is **not** shown. | 3 |
| A6 | **Given** any state, **when** the app is relaunched, **then** the previously chosen theme is active, read from AsyncStorage. | 3 |
| A7 | **Given** the app is running, **when** the content pack is inspected, **then** no pack data has been written to AsyncStorage. AsyncStorage holds settings only. | 2 |
| A8 | **Given** a viewport smaller than 360 × 600 pt, **when** the app opens, **then** the screen-too-small card is shown and no board is mounted. | 4 |
| A9 | **Given** parent menu → Language, **when** the other language is confirmed, **then** the game unmounts, the pack reloads, the prefix tree rebuilds, and the board of the new language is shown. | 3 |
| A10 | **Given** a language switch has completed, **when** memory is inspected, **then** no board component, tile, clip handle or tree node from the previous language is retained. | 1 |
| A11 | **Given** a viewport that serves fewer than 20 table cells (`ui.md` §4.3 F7), **when** the app opens, **then** the screen-too-small card is shown and no board is mounted. | 4 |

## B · The board, the table, and the live set

| # | Given / When / Then | Tier |
|---|---|---|
| B1 | **Given** the board is shown, **then** it contains exactly three things: the top bar, the word strip and the character table. **No picture, no picture frame, no veil, no caption strip.** | 3 |
| B2 | **Given** the board is shown with an empty strip, **then** the table contains the first `cells` symbols of the pack's `inventoryOrder` for that position, where `cells` is the current stage's table size (8 / 12 / 16 / 20 / 24). | 1 |
| B3 | **Given** any prefix, **then** a table symbol is **live** iff the eligible word set contains at least one word beginning with `prefix + symbol`, and **disabled** otherwise. | 1 |
| B4 | **Given** an empty strip, **then** the live set is exactly the symbols that **begin** some eligible word, and every other symbol on the table is disabled. | 1 |
| B5 | **Given** any sequence of taps on **live** symbols only, **then** the resulting prefix always has at least one completion in the eligible word set. Garbage is unreachable. | 1 |
| B6 | **Given** any reachable state, **then** either the strip's contents are a word, or at least one table symbol is live, or both. There is no third case. | 1 |
| B7 | **Given** the same table, **when** the app is relaunched, **then** every symbol is in the same cell. Cell position is a pure function of `inventoryOrder` and the grid, never of a word, a session or a random source. | 1 |
| B8 | **Given** a tap that changes the live set, **then** the table's tile **size and cell positions do not change** — only the live/disabled rendering of each cell. | 4 |
| B9 | **Given** the *k*-th encounter of a word with *n* images (`k` from 0), **then** the reveal shows `images[k mod n]`. | 1 |
| B10 | **Given** a word with exactly 1 image, **when** it is discovered repeatedly, **then** that image is shown every time and nothing errors. | 3 |
| B11 | **Given** a word with exactly 2 images, **when** it is discovered three times, **then** the reveals show `images[0]`, `images[1]`, `images[0]`. *(This is the case the old B9/F2 pair could not satisfy — see §W.)* | 1 |
| B12 | **Given** the same seed and the same sequence of taps, **when** the engine is replayed, **then** the identical sequence of tables, live sets, words and images is produced. | 1 |
| B13 | **Given** the whole table, **then** every symbol it contains is fully visible on screen. **Nothing scrolls and nothing is clipped.** | 4 |
| B14 | **Given** a word withheld for a missing asset, **then** it is absent from the prefix tree, so no live symbol ever leads to it. | 1 |
| B15 | **Given** the board, **then** the only non-play control on it is the 32 pt gate dot. | 3 |

## C · Vietnamese assembly

| # | Given / When / Then | Tier |
|---|---|---|
| C1 | **Given** a Vietnamese board with an empty strip, **then** the table shows the **onset inventory** and the strip has **three cells**: onset ┊ rime ┊ tone. | 3 |
| C2 | **Given** the Vietnamese onset table, **then** its last cell is the **∅ tile**, drawn as a dashed empty socket, and it is live iff some eligible word has no onset. | 3 |
| C3 | **Given** the ∅ tile is tapped while live, **then** it seats in the onset cell, plays the low wooden *open* sound and **not** a speech clip, and the table morphs to rimes. | 3 |
| C4 | **Given** the onset table, **when** a live onset is tapped, **then** it seats in the onset cell and the table cross-fades to the **rime inventory** within 280 ms. | 3 |
| C5 | **Given** the rime table, **when** a live rime is tapped, **then** it seats in the rime cell and the table cross-fades to that rime's **toned forms**. | 3 |
| C6 | **Given** the tone table, **then** each cell renders **the chosen rime with that tone's mark applied** (`eo èo éo ẻo ẽo ẹo`), never a bare diacritic. | 3 |
| C7 | **Given** a rime ending in `p`, `t`, `c` or `ch`, **when** the tone table appears, **then** it contains exactly **two** cells (`sắc`, `nặng`) and no others — illegal tones are **not rendered at all**, as distinct from rendered-and-disabled. | 1 |
| C8 | **Given** `ngang` completes a word, **then** it is a live tile he presses, and the strip shows the unmarked form. `ngang` is never implicit. | 1 |
| C9 | **Given** any (onset, rime) with exactly one completing tone, **then** that tone tile is live, the rest are disabled, and **the word is not auto-committed**. He taps it. | 1 |
| C10 | **Given** a seated rime, **when** the rime cell is tapped, **then** the rime and any tone return to the table and the table morphs back to **rimes**. | 3 |
| C11 | **Given** a seated onset, **when** the onset cell is tapped, **then** the onset, rime and tone all return and the table morphs back to **onsets**. | 3 |
| C12 | **Given** a Vietnamese word forms, **then** the chant plays `onset · rime · toneless-blend · tone · word`, with the tone step **omitted** for `ngang` and the onset step omitted for a zero onset. | 3 |
| C13 | **Given** the chant reaches the toneless blend, **then** the strip's hairlines dissolve and the glyphs slide together. | 3 |
| C14 | **Given** the chant reaches the tone step, **then** the marked form cross-fades in and the mark animates down into place. | 3 |
| C15 | **Given** a Vietnamese board, **then** onset tiles carry a **solid** bar in `role1`, rime tiles a **split** bar in `role2`, tone tiles a **dotted** bar in `role3`. | 3 |
| C16 | **Given** any point in a Vietnamese session, **then** **exactly one** of the three roles is on the table. The three are never shown together. | 3 |
| C17 | **Given** any palette position, **then** the table never contains both of `{c,k}`, `{g,gh}`, `{ng,ngh}` as **live** symbols for the same prefix, and no dialect homophone pair for the pack's `dialect` is live together (`literacy-vi.md` §6.1). | 1 |
| C18 | **Given** the onset table contains `ngh` and the current tree has no `ngh` word, **then** `ngh` is rendered, disabled, and speaks its đánh vần name when tapped. | 3 |

## D · English assembly

| # | Given / When / Then | Tier |
|---|---|---|
| D1 | **Given** an English board with an empty strip, **then** the table shows the letter inventory in **alphabetical order** and the strip shows **one empty cell**. | 3 |
| D2 | **Given** a live tile is tapped, **then** it seats in the next empty strip cell and **a new empty cell appears to its right**. | 3 |
| D3 | **Given** any English strip state, **then** the number of cells shown is the number of symbols placed plus one. **The target length is never shown.** | 3 |
| D4 | **Given** a seated tile, **when** its strip cell is tapped, **then** that tile **and every tile after it** returns to the table. | 3 |
| D5 | **Given** any English board, **then** vowel tiles carry a **split** bar in `role2` and consonant tiles a **solid** bar in `role1`, and the two are distinguishable with the screen desaturated. | 3 |
| D6 | **Given** any English board, **then** **no tile carries `role3`**. | 3 |
| D7 | **Given** a tile is touched for the **first** time in a session, **then** its `long` clip plays ("kuh, cat"). | 3 |
| D8 | **Given** a tile is touched again in the same session, **then** its `short` clip plays ("kuh"). | 3 |
| D9 | **Given** any tile was touched in the previous 900 ms, **when** any tile is touched, **then** the `short` clip plays regardless of whether it is that tile's first touch. | 3 |
| D10 | **Given** an English word forms, **then** the chant uses `short` clips left to right, then the whole word — never the `long` anchored form. | 3 |
| D11 | **Given** any prefix, **then** `c` and `k` are never both live. | 1 |
| D12 | **Given** an empty strip, **then** `ck`, `ll`, `ss`, `ff`, `zz`, `ng` and `x` are **disabled**, because no pack word begins with them. This is B4 doing `literacy-en.md` §3.3's job for free. | 1 |
| D13 | **Given** the prefix `c` `a`, **then** the live set is exactly the letters that complete a pack word (`n`, `p`, `t` in `en-seed`), and every other letter on the table is disabled. | 1 |
| D14 | **Given** a digraph tile is on the table at stage 6 or 7, **then** it renders as one tile with its two letters, shrunk to 82% of the tile width, never below 24 pt. | 4 |

## E · Live, disabled, and undo

| # | Given / When / Then | Tier |
|---|---|---|
| E1 | **Given** a **live** tile is tapped, **then** its sound plays, it flies to the strip over 260 ms, a 90 ms seat click plays, and the table restands within 200 ms. | 3 |
| E2 | **Given** a **disabled** tile is tapped, **then** **its own clip plays in full**, the tile dips 2 pt and returns over 120 ms, a muted knock plays at −9 dB, and **nothing else changes**: no seat, no strip change, no table change. | 3 |
| E3 | **Given** a disabled tile is tapped, **then** nothing red, nothing grey-to-illegible, no X, no shake, no buzzer and no error glyph is rendered anywhere. | 3 |
| E4 | **Given** a disabled tile, **then** its glyph is rendered at **full opacity** in `inkSoft` and measures **≥ 4.5:1** against the ground in every theme. | 2 |
| E5 | **Given** a disabled tile, **then** it carries **no identity bars**, a 3 pt `roleEdge` underbar, and a 1.5 pt dashed outline — and a live tile carries two bars, a solid 2 pt outline and a white face. | 3 |
| E6 | **Given** the board rendered in **greyscale**, **then** live and disabled tiles remain distinguishable, by bar weight and outline solidity alone. | 3 |
| E7 | **Given** a tap changes the live set, **then** the tiles that change state animate with M6 (200 ms cross-fade, 2 pt rise or fall, 20 ms stagger by cell index) and **no tile moves cell**. | 3 |
| E8 | **Given** any symbol in the strip is tapped, **then** that symbol **and every symbol after it** returns to the table, one at a time 90 ms apart, each playing its own clip, with one descending two-note unclick. | 3 |
| E9 | **Given** the **first** symbol in the strip is tapped, **then** the strip is emptied completely and the table returns to the position-1 live set. | 3 |
| E10 | **Given** an undo, **then** the table's live set is exactly the live set for the shortened prefix — recomputed, not restored from a cache that can drift. | 1 |
| E11 | **Given** any sequence of taps whatsoever, live or disabled, **then** no state exists from which a word cannot be reached. | 1 |
| E12 | **Given** the whole app in any theme, **then** **no red error state, no grey-out, no X mark and no failure colour** appears anywhere. | 3 |
| E13 | **Given** a disabled tile is tapped 20 times in a row, **then** its clip plays 20 times, the app does not change state, and nothing is queued or delayed. | 3 |

## F · The announcement and the reveal

| # | Given / When / Then | Tier |
|---|---|---|
| F1 | **Given** a tap completes a word, **then** the announcement motif begins **within 60 ms of that touch-down** — before the chant, not after it. | 5 |
| F3 | **Given** the announcement, **then** the strip's symbols hop in sequence 90 ms apart, the hairlines dissolve at 300 ms, and confetti fires at 350 ms. | 3 |
| F4 | **Given** the word is **new to this child**, **then** the motif is four notes (three rising plus one an octave above the root at 390 ms). | 3 |
| F5 | **Given** the word has been discovered before, **then** the motif is three notes and **the parts chant is skipped** — the whole word is spoken and the picture follows. | 3 |
| F6 | **Given** the pack has a recorded cheer, **then** it plays at t = 0 over the motif; **given** it does not, the motif plays alone and nothing else differs. | 3 |
| F7 | **Given** the chant ends, **then** the picture scales and translates **from the word strip's rectangle** to full screen over 420 ms. | 3 |
| F8 | **Given** the reveal, **then** the word is spoken ~200 ms after the picture is full screen. | 3 |
| F9 | **Given** the reveal has settled, **then** there is **silence from +1400 ms to +2200 ms** and the word is spoken again at +2200 ms. | 3 |
| F10 | **Given** the held reveal, **when** the picture is tapped, **then** the word replays, the picture bounces 1.04× **and advances to the word's next photograph**, and the exit timer resets. | 3 |
| F11 | **Given** the held reveal and no further taps, **then** the picture flies into a shelf slot 3000 ms later and the board returns. | 3 |
| F12 | **Given** any reveal, **then** no number, score, star, percentage, "well done" count or streak appears. | 3 |
| F13 | **Given** the reveal and `Show the word` on, **then** the word and, if the pack has one, the sentence are shown under the picture; **given** it is off, neither is. | 3 |
| F14 | **Given** the revealed word is **not** a proper prefix of any other eligible word, **then** the strip is empty when the board returns. | 3 |
| F15 | **Given** the revealed word **is** a proper prefix of another eligible word (`he` → `hen`), **then** the announcement, chant and picture all run in full, **and** when the board returns the strip still holds that word with the continuing symbols live. | 3 |
| F16 | **Given** a prefix-word continuation is on screen, **then** tapping the strip still undoes normally (E8/E9), so he is never trapped in it. | 3 |
| F17 | **Given** Vietnamese, **then** case F15 never arises, because every word is exactly three symbols. | 1 |
| F18 | **Given** the announcement motif, **then** it is **byte-identical in both language modes** and contains no speech. | 2 |
| F19 | **Given** the motif plays, **then** tile audio is ducked to −18 dB for its duration and resumes afterwards. | 5 |

## G · No fail state, and the idle ladder

| # | Given / When / Then | Tier |
|---|---|---|
| G1 | **Given** any screen in the game, **then** there is no timer, no countdown, no clock, no score, no lives and no progress bar. | 3 |
| G2 | **Given** 20 s with no symbol seated, **then** the **shimmer** sweeps across the live tiles only, over 900 ms, and repeats. | 3 |
| G3 | **Given** 40 s idle, **then** one **live** tile breathes: 1200 ms on, 1600 ms pause, repeating. | 3 |
| G4 | **Given** 60 s idle, **then** that tile shows a steady `reward` rim. | 3 |
| G5 | **Given** 80 s idle, **then** that tile rises, pauses, flies into the strip by itself over 420 ms and plays its sound. | 3 |
| G6 | **Given** an auto-play, **then** the ladder restarts at 20 s, and because every live path ends in a word, **the app left alone eventually announces a word by itself**. | 3 |
| G7 | **Given** a symbol is seated, **then** the idle timer resets to 0. | 1 |
| G8 | **Given** a disabled tile is tapped, **then** the idle timer does **not** reset, but the next escalation is deferred by 4 s. | 1 |
| G9 | **Given** any touch anywhere, **then** no auto-play fires within the following 4 s. | 3 |
| G10 | **Given** an auto-play occurred, **then** that discovery does not count toward stage advancement. | 1 |
| G11 | **Given** the tile the ladder chooses, **then** it is drawn by the seeded RNG from the **live** set, preferring a symbol whose subtree holds an undiscovered word — and the same seed and history choose the same tile. | 1 |
| G12 | **Given** an auto-play completes a word, **then** the full announcement runs exactly as if he had tapped it. Nothing in the child's UI says the app did it. | 3 |

## H · Stage, shelf, album, ending

| # | Given / When / Then | Tier |
|---|---|---|
| H1 | **Given** stage *s*, **then** the table shows `[8,12,16,20,24][s-1]` cells, capped by the viewport's `maxCells`. | 4 |
| H2 | **Given** 8 new words discovered at the current stage with no auto-play assist, **then** the stage advances by one and the table gains four cells. | 1 |
| H3 | **Given** stage advancement occurs, **then** **no level-up screen, banner, sound, badge or message is shown.** | 3 |
| H4 | **Given** any sequence of play, **then** the stage never decreases. | 1 |
| H5 | **Given** a word is discovered for the **first** time, **then** exactly one shelf slot fills, with that word's photograph. | 3 |
| H6 | **Given** a word is **re-**discovered, **then** no shelf slot fills and the word's album card bounces instead. | 3 |
| H7 | **Given** the fifth shelf slot fills, **then** the shelf tips into the album, the album is shown, and **play does not resume by itself**. | 3 |
| H8 | **Given** the album is left, **then** the shelf is empty again. | 3 |
| H9 | **Given** the album, **then** it shows **every word ever discovered**, newest first, scrolling, with **no count, number, percentage or star**. | 3 |
| H10 | **Given** the album, **when** a card is tapped, **then** its word replays, the card bounces, and it shows that word's next photograph. | 3 |
| H11 | **Given** the album, **when** the play card is tapped, **then** the board returns with an empty strip. | 3 |
| H12 | **Given** the album, **then** three 44 pt theme buttons are present and tapping one re-themes the app immediately without leaving the page. | 3 |
| H13 | **Given** a filled shelf slot is tapped on the board, **then** that word replays and the slot bounces; **no** picture opens full screen. | 3 |
| H14 | **Given** parent menu → Finish session, **then** audio fades over 800 ms, the board is abandoned, and the end screen is shown. | 3 |
| H15 | **Given** the end screen, **then** it shows this session's pictures and **contains no control that starts play**. | 3 |
| H16 | **Given** the end screen, **when** any picture or empty area is tapped repeatedly, **then** play does not resume. Resuming requires the gate. | 3 |
| H17 | **Given** the app is running, **then** there is **no round, no round counter, no page and no dot rail** anywhere in the UI. | 3 |

## I · Parental gate and parent menu

| # | Given / When / Then | Tier |
|---|---|---|
| I1 | **Given** the board, **then** the gate dot is 32 pt at 30% opacity in the top-right of the top bar. | 3 |
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
| I12 | **Given** parent menu → Voice & pace, **then** it offers recording, replacing and removing **the cheer** (`ui.md` §13.6). | 3 |

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
| J9 | **Given** step 5, **then** a **fully playable board** is shown with her word live in the real table, and **her picture does not appear until the word is assembled**. | 3 |
| J10 | **Given** step 5 is confirmed, **then** the word is written atomically and appears in the list. | 2 |
| J11 | **Given** the add flow is entered from the parent menu mid-build, **when** it is completed or cancelled, **then** the app returns to **that same board** with the strip still assembled. | 3 |
| J12 | **Given** the picture step, **then** more than one image can be attached to one word, and **one image is sufficient to save and play**. | 3 |
| J13 | **Given** the editor on a viewport wider than 700 pt, **then** it renders as a centred 520 pt column, not a stretched form. | 4 |
| J14 | **Given** a word added by the mother, **then** the prefix tree is rebuilt atomically on save and the word is discoverable **without an app restart**. | 3 |
| J15 | **Given** she has just saved her first word, **then** the cheer screen is offered exactly once; declining it is one tap and it is never offered again automatically. | 3 |
| J16 | **Given** the cheer screen, **when** preview is tapped, **then** the **motif and her recording play together**, which is what the child will hear. | 3 |

## K · Editor — when a word cannot be played

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
| K10 | **Given** a linguistically valid word whose symbol is **not in `inventoryOrder`**, **then** the editor says so in one sentence, draws that symbol as a flat tile, and offers **Add it to the board**. | 3 |
| K11 | **Given** she taps **Add it to the board**, **then** the symbol is appended to `inventoryOrder`, the word becomes playable, and the change survives a restart. | 2 |
| K12 | **Given** `inventoryOrder` already holds 24 symbols for that position, **then** the editor says the board is full, lists the inventory with the number of words behind each symbol, and offers a **swap**. | 3 |
| K13 | **Given** a symbol is retired from the board, **then** **no word is deleted** — the affected words move to *not yet playable* with a one-line reason, and return unchanged if the symbol is put back. | 2 |
| K14 | **Given** the not-on-the-board screen, **then** it states how many cells the board has and how many are used. | 3 |

## L · Editor — delete and recovery

| # | Given / When / Then | Tier |
|---|---|---|
| L1 | **Given** a word row, **when** delete is chosen, **then** a confirmation shows **the word and its picture**. | 3 |
| L2 | **Given** a deletion, **then** a 6-second Undo toast is shown and undoing restores the word exactly. | 3 |
| L3 | **Given** a deletion older than the toast, **then** the word is in **Recently deleted** and restorable for 30 days. | 3 |
| L4 | **Given** a seed word is deleted, **then** the prefix tree is rebuilt without it and no live symbol leads to it. | 2 |
| L5 | **Given** the app is killed mid-delete, **then** on relaunch the word is either fully present or fully in Recently deleted — never half-written. | 2 |
| L6 | **Given** every word has been deleted, **then** the game shows a parent-facing empty-state card, not a crash and not a table with nothing live. | 2 |
| L7 | **Given** a deletion leaves a symbol with no words behind it, **then** that symbol stays on the table and is simply always disabled. The board does not reshuffle. | 1 |

## M · Co-play, and playing with the screen ignored

| # | Given / When / Then | Tier |
|---|---|---|
| M1 | **Given** the board, **then** the assembled word is legible from across a room: `stripFont ≥ 34 pt`. | 4 |
| M2 | **Given** the word strip is **held for 800 ms**, **then** the *parts of what is currently assembled* are spoken, and no completion, suggestion or whole word is spoken. | 3 |
| M3 | **Given** the parts hint has been used, **then** the idle ladder is unchanged and no assist is recorded. | 1 |
| M4 | **Given** the board, **then** there is **no caption strip**. | 3 |
| M5 | **Given** a full session played with the screen face-down, **then** the audio alone conveys: which letter was touched, whether it was live or disabled, that a symbol seated, that one was taken back, and that a word formed. | 5 |
| M6 | **Given** the app, **then** there is no two-player mode, no turn indicator, no pass-the-device prompt and no parent score. | 3 |
| M7 | **Given** the seat click, the disabled knock and the undo unclick, **then** the three are distinguishable by ear alone, and **the announcement rises while the unclick falls**. | 5 |

## N · Audio

| # | Given / When / Then | Tier |
|---|---|---|
| N1 | **Given** any tile, live or disabled, **when** it is touched, **then** its sound begins within **60 ms of touch-down** — not touch-up. | 5 |
| N2 | **Given** a tile, **when** it is touched, **then** the pressed visual state renders within one frame (16.7 ms). | 5 |
| N3 | **Given** a tile clip is playing, **when** another tile is touched, **then** the first clip **stops immediately** and the second starts. No overlap, no queue. | 3 |
| N4 | **Given** six tiles touched within 4 s, **then** six distinct clips are heard, each cut by the next, and nothing is still playing 1 s after the last touch. | 5 |
| N5 | **Given** a tile is held past 600 ms, **then** its short clip repeats every 700 ms, **at most 6 times**, then stops. | 3 |
| N6 | **Given** a tile is held for 30 s, **then** the audio has stopped, the tile shows a pressed breathing state, and on release **nothing is placed**. | 3 |
| N7 | **Given** touch-down and touch-up more than 600 ms apart, or more than 24 pt apart, **then** no symbol is placed. | 3 |
| N8 | **Given** the announcement or the chant is playing, **then** tile taps do not interrupt it and tiles are not tappable. | 3 |
| N9 | **Given** the device ringer switch is set to silent, **then** the game still speaks. | 5 |
| N10 | **Given** parent menu → mute, **then** all game audio is silenced and the game remains playable — the table still stands and lies, and the idle ladder still fires. | 3 |
| N11 | **Given** the table changes, **then** every clip the new table can produce is decoded in memory before the morph completes. | 1 |
| N12 | **Given** both languages, **then** each tile has a `long` and a `short` clip slot, even where they are identical. | 2 |
| N13 | **Given** the ∅ tile, **then** it plays a non-speech wooden *open* sound and never a đánh vần name. | 3 |

## O · Motion

| # | Given / When / Then | Tier |
|---|---|---|
| O1 | **Given** the source, **when** it is audited, **then** **every** `Animated` value drives only `transform` or `opacity`, and every animation sets `useNativeDriver: true`. | 1 |
| O2 | **Given** the manifest, **then** neither `react-native-reanimated` nor `react-native-gesture-handler` is a dependency. | 1 |
| O3 | **Given** the source, **then** no animation drives `backgroundColor`, `borderColor`, `width`, `height`, `top`, `left`, or a shadow property. | 1 |
| O4 | **Given** OS reduce-motion is on, **then** every animation becomes a cross-fade of the **same duration**, confetti is not rendered, and every timing in §F still holds. | 3 |
| O5 | **Given** reduce-motion, **then** the audio is byte-identical to the non-reduced case, **including the motif and the cheer**. | 3 |
| O6 | **Given** parent menu → Motion, **then** reduce-motion can be turned on or off independently of the OS setting. | 3 |
| O7 | **Given** the disabled-tile dip (M5), **then** it is **120 ms and 2 pt** — measurably the smallest motion in the app, and not a shake. | 3 |
| O8 | **Given** an auto-play (G5), **then** its flight takes 420 ms, measurably slower than the 260 ms of a child-initiated placement. | 3 |
| O9 | **Given** any animation is interrupted by a new interaction, **then** it is cancelled cleanly and leaves no residual transform. | 3 |
| O10 | **Given** the stand-up / lie-down transition (M6), **then** it is staggered by 20 ms per cell index, so the board reads as a wave rather than a flicker. | 3 |
| O11 | **Given** reduce-motion, **then** M6 is a cross-fade with **no stagger and no translation**, and the live set is still correct at the end of it. | 3 |

## P · Layout, devices, rotation

| # | Given / When / Then | Tier |
|---|---|---|
| P1 | **Given** `node tools/layout-sweep.mjs`, **when** it is run, **then** it exits 0 over viewports 360–1400 × 600–1440 in steps of 4, × 8 safe-area shapes, × table sizes 1–`maxCells`. | 4 |
| P2 | **Given** any served viewport, **then** `tile ≥ 72` pt/dp. | 4 |
| P3 | **Given** any served viewport, **then** the table row fits the content width with no horizontal scrolling. | 4 |
| P4 | **Given** any served viewport, **then** `maxCells ≥ 20`. | 4 |
| P5 | **Given** an iPad 11" in portrait at stage 5, **then** the table is **6 × 4 at 112 pt** with a 118 pt word strip. | 4 |
| P6 | **Given** a 360 × 640 Android phone, **then** `maxCells` is **20**, the table is 4 × 5 at 73 pt, and the row is 325 of 328 pt. | 4 |
| P7 | **Given** a phone, **then** the app is locked to portrait and does not rotate. | 3 |
| P8 | **Given** a tablet, **then** both orientations are served. | 3 |
| P9 | **Given** a tablet mid-build with two symbols seated, **when** the device is rotated, **then** the same symbols are seated, the live set is unchanged, audio does not restart, and no progress is lost. | 3 |
| P10 | **Given** a tablet during the chant, **when** the device is rotated, **then** the chant continues from where it was. | 3 |
| P11 | **Given** any viewport, **then** no interactive element's hit rect overlaps another's. | 4 |
| P12 | **Given** a tablet, **then** the table is horizontally centred and no tile is within 40 pt of a screen corner. | 4 |
| P13 | **Given** any viewport, **then** the mode title is rendered in the top bar. | 3 |
| P14 | **Given** a rotation that changes the grid from 4 × 5 to 6 × 4, **then** the **reading order of the table is unchanged** — row-major over the same `inventoryOrder`. | 4 |
| P15 | **Given** any served viewport, **then** five shelf slots of at least 22 pt fit the top bar. | 4 |
| P16 | **Given** the layout law, **then** it contains **no caption-strip term**, because the board has no caption strip. *(Closes the Slice-3 defect; see §W.)* | 4 |

## Q · Typography and Vietnamese rendering

| # | Given / When / Then | Tier |
|---|---|---|
| Q1 | **Given** the fixture string, **when** rendered in the bundled tile font at 36 pt and 116 pt, **then** every codepoint renders with no `.notdef` and no blank. | 2 |
| Q2 | **Given** the fixture, **then** the rendering face is the **bundled** font, not a system fallback. | 2 |
| Q3 | **Given** `mả` and `mã` rendered separately in the bundled tile font and diffed, **then** they differ by **≥ 200 px at 116 pt** and **≥ 20 px at 36 pt**. Repeated for `hổ/hô`, `ả/ã`, `ẻ/ẽ`, `ỏ/õ`, `ủ/ũ`, `ỷ/ỹ`. *(Revision 2: the 36 pt floor was 40 and **failed a correct font**. Measured on the shipped `Baloo2-SemiBold.ttf`: the binding pair `hổ/hô` is 365 px at 116 pt and **34 px at 36 pt**; the rest are 533–564 and 63–70. Pixel counts are not portable between rasterisers — the Slice-3 developer measured 38.7 for this pair — so the floor sits far below every measurement rather than near one. The failure it catches, "the mark is not drawn", scores 0.)* | 2 |
| Q4 | **Given** `ộ`, `ặ`, `ể`, `ỹ`, `ẫ`, `ẵ`, **then** no ink falls outside the 1.55 em glyph box — nothing clips above or below. *(Baloo 2's worst span is 1.017 em, Be Vietnam Pro's 1.189 em.)* | 2 |
| Q5 | **Given** `ươ`, `ề`, `ộ`, `ẫ`, `ỡ`, **then** each renders as one composed glyph, not a base plus a floating mark. | 2 |
| Q5a | **Given** the bundled tile font, **then** it covers **all 86** unique codepoints of `assets/fonts/FIXTURE.txt`. *(Revision 2: the fixture is **124 non-space characters, 86 unique** — it was miscounted as 90. Measured: Baloo 2 86/86, Be Vietnam Pro 86/86, Fredoka 35/86.)* | 2 |
| Q5b | **Given** each below-marked glyph, **then** its ink extends lower than its unmarked base (`ộ` below `ô`, `ặ` below `ă`, `ậ` below `â`, `ợ` below `ơ`, `ự` below `ư`, `ẹ` below `e`, `ị` below `i`, `ạ` below `a`), and each above-marked glyph extends higher than its base (`ế` above `ê`, `ể` above `ê`, `ỗ` above `ô`, `ữ` above `ư`, `ẵ` above `ă`, `ầ` above `â`). *(This, not Q3, is what gates below-marks: `ộ`/`ô` is only 27 px apart at 36 pt because a dot below is small, and an ink-extent check is not size-dependent.)* | 2 |
| Q5c | **Given** the bundled tile font file, **then** it is a **subset** carrying Latin plus the Vietnamese block, not the full upstream family, and it is **≤ 150 KB**. *(Measured: `Baloo2-SemiBold.ttf` is 90,716 bytes = 88.6 KB. Revision 1 said 117 KB, which was the upstream variable-font subset.)* | 2 |
| Q6 | **Given** any tile, **then** its glyph box is `1.55 × fontSize` with the baseline at `1.19 × fontSize` from the box top. | 4 |
| Q7 | **Given** a multi-character tile (`ngh`, `ăng`, `uống`, `sh`, `ck`), **then** the glyph shrinks to fit 82% of the tile width, never below 24 pt, and never shrinks vertically. | 4 |
| Q8 | **Given** the tile font fails Q1–Q5c, **then** the build fails. It is a gate, not a review note. | 2 |
| Q9 | **Given** no bundled font is present at runtime, **then** the app does not silently fall back to the system font for Vietnamese text. | 1 |
| Q10 | **Given** the bundled tile font, **then** a human has rendered its lowercase `a` and `g` at 116 pt, looked at them, and committed the image to the repo as the record. **This is a human check and is marked as one**; it cannot be automated, because single- and double-storey `a` have the same contour and counter counts and any "automated" version would be a proxy dressed as a measurement. *(Recorded state today: Baloo 2's `g` is single-storey; its `a` is **double**-storey, contrary to revision 1's claim. See `ui.md` §6.0.1 and `open-questions-ui.md` Q5.)* | 5 |
| Q10a | **Given** the bundled tile font file, **then** its SHA-256 equals the hash recorded in `ui.md` §6.2 — `241b89a4…d532ce` for `Baloo2-SemiBold.ttf`. A changed hash re-opens Q10. **This is the automated half, and it is the one that actually protects the property.** | 2 |

## R · Language isolation

| # | Given / When / Then | Tier |
|---|---|---|
| R1 | **Given** a Vietnamese session, **when** every screen is captured, **then** no English word, tile, letter-sound clip or asset appears on any of them. | 3 |
| R2 | **Given** an English session, **then** no Vietnamese word, tile, diacritic, onset clip or tone name appears anywhere. | 3 |
| R3 | **Given** the whole app, **then** the **first-launch chooser is the only screen showing both languages** — the single exemption. | 3 |
| R4 | **Given** the source, **then** no code path reads the other language's pack, and there is no fallback, default or coalescing operator onto it. | 1 |
| R5 | **Given** a word missing an asset, **then** it is **withheld from the tree**, never substituted from the other pack. | 1 |
| R6 | **Given** a language switch, **then** every audio handle from the previous language is released before any new one is opened. | 1 |
| R7 | **Given** the parent surfaces, **then** they are rendered entirely in the app's chosen language. | 3 |
| R8 | **Given** a word entry, **when** it is inspected, **then** it contains **no field naming or referencing the other language's word**. | 2 |
| R9 | **Given** a fuzzed pack where a Vietnamese entry carries an English field, **then** the validator rejects that entry and the app still runs. | 2 |
| R10 | **Given** the announcement motif and the cheer, **then** they are the **only** audio assets shared across modes, and they contain no speech in either language. *(The motif is language-free by construction; the cheer is recorded per pack and therefore per language.)* | 2 |

## S · Colour, theme and contrast

| # | Given / When / Then | Tier |
|---|---|---|
| S1 | **Given** `node tools/theme-contrast.mjs`, **when** it is run, **then** it exits 0 across all three themes. | 2 |
| S2 | **Given** the sweep, **when** any `role*` hex is changed to a near-ground pastel, **then** it exits **1** naming that pair. *(Never trust a green check you have not seen fail.)* | 2 |
| S3 | **Given** the source, **when** it is audited, **then** **no component contains a colour literal**. | 1 |
| S4 | **Given** any theme, **then** the **live** tile glyph contrast is ≥ 13:1 and within 0.5 of every other theme's. | 2 |
| S5 | **Given** any theme, **then** onset is `role1`/solid, rime is `role2`/split, tone is `role3`/dotted. The slot→meaning mapping is identical in all three. | 3 |
| S6 | **Given** any theme, **then** the three role hues are pairwise ΔE00 ≥ 25 to a normal-sighted observer. | 2 |
| S7 | **Given** any theme, **then** the **disabled** tile glyph measures ≥ 4.5:1 against the ground. | 2 |
| S8 | **Given** the app rendered in greyscale, **then** every role remains identifiable by bar pattern alone, **and live remains distinguishable from disabled**. | 3 |
| S9 | **Given** any theme, **then** the ground is light and no dark-theme surface is rendered. | 3 |
| S10 | **Given** the chant highlight, **then** the **cell's face** takes `reward` and the **glyph stays `ink`**, measuring ≥ 4.5:1. A gold glyph on a white face (1.60–2.05:1) must not appear anywhere. | 2 |
| S11 | **Given** the emitted token set, **then** it is byte-identical to `src/theme/tokens.json`. | 2 |

## T · What a toddler actually does

| # | Given / When / Then | Tier |
|---|---|---|
| T1 | **Given** six tiles tapped within 400 ms, **then** the engine records six actions in order, the board is consistent, and no symbol is lost or duplicated. | 1 |
| T2 | **Given** six tiles tapped within 400 ms where some are disabled, **then** only the live ones seat, in order, and each disabled one plays its clip. | 1 |
| T3 | **Given** a tile is tapped and then the same strip cell tapped within 120 ms, **then** it is seated and then lifted, ending in the table, with both sounds played. | 3 |
| T4 | **Given** a tile held for 30 s, **then** N6 holds and the app remains responsive throughout. | 3 |
| T5 | **Given** two fingers land on two tiles simultaneously, **then** exactly one symbol is seated and exactly one sound plays. | 3 |
| T6 | **Given** a finger dragged across the whole table without lifting, **then** **no** symbol is seated and at most one sound plays. | 3 |
| T7 | **Given** a touch that starts on a tile and ends off-screen, **then** nothing is seated and no state is corrupted. | 3 |
| T8 | **Given** the app is backgrounded mid-chant, **when** it returns, **then** audio has stopped, the chant does not resume mid-word, and the board is in the pre-chant state or fully revealed — never half-merged. | 3 |
| T9 | **Given** an incoming call during the reveal, **when** it ends, **then** the app is on a valid screen and the reveal is either held or exited, never blank. | 5 |
| T10 | **Given** the device is locked and unlocked mid-build, **then** the strip and the live set are unchanged and the idle ladder resumes. | 3 |
| T11 | **Given** 200 random taps at random screen coordinates over 60 s, **then** the app does not crash, does not leave the game, and does not reach the parent menu. | 3 |
| T12 | **Given** the gate dot is tapped 50 times rapidly, **then** the gate does not open. | 3 |
| T13 | **Given** the reveal is tapped 30 times, **then** the word replays each time, the photograph advances each time, there is no audio pile-up, and the board returns 3000 ms after the last tap. | 3 |
| T14 | **Given** the device is rotated repeatedly during a chant on a tablet, **then** no audio restarts and no symbol is lost. | 3 |
| T15 | **Given** the app is force-killed mid-build, **when** relaunched, **then** it opens on an empty strip with the stage, the album and the shelf intact. No corrupt board is restored. | 2 |
| T16 | **Given** system volume at zero, **then** the game remains playable — the table still stands and lies, and the idle ladder still fires. | 3 |
| T17 | **Given** he taps the same live tile, undoes it, and repeats 50 times, **then** no state leaks: the live set, the strip and the audio channel are identical to the start. | 1 |
| T18 | **Given** he discovers the same word 20 times in a row, **then** the announcement fires 20 times, the photograph advances each time, the shelf fills exactly once, and the album holds exactly one card for it. | 3 |
| T19 | **Given** an hour of continuous play, **then** memory does not grow without bound and no audio handle is leaked. | 5 |
| T20 | **Given** the strip is tapped repeatedly while empty, **then** nothing happens and no sound plays. | 3 |

## U · The things only a child can tell us (Tier 5)

Not automatable. Listed because only Tier 5 proves the product, and because the most likely way
this app fails is that it is **boring**, which no harness detects.

| # | Question | How we would know |
|---|---|---|
| U1 | Does he make his first word in under 30 seconds, with nobody telling him what to do? | watch him. This is the single biggest risk the correction introduced: revision 1 told him what to build. |
| U2 | Does he understand that flat tiles are not broken? | does he keep tapping them, or does he stop tapping altogether |
| U3 | Does he play for five minutes without being asked to? | watch him |
| U4 | Is the announcement *fun*? Does he smile, or does he wait it out? | the twentieth time is the real test, not the first |
| U5 | Does he hum the motif? | he will, or he will not, and that is the whole question about "catchy" |
| U6 | Are 72 pt tiles big enough for his aim on the smallest device in the house? | count taps that land on the wrong cell |
| U7 | Does a 24-cell table overwhelm him, or does he treat it as a keyboard? | watch whether he scans it or dives at one letter |
| U8 | Does he discover undo by himself? | does he ever tap the strip without being shown |
| U9 | Is the "kuh, cat" clip intelligible to him? | he repeats it |
| U10 | Does the idle ladder taking a turn read as friendly or as the app taking over? | watch what he does at 80 s |
| U11 | Does his mother find the editor without being shown it twice? | hand her the phone and say nothing |
| U12 | Does she understand from the preview that the picture is the prize, not the clue? | ask her what the picture is for, after she has added one word |
| U13 | Can she add a word in under three minutes, three months after the last time? | ask her in three months |
| U14 | Does he go back to the album by himself? | watch whether he taps the shelf |

---

## W · Withdrawn criteria — revision 1 ids that are retired

**These ids are never reassigned.** A test citing one should be deleted, not repointed. Each
was correct for revision 1's mechanic and has no meaning under revision 2.

| Old id | Was | Withdrawn because |
|---|---|---|
| B1 (r1) | the round opens with a veiled prompt photograph under a 0.16 veil | there is no prompt photograph. **B1 (r2) is a different criterion with the same id** — it now asserts that the board has no picture at all, which is the exact inverse. A test citing B1 must be rewritten, not repointed. |
| B2 (r1) | N unlit frame segments | the frame is deleted |
| B3, B4 (r1) | the palette contains the target's tiles plus distractors, capped at 6/8 | there is no per-target palette. Replaced by B2–B4 (r2) and C17 |
| B5, B6 (r1) | tap / hold the picture frame | replaced by M2 (hold the strip). There is no frame |
| B8 (r1) | the next round begins automatically | there are no rounds |
| B11 (r1) | ≥50% of rounds have an alternate real word | there are no rounds and no generator. Every path is a real word |
| C1–C5, C8, C9, C10 (r1) | palette-band behaviours | re-specified as table behaviours under the same ids, because the observable behaviour maps one-to-one |
| D2, D3 (r1) | leftmost-empty and leftmost-replace slot rules | the strip grows rightwards; there is no fixed slot count to overflow |
| D13 (r1) | a stage-1 `cat` round offers `hat`/`bat`/`rat` distractors | there are no distractors |
| **E1–E9 (r1)** | segment lights, veil steps, the **found-word win**, the **not-a-word settle**, the rock, the read-back, the self-tidy | **none of these states can be reached.** The whole group is replaced by §E (live, disabled, undo) |
| **F2 (r1)** | "at 180 ms the reveal cross-fades to a **different** image of the same word" | **the ruling the tester asked for.** Its premise was a veiled prompt the reveal had to differ from. There is no prompt, so there is nothing to differ from, and the B9/F2 contradiction at *n*=2 dissolves. B9 survives, restated as `images[k mod n]`, and B11 pins the two-image case |
| F1, F3–F8 (r1) | reveal timings measured from a frame going full-bleed | re-specified in §F against the new sequence |
| G2–G5 (r1) | the ladder points at **the correct tile** | there is no correct tile. Replaced by G2–G5 (r2) |
| G10 (r1) | three auto-places reinsert the word into the queue | there is no queue |
| H1, H2 (r1) | the five-dot page rail | replaced by the shelf, H5–H8 |
| H3–H7 (r1) | the album page after five rounds | replaced by H7–H12, and the album is now a growing collection |
| H12 (r1) | no word repeats within a page | he may repeat any word as often as he likes; T18 covers it |
| M1, M2, M3, M4 (r1) | the caption strip's three states and the cover-it check | the caption strip is deleted from the board (`ui.md` §2.1, correction U4) |
| N11 (r1) | clips preloaded during the previous celebration | there is no previous celebration to hide in; replaced by N11 (r2) |
| O7 (r1) | the not-a-word plate rock, ±4 pt over 520 ms | that state cannot be reached |
| P5, P6 (r1) | frame and palette dimensions per device | replaced by P5, P6 (r2) against the table law |
| S4 (r1 wording) | "the tile glyph" | split into S4 (live) and S7 (disabled) |
| T2, T12, T14 (r1) | double-tap, reveal-tap and force-kill behaviours phrased in rounds | re-specified as T3, T13, T15 |
| U1–U10 (r1) | the Tier-5 questions | re-specified; six are new, and U1 is now a genuinely harder question than it was |
