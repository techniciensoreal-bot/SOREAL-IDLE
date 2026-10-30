"""
Voix ANGLAISES du jeu (Norman, 2026-10-30 : « on va générer l'intégralité des voix du jeu en anglais » ; consigne : « le moins d'erreurs possible »).
Même narrateur que l'intro anglaise (voix par défaut de Chatterbox multilingue, language_id="en", SANS extrait de référence, exaggeration 0.45 / cfg 0.5),
légèrement ralenti (atempo 0,92, hauteur inchangée). Tout se passe HORS du dépôt : C:\\Users\\n0rma\\soreal-voice-studio\\voix-en-jeu\\ (SOREAL_VOIX_EN_JEU pour changer).
Rien n'est téléversé, rien n'est publié : les fichiers finaux attendent l'accord de Norman.

  C:\\Users\\n0rma\\soreal-voice-studio\\venv\\Scripts\\python.exe cloudflare/tools/voix-en-jeu-v1.py [options]

Options
  --categorie chroniques|statiques|admin|nommees|toutes   (défaut : chroniques ; ordre de priorité = cet ordre)
  --limite N        ne traite que N blocs (après filtrage)       --ids 1,2,5   seulement ces numéros de boss (chroniques)
  --dry             compte seulement (blocs, caractères, mots, durée et taille estimées) : aucune synthèse, aucun modèle chargé
  --pilote          choisit 3 chroniques courtes + 1 longue, les génère, et copie 4 fichiers d'écoute dans <depot>/echantillons-voix-en/chroniques/
  --tentatives N    prises maximum par segment (défaut 4)         --tempo T   ralentissement (défaut 0.92)
  --refaire-douteux refait les blocs marqués douteux (les prises brutes précédentes sont gardées)
  --rapport         réécrit seulement le rapport de qualité (rapport.html / rapport.txt) à partir de etat.json

Sources
  chroniques : design/ngu-boss-stories-en.json (TEXTES ORIGINAUX du wiki, règle n°1) + noms anglais design/ngu-boss-names-fr.json (nomEn). Les boss sans histoire sur le wiki
               (272 à 289 : 18 boss) n'ont pas de chronique anglaise originale : NON voisés. Le texte lu est fabriqué par le VRAI module du jeu (voix-en-blocs-v1.mjs) :
               mêmes blocs de 600 caractères, même empreinte cyrb53 que le lecteur, donc le fichier <empreinte>.m4a est retrouvé tel quel par le client.
  statiques, admin, nommees : fichiers JSON dans <sortie>/sources/ : statiques-en.json, admin-en.json, nommees-en.json = liste de textes anglais [« texte », …]
               (ou [[« texte », 0|1], …] : le 2e champ vaut 1 si du français reste dans la traduction : bloc marqué douteux d'office).
               statiques-en.json s'obtient dans le jeu local en anglais (console du navigateur) : voir voix-en-statiques-console-v1.js.

Sortie (hors dépôt)
  final/<empreinte>.m4a   fichiers prêts (AAC mono 32 kbit/s, ralentis)      brut/<empreinte>.m4a   meilleure prise brute (96 kbit/s, avant ralentissement)
  prises/<empreinte>/     TOUTES les prises de chaque segment (jamais écrasées)  etat.json   état de chaque bloc    journal.log   avancement
  rapport.html / rapport.txt   rapport de qualité : seules les voix DOUTEUSES sont à écouter (motif + instant dans le fichier final)

Contrôles automatiques (chaque segment, puis chaque bloc) — une prise qui échoue est refaite (autre graine, réglages voisins), on garde la meilleure, la dernière qui échoue = DOUTEUSE
  - débit : secondes par mot hors de la plage plausible (trop court = phrase tronquée ; trop long = emballement) ; fenêtre de débit du bloc entier ;
  - avertissements « forcing EOS » du moteur (répétition d'alignement / de jeton = dur ; simple queue longue = léger) et dérapage / baratin inventé corrigé par serveur.py ;
  - silences : trou > 2 s au milieu (dur), > 1,2 s (léger), silence en début/fin > 0,5 s, fichier quasi vide ; saturation (écrêtage) ;
  - reconnaissance vocale hors ligne (WER) : seulement si un modèle est DÉJÀ installé (SOREAL_ASR_MODEL = dossier d'un modèle whisper local, transformers hors ligne) ; sinon dit « non disponible ».
"""
import os, sys, re, json, time, shutil, subprocess, zlib, io, math, datetime, html, argparse, logging, difflib, contextlib

os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["SOREAL_VOIX_DEBIT"] = "96k"          # prises brutes en 96 kbit/s ; le fichier final repasse en 32 kbit/s après le ralentissement
RACINE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(RACINE, "cloudflare", "tools", "voice-studio"))
import serveur  # noqa: E402  (n'importe pas torch : le mode --dry reste instantané)

