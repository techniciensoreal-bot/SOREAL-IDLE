# Journal des sessions (Sonnet / Fable)

Plusieurs conversations Claude travaillent sur ce dépôt en alternance (Norman passe de l'une à l'autre). Ce journal est leur mémoire commune : lire en début de tour, ajouter UNE entrée en haut en fin de tour, la commiter avec le travail. Ne jamais réécrire les entrées de l'autre session.

Modèle d'entrée :

    ## <date et heure> — <Fable ou Sonnet>
    - Fait : (commits, hash courts)
    - En cours / non commité : (fichiers, état)
    - À vérifier par Norman : (ce à regarder dans le jeu)
    - Attention pour l'autre session : (fichiers sensibles, pièges)

---

## 2026-11-13 16:15 — Fable
- Fait : 10daceb8 (Walderp, voir l'entrée du dessous) puis un commit « feat(notes) » qui ajoute 4 lignes au groupe Aventure de la note 5.8 (cache-cache, Auto-kill, délai entre formes ; lignes neutres, sans nom de titan) + traduction anglaise. Rien de poussé : main a 3 commits d'avance sur origin/main.
- En cours / non commité : rien.
- À vérifier par Norman : inchangé (voir l'entrée du dessous) ; relire le texte des 4 lignes de la note.
- Attention pour l'autre session : j'ai lancé `marquer-nouveautes-push.mjs` (la liste verte ne contient plus que mes 4 lignes, comparées à origin/main : la relancer avant le push si tu ajoutes des lignes) et `maj-pins` (deux passes nécessaires quand le dictionnaire anglais change : le traducteur porte son numéro). Dictionnaire anglais réécrit (4 clés ajoutées).

## 2026-11-13 15:45 — Fable
- Fait : un commit local (hash : voir `git log`, sujet « walderp ») qui réunit trois points liés dans les mêmes fichiers : (1) Auto-kill de Walderp seulement après 3 kills sur la forme finale (wiki, `autoKillKills:3`, `titanFormesKillsAutoKillV1`) ; (2) délai entre deux formes réduit par les No Rebirth Challenges, plancher 60 min (`titanFound` reçoit le contexte) ; (3) cache-cache « comme dans le vrai jeu » : plus de bandeau ni d'indice, sa petite image apparaît dans un menu tiré parmi ceux que le joueur peut ouvrir, presque invisible puis de plus en plus visible, et il change de menu toutes les 3 minutes (`modules/walderp-cachette-v1.js`, `hideCycleMs`, `hiddenSeed`, image `/api/idle/media/titan?id=t5&sprite=menu`). Non poussé.
- En cours / non commité : rien de mon côté après ce commit. Pas de note de mise à jour écrite (à faire avant le push : ligne Walderp dans l'entrée 5.8).
- À vérifier par Norman : dans le vrai jeu, vaincre une forme 1 à 4 de Walderp puis le chercher dans les menus (image cliquable, position et taille) ; que `idle/Titans/Titan_WalderpFull.png` existe bien dans R2 (sinon l'image de la forme, puis un fantôme, s'affiche à la place) ; valeurs choisies faute de publication : opacité 4 % → 100 %, place de l'image, taille.
- Attention pour l'autre session : j'ai relancé `build-moteur-local`, `maj-pins` et `inventaire-visuels` (index.html, pins-assets.json, moteur local, catalogue des visuels changés) ; `WALDERP_HIDE_PANELS_V147` n'existe plus ; l'ancienne liste de cachettes contenait « inventaire » et « bestiaire », qui n'étaient plus des menus (Walderp y restait introuvable). Trois tests échouaient déjà AVANT mon travail, sur le code d'origine : `idle-graine-contenu-v1`, `idle-histoires-utiles-v1`, `idle-morts-boss-nouvelles-v1` (non traités). Avant de lire ces règles j'ai fait un `git stash` / `stash pop` de mes seuls fichiers (arbre propre à ce moment-là) ; je ne le referai pas. Le stash « augmentations-paire-electrogene-annulee » n'est pas le mien, je n'y ai pas touché.

## 2026-11-13 — Sonnet 5.5
- Fait : b947a2e5 (poussé) : note 5.8 « Le sang sans coupure » + traduction ; 197e8bba / b7fe45cb : cadre du haut de Blood Magic sur téléphone (nouvelle feuille `soreal-idle-blood-entete-tel-v1.css`, la feuille itopod.css est au plafond du test d'audit) ; 1b5cc7bb : la perruque (mort du boss 106) se joue aussi quand le 106 est tué en un coup avec Fight (`ui-combat-1-v1.js`, test `idle-mort-boss-106-one-shot-v1`) ; avant : portes d'Yggdrasil (images 1168×1168 sur R2 `idle/ygg-portes/`), correctif Wandoos (CAP et + : unités entières).
- En cours / non commité : rien (arbre propre, main = origin/main).
- À vérifier par Norman : la perruque du 106 tué en un coup ; le cadre de Blood Magic sur son téléphone (testé seulement par injection de HTML, pas sur la vraie page).
- Attention pour l'autre session : la note du jour 5.8 est dans `release-notes-v1.js` (compléter, ne pas écraser) ; après tout rebase ou pull, relancer `node cloudflare/tools/maj-pins.mjs` ; la CI de b947a2e5 n'a pas été vue (gh non connecté) ; le serveur local 8831 (preview « idle-local-ngu ») peut tourner : ne pas l'arrêter sans demande.
