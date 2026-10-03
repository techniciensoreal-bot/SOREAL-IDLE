"""Essais (sans GPU ni modèle) de la coupe des noms courts du studio de voix : python test_decoupe.py (avec le python du studio, qui a torch).
Norman, 2026-10-03 : « il répète 2 fois des passages ; il prononce des choses qui n'existent pas » (noms de boss)."""
import math
import sys

import torch

import serveur

SR = 24000


def parole(duree):
    t = torch.arange(int(SR * duree)) / SR
    return (0.5 * torch.sin(2 * math.pi * 180 * t) * (0.6 + 0.4 * torch.sin(2 * math.pi * 7 * t).abs())).unsqueeze(0)


def silence(duree):
    return torch.zeros(1, int(SR * duree))


def duree(wav):
    return wav.shape[-1] / SR


def verifier(condition, message):
    if not condition:
        print("ÉCHEC :", message)
        sys.exit(1)
    print("ok  :", message)


# 1. « X. X. » : un nom avec une petite pause interne (0,15 s) est dit deux fois, séparé de 0,4 s. On garde UNE prononciation entière (ni plus, ni moins).
une = torch.cat([parole(0.40), silence(0.15), parole(0.60)], dim=1)       # 1,15 s
doublee = torch.cat([une, silence(0.40), une, silence(0.10)], dim=1)
garde = serveur.garder_premiere_prononciation(doublee, SR)
verifier(abs(duree(garde) - 1.15) < 0.12, "la coupe tombe à la fin de la 1re prononciation (%.2f s au lieu de 1,15 s : ni coupée en plein nom, ni répétée)" % duree(garde))

# 1 bis. Aucun silence franc entre les deux : repli sur la moitié de la parole.
collee = torch.cat([parole(0.8), parole(0.8)], dim=1)
verifier(abs(duree(serveur.garder_premiere_prononciation(collee, SR)) - 0.8) < 0.12, "sans silence : coupe à la moitié de la parole")

# 2. Baratin inventé après un silence franc (texte court) : retiré.
nom = "Un Type Bizarre à Deux Têtes"   # 28 caractères
avec_baratin = torch.cat([parole(1.2), silence(0.5), parole(0.5)], dim=1)
sortie, coupe = serveur.retirer_queue_inventee(avec_baratin, SR, nom)
verifier(coupe and abs(duree(sortie) - 1.2) < 0.12, "le baratin inventé après un silence de 0,5 s est coupé (%.2f s)" % duree(sortie))

# 3. Un nom dit d'un trait avec une petite respiration (0,15 s) reste entier.
respire = torch.cat([parole(0.6), silence(0.15), parole(0.7)], dim=1)
sortie, coupe = serveur.retirer_queue_inventee(respire, SR, nom)
verifier(not coupe and duree(sortie) == duree(respire), "une petite respiration (0,15 s) ne coupe rien")

# 4. Un long texte n'est jamais touché par ce garde-fou.
long_texte = "x" * 200
sortie, coupe = serveur.retirer_queue_inventee(avec_baratin, SR, long_texte)
verifier(not coupe, "texte long : intact")

# 5. Durée plausible : plus serrée pour un nom que pour un long récit.
verifier(serveur.duree_max_segment(nom) < 28 * 0.12 + 1.2, "marge réduite pour un nom court (%.2f s)" % serveur.duree_max_segment(nom))
verifier(abs(serveur.duree_max_segment("x" * 200) - (200 * 0.12 + 1.2)) < 1e-9, "marge inchangée pour un long texte")
print("TOUT EST BON")
