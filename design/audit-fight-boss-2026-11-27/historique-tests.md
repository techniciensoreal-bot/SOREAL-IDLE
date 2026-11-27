# Audit Fight Boss, tranche historique / tests / décisions / scénarios (2026-11-27)

Lecture seule, HEAD 515ff0ac. Les références `fichier:ligne` ont été relues ; les hypothèses sont marquées "certitude basse".

## 1. Historique git (90 commits touchent les 5 fichiers de combat, dont ~30 `fix`)

Fichiers : `src/idle-runtime-boss.js` (1984 l.), `src/idle-runtime-combat.js` (1304 l.), `public/modules/ui-combat-1-v1.js` (2402), `ui-combat-2-v1.js` (2080), `combat-vie-modele-v1.js` (58). NB : la vraie boucle de simulation du combat vit dans `src/idle-runtime-progression.js` (`appliquerProgressionEnergieSorealIdle__p3..p7`, boucle `while` l.2157), pas dans les fichiers de la tranche.

### Symptômes corrigés plusieurs fois = zones fragiles

| Famille | Commits (date) | Lecture |
|---|---|---|
| Vie qui remonte / recule pendant le combat (barre joueur ou boss) | 9f7744c4 (10-17, boss tué serveur un instant avant le dernier coup local : le boss retrouve toute sa vie), 18f1b6ce (11-03, "cause à la racine", suppression du "le plus bas des deux"), 7af47fbb, 2e884901 ; tests v170-v178, `idle-regen-sans-recul`, `idle-vie-sans-recul-trajectoire`, `idle-boss-snapshot-sans-recul` ; règle Norman 2026-10-08 dans `idle-runtime-combat.js` (~l.200) | Zone la plus récurrente (6+ passes en 6 semaines). Cause structurelle : deux simulateurs (page et moteur) réconciliés par une tolérance de 3 points (`combat-vie-modele-v1.js:24`). Gravité moyenne, certitude haute que c'est fragile. |
| Boss déclaré vaincu / mort sans clic (fantôme) | V184 (`idle-runtime-progression.js:1010-1030`, test `fight-boss-no-phantom-kill-lore-v184`), cc65365d, dd235aa3, d03c7b30 (11-25/26 : Nuke et victoire remettaient à zéro le monstre d'Aventure), 13c7100a (seconde mort par-dessus une victoire), 6a4d6c58 (la victoire rejoue un vieux combat) | Récurrent. Les 3 derniers sont des interactions Fight Boss / Aventure / Nuke : le combat d'Aventure local partage des états avec le boss principal. Gravité moyenne. |
| Mauvaise image de boss à la mort / apparition | 5f2cdde0, fc5be4e2, 523dd7f2, 73b95541, c592d897, 1b5cc7bb, 1d615251 | 7 correctifs en 3 semaines (image du suivant à la place du tué, fondu, calque d'attente). Zone typique d'étrangetés visuelles. Gravité basse à moyenne. |
| Fight / Nuke / Renaissance : états périmés après transition | ac1a5b1b (NUKE non cliquable après renaissance), 111a3b01 (mur boss 20), V184 (Start en vol pendant NUKE : d'où `obsolete`, `idle-runtime-combat.js:142-155`), `idle-runtime-actions.js:1161-1162` ("après une renaissance, le boss est mort tout seul") | Contournements par drapeaux (`obsolete`, `ignore`, `dejaActif`) : machine à états implicite jamais formalisée. |
| Alignement des formules sur le jeu | de16a825 (Evil/Sadistic divisaient le BOSS au lieu du JOUEUR : stats fausses jusqu'au 11-20), 40f3e4f7 (regen boss x50), 7d23d19e (dégâts reçus / buff défense), c88eb799 (Nuke limité aux boss vaincus avant index 124, EXP 1re fois), f05e1e3a (fin à 301), a9f2e9bc (Auto Nuker seulement si tuable) | Le moteur a beaucoup divergé du jeu ; reste du non vérifié (section 3). |
| Morts de boss spécifiques | 1b5cc7bb (106 tué en un coup), 7049da79 ; tests `idle-mort-boss-{106,108,109,114}` | Cas codés par numéro de boss : fragile si l'ordre des événements change. |

### Régression connue
- `idle-morts-boss-nouvelles-v1` a échoué après 1b5cc7bb et a BLOQUÉ le déploiement (design/JOURNAL-SESSIONS.md:60) : la CI protège, mais ces tests lisent le code source (regex) et cassent dès qu'on déplace une condition.

### TODO / FIXME / "à valider" / "sciemment" / "choix SOREAL"
Aucun dans les 5 fichiers de la tranche (grep vide). Lié aux boss : repli x10/boss au-delà du 160 (registre `cloudflare/tests/references/constantes-soreal-v1.json`, "à valider par Norman" depuis 2026-11-09 ; AUDIT-COHERENCE point 7).

## 2. Tests existants (167 fichiers boss/combat/nuke/fight/victoire/mort/fuite/regen)

- Environ 129 sur 167 sont STATIQUES (regex sur le source) ; seulement ~38 exécutent le moteur. Exemples statiques : `idle-renaissance-arrete-fight-boss-v1` (3 assertions), `idle-synchro-perimee-boss-v1` (4), `idle-boss-fin-apres-301-v1` (12). Un test statique prouve qu'un garde existe, pas qu'il tient dans un enchaînement.
- Comportementaux utiles : `fight-boss-stop-restart-continuity`, `idle-nuke-garde-combat-aventure-v1`, `idle-victoire-prediction-v1`, `idle-evil-sadistic-joueur-divise-v1`, `idle-boss-regen-50-par-seconde-v1`, `idle-auto-nuke-boss-tuable-v1`, `idle-combat-vie-modele-v1`.
- Non couvert (grep sans résultat pertinent) :
  1. `debutMs` (début de combat rétroactif jusqu'à 5 s) : 1 seul fichier le cite ; double comptage de temps non testé.
  2. Rattrapage long avec combat actif : plafond `iterations < 2000` (`idle-runtime-progression.js:2159`), reste de `tempsRestant` non testé (certitude basse sur l'effet).
  3. Renaissance PENDANT un Fight actif avec snapshot client en vol : seulement un test statique.
  4. Enchaînement Fight, défaite, fuite, Fight avec snapshot client (le `pvJoueur` du snapshot peut SOIGNER le joueur jusqu'au max serveur : `idle-runtime-combat.js` ~l.160-185).
  5. Evil/Sadistic en combat réel de bout en bout (les tests portent surtout sur les constantes).
  6. Client contre moteur : la tolérance de 3 points n'est testée que sur le module isolé, pas page + moteur local (le banc Node ne reproduit pas un compte qui progresse, AGENTS.md).
  7. Deux appareils pendant un combat actif ; ancien export gardé (515ff0ac / 4aa34ce6) ; `stopBossOnOpen` (`idle-runtime-actions.js:90-104`).
  8. Nuke : seuil 124 (`nukeArretBossInedit_`), Nuke avec combat manuel en cours (`idle-runtime-combat.js:596`, bloc vide "Task 2"), Nuke autour du boss 300.
  9. Capacités de boss (fureur/paralysie/bouclier/sceau : `idle-runtime-boss.js:630-700`, `idle-runtime-catalogue.js:314-446`) : l'audit du jeu dit qu'elles n'existent PAS pour les boss principaux (boss-at-rebirth.md §5 point 1, "à lister") ; jamais listées ni testées. Si IDLE_BOSS en porte, le boss est plus dur que dans le jeu.

## 3. Décisions de Norman / points connus non résolus (design/ et mémoire)

- `design/audit-code-jeu/boss-at-rebirth.md` §5 non vérifié : (1) capacités de boss dans IDLE_BOSS ; (4) valeur exacte de hardModifier/sadisticModifier ; (7) `firstBossEver` remplacé par `records.highestBoss <= indice` ; (8) `sadisticBossMultiplier` float32 par victoire contre base au total (écart < 1e-5). §6 : E8 (niveaux AT du perk 18 avant déblocage) et E12 (barre d'énergie conservée au Rebirth) non corrigés ; E5 (mur du boss 20) retiré le 2026-11-20 (111a3b01) alors que le doc le liste encore "décision Norman".
- `project-audit-exhaustif-code-jeu-2026-11-16.md`, "Pas corrigé" : premier coup x1,5 de l'ennemi (Aventure), verrous d'achat du boss 17, bases Normal de No Equipment / 100 Levels.
- `AUDIT-COHERENCE-2026-11-09.md:36` : le Rebirth du Nuke auto part d'un `setInterval` de la page (`ui-amorcage-v1.js:970-988`), ne marche pas hors ligne ni sans onglet (non revérifié depuis).
- `project-a-faire-plus-tard-2026-11-05.md` : seuils d'animation de combat serré (25 %, 5 s) choisis par l'assistant, jamais validés visuellement par Norman.
- Mémoire "PRIORITÉ : Titans, deux bugs" (2026-10-11) : concerne Titans, statut non confirmé ici.
- Règle Norman 2026-11-03 ("pas de pansement, cause à la racine" pour la vie des barres) : `TOLERANCE_PCT = 3` est un tampon qui garde la vie de la page ; à rapprocher.

## 4. Pistes d'étrangetés relevées dans le code (non reproduites, certitude basse à moyenne)

- A. Début de combat rétro-daté (`idle-runtime-combat.js:23-29`, jusqu'à 5 s) alors que la progression a déjà rejoué ce temps hors combat : jusqu'à 5 s comptées deux fois. Gravité basse.
- B. Un double clic Fight renvoie `dejaActif` mais a déjà écrasé `PV_JOUEUR` par le snapshot et remis `DERNIERE_SYNCHRO` (~l.213-291). Gravité basse.
- C. Hors combat, un boss à 0 PV est restauré à son max (`idle-runtime-progression.js:1026-1030`, voulu par V184) : un boss presque mort à l'arrêt peut sembler "tout regagner". Gravité moyenne si reproductible.
- D. Snapshot de fuite/défaite : le joueur peut être soigné par la valeur du client (borne = max serveur), le boss ne peut que baisser. Une page en retard donne un joueur trop vivant.
- E. 2000 itérations max par synchro : un rattrapage long peut laisser du temps non consommé.
- F. Après un Nuke, un Fight lancé juste avant (Start en vol) est ignoré (`obsolete`, `ok:true`) : le joueur croit avoir lancé, rien ne se passe.

## 5. Quinze scénarios de bout en bout

Opérations (contrat `cloudflare/contracts/idle-protocol.json`) : `definirCombatBossSorealIdle(token, actif, raison ['defaite'|'fuite'], snapshot {bossSelection, pvJoueur, bossPv, debutMs})`, `nukerBossSorealIdle`, `renaitreSorealIdle`, `selectionnerBossSorealIdle`, `definirAutoBossSuivantSorealIdle`, synchro, `obtenirAccesSorealIdle`. Partie de test : tout débloqué, ressources au max ; rejouer en moteur local ET `?local=0` et comparer.

1. Fight puis double Fight en 50 ms : un seul combat (`dejaActif`), `fluxEssais` +1, vie joueur non remontée.
2. Fight avec snapshot `debutMs` = now-4900 puis lecture : comparer les PV du boss à un Fight sans `debutMs` (double comptage).
3. Fight jusqu'à la défaite (`raison:'defaite'`) puis Fight immédiat : joueur à 0 PV, boss garde ses PV, `fluxBossDefaites` +1 une seule fois.
4. Fight puis Fuite (`'fuite'`) avec un snapshot `pvJoueur` supérieur à la vie réelle : le joueur est-il soigné ? `fluxBossFuites` +1.
5. Fight, tuer le boss avec une synchro tardive (onglet en arrière-plan 60 s) : un seul boss vaincu, `combatBossActif=false`, suivant à PV pleins, `combatBossDepartFrais` faux.
6. Fight puis `nukerBossSorealIdle` en plein combat : combat arrêté, aucune victoire fantôme, barre du monstre d'Aventure intacte (dd235aa3 / d03c7b30).
7. Nuke en chaîne depuis le boss 120 : arrêt au 124 si non vaincu en Normal, puis sans restriction ; EXP "1re fois".
8. Fight puis `renaitreSorealIdle` aussitôt : `combatBossActif=false`, Nuke cliquable, boss non mort seul ; renvoyer un Fight avec l'ancien snapshot : réponse `obsolete`.
9. Fight, fermer l'onglet 5 min, rouvrir (`stopBossOnOpen`) : aucun boss tué pendant le chargement ; refaire avec un second appareil (conflit) et avec l'ancien export (exe SOREAL TV).
10. Atteindre les boss 300 puis 301 : Fight et Nuke arrêtés (`finDesBoss`), stats 69/69/420, aucun boss 302.
11. Evil puis Sadistic au boss 1 : joueur divisé par 1e30 (plancher 100) ; dégâts reçus et PV affichés identiques page/moteur.
12. Boss 106 tué en un coup avec Fight puis avec Nuke ; idem 108/109/114 : perruque jouée une fois, photo du 107 derrière, une seule apparition.
13. Combat très long (attaque faible, gros PV, synchro après 12 h, plus de 2000 pas) : temps non perdu, durée de classement non faussée.
14. Fight avec buffs (Blood Magic, Time Machine, Rich Jerks) qui expirent en plein combat : écart vie page/moteur ; chercher `combat_ecart:*` dans le journal de diagnostic.
15. Auto Nuker + `definirAutoBossSuivantSorealIdle`, page ouverte puis fermée : le Nuke auto ne part que si un boss est tuable ; contrôler le `setInterval` d'amorçage hors onglet ; mêmes résultats moteur local / serveur.

## 6. Limites
Lecture seule : aucun test lancé ni partie réelle. Les pistes A-F viennent de la lecture du code, non reproduites.
