# Mesure les skins de la Garderie (chats-etageres 768x1152) : ovales blancs des yeux, couleur de paupiere,
# planches de l'etagere ; ecrit une superposition de verification par skin.
# Usage : python mesurer-skins-garderie.py <dossier webp> <dossier verif> [--json sortie.json]
import sys, json, os
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

MINAIRE, MINW = 150, 14
IDS = 'defaut noeud arcenciel fibonacci dore matrix chauvesouris tchernobyl pirate noel nega'.split()


def ovales(a):
    rgb = a[:, :, :3].astype(int)
    h, w = a.shape[:2]
    mx, mn = rgb.max(2), rgb.min(2)
    m = (a[:, :, 3] > 200) & (mn > 232) & ((mx - mn) < 22)
    m[int(h * 0.36):] = False
    m = ndi.binary_opening(m, iterations=1)
    lab, n = ndi.label(m)
    out = []
    for i in range(1, n + 1):
        ys, xs = np.where(lab == i)
        if len(xs) < MINAIRE:
            continue
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        bw, bh = x1 - x0, y1 - y0
        fill = len(xs) / float(bw * bh)           # une ellipse remplit ~0,785 de sa boite
        if fill < 0.6 or bw < MINW or bh < MINW:
            continue
        out.append(dict(x0=int(x0), y0=int(y0), w=int(bw), h=int(bh), fill=round(fill, 2)))
    out.sort(key=lambda o: (o['y0'] // 60, o['x0']))
    return out


def peau(a, o):
    """Couleur mediane de l'anneau juste autour de l'ovale (hors blanc, hors contour sombre)."""
    h, w = a.shape[:2]
    cx, cy = o['x0'] + o['w'] / 2.0, o['y0'] + o['h'] / 2.0
    yy, xx = np.mgrid[0:h, 0:w]
    r = np.sqrt(((xx - cx) / (o['w'] / 2.0)) ** 2 + ((yy - cy) / (o['h'] / 2.0)) ** 2)
    ring = (r > 1.3) & (r < 1.8) & (a[:, :, 3] > 200) & (yy < cy)   # au-dessus : la paupiere descend du haut
    px = a[:, :, :3][ring].astype(int)
    lum = px.sum(1)
    # on retire les contours tres sombres et les blancs
    keep = px.min(1) < 235
    px = px[keep] if keep.sum() > 50 else px
    c = np.median(px, axis=0)
    return '#%02x%02x%02x' % tuple(int(v) for v in c)


def planches(a):
    """Lignes horizontales de l'etagere : profils de luminosite moyenne sur la zone interieure."""
    return None


def main():
    src, dst = sys.argv[1], sys.argv[2]
    res = {}
    for n in IDS:
        im = Image.open(os.path.join(src, n + '.webp')).convert('RGBA')
        a = np.array(im)
        os_ = ovales(a)
        for o in os_:
            o['peau'] = peau(a, o)
        res[n] = os_
        print(n, len(os_))
        for o in os_:
            print('   ', o)
    if '--json' in sys.argv:
        json.dump(res, open(sys.argv[sys.argv.index('--json') + 1], 'w'), indent=1)


if __name__ == '__main__':
    main()
