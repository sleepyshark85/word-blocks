# Seed word list — both languages

Owner: literacy-designer. Companion to `literacy-vi.md` and `literacy-en.md`.

**Revision 5, 2026-09-23 — this document needed no correction, and that is the point.** The
owner moved the character table to the 29-letter alphabet, but the **model is unchanged**:
a Vietnamese word is still `onset | rime | tone` and an English word is still a sequence of
sounds. Only the *input* changed — `ch` is now entered as `c` then `h`, and is still one âm
đầu (`literacy-vi.md` §0). **Every Decomposition below is still correct.** What changed is
the tap count: Vietnamese words now take 3–6 taps (mean 4.08) instead of 2–3, and 5 English
words (`ship` `fish` `duck` `sock` `egg`) take one more tap than their tile count.
**50 of 50 Vietnamese and 40 of 40 English words remain buildable; none becomes absurd.**

**This is a seed, not a universe.** His mother adds, edits and deletes words without a
developer (`docs/development-process.md` §4). Everything below exists to give her a correct
pattern to copy, and to give the app enough content to be playable on day one.

---

## 1. Decision: separate lists, one shared *asset* concept

**Decided: two independent word lists, one per language. They are not two views of one
list.**

"Shared picture, two words" is tempting — `cat`/`mèo` over one picture halves the image
work. Reject it, for three reasons:

1. **The curricula do not line up.** `cat` is a stage-1 English word: three tiles, short `a`,
   the most common word in the list. `mèo` is `m + eo + huyền` — it needs a glide-final rime
   and a tone mark, which puts it at Vietnamese stage 2 at the earliest. A shared entry
   would have to carry two unrelated difficulty ratings, two unrelated tile decompositions
   and two unrelated family memberships. It is one row pretending to be two.
2. **It violates the no-mixing rule in spirit, and then in fact.** A shared row means every
   runtime read of it is one field away from the other language. Every fallback (`vi` word
   missing → show `en`), every default, every empty string is a leak path, and
   `development-process.md` §4 names exactly this as what the tester hunts. The cheapest
   defence is that the other language's word is **not in the object**.
3. **It constrains her.** She should be able to add `phở` to the Vietnamese list without
   being asked what the English word is. There isn't one.

**What is shared is the asset, not the entry.** Each entry may carry an optional
`assetConcept` id used *only by the build-time asset pipeline*, so `cat` and `mèo` download
and store one image instead of two. At runtime each entry carries its own resolved image
path and the concept id is never read.

> **Rule for the content-engineer:** `assetConcept` is a build-time key. If it appears in
> any code path that runs while the game is playing, that is a bug.

The lists below do overlap heavily in subject matter — animals, food, vehicles — because
those are what a 4-year-old can name. That overlap is expected and is not sharing.

---

## 2. Decision: how big

**Recommended: 40–50 words per language at launch. Delivered: 47 Vietnamese, 40 English.**

More is not better here, and this is the place where the instinct is strongest and most
wrong.

| Argument | Detail |
|---|---|
| **Repetition is the mechanism** | He learns a word by meeting it many times, not once. At ~8 words a session, 45 words means he re-meets each word roughly every six sessions. At 150 words it is every twenty — the list stops teaching and starts sampling. |
| **Every word carries a QA cost** | a picture a human must look at (`image-sourcing.md`: curation is by eye, always), an audio clip a human must listen to (`literacy-vi.md` §7.3: every toneless blend needs checking), and a decomposition that must be checked legal. At 45 words that is a day's careful work. At 150 it is not done properly, and "not done properly" here means teaching a child something wrong. |
| **Size is not the constraint** | `spike-results.md` measured ~8 MB at 150 words. Asset volume was the owner's worry and it is a non-issue. **Correctness and coherence are the constraint**, and they get worse with length, not better. |
| **The list is editable** | This is the real answer. The right long list is the one his mother builds from his actual life — his shoes, their cat, his grandmother's house. A 45-word seed that is 100% right is a better foundation for that than a 150-word seed that is 90% right, because her additions will copy the seed's patterns, including its mistakes. |

**Ceiling before quality falls: about 60 per language.** Past that, either the curation
slips or the words stop being picturable.

---

## 3. How to read the tables

