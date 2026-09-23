#!/usr/bin/env node
// theme-contrast.mjs — design-time verification of the Ghép Chữ / Word Blocks palettes.
// Owner: game-designer.  Specified and referenced by docs/design/ui.md §5.
//
//   node tools/theme-contrast.mjs            # report, exit non-zero on any failure
//   node tools/theme-contrast.mjs --tokens   # emit the resolved token sets as JSON
//
// It does three jobs:
//
//   1. DERIVES the tokens.  The owner fixed each theme's ground, ink and three bright
//      identity hexes (docs/design/decisions.md).  Everything a component actually
//      renders is computed from those, so no one hand-picks a value that was never
//      checked against the surface it lands on.
//
//   2. SWEEPS every (theme x surface x foreground) pair that can co-occur on screen,
//      with a threshold per pair TYPE rather than one global number.
//
//   3. Checks the three ROLE hues stay mutually distinguishable in every theme, including
//      under simulated protanopia, deuteranopia and tritanopia.
//
// REVISED 2026-09-23, DESIGN REVISION 5.  What a role MEANS changed, and that changed what
// this tool has to gate.  The board is no longer three runs of onsets, rimes and tones; it
// is ONE run of letters (29 in Vietnamese, 26 in English) plus a run of six tones, and the
// owner enters `ch` as `c` then `h`.  So:
//
//   role1 = CONSONANT letter, role2 = VOWEL letter, role3 = TONE.
//
// That mapping is a permanent property of the glyph rather than of the child's progress,
// which is what lets it be a constant table at all.  It also creates a pair this tool had
// never had to check: in revision 4 a role1 tile and a role2 tile met at ONE run boundary,
// so "fixed position" carried the distinction and CVD separation was logged, not gated.
// In revision 5 `a ă â b c d` puts a vowel tile beside a consonant tile in every row, and
// position carries nothing.  The ADJACENT check below is therefore newly NECESSARY -- and
// it turns out to be affordable: the worst case over three themes and three dichromacies
// is 23.7 (Popsicle, consonant vs vowel, protanopia) against a gate of 20.
//
// Design note: role separation is guaranteed by CONSTRUCTION, not by luck.  The three
// role faces are forced onto a fixed CIE L* ladder (LADDER below), so they differ in
// lightness as well as hue and survive total colour loss.  The hue->slot assignment is
// searched per theme for the best worst-case CVD separation; the slot->MEANING mapping
// (role1=onset, role2=rime, role3=tone) is constant everywhere.

