# The content pipeline — pack format, storage, assets, licensing

Owner: content-engineer. Companion to `decisions.md` (what is closed), `word-list.md` and
`literacy-vi.md` / `literacy-en.md` (what the content *is*), and `image-sourcing.md` (the
photo evidence).

**The requirement this whole document exists to satisfy:** content is not compiled in. A
word — its spelling, its decomposition, its pictures, its sounds — is data in a directory
on the phone, editable at runtime by a non-technical adult. A bundled seed pack is copied
out on first launch and is thereafter just another pack. If adding a word needs a rebuild,
this has failed.

Everything below was executed. Byte counts are measured, not estimated; the numbers that
are projections are labelled as projections and the per-unit measurement they rest on is
shown.

**Revision 5, 2026-09-23 — read §3.7 and §3.8 with §3.1–§3.3.** The owner played the built app and
asked for the standard alphabet as the character table, entering a digraph letter by
letter; he separately ruled that **English tiles are uppercase** (§3.8). The pack format
changed in five places and **nothing already in a pack was
invalidated**: `inventoryOrder` became `{ letter, tone }`, every word gained a derived
`letters` (and Vietnamese an `onsetLetterCount`), Vietnamese gained a `prefixAudio`
section of ten clips, the two tile inventories were put into dictionary order, and both
manifests gained `display.glyphCase`. The
model — `{onset, rime, tone}` in Vietnamese, `tiles` in English — **did not change at
all**, which is why this is a rebuild and not a migration. Priced in §10: **+54.6 KiB to
`vi-seed`, +1.6 KiB to `en-seed`.**

---

## 0. Decisions, in one table

| Question | Decision | Why, in one line |
|---|---|---|
| Pack granularity | **One pack per language**, a directory | The other language is not in the process, not merely in another field |
| Word storage | **One JSON file per word** | A stray comma costs one word out of fifty, not fifty |
| Media naming | **Content-addressed**: `media/img/<16 hex>.jpg` | A word can never see a file's bytes change under it |
| Media reference | A **pack-relative path** under `media/` | One resolution path; a dropped-in file works too |
| Images per word | **1 min, 3 target, 6 max**; `images[0]` is the prototype | Exemplar variety teaches the category; curation is the cost |
| Which image is shown | prompt always `images[0]`; reveal cycles `images[1..n-1]` | A *different* photo on the reveal is what makes several images load-bearing |
| Missing image | fallback emoji → else **withhold the word** | The child meets a different word; he never sees a hole |
| Missing word audio | **withhold the word** | The chant has no final step, and the final step is the payoff |
| Missing tile audio | **silent tile**, round proceeds | Tile clips are shared; withholding would empty the game |
| Recording vs TTS | **one import path, one object shape** | Interchangeable by construction, not by convention |
| Writes | temp file → `fsync` → `rename` → `fsync` dir; word file **last** | A crash leaves an orphan blob, never a broken word |
| Newer schema | **read-only**, refuse to write | Never silently drop fields she cannot see |
| Backup | **a zip of the directory**, verified on write | The backup *is* the pack; she is not locked in |
| Image master | **512×512 JPEG q82**, 4:2:0, progressive, stripped | 51 KB measured; EXIF and GPS removed |
| Audio | **mp3 24 kHz**, not re-encoded | No ffmpeg needed, and none is wanted |
| Engine padding | **cut at generation time, losslessly, by dropping MP3 frames** | edge-tts pads 1.6 s of silence onto every clip; §9.3a |
| Clip duration | **a budget in the manifest, enforced against the bytes** | `ui.md` E15. A budget nothing enforces is a sentence in a document |
| The board (rev 5) | `inventoryOrder` is **`{ letter, tone }`** — the standard alphabet | The owner: the old table "feel really random and un-organized" |
| The model (rev 5) | `tiles` and `syllables` **unchanged**; they are no longer the board | A digraph is two taps and still one unit |
| Letter stream (rev 5) | **stored** as `letters` + `onsetLetterCount`, never derived at runtime | `gì` is `gi` + `i` written with one `i`; letters cannot express that |
| Partial units (rev 5) | **`prefixAudio`**, derived from the inventory | `p`, `q` and eight rime prefixes are states no tile speaks for |
| Glyph casing (rev 5) | **`display.glyphCase`** — `en` upper, `vi` lower (§3.8) | The owner's answer to Q7. Nested so D20's boundary is structural |
| A Vietnamese pack set to upper | **error, until the render fixture covers it** | Q13. A font containing `Ẫ` is not a gate that has drawn it |

---

## 1. Why one pack per language

`word-list.md` §1 already settled that the two word lists are independent. What was left
was whether they live in one file with a `language` column or two directories. **Two
directories**, and the argument is not aesthetic.

With a `language` column, every read is `words.filter(w => w.language === lang)` and the
no-mixing rule is defended by one predicate repeated at every call site. Get it wrong
once — a `?? words[0]`, a `find` that falls through, an off-by-one in a shuffle — and a
Vietnamese child is shown `cat`. `development-process.md` §4 names exactly this as what
the tester hunts.

With two directories the runtime opens one. The other language's words are never parsed,
never in memory, never reachable. **The cheapest defence is absence.** The validator
enforces it from the other side too: a word file containing `language`, or containing the
other language's decomposition shape, is an error (`tools/pack-validate.test.mjs`,
"the language boundary" — 5 cases).

The manifest shape also differs, so a shared row would save nothing at the top level
anyway: Vietnamese has `tiles.onset / .rime / .tone`, English has `tiles.letter`.

**What it costs, priced.** The mother's photograph of their actual cat must be imported
into both packs if she wants it on `cat` and on `mèo`. At three images across roughly 20
overlapping concepts that is 20 × 3 × 51,200 B ≈ **3.1 MB of duplication**. That is the
entire price of the safety property, and it is 3.1 MB.

**`assetConcept` saves the curation, not the bytes** — and curation is the binding
constraint (`word-list.md` §2: *every word carries a QA cost*). One human looks at one
contact sheet for "cat" and the result is written into both packs. Per `word-list.md` §1
it is a **build-time key**, which is why it lives under `build` (§3.3).

---

## 2. Layout on disk

```
packs/                                   app's writable documents directory
  vi-seed/                               pack id == directory name
    pack.json                            manifest: schema, language, tiles, rules
    pack.json.bak                        the previous good manifest
    words/
      meo.json                           ONE FILE PER WORD
      cho.json
      pho.json
      …
    media/
      img/cc8b6704d613c6ae.jpg           content-addressed: sha256(bytes)[0:16]
      aud/0a6770f4211c8014.mp3
    quarantine/                          word files that would not parse (§6)
    ATTRIBUTION.md                       generated, never hand-edited (§11)
    .candidates/                         curation scratch; excluded from backups
  en-seed/
    …
```

### Why one file per word

`development-process.md` §4: *never let one bad entry take down the pack*. A single
`words.json` array cannot deliver that — one syntax error anywhere loses all fifty. One
file per word makes both parsing and quarantine per-entry, and it makes a save touch only
the word being saved.

Measured, by execution: a copy of `packs/en-seed` with a trailing comma injected into
`words/cat.json` validates as **40 words, 39 enabled, 39 playable, 1 UNREADABLE**
(`tools/pack-validate.test.mjs`, "the stray-comma case"). The other 39 are intact and
playable.

### `--strict` counts photographs, not fallbacks

A word with no photograph but a Fluent Emoji fallback *is* playable, and the validator
counts it so. It is not *curated*, and `--strict` means "ready for a child", so each such
word raises a warning and the summary reports `N photographed` alongside `N playable`.
Without that, a pack where nobody had looked at a single picture passed `--strict` clean
— because `decisions.md` made photographs primary and the emoji the thing you fall back
to, a pack running entirely on fallbacks is a pack where the work has not started.

The cost is 50 file opens on launch instead of one, and 875 B/word of JSON in Vietnamese
(measured; 648 B in English). Both are noise next to one 51 KB photograph.

### A pack directory is not the size of a pack — `.candidates/` is 98% of it

**A pipeline hazard, recorded because it cost a session.** `packs/en-seed` is **457 MB on
disk**, and the pack is **7.4 MB** of that. The other 449 MB is `.candidates/`: raw
downloads, contact sheets and the fetch cache from curation.

| | `en-seed` | `vi-seed` |
|---|---|---|
| the pack (manifest, words, media) | 7.4 MB | ~10 MB |
| `.candidates/` scratch | **449 MB** | **488 MB** |

So **anything that copies a pack must exclude it.** The validator harness did not: it
makes ~28 fixture copies per run, which is 13 GB per run, and sixteen abandoned runs put
375 GB on the root filesystem and left 532 KB free — at which point every command in the
session started failing for reasons that pointed nowhere near a test. `copyPack()` in
`tools/pack-validate.test.mjs` now filters `.candidates`, `.tmp-audio` and `.trash`
(fixture: 457 MB → **7.4 MB**), and an `after()` hook removes the work directory **even
when a test throws** — verified by throwing one deliberately and confirming zero
leftovers. A test that leaves 26 GB behind is a defect in the test.

**Do not "fix" this by deleting `.candidates/` from the real packs.** It is gitignored and
it is not in the app bundle, but it is load-bearing for reporting: clearing it between
fetch runs is exactly what silently erased the curation-yield statistic once already
(§9.2, "The denominator lives in the pack, not in the scratch"). The repair there was to
write `build.fetched` onto the word; the scratch is still read when present, because it is
what lets images imported before `rank` existed be matched back by title.

`.candidates/` is excluded from backups (§8) for the same reason.

### Why media is content-addressed

The file name is the first 16 hex characters of the SHA-256 of its own bytes — 64 bits,
so at 10⁴ blobs the collision probability is about 2.7 × 10⁻¹². This buys four things at
once:

1. the same photograph imported twice is stored once;
2. a word file can never see a media file's bytes change underneath it, because changed
   bytes are a different name;
3. a half-written blob has the wrong name and is therefore simply never referenced;
4. backup and restore are idempotent file copies.

Observed in the seed build: 147 Vietnamese audio references resolve to 145 files, because two
generated clips came back byte-identical. (`c` and `k` both say `cờ`, `g` and `gh` both
say `gờ` — `literacy-vi.md` §2. gTTS is not byte-deterministic, so this is a bonus, not a
guarantee.)

She never sees a hash. The editor shows pictures; the hash is a file name.

**A reference is a path, not a hash.** The runtime resolves `media/img/<name>.jpg`
relative to the pack and does not care how the name was chosen. So a technical person can
drop `media/img/our-cat.jpg` into the directory by hand and reference it, and it works.
Content addressing is the *importer's naming convention*, not a second lookup mechanism.

---

## 3. The format

### 3.1 `pack.json` — the manifest

Real, from `packs/vi-seed/pack.json`, with the 67 tiles elided to three examples.

```jsonc
{
  "schema": 1,                    // integer. > app's SCHEMA => open READ-ONLY (§7)
  "id": "vi-seed",                // == directory name, /^[a-z0-9][a-z0-9._-]{0,63}$/
  "language": "vi",               // THE ONLY PLACE A LANGUAGE APPEARS. No word carries one.
  "name": "Ghép Chữ",             // what she sees in the pack list
  "revision": 1,                  // bumped on every manifest write
  "origin": "seed",               // "seed" | "user" | "restored"
  "dialect": "unset",             // northern | southern | unset — open-questions.md Q1

  "generator": {                  // provenance; nothing reads this at runtime
    "tool": "tools/build-seed-pack.mjs",
    "builtAt": "2026-09-22T17:13:19.022Z",
    "sources": ["docs/design/word-list.md", "docs/design/literacy-vi.md"],
    "audio": { "engine": "gtts:vi", "generatedAt": "2026-09-22T17:48:26.384Z" }
  },

  "media": {                      // the degradation policy, as DATA (§5)
    "onMissingImage": "fallbackEmoji-then-withhold",
    "onMissingWordAudio": "withhold",
    "onMissingTileAudio": "silent",
    "imagesPerWord": { "min": 1, "target": 3, "max": 6 },
    "image": { "format": "jpeg", "size": 512, "quality": 82 },
    "audio": { "format": "mp3", "sampleRate": 24000 }
  },

  "rules": {                      // literacy-vi.md §4.1 and §6.1, as DATA
    // Sets that must never appear together in one palette. The round generator READS
    // this; it does not hard-code it. Changing `dialect` changes this list, and the
    // validator rejects the pack if the two disagree — so the dialect cannot go stale.
    "neverTogether": [["c","k"], ["g","gh"], ["ng","ngh"],
                      ["d","gi","r"], ["s","x"], ["ch","tr"], ["hoi","nga"]],
    "note": "literacy-vi.md §4.1, §6.1"
  },

  "chant": {                      // literacy-vi.md §7.2 — starting values, tunable
    "gapsMs": { "onset": 250, "rime": 250, "blend": 400, "tone": 250, "word": 600 },
    "skipToneStepFor": ["ngang"]  // §5.3: a ngang word has no tone-naming step
  },

  // REVISION 5 — see §3.7. What the CHILD sees: 29 letters then 6 tones, generated.
  "inventoryOrder": { "letter": ["a","ă","â","b", "…28 more…"],
                      "tone":   ["ngang","huyen","sac","hoi","nga","nang"] },

  // REVISION 5 — see §3.7. The ten reachable states that are not tiles: `p`, `q`, and
  // the eight pass-through rime prefixes. Derived from `tiles`, not listed by hand.
  "prefixAudio": { "onset": [ /* p, q */ ], "rime": [ /* ac an ă ăn â uô ư ưn */ ] },

  // What the EDITOR offers HER — the model, in Vietnamese dictionary order. NOT the board.
  "tiles": {
    "onset": [
      { "id": "m", "glyph": "m",
        "label": "mờ",            // §5.3: EDITABLE. "không dấu" can replace "ngang" here.
        "audio": { "name": { "src": "media/aud/0a6770f4211c8014.mp3", "bytes": 6528,
                             "ms": 816, "engine": "gtts:vi", "text": "mờ",
                             "voice": null, "by": null,
                             "addedAt": "2026-09-22T17:21:02.748Z" } },
        "source": "literacy-vi.md §2" }
    ],
    "rime": [
      { "id": "eo", "glyph": "eo",
        "legalTones": ["ngang","huyen","sac","hoi","nga","nang"],   // §5.2
        // §5.4: all six forms, stored. Composition happens ONCE, in the editor, in front
        // of a human. No runtime code places a tone mark.
        "toned": { "ngang":"eo", "huyen":"èo", "sac":"éo",
                   "hoi":"ẻo",  "nga":"ẽo",  "nang":"ẹo" },
        "audio": { "name": { "src": "media/aud/73f01c1b33e6340c.mp3", "…": "…" } } }
      // a stop-final rime stores nulls, and its tone row is 2 tiles, not 6:
      // { "id": "ach", "legalTones": ["sac","nang"],
      //   "toned": { "ngang":null, "huyen":null, "sac":"ách",
      //              "hoi":null, "nga":null, "nang":"ạch" } }
    ],
    "tone": [
      { "id": "huyen", "glyph": null, "label": "huyền", "mark": "̀",
        "audio": { "name": { "src": "media/aud/00db080609380205.mp3", "…": "…" } } }
    ]
  }
}
```

