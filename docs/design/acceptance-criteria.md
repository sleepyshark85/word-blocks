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

~~**Count: 269 numbered criteria in §A–§T, 14 Tier-5 questions in §U, and 24 withdrawn groups
in §W.**~~ *(revision 2's count; see §0A for revision 3's)*

---

## 0B. REVISION 4 — the owner named his device and proposed paging

**2026-09-23.** `gameplay.md` §0B has his words. Paging **removes** revision 3's compromise
rather than trading against it, so most of what changes here is a relaxation: criteria that
asserted a truncated board now assert a complete one.

- **New group §V · Paging.** The page plan, the rail, auto-advance and cross-page liveness.
  A new group rather than additions to §B, because paging is a distinct surface a tester can
  exercise on its own, and because it does not exist at all on a tablet.
- **§W4** lists what revision 3 ids became. The dangerous ones are again the **restated**
  ones — C21, C22, K11, K12, K14, P4, P5, P6 all still compile and now mean something else.
- **§8.1's rule closes the `q` question**: every character in `inventoryOrder` is drawn
  always; one with no words behind it is permanently flat and still speaks. D1a and D12 carry
  it, and **S14** makes "the validator must not call that an error" testable.

**Count: 351 numbered criteria in §A–§V (316 in §A–§T, 35 in §V; no duplicate ids), 25 Tier-5
questions in §U, 24 withdrawn revision-1 groups in §W, 28 revision-2 ids in §W3 and 11
revision-3 ids in §W4.**

---

## 0A. REVISION 3 — the owner played it, and four things changed

**2026-09-23.** `gameplay.md` §0A has the four findings verbatim; `ui.md` §0A has what they
did to the UI. This section is the id policy for the criteria.

- **Group letters are stable, again.** §B is still the board, §F is still the payoff, §N is
  still audio. Most of §A, §G, §H (except the stage rows), §I, §J, §L, §M, §O, §P, §Q, §S and
  §T are untouched.
- **Every id revision 3 retires is listed in §W3 with the reason**, and **ids are never
  reassigned across revisions**. A test citing one should be deleted, not repointed.
- **Ids revision 3 *changes in place*** — same id, same subject, different assertion — are
  listed in §W3 too, marked **RESTATED**, because those are the dangerous ones: a test citing
  them will still compile and will now be testing the wrong thing.

