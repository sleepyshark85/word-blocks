// What a licence obliges — in ONE place, because two tools disagreed about it.
//
// `tools/pack-validate.mjs` and `tools/pack-attributions.mjs` both decide whether an
// image can be shipped, from the same `images[]` entries, and they reached different
// answers on the same two photographs: the validator passed `đèn` and `mũi` (public
// domain, `creator: null`) and the attributions generator refused to let the pack be
// published over them. The validator was right.
//
// **Two tools disagreeing about the same evidence is how a licensing claim gets made
// twice with different answers.** This project has already shipped an `ATTRIBUTION.md`
// that said "No third-party photographs in this pack yet" while 269 of them sat beside it
// in the same directory. So the predicate lives here and both tools import it; they can
// now be wrong together, which is fixable, rather than wrong differently, which is not
// detectable.
//
// Every rule is from `image-sourcing.md` §Licensing and `content-pipeline.md` §11.

/**
 * Sources that are ours and carry no third-party obligation at all.
 * `camera` and `own-work` are the family's; `generated` is this pipeline's.
 */
export const OWN_SOURCES = ['camera', 'own-work', 'generated'];
export function isOurs(source) {
  return OWN_SOURCES.includes(source);
}

/**
 * Licences that grant the work with **no attribution obligation**, because there is no
 * rights-holder left to credit.
 *
 * A `creator: null` on one of these is the correct, honest representation of "nobody
 * holds this" — **not missing data**, and demanding a name would push the next curator to
 * invent one. `pack-validate.mjs` records that requiring an author unconditionally already
 * silently deleted three usable photographs (a pile of oranges under `cam`, and one each
 * under `đèn` and `mũi`) before anybody noticed.
 *
 * `Phạm vi công cộng` is Wikimedia's Vietnamese rendering of "public domain" and appears
 * in `packs/vi-seed` today. It was **not** matched before this file existed, so that image
 * was silently in the attribution-required bucket; it happens to carry an author, which is
 * the only reason nothing failed. A latent false blocker is still a false blocker.
 */
const PUBLIC_DOMAIN = [
  /public domain/i,
  /^\s*pdm\b/i,
  /\bcc0\b/i,
  /no known copyright/i,
  /phạm vi công cộng/i,     // vi.wikipedia's public-domain tag
];

/**
 * **Anything this file does not recognise requires attribution.** That is the safe
 * direction and it is deliberate: an unknown string means nobody has read the terms, and
 * the cost of crediting a work that needed no credit is a line in a table, while the cost
 * of not crediting one that did is a licence breach.
 *
 * `Copyrighted free use` is the live example — a Commons tag meaning the holder permits
 * free use, which is **not** the same as abandoning the copyright. It falls through to
 * strict, which is correct.
 *
 * @param {string|null|undefined} license the licence string exactly as stored
 */
export function licenceObligations(license) {
  const s = typeof license === 'string' ? license.trim() : '';
  const recorded = s.length > 0;
  const publicDomain = recorded && PUBLIC_DOMAIN.some((re) => re.test(s));
  return {
    recorded,
    publicDomain,
    /** Must name an author. True for CC BY, CC BY-SA, GFDL and anything unrecognised. */
    attribution: recorded && !publicDomain,
    /** The adapted image must itself be offered under the same licence. */
    shareAlike: /by-sa/i.test(s),
    /** GFDL: the FULL licence text must ship with the work, and 1.2-only cannot be
     *  relicensed as CC BY-SA. The heaviest obligation in this pack, and it arrives on
     *  Commons looking like any other free licence. */
    licenceText: /\bGFDL\b|GNU Free Documentation/i.test(s),
    /** The pipeline crops and resizes, which NoDerivatives forbids outright. */
    noDerivatives: /\bnd\b|NoDeriv/i.test(s),
    /** Publishing to a store would have to unpick this first. */
    nonCommercial: /\bnc\b|noncommercial|non-commercial/i.test(s),
  };
}

/**
 * The fields an image MUST carry before it can be shipped, given its own licence.
 * Returns the ones that are missing — an empty array means the obligation is discharged.
 *
 * `license` and `sourceUrl` are required even for a public-domain work, because without
 * them nobody can check the claim that no attribution is necessary. That asymmetry is the
 * point: the claim "this needs no credit" has to be auditable.
 *
 * @param {object} image one entry of a word's `images[]`
 * @returns {string[]} missing required keys, in a stable order
 */
export function missingCredit(image) {
  const im = image ?? {};
  if (isOurs(im.source)) return [];
  const ob = licenceObligations(im.license);
  const required = ob.attribution || !ob.recorded
    ? ['license', 'sourceUrl', 'creator']
    : ['license', 'sourceUrl'];
  // A FIELD OF SPACES IS NOT A FIELD. `"license": "   "` is truthy, so a plain `!im[k]`
  // let it through while `licenceObligations` — which trims — had already concluded
  // nothing was recorded. The image would then ship with a blank licence cell in
  // ATTRIBUTION.md and a `creator` requirement derived from a licence nobody wrote.
  // Found by the obligation table in `pack-validate.test.mjs`, which is the only reason
  // this line says `.trim()`.
  return required.filter((k) => typeof im[k] !== 'string' || im[k].trim() === '');
}

/** True iff this image may be shipped as-is. The one predicate both tools ask. */
export function isAttributable(image) {
  return missingCredit(image).length === 0;
}
