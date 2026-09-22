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

## Still open

| # | Question | Blocking? |
|---|---|---|
| 1 | A free **Pexels/Unsplash key** — better photos, less curation | no |
| 2 | Should Vietnamese tiles adopt the English `"mờ, mèo"` sound+word form? | no |
| 3 | Anchor words are curriculum — `igloo` is meaningless to this child | no |
| 4 | **Stack not explicitly approved.** Assumed Expo / React Native / JavaScript, matching wildlife-shuffle, because the owner has that toolchain working and the process doc transfers | **flag** |
| 5 | Publish to a store, or stay private? Changes licensing and attribution obligations | no, but decide before Slice 6 |

---

## The rule this phase produced

**Amplitude is not intelligibility.** Two rounds of English audio were justified by a true
measurement — signal up more than tenfold — and rejected by the owner both times. Nobody on
this team can hear. Audio quality cannot be verified below Tier 5, and a number that
correlates with a property is not that property.

The general form, which applies well beyond audio: *when the thing you can measure is a
proxy for the thing you care about, say so out loud, and get the real check sooner.*
