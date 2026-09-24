# Acceptance criteria

**Ghép Chữ** / **Word Blocks**. Owner: game-designer. These are what the app-developer builds
to and what the app-tester verifies. The developer may not edit them; the tester may not fix
what they catch (`development-process.md` §1).

**Form.** Every criterion is one observable behaviour, numbered, Given/When/Then, citable as
`AC-B4`. If verifying one requires reading source rather than running something, it is written
wrong — say so rather than pass it.

**Tier** column maps to `development-process.md` §5: 1 engine · 2 content · 3 E2E · 4 layout ·
5 on-device.

**Revision 5, 2026-09-23 — read §0D first.** The board became the standard alphabet and a
digraph became two taps. **The new group is §X, the word strip**, and the restated ids are
listed in **§W5** — those are the ones that still compile and now mean something else.

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

## 0D. REVISION 5 — the alphabet, and a word that is now up to six taps

**2026-09-23.** `literacy-vi.md` §0 and `literacy-en.md` §0 settle the content model;
`ui.md` §0C is what it did to the UI. The owner played the revision-4 build: *"the characters
being displayed feel really random and un-organized and doesn't give my son a sense of
character order"*, then *"for character combining, he will still going through character by
character, even for combine ones like ch, tr (Choose C and choose H)"*. **đánh vần is
unchanged** — his son is being taught it.

- **Group letters are stable, for the fourth revision running.** §B is still the board, §F is
  still the payoff, §V is still paging, §Q is still the font. §A, §G, §H, §I, §L, §M, §O, §Q,
  §R and §T are untouched.
- **New group §X · The word strip, spans and the boundary.** It is a new group and not
  additions to §C, because the strip is now a component with its own geometry, its own layout
  rules (F4/F15/F16/F17), its own motion (M22–M24) and its own failure modes, and because it
  behaves **identically in both languages** where §C and §D are per-language by construction.
- **§W5** lists what revision 5 retires and — the dangerous ones — what it **restates in
  place**. C4, C5, C10, C11, C15, D1, D4, D5, D14, E8, E9, N14, P1, P5, P6, P6a, S5, S8 and V3
  all still compile and now mean something else.
- **One conflict across three documents is resolved rather than carried.** `ui.md` §2.2 has
  said since revision 3 that *a short tap on the strip is undo — the whole strip, one target*,
  while `ui.md` §7.2, **`gameplay.md` §4.4** and criteria D4/E8/E9/C10/C11 said *tap a cell to
  return it and everything after it*. They were never reconciled, and the criteria agreed with
  the wrong half. **Revision 5 rules for §2.2, on geometry**: five 72 pt cells need 392 pt and
  the 360 dp floor has 328 pt of content width, so a per-cell motor target is impossible at the
  floor, and is below it on the owner's own device at 58 pt. **`gameplay.md` §4.4 is rewritten
  and `gameplay.md` §0C.1 records the whole thing.** `ui.md` §7.2.6 has the ruling.
- **The owner answered Q7 during this revision: English glyphs are UPPERCASE**, against my
  recommendation of lowercase. **D17–D24 and Q11–Q13** are new; `ui.md` §8.2 is the
  specification and `open-questions-ui.md` Q7 keeps both sides on the record. **Vietnamese stays
  lowercase and Q13 makes that a gate requirement rather than a preference.**

**Count, verified by parsing this file: 445 numbered criteria in §A–§X — 367 in §A–§T, 38 in
§V, 40 in §X — with no duplicate id anywhere. 30 Tier-5 questions in §U, 24 withdrawn
revision-1 groups in §W, 28 revision-2 ids in §W3, 11 revision-3 ids in §W4, and 23 restated
plus 2 withdrawn revision-4 ids in §W5.**

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
| A11 | **Given** a viewport that cannot build a page plan **or** lay out the six-cell word strip for the chosen pack (`ui.md` §4.3 — F7, F4, F15, F16), **when** the app opens, **then** the screen-too-small card is shown and no board is mounted. *(RESTATED in revision 5: the strip joins the definition of "served" — `ui.md` §4.3.)* | 4 |

## B · The board, the table, and the live set

