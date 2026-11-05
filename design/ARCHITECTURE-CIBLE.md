# SOREAL IDLE — architecture cible (reconstruction « comme si tout avait été planifié »)

Demande de Norman (2026-11-05) : « Recommencer à 0 en conservant l'avancée de chaque joueur, chaque visuel, chaque effet. Mais que le projet soit reconstruit comme s'il avait été fait suivant un plan et respecté à la lettre. Chaque appel, chaque
dessin, tout doit être pensé pour que le jeu tourne à merveille. Sans aucun recul, avec une extrême justesse. »

Ce document est le PLAN. Rien n'est reconstruit tant qu'il n'est pas validé. Il dit ce qui existe (mesuré), ce qui est visé, dans quel ordre, avec quelles preuves, et ce que cela coûte.

## 1. L'état des lieux (mesuré le 2026-11-05)
- Moteur : 86 fichiers, 52 700 lignes (`cloudflare/src`). Né comme un portage d'un script de tableur : chaque opération relit la ligne du joueur, la normalise, recalcule, réécrit ; 5 synchronisations complètes par opération, ~70 calculs de bonus avec une clé de mémo = tout l'état sérialisé. Allocation ≈ 80 ms sur la partie de Norman.
- Écran : 217 fichiers, 86 600 lignes (`cloudflare/public/modules`), 25 000 lignes dans l'ancien monolithe d'interface, 13 900 lignes de CSS dont 2 539 `!important`. L'écran garde sa PROPRE copie de l'état et sa propre prédiction de chaque barre, recalée à chaque réponse du moteur.
- Tests : 1 161 fichiers. C'est le vrai capital du projet : ils décrivent le comportement voulu, règle par règle, et les audits (`audit-architecture`) tiennent des plafonds.
- Les couches de rattrapage sont visibles dans le code : une barre de la Machine temporelle avait 6 endroits qui calculent sa position (ancre de réponse, recalcul local au clic, fondu de 600 ms, barre immobile, projection avec passage de niveau, patch de réponse).
- Cause racine des reculs (prouvée par des tests écran/moteur) : DEUX modèles de la même barre + un recalage à chaque réponse. Aucune rustine ne peut supprimer cela ; seule une architecture à source unique le peut.

