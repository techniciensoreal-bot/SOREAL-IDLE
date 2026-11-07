"""Candidates de VOIX pour Cthulhu (Lhu), en plus de la voix d'enfant déjà en place (Norman, 2026-11-07 : « j'ai déjà la voix petit enfant, n'écrase pas, ajoute les autres, laisse-moi écouter »).

N'ÉCRASE JAMAIS voix/cthulhu.wav : chaque candidat est une NOUVELLE voix nommée (voix/cthulhu-<nom>.wav), fabriquée à partir d'un extrait de référence existant décalé en hauteur ;
puis le studio de voix déjà lancé (127.0.0.1:8765) en lit un échantillon (candidats/cthulhu2/<nom>.m4a) pour l'écoute. Une fois la voix choisie, elle devient la voix des répliques de Lhu
(cthulhu-bulles) : ce script n'y touche pas.

Utilisation (studio lancé) :  venv\\Scripts\\python.exe creer_voix_cthulhu_candidats.py
"""
import json
import os
import urllib.request

import librosa
import numpy as np
import soundfile as sf

BASE = os.path.join(os.environ["USERPROFILE"], "soreal-voice-studio")
VOIX = os.path.join(BASE, "voix")
SORTIE = os.path.join(BASE, "candidats", "cthulhu2")
os.makedirs(SORTIE, exist_ok=True)
URL = "http://127.0.0.1:8765/synthese"

# nom -> (extrait de référence, demi-tons, exaggeration, cfg, description)
CANDIDATS = {
    "cthulhu-ancien": ("homme.wav", -3.5, 0.45, 0.45, "dieu ancien qui s'ennuie : grave, posé, caverneux"),
    "cthulhu-malicieux": ("homme.wav", 3.0, 0.65, 0.4, "petit être malicieux et sarcastique : plus haut, plus vif, plus d'ironie"),
    "cthulhu-chuchote": ("asmr.wav", 0.0, 0.3, 0.3, "chuchoté, mystérieux, presque confidentiel"),
    "cthulhu-vieux-sage": ("mamie.wav", -3.0, 0.5, 0.45, "vieille créature qui en a trop vu : voix âgée, un peu rauque"),
    "cthulhu-ado": ("femme.wav", -1.5, 0.6, 0.4, "adolescent blasé : ton traînant, moqueur"),
}

LIGNES = [
    "Mon nom te demanderait de te mâcher la langue. Appelle-moi Lhu.",
    "Le bois ne rend pas les coups.",
    "Bravo ! Tu l'as défoncé cette fois.",
]


def fabriquer(source, demi_tons, sortie):
    y, sr = librosa.load(os.path.join(VOIX, source), sr=24000, mono=True)
    y = y[: int(sr * 14)]
    z = librosa.effects.pitch_shift(y, sr=sr, n_steps=demi_tons) if demi_tons else y
    z = z / max(1e-6, np.max(np.abs(z))) * 0.89
    sf.write(sortie, z, sr, subtype="PCM_16")


def synthese(voix, texte, exag, cfg, fichier):
    corps = json.dumps({"texte": texte, "voix": voix, "exaggeration": exag, "cfg": cfg}).encode("utf-8")
    req = urllib.request.Request(URL, data=corps, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as r:
        with open(fichier, "wb") as f:
            f.write(r.read())
        return r.headers.get("X-Duree-Secondes")


if __name__ == "__main__":
    for nom, (source, ton, exag, cfg, desc) in CANDIDATS.items():
        cible = os.path.join(VOIX, nom + ".wav")
        if os.path.exists(os.path.join(VOIX, "cthulhu.wav")) and nom == "cthulhu":
            raise SystemExit("jamais cthulhu.wav")
        fabriquer(source, ton, cible)
        print("voix", nom, "-", desc, flush=True)
        for i, ligne in enumerate(LIGNES, 1):
            f = os.path.join(SORTIE, "%s_%d.m4a" % (nom, i))
            try:
                d = synthese(nom, ligne, exag, cfg, f)
                print("  ", os.path.basename(f), d, "s", flush=True)
            except Exception as e:  # noqa: BLE001
                print("  ERREUR", nom, i, str(e)[:200], flush=True)
    print("terminé :", SORTIE)
