#!/usr/bin/env python
"""
Prépare la page d'écoute des voix candidates (Norman, 2026-10-01 : « écouter des échantillons et choisir celles que je veux »).

Lit les extraits de voix FRANÇAISES dans <studio>/candidats/ (par défaut candidats/cml : jeu de données CML-TTS, licence CC BY 4.0, via le
dépôt kyutai/tts-voices) ainsi que les deux voix actuelles (voix/ref_tom.wav, voix/ref_siwis.wav), estime la hauteur de chaque voix pour la
ranger (voix de femme / voix d'homme, de la plus aiguë à la plus grave), puis écrit :
  - candidats/catalogue.json   : la liste des voix (identifiant V01…, fichier, hauteur, genre estimé, durée) ;
  - candidats/echantillons.html : une page avec un lecteur par voix et une case « Je garde » (la sélection est mémorisée dans la page).
Ouvre la page par un petit serveur local (python -m http.server dans le dossier candidats), pas en double-cliquant le fichier.
"""
import glob
import json
import os
import wave

import numpy as np

BASE = os.path.join(os.environ.get("USERPROFILE", os.path.expanduser("~")), "soreal-voice-studio")
CANDIDATS = os.path.join(BASE, "candidats")


def lire(chemin):
    with wave.open(chemin) as w:
        sr = w.getframerate()
        n = w.getnframes()
        brut = w.readframes(n)
        canaux = w.getnchannels()
    x = np.frombuffer(brut, dtype=np.int16).astype(np.float64) / 32768.0
    if canaux > 1:
        x = x.reshape(-1, canaux).mean(axis=1)
    return x, sr


def hauteur(x, sr):
    """Hauteur médiane (Hz) des passages voisés, par autocorrélation ; None si rien d'exploitable."""
    pas = int(sr * 0.02)
    taille = int(sr * 0.04)
    lag_min = int(sr / 400)
    lag_max = int(sr / 70)
    valeurs = []
    seuil = 0.5 * np.sqrt(np.mean(x ** 2))
    for debut in range(0, len(x) - taille - lag_max, pas):
        f = x[debut:debut + taille + lag_max]
        a = f[:taille]
        if np.sqrt(np.mean(a ** 2)) < seuil:
            continue
        a = a - a.mean()
        e0 = np.dot(a, a)
        if e0 <= 1e-9:
            continue
        meilleur, lag_ok = 0.0, 0
        for lag in range(lag_min, lag_max):
            b = f[lag:lag + taille] - f[lag:lag + taille].mean()
            c = np.dot(a, b) / np.sqrt(e0 * np.dot(b, b) + 1e-12)
            if c > meilleur:
                meilleur, lag_ok = c, lag
        if meilleur > 0.6 and lag_ok:
            valeurs.append(sr / lag_ok)
    return float(np.median(valeurs)) if len(valeurs) >= 5 else None


