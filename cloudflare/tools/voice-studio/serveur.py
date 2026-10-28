#!/usr/bin/env python
"""
SOREAL IDLE — studio de voix local (Norman, 2026-09-30).

Petit serveur HTTP qui tourne SUR TON PC (127.0.0.1) et transforme un texte en voix réaliste avec Chatterbox (modèle multilingue,
licence MIT, gratuit) sur ta carte graphique. Le menu Admin du jeu (bouton « Générer les voix ») lui envoie chaque bloc de texte,
récupère un fichier audio m4a, puis le téléverse sur le site. Rien ne quitte ton PC sauf ce fichier audio final.

  GET  /ping      -> {"ok":true,"modele":"chatterbox","gpu":"NVIDIA ..."}
  POST /synthese  -> corps JSON {"texte":"...","voix":"homme"|"femme","exaggeration":0.5,"cfg":0.5} ; réponse : audio/mp4 (AAC mono)

Deux voix : « homme » (narrateur) et « femme ». Chacune imite un court extrait de voix FRANÇAISE (voix/homme.wav, voix/femme.wav dans
le dossier du studio) : c'est ce qui supprime l'accent anglais de la voix par défaut de Chatterbox. Les extraits par défaut sont
produits par creer_references.py (voix Piper françaises libres « Tom » et « Siwis ») ; tu peux les remplacer par tes propres extraits.

Variables d'environnement (facultatives) :
  SOREAL_VOIX_PORT        port d'écoute (défaut 8765)
  SOREAL_VOIX_ORIGINES    origines autorisées, séparées par des virgules (défaut : le site en ligne + localhost)
  SOREAL_VOIX_DOSSIER     dossier des extraits de référence (défaut : <studio>/voix)
  SOREAL_VOIX_DEBIT       débit AAC (défaut 96k)
"""
import io
import time
import json
import os
import re
import subprocess
import sys
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = int(os.environ.get("SOREAL_VOIX_PORT", "8765"))
DEBIT = os.environ.get("SOREAL_VOIX_DEBIT", "96k")
DOSSIER_VOIX = os.environ.get("SOREAL_VOIX_DOSSIER", "").strip() or os.path.join(
    os.environ.get("USERPROFILE", os.path.expanduser("~")), "soreal-voice-studio", "voix")
VOIX_ID_RE = re.compile(r"^[a-z0-9-]{1,32}$")


def reglages_voix(voix):
    """Réglages propres à une voix (reglages-voix.json, à côté de ce fichier) : {"exaggeration": 0.35, "cfg": 0.3}. Valeurs par défaut sinon.
    Servent quand la requête ne précise rien (le menu Admin n'envoie que le texte et la voix)."""
    try:
        with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "reglages-voix.json"), encoding="utf-8") as f:
            r = json.load(f).get(voix) or {}
    except (OSError, ValueError):
        r = {}
    return {"exaggeration": float(r.get("exaggeration", 0.5)), "cfg": float(r.get("cfg", 0.5)), "effet": str(r.get("effet", "")), "micro": r.get("micro", True) is not False}


def voix_disponibles():
    """Identifiants des voix qui ont un extrait de référence (homme, femme et les voix nommées : voix/<identifiant>.wav)."""
    try:
        return sorted(f[:-4] for f in os.listdir(DOSSIER_VOIX) if f.endswith(".wav") and VOIX_ID_RE.match(f[:-4]))
    except OSError:
        return []


def reference_voix(voix):
    """Chemin de l'extrait de référence de la voix demandée ; une voix inconnue retombe sur « homme » (None si même celui-ci manque :
    voix par défaut de Chatterbox)."""
    nom = voix if isinstance(voix, str) and VOIX_ID_RE.match(voix) else "homme"
    chemin = os.path.join(DOSSIER_VOIX, nom + ".wav")
    if not os.path.isfile(chemin):
        chemin = os.path.join(DOSSIER_VOIX, "homme.wav")
    return chemin if os.path.isfile(chemin) else None
ORIGINES = [o.strip() for o in os.environ.get(
    "SOREAL_VOIX_ORIGINES",
    "https://soreal-idle.technicien-soreal.workers.dev,app://soreal,http://localhost:8787,http://127.0.0.1:8787"
).split(",") if o.strip()]
MAX_TEXTE = 6000
# Phrases plus longues que cela sont redécoupées : Chatterbox se répète parfois sur de très longs passages.
MAX_SEGMENT = 240

_modele = None
_verrou = threading.Lock()

# Prononciations voulues par Norman (reprises de modules/local-neural-piper-v1.js, PRONONCIATIONS_) : le nom du jeu, « Norman »,
# « Fight Boss », « EXP »… s'écrivent comme ils se disent. Appliquées au texte envoyé à la synthèse seulement.
PRONONCIATIONS = [
    (re.compile(r"\bNorman\b"), "Normanne"),
    (re.compile(r"\bFight Boss\b", re.I), "Faïte Bosse"),
    (re.compile(r"\bFight\b"), "Faïte"),
    (re.compile(r"\bVas[-\u2010\u2011\u2013]y\b", re.I), "Vazi"),
    (re.compile(r"\bEXP\b"), "expérience"),
    (re.compile(r"\bSOREAL\b", re.I), "Soréalle"),
    (re.compile(r"\bIDLE\b", re.I), "Ailledeulle"),
]


