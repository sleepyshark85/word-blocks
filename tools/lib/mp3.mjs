// Read an MP3's frame table without decoding it.
//
// WHY THIS EXISTS. `ui.md` E15 puts a *duration budget* on a tile's `short` clip, and
// `pack-validate.mjs` has to enforce it. The validator is Node, the pack is hostile
// input, and a duration copied into `audio.ms` by whoever wrote the file is a claim, not
// a measurement — the very thing this project keeps being burnt by. So the budget is
// checked against the bytes.
//
// Frame headers are enough for that and need no decoder: an MP3 is a sequence of frames,
// each header states its sample rate and its layer, and each frame carries a fixed number
// of samples. Duration is therefore arithmetic over the table, exact for CBR and VBR
// alike. It is NOT enough to tell speech from silence — for that you must decode, which
// `tools/audio-measure.py` does in the venv.
//
// The seed packs are MPEG-2 Layer III, 24 kHz, 48 kbps CBR: 576 samples and 144 bytes per
// frame, 24 ms each. That constancy is also why a *bytes-per-frame* envelope says nothing
// whatsoever about where the speech is — every frame is 144 bytes whether it holds a
// vowel or digital silence.

const V_MPEG25 = 0, V_RESERVED = 1, V_MPEG2 = 2, V_MPEG1 = 3;

const BITRATES = {
  // [version][layer] -> kbps table, index 0 = free, 15 = bad
  [V_MPEG1]: {
    3: [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448, -1], // Layer I
    2: [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384, -1],    // Layer II
    1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, -1],     // Layer III
  },
  [V_MPEG2]: {
    3: [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256, -1],
    2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, -1],
    1: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, -1],
  },
};
BITRATES[V_MPEG25] = BITRATES[V_MPEG2];

const SAMPLE_RATES = {
  [V_MPEG1]: [44100, 48000, 32000, -1],
  [V_MPEG2]: [22050, 24000, 16000, -1],
  [V_MPEG25]: [11025, 12000, 8000, -1],
};

// Samples per frame. Layer III on MPEG-2/2.5 is the half-rate 576, not 1152 — get this
// wrong and every duration in the pack is out by a factor of two.
const SAMPLES = {
  3: { [V_MPEG1]: 384, [V_MPEG2]: 384, [V_MPEG25]: 384 },
  2: { [V_MPEG1]: 1152, [V_MPEG2]: 1152, [V_MPEG25]: 1152 },
  1: { [V_MPEG1]: 1152, [V_MPEG2]: 576, [V_MPEG25]: 576 },
};

/** Parse one frame header at `off`, or null if there is not a valid one there. */
export function frameAt(buf, off) {
  if (off + 4 > buf.length) return null;
  if (buf[off] !== 0xff || (buf[off + 1] & 0xe0) !== 0xe0) return null;
  const version = (buf[off + 1] >> 3) & 0x03;
  const layer = (buf[off + 1] >> 1) & 0x03;       // 1 = Layer III, 2 = II, 3 = I
  if (version === V_RESERVED || layer === 0) return null;
  const bitrateIdx = (buf[off + 2] >> 4) & 0x0f;
  const rateIdx = (buf[off + 2] >> 2) & 0x03;
  const padding = (buf[off + 2] >> 1) & 0x01;
  const kbps = BITRATES[version][layer][bitrateIdx];
  const sampleRate = SAMPLE_RATES[version][rateIdx];
  if (!kbps || kbps < 0 || sampleRate < 0) return null;      // free-format and reserved
  const samples = SAMPLES[layer][version];
  const slot = layer === 3 ? 4 : 1;                          // Layer I counts 4-byte slots
  const bytes = Math.floor((samples / 8) * kbps * 1000 / sampleRate / slot) * slot + padding * slot;
  if (bytes < 4) return null;
  return { offset: off, bytes, samples, sampleRate, kbps, version, layer, padding };
}