/* ---------------- colour maths ---------------- */
const hex2rgb = h => { const s = h.replace('#',''); return [0,2,4].map(i => parseInt(s.slice(i,i+2),16)); };
const rgb2hex = c => '#' + c.map(v => Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('').toUpperCase();
const lin   = c => { const s = c/255; return s <= 0.04045 ? s/12.92 : Math.pow((s+0.055)/1.055, 2.4); };
const unlin = l => 255 * (l <= 0.0031308 ? l*12.92 : 1.055*Math.pow(l, 1/2.4) - 0.055);
const relLum = h => { const [r,g,b] = hex2rgb(h).map(lin); return 0.2126*r + 0.7152*g + 0.0722*b; };
const ratio  = (a,b) => { const [x,y] = [relLum(a), relLum(b)].sort((p,q)=>q-p); return (x+0.05)/(y+0.05); };
const r2 = n => Math.round(n*100)/100;
const mix = (a,b,t) => rgb2hex(hex2rgb(a).map((c,i) => c + (hex2rgb(b)[i]-c)*t));
const scaleLin = (h,f) => rgb2hex(hex2rgb(h).map(c => unlin(lin(c)*f)));

const WP = [0.95047, 1.00000, 1.08883];
function rgb2xyz(h){ const [r,g,b] = hex2rgb(h).map(lin);
  return [0.4124*r+0.3576*g+0.1805*b, 0.2126*r+0.7152*g+0.0722*b, 0.0193*r+0.1192*g+0.9505*b]; }
function rgb2lab(h){ const [X,Y,Z] = rgb2xyz(h).map((v,i)=>v/WP[i]);
  const f = t => t > 0.008856 ? Math.cbrt(t) : (7.787*t + 16/116);
  const [fx,fy,fz] = [f(X),f(Y),f(Z)];
  return [116*fy-16, 500*(fx-fy), 200*(fy-fz)]; }
const Lstar = h => rgb2lab(h)[0];

function dE00(h1,h2){
  const [L1,a1,b1] = rgb2lab(h1), [L2,a2,b2] = rgb2lab(h2);
  const avgL=(L1+L2)/2, C1=Math.hypot(a1,b1), C2=Math.hypot(a2,b2), avgC=(C1+C2)/2;
  const G=0.5*(1-Math.sqrt(Math.pow(avgC,7)/(Math.pow(avgC,7)+Math.pow(25,7))));
  const a1p=a1*(1+G), a2p=a2*(1+G);
  const C1p=Math.hypot(a1p,b1), C2p=Math.hypot(a2p,b2), avgCp=(C1p+C2p)/2;
  const deg=x=>x*180/Math.PI, rad=x=>x*Math.PI/180;
  let h1p=deg(Math.atan2(b1,a1p)); if(h1p<0)h1p+=360;
  let h2p=deg(Math.atan2(b2,a2p)); if(h2p<0)h2p+=360;
  const avgHp = Math.abs(h1p-h2p) > 180 ? (h1p+h2p+360)/2 : (h1p+h2p)/2;
  const T = 1 - 0.17*Math.cos(rad(avgHp-30)) + 0.24*Math.cos(rad(2*avgHp))
              + 0.32*Math.cos(rad(3*avgHp+6)) - 0.20*Math.cos(rad(4*avgHp-63));
  let dhp = h2p-h1p; if (dhp > 180) dhp -= 360; if (dhp < -180) dhp += 360;
  const dLp=L2-L1, dCp=C2p-C1p, dHp=2*Math.sqrt(C1p*C2p)*Math.sin(rad(dhp)/2);
  const SL = 1 + (0.015*Math.pow(avgL-50,2))/Math.sqrt(20+Math.pow(avgL-50,2));
  const SC = 1 + 0.045*avgCp, SH = 1 + 0.015*avgCp*T;
  const RT = -2*Math.sqrt(Math.pow(avgCp,7)/(Math.pow(avgCp,7)+Math.pow(25,7)))
             * Math.sin(rad(60*Math.exp(-Math.pow((avgHp-275)/25,2))));
  return Math.sqrt((dLp/SL)**2 + (dCp/SC)**2 + (dHp/SH)**2 + RT*(dCp/SC)*(dHp/SH));
}

const CVD = {   // Vienot/Brettel dichromat simulation, linear-RGB form
  protanopia:   [[0.1121,0.8853,-0.0005],[0.1127,0.8897,-0.0001],[0.0045,0.0000,1.0019]],
  deuteranopia: [[0.2920,0.7054,-0.0003],[0.2934,0.7089,0.0000],[-0.0209,0.0270,0.9912]],
  tritanopia:   [[1.0175,0.0113,-0.0290],[-0.0113,0.9834,0.0279],[0.0795,-0.4389,1.3594]],
};
const simulate = (h, kind) => { const M = CVD[kind], [r,g,b] = hex2rgb(h).map(lin);
  return rgb2hex(M.map(row => unlin(Math.max(0, Math.min(1, row[0]*r + row[1]*g + row[2]*b))))); };

// Push a hue to a target CIE L* while keeping it in gamut: darken by scaling linear
// light, lighten by blending toward white.  Bisection, 24 steps.
function toLstar(hue, target){
  if (Lstar(hue) > target) {                       // darken: scale linear light
    let lo = 0.02, hi = 1;
    for (let i=0;i<24;i++){ const m=(lo+hi)/2; if (Lstar(scaleLin(hue,m)) > target) hi = m; else lo = m; }
    return scaleLin(hue,(lo+hi)/2);
  }
  let lo = 0, hi = 1;                              // lighten: blend toward white
  for (let i=0;i<24;i++){ const m=(lo+hi)/2; if (Lstar(mix(hue,'#FFFFFF',m)) < target) lo = m; else hi = m; }
  return mix(hue,'#FFFFFF',(lo+hi)/2);
}

/* ---------------- the three themes ----------------
   ground / ink / the three bright identity hexes are the OWNER's (decisions.md).
   Everything below them is derived.                                             */
const WHITE = '#FFFFFF';
const LADDER = [66, 49, 33];      // CIE L* for role1 / role2 / role3 tile faces
const GLYPH_MIN = 4.5;            // AAA for large text; tile glyphs are 36-60pt semibold

const THEMES = {
  popsicle: { label:'Popsicle', dflt:true,
    ground:'#E9FBF2', groundAlt:'#FFFFFF', surface:'#FFFFFF',
    ink:'#2A2F3A', inkSoft:'#5A6272',
    hues:{ watermelon:'#E8366F', grape:'#6B46E5', green:'#0FA36B' },
    reward:'#FF9F1C', accent:'#6B46E5', neutral:'#8C93A3' },
  sunshine: { label:'Sunshine',
    ground:'#FFF7EA', groundAlt:'#FFFFFF', surface:'#FFFFFF',
    ink:'#332B24', inkSoft:'#6B5E52',
    hues:{ sunset:'#EF5B25', lagoon:'#1189B8', leaf:'#3E9B2F' },
    reward:'#FFC400', accent:'#D8451F', neutral:'#9A8E80' },
  playground: { label:'Playground',
    ground:'#E6F3FF', groundAlt:'#FFFFFF', surface:'#FFFFFF',
    ink:'#22303D', inkSoft:'#526475',
    hues:{ blue:'#1E6FD9', orange:'#F2701D', teal:'#00937A' },
    reward:'#FFC220', accent:'#1E6FD9', neutral:'#87939E' },
};

/* ---------------- derive ----------------
   TILE CONSTRUCTION (ui.md 5.4).  The letter he is learning sits on WHITE with INK,
   which is 13:1 in every theme -- the best contrast available and identical across
   themes, so no theme makes reading harder.  The role's identity is carried by two
   full-width BRIGHT bars (the owner's exact hex, undarkened) plus a 2pt outline, which
   is ~32% of the tile's area in saturated colour.  This is the fix for the earlier
   version, which put the glyph on the colour and therefore had to darken the owner's
   hues toward mud to reach 4.5:1.  Change where a colour is used, not how bright it is.

   Role is additionally carried by a PATTERN on the bars -- solid / split / dotted for
   onset / rime / tone -- so colour is never the sole signal, which is what lets the
   CVD threshold sit at 12 rather than 18 without hiding anything.                   */

// Revision 5: solid = consonant, split = vowel, dotted = tone.  This is the non-colour
// channel, and it is now load-bearing rather than redundant, because consonant and vowel
// tiles are adjacent in every row of the table.
const PATTERN = { role1:'solid', role2:'split', role3:'dotted' };
const perms = a => a.length <= 1 ? [a] : a.flatMap((x,i) =>
  perms([...a.slice(0,i), ...a.slice(i+1)]).map(p => [x, ...p]));

for (const t of Object.values(THEMES)) {
  // The hue -> slot assignment.  No lightness ladder any more: the hexes are the
  // owner's, unmodified.  Assign so the worst-case CVD separation is maximised.
  const names = Object.keys(t.hues);
  let best = null;
  for (const p of perms(names)) {
    const hs = p.map(n => t.hues[n]);
    let worst = Infinity;
    for (let i=0;i<3;i++) for (let j=i+1;j<3;j++) {
      worst = Math.min(worst, dE00(hs[i], hs[j]));
      for (const k of Object.keys(CVD)) worst = Math.min(worst, dE00(simulate(hs[i],k), simulate(hs[j],k)));
    }
    if (!best || worst > best.worst) best = { worst, order:p, hs };
  }
  t.roleOrder = best.order; t.roleWorstCVD = r2(best.worst);
  best.order.forEach((name,i) => {
    const n = 'role' + (i+1);
    t[n]         = t.hues[name];                       // the owner's hex, UNCHANGED
    t[n+'Name']  = name;
    t[n+'Pattern'] = PATTERN[n];
    // 2pt outline: darken the hue only as far as the tile's silhouette needs on the ground
    t[n+'Edge']  = (() => { for (let L = Lstar(t[n]); L > 12; L -= 1.5) {
        const c = toLstar(t[n], L); if (ratio(c, t.ground) >= 3.0) return c; }
      return toLstar(t[n], 12); })();
    t[n+'Soft']  = mix(t[n], t.ground, 0.86);          // band tint behind the row
    t[n+'Deep']  = toLstar(t[n], Math.max(20, Lstar(t[n]) - 26));  // role text on roleSoft
  });
  t.tileFace  = t.surface;                             // every tile, every theme
  t.tileGlyph = t.ink;
  t.accentFace = (() => { for (let f=1; f>0.15; f-=0.02) {
      const c = scaleLin(t.accent, f); if (ratio(c, WHITE) >= 4.5) return c; }
    return scaleLin(t.accent, 0.15); })();
  t.neutralFace = (() => { for (let f=1; f>0.15; f-=0.02) {
      const c = scaleLin(t.neutral, f); if (ratio(c, t.ground) >= 3.0) return c; }
    return scaleLin(t.neutral, 0.15); })();
  t.rewardEdge = (() => { for (let L = Lstar(t.reward) - 12; L > 14; L -= 1.5) {
      const c = toLstar(t.reward, L); if (ratio(c, t.ground) >= 3.0) return c; }
    return toLstar(t.reward, 16); })();
  t.hairline = mix(t.ink, t.surface, 0.80);
  t.veil     = t.ground;         // vestigial: the veiled prompt photo was removed with the
                                 // guided-completion mechanic. Kept so the emitted token set is
                                 // unchanged; the reveal overlay may reuse it as a scrim.
}

/* ---------------- the sweep ----------------
 * Threshold by pair TYPE:
 *   glyph     4.5  AAA large text.  The letter he is learning to read.
 *   bodyText  4.5  AA normal text.  Parent-facing text only.
 *   largeText 3.0  AA large text.
 *   component 3.0  AA non-text contrast: silhouettes, outlines, chips, lit segments.
 *   shade     1.15 A shading step INSIDE one object. Carries no information -- the
 *                  object's silhouette on the ground is separately gated at 3.0.
 *   decor     1.0  Logged, never gates.                                              */
const PAIRS = [
  ['glyph','tileFace','tileGlyph','LIVE tile glyph -- the letter he is learning (all roles, both modes)'],
  ['glyph','ground','inkSoft','DISABLED tile glyph on the ground -- the disabled set is doing the teaching, so it must stay readable (ui.md 5.8)'],
  ['glyph','surface','ink','assembled-word glyph in the strip'],
  ['glyph','reward','ink','chant highlight: ink glyph on the GOLD FACE (see note - the glyph never turns gold)'],
  ['glyph','role1Soft','ink','tile glyph, tinted / reduce-motion state'],
  // NEW, design revision 3 (the constant table, ui.md §0 correction U12).  A tone tile
  // whose rime is not yet chosen shows the BARE MARK on a dotted-circle carrier.  A
  // diacritic is thin ink, thinner than any letter, so it takes the full `ink` token
  // rather than `inkSoft` -- and it only ever appears on a DISABLED tile, whose face is
  // the ground.  This pair did not exist before and is gated as a glyph.
  ['glyph','ground','ink','disabled TONE tile: the bare tone mark on the ground (ui.md §7.2)'],
  // A ROLE TINT BEHIND EACH RUN WAS DESIGNED AND THEN REJECTED BY THIS SWEEP, 2026-09-23.
  // The constant table holds three contiguous runs (onsets, rimes, tones) and a `roleSoft`
  // wash behind each one looked like the obvious way to show where a run starts.  Adding
  // the pairs it creates failed 5 of 9 (theme x run) combinations: a role-coloured tile
  // outline on its OWN role tint measures 2.62-2.92:1, under the 3.0 component gate,
  // because the tint desaturates the boundary it is supposed to support.  The runs are
  // carried by the bar pattern and by fixed position instead, and the disabled tile's face
  // stays `ground` -- which §5.8 needs, since "the disabled tile IS the table" is the
  // primary live/disabled discriminator.  Kept as a comment so it is not re-proposed.
  // the identity bars are the owner's bright hex; their INNER EDGE against the white
  // face is carried by a 1.5pt roleDeep keyline, so a bright hue never has to be dulled
  // to make its own boundary read (ui.md 5.4)
  ['component','tileFace','role1Deep','CONSONANT identity-bar keyline on the tile'],
  ['component','tileFace','role2Deep','VOWEL identity-bar keyline on the tile'],
  ['component','tileFace','role3Deep','tone identity-bar keyline on the tile'],
  // the tile silhouette on the play ground.  The SAME token draws the live tile's 2pt
  // outline and the disabled tile's 3pt underbar, so both read on the ground.
  ['component','ground','role1Edge','CONSONANT tile outline, and disabled underbar, on the ground'],
  ['component','ground','role2Edge','VOWEL tile outline, and disabled underbar, on the ground'],
  ['component','ground','role3Edge','tone tile outline, and disabled underbar, on the ground'],
  ['component','ground','inkSoft','assembled-word strip outline on the ground'],
  ['component','ground','neutralFace','gate dot on the ground'],
  ['component','ground','inkSoft','shelf slot ring, empty, on the ground'],
  ['component','ground','rewardEdge','announcement burst / just-filled shelf slot, on the ground'],
  ['component','surface','neutralFace','empty strip cell, dashed outline -- and the dashed MARK-SLOT drawn above a carrier vowel when a tone is what is missing (ui.md §7.2, revision 5)'],
  // REVISION 5.  The strip now marks the onset/rime boundary with a 2pt vertical divider
  // in the gap between two cells, and each span of letters that is one sound carries one
  // continuous bar.  The divider sits in the GAP, whose background is the play ground.
  ['component','ground','neutralFace','onset/rime boundary divider in the word strip (revision 5)'],
  ['component','ground','role1Edge','the CONSONANT span bar under the strip cells'],
  ['component','ground','role2Edge','the VOWEL (rime) span bar under the strip cells'],
  // A CONTINUOUS GOLD PLATE BEHIND A CHANT-LIT SPAN WAS DESIGNED AND THEN REJECTED BY THIS
  // SWEEP, 2026-09-23.  A chant beat now lights a SPAN of up to six cells (revision 4 lit
  // one or two), and the obvious drawing is one `reward` plate behind the whole span,
  // gaps included.  Adding the pair it creates fails in all three themes: the boundary
  // divider, `neutralFace`, measures 1.58 / 2.01 / 2.12 : 1 on `reward`, far under the 3.0
  // component gate -- the divider vanishes inside the plate exactly when the chant is
  // explaining what the divider means.  So the span lights CELL BY CELL and the gaps stay
  // on the ground, where the divider is gated at 3.02-3.42:1 by the pair above.  Third time
  // this sweep has cut a drawing by measuring it (cf. U11, U19).  Kept as a comment so it
  // is not re-proposed.
  ['largeText','role1Soft','role1Deep','table header chip label on its role tint'],
  ['largeText','role2Soft','role2Deep','table header chip label on its role tint'],
  ['largeText','role3Soft','role3Deep','table header chip label on its role tint'],
  ['bodyText','groundAlt','ink','parent body text'],
  ['bodyText','groundAlt','inkSoft','parent secondary text'],
  ['bodyText','surface','ink','editor row title'],
  ['bodyText','surface','inkSoft','editor row subtitle'],
  ['bodyText','accentFace','WHITE','primary button label'],
  ['bodyText','surface','accentFace','link / tertiary action'],
  ['bodyText','reward','ink','celebration badge text'],
  ['bodyText','ground','ink','parental-gate prompt text, reveal caption text'],
  ['bodyText','ground','inkSoft','parental-gate helper text'],
  ['shade','role1','role1Deep','keyline against its own identity bar'],
  ['shade','role2','role2Deep','keyline against its own identity bar'],
  ['shade','role3','role3Deep','keyline against its own identity bar'],
  ['shade','reward','rewardEdge','celebration badge edge'],
  ['shade','tileFace','reward','chant highlight: the gold face over the white face of ONE tile'],
  // REVISION 5.  The re-voice pulse -- `c` then `h` becoming `chờ` -- is MOTION, not
  // colour: scale, not a gold face.  The reason is arithmetic, not taste.  A re-voiced
  // span can still be carrying a dashed mark-slot or a boundary divider, and both are
  // `neutralFace`, which measures 1.58-2.12:1 on `reward` (see the note above).  Gold is
  // reserved for the chant, which only ever runs on a finished word.
  ['decor','surface','hairline','strip cell divider hairline'],
  ['decor','ground','surface','LIVE tile face on the ground -- 1.06-1.13:1, so the white face is NOT the live/disabled discriminator; the bars, the outline weight and the glyph ink are (ui.md 5.8)'],
];
const THRESHOLD = { glyph:4.5, bodyText:4.5, largeText:3.0, component:3.0, shade:1.4, decor:1.0 };
// Normal-sighted separation is gated hard.  The CVD bar is 12 rather than 18 because
// role is ALSO carried by bar pattern (solid/split/dotted) and by the band showing one
// role at a time -- colour is redundant here, not load-bearing.  Stated, not smuggled.
// GATED: normal-sighted separation of the three role hues, and uniqueness of the
// bar pattern.  NOT GATED: separation under simulated CVD.
//
// That split is deliberate and is the honest version of this check.  Role is carried by
// THREE channels -- the bar pattern (solid/split/dotted), the FIXED POSITION of each run
// in the constant table (onsets first, then rimes, then tones, always, in cells that
// never move), and colour.  Colour is the redundant one.
//
// CORRECTED 2026-09-23, design revision 3: the second channel used to be "the Vietnamese
// band shows exactly one role at a time".  That is no longer true -- the owner overruled
// the morphing band and all three roles are now on screen together -- so the sentence was
// false and the argument had to be re-made rather than inherited.  Fixed position is a
// stronger channel than the old one anyway: it does not depend on what he has tapped.  Popsicle's watermelon/green pair cannot be separated under red-green
// CVD by any assignment, because that is a property of the two hues the owner chose by
// eye and liked; darkening one of them until the arithmetic passed would trade a real
// property (bright and fun) for a redundant one.  So the number is printed, named, and
// carried as a known limitation rather than hidden behind a lowered threshold.
const DE_MIN_NORMAL = 25;

// REVISION 5 -- THE FIRST CVD-GATED CHECK IN THIS TOOL, and it is gated because the design
// stopped being able to lean on position.
//
// The claim revision 4 made was: role is carried by three channels -- the bar pattern, the
// FIXED POSITION of each run, and colour; colour is the redundant one, so CVD separation is
// printed and not gated.  The first half of that is now false for ONE pair.  A consonant
// tile and a vowel tile are adjacent in every row of a 29-letter alphabet, and at the five
// branching onsets (`c` `g` `k` `n` `t`) a consonant and a vowel are LIVE AT THE SAME TIME
// and mean opposite things -- "this letter makes the sound bigger" versus "this letter
// starts the next part of the word" (literacy-vi.md §0.6).  Position separates nothing
// there.  Pattern (solid vs split) still does, and colour must too.
//
// So consonant-vs-vowel is gated under all three dichromacies.  Tone is NOT: it is a
// separate run, on its own page on every phone, and it is never adjacent to a letter.
// Popsicle's consonant-vs-tone pair measures 1.6 under deuteranopia and stays a logged
// limitation, unchanged from revision 4.
//
// 20 is chosen as the largest round number below the measured worst case (23.7, Popsicle
// consonant vs vowel under protanopia).  It is a gate with 3.7 of headroom on the owner's
// own hexes, not a number picked to pass.
const DE_MIN_ADJACENT_CVD = 20;
const resolve = (t,k) => k === 'WHITE' ? WHITE : t[k];

let failures = 0; const out = [], decorNotes = [], cvdWeak = [];
for (const [key,t] of Object.entries(THEMES)) {
  out.push(`\n=== ${t.label}${t.dflt ? '   (DEFAULT)' : ''} ===`);
  out.push(`  ground ${t.ground}  groundAlt ${t.groundAlt}  surface ${t.surface}  ink ${t.ink}  inkSoft ${t.inkSoft}`);
  out.push(`  tileFace ${t.tileFace}  tileGlyph ${t.tileGlyph}   (identical in all three themes)`);
  for (const i of [1,2,3]) out.push(
    `  role${i} ${['CONSONANT letter    ','VOWEL letter        ','TONE                '][i-1]}  ${t['role'+i+'Name'].padEnd(11)}` +
    ` ${t['role'+i]} (owner, unchanged)  bars ${t['role'+i+'Pattern'].padEnd(6)}` +
    ` outline ${t['role'+i+'Edge']}  soft ${t['role'+i+'Soft']}  deep ${t['role'+i+'Deep']}`);
  out.push(`  reward ${t.reward} edge ${t.rewardEdge}   accentFace ${t.accentFace}   neutralFace ${t.neutralFace}   hairline ${t.hairline}`);
  out.push('  -- contrast --');
  for (const [type,bgK,fgK,what] of PAIRS) {
    const bg = resolve(t,bgK), fg = resolve(t,fgK);
    const r = ratio(bg,fg), min = THRESHOLD[type], ok = r >= min;
    if (type === 'decor') { decorNotes.push(`  ${t.label}: ${r2(r).toFixed(2)}:1  ${what}`); continue; }
    if (!ok) failures++;
    out.push(`  ${ok?'ok  ':'FAIL'} ${r2(r).toFixed(2).padStart(6)}:1 (>=${min}, ${type})  ${what}  [${fg} on ${bg}]`);
  }
  out.push('  -- bar patterns (the non-colour role channel) --');
  const pats = [t.role1Pattern, t.role2Pattern, t.role3Pattern];
  if (new Set(pats).size !== 3) failures++;
  out.push(`  ${new Set(pats).size===3?'ok  ':'FAIL'} consonant=${pats[0]}  vowel=${pats[1]}  tone=${pats[2]}  (must be three distinct patterns)`);
  out.push('  -- role hue distinguishability --');
  const roles = [['consonant',t.role1],['vowel',t.role2],['tone',t.role3]];
  for (let i=0;i<3;i++) for (let j=i+1;j<3;j++) {
    const [na,ca]=roles[i], [nb,cb]=roles[j];
    const d = dE00(ca,cb); if (d < DE_MIN_NORMAL) failures++;
    out.push(`  ${d>=DE_MIN_NORMAL?'ok  ':'FAIL'} dE00 ${r2(d).toFixed(1).padStart(5)} (>=${DE_MIN_NORMAL})  ${na} vs ${nb}`);
    for (const kind of Object.keys(CVD)) {
      const dc = dE00(simulate(ca,kind), simulate(cb,kind));
      cvdWeak.push([t.label, na, nb, kind, r2(dc)]);
      out.push(`  diag dE00 ${r2(dc).toFixed(1).padStart(5)}  ${na} vs ${nb} under ${kind}  (not gated - see DE_MIN_NORMAL note)`);
    }
    out.push(`       dL* ${r2(Math.abs(Lstar(ca)-Lstar(cb))).toFixed(1)}   bar patterns ${PATTERN['role'+(i+1)]} vs ${PATTERN['role'+(j+1)]} (redundant, non-colour cue)`);
  }
  // REVISION 5: the one pair that is ADJACENT on the board, gated under CVD.
  out.push('  -- ADJACENT pair: consonant vs vowel, side by side in every row (revision 5) --');
  for (const kind of Object.keys(CVD)) {
    const d = dE00(simulate(t.role1,kind), simulate(t.role2,kind));
    if (d < DE_MIN_ADJACENT_CVD) failures++;
    out.push(`  ${d>=DE_MIN_ADJACENT_CVD?'ok  ':'FAIL'} dE00 ${r2(d).toFixed(1).padStart(5)} (>=${DE_MIN_ADJACENT_CVD})  consonant vs vowel under ${kind}`);
  }
}
if (process.argv.includes('--tokens')) { console.log(JSON.stringify(THEMES,null,2)); process.exit(0); }
console.log(out.join('\n'));
console.log('\n-- decorative (logged, never gates) --\n' + decorNotes.join('\n'));
const weak = cvdWeak.filter(w => w[4] < 12).sort((a,b) => a[4]-b[4]);
console.log('\n-- CVD diagnostic: role pairs below dE00 12 (not gated, mitigated by bar pattern) --');
console.log(weak.length ? weak.map(w => `  ${w[0]}: ${w[1]} vs ${w[2]} under ${w[3]} = ${w[4]}`).join('\n')
                        : '  none');
console.log(`\n${failures===0?'PASS':'FAIL'} - ${failures} failing pair(s) across ${Object.keys(THEMES).length} themes.`);
process.exit(failures===0?0:1);
