#!/usr/bin/env python3
"""Open an audio file and say what is actually in it. One JSON object per file.

    tools/.venv/bin/python tools/audio-measure.py a.mp3 b.mp3 ...
    tools/.venv/bin/python tools/audio-measure.py --segments a.mp3

WHY THIS EXISTS. `ui.md` E15 budgets a tile's `short` clip at <= 700 ms with <= 40 ms of
leading silence and <= 120 ms of tail, and the shipped English clips measured 1896-2832 ms.
Diagnosing that needed the difference between *file length* and *sound*, and nothing in
Node can see it: an MP3's frame headers give duration exactly (`tools/lib/mp3.mjs`) but
say nothing about content. Worse, the seed clips are 48 kbps CBR, so every frame is 144
bytes whether it holds a vowel or digital silence — a bytes-per-frame envelope is
information-free by construction and reads as "sound all the way through". You have to
decode.

`soundfile` (libsndfile 1.2.2 on this machine) reads mp3, so no ffmpeg and no new
dependency: `content-pipeline.md` §9.4 already established this and this tool is the
second user of it.

WHAT IT MEASURES.

  ms          decoded length
  leadMs      silence before the first sound
  tailMs      silence after the last sound
  soundMs     first sound to last sound, inclusive — NOT "speech", see below
  peakDbfs    / rmsDbfs over the whole file
  segments    with --segments: every run of sound, separated by >= --gap ms of silence,
              each with its duration, level, how far below the file's loudest frame it
              sits, and the fraction of its energy above 3 kHz

Silence is anything below --floor dBFS (default -60). That is an ABSOLUTE threshold, not
one relative to the peak, and deliberately so: a relative threshold on a quiet clip eats
the quiet end of a real sound. The padding this was written to find sits at -85 dBFS and
below, so -60 clears it by 25 dB.

THE CAVEAT, because this project keeps re-learning it: a duration is a proxy. "Amplitude
is not intelligibility" and neither is length. This tool can prove a clip is 1.5 s of
digital silence. It cannot tell you whether the sound in it is the right sound, or a good
one. Only the owner's ear can.
"""
import argparse
import contextlib
import json
import math
import os
import sys
import tempfile


@contextlib.contextmanager
def captured_stderr():
    """Capture what the DECODER writes to fd 2, not what Python writes to sys.stderr.

    libmpg123 is a C library and complains on the real file descriptor, so
    `contextlib.redirect_stderr` cannot see it. This is load-bearing: a bit-reservoir
    underrun after a frame-boundary cut is reported here and NOWHERE else -- libmpg123
    conceals it from the caller by decoding the frame with whatever bits it has and
    carrying on, so the samples still compare equal while the stream is malformed. A
    trim that was verified only by comparing samples passed while 29 of 70 clips were
    emitting `part2_3_length too large for available bit count` on their first frame.
    Another decoder is free to click, mute or drop those frames instead.
    """
    with tempfile.TemporaryFile(mode="w+b") as tmp:
        saved = os.dup(2)
        try:
            sys.stderr.flush()
            os.dup2(tmp.fileno(), 2)
            yield tmp
        finally:
            sys.stderr.flush()
            os.dup2(saved, 2)
            os.close(saved)


def _load(path, diagnostics=None):
    import soundfile as sf
    with captured_stderr() as cap:
        try:
            x, sr = sf.read(path, dtype="float32", always_2d=False)
        finally:
            cap.seek(0)
            noise = cap.read().decode("utf-8", "replace").strip()
    if diagnostics is not None and noise:
        diagnostics.extend(ln.strip() for ln in noise.splitlines() if ln.strip())
    if x.ndim > 1:
        x = x.mean(axis=1)
    return x, int(sr)


def _db(v):
    return round(float(20 * math.log10(v)), 1) if v > 0 else None