/** Length of an ID3v2 tag at the start of the buffer, or 0. */
function id3v2Length(buf) {
  if (buf.length < 10 || buf.toString('latin1', 0, 3) !== 'ID3') return 0;
  const flags = buf[5];
  const size = ((buf[6] & 0x7f) << 21) | ((buf[7] & 0x7f) << 14) | ((buf[8] & 0x7f) << 7) | (buf[9] & 0x7f);
  return 10 + size + ((flags & 0x10) ? 10 : 0);              // + footer if present
}

/**
 * The whole frame table.
 *
 * Returns `{ frames, sampleRate, samples, durationMs, cbr, id3Bytes, trailingBytes }`, or
 * throws if the buffer holds no frames at all. `frames[i].offset/bytes` are byte ranges
 * into `buf`, which is what makes a lossless cut possible (`tools/audio-trim.mjs`).
 */
export function parseFrames(buf) {
  const frames = [];
  let off = id3v2Length(buf);
  const id3Bytes = off;
  let resync = 0;
  while (off + 4 <= buf.length) {
    const f = frameAt(buf, off);
    if (!f) { off += 1; resync += 1; continue; }
    if (off + f.bytes > buf.length) break;                   // truncated last frame
    frames.push(f);
    off += f.bytes;
  }
  if (!frames.length) throw new Error('no MPEG audio frames found');
  const sampleRate = frames[0].sampleRate;
  const samples = frames.reduce((n, f) => n + f.samples, 0);
  const kbps = new Set(frames.map((f) => f.kbps));
  return {
    frames,
    sampleRate,
    samples,
    durationMs: (1000 * samples) / sampleRate,
    frameMs: (1000 * frames[0].samples) / sampleRate,
    cbr: kbps.size === 1,
    id3Bytes,
    resyncBytes: resync,
    trailingBytes: buf.length - off,
  };
}

/** Duration in ms, from the bytes. Throws on a file that is not parseable as MP3. */
export function durationMs(buf) {
  return parseFrames(buf).durationMs;
}

/* ------------------------------------------------------------------- side info */

/**
 * Layer III side info, enough of it to reason about the BIT RESERVOIR.
 *
 * WHY THIS IS HERE. A Layer III frame does not have to store its own data. `main_data_begin`
 * says how many bytes BACKWARDS, in the concatenated main-data stream, this frame's data
 * actually starts — up to 255 bytes on MPEG-2, which is nearly two 144-byte frames. So
 * cutting a file at a frame boundary silently orphans the first retained frame from data
 * that is no longer in the file.
 *
 * Measured across all 140 clips in `packs/en-seed`: **frame 0 has `main_data_begin == 0`
 * in all 140** (it must — there is no history at the start of a file) and **no later frame
 * has it in any of them**. The encoder uses the reservoir continuously. So there is no
 * interior frame at which a cut is free, and a "guard of N frames" cannot make one: the
 * guard protects later frames, never the first retained one. `audio-trim.mjs` supplies the
 * missing bytes instead.
 *
 * Layout, MPEG-2/2.5 (LSF), mono, 9 side-info bytes = 72 bits:
 *   main_data_begin 8 | private 1 | then ONE granule:
 *   part2_3_length 12 | big_values 9 | global_gain 8 | scalefac_compress 9 |
 *   window_switching 1 | table_select 3x5 | region0 4 | region1 3 | scalefac_scale 1 |
 *   count1table_select 1   = 63.  8 + 1 + 63 = 72. (LSF has no scfsi and no preflag.)
 */