| Column | Meaning |
|---|---|
| **Decomposition** | the tiles, exactly. Vietnamese: `onset \| rime \| tone`, `∅` = no onset tile. English: the tile sequence. |
| **Picture concept** | what the image must show. This is the string the content pipeline resolves, and per `image-sourcing.md` the primary source is now a **photograph** (Wikipedia lead image, `vi.wikipedia.org` for Vietnamese mode). **Unverified** — naming a photo source is the content-engineer's pipeline, not something I can check from here. |
| **Fluent fallback** | the exact Fluent Emoji 3D asset folder, retained as the fallback per `image-sourcing.md` §Open-for-the-owner item 3. **Every name in this column was verified by exact-match `grep -ix` against `samples/styles/fluent-index.txt`** (1,595 entries). A blank means no asset exists and the word is photo-only. |
| **Flag** | `PHOTO` = the Fluent fallback is wrong or absent, a photo is required. `TONE` = skin-toned asset, needs the `assets/<Name>/<Tone>/3D/<name>_3d_<tone>.png` path shape. `AMBIG` = the concept itself is ambiguous and needs an owner decision. |

**Note on this document's brief.** My brief described Fluent 3D as the default with a photo
override. `image-sourcing.md` was updated during this work to record the owner's decision
the other way round: photographs primary, several per word, Fluent retained as fallback. The
tables below follow the current file. The grep verification is unchanged in value — it is
now a verification of the *fallback*, and it is the only column here that is verified rather
than proposed.

---

## 4. Vietnamese — 47 words

Stage = earliest stage this word can appear (`literacy-vi.md` §8.3).

### Stage 1 — single-letter onset, open one-vowel rime, tones ngang/huyền (7)

| Word | Decomposition | Picture concept | Fluent fallback | Flag |
|---|---|---|---|---|
| bò | `b` \| `o` \| huyền | cow | `Cow` | |
| gà | `g` \| `a` \| huyền | chicken (hen) | `Chicken` | |
| dê | `d` \| `ê` \| ngang | goat | `Goat` | |
| bơ | `b` \| `ơ` \| ngang | avocado | `Avocado` | |
| lê | `l` \| `ê` \| ngang | pear | `Pear` | |
| xe | `x` \| `e` \| ngang | car | `Automobile` | AMBIG — `xe` is "vehicle" generally |
| tô | `t` \| `ô` \| ngang | bowl of food | `Bowl with spoon` | |

### Stage 2 — + sắc, glide-final and open-diphthong rimes (11)

| Word | Decomposition | Picture concept | Fluent fallback | Flag |
|---|---|---|---|---|
| cá | `c` \| `a` \| sắc | fish | `Fish` | |
| mèo | `m` \| `eo` \| huyền | cat | `Cat` | |
| voi | `v` \| `oi` \| ngang | elephant | `Elephant` | |
| sao | `s` \| `ao` \| ngang | star | `Star` | |
| cua | `c` \| `ua` \| ngang | crab | `Crab` | |
| mưa | `m` \| `ưa` \| ngang | rain | `Cloud with rain` | |
| dừa | `d` \| `ưa` \| huyền | coconut | `Coconut` | |
| gấu | `g` \| `âu` \| sắc | bear | `Bear` | |
| tai | `t` \| `ai` \| ngang | ear | `Ear` | TONE |
| mây | `m` \| `ây` \| ngang | cloud | `Cloud` | |
| mũ | `m` \| `u` \| ngã | hat | `Womans hat` | PHOTO — asset is an adult woman's hat; **also ngã, so stage 5 unless the owner is northern** |

### Stage 3 — + nặng, digraph and zero onsets, nasal finals (13)

