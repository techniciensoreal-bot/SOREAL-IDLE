"""
Voix du narrateur ANGLAIS de l'introduction (Norman, 2026-10-30) : 16 fichiers statiques cloudflare/public/voice-en/intro-01.m4a ... 16.m4a
+ voice-en/manifest.json (texte lu, duree en secondes, tempo applique) + voice-en/intro-original-en.json (copie de design/intro-original-en.json,
lue par le navigateur pour afficher les memes textes).

Source UNIQUE des textes : design/intro-original-en.json (texte d'ouverture original de NGU Idle, ecran « THE BEGINNING », fourni par Norman ; champ "images").

Relancer (hors ligne, aucun telechargement ; GPU conseille) :
  C:\\Users\\n0rma\\soreal-voice-studio\\venv\\Scripts\\python.exe cloudflare/tools/voix-en-intro-v1.py [--force] [--tempo 0.92] [01 05 ...]
Sans argument : ne regenere que les voix BRUTES manquantes (ou dont le texte a change), puis applique le tempo. --force : tout resynthetiser. Des numeros : seulement ceux-la.

Voix : Chatterbox multilingue, language_id="en", SANS extrait de reference (voix par defaut du moteur, sans accent francais), exaggeration 0.45 / cfg 0.5.
Decoupage, garde-fous anti-emballement et conversion m4a (AAC mono 32 kbit/s) : voice-studio/serveur.py. Un mot entre asterisques
(*WHOOMPH*, *something*) est lu comme un mot (onomatopee suivie d'une pause), jamais « asterisk ».

TEMPO (Norman, 2026-10-30 : « il parle un peu trop vite ») : --tempo T (defaut 0.92, soit environ 8 % plus lent) applique le filtre ffmpeg atempo=T, SANS changer la hauteur.
Il part TOUJOURS des voix brutes, gardees HORS du depot (dossier SOREAL_VOIX_EN_BRUT, defaut C:\\Users\\n0rma\\soreal-voice-studio\\voix-en-brut) : relancer le script ne ralentit
donc jamais deux fois un fichier. Pour changer la vitesse, relancer avec un autre --tempo. Si un brut manque, il est resynthetise (la voix change alors un peu : l'echantillonnage est aleatoire).
Le manifeste donne la duree FINALE (mesuree sur le fichier ralenti) et le tempo.
"""
import os, sys, re, json, time, shutil, subprocess

os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["SOREAL_VOIX_DEBIT"] = "32k"
RACINE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(RACINE, "cloudflare", "tools", "voice-studio"))
import serveur

SORTIE = os.path.join(RACINE, "cloudflare", "public", "voice-en")
SOURCE = os.path.join(RACINE, "design", "intro-original-en.json")
BRUT = os.environ.get("SOREAL_VOIX_EN_BRUT") or os.path.join(os.path.expanduser("~"), "soreal-voice-studio", "voix-en-brut")


def pour_la_voix(t):
    def bruitage(m):
        mot = m.group(1).strip()
        if not mot:
            return " "
        if mot == mot.upper() and mot != mot.lower():
            mot = mot[0] + mot[1:].lower()
            return mot + " " if re.search(r"[.!?…]$", mot) else mot + ". "
        return mot + " "
    t = re.sub(r"\*([^*\n]+)\*", bruitage, t).replace("*", " ")
    t = t.replace("\u2026", "...").replace("\u2019", "'")
    return re.sub(r"\s+", " ", t).strip()


def duree_fichier(chemin):
    r = subprocess.run([serveur.ffmpeg_exe(), "-i", chemin], capture_output=True, text=True)
    m = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", r.stderr)
    return round(int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3)), 2) if m else 0.0


def ralentir(brut, final, tempo):
    r = subprocess.run([serveur.ffmpeg_exe(), "-y", "-loglevel", "error", "-i", brut, "-vn", "-ac", "1", "-filter:a", "atempo=%s" % tempo,
                        "-c:a", "aac", "-b:a", "32k", "-movflags", "+faststart", final], capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError("ffmpeg : " + (r.stderr or str(r.returncode)))


def main():
    argv = sys.argv[1:]
    tempo = 0.92
    if "--tempo" in argv:
        i = argv.index("--tempo")
        tempo = float(argv[i + 1])
        del argv[i:i + 2]
    args = [a for a in argv if not a.startswith("--")]
    force = "--force" in argv
    if not 0.5 <= tempo <= 2.0:
        raise SystemExit("--tempo doit etre entre 0.5 et 2.0")
    images = json.load(open(SOURCE, encoding="utf-8"))["images"]
    os.makedirs(SORTIE, exist_ok=True)
    os.makedirs(BRUT, exist_ok=True)
    shutil.copyfile(SOURCE, os.path.join(SORTIE, "intro-original-en.json"))
    chemin_manifeste = os.path.join(SORTIE, "manifest.json")
    manifeste = json.load(open(chemin_manifeste, encoding="utf-8")) if os.path.isfile(chemin_manifeste) else {}
    modele = None
    t_total = time.time()
    for im in images:
        n, en = im["n"], im["texte"]
        if args and n not in args:
            continue
        brut = os.path.join(BRUT, "intro-" + n + ".m4a")
        final = os.path.join(SORTIE, "intro-" + n + ".m4a")
        ancien = manifeste.get(n, {})
        if force or not os.path.isfile(brut) or ancien.get("texte") != en:
            if modele is None:
                modele = serveur.charger_modele()
                orig = modele.generate

                def generer_en(texte, _o=orig, **kw):
                    kw["language_id"] = "en"
                    return _o(texte, **kw)
                modele.generate = generer_en
                serveur.reference_voix = lambda v: None  # voix par defaut du moteur
            t0 = time.time()
            wav, sr = serveur.synthetiser_long(pour_la_voix(en), "homme", 0.45, 0.5)
            open(brut, "wb").write(serveur.vers_m4a(wav, sr))
            print(n, "synthese %.1fs" % (time.time() - t0), flush=True)
        elif os.path.isfile(final) and ancien.get("tempo") == tempo:
            continue
        ralentir(brut, final, tempo)
        manifeste[n] = {"texte": en, "duree": duree_fichier(final), "tempo": tempo}
        print(n, "tempo %s duree %.2fs (brut %.2fs) taille %d Ko" % (tempo, manifeste[n]["duree"], duree_fichier(brut), os.path.getsize(final) // 1024), flush=True)
        json.dump(dict(sorted(manifeste.items())), open(chemin_manifeste, "w", encoding="utf-8", newline="\n"), ensure_ascii=False, indent=1)
    print("total %.0fs" % (time.time() - t_total))


if __name__ == "__main__":
    main()