def main():
    fichiers = sorted(glob.glob(os.path.join(CANDIDATS, "cml", "*.wav")))
    voix = []
    for chemin in fichiers:
        x, sr = lire(chemin)
        f0 = hauteur(x, sr)
        voix.append({"fichier": os.path.relpath(chemin, CANDIDATS).replace("\\", "/"), "f0": f0, "duree": round(len(x) / sr, 1), "source": "CML-TTS"})
    actuelles = []
    for nom, etiquette in (("ref_tom.wav", "Voix actuelle : Tom (narrateur)"), ("ref_siwis.wav", "Voix actuelle : Siwis (femme)")):
        chemin = os.path.join(BASE, "voix", nom)
        if os.path.isfile(chemin):
            dest = os.path.join(CANDIDATS, nom)
            with open(chemin, "rb") as a, open(dest, "wb") as b:
                b.write(a.read())
            x, sr = lire(chemin)
            actuelles.append({"fichier": nom, "f0": hauteur(x, sr), "duree": round(len(x) / sr, 1), "source": etiquette})
    for v in voix:
        v["genre"] = "femme" if (v["f0"] or 0) >= 165 else "homme"
    femmes = sorted([v for v in voix if v["genre"] == "femme"], key=lambda v: -(v["f0"] or 0))
    hommes = sorted([v for v in voix if v["genre"] == "homme"], key=lambda v: -(v["f0"] or 0))
    for i, v in enumerate(femmes + hommes, 1):
        v["id"] = "V%02d" % i
    ordre = femmes + hommes
    with open(os.path.join(CANDIDATS, "catalogue.json"), "w", encoding="utf-8") as f:
        json.dump(ordre, f, ensure_ascii=False, indent=1)

    def carte(v, titre):
        hz = ("%d Hz" % round(v["f0"])) if v["f0"] else "?"
        return ('<div class="v"><div class="t"><b>%s</b> <span>%s · %s · %.0f s</span></div>'
                '<audio controls preload="none" src="%s"></audio>'
                '<label class="k"><input type="checkbox" data-id="%s"> Je garde</label>'
                '<input class="n" type="text" data-nom="%s" placeholder="Nom (ex. Vieux sage)"></div>') % (v.get("id", titre), titre, hz, v["duree"], v["fichier"], v.get("id", titre), v.get("id", titre))

    html = ['<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Voix candidates</title>',
            '<style>body{font:15px system-ui,sans-serif;background:#10131c;color:#eef2ff;margin:0;padding:16px;max-width:900px;margin:auto}h1{font-size:20px}h2{margin:22px 0 8px;font-size:17px;border-bottom:1px solid #34406a;padding-bottom:4px}',
            '.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:10px}.v{background:#1a2036;border:1px solid #2f3b66;border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:6px}',
            '.t span{color:#9fb0e0;font-size:12px}audio{width:100%}.k{display:flex;gap:6px;align-items:center;font-weight:700}.n{background:#0e1428;color:#fff;border:1px solid #34406a;border-radius:8px;padding:6px 8px}',
            '.v.ok{border-color:#3ddc84;box-shadow:0 0 0 1px #3ddc84}#bar{position:sticky;bottom:0;background:#0d1530;border-top:1px solid #2f3b66;padding:10px;margin-top:20px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}button{background:#2f7d4f;color:#fff;border:0;border-radius:10px;padding:8px 14px;font-weight:800;cursor:pointer}</style>',
            '<h1>🎙 Voix françaises candidates</h1><p>Écoute chaque extrait (une vraie voix qui lit une phrase en français). Coche « Je garde » pour celles qui te plaisent, donne-leur un nom si tu veux. Le style final sera généré par le studio à partir de ces voix.</p>']
    html.append('<h2>Voix actuelles du jeu (pour comparer)</h2><div class="g">' + "".join(carte(v, v["source"]) for v in actuelles) + '</div>')
    html.append('<h2>👩 Voix de femme (%d)</h2><div class="g">' % len(femmes) + "".join(carte(v, v["id"]) for v in femmes) + '</div>')
    html.append('<h2>👨 Voix d\'homme (%d)</h2><div class="g">' % len(hommes) + "".join(carte(v, v["id"]) for v in hommes) + '</div>')
    html.append('<div id="bar"><span id="cpt">0 voix gardée</span><button id="copier">Copier ma sélection</button><span id="msg"></span></div>')
    html.append('''<script>
var CLE="soreal_voix_selection_v1";
function lire(){try{return JSON.parse(localStorage.getItem(CLE)||"{}")}catch(e){return {}}}
function ecrire(s){try{localStorage.setItem(CLE,JSON.stringify(s))}catch(e){}}
function maj(){var s=lire(),n=0;document.querySelectorAll("input[data-id]").forEach(function(c){var id=c.getAttribute("data-id");c.checked=!!(s[id]&&s[id].garde);c.closest(".v").classList.toggle("ok",c.checked);if(c.checked)n++;var t=document.querySelector('input[data-nom="'+id+'"]');if(t&&s[id]&&s[id].nom&&t.value!==s[id].nom)t.value=s[id].nom;});document.getElementById("cpt").textContent=n+" voix gardée"+(n>1?"s":"");}
document.addEventListener("change",function(e){var c=e.target;if(c.matches("input[data-id]")){var s=lire(),id=c.getAttribute("data-id");s[id]=s[id]||{};s[id].garde=c.checked;ecrire(s);maj();}});
document.addEventListener("input",function(e){var t=e.target;if(t.matches("input[data-nom]")){var s=lire(),id=t.getAttribute("data-nom");s[id]=s[id]||{};s[id].nom=t.value;ecrire(s);}});
document.getElementById("copier").onclick=function(){var s=lire(),l=Object.keys(s).filter(function(k){return s[k].garde}).map(function(k){return k+(s[k].nom?" = "+s[k].nom:"")}).join("\\n");(navigator.clipboard?navigator.clipboard.writeText(l):Promise.reject()).then(function(){document.getElementById("msg").textContent="Copié !"},function(){document.getElementById("msg").textContent=l||"(rien de coché)"});};
/* Une seule lecture à la fois. */
document.addEventListener("play",function(e){document.querySelectorAll("audio").forEach(function(a){if(a!==e.target)a.pause()})},true);
maj();
</script>''')
    with open(os.path.join(CANDIDATS, "echantillons.html"), "w", encoding="utf-8") as f:
        f.write("\n".join(html))
    print("%d voix candidates (%d femmes, %d hommes) -> %s" % (len(ordre), len(femmes), len(hommes), os.path.join(CANDIDATS, "echantillons.html")))


if __name__ == "__main__":
    main()
