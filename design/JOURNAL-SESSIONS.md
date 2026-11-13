# Journal des sessions (Sonnet / Fable)

Plusieurs conversations Claude travaillent sur ce dépôt en alternance (Norman passe de l'une à l'autre). Ce journal est leur mémoire commune : lire en début de tour, ajouter UNE entrée en haut en fin de tour, la commiter avec le travail. Ne jamais réécrire les entrées de l'autre session.

Modèle d'entrée :

    ## <date et heure> — <Fable ou Sonnet>
    - Fait : (commits, hash courts)
    - En cours / non commité : (fichiers, état)
    - À vérifier par Norman : (ce à regarder dans le jeu)
    - Attention pour l'autre session : (fichiers sensibles, pièges)

---

## 2026-11-13 (suite, vers 19 h réelles) — Fable
- Fait : commit local « fix(perks, quirks) bonus distincts multipliés » : dans `perkBonusesV1` et `quirkBonusesV1`, les bonus en pourcentage d'entrées DISTINCTES se multiplient (niveaux d'une même entrée additionnés) pour : attaque/défense, stats d'Aventure, puissance, cap et barres d'énergie et de magie (`PERK_CLES_PRODUIT_V1`, `QUIRK_CLES_PRODUIT_V1`). Mesuré au banc, séries 3 à 7 (`cloudflare/tools/banc-vrai-jeu/resultats/`). Les autres clés (vitesse des NGU, PP, drop…) restent additionnées, non mesurées.
- En cours / non commité : rien.
- À vérifier par Norman : NON MESURÉ : le cumul entre deux paliers d'une même famille d'atouts (Energy Power I x II…, actifs en Evil / Sadistic). La multiplication y est appliquée par cohérence ; la série 8 (Evil) a été interrompue à la demande de Norman (seule la base est relevée : cap 3 571). Les souhaits d'énergie / magie / Aventure sont encore additionnés (non mesurés) ; quirks de magie : appliqués par analogie avec l'énergie.
- Attention pour l'autre session : Norman trouve le banc trop long et gênant (le jeu prend le premier plan toutes les 75 s) : ne pas lancer de série sans son accord. Pistes : cliquer « Save Game » pour ne pas attendre l'enregistrement automatique, regrouper plusieurs mesures par essai, lancer les séries quand il n'est pas devant l'écran.

## 2026-11-13 (suite, vers 17 h 45 réelles) — Fable
- Note : les heures de mes entrées précédentes du jour sont approximatives et trop tardives (écrites sans lire l'horloge) ; l'ordre, lui, est juste.
- Fait : commit local « fix(quirks, wishes) » : quirks DISTINCTS et souhaits DISTINCTS d'attaque/défense multipliés entre eux (niveaux d'une même entrée additionnés), comme les atouts. Mesuré dans le vrai jeu en Evil : quirks 7x100 + 51x50 = x4 ; souhaits 0x1 + 5x3 = x8 ; 5x2 + 30x2 = x9 ; atout 4 x quirk 7 = x4. Nouveau test `idle-stat-multiplie-entre-entrees-v1`. Ligne de note 5.8 (ITOPOD) complétée + traduction.
- Fait aussi : le BANC DE COMPARAISON AVEC LE VRAI JEU est dans le dépôt : `cloudflare/tools/banc-vrai-jeu/` (lire LISEZMOI.md). Boucle entièrement automatique, environ 75 s par essai : écrire une sauvegarde modifiée, lancer NGU Idle, cliquer « Load Autosave », attendre l'enregistrement automatique, fermer, relire.
- En cours / non commité : rien. Six commits locaux non poussés (atouts, palier 377, quirks et souhaits, journal).
- À vérifier par Norman : rien à faire dans le jeu. Pistes suivantes pour le banc : souhait 189 (1 % ou 100 % par niveau), bonus d'énergie et de magie (additionnés ou multipliés entre atouts, quirks, souhaits), stats d'Aventure, NGU, barbes, mineurs, vitesses.
- Attention pour l'autre session : le banc lance le vrai jeu et prend la souris une seconde à chaque essai ; ne pas le lancer pendant que Norman utilise la machine sans le prévenir. Un fichier `steam_appid.txt` a été ajouté dans le dossier d'installation de NGU Idle (hors dépôt). `NGUSaveSteam.txt` du jeu est réécrit par chaque essai.

## 2026-11-13 20:30 — Fable
- Fait : commit local « fix(perks) palier 377 » : MESURÉ DANS LE VRAI JEU (build 1260, copies A/B/C rechargées et sauvegardées par Norman) : Newbie 1 + Rich Perks I 40 = x10,00000 ; Fibonacci 377 seul = x3,77000 ; Newbie + Fibonacci 377 = x7,54000 (attaque et défense). Donc les atouts distincts se multiplient (b61d8fdf confirmé) et le palier 377 vaut x3,77, pas x4,77 : `statPct` 2,77 dans `fibonacciMilestones`. L'indice de `adventure.itopod.perkLevel` = l'id d'atout de SOREAL (4, 5, 94 confirmés). Référence `synchro-appels-avant.json` régénérée. Non poussé.
- En cours / non commité : rien.
- À vérifier par Norman : sa vraie sauvegarde `NGUSaveSteam.txt` a été réécrite par l'enregistrement automatique du jeu pendant l'essai B (elle contient Fibonacci 377) ; l'originale est recréée à l'identique dans `NGUSaveSteam-ORIGINAL-avant-essais.txt`, à lui de la remettre en place.
- Attention pour l'autre session : méthode validée pour comparer au vrai jeu : modifier une COPIE de sauvegarde, la faire recalculer par le jeu, relire. Outils encore dans mon dossier temporaire (lecteur NRBF, modificateur signé MD5), pas dans le dépôt.