SORTIE = os.environ.get("SOREAL_VOIX_EN_JEU") or os.path.join(os.path.expanduser("~"), "soreal-voice-studio", "voix-en-jeu")
ECHANTILLONS = os.path.join(RACINE, "echantillons-voix-en", "chroniques")
ORDRE = ["chroniques", "statiques", "admin", "nommees"]

# --- Réglages de contrôle (débit mesuré sur les voix de l'intro : voir le rapport du pilote) -----------------------------------------------------------------
SEC_PAR_MOT_DUR = (0.14, 0.75)     # hors de cette plage = prise refusée (segment de 4 mots ou plus)
SEC_PAR_MOT_LEGER = (0.17, 0.45)   # hors de cette plage = signalement léger
WPM_BLOC = (140, 360)              # mots par minute AVANT ralentissement, bloc entier (raccords compris)
TROU_DUR_S, TROU_LEGER_S, BORD_MAX_S = 2.0, 1.2, 0.5
ECRETAGE_MAX = 0.002               # part d'échantillons à pleine échelle
PROFILS = [(0.45, 0.5), (0.40, 0.55), (0.35, 0.5), (0.45, 0.6), (0.30, 0.65), (0.40, 0.45)]   # (exaggeration, cfg_weight) de la prise 1, 2, 3...
MAX_SEG = 170                      # caractères par segment de synthèse (phrases courtes ; serveur.py : 240)
MIN_SEG = 30                       # un segment plus court est fusionné avec le voisin (les très courts font planter / baratiner le moteur)

# --- Prononciations stables (texte SYNTHÉTISÉ seulement ; le texte affiché et l'empreinte ne changent jamais) -------------------------------------------------
SIGLES = {"NGU": "N G U", "DNA": "D N A", "VCR": "V C R", "VHS": "V H S", "DJ": "D J", "XXL": "X X L", "MLP": "M L P", "CGI": "C G I", "GTFO": "G T F O",
          "WTF": "W T F", "WWE": "W W E", "KO": "K O", "JRPG": "J R P G", "PG": "P G", "AF": "A F", "PM": "P M", "EXP": "E X P", "AP": "A P", "HP": "H P",
          "UI": "U I", "FUBAR": "Foo bar", "2D": "two D", "3D": "three D", "ITOPOD": "I T O P O D"}
MOTS = [("MacGuffins", "Mac Guffins"), ("MacGuffin", "Mac Guffin"), ("Yggdrasil", "Ig-druh-sil"), ("NGUs", "N G Us"), ("SOREAL", "Soreal")]


def pour_la_voix(t):
    """Texte envoyé au moteur : bruitages *ZWOOP* lus comme un mot, MAJUSCULES -> casse normale (stable), sigles épelés, étirements (AAAAAA) plafonnés, ponctuation gardée."""
    def bruitage(m):
        mot = m.group(1).strip()
        if not mot:
            return " "
        if mot == mot.upper() and mot != mot.lower():
            mot = mot[0] + mot[1:].lower()
            return mot + " " if re.search(r"[.!?…]$", mot) else mot + ". "
        return mot + " "
    t = re.sub(r"\*([^*\n]+)\*", bruitage, t).replace("*", " ")
    t = t.replace("\u2026", "...").replace("\u2019", "'").replace("\u2018", "'").replace("\u201c", '"').replace("\u201d", '"')
    t = t.replace(" \u2014 ", ", ").replace("\u2014", ", ").replace("\u2013", ", ").replace("&", " and ")
    for a, b in MOTS:
        t = re.sub(r"(?<![A-Za-z])" + re.escape(a) + r"(?![A-Za-z])", b, t)

    def sigle_ou_cri(m):
        w = m.group(0)
        base = re.sub(r"[^A-Za-z0-9]", "", w)
        if base in SIGLES:
            return w.replace(base, SIGLES[base])
        if len(base) >= 2 and re.search(r"[AEIOUY]", base):
            return w[0] + w[1:].lower()       # cri ou mot en capitales : casse normale (« KILL » -> « Kill »)
        return w
    t = re.sub(r"\b[A-Z0-9][A-Z0-9'\-]*[A-Z0-9]\b", sigle_ou_cri, t)
    t = re.sub(r"([A-Za-z])\1{3,}", lambda m: m.group(1) * 3, t)   # AAAAAAAAAAAA -> Aaa
    return re.sub(r"\s+", " ", t).strip()


