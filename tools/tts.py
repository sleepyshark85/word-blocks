#!/usr/bin/env python3
"""Synthesise one clip. Deliberately dumb: one text in, one file out, JSON on stdout.

    tools/.venv/bin/python tools/tts.py --engine edge --voice en-US-JennyNeural \
        --rate -35% --text "kuh, cat" --out c-long.mp3
    tools/.venv/bin/python tools/tts.py --engine gtts --lang vi --text "mèo" --out meo.mp3

All pack logic lives in `gen-audio.mjs`. This file exists only because the two chosen
engines are Python libraries (`decisions.md` §Audio): edge-tts for English letter sounds
and English words, gTTS for Vietnamese. Keeping it thin means the resumability, the
budget accounting and the pack writes have exactly one implementation, in Node.

It also MEASURES what it produced — duration, peak and RMS — and prints them, so that no
caller has to claim a clip is fine without opening it. `spike-results.md` records why:
two voice models with byte-identical sizes, and a silent clip is a valid mp3.

Setup (the spike's venv was scratch and is gone; this recreates it):

    python3 -m venv tools/.venv
    curl -sS https://bootstrap.pypa.io/get-pip.py | tools/.venv/bin/python -
    tools/.venv/bin/python -m pip install edge-tts gTTS numpy soundfile

`python3-venv` has no `ensurepip` on this machine, which is why pip is bootstrapped by
hand rather than with `--upgrade-deps`.
"""
import argparse
import asyncio
import json
import math
import os
import sys


def measure(path):
    """Open the file we just wrote and report what is actually in it."""
    try:
        import numpy as np
        import soundfile as sf
    except ImportError:
        return {"measured": False}
    try:
        x, sr = sf.read(path, dtype="float32", always_2d=False)
    except Exception as e:  # noqa: BLE001 - any read failure is the finding
        return {"measured": False, "error": str(e)}
    if x.ndim > 1:
        x = x.mean(axis=1)
    peak = float(abs(x).max()) if len(x) else 0.0
    rms = float((x.astype("float64") ** 2).mean() ** 0.5) if len(x) else 0.0
    return {
        "measured": True,
        "ms": round(1000 * len(x) / sr),
        "sampleRate": int(sr),
        "peak": round(peak, 4),
        "rms": round(rms, 5),
        "peakDbfs": round(20 * math.log10(peak), 1) if peak > 0 else None,
        "rmsDbfs": round(20 * math.log10(rms), 1) if rms > 0 else None,
        # A clip that decodes to silence is a valid mp3 and a broken asset.
        "silent": peak < 0.005,
    }


async def edge(text, voice, rate, out):
    import edge_tts
    await edge_tts.Communicate(text, voice, rate=rate).save(out)


def gtts(text, lang, slow, out):
    from gtts import gTTS
    gTTS(text=text, lang=lang, slow=slow).save(out)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--engine", required=True, choices=["edge", "gtts"])
    p.add_argument("--text", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--voice", default="en-US-JennyNeural")
    p.add_argument("--rate", default="+0%")
    p.add_argument("--lang", default="vi")
    p.add_argument("--slow", action="store_true")
    a = p.parse_args()

    os.makedirs(os.path.dirname(os.path.abspath(a.out)) or ".", exist_ok=True)
    tmp = f"{a.out}.part"
    try:
        if a.engine == "edge":
            asyncio.run(edge(a.text, a.voice, a.rate, tmp))
        else:
            gtts(a.text, a.lang, a.slow, tmp)
        if not os.path.exists(tmp) or os.path.getsize(tmp) == 0:
            raise RuntimeError("engine produced no bytes")
        info = measure(tmp)
        # Only now does the file get its real name: a half-written clip is never
        # mistaken for a finished one, which is the same rule the pack uses for words.
        os.replace(tmp, a.out)
    except Exception as e:  # noqa: BLE001
        if os.path.exists(tmp):
            os.remove(tmp)
        print(json.dumps({"ok": False, "error": f"{type(e).__name__}: {e}"}))
        return 1

    print(json.dumps({
        "ok": True, "out": a.out, "bytes": os.path.getsize(a.out),
        "engine": a.engine, "text": a.text,
        "voice": a.voice if a.engine == "edge" else f"gtts:{a.lang}",
        "rate": a.rate if a.engine == "edge" else ("slow" if a.slow else "normal"),
        **info,
    }))
    return 0


if __name__ == "__main__":
    sys.exit(main())
