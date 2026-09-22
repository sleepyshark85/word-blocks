# Settled decisions

What is closed, and what is still open. Anything here is a constraint for the team, not a
suggestion. Where the owner settled something by ear or by instruction, that is recorded as
his decision and is not to be relitigated.

Companion documents: `spike-results.md` (what was measured), `image-sourcing.md` (the photo
evidence), `literacy-vi.md` / `literacy-en.md` (the language models).

---

## Name

| Surface | Name |
|---|---|
| Product / store listing | **Ghép Chữ** |
| Vietnamese mode title | **Ghép Chữ** |
| English mode title | **Word Blocks** |
| Repository | `word-blocks` — github.com/sleepyshark85/word-blocks |

`ghép` = to join, `chữ` = letters. The two-name structure is the no-mixing rule applied to
the app's own title rather than fought: the mode's title is one more localised string, and
the repo slug is neutral. The owner said "use your suggested name" and created the
`word-blocks` repository in the same message; this reading takes both at face value and is
cheap to correct if it is wrong.

## Product

| | Decision | Source |
|---|---|---|
| Player | The owner's son, ~4, bilingual Vietnamese/English | owner |
| Second user | His mother, non-technical, maintains the word list | owner |
| **Language** | **Chosen at launch. Never mixes.** | owner, explicit |
| Vietnamese model | Onset + rime + tone (`âm đầu + vần + thanh`) | settled in discussion |
| English model | Letters carrying **sounds**, not names. CVC phonics | literacy-designer |
| Tile palette | Constrained per round — target word's tiles plus a few distractors | settled |
| Seed list size | ~45 Vietnamese, ~40 English. Ceiling ~60 | literacy-designer |
| Runtime network | **None.** No ads, no analytics, no IAP | owner intent |
| **Devices** | **iPhone, Android phone, iPad** (and Android tablet by implication) | owner |
| Content | Editable data. Mother adds/edits/deletes without a developer | owner, explicit |

## Audio — closed

| | Decision |
|---|---|
| **English letter sounds** | `edge-tts` / **`en-US-JennyNeural`**, **"sound + anchor word"** (`"kuh, cat"`), rate **`-35%`** |
| English clip pairs | `<letter>-long` on first touch, `<letter>-short` on repeat taps |
| **Vietnamese** | **gTTS** (`lang='vi'`), **natural speed** — owner picked `1.00x` over three slower options |
| Generated assets | `samples/audio/en-final/` (52 clips + manifest), `samples/vi-speeds/` |
| Piper | **Not used for any shipped asset.** Models remain on disk; nothing depends on them |
| Google Cloud TTS | **Rejected** — Vietnam billing demands a ~₫800,000 prepayment. Not a reasonable cost here |

**Speed is ours, not the API's.** `tools/timestretch.py` is a phase vocoder that stretches
time without touching pitch (verified: 0.864 s → 1.173 s, pitch 198.3 Hz → 198.3 Hz). It is
not needed at the current settings, and it exists so that "slower" is never again blocked by
a provider's fixed speeds. Resampling was rejected — it would drop the pitch with the speed.

## Images — decided, with an open upgrade

| | Decision |
|---|---|
| **Primary** | **Real photographs, several per word** (owner, explicit — overrode an emoji recommendation) |
| Source | Wikipedia **lead image** (~77% usable) + Commons category members (~30%) |
| Rejected | Openverse free-text search — ~28% usable, and returned unsafe results |
| Curation | **Every image reviewed by eye.** Tools assemble candidates; they do not choose |
| Fallback | Fluent Emoji 3D (MIT, 1,595 assets) where no acceptable photo is found |
| Override | Any word's picture can be replaced — best of all is the mother's own photo of the real object |
| Vietnamese mode | Source from **vi.wikipedia.org** — a Vietnamese child should see a Vietnamese bus |

## Visual system — decided

Owner brief, verbatim: **"bright and fun. Don't use depressing color/design."** Nothing
carries over from wildlife-shuffle, which shipped a dark theme on `#16212C`.

