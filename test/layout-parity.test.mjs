// `src/layout/layout.mjs` is a transcription of the Tier-4 artefact. This is what makes
// the transcription a fact rather than an intention: both implementations are swept over
// the full supported range and every field of every result is compared.
//
// `acceptance-criteria.md` P1–P6, P12.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  layout as appLayout, boardLayout, fits as appFits, orientationOK as appOrientationOK,
  fitGlyph, RULES, CAPTION_MIN_FONT,
} from '../src/layout/layout.mjs';

// `tools/layout-sweep.mjs` is a CLI: importing it runs the sweep and calls
// `process.exit`, which would end this file after one test and report a pass it had not
// earned. So the module half of it is loaded on its own, from the committed source, by
// cutting the file at the CLI boundary. The comparison is still against the real tool
// text — nothing is duplicated here.
const toolSource = readFileSync(new URL('../tools/layout-sweep.mjs', import.meta.url), 'utf8');
const cut = toolSource.indexOf('/* ---------------- the sweep ---------------- */');
assert.ok(cut > 0, 'tools/layout-sweep.mjs no longer has the sweep marker this test cuts at');
const { layout: toolLayout, fits: toolFits, orientationOK: toolOrientationOK } =
  await import(`data:text/javascript;base64,${Buffer.from(toolSource.slice(0, cut)).toString('base64')}`);

const INSETS = [
  { insetT: 0, insetB: 0 },
  { insetT: 24, insetB: 16 },
  { insetT: 24, insetB: 48 },
  { insetT: 48, insetB: 34 },
  { insetT: 59, insetB: 34 },
  { insetT: 20, insetB: 0 },
  { insetT: 24, insetB: 20 },
  { insetT: 0, insetB: 21, insetL: 59, insetR: 59 },
];

test('the app layout law is identical to tools/layout-sweep.mjs across the whole range', () => {
  let compared = 0;
  for (let Wv = 360; Wv <= 1400; Wv += 4) {
    for (let Hv = 600; Hv <= 1440; Hv += 16) {
      for (const ins of INSETS) {
        for (let n = 1; n <= 8; n += 1) {
          const a = appLayout({ Wv, Hv, ...ins, n });
          const b = toolLayout({ Wv, Hv, ...ins, n });
          for (const key of Object.keys(b)) {
            if (a[key] !== b[key]) {
              assert.fail(`${key} differs at ${Wv}x${Hv} ${JSON.stringify(ins)} n=${n}: app ${a[key]} vs tool ${b[key]}`);
            }
          }
          assert.equal(appFits(a), toolFits(b));
          compared += 1;
        }
        assert.equal(appOrientationOK({ Wv, Hv, ...ins }), toolOrientationOK({ Wv, Hv, ...ins }));
      }
    }
  }
  assert.ok(compared > 200000, `swept ${compared} layouts`);
});

test('the representative devices in ui.md §4.4 come out as documented', () => {
  // P5: an iPad in portrait at stage 5 Vietnamese — tiles 116, picture 758 x 620.
  const ipad = appLayout({ Wv: 834, Hv: 1194, insetT: 24, insetB: 20, n: 6 });
  assert.equal(ipad.tile, 116);
  assert.equal(ipad.frameW, 758);
  assert.equal(ipad.frameH, 620);

  // P6: a 360 x 640 Android phone at stage 7 English (8 tiles) — tile 73, row 325 of
  // 328, picture 328 x 300.
  const android = appLayout({ Wv: 360, Hv: 640, insetT: 24, insetB: 16, n: 8 });
  assert.equal(android.tile, 73);
  assert.equal(android.rowW, 325);
  assert.equal(android.CW, 328);
  assert.equal(android.frameW, 328);
  assert.equal(android.frameH, 300);
});

test('a phone in landscape is not served; a tablet in both orientations is (P7, P8)', () => {
  assert.equal(appOrientationOK({ Wv: 852, Hv: 393, insetT: 0, insetB: 21, insetL: 59, insetR: 59 }), false);
  assert.equal(appOrientationOK({ Wv: 834, Hv: 1194, insetT: 24, insetB: 20 }), true);
  assert.equal(appOrientationOK({ Wv: 1194, Hv: 834, insetT: 24, insetB: 20 }), true);
  assert.equal(appOrientationOK({ Wv: 393, Hv: 852, insetT: 59, insetB: 34 }), true);
});

