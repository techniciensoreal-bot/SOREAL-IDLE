# Journal des sessions (Sonnet / Fable)

Plusieurs conversations Claude travaillent sur ce dépôt en alternance (Norman passe de l'une à l'autre). Ce journal est leur mémoire commune : lire en début de tour, ajouter UNE entrée en haut en fin de tour, la commiter avec le travail. Ne jamais réécrire les entrées de l'autre session.

Modèle d'entrée :

    ## <date et heure> — <Fable ou Sonnet>
    - Fait : (commits, hash courts)
    - En cours / non commité : (fichiers, état)
    - À vérifier par Norman : (ce à regarder dans le jeu)
    - Attention pour l'autre session : (fichiers sensibles, pièges)

---

## 2026-11-13 — Sonnet 5.5
- Fait : b947a2e5 (poussé) : note 5.8 « Le sang sans coupure » + traduction ; 197e8bba / b7fe45cb : cadre du haut de Blood Magic sur téléphone (nouvelle feuille `soreal-idle-blood-entete-tel-v1.css`, la feuille itopod.css est au plafond du test d'audit) ; 1b5cc7bb : la perruque (mort du boss 106) se joue aussi quand le 106 est tué en un coup avec Fight (`ui-combat-1-v1.js`, test `idle-mort-boss-106-one-shot-v1`) ; avant : portes d'Yggdrasil (images 1168×1168 sur R2 `idle/ygg-portes/`), correctif Wandoos (CAP et + : unités entières).
- En cours / non commité : rien (arbre propre, main = origin/main).
- À vérifier par Norman : la perruque du 106 tué en un coup ; le cadre de Blood Magic sur son téléphone (testé seulement par injection de HTML, pas sur la vraie page).
- Attention pour l'autre session : la note du jour 5.8 est dans `release-notes-v1.js` (compléter, ne pas écraser) ; après tout rebase ou pull, relancer `node cloudflare/tools/maj-pins.mjs` ; la CI de b947a2e5 n'a pas été vue (gh non connecté) ; le serveur local 8831 (preview « idle-local-ngu ») peut tourner : ne pas l'arrêter sans demande.