Three palettes were pitched as a visual preview rather than described in hex
(https://claude.ai/artifact/RFy3M24jV2GbwCvqTwWhYL). The owner chose **all three**.

| Theme | Ground | Character |
|---|---|---|
| **Popsicle** — **default** | `#E9FBF2` mint | Ice-lolly brights. Most contemporary |
| Sunshine | `#FFF7EA` cream | Sunset hues, warmest, picture-book |
| Playground | `#E6F3FF` sky | True primaries, highest energy |

Requirements this creates, all owned by the game-designer:

- **Token sets, nothing hardcoded.** A colour literal in a component is a bug — right in
  one theme, wrong in two.
- **An automated contrast sweep over every (theme × surface × foreground) pair.** Three
  themes triples this work and it is exactly the work that silently does not get done.
  wildlife-shuffle shipped a cosmetic whose colour table had never been checked against the
  ground it rendered on, and had to write a sweep after the fact.
- **Vietnamese role-colour semantics must hold in all three.** Onset, rime and tone each
  carry a hue that *means* something; in every theme those three must be mutually
  distinguishable, with the role→slot mapping constant even as the hex changes. If a theme
  cannot supply three distinct role hues on its ground, the theme changes, not the rule.
- Theme choice persists in **AsyncStorage — settings only.** Content stays on the filesystem.

**Typography:** *Be Vietnam Pro* for text, *Fredoka* for tiles and words. Be Vietnam Pro is
drawn for Vietnamese, which is a correctness requirement here rather than a taste one —
`mả` and `mã` differ only by a mark, and stacked forms (`ươ`, `ề`, `ỹ`) must render rather
than be inherited from whatever an Android OEM ships.

**Colour does work in Vietnamese mode.** A syllable is onset + rime + tone, and each part
carries a consistent hue so the child sees the structure before he can articulate it.
English has one tile type, so colour there plays rather than labels — an asymmetry the
game-designer must justify or remove in `ui.md`.

## Stack — decided

**Expo / React Native / React, JavaScript (not TypeScript)** — the wildlife-shuffle stack.
The reasons are about the owner rather than the technology: the toolchain works, the EAS
account exists, a build has already been through TestFlight, and the process doc, hygiene
rules and all five agent definitions assume it. Nothing this app needs is outside React
Native's reach.

**Deliberate subtraction: no `react-native-reanimated`, and no `react-native-gesture-handler`.**

Reanimated's worklet serialization caused the defect that crashed wildlife-shuffle's first
TestFlight build on the very first row clear — a crash that 375 tests and every browser run
were *structurally incapable* of catching (that project's `docs/development-process.md`
§6.9). This app needs far less motion than a falling-block puzzle: tiles that press, a word
that assembles, a picture that reveals. React Native's built-in `Animated` covers that, and
dropping the dependency removes the entire defect class rather than defending against it.
Gesture-handler goes too — this app is taps, not drags. The game-designer may argue for
Reanimated if its motion spec genuinely requires it, as a cost to justify rather than a
default.

### Manifest changes from wildlife-shuffle

| Add | For |
|---|---|
| `expo-file-system` | content packs on disk — the editable-data requirement itself |
| `expo-image-picker` | the mother choosing or taking a photo |
| `expo-audio` | playback **and** her voice recordings |
| `expo-localization` | a sensible default language at first launch |

**Keep:** `expo`, `expo-splash-screen`, `expo-status-bar`, `expo-system-ui`,
`react-native-safe-area-context`, `react-native-web` (Tier 3), `async-storage` — settings
only; **content goes to the filesystem, never to AsyncStorage**.

**Drop:** `react-native-reanimated`, `react-native-gesture-handler`. `expo-haptics` is the
game-designer's call.

### Two constraints the device list creates

1. **A Vietnamese-capable font must be bundled, not inherited.** iOS renders Vietnamese
   diacritics well; Android varies by OEM. A dropped or misrendered tone mark is a
   **correctness** failure here — `mả` and `mã` differ only by that mark, and an OEM font
   that renders them alike would silently teach the child the wrong thing.
2. **Android fragmentation is the real layout constraint, not iPhone.** Fit must be a
   testable rule across a continuous range, not three named devices.

## Still open

| # | Question | Blocking? |
|---|---|---|
| 1 | A free **Pexels/Unsplash key** — better photos, less curation | no |
| 2 | Should Vietnamese tiles adopt the English `"mờ, mèo"` sound+word form? | no |
| 3 | Anchor words are curriculum — `igloo` is meaningless to this child | no |
| 4 | Tablet vs phone: which is the *primary* form factor, and orientation policy | designer to decide |
| 5 | Publish to a store, or stay private? Changes licensing and attribution obligations | no, but decide before Slice 6 |

---

## The rule this phase produced

**Amplitude is not intelligibility.** Two rounds of English audio were justified by a true
measurement — signal up more than tenfold — and rejected by the owner both times. Nobody on
this team can hear. Audio quality cannot be verified below Tier 5, and a number that
correlates with a property is not that property.

The general form, which applies well beyond audio: *when the thing you can measure is a
proxy for the thing you care about, say so out loud, and get the real check sooner.*
