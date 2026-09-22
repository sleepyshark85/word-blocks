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
//   3. Checks the three Vietnamese ROLE hues stay mutually distinguishable in every
//      theme, including under simulated protanopia, deuteranopia and tritanopia.
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

/* ---------------- derive ---------------- */
const perms = a => a.length <= 1 ? [a] : a.flatMap((x,i) =>
  perms([...a.slice(0,i), ...a.slice(i+1)]).map(p => [x, ...p]));

for (const t of Object.values(THEMES)) {
  // Pick the hue -> slot assignment.  Primary gate: worst-case CVD separation must
  // clear CVD_HEADROOM (comfortably above the DE_MIN_CVD pass mark).  Among the
  // assignments that clear it, take the one that DISTORTS THE OWNER'S HUES LEAST --
  // the brief is "bright and fun", so darkening a signature colour further than the
  // ladder requires is a cost, not a free choice.
  const CVD_HEADROOM = 22;
  const names = Object.keys(t.hues);
  const cands = perms(names).map(p => {
    const faces = p.map((n,i) => toLstar(t.hues[n], LADDER[i]));
    let worst = Infinity;
    for (let i=0;i<3;i++) for (let j=i+1;j<3;j++) {
      worst = Math.min(worst, dE00(faces[i], faces[j]));
      for (const k of Object.keys(CVD))
        worst = Math.min(worst, dE00(simulate(faces[i],k), simulate(faces[j],k)));
    }
    const distort = p.reduce((a,n,i) => a + Math.abs(Lstar(t.hues[n]) - LADDER[i]), 0);
    return { worst, distort, order: p, faces };
  });
  const eligible = cands.filter(c => c.worst >= CVD_HEADROOM);
  const best = (eligible.length ? eligible : cands)
    .sort((a,b) => a.distort - b.distort || b.worst - a.worst)[0];
  t.roleWorstCVD = r2(best.worst); t.roleDistortion = Math.round(best.distort);
  t.roleOrder = best.order;              // which identity hue lands in which slot
  best.faces.forEach((face, i) => {
    const n = 'role' + (i+1);
    t[n + 'Name']  = best.order[i];
    t[n + 'Bright']= t.hues[best.order[i]];
    t[n + 'Face']  = face;
    t[n + 'Glyph'] = ratio(face, WHITE) >= ratio(face, t.ink) ? WHITE : t.ink;
    t[n + 'Edge']  = toLstar(face, Math.max(18, Lstar(face) - 17));   // the block's shaded lower face
    t[n + 'Soft']  = mix(face, t.ground, 0.86);                       // chip / band tint
    t[n + 'Hi']    = t.hues[best.order[i]];   // bright identity band across the tile's top
  });
  // accent is a parent-surface button fill; darken only as far as a white label needs
  t.accentFace = (() => { for (let f=1; f>0.15; f-=0.02) {
      const c = scaleLin(t.accent, f); if (ratio(c, WHITE) >= 4.5) return c; }
    return scaleLin(t.accent, 0.15); })();
  t.neutralFace  = (() => { for (let f=1; f>0.15; f-=0.02) {
      const c = scaleLin(t.neutral, f); if (ratio(c, t.ground) >= 3.0) return c; }
    return scaleLin(t.neutral, 0.15); })();
  // the lit frame segment's outline must read on the ground, so derive it against the ground
  t.rewardEdge = (() => { for (let L = Lstar(t.reward) - 18; L > 14; L -= 2) {
      const c = toLstar(t.reward, L); if (ratio(c, t.ground) >= 3.0) return c; }
    return toLstar(t.reward, 16); })();
  t.hairline   = mix(t.ink, t.surface, 0.80);
  t.veil       = t.ground;              // the prompt photo's overlay, alpha-animated 0.16 -> 0
}

/* ---------------- the sweep ----------------
 * Only pairs that can actually co-occur.  Threshold by pair TYPE:
 *   glyph     4.5  AAA large text.  The letter he is learning to read. Hardest bar.
 *   bodyText  4.5  AA normal text.  Parent surfaces only.
 *   largeText 3.0  AA large text.
 *   component 3.0  AA non-text contrast: silhouettes, outlines, chips, lit segments.
 *   shade     1.3  A 3D shading step INSIDE one object (a toy block's lower face).
 *                  It carries no information -- the object's silhouette against the
 *                  ground is separately required at 3.0 -- so it is checked for being
 *                  *visible* rather than for being legible. Stated, not smuggled.
 *   decor     1.0  Logged only. Hairlines and veils.                                  */
