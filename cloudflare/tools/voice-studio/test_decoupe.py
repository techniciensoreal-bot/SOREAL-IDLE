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
# 6. Une RÉPLIQUE courte n'est jamais coupée (Norman, 2026-10-04 : « la génération de voix ne lit pas tout, ça génère quelques mots et ça s'arrête ») : pause naturelle de 0,45 s après la virgule,
#    suite plus courte que le début -- l'ancien garde-fou la prenait pour du baratin et supprimait la fin.
replique = "Bonjour, je m'appelle Marius."
verifier(not serveur.est_nom_court(replique), "une réplique avec ponctuation n'est pas un nom court")
verifier(serveur.est_nom_court(nom) and serveur.est_nom_court("Gros Boss") and serveur.est_nom_court("Gros Boss."), "les noms et titres restent des noms courts")
verifier(not serveur.est_nom_court("Oui, bien sûr !") and not serveur.est_nom_court("Un, deux"), "ponctuation interne : jamais un nom")
parle = torch.cat([parole(1.0), silence(0.45), parole(0.7)], dim=1)
sortie, coupe = serveur.retirer_queue_inventee(parle, SR, replique)
verifier(not coupe and duree(sortie) == duree(parle), "la fin d'une réplique après une pause de 0,45 s est conservée (%.2f s)" % duree(sortie))
verifier(abs(serveur.duree_max_segment(replique) - (len(replique) * 0.12 + 1.2)) < 1e-9, "durée plausible généreuse pour une réplique (pas la limite serrée des noms)")
# 7. « T'es vraiment un connard, Chad... » : Marius disait « Chad » deux fois (Norman, 2026-10-04) -- le point de suspension final fait redire le dernier mot.
verifier(serveur.sans_suspension_finale("T'es vraiment un connard, Chad...") == "T'es vraiment un connard, Chad.", "points de suspension finaux remplacés par un point")
verifier(serveur.sans_suspension_finale("Attends... quoi ?") == "Attends... quoi ?", "les points de suspension au milieu d'une phrase restent")
verifier(serveur.sans_suspension_finale("Chad …") == "Chad.", "le caractère « … » final aussi")
verifier(serveur.sans_suspension_finale("...") == "...", "un segment fait seulement de points reste tel quel")
verifier(serveur.REPETITION_PENALTY > 2.0, "pénalité de répétition du modèle relevée (%.1f au lieu de 2,0)" % serveur.REPETITION_PENALTY)
# 8. Respirations et temps d'arrêt (Norman, 2026-10-08) : le souffle / silence de début et de fin d'un segment est rogné ; le milieu (pauses naturelles) est conservé.
def souffle(duree_s):
    return 0.03 * torch.randn(1, int(SR * duree_s))      # bruit faible, comme une inspiration (≈ 8 % du pic de la parole, sous le seuil de 10 %)


segment = torch.cat([souffle(0.50), parole(1.0), silence(0.12), parole(0.6), souffle(0.70)], dim=1)   # 0,5 + 1,0 + 0,12 + 0,6 + 0,7 = 2,92 s
coupe = serveur.couper_bords(segment, SR)
verifier(duree(coupe) < duree(segment) - 0.8, "le souffle de début (0,5 s) et de fin (0,7 s) est rogné (%.2f s au lieu de %.2f s)" % (duree(coupe), duree(segment)))
verifier(1.7 < duree(coupe) < 2.2, "il reste la parole (1,72 s) et de courtes marges (%.2f s)" % duree(coupe))
fenetre = int(SR * 0.02)
debut_rms = coupe[0, :fenetre * 3].pow(2).mean().sqrt().item()
verifier(debut_rms < 0.2, "début en fondu, sans claquement")
fin_rms = coupe[0, -fenetre:].pow(2).mean().sqrt().item()
verifier(fin_rms < 0.02, "fin en fondu, sans claquement")
rms_apres, _, nb_apres = serveur.energie_fenetres(coupe, SR)
verifier(nb_apres > 0, "énergie mesurable")
sans_parole = souffle(1.0)
verifier(serveur.couper_bords(sans_parole, SR).shape == sans_parole.shape or duree(serveur.couper_bords(sans_parole, SR)) <= duree(sans_parole), "sans parole identifiable : rien de cassé")
verifier(duree(serveur.couper_bords(parole(0.05), SR)) <= 0.06, "segment minuscule : pas de plantage")
# bornes (fenêtres de 20 ms) : un souffle isolé d'une seule fenêtre ne compte pas comme parole
verifier(serveur.bornes_parole([False, True, False, False, True, True, True, True, False, True, False, False]) == (0, 12), "une fenêtre isolée n'est pas de la parole ; marges comprises : (0, 12)")
verifier(serveur.bornes_parole([False] * 30 + [True] * 10 + [False] * 30, 4, 8) == (26, 48), "marges de 80 ms avant et 160 ms après la parole")
verifier(serveur.bornes_parole([False] * 20) is None, "aucune parole : pas de bornes")
fini = serveur.avec_silence_final(parole(0.5), SR)
verifier(abs(duree(fini) - (0.5 + serveur.SILENCE_FINAL_S)) < 0.01 and fini[0, -10:].abs().max().item() == 0.0, "le fichier se termine par un vrai silence de %.2f s" % serveur.SILENCE_FINAL_S)
verifier(serveur.RACCORD_S >= 0.2, "raccord de %.2f s entre deux segments (vrai silence)" % serveur.RACCORD_S)