def normaliser_texte(texte):
    """Prononciations + bruitages *BLOUM* (un mot puis une pause, jamais « astérisque ») + points de suspension unifiés."""
    t = str(texte)
    for motif, remplacement in PRONONCIATIONS:
        t = motif.sub(remplacement, t)

    def bruitage(m):
        mot = m.group(1).strip()
        if not mot:
            return " "
        if mot == mot.upper() and mot != mot.lower():
            mot = mot[0] + mot[1:].lower()
            return mot + " " if re.search(r"[.!?…]$", mot) else mot + ". "
        return mot + " "

    t = re.sub(r"\*([^*\n]+)\*", bruitage, t).replace("*", " ")
    t = t.replace("\u2026", "...")
    t = re.sub(r"\s+", " ", t).strip()
    # Ton interrogatif (Norman, 2026-10-21) : la typographie française met une espace avant « ? » et « ! » ; le modèle lit mieux la montée finale quand le « ? » colle au dernier mot.
    return re.sub(r"\s+([?!])", r"\1", t)


def ffmpeg_exe():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return os.environ.get("SOREAL_FFMPEG", "ffmpeg")


# PLAFOND DE GÉNÉRATION (Norman, 2026-10-15 : « dans la génération de voix, j'ai énormément de dérapage ; ça met une éternité à générer à cause de ça »). Chatterbox appelle t3.inference(max_new_tokens=1000) en dur :
# un segment qui dérape (le modèle ne s'arrête pas à la fin du texte, boucle ou invente) tourne donc TOUJOURS jusqu'au bout des 1000 jetons (~40 s d'audio, des dizaines de secondes de carte graphique), et le dérapage
# n'était constaté qu'APRÈS coup, puis refait jusqu'à trois fois dans generer_segment (et quatre fois côté générateur) : le temps perdu se multipliait. Le nombre de jetons est maintenant plafonné d'après la durée
# plausible du segment (la même que celle du garde-fou : duree_max_segment) + 1 s de marge, à 25 jetons par seconde : un dérapage s'arrête dès qu'il dépasse ce que le texte permet, est détecté tout de suite (la durée
# dépasse la limite) et réessayé avec des réglages plus calmes. SOREAL_VOIX_PLAFOND=0 le désactive.
JETONS_PAR_SECONDE = 25
MARGE_PLAFOND_S = 1.0
_plafond_jetons = [0]


def plafond_jetons(segment):
    """Nombre maximal de jetons de parole pour ce segment (0 = pas de plafond)."""
    if os.environ.get("SOREAL_VOIX_PLAFOND", "1") == "0":
        return 0
    return int((duree_max_segment(segment) + MARGE_PLAFOND_S) * JETONS_PAR_SECONDE) + 10


def installer_plafond(modele):
    """Enveloppe t3.inference : max_new_tokens ne dépasse jamais le plafond du segment en cours (voir _plafond_jetons)."""
    t3 = modele.t3
    if getattr(t3, "_plafond_installe", False):
        return
    d_origine = t3.inference

    def inference(*args, **kwargs):
        plafond = _plafond_jetons[0]
        if plafond and kwargs.get("max_new_tokens"):
            kwargs["max_new_tokens"] = min(int(kwargs["max_new_tokens"]), plafond)
        return d_origine(*args, **kwargs)

    t3.inference = inference
    t3._plafond_installe = True


def charger_modele():
    global _modele
    if _modele is None:
        import torch
        from chatterbox.mtl_tts import ChatterboxMultilingualTTS
        appareil = "cuda" if torch.cuda.is_available() else "cpu"
        # Plusieurs instances du studio sur la même carte (génération en parallèle) : chacune plafonne sa mémoire (SOREAL_VOIX_MEMOIRE, fraction
        # de la carte, ex. 0.45) pour que l'allocateur libère son cache au lieu de déborder en mémoire partagée (tout devient alors très lent).
        if appareil == "cuda" and os.environ.get("SOREAL_VOIX_MEMOIRE"):
            torch.cuda.set_per_process_memory_fraction(float(os.environ["SOREAL_VOIX_MEMOIRE"]))
        print("Chargement du modèle Chatterbox sur", appareil, "(première fois : téléchargement de quelques Go)…", flush=True)
        try:
            _modele = ChatterboxMultilingualTTS.from_pretrained(device=appareil, t3_model="v3")
        except TypeError:
            _modele = ChatterboxMultilingualTTS.from_pretrained(device=appareil)
        installer_plafond(_modele)
        print("Modèle prêt.", flush=True)
    return _modele


def est_question(segment):
    """Le segment se termine par un point d'interrogation (guillemets, parenthèses ou espaces éventuels après)."""
    return bool(re.search(r"\?[\s»\"')\]]*$", str(segment)))