An English manifest is the same shape with `tiles.letter` instead, each tile carrying
`kind` (`vowel` | `consonant` | `digraph`), `position` (`any` | `initial` | `final`),
`sound`, `anchor` and `audio.long` / `audio.short` (`decisions.md`: long on first touch,
short on repeat taps).

### 3.2 A word — Vietnamese

Real, from `packs/vi-seed/words/pho.json`, images abbreviated to one.

```jsonc
{
  "id": "pho",                    // opaque, stable, ascii. NEVER recomputed from the text.
  "text": "phở",                  // THE SPELLING IS DATA (literacy-vi.md §1.2).
                                  // The engine never composes it and never places a mark.
  "stage": null,                  // earliest stage; null = not yet placed
  "enabled": false,               // withheld from the round generator, visible in the editor
  "disabledReason": "no picture yet (word-list.md §4 appendix)",

  // literacy-vi.md §1.1 — an ARRAY from day one, though v1 only ever writes one entry.
  // Adding `máy bay` later is then two instances of the same machine, not a migration on
  // a live pack on her phone.
  "syllables": [ { "onset": "ph", "rime": "ơ", "tone": "hoi" } ],
                                  // onset: null for the zero onset (`ong`, `áo`)

  // REVISION 5, DERIVED from the line above and stored — see §3.7. The board is the
  // 29-letter alphabet, so the child taps `p`, `h`, `ơ` and then the tone; the
  // onset/rime boundary is DATA and is never re-derived at runtime.
  "letters": ["p", "h", "ơ"],
  "onsetLetterCount": 2,

  "fallbackEmoji": null,          // a Fluent Emoji 3D asset name, or null. NOT a pack
                                  // media ref — see §5.

  "images": [ /* §3.4 */ ],

  "audio": {
    "word":  { "src": "media/aud/0777da50992cc17e.mp3", "bytes": 6912, "ms": 864,
               "engine": "gtts:vi", "voice": null, "text": "phở", "by": null,
               "addedAt": "2026-09-22T17:21:44.531Z" },
    // literacy-vi.md §7.2 step 3: onset+rime joined, no mark yet. Omitted for a `ngang`
    // word, where step 3 already IS the word.
    "blend": { "src": "media/aud/e2974ad478585fc6.mp3", "text": "phơ", "…": "…" },
    "sentence": null              // optional §7.2 step 6
  },

  // EVERYTHING UNDER `build` IS BUILD-TIME ONLY. word-list.md §1: "if assetConcept
  // appears in any code path that runs while the game is playing, that is a bug." The
  // nesting is the enforcement point — the pack loader strips `build` when it
  // materialises a word for the engine, so the tester can assert engine words have no
  // `build` key rather than auditing every read.
  "build": {
    "assetConcept": "a bowl of phở",
    "flags": ["PHOTO"],
    "note": "PHOTO — vi.wikipedia.org/wiki/Phở",
    "from": "word-list.md §4 Cultural vocabulary (appendix)",
    // How many candidates each stream OFFERED, written at the moment a human chose from
    // them. The denominator of the yield report (§9.2). It lives here rather than in the
    // candidate sheet because the sheet is scratch and scratch gets cleared.
    "fetched": { "lead": 1, "article": 4, "at": "2026-09-23T…" }
  }
}
```

### 3.3 A word — English

```jsonc
{
  "id": "cat", "text": "cat", "stage": 1, "enabled": true,
  "tiles": ["c", "a", "t"],       // literacy-en.md §1 — the SOUNDS. `duck` is ["d","u","ck"]
  "letters": ["c", "a", "t"],     // REVISION 5, DERIVED — what he TAPS. `duck` is d,u,c,k
  "fallbackEmoji": "Cat",
  "images": [],
  "audio": {
    "word": { "src": "media/aud/514d89c33ceaa3b1.mp3", "bytes": 13536, "ms": 2256,
              "engine": "edge-tts:en-US-JennyNeural@-35%", "text": "cat", "…": "…" },
    "sentence": null
  },
  "build": { "assetConcept": "cat", "family": "-at", "flags": [],
             "from": "word-list.md §5 Stage 1" }
}
```

English concatenates exactly, so the validator checks `tiles.join('') === text` as a hard
error. All 40 seed words pass.

### 3.4 The `images` array — the contract

**This is the shape to fill.** Every entry is an object. A bare path string is not
accepted, because the licence fields would have nowhere to live and an image whose licence
is unknown cannot be published.

```jsonc
"images": [
  {
    "src": "media/img/cc8b6704d613c6ae.jpg",   // REQUIRED. Pack-relative, under media/img/.
                                               // No "..", no absolute path, no backslash.
    "w": 512, "h": 512, "bytes": 34437,        // informational; the importer fills them

    "source": "vi.wikipedia.org",              // REQUIRED. Where it came from.
                                               //   "camera"     — she photographed it
                                               //   "own-work"   — the family's, another way
                                               //   "generated"  — ours
                                               //   anything else — somebody else's work,
                                               //                   and then the four fields
                                               //                   below are REQUIRED too.
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Ph%E1%BB%9F_b%C3%B2…jpg",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
    "creator": "Codename5281",
    "title": "Phở bò, Cầu Giấy, Hà Nội.jpg (vi.wikipedia.org lead image)",

    "rank": "article",                         // which fetcher stream offered it:
                                               // "lead" | "article" | "category".
                                               // Provenance only — never read at runtime.
                                               // The validator joins it against the
                                               // candidate sheet to report yield per
                                               // source, which is how a change to where
                                               // pictures come from gets measured.
    "caption": "Một giống chó lai",             // the source article's own words, if any

    "modified": "cropped to square, resized to 512px, re-encoded JPEG q82",
                                               // CC BY and CC BY-SA both require that
                                               // changes be indicated. We always change
                                               // the image, so this is always true and is
                                               // recorded rather than remembered.
    "addedAt": "2026-09-22T17:52:54.814Z"
  },
  { "src": "media/img/76ecf04f13289eae.jpg", "source": "commons.wikimedia.org",
    "license": "CC BY-SA 4.0", "creator": "Phương Huy", "…": "…" },
  { "src": "media/img/1ac735e3329c530a.jpg", "…": "…" }
]
```

**Validator rules, all of which have been seen to fail:**

| Rule | Severity |
|---|---|
| `src` present, safe, under `media/img/` | error |
| the file is on disk | **error** |
| the file's magic bytes match its extension | error |
| `source` present | error |
| `license`, `sourceUrl`, `creator` present when `source` is third-party | error |
| `modified` present when third-party | warning |
| licence contains `nd` / NoDerivatives | error — the pipeline crops |
| licence contains `nc` / NonCommercial | warning — publishing is still open |
| count outside `imagesPerWord` | warning |

**Order is the contract; there is no `primary` flag.** `images[0]` is the prototype. A
flag would admit two invalid states (no primary, two primaries); an array has neither.
Reordering is how the prototype changes — `pack-import-media.mjs --order 2,0,1`.

**No `alt` text and no caption.** The player is four and cannot read, and a caption under
a picture in a word game would teach him to read the caption instead of the word.

### 3.5 Audio objects

Identical shape wherever they appear — on a word, on a tile, generated or recorded:

```jsonc
{ "src": "media/aud/…mp3", "bytes": 6912, "ms": 864,
  "engine": "gtts:vi",          // or "edge-tts:en-US-JennyNeural@-35%", or "recording"
  "voice": null,
  "text": "phở",                // what was said — so a regeneration is reproducible
  "by": null,                   // who recorded it, when engine === "recording"
  "addedAt": "…" }
```

### 3.6 How a recording and a generated clip are interchangeable

Not by convention — by construction. Both go through `importAudio()` in
`tools/lib/media.mjs`, which is the only function in the codebase that writes to
`media/aud/`. They produce the same object with the same keys.

**`engine` is read by exactly one thing: the attribution generator.** Nothing in the
round generator, the chant or the player branches on it. So replacing a synthesised clip
with the mother's voice is one command and changes no code path:

```
node tools/pack-import-media.mjs --pack packs/vi-seed --word meo \
     --audio word=~/recordings/meo.m4a --by "mẹ"
```

The same is true of pictures: `importImage()` is the only writer of `media/img/`, and a
photograph from her camera roll differs from a Commons file only in the `source` string.
`-auto-orient` is applied (her portrait shots would otherwise land sideways) and `-strip`
removes EXIF, **including the GPS tag on her camera-roll photos** — a pack gets shared,
and it must not carry her home address.

### 3.7 Revision 5 — the board is the alphabet, the model is unchanged

The owner played the built app:

> the characters being displayed feel really random and un-organized and doesn't give my
> son a sense of character order in the table. Let's try this, display the full standard
> character table …

and then, when the first reading of that deleted the digraphs:

> for character combining, he will still going through character by character, event for
> combine ones like ch, tr …(Choose C and choose H …). This to keep the table consistent

`literacy-vi.md` §0.1 records that two confidently-argued designs were built from the
first message and **both were wrong**. The settled answer is **letter-by-letter input over
an unchanged đánh vần model**, and it lands on this format in exactly four places.

#### What changed

| | Revision 4 | **Revision 5** |
|---|---|---|
| `inventoryOrder` (vi) | `{ onset[26], rime[35], tone[6] }` | **`{ letter[29], tone[6] }`** |
| `inventoryOrder` (en) | `{ letter[36] }` — `a`–`z` then ten digraphs | **`{ letter[26] }`** — `a`–`z` |
| `tiles` | the board **and** the model | **the model only**, in dictionary order |
| word | `syllables` / `tiles` | **unchanged**, plus derived `letters` (+ `onsetLetterCount`) |
| tile audio | keyed on the **unit** | keyed on the **unit-state**; the ten non-tile states live in `prefixAudio` |

**Nothing was invalidated.** Every `{onset, rime, tone}` triple, every `tiles` array, every
photograph, licence field and clip in both packs survived the rebuild untouched —
`build-seed-pack.mjs` reports `preserved media on 50/50` and `40/40`. That is the whole
reason this is a rebuild and not a schema migration on a live pack on her phone (§7).

#### `inventoryOrder` — what the child sees

```jsonc
"inventoryOrder": {
  // literacy-vi.md §0.13 — the 29 letters, in the order the owner typed them.
  // f, j, w and z are not Vietnamese letters and are not on the board.
  "letter": ["a","ă","â","b","c","d","đ","e","ê","g","h","i","k","l","m",
             "n","o","ô","ơ","p","q","r","s","t","u","ư","v","x","y"],
  // §0.13, and the OWNER's answer to open-questions.md Q11, asked directly:
  // `ngang huyền sắc hỏi ngã nặng` — the set phrase, matching his son's book.
  // It shipped as `ngang sac huyen hoi nang nga`, which is frequency order.
  "tone": ["ngang","huyen","sac","hoi","nga","nang"]
}
```

English is `{ "letter": ["a", …, "z"] }` and has no tone run.

**It is generated now, and that is the point.** Both manifests carried a hand-written
list, which is how the shipped one came to be sorted by how many seed words sat behind
each symbol — the "really random" table the owner reported. A hand-edited ordering drifts
the moment the word list changes; a generated one cannot. `build-seed-pack.mjs` emits it
from `rules.mjs`'s `VI_ALPHABET` / `EN_ALPHABET` / `VI_TONE_IDS`.

**`inventoryOrder` entries are no longer tile ids.** A board cell is a *letter*: the string
is the glyph. This matters because six of the 29 Vietnamese letters (`ă â ô ơ ư y`… ) have
no tile of their own, and nothing is wrong with that — what a tap *says* depends on the
state it creates, not on the cell, so a per-letter tile would be the wrong home for audio
anyway.

**Three severities in the validator, deliberately.** A leftover `onset` / `rime` /
`digraph` run is an **error** (an un-migrated pack; the app would draw the revision-4
board). A missing, unknown or duplicated letter is an **error** — a letter that is not on
the board is every word containing it made unbuildable, which is the defect revision 4
actually shipped (22 of 47 words). A *different order* of the same letters is a
**warning**: it is her board and she may reorder it; she may not lose a letter from it.

#### `tiles` — what the editor offers her

`tiles` is now the model and the editor's vocabulary, and nothing else. It is ordered for
the adult who reads it, in each language's own dictionary order (`literacy-en.md` §0.7:
*follow each language's own dictionary order* — Vietnamese genuinely sorts `ch` after `c`
and English genuinely does not).

```
vi tiles.onset   b c ch d đ g gh gi h k kh l m n ng ngh nh ph qu r s t th tr v x
vi tiles.rime    a ach ai am anh ao at ay | ăng ăt | ân âu ây | e em en eo | ê | i im it
                 | o oa oi on ong | ô | ơ | u ua ui un uôi | ưa ưng
en tiles.letter  a … z, then ch ck ff gg ll ng sh ss th zz
```

Both Vietnamese lists are produced by **one comparator** over the 29-letter alphabet
(`rules.mjs` `viCollate`), not transcribed. `literacy-vi.md` §0.13 prints the two expected
lists, so those lists are a **test** of the comparator rather than its source, and
`pack-validate.test.mjs` asserts them character for character.

The ten English digraph **tiles and their clips stay** (`literacy-en.md` §0.9). They lost
their cells, not their existence: they are the sound decomposition a word is stored as,
and their clips are what a re-voiced second tap plays — `s` says /s/, then `h` makes it
say /ʃ/.

#### `letters` and `onsetLetterCount` — derived, stored, never recomputed

```jsonc
// packs/vi-seed/words/cho.json
"syllables": [ { "onset": "ch", "rime": "o", "tone": "sac" } ],   // THE MODEL — unchanged
"letters": ["c", "h", "o"],                                        // what he taps
"onsetLetterCount": 2                                              // where the onset ends
```

```jsonc
// packs/en-seed/words/duck.json
"tiles": ["d", "u", "ck"],          // THE SOUNDS — unchanged. Three sounds.
"letters": ["d", "u", "c", "k"]     // what he taps. Four taps.
```

