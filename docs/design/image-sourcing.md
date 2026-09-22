# Image sourcing — decision and evidence

**Owner's decision: real photographs, several per word.** Recorded 2026-09-22, overriding
the hybrid emoji recommendation that preceded it.

The "several per word" half of that instruction is not a complication — it is the answer to
the objection raised against photos. A single photo teaches *that cat*; four varied photos
teach *cat*. Exemplar variety is how a category is learned, and it also means one weak
image is diluted rather than decisive.

What remained was the real problem: **curation at 150 words × several images.**

## Sources measured

Yields below are from visual review of every candidate — not from result counts.

| Source | Key needed | Usable yield | Notes |
|---|---|---|---|
| Openverse free-text | no | **~28%** | Unsafe results appeared. Rejected as primary. |
| Commons category members | no | **~30%** | Real subject matter, wildly variable framing. |
| **Wikipedia lead image** | no | **~77%** | **Human-curated prototype. Chosen as primary.** |
| Pexels / Unsplash / Pixabay | **free key** | untested | Expected best; needs the owner's five minutes. |

### Openverse free-text — rejected

`category=photograph` fixed the catfish, and the rest still failed:

- **cat** — 5 of 12 usable. Rejects included a man holding a kitten (the child cannot tell
  whether the new word means the man or the cat) and two where the cat is a distant speck.
- **bird** — 4 of 12. Rejects included **three people at a press conference**, a wooden
  sculpture, a painting, a sunset, and two images with watermark text burned in.
- **car** — **0 of 12.** An F1 car, a train, a subway press conference, a Tesla dealership
  sign, a pure-text newspaper advertisement, an abstract black-and-white wreck, and a
  vintage advertisement with pin-up figures captioned *"BOMBS!"*.

That last one is the finding that closes the question. A pipeline feeding a 4-year-old's
picture dictionary cannot have *"nobody looked at it"* anywhere in its description.
Relevance ranking is not judgement.

### Wikipedia lead images — chosen

A Wikipedia article's lead image was selected by a person to be the single most
representative picture of the concept. That is exactly the prototype a toddler needs.

Measured over 20 words (13 returned before rate-limiting), **10 of 13 were good or very
good**:

| Very good | Adequate | Weak |
|---|---|---|
| Cat (Siamese, plain wall) · Car (**Toyota Corolla**, not an F1 car) · Apple (on white) · Milk (glass on blue) · Moon · Duck · Chicken · Bus (London double-decker) · Bird (nuthatch in flight) · Ball (a pile of balls — good for the category) | Fish · Banana (many varieties, busy) | Dog (huskies in harness, plural and cluttered) |

The failures are *busy*, not *wrong*. No press conferences, no advertisements, nothing
unsafe. That difference matters more than the yield number.

## The pipeline

```
1. Wikipedia lead image          →  the primary picture      (~77% good, keyless)
2. Commons category members      →  the variety              (~30% good, keyless)
3. Visual curation               →  every image reviewed     (demonstrated, see below)
4. Mother's own photo            →  per-word override        (best of all)
```

**Curation is solved by looking.** Candidates are fetched into numbered contact sheets by
`tools/fetch-candidates.mjs` and `tools/fetch-wiki-candidates.mjs`, and reviewed by eye —
which is how the press conference, the sculpture and the "BOMBS!" advertisement were caught
here. Nothing reaches the seed pack unlooked-at. The tools deliberately do **not** choose;
they only assemble candidates for a reviewer.

## Two findings the pipeline must carry

**Rate limits are real.** Wikipedia returned `429 Too many requests` after 13 consecutive
fetches. The pipeline needs throttling and resumability; a 150-word run is a long job, not
a loop.

**Wikipedia's lead images are Anglo-centric.** "Bus" returns a London double-decker. For
Vietnamese mode, `vi.wikipedia.org` should be the source instead — a Vietnamese child
should see a Vietnamese bus. This also partly answers the cultural-vocabulary gap (`phở`,
`nón lá`, `áo dài`), which has no emoji and no English Wikipedia prototype worth using.

## Licensing

Commons files are individually licensed — mostly CC BY-SA, CC0 or public domain — and each
candidate's licence and author are recorded in `candidates.json` as it is fetched. **This
is a per-image attribution obligation.** It is invisible for a private family app and
becomes a real deliverable if the owner publishes: an attributions screen, generated from
the pack rather than maintained by hand.

`nc` and `nd` licences are excluded at fetch time — `nc` because publishing stays an
option, `nd` because the pipeline resizes and crops, which a NoDerivatives term forbids.

## Open for the owner

1. **A free Pexels or Unsplash API key.** Five minutes, and these are professionally shot,
   clean-background, well-tagged libraries. Expected to beat 77% substantially and to cut
   the curation burden. This is the single highest-value thing the owner can supply.
2. **Paid AI image generation** — a coherent custom set, roughly a few dollars for 150
   words. Needs a key and a budget. Not yet evaluated; there is no generator on this
   machine.
3. Fluent Emoji 3D is **retained as the fallback** for words where no acceptable photo is
   found, rather than shipping a word with no picture.