def segmenter(texte):
    """Phrases courtes (jamais de bloc long) : coupe après . ! ? … ; une phrase trop longue est coupée aux , ; : ; les très courtes sont fusionnées ; une question reste seule."""
    t = re.sub(r"\s+", " ", texte).strip()
    phrases = [p for p in re.split(r"(?<=[.!?\u2026])\s+(?=[\"'A-Z0-9(\u00bf])", t) if p.strip()] or [t]
    morceaux = []
    for p in phrases:
        if len(p) <= MAX_SEG:
            morceaux.append(p)
            continue
        courant = ""
        for part in re.split(r"(?<=[,;:])\s+", p):
            if courant and len(courant) + len(part) + 1 > MAX_SEG:
                morceaux.append(courant)
                courant = part
            else:
                courant = (courant + " " + part).strip()
            while len(courant) > MAX_SEG:
                coupe = courant.rfind(" ", 0, MAX_SEG)
                coupe = coupe if coupe > 40 else MAX_SEG
                morceaux.append(courant[:coupe].strip())
                courant = courant[coupe:].strip()
        if courant:
            morceaux.append(courant)
    segs = []
    for p in morceaux:
        if segs and len(segs[-1]) < MIN_SEG and not serveur.est_question(segs[-1]) and len(segs[-1]) + len(p) + 1 <= MAX_SEG:
            segs[-1] = segs[-1] + " " + p
        elif segs and len(p) < MIN_SEG and not serveur.est_question(p) and len(segs[-1]) + len(p) + 1 <= MAX_SEG:
            segs[-1] = segs[-1] + " " + p
        else:
            segs.append(p)
    return segs


def nb_mots(t):
    n = 0
    for w in re.findall(r"[A-Za-z0-9][A-Za-z0-9'\u2019\-.,]*", t):
        n += 3 if re.fullmatch(r"\d[\d,.]*", w) and len(w) > 2 else 1
    return max(1, n)


# --- Inventaire : blocs par catégorie -----------------------------------------------------------------------------------------------------------------------
def journal(msg, f=None):
    ligne = "%s %s" % (time.strftime("%Y-%m-%d %H:%M:%S"), msg)
    print(ligne, flush=True)
    try:
        os.makedirs(SORTIE, exist_ok=True)
        with open(os.path.join(SORTIE, "journal.log"), "a", encoding="utf-8") as fh:
            fh.write(ligne + "\n")
    except OSError:
        pass


def appeler_noeud(entrees):
    os.makedirs(os.path.join(SORTIE, "sources"), exist_ok=True)
    e = os.path.join(SORTIE, "sources", "_entree.json")
    s = os.path.join(SORTIE, "sources", "_blocs.json")
    json.dump(entrees, open(e, "w", encoding="utf-8"), ensure_ascii=False)
    r = subprocess.run(["node", os.path.join(RACINE, "cloudflare", "tools", "voix-en-blocs-v1.mjs"), e, s], capture_output=True, text=True, encoding="utf-8")
    if r.returncode != 0:
        raise SystemExit("voix-en-blocs-v1.mjs a échoué : " + (r.stderr or r.stdout))
    return json.load(open(s, encoding="utf-8"))


def lire_source_liste(nom):
    chemin = os.path.join(SORTIE, "sources", nom)
    if not os.path.isfile(chemin):
        return None
    out = []
    for i, x in enumerate(json.load(open(chemin, encoding="utf-8"))):
        texte, reste = (x[0], bool(x[1])) if isinstance(x, list) else (str(x), False)
        out.append({"cat": "texte", "id": nom.split("-")[0] + "-" + str(i + 1), "texte": texte, "reste_fr": reste})
    return out


def inventaire(categories, ids=None):
    """-> liste de blocs {hash, texte, cat, id, ordre, mots, reste_fr} dédoublonnés par empreinte (ordre de priorité des catégories)."""
    blocs, vus, manques = [], set(), {}
    for cat in categories:
        if cat == "chroniques":
            hist = json.load(open(os.path.join(RACINE, "design", "ngu-boss-stories-en.json"), encoding="utf-8"))
            noms = {int(b["id"]): b.get("nomEn") or "Boss" for b in json.load(open(os.path.join(RACINE, "design", "ngu-boss-names-fr.json"), encoding="utf-8"))}
            entrees = [{"cat": "chronique", "id": int(h["id"]), "nom": noms.get(int(h["id"]), "Boss"), "histoire": str(h["story"]).strip()}
                       for h in sorted(hist, key=lambda h: int(h["id"])) if str(h.get("story", "")).strip() and (not ids or int(h["id"]) in ids)]
        else:
            entrees = lire_source_liste({"statiques": "statiques-en.json", "admin": "admin-en.json", "nommees": "nommees-en.json"}[cat])
            if entrees is None:
                manques[cat] = True
                continue
        reste = {str(e["id"]): e.get("reste_fr", False) for e in entrees}
        for s in appeler_noeud(entrees):
            for k, b in enumerate(s["blocs"]):
                if b["hash"] in vus:
                    continue
                vus.add(b["hash"])
                blocs.append({"hash": b["hash"], "texte": b["texte"], "cat": cat, "id": s["id"], "rang": k, "mots": nb_mots(b["texte"]), "reste_fr": reste.get(str(s["id"]), False)})
    return blocs, manques