test('Q7 — a multi-character glyph shrinks to fit but never below 24 pt', () => {
  const L = appLayout({ Wv: 360, Hv: 640, insetT: 24, insetB: 16, n: 8 });
  assert.equal(fitGlyph(L.tile, L.tileFont, 1), L.tileFont);
  const three = fitGlyph(L.tile, L.tileFont, 3); // `ngh`
  assert.ok(three < L.tileFont, `a 3-glyph tile should shrink from ${L.tileFont}, got ${three}`);
  assert.ok(three >= 24, `never below 24 pt, got ${three}`);
  assert.ok(three * 3 * 0.56 <= L.tile * 0.82 + 1, 'fits 82% of the tile width');
  // The floor holds even at an absurd length.
  assert.equal(fitGlyph(72, 36, 12), 24);
});

test('the fit rule still holds once the caption strip is in the stack', () => {
  // `ui.md` §4.2's `stackFixed` omits the caption strip that §7 and §8 both draw.
  // `boardLayout` puts it back by taking it out of the picture, which §4.2 already names
  // as the flex element. This is the sweep that says the extension is safe.
  let worstCaption = Infinity;
  let hidden = 0;
  let compared = 0;
  for (let Wv = 360; Wv <= 1400; Wv += 4) {
    for (let Hv = 600; Hv <= 1440; Hv += 16) {
      for (const ins of INSETS) {
        if (!appOrientationOK({ Wv, Hv, ...ins })) continue;
        for (let n = 1; n <= 8; n += 1) {
          const L = boardLayout({ Wv, Hv, ...ins, n });
          for (const [name, rule] of RULES) {
            assert.ok(rule(L), `${name} fails with the caption at ${Wv}x${Hv} ${JSON.stringify(ins)} n=${n}`);
          }
          assert.ok(L.capH >= 0);
          assert.ok(L.captionFont === 0 || L.captionFont >= CAPTION_MIN_FONT,
            `an illegible ${L.captionFont} pt caption at ${Wv}x${Hv} n=${n}`);
          if (L.captionFont > 0) worstCaption = Math.min(worstCaption, L.captionFont);
          else hidden += 1;
          compared += 1;
        }
      }
    }
  }
  assert.ok(compared > 100000, `swept ${compared}`);
  assert.ok(worstCaption >= CAPTION_MIN_FONT, `the caption shrank to ${worstCaption} pt`);
  assert.ok(hidden / compared < 0.02,
    `the caption is dropped on ${((hidden / compared) * 100).toFixed(1)}% of served layouts`);

  // And the one viewport that forced the extension gets exactly the documented answer.
  const tight = boardLayout({ Wv: 360, Hv: 600, insetT: 24, insetB: 16, n: 1 });
  assert.equal(tight.captionFont, 37);
  assert.equal(tight.frameH - tight.overlap, 150, 'F5 exactly on its floor');
  assert.equal(tight.slack, 0);

  // And the devices the app is actually for all keep a full-size strip.
  for (const [label, v] of [
    ['iPad portrait', { Wv: 834, Hv: 1194, insetT: 24, insetB: 20, n: 6 }],
    ['iPhone 15', { Wv: 393, Hv: 852, insetT: 59, insetB: 34, n: 6 }],
    ['Android 412x915', { Wv: 412, Hv: 915, insetT: 48, insetB: 34, n: 8 }],
  ]) {
    const L = boardLayout(v);
    assert.ok(L.captionFont >= Math.round(L.tile * 0.42) - 1,
      `${label}: caption ${L.captionFont} pt, wanted ${Math.round(L.tile * 0.42)}`);
  }
});

test('P7/P8 — the orientation policy serves a tablet both ways and locks a phone', () => {
  // `src/layout/orientation.js` asks exactly this question of the layout law before it
  // calls `lockAsync`. The policy is tested here rather than through the native module,
  // because what can be wrong is the arithmetic, not the call.
  const both = (w, h, top, bottom) => {
    const portrait = { Wv: Math.min(w, h), Hv: Math.max(w, h), insetT: top, insetB: bottom, insetL: 0, insetR: 0 };
    const landscape = { Wv: portrait.Hv, Hv: portrait.Wv, insetT: 0, insetB: bottom, insetL: top, insetR: top };
    return appOrientationOK(portrait) && appOrientationOK(landscape);
  };
  assert.equal(both(834, 1194, 24, 20), true, 'an iPad must rotate freely');
  assert.equal(both(800, 1280, 24, 24), true, 'an Android tablet must rotate freely');
  assert.equal(both(393, 852, 59, 34), false, 'an iPhone must lock to portrait');
  assert.equal(both(360, 640, 24, 16), false, 'a compact Android must lock to portrait');
  assert.equal(both(412, 915, 48, 34), false, 'a large Android phone must lock to portrait');
});
