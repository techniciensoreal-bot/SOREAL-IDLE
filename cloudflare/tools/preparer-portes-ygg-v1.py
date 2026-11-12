"""
Prépare les PORTES d'Yggdrasil (Norman, 2026-11-02) : une image par fruit, PORTES_IMAGES_ de modules/yggdrasil-elfes-v1.js.
  python cloudflare/tools/preparer-portes-ygg-v1.py <dossier des *Door.png> <dossier de sortie>
Pour chaque <Nom>Door.png (ex. PowerAlphaDoor.png -> powerAlpha) : retire la marge SOMBRE du bord (la porte doit coller au cadre, sans noir), redimensionne en 1024 x 1024 et enregistre en WebP (qualité 82).
Envoi sur R2 (clé idle/ygg-portes/<fruit>.webp, route /api/idle/media/ygg?name=<fruit>&porte=1) :
  npx wrangler r2 object put soreal/idle/ygg-portes/<fruit>.webp --file <sortie>/<fruit>.webp --content-type image/webp --remote
Un fruit dont le nom est dans FRUITS_24_ doit aussi figurer dans PORTES_IMAGES_ et dans PALETTES_PORTES_ (couleurs du cadre).
"""
import glob, os, sys
from PIL import Image

def preparer(src, sortie, taille=1024, seuil=60, marge=3):
    os.makedirs(sortie, exist_ok=True)
    for f in sorted(glob.glob(os.path.join(src, "*Door.png"))):
        nom = os.path.basename(f)[:-8]
        nom = nom[0].lower() + nom[1:]
        im = Image.open(f).convert("RGBA")
        if im.getchannel("A").getextrema()[0] == 0:  # bords DEJA transparents (version du 2026-11-12) : rien a recadrer, on garde la transparence
            sortie_img = os.path.join(sortie, nom + ".webp")
            im.resize((taille, taille), Image.LANCZOS).save(sortie_img, "WEBP", quality=82, method=6)
            print(nom, "transparent", os.path.getsize(sortie_img) // 1024, "Ko")
            continue
        im = im.convert("RGB")
        w, h = im.size
        lum = lambda c: int(0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2])
        moy = lambda box: lum(im.crop(box).resize((1, 1), Image.BOX).getpixel((0, 0)))
        def profondeur(axe, inverse):
            for i in range(300):
                if axe == "y":
                    y = (h - 1 - i) if inverse else i
                    c = moy((0, y, w, y + 1))
                else:
                    x = (w - 1 - i) if inverse else i
                    c = moy((x, 0, x + 1, h))
                if c > seuil:
                    return i
            return 0
        g, d, t, b = profondeur("x", False), profondeur("x", True), profondeur("y", False), profondeur("y", True)
        boite = (g + marge if g else 0, t + marge if t else 0, w - (d + marge if d else 0), h - (b + marge if b else 0))
        sortie_img = os.path.join(sortie, nom + ".webp")
        im.crop(boite).resize((taille, taille), Image.LANCZOS).save(sortie_img, "WEBP", quality=82, method=6)
        print(nom, boite, os.path.getsize(sortie_img) // 1024, "Ko")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(2)
    preparer(sys.argv[1], sys.argv[2])
