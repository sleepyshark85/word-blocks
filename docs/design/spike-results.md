# Feasibility Spike — what this machine can actually produce

Run 2026-09-22, before any design work, to answer the owner's question: *can you generate
all the images and audio yourself?* Everything below was executed, not estimated. Sample
output is in `samples/`.

## Answer

**Audio: yes, fully.** Neural TTS in both languages, offline, reproducible.
**Images: yes, by download — not by drawing.** A licensed library, not generated art.

The distinction matters and the owner asked about it directly. Nothing here is an AI
image generator; there is none on this machine and none in the toolchain. What there is
is a large, permissively licensed emoji/illustration library that can be fetched once and
shipped offline.

## Machine inventory

| Tool | State |
|---|---|
| Node | v24.18.0 |
| Python | 3.12.3 (`venv` works, `pip` bootstrapped via `get-pip.py`) |
| ImageMagick | `convert` + `magick` present |
| Network | Reachable: npm, GitHub, jsDelivr, HuggingFace |
| **ffmpeg** | **absent** |
| espeak / sox / piper / flite | absent |

`ffmpeg` is the only gap worth closing by hand — see §Open tooling.

## Audio — Piper neural TTS

Installed into a scratch venv (`pip install piper-tts`), models pulled from HuggingFace
`rhasspy/piper-voices`:

| Voice | Model | Size |
|---|---|---|
| Vietnamese | `vi_VN-vais1000-medium` | 63.2 MB |
| English (US) | `en_US-amy-medium` | 63.2 MB |

The two models have **identical byte counts**, which looked like a download bug and was
checked rather than assumed: the MD5s differ and each config declares its own language
(`vi_VN` / `en_US`). Same architecture, same quality tier, coincidental size. *Recorded
under §"never trust a check you have not seen fail".*

Measured output — every file opened and analysed, not just listed:

| File | Text | Sec | Rate | RMS |
|---|---|---|---|---|
| `vi/meo.wav` | mèo | 0.28 | 22050 | 9584 |
| `vi/chim.wav` | chim | 0.26 | 22050 | 9640 |
| `vi/onset-m.wav` | mờ | 0.24 | 22050 | 10833 |
| `vi/rime-eo.wav` | eo | 0.17 | 22050 | 10789 |
| `vi/tone-huyen.wav` | huyền | 0.30 | 22050 | 8598 |
| `vi/meo-sentence.wav` | Con mèo kêu meo meo. | 0.99 | 22050 | 7770 |
| `en/cat.wav` | cat | 0.58 | 22050 | 5283 |
| `en/bird.wav` | bird | 0.74 | 22050 | 5332 |
| `en/cat-spelled.wav` | c, a, t | 2.12 | 22050 | 5464 |
| `en/cat-sentence.wav` | The cat says meow. | 1.81 | 22050 | 4606 |

**~10 KB per word** at 22.05 kHz 16-bit mono WAV, before any compression.

Two findings for the pipeline to own:

1. **Every file peaks at 32767** — Piper normalises to full scale. That will sound harsh
   on a tablet speaker. Target around −3 dBFS instead.
2. **Vietnamese syllables come out very short** (0.17–0.30 s at `length-scale 1.15`).
   Fine for an adult, probably too fast for a 4-year-old. Treat `length-scale` as a
   tuning parameter, not a constant.

**TTS is the floor, not the ceiling.** A parent's recorded voice beats any synthesised
voice for this child, and northern/southern pronunciation is a real choice TTS makes for
us. The pipeline must treat a recording and a generated file as interchangeable.

## Images — a licensed library, downloaded

Three libraries were fetched and rendered side by side (`samples/STYLE-COMPARISON.png`).
The owner reviewed the first round and said the images were *"a little bit too simple and
not so catching"* — which settled it.

| Library | Licence | Format | Size | Verdict |
|---|---|---|---|---|
| OpenMoji | **CC BY-SA 4.0** | SVG | ~2 KB | Too plain. Share-alike is a liability if published. |
| Fluent Flat Colour | MIT | SVG | ~20 KB | Fine, but ImageMagick renders it wrong (see below). |
| **Fluent Emoji 3D** | **MIT** | PNG 256² | ~33 KB | **Chosen.** Rich, dimensional, genuinely appealing. |

`microsoft/fluentui-emoji`, served from jsDelivr. **MIT is strictly better than OpenMoji's
CC BY-SA** — no share-alike obligation, so publishing stays open as an option.

