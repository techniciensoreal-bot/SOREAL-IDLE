#!/usr/bin/env python
"""
SOREAL IDLE — pilote du studio de voix (Norman, 2026-10-03).

Le studio de voix (serveur.py, lancé par lancer.bat) n'existe que tant qu'il tourne : une page web ne peut donc pas le démarrer elle-même. Ce
PILOTE est un tout petit serveur HTTP (bibliothèque standard seulement, aucune installation) qui reste allumé sur TON PC et qui, à la demande
des boutons « Lancer le studio » / « Arrêter le studio » du menu Admin, démarre ou arrête lancer.bat. Il ne fonctionne que sur ce PC.

  GET  /etat       -> {"ok":true,"enCours":true|false}       (le studio répond-il sur son port ?)
  POST /demarrer   -> lance lancer.bat dans sa fenêtre (si le studio ne tourne pas déjà)
  POST /arreter    -> arrête le studio et sa fenêtre

Sécurité : n'écoute que sur 127.0.0.1 ; les ordres (POST) ne sont acceptés que depuis le site du jeu (en-tête Origin), jamais depuis un autre
site web ni en ligne de commande ; il ne sait faire QUE ces deux choses (aucun chemin, aucun texte fourni par la page n'est exécuté).

Variables d'environnement (facultatives) :
  SOREAL_PILOTE_PORT       port d'écoute (défaut 8766)
  SOREAL_PILOTE_ORIGINES   origines autorisées, séparées par des virgules (défaut : le site en ligne + localhost)
  SOREAL_VOIX_PORT         port du studio (défaut 8765, comme serveur.py)
  SOREAL_PILOTE_LANCER     chemin du .bat à lancer (défaut : lancer.bat à côté de ce fichier ; sert aux essais)
"""
import json
import os
import re
import socket
import subprocess
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

DOSSIER = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("SOREAL_PILOTE_PORT", "8766"))
PORT_STUDIO = int(os.environ.get("SOREAL_VOIX_PORT", "8765"))
LANCER = os.environ.get("SOREAL_PILOTE_LANCER", "").strip() or os.path.join(DOSSIER, "lancer.bat")
ORIGINES = [o.strip() for o in os.environ.get(
    "SOREAL_PILOTE_ORIGINES",
    "https://soreal-idle.technicien-soreal.workers.dev,http://localhost:8787,http://127.0.0.1:8787"
).split(",") if o.strip()]

_verrou = threading.Lock()
_processus = None  # le lancer.bat démarré par ce pilote (None si le studio a été lancé à la main)


def studio_repond():
    """Vrai si quelque chose écoute sur le port du studio."""
    try:
        with socket.create_connection(("127.0.0.1", PORT_STUDIO), timeout=0.6):
            return True
    except OSError:
        return False


def tuer_arbre(pid):
    """Arrête un processus ET tous ses enfants (le .bat, python, le modèle…)."""
    if not pid:
        return
    subprocess.run(["taskkill", "/PID", str(int(pid)), "/T", "/F"], capture_output=True, text=True, errors="replace")


def pids_sur_le_port():
    """PID de ce qui écoute sur le port du studio (cas du studio lancé à la main, sans passer par le pilote)."""
    r = subprocess.run(["netstat", "-ano", "-p", "tcp"], capture_output=True, text=True, errors="replace")
    pids = set()
    for ligne in r.stdout.splitlines():
        m = re.match(r"\s*TCP\s+\S+:%d\s+\S+\s+LISTENING\s+(\d+)\s*$" % PORT_STUDIO, ligne)
        if m:
            pids.add(int(m.group(1)))
    return pids


def parent_lancer_bat(pid):
    """PID du .bat qui a lancé ce processus s'il s'agit de lancer.bat (pour fermer aussi sa fenêtre), sinon 0."""
    cmd = ("$p=Get-CimInstance Win32_Process -Filter 'ProcessId=%d'; if($p){$q=Get-CimInstance Win32_Process -Filter ('ProcessId='+$p.ParentProcessId); "
           "if($q -and $q.CommandLine -match 'lancer\\.bat'){$q.ProcessId}}" % int(pid))
    r = subprocess.run(["powershell", "-NoProfile", "-Command", cmd], capture_output=True, text=True, errors="replace")
    try:
        return int(r.stdout.strip().splitlines()[-1])
    except (ValueError, IndexError):
        return 0


def demarrer():
    global _processus
    with _verrou:
        if studio_repond():
            return {"ok": True, "dejaLance": True}
        if _processus is not None and _processus.poll() is None:
            return {"ok": True, "enDemarrage": True}
        if not os.path.isfile(LANCER):
            return {"ok": False, "error": "lancer.bat introuvable"}
        flags = getattr(subprocess, "CREATE_NEW_CONSOLE", 0)
        _processus = subprocess.Popen(["cmd.exe", "/c", LANCER], cwd=os.path.dirname(LANCER), creationflags=flags)
        return {"ok": True, "demarre": True}


def arreter():
    global _processus
    with _verrou:
        arrete = False
        if _processus is not None and _processus.poll() is None:
            tuer_arbre(_processus.pid)
            arrete = True
        _processus = None
        for pid in pids_sur_le_port():
            bat = parent_lancer_bat(pid)
            tuer_arbre(bat or pid)
            arrete = True
        return {"ok": True, "arrete": arrete}


class Gestionnaire(BaseHTTPRequestHandler):
    server_version = "SorealPilote/1"

    def _origine_ok(self):
        return self.headers.get("Origin", "") in ORIGINES

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
        if self.path.split("?")[0] == "/etat":
            return self._json(200, {"ok": True, "enCours": studio_repond()})
        self._json(404, {"ok": False, "error": "introuvable"})

    def do_POST(self):
        chemin = self.path.split("?")[0]
        if chemin not in ("/demarrer", "/arreter"):
            return self._json(404, {"ok": False, "error": "introuvable"})
        if not self._origine_ok():
            return self._json(403, {"ok": False, "error": "origine refusée"})
        try:
            self._json(200, demarrer() if chemin == "/demarrer" else arreter())
        except Exception as e:  # le pilote ne doit jamais s'arrêter sur une erreur
            self._json(500, {"ok": False, "error": str(e)[:200]})

    def log_message(self, fmt, *args):
        pass


if __name__ == "__main__":
    print("SOREAL IDLE — pilote du studio de voix sur http://127.0.0.1:%d (laisse-le tourner ; il ne fait rien d'autre que lancer/arrêter lancer.bat)" % PORT)
    try:
        ThreadingHTTPServer(("127.0.0.1", PORT), Gestionnaire).serve_forever()
    except OSError:
        print("Le port %d est déjà utilisé : le pilote tourne probablement déjà." % PORT)
        sys.exit(0)