export function sideInfo(buf, frame) {
  const crcBytes = (buf[frame.offset + 1] & 1) === 0 ? 2 : 0;
  const mode = (buf[frame.offset + 3] >> 6) & 3;
  const mono = mode === 3;
  const lsf = frame.version !== V_MPEG1;
  const sideBytes = lsf ? (mono ? 9 : 17) : (mono ? 17 : 32);
  const o = frame.offset + 4 + crcBytes;
  const bitAt = (n) => (buf[o + (n >> 3)] >> (7 - (n & 7))) & 1;
  const mdbBits = lsf ? 8 : 9;
  let mdb = 0;
  for (let i = 0; i < mdbBits; i += 1) mdb = (mdb << 1) | bitAt(i);
  const dataBytes = frame.bytes - 4 - crcBytes - sideBytes;
  // part2_3_length of the first granule: 12 bits, after main_data_begin and the private
  // bits. LSF has one granule, so for these files this IS the frame's whole demand.
  // It is what decides whether an orphaned frame COMPLAINS: libmpg123 clamps the
  // available history to what is present, so a frame only errors when its demand exceeds
  // the bytes it carries itself. A frame with `part2_3Length > dataBytes * 8` provably
  // cannot decode without its reservoir history — which is what makes it a fixture rather
  // than a guess.
  const p23Start = mdbBits + (lsf ? (mono ? 1 : 2) : (mono ? 5 : 9));
  let p23 = 0;
  for (let i = 0; i < 12; i += 1) p23 = (p23 << 1) | bitAt(p23Start + i);
  return {
    mainDataBegin: mdb,
    part2_3Length: p23,
    needsHistory: p23 > dataBytes * 8,
    mono,
    lsf,
    crcBytes,
    sideBytes,
    dataOffset: o + sideBytes,
    dataBytes,
  };
}

/** The bytes this frame contributes to the main-data stream. */
export function mainData(buf, frame) {
  const si = sideInfo(buf, frame);
  return buf.subarray(si.dataOffset, si.dataOffset + si.dataBytes);
}

/**
 * Build the frames needed to start playback at `frames[from]` without a reservoir underrun.
 *
 * `frames[from]` needs `main_data_begin` bytes of history that the cut threw away. Those
 * bytes still exist — they are the tail of the preceding frames' main-data regions — so
 * this emits one or two PRIMING FRAMES carrying exactly them:
 *
 *   header (copied from the cut frame, so bitrate, rate and mode match)
 *   side info, all zero  -> main_data_begin = 0 and part2_3_length = 0, i.e. this frame
 *                           needs no history of its own and decodes to digital silence
 *   data region          -> the orphaned history bytes, right-aligned
 *
 * The decoder appends each data region to its reservoir, so by the time it reaches the real
 * frame the last `main_data_begin` bytes are exactly the ones it expects. The priming frames
 * themselves add 24 ms of silence each to the head, which is counted as lead like any other.
 *
 * Returns `{ buf, frames, bytes }`, or null when `from` needs no priming (`from === 0`, or
 * the frame is already self-contained).
 */
export function primingFrames(buf, table, from) {
  if (from <= 0) return null;
  const frame = table.frames[from];
  const si = sideInfo(buf, frame);
  if (si.mainDataBegin === 0) return null;                 // already self-contained
  const need = si.mainDataBegin;

  // Walk back through preceding frames collecting main data until we have `need` bytes.
  const parts = [];
  let got = 0;
  for (let i = from - 1; i >= 0 && got < need; i -= 1) {
    const d = mainData(buf, table.frames[i]);
    parts.unshift(d);
    got += d.length;
  }
  if (got < need) return null;                             // history is not in the file
  const all = Buffer.concat(parts);
  const history = all.subarray(all.length - need);

  const cap = si.dataBytes;
  const n = Math.ceil(need / cap);
  const padded = Buffer.concat([Buffer.alloc(n * cap - need), history]);
  const out = Buffer.alloc(n * frame.bytes);
  for (let k = 0; k < n; k += 1) {
    const at = k * frame.bytes;
    buf.copy(out, at, frame.offset, frame.offset + 4);     // the same header
    // side info stays zero: main_data_begin = 0, part2_3_length = 0 -> silence, no history
    padded.copy(out, at + 4 + si.crcBytes + si.sideBytes, k * cap, (k + 1) * cap);
  }
  return { buf: out, frames: n, bytes: out.length, need };
}
