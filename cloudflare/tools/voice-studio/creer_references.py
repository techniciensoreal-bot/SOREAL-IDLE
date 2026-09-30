#!/usr/bin/env python
"""
Crée les deux extraits de référence du studio de voix (voix/homme.wav et voix/femme.wav) à partir de voix Piper FRANÇAISES libres
(« Tom » : homme, « Siwis » : femme). Sert à donner à Chatterbox une voix française à imiter, donc sans accent anglais.
Ne refait pas un extrait qui existe déjà : remplace-les à la main par tes propres extraits (6 à 15 s) si tu préfères.
"""
import os
import urllib.request
import wave

BASE = os.path.join(os.environ.get("USERPROFILE", os.path.expanduser("~")), "soreal-voice-studio")
MODELES = os.path.join(BASE, "modeles")
VOIX = os.path.join(BASE, "voix")
HF = "https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/"
TEXTE = ("Le village dort encore, mais moi, je suis déjà debout. J'ai préparé mon sac, vérifié mon épée, et je me suis promis "
         "de ne plus jamais revenir sans la réponse que je cherche. Il faut parfois marcher longtemps pour comprendre où l'on va.")
VOIX_PIPER = {"homme": "tom", "femme": "siwis"}


def telecharger(nom):
    os.makedirs(MODELES, exist_ok=True)
    for ext in ("onnx", "onnx.json"):
        cible = os.path.join(MODELES, "fr_FR-%s-medium.%s" % (nom, ext))
        if not os.path.isfile(cible):
            print("Téléchargement", os.path.basename(cible), "…", flush=True)
            urllib.request.urlretrieve(HF + "%s/medium/fr_FR-%s-medium.%s" % (nom, nom, ext), cible)
    return os.path.join(MODELES, "fr_FR-%s-medium.onnx" % nom)


def main():
    from piper import PiperVoice
    os.makedirs(VOIX, exist_ok=True)
    for voix, nom in VOIX_PIPER.items():
        sortie = os.path.join(VOIX, voix + ".wav")
        if os.path.isfile(sortie):
            print("Déjà présent :", sortie)
            continue
        modele = PiperVoice.load(telecharger(nom))
        with wave.open(sortie, "wb") as f:
            modele.synthesize_wav(TEXTE, f)
        print("Créé :", sortie)


if __name__ == "__main__":
    main()