**ImageMagick cannot render the Fluent flat SVGs.** Its built-in MSVG renderer drops the
gradients and filters they use; the middle row of the comparison sheet is near-blank as a
result. This is a renderer limitation, not a bad asset. It costs nothing here because the
3D set is already PNG — but any future SVG work needs `resvg` or `librsvg`, not
ImageMagick.

### Coverage

**1,595 asset folders**, counted via the git trees API with `truncated: false`. The index
is saved at `samples/styles/fluent-index.txt`.

That number was itself a corrected claim. The first attempt paginated the GitHub *contents*
API, which silently ignores `per_page`/`page` for large directories and returns the same
first 1,000 entries every time — the script looped 30 times and reported "30000 folders",
all duplicates. Deduplicating gave exactly 1,000, which is the API's cap and therefore a
suspicious round number, which is what prompted the recount. *Recorded because a number
that looks like a limit usually is one.*

35 toddler words were probed by guessing folder names: **26 hit, 9 missed**. Every miss
was a *naming* miss, not a gap — `Milk` is `Glass of milk`, `Ball` is `Soccer ball`,
`Moon` is `Crescent moon`, `Tree` is `Deciduous tree`. So the pipeline must resolve
through the repository's real asset index (`samples/styles/fluent-index.txt`) rather than
guessing from the English word, and the mapping from a word to a picture is **content
data the literacy-designer owns**, not a string transformation.

Confirmed by fetching, not by assuming: `Glass of milk`, `Soccer ball`, `Open book`,
`Sunflower` and `Deciduous tree` all return 200 at the standard path.

**There are two path shapes, and the second was found by chasing a contradiction.** `Nose`
appeared in the index yet 404'd — because assets that carry skin tones nest a tone level
that the others do not:

```
assets/<Name>/3D/<name>_3d.png                          # most assets
assets/<Name>/<Tone>/3D/<name>_3d_<tone>.png            # skin-toned assets
         e.g. assets/Nose/Default/3D/nose_3d_default.png
```

This affects body parts, hands and people — a small slice of a 4-year-old's vocabulary,
but the pipeline must handle both shapes or those words silently lose their picture.

Genuine gaps will exist for Vietnamese cultural vocabulary — `nón lá`, `áo dài`, `phở` are
not emoji. That is what the editor's own-photo path is for, and it means that path is
**required in v1**, not a nice-to-have.

## Budget

At 150 words — already generous for a 4-year-old — with both languages:

| | Per word | 150 words |
|---|---|---|
| Image (Fluent 3D PNG 256²) | 33 KB | ~5.0 MB |
| Audio, word (WAV 22 kHz mono) | 10 KB | ~1.5 MB |
| Audio, tiles/syllables (shared, ~150 clips) | 10 KB | ~1.5 MB |
| **Total** | | **~8 MB** |

Ten times the word count is still under 80 MB. **The owner's worry that the assets would
be huge is not borne out** — a typical mobile game ships 100–300 MB. Asset *volume* is a
non-issue; asset *coherence and correctness* is where the work is.

## Open tooling

**`sudo apt install ffmpeg`** is the one thing worth the owner's hands. It would buy
loudness normalisation, WAV→Opus/AAC compression (roughly 10 KB → 3 KB per clip), and
trimming of leading silence. Everything currently works without it, so this is an
optimisation, not a blocker — and `ffmpeg-static` from npm is a no-sudo fallback if the
owner would rather not.

Nothing else is needed. Piper, its models, and the Fluent library were all obtained
without elevated permissions.

---

## Addendum — English letter sounds (orchestrator verification, 2026-09-22)

The literacy-designer reported that *"Piper cannot synthesise English letter sounds — this
blocks English mode"* and recommended the owner record ~26 clips before English could ship.
The claim was checked rather than relayed. **Half of it is right and the conclusion is
wrong.**

**Right:** the text path gives letter *names*, not sounds. Verified —

```
text 'c' -> /s ˈ i ː/     ("see")
text 't' -> /t ˈ i ː/     ("tee")
text 'a' -> /ˈ e ɪ/       ("ay")
```

**Wrong:** Piper's Python API exposes phoneme-level synthesis that the CLI does not —
`PiperVoice.phonemes_to_ids(list[str])` → `phoneme_ids_to_audio(ids)`. Arbitrary IPA can be
fed straight in, bypassing text→phoneme conversion entirely. **All 26 letter sounds were
generated and are on disk at `samples/audio/en-phonemes/`.** English mode is not blocked.

**The real problem is acoustics, not tooling.** A stop consonant has almost no energy in
isolation. Raw peak amplitude before any gain, on a 0–1 scale:

| Class | Letters | Raw peak | Gain needed to reach −3 dBFS |
|---|---|---|---|
| Vowels, nasals, glides | a e i o u l m n r w y j x | 0.13 – 0.24 | 3–5× |
| **Stops and fricatives** | **b c d f g h k p q s t v z** | **0.018 – 0.067** | **11–55×** |

All 26 were normalised to −3 dBFS and land at comparable RMS, so they are audible. But
gaining `/d/` by 55× lifts the noise floor with it, and an isolated stop is a click rather
than a sound a child can imitate — which is the same limitation human phonics teaching has,
and is why "you cannot say /k/ without a schwa" is a real pedagogical caveat rather than a
Piper defect.

**Revised recommendation.** Ship the generated set so English mode is never blocked, and
treat the owner's ~10 minutes of recording as the **upgrade**, exactly as his wife's voice
upgrades the word audio and her photographs upgrade the pictures. The same floor/ceiling
shape for the third time is the content model working as intended.

**What only the owner can settle:** whether the 13 heavily-gained clips are usable. That
needs an ear, not a measurement.

## Addendum — ffmpeg is less needed than stated

`piper --volume` and `--no-normalize` exist, and the Python path normalises in numpy before
the WAV is written. Loudness control therefore needs no external tool. `ffmpeg` would still
buy Opus/AAC compression (~10 KB → ~3 KB per clip) and silence trimming, but the harshness
problem identified earlier is solved without it. **Downgraded from "worth the owner's
hands" to "optional".**

---

## Addendum — audio engine changed after owner review (2026-09-22)

The owner listened to the first round and rejected both halves of it. Both rejections were
correct and both had a fix.

### 1. Vietnamese — "sounds southern, I want it northern, and slower"

`vi_VN-vais1000-medium` was the wrong voice. Piper ships **only three** Vietnamese voices
and **none is labelled by dialect**:

| Voice | Quality | Speakers |
|---|---|---|
| `vi_VN-vais1000-medium` | medium | 1 — *rejected, southern* |
| `vi_VN-25hours_single-low` | low | 1 |
| `vi_VN-vivos-x_low` | x_low | 65 — VIVOS is an HCMC corpus, so likely southern too |

Rather than gamble on a lower-quality model and hope the dialect flips, the engine changed.

**Chosen: Microsoft Edge TTS** (`edge-tts`, installed, working). Free, **no API key**,
neural quality, and two standard-Vietnamese voices:

- `vi-VN-HoaiMyNeural` (female)
- `vi-VN-NamMinhNeural` (male)

Speed is a parameter (`rate="-25%"`), so "slower" is a setting rather than a rebuild.
Samples generated at `+0%`, `-25%` and `-40%` in `samples/audio/vi-edge/` for the owner to
pick a pace, plus a six-tone minimal pair set (`ma mà má mả mã mạ`) — which is also the test
of whether the voice is genuinely northern, since **a northern voice must distinguish `hỏi`
from `ngã`** and a southern one merges them. That file settles the dialect question by ear.

Output is MP3, which is smaller than the WAV budget assumed earlier, not larger.

**This is a build-time network dependency, not a runtime one.** The app still ships fully
offline; only the generator calls Microsoft.

### 2. English — "like someone breathes the word, not pronounces them"

Correct, and it is the predictable consequence of the previous addendum's own finding.
Bare stops needed 11–55× gain, and gaining a near-silent burst amplifies the noise floor
rather than the sound — the owner heard exactly what the measurements predicted.

**Fix: consonant + schwa** (`/kə/` not `/k/`) — the "kuh" form. This is how synthetic
phonics is actually delivered to young children, and it is *already* what Vietnamese does:
`cờ`, `mờ`, `bờ`. Aligning the two modes was the literacy-designer's argument for sound-tiles
in the first place, and it turns out to also be the fix for audibility.

| | Raw peak before gain | Gain needed |
|---|---|---|
| Bare phonemes (rejected) | 0.018 – 0.067 | **11–55×** |
| **Consonant + schwa** | **0.229 – 0.423** | **1.7–4.0×** |

An order of magnitude more real signal. Nothing is being rescued by amplification any more.

A/B files, each the full alphabet in one clip:

- `samples/audio/en-schwa/ALL-26-schwa.wav` (20.5 s) — the fix
- `samples/audio/en-phonemes/ALL-26-bare.wav` (17.3 s) — what was rejected

### Resulting engine split

