#!/usr/bin/env python
"""
Fait lire une phrase de test à chaque voix du studio et prépare la page d'écoute candidats/essais.html (Norman, 2026-10-01).

Le studio de voix doit tourner (lancer.bat). Pour chaque voix (homme, femme et les voix nommées de voix/*.wav), envoie la phrase de test à
POST /synthese, enregistre le résultat dans candidats/essais/<voix>.m4a, puis écrit candidats/essais.html (un lecteur par voix).
Option : --texte "ta phrase" pour changer la phrase de test.
"""
import json
import os
import sys
import time
import urllib.request

BASE = os.path.join(os.environ.get("USERPROFILE", os.path.expanduser("~")), "soreal-voice-studio")
CANDIDATS = os.path.join(BASE, "candidats")
STUDIO = os.environ.get("SOREAL_VOIX_URL", "http://127.0.0.1:8765")
TEXTE = ("Le village dort encore, mais moi, je suis déjà debout. J'ai préparé mon sac, vérifié mon épée, et je me suis promis de ne plus "
         "jamais revenir sans la réponse que je cherche.")
NOMS = {
    "homme": "Narrateur actuel (Tom)", "femme": "Femme actuelle (Siwis)", "pere-de-bohort": "Père de Bohort", "asmr": "ASMR",
    "realiste-femme": "Réaliste femme", "lecteur": "Lecteur", "marseille": "Marseille", "pd": "PD", "cool": "Cool", "gogole": "Gogole",
    "vieille": "Vieille", "jeune-vieille": "Jeune vieille", "folle-2": "Folle 2",
}


def demander(chemin):
    with urllib.request.urlopen(STUDIO + chemin, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def synthese(texte, voix):
    corps = json.dumps({"texte": texte, "voix": voix}).encode("utf-8")
    req = urllib.request.Request(STUDIO + "/synthese", data=corps, headers={"content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as r:
        return r.read()


def main():
    texte = TEXTE
    if "--texte" in sys.argv:
        texte = sys.argv[sys.argv.index("--texte") + 1]
    voix = demander("/ping").get("voixNommees") or ["homme", "femme"]
    ordre = [v for v in NOMS if v in voix] + [v for v in voix if v not in NOMS]
    dossier = os.path.join(CANDIDATS, "essais")
    os.makedirs(dossier, exist_ok=True)
    cartes = []
    for i, v in enumerate(ordre, 1):
        sortie = os.path.join(dossier, v + ".m4a")
        debut = time.time()
        try:
            audio = synthese(texte, v)
            with open(sortie, "wb") as f:
                f.write(audio)
            print("[%d/%d] %s : %.0f s" % (i, len(ordre), v, time.time() - debut), flush=True)
        except Exception as e:  # noqa: BLE001
            print("[%d/%d] %s : ÉCHEC %s" % (i, len(ordre), v, e), flush=True)
            continue
        cartes.append('<div class="v"><div class="t"><b>%s</b> <span>%s</span></div><audio controls preload="none" src="essais/%s.m4a"></audio>'
                      '<label class="k"><input type="checkbox" data-id="%s"> Je garde</label></div>' % (NOMS.get(v, v), v, v, v))
    html = ('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Essais des voix</title>'
            '<style>body{font:15px system-ui,sans-serif;background:#10131c;color:#eef2ff;padding:16px;max-width:900px;margin:auto}'
            '.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:10px}.v{background:#1a2036;border:1px solid #2f3b66;border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:6px}'
            '.t span{color:#9fb0e0;font-size:12px}audio{width:100%}.k{display:flex;gap:6px;align-items:center;font-weight:700}.v.ok{border-color:#3ddc84}</style>'
            '<h1>🎙 Essais des voix générées par le studio</h1><p>Phrase : « ' + texte + ' »</p><div class="g">' + "".join(cartes) + '</div>'
            '<script>var C="soreal_voix_essais_v1";function L(){try{return JSON.parse(localStorage.getItem(C)||"{}")}catch(e){return {}}}'
            'function M(){var s=L();document.querySelectorAll("input[data-id]").forEach(function(c){c.checked=!!s[c.dataset.id];c.closest(".v").classList.toggle("ok",c.checked)})}'
            'document.addEventListener("change",function(e){if(e.target.matches("input[data-id]")){var s=L();s[e.target.dataset.id]=e.target.checked;localStorage.setItem(C,JSON.stringify(s));M()}});'
            'document.addEventListener("play",function(e){document.querySelectorAll("audio").forEach(function(a){if(a!==e.target)a.pause()})},true);M();</script>')
    with open(os.path.join(CANDIDATS, "essais.html"), "w", encoding="utf-8") as f:
        f.write(html)
    print("Page prête :", os.path.join(CANDIDATS, "essais.html"), "-> http://127.0.0.1:8788/essais.html")


if __name__ == "__main__":
    main()