| Word | Decomposition | Picture concept | Fluent fallback | Flag |
|---|---|---|---|---|
| chó | `ch` \| `o` \| sắc | dog | `Dog` | |
| chim | `ch` \| `im` \| ngang | bird | `Bird` | |
| chuối | `ch` \| `uôi` \| sắc | banana | `Banana` | |
| cam | `c` \| `am` \| ngang | orange (fruit) | `Tangerine` | AMBIG — tangerine ≠ orange |
| ong | `∅` \| `ong` \| ngang | bee | `Honeybee` | |
| bóng | `b` \| `ong` \| sắc | ball | `Soccer ball` | |
| nhà | `nh` \| `a` \| huyền | house | `House` | |
| trăng | `tr` \| `ăng` \| ngang | moon | `Crescent moon` | |
| răng | `r` \| `ăng` \| ngang | tooth | `Tooth` | |
| chân | `ch` \| `ân` \| ngang | foot / leg | `Foot` | TONE |
| áo | `∅` \| `ao` \| sắc | shirt | `T-shirt` | |
| đèn | `đ` \| `en` \| huyền | lamp / light | `Light bulb` | |
| bánh | `b` \| `anh` \| sắc | cake or bread | `Bread` | AMBIG — `bánh` is genuinely generic in Vietnamese too |

`ong` and `bóng` share the rime `ong` and differ only by onset and tone — a good pair, and
also a pair that must **not** appear together as answer options below stage 3.

### Stage 4 — + hỏi, stop-final rimes (8)

| Word | Decomposition | Picture concept | Fluent fallback | Flag |
|---|---|---|---|---|
| thỏ | `th` \| `o` \| hỏi | rabbit | `Rabbit` | |
| khỉ | `kh` \| `i` \| hỏi | monkey | `Monkey` | |
| hổ | `h` \| `ô` \| hỏi | tiger | `Tiger` | |
| cửa | `c` \| `ưa` \| hỏi | door | `Door` | |
| mắt | `m` \| `ăt` \| sắc | eye | `Eye` | |
| vịt | `v` \| `it` \| nặng | duck | `Duck` | |
| sách | `s` \| `ach` \| sắc | book | `Open book` | |
| trứng | `tr` \| `ưng` \| sắc | egg | `Egg` | |

`mắt`, `vịt` and `sách` have stop finals, so their tone rows are 2 tiles, not 6
(`literacy-vi.md` §5.2).

> **Correction (orchestrator, 2026-09-23).** This paragraph originally read *"`thỏ` and `hổ`
> differ only by onset on the same rime and tone."* **That is false, and the error had
> propagated into the built pack**, where `hổ` carried the rime `o` and therefore composed
> to `hỏ`. The rimes are different: `thỏ` = `th` + `o`, `hổ` = `h` + `ô`. The row above is
> corrected and `packs/vi-seed/words/ho.json` is patched; its toneless blend audio had also
> been generated as *"ho"* rather than *"hô"* and is marked stale for regeneration.
>
> `tools/pack-validate.mjs` caught this by composing the decomposition and comparing it to
> the spelling — a check that exists precisely because a plausible-looking pedagogical claim
> is not evidence. The near-miss pairing was attractive and wrong, which is the shape of
> error most likely to reach a child.

### Stage 5 — + ngã, spelling-rule onsets, medial rimes (8)

| Word | Decomposition | Picture concept | Fluent fallback | Flag |
|---|---|---|---|---|
| mũi | `m` \| `ui` \| ngã | nose | `Nose` | TONE |
| sữa | `s` \| `ưa` \| ngã | glass of milk | `Glass of milk` | |
| ngựa | `ng` \| `ưa` \| nặng | horse | `Horse` | |
| kem | `k` \| `em` \| ngang | ice cream | `Ice cream` | **teaches `k` before `e`** |
| ghế | `gh` \| `ê` \| sắc | chair | `Chair` | **teaches `gh` before `ê`** |
| giày | `gi` \| `ay` \| huyền | shoe | `Running shoe` | **the `gi` onset** |
| quạt | `qu` \| `at` \| nặng | electric fan | `Folding hand fan` | PHOTO — asset is a folding hand fan; **the `qu` onset** |
| hoa | `h` \| `oa` \| ngang | flower | `Hibiscus` | PHOTO — `hoa` is flower generally; several varied photos is the right answer here |

### Cultural vocabulary — photo required, no emoji exists (appendix)

These are not in the 47 because they cannot ship until a photo exists. They are here because
they are the words that prove the photo path is **required in v1, not optional**
(`spike-results.md`), and because they are words this particular child actually uses.

