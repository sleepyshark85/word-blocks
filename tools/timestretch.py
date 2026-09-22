#!/usr/bin/env python3
"""Slow speech down without changing its pitch (phase vocoder).

WHY THIS EXISTS. Google's Vietnamese is the accent the owner wants, but the free
gTTS endpoint exposes exactly two speeds — `slow=True` or nothing — and the owner
asked for slower in both languages. Google Cloud TTS has a continuous
`speakingRate`, but in Vietnam its billing requires a ~800,000 VND prepayment,
which is not a reasonable cost for a family project.

So speed is taken back into our own hands. Resampling would slow the audio and
drop the pitch with it, turning a woman's voice into a man's; a phase vocoder
stretches time while leaving pitch alone.

    python3 tools/timestretch.py in.mp3 out.wav --factor 1.4
"""
import argparse
import numpy as np
import soundfile as sf


def stft(x, n_fft, hop):
    win = np.hanning(n_fft + 1)[:-1]
    pad = n_fft // 2
    xp = np.pad(x, pad, mode="reflect")
    frames = 1 + (len(xp) - n_fft) // hop
    D = np.empty((n_fft // 2 + 1, frames), dtype=complex)
    for i in range(frames):
        D[:, i] = np.fft.rfft(xp[i * hop:i * hop + n_fft] * win)
    return D


def istft(D, n_fft, hop, length=None):
    win = np.hanning(n_fft + 1)[:-1]
    frames = D.shape[1]
    out = np.zeros(n_fft + hop * (frames - 1))
    wsum = np.zeros_like(out)
    for i in range(frames):
        seg = np.fft.irfft(D[:, i], n_fft)
        out[i * hop:i * hop + n_fft] += seg * win
        wsum[i * hop:i * hop + n_fft] += win ** 2
    out /= np.maximum(wsum, 1e-8)
    pad = n_fft // 2
    out = out[pad:-pad] if len(out) > 2 * pad else out
    return out[:length] if length else out


def time_stretch(x, factor, n_fft=2048, hop=512):
    """factor > 1 makes the audio LONGER (slower). Pitch is unchanged."""
    D = stft(x, n_fft, hop)
    steps = np.arange(0, D.shape[1] - 1, 1.0 / factor)
    mag, phase = np.abs(D), np.angle(D)
    # expected phase advance per hop for each bin
    expect = 2 * np.pi * hop * np.arange(D.shape[0]) / n_fft
    acc = phase[:, 0].copy()
    out = np.empty((D.shape[0], len(steps)), dtype=complex)
    for i, t in enumerate(steps):
        lo = int(np.floor(t))
        frac = t - lo
        m = (1 - frac) * mag[:, lo] + frac * mag[:, lo + 1]
        out[:, i] = m * np.exp(1j * acc)
        # advance the accumulated phase by the true (wrapped) deviation
        dphi = phase[:, lo + 1] - phase[:, lo] - expect
        dphi -= 2 * np.pi * np.round(dphi / (2 * np.pi))
        acc += expect + dphi
    return istft(out, n_fft, hop)


def f0(x, sr, lo=60, hi=400):
    """Crude autocorrelation pitch estimate — used to PROVE the stretch left pitch alone."""
    x = x - x.mean()
    if not np.any(x):
        return 0.0
    c = np.correlate(x, x, "full")[len(x) - 1:]
    a, b = int(sr / hi), int(sr / lo)
    if b >= len(c):
        return 0.0
    return sr / (a + int(np.argmax(c[a:b])))


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("src"); p.add_argument("dst")
    p.add_argument("--factor", type=float, default=1.4)
    a = p.parse_args()
    x, sr = sf.read(a.src, dtype="float32", always_2d=False)
    if x.ndim > 1:
        x = x.mean(axis=1)
    y = time_stretch(x.astype(float), a.factor)
    peak = np.abs(y).max()
    if peak > 0:
        y = y / peak * 10 ** (-3 / 20)
    sf.write(a.dst, y.astype("float32"), sr)
    print(f"{a.src} -> {a.dst}")
    print(f"  {len(x)/sr:.3f}s -> {len(y)/sr:.3f}s  (x{len(y)/len(x):.2f}, asked x{a.factor})")
    print(f"  pitch {f0(x, sr):.1f} Hz -> {f0(y, sr):.1f} Hz")
