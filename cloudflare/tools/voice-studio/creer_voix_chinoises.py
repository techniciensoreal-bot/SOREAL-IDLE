#!/usr/bin/env python
"""
Crée deux voix d'hommes à accent chinois (Norman, 2026-10-24) : voix/chinois1.wav et voix/chinois2.wav.

Chatterbox imite le timbre ET l'accent de l'extrait de référence : une voix d'homme qui parle MANDARIN lui fait dire le français avec un accent chinois.
L'extrait vient de la voix libre Piper « chaowen » (homme, mandarin, modeles/zh_CN-chaowen-medium.onnx, https://huggingface.co/rhasspy/piper-voices) qui lit une
phrase en mandarin ; « chinois2 » est le même homme, plus grave et plus lent (hauteur et rythme changés), pour un second timbre. Ne remplace pas un extrait déjà présent
(--force pour refaire). Pour une voix plus vraie : dépose à la place un extrait de 6 à 15 s d'une personne qui parle mandarin (avec son accord).
"""
import os
import sys
import wave

import librosa
import numpy as np
import soundfile as sf

BASE = os.path.join(os.environ.get("USERPROFILE", os.path.expanduser("~")), "soreal-voice-studio")
MODELE = os.path.join(BASE, "modeles", "zh_CN-chaowen-medium.onnx")
VOIX = os.path.join(BASE, "voix")
ESSAIS = os.path.join(BASE, "candidats", "chinois")
TEXTE = "你好，朋友。我是从很远的地方来的。我们要走很长很长的路，才能明白自己要去哪里。请你相信我，这件事真的很重要。"
FORCE = "--force" in sys.argv


def lire_mandarin(sortie):
    # piper cherche les tables chinoises dans <dossier courant>/g2pW (modèle g2pW + paquet « g2pw » sans ses dépendances + unicode-rbnf + sentence-stream)
    os.chdir(BASE)
    from piper import PiperVoice
    voix = PiperVoice.load(MODELE)
    n = 0
    with wave.open(sortie, "wb") as w:
        for morceau in voix.synthesize(TEXTE):
            if n == 0:
                w.setframerate(morceau.sample_rate)
                w.setsampwidth(morceau.sample_width)
                w.setnchannels(morceau.sample_channels)
            w.writeframes(morceau.audio_int16_bytes)
            n += 1
    if n == 0:
        raise SystemExit("Piper n'a produit aucun son (tables chinoises manquantes ?)")


def main():
    os.makedirs(VOIX, exist_ok=True)
    os.makedirs(ESSAIS, exist_ok=True)
    brut = os.path.join(ESSAIS, "chaowen_brut.wav")
    lire_mandarin(brut)
    y, sr = librosa.load(brut, sr=24000, mono=True)
    y = y[: int(sr * 14)]

    def ecrire(z, chemin):
        z = z / max(1e-6, float(np.max(np.abs(z)))) * 0.89
        sf.write(chemin, z, sr, subtype="PCM_16")
        print("écrit", chemin, round(len(z) / sr, 1), "s")

    ecrire(y, os.path.join(ESSAIS, "chinois1.wav"))
    # second homme : plus grave (-2,5 demi-tons) et un peu plus lent (x0,92)
    z = librosa.effects.pitch_shift(y, sr=sr, n_steps=-2.5)
    z = librosa.effects.time_stretch(z, rate=0.92)
    ecrire(z, os.path.join(ESSAIS, "chinois2.wav"))
    for nom in ("chinois1", "chinois2"):
        cible = os.path.join(VOIX, nom + ".wav")
        if os.path.isfile(cible) and not FORCE:
            print("Déjà présent :", cible)
            continue
        with open(os.path.join(ESSAIS, nom + ".wav"), "rb") as a, open(cible, "wb") as b:
            b.write(a.read())
        print("Installé :", cible)


if __name__ == "__main__":
    main()
