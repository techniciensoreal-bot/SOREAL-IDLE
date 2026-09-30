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
VOIX_FICHIERS = {"homme": "homme.wav", "femme": "femme.wav"}


def reference_voix(voix):
    """Chemin de l'extrait de référence de la voix demandée (None s'il n'existe pas : voix par défaut de Chatterbox)."""
    nom = VOIX_FICHIERS.get(voix if voix in VOIX_FICHIERS else "homme")
    chemin = os.path.join(DOSSIER_VOIX, nom)
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


def synthetiser(texte, voix="homme", exaggeration=0.5, cfg=0.5):
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
            wav = m.generate(segment, **kwargs)
            wav = wav.detach().cpu()
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
                                    "voix": {"homme": bool(reference_voix("homme")), "femme": bool(reference_voix("femme"))}})
        self._json(404, {"ok": False, "error": "introuvable"})

    def do_POST(self):
        if self.path.split("?")[0] != "/synthese":
            return self._json(404, {"ok": False, "error": "introuvable"})
        try:
            taille = int(self.headers.get("Content-Length", "0"))
            donnees = json.loads(self.rfile.read(min(taille, 65536)).decode("utf-8"))
            texte = str(donnees.get("texte", "")).strip()
            if not texte or len(texte) > MAX_TEXTE:
                return self._json(400, {"ok": False, "error": "texte vide ou trop long"})
            voix = "femme" if donnees.get("voix") == "femme" else "homme"
            wav, sr = synthetiser(texte, voix, donnees.get("exaggeration", 0.5), donnees.get("cfg", 0.5))
            audio = vers_m4a(wav, sr)
        except Exception as e:  # noqa: BLE001
            print("Erreur de synthèse :", e, file=sys.stderr, flush=True)
            return self._json(500, {"ok": False, "error": str(e)})
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "audio/mp4")
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