## 2026-11-13 19:50 — Fable
- Fait : hors dépôt uniquement. Trois copies modifiées de la sauvegarde du vrai NGU Idle de Norman, écrites à côté de l'originale (inchangée) dans le dossier de sauvegardes du jeu (AppData, LocalLow, NGU Industries, NGU Idle) : `SOREAL-essai-A/B/C-*.txt` (atouts d'attaque/défense montés ; somme de contrôle = MD5 des données internes). Aucun fichier du dépôt modifié.
- En cours / non commité : rien dans le dépôt. b61d8fdf (atouts multipliés) toujours non poussé.
- À vérifier par Norman : charger chaque copie dans le vrai jeu, sauvegarder sous un autre nom, me donner les fichiers : on saura si les atouts se multiplient et si le palier 377 vaut x3,77 ou x4,77.
- Attention pour l'autre session : hypothèse non prouvée : l'indice du tableau `adventure.itopod.perkLevel` de la sauvegarde = l'id d'atout de SOREAL (4, 5, 94).

## 2026-11-13 19:20 — Fable
- Fait : commit local « fix(perks) » : les atouts d'attaque/défense DISTINCTS se multiplient (niveaux d'un même atout additionnés), `statMultiplier` de `perkBonusesV1` ; palier 377 de Fibonacci = facteur à part x4,77. Ligne ajoutée à la note 5.8 (groupe ITOPOD) + traduction. Parties de référence régénérées (changement de règle voulu : attaque x1,47 sur la partie 1). Non poussé.
- En cours / non commité : rien. Hors dépôt : j'ai décodé une sauvegarde du VRAI NGU Idle de Norman (format .NET BinaryFormatter, deux couches base64) dans mon dossier temporaire ; lecteur et comparaisons à reprendre dans le dépôt si Norman valide le banc de comparaison.
- À vérifier par Norman : premières comparaisons vrai jeu / SOREAL sur sa sauvegarde (boss 15, 2 Rebirths) : stats du boss 15 identiques ; facteur de temps de Rebirth identique (7,0049) ; attaque et défense de base (niveau^1,3 x valeur) x (1 + équipement %) identiques à 0,001 % près. Les Quirks et Wishes d'attaque/défense sont encore ADDITIONNÉS (même question que les atouts, non traitée faute de source).
- Attention pour l'autre session : suite complète verte avec SOREAL_IDLE_VERIF_BONUS=1, sauf les deux tests liés à `desktop/graine/catalogue.json` (local). Moteur local reconstruit, `maj-pins` et `marquer-nouveautes-push` relancés (liste verte : 1 ligne).

## 2026-11-13 18:10 — Fable
- Fait : recherche sur internet pour le palier 377 de Fibonacci (aucune source ne le chiffre directement). Aucun code modifié.
- En cours / non commité : rien.
- À vérifier par Norman : écart PROBABLE plus large que le palier 377 : le jeu ADDITIONNE tous les atouts d'attaque/défense (`statPct`, `perkBonusesV1`), alors que l'exemple de la page wiki « Evil difficulty » (100 000 % × 500 % × Newbie = 1 M %) et un message Steam de jshepler citant le code du jeu les MULTIPLIENT entre atouts distincts (additif seulement entre les niveaux d'un même atout). Correctif non fait : décision de Norman attendue.
- Attention pour l'autre session : ne pas corriger `statPct` sans cette décision (touche l'accès à Evil, `idleNguItopodStatBonusPctV1`).

## 2026-11-13 17:40 — Fable
- Fait : déploiement n° 1361 (39103382) réussi et vérifié : Walderp, la note 5.8 et le travail du matin sont en ligne. Puis audit en lecture seule de l'atout Fibonacci (perk 94) : les 16 paliers sont appliqués par le moteur (mesuré palier par palier avec le vrai moteur). Aucun code modifié.
- En cours / non commité : rien.
- À vérifier par Norman : palier 377 de Fibonacci. Le wiki écrit « 377% Attack/Defense multiplier » ; le jeu l'applique comme +377 % ajouté aux autres atouts d'attaque/défense (x4,77 seul), pas comme x3,77. Lecture à trancher, aucune autre page du miroir n'en parle.
- Attention pour l'autre session : rien de sensible.

## 2026-11-13 17:00 — Fable
- Fait : commit « fix(tests) » : `idle-morts-boss-nouvelles-v1` cherchait encore l'ancienne condition de la mort de boss, changée par 1b5cc7bb ; il échouait donc depuis ce matin et BLOQUAIT le déploiement (le push b947a2e5 n'a très probablement jamais été mis en ligne : Norman ne voyait aucune nouvelle version). Assertion alignée sur `((memeBoss&&debutCombatV1)||speciale)`. Puis push de main sur ordre de Norman (journal, Walderp 10daceb8, note 8303b577, ce correctif).
- En cours / non commité : rien.
- À vérifier par Norman : que la nouvelle version arrive bien en ligne (onglet Actions de GitHub : `gh` n'est pas connecté ici, je ne peux pas lire la CI) ; puis Walderp, la perruque du 106 en un coup et le cadre de Blood Magic sur téléphone, qui arrivent tous avec ce déploiement.
- Attention pour l'autre session : suite complète verte avant le push, sauf `idle-graine-contenu-v1` et `idle-histoires-utiles-v1`, qui échouent SEULEMENT ici à cause de `desktop/graine/catalogue.json` (fichier local ignoré par git, incomplet : textes / histoires manquants) et passent dans une copie propre du dépôt. Après un changement de code, relancer le test voisin du même sujet, pas seulement le nouveau.

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