def decouper(texte):
    """Découpe en segments d'au plus MAX_SEGMENT caractères, sur la ponctuation quand c'est possible."""
    texte = re.sub(r"\s+", " ", texte).strip()
    phrases = re.split(r"(?<=[.!?…»])\s+", texte)
    segments, courant = [], ""
    for p in phrases:
        if courant and est_question(courant):
            segments.append(courant)
            courant = ""
        if est_question(p):
            # Une question forme son propre segment (Norman, 2026-10-21 : « le ton interrogatif n'est pas tout le temps respecté ») : collée à la phrase qui suit ou précède, la montée de fin de phrase se perdait.
            if courant:
                segments.append(courant)
                courant = ""
            if len(p) <= MAX_SEGMENT:
                segments.append(p)
                continue
        if len(p) > MAX_SEGMENT:
            morceaux = re.split(r"(?<=[,;:])\s+", p)
        else:
            morceaux = [p]
        for m in morceaux:
            while len(m) > MAX_SEGMENT:
                coupe = m.rfind(" ", 0, MAX_SEGMENT)
                coupe = coupe if coupe > 40 else MAX_SEGMENT
                segments.append(m[:coupe].strip())
                m = m[coupe:].strip()
            if len(courant) + len(m) + 1 <= MAX_SEGMENT:
                courant = (courant + " " + m).strip()
            else:
                if courant:
                    segments.append(courant)
                courant = m
    if courant:
        segments.append(courant)
    return [s for s in segments if s]


# Sous ce nombre de caractères, Chatterbox plante (« CUDA device-side assert », le contexte GPU est alors perdu) : « Zones » ou « Bien joué »
# seuls ne passent pas, « Zones. Zones. » passe. Un texte très court est donc dit DEUX fois, et on ne garde que la première fois.
TEXTE_COURT = 20


def energie_fenetres(wav, sr, duree_fenetre=0.02):
    """Énergie (RMS) par fenêtre de 20 ms, et durée d'une fenêtre en échantillons."""
    x = wav.squeeze(0).float()
    fenetre = max(1, int(sr * duree_fenetre))
    nb = x.shape[0] // fenetre
    if nb < 1:
        return None, fenetre, 0
    rms = x[: nb * fenetre].reshape(nb, fenetre).pow(2).mean(dim=1).sqrt()
    return rms, fenetre, nb


def silences_interieurs(parole, minimum):
    """Silences (début, fin) d'au moins `minimum` fenêtres entre deux paroles (ni le tout début ni la toute fin)."""
    nb = len(parole)
    debut_parole = next((i for i, p in enumerate(parole) if p), None)
    if debut_parole is None:
        return []
    fin_parole = nb - 1 - next(i for i, p in enumerate(reversed(parole)) if p)
    trous, i = [], debut_parole
    while i <= fin_parole:
        if parole[i]:
            i += 1
            continue
        j = i
        while j <= fin_parole and not parole[j]:
            j += 1
        if (j - i) >= minimum:
            trous.append((i, j))
        i = j
    return trous


# Respirations et temps d'arrêt (Norman, 2026-10-08 : « énormément de bugs à la génération : des temps d'arrêt où on entend comme des respirations »). Chatterbox ajoute au début et à la fin de CHAQUE phrase
# générée un souffle ou un silence plus ou moins long ; recollés bout à bout (et lus l'un après l'autre dans le jeu), ils donnaient ces arrêts avec respiration. Chaque segment est donc rogné de son souffle / silence
# de début et de fin (on ne garde qu'une courte marge naturelle), les raccords sont de VRAIS silences de durée fixe, et le fichier final se termine par un court silence propre.
SEUIL_BORDS = 0.10          # fraction du pic d'énergie en dessous de laquelle une fenêtre de 20 ms est du souffle / du silence
FENETRES_PAROLE_MIN = 2     # un souffle bref ne compte pas : il faut au moins 2 fenêtres (40 ms) de parole d'affilée
MARGE_DEBUT_FEN = 4         # 80 ms gardées avant la première parole
MARGE_FIN_FEN = 8           # 160 ms gardées après la dernière parole (la fin d'un mot s'éteint naturellement)
RACCORD_S = 0.22            # silence propre entre deux segments d'un même fichier
SILENCE_FINAL_S = 0.12      # silence propre à la fin du fichier (l'intervalle entre deux fichiers lus l'un après l'autre)


def bornes_parole(parole, marge_debut=MARGE_DEBUT_FEN, marge_fin=MARGE_FIN_FEN, minimum=FENETRES_PAROLE_MIN):
    """parole : liste de booléens, une valeur par fenêtre. Renvoie (début, fin exclue) en fenêtres, marges comprises, ou None s'il n'y a pas de parole (au moins 'minimum' fenêtres d'affilée)."""
    nb = len(parole)
    debut = None
    for i in range(nb - minimum + 1):
        if all(parole[i:i + minimum]):
            debut = i
            break
    if debut is None:
        return None
    fin = debut
    for j in range(nb - 1, minimum - 2, -1):
        if all(parole[j - minimum + 1:j + 1]):
            fin = j
            break
    return max(0, debut - marge_debut), min(nb, fin + 1 + marge_fin)


# Question : la montée finale est plus douce que le reste de la phrase ; avec le seuil habituel elle était rognée avec le souffle (le ton interrogatif se perdait). Seuil plus bas, marge de fin plus longue, fondu plus court.
SEUIL_BORDS_QUESTION = 0.04
MARGE_FIN_QUESTION_FEN = 14   # 280 ms


