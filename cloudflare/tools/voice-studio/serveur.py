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
    return {"exaggeration": float(r.get("exaggeration", 0.5)), "cfg": float(r.get("cfg", 0.5))}


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
    "https://soreal-idle.technicien-soreal.workers.dev,http://localhost:8787,http://127.0.0.1:8787"
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
    return re.sub(r"\s+", " ", t).strip()


def ffmpeg_exe():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return os.environ.get("SOREAL_FFMPEG", "ffmpeg")


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
        print("Modèle prêt.", flush=True)
    return _modele


def decouper(texte):
    """Découpe en segments d'au plus MAX_SEGMENT caractères, sur la ponctuation quand c'est possible."""
    texte = re.sub(r"\s+", " ", texte).strip()
    phrases = re.split(r"(?<=[.!?…»])\s+", texte)
    segments, courant = [], ""
    for p in phrases:
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


def synthetiser(texte, voix="homme", exaggeration=0.5, cfg=0.5):
    import torch
    texte = normaliser_texte(texte)
    if not texte:
        raise ValueError("texte vide après normalisation")
    if len(texte) < TEXTE_COURT:
        court = texte.rstrip(" .!?…,;:") or texte
        wav, sr = synthetiser_long(court + ". " + court + ".", voix, exaggeration, cfg)
        return garder_premiere_prononciation(wav, sr), sr
    return synthetiser_long(texte, voix, exaggeration, cfg)


# Garde-fou contre les « dérapages » (Norman, 2026-10-01 : « la voix de marius continue à lire alors qu'il n'y a plus rien et dit n'importe quoi ») :
# le modèle poursuit parfois sa génération après la fin du texte. Une phrase ne peut pas durer plus de DUREE_PAR_CARACTERE_S x longueur + DUREE_MARGE_S.
DUREE_PAR_CARACTERE_S = 0.12
DUREE_MARGE_S = 1.2


# Textes courts (noms de boss, titres) : avec seulement quelques mots, Chatterbox invente facilement des syllabes à la fin (Norman, 2026-10-03 : « il prononce des choses qui n'existent
# pas »). La marge de 1,2 s laissait passer plus d'une seconde de baratin : pour un texte court, elle tombe à 0,5 s.
SEUIL_SEGMENT_COURT = 60
DUREE_PAR_CARACTERE_COURT_S = 0.11
DUREE_MARGE_COURT_S = 0.5


def duree_max_segment(segment):
    if len(segment) <= SEUIL_SEGMENT_COURT:
        return len(segment) * DUREE_PAR_CARACTERE_COURT_S + DUREE_MARGE_COURT_S
    return len(segment) * DUREE_PAR_CARACTERE_S + DUREE_MARGE_S


def retirer_queue_inventee(wav, sr, segment):
    """Texte court : un nom se dit d'un trait. S'il y a, après un silence franc (>= 0,3 s), une nouvelle « phrase » plus courte que ce qui précède, c'est du baratin
    inventé par le modèle : on coupe au silence (fondu de 30 ms). Renvoie (wav, coupe)."""
    import torch
    if len(segment) > SEUIL_SEGMENT_COURT:
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
    for essai in tentatives:
        wav = m.generate(segment, **essai).detach().cpu()
        if wav.dim() == 1:
            wav = wav.unsqueeze(0)
        wav, queue_coupee = retirer_queue_inventee(wav, m.sr, segment)
        if queue_coupee:
            print("[voix] baratin inventé après un silence retiré (%d caractères)" % len(segment))
        if wav.shape[-1] <= int(duree_max_segment(segment) * m.sr):
            return wav
        print("[voix] dérapage détecté (%.1f s pour %d caractères), nouvel essai" % (wav.shape[-1] / m.sr, len(segment)))
    wav, _ = couper_derapage(wav, m.sr, segment)
    return wav


def synthetiser_long(texte, voix="homme", exaggeration=0.5, cfg=0.5):
    import torch
    m = charger_modele()
    morceaux = []
    silence = torch.zeros(1, int(m.sr * 0.18))
    with _verrou:
        for segment in decouper(texte):
            kwargs = {"language_id": "fr", "exaggeration": float(exaggeration), "cfg_weight": float(cfg)}
            reference = reference_voix(voix)
            if reference:
                kwargs["audio_prompt_path"] = reference
            wav = generer_segment(m, segment, kwargs)
            if torch.cuda.is_available() and os.environ.get("SOREAL_VOIX_MEMOIRE"):
                torch.cuda.empty_cache()
            if wav.dim() == 1:
                wav = wav.unsqueeze(0)
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
            wav, sr = synthetiser(texte, voix, donnees.get("exaggeration", reglage["exaggeration"]), donnees.get("cfg", reglage["cfg"]))
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
