# Builds public/sfx/applause.mp3: python scripts/sfx/build-applause.py, then
# ffmpeg -i applause.wav -af "highpass=f=120,lowpass=f=9000,volume=9dB,alimiter=limit=0.89:attack=1:release=40,afade=t=in:st=0:d=0.3,afade=t=out:st=4.2:d=1.8" -c:a libmp3lame -b:a 96k public/sfx/applause.mp3
#
# Synthesised rather than downloaded, so there is no licence to track.
# Applause, built from scratch: a crowd is hundreds of people each
# clapping at their own rate, each clap a short burst of filtered noise
# with its own brightness, loudness and position in the stereo field.
import numpy as np, wave

SR = 44100
DUR = 6.0
rng = np.random.default_rng(7)
n = int(SR * DUR)
L = np.zeros(n); R = np.zeros(n)

def clap(length):
    t = np.arange(length) / SR
    burst = rng.standard_normal(length)
    # A clap is a sharp attack and a very fast decay, with a little body.
    env = np.exp(-t * rng.uniform(55, 110)) * (1 - np.exp(-t * 4000))
    x = burst * env
    # Simple one-pole filters for brightness variety: hands differ.
    a = rng.uniform(0.15, 0.6)
    y = np.empty_like(x); acc = 0.0
    for i in range(length):
        acc = acc + a * (x[i] - acc); y[i] = x[i] - 0.6 * acc  # tilt: remove some lows
    return y

# Swell in, hold, and fade out: the shape of a room applauding a moment.
def crowd_level(t):
    return np.clip(t / 0.8, 0, 1) * np.clip((DUR - t) / 2.2, 0, 1)

people = 140
templates = [clap(int(SR * 0.05)) for _ in range(60)]
for _ in range(people):
    rate = rng.uniform(3.2, 5.8)           # claps per second
    start = rng.uniform(0, 0.9)
    pan = rng.uniform(0, 1)
    loud = rng.uniform(0.25, 1.0) * (0.6 if rng.random() < 0.7 else 1.0)  # a few near, most far
    t = start
    while t < DUR - 0.06:
        i = int(t * SR)
        c = templates[rng.integers(len(templates))] * loud * crowd_level(t)
        L[i:i + len(c)] += c * (1 - pan) ** 0.5
        R[i:i + len(c)] += c * pan ** 0.5
        t += 1 / rate * rng.uniform(0.85, 1.15)

# A touch of room: a short, quiet feedback delay per side.
for ch, d in ((L, 0.023), (R, 0.031)):
    k = int(SR * d)
    for _ in range(3):
        ch[k:] += ch[:-k] * 0.18

peak = max(np.abs(L).max(), np.abs(R).max())
L /= peak / 0.8; R /= peak / 0.8
st = (np.stack([L, R], -1) * 32767).astype(np.int16)
with wave.open("applause.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())
print("ok")