| Word | Decomposition | Picture concept | Fluent fallback | Flag |
|---|---|---|---|---|
| phở | `ph` \| `ơ` \| hỏi | a bowl of phở | *(none)* | PHOTO — `vi.wikipedia.org/wiki/Phở` |
| nón | `n` \| `on` \| sắc | a nón lá (conical hat) | *(none)* | PHOTO |
| bún | `b` \| `un` \| sắc | a bowl of bún | *(none)* | PHOTO |

### The `ngh` onset has no seed word

Deliberate, not an omission. See `literacy-vi.md` §4.2: there is no picturable monosyllabic
noun in a 4-year-old's Vietnamese beginning with `ngh`. It is taught by the palette rule
(the generator never offers it before a non-front rime) rather than by an example.

---

## 5. English — 40 words

Stage = earliest stage (`literacy-en.md` §6.2). Grouped by word family, because the family
**is** the progression and the distractor set (`literacy-en.md` §6.2).

### Stage 1 — CVC, short `a` (11)

| Word | Tiles | Family | Picture concept | Fluent fallback | Flag |
|---|---|---|---|---|---|
| cat | `c` `a` `t` | -at | cat | `Cat` | |
| hat | `h` `a` `t` | -at | hat | `Top hat` | |
| bat | `b` `a` `t` | -at | bat (the animal) | `Bat` | AMBIG — English `bat` is also a baseball bat; the picture decides which word he learns |
| rat | `r` `a` `t` | -at | rat | `Rat` | |
| map | `m` `a` `p` | -ap | map | `World map` | |
| cap | `c` `a` `p` | -ap | cap | `Billed cap` | |
| bag | `b` `a` `g` | -ag | bag | `Backpack` | PHOTO — a backpack is not a bag |
| van | `v` `a` `n` | -an | van | `Delivery truck` | PHOTO — a truck is not a van |
| pan | `p` `a` `n` | -an | frying pan | `Shallow pan of food` | |
| fan | `f` `a` `n` | -an | electric fan | `Folding hand fan` | PHOTO — a 4-year-old means an electric fan |
| ant | `a` `n` `t` | — | ant | `Ant` | VCC — no onset tile, same shape as Vietnamese `ong` |

`cat` / `hat` / `bat` / `rat` is the strongest set in the list: one tile changes, the picture
changes, and **every wrong answer is also a real word with its own picture.**

### Stage 2 — + short `e` (6)

| Word | Tiles | Family | Picture concept | Fluent fallback | Flag |
|---|---|---|---|---|---|
| bed | `b` `e` `d` | -ed | bed | `Bed` | |
| pen | `p` `e` `n` | -en | pen | `Fountain pen` | PHOTO — a fountain pen is not what he has seen |
| hen | `h` `e` `n` | -en | hen | `Chicken` | AMBIG — generic chicken |
| net | `n` `e` `t` | -et | net | `Goal net` | PHOTO — asset is a football goal |
| web | `w` `e` `b` | -eb | spider web | `Spider web` | |
| leg | `l` `e` `g` | -eg | leg | `Leg` | TONE |

### Stage 3 — + short `i` (3)

| Word | Tiles | Family | Picture concept | Fluent fallback | Flag |
|---|---|---|---|---|---|
| pig | `p` `i` `g` | -ig | pig | `Pig` | |
| pin | `p` `i` `n` | -in | pin | `Pushpin` | |
| bin | `b` `i` `n` | -in | bin | `Wastebasket` | AMBIG mild |

**Short `i` is the sparsest vowel for picturable CVC nouns** (`literacy-en.md` §5.2). `wig`,
`fig`, `bib`, `lid`, `kit`, `zip`, `fin` are all real words with no picture a 4-year-old
recognises uncaptioned. Three words is the correct length for this stage, not a gap.

### Stage 4 — + short `o` (5)

| Word | Tiles | Family | Picture concept | Fluent fallback | Flag |
|---|---|---|---|---|---|
| dog | `d` `o` `g` | -og | dog | `Dog` | |
| log | `l` `o` `g` | -og | log of wood | `Wood` | |
| box | `b` `o` `x` | -ox | cardboard box | `Package` | AMBIG mild |
| fox | `f` `o` `x` | -ox | fox | `Fox` | |
| pot | `p` `o` `t` | -ot | cooking pot | `Pot of food` | |