> **The rule, and it is load-bearing: the onset/rime boundary is STORED, never derived at
> runtime.**

`gì` is onset `gi` + rime `i` written with a **single** `i` (§1.2, `literacy-vi.md` §0.5).
Its letters are `g` `i` and there is no way to see the rime in them. Nothing in the seed
list does this; his mother can type `gì` tomorrow. Deriving the boundary at runtime would
also be *composing a spelling*, which §1.2 forbids for the same reason.

The validator checks the two directions with different strengths, and the asymmetry is the
design:

| Rule | Severity |
|---|---|
| `letters` present, each entry exactly one character | error |
| every letter is on the board (`inventoryOrder.letter`) | **error** — otherwise the word is unbuildable |
| `onsetLetterCount` is an integer in `0 … letters.length` | error |
| `letters[0 … onsetLetterCount)` spells the stored onset | **error** — this is the boundary the engine will trust |
| the remainder spells the stored rime | error **unless** `build.spellingException` |
| English: `letters.join('')` is the spelling | error (English concatenates exactly) |

`build.spellingException` is the same opt-out §1.2 already gives the composed spelling, for
the same orthographic reason. A harness case writes a real `gì` and asserts **both**
directions: rejected without the flag, accepted with it. An escape hatch nobody has watched
open is not an escape hatch.

**Why word level rather than per syllable.** `syllables` is an array from day one (§1.1)
because it is *authored* data and reshaping it later would be a migration on her phone.
`letters` and `onsetLetterCount` are *derived*, so reshaping them is a rebuild, not a
migration — when polysyllables arrive they become per-syllable and no human work is at
risk. The cost of getting this wrong is asymmetric, and the two fields sit on the cheap
side of it.

#### `prefixAudio` — the states that are not tiles

Tile audio is re-keyed from units to **unit-states** (`literacy-vi.md` §0.12). `c` alone is
a state and says `cờ`; `ch` is a state and says `chờ`; every tap must answer (§0.9). Most
states are already tiles. Ten are not:

| | States | Why they cannot be tiles |
|---|---|---|
| onset | `p` `q` | Bare `p` and bare `q` are **never** Vietnamese onsets (§0.6). A tile is something a word can be built from, and §4 validates that |
| rime | `ac` `an` `ă` `ăn` `â` `uô` `ư` `ưn` | Pass-through states; no tone is ever live on them, and three are the bare vowels §3.1 says can never stand alone |

```jsonc
"prefixAudio": {
  "onset": [
    { "id": "p", "glyph": "p", "role": "onset", "label": "pờ",
      "extendsTo": ["ph"],
      "audio": { "name": { "src": "media/aud/da50713b9c96c96d.mp3", "ms": 624, "…": "…" } } },
    { "id": "q", "glyph": "q", "role": "onset", "label": "quờ",
      "extendsTo": ["qu"],
      "sameAs": "onset:qu",        // says exactly what the `qu` tile says — ONE blob, two refs
      "audio": { "name": { "src": "media/aud/d6901540d82cd85e.mp3", "…": "…" } } }
  ],
  "rime": [
    { "id": "ac", "glyph": "ac", "role": "rime", "label": "ac",
      "extendsTo": ["ach"], "needsListen": true,
      "audio": { "name": { "src": "media/aud/a9fbe2df135b01c5.mp3", "ms": 840, "…": "…" } } }
    // … an ă ăn â uô ư ưn
  ]
}
```

**It is derived, not listed.** `rules.mjs` `prefixStates(ids)` returns every proper prefix
of a symbol in `ids` that is not itself in `ids`; over the 26 onsets that is exactly
`p q`, and over the 35 rimes exactly `ac an ă ăn â uô ư ưn` — which is what
`literacy-vi.md` §0.12 says by hand. The validator re-derives the set and rejects a
pack that is missing one (**that tap would be silent**, which `gameplay.md` §4.3 forbids),
that lists one which is already a tile, or that invents one no word can reach. So the day
his mother adds a word with the onset `ngh`, `ngh`'s prefixes follow automatically.

**`sameAs` is derived too.** A prefix whose *one* extension already says exactly the same
thing does not need a clip: `q` says `quờ`, and so does the `qu` tile. `gen-audio.mjs`
copies the existing media object rather than synthesising a second `quờ` that could drift
from the first and be approved separately by ear. Media is content-addressed, so one blob
serves both references and it costs **zero bytes**. The rule is a comparison of labels, not
a hard-coded `q`.

