#!/usr/bin/env python3
"""Synthesise the app's own (non-speech) sounds.  Owner: app-developer.

`ui.md` §11.3 and §11.4 specify nine sounds that are not words: the announcement motif,
the seat click, the disabled knock, the undo unclick, the zero-onset *open*, the shelf
bell and the shelf-tip phrase.  They are synthesised rather than sourced because they are
short, deterministic, and licence-free by construction — `docs/slices.md` defect 8 is that
neither TTS engine grants redistribution rights, and these carry no such question.

Run through `node scripts/build-ui-audio.mjs`, which writes the generated index module.
Requires the `numpy` + `soundfile` venv `docs/slices.md` already documents.

    tools/.venv/bin/python tools/gen-ui-audio.py assets/audio
"""
import os
import sys

import numpy as np
import soundfile as sf

SR = 44100

# `ui.md` §11.4 — a major triad, rising, plus a fourth note an octave above the root.
ROOT = 523.25       # C5
THIRD = 659.26      # E5
FIFTH = 783.99      # G5
OCTAVE = 1046.50    # C6


def silence(ms):
    return np.zeros(int(SR * ms / 1000.0), dtype=np.float64)


def place(buf, start_ms, sound):
    i = int(SR * start_ms / 1000.0)
    n = min(len(sound), len(buf) - i)
    if n > 0:
        buf[i:i + n] += sound[:n]
    return buf


def mallet(freq, ms, decay=26.0):
    """A soft mallet voice: fast attack, short decay, no reverb tail (`ui.md` §11.4).

    Partials at 1x, 4x, 10x with falling weight is the classic bar-percussion series; the
    inharmonic upper partials are what stop it sounding like a sine beep.
    """
    t = np.arange(int(SR * ms / 1000.0)) / SR
    env = np.exp(-decay * t)
    attack = np.minimum(1.0, t / 0.004)
    y = (np.sin(2 * np.pi * freq * t)
         + 0.32 * np.sin(2 * np.pi * freq * 3.98 * t) * np.exp(-2.2 * decay * t)
         + 0.11 * np.sin(2 * np.pi * freq * 9.6 * t) * np.exp(-3.4 * decay * t))
    return y * env * attack


def wood(freq, ms, decay=70.0, noise=0.5, seed=7):
    """A tap on wood: a noise transient plus one low resonant mode, gone in 90 ms."""
    rng = np.random.default_rng(seed)
    t = np.arange(int(SR * ms / 1000.0)) / SR
    env = np.exp(-decay * t)
    click = rng.standard_normal(len(t)) * np.exp(-380.0 * t) * noise
    # One-pole low-pass on the noise, so it is a knock rather than a hiss.
    lp = np.zeros_like(click)
    a = 0.22
    for i in range(1, len(click)):
        lp[i] = a * click[i] + (1 - a) * lp[i - 1]
    body = np.sin(2 * np.pi * freq * t) * env
    return body + lp * 3.0


def normalise(y, peak_dbfs):
    m = float(np.max(np.abs(y)))
    if m == 0:
        return y
    return y / m * (10 ** (peak_dbfs / 20.0))


def fade_tail(y, ms=8):
    n = int(SR * ms / 1000.0)
    if n < len(y):
        y[-n:] *= np.linspace(1.0, 0.0, n)
    return y


def motif(with_fourth):
    """`ui.md` §11.4 — onsets at 0 / 130 / 260 ms, each note 180 ms, 440 ms total.

    The fourth note sits at 390 ms, so the four-note version runs to 570 ms.  Same three
    notes in both languages, at every stage, on the first word and the thousandth: catchy
    is repetition plus anticipation, not novelty.
    """
    total = 570 if with_fourth else 440
    buf = silence(total)
    for at, f in ((0, ROOT), (130, THIRD), (260, FIFTH)):
        place(buf, at, mallet(f, 180))
    if with_fourth:
        place(buf, 390, mallet(OCTAVE, 180))
    return fade_tail(normalise(buf, -6.0))


def build(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    files = {}

    files['motif-3.wav'] = motif(False)
    files['motif-4.wav'] = motif(True)

    # `ui.md` §11.3 — a 90 ms wooden seat click.  *This one is home.*
    files['seat.wav'] = fade_tail(normalise(wood(430.0, 90, decay=95.0, seed=3), -9.0))

    # The disabled knock: *tap on wood, not on a drum*.  Lower, duller, no pitch centre.
    # The −9 dB of §11.3 is applied by the playback channel, not baked in, so the same
    # file can be reused if the level is ever re-tuned.
    files['knock.wav'] = fade_tail(normalise(wood(180.0, 120, decay=60.0, noise=0.8, seed=11), -6.0))

    # `gameplay.md` §4.4 — a soft descending two-note unclick, 140 ms.  **The only
    # descending motif in the app**, so it can never be confused with the announcement.
    un = silence(140)
    place(un, 0, mallet(FIFTH, 90, decay=40.0))
    place(un, 60, mallet(ROOT, 80, decay=40.0))
    files['unclick.wav'] = fade_tail(normalise(un, -9.0))

    # `gameplay.md` §4.6 — the zero onset: a soft low wooden *open*, 140 ms, not speech.
    files['socket.wav'] = fade_tail(normalise(wood(146.8, 140, decay=34.0, noise=0.35, seed=5), -8.0))

    # `ui.md` §11.3 — a single soft bell as a shelf slot fills, folded into M15.
    files['shelf-bell.wav'] = fade_tail(normalise(mallet(OCTAVE, 420, decay=9.0), -9.0))

    # And a four-note phrase, once, as the shelf tips into the album.
    tip = silence(900)
    for at, f in ((0, ROOT), (150, THIRD), (300, FIFTH), (450, OCTAVE)):
        place(tip, at, mallet(f, 420, decay=9.0))
    files['shelf-tip.wav'] = fade_tail(normalise(tip, -8.0))

    for name, data in files.items():
        sf.write(os.path.join(out_dir, name), data.astype(np.float32), SR, subtype='PCM_16')
        print(f'{name}  {len(data) / SR * 1000:.0f} ms  '
              f'{os.path.getsize(os.path.join(out_dir, name))} bytes')


if __name__ == '__main__':
    build(sys.argv[1] if len(sys.argv) > 1 else 'assets/audio')