## 2. Principes (non négociables)
1. **Une seule source de vérité par donnée de jeu** : l'état du joueur vit dans le Worker local, en mémoire. L'écran ne contient AUCUNE formule de jeu : il peint ce que le moteur publie.
2. **Le temps est une donnée** : chaque valeur qui évolue est publiée sous la forme (valeur, taux, instant) ; l'écran la peint à l'instant de l'image avec la même formule pour toutes les barres (une fonction, un test).
3. **Aucune action n'attend le réseau ni un gros calcul pour être visible** : l'action est appliquée localement à l'état résident (microsecondes), l'écran la voit à l'image suivante ; le serveur reçoit les sauvegardes.
4. **Un cycle de rendu unique** (une boucle `requestAnimationFrame`) : chaque menu déclare ce qu'il lit et ce qu'il dessine ; budget par image (≤ 8 ms de script, médiane 16,7 ms, < 1 % d'images > 20 ms, aucune > 50 ms) mesuré en continu.
5. **Des contrats typés entre couches** : protocole moteur ↔ écran versionné (`idle-protocol.json` déjà là), schéma de sauvegarde versionné avec migrations testées, plus de champ qui apparaît par accident.
6. **Les règles d'`AGENTS.md` deviennent des tests structurels** (anti-spoil, redessin invisible, boucles parfaites, préférences liées au compte, fidélité wiki) : un menu reconstruit ne peut pas être fusionné s'il les viole.
7. **Rien n'est jamais perdu** : aucune partie, aucun visuel, aucun effet, aucun son ne disparaît (voir § 5).

## 3. Architecture visée
- **Noyau de jeu (Worker local)** : `Etat` résident (structures typées, pas de relecture JSON), `Horloge` (heure du serveur), `Systemes` (un module par système : Machine temporelle, Augmentations, Entraînement, Blood Magic, NGU, Wandoos, Yggdrasil…) avec la même interface `avancer(dt)`, `appliquer(action)`, `publier()`. Les bonus sont des valeurs dérivées avec invalidation EXPLICITE (compteur de version), plus de clé « état sérialisé ».
- **Publication** : un seul flux Worker → page (SharedArrayBuffer ou messages groupés) qui porte les valeurs animées (barres, ressources, Or) ; les données rares (inventaire, catalogues) passent par des messages d'état différentiels.
- **Rendu** : un module `Rendu` possède la boucle d'images ; les barres rapides sont peintes en `canvas` (jamais en largeur de `div`), les textes ne sont réécrits que quand leur valeur formatée change, aucun redessin de page entière (règle n°4 appliquée par construction).
- **Pages** : un module par menu, chargé à la demande, qui ne contient que du dessin et des gestes ; plus de logique de jeu côté page.
- **Sauvegarde et appareils** : inchangés dans leur contrat (règle n°7 : un seul appareil joue, reprise de la partie la plus récente, sauvegardes de sécurité, import/export), mais adossés à l'état résident (le Worker jette son état à chaque reprise).
- **Serveur** : chat, classements, comptes, administration, sauvegarde (inchangé).

## 4. Méthode : reconstruire SANS rien casser
Une réécriture totale « à zéro » en une fois est le chemin le plus sûr vers des régressions invisibles (1 161 tests, 2 672 commits d'histoire de décisions de Norman). On reconstruit donc par **remplacement progressif, système par système**, avec des preuves à chaque pas :
1. **Parties de référence (« golden saves »)** : N sauvegardes figées (dont celle de Norman, avec son accord) + leur état attendu après T secondes de jeu scripté. Toute reconstruction doit reproduire ces états À L'IDENTIQUE (progression, ressources, niveaux, inventaire).
2. **Catalogue des visuels et effets** : inventaire exhaustif (chaque animation, son, effet, page) avec une capture de référence rejouable ; comparaison à chaque étape. Rien n'est retiré sans accord.
3. **Bancs de preuve** : banc des barres (reculs + fluidité, déjà écrit), tests écran/moteur par barre (Machine temporelle, Augmentations déjà faits), tests de reprise multi-appareils (déjà écrits).
4. **Ordre** (chaque étape livrable, jouable, poussée) :
   1. Noyau résident + publication unifiée (moteur) avec les parties de référence au vert ;
   2. Rendu unique + barres en canvas ; Machine temporelle migrée (preuve : 0 recul, budget de fluidité) ;
   3. Augmentations, Entraînement, Blood Magic, NGU, Wandoos, Yggdrasil… un par un ;
   4. Pages sans logique de jeu ; suppression des anciens chemins ; réduction du CSS (`!important` à zéro par menu migré) ;
   5. Audit final : plus aucun fichier hérité de l'ancien monolithe.
5. **Chaque étape se termine par** : suite complète verte, banc des barres vert, parties de référence identiques, vérification visuelle par Norman, note du jour.

## 5. Ce qui est conservé (liste de contrôle, à compléter avec Norman)
- Toutes les parties joueur (ligne `JOUEURS`, 38 colonnes, JSON d'état), sauvegardes, historique des sauvegardes de sécurité, comptes, classements, chat.
- Tous les textes (chroniques, histoires, popups), toutes les voix (R2), toutes les traductions, tous les sons et musiques.
- Tous les visuels : borne d'arcade, menus, animations de mort et de retour, effets (orage, feu…), Album, Coffre, Valise, Garderie…
- Toutes les règles de jeu validées contre le wiki (règle n°1).
- Tous les tests existants : un test qui lit l'ancien code est ADAPTÉ à la nouvelle structure, jamais supprimé sans équivalent.

## 6. Coût et risques (honnêtes)
- Ordre de grandeur : plusieurs semaines de travail continu, pas une session. Le noyau résident (étape 1) et le rendu unique (étape 2) sont la part difficile ; ensuite chaque menu est un lot de 1 à 3 jours.
- Risque n°1 : une régression silencieuse de comportement. Parade : parties de référence + tests écran/moteur + validation visuelle par Norman à chaque lot.
- Risque n°2 : figer le jeu trop longtemps. Parade : le jeu reste jouable et déployé à chaque étape ; les demandes en attente (barre de vie, ballon, borne, filtre du coffre) s'intègrent dans la nouvelle structure au lieu d'ajouter de la dette.
- Hors périmètre : Unity (abandonné), l'exe et l'APK (reconstruits par mise à jour comme aujourd'hui).

## 7. Décisions à prendre par Norman
1. Valider le principe « remplacement progressif avec preuves » plutôt qu'une réécriture d'un bloc.
2. Autoriser l'usage de sa partie (anonymisée dans le dépôt) comme partie de référence.
3. Valider l'ordre (noyau résident → rendu unique → Machine temporelle → autres menus).
4. Dire si les demandes en attente passent AVANT, PENDANT ou APRÈS la reconstruction.