**`needsListen` is the honest part.** `ac` and `ăn` and `ưn` are mid-word states, and a
stop-final rime takes only sắc or nặng — so a clip of `ac` read level is **not a sound
Vietnamese has**. `ă` and `â` cannot be said level at all, which is why they are voiced `á`
and `ớ` (§0.4, confidence `check`; the owner can settle it from his son's book). These
eight are flagged by the generator exactly as the §7.3 toneless blends are, and
`CLAUDE.md` is explicit about why: **nobody on this team can hear.**

#### What this hands to the app

The storage layer answers a tap in one lookup, in this order:

```
state -> tiles[group][state]           (26 onsets, 35 rimes, 6 tones — 67 clips)
      -> prefixAudio[group][state]     (2 + 8 — 10 clips, 9 of them new)
```

and it reads the onset/rime boundary off `onsetLetterCount`. It never infers a boundary
from the letter stream, and it never composes a spelling. The liveness computation over
letters is the app-developer's; the parse it is computed against is data.

### 3.8 Revision 5 — `display.glyphCase`, the answer to E22

**The owner answered `open-questions-ui.md` Q7 on 2026-09-23, against the game-designer's
recommendation: English tiles are `A B C D`.** `ui.md` §8.2 specifies the mechanism and
hands the *name and shape* of the field to this document as **E22**. This is it.

```jsonc
{
  "schema": 1, "id": "en-seed", "language": "en", "…": "…",

  // THE RENDER POLICY. Read once at pack load, applied at ONE place in the glyph
  // component (AC D21). `en-seed` is "upper"; `vi-seed` is "lower" (§8.2.3, and see the
  // Q13 gate below — that asymmetry is a correctness constraint, not a style preference).
  "display": { "glyphCase": "upper" },

  "media": { "…": "…" },        // the degradation policy
  "rules": { "…": "…" },        // the orthography
  "chant": { "…": "…" }         // the timing
}
```

#### Why `display`, and why it is nested

The manifest already groups policy-as-data by what it governs: `media` is the degradation
policy, `rules` the orthography, `chant` the timing. `display` is the render policy, and
nesting the field under it makes **AC D20's boundary structural rather than remembered**:

> **Nothing under `display` may reach stored data, audio, ordering or any parent surface.**

A bare top-level `glyphCase` sitting between `dialect` and `rules` would read like
content, and the next render-only field would have nowhere principled to go. The name
`glyphCase` — rather than `case` or `uppercase` — carries the scope: §8.2 is emphatic that
it reaches *the glyph* and nothing else.

**It is generated, not hand-written** (`rules.mjs` `seedGlyphCase`), for the same reason
`inventoryOrder` is: a hand-edited value is exactly how the tone order drifted into
frequency order, and a casing flag is easier to mistype than a tone list.

#### Three outcomes, three severities, and the split is the point

`ui.md` §8.2.2 requirement 5 and **AC D23**: an absent or unrecognised value renders
lowercase and the app **starts normally**. A casing flag is never worth refusing to boot
over. But the validator is not the app, and collapsing all three cases into "the app
copes" would mean a typo silently overrides the owner's decision with nothing anywhere
able to say so.

| What is in the manifest | The app | The validator |
|---|---|---|
| no `display` at all | lowercase | **nothing.** Lowercase is the default and is right for most packs |
| `"glyphCase": "uppercase"` — a typo | lowercase | **warning**, naming the exact value it wanted. Fails `--strict` |
| `"glyphCase": ""` | lowercase | warning, same |
| `"display": "upper"` — a wrong *shape* | lowercase | **error.** This is not a typo, it is a broken writer |
| `"glyphCase": true` | lowercase | **error**, same reason |
| `vi` + `"upper"` | uppercase | **error** — see the Q13 gate |

A wrong shape being an error while the runtime survives it is the same line this pipeline
already draws for a dangling media reference (§3.4): *the runtime degrades precisely so
the child never sees it, and surviving it is not the same as it being acceptable.*

#### The Q13 gate — a computation, not a constant

`ui.md` §8.2.3 forbids a **Vietnamese** pack from being set to uppercase until the render
gate covers it, and AC **Q13** makes that a gate requirement rather than folklore. The
reason is not taste:

- `mả` / `mã` is the tightest pair in the §6.1 render gate — **34 px apart at 36 pt**. A
  tone mark on a capital sits against cap height (0.74 em) rather than x-height, which
  compresses the pair further.
- `assets/fonts/FIXTURE.txt` carries **7** uppercase Vietnamese letters — `Ă Â Đ Ê Ô Ơ Ư`
  — and **none** of the ~130 precomposed marked capitals. Verified here by counting the
  cased characters in the shipped file.
- Both bundled faces *do contain* those glyphs. **A font that contains a glyph is not a
  gate that has rendered it.** Q5a would report green and say nothing about `Ẫ`.
- `CLAUDE.md` calls a font that renders `mả` and `mã` alike a **correctness** failure, not
  a cosmetic one.

Banning the combination with a hard-coded `if (lang === 'vi')` would be a constant nobody
remembers to delete. So the validator instead computes **what this specific pack would
have to draw** — every tile glyph, every stored toned rime form, every word spelling,
upper-cased — and asks which of those characters the fixture does not cover. On
`packs/vi-seed` that is **55 characters**, named in the error message:

```
ERROR pack.json display.glyphCase: "upper" on a Vietnamese pack would render 55
character(s) the §6.1 render gate has never drawn: À Á Ã È É Ì Í Ò Ó Õ Ù Ú Ĩ Ũ Ạ Ả Ấ Ầ Ẩ
Ẫ Ậ Ắ Ằ Ẳ Ẵ Ặ Ẹ Ẻ Ẽ Ế Ề Ể Ễ Ệ Ỉ Ị Ọ Ỏ Ố Ồ Ổ Ỗ Ộ Ớ Ờ Ở Ỡ Ợ Ụ Ủ Ứ Ừ Ử Ữ Ự Ỹ …
```

**Extend the fixture with exactly those, re-run Q1–Q5c, and the gate lifts by itself** —
proved end-to-end in an isolated copy: the same pack goes from exit 1 to **exit 0** once
the 55 forms are in the fixture, and the shipped fixture was not touched to do it. That is
the only form of this rule that stays true, because the version that needs a human to
remember it does not.

**It fails closed.** If the fixture cannot be found, the flag cannot be cleared and that is
an error rather than a skipped check. This is the opposite call from the decode gate
(§9.3c), which announces a skip when the venv is missing — and the difference is that
fail-closed there would block every honest offline validation, while here nobody has a
legitimate reason to set a Vietnamese pack uppercase outside this repo.

#### D20 — nothing stored is uppercase, and the validator enforces it

The cheap way to give the owner uppercase tiles is to upper-case the **data**. It would
look right on the board and be wrong four ways at once: the clip lookup is by tile id, the
alphabetical sort is over the stored lowercase, word ids are file names on a filesystem
that may or may not care, and the editor would show his mother text she never typed (D24).

So `inventoryOrder`, every tile id, every word's `letters`, `tiles` and `syllables`, and
every media file name are checked for a cased character and it is an **error**.
`word.text` is deliberately **not** checked — D20 does not list it, and `Hà Nội` is a
legitimate thing for her to type.

#### What it does not touch

| | |
|---|---|
| **audio** (D19) | `A` says /æ/, never "ay". The clip lookup is by lowercase tile id, so there is structurally nowhere for a letter *name* to enter; a harness case asserts every English `short` clip's text is still the tile's `sound` |
| **`inventoryOrder`'s sort** | still alphabetical over the stored lowercase; nothing re-sorts |
| **stored data** (D20) | above |
| **the editor and every parent surface** (D24) | she sees what she typed |
| **bytes** | `{"glyphCase":"upper"}` is **+34 B** per manifest. Reversing the owner's decision is one field and no code, which is the entire reason it is a pack field |

---

## 4. Storage

### 4.1 First launch, and where packs live

The seed packs are bundled in the app binary. On first launch each is **copied** to the
writable documents directory and is thereafter an ordinary pack. The copy is guarded by
the existence of `packs/<id>/pack.json`, so a second first-launch is a no-op and can never
overwrite her edits. The bundled copy is never read again except by an explicit
"restore this word to how it shipped" action.

### 4.2 Atomic writes

`writeFileAtomic()` in `tools/lib/pack.mjs`:

1. write to `.tmp-<pid>-<n>-<name>` **in the same directory** (so the rename never crosses
   a filesystem, where it would stop being atomic);
2. `fsync` the file;
3. `rename` over the target — atomic on ext4 and f2fs;
4. `fsync` the directory.

Step 4 is not decoration: without it the rename itself can be lost on power failure even
though the data is durable, and the pack would come back missing a word that was reported
saved.

**On React Native, `expo-file-system` exposes no `fsync`.** State it plainly rather than
pretend: the rename is still atomic, so the failure mode degrades from *torn file* to
*the very last write reverts*. That is the acceptable one. `development-process.md` §4's
requirement is that **the words she entered last week survive**, and they do.

**Ordering is the other half.** Every operation writes media first and the word file
**last**. A crash between them leaves an unreferenced blob — garbage, swept by
`pack-validate --delete-orphans` — never a word pointing at a file that is not there.
Blobs are content-addressed, so a half-written blob has the wrong name and is inert.

**One user action touches one word file.** Adding a word does not rewrite the other 49.

### 4.3 Operations the storage layer must support

The game-designer owns the screens; this is the surface they can build on. Each is a
single atomic write unless noted.

| Operation | Notes |
|---|---|
| `listWords(packId)` | returns readable words plus a count of quarantined ones |
| `getWord(packId, id)` | |
| `putWord(packId, word)` | create or update; one file |
| `deleteWord(packId, id)` | moves to `.trash/` rather than unlinking — undo is free and she will mis-tap |
| `setEnabled(packId, id, bool)` | withhold from the child without deleting |
| `saveDraft(packId, partial)` | **see below** |
| `importImage(packId, id, file, meta)` | blob then word file |
| `reorderImages(packId, id, order)` | `images[0]` is the prototype |
| `removeImage(packId, id, index)` | blob is left as an orphan; it may be shared |
| `importAudio(packId, id, slot, file, meta)` | recording or generated, same call |
| `listPacks()` / `createPack()` / `duplicatePack()` | |
| `exportPack(packId) -> zip` | §8 |
| `importPack(zip) -> packId` | §8, into staging, validated before it counts |
| `gc(packId)` | sweep orphan blobs |
| `attributions(packId)` | §11, computed from the live pack |

**Drafts — capturing a word from a moment of play.** She plays with him. The best moment
to add a word is the moment it happens: he points at their cat, she photographs it and
records herself saying `mèo`, and that must be savable *there*, in five seconds, without
stopping to decide that the rime is `eo` and the tone is huyền.

So a word may be saved with `"draft": true`, which means the picture and the sound are
real and hers and the decomposition is not filled in yet. A draft **must** carry
`enabled: false` (the validator errors otherwise — the child must never meet a
half-entered word), and its decomposition rules drop from errors to warnings.

Nothing else relaxes. A draft's media references are checked exactly as strictly as a
finished word's, because an unsafe path is unsafe whoever typed it. Three cases in the
harness cover this.

---

## 5. When a file is missing — what the child sees

First-order for this app, not an edge case. **Resolution happens once, at pack load, not
at render.** Each reference gets one `stat`, and the engine is handed a word whose media
list contains only files that exist. A renderer can then never be asked to draw a missing
file, which is how a blank frame or a broken-image glyph gets in front of a four-year-old.

| What is gone | What the app does | What the child sees |
|---|---|---|
| Some of a word's images | uses the survivors; rotation indexes the surviving list | nothing — a picture, as always |
| **All** of a word's images, `fallbackEmoji` set | shows the bundled Fluent Emoji 3D asset | a cartoon instead of a photo |
| All images, no `fallbackEmoji` | **the word is withheld from the round generator** | a different word |
| The word's `audio.word` | **the word is withheld** | a different word |
| `audio.blend` (Vietnamese step 3) | step 3 is skipped, the chant continues | a shorter chant |
| `audio.sentence` | step 6 is skipped | nothing |
| A tile's clip | the tile is silent; tap, lift and placement all work | a tile that does not speak |
| The whole `media/` directory | every word withheld → **no playable words** | the "nothing to play yet" screen, not a crash |

Three principles behind that table:

**The child is never shown the failure.** He gets a different word. He does not get a
placeholder, an X, a grey box or a silent pause where a picture should be. He cannot read
an error and has no idea it is not his fault.

**His mother is always shown the failure.** The word stays in the editor's list with a
"needs a picture" marker, and the repair is one tap. The pack is not silently smaller.

**The fallback cannot itself go missing.** `fallbackEmoji` is a key into media **bundled
in the app binary**, not a pack media reference. That is deliberate: the fallback exists
precisely for the case where the pack is damaged, so making it editable would make it
damageable. 79 distinct Fluent names across the two seed lists, MIT-licensed, ~33 KB each
≈ 2.6 MB bundled once and shared by both packs.

**Withholding is not deleting.** A withheld word is `enabled: true` and simply not
eligible this round. Fix the file and it comes back.

### The validator's line between the two

A **dangling** reference is an **error**: the pack disagrees with its own filesystem, and
something is wrong — a blob was deleted, a restore was partial, a write was interrupted.
An **empty** `images: []` is a **warning**: she has not curated it yet.

That distinction was wrong in the first cut of this tool. A word pointing at
`media/img/DOES-NOT-EXIST.jpg` produced only an attribution warning, and the missing file
was silent. It is now an error with a named case in the harness (`DANGLING IMAGE`,
`DANGLING AUDIO`).

### Choosing among several images

**Corrected.** An earlier draft of this section had `images[0]` serve both the prompt and
the resolution reveal. That was wrong, it contradicted `gameplay.md` §3.2 and ACs B9/F2,
and the app-developer flagged the conflict in Slice 2 rather than reinterpreting it. The
acceptance criteria are the contract and they are also right on the merits, so the formula
below is theirs:

```
prompt   images[0]                                     always — the prototype
reveal   images[1 + (encounterIndex % (n - 1))]        n = surviving images, n > 1
         images[0]                                     when n === 1
```

**The reveal showing a *different* photograph is the entire point of storing several.**
`image-sourcing.md`: one photo teaches *that cat*, several varied photos teach *cat*. If
the reveal repeated the prompt, the extra images would be decoration and the owner's
explicit "several per word" instruction would buy nothing. Prompt stable, reveal varying,
is what turns the array into the pedagogy.

`encounterIndex` is a per-word counter the engine already carries — `literacy-vi.md` §8.3
wants per-word escalation anyway. **No RNG.** `development-process.md` §3 makes
determinism load-bearing: same seed plus same taps must produce the same rounds, and a
randomly chosen picture would make a tester's replay diverge on the screen even when the
state matched.

Both formulas index the **surviving** list, not the stored one — which is what stops a
deleted file turning into an intermittent blank every third encounter. The engine resolves
that list once at pack load through an injected `hasMedia(ref)`, which is how a pure module
learns about a filesystem without importing one. **Every row of the degradation table
above is now implemented in code**, so a wrong row is a wrong behaviour, not just a wrong
sentence.

**Why 3 and not 6.** `image-sourcing.md`: one photo teaches *that cat*, four varied photos
teach *cat*. Measured yields are ~80% for the lead image and ~30% for Commons category
members (§9.2), so under the old sourcing three acceptable photos cost roughly one lead
plus seven category members reviewed by eye, and six would have cost seventeen. Sourcing
the variety from the article body improves that, but a human still looks at every
candidate. Curation is the binding constraint, not bytes
(`word-list.md` §2). Three is where variety is achieved and a day's careful work still
covers the seed list. `max: 6` exists because *her* photographs are free — she can add six
pictures of their own cat and that is strictly better than anything downloaded.

With the reveal formula above, three images means one prompt and **two** rotating reveals,
so he meets the same word illustrated three different ways. **One image is the degenerate
case**: prompt and reveal become the same picture and the mechanism does nothing. That is
why `min` is 1 rather than 0 — a word with one photo still plays — but a word with one
photo is a word that is only half curated, and the validator's `N photographed` count
should be read with that in mind.

---

## 6. Corruption and recovery

**Every read of the pack is a read of untrusted data** (`development-process.md` §4).

| Fault | Response |
|---|---|
| One word file will not parse | move it to `quarantine/`, log it, load the other 49. The editor shows "1 word could not be read" with the raw text, so it can be fixed or deleted. The child never sees it. |
| A word parses but breaks a rule | the word is withheld and flagged in the editor; the rest of the pack plays |
| `pack.json` will not parse | fall back to `pack.json.bak` — **verified: a pack whose manifest is destroyed but whose `.bak` is good validates clean with a warning** |
| Both manifests gone | the `words/` directory still holds her words. The bundled seed manifest supplies schema, tiles and rules, which are near-static, and her words load against it. **A manifest loss does not cost her a single word.** |
| Media file present but wrong type | error. Magic bytes are checked, not extensions — an HTML `429 Too Many Requests` page saved as `.jpg` is a real outcome of the fetch pipeline and survives an extension check |
| Orphan blobs | warning; swept explicitly with `--delete-orphans` |

`pack.json.bak` is written before every manifest change, and only from a manifest that
parses — so a broken current manifest can never overwrite a good backup.

### Known limit, recorded rather than assumed

Magic-byte sniffing proves the first four bytes and nothing more. A **truncated mp3 that
still starts with a valid header passes the validator.** There is a case in the harness
that asserts this, so the limit is documented rather than discovered later. Decoding is
done at generation time instead: `tools/tts.py` opens every clip it writes and refuses one
that decodes to silence, because a silent mp3 is a valid mp3 and would otherwise ship as a
tile that does nothing.

---

## 7. Versioning and migration

`pack.json.schema` is an integer. The app carries `SCHEMA_SUPPORTED`.

| Case | Behaviour |
|---|---|
| `schema === SUPPORTED` | normal |
| `schema < SUPPORTED` | migrate (below) |
| `schema > SUPPORTED` | **open READ-ONLY.** Show "this pack was made by a newer version of the app". Never write. |

The read-only rule matters more than it looks. A newer pack has fields this build does not
know about; the editor rewrites whole objects; writing would silently drop her data while
appearing to work. Refusing is the only honest option. The validator treats a
newer-than-known schema as an error, with a case in the harness.

**Unknown fields are preserved.** Every read-modify-write carries unrecognised keys
through untouched, so a downgrade is non-destructive.

**Migration is copy, validate, swap:**

```
packs/vi-seed            → migrate into → packs/vi-seed.m2
                           validate packs/vi-seed.m2
                           rename vi-seed → vi-seed.pre-m2
                           rename vi-seed.m2 → vi-seed
                           (vi-seed.pre-m2 kept until the next clean launch)
```

A failed migration leaves the original untouched. Both steps are renames, so there is no
window in which neither exists. Migrations are pure functions `(pack) -> pack` applied in
sequence, and each ships with its own fixture.

**What `schema: 1` already pays for.** `literacy-vi.md` §1.1 required `syllables` to be an
array from day one even though v1 never writes an array of length ≠ 1, so that `máy bay`
is two instances of the same machine rather than a migration on a live pack on her phone.
The same reasoning put `tiles` under named groups and `images` in an ordered array rather
than a single `image` field.

---

## 8. Backup and restore — she will replace her phone

**The backup is the pack.** A zip of the directory with no transformation: same
`pack.json`, same `words/*.json`, same `media/`. Restore is unzip plus validate.

Two consequences worth having. There is no importer to get wrong and no second format to
keep in step. And she is not locked in — anyone with a laptop can open the zip and read
her words, so if this app disappears her work does not.

Zip rather than tar.gz because every phone share sheet and every desktop opens a zip
without being asked twice, and the contents are already compressed.

```
node tools/pack-backup.mjs export  packs/vi-seed backups/ghepchu-vi-2026-09-23.zip
node tools/pack-backup.mjs restore backups/ghepchu-vi-2026-09-23.zip packs/vi-restored
```

Measured: `packs/vi-seed` (50 words, 145 clips, 3 photographs) exports to **1,061,171 B**
and restores to a pack that validates clean with identical counts.

**Export validates first.** A backup of a broken pack is a way to make the breakage
permanent, and the moment she notices something is wrong is exactly the moment she will
reach for "back up".

**Export then tests the archive it just wrote** (`unzip -t`) and deletes it if it does not
verify. An untested backup is a promise, and this is the one file whose whole job is to
still work on a day when nothing else does.

**Restore is idempotent and never partial.** Content addressing makes re-restoring write
the same bytes to the same names. Restore unpacks into staging, validates, and only then
becomes a pack; a damaged archive is refused and the pack she already has is untouched.

> **A design intent that was measured and abandoned.** Per-word files were supposed to
> make a *truncated backup* partly restorable. Truncating the 1.06 MB archive to 400 KB
> and restoring recovered **zero words** — a zip's index lives at the end of the file, and
> `zip -FF` could not rebuild it non-interactively. Per-word files protect a **live** pack
> from a bad write; they do not make a damaged **archive** partly readable. The guarantee
> is the other one: a backup either restores completely or is refused.

**Moving to a new phone:** export → share sheet (Drive, AirDrop, email, a cable) → install
the app → import. The seed packs are copied out on first launch as usual; her restored
pack arrives beside them with its own id. Nothing merges automatically, because a silent
merge is how duplicates appear and how her version of a word loses to the seed's.

---

## 9. The generation pipeline

Build-time only. **The runtime never touches the network** (`decisions.md`). Only these
generators call out, on the owner's Linux machine.

```
   word-list.md ──► build-seed-pack.mjs ──► packs/<lang>-seed/   (words + tiles, no media)
                                                   │
   article images ──────► fetch-candidates.mjs ──► .candidates/<id>/ + SHEET-<id>.png
   (+ lead, + category                                  captioned, ranked, de-duplicated
    only if thin)
                                                   │
                                          A HUMAN LOOKS ◄── the step that cannot be automated
                                                   │
                                            pack-import-media.mjs
                                                   │
   edge-tts / gTTS ──────► gen-audio.mjs ─────────►│
                                                   ▼
                                            pack-validate.mjs  ──► pack-attributions.mjs
```

### 9.1 The seed pack is built from the literacy documents

`build-seed-pack.mjs` parses the markdown tables in `word-list.md`, `literacy-vi.md` §2
and §5.1, and `literacy-en.md` §3. Transcription would create a second copy that drifts,
and the drift would be invisible — the app would teach something the document does not
say. Parsing means the document stays the single source of truth and re-running the
builder is how a change reaches the child.

Output matches `word-list.md` §7 exactly: **47 Vietnamese words enabled + 3 appendix,
40 English**; 26 onsets, 35 rimes, 6 tones; 35 English tiles.

**A rebuild merges; it does not replace.** The first version of the builder deleted every
word file and wrote fresh ones with `images: []` and `audio: { word: null }`. That is
right for the parts the documents own and catastrophic for the parts they do not: fixing a
typo in `word-list.md` would have wiped every curated photograph and every generated clip
in the pack, and the only sign would have been the pack quietly getting smaller.

| From the documents | Preserved across a rebuild |
|---|---|
| `text`, `stage`, `syllables` / `tiles`, `fallbackEmoji`, `build.*` | `images`, `audio`, `enabled`, `draft`, tile `sound` / `anchor` / `label` / `audio`, and any unknown key |

`enabled` is preserved for a word that already exists, because after creation it belongs
to whoever maintains the pack — a rebuild must not re-disable `phở` the day after somebody
finally found it a picture. A word removed from the document *is* removed, but it is named
out loud and its media is left as orphans rather than deleted. Tile `sound` and `anchor`
are preserved because they are curriculum supplied by hand and live in no document
(`open-questions-content.md` C2).

**This is not a theoretical benefit.** The builder composes each Vietnamese spelling from
`onset + toned[tone]` and compares it with the spelling in the table. 49 of 50 matched.
The one that did not was `hổ`, whose decomposition gave the rime as `o` — but `ổ` is `ô`
with a hook, so the pack had built `hỏ`, a different word. `word-list.md:141` has since
been corrected. A transcribed pack would have shipped it.

The tone-mark placer (`literacy-vi.md` §5.5) is ours and is **advisory**: it runs in the
builder and in the editor, a human sees the result, and the composed string is then stored
as data. No runtime code places a tone mark (§1.2, §5.4). All 33 seed rimes were checked
against known spellings.

> **One divergence from `literacy-vi.md` §3.1, recorded rather than absorbed.** That
> section lists the medial `u` as occurring "before `â ê y i ơ`". Treating `u` before `i`
> as a medial makes the placer emit `uĩ` for `ui` + ngã, so `mũi` would be built as
> `muĩ`. In `ui` the `u` is the nucleus and the `i` a glide; the genuine
> medial-before-`i` case is spelled `uy` (`quy`, `thúy`), never `ui`. The placer therefore
> ignores the medial list. Flagged in `open-questions-content.md`.

### 9.2 Images

`fetch-candidates.mjs` assembles; it never chooses.

```
1.  Wikipedia LEAD image        the prototype          measured 80% kept
2.  The ARTICLE's own images    the variety            replaces the category
3.  Commons category members    fallback only          measured 30% kept
4.  The mother's own photograph strictly better than any of them
```

**The variety images come from the article body, not the Commons category.** This changed
after the curator reviewed four words by eye and counted:

| Word | Concept | Usable, lead + category |
|---|---|---|
| hổ | tiger | 4 of 8 |
| gà | chicken | 4 of 8 |
| cá | fish | 2 of 8 |
| chó | dog | **1 of 8** |

The lead image was good in all four. Everything under it came from the category, and the
rejects were not near-misses: two 19th-century engravings and a sepia archival card
reading "ALASKA TASK FORCE" for `cá`; a nine-breed collage, a police dog with a handler
and an oil painting for `chó`; a **museum diorama of a mammoth** filed under tiger; and
for `gà`, a panel of histology microscopy slides and a photograph of butchered carcasses.

**A Commons category is an archive, not a selection.** It holds everything anyone ever
filed under the concept, and relevance ranking does not apply to an archive. What makes
the lead image good is that a person chose it to show a reader what the thing *is* — and
the same editor chose the rest of the article's images for the same reason. So the article
body is the variety source: `GET /api/rest_v1/page/media-list/<title>`, filtered to
`type: "image"` and `showInGallery !== false`, in reading order.

**The category is a fallback, not a top-up, and the distinction is the fix.** The first
cut of this change still filled the sheet up to `--n` from the category once the article
ran out — and the three it added for `chó` were the landscape, the police dog and the oil
painting, while the two it added for `cá` were the two engravings the curator had already
named. Topping up from an archive is how the archive's failure rate gets back in. The
category is now consulted only when the article yields fewer than `--min-article`
(default 5: a lead plus four to choose three from). **A short sheet of good candidates
beats a full sheet padded with rejects.**

Verified on the two worst words, from cache: `chó` went from 8 candidates (1 usable) to
**5 candidates, 0 from the category**, of which the spaniel and the dog-by-a-doorway are
plainly good; `cá` went to **6 candidates, 0 from the category**.

**Captions.** The article supplies them, and they go under each tile on the contact sheet.
"Vị trí của các răng cắt thịt của chó" identifies a dental diagram before the reviewer has
to study the thumbnail. Two things had to be got right: the default ImageMagick font
silently drops Vietnamese diacritics — "Vị trí của các" renders as "V  trí c a các" —
so the sheet uses DejaVu Sans, checked by rendering it and looking; and the band is a
separate `caption:` image appended below, because `-splice` plus `-annotate` put the text
*on* the photograph (an annotate offset under `southwest` gravity positions a baseline,
not a text block).

#### Resolving a word to an article title

**This was losing 12 of 50 Vietnamese words — 24% of the pack — and not one of them for
want of a picture.** The original path went English concept → `en.wikipedia`
`prop=langlinks` → Vietnamese title, and it is wrong twice over, both measured:

- **No redirect following.** `Cow` is a redirect to `Cattle`; without `redirects=1` the
  query returns nothing.
- **`prop=langlinks` is largely empty now.** Wikipedia migrated interlanguage links to
  Wikidata. `Coconut` with `redirects=1` and `lllimit=max` returns
  `{"pages":{"51346":{"title":"Coconut"}}}` — no `langlinks` key at all. Coconut, Crab and
  Hat all come back empty and all three plainly have Vietnamese articles. The mechanism
  is wrong, not the data.

The order now, cheapest and most direct first:

| | Route | |
|---|---|---|
| 0 | `build.searchTitle` | a human said so; nothing overrides it |
| 1 | **the Vietnamese word itself** | this is Vietnamese mode — the word *is* the search term |
| 2 | Wikidata sitelinks | how interlanguage links actually work now |
| 3 | `langlinks` + `redirects=1` | last resort |

**Step 1 should have been first all along.** `Dừa`, `Cua`, `Mũ`, `Cam`, `Bánh`, `Sữa` and
`Chân` are all live articles under the Vietnamese word, needing no English round-trip.
Measured over the whole pack: **48 of 50 resolve, up from 38.** Wikidata picks up the four
the word misses (`Quạt điện`, `Nón lá`, `Kem lạnh`, `Lê (thực vật)`).

**But a title can match exactly and still be the wrong thing.** Vietnamese homographs make
step 1 powerful and risky: `bóng` is a ball *and* a shadow, `mây` is a cloud *and* rattan,
`xe` is any vehicle. The article may be a real article about the wrong sense, which
produces a sheet full of plausible, wrong pictures.

So every resolution reports Wikidata's one-line description, and **a resolution with no
description is flagged**, because the good ones nearly all have one (`cam` → "trái cây",
`ong` → "côn trùng", `mây` → "dạng aerosol gồm các giọt chất lỏng nhỏ…"). That heuristic
earned itself immediately:

> `tô` — picture concept "bowl of food" — resolved to the article `Tô`, which begins
> *"Tô là một tổng của tỉnh Sissili ở phía nam Burkina Faso."* A real article, an exact
> title match, and a **département in West Africa**. It would have produced a contact
> sheet of African administrative photographs that looked like a fetch working correctly.

12 of the 48 have no description and are listed at the end of the run with their opening
sentence, so each can be judged in seconds. The repair is `build.searchTitle`.

#### `build.searchTitle`

```jsonc
"build": { "assetConcept": "bowl of food", "searchTitle": "Tô (đồ dùng)" }
```

A human-supplied article title, overriding every other route. It exists because several
picture concepts are **descriptions, not article names** — "Cake or bread", "Foot / leg",
"Bowl of food", "Glass of milk", "Electric fan" — and no encyclopaedia has an article
called "Bowl of food". Keeping the concept string descriptive serves the literacy model;
`searchTitle` serves the fetcher; neither has to compromise.

It is content data, and it is exactly the hook his mother needs when she adds a word whose
picture the fetcher cannot find on its own.

#### `--resolve-only`

```
node tools/fetch-candidates.mjs --pack packs/vi-seed --resolve-only --force
```

Resolves every title and reports, downloading no pictures — about 60 requests and a
minute for the whole pack. Title resolution is where a quarter of the pack was being lost,
and discovering that after a forty-minute image run is the expensive way to learn it.
Exits non-zero if any word has no article.

**Other filters.** `isPhotoFile` keeps raster formats only — SVGs are diagrams, and `.ogg`
files were arriving with a generic speaker-icon thumbnail and consuming a candidate slot.
A minimum of 512 px on the shorter side, because anything smaller would be upscaled into
the 512 px master and look soft on a phone where the picture fills most of the screen;
this dropped 2 of `chó`'s article images and is reported. `nc` and `nd` are excluded at
fetch time — `nd` because the pipeline crops, `nc` because publishing is still open.

**Licence resolution.** The REST `page/summary` endpoint returns the lead image's URL and
nothing about its terms, so the source chosen as primary was also the one source whose
output could not be attributed. Caught by importing three curated `phở` photographs and
having the validator reject the first — one word into curation instead of ninety. Licences
for every candidate are now resolved in **one batched `imageinfo` call** (up to 50 titles),
Commons first and the local wiki for anything Commons does not have.

**Yield is reported, so a sourcing change can be measured instead of argued about.** The
fetcher used to say "8 candidates" whether they were eight tigers or seven engravings and
a mammoth. Each candidate now records which stream offered it (`rank`), the importer
carries that onto the kept image, and `pack-validate.mjs` joins the two:

```
  curation yield across 5 reviewed word(s) — offered by the fetcher vs kept by a human
    lead          4 kept /   5 offered   80%
    category     10 kept /  33 offered   30%
    TOTAL        14 kept /  38 offered   37%
```

Those are the real numbers from the curator's first five words, and they independently
reproduce `image-sourcing.md`'s measurements (~77% lead, ~30% category) from a completely
different direction. **Only reviewed words count** — a fetched-but-unreviewed word counted
as "0 kept" would drag every percentage towards zero and make the table say more about how
far the curator had got than about how good the source is. The first version did exactly
that and reported the lead image at 16%.

**The denominator lives in the pack, not in the scratch.** The first version read the
offered counts back out of `.candidates/<word>/candidates.json`, and then the curator
cleared the scratch before a fresh fetch run — which is the normal thing to do — and the
yield report silently vanished for five already-curated words. Curation is the only moment
at which both numbers are known, so `pack-import-media.mjs` now writes the offered counts
into `build.fetched` as it imports. Verified by importing, reporting, **deleting the entire
`.candidates` directory**, and reporting again: byte-identical output. The sheet is still
read when present, because it is what lets images imported before `rank` existed be
matched back by title.

Normalisation: `-auto-orient`, square centre-crop, 512×512, `-strip`, progressive, 4:2:0,
q82. Measured on nine true 1024 px originals: **mean 51,196 B, max 98,520 B**. On the
three real phở imports: 34,437 / 58,431 / 65,638 B.

Why 512: a 512² JPEG decodes to 1.0 MB of RAM. 640² costs 1.6 MB and 67,532 B on disk;
384² saves 24,000 B per image and is visibly soft on a DPR-3 phone. 512 is where the
quality stops being the limiting factor.

### 9.3 Audio

| Asset | Engine | Settled in |
|---|---|---|
| English letter sounds, two clips each | `edge-tts` / `en-US-JennyNeural`, "sound + anchor word", `-35%` | `decisions.md` |
| English words | the same voice and rate | |
| Vietnamese everything | `gTTS` `lang='vi'`, natural speed | owner picked 1.00× |

`gen-audio.mjs` builds the whole job list first, so a run can be counted, dry-run, priced
and resumed; `tts.py` is deliberately dumb — one text in, one file out, JSON on stdout —
so that resumability and pack writes have one implementation, in Node.

`tts.py` **measures what it produced** and `gen-audio.mjs` rejects a clip that decodes to
silence. Nothing claims an asset is fine without opening it.

Reuse: the 52 clips in `samples/audio/en-final/` are the ones the owner chose in round 3
of listening. Regenerating them would produce different bytes and throw away an approval,
so they are reused by default.

Measured runs: **148 Vietnamese clips in 54 s**, 0 failures, no throttling. **English: 40
generated, 50 reused, 37 s.**

The 31 Vietnamese step-3 toneless blends are listed explicitly at the end of the run as
needing a human listen — `literacy-vi.md` §7.3 calls this the seed list's single largest
QA item, because the blend is sometimes not a real word (`sưa` for `sữa`, `ngua` for
`ngựa`) and *should read correctly* is not *does*.

### 9.3a The engine pads every clip, and that is what the owner heard

**Added after the owner played the built app**, revision 3. He said: *"the sounds when
picking English characters are not good enough, voices seem to be mixed up with each
other."* `ui.md` §11.0 measured the shipped clips and found `short` at 1896–2832 ms
against a spec that assumed 350 ms, and handed the asset half over as **E15 / AC N15**:
a tap clip must be **≤ 700 ms**, with ≤ 40 ms of lead and ≤ 120 ms of tail.

#### What the file actually contains

Measured by decoding every clip in `packs/en-seed` — `tools/audio-measure.py`, which uses
the `soundfile` already in the venv (§9.4: libsndfile 1.2.2 reads mp3, so no ffmpeg).

| | Lead | Sound | Tail | File |
|---|---|---|---|---|
| `b` / "buh" | 295 ms | 595 ms | **1315 ms** | 2208 ms |
| `s` / "sss" | 275 ms | 1225 ms | **1355 ms** | 2832 ms |
| every one of the 70 English tile clips | 265–320 ms | 390–2180 ms | **1175–1375 ms** | 1896–3768 ms |

**The pad is fixed and the speech is not.** ~285 ms before and ~1320 ms after, the same on
every clip whatever was said — 1.6 s of nothing on a clip whose speech is 400–600 ms. It
is also why byte count barely tracks text length: at `+0%`, `"b"`, `"buh"` and
`"buh, ball"` come back 11,232 / 11,232 / 11,520 bytes.

**A bytes-per-frame envelope cannot see any of this, and says the opposite.** These files
are 48 kbps CBR MPEG-2 Layer III: every frame is 144 bytes and 24 ms whether it holds a
vowel or digital silence, so a per-frame byte envelope is flat by construction and reads
as "sound all the way through". That reading is an artefact of the container. Decoding is
the only way to see it, which is why `tools/audio-measure.py` exists.

**The pad is the endpoint's, not edge-tts's.** The raw websocket stream is byte-for-byte
the file `edge-tts` saves, and its own `SentenceBoundary` metadata reports the utterance
as spanning almost the whole file, so there is nothing upstream to configure. **gTTS does
not do it**: `packs/vi-seed` carries ~60 ms of lead and ~60 ms of tail, 120 ms total
against edge-tts's 1610 ms. Measured, not assumed — §9.3b.

#### Rate was not the cause, and it was never broken either

An early reading was that `-35%` barely shortened a clip (`"buh"`: 2208 ms at `-35%` vs
1872 ms at `+0%`, only 18%) and that edge-tts must be ignoring the flag on short text.
**That was the pad diluting the measurement.** With the pad excluded:

| | `-35%` | `+0%` | ratio |
|---|---|---|---|
| `"buh"` sound | 595 ms | 390 ms | 0.66 |
| `"guh"` sound | 1145 ms | 750 ms | 0.65 |
| `"sss"` sound | 1225 ms | 810 ms | 0.66 |

0.65 is exactly the rate factor. **edge-tts honours rate precisely; the pad hid it.**
Recorded because the wrong conclusion was one step from a wasted round of regeneration.

#### The cut: lossless, because the audio was approved by ear

`tools/audio-trim.mjs`. An MP3 is a sequence of frames, so the pad is removed by dropping
whole frames off each end and the frames in between keep the bytes the owner approved in
round 3 of listening (§9.3). No decode, no re-encode, no second generation of lossy
compression on audio nobody here can judge. At 24 kHz a frame is 576 samples = 24 ms,
finer than the budget.

**The one place a frame cut is not free** is Layer III's **bit reservoir**: a frame may
store its data in up to 255 bytes of its *predecessors*, so a cut orphans the first
retained frame from data that is no longer in the file.

> ### The first version of this got it wrong, and the wrongness is the lesson
>
> It kept **two frames of pre-roll** and argued that 255 bytes is under two 144-byte
> frames, so two frames must be enough. The arithmetic is right and **it answers the wrong
> question**. A guard protects *later* frames; it does nothing for the **first retained
> frame**, whose own `main_data_begin` still points back past the cut.
>
> Measured across all 140 clips in `packs/en-seed`: **frame 0 has `main_data_begin == 0`
> in all 140** — it must, there is no history at the start of a file — and **no later frame
> has it in any of them.** The encoder uses the reservoir continuously, so **there is no
> interior frame at which a cut is free**, and no guard can find one.
>
> It shipped. **29 of 70 English tile clips** made libmpg123 report
> `part2_3_length (1056) too large for available bit count (1048)` **on their first
> frame** — the start of the letter sound, the first thing the child hears on every tap,
> in exactly the clips the owner had already reported as wrong.
>
> **Why the sample comparison passed anyway, which is the part to take seriously.**
> libmpg123 *conceals* an underrun: it decodes the frame with whatever bits it has and
> carries on. So the samples matched, every time, while the stream was malformed. A
> decoder's silence is not a decoder's approval — **you have to read what it says**. And
> the other 41 were no better in principle; they escaped the *message* only because their
> first frame's `part2_3_length` happened to fit in the 131 bytes it carried itself. The
> count 29 measures how many complained, not how many were sound.
>
> Another decoder — a phone's native one — is free to click, mute or drop those frames
> instead, and nobody on this team can hear it to rule that out. Fixing a "sounds wrong"
> bug by introducing a first-frame artefact is the worst available outcome.

**The fix is to supply the missing bytes, not to guess a guard.** Those bytes still exist
in the file — they are the tail of the dropped frames' main-data regions — so
`primingFrames()` in `tools/lib/mp3.mjs` emits one or two **priming frames** carrying
exactly them:

```
  header       copied from the cut frame, so bitrate, sample rate and mode match
  side info    ALL ZERO -> main_data_begin = 0 (needs no history itself) and
               part2_3_length = 0 (decodes to digital silence)
  data region  the orphaned history bytes, right-aligned
```

The decoder appends each data region to its reservoir, so when it reaches the real frame
the last `main_data_begin` bytes are exactly the ones it expects. `main_data_begin` is at
most 255 and a data region here is 131 bytes, so **at most two priming frames, 48 ms**.
That is what the old guard cost anyway: **every duration in the table below is unchanged
by the fix.**

**Both gates, on every clip, before anything is written:**

1. it **decodes with zero decoder diagnostics** — the check that was missing;
2. it matches the original **sample by sample** across the sound's extent.

If a primed cut fails either, the tool falls back to cutting **only the tail** — which
cannot underrun, because frame 0 is retained and is always self-contained — and if that
fails too the clip keeps its **original bytes** and is named in the output. *An untrimmed
clip is a known cost; a corrupt one is not.* Verified by disabling priming: the trimmer
refuses the head cut and falls back to tail-only (`b.short` 2208 → 1008 ms, lead 295 ms,
**clean**) rather than emitting a dirty clip.

Result: **0 of 70 tile clips and 0 of 110 total produce a decoder diagnostic**, against a
baseline of 0 of 70 for the untouched originals. Sample error inside the sound is at worst
1.2 × 10⁻⁴ (−78 dBFS) and usually 6 × 10⁻⁸.

**Lead is 45–70 ms against E15's 40 ms**, and that is the priming frames plus a partial
frame of real silence. Recorded as a shortfall rather than bought back by re-encoding
audio the owner approved by ear.

#### What `en-seed` became

| Slot | Before | After |
|---|---|---|
| tile `short` | 1896–2832 ms, median 2184 | **576–1392 ms, median 768** |
| tile `long` | 2616–3768 ms, median 3192 | **1272–2328 ms, median 1776** |
| word `word` | 2016–2352 ms | **672–1032 ms** |
| pack audio | 1652 KiB | **745 KiB (−55%)** |

**11 of 35 `short` clips now meet E15's 700 ms; 24 do not**, and trimming cannot close
that gap because what remains is the sound itself. The residue is the **sustained and
repeated-grapheme texts** — `fff` 1248, `guh` 1344, `lll` 1056, `mmm` 936, `nnn` 1008,
`rrr` 1032, `sss` 1392, `vvv` 1080, `ks` 1056, `zzz` 1320, `ih` 1056 ms and their doubles
— where edge-tts produces a genuinely long utterance (the envelope for `sss` shows three
separate /s/ bursts).

**Two levers remain and neither is the content-engineer's.** Both are priced:

| Lever | Owner | Measured effect |
|---|---|---|
| **Rate** `-35%` → `+0%` | the owner (`decisions.md`) | ×0.65 on the sound. Regenerated and measured: `shh` 504, `buh` 552, `mmm` 672, `lll`/`nnn`/`rrr` 720, `ih` 744, `vvv`/`ks` 768, `fff` 888, `guh`/`zzz` 912, `sss` 960 ms. **~20 of 35 would meet 700 ms; the fricatives still would not.** |
| **The text** (`sss` → `s`) | the literacy-designer (`literacy-en.md` §3) | the only lever that reaches the fricatives, and it changes what the child is taught |

They are not pulled here. `decisions.md` closed the voice and the rate, the owner has
rejected two rounds of English audio by ear, and **this document's own rule is that audio
cannot be verified below him**. Trimming needed no ear — it removes silence — which is
exactly why it was safe to do without asking.

#### One measured finding left on the table

Four clips (`b`, `g`, `gg`, `i`) carry a **trailing exhale** after the letter: a separate
segment 60–80 ms after the sound, 6–14 dB below the clip's peak, with **97–99% of its
energy above 3 kHz** and no voicing. It is 145–245 ms long, and under the cut-on-next rule
it is what lands on the next letter's onset. Removing it is mechanically easy and safe to
detect (a fricative letter is the loudest segment of its own clip, so the "well below
peak" test cannot mistake one for a breath) — but it is audible content the owner heard
and approved, so it is reported rather than deleted. It is not the main story: 4 clips of
35, against 1.6 s of padding on all 70.

### 9.3b `vi-seed` was checked and does not have the defect

Measured the same way, and the instruction was to leave it alone unless the same fault was
there. It is not:

| | edge-tts (`en-seed`) | gTTS (`vi-seed`) |
|---|---|---|
| padding per clip | **~1610 ms** | ~120 ms |
| what a trim would recover | 51% of the bytes | 16% |
| tile clips today | 1896–2832 ms | **648–936 ms** |

`vi-seed` is therefore **untouched**. For the record, a trim would take its tile clips to
480–816 ms and move roughly 42 of its 57 over-target clips under E15's 700 ms; it is one
command (`node tools/audio-trim.mjs --pack packs/vi-seed --apply`) whenever the owner
wants it, and it is provably lossless. It is not done unasked because the Vietnamese audio
is his too.

### 9.3c The gate, and what a duration cannot tell you

`pack-validate.mjs` now measures **every clip's duration from its MPEG frame table**
(`tools/lib/mp3.mjs` — exact, dependency-free, and it deliberately does not read
`audio.ms`, because a duration written into a file by whoever wrote the file is a claim).
The budget lives in `pack.json` under `media.audio`, as data, beside the degradation
policy:

```jsonc
"audio": {
  "format": "mp3", "sampleRate": 24000,
  "tapTargetMs": 700,     // ui.md E15. Over it: a warning, and an error under --strict
  "tapCeilingMs": 1500,   // over it: an ERROR. Above the content, far below the defect
  "longCeilingMs": 2500,  // `long` and word clips: nothing fires them from a tap
  "leadTargetMs": 40, "tailTargetMs": 120   // advisory — seeing these needs a decoder
}
```

**Two thresholds because they have two owners.** The ceiling is the regression gate: the
padding put every clip at 2000–2800 ms, so its return fails immediately and no argument is
needed. The target is E15 itself, which depends on what is said and how fast, and it is
reported on every run so that it cannot quietly pass.

**A second, independent gate: every clip must DECODE with no decoder diagnostics.** This
one exists because the trim shipped 29 malformed clips that the duration gate could not
see — they were 768 ms, comfortably inside the ceiling. Only a decoder can answer it, so
it runs through the venv; **when the venv is absent the check says it was skipped** rather
than passing quietly. A skipped check that announces itself is honest; one that reports
success is the thing `CLAUDE.md` warns about. It covers `vi-seed` too, which is untrimmed
and clean, and it is what any future trim of that pack will be held to.

Seen to fail, each with its own check removed (nine cases in
`tools/pack-validate.test.mjs`, "clip duration budget" and "clips must decode without
decoder diagnostics"):

| Poison | Result |
|---|---|
| a tile repointed at one of the **original untrimmed 2208 ms clips** | `ERROR … ceiling for a tap clip is 1500 ms`, **exit 1** |
| the same clip, with `ms: 400` written on it to look compliant | still exit 1 — the bytes win |
| `tapCeilingMs` tightened to 300 in the manifest | exit 1, so the budget really is data |
| an `ID3`-headed file with no frames (sniffs as mp3) | `ERROR … cannot read its MPEG frames` |
| `audio.ms` set to 12 | warning, exit 0 — a wrong label is not a broken pack |
| the ceiling check disabled in the validator | 3 of the 6 cases fail |
| the frame-parse and ms checks disabled | those 2 cases fail |
| `long` treated as a tap slot | the negative case fails |
| **an unprimed frame cut, 768 ms — inside the ceiling** | `ERROR … decodes with 1 decoder diagnostic(s) … part2_3_length (1888) too large for available bit count (1048)`, **exit 1**. The duration gate does not see this one at all |
| the decode check disabled in the validator | that case fails |
| priming disabled in `audio-trim.mjs` | the round-trip case fails, and the trimmer falls back to tail-only rather than emitting a dirty clip |

> **The fixture had to be chosen on the property, not on an index.** The first version of
> the orphaned-cut case just took frame 3, which happened to be a frame whose demand fit
> in its own bytes — so the decoder never complained and the case passed against a
> validator doing nothing. It now picks the first frame whose `part2_3_length` exceeds the
> bits it carries itself, i.e. one that **provably** cannot decode without its history.
> That is the difference between a fixture and a coincidence, and it is the same mistake
> as the guard: reasoning about a property while testing an index.

**What the gate cannot do, stated plainly.** A duration is a **proxy**. It proves a clip is
not 1.5 s of silence; it says nothing about whether the sound in it is intelligible, or
right, or good. `CLAUDE.md`: *amplitude is not intelligibility* — and neither is length.
Two rounds of English audio passed every number available and were rejected by ear. **This
change still has to be heard by the owner** (AC U9a) before anyone calls finding 3 closed.
It also cannot see leading or trailing silence without a decoder; `audio.leadMs` and
`audio.tailMs` are written by whoever opened the file and are reported as advisory.

### 9.4 Loudness — and why `ffmpeg` is not needed

`spike-results.md` found Piper normalised every file to full scale and would sound harsh.
**That does not apply to the engines that were actually chosen.** Measured across all 52
English clips: peak −9.3 to −1.1 dBFS, RMS −27.5 to −21.5 dBFS. gTTS Vietnamese sits
around −9.6 dBFS peak, −20.0 dBFS RMS.

So no normalisation pass is required. The residual is a **6.1 dB spread in RMS across the
26 English letters** — the loudest letter is about twice as loud as the quietest. Audible,
modest, and firmly in the territory `decisions.md` closed: *amplitude is not
intelligibility*, nobody on this team can hear, and this goes to the owner rather than to a
harness. If he says it is uneven, the fix is a measured gain per clip.

The cross-language difference (gTTS ~2–7 dB louder than edge-tts) is irrelevant: the
languages never mix.

**`ffmpeg` is not needed at all, and this is now settled rather than deferred.**
`soundfile` on this machine is built against libsndfile 1.2.2, which **reads and writes
mp3**. Verified: decoded `c-long.mp3`, re-encoded to mp3, 13,248 B out. Generation,
measurement, normalisation and re-encoding are all available in the venv. `ffmpeg` would
buy Opus at roughly a third of the size, which the budget below shows is not worth a
dependency.

### 9.5 Rate limiting and resumability

The spike measured Wikipedia returning **429 after 13 consecutive fetches**. A 90-word run
makes several hundred requests and would be throttled somewhere in the middle, leaving a
half-populated directory and no way to tell which words were done.

`tools/lib/http.mjs`:

- **throttle per host** — one request at a time, minimum 1,200 ms gap (`--gap` to change);
- **backoff that honours `Retry-After`**, 5 attempts, exponential to a 60 s cap; a 429 is
  an instruction, not an error;
- **a disk cache keyed by URL**, so a re-run does not re-ask;
- **`state.json`**, so a re-run does not re-do — `done` / `deferred` / `empty` per word;
- a failed word is `deferred` and the run continues rather than aborting.

Measured: 3 Vietnamese words, 21 requests, **0 × 429**, 25 s. Re-running: 0 network calls,
all skipped. Forcing a re-run: 7/7 cache hits, **1.4 s instead of 25 s**.

At 1.2 s/request, roughly 9 requests per word, a 90-word run is about 16 minutes. It is a
long job, and it is now a resumable one.

---

### 9.6 Revision 5 — the nine new Vietnamese clips, measured

`literacy-vi.md` §0.12 is explicit that a smaller board is **not** cheaper audio: the tile
clips are now indexed by unit-in-progress, and partial units need clips too. Ten states
were added and nine clips were generated; **nothing was retired.**

```
node tools/gen-audio.mjs --pack packs/vi-seed --only tiles
  77 clip(s) needed: 9 generated, 1 reused, 67 already present, 0 failed
  45.8 KiB written, 5.9 s of audio
  9 clip(s) trimmed, 1.1 s of padding removed
```

Every one was opened and measured — duration from the frame table, loudness and decoder
diagnostics from libmpg123 through `audio-measure.py`. **`peak`, `rms` and `clean` are
measurements; none of them is intelligibility** (§9.3c, `CLAUDE.md`).

| State | Says | ms | bytes | peak dBFS | rms dBFS | lead/tail ms | decoder diagnostics |
|---|---|---|---|---|---|---|---|
| `p` | `pờ` | 624 | 4,992 | −5.3 | −17.7 | 50 / 100 | **none** |
| `q` | `quờ` | 792 | — | −5.8 | −19.4 | 95 / 210 | **none** — `sameAs onset:qu`, the existing blob |
| `ac` | `ac` | 840 | 6,720 | −8.9 | −21.0 | 75 / 110 | **none** |
| `an` | `an` | 624 | 4,992 | −10.3 | −19.0 | 70 / 95 | **none** |
| `ă` | `á` | 624 | 4,992 | −7.9 | −20.7 | 55 / 110 | **none** |
| `ăn` | `ăn` | 600 | 4,800 | −7.5 | −18.5 | 65 / 100 | **none** |
| `â` | `ớ` | 672 | 5,376 | −7.3 | −18.3 | 70 / 110 | **none** |
| `uô` | `uô` | 648 | 5,184 | −6.3 | −16.6 | 70 / 115 | **none** |
| `ư` | `ư` | 624 | 4,992 | −6.3 | −15.9 | 70 / 95 | **none** |
| `ưn` | `ưn` | 600 | 4,800 | −5.3 | −16.3 | 65 / 100 | **none** |

**Against the budget.** All ten are inside the 1,500 ms tap ceiling. Two — `ac` at 840 ms
and the reused `quờ` at 792 ms — are over `ui.md` E15's 700 ms *target*, which is a
warning, and they sit inside the range the 67 existing Vietnamese clips already occupy
(600–888 ms). Closing that gap means changing what is said or how fast, and both are the
owner's call, not this pipeline's.

**The eight rime-prefix clips need a human listening check before they ship** (§0.9, and
the same rule as the §7.3 toneless blends). `ac`, `ăn` and `ưn` are mid-word states read
level, which is not a thing Vietnamese does; `ă` and `â` are voiced with a mark because
they cannot be said level at all, and that choice carries the literacy-designer's
confidence `check`.

**English needs no new clips at all.** Every English grapheme prefix is itself a grapheme
(`literacy-en.md` §0.5), so there are no pass-through states; the ten digraph clips change
role from *tile* to *re-voicing* and keep their bytes. Net English asset change: **zero**.

**The blocking English audio item is unchanged and is not this revision's.** 24 of the 35
English `short` clips exceed the 700 ms target because they are genuine speech, and the
owner has rejected two rounds of re-cut letter sounds by ear. That decision is his.

## 10. Budgets

All per-unit figures measured. Totals at the seed size are measured; the ×10 column is a
projection from those per-unit figures and is labelled as one.

### Per unit

| Thing | Bytes | Source |
|---|---|---|
| One image, 512² q82 | **51,196** mean, 98,520 max | 9 true 1024 px originals |
| One Vietnamese clip (gTTS) | 6,288 mean (4,800–7,488) | 147 clips in `packs/vi-seed` |
| One English clip (edge-tts −35%, **trimmed**) | **6,937 mean (3,456–13,968)** | 110 clips in `packs/en-seed`. Was 15,379 mean before §9.3a cut the padding |
| One Vietnamese word's JSON | 875 mean (675–1,037) | 50 word files |
| One English word's JSON | 648 mean (614–736) | 40 word files |

### Vietnamese pack

| | Bytes |
|---|---|
| manifest (67 tiles) — fixed | 43,476 |
| tile audio, 66 clips — fixed | 408,000 |
| *per word:* JSON | 875 |
| *per word:* audio (`word` + `blend`) | 10,326 |
| *per word:* 3 images | 153,600 |
| **per-word subtotal** | **164,801** |
| **total at 50 words** | **8,691,526 B = 8.29 MiB** |
| total at 500 words *(projection)* | 82,851,076 B = 79.0 MiB |

### English pack

| | Bytes |
|---|---|
| manifest (35 tiles) — fixed | 44,670 |
| tile audio, 70 clips — fixed | **566,784** *(was 1,157,760; §9.3a)* |
| *per word:* JSON | 648 |
| *per word:* audio | **4,907** *(was 13,349)* |
| *per word:* 3 images | 153,600 |
| **per-word subtotal** | **159,155** |
| **total at 40 words** | **6,977,654 B = 6.65 MiB** |
| total at 400 words *(projection)* | 64,273,454 B = 61.3 MiB |

> **Measured today**, over the real curated pack rather than the model above, after the
> revision-5 rebuild: `packs/en-seed` is 6017.4 KiB images + **758.4 KiB audio** +
> 154.8 KiB json = 6930.7 KiB, and `packs/vi-seed` is 8468.7 KiB + **936.6 KiB** +
> 190.6 KiB = 9595.8 KiB. The per-word JSON
> row above predates curation and is now ~2.8 KiB/word, because each image carries its
> licence, creator and source URL — the price of being able to generate `ATTRIBUTION.md`
> from the pack (§11), and noise beside one 51 KB photograph.
>
> **Trimming the padding took 907 KiB off the English pack**, which is more than the
> entire audio budget of the Vietnamese one. That was never the reason to do it — the
> reason was that the owner could hear it — but it is the second-largest size lever in
> this document after image count, and it cost nothing.

### What revision 5 cost — measured against both packs, before and after

Every figure is `after − before` on the real packs, from `git show HEAD:<file> | wc -c`
against the file on disk.

| | `vi-seed` | `en-seed` |
|---|---|---|
| manifest: `inventoryOrder` reshaped, `prefixAudio` added, tiles reordered | **+5,414 B** | **−216 B** |
| words: `letters` (+ `onsetLetterCount`) | +3,616 B over 50 words = **+72 B/word** | +1,903 B over 40 words = **+48 B/word** |
| nine new clips | **+46,848 B** (5,205 B mean) | 0 |
| **total** | **+55,878 B = +54.6 KiB** | **+1,687 B = +1.6 KiB** |
| as a fraction of the pack | **+0.6 %** | **+0.02 %** |

The English manifest got *smaller*: `inventoryOrder.letter` went from 36 entries to 26.

**At ten times the word count** the per-word term is the only one that grows. 500
Vietnamese words costs **+36 KB** of derived letters; the manifest and the ten prefix
clips are fixed, so revision 5's whole contribution at 10× is about **88 KB** — three
photographs. The board got half the size and the pack got 0.6 % bigger, and neither number
is worth an argument.

### What this says

**A first install is about 17 MB of content** — 8.29 + 6.65 MiB of packs plus ~2.6 MB of
bundled Fluent fallback emoji. A typical mobile game ships 100–300 MB. **The owner's
instinct that the assets would be huge is wrong by more than an order of magnitude**, and
`spike-results.md` said so first with cruder numbers.

**Images are 88% of the Vietnamese pack and 87% of the English one** — it was 78% before
the padding came off the English audio. If size ever
matters, images are the only lever worth pulling, and both settings are priced:

| Change | Vietnamese pack at 50 words |
|---|---|
| 3 images/word (chosen) | 8.29 MiB |
| 2 images/word | 5.85 MiB (−2.44 MiB) |
| 512² → 384² q78 (27,329 B mean) | 5.02 MiB (−3.27 MiB) |

Neither is worth taking. Three varied exemplars is the pedagogy
(`image-sourcing.md`), and 384² is visibly soft on a DPR-3 phone.

**Tile audio is fixed, not per word.** It is the writing system, which is finite: 26
onsets, 6 tones, and a rime inventory that grows slowly and stops. It does not scale with
her word list.

**Ten times the word count is ~144 MB across both packs** — and that is five to eight
times past the literacy-designer's quality ceiling of ~60 words per language
(`word-list.md` §2). **Inside the design envelope, size is a non-issue.** Correctness and
curation are the constraints, exactly as `word-list.md` argued.

---

## 11. Licensing and the attribution obligation

### Where each asset stands

| Asset | Licence | Obligation |
|---|---|---|
| Wikipedia / Commons photographs | individually licensed | **per image** — see below |
| Fluent Emoji 3D fallback | MIT | one notice, shipped once |
| Her photographs, her recordings | the family's | none |
| **edge-tts / gTTS audio** | **no published grant** | **see the warning below** |

Measured licence distribution across the 79 candidates fetched during the spike: 30 × CC
BY variants, 26 × CC BY-SA variants, 12 × CC0 / public domain, 4 unrecorded. **Roughly a
third of what the pipeline offers is share-alike.**

### The per-image obligation

CC BY requires: name the author, name the licence, link to it, and indicate that the image
was changed. CC BY-SA requires all of that **and** that the adapted image itself be
offered under the same licence.

**GFDL does not announce itself, and it is heavier than both.** It arrives on Commons
looking like any other free licence — a `chó` candidate came back `GFDL 1.2` and was being
counted as ordinary share-alike. GFDL requires the **full licence text to ship with the
work**, and a 1.2-only file cannot be relicensed as CC BY-SA. The validator now warns on
it by name and `ATTRIBUTION.md` lists it separately. It is deliberately *not* filtered at
fetch time, because the curator should still get to see the picture; it is a placeholder,
and the honest replacement for most of them is a photograph the mother takes herself. See
`open-questions-content.md` C5.

The pipeline always crops and resizes, so every third-party image here is an adaptation
and the "indicate changes" requirement always applies. Each entry records its own
`modified` string rather than relying on anyone remembering.

**Share-alike reaches the image files, not the app.** A cropped photograph is an
adaptation of that photograph; it is not a derivative of the code it is shipped beside.
The photographs are a collection alongside the app, so CC BY-SA does not reach `src/`.
Fluent Emoji 3D was chosen over OpenMoji specifically to avoid a *second* share-alike
obligation (`spike-results.md`).

**The attributions screen is generated, never maintained.** `image-sourcing.md` called for
this and it is why the licence fields are required rather than optional:
`tools/pack-attributions.mjs` walks the same `images[]` entries the game reads and emits
`ATTRIBUTION.md` (and `--json` for the app). **The app must run the same walk over the live
pack at runtime**, not ship this file's output — because she will add pictures after the
build and their licences must appear too. `--check` fails CI when the committed file is
stale, and the tool exits non-zero if any photograph cannot be attributed.

#### One predicate, two tools — and they disagreed

**`pack-validate.mjs` and `pack-attributions.mjs` both decide whether an image can ship,
from the same entries, and they returned different answers on the same two photographs.**
The validator passed `packs/vi-seed`; the attributions generator refused to let it be
published, over `đèn` `images[0]` and `mũi` `images[2]` — both `"license": "Public
domain"`, `"creator": null`. Its rule was one line:

```js
const unattributed = list.filter((e) => !e.license || !e.creator || !e.sourceUrl);
```

**The validator was right.** A public-domain work has no attribution obligation: there is
no rights-holder to credit, and `creator: null` is the correct, honest representation of
that rather than missing data. It was a false blocker on the one screen where a false
blocker is expensive, because the cheapest way to clear it is to **invent an author** —
and demanding one unconditionally had already silently deleted three usable photographs
(`cam`, `đèn`, `mũi`) before anyone noticed.

Measured across both packs, grouped by licence: **222 images require credit and 222 are
credited, including all 8 GFDL** — the heaviest obligation in the packs. Zero
credit-requiring images are missing an author. The two "failures" were the only two that
never needed one.

**The repair is not to relax the generator.** The predicate moved to
**`tools/lib/licence.mjs`** and both tools import it, so they can now be wrong *together*
— which is fixable — rather than wrong *differently*, which is not detectable. That module
is the only place this project answers "what does this licence oblige":

| Export | What it decides |
|---|---|
| `OWN_SOURCES` / `isOurs()` | `camera`, `own-work`, `generated` — no third-party obligation at all |
| `licenceObligations(license)` | `recorded`, `publicDomain`, `attribution`, `shareAlike`, `licenceText` (GFDL), `noDerivatives`, `nonCommercial` |
| `missingCredit(image)` | the required fields this image is missing, given its own licence |

Three properties worth stating, because each one is a way this could go wrong quietly:

1. **`license` and `sourceUrl` are required even for a public-domain work.** The claim
   *"this needs no credit"* has to be auditable; only `creator` is excused.
2. **An unrecognised licence string requires attribution.** Unknown means nobody has read
   the terms, and the cost of crediting a work that needed no credit is a line in a table
   while the cost of the reverse is a breach. The live example is `Copyrighted free use` —
   a Commons tag meaning the holder *permits* free use, which is not the same as
   abandoning the copyright. It correctly falls through to strict.
3. **`Phạm vi công cộng`** — vi.wikipedia's own public-domain tag, present in `vi-seed` —
   was **not** matched by the old regex, so that image sat in the attribution-required
   bucket. It happens to carry an author, which is the only reason nothing failed. A latent
   false blocker is still a false blocker, and it is matched now.

**A field of spaces is not a field.** `"license": "   "` is truthy, so the original
`!e.license` test passed it while the obligation classifier — which trims — had already
concluded nothing was recorded: the image would have shipped with a blank licence cell.
Found by the obligation table in `pack-validate.test.mjs`, which is why `missingCredit`
trims. It was not found by reading the code.

If the owner would rather avoid share-alike entirely, the fetcher's licence filter can be
narrowed to `cc0`/`pdm`/`by`. The measured cost is roughly a third of the candidate pool,
which given the ~30% Commons yield would make several words photo-less.

### The one that is actually unsettled: the audio

`decisions.md` "Still open" #5 asks whether to publish, and notes it *"changes licensing
and attribution obligations"*. Sharpen that: **if he publishes, the photographs are the
easy half and the audio is the problem.**

Every photograph carries an explicit public licence grant. The synthesised clips do not.
`edge-tts` drives Microsoft's Edge read-aloud endpoint and `gTTS` drives Google
Translate's; neither publishes terms granting redistribution of the audio inside a
product, and `spike-results.md` already records gTTS as "the unofficial Google Translate
endpoint — undocumented, rate-limited and liable to change". For a private family app this
is a non-issue. For a store listing it is the open question.

**It is cheap to close, and the pipeline was built for it.** A recording and a generated
clip are interchangeable by construction (§3.6). Re-recording the Vietnamese set is 66
tile clips plus 50 words plus 31 blends; the English set is 70 tile clips plus 40 words.
Not a small job, but it is a recording session, not a rebuild — and `spike-results.md`
already says a parent's voice beats any synthesised voice for this child.

---

## 12. Tools

| Tool | Does |
|---|---|
| `tools/build-seed-pack.mjs` | builds both seed packs from the literacy documents |
| `tools/fetch-candidates.mjs` | assembles photo candidates + captioned contact sheets from the article body; throttled, cached, resumable |
| `tools/pack-import-media.mjs` | one door for every picture and sound: `--pick`, `--image`, `--audio`, `--order` |
| `tools/gen-audio.mjs` | generates every clip a pack needs; resumable; reuses approved clips |
| `tools/tts.py` | one clip; measures what it wrote |
| `tools/audio-measure.py` | decodes a clip and reports length, lead, tail, peak, RMS, sound segments — **and what the decoder complained about**, captured off fd 2, which is the only place a bit-reservoir underrun appears. `--diff`, `--require-clean` |
| `tools/audio-trim.mjs` | cuts engine padding losslessly at MP3 frame boundaries; verifies every cut sample by sample; `--pack`, `--apply`, `--words` |
| `tools/lib/mp3.mjs` | MPEG frame table and Layer III side info: exact duration, frame offsets, `main_data_begin`, and the priming frames a cut needs. No decoder, no dependency |
| `tools/pack-validate.mjs` | **exit 1 on a bad pack**; `--strict`, `--json`, `--gc`, `--delete-orphans` |
| `tools/pack-validate.test.mjs` | **100 cases**: deliberate corruptions asserted to be rejected, plus the rebuild-preservation regression. 38 are revision 5's — the retired board runs, a lost letter, a digraph put back as a cell, the tone order, a misplaced onset boundary, the `gì` exception in both directions, the three `prefixAudio` set rules, a prefix clip through each of the two audio gates, the twelve glyph-casing cases of §3.8, and eleven licensing cases that run **both** binaries and assert they agree |
| `tools/pack-attributions.mjs` | generates `ATTRIBUTION.md`; `--check` for CI; **exit 1 if any photograph cannot be attributed**, asking `lib/licence.mjs` — the same predicate the validator asks |
| `tools/lib/licence.mjs` | **what a licence obliges, in one place.** `isOurs`, `licenceObligations`, `missingCredit`. It exists because the validator and the attributions generator disagreed about the same two photographs (§11) |
| `tools/pack-backup.mjs` | export / restore, both verified |
| `tools/lib/{pack,media,rules,http,markdown}.mjs` | atomic writes, path safety, orthography, throttling. Revision 5 added `VI_ALPHABET`, `EN_ALPHABET`, `viCollate`/`enCollate`, `viLetters`, `viOnsetLetterCount`, `enLetters`, `prefixStates`, `viPrefixSpeech`, `seedGlyphCase`, `readGlyphCase` and `viUppercaseGaps` — the board, the two dictionary orders and the prefix-state derivation, in the one place the builder and the validator both read |
| `tools/timestretch.py` | unchanged; pitch-preserving speed, kept per `decisions.md` |

`tools/fetch-wiki-candidates.mjs` was merged into `fetch-candidates.mjs` behind `--lang`.
The Openverse source it replaced is recorded as **rejected** in `image-sourcing.md` and is
not kept runnable.

**Setup.** The spike's venv was scratch and is gone. `python3-venv` has no `ensurepip` on
this machine, so pip is bootstrapped by hand:

```bash
python3 -m venv tools/.venv
curl -sS https://bootstrap.pypa.io/get-pip.py | tools/.venv/bin/python -
tools/.venv/bin/python -m pip install edge-tts gTTS numpy soundfile
```

### Typical run

```bash
node tools/build-seed-pack.mjs
node tools/gen-audio.mjs --pack packs/vi-seed
node tools/fetch-candidates.mjs --pack packs/vi-seed        # long; resumable
#   ... look at packs/vi-seed/.candidates/SHEET-*.png ...
node tools/pack-import-media.mjs --pack packs/vi-seed --word meo --pick 0,3,5
node tools/pack-validate.mjs packs/vi-seed --strict
node tools/pack-attributions.mjs packs/vi-seed
```

---

## 13. What was verified by execution

| Claim | How |
|---|---|
| The validator rejects a bad pack | **49 deliberate corruptions, 49 rejected**, each asserting the message names the fault. 50 cases pass. `node --test tools/pack-validate.test.mjs` |
| One bad word costs one word | comma injected into `cat.json` → `40 words, 39 enabled, 39 playable, 1 UNREADABLE` |
| A destroyed manifest is survivable | `pack.json` replaced with `{ broken` and a good `.bak` → validates clean with a warning |
| A dangling reference is an error | named cases for image and audio; was a warning, now exit 1 |
| Path traversal is refused | `../../../etc/passwd`, `/etc/hosts`, `pack.json` as a media ref — all rejected |
| Magic bytes beat extensions | an HTML page saved as `.jpg` → rejected |
| Orthography is enforced | 8 Vietnamese and 5 English rule cases, each from a cited section |
| The language boundary is structural | 5 cases: `language` field, wrong decomposition shape, wrong tile groups |
| A newer schema is refused | `schema: 99` → exit 1 |
| Drafts work, and stay safe | 3 cases: incomplete is fine, enabled-draft is an error, unsafe path is still an error |
| A rebuild preserves curation | rebuilt `packs/vi-seed` in place: 3 phở images, all 147 clips and an edited tile label survive |
| The seed pack matches the word list | 47 + 3 Vietnamese, 40 English — `word-list.md` §7 exactly |
| Composed spellings match | 49/50 Vietnamese; the 50th was a real defect in `word-list.md`, since corrected |
| Tone placement is right | all 33 seed rimes against known spellings |
| English tiles spell their words | all 40, exact concatenation |
| Audio generates | 148 Vietnamese clips in 54 s, 0 failures; English 40 + 50 reused in 37 s |
| Throttling works | 21 Wikipedia/Commons requests, 0 × 429 |
| Resume works | re-run: 0 network calls. Forced re-run: 7/7 cache hits, 1.4 s vs 25 s |
| The lead-image licence gap is closed | phở lead resolves to CC BY-SA 3.0, Codename5281, with a source URL |
| De-duplication works | 4 phở candidates → 3 identical; with de-dup, 6 distinct |
| Article images beat the category | `chó`: 8 candidates (1 usable, curator's count) → 5 candidates, 0 from the category, 2 plainly good. `cá`: → 6, 0 from the category |
| Captions render in Vietnamese | default font drops diacritics ("V  trí c a các"); DejaVu Sans renders correctly — checked by rendering and looking |
| Yield reporting is right | lead 4/5 = 80%, category 10/33 = 30% on the curator's real first five words — independently reproduces `image-sourcing.md` |
| Yield survives the scratch being cleared | imported, reported, deleted `.candidates` entirely, reported again — byte-identical |
| Title resolution | **48 of 50 Vietnamese words resolve, up from 38.** `--resolve-only` over the whole pack, 59 requests, 0 × 429 |
| A wrong-sense resolution is caught | `tô` → an article about a département in Burkina Faso; flagged by the missing-description heuristic |
| A word with no picture route is named | `bún` and `nón` have neither a photograph nor a `fallbackEmoji` |
| **Rev 5: the un-migrated packs are rejected** | the new checks were run against the shipped revision-4 packs *before* the rebuild: both exit 1, naming the retired `onset`/`rime` runs, the ten missing prefix states and the ten digraph cells on the English board |
| **Rev 5: the collation is not a transcription** | `viCollate` sorts a shuffled inventory into `literacy-vi.md` §0.13's two printed lists, character for character, for both onsets and rimes |
| **Rev 5: the prefix set is derived** | `prefixStates` over the 26 onsets returns exactly `p q`, over the 35 rimes exactly `ac an ă ăn â uô ư ưn` — §0.12's hand list, computed |
| **Rev 5: each new rule was seen to fail** | 11 injections, each exit 1: retired run, lost letter, digraph cell (vi and en), misplaced onset boundary, letters/rime disagreement, absent letters, missing prefix state, prefix state that is a tile, prefix state no word reaches |
| **Rev 5: the tone order is caught but not fatal** | the shipped `ngang sac huyen hoi nang nga` → exit 0 with a warning, exit 1 under `--strict` |
| **Rev 5: the `gì` exception opens and closes** | a real `gì` word rejected without `build.spellingException`, accepted with it |
| **Rev 5: the new clips pass both audio gates** | `pờ` tripled to 1,872 ms → exit 1 on the ceiling; `ac` cut at an unprimed frame boundary → exit 1 with `part2_3_length (1888) too large for available bit count (1432)`, naming `prefixAudio.rime[ac]` |
| **Rev 5: the new harness cases test their rules** | the `onsetLetterCount` rule and the prefix-reachability rule were each deleted from the validator: exactly those two cases went red, 75 others stayed green |
| **Rev 5: the casing field's three severities** | absent → no finding, exit 0; `"uppercase"` and `""` → warning, exit 0; `"display": "upper"` and `glyphCase: true` → **exit 1** |
| **Rev 5: the Q13 gate bites** | `vi-seed` set to `"upper"` → **exit 1**, naming all 55 uncovered characters |
| **Rev 5: the Q13 gate lifts** | the same pack in an isolated copy, with those 55 forms appended to the fixture → **exit 0**. The shipped `FIXTURE.txt` was not touched |
| **Rev 5: the fixture really is short** | counted the cased characters in the shipped file: **7** (`Ă Â Đ Ê Ô Ơ Ư`), **0** precomposed marked capitals |
| **Rev 5: D20 is enforced** | `inventoryOrder`, a word's `letters` and a Vietnamese `syllables` each upper-cased → **exit 1** in all three |
| **Rev 5: the casing cases test their rules** | the Q13 gate, the malformed-shape error and the D20 check were each deleted from the validator: exactly those three cases went red |
| **Licensing: the two tools disagreed** | `pack-validate` exit 0 and `pack-attributions` **exit 1** on the same `packs/vi-seed`, over two public-domain photographs with no author |
| **Licensing: the permissive side** | every public-domain and CC0 image in `vi-seed` stripped of its creator (21 of them) → **both tools exit 0** |
| **Licensing: the strict side still bites** | creator stripped from a CC BY-SA 4.0, a CC BY 2.0 and a GFDL 1.2 image in turn → **both tools exit 1**, each naming the missing field |
| **Licensing: unknown is strict** | licence replaced with `Some Bespoke Museum Terms` and the creator removed → **both exit 1**. `Copyrighted free use` classifies the same way |
| **Licensing: the claim is auditable** | `sourceUrl` removed from a public-domain image → **both exit 1**, even though no credit is owed |
| **Licensing: the cases test their rule** | the old `!e.creator` rule restored → the two permissive cases go red; `missingCredit` relaxed to require nothing → the four strict cases and the obligation table go red |
| **Licensing: a blank field is not a field** | `"license": "   "` passed the original presence test; caught by the obligation table, not by reading the code |
| **Rev 5: `q` really is one blob** | `prefixAudio.onset[q].audio.name.src` is byte-identical to `tiles.onset[qu].audio.name.src` — `media/aud/d6901540d82cd85e.mp3` |
| Every final-only English tile is enforced | the test iterates `EN_FINAL_ONLY`; `gg` was missing from the constant and nothing failed, because the pack happened to be right |
| Backup round-trips | 1,061,171 B export → restore → identical counts, validates clean |
| A damaged backup is refused | truncated archive → refused, nothing changed |
| mp3 write works without ffmpeg | libsndfile 1.2.2 read + re-encoded, 13,248 B |
| Loudness needs no pass | 52 clips: peak −9.3…−1.1 dBFS, RMS −27.5…−21.5 dBFS |
| **Where the sound is in a clip** | all 70 English tile clips decoded: lead 265–320 ms, tail 1175–1375 ms, fixed regardless of text (§9.3a) |
| **A per-frame byte envelope proves nothing** | the files are 48 kbps CBR — 144 B and 24 ms per frame, 0 resync bytes, 0 trailing bytes — so every frame is identical in size whatever it holds |
| **The pad is the endpoint's** | edge-tts's raw websocket stream is the saved file; regenerating `"buh"` at `-35%` reproduced 13,248 bytes exactly |
| **Rate was never broken** | with the pad excluded, `-35%` gives 0.65–0.66 × the `+0%` sound on three texts — exactly the flag |
| **There is no free cut point** | all 140 clips: `main_data_begin == 0` at frame 0 in 140/140, at **no later frame in any of them** |
| **The decode check fails** | an unprimed cut at a frame whose `part2_3_length` exceeds its own capacity → exit 1, naming `part2_3_length`; disabling the check in the validator makes that case fail |
| **The fix works** | **0 of 70 tile clips and 0 of 110 total** produce a diagnostic, against the originals' baseline of 0 of 70. Was 29 of 70 |
| **The fallback is real** | priming disabled → the trimmer refuses the head cut and emits tail-only (`b.short` 1008 ms, lead 295 ms, clean), never a dirty clip |
| **The frame cut is lossless** | worst sample residual inside the sound across all 110 clips: 1.2 × 10⁻⁴ (−78 dBFS); most 6 × 10⁻⁸ |
| **The trim is reproducible** | `gen-audio.mjs` regenerating `b.short` from the approved sample produced the **same content-addressed blob** as `audio-trim.mjs --apply`: `0e55ff0d44210321.mp3` |
| **The duration gate fails** | a tile repointed at the original 2208 ms clip → exit 1; with `ms: 400` written on it → still exit 1; ceiling tightened to 300 ms in the manifest → exit 1 |
| **The gate's own cases fail** | ceiling check disabled → 3 of 6 fail; frame-parse and ms checks disabled → those 2 fail; `long` treated as a tap slot → the negative case fails |
| **A fixture no longer copies the scratch** | 457 MB → **7.4 MB** per fixture; a full harness run leaves **0** temp directories, including after a deliberately thrown test |
| **`vi-seed` does not have the defect** | gTTS pads ~120 ms against edge-tts's ~1610 ms; a trim would recover 16% of bytes, not 51%. Left untouched |
| Attribution generates | 3 photographs, 2 licences, `--check` passes on the committed file |
| Image sizes | 9 true originals at 4 dimensions × 3 qualities |

### What is *not* verified, and cannot be here

**Whether any of it sounds right.** `decisions.md`: audio quality cannot be verified below
Tier 5. **This now includes the trim** — and the trim has already been wrong once in a way
no listener here could have caught, which is the argument for machine checks that read
what the decoder *says* rather than only what it *returns*. Cutting silence needs no ear and a duration is an
objective measurement — but a duration is a *proxy* for the property the owner cares
about, and 768 ms of a letter sound is not evidence that the letter sound is good. Finding
3 is not closed until he has heard it (AC U9a). The 31 Vietnamese step-3 blends are the largest outstanding listening item
(`literacy-vi.md` §7.3), and the 6.1 dB spread across the English letters is a number, not
a judgement.

**Whether any picture is good.** The tools assemble; a human rejects the bánh mì. Nothing
in this pipeline has an opinion about a photograph, and `image-sourcing.md`'s "BOMBS!"
advertisement is why it must not.