# --- Analyse audio ------------------------------------------------------------------------------------------------------------------------------------------
def analyser(wav, sr):
    """Signaux d'un segment ou d'un bloc : durée, écrêtage, parole (fenêtres de 20 ms), trous au milieu, silences de bord."""
    x = wav.squeeze(0).float()
    duree = x.shape[0] / sr
    rms, fenetre, nb = serveur.energie_fenetres(wav, sr)
    if rms is None or nb < 3:
        return {"duree": duree, "vide": True, "ecretage": 0.0, "trous": [], "debut": 0.0, "fin": 0.0, "pic": 0.0}
    pic = float(rms.max())
    parole = (rms >= max(pic * 0.04, 0.002)).tolist()
    nb_parole = sum(parole)
    fen = fenetre / sr
    trous = [(d * fen, (f - d) * fen) for d, f in serveur.silences_interieurs(parole, max(1, int(TROU_LEGER_S / fen)))]
    premier = next((i for i, p in enumerate(parole) if p), None)
    dernier = (nb - 1 - next(i for i, p in enumerate(reversed(parole)) if p)) if premier is not None else None
    return {"duree": duree, "vide": pic < 0.005 or nb_parole < 8, "ecretage": float((x.abs() >= 0.999).float().mean()), "trous": trous,
            "debut": (premier or 0) * fen, "fin": ((nb - 1 - dernier) * fen) if dernier is not None else duree, "pic": pic}


def controler_segment(wav, sr, segment, signaux):
    """-> (score, [(niveau, code, détail, instant_s)]) ; niveau 'dur' (prise refusée) ou 'leger'."""
    a, pb, mots = analyser(wav, sr), [], nb_mots(segment)
    if a["vide"]:
        pb.append(("dur", "vide", "segment quasi vide ou inaudible", 0.0))
    spm = a["duree"] / mots
    if mots >= 4:
        if spm < SEC_PAR_MOT_DUR[0]:
            pb.append(("dur", "tronque", "%.2f s/mot : phrase probablement tronquée" % spm, 0.0))
        elif spm > SEC_PAR_MOT_DUR[1]:
            pb.append(("dur", "emballement", "%.2f s/mot : trop long (bafouillage ou emballement)" % spm, 0.0))
        elif not (SEC_PAR_MOT_LEGER[0] <= spm <= SEC_PAR_MOT_LEGER[1]):
            pb.append(("leger", "debit", "%.2f s/mot : débit inhabituel" % spm, 0.0))
    elif a["duree"] < 0.25 or a["duree"] > 1.5 + 0.9 * mots:
        pb.append(("dur", "duree", "%.2f s pour %d mot(s)" % (a["duree"], mots), 0.0))
    for d, longueur in a["trous"]:
        pb.append(("dur" if longueur > TROU_DUR_S else "leger", "trou", "silence de %.1f s au milieu" % longueur, d))
    if a["debut"] > BORD_MAX_S or a["fin"] > BORD_MAX_S:
        pb.append(("leger", "bord", "silence de bord %.1f s / %.1f s" % (a["debut"], a["fin"]), 0.0))
    if a["ecretage"] > ECRETAGE_MAX:
        pb.append(("dur", "ecretage", "saturation (%.2f %% des échantillons)" % (a["ecretage"] * 100), 0.0))
    for s in signaux:
        if s in ("alignment_repetition=True", "token_repetition=True") or "alignment_repetition=True" in s or "token_repetition=True" in s:
            pb.append(("dur", "eos_repetition", "le moteur a forcé la fin de parole (répétition) : phrase probablement tronquée ou répétée", 0.0))
        elif "long_tail=True" in s:
            pb.append(("leger", "eos_queue", "fin de parole forcée (queue longue)", 0.0))
        elif s == "derapage":
            pb.append(("leger", "derapage", "dérapage détecté puis corrigé par le moteur", 0.0))
        elif s == "baratin":
            pb.append(("leger", "baratin", "baratin inventé coupé après un silence", 0.0))
    score = sum(10 if n == "dur" else 1 for n, *_ in pb)
    return score, pb


def controler_bloc(wav, sr, texte, tempo):
    """Contrôle du bloc assemblé (avant ralentissement). Le débit est exprimé AVANT ralentissement."""
    a, pb = analyser(wav, sr), []
    mots = nb_mots(texte)
    wpm = mots / (a["duree"] / 60.0) if a["duree"] else 0
    if mots >= 6 and not (WPM_BLOC[0] <= wpm <= WPM_BLOC[1]):
        pb.append(("dur", "debit_bloc", "%d mots/min (plage %d-%d) : bloc probablement tronqué ou trop lent" % (wpm, WPM_BLOC[0], WPM_BLOC[1]), 0.0))
    if a["vide"]:
        pb.append(("dur", "vide", "fichier quasi vide", 0.0))
    if a["ecretage"] > ECRETAGE_MAX:
        pb.append(("dur", "ecretage", "saturation", 0.0))
    for d, longueur in a["trous"]:
        if longueur > TROU_DUR_S + 0.3:        # les raccords entre segments sont courts : un trou long dans le bloc est anormal
            pb.append(("dur", "trou", "silence de %.1f s au milieu" % longueur, d / tempo))
    return a["duree"], wpm, pb


