# Banc de comparaison avec le vrai NGU Idle

But : vérifier un calcul de SOREAL IDLE contre le vrai jeu (build 1260) sans y jouer. On écrit l'état voulu dans une copie de sauvegarde, le vrai jeu la charge et recalcule ses statistiques, on relit ce qu'il a enregistré.

Mis en place le 2026-11-13 avec Norman, qui ne joue plus à NGU Idle et a autorisé la modification de ses sauvegardes.

## Fichiers

- `nrbf.mjs` : lecteur du format de sauvegarde (.NET BinaryFormatter). La sauvegarde est un base64 qui contient `SaveData { playerData, checksum }` ; `playerData` est un second base64 ; `checksum` est le MD5 (base64) des données internes.
- `banc.mjs` : `ouvrir`, `poser(chemin, valeur)` (écriture sur place d'un nombre, sans changer la taille du fichier), `enregistrer` (recalcule le MD5), `passer(changements)` (boucle complète), `facteurs` (attaque et défense divisées par entraînement de base x équipement x NUMBER, difficulté normale seulement).
- `fen.ps1` : capture de la fenêtre du jeu et clic à une position de la fenêtre. Le clic est ANNULÉ si NGU Idle n'est pas la fenêtre active ; la souris est remise à sa place.
- `serie.mjs` : `node serie.mjs essais.json resultats.json` enchaîne des essais (environ 75 s chacun).
- `resultats/` : essais et valeurs relevées.

## Ce qu'il faut savoir

- Les chemins (dossier de sauvegardes, exécutable du jeu) sont ceux de la machine de Norman, en tête de `banc.mjs`.
- Le jeu doit pouvoir se lancer directement : un fichier `steam_appid.txt` contenant `1147690` a été posé dans son dossier. Sans lui, l'exécutable se relance par Steam, qui demande une confirmation.
- Ne passer AUCUN argument de lancement (Steam demande une confirmation à chaque fois). La taille de fenêtre 1280 x 800 est mémorisée par le jeu ; les positions de clic en dépendent (« Load Autosave » 258,712 ; « On To The Game! » 410,778).
- Le jeu enregistre tout seul environ 60 s après l'entrée en jeu, pas à la fermeture.
- La base de chaque essai est `NGUSaveSteam-ORIGINAL-avant-essais.txt` (boss 15, 2 Rebirths, tout à zéro). `NGUSaveSteam.txt` est réécrit à chaque essai.
- Indices confirmés : `adventure.itopod.perkLevel[id]`, `beastQuest.quirkLevel[id]`, `wishes.wishes[id].level` utilisent les mêmes ids que SOREAL. Difficulté : `settings.rebirthDifficulty.value__` (0 normal, 1 Evil, 2 Sadistic). En Evil, comparer les essais entre eux (l'attaque est divisée par 1e30 et `facteurs` ne s'applique pas).
- Limites voulues : ne rien modifier de ce qui s'achète avec de l'argent réel ; éviter de faire sauter la progression des boss (succès Steam).
- On mesure le comportement du jeu ; on ne lit pas son code.