`box` / `fox` is the `x` = /ks/ pair (`literacy-en.md` §3.1) and both are final-position, as
required.

### Stage 5 — + short `u` (7)

| Word | Tiles | Family | Picture concept | Fluent fallback | Flag |
|---|---|---|---|---|---|
| bus | `b` `u` `s` | -us | bus | `Bus` | |
| sun | `s` `u` `n` | -un | sun | `Sun` | |
| cup | `c` `u` `p` | -up | cup | `Cup with straw` | |
| bug | `b` `u` `g` | -ug | bug / beetle | `Bug` | |
| mug | `m` `u` `g` | -ug | mug | `Hot beverage` | AMBIG mild |
| nut | `n` `u` `t` | -ut | nut (to eat) | `Peanuts` | AMBIG mild — plural; Fluent `Nut and bolt` is the **wrong sense**, do not use it |
| hut | `h` `u` `t` | -ut | hut | `Hut` | |

### Stage 6 — consonant digraphs, each one tile (5)

| Word | Tiles | Picture concept | Fluent fallback | Flag |
|---|---|---|---|---|
| ship | `sh` `i` `p` | ship | `Passenger ship` | |
| fish | `f` `i` `sh` | fish | `Fish` | `sh` in final position |
| duck | `d` `u` `ck` | duck | `Duck` | `ck` — final only |
| sock | `s` `o` `ck` | sock | `Socks` | AMBIG mild — plural |
| egg | `e` `gg` | egg | `Egg` | 3 letters, **2 tiles**, no onset |

`ship` and `fish` between them put `sh` in both positions — worth keeping adjacent.

### Stage 7 — initial blends, two tiles for two sounds (3)

| Word | Tiles | Picture concept | Fluent fallback | Flag |
|---|---|---|---|---|
| frog | `f` `r` `o` `g` | frog | `Frog` | 4 tiles |
| crab | `c` `r` `a` `b` | crab | `Crab` | 4 tiles |
| drum | `d` `r` `u` `m` | drum | `Drum` | 4 tiles |

All three use the `r`-blend on purpose: one new idea (two tiles, one onset), one consonant,
three chances to meet it. Stage 7 is the first time the answer frame has four slots, which
is itself a change and should not be combined with a new blend type.

---

## 6. Verification record

| Claim | How it was checked |
|---|---|
| Every `Fluent fallback` name exists | re-extracted from this document and exact-matched (`grep -ix`) against `samples/styles/fluent-index.txt` — **79 distinct names, 0 misses** |
| `Ear`, `Foot`, `Nose`, `Leg` use the skin-toned path shape | HTTP fetched both path shapes from jsDelivr. Plain path → **404**, `<Name>/Default/3D/<name>_3d_default.png` → **200** |
| `Eye`, `Tooth` use the plain path shape | Same method. Plain → **200**, toned → **404** |
| `phở`, `nón`, `bún` have no Fluent asset | `grep -i` for `pho`, `noodle`, `ramen`, `cone`, `hat` — no conical hat, no noodle soup in the index |
| Picture concepts (photo source) | **Not verified.** These are proposed search terms; resolving them is the content pipeline's job (`image-sourcing.md`), and Wikipedia rate-limits at ~13 consecutive fetches. |

**Two flags for whoever builds the asset pipeline:**

1. Four Vietnamese and one English entry hit the skin-toned path shape — the shape that
   silently lost a picture in the spike (`spike-results.md`). `tai`, `chân`, `mũi`, `leg`.
2. **A disembodied body part is a hard picture at age 4 regardless of source.** `mũi` (nose)
   and `tai` (ear) as floating objects are more confusing than a face with the part
   highlighted. These are the four entries most likely to need the mother's own photo — of
   his own nose, his own ear — which `image-sourcing.md` already identifies as the best
   source available.

---

## 7. Counts

| | Vietnamese | English |
|---|---|---|
| Shipping words | **47** | **40** |
| Photo required (no usable Fluent fallback) | 4 + 3 appendix | 4 |
| Ambiguous concept, needs an owner call | 3 | 6 |
| Skin-toned asset path | 3 | 1 |
| Distinct rimes / families used | 32 rimes | 17 families |
| Distinct onsets / tiles used | 20 onsets + ∅ | 20 letters + 3 digraphs |