# --- Reconnaissance vocale hors ligne (facultative) --------------------------------------------------------------------------------------------------------
_asr = [None, False]


def asr_disponible():
    if _asr[1]:
        return _asr[0]
    _asr[1] = True
    dossier = os.environ.get("SOREAL_ASR_MODEL", "")
    if dossier and os.path.isdir(dossier):
        try:
            from transformers import pipeline
            _asr[0] = pipeline("automatic-speech-recognition", model=dossier, device=0 if __import__("torch").cuda.is_available() else -1)
        except Exception as e:  # noqa: BLE001
            journal("ASR indisponible : %s" % e)
    return _asr[0]


def taux_erreur_mots(attendu, entendu):
    norm = lambda s: re.findall(r"[a-z0-9']+", s.lower())  # noqa: E731
    a, b = norm(attendu), norm(entendu)
    if not a:
        return 0.0
    return 1.0 - difflib.SequenceMatcher(None, a, b).ratio()


# --- Synthèse ---------------------------------------------------------------------------------------------------------------------------------------------
class Capteur(logging.Handler):
    def __init__(self):
        super().__init__(logging.WARNING)
        self.lignes = []

    def emit(self, record):
        m = record.getMessage()
        if "forcing EOS" in m:
            self.lignes.append(m)


class Tee(io.StringIO):
    pass


def prise(m, segment, k, graine_base):
    """Une prise d'un segment avec la graine et les réglages de rang k -> (wav, signaux)."""
    import torch
    exa, cfg = PROFILS[k % len(PROFILS)]
    graine = (zlib.crc32((graine_base + "|" + segment).encode("utf-8")) + 7919 * k) & 0x7FFFFFFF
    torch.manual_seed(graine)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(graine)
    kwargs = {"language_id": "en", "exaggeration": exa, "cfg_weight": cfg, "repetition_penalty": serveur.REPETITION_PENALTY}
    capteur.lignes.clear()
    tampon = Tee()
    seg = serveur.sans_suspension_finale(segment)
    with contextlib.redirect_stdout(tampon):
        with serveur._verrou:
            if len(seg) < serveur.TEXTE_COURT:
                court = seg.rstrip(" .!?\u2026,;:") or seg
                fin = "?" if serveur.est_question(seg) else "."
                wav = serveur.garder_premiere_prononciation(serveur.generer_segment(m, court + fin + " " + court + fin, kwargs), m.sr)
            else:
                wav = serveur.generer_segment(m, seg, kwargs)
    if wav.dim() == 1:
        wav = wav.unsqueeze(0)
    wav = serveur.couper_bords(wav, m.sr, serveur.est_question(seg))
    signaux = list(capteur.lignes)
    sortie = tampon.getvalue()
    if "dérapage détecté" in sortie:
        signaux.append("derapage")
    if "baratin inventé" in sortie:
        signaux.append("baratin")
    return wav, signaux, graine, (exa, cfg)


def vers_m4a_fichier(wav, sr, chemin, debit="96k"):
    serveur.DEBIT = debit
    open(chemin, "wb").write(serveur.vers_m4a(wav, sr))


def ralentir(brut, final, tempo):
    r = subprocess.run([serveur.ffmpeg_exe(), "-y", "-loglevel", "error", "-i", brut, "-vn", "-ac", "1", "-filter:a", "atempo=%s" % tempo,
                        "-c:a", "aac", "-b:a", "32k", "-movflags", "+faststart", final], capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError("ffmpeg : " + (r.stderr or str(r.returncode)))


def duree_fichier(chemin):
    r = subprocess.run([serveur.ffmpeg_exe(), "-i", chemin], capture_output=True, text=True)
    m = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", r.stderr)
    return round(int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3)), 2) if m else 0.0


capteur = Capteur()


