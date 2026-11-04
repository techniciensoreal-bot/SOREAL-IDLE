"""Voix de Cthulhu, la mascotte : un enfant d'environ 10 ans (Norman, 2026-11-04 : « une voix d'enfant, mais pas trop jeune »).
Fabrique trois candidats (plus ou moins aigus) à partir de la voix de référence « lea », dans candidats/cthulhu/ ; installe le candidat B
comme voix « cthulhu » (voix/cthulhu.wav) si elle n'existe pas encore. Le choix se change en recopiant un autre candidat sur voix/cthulhu.wav.
"""
import os
import shutil
import librosa
import numpy as np
import soundfile as sf

BASE = os.path.join(os.environ["USERPROFILE"], "soreal-voice-studio")
VOIX = os.path.join(BASE, "voix")
ESSAIS = os.path.join(BASE, "candidats", "cthulhu")
os.makedirs(ESSAIS, exist_ok=True)

def fabriquer(source, demi_tons, sortie):
    y, sr = librosa.load(os.path.join(VOIX, source), sr=24000, mono=True)
    y = y[: int(sr * 14)]                       # 14 s au plus
    z = librosa.effects.pitch_shift(y, sr=sr, n_steps=demi_tons)
    z = z / max(1e-6, np.max(np.abs(z))) * 0.89
    sf.write(sortie, z, sr, subtype="PCM_16")
    print("écrit", sortie, round(len(z) / sr, 1), "s")

fabriquer("lea.wav", 3.0, os.path.join(ESSAIS, "cthulhu_A_plus_grand_p3.wav"))
fabriquer("lea.wav", 4.5, os.path.join(ESSAIS, "cthulhu_B_dix_ans_p4_5.wav"))
fabriquer("lea.wav", 6.0, os.path.join(ESSAIS, "cthulhu_C_plus_jeune_p6.wav"))
cible = os.path.join(VOIX, "cthulhu.wav")
if not os.path.isfile(cible):
    shutil.copyfile(os.path.join(ESSAIS, "cthulhu_B_dix_ans_p4_5.wav"), cible)
    print("voix « cthulhu » installée (candidat B)")
else:
    print("cthulhu.wav existe déjà")
