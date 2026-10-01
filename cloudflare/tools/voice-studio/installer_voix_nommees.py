#!/usr/bin/env python
"""
Installe les extraits de référence des voix nommées dans le studio (Norman, 2026-10-01).

Copie, pour chaque voix du tableau ci-dessous, l'extrait « _enhanced » choisi à l'écoute (page candidats/echantillons.html, préparée par
preparer_echantillons.py) vers <studio>/voix/<identifiant>.wav. L'identifiant doit correspondre à une ligne de
cloudflare/public/modules/voix-nommees-v1.js. Ne remplace pas un extrait déjà présent (sauf option --force).
"""
import json
import os
import shutil
import sys

BASE = os.path.join(os.environ.get("USERPROFILE", os.path.expanduser("~")), "soreal-voice-studio")
CANDIDATS = os.path.join(BASE, "candidats")
VOIX = os.path.join(BASE, "voix")
# identifiant de la voix -> numéro dans le catalogue des candidats (V22...)
CHOIX = {
    "bohort": "V22", "asmr": "V30", "lea": "V05", "lecteur": "V32", "marius": "V31", "dandy": "V28",
    "cool": "V23", "niais": "V21", "vieille": "V17", "mamie": "V16", "folle": "V14",
}


def main():
    force = "--force" in sys.argv
    with open(os.path.join(CANDIDATS, "catalogue.json"), encoding="utf-8") as f:
        par_id = {v["id"]: v for v in json.load(f)}
    os.makedirs(VOIX, exist_ok=True)
    for identifiant, numero in CHOIX.items():
        source = os.path.join(CANDIDATS, par_id[numero]["fichier"])
        cible = os.path.join(VOIX, identifiant + ".wav")
        if os.path.isfile(cible) and not force:
            print("Déjà présent :", cible)
            continue
        shutil.copyfile(source, cible)
        print("Installé :", identifiant, "<-", numero)


if __name__ == "__main__":
    main()
