"""Construit les pièces de la mascotte Cthulhu (marionnette 2D).
Source : un dossier de PNG 1254x1254 transparents, chaque pièce déjà à sa place dans le dessin complet (fourni par Norman, 2026-11-04).
Sortie : public/cthulhu/<nom>.webp (pièce rognée, réduite) et public/modules/cthulhu-pieces-v1.js (position de chaque pièce en % du dessin).
Usage : python tools/build-cthulhu.py <dossier des PNG> [dossier des PNG de dos]
"""
import sys, os, json
from PIL import Image
SRC = sys.argv[1]
SRC_DOS = sys.argv[2] if len(sys.argv) > 2 else os.path.join(SRC, 'dos')   # pièces de la vue de dos (sous-dossier « dos »)
ICI = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ICI, '..', 'public', 'cthulhu')
os.makedirs(OUT, exist_ok=True)
N = 1254
ECHELLE = 0.4
pieces = {}
SRC_VOL = os.path.join(SRC, 'face-vol')   # corps de la pose « vol de face » + tentacules (ces tentacules remplacent les anciens dans toutes les poses)
fichiers = []
for d in (SRC, SRC_DOS, SRC_VOL):
    if os.path.isdir(d):
        fichiers += [(d, f) for f in sorted(os.listdir(d))]
for dossier, f in fichiers:
    if not f.lower().endswith('.png'):
        continue
    nom = f[:-4]
    im = Image.open(os.path.join(dossier, f)).convert('RGBA')
    b = im.getchannel('A').getbbox()
    if not b:
        continue
    c = im.crop(b)
    c = c.resize((max(1, round(c.width * ECHELLE)), max(1, round(c.height * ECHELLE))), Image.LANCZOS)
    c.save(os.path.join(OUT, nom + '.webp'), 'WEBP', lossless=True, quality=100, method=6)
    pieces[nom] = [round(b[0] / N * 100, 3), round(b[1] / N * 100, 3), round((b[2] - b[0]) / N * 100, 3), round((b[3] - b[1]) / N * 100, 3)]
js = os.path.join(ICI, '..', 'public', 'modules', 'cthulhu-pieces-v1.js')
with open(js, 'w', encoding='utf-8') as g:
    g.write('/* Généré par tools/build-cthulhu.py : [gauche, haut, largeur, hauteur] de chaque pièce, en % du dessin complet. */\n(function(){window.__SOREAL_IDLE_CTHULHU_PIECES_V1__=' + json.dumps(pieces, separators=(',', ':')) + ';})();\n')
print(len(pieces), 'pièces')
