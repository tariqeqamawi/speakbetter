# Builds public/sfx/fanfare-1.mp3 to fanfare-4.mp3:
#   python scripts/sfx/build-fanfare.py   (needs ffmpeg on PATH)
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

trumpet = dict(players=3, bright=1.15, attack=0.018, pan0=0.55, pan1=0.85)
horn = dict(players=2, bright=0.7, attack=0.07, pan0=0.15, pan1=0.45)
tuba = dict(players=2, bright=0.5, attack=0.05, pan0=0.4, pan1=0.6)

# Four calls, so no two thresholds in a row sound the same. Each is
# trumpets calling, French horns swelling a chord underneath, tubas at
# the floor.

def call_1():
    """B-flat: a triplet pickup on F, then up through the chord to a held
    top F - "ta-ta-ta TAAA, ta-TAAAAA"."""
    for i in range(3):
        section(midi=65, start=i * 0.12, length=0.085, loud=0.9, **trumpet)       # F4 F4 F4
    section(midi=70, start=0.36, length=0.46, loud=1.0, **trumpet)                # Bb4
    section(midi=74, start=0.84, length=0.16, loud=0.95, **trumpet)               # D5
    section(midi=77, start=1.02, length=1.55, loud=1.1, **trumpet)                # F5, held
    for m_ in (58, 62, 65):                                                      # Bb3 D4 F4
        section(midi=m_, start=0.36, length=0.62, loud=0.5, **horn)
    for m_ in (58, 65, 70):                                                      # Bb3 F4 Bb4
        section(midi=m_, start=1.02, length=1.55, loud=0.55, **horn)
    section(midi=34, start=0.36, length=0.6, loud=0.42, **tuba)                   # Bb1
    section(midi=29, start=0.84, length=0.16, loud=0.38, **tuba)                  # F1
    section(midi=34, start=1.02, length=1.55, loud=0.45, **tuba)                  # Bb1

def call_2():
    """C: climbing in two leaps - "da-DAA, da-DAA, DAAAAA"."""
    section(midi=67, start=0.0, length=0.1, loud=0.85, **trumpet)                 # G4
    section(midi=72, start=0.14, length=0.36, loud=1.0, **trumpet)                # C5
    section(midi=67, start=0.56, length=0.1, loud=0.85, **trumpet)                # G4
    section(midi=76, start=0.7, length=0.36, loud=1.0, **trumpet)                 # E5
    section(midi=79, start=1.12, length=1.45, loud=1.1, **trumpet)                # G5, held
    for m_ in (60, 64, 67):                                                      # C4 E4 G4
        section(midi=m_, start=0.14, length=0.92, loud=0.5, **horn)
    for m_ in (60, 67, 72):                                                      # C4 G4 C5
        section(midi=m_, start=1.12, length=1.45, loud=0.55, **horn)
    section(midi=36, start=0.14, length=0.36, loud=0.42, **tuba)                  # C2
    section(midi=31, start=0.7, length=0.36, loud=0.4, **tuba)                    # G1
    section(midi=36, start=1.12, length=1.45, loud=0.45, **tuba)                  # C2

def call_3():
    """E-flat: the horns call first, low, and the trumpets answer them,
    running up the chord to a high held B-flat."""
    section(midi=58, start=0.0, length=0.26, loud=0.75, **horn)                  # Bb3
    section(midi=63, start=0.3, length=0.46, loud=0.8, **horn)                   # Eb4
    section(midi=39, start=0.3, length=0.46, loud=0.4, **tuba)                   # Eb2
    section(midi=70, start=0.74, length=0.13, loud=0.9, **trumpet)               # Bb4
    section(midi=75, start=0.9, length=0.13, loud=0.95, **trumpet)               # Eb5
    section(midi=79, start=1.06, length=0.13, loud=1.0, **trumpet)               # G5
    section(midi=82, start=1.22, length=1.35, loud=1.1, **trumpet)               # Bb5, held
    for m_ in (63, 67, 70):                                                     # Eb4 G4 Bb4
        section(midi=m_, start=1.22, length=1.35, loud=0.55, **horn)
    section(midi=34, start=0.9, length=0.3, loud=0.38, **tuba)                   # Bb1
    section(midi=39, start=1.22, length=1.35, loud=0.45, **tuba)                 # Eb2

def call_4():
    """D: stately and dotted - "DAA, da-DAA, da-DAAAAA" - a procession."""
    section(midi=69, start=0.0, length=0.3, loud=0.95, **trumpet)                # A4
    section(midi=74, start=0.34, length=0.1, loud=0.85, **trumpet)               # D5
    section(midi=74, start=0.48, length=0.3, loud=1.0, **trumpet)                # D5
    section(midi=78, start=0.82, length=0.1, loud=0.9, **trumpet)                # F#5
    section(midi=81, start=0.98, length=1.5, loud=1.1, **trumpet)                # A5, held
    for m_ in (62, 66, 69):                                                     # D4 F#4 A4
        section(midi=m_, start=0.0, length=0.9, loud=0.5, **horn)
    for m_ in (62, 69, 74):                                                     # D4 A4 D5
        section(midi=m_, start=0.98, length=1.5, loud=0.55, **horn)
    section(midi=38, start=0.0, length=0.3, loud=0.42, **tuba)                   # D2
    section(midi=33, start=0.48, length=0.3, loud=0.4, **tuba)                   # A1
    section(midi=38, start=0.98, length=1.5, loud=0.45, **tuba)                  # D2

# A hall: exponentially decaying noise, different each side, convolved.
def hall():
    """Put what is in L/R into a hall, normalised."""
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

    return outL, outR

here = os.path.dirname(os.path.abspath(__file__))
root = os.path.abspath(os.path.join(here, "..", ".."))
for k, call in enumerate((call_1, call_2, call_3, call_4), start=1):
    L[:] = 0; R[:] = 0
    call()
    outL, outR = hall()
    wav = os.path.join(here, f"fanfare-{k}.wav")
    with wave.open(wav, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.stack([outL, outR], 1) * 32767).astype(np.int16).tobytes())
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-af",
                    "highpass=f=35,afade=t=out:st=3.0:d=0.6", "-c:a", "libmp3lame", "-b:a", "128k",
                    os.path.join(root, "public", "sfx", f"fanfare-{k}.mp3")], check=True)
    os.remove(wav)
    print(f"wrote public/sfx/fanfare-{k}.mp3")