def couper_bords(wav, sr, question=False):
    """Retire le souffle / silence de début et de fin d'un segment (fondu d'entrée de 12 ms, fondu de sortie de 60 ms). Un segment sans parole identifiable est rendu tel quel."""
    import torch
    rms, fenetre, nb = energie_fenetres(wav, sr)
    if rms is None or nb < 6:
        return wav
    parole = (rms >= float(rms.max()) * (SEUIL_BORDS_QUESTION if question else SEUIL_BORDS)).tolist()
    bornes = bornes_parole(parole, marge_fin=MARGE_FIN_QUESTION_FEN) if question else bornes_parole(parole)
    if bornes is None:
        return wav
    debut, fin = bornes
    pos_debut = debut * fenetre
    pos_fin = min(wav.shape[-1], fin * fenetre)
    sortie = wav[..., pos_debut:pos_fin].clone()
    n = sortie.shape[-1]
    fondu_entree = min(n // 4, int(sr * 0.012))
    if fondu_entree > 1:
        sortie[..., :fondu_entree] *= torch.linspace(0.0, 1.0, fondu_entree)
    fondu_sortie = min(n // 2, int(sr * (0.03 if question else 0.06)))
    if fondu_sortie > 1:
        sortie[..., -fondu_sortie:] *= torch.linspace(1.0, 0.0, fondu_sortie)
    return sortie


def avec_silence_final(wav, sr):
    import torch
    return torch.cat([wav, torch.zeros(wav.shape[0], int(sr * SILENCE_FINAL_S))], dim=1)


def garder_premiere_prononciation(wav, sr):
    """Garde la PREMIÈRE des deux prononciations de « X. X. ». Norman, 2026-10-03 : « il répète 2 fois des passages » -- l'ancienne coupe se faisait au PREMIER silence
    assez long, donc au milieu d'un nom (« Un Type… Bizarre ») ou trop tard : la répétition restait. Les deux prononciations ont la même durée de parole : on coupe au silence
    dont la parole qui le précède se rapproche le plus de la MOITIÉ de la parole totale (repli : à la moitié de la parole)."""
    import torch
    rms, fenetre, nb = energie_fenetres(wav, sr)
    if rms is None or nb < 10:
        return wav
    seuil = float(rms.max()) * 0.04
    parole = (rms >= seuil).tolist()
    total = sum(parole)
    if total < 10:
        return wav
    cible = total / 2.0
    meilleur, ecart = None, None
    for debut, fin in silences_interieurs(parole, int(0.10 / 0.02)):
        avant = sum(parole[:debut])
        apres = total - avant
        if avant < 5 or apres < 5:
            continue
        d = abs(avant - cible)
        if ecart is None or d < ecart:
            meilleur, ecart = (debut, fin), d
    if meilleur is not None:
        debut, fin = meilleur
        coupe = debut + min(fin - debut, 3)
    else:
        cumul, coupe = 0, nb // 2
        for i, p in enumerate(parole):
            cumul += p
            if cumul >= cible:
                coupe = min(nb, i + 3)
                break
    pos = min(wav.shape[-1], coupe * fenetre)
    sortie = wav[..., :pos].clone()
    fondu = min(pos, int(sr * 0.03))
    if fondu > 1:
        sortie[..., -fondu:] *= torch.linspace(1.0, 0.0, fondu)
    return sortie


def effet_robot(wav, sr, intensite=0.5):
    """Voix de robot (Norman, 2026-10-24) : modulation en anneau (timbre métallique), peigne court (résonance de tôle), définition réduite (grésillement numérique) et saturation douce.
    L'intensité (0 à 1, l'expressivité de l'humeur demandée) règle la force de l'effet : calme = robot poli, en colère = robot rugueux. La hauteur et le rythme restent ceux de l'humeur (Chatterbox)."""
    import numpy as np
    import torch
    from scipy.signal import lfilter
    i = max(0.0, min(1.0, float(intensite)))
    x = wav.squeeze(0).float().numpy().astype("float64")
    n = len(x)
    if n < 64:
        return wav
    t = np.arange(n) / float(sr)
    freq = 55.0 + 60.0 * i                      # 55 Hz (calme) à 115 Hz (colère)
    anneau = x * np.sin(2.0 * np.pi * freq * t)
    melange = 0.35 + 0.35 * i
    y = (1.0 - melange) * x + melange * anneau
    d = max(2, int(sr * (0.0048 - 0.0014 * i)))   # peigne : 4,8 ms à 3,4 ms
    fb = 0.42 + 0.22 * i
    a = np.zeros(d + 1)
    a[0] = 1.0
    a[d] = -fb
    y = lfilter([1.0], a, y)
    pas = 2 if i < 0.7 else 3                    # définition réduite
    y = np.repeat(y[::pas], pas)[:n]
    crete = float(np.max(np.abs(y))) or 1.0
    y = y / crete
    niveaux = 90.0 - 40.0 * i
    y = np.round(y * niveaux) / niveaux           # quantification
    y = np.tanh(y * (1.2 + 1.2 * i)) / np.tanh(1.2 + 1.2 * i)   # saturation douce
    y = y * 0.89
    return torch.from_numpy(y.astype("float32")).unsqueeze(0)


# Même micro pour toutes les voix (Norman, 2026-10-25 : « certaines voix n'ont pas la même qualité audio que le narrateur ; on peut faire en sorte que le son ait l'air d'avoir été enregistré dans le même micro ? »).
# Chaque voix imite l'extrait de référence, qui a son propre micro (bande passante, creux, souffle, niveau). Après la synthèse, on rapproche donc le SPECTRE MOYEN de la voix de celui du narrateur (voix/homme.wav) : un égaliseur
# déduit du rapport des deux spectres moyens (lissé, limité à ±6 dB (une voix de femme ou d enfant garde ses harmoniques : on corrige le micro, pas la voix), mesuré sur les passages parlés), un filtre passe-haut commun (70 Hz) et passe-bas commun (11 kHz), puis le même niveau moyen que le narrateur.
# La voix du narrateur n'est jamais touchée ; « micro: false » dans reglages-voix.json coupe le traitement pour une voix (inutile pour le robot, dont l'effet est voulu).
_CIBLE_MICRO = {}


def _spectre_moyen(y, sr, nperseg=1024):
    """Spectre moyen (amplitude) des fenêtres parlées de y, et niveau efficace moyen de ces fenêtres."""
    import numpy as np
    from scipy.signal import stft
    _f, _t, z = stft(y, fs=sr, nperseg=nperseg)
    mag = np.abs(z)
    niveau = np.sqrt(np.mean(mag ** 2, axis=0))
    parle = niveau > 0.3 * float(np.max(niveau))
    if not parle.any():
        parle = niveau >= 0
    return np.mean(mag[:, parle], axis=1), float(np.sqrt(np.mean(y ** 2)))


def cible_micro(sr):
    """Spectre moyen et niveau du narrateur (voix/homme.wav) à la fréquence d'échantillonnage sr ; None si l'extrait manque."""
    if sr in _CIBLE_MICRO:
        return _CIBLE_MICRO[sr]
    resultat = None
    try:
        import librosa
        chemin = reference_voix("homme")
        if chemin:
            y, _ = librosa.load(chemin, sr=sr, mono=True)
            resultat = _spectre_moyen(y, sr)
    except Exception as e:  # noqa: BLE001
        print("Micro commun : cible indisponible :", str(e)[:200], file=sys.stderr, flush=True)
    _CIBLE_MICRO[sr] = resultat
    return resultat


def harmoniser_micro(wav, sr, voix):
    """Rapproche le spectre et le niveau de la voix de ceux du narrateur (voir plus haut). Rend la voix d'origine en cas d'erreur."""
    if voix in ("homme", "narrateur") or reglages_voix(voix).get("micro") is False:
        return wav
    try:
        import numpy as np
        import torch
        from scipy.signal import stft, istft, butter, sosfilt
        from scipy.ndimage import uniform_filter1d
        cible = cible_micro(sr)
        if not cible:
            return wav
        y = wav.squeeze(0).float().numpy().astype("float64")
        if len(y) < 4096:
            return wav
        courant, niveau = _spectre_moyen(y, sr)
        gain = np.clip((cible[0] + 1e-9) / (courant + 1e-9), 10 ** (-6 / 20.0), 10 ** (6 / 20.0))
        gain = np.exp(uniform_filter1d(np.log(gain), size=13, mode="nearest"))
        _f, _t, z = stft(y, fs=sr, nperseg=1024)
        _t2, y2 = istft(z * gain[:, None], fs=sr, nperseg=1024)
        y2 = y2[: len(y)]
        sos = butter(2, 70, btype="highpass", fs=sr, output="sos")
        y2 = sosfilt(sos, y2)
        if sr > 24000:
            y2 = sosfilt(butter(4, 11000, btype="lowpass", fs=sr, output="sos"), y2)
        niveau2 = float(np.sqrt(np.mean(y2 ** 2))) or 1e-9
        y2 = y2 * (cible[1] / niveau2)
        crete = float(np.max(np.abs(y2))) or 1.0
        if crete > 0.97:
            y2 = y2 / crete * 0.97
        return torch.from_numpy(y2.astype("float32")).unsqueeze(0)
    except Exception as e:  # noqa: BLE001
        print("Micro commun ignoré :", str(e)[:200], file=sys.stderr, flush=True)
        return wav


# Humeurs (Norman, 2026-10-25 : « on ne sent pas de différence entre Neutre et Joyeux, c'est pareil pour toutes les humeurs »). Les réglages « exaggeration » et « cfg » de Chatterbox ne suffisent pas : la voix de référence impose
# son caractère. Chaque humeur applique donc en plus un traitement de la voix générée : hauteur (demi-tons), débit, aigus (dB), volume, saturation, souffle, réverbération. Valeurs choisies par SOREAL à l'oreille.
HUMEURS = {
    "joyeux":     {"ton": 1.6,  "vitesse": 1.08, "aigus": 4.0,  "gain": 1.0,  "sat": 0.0,  "souffle": 0.0,  "reverb": 0.0},
    "energique":  {"ton": 1.0,  "vitesse": 1.18, "aigus": 3.0,  "gain": 1.15, "sat": 0.2,  "souffle": 0.0,  "reverb": 0.0},
    "dramatique": {"ton": -1.5, "vitesse": 0.86, "aigus": -2.0, "gain": 1.0,  "sat": 0.0,  "souffle": 0.0,  "reverb": 0.16},
    "calme":      {"ton": -0.8, "vitesse": 0.88, "aigus": -4.0, "gain": 0.8,  "sat": 0.0,  "souffle": 0.01, "reverb": 0.05},
    "mysterieux": {"ton": -2.0, "vitesse": 0.84, "aigus": -5.0, "gain": 0.85, "sat": 0.0,  "souffle": 0.035, "reverb": 0.22},
    "colere":     {"ton": 0.5,  "vitesse": 1.12, "aigus": 3.5,  "gain": 1.2,  "sat": 0.55, "souffle": 0.0,  "reverb": 0.0},
}


def appliquer_humeur(wav, sr, humeur):
    """Traitement de la voix générée selon l'humeur demandée (voir HUMEURS) ; une humeur inconnue ou « neutre » ne change rien. En cas d'erreur, la voix d'origine est rendue."""
    h = HUMEURS.get(str(humeur or "").strip().lower())
    if not h:
        return wav
    try:
        import numpy as np
        import torch
        import librosa
        from scipy.signal import butter, sosfilt
        y = wav.squeeze(0).float().numpy().astype("float64")
        if len(y) < 256:
            return wav
        crete_origine = float(np.max(np.abs(y))) or 1.0
        if h["ton"]:
            y = librosa.effects.pitch_shift(y, sr=sr, n_steps=h["ton"])
        if abs(h["vitesse"] - 1.0) > 0.005:
            y = librosa.effects.time_stretch(y, rate=h["vitesse"])
        if h["aigus"]:
            sos = butter(2, 2500, btype="highpass", fs=sr, output="sos")
            y = y + (10 ** (h["aigus"] / 20.0) - 1.0) * sosfilt(sos, y)
        if h["sat"]:
            y = y / max(1e-6, float(np.max(np.abs(y))))
            k = 1.0 + 3.0 * h["sat"]
            y = np.tanh(y * k) / np.tanh(k)
        if h["souffle"]:
            env = np.convolve(np.abs(y), np.ones(480) / 480, mode="same")
            y = y + h["souffle"] * np.random.default_rng(11).standard_normal(len(y)) * (env / max(1e-6, float(np.max(env))))
        if h["reverb"]:
            n = int(sr * 0.4)
            ir = np.random.default_rng(5).standard_normal(n) * np.exp(-np.arange(n) / (sr * 0.09))
            ir[0] = 0.0
            y = y + h["reverb"] * np.convolve(y, ir / max(1e-6, float(np.sqrt(np.sum(ir ** 2)))), mode="full")[: len(y)]
        # même niveau de départ que la voix d'origine (les filtres et la hauteur changent la crête), puis le gain de l'humeur
        crete = float(np.max(np.abs(y))) or 1.0
        y = y / crete * crete_origine * h["gain"]
        crete = float(np.max(np.abs(y))) or 1.0
        if crete > 0.95:
            y = y / crete * 0.95
        return torch.from_numpy(y.astype("float32")).unsqueeze(0)
    except Exception as e:  # noqa: BLE001
        print("Humeur ignorée :", str(e)[:200], file=sys.stderr, flush=True)
        return wav


def synthetiser(texte, voix="homme", exaggeration=0.5, cfg=0.5, humeur=""):
    import torch
    texte = normaliser_texte(texte)
    if not texte:
        raise ValueError("texte vide après normalisation")
    if len(texte) < TEXTE_COURT and est_nom_court(texte):
        court = texte.rstrip(" .!?…,;:") or texte
        fin = "?" if est_question(texte) else "."
        wav, sr = synthetiser_long(court + fin + " " + court + fin, voix, exaggeration, cfg)
        wav = garder_premiere_prononciation(wav, sr)
        wav = harmoniser_micro(wav, sr, voix)
        wav = appliquer_humeur(wav, sr, humeur)
        if reglages_voix(voix).get("effet") == "robot":
            wav = effet_robot(wav, sr, exaggeration)
        return avec_silence_final(wav, sr), sr
    wav, sr = synthetiser_long(texte, voix, exaggeration, cfg)
    wav = harmoniser_micro(wav, sr, voix)
    wav = appliquer_humeur(wav, sr, humeur)
    if reglages_voix(voix).get("effet") == "robot":
        wav = effet_robot(wav, sr, exaggeration)
    return avec_silence_final(wav, sr), sr


# Garde-fou contre les « dérapages » (Norman, 2026-10-01 : « la voix de marius continue à lire alors qu'il n'y a plus rien et dit n'importe quoi ») :
# le modèle poursuit parfois sa génération après la fin du texte. Une phrase ne peut pas durer plus de DUREE_PAR_CARACTERE_S x longueur + DUREE_MARGE_S.
DUREE_PAR_CARACTERE_S = 0.12
DUREE_MARGE_S = 1.2


# Textes courts (noms de boss, titres) : avec seulement quelques mots, Chatterbox invente facilement des syllabes à la fin (Norman, 2026-10-03 : « il prononce des choses qui n'existent
# pas »). La marge de 1,2 s laissait passer plus d'une seconde de baratin : pour un texte court, elle tombe à 0,5 s.
SEUIL_SEGMENT_COURT = 60
DUREE_PAR_CARACTERE_COURT_S = 0.11
DUREE_MARGE_COURT_S = 0.5


def est_nom_court(segment):
    """Un NOM ou un titre (« Un Type Bizarre à Deux Têtes ») : court, sans ponctuation à l'intérieur, au plus 8 mots. Les garde-fous des textes courts (retirer le baratin inventé après un silence,
    durée serrée, double prononciation) ne valent QUE pour eux : une réplique courte (« Bonjour, je m'appelle Marius. ») a des pauses naturelles et ne doit jamais être coupée (Norman, 2026-10-04 :
    « la génération de voix ne lit pas tout, ça génère quelques mots et ça s'arrête » -- depuis qu'on génère ligne par ligne, les répliques courtes sont devenues fréquentes)."""
    nu = segment.strip(" .!?…,;:")
    if not nu or len(segment) > SEUIL_SEGMENT_COURT:
        return False
    if re.search(r"[,;:.!?…«»()–—-]", nu):
        return False
    return len(nu.split()) <= 8


# Mots répétés en fin de phrase (Norman, 2026-10-04 : « la voix Marius dit 2 fois Chad dans « T'es vraiment un connard, Chad... » ») : Chatterbox s'attarde sur les points de suspension FINAUX et
# redit le dernier mot. Deux parades : le segment est synthétisé avec un point final (les points de suspension au MILIEU d'une phrase restent), et la pénalité de répétition du modèle passe de 2,0 à 2,6
# (réglable : variable d'environnement SOREAL_VOIX_REPETITION).
REPETITION_PENALTY = float(os.environ.get("SOREAL_VOIX_REPETITION", "2.6"))


def sans_suspension_finale(segment):
    """« …, Chad... » -> « …, Chad. » : plus de points de suspension en toute fin de segment. Un segment qui ne serait que des points reste tel quel."""
    court = re.sub(r"\s*(?:\.{2,}|…)+\s*$", ".", segment)
    return court if court.strip(" .") else segment


def duree_max_segment(segment):
    if est_nom_court(segment):
        return len(segment) * DUREE_PAR_CARACTERE_COURT_S + DUREE_MARGE_COURT_S
    return len(segment) * DUREE_PAR_CARACTERE_S + DUREE_MARGE_S


def retirer_queue_inventee(wav, sr, segment):
    """Texte court : un nom se dit d'un trait. S'il y a, après un silence franc (>= 0,3 s), une nouvelle « phrase » plus courte que ce qui précède, c'est du baratin
    inventé par le modèle : on coupe au silence (fondu de 30 ms). Renvoie (wav, coupe)."""
    import torch
    if not est_nom_court(segment):
        return wav, False
    rms, fenetre, nb = energie_fenetres(wav, sr)
    if rms is None or nb < 20:
        return wav, False
    parole = (rms >= float(rms.max()) * 0.04).tolist()
    for debut, fin in silences_interieurs(parole, int(0.30 / 0.02)):
        avant = sum(parole[:debut])
        apres = sum(parole[fin:])
        if avant >= 8 and apres > 0 and apres <= avant:
            pos = min(wav.shape[-1], (debut + 3) * fenetre)
            sortie = wav[..., :pos].clone()
            fondu = min(pos, int(sr * 0.03))
            if fondu > 1:
                sortie[..., -fondu:] *= torch.linspace(1.0, 0.0, fondu)
            return sortie, True
    return wav, False


def couper_derapage(wav, sr, segment):
    """Si l'audio dépasse la durée plausible du texte, le coupe au creux de volume le plus net de la fin autorisée, avec un court fondu. Renvoie (wav, coupe)."""
    import torch
    n = wav.shape[-1]
    limite = int(duree_max_segment(segment) * sr)
    if n <= limite:
        return wav, False
    x = wav.squeeze(0).float()
    fenetre = max(1, int(sr * 0.02))
    debut = int(limite * 0.6) // fenetre
    fin = limite // fenetre
    rms = x[: fin * fenetre].reshape(fin, fenetre).pow(2).mean(dim=1)
    zone = rms[debut:fin]
    i = debut + (int(zone.argmin()) if zone.numel() else fin - debut - 1)
    pos = min(limite, (i + 1) * fenetre)
    sortie = wav[..., :pos].clone()
    fondu = min(pos, int(sr * 0.03))
    if fondu > 1:
        sortie[..., -fondu:] *= torch.linspace(1.0, 0.0, fondu)
    return sortie, True


def generer_segment(m, segment, kwargs):
    """Génère un segment ; en cas de dérapage, réessaie avec des réglages plus calmes puis coupe net en dernier recours."""
    tentatives = [kwargs, dict(kwargs, exaggeration=min(kwargs["exaggeration"], 0.35), cfg_weight=max(kwargs["cfg_weight"], 0.5)),
                  dict(kwargs, exaggeration=0.25, cfg_weight=0.6)]
    wav = None
    _plafond_jetons[0] = plafond_jetons(segment)
    for essai in tentatives:
        debut_essai = time.time()
        wav = m.generate(segment, **essai).detach().cpu()
        if wav.dim() == 1:
            wav = wav.unsqueeze(0)
        wav, queue_coupee = retirer_queue_inventee(wav, m.sr, segment)
        if queue_coupee:
            print("[voix] baratin inventé après un silence retiré (%d caractères)" % len(segment))
        if wav.shape[-1] <= int(duree_max_segment(segment) * m.sr):
            _plafond_jetons[0] = 0
            return wav
        print("[voix] dérapage détecté (%.1f s pour %d caractères, essai de %.1f s), nouvel essai" % (wav.shape[-1] / m.sr, len(segment), time.time() - debut_essai))
    _plafond_jetons[0] = 0
    wav, _ = couper_derapage(wav, m.sr, segment)
    return wav


def synthetiser_long(texte, voix="homme", exaggeration=0.5, cfg=0.5):
    import torch
    m = charger_modele()
    morceaux = []
    silence = torch.zeros(1, int(m.sr * RACCORD_S))
    with _verrou:
        for segment in decouper(texte):
            segment = sans_suspension_finale(segment)
            kwargs = {"language_id": "fr", "exaggeration": float(exaggeration), "cfg_weight": float(cfg), "repetition_penalty": REPETITION_PENALTY}
            reference = reference_voix(voix)
            if reference:
                kwargs["audio_prompt_path"] = reference
            if len(segment) < TEXTE_COURT:
                # Segment très court (une question isolée comme « Non? » depuis que chaque question forme son segment ; Norman, 2026-10-22 : « Échec de la génération : CUDA error ») : Chatterbox plante
                # (« device-side assert », le contexte GPU est perdu) ; dit deux fois il passe, et on ne garde que la première prononciation, comme pour les noms courts de synthetiser().
                court = segment.rstrip(" .!?…,;:") or segment
                fin = "?" if est_question(segment) else "."
                wav = garder_premiere_prononciation(generer_segment(m, court + fin + " " + court + fin, kwargs), m.sr)
            else:
                wav = generer_segment(m, segment, kwargs)
            if torch.cuda.is_available() and os.environ.get("SOREAL_VOIX_MEMOIRE"):
                torch.cuda.empty_cache()
            if wav.dim() == 1:
                wav = wav.unsqueeze(0)
            wav = couper_bords(wav, m.sr, est_question(segment))
            morceaux.extend([wav, silence])
    return torch.cat(morceaux[:-1], dim=1), m.sr


def vers_m4a(wav, sr):
    import torchaudio
    with tempfile.TemporaryDirectory() as dossier:
        entree = os.path.join(dossier, "voix.wav")
        sortie = os.path.join(dossier, "voix.m4a")
        torchaudio.save(entree, wav, sr)
        r = subprocess.run([ffmpeg_exe(), "-y", "-loglevel", "error", "-i", entree, "-vn", "-ac", "1", "-c:a", "aac", "-b:a", DEBIT,
                            "-movflags", "+faststart", sortie], capture_output=True, text=True)
        if r.returncode != 0:
            raise RuntimeError("ffmpeg : " + (r.stderr or str(r.returncode)))
        with open(sortie, "rb") as f:
            return f.read()


class Gestionnaire(BaseHTTPRequestHandler):
    server_version = "SorealVoixStudio/1"

    def _cors(self):
        origine = self.headers.get("Origin", "")
        if origine in ORIGINES:
            self.send_header("Access-Control-Allow-Origin", origine)
            self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "content-type")
            # Chrome exige cet en-tête pour qu'une page en ligne (https) parle à ton PC (127.0.0.1).
            self.send_header("Access-Control-Allow-Private-Network", "true")

    def _json(self, code, obj):
        corps = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corps)))
        self.end_headers()
        self.wfile.write(corps)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        if self.path.split("?")[0] == "/ping":
            try:
                import torch
                gpu = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU"
            except Exception:
                gpu = "inconnu"
            return self._json(200, {"ok": True, "modele": "chatterbox", "gpu": gpu,
                                    "voix": {"homme": bool(reference_voix("homme")), "femme": bool(reference_voix("femme"))},
                                    "voixNommees": voix_disponibles()})
        self._json(404, {"ok": False, "error": "introuvable"})

    def do_POST(self):
        if self.path.split("?")[0] != "/synthese":
            return self._json(404, {"ok": False, "error": "introuvable"})
        texte = ""
        try:
            taille = int(self.headers.get("Content-Length", "0"))
            donnees = json.loads(self.rfile.read(min(taille, 65536)).decode("utf-8"))
            texte = str(donnees.get("texte", "")).strip()
            if not texte or len(texte) > MAX_TEXTE:
                return self._json(400, {"ok": False, "error": "texte vide ou trop long"})
            voix = donnees.get("voix") if isinstance(donnees.get("voix"), str) and VOIX_ID_RE.match(donnees.get("voix")) else "homme"
            reglage = reglages_voix(voix)
            wav, sr = synthetiser(texte, voix, donnees.get("exaggeration", reglage["exaggeration"]), donnees.get("cfg", reglage["cfg"]), str(donnees.get("humeur", ""))[:20])
            duree = float(wav.shape[-1]) / float(sr)
            audio = vers_m4a(wav, sr)
        except Exception as e:  # noqa: BLE001
            message = str(e)
            print("Erreur de synthèse :", message[:300], "| texte :", repr(texte[:160]), file=sys.stderr, flush=True)
            self._json(500, {"ok": False, "error": message[:600]})
            # Une erreur CUDA « device-side assert » corrompt le contexte GPU pour de bon : on quitte, un superviseur (lancer-robuste)
            # relance le studio propre ; le générateur de voix attend son retour et retente le bloc.
            if "CUDA" in message or "device-side" in message:
                threading.Timer(0.5, lambda: os._exit(3)).start()
            return
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "audio/mp4")
        # Durée de l'audio (secondes) : le générateur de voix s'en sert pour écarter une synthèse tronquée ou qui boucle.
        self.send_header("X-Duree-Secondes", "%.2f" % duree)
        self.send_header("Access-Control-Expose-Headers", "X-Duree-Secondes")
        self.send_header("Content-Length", str(len(audio)))
        self.end_headers()
        self.wfile.write(audio)

    def log_message(self, fmt, *args):  # journal discret
        print("[voix]", fmt % args, flush=True)


def main():
    print("SOREAL IDLE — studio de voix (Chatterbox) sur http://127.0.0.1:%d" % PORT)
    print("Origines autorisées :", ", ".join(ORIGINES))
    threading.Thread(target=charger_modele, daemon=True).start()
    ThreadingHTTPServer(("127.0.0.1", PORT), Gestionnaire).serve_forever()


if __name__ == "__main__":
    main()