def generer_bloc(m, bloc, tentatives, tempo):
    """Génère un bloc : segments de phrases courtes, chacun jusqu'à `tentatives` prises, meilleure prise gardée ; assemble, contrôle, ralentit. -> fiche d'état."""
    import torch
    h = bloc["hash"]
    dossier_prises = os.path.join(SORTIE, "prises", h)
    os.makedirs(dossier_prises, exist_ok=True)
    segs = segmenter(pour_la_voix(bloc["texte"]))
    morceaux, problemes, reprises, nb_prises, t0, cur = [], [], 0, 0, time.time(), 0.0
    silence = torch.zeros(1, int(m.sr * serveur.RACCORD_S))
    horloge_assemblage = 0.0
    for i, seg in enumerate(segs):
        meilleur = None
        for k in range(tentatives):
            wav, signaux, graine, reglage = prise(m, seg, k, h)
            nb_prises += 1
            score, pb = controler_segment(wav, m.sr, seg, signaux)
            vers_m4a_fichier(wav, m.sr, os.path.join(dossier_prises, "%02d-%d.m4a" % (i + 1, k + 1)))
            if meilleur is None or score < meilleur[0]:
                meilleur = (score, pb, wav, k)
            if score <= 1:
                break      # propre, ou un seul signalement léger : on accepte
            if k + 1 < tentatives:
                reprises += 1
                journal("  %s seg %d prise %d refusée (%s) -> nouvelle prise" % (h, i + 1, k + 1, ", ".join(c for _, c, *_ in pb)))
        score, pb, wav, k = meilleur
        for niveau, code, detail, instant in pb:
            problemes.append({"niveau": niveau, "code": code, "detail": detail, "segment": i + 1, "texte": seg[:120],
                              "instant_final_s": round((horloge_assemblage + instant) / tempo, 2), "prise": k + 1})
        morceaux.extend([wav, silence])
        horloge_assemblage += wav.shape[-1] / m.sr + serveur.RACCORD_S
    wav = torch.cat(morceaux[:-1], dim=1)
    duree_brut, wpm, pb_bloc = controler_bloc(wav, m.sr, bloc["texte"], tempo)
    for niveau, code, detail, instant in pb_bloc:
        problemes.append({"niveau": niveau, "code": code, "detail": detail, "segment": 0, "texte": "", "instant_final_s": round(instant, 2), "prise": 0})
    brut = os.path.join(SORTIE, "brut", h + ".m4a")
    final = os.path.join(SORTIE, "final", h + ".m4a")
    os.makedirs(os.path.dirname(brut), exist_ok=True)
    os.makedirs(os.path.dirname(final), exist_ok=True)
    if os.path.isfile(brut):
        shutil.copyfile(brut, os.path.join(dossier_prises, "brut-precedent-%d.m4a" % int(time.time())))   # jamais d'écrasement sans copie
    vers_m4a_fichier(wav, m.sr, brut)
    if os.path.isfile(final):
        shutil.copyfile(final, os.path.join(dossier_prises, "final-precedent-%d.m4a" % int(time.time())))
    ralentir(brut, final, tempo)
    duree_final = duree_fichier(final)
    if abs(duree_final - duree_brut / tempo) > 0.15 + 0.02 * duree_brut:
        problemes.append({"niveau": "dur", "code": "tempo", "detail": "durée finale %.2f s au lieu de %.2f s" % (duree_final, duree_brut / tempo), "segment": 0, "texte": "", "instant_final_s": 0, "prise": 0})
    wer = None
    asr = asr_disponible()
    if asr:
        try:
            wer = taux_erreur_mots(bloc["texte"], asr(final)["text"])
            if wer > 0.15:
                problemes.append({"niveau": "dur", "code": "asr", "detail": "taux d'erreur de mots %.0f %%" % (wer * 100), "segment": 0, "texte": "", "instant_final_s": 0, "prise": 0})
        except Exception as e:  # noqa: BLE001
            journal("ASR en erreur sur %s : %s" % (h, e))
    if bloc.get("reste_fr"):
        problemes.append({"niveau": "dur", "code": "francais_restant", "detail": "du français reste dans la traduction anglaise : à corriger dans le dictionnaire AVANT de voiser", "segment": 0, "texte": "", "instant_final_s": 0, "prise": 0})
    douteux = any(p["niveau"] == "dur" for p in problemes)
    return {"hash": h, "cat": bloc["cat"], "id": bloc["id"], "rang": bloc["rang"], "texte": bloc["texte"], "mots": bloc["mots"], "segments": len(segs),
            "statut": "douteux" if douteux else "ok", "prises": nb_prises, "reprises": reprises, "duree_final": duree_final, "wpm": round(wpm), "wer": wer,
            "problemes": problemes, "synthese_s": round(time.time() - t0, 1), "tempo": tempo, "date": datetime.datetime.now().isoformat(timespec="seconds")}


# --- Rapport ----------------------------------------------------------------------------------------------------------------------------------------------
def charger_etat():
    chemin = os.path.join(SORTIE, "etat.json")
    return json.load(open(chemin, encoding="utf-8")) if os.path.isfile(chemin) else {}