# 6. Plafond de jetons (Norman, 2026-10-15 : « énormément de dérapage, ça met une éternité à générer ») : un segment qui dérape s'arrête au plafond de sa durée plausible, au lieu de tourner 1000 jetons.
nom = "Un Type Bizarre"
recit = "Il était une fois un magicien qui vivait au fond d'une grotte sombre, loin de tout, avec pour seule compagnie sa vieille chouette."
pn, pr = serveur.plafond_jetons(nom), serveur.plafond_jetons(recit)
verifier(0 < pn < 100, "plafond d'un nom court : %d jetons (au lieu de 1000)" % pn)
verifier(pn < pr < 1000, "plafond d'un récit : %d jetons, plus large que celui d'un nom" % pr)
verifier(abs(pr - int((serveur.duree_max_segment(recit) + serveur.MARGE_PLAFOND_S) * 25) - 10) <= 1, "plafond = durée plausible + 1 s, à 25 jetons par seconde")


class FauxT3:
    def __init__(self):
        self.vu = []

    def inference(self, **kwargs):
        self.vu.append(kwargs.get("max_new_tokens"))
        return "jetons"


class FauxModele:
    sr = SR

    def __init__(self, duree_audio):
        self.t3 = FauxT3()
        self.duree_audio = duree_audio

    def generate(self, segment, **reglages):
        self.t3.inference(max_new_tokens=1000)
        return parole(self.duree_audio)


faux = FauxModele(2.0)
serveur.installer_plafond(faux)
serveur.installer_plafond(faux)   # idempotent
serveur._plafond_jetons[0] = 123
faux.t3.inference(max_new_tokens=1000)
verifier(faux.t3.vu[-1] == 123, "t3.inference plafonné à 123 jetons au lieu de 1000")
serveur._plafond_jetons[0] = 0
faux.t3.inference(max_new_tokens=1000)
verifier(faux.t3.vu[-1] == 1000, "sans plafond posé : valeur d'origine conservée")
faux2 = FauxModele(2.0)
serveur.installer_plafond(faux2)
serveur.generer_segment(faux2, recit, {"exaggeration": 0.5, "cfg_weight": 0.5})
verifier(faux2.t3.vu == [pr], "generer_segment pose le plafond du segment avant la génération (%s)" % faux2.t3.vu)
verifier(serveur._plafond_jetons[0] == 0, "plafond remis à zéro après une génération réussie")
derape = FauxModele(60.0)
serveur.installer_plafond(derape)
sortie = serveur.generer_segment(derape, nom, {"exaggeration": 0.5, "cfg_weight": 0.5})
verifier(len(derape.t3.vu) == 3 and all(v == pn for v in derape.t3.vu), "dérapage : trois essais, chacun plafonné à %d jetons (%s)" % (pn, derape.t3.vu))
verifier(duree(sortie) <= serveur.duree_max_segment(nom) + 0.01, "dérapage : le résultat final est coupé à la durée plausible (%.1f s)" % duree(sortie))
verifier(serveur._plafond_jetons[0] == 0, "plafond remis à zéro après un dérapage")

# 6. Ton interrogatif (Norman, 2026-10-21) : une question est un segment à elle, le « ? » colle au mot, la montée finale n'est pas rognée.
verifier(serveur.decouper("Bonjour. Comment vas-tu ? Très bien. Vraiment ?") == ["Bonjour.", "Comment vas-tu ?", "Très bien.", "Vraiment ?"], "chaque question forme son propre segment")
verifier(serveur.normaliser_texte("Tu viens ? Oui !") == "Tu viens? Oui!", "pas d'espace avant ? et !")
verifier(serveur.est_question("Tu viens ?") and serveur.est_question("« Tu viens ? »") and not serveur.est_question("Tu viens."), "détection d'une question")
phrase_q = torch.cat([parole(0.8), silence(0.10), 0.03 * parole(0.25), silence(0.6)], dim=1)   # montée finale très douce
verifier(duree(serveur.couper_bords(phrase_q, SR, True)) > duree(serveur.couper_bords(phrase_q, SR, False)) + 0.1, "question : la montée finale douce est gardée (%.2f s contre %.2f s)" % (duree(serveur.couper_bords(phrase_q, SR, True)), duree(serveur.couper_bords(phrase_q, SR, False))))

print("TOUT EST BON")
