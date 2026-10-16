#!/usr/bin/env python
"""
SOREAL IDLE — libère le port du studio de voix (Norman, 2026-10-16 : « fenêtre qui s'ouvre et se ferme, au moins la 5e fois qu'on a ce souci »).

Cause des échecs répétés : un programme qui n'est PAS le studio (un petit serveur d'aperçu, un http.server oublié...) écoutait déjà sur le port 8765. Le lanceur par lien (lancer_depuis_lien.bat)
et le pilote prenaient « quelque chose écoute sur 8765 » pour « le studio tourne » : le premier se fermait aussitôt (la fenêtre qui clignote), le second répondait « déjà lancé » sans rien lancer.

Règle désormais (partagée par lancer.bat et pilote.py, ce fichier est la SEULE définition) :
  - ce qui écoute sur le port est le STUDIO si sa ligne de commande contient « serveur.py » : on n'y touche jamais (il peut être occupé à générer) ;
  - sinon c'est un intrus : s'il s'agit d'un serveur de développement (node, python, deno, bun...), il est ARRÊTÉ pour laisser la place, et le nom du programme arrêté est affiché ;
  - tout autre programme (un jeu, un navigateur...) n'est jamais arrêté : le message dit lequel occupe le port.

Usage : python liberer_port.py [port]   (défaut 8765)
Codes de sortie : 0 = le port est libre (ou vient d'être libéré) ; 9 = le studio tourne déjà ; 2 = port occupé par un programme qu'on ne touche pas.
"""
import re
import socket
import subprocess
import sys
import time

PORT_STUDIO = 8765
SERVEURS_DE_DEV = {"node.exe", "python.exe", "pythonw.exe", "py.exe", "deno.exe", "bun.exe", "php.exe", "ruby.exe", "http-server.exe", "live-server.exe"}


def ecoute(port):
    """Vrai si quelque chose accepte les connexions sur ce port (en local)."""
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=0.6):
            return True
    except OSError:
        return False


def pids_sur_le_port(port):
    """PID de ce qui écoute sur le port."""
    r = subprocess.run(["netstat", "-ano", "-p", "tcp"], capture_output=True, text=True, errors="replace")
    pids = []
    for ligne in r.stdout.splitlines():
        m = re.match(r"\s*TCP\s+\S+:%d\s+\S+\s+LISTENING\s+(\d+)\s*$" % int(port), ligne)
        if m and int(m.group(1)) not in pids:
            pids.append(int(m.group(1)))
    return pids


def infos_processus(pid):
    """(nom du programme, ligne de commande) d'un processus ; ('', '') s'il n'existe plus."""
    cmd = "$p=Get-CimInstance Win32_Process -Filter 'ProcessId=%d'; if($p){$p.Name; $p.CommandLine}" % int(pid)
    r = subprocess.run(["powershell", "-NoProfile", "-Command", cmd], capture_output=True, text=True, errors="replace")
    lignes = [l.strip() for l in r.stdout.splitlines() if l.strip()]
    return (lignes[0].lower() if lignes else "", " ".join(lignes[1:]))


def tuer_arbre(pid):
    subprocess.run(["taskkill", "/PID", str(int(pid)), "/T", "/F"], capture_output=True, text=True, errors="replace")


def est_le_studio(nom, ligne_commande):
    return "serveur.py" in (ligne_commande or "").lower()


def liberer(port=PORT_STUDIO, pids=None, infos=None, tuer=None, ecoute_=None, attendre=None):
    """Décide et agit. Renvoie {"etat": "libre"|"studio"|"libere"|"occupe", "arretes": [noms], "occupant": nom}. Les fonctions sont injectables (essais)."""
    pids = pids or pids_sur_le_port
    infos = infos or infos_processus
    tuer = tuer or tuer_arbre
    ecoute_ = ecoute_ or ecoute
    attendre = attendre or (lambda: time.sleep(0.4))
    if not ecoute_(port):
        return {"etat": "libre", "arretes": [], "occupant": ""}
    intrus = []
    for pid in pids(port):
        nom, ligne = infos(pid)
        if est_le_studio(nom, ligne):
            return {"etat": "studio", "arretes": [], "occupant": nom}
        intrus.append((pid, nom))
    if not intrus:
        return {"etat": "occupe", "arretes": [], "occupant": "(inconnu)"}
    refuses = [nom or "(inconnu)" for _pid, nom in intrus if nom not in SERVEURS_DE_DEV]
    if refuses:
        return {"etat": "occupe", "arretes": [], "occupant": refuses[0]}
    arretes = []
    for pid, nom in intrus:
        tuer(pid)
        arretes.append(nom)
    for _ in range(10):
        if not ecoute_(port):
            return {"etat": "libere", "arretes": arretes, "occupant": ""}
        attendre()
    return {"etat": "occupe", "arretes": arretes, "occupant": arretes[0] if arretes else ""}


def main(argv):
    port = int(argv[1]) if len(argv) > 1 and argv[1].isdigit() else PORT_STUDIO
    r = liberer(port)
    if r["etat"] == "studio":
        print("Le studio de voix tourne deja (port %d)." % port)
        return 9
    if r["etat"] == "libere":
        print("Le port %d etait pris par un autre programme (%s) : il a ete arrete pour laisser la place au studio." % (port, ", ".join(r["arretes"])))
        return 0
    if r["etat"] == "occupe":
        print("Le port %d est pris par %s, que je n'arrete pas moi-meme. Ferme ce programme puis relance le studio." % (port, r["occupant"]))
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