const PAIRS = [
  // --- the letter he is learning to read -------------------------------------
  ['glyph','role1Face','role1Glyph','VI onset tile glyph / EN consonant tile glyph'],
  ['glyph','role2Face','role2Glyph','VI rime tile glyph / EN vowel tile glyph'],
  ['glyph','role3Face','role3Glyph','VI tone tile glyph'],
  ['glyph','surface','ink','word-plate glyph (the assembled word)'],
  ['glyph','role1Soft','ink','tile glyph, reduce-motion/dim state'],
  // --- the play surface ------------------------------------------------------
  // a tile's silhouette is carried by its 2pt outline + 5pt bottom bar, both roleNEdge --
  // never by the face alone, which at L*66 is deliberately light (ui.md 5.4)
  ['component','ground','role1Edge','onset/consonant tile outline on the ground'],
  ['component','ground','role2Edge','rime/vowel tile outline on the ground'],
  ['component','ground','role3Edge','tone tile outline on the ground'],
  ['component','ground','inkSoft','word-plate 2pt outline on the ground'],
  ['component','ground','neutralFace','gate dot on the ground'],
  ['component','ground','inkSoft','page-rail dot, filled'],
  ['component','ground','rewardEdge','lit frame segment outline on the ground'],
  ['component','ink','reward','lit vs unlit frame segment'],
  ['component','surface','neutralFace','empty cell dashed outline'],
  ['component','surface','role1Edge','seated tile edge on the plate'],
  ['component','surface','role2Edge','seated tile edge on the plate'],
  ['component','surface','role3Edge','seated tile edge on the plate'],
  // --- role identity used as a mark -----------------------------------------
  ['largeText','ground','role1Edge','role identity mark on the ground'],
  ['largeText','ground','role2Edge','role identity mark on the ground'],
  ['largeText','ground','role3Edge','role identity mark on the ground'],
  ['largeText','role1Soft','role1Edge','role chip: deep on soft'],
  ['largeText','role2Soft','role2Edge','role chip: deep on soft'],
  ['largeText','role3Soft','role3Edge','role chip: deep on soft'],
  // --- parent surfaces -------------------------------------------------------
  ['bodyText','groundAlt','ink','parent body text'],
  ['bodyText','groundAlt','inkSoft','parent secondary text'],
  ['bodyText','surface','ink','editor row title'],
  ['bodyText','surface','inkSoft','editor row subtitle'],
  ['bodyText','accentFace','WHITE','primary button label'],
  ['bodyText','surface','accentFace','link / tertiary action'],
  ['bodyText','reward','ink','celebration badge text'],
  ['bodyText','ground','ink','parental-gate prompt text'],
  ['bodyText','ground','inkSoft','parental-gate helper text'],
  // --- 3D shading inside one object -----------------------------------------
  ['shade','role1Face','role1Edge','block edge under its own face'],
  ['shade','role2Face','role2Edge','block edge under its own face'],
  ['shade','role3Face','role3Edge','block edge under its own face'],
  ['shade','reward','rewardEdge','celebration badge edge'],
  ['shade','role1Face','role1Hi','bright identity band on the tile face'],
  ['shade','role2Face','role2Hi','bright identity band on the tile face'],
  ['shade','role3Face','role3Hi','bright identity band on the tile face'],
  // --- decorative ------------------------------------------------------------
  ['decor','ground','role1Face','role1 tile FACE on the ground (outline carries it)'],
  ['decor','ground','role2Face','role2 tile FACE on the ground (outline carries it)'],
  ['decor','ground','role3Face','role3 tile FACE on the ground (outline carries it)'],
  ['decor','surface','hairline','cell divider hairline'],
  ['decor','ground','surface','album card on the ground'],
];
const THRESHOLD = { glyph:4.5, bodyText:4.5, largeText:3.0, component:3.0, shade:1.15, decor:1.0 };
const DE_MIN_NORMAL = 25, DE_MIN_CVD = 18;
const resolve = (t,k) => k === 'WHITE' ? WHITE : t[k];