~~**Count: 314 numbered criteria in §A–§T, 20 Tier-5 questions in §U…**~~ *(revision 3's
count; see §0B for revision 4's)*

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
| A9 | **Given** parent menu → **Language (row 2)**, **when** the other language is tapped **once**, **then** the language switches immediately — no second confirm — the game unmounts, the pack reloads, the prefix tree rebuilds, and the board of the new language is shown. *(RESTATED: revision 2 required a two-touch confirm here.)* | 3 |
| A12 | **Given** the parent menu, **then** **Language is the second row**, directly under *Add a word*, and opens the same chooser screen the first launch shows. | 3 |
| A13 | **Given** a correct gate answer, **when** the gate dot is held again within **180 s**, **then** the parent menu opens **without** a multiplication; **when** it is held after 180 s, **then** the multiplication is asked. | 3 |
| A14 | **Given** an open gate grace, **when** the board is returned to or the app is backgrounded, **then** the grace **ends immediately** and the next hold asks the multiplication. | 3 |
| A15 | **Given** a language switch, **then** all audio stops **within 120 ms** — a hard stop, **not** the 800 ms *Finish session* fade — and no clip of the previous language is audible after the new board appears. | 3 |
| A16 | **Given** a partly assembled word, **when** the language is switched, **then** the strip is empty on the new board and nothing is restored. | 3 |
| A17 | **Given** a running chant or a held reveal, **when** the language is switched, **then** it is abandoned, no picture flies to the shelf, and the new board is shown with an empty strip and an empty shelf. | 3 |
| A18 | **Given** words discovered in Vietnamese, **when** the language is switched to English and back, **then** the Vietnamese album is unchanged, including each word's encounter count (so B9 resumes where it left off). | 2 |
| A19 | **Given** a language switch, **then** the shelf is empty on the new board, and the theme is unchanged. | 3 |
| A20 | **Given** a language switch, **then** the new language is persisted immediately; **when** the app is force-killed and relaunched, **then** it opens in the new language. | 2 |
| A10 | **Given** a language switch has completed, **when** memory is inspected, **then** no board component, tile, clip handle or tree node from the previous language is retained. | 1 |
| A11 | **Given** a viewport that serves fewer than 20 table cells (`ui.md` §4.3 F7), **when** the app opens, **then** the screen-too-small card is shown and no board is mounted. | 4 |

## B · The board, the table, and the live set

| # | Given / When / Then | Tier |
|---|---|---|
| B1 | **Given** the board is shown, **then** it contains exactly three things: the top bar, the word strip and the character table. **No picture, no picture frame, no veil, no caption strip.** | 3 |
| B2 | **Given** the board is shown, **then** the table contains, in one fixed row-major sequence, a **prefix of each run** of the pack's `inventoryOrder` — Vietnamese `[onsets][rimes][tones]`, English `[letters][digraphs]` — sized by the device's cell budget and, for Vietnamese, the allocation in `ui.md` §7.1. *(RESTATED: revision 2 sized it by a stage of 8/12/16/20/24 and held one run at a time.)* | 1 |
| B2a | **Given** any two moments in any session, **then** **every character is in the same cell**. The table's contents and cell assignment are a pure function of the pack's `inventoryOrder` and the device's cell budget, and of nothing else — not the strip, not the position, not the word list, not the session, not a random source. | 1 |
| B2b | **Given** a Vietnamese board, **then** all three runs — onsets, rimes and tones — are on screen **simultaneously**, at every position, from the first launch. *(This is the exact inverse of revision 2's C16, which is withdrawn.)* | 3 |
| B2c | **Given** any sequence of taps, **then** **no character ever changes cell, size, bar pattern or role.** The only per-tap change to the table is which tiles are live, plus the tone-carrier swap of B2d. | 3 |
| B2d | **Given** a Vietnamese board with no rime placed, **then** each of the six tone cells shows its **bare mark on a dotted circle** (`ngang` an empty circle) and **every one of them is disabled**; **given** a rime is placed, **then** each tone cell shows **that rime with its mark applied** and the completing, legal ones are live. | 3 |
| B2e | **Given** the bare-mark form of a tone cell, **then** it is rendered in **`ink`**, not `inkSoft`, and measures ≥ 4.5:1 against the ground in every theme. | 2 |
| B2f | **Given** the board, **then** there is **no `∅` tile, no empty socket and no placeholder character** anywhere in the table. | 3 |
| B2g | **Given** an empty strip in Vietnamese, **then** the live set is every **onset** that begins a word **plus** every **rime** that begins a zero-onset word, so `áo` is started by tapping `ao`. | 1 |
| B2h | **Given** the board, **then** the table does **not scroll**, has no scroll affordance, and every character it holds is on screen at once. | 4 |
| B2i | **Given** a run boundary in the table, **then** it is marked by **no line, box, tint or label** — only by the tile's bar pattern changing (solid → split → dotted). | 3 |
| B3 | **Given** any prefix, **then** a table symbol is **live** iff the eligible word set contains at least one word beginning with `prefix + symbol`, and **disabled** otherwise. | 1 |
| B4 | **Given** an empty strip, **then** the live set is exactly the symbols that **begin** some eligible word, and every other symbol on the table is disabled. | 1 |
| B5 | **Given** any sequence of taps on **live** symbols only, **then** the resulting prefix always has at least one completion in the eligible word set. Garbage is unreachable. | 1 |
| B6 | **Given** any reachable state, **then** either the strip's contents are a word, or at least one table symbol is live, or both. There is no third case. | 1 |
| B7 | **Given** the same device, **when** the app is relaunched, **then** every character is in the same cell as before. | 1 |
| B8 | **Given** a tap that changes the live set, **then** the table's tile **size and cell positions do not change** — only the live/disabled rendering of each cell, and the tone carriers (B2d). | 4 |
| B9 | **Given** the *k*-th encounter of a word with *n* images (`k` from 0), **then** the reveal shows `images[k mod n]`. | 1 |
| B10 | **Given** a word with exactly 1 image, **when** it is discovered repeatedly, **then** that image is shown every time and nothing errors. | 3 |
| B11 | **Given** a word with exactly 2 images, **when** it is discovered three times, **then** the reveals show `images[0]`, `images[1]`, `images[0]`. *(This is the case the old B9/F2 pair could not satisfy — see §W.)* | 1 |
| B12 | **Given** the same seed and the same sequence of taps, **when** the engine is replayed, **then** the identical sequence of tables, live sets, words and images is produced. | 1 |
| B13 | **Given** the whole table, **then** every symbol it contains is fully visible on screen. **Nothing scrolls and nothing is clipped.** | 4 |
| B14 | **Given** a word withheld for a missing asset, **then** it is absent from the prefix tree, so no live symbol ever leads to it. | 1 |
| B15 | **Given** the board, **then** the only non-play control on it is the 32 pt gate dot. | 3 |

## C · Vietnamese assembly

**Rewritten in revision 3.** The table no longer morphs and the strip no longer has a tone
cell; C2, C3, C4, C5, C10, C11 and C16 are withdrawn or restated — see §W3.

| # | Given / When / Then | Tier |
|---|---|---|
| C1 | **Given** a Vietnamese board with an empty strip, **then** the table shows **all three runs at once** — onsets, then rimes, then tones — and the strip shows **one dashed cell**. *(RESTATED: revision 2 showed the onset table and a three-cell strip.)* | 3 |
| C4 | **Given** a live onset is tapped, **then** it seats in the strip's first cell, a new dashed cell appears to its right, and **the table's cell contents do not change** — only which tiles are standing. | 3 |
| C5 | **Given** an onset is placed, **when** a live rime is tapped, **then** it seats to the right of the onset, the six tone cells swap their carrier to that rime (B2d) within 160 ms, and the dashed cell remains because a tone is still needed. | 3 |
| C6 | **Given** a rime is placed, **then** each of the six tone cells renders **that rime with that tone's mark applied** (`eo èo éo ẻo ẽo ẹo`), never a bare diacritic. *(Unchanged in substance — `literacy-vi.md` §5.4 holds at the moment he is choosing.)* | 3 |
| C7 | **Given** a rime ending in `p`, `t`, `c` or `ch`, **when** its tone carriers are shown, **then** **all six cells are still present**, the illegal four are **disabled**, and each shows the marked form from the rime's `toned` map, falling back to the bare mark where that is `null`. *(RESTATED: revision 2 rendered only the two legal cells. Legality and completability are now both flatness — `ui.md` §7.2 states what that costs.)* | 1 |
| C8 | **Given** `ngang` completes a word, **then** it is a live tile he presses, and the strip shows the unmarked form. `ngang` is never implicit. | 1 |
| C9 | **Given** any (onset, rime) with exactly one completing tone, **then** that tone tile is live, the other five are disabled, and **the word is not auto-committed**. He taps it. | 1 |
| C10 | **Given** a seated rime, **when** it is tapped in the strip, **then** it and any tone return, and the six tone cells revert to **bare marks**. | 3 |
| C11 | **Given** a seated onset, **when** it is tapped in the strip, **then** the onset, rime and tone all return and the strip is empty. | 3 |
| C12 | **Given** a Vietnamese word forms, **then** the chant plays five beats — `onset name · rime name · **toneless blend** · tone name · whole word` — with beat 4 omitted for `ngang` and beat 1 omitted for a zero onset. | 3 |
| C12a | **Given** the chant, **then** what is **shown** accumulates: beat 1 `b`, beat 2 `b` `o`, beat 3 `bo` (merged), beat 4 `bò` (marked), beat 5 `bò` held. **At no beat is anything on screen that is not part of the word** — in particular **the tone's name is never rendered**. | 3 |
| C12b | **Given** chant beat 3, **then** the clip played is the word's **`audio.blend`**, and the strip's dividers dissolve and the glyphs slide together on that same beat. | 3 |
| C12c | **Given** any chant beat, **then** it begins **after the previous clip has ended**, plus that beat's gap from `pack.chant.gapsMs`, with ≤ 30 ms drift. Two chant clips are never audible at once. | 3 |
| C12d | **Given** `pack.chant.gapsMs` is edited, **then** the chant's timing changes accordingly with no code change. | 2 |
| C14 | **Given** chant beat 4, **then** the mark animates down onto **the already-merged word** (M12), not onto a separate tile or cell. | 3 |
| C15 | **Given** a Vietnamese board, **then** onset tiles carry a **solid** bar in `role1`, rime tiles a **split** bar in `role2`, tone tiles a **dotted** bar in `role3`, and the three runs are contiguous and in that order. | 3 |
| C17 | **Given** any prefix, **then** the table never has both of `{c,k}`, `{g,gh}`, `{ng,ngh}` **live** at the same time, and no dialect homophone pair for the pack's `dialect` is live together (`literacy-vi.md` §6.1). *(They are all always **present**; this is about liveness.)* | 1 |
| C18 | **Given** the table contains `ngh` and the current tree has no `ngh` word, **then** `ngh` is rendered, disabled, and speaks its đánh vần name when tapped. | 3 |
| C19 | **Given** a zero-onset word such as `áo`, **then** it is built in **two taps** — the rime, then the tone — and the strip never shows an empty leading cell. | 3 |
| C20 | **Given** a completed Vietnamese word, **then** the strip shows **one merged word with the mark applied**, no dashed cell, and a 5 pt **dotted `role3`** segment under the rime recording that a tone was chosen. | 3 |
| C21 | **Given** any served device, **then** **every onset, every rime and every tone in the pack is on the board** — across pages if need be. No run is truncated and `zonesFor()` does not exist. *(RESTATED — revision 3 required the opposite: a 0.48 split of a truncated board. §W4.)* | 1 |
| C22 | **Given** his mother adds or edits a word or a rime, **then** **no character changes page or cell.** The page plan depends only on the run lengths and the device, never on the word list. | 1 |

## D · English assembly

| # | Given / When / Then | Tier |
|---|---|---|
| D1 | **Given** an English board with an empty strip, **then** the table shows **the alphabet, `a`–`z`, in alphabetical order**, followed by digraphs as far as the device's cell budget reaches, and the strip shows **one dashed cell**. | 3 |
| D1a | **Given** an English board on **any** served device, **then** **all 26 letters are on the board**, `a`–`z`, including `q` — on page 1 where a page holds 26, across pages otherwise. | 2 |
| D1b | **Given** `q`, which no pack word uses, **then** it is rendered in its slot at full glyph opacity, is **permanently flat in every state**, and **plays its sound when pressed**. It is never hidden, never removed, and never an error. | 3 |
| D2 | **Given** a live tile is tapped, **then** it seats in the next empty strip cell and **a new empty cell appears to its right**. | 3 |
| D3 | **Given** any English strip state, **then** the number of cells shown is the number of symbols placed plus one. **The target length is never shown.** | 3 |
| D4 | **Given** a seated tile, **when** its strip cell is tapped, **then** that tile **and every tile after it** returns to the table. | 3 |
| D5 | **Given** any English board, **then** vowel tiles carry a **split** bar in `role2` and consonant tiles a **solid** bar in `role1`, and the two are distinguishable with the screen desaturated. | 3 |
| D6 | **Given** any English board, **then** **no tile carries `role3`**. | 3 |
| D7 | **Given** any tile is touched, live or flat, first time or five-hundredth, **then** its **`short`** clip plays. *(RESTATED — this is the inverse of revision 2's D7. The `long` anchored clip is **never** fired by a tile tap; see N14. `ui.md` §11.0 is why.)* | 3 |
| D8 | **Given** a full session of play, **then** **no `long` clip is ever played by a tile tap**, in either language. | 3 |
| D9 | **Given** the word strip is held for 800 ms in English, **then** the **`long`** anchored clips are what the parts hint speaks — the only place in the app they are heard. | 3 |
| D10 | **Given** an English word forms, **then** the chant uses `short` clips left to right, then the whole word — never the `long` anchored form. | 3 |
| D11 | **Given** any prefix, **then** `c` and `k` are never both live. | 1 |
| D12 | **Given** an empty strip, **then** `ck`, `ll`, `ss`, `ff`, `zz`, `ng`, `x` and `q` are **present on the board and disabled**, because no pack word begins with them. This is B4 doing `literacy-en.md` §3.3's job for free. | 1 |
| D13 | **Given** the prefix `c` `a`, **then** the live set is exactly the letters that complete a pack word (`n`, `p`, `t` in `en-seed`), and every other letter on the table is disabled. | 1 |
| D14 | **Given** a digraph tile is on the table, **then** it renders as one tile with its two letters, shrunk to 82% of the tile width, never below 24 pt. *(RESTATED: there are no stages.)* | 4 |

## E · Live, disabled, and undo

| # | Given / When / Then | Tier |
|---|---|---|
| E1 | **Given** a **live** tile is tapped, **then** its sound plays, it flies to the strip over 260 ms, a 90 ms seat click plays, and the table restands within 200 ms. | 3 |
| E2 | **Given** a **disabled** tile is tapped, **then** a 40 ms muted knock plays at −9 dB **within 60 ms**, **then its own `short` clip plays in full starting at +120 ms** — the two do **not** overlap — the tile dips 2 pt and returns over 120 ms, and **nothing else changes**: no seat, no strip change, no table change. *(RESTATED: revision 2 played the clip and the knock together. `ui.md` §11.0.)* | 3 |
| E2a | **Given** a disabled tile is tapped, **then** the knock and the clip are on **different channels in the specified order**, and at no instant are two speech clips audible. | 5 |
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
| F5 | **Given** the word has been discovered before, **then** the motif is three notes and **chant beats 1–4 are skipped** — the whole word is spoken and the picture follows. | 3 |
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
| F19 | **Given** a word forms, **then** any speech clip still playing is **stopped** before the motif begins, and **no speech is audible under the motif**. *(RESTATED — the inverse of revision 2's F19, which required ducking to −18 dB. Ducked speech under music is two voices by specification; `ui.md` §11.0 item 2.)* | 5 |

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
| G10 | **Given** an auto-play occurred, **then** **nothing is recorded about it** — there is no assist counter, because there is no stage for it to hold back (`gameplay.md` §3.6). *(RESTATED — revision 2 required the opposite: that it be recorded.)* | 1 |
| G11 | **Given** the tile the ladder chooses, **then** it is drawn by the seeded RNG from the **live** set, preferring a symbol whose subtree holds an undiscovered word — and the same seed and history choose the same tile. | 1 |
| G12 | **Given** an auto-play completes a word, **then** the full announcement runs exactly as if he had tapped it. Nothing in the child's UI says the app did it. | 3 |

## H · Stage, shelf, album, ending

| # | Given / When / Then | Tier |
|---|---|---|
| H1 | **Given** any amount of play, **then** the table's size **never changes**. It is `min(pack inventory, device cell budget)` from the first launch. *(RESTATED — the inverse of revision 2's H1, which grew it in five stages.)* | 4 |
| H2 | **Given** the whole app, **then** there is **no stage, level, unlock, badge, star, streak or progress number of any kind**, in any screen, child-facing or parent-facing. | 3 |
| H3 | **Given** the source, **then** there is no `globalStage`, no stage-advancement rule and no assist counter. | 1 |
| H4 | **Given** any sequence of play, **then** the only thing that accumulates is the **album**, and it never shrinks. | 1 |
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
| K10 | **Given** a linguistically valid word whose character is **not on this device's board** — either absent from `inventoryOrder` or beyond the prefix this device holds — **then** the editor says so in one sentence, draws that character as a flat tile, and offers **Move it onto the board**. | 3 |
| K11 | **Given** she taps **Add it to the alphabet**, **then** the character is **appended to the end of its run** in `inventoryOrder`, the word becomes playable **on every device**, **no character already in that run changes page or slot**, and the change survives a restart. *(RESTATED again — revision 3 promoted it into a truncated prefix. There is no prefix now, and append is the operation that cannot disturb a slot he has learned.)* | 2 |
| K11a | **Given** any device, **then** the editor **never offers a swap and never says the board is full**, because paging means it cannot be. *(RESTATED — the inverse of revision 3's K11a.)* | 3 |
| K12 | **Given** a character that **is** in `inventoryOrder`, **then** the not-on-the-board screen is **never shown for it** on any device — it is on a page, and that is enough. | 3 |
| K13 | **Given** a symbol is retired from the board, **then** **no word is deleted** — the affected words move to *not yet playable* with a one-line reason, and return unchanged if the symbol is put back. | 2 |
| K14 | **Given** the not-on-the-board screen, **then** it names the character, draws it as a flat tile, and offers one tap to add it. **It states no cell count and no device limit**, because there is none. | 3 |

## L · Editor — delete and recovery

| # | Given / When / Then | Tier |
|---|---|---|
| L1 | **Given** a word row, **when** delete is chosen, **then** a confirmation shows **the word and its picture**. | 3 |
| L2 | **Given** a deletion, **then** a 6-second Undo toast is shown and undoing restores the word exactly. | 3 |
| L3 | **Given** a deletion older than the toast, **then** the word is in **Recently deleted** and restorable for 30 days. | 3 |
| L4 | **Given** a seed word is deleted, **then** the prefix tree is rebuilt without it and no live symbol leads to it. | 2 |
| L5 | **Given** the app is killed mid-delete, **then** on relaunch the word is either fully present or fully in Recently deleted — never half-written. | 2 |
| L6 | **Given** every word has been deleted, **then** the game shows a parent-facing empty-state card, not a crash and not a table with nothing live. | 2 |
| L7 | **Given** a deletion leaves a character with no words behind it, **then** that character stays on its page, in its cell, permanently flat, and still speaks when pressed. **The board never reshuffles in response to the word list** (`ui.md` §8.1). | 1 |

## M · Co-play, and playing with the screen ignored

| # | Given / When / Then | Tier |
|---|---|---|
| M1 | **Given** the board, **then** the assembled word is legible from across a room: `stripFont ≥ 34 pt`. | 4 |
| M2 | **Given** the word strip is **held for 800 ms**, **then** the *parts of what is currently assembled* are spoken — in English the **`long` anchored clips** (N14) — and no completion, suggestion or whole word is spoken. | 3 |
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
| N3 | **Given** a speech clip is playing, **when** any new speech clip is requested, **then** the first is **stopped synchronously before the second starts** — `pause()` then `seekTo(0)` on the outgoing player, then `play()` on the incoming one, in the same call. No fade, no crossfade, no duck, no queue. | 3 |
| N3a | **Given** the app in any state, **then** **at most one speech player is un-paused at any instant.** Tile clips, every chant beat, the blend, the tone name, the whole word, the reveal repeat and the parts hint all share one channel. | 1 |
| N3b | **Given** a speech clip is playing, **when** a knock, seat click, unclick, shelf bell or album phrase fires, **then** the speech clip is **not** cut, shortened or ducked. Only a new speech clip or the motif cuts speech. | 3 |
| N3c | **Given** the UI channel's assets, **then** **none of them contains a voice.** The per-pack cheer is the single exception and it is on the motif channel. | 2 |
| N3d | **Given** a newest speech request, **then** it is **never dropped in favour of the clip already playing**. The newest tap always wins. | 1 |
| N4 | **Given** six tiles touched within 4 s, **then** six distinct clips are heard, each cut by the next, and nothing is still playing 1 s after the last touch. | 5 |
| N5 | **Given** a tile is held past 600 ms, **then** its short clip repeats every 700 ms, **at most 6 times**, then stops. | 3 |
| N6 | **Given** a tile is held for 30 s, **then** the audio has stopped, the tile shows a pressed breathing state, and on release **nothing is placed**. | 3 |
| N7 | **Given** touch-down and touch-up more than 600 ms apart, or more than 24 pt apart, **then** no symbol is placed. | 3 |
| N8 | **Given** the announcement or the chant is playing, **then** tile taps do not interrupt it and tiles are not tappable, so no tap can cut a chant beat. | 3 |
| N9 | **Given** the device ringer switch is set to silent, **then** the game still speaks. | 5 |
| N10 | **Given** parent menu → mute, **then** all game audio is silenced and the game remains playable — the table still stands and lies, and the idle ladder still fires. | 3 |
| N11 | **Given** the pack is loaded, **then** every clip the constant table can produce is decoded and resident before the first tap is possible. *(RESTATED: there is no morph to hide a load in, and there does not need to be — the table never changes.)* | 1 |
| N14 | **Given** any tile tap in either language, **then** the clip played is the tile's **`short`** clip. The **`long`** clip is played **only** by the parts hint (M2) and the editor preview. | 1 |
| N15 | **Given** the shipped packs, **when** each tile's `short` clip is measured, **then** it is **≤ 700 ms** of audio with ≤ 40 ms of leading silence and ≤ 120 ms of tail. *(**PARTIAL, 2026-09-23, content-engineer.** The cause was ~1.6 s of engine padding on every clip; `tools/audio-trim.mjs` cut it losslessly and `en-seed` `short` is now **576–1392 ms, median 768** — 11 of 35 meet 700 ms, 24 do not. What remains is the sound itself, and the only levers are the TTS **rate** and the **text**, both of which are the owner's and the literacy-designer's. Lead is 45–70 ms, not ≤ 40: a lossless MP3 frame cut needs priming frames to carry Layer III's bit-reservoir history, and they are silence. Enforced from now on by `pack-validate.mjs` against the bytes — `content-pipeline.md` §9.3a–c.)* | 2 |
| N16 | **Given** six tiles touched in 400 ms, **then** six clip **onsets** are audible and each is intelligible as a letter sound. *(Tier 5, and only the owner can judge it — `ui.md` §11.0's closing caveat.)* | 5 |
| N12 | **Given** both languages, **then** each tile has a `long` and a `short` clip slot, even where they are identical. | 2 |
| N13 | **Given** the whole app, **then** there is **no ∅ tile** and no non-speech *open* sound. *(RESTATED — the inverse of revision 2's N13, which specified that sound. §W3.)* | 3 |

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
| O12 | **Given** a tone cell swaps its carrier (M7), **then** it is a **160 ms opacity cross-fade with no translation**, the cell does not move or resize, its bar does not change, and **nothing else on the board animates**. | 3 |
| O13 | **Given** chant beat 3, **then** the merge (M10) animates only `transform` and `opacity` and the dividers dissolve by opacity, per O1. | 1 |
| O11 | **Given** reduce-motion, **then** M6 is a cross-fade with **no stagger and no translation**, and the live set is still correct at the end of it. | 3 |

## P · Layout, devices, rotation

| # | Given / When / Then | Tier |
|---|---|---|
| P1 | **Given** `node tools/layout-sweep.mjs`, **when** it is run, **then** it exits 0 over viewports 360–1400 × 600–1440 in steps of 4, × 8 safe-area shapes, × table sizes 1–`budget`. **Measured 2026-09-23: 30,732,958 layouts, 0 failures.** | 4 |
| P1a | **Given** the sweep, **when** `maxCells` is made to overclaim by one (`cells <= budget + 1`), **then** it exits **1** naming **F0**. *(Never trust a green check you have not seen fail — and note the other seven rules **cannot** fail for a served size, because they also decide the budget. `ui.md` §4.3.)* | 4 |
| P2 | **Given** any served viewport, **then** `tile ≥ 72` pt/dp. | 4 |
| P3 | **Given** any served viewport, **then** the table row fits the content width with no horizontal scrolling. | 4 |
| P4 | **Given** any served viewport, **then** it holds **≥ 12 cells per page** and can build a page plan for **both** packs (F7). *(RESTATED — revision 3 asked for ≥ 20 cells and no plan.)* | 4 |
| P5 | **Given** an iPad 11" in portrait with `vi-seed`, **then** the table is the **whole 67-cell inventory at 86 pt in a 7 × 10 grid**, **with no page rail**, and nothing scrolls or pages. | 4 |
| P6 | **Given** a 360 × 640 Android phone, **then** it holds **12 cells per page** at 73 pt and plays Vietnamese across **7 pages `[9,9,8 ¦ 12,12,11 ¦ 6]`**, reaching **all 47 words**. *(RESTATED — revision 3 gave it 20 cells and 13 words.)* | 4 |
| P6a | **Given** an iPhone SE 3 (375 × 667), **then** it holds **16 cells per page** and plays Vietnamese across **6 pages**, reaching all 47 words. | 4 |
| P6b | **Given** the layout law, **then** `TOP_BAR + GAP_STRIP + PAD_BOTTOM = 56 + 12 + 12 = 80`, and `TILE_MIN` is **72**, unchanged. | 4 |
| P7 | **Given** a phone, **then** the app is locked to portrait and does not rotate. | 3 |
| P8 | **Given** a tablet, **then** both orientations are served. | 3 |
| P9 | **Given** a tablet mid-build with two symbols seated, **when** the device is rotated, **then** the same symbols are seated, the live set is unchanged, audio does not restart, and no progress is lost. | 3 |
| P10 | **Given** a tablet during the chant, **when** the device is rotated, **then** the chant continues from where it was. | 3 |
| P11 | **Given** any viewport, **then** no interactive element's hit rect overlaps another's. | 4 |
| P12 | **Given** a tablet, **then** the table is horizontally centred and no tile is within 40 pt of a screen corner. | 4 |
| P13 | **Given** any viewport, **then** the mode title is rendered in the top bar. | 3 |
| P14 | **Given** a rotation that changes the grid (e.g. an iPad's Vietnamese table from 7 × 10 to 12 × 6), **then** the **reading order of the table is unchanged** — row-major over the same fixed sequence — and the run order is unchanged. Cell positions do move, which is inherent to rotating. | 4 |
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
| R3 | **Given** the whole app, **then** the **language chooser is the only screen showing both languages** — the single exemption. It is shown at first launch **and from parent menu → Language**; it is the same screen either way. | 3 |
| R4 | **Given** the source, **then** no code path reads the other language's pack, and there is no fallback, default or coalescing operator onto it. **Unchanged by revision 3, and now exercised far more often: switching is a teardown, so there is no instant at which two packs are loaded.** | 1 |
| R5 | **Given** a word missing an asset, **then** it is **withheld from the tree**, never substituted from the other pack. | 1 |
| R6 | **Given** a language switch, **then** every audio handle from the previous language is released before any new one is opened. | 1 |
| R11 | **Given** **50 consecutive language switches**, **then** memory does not grow, no audio handle leaks, no clip of either language is ever audible on the other's board, and the app is on a valid board at the end. *(Revision 3 turns switching into a routine action; this is the leak test that matters most.)* | 3 |
| R12 | **Given** a language switch **during** a chant, a reveal, an idle auto-play or a picture-to-shelf flight, **then** the new board is shown with an empty strip and an empty shelf, and nothing from the previous language is rendered or heard at any point. | 3 |
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
| S12 | **Given** the board, **then** **no run carries a background tint.** A `roleSoft` wash behind each run measured 2.62–2.92:1 for that run's tile outline in 5 of 9 (theme × run) pairs, under the 3.0 `component` gate — `ui.md` §5.8a. The disabled tile's face is `ground`. | 2 |
| S13 | **Given** `tools/theme-contrast.mjs`, **then** it contains the **bare tone mark on the ground** as a gated `glyph` pair, measuring ≥ 4.5:1 in all three themes (measured 11.96–13.06). | 2 |
| S14 | **Given** a pack in which some character of `inventoryOrder` has **zero** words behind it (`q` in English, `ngh` in Vietnamese), **then** the validator **accepts it** — it is a normal permanent state, not an error — and the character is drawn and speaks. | 2 |
| S6 | **Given** any theme, **then** the three role hues are pairwise ΔE00 ≥ 25 to a normal-sighted observer. | 2 |
| S7 | **Given** any theme, **then** the **disabled** tile glyph measures ≥ 4.5:1 against the ground. | 2 |
| S8 | **Given** the app rendered in greyscale, **then** every role remains identifiable by bar pattern alone, **and live remains distinguishable from disabled** — on a Vietnamese board where all three runs are on screen at once and 60+ of 67 tiles are flat. | 3 |
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
| T21 | **Given** every one of the 67 tiles on a Vietnamese tablet board is tapped in turn with nothing assembled, **then** 67 clips play, each cut by the next, exactly the onsets and the two zero-onset rimes seat, and the app is in a consistent state at the end. | 3 |
| T22 | **Given** a tone tile is tapped 20 times while no rime is placed, **then** its name plays 20 times, **nothing is ever seated**, and the carrier stays a bare mark. | 3 |
| T23 | **Given** the language is switched while a tile is held down, **then** the touch is abandoned cleanly, nothing is seated on either board, and no audio handle leaks. | 3 |
| T24 | **Given** the gate grace is open and the device is handed to the child, **then** the grace ends on the return to the board and 50 rapid taps on the gate dot do not reach the parent menu. | 3 |

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
| **U7a** | **The biggest risk revision 3 introduces.** Does a **67-cell board that is 90% flat** read as a board full of letters, or as a broken board? Revision 2's third argument against showing all three runs was exactly this, and it was never refuted — only answered (`ui.md` §7.1). | watch the first thirty seconds. Does he press flat tiles happily, press one or two and stop, or not press at all? |
| **U7b** | With no stage ladder, the **first session** now shows him everything at once. Is the first word harder to reach than it was? | time his first word on a first install, against U1's 30 seconds |
| **U9a** | **Finding 3, after the fix.** With `short` clips inside the 700 ms budget and one hard-cutting speech channel, are six taps in four seconds six intelligible letter sounds? | only the owner can answer this. Nobody on this team can hear, and a duration is a proxy for intelligibility, not intelligibility |
| **U15** | Does the accumulating chant (`b` → `b o` → `bo` → `bò`) read as a word being built? Does he say the blend along with it? | watch whether he joins in at beat 3, which is the beat that teaches |
| **U16** | Does he notice that the tone cells change what they show when he places a rime, and does it bother him? | it is the one exception to "the characters never change" and it is worth confirming it is invisible to him |
| U8 | Does he discover undo by himself? | does he ever tap the strip without being shown |
| U17 | Does the owner find the language switch quick enough to actually use? | he asked for it; two gate answers in a sitting would mean the 180 s grace is too short |
| **U18** | **The question revision 4 turns on.** Does he work out that the board continues on another page — and does he work it out *from the rail standing up*, or does someone have to show him once? | hand him the phone and say nothing. Watch whether he ever presses a rail button unprompted |
| **U19** | Does the auto-advance read as *the board moved* or as *the board changed*? The whole case for paging rests on the slide saying something the morph's cross-fade did not. | watch his face at the first auto-advance, and whether he looks for the letter he just pressed |
| **U20** | Is 4 pages too many for him to hold? Is the tone page — one live tile, otherwise empty — clear, or does it look broken? | watch the third tap of a word |
| **U21** | The rail is the only way `áo` and `ong` are discoverable on a phone. Does he ever find them? | he will, or he will not — and if not, the rail is not doing its job |
| **U22** | On the tablet there is **no rail and no paging at all**. Is that board better, worse, or just different for him than the phone's? | he has both; watch which he reaches for |
| U9 | Is the "kuh, cat" clip intelligible to him? | he repeats it |
| U10 | Does the idle ladder taking a turn read as friendly or as the app taking over? | watch what he does at 80 s |
| U11 | Does his mother find the editor without being shown it twice? | hand her the phone and say nothing |
| U12 | Does she understand from the preview that the picture is the prize, not the clue? | ask her what the picture is for, after she has added one word |
| U13 | Can she add a word in under three minutes, three months after the last time? | ask her in three months |
| U14 | Does he go back to the album by himself? | watch whether he taps the shelf |

---

## V · Paging (revision 4)

**Every criterion here is vacuous on a viewport that needs no pages** — a tablet — and V1
is the criterion that says so. `tools/layout-sweep.mjs --pages` prints the expected plan for
any device under test.

| # | Given / When / Then | Tier |
|---|---|---|
| V1 | **Given** a viewport whose cell budget holds the whole pack inventory (every tablet), **then** the table is **one page**, **no page rail is rendered at all**, and no page sound ever plays. | 4 |
| V2 | **Given** a viewport that cannot hold the whole inventory, **then** the table is paged and a page rail is rendered with **exactly one button per page**. | 4 |
| V3 | **Given** an iPhone 17 Plus at **either** 430 × 932 **or** 440 × 956, **then** the plan is **4 Vietnamese pages `[26, 18, 17, 6]` and 2 English pages `[26, 10]`**, 28 cells per page, one rail row of 4 buttons. *(Both candidate logical sizes give the same plan; `ui.md` §4.4.)* | 4 |
| V4 | **Given** any paged plan, **then** **runs never share a page**: every page's characters come from exactly one run. | 1 |
| V5 | **Given** a run longer than one page, **then** it is split into `ceil(len/capacity)` **balanced** pages, earlier pages taking the remainder — 35 rimes at capacity 28 is `18, 17`, never `28, 7`. | 1 |
| V6 | **Given** the whole pack, **then** **every character appears on exactly one page**, and the sum of the page sizes equals the inventory size. Nothing is dropped and nothing is duplicated. | 1 |
| V7 | **Given** any character, **then** its **page, row and column are a pure function of the pack's `inventoryOrder` run lengths and the device** — not of the word list, the strip, the session, the current page or a random source. | 1 |
| V8 | **Given** the app is relaunched, or a word is added, edited or deleted, **then** **no character changes page or slot**. | 1 |
| V9 | **Given** a paged board, **then** **every page renders at the same tile size and column count**, computed once from the largest page, and pages are **top-aligned** so row 1 is at the same height on every page. | 4 |
| V10 | **Given** a page change, **then** the table **slides** (`translateX`), it does not cross-fade in place, and the rail's current-page marker slides with it over the same duration. | 3 |
| V11 | **Given** he taps a rail button, **then** the slide is **300 ms**; **given** the app auto-advances, **then** it is **420 ms**. The app's page change is measurably slower than his. | 3 |
| V12 | **Given** a symbol seats or is undone, **when** the current page **still has at least one live character**, **then** the page **does not change**, however many live characters are on other pages. | 1 |
| V13 | **Given** a symbol seats or is undone, **when** the current page has **zero** live characters, **then** the board slides to the **lowest-numbered page that has one**. | 1 |
| V14 | **Given** any reachable state, **then** the current page has at least one live character, **or** the app is mid-slide toward one. **The app never leaves him on a page with nothing live.** | 1 |
| V15 | **Given** he navigates to a page with nothing live **by tapping its rail button**, **then** he is allowed to stay there, every tile speaks when pressed, and the app does not yank him away. | 3 |
| V16 | **Given** a rail button whose page has ≥ 1 live character, **then** it is drawn **standing** — white face, that run's bar pattern and role colour, `ink` glyph — exactly as a live tile is. | 3 |
| V17 | **Given** a rail button whose page has none, **then** it is drawn **flat** — `ground` face, 1.5 pt dashed outline, `inkSoft` glyph — exactly as a disabled tile is, and it is **still pressable**. | 3 |
| V18 | **Given** the current page's rail button, **then** it is raised 4 pt with a **`reward` face and an `ink` glyph**, measuring ≥ 4.5:1 in every theme. | 2 |
| V19 | **Given** any rail button, **then** its glyph is **the first character of that page**, and pressing it plays **the page sound only — never a speech clip**. | 3 |
| V20 | **Given** any rail button, **then** it is at least **72 pt**, with `RAIL_GAP` 12, and no two buttons' hit rects overlap. The motor floor applies to the control. | 4 |
| V21 | **Given** any served paged viewport, **then** the rail is **fully visible**: it never scrolls, collapses or hides, and `pages ≤ railRows × railCols` with `railRows ≤ 2`. | 4 |
| V22 | **Given** a Vietnamese board with an **empty strip** on a paged device, **then** the rail shows the onset page **and** the page holding the zero-onset rimes as standing — so `áo` is discoverable. | 3 |
| V23 | **Given** a symbol in the word strip is tapped, **then** it is returned **and** the board slides to that symbol's page. Undo is also the way back. | 3 |
| V24 | **Given** a page change from any cause, **then** a **soft non-speech page sound** plays on the UI channel, identical whoever caused it, and it **does not cut any speech clip**. | 3 |
| V25 | **Given** the announcement, the chant or a held reveal is running, **then** **no auto-advance fires**. | 3 |
| V26 | **Given** 20 s idle on a paged board where live characters exist on another page, **then** the shimmer also pulses that page's rail button; **given** 40 s, **then** the breathing element is that **button** rather than an off-screen tile. | 3 |
| V27 | **Given** 80 s idle, **when** the auto-play needs a character on another page, **then** it changes page first, then plays the tile. | 3 |
| V28 | **Given** reduce-motion, **then** the page slide becomes a **cross-fade of the same duration** (300 / 420 ms), and the page sound is unchanged — it is what carries "the board moved" when direction is lost. | 3 |
| V29 | **Given** the app in any state, **then** **no swipe, drag or pan gesture changes the page**, and `react-native-gesture-handler` is still absent from the manifest. | 1 |
| V30 | **Given** a rail button is tapped 30 times rapidly, **then** the board ends on the last-tapped page, no slide is left half-finished, no residual transform remains, and no audio piles up. | 3 |
| V31 | **Given** a tile is tapped and the board auto-advances, **when** his finger is still down, **then** nothing on the new page is seated by that same touch. | 3 |
| V32 | **Given** `node tools/layout-sweep.mjs`, **then** it verifies a page plan for **both** packs at every served viewport and exits 0. **Measured 2026-09-23: 979,350 plans, 34,445,462 layouts, 0 failures, fixpoint converging in 1 step worst case.** | 4 |
| V33 | **Given** the sweep, **when** `pagePlan` is made to drop each run's remainder, **then** it exits **1** naming **F12**. *(Verified: fails at 360 × 600 with pages `8,8,8,11,11,11,6`.)* | 4 |
| V34 | **Given** the sweep, **when** the rail-wrap check in the fixpoint is disabled, **then** it exits **1** naming **F9p**. *(Verified.)* | 4 |
| V35 | **Given** a viewport that cannot build a page plan for the chosen pack, **then** the screen-too-small card is shown **for that language**, and the parent can switch to the other language through the gate rather than being stuck. | 3 |

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

---

## W3 · Revision 3 — withdrawn and restated ids

**Withdrawn ids are never reassigned. Restated ids keep their number and change their
assertion — those are the dangerous ones**, because a test citing a restated id still
compiles and is now testing something else, sometimes the exact inverse.

### Withdrawn outright

| Id | Was | Withdrawn because |
|---|---|---|
| **C2** | the onset table's last cell is the **∅ tile**, a dashed empty socket | there is no ∅ tile. *"The toddle just need to pick the vowel, not the `.` character."* |
| **C3** | tapping ∅ seats it and plays a low wooden *open* sound | same |
| **C13** | "the chant reaches the toneless blend → the hairlines dissolve and the glyphs slide together" | folded into **C12a/C12b**, which specify what is shown at **every** beat rather than at one |
| **C16** | "**exactly one** of the three roles is on the table. The three are never shown together." | **B2b is its exact inverse.** This is the single id most likely to be cited by a passing test that is now wrong |
| **H2 (r2)** | 8 new words at a stage advances the stage | there are no stages |
| **H3 (r2)**, **H4 (r2)** | no level-up screen; the stage never decreases | there is no stage to announce or to decrease. H2–H4 are reused for the *absence* of progression |

### Restated — same id, different assertion

| Id | Revision 2 | Revision 3 |
|---|---|---|
| **A9** | switching language takes a two-touch confirm | one tap, behind the gate, row 2 |
| **B2** | the table is the stage's size, one run at a time | the constant table: a prefix of every run, sized by the device |
| **C1** | the onset table; a three-cell strip | all three runs; the word so far plus one dashed cell |
| **C4, C5** | the table **cross-fades to the next inventory** | the table does not change; only liveness and the tone carriers |
| **C7** | a stop-final rime renders **two** tone cells | six cells always; the illegal four are flat |
| **C10, C11** | undo morphs the table back | undo returns symbols; the tone carriers revert to bare marks |
| **C12** | five chant steps, described as parts | five **beats**, with what is shown at each one specified |
| **D7, D8, D9** | `long` on first touch, `short` after, 900 ms window | **`short` always**; `long` only from the parts hint |
| **D14** | digraphs appear "at stage 6 or 7" | there are no stages |
| **E2** | the flat tile's clip and its knock play together | knock at ≤ 60 ms, clip at +120 ms, never overlapping |
| **F5** | "the parts chant is skipped" | "chant beats 1–4 are skipped" |
| **F19** | tile audio is **ducked to −18 dB** under the motif | speech is **stopped** before the motif |
| **G10** | an auto-play is recorded so it does not count toward stage | nothing is recorded; there is no stage |
| **H1** | the table shows `[8,12,16,20,24][s-1]` cells | the table's size never changes |
| **K11** | **append** the symbol to `inventoryOrder` | **promote** it into the on-board prefix |
| **K12, K14** | "24 cells" | this device's budget and run sizes |
| **N11** | clips are decoded before the morph completes | decoded at pack load; there is no morph |
| **N13** | the ∅ tile plays a wooden *open* sound | there is no ∅ tile and no such sound |
| **P1** | 10,358,248 layouts, cells 1–24 | 30,732,958 layouts, cells 1–budget, plus **F0** |
| **P5, P6** | iPad 6 × 4 at 112 pt "at stage 5"; 360 × 640 maxCells 20 of 24 | iPad 7 × 10 at 86 pt, the whole inventory; 360 × 640 budget 20, run split 7/7/6 |
| **P14** | rotation 4 × 5 → 6 × 4 | rotation 7 × 10 → 12 × 6; reading order still unchanged |
| **R3** | "the **first-launch** chooser" | "the language chooser", reachable at any time |

### One id that did not change and is worth saying so

**R4** — *no code path reads the other language's pack* — is **unchanged**. Making the
language switchable at any time does not weaken it, because a switch is a teardown and not a
blend. **R1, R2, R5** are likewise unchanged. This was the thing the brief was most concerned
to protect and nothing in revision 3 touches it.

---

## W4 · Revision 4 — what paging did to revision 3's ids

Paging **relaxes** almost everything: criteria that asserted a truncated board now assert a
complete one. **No id is withdrawn outright.** The restated ones are the hazard, as always —
each still compiles and now means something different, and three of them mean the inverse.

| Id | Revision 3 | Revision 4 |
|---|---|---|
| **C21** | the run sizes are `zonesFor(budget)`, split 0.48 | **every character of every run is on the board.** `zonesFor()` is deleted from the tool |
| **C22** | no character changes **cell** when she edits | no character changes **page or cell** |
| **D1a** | all 26 letters "on a device whose budget is ≥ 26" | all 26 letters on **any** served device. **D1b is new** and settles `q` |
| **K11** | **promote** the character into the on-board prefix | **append** it to the end of its run. There is no prefix, and append cannot disturb a learned slot |
| **K11a** | on a full board, one character leaves | **the board is never full; no swap is ever offered.** Inverse |
| **K12** | the editor lists a run and offers a swap | a character in `inventoryOrder` **never** triggers the screen. Inverse |
| **K14** | the screen states this device's cell count | it states **no** cell count, because there is none. Inverse |
| **L7** | a wordless character "stays in its cell, always disabled" | unchanged in substance, generalised by `ui.md` §8.1 and made testable by **S14** |
| **P4** | `maxCells() ≥ 20` | **≥ 12 per page, and a page plan exists for both packs** (F7) |
| **P5** | iPad: 67 cells at 86 pt | the same, **plus: no page rail is rendered** |
| **P6, P6a** | 360 × 640 → 20 cells, 13 words; SE → 24 cells | **12 and 16 cells per page, 7 and 6 pages, all 47 words** |

### Tool-level changes worth citing in a test name

| | |
|---|---|
| **F7 restated** | "a served viewport holds ≥ 20 cells" → "a served viewport can build a page plan for both packs". Caught by the sweep itself: paging first reported **12 failures of a temporary rule F14** at 360 × 600, which turned out to be the *definition* being wrong rather than the arithmetic. F14 is gone |
| **F9, F9p, F10–F13 new** | the rail shape, the rail fitting its rows, the fixpoint converging, one grid holding the largest page, every character on exactly one page, no empty page |
| **`zonesFor()` deleted** | a comment stands in its place in `tools/layout-sweep.mjs` so it is not reinvented |
| **Served combinations** | 436,208 → **489,675**. Paging reaches devices truncation could not |
| **Fault injections verified** | `pagePlan` dropping remainders → exit 1 naming **F12**; the rail-wrap check disabled → exit 1 naming **F9p**; the budget overclaim → exit 1 naming **F0**. All three checked by running them |

### The ids revision 4 does **not** touch, and that is the point

**§V aside, nothing about the mechanic changed.** The constant table, liveness, the absent
`∅`, the accumulating chant, the one-speech-channel cut rule, the language switch and every
language-isolation criterion (**R1–R12**) are untouched. Paging is a change to *how much of the
board you can see at once*, and it was chosen precisely because it is only that.

