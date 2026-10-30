"""
Voix du narrateur ANGLAIS de l'introduction (Norman, 2026-10-30) : 16 fichiers statiques cloudflare/public/voice-en/intro-01.m4a ... 16.m4a
+ voice-en/manifest.json (texte lu et duree en secondes pour chaque numero) + voice-en/intro-original-en.json (copie de design/intro-original-en.json,
lue par le navigateur pour afficher les memes textes).

Source UNIQUE des textes : design/intro-original-en.json (texte d'ouverture original de NGU Idle, ecran « THE BEGINNING », fourni par Norman ; champ "images").

Relancer (hors ligne, aucun telechargement ; GPU conseille) :
  C:\\Users\\n0rma\\soreal-voice-studio\\venv\\Scripts\\python.exe cloudflare/tools/voix-en-intro-v1.py [--force] [01 05 ...]
Sans argument : ne regenere que les fichiers manquants ou dont le texte a change. --force : tout refaire. Des numeros : seulement ceux-la.

Voix : Chatterbox multilingue, language_id="en", SANS extrait de reference (voix par defaut du moteur, sans accent francais), exaggeration 0.45 / cfg 0.5.
Decoupage, garde-fous anti-emballement et conversion m4a (AAC mono 32 kbit/s) : voice-studio/serveur.py. Un mot entre asterisques
(*WHOOMPH*, *something*) est lu comme un mot (onomatopee suivie d'une pause), jamais « asterisk ».
"""
import os, sys, re, json, time, shutil

os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["SOREAL_VOIX_DEBIT"] = "32k"
RACINE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(RACINE, "cloudflare", "tools", "voice-studio"))
import serveur

SORTIE = os.path.join(RACINE, "cloudflare", "public", "voice-en")
SOURCE = os.path.join(RACINE, "design", "intro-original-en.json")


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


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    force = "--force" in sys.argv
    images = json.load(open(SOURCE, encoding="utf-8"))["images"]
    os.makedirs(SORTIE, exist_ok=True)
    shutil.copyfile(SOURCE, os.path.join(SORTIE, "intro-original-en.json"))
    chemin_manifeste = os.path.join(SORTIE, "manifest.json")
    manifeste = json.load(open(chemin_manifeste, encoding="utf-8")) if os.path.isfile(chemin_manifeste) else {}
    modele = serveur.charger_modele()
    orig = modele.generate

    def generer_en(texte, **kw):
        kw["language_id"] = "en"
        return orig(texte, **kw)
    modele.generate = generer_en
    serveur.reference_voix = lambda v: None  # voix par defaut du moteur
    t_total = time.time()
    for im in images:
        n, en = im["n"], im["texte"]
        fichier = os.path.join(SORTIE, "intro-" + n + ".m4a")
        if args and n not in args:
            continue
        if not force and not args and os.path.isfile(fichier) and manifeste.get(n, {}).get("texte") == en:
            continue
        t0 = time.time()
        wav, sr = serveur.synthetiser_long(pour_la_voix(en), "homme", 0.45, 0.5)
        data = serveur.vers_m4a(wav, sr)
        open(fichier, "wb").write(data)
        duree = round(wav.shape[-1] / sr, 2)
        manifeste[n] = {"texte": en, "duree": duree}
        print(n, "duree %.2fs" % duree, "synthese %.1fs" % (time.time() - t0), "taille %d Ko" % (len(data) // 1024), flush=True)
        json.dump(dict(sorted(manifeste.items())), open(chemin_manifeste, "w", encoding="utf-8", newline="\n"), ensure_ascii=False, indent=1)
    print("total %.0fs" % (time.time() - t_total))


if __name__ == "__main__":
    main()
