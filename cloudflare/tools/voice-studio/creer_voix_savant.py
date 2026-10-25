#!/usr/bin/env python
"""
Crée la voix « Savant cynique » (Norman, 2026-10-25 : « une voix qui ressemble à celle de Rick dans Rick & Morty ») : voix/savant.wav.

Ce n'est PAS un clone de l'acteur : aucun extrait de la série n'est utilisé. L'extrait de référence est fabriqué depuis la voix d'homme du studio (voix/homme.wav) :
un peu plus grave, un peu plus lent (voix qui traîne), un timbre nasal (bande 1,2 à 2,8 kHz renforcée) et rauque (saturation douce + souffle modulé), comme un vieux savant
blasé. Chatterbox imite ensuite ce timbre pour tout texte. Réglage conseillé (reglages-voix.json) : exaggeration 0,7, cfg 0,3 (débit relâché, humeur marquée).
Ne remplace pas un extrait déjà présent (--force pour refaire).
"""
import os
import sys

import librosa
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

BASE = os.path.join(os.environ.get("USERPROFILE", os.path.expanduser("~")), "soreal-voice-studio")
VOIX = os.path.join(BASE, "voix")
ESSAIS = os.path.join(BASE, "candidats", "savant")
FORCE = "--force" in sys.argv


def fabriquer(sortie, demi_tons=-1.5, vitesse=0.93, rauque=0.35, nasal=0.8):
    y, sr = librosa.load(os.path.join(VOIX, "homme.wav"), sr=24000, mono=True)
    y = y[: int(sr * 14)]
    z = librosa.effects.pitch_shift(y, sr=sr, n_steps=demi_tons)
    z = librosa.effects.time_stretch(z, rate=vitesse)
    sos = butter(2, [1200, 2800], btype="bandpass", fs=sr, output="sos")
    z = z + nasal * sosfilt(sos, z)
    z = z / max(1e-6, float(np.max(np.abs(z))))
    z = np.tanh(z * (1.0 + 2.2 * rauque)) / np.tanh(1.0 + 2.2 * rauque)
    rng = np.random.default_rng(7)
    souffle = rng.standard_normal(len(z))
    env = np.abs(librosa.effects.preemphasis(z))
    env = np.convolve(env, np.ones(240) / 240, mode="same")
    z = z + 0.06 * rauque * souffle * (env / max(1e-6, float(np.max(env))))
    z = z / max(1e-6, float(np.max(np.abs(z)))) * 0.89
    sf.write(sortie, z, sr, subtype="PCM_16")
    print("écrit", sortie, round(len(z) / sr, 1), "s")


os.makedirs(ESSAIS, exist_ok=True)
fabriquer(os.path.join(ESSAIS, "savant_a.wav"))
fabriquer(os.path.join(ESSAIS, "savant_b_plus_rauque.wav"), -2.5, 0.9, 0.6, 1.0)
cible = os.path.join(VOIX, "savant.wav")
if os.path.isfile(cible) and not FORCE:
    print("Déjà présent :", cible)
else:
    with open(os.path.join(ESSAIS, "savant_a.wav"), "rb") as a, open(cible, "wb") as b:
        b.write(a.read())
    print("Installé :", cible)
