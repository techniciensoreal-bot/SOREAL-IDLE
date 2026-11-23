# Outil de correction de textes SCUMM (Day of the Tentacle, CD français)

Corrige un texte DANS un script du jeu, même si la nouvelle chaîne est plus longue ou plus courte :
le décalage est répercuté partout (sauts, tailles de chunks, LOFF, index). Sans dépendance (Node seul).
Le dossier d'origine n'est jamais écrit : la sortie va dans un AUTRE dossier (seuls TENTACLE.000 et .001 y sont écrits).

- `lire-scumm.mjs` : lecteur (XOR 0x69, chunks, LOFF, index DROO/DSCR/DSOU/DCOS/DCHR, liste des 1494 scripts).
- `bytecode-v6.mjs` : décodeur de bytecode v6 (DOTT est en v6 pour ScummVM : id de script local sur 1 octet).
- `patcher-texte.mjs` : `node patcher-texte.mjs <jeu> <sortie> --cherche "ancien" --par "nouveau" [--tous] [--offset N] [--journal f.json]`
  (option répétable ; `\xNN` accepté ; accents français encodés en CP850 ; préfixe/suffixe communs retirés ;
  plusieurs corrections appliquées de la plus haute à la plus basse adresse).
- `verifier-scumm.mjs <dossier>` : (i) tous les scripts se décodent jusqu'à leur fin exacte et chaque saut vise un début d'instruction,
  (ii) chaque ressource d'index est au bon tag/taille, (iii) les chunks se suivent sans trou et la somme égale la taille du fichier.
- `comparer-scumm.mjs <original> <corrigé> <journal.json>` : chaque octet qui change doit être expliqué (taille, LOFF, saut, verbe, index).
- Pour un nouveau texte : lancer `verifier-scumm.mjs` sur l'original, patcher, relancer vérifier + comparer, puis tester dans ScummVM (miroir `DOTT-TEST`).
- Limite : le texte doit être une chaîne en ligne d'un script (talkActor, print, setObjectName...), hors codes 0xFF ; les textes d'autres fichiers (MONSTER.SOG) ne sont pas concernés.
- Le MD5 de TENTACLE.000/.001 change : ScummVM affiche « version inconnue » mais joue normalement (déjà le cas de la copie d'origine).
