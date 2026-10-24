import os
import librosa
import numpy as np
import soundfile as sf

BASE = os.path.join(os.environ["USERPROFILE"], "soreal-voice-studio")
VOIX = os.path.join(BASE, "voix")
ESSAIS = os.path.join(BASE, "candidats", "garcon")
os.makedirs(ESSAIS, exist_ok=True)

def fabriquer(source, demi_tons, sortie):
    y, sr = librosa.load(os.path.join(VOIX, source), sr=24000, mono=True)
    y = y[: int(sr * 14)]                       # 14 s au plus
    z = librosa.effects.pitch_shift(y, sr=sr, n_steps=demi_tons)
    z = z / max(1e-6, np.max(np.abs(z))) * 0.89
    sf.write(sortie, z, sr, subtype="PCM_16")
    print("écrit", sortie, round(len(z) / sr, 1), "s")

fabriquer("lea.wav", 4.0, os.path.join(ESSAIS, "garcon_a_lea_p4.wav"))
fabriquer("lea.wav", 6.0, os.path.join(ESSAIS, "garcon_b_lea_p6.wav"))
fabriquer("femme.wav", 5.0, os.path.join(ESSAIS, "garcon_c_femme_p5.wav"))
cible = os.path.join(VOIX, "garcon.wav")
if not os.path.isfile(cible):
    fabriquer("lea.wav", 5.0, cible)
else:
    print("garcon.wav existe déjà")