| # | Given / When / Then | Tier |
|---|---|---|
| B1 | **Given** the board is shown, **then** it contains exactly three things: the top bar, the word strip and the character table. **No picture, no picture frame, no veil, no caption strip.** | 3 |
| B2 | **Given** the board is shown, **then** the table contains, in one fixed row-major sequence, **every character of every run** of the pack's `inventoryOrder` — Vietnamese `[29 letters][6 tones]`, English `[26 letters]` — paged when it does not fit one screen. *(RESTATED in revision 5: the runs changed. Revision 4 said `[26 onsets][35 rimes][6 tones]` and `[26 letters][10 digraphs]`.)* | 1 |
| B2j | **Given** a Vietnamese board, **then** the letter run is **exactly** `a ă â b c d đ e ê g h i k l m n o ô ơ p q r s t u ư v x y` — 29 cells, the owner's alphabet, in that order — and the tone run is **exactly** `ngang huyền sắc hỏi ngã nặng`, 6 cells, in that order. Neither is sorted by frequency, by word count, or by anything a build script produced. | 2 |
| B2k | **Given** an English board, **then** the table is **exactly** `a`–`z`, 26 cells, one run, and **no digraph tile exists anywhere in the app**. | 2 |
| B2l | **Given** any tile in either language, **then** its bar is **solid `role1` if the character is a consonant letter, split `role2` if it is a vowel letter, dotted `role3` if it is a tone** — and that assignment **never changes for the life of the app**, whatever he taps. | 3 |
| B2m | **Given** the prefix `c` on a Vietnamese board, **then** `h` stands with a **solid consonant** bar and `a` stands with a **split vowel** bar, simultaneously, and the two are distinguishable in greyscale. *(This is the branching-onset fork at the five states `c g k n t` — `literacy-vi.md` §0.6.)* | 3 |
| B2n | **Given** any prefix, **then** every one of the 29 Vietnamese letters and every one of the 26 English letters is **present on the board**, in its slot, whether or not it is live, and whether or not any word uses it. | 1 |
| B2a | **Given** any two moments in any session, **then** **every character is in the same cell**. The table's contents and cell assignment are a pure function of the pack's `inventoryOrder` and the device's cell budget, and of nothing else — not the strip, not the position, not the word list, not the session, not a random source. | 1 |
| B2b | **Given** a Vietnamese board on a device that needs no pages, **then** **both** runs — letters and tones — are on screen **simultaneously**, at every position, from the first launch; **given** a paged device, **then** both runs are always reachable and the rail shows which holds something live. *(RESTATED in revision 5: "all three runs" became two.)* | 3 |
| B2c | **Given** any sequence of taps, **then** **no character ever changes cell, size, bar pattern or role.** The only per-tap change to the table is which tiles are live, plus the tone-carrier swap of B2d. | 3 |
| B2d | **Given** a Vietnamese board with no rime placed, **then** each of the six tone cells shows its **bare mark on a dotted circle** (`ngang` an empty circle) and **every one of them is disabled**; **given** a rime is placed, **then** each tone cell shows **that rime with its mark applied** and the completing, legal ones are live. | 3 |
| B2e | **Given** the bare-mark form of a tone cell, **then** it is rendered in **`ink`**, not `inkSoft`, and measures ≥ 4.5:1 against the ground in every theme. | 2 |
| B2f | **Given** the board, **then** there is **no `∅` tile, no empty socket and no placeholder character** anywhere in the table. | 3 |
| B2g | **Given** an empty strip in Vietnamese, **then** the live set is exactly the **19 letters** that begin some word — `a b c d đ g h k l m n o p q r s t v x` — and the other ten, every vowel except `a` and `o`, are flat. *(RESTATED in revision 5: `áo` is now started by tapping the letter `a`, not the rime tile `ao`.)* | 1 |
| B2h | **Given** the board, **then** the table does **not scroll**, has no scroll affordance, and every character it holds is on screen at once. | 4 |
| B2i | **Given** a run boundary in the table, **then** it is marked by **no line, box, tint or label** — only by the tile's bar pattern becoming **dotted** at the tone run. *(RESTATED in revision 5: solid and split now interleave **within** the letter run, because the pattern marks the letter rather than the run.)* | 3 |
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
| C1 | **Given** a Vietnamese board with an empty strip, **then** the table shows the 29-letter alphabet and the 6 tones, and the strip shows **one dashed cell**. *(RESTATED in revision 5: "all three runs" became two.)* | 3 |
| C4 | **Given** a live **letter** is tapped, **then** it seats in the next empty strip cell, a new dashed cell appears to its right, and **the table's cell contents do not change** — only which tiles are standing. *(RESTATED in revision 5: the tap is a letter, not an onset.)* | 3 |
| C5 | **Given** the onset letters are placed, **when** the letters of a **complete rime** are placed, **then** the six tone cells swap their carrier to that rime (B2d) within 160 ms. **The swap happens on the letter that completes the rime, not on its first letter** — `ăng` holds bare marks through `ă` and `ăn` and swaps on the `g`. *(RESTATED in revision 5: a rime is now two to four taps.)* | 3 |
| C4a | **Given** `c` is seated and `h` is tapped, **then** **two cells are shown, not one**, `c` and `h` are never merged into a `ch` cell, and the app plays `chờ` — never `hờ`, and never `cờ` followed by `hờ`. | 3 |
| C4b | **Given** any of `c`+`h`, `g`+`h`, `g`+`i`, `k`+`h`, `n`+`g`, `n`+`h`, `n`+`g`+`h`, `p`+`h`, `q`+`u`, `t`+`h`, `t`+`r`, **then** the second (or third) tap plays the clip of the **digraph**, cutting the previous clip, per `literacy-vi.md` §0.9's table. | 3 |
| C4c | **Given** `g` is seated and `i` is tapped, **then** `i` joins the **onset** span — solid `role1` bar, **no divider** — even though the `i` tile on the table carries a vowel bar. The same holds for `q`+`u`. | 3 |
| C4d | **Given** the prefix `p` or `q` on a Vietnamese board, **then** **no vowel is live**: the only live letter after `p` is `h`, and after `q` is `u`. Bare `p` and bare `q` are never onsets. | 1 |
| C4e | **Given** the tap sequence for any of the 50 `vi-seed` words, **then** every intermediate prefix has at least one live tile, and the number of taps is **3 to 6**, mean 4.08. *(`literacy-vi.md` §0.11. `chuối`, `trăng` and `trứng` are the 6-tap words.)* | 1 |
| C4f | **Given** the engine, **then** the onset/rime boundary is read from the stored `(onset, rime, tone)` triple and **never inferred from the letter stream**. *(`literacy-vi.md` §0.5: `gì` is onset `gi` + rime `i`, written with one `i`, and no letter stream can recover that.)* | 1 |
| C6 | **Given** a rime is placed, **then** each of the six tone cells renders **that rime with that tone's mark applied** (`eo èo éo ẻo ẽo ẹo`), never a bare diacritic. *(Unchanged in substance — `literacy-vi.md` §5.4 holds at the moment he is choosing.)* | 3 |
| C7 | **Given** a rime ending in `p`, `t`, `c` or `ch`, **when** its tone carriers are shown, **then** **all six cells are still present**, the illegal four are **disabled**, and each shows the marked form from the rime's `toned` map, falling back to the bare mark where that is `null`. *(RESTATED: revision 2 rendered only the two legal cells. Legality and completability are now both flatness — `ui.md` §7.2 states what that costs.)* | 1 |
| C8 | **Given** `ngang` completes a word, **then** it is a live tile he presses, and the strip shows the unmarked form. `ngang` is never implicit. | 1 |
| C9 | **Given** any (onset, rime) with exactly one completing tone, **then** that tone tile is live, the other five are disabled, and **the word is not auto-committed**. He taps it. | 1 |
| C10 | **Given** a seated tone, **when** the strip is tapped, **then** the tone returns and the six tone cells keep the rime as their carrier; **when** it is tapped again and the rime is no longer complete, **then** the carriers revert to **bare marks**. *(RESTATED in revision 5: undo is the strip, one symbol at a time — §0D.)* | 3 |
| C11 | **Given** a strip holding `c` `h` `o` and a tone, **when** the strip is tapped four times, **then** the symbols return one at a time, last first, each playing the clip of **what is left** — `cho`, then `chờ`, then `cờ`, then nothing — and the strip is empty. *(RESTATED in revision 5: was "tap the onset, everything returns at once".)* | 3 |
| C12 | **Given** a Vietnamese word forms, **then** the chant plays five beats — `onset name · rime name · **toneless blend** · tone name · whole word` — with beat 4 omitted for `ngang` and beat 1 omitted for a zero onset. **The beat count is a property of the model, not of the taps: `chó` is four taps and five beats, exactly as `bò` is three taps and five beats.** *(Arithmetic corrected in Slice 4: the prose said six and four, which is revision 4's tap count. Under revision 5 a tap is a letter plus the terminal tone — `c` `h` `o` sắc and `b` `o` huyền — which is what C4e and `literacy-vi.md` §0.11 say and what `src/engine/` does. The point the criterion makes is unchanged and is the reason the numbers matter: the two words have the **same** beat count and **different** tap counts.)* | 3 |
| C12e | **Given** the chant for `chó`, **then** **beat 1 lights the `c` cell and the `h` cell together**, as one span, because they are one sound; **given** `chuối`, **then** beat 1 lights two cells and beat 2 lights three. | 3 |
| C12f | **Given** any chant beat, **then** the `reward` gold is applied **per cell**, and the gaps between cells stay on the ground. **There is no continuous gold plate across a span** — a `neutralFace` divider measures 1.58–2.12:1 on `reward` (`ui.md` §5.8b). | 3 |
| C12a | **Given** the chant, **then** what is **shown** accumulates: beat 1 `b`, beat 2 `b` `o`, beat 3 `bo` (merged), beat 4 `bò` (marked), beat 5 `bò` held. **At no beat is anything on screen that is not part of the word** — in particular **the tone's name is never rendered**. | 3 |
| C12b | **Given** chant beat 3, **then** the clip played is the word's **`audio.blend`**, and the strip's dividers dissolve and the glyphs slide together on that same beat. | 3 |
| C12c | **Given** any chant beat, **then** it begins **after the previous clip has ended**, plus that beat's gap from `pack.chant.gapsMs`, with ≤ 30 ms drift. Two chant clips are never audible at once. | 3 |
| C12d | **Given** `pack.chant.gapsMs` is edited, **then** the chant's timing changes accordingly with no code change. | 2 |
| C14 | **Given** chant beat 4, **then** the mark animates down onto **the already-merged word** (M12), not onto a separate tile or cell. | 3 |
| C15 | **Given** a Vietnamese board, **then** **consonant letters** carry a solid `role1` bar, **vowel letters** a split `role2` bar, and **tones** a dotted `role3` bar; the two runs are contiguous and in that order. *(RESTATED in revision 5: role is a property of the letter, not of the stage — `ui.md` §5.5.)* | 3 |
| C17 | **Given** any prefix, **then** the table never has both of `{c,k}`, `{g,gh}`, `{ng,ngh}` **live** at the same time, and no dialect homophone pair for the pack's `dialect` is live together (`literacy-vi.md` §6.1). *(They are all always **present**; this is about liveness.)* | 1 |
| C18 | **Given** `ng` is seated and no stored word has onset `ngh`, **then** `h` is **not live**, is rendered flat in its slot, and **speaks `ngờ` when tapped** — the unit it would build, not `hờ`. *(RESTATED in revision 5: there is no `ngh` tile any more.)* | 3 |
| C18a | **Given** every letter of the Vietnamese alphabet, **then** **each of the 29 appears in at least one `vi-seed` word**, so the Vietnamese board has no permanently dead cell. *(Contrast D1c: English has four.)* | 2 |
| C19 | **Given** a zero-onset word such as `áo`, **then** it is built in **three taps** — `a`, `o`, sắc — the strip never shows an empty leading cell, and **no divider appears**, because there is no onset for the rime to be divided from. *(RESTATED in revision 5: was two taps.)* | 3 |
| C20 | **Given** a completed Vietnamese word, **then** the strip shows **one merged word with the mark applied**, no dashed cell, and a 5 pt **dotted `role3`** segment under the rime recording that a tone was chosen. | 3 |
| C21 | **Given** any served device, **then** **all 29 letters and all 6 tones are on the board** — across pages if need be. No run is truncated and `zonesFor()` does not exist. *(RESTATED again in revision 5: the inventory is 35, not 67. §W4, §W5.)* | 1 |
| C22 | **Given** his mother adds or edits a word, a rime or an onset, **then** **no character changes page or cell.** The page plan depends only on the run lengths (29, 6) and the device, and those run lengths **cannot change by editing a word** — they are the alphabet. | 1 |
| C23 | **Given** the prefix `b`+`o`, or `c`+`a`, or `m`+`u`, **then** **a letter and a tone are live at the same time**, and the board shows both: at least one letter tile standing, and at least one tone cell standing (on a tablet) or the tone page's rail button standing (on a phone). | 1 |
| C24 | **Given** those three prefixes, **then** the strip shows **both** affordances at once — a dashed next-cell **and** a dashed mark-slot above the carrier vowel. *(`ui.md` §7.2.4. This is how the board says "this could end here, or it could go on", with no text.)* | 3 |
| C25 | **Given** a prefix that is a complete rime with no longer rime behind it, **then** **only** the mark-slot is shown and there is no dashed next-cell; **given** a pass-through rime prefix (`ac an uô â ă ăn ư ưn`), **then** **only** the dashed next-cell is shown and **no tone is ever live**. | 1 |

## D · English assembly

| # | Given / When / Then | Tier |
|---|---|---|
| D1 | **Given** an English board with an empty strip, **then** the table shows **the alphabet, `a`–`z`, in alphabetical order, and nothing else**, and the strip shows **one dashed cell**. *(RESTATED in revision 5: the trailing digraph run is deleted — `literacy-en.md` §0.1.)* | 3 |
| D1c | **Given** an English board, **then** `j`, `q`, `y` and `z` are **present in their slots, at full glyph opacity, permanently flat, and speak their sound when pressed** — no `en-seed` word uses them. Four dead cells is what a fixed alphabet honestly looks like and is not an error. | 2 |
| D1d | **Given** an **iPhone 17 Plus** at either 430 × 932 or 440 × 956 in English mode, **then** the board is **one page of 26 cells, 4 × 7, at 84 pt (A) or 87 pt (B), with no page rail rendered anywhere and no page sound ever played.** | 4 |
| D1e | **Given** `s` is seated and `h` is tapped, **then** two cells are shown, they share **one span bar**, and the clip played is **/ʃ/** — never /h/, and never /s/ followed by /h/. The same holds for `c`+`h`, `t`+`h`, `c`+`k`, `n`+`g`, `g`+`g`, and a doubled `f l s z`. | 3 |
| D1f | **Given** the prefix `c` at position 1 in English, **then** `k` is **not** live — no word starts `ck` — and the live letters are exactly `a r u`. *(`literacy-en.md` §0.5: the position rules moved from the palette to liveness.)* | 1 |
| D1a | **Given** an English board on **any** served device, **then** **all 26 letters are on the board**, `a`–`z`, including `q` — on page 1 where a page holds 26, across pages otherwise. | 2 |
| D1b | **Given** `q`, which no pack word uses, **then** it is rendered in its slot at full glyph opacity, is **permanently flat in every state**, and **plays its sound when pressed**. It is never hidden, never removed, and never an error. | 3 |
| D2 | **Given** a live tile is tapped, **then** it seats in the next empty strip cell and **a new empty cell appears to its right**. | 3 |
| D3 | **Given** any English strip state, **then** the number of cells shown is the number of symbols placed plus one. **The target length is never shown.** | 3 |
| D4 | **Given** a seated tile, **when** **the strip** is tapped, **then** **exactly one** tile — the last one — returns to the table, and tapping again returns the one before it. *(RESTATED in revision 5 on geometry, §0D. The strip is one target; there is no per-cell undo in either language.)* | 3 |
| D5 | **Given** any English board, **then** vowel tiles (`a e i o u`) carry a **split** bar in `role2` and consonant tiles — including `y`, which is /j/ in this pack — a **solid** bar in `role1`, and the two are distinguishable with the screen desaturated. *(RESTATED in revision 5 only in that Vietnamese now obeys the same rule — S5.)* | 3 |
| D6 | **Given** any English board, **then** **no tile carries `role3`**. | 3 |
| D7 | **Given** any tile is touched, live or flat, first time or five-hundredth, **then** its **`short`** clip plays. *(RESTATED — this is the inverse of revision 2's D7. The `long` anchored clip is **never** fired by a tile tap; see N14. `ui.md` §11.0 is why.)* | 3 |
| D8 | **Given** a full session of play, **then** **no `long` clip is ever played by a tile tap**, in either language. | 3 |
| D9 | **Given** the word strip is held for 800 ms in English, **then** the **`long`** anchored clips are what the parts hint speaks — the only place in the app they are heard. | 3 |
| D10 | **Given** an English word forms, **then** the chant uses `short` clips left to right, then the whole word — never the `long` anchored form. | 3 |
| D11 | **Given** any prefix, **then** `c` and `k` are never both live. | 1 |
| D12 | **Given** an empty strip in English, **then** the live set is exactly `a b c d e f h l m n p r s v w` — 15 of 26 — and `g i j k o q t u x y z` are **present and flat**. *(RESTATED in revision 5: `literacy-en.md` §0.2. `k` is flat here but live inside `duck` and `sock`, which is the distinction the old D12 could not express.)* | 1 |
| D13 | **Given** the prefix `c` `a`, **then** the live set is exactly the letters that complete a pack word (`n`, `p`, `t` in `en-seed`), and every other letter on the table is disabled. | 1 |
| D14 | **Given** the whole app in English mode, **then** **no tile anywhere renders more than one character**. *(RESTATED in revision 5 — the exact inverse of revision 4's D14, which specified how to shrink a two-letter tile. Withdrawn as a rendering rule, restated as a prohibition, because a two-glyph tile reappearing is the regression this revision most needs to catch. §W5.)* | 3 |
| D15 | **Given** the tap sequence for any of the 40 `en-seed` words, **then** it is **3 or 4 taps** (33 words at 3, 7 at 4), every intermediate prefix has at least one live tile, and **no word is a proper prefix of another**. *(`literacy-en.md` §0.2.)* | 1 |
| D16 | **Given** the ten digraph audio clips in `en-seed`, **then** they are **still present and still played** — as the re-voicing clip of a completing second tap (D1e) — and **not deleted with the tiles**. | 2 |
| D17 | **Given** an English board, **then** every child-facing glyph of a pack character is **UPPERCASE** — the table tile, the strip cell, the merged word at chant beat 3, any page-rail button, and the reveal's large word. `SHIP`, not `ship`. *(The owner's answer to `open-questions-ui.md` Q7.)* | 3 |
| D18 | **Given** a Vietnamese board, **then** every child-facing glyph is **lowercase**, and **no Vietnamese glyph is ever rendered uppercase anywhere in the app**. The two languages deliberately differ. | 3 |
| D19 | **Given** any uppercase tile is tapped, **then** the clip played is the letter **sound** — `A` says /æ/, `S` says /s/ — and **never a letter name**. Casing is a glyph decision and reaches no audio asset, no clip key and no chant beat. | 1 |
| D20 | **Given** the pack on disk, **then** **nothing stored is uppercase**: `pack.json`, `inventoryOrder`, each word's `letters` and `tiles`, its id and its media file names are all exactly as his mother typed them. The casing is applied at render only. | 2 |
| D21 | **Given** `src/ui/`, **when** it is grepped, **then** **no component calls `toUpperCase()` and no component hard-codes a case.** The value is read once at pack load from the pack's casing field and applied at one place in the glyph component. *(A `toUpperCase()` in a component is a bug in exactly the sense §5.1 means for a colour literal: right in one language, wrong in the other, and unreversible without a developer.)* | 1 |
| D22 | **Given** the pack's casing field is changed from upper to lower and the app relaunched, **then** the English board renders lowercase, **with no other change** — no rebuild, no re-record, no asset change, no layout change, and every other criterion in this document still passes. | 3 |
| D23 | **Given** a pack whose casing field is **absent, empty or unrecognised**, **then** the app renders **lowercase** and starts normally. It does not refuse to load, and it does not crash. *(Content is hostile input; a casing flag is never worth failing to start over.)* | 2 |
| D24 | **Given** the editor and every parent surface, **then** words and letters are shown **exactly as she typed them** — never upper-cased. She sees her own text. | 3 |

## E · Live, disabled, and undo

| # | Given / When / Then | Tier |
|---|---|---|
| E1 | **Given** a **live** tile is tapped, **then** its sound plays, it flies to the strip over 260 ms, a 90 ms seat click plays, and the table restands within 200 ms. | 3 |
| E2 | **Given** a **disabled** tile is tapped, **then** a 40 ms muted knock plays at −9 dB **within 60 ms**, **then its own `short` clip plays in full starting at +120 ms** — the two do **not** overlap — the tile dips 2 pt and returns over 120 ms, and **nothing else changes**: no seat, no strip change, no table change. *(RESTATED: revision 2 played the clip and the knock together. `ui.md` §11.0.)* | 3 |
| E2a | **Given** a disabled tile is tapped, **then** the knock and the clip are on **different channels in the specified order**, and at no instant are two speech clips audible. | 5 |
| E3 | **Given** a disabled tile is tapped, **then** nothing red, nothing grey-to-illegible, no X, no shake, no buzzer and no error glyph is rendered anywhere. | 3 |
| E4 | **Given** a disabled tile, **then** its glyph is rendered at **full opacity** in `inkSoft` and measures **≥ 4.5:1** against the ground in every theme. | 2 |
| E5 | **Given** a disabled tile, **then** it carries **no identity bars**, a 3 pt `roleEdge` underbar **in its own consonant/vowel/tone colour**, and a 1.5 pt dashed outline — and a live tile carries two bars, a solid 2 pt outline and a white face. | 3 |
| E6 | **Given** the board rendered in **greyscale**, **then** live and disabled tiles remain distinguishable, by bar weight and outline solidity alone. | 3 |
| E7 | **Given** a tap changes the live set, **then** the tiles that change state animate with M6 (200 ms cross-fade, 2 pt rise or fall, 20 ms stagger by cell index) and **no tile moves cell**. | 3 |
| E8 | **Given** the strip is tapped, **then** **exactly one symbol** — the last — returns to the table over 300 ms (M8), the clip played is that of **what remains** (undoing `h` from `c h` says `cờ`, not `hờ`), and one descending two-note unclick sounds. *(RESTATED in revision 5, §0D.)* | 3 |
| E9 | **Given** a strip of *n* symbols, **when** it is tapped *n* times, **then** it is emptied one symbol at a time and the table returns to the position-1 live set. **There is no clear-all gesture**, and holding the strip is the parts hint (§2.2), unchanged. *(RESTATED in revision 5.)* | 3 |
| E14 | **Given** the strip is tapped, **then** the board slides to the returned symbol's page, if it is not already there. *(Unchanged in substance from V23; restated here because undo is no longer per-cell.)* | 3 |
| E15 | **Given** a live tile is tapped, **then** the clip played is that of **the unit it builds** — `cờ` for a bare `c`, `chờ` for an `h` after `c` — and it **cuts** any speech still playing, synchronously, before starting. No two speech clips are ever audible at once. | 1 |
| E16 | **Given** a **flat** tile is tapped, **then** it too plays the clip of the unit it **would** build, on the same rule — tapping `h` with `c` seated says `chờ` whether or not `ch` leads anywhere. | 3 |
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
| P1 | **Given** `node tools/layout-sweep.mjs`, **when** it is run, **then** it exits 0 over viewports 360–1400 × 600–1440 in steps of 4, × 9 safe-area shapes, × table sizes 1–`budget`, against **10 layout rules and 6 plan rules**. **Measured 2026-09-23, revision 5: 34,463,217 layouts + 982,566 page plans, 491,283 served combinations, 0 failures.** *(RESTATED — the numbers are revision 5's.)* | 4 |
| P1a | **Given** the sweep, **when** `maxCells` is made to overclaim by one (`cells <= budget + 1`), **then** it exits **1** naming **F0**. *(Never trust a green check you have not seen fail — and note the other rules **cannot** fail for a served size, because they also decide the budget. `ui.md` §4.3.)* | 4 |
| P1b | **Given** the sweep, **when** `VI_MAX_LETTERS` is raised from 5 to 7 — his mother adding `nghiêng` — **then** it exits **1** naming **F17**. *(Verified 2026-09-23: 12 failures, first at `360×600 pages 15,14,6`. F17 is the only strip rule that is not circular.)* | 4 |
| P1c | **Given** the sweep, **when** the strip cell's width cap is removed from `stripCellW`, **then** it exits **1** naming **F15**. *(Verified 2026-09-23: 12 failures, first at `368×604 cells=1`.)* | 4 |
| P2 | **Given** any served viewport, **then** `tile ≥ 72` pt/dp. | 4 |
| P3 | **Given** any served viewport, **then** the table row fits the content width with no horizontal scrolling. | 4 |
| P4 | **Given** any served viewport, **then** it holds **≥ 12 cells per page** and can build a page plan for **both** packs (F7). *(RESTATED — revision 3 asked for ≥ 20 cells and no plan.)* | 4 |
| P5 | **Given** an iPad 11" in portrait with `vi-seed`, **then** the table is the **whole 35-cell inventory at 116 pt in a 5 × 7 grid**, **with no page rail**, and nothing scrolls or pages; **with `en-seed`**, all 26 letters at 116 pt in 5 × 6. *(RESTATED in revision 5 — measured, `ui.md` §4.4.)* | 4 |
| P6 | **Given** a 360 × 640 Android phone, **then** it holds **16 cells per page** at 73 pt and plays Vietnamese across **3 pages `[15 ¦ 14 ¦ 6]`** with **one** rail row, and English across **2 pages `[13 ¦ 13]`**. *(RESTATED in revision 5 — revision 4 gave it 12 cells and 7 Vietnamese pages.)* | 4 |
| P6a | **Given** an iPhone SE 3 (375 × 667), **then** it holds **20 cells per page**, 4 × 4 at 76 pt, and plays Vietnamese across **3 pages** and English across **2**. *(RESTATED in revision 5 — was 16 cells and 6 pages.)* | 4 |
| P6c | **Given** an **iPhone 17 Plus** at either 430 × 932 or 440 × 956 with `vi-seed`, **then** the board is **3 pages `[15 ¦ 14 ¦ 6]`, 3 × 5 at 101 pt (A) or 104 pt (B), one rail row of 3 buttons**, and the word strip is six cells of 58 × 90 (A) or 60 × 93 (B) with a 47 pt (A) or 49 pt (B) glyph. | 4 |
| P6d | **Given** the layout law, **then** the Vietnamese page split is **`a`…`m` ¦ `n`…`y` ¦ the six tones** on every paged device — 15, 14, 6 — because `pagePlan` is balanced and the capacity of every served phone is ≥ 15 and < 29. | 4 |
| P6b | **Given** the layout law, **then** `TOP_BAR + GAP_STRIP + PAD_BOTTOM = 56 + 12 + 12 = 80`, `TILE_MIN` is **72**, and `gap ≥ 10` — **all three unchanged for the fifth revision running**, and none of them shaved to buy back the one cell by which 29 letters miss a single page. | 4 |
| P17 | **Given** the layout law, **then** `STRIP_CELLS = 6`, `STRIP_GAP = 8`, `STRIP_PAD = 8`, `STRIP_CELL_MIN = 40`, and the strip is laid out for six cells **on every device and in both languages**, whatever word is being built. | 4 |
| P18 | **Given** any served viewport, **then** `stripRowW ≤ tableW` (F15), `stripCellW ≥ 40` (F16) and `stripFont ≥ 34` (F4). **Measured tightest: 48 × 61 cells and a 39 pt glyph at the 360 × 600 floor** — 8 pt of margin on F16, 5 pt on F4. | 4 |
| P19 | **Given** the sweep, **then** requiring the six-cell strip costs **970 viewport/inset combinations of 492,253 (0.20%)**, **every one of which has 118 pt of combined left+right safe-area inset**. No real portrait phone is un-served, and the net served count **rises** 489,675 → **491,283**. | 4 |
| P20 | **Given** any served viewport, **then** the **strip cell is not a motor target** and no criterion requires it to be 72 pt. The tappable strip object is the **whole strip band** (≥ 328 × 77 at the floor). | 4 |
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
| Q11 | **Given** the bundled tile font, **then** all **26** of `A`–`Z` are present with no `.notdef`. *(Measured 2026-09-23: 26/26 in both `BeVietnamPro-SemiBold.ttf` and `Baloo2-SemiBold.ttf`, so the one-line typeface reversal survives uppercase.)* | 2 |
| Q12 | **Given** the bundled tile font, **then** the widest uppercase glyph `W` (**1.039 em** in Be Vietnam Pro SemiBold) fits the strip cell at every served viewport: the strip's `0.82` width factor tolerates up to **1.22 em**, leaving **17%** of headroom. **Tightest measured: 40.5 pt of `W` in a 48 pt cell at the 360 × 600 floor — 7.5 pt of slack.** | 4 |
| Q12a | **Given** any tile face proposed for this app, **then** its **widest glyph is ≤ 1.231 em** (`48 ÷ 39`, the floor's strip cell over its glyph size). Both bundled faces clear it — `W` is 1.039 em in Be Vietnam Pro SemiBold and 0.832 em in Baloo 2 SemiBold. *(Verified by injection: re-running the fit arithmetic at 1.25 em **exits 1**, overflowing the floor's strip cell by 0.8 pt while every tile still fits — so the binding constraint is the strip, not the table, and the failure it catches is a clipped letter in the word he is building.)* | 2 |
| Q13 | **Given** `assets/fonts/FIXTURE.txt`, **then** it carries **7** uppercase Vietnamese letters and **not** the precomposed marked capitals — so **Q5a does not gate Vietnamese uppercase.** A Vietnamese pack may not be switched to uppercase until the fixture is extended and Q1–Q5c re-run. *(`ui.md` §6.1a, §8.2.3. The fonts do cover them — 0 of 25 sampled forms missing — but a font that contains a glyph is not a gate that has rendered it.)* | 2 |
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
| S5 | **Given** any theme and **either language**, **then** **consonant** is `role1`/solid, **vowel** is `role2`/split, **tone** is `role3`/dotted. The slot→meaning mapping is identical in all three themes and both languages. *(RESTATED in revision 5: was onset/rime/tone — `ui.md` §5.5.)* | 3 |
| S15 | **Given** any theme, **then** the **consonant and vowel hues are ΔE00 ≥ 20 apart under simulated protanopia, deuteranopia AND tritanopia**. **Measured: worst case 23.7 (Popsicle, protanopia).** *(The first CVD-gated check in this tool. It is newly necessary because a consonant tile and a vowel tile are now adjacent in every row and live simultaneously at the five branching onsets, so "fixed position" no longer separates them.)* | 2 |
| S16 | **Given** the sweep, **when** `DE_MIN_ADJACENT_CVD` is raised from 20 to 25, **then** it exits **1** naming Popsicle consonant-vs-vowel under protanopia at **23.7**. *(Verified 2026-09-23.)* | 2 |
| S17 | **Given** the sweep, **when** the onset/rime boundary divider is drawn in `hairline` instead of `neutralFace`, **then** it exits **1** in all three themes at **1.30–1.38:1** against the 3.0 `component` gate. *(Verified 2026-09-23.)* | 2 |
| S18 | **Given** the strip, **then** the boundary divider measures **≥ 3.0:1 against the ground** in every theme (measured 3.02 / 3.20 / 3.42) and is **never drawn on the `reward` gold**, where it measures 1.58–2.12:1. The chant's gold is applied per cell; the gaps stay on the ground. | 2 |
| S19 | **Given** any theme, **then** **tone is not gated under CVD** and Popsicle's consonant-vs-tone pair measuring **1.59 under deuteranopia** is a printed, named limitation — mitigated because tone is a separate run, on its own page on every phone, never adjacent to a letter, and carries the only dotted bar. | 2 |
| S12 | **Given** the board, **then** **no run carries a background tint.** A `roleSoft` wash behind each run measured 2.62–2.92:1 for that run's tile outline in 5 of 9 (theme × run) pairs, under the 3.0 `component` gate — `ui.md` §5.8a. The disabled tile's face is `ground`. | 2 |
| S13 | **Given** `tools/theme-contrast.mjs`, **then** it contains the **bare tone mark on the ground** as a gated `glyph` pair, measuring ≥ 4.5:1 in all three themes (measured 11.96–13.06). | 2 |
| S14 | **Given** a pack in which some character of `inventoryOrder` has **zero** words behind it (`q` in English, `ngh` in Vietnamese), **then** the validator **accepts it** — it is a normal permanent state, not an error — and the character is drawn and speaks. | 2 |
| S6 | **Given** any theme, **then** the three role hues are pairwise ΔE00 ≥ 25 to a normal-sighted observer. | 2 |
| S7 | **Given** any theme, **then** the **disabled** tile glyph measures ≥ 4.5:1 against the ground. | 2 |
| S8 | **Given** the app rendered in greyscale, **then** every role remains identifiable by bar pattern alone, **live remains distinguishable from disabled**, and **the onset/rime boundary in the strip remains visible** — on a Vietnamese board where 29+ of 35 tiles are flat and solid and split bars alternate cell by cell. *(RESTATED in revision 5: the greyscale burden moved from the run boundary to the per-cell pattern.)* | 3 |
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
| **U23** | **The question revision 5 turns on.** When he taps `c` and then `h` and hears `cờ` replaced by `chờ`, does he read it as *those two together say chờ* — or as *the app changed its mind*? | this is the one thing revision 5 cannot verify below the owner. Watch whether he ever says `chờ` himself while tapping `c` then `h` |
| **U24** | Does the **bar reaching across** (M22) actually read to him as *joined*? Or does he only notice the second block landing? | cover the sound and watch; then cover the screen and listen. The design claims both channels say it |
| **U25** | Does the **alphabet order** fix what he complained about — does his son now have "a sense of character order"? | the owner's own question, and the reason for this revision. Ask him after a week |
| **U26** | Is a **101 pt tile in a 3-wide grid** better or worse for him than revision 4's 75 pt in a 4-wide one? The law maximises the tile; it does not know which he prefers. | he has played both. Ask |
| **U27** | On a paged board, does the **cross-page digraph** (`t` on page 2, `h` on page 1) stop him? | watch him build `thỏ`. If it stops him, the answer is not a smaller gap — it is a different page split, and that is the owner's call |

---

## V · Paging (revision 4)

**Every criterion here is vacuous on a viewport that needs no pages** — a tablet — and V1
is the criterion that says so. `tools/layout-sweep.mjs --pages` prints the expected plan for
any device under test.

| # | Given / When / Then | Tier |
|---|---|---|
| V1 | **Given** a viewport whose cell budget holds the whole pack inventory, **then** the table is **one page**, **no page rail is rendered at all**, and no page sound ever plays. **In revision 5 this is every tablet, every phone in English at 360 × 800 and above, and 93% of all served combinations.** | 4 |
| V2 | **Given** a viewport that cannot hold the whole inventory, **then** the table is paged and a page rail is rendered with **exactly one button per page**. | 4 |
| V3 | **Given** an iPhone 17 Plus at **either** 430 × 932 **or** 440 × 956, **then** the plan is **3 Vietnamese pages `[15, 14, 6]`, 28 cells per page, one rail row of 3 buttons — and English is ONE page of 26 with no rail at all.** *(RESTATED in revision 5, measured; both candidate logical sizes give the same plan. `ui.md` §4.4.)* | 4 |
| V3a | **Given** any served viewport, **then** the Vietnamese page count is **1, 2, 3 or 4** and never more. **Measured across 491,283 served combinations: 457,433 at 1 page (93%), 168 at 2, 32,590 at 3, 1,092 at 4.** *(Revision 4's range was 1, 3, 4, 5, 6, 7.)* | 4 |
| V3b | **Given** any served viewport, **then** the paging fixpoint converges in **0 steps** — the rail never wraps — so `RAIL_MAX_ROWS = 2` is headroom, not a binding constraint. **Measured over 982,566 plans.** | 4 |
| V4 | **Given** any paged plan, **then** **runs never share a page**: every page's characters come from exactly one run. | 1 |
| V5 | **Given** a run longer than one page, **then** it is split into `ceil(len/capacity)` **balanced** pages, earlier pages taking the remainder — 29 letters at capacity 28 is `15, 14`, never `28, 1`. *(RESTATED in revision 5: same rule, new run.)* | 1 |
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
| V19 | **Given** any rail button, **then** its glyph is **the first character of that page** — in Vietnamese, `a`, `n` and the `ngang` circle — drawn with that character's own bar and role colour, and pressing it plays **the page sound only — never a speech clip**. | 3 |
| V20 | **Given** any rail button, **then** it is at least **72 pt**, with `RAIL_GAP` 12, and no two buttons' hit rects overlap. The motor floor applies to the control. | 4 |
| V21 | **Given** any served paged viewport, **then** the rail is **fully visible**: it never scrolls, collapses or hides, and `pages ≤ railRows × railCols` with `railRows ≤ 2`. | 4 |
| V22 | **Given** a Vietnamese board with an **empty strip** on a paged device, **then** **pages 1 and 2 both stand** (19 letters begin a word, spread across both) and **page 3 is flat** (no tone can be placed yet). *(RESTATED in revision 5: the zero-onset case is now just the letter `a`, on page 1.)* | 3 |
| V22a | **Given** the prefix `t` on a paged Vietnamese board, **then** **page 1's rail button stands**, because `h` — which completes `th` — lives on page 1 while `t` lives on page 2. The same holds for `n`+`g`, `n`+`h` and `p`+`h`. *(This is the measured cost of the 15/14 split; `ui.md` §0C. It must not be "fixed" by shaving the tile floor or the gap.)* | 3 |
| V23 | **Given** a symbol in the word strip is tapped, **then** it is returned **and** the board slides to that symbol's page. Undo is also the way back. | 3 |
| V24 | **Given** a page change from any cause, **then** a **soft non-speech page sound** plays on the UI channel, identical whoever caused it, and it **does not cut any speech clip**. | 3 |
| V25 | **Given** the announcement, the chant or a held reveal is running, **then** **no auto-advance fires**. | 3 |
| V26 | **Given** 20 s idle on a paged board where live characters exist on another page, **then** the shimmer also pulses that page's rail button; **given** 40 s, **then** the breathing element is that **button** rather than an off-screen tile. | 3 |
| V27 | **Given** 80 s idle, **when** the auto-play needs a character on another page, **then** it changes page first, then plays the tile. | 3 |
| V28 | **Given** reduce-motion, **then** the page slide becomes a **cross-fade of the same duration** (300 / 420 ms), and the page sound is unchanged — it is what carries "the board moved" when direction is lost. | 3 |
| V29 | **Given** the app in any state, **then** **no swipe, drag or pan gesture changes the page**, and `react-native-gesture-handler` is still absent from the manifest. | 1 |
| V30 | **Given** a rail button is tapped 30 times rapidly, **then** the board ends on the last-tapped page, no slide is left half-finished, no residual transform remains, and no audio piles up. | 3 |
| V31 | **Given** a tile is tapped and the board auto-advances, **when** his finger is still down, **then** nothing on the new page is seated by that same touch. | 3 |
| V32 | **Given** `node tools/layout-sweep.mjs`, **then** it verifies a page plan for **both** packs at every served viewport and exits 0. **Measured 2026-09-23, revision 5: 982,566 plans, 34,463,217 layouts, 0 failures, fixpoint converging in 0 steps.** *(RESTATED — revision 4's numbers were 979,350 / 34,445,462 / 1 step.)* | 4 |
| V33 | **Given** the sweep, **when** `pagePlan` is made to drop each run's remainder, **then** it exits **1** naming **F12**. *(Verified: fails at 360 × 600 with pages `8,8,8,11,11,11,6`.)* | 4 |
| V34 | **Given** the sweep, **when** the rail-wrap check in the fixpoint is disabled, **then** it exits **1** naming **F9p**. *(Verified.)* | 4 |
| V35 | **Given** a viewport that cannot build a page plan for the chosen pack, **then** the screen-too-small card is shown **for that language**, and the parent can switch to the other language through the gate rather than being stuck. | 3 |

## X · The word strip, spans and the boundary (revision 5)

**A new group, and it applies to both languages.** The strip is now a component with its own
geometry (F4/F15/F16/F17), its own motion (M22–M24) and its own failure modes. `ui.md` §7.2 is
the specification; `node tools/layout-sweep.mjs --pages` prints the strip any device will lay
out.

**The one-sentence version a tester should hold:** *cells never merge, the bar says what is one
sound, and there are exactly two ways something can be missing.*

### X1–X9 · Geometry

| # | Given / When / Then | Tier |
|---|---|---|
| X1 | **Given** any board, **then** the strip reserves **six** cell slots, sized once at startup, **identical in both languages** and independent of the word being built. | 4 |
| X2 | **Given** any board, **then** only the **used** slots are drawn: *n* filled cells plus at most one dashed cell. An unused slot renders nothing — no outline, no dot, no placeholder. | 3 |
| X3 | **Given** a word being built, **then** the drawn cells are **left-aligned from a fixed origin** and **no cell that is already filled ever moves, resizes or reflows** when another is added. | 3 |
| X4 | **Given** any served viewport, **then** `stripCellW ≥ 40`, `stripFont ≥ 34` and `stripRowW ≤ tableW`. *(P18 measures the tightest case: 48 × 61 and 39 pt at the 360 × 600 floor.)* | 4 |
| X5 | **Given** an **iPhone 17 Plus** (430 × 932), **then** the strip is 106 pt tall with six 58 × 90 cells, an 8 pt gap and a 47 pt glyph. | 4 |
| X6 | **Given** any word in either shipped pack, **then** its letter count is **≤ 6** and it fits the strip with no clipping, no ellipsis and no horizontal scroll. | 2 |
| X7 | **Given** a pack containing a word of **7 or more letters**, **then** the validator rejects it at save time with a renderable reason, and `tools/layout-sweep.mjs` exits 1 naming **F17**. | 2 |
| X8 | **Given** the editor, **when** she saves a word longer than six letters, **then** the *Too long for the board* screen (`ui.md` §13.3a) is shown, **the word is still saved** with its picture and recording under *Chưa chơi được*, and the strip is **drawn to scale with the extra letter falling off the end**. | 3 |
| X9 | **Given** the strip, **then** it is **one touch target**, not six, and no criterion anywhere requires a strip cell to be 72 pt. | 3 |

### X10–X19 · The span bar — one sound, one bar

| # | Given / When / Then | Tier |
|---|---|---|
| X10 | **Given** letters that form **one sound**, **then** they share **one continuous bar** spanning all their cells; **given** letters in different sounds, **then** each sound has its **own** bar with a visible break between them. | 3 |
| X11 | **Given** any state of the strip in either language, **then** **no two cells are ever merged into one.** A `c` cell and an `h` cell never become a `ch` cell. | 3 |
| X12 | **Given** `c` is seated and `h` is tapped, **then** M22 fires: the span bar reveals by **`scaleX` anchored at its left edge over 220 ms**, from the one-cell extent to the two-cell extent. No width, height or layout property is animated. | 3 |
| X13 | **Given** the same tap, **then** M23 fires: **both cells pulse together** — one `scale` 1 → 1.08 → 1 over 260 ms on the span container — beginning on the first audio frame of the replacing clip. | 3 |
| X14 | **Given** M23, **then** **no cell takes the `reward` gold.** The re-voice is scale and opacity only; gold is reserved for the chant. | 3 |
| X15 | **Given** `c` is seated and a **vowel** is tapped instead, **then** M24 fires: a **second** bar appears in the other colour and pattern, and a divider fades in — the visual opposite of X12. The two outcomes are never confusable. | 3 |
| X16 | **Given** a consonant span, **then** its bar is **solid `role1Edge`**; **given** a vowel/rime span, **split `role2Edge`**; **given** a placed tone, **a dotted `role3Edge` segment joining the vowel span**. | 3 |
| X17 | **Given** `g` is seated and `i` is tapped (or `q` and `u`), **then** the letter joins the **onset** span with a **solid** bar and **no divider appears**, even though that letter's table tile carries a vowel bar. | 3 |
| X18 | **Given** the strip is tapped and a letter returns, **then** its span bar shrinks back by `scaleX` anchored left over 220 ms if other letters remain in that span, or is removed with its divider if it was the only one. | 3 |
| X19 | **Given** an English word, **then** **every** sound boundary carries a divider — `ship` is `s h ┃ i ┃ p`, three spans and two dividers — where Vietnamese carries **exactly one**, at the onset/rime boundary. | 3 |

### X20–X26 · The boundary

| # | Given / When / Then | Tier |
|---|---|---|
| X20 | **Given** the first rime letter is seated in Vietnamese, **then** the boundary is marked by **three** simultaneous channels: the bar **breaks** (a 10 pt gap), the bar **changes pattern and colour**, and a **2 pt divider** fades in over 180 ms. | 3 |
| X21 | **Given** the boundary appears, **then** **no cell moves, resizes or changes contents** to produce it. | 3 |
| X22 | **Given** the divider, **then** it is 2 pt wide, 0.5 × cell height, `neutralFace`, centred in the cell gap, and measures **≥ 3.0:1 against the ground** in all three themes. | 2 |
| X23 | **Given** the board rendered in greyscale, **then** the onset/rime boundary is still visible, by the bar break and the divider alone. | 3 |
| X24 | **Given** a Vietnamese word with a zero onset (`áo`), **then** **no divider is drawn at all** — there is no onset to divide from. | 3 |
| X25 | **Given** any building state, **then** there is **no hairline between cells that are not a sound boundary**. Revision 4's per-cell dividers are gone; a line between two letters means one thing only. | 3 |
| X26 | **Given** chant beat 3 and **only** chant beat 3, **then** the divider dissolves and the cells close up their gaps (M10), each translating left by `k × gap` with the leftmost cell not moving. **This is the only merge in the app and it happens after the word is already made.** | 3 |

### X27–X33 · Two ways something can be missing

| # | Given / When / Then | Tier |
|---|---|---|
| X27 | **Given** a state in which **a letter** can follow, **then** a **dashed next-cell with a centred dot** is drawn to the right of the last filled cell. | 3 |
| X28 | **Given** a state in which **a tone** can be placed, **then** a **dashed mark-slot is drawn above the carrier vowel's glyph** — and **no extra cell is added**, because the mark lands on the rime, not in a cell of its own. | 3 |
| X29 | **Given** the prefixes `b`+`o`, `c`+`a` and `m`+`u`, **then** **both** affordances are drawn at once. *(These are the three points in `vi-seed` where a letter and a tone are live simultaneously — `literacy-vi.md` §0.7.)* | 3 |
| X30 | **Given** a completed word, **then** **neither** affordance is drawn: no dashed cell, no mark-slot. | 3 |
| X31 | **Given** an English board, **then** the **mark-slot never appears** and only the dashed next-cell is used. | 3 |
| X32 | **Given** the dashed next-cell, **then** it is **not a character**: it is not in the table, has no clip, and tapping it does nothing beyond the strip's undo. | 3 |
| X33 | **Given** the mark-slot, **then** it is `neutralFace` on `surface`, ≥ 3.0:1, fades in over 180 ms by opacity only, and disappears the instant the rime stops being complete. | 3 |

### X34–X40 · What a toddler does to the strip

| # | Given / When / Then | Tier |
|---|---|---|
| X34 | **Given** the strip is tapped six times in 400 ms with six symbols seated, **then** six symbols return in order, six clips play (each cutting the last), and the strip ends empty and consistent. | 1 |
| X35 | **Given** an **empty** strip is tapped, **then** nothing happens and **no sound plays**. | 3 |
| X36 | **Given** the strip is held for 800 ms, **then** the **parts hint** fires (§2.2) and **nothing is returned**. The two strip gestures are tap = undo, hold = say what I have, and there is no third. | 3 |
| X37 | **Given** a letter is tapped and the strip is tapped within 120 ms, **then** the letter seats and is then returned, both sounds play, and the board ends in the pre-tap state. | 3 |
| X38 | **Given** `c` `h` is in the strip and the strip is tapped once, **then** the clip played is **`cờ`** — the unit that remains — not `hờ`. | 3 |
| X39 | **Given** a five-letter word being built, **then** at no point does a filled cell move, and the sixth slot is never drawn until a sixth letter or a dashed cell occupies it. | 3 |
| X40 | **Given** reduce-motion is on, **then** M22 becomes a **220 ms opacity cross-fade** to the longer bar, M23 becomes an **α 1 → 0.75 → 1 pulse on both cells together**, M24 and the mark-slot are unchanged (already opacity), and M10 becomes a 240 ms cross-fade. **All durations are unchanged, so audio sync and every criterion above still hold.** | 3 |

---

## W5 · Revision 5 — what the alphabet did to revision 4's ids

**Ids are never reassigned.** The **restated** ones are the dangerous ones: a test citing them
still compiles and now asserts something else.

### Restated — same id, different assertion

| id | Revision 4 asserted | **Revision 5 asserts** |
|---|---|---|
| B2 | the table is `[onsets][rimes][tones]` / `[letters][digraphs]` | `[29 letters][6 tones]` / `[26 letters]` |
| B2b | all **three** runs on screen at once | **two** runs |
| B2g | the empty-strip live set is onsets + zero-onset rimes | the **19 letters** that begin a word |
| B2i | a run boundary is marked by solid → split → dotted | solid and split **interleave within** the letter run; only the tone run is dotted |
| C1 | three runs, three-cell strip | two runs |
| C4 | a live **onset** seats | a live **letter** seats |
| C5 | the tone carriers swap when the rime tile is tapped | they swap on the letter that **completes** the rime |
| C10, C11 | tap a strip **cell** to return it and everything after it | tap **the strip** to return **one** symbol |
| D1 (glyph case) | English tiles render lowercase `a`–`z` | **uppercase `A`–`Z`**, from a pack field (D17, D21) |
| C15 | onset/rime/tone → role1/role2/role3 | consonant/vowel/tone → role1/role2/role3 |
| C18 | the `ngh` **tile** is present and disabled | there is no `ngh` tile; `h` after `n` `g` is flat and says `ngờ` |
| C19 | `áo` is **two** taps | **three** |
| C21 | every onset, rime and tone is on the board (67) | all 29 letters and 6 tones (35) |
| D1 | alphabet **then digraphs** | alphabet **only** |
| D4, E8, E9 | per-cell undo | strip-wide undo, one symbol per tap |
| D5 | English vowel/consonant colours | the same rule, now in **both** languages |
| D12 | `ck ll ss ff zz ng x q` are present and disabled | the live-at-position-1 set is 15 letters; the flat 11 are named |
| D14 | a digraph tile renders two letters at 82% | **no tile anywhere renders more than one character** |
| N14 | a tap plays the tile's `short` clip | a tap plays the `short` clip **of the unit it builds**, superseding the previous one |
| P1, P5, P6, P6a, V3, V32 | revision 4's measured numbers | revision 5's measured numbers |
| S5 | onset/rime/tone → role1/role2/role3 | consonant/vowel/tone, both languages |
| S8 | greyscale over three runs, 60+ of 67 flat | greyscale over interleaved patterns, 29+ of 35 flat |

### Withdrawn outright

| id | Was | Withdrawn because |
|---|---|---|
| D14 (r4 form) | how to shrink a two-letter tile to 82% | there are no two-letter tiles. **The id survives as a prohibition** (D14 r5) rather than being retired, because a two-glyph tile creeping back is the single regression most worth catching |
| B2g (r4 form) | `áo` is started by tapping the rime tile `ao` | there are no rime tiles |

### Ids revision 5 does **not** touch, and that is the point

§A (launch, language, theme), §F (announcement and reveal), §G (no fail state and the idle
ladder), §H (shelf, album, ending), §I (parental gate), §J/§K/§L (the editor's list, add,
delete and recovery flows), §M (co-play), §O (motion law), §Q (typography and Vietnamese
rendering), §R (language isolation) and §T (what a toddler does) are **unchanged**. The board
changed; the product did not. `ui.md` §13.3a **adds** two editor screens (X8 and the confirm-
the-taps screen) without altering a single existing editor flow.

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