| Asset | Engine | Why |
|---|---|---|
| Whole words, both languages | **edge-tts** | Neural quality; northern Vietnamese |
| Vietnamese tile sounds (`mờ`, `eo`, `huyền`) | **edge-tts** | They are ordinary text |
| **English letter sounds** | **Piper phoneme API** | edge-tts has no phoneme-level input; only Piper can synthesise `/kə/` directly |

Piper is retained for exactly one job. That is worth keeping rather than collapsing to a
single engine, because it is the only path to a letter *sound* rather than a letter *name*.

---

## Addendum — audio settled by owner review (2026-09-22, round 3)

Three rounds of owner listening replaced every original audio choice. The engine that was
spiked first is now used for none of the shipped assets.

### English — decided

**`edge-tts` / `en-US-JennyNeural`, "sound + anchor word" format, rate `-35%`.** The owner
picked `C-sound-plus-word-Jenny.mp3` from four candidates, then `speedminus35` from three
speeds. **English audio is closed.**

| Round | Approach | Owner verdict |
|---|---|---|
| 1 | Piper, bare phonemes `/k/` | *"like someone breathes the word, not pronounces them"* |
| 2 | Piper, consonant + schwa `/kə/` | *"doesn't seem to improve"* |
| 3 | **edge-tts, `"kuh, cat"`** | **chosen** |

**The lesson is about method, not audio.** Round 2 was justified with a measurement —
signal rose from 0.018–0.067 to 0.229–0.423 raw peak, an order of magnitude — and the
measurement was true and the conclusion was wrong. *Amplitude is not intelligibility.*
Nobody on this project can hear, so audio quality is the one property here that **cannot be
verified below Tier 5** and must go to the owner rather than to a harness. Two rounds were
spent inferring an audible property from a number.

A bug was ruled out before the approach was abandoned: the Piper phoneme path round-trips
correctly against the text path (BOS/pad/EOS ids present, 0.569 s vs 0.557 s for the same
word). The API was used correctly; the idea was wrong.

**Consequence the format carries.** `"kuh, cat"` is ~3× the length of a bare sound, and a
4-year-old tapping six tiles in four seconds would stack six sentences. Each letter
therefore ships **two clips** — `c-long.mp3` ("kuh, cat") on first touch, `c-short.mp3`
("kuh") on repeat taps. Generated with a `manifest.json` in `samples/audio/en-final/`.

**Anchor words are curriculum, not audio config.** `c → cat`, `x → box`, `i → igloo`. They
belong to the literacy-designer, and some are weak for this child — `igloo` is not a word a
Vietnamese 4-year-old has any referent for.

### Vietnamese — narrowed, not yet closed

Five keyless engines were put through a **dialect diagnostic** rather than a general
listen (`samples/dialect-test/README.md`). The sentence is
`mả, mã. sa, xa. cha, tra. da, gia, ra. vào.`, where every group flips by region — northern
merges the consonant sets and splits `hỏi`/`ngã`; southern does the reverse.

| Engine | Verdict |
|---|---|
| Piper `vais1000` | southern — rejected |
| edge-tts `HoaiMy` / `NamMinh` | *"really good, but still southern"* |
| Piper `25hours_single` | not selected |
| **gTTS (Google Translate)** | **"close to what I want"** |

So **Google's Vietnamese is the right accent family.** A fuller set is at
`samples/audio/vi-google/`, including a dialect re-check, the six tones, and — mirroring the
English decision — a `"mờ, mèo"` sound-plus-word form to test whether the two modes should
match.

**gTTS is not the right long-term source**, for two reasons that are not about quality:

1. **It has two speeds.** `slow=True` or nothing. The owner has asked for "slower" in both
   languages, and a fixed pair of speeds cannot answer that.
2. **It is the unofficial Google Translate endpoint** — undocumented, rate-limited and
   liable to change.

**Recommendation: Google Cloud TTS.** Same voice family, officially supported, with
`speakingRate` as a continuous parameter and several `vi-VN` voices to choose from rather
than one. Usage here is roughly 2,000 characters total, against a free tier measured in
millions — effectively free, but it **needs the owner's API key**.

### Resulting engine split

| Asset | Engine | Status |
|---|---|---|
| English letter sounds | edge-tts `en-US-JennyNeural`, sound + anchor word | **decided** — rate `-35%` |
| English words | edge-tts `en-US-JennyNeural` | follows the above |
| Vietnamese words and tiles | Google (gTTS now, Cloud TTS if the owner supplies a key) | **accent confirmed**, voice and speed pending |
| — | ~~Piper~~ | **no longer used for any shipped asset** |

Piper earned its place in the first spike and lost it to three rounds of listening. The
models stay on disk because they cost nothing; nothing depends on them.