def measure(path, floor_db=-60.0, gap_ms=60.0, hop_ms=5.0, segments=False):
    import numpy as np
    diags = []
    try:
        x, sr = _load(path, diags)
    except Exception as e:  # noqa: BLE001 - any read failure is the finding
        return {"path": path, "ok": False, "error": f"{type(e).__name__}: {e}",
                "diagnostics": diags, "cleanDecode": False}
    n = len(x)
    # A file that decodes with complaints is a malformed file even when the samples look
    # right. This is the property the trim has to preserve, so it is reported first.
    out = {"path": path, "ok": True, "sampleRate": sr, "ms": round(1000 * n / sr),
           "cleanDecode": not diags, "diagnostics": diags}
    hop = max(1, int(sr * hop_ms / 1000))
    nf = n // hop
    if nf == 0:
        return {**out, "leadMs": out["ms"], "tailMs": 0, "soundMs": 0, "silent": True}
    fr = x[: nf * hop].reshape(nf, hop).astype("float64")
    rms = np.sqrt((fr ** 2).mean(axis=1))
    db = 20 * np.log10(np.maximum(rms, 1e-12))
    loud = np.where(db > floor_db)[0]
    peak = float(abs(x).max())
    whole = float((x.astype("float64") ** 2).mean() ** 0.5)
    out.update({
        "peakDbfs": _db(peak), "rmsDbfs": _db(whole),
        "floorDbfs": floor_db,
        "silent": peak < 0.005 or len(loud) == 0,
    })
    if len(loud) == 0:
        out.update({"leadMs": out["ms"], "tailMs": 0, "soundMs": 0})
        return out
    first, last = int(loud[0]), int(loud[-1])
    out.update({
        "leadMs": round(first * hop_ms),
        "tailMs": round((nf - 1 - last) * hop_ms),
        "soundMs": round((last - first + 1) * hop_ms),
        "soundStartMs": round(first * hop_ms),
        "soundEndMs": round((last + 1) * hop_ms),
        "peakFrameDbfs": round(float(db.max()), 1),
    })
    if segments:
        groups = []
        s = p = int(loud[0])
        for i in loud[1:]:
            if (int(i) - p) * hop_ms > gap_ms:
                groups.append((s, p))
                s = int(i)
            p = int(i)
        groups.append((s, p))
        top = float(db.max())
        segs = []
        for a, b in groups:
            seg = x[a * hop:(b + 1) * hop]
            if len(seg) >= 64:
                w = np.hanning(len(seg))
                S = np.abs(np.fft.rfft(seg * w)) ** 2
                f = np.fft.rfftfreq(len(seg), 1 / sr)
                hi = float(S[f >= 3000].sum() / (S.sum() + 1e-20))
            else:
                hi = 0.0
            segs.append({
                "startMs": round(a * hop_ms), "endMs": round((b + 1) * hop_ms),
                "ms": round((b + 1 - a) * hop_ms),
                "rmsDbfs": _db(float((seg.astype("float64") ** 2).mean() ** 0.5)),
                "belowPeakDb": round(top - float(db[a:b + 1].max()), 1),
                "highFreqFraction": round(hi, 2),
            })
        out["segments"] = segs
    return out


def diff(spec):
    """Compare a trimmed clip against the original it was cut from, sample by sample.

    `tools/audio-trim.mjs` drops whole MP3 frames off each end, which is lossless for the
    frames it keeps -- EXCEPT at the head, where Layer III's bit reservoir lets a frame
    store its data in up to 255 bytes of its predecessors. Cut too close and the first
    frames of the sound decode from bits that are no longer there. Measured on `b`/"buh":
    a 1-frame guard leaves a 0.087 error right on the plosive's attack, 6 dB under the
    signal; a 2-frame guard leaves exactly 0.000000.

    So the trimmer does not assume the guard was enough -- it decodes both files and
    checks. `offsetMs` is where the trimmed clip begins inside the original.
    """
    import numpy as np
    da, db = [], []
    a, sra = _load(spec["trimmed"], da)
    b, srb = _load(spec["orig"], db)
    if sra != srb:
        return {**spec, "ok": False, "error": f"sample rates differ ({sra} vs {srb})"}
    off = int(round(spec["offsetMs"] * sra / 1000))
    n = min(len(a), len(b) - off)
    if n <= 0:
        return {**spec, "ok": False, "error": "no overlap"}
    d = np.abs(a[:n].astype("float64") - b[off:off + n].astype("float64"))
    lo = max(0, int(round(spec.get("fromMs", 0) * sra / 1000)) - off)
    hi = min(n, int(round(spec.get("toMs", 1e9) * sra / 1000)) - off)
    region = d[lo:hi] if hi > lo else d[:0]
    return {**spec, "ok": True, "samples": int(n),
            "cleanDecode": not da, "diagnostics": da,
            "origCleanDecode": not db,
            "maxDiff": round(float(d.max()), 8),
            "maxDiffInSound": round(float(region.max()), 8) if len(region) else 0.0}


def main():
    p = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    p.add_argument("files", nargs="*")
    p.add_argument("--diff", action="store_true",
                   help="read {orig,trimmed,offsetMs,fromMs,toMs} JSON lines on stdin instead")
    p.add_argument("--floor", type=float, default=-60.0, help="silence threshold, dBFS")
    p.add_argument("--gap", type=float, default=60.0, help="silence that separates segments, ms")
    p.add_argument("--segments", action="store_true")
    p.add_argument("--jsonl", action="store_true", help="one object per line instead of an array")
    p.add_argument("--require-clean", action="store_true",
                   help="exit non-zero if any file produced a decoder diagnostic")
    a = p.parse_args()
    if a.diff:
        rows = [diff(json.loads(l)) for l in sys.stdin if l.strip()]
    else:
        rows = [measure(f, a.floor, a.gap, segments=a.segments) for f in a.files]
    if a.jsonl:
        for r in rows:
            print(json.dumps(r))
    else:
        print(json.dumps(rows, indent=1))
    if a.require_clean and any(not r.get("cleanDecode", True) for r in rows):
        return 1
    return 1 if any(not r.get("ok") for r in rows) else 0


if __name__ == "__main__":
    sys.exit(main())