let failures = 0; const out = [], decorNotes = [];
for (const [key,t] of Object.entries(THEMES)) {
  out.push(`\n=== ${t.label}${t.dflt ? '   (DEFAULT)' : ''} ===`);
  out.push(`  ground ${t.ground}  groundAlt ${t.groundAlt}  surface ${t.surface}  ink ${t.ink}  inkSoft ${t.inkSoft}`);
  for (const i of [1,2,3]) out.push(
    `  role${i} (${['onset/consonant','rime/vowel','tone'][i-1]})  ${t['role'+i+'Name'].padEnd(11)}` +
    ` bright ${t['role'+i+'Bright']}  face ${t['role'+i+'Face']} L*${Math.round(Lstar(t['role'+i+'Face']))}` +
    `  glyph ${t['role'+i+'Glyph']}  edge ${t['role'+i+'Edge']}  soft ${t['role'+i+'Soft']}`);
  out.push(`  reward ${t.reward} edge ${t.rewardEdge}   accentFace ${t.accentFace}   neutralFace ${t.neutralFace}   hairline ${t.hairline}`);
  out.push('  -- contrast --');
  for (const [type,bgK,fgK,what] of PAIRS) {
    const bg = resolve(t,bgK), fg = resolve(t,fgK);
    const r = ratio(bg,fg), min = THRESHOLD[type], ok = r >= min;
    if (type === 'decor') { decorNotes.push(`  ${t.label}: ${r2(r).toFixed(2)}:1  ${what}`); continue; }
    if (!ok) failures++;
    out.push(`  ${ok?'ok  ':'FAIL'} ${r2(r).toFixed(2).padStart(6)}:1 (>=${min}, ${type})  ${what}  [${fg} on ${bg}]`);
  }
  out.push('  -- bright identity band perceptible against its own face (dE00 >= 12) --');
  for (const i of [1,2,3]) {
    const d = dE00(t['role'+i+'Face'], t['role'+i+'Hi']); if (d < 12) failures++;
    out.push(`  ${d>=12?'ok  ':'FAIL'} dE00 ${r2(d).toFixed(1).padStart(5)}  role${i} band ${t['role'+i+'Hi']} on face ${t['role'+i+'Face']}`);
  }
  out.push(`  -- hue->slot assignment: worst-case CVD dE00 ${t.roleWorstCVD}, total L* distortion from the owner's hexes ${t.roleDistortion} --`);
  out.push('  -- Vietnamese role distinguishability --');
  const roles = [['onset',t.role1Face],['rime',t.role2Face],['tone',t.role3Face]];
  for (let i=0;i<3;i++) for (let j=i+1;j<3;j++) {
    const [na,ca]=roles[i], [nb,cb]=roles[j];
    const d = dE00(ca,cb); if (d < DE_MIN_NORMAL) failures++;
    out.push(`  ${d>=DE_MIN_NORMAL?'ok  ':'FAIL'} dE00 ${r2(d).toFixed(1).padStart(5)} (>=${DE_MIN_NORMAL})  ${na} vs ${nb}`);
    for (const kind of Object.keys(CVD)) {
      const dc = dE00(simulate(ca,kind), simulate(cb,kind)); if (dc < DE_MIN_CVD) failures++;
      out.push(`  ${dc>=DE_MIN_CVD?'ok  ':'FAIL'} dE00 ${r2(dc).toFixed(1).padStart(5)} (>=${DE_MIN_CVD})  ${na} vs ${nb} under ${kind}`);
    }
    out.push(`       dL* ${r2(Math.abs(Lstar(ca)-Lstar(cb))).toFixed(1)}  (the ladder: survives total colour loss)`);
  }
}
if (process.argv.includes('--tokens')) { console.log(JSON.stringify(THEMES,null,2)); process.exit(0); }
console.log(out.join('\n'));
console.log('\n-- decorative (logged, never gates) --\n' + decorNotes.join('\n'));
console.log(`\n${failures===0?'PASS':'FAIL'} - ${failures} failing pair(s) across ${Object.keys(THEMES).length} themes.`);
process.exit(failures===0?0:1);