def enregistrer_etat(etat):
    chemin = os.path.join(SORTIE, "etat.json")
    json.dump(etat, open(chemin + ".tmp", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    os.replace(chemin + ".tmp", chemin)


def ecrire_rapport(etat):
    fiches = sorted(etat.values(), key=lambda f: (ORDRE.index(f["cat"]) if f["cat"] in ORDRE else 9, str(f["id"]), f["rang"]))
    ok = [f for f in fiches if f["statut"] == "ok"]
    dout = [f for f in fiches if f["statut"] == "douteux"]
    legers = [f for f in ok if f["problemes"]]
    total_dur = sum(f["duree_final"] for f in fiches)
    asr = "oui" if any(f.get("wer") is not None for f in fiches) else "NON : aucun modèle de reconnaissance vocale installé (rien n'a été téléchargé) ; les contrôles de débit, silences, saturation et fins forcées du moteur remplacent la relecture"
    lignes = ["RAPPORT DE QUALITE - voix anglaises du jeu - %s" % datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
              "Blocs : %d  |  OK : %d (dont %d avec un signalement léger)  |  DOUTEUX a écouter : %d" % (len(fiches), len(ok), len(legers), len(dout)),
              "Prises : %d  |  reprises automatiques : %d  |  durée finale : %.1f min  |  reconnaissance vocale : %s" % (sum(f["prises"] for f in fiches), sum(f["reprises"] for f in fiches), total_dur / 60, asr), ""]
    for cat in ORDRE:
        sel = [f for f in fiches if f["cat"] == cat]
        if sel:
            lignes.append("  %-11s %4d blocs, %4d OK, %3d douteux, %.1f min" % (cat, len(sel), sum(1 for f in sel if f["statut"] == "ok"), sum(1 for f in sel if f["statut"] == "douteux"), sum(f["duree_final"] for f in sel) / 60))
    lignes += ["", "=== A ECOUTER (douteux) : fichier final/<empreinte>.m4a, instant en secondes dans le fichier final ==="]
    for f in dout:
        lignes.append("%s [%s %s bloc %d] %.1f s : %s" % (f["hash"], f["cat"], f["id"], f["rang"] + 1, f["duree_final"], f["texte"][:90].replace("\n", " ")))
        for p in f["problemes"]:
            if p["niveau"] == "dur":
                lignes.append("    - %s a %.1f s (segment %s) : %s %s" % (p["code"], p["instant_final_s"], p["segment"], p["detail"], ("« " + p["texte"] + " »") if p["texte"] else ""))
    open(os.path.join(SORTIE, "rapport.txt"), "w", encoding="utf-8").write("\n".join(lignes) + "\n")
    h = ["<!doctype html><meta charset=utf-8><title>Rapport voix anglaises</title><style>body{font:15px system-ui;margin:24px;max-width:1000px}.d{background:#fee;padding:8px;margin:8px 0;border-left:4px solid #c33}code{background:#eee;padding:1px 4px}audio{display:block;margin:4px 0}</style>",
         "<h1>Rapport de qualité - voix anglaises</h1><pre>" + html.escape("\n".join(lignes[:4 + len(ORDRE) + 1])) + "</pre><h2>À écouter</h2>"]
    for f in dout:
        h.append("<div class=d><b>%s</b> %s %s (bloc %d, %.1f s)<audio controls preload=none src='final/%s.m4a'></audio><i>%s</i><ul>" % (f["hash"], f["cat"], html.escape(str(f["id"])), f["rang"] + 1, f["duree_final"], f["hash"], html.escape(f["texte"][:300])))
        for p in f["problemes"]:
            if p["niveau"] == "dur":
                h.append("<li><code>%s</code> à %.1f s : %s %s</li>" % (p["code"], p["instant_final_s"], html.escape(p["detail"]), ("« " + html.escape(p["texte"]) + " »") if p["texte"] else ""))
        h.append("</ul></div>")
    if not dout:
        h.append("<p>Aucune voix douteuse.</p>")
    open(os.path.join(SORTIE, "rapport.html"), "w", encoding="utf-8").write("".join(h))
    return lignes


# --- Principal --------------------------------------------------------------------------------------------------------------------------------------------
def choisir_pilote(blocs_chroniques):
    """3 chroniques courtes + 1 longue (de préférence avec un bruitage *ZWOOP*) -> liste d'ids de boss."""
    hist = {int(h["id"]): h["story"] for h in json.load(open(os.path.join(RACINE, "design", "ngu-boss-stories-en.json"), encoding="utf-8"))}
    courtes = [i for i, s in sorted(hist.items(), key=lambda kv: len(kv[1])) if len(s) >= 100][:3]
    longues = [i for i, s in hist.items() if 1100 <= len(s) <= 1800]
    avec = [i for i in longues if "*" in hist[i]]
    return courtes + [(avec or longues or [max(hist, key=lambda i: len(hist[i]))])[0]]


def assembler_ecoute(ids, etat, blocs):
    """Un fichier d'écoute par chronique : tous ses blocs dans l'ordre, une pause d'1 s après le nom (comme le jeu)."""
    os.makedirs(ECHANTILLONS, exist_ok=True)
    noms = {int(b["id"]): b.get("nomEn") or "Boss" for b in json.load(open(os.path.join(RACINE, "design", "ngu-boss-names-fr.json"), encoding="utf-8"))}
    sortis = []
    for i in ids:
        mine = sorted([b for b in blocs if b["cat"] == "chroniques" and b["id"] == i], key=lambda b: b["rang"])
        if not mine or not all(os.path.isfile(os.path.join(SORTIE, "final", b["hash"] + ".m4a")) for b in mine):
            continue
        liste = os.path.join(SORTIE, "sources", "_concat-%d.txt" % i)
        silence = os.path.join(SORTIE, "sources", "_silence-1s.m4a")
        if not os.path.isfile(silence):
            subprocess.run([serveur.ffmpeg_exe(), "-y", "-loglevel", "error", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", "1", "-c:a", "aac", "-b:a", "32k", silence], check=True)
        with open(liste, "w", encoding="utf-8") as fh:
            for k, b in enumerate(mine):
                fh.write("file '%s'\n" % os.path.join(SORTIE, "final", b["hash"] + ".m4a").replace("\\", "/"))
                if k == 0:
                    fh.write("file '%s'\n" % silence.replace("\\", "/"))
        slug = re.sub(r"[^a-z0-9]+", "-", noms.get(i, "boss").lower()).strip("-")[:40]
        cible = os.path.join(ECHANTILLONS, "chronique-%03d-%s.m4a" % (i, slug))
        r = subprocess.run([serveur.ffmpeg_exe(), "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", liste, "-c:a", "aac", "-b:a", "32k", cible], capture_output=True, text=True)
        if r.returncode == 0:
            sortis.append(cible)
    return sortis


def main():
    ap = argparse.ArgumentParser(description="Voix anglaises du jeu")
    ap.add_argument("--categorie", default="chroniques")
    ap.add_argument("--limite", type=int, default=0)
    ap.add_argument("--ids", default="")
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--pilote", action="store_true")
    ap.add_argument("--tentatives", type=int, default=4)
    ap.add_argument("--tempo", type=float, default=0.92)
    ap.add_argument("--refaire-douteux", action="store_true")
    ap.add_argument("--rapport", action="store_true")
    a = ap.parse_args()
    if not 0.5 <= a.tempo <= 2.0:
        raise SystemExit("--tempo doit etre entre 0.5 et 2.0")
    os.makedirs(SORTIE, exist_ok=True)
    etat = charger_etat()
    if a.rapport:
        print("\n".join(ecrire_rapport(etat)))
        return
    ids = {int(x) for x in a.ids.split(",") if x.strip()} if a.ids else None
    categories = ORDRE if a.categorie == "toutes" else [a.categorie]
    if a.pilote:
        ids = set(choisir_pilote(None))
        categories = ["chroniques"]
    blocs, manques = inventaire(categories, ids)
    for cat in manques:
        journal("catégorie %s : pas de fichier source dans %s (voir l'en-tête du script)" % (cat, os.path.join(SORTIE, "sources")))
    if a.dry:
        for cat in categories:
            sel = [b for b in blocs if b["cat"] == cat]
            mots = sum(b["mots"] for b in sel)
            sec = mots / 215.0 * 60.0 / a.tempo        # 215 mots/min mesurés AVANT ralentissement (pilote du 2026-10-31)
            print("%-11s %4d blocs  %7d caractères  %6d mots  ~%5.1f min  ~%5.1f Mo (32 kbit/s)" % (cat, len(sel), sum(len(b["texte"]) for b in sel), mots, sec / 60, sec * 4000 / 1e6))
        return
    todo = [b for b in blocs if not (os.path.isfile(os.path.join(SORTIE, "final", b["hash"] + ".m4a")) and b["hash"] in etat
                                      and (etat[b["hash"]]["statut"] == "ok" or not a.refaire_douteux) and etat[b["hash"]].get("tempo") == a.tempo)]
    if a.limite:
        todo = todo[:a.limite]
    journal("%d blocs au programme (%d déjà faits), tempo %s, %d prises max par segment" % (len(todo), len(blocs) - len(todo), a.tempo, a.tentatives))
    if not todo:
        print("\n".join(ecrire_rapport(etat)))
        return
    logging.getLogger().addHandler(capteur)
    import torch  # noqa: F401
    m = serveur.charger_modele()
    t_total = time.time()
    for n, b in enumerate(todo, 1):
        try:
            fiche = generer_bloc(m, b, a.tentatives, a.tempo)
        except Exception as e:  # noqa: BLE001  (un bloc en erreur ne bloque pas les suivants ; il sera refait à la reprise)
            journal("ERREUR %s : %s" % (b["hash"], e))
            try:
                import torch
                torch.cuda.empty_cache()
            except Exception:  # noqa: BLE001
                pass
            continue
        etat[b["hash"]] = fiche
        enregistrer_etat(etat)
        journal("[%d/%d] %s %s#%d %s %d mots %.1f s (synthèse %.0f s, %d prises, %d reprises)%s" % (n, len(todo), fiche["hash"], b["cat"], b["id"], fiche["statut"].upper(), fiche["mots"], fiche["duree_final"], fiche["synthese_s"], fiche["prises"], fiche["reprises"],
                "  !! " + ", ".join(sorted({p["code"] for p in fiche["problemes"] if p["niveau"] == "dur"})) if fiche["statut"] == "douteux" else ""))
    journal("terminé en %.0f s" % (time.time() - t_total))
    print("\n".join(ecrire_rapport(etat)))
    if a.pilote:
        print("échantillons :", assembler_ecoute(sorted(ids), etat, blocs))


if __name__ == "__main__":
    main()
