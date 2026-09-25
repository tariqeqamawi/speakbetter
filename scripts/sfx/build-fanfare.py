# Builds public/sfx/fanfare.mp3: python scripts/sfx/build-fanfare.py
# (writes fanfare.wav, then runs ffmpeg on PATH to make the mp3).
#
# The fanfare that heralds each new phase of the road: trumpets calling,
# French horns swelling underneath, a tuba at the bottom. Synthesised
# rather than downloaded, so there is no licence to track.
#
# What makes a synthesised note sound like brass rather than an organ:
#  - its brightness follows its loudness: a soft brass note is dark, and
#    the upper harmonics bloom in as it swells;
#  - it starts a little flat and scoops up to pitch as the lips lock in;
#  - a breath of noise on the attack;
#  - a section is several players, each a few cents off and a few
#    milliseconds late, placed across the stereo field;
#  - all of it in a hall.
import numpy as np, wave, subprocess, os

SR = 44100
DUR = 3.6
rng = np.random.default_rng(3)
n = int(SR * DUR)
L = np.zeros(n); R = np.zeros(n)

def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)

def note(midi, start, length, loud, bright, attack, pan, cents=0.0, vib=0.004):
    """One player's note, added into L/R."""
    f0 = hz(midi) * 2 ** (cents / 1200)
    tail = 0.22
    m = int(SR * (length + tail))
    t = np.arange(m) / SR
    # Loudness: a lipped attack, a slight swell through the note, release.
    env = 1 - np.exp(-t / attack)
    env *= 1 + 0.18 * np.clip(t / max(length, 1e-3), 0, 1)
    rel = np.clip((length + tail - t) / tail, 0, 1) ** 1.5
    env *= np.where(t < length, 1.0, rel)
    env *= loud
    # Pitch: a scoop up from a little flat, then vibrato once settled.
    scoop = -0.025 * np.exp(-t / 0.035)
    wob = vib * np.sin(2 * np.pi * 5.3 * t + rng.uniform(0, 6)) * np.clip((t - 0.35) / 0.3, 0, 1)
    f = f0 * (1 + scoop + wob)
    phase = 2 * np.pi * np.cumsum(f) / SR
    # Brightness follows loudness: harmonics fall away more steeply when soft.
    b = bright * np.clip(env / max(loud, 1e-6), 0, 1.2)
    y = np.zeros(m)
    k = 1
    while k * f0 < 11000 and k <= 40:
        amp = np.exp(-(k - 1) * (1.3 - b) * 0.45) / k ** 0.75
        y += amp * np.sin(k * phase)
        k += 1
    # Breath on the attack.
    breath = rng.standard_normal(m) * np.exp(-t / 0.03) * 0.05
    y = (y / 6 + breath) * env
    i = int(SR * start)
    j = min(n, i + m)
    y = y[: j - i]
    L[i:j] += y * np.cos(pan * np.pi / 2)
    R[i:j] += y * np.sin(pan * np.pi / 2)

def section(players, midi, start, length, loud, bright, attack, pan0, pan1):
    for p in range(players):
        pan = pan0 + (pan1 - pan0) * (p + 0.5) / players
        note(midi, start + rng.uniform(0, 0.014), length, loud / players ** 0.5, bright, attack,
             pan, cents=rng.uniform(-6, 6))

# The call, in B-flat: a triplet pickup on F, then up through the chord
# to a held top F - "ta-ta-ta TAAA, ta-TAAAAA".
T = 0.0
trumpet = dict(players=3, bright=1.15, attack=0.018, pan0=0.55, pan1=0.85)
for i in range(3):
    section(midi=65, start=T + i * 0.12, length=0.085, loud=0.9, **trumpet)       # F4 F4 F4
section(midi=70, start=T + 0.36, length=0.46, loud=1.0, **trumpet)                # Bb4
section(midi=74, start=T + 0.84, length=0.16, loud=0.95, **trumpet)               # D5
section(midi=77, start=T + 1.02, length=1.55, loud=1.1, **trumpet)                # F5, held

# French horns: a swelling chord under the call, then settling on the
# tonic with it.
horn = dict(players=2, bright=0.7, attack=0.07, pan0=0.15, pan1=0.45)
for m_ in (58, 62, 65):                                                          # Bb3 D4 F4
    section(midi=m_, start=T + 0.36, length=0.62, loud=0.5, **horn)
for m_ in (58, 65, 70):                                                          # Bb3 F4 Bb4
    section(midi=m_, start=T + 1.02, length=1.55, loud=0.55, **horn)

# Tuba: the floor under it all.
tuba = dict(players=2, bright=0.5, attack=0.05, pan0=0.4, pan1=0.6)
section(midi=34, start=T + 0.36, length=0.6, loud=0.42, **tuba)                    # Bb1
section(midi=29, start=T + 0.84, length=0.16, loud=0.38, **tuba)                   # F1
section(midi=34, start=T + 1.02, length=1.55, loud=0.45, **tuba)                  # Bb1

# A hall: exponentially decaying noise, different each side, convolved.
IR_LEN = int(SR * 2.0)
ti = np.arange(IR_LEN) / SR
def ir():
    x = rng.standard_normal(IR_LEN) * np.exp(-ti / 0.45)
    x[: int(SR * 0.012)] = 0  # pre-delay
    return x / np.sqrt(np.sum(x ** 2))
def conv(a, b):
    size = 1 << int(np.ceil(np.log2(len(a) + len(b))))
    return np.fft.irfft(np.fft.rfft(a, size) * np.fft.rfft(b, size), size)[: len(a)]
wetL, wetR = conv(L, ir()), conv(R, ir())
outL = L * 0.8 + wetL * 0.45
outR = R * 0.8 + wetR * 0.45
peak = max(np.abs(outL).max(), np.abs(outR).max())
outL /= peak / 0.9; outR /= peak / 0.9

here = os.path.dirname(os.path.abspath(__file__))
wav = os.path.join(here, "fanfare.wav")
with wave.open(wav, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.stack([outL, outR], 1) * 32767).astype(np.int16).tobytes())
root = os.path.abspath(os.path.join(here, "..", ".."))
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-af",
                "highpass=f=35,afade=t=out:st=3.0:d=0.6", "-c:a", "libmp3lame", "-b:a", "128k",
                os.path.join(root, "public", "sfx", "fanfare.mp3")], check=True)
os.remove(wav)
print("wrote public/sfx/fanfare.mp3")
