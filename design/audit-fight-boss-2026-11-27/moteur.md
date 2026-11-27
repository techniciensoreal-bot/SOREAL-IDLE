# Audit Fight Boss, tranche MOTEUR (serveur / local) : 2026-11-27

Lecture seule. Fichiers lus : `cloudflare/src/idle-runtime-progression.js` (fonction découpée `appliquerProgressionEnergieSorealIdle__p1..p16` + boucle principale l.2131-2250), `idle-runtime-combat.js` (Fight / Nuke), `idle-runtime-boss.js`, `idle-runtime-actions.js` (ouverture, Rebirth, défis), `idle-runtime-etat.js` (état renvoyé), `idle-ngu-boss-reference-v1.js`, `idle-runtime-catalogue.js`, `idle-runtime-aventure.js` (`synchroniserEntrainementBase...`). Comparé avec `design/audit-code-jeu/boss-at-rebirth.md`, `boss-rebirth-inventaire-v2.md`. Rien n'a été modifié dans le dépôt. Les numéros de ligne sont ceux du dépôt au 2026-11-27 (HEAD 515ff0ac).

Légende. Certitude : CONFIRMÉ = lu dans le code, comportement déduit sans hypothèse sur le reste du système ; HYPOTHÈSE = dépend d'un comportement client ou d'un timing que je n'ai pas pu vérifier. Un chiffre mesuré est signalé comme tel.

---

## A. Constats (du plus grave au plus faible)

### A1. [MOYENNE-HAUTE, mode serveur seulement] Fermer le jeu en plein Fight Boss : aucune régénération ni farm Aventure AUTO hors ligne n'est créditée à la réouverture
- `idle-runtime-actions.js:93-107` (`stopBossOnOpen`), appelé par `obtenirEtatSorealIdle` (l.26-33).
- Ce qui se passe : si `combatBossActif` est vrai à la réouverture, le code le coupe puis écrit `DERNIERE_SYNCHRO = new Date()` (l.105) JUSTE AVANT `appliquerProgressionEnergieSorealIdle_` (l.109). La progression relit la ligne (`p1`, `row`), donc `ecouleReel` = ~0 s (`p3`, l.870-878). Conséquences : (1) PV du joueur et du boss ne régénèrent pas pour toute l'absence (jusqu'à 12 h) ; (2) `secondesEcoulees = 0` donc le résumé « Pendant ton absence » est vide ; (3) le bloc « Aventure AUTO hors ligne » est gardé par `ecouleReel >= 20` (l.~2205) : AUCUN farm d'Aventure AUTO n'est rejoué. Le commentaire V206 dit vouloir « rejouer le temps écoulé » sans le combat, mais la remise à « maintenant » annule ce rejeu.
- Scénario : joueur avec Aventure AUTO active, Fight Boss lancé (auto boss suivant), ferme l'onglet/le navigateur. Il revient 8 h après : joueur resté à ses PV d'avant, boss resté entamé, 0 gain d'Aventure.
- Atténuation : en jeu LOCAL (règle n°7) l'export serveur exécute déjà cette ouverture (combat coupé côté serveur) puis le client recule `DERNIERE_SYNCHRO` à `progressionAt` (`moteur-local-v1.js:233-234`), donc le moteur local voit `combatBossActif=false` et rejoue toute l'absence : le bug ne s'applique qu'au mode serveur (`?local=0`, exe/anciens clients, repli). Je n'ai pas lancé le moteur pour le reproduire ; test `idle-offline-summary-energy-real-v1` mentionne le comportement sans l'identifier comme défaut.
- Certitude : CONFIRMÉ (ordre des écritures), portée dépend du mode.
- Piste : ne pas toucher `DERNIERE_SYNCHRO` (la progression, combat coupé, créditera tout en repos), ou la remettre à la valeur lue avant.

### A2. [MOYENNE] La récompense d'EXP AFFICHÉE d'un boss n'est pas celle qui est donnée
- `idle-runtime-etat.js:1437-1460` (`recompenseBossActuel.xp`) et `:1429` (`bossSuivant.recompenseBossActuel.xp`) vs `idle-runtime-progression.js:1296-1371` (p6) et `idle-runtime-combat.js:802-835` (Nuke).
- Ce qui se passe : l'état affiche `Math.round(xpBase * xpMult * facteurPerk)`. Le moteur donne `Math.floor(...)` ET, à la première victoire d'un boss jamais vaincu (boss 1 à 20), REMPLACE la base par le bonus « première fois » (2, 3, 4, 10, 3...). L'affichage ne connaît pas ce bonus.
- Scénarios : (a) 1re victoire du boss 1 : l'écran annonce « +0 XP » (table de base = 0) et le moteur donne 2 ; boss 2 : annonce 1/0, donne 3 ; boss 4 : donne 10. (b) Avec un multiplicateur d'EXP : base 5 x 1,1 = 5,5 : annoncé 6 (round), donné 5 (floor). Le client écrit ce nombre dans le journal à la victoire locale (`ui-boucle-v1.js:685-700`, `ui-combat-2-v1.js:948`) : « récompense manquante » ou « en trop » visible.
- Certitude : CONFIRMÉ.
- Piste : une seule fonction `xpVictoireBossV1(index, bonus, premiereFois)` utilisée par état, combat et Nuke.

### A3. [MOYENNE] Une défaite ou une fuite envoyée par le client écrase les PV du moteur, même quand le moteur vient de valider une VICTOIRE (joueur remis à 0 PV)
- `idle-runtime-combat.js:97-99, 168-209, 431-438` (`definirCombatBossSorealIdle`).
- Ce qui se passe : l'opération rejoue d'abord le temps (l.77) ; si cette relecture tue le boss (victoire du moteur, `bossVaincus` +1), un arrêt `raison:'defaite'` du client met quand même `PV_JOUEUR = 0` (`arretApresDefaite`, l.205-209 et 431-438). Plus généralement, pour tout arrêt avec `snapshot`, `PV_JOUEUR` est remplacé par la valeur du client (l.183-209) même quand `snapshotMemeBoss` est faux (le boss a changé pendant l'attente) : la vie du joueur est « rembobinée » à une valeur ancienne (plus haute ou plus basse que celle du moteur). Le garde « jamais de retour en arrière » n'existe que pour le boss (l.254-257), pas pour le joueur.
- Scénario : client et moteur divergent d'une fraction de seconde sur « qui meurt en premier » (les deux simulent). Le moteur tue le boss, le client envoie `defaite` : le joueur est KO (0 PV) juste après avoir gagné ; ou à l'inverse retrouve des PV qu'il n'a plus.
- Certitude : CONFIRMÉ pour le code ; HYPOTHÈSE pour la fréquence (dépend de l'écart client/moteur ; je n'ai pas lu le client, voir l'autre tranche).

### A4. [MOYENNE-FAIBLE] Le boss peut survivre quelques secondes avec des PV « infimes » après un coup fatal (arrondis flottants)
- `idle-runtime-progression.js:1245-1249, 1264, 2157-2196` (boucle) : `segment = bossPv/dpsBossNet`, `dommageBoss = min(bossPv, segment*dpsBossNet)`, `bossPv = bossPv - dommageBoss`, mort seulement si `bossPv <= 1e-9`.
- Ce qui se passe : `(x/y)*y` peut valoir `x` moins 1 ulp. Pour des PV de boss > ~1e23 (à partir du boss ~25) un résidu de l'ordre de 1e-16 x PV reste > 1e-9, le boss n'est pas déclaré mort. Itération suivante : `segment` devient minuscule (< 1e-6) et `bossMort` faux, donc `break` (l.2190-2196) : le combat reste ACTIF avec un boss à « 0,0000 % » jusqu'à la synchro suivante (4 à 10 s), qui le tue dans ~99 % des cas (même mécanisme possible une seconde fois).
- Mesure (simulation Node de cette boucle seule, 200 000 tirages par ordre de grandeur) : 0 % pour des PV de 1e6, 1e12, 1e20 ; 0,6 à 0,85 % des kills pour des PV de 1e30, 1e100, 1e250 (mesure simplifiée, première itération = coup fatal).
- Même mécanique côté joueur (`pvJoueur - dommageJoueur`, l.1250-1254, 1265) : défaite non déclarée, combat qui continue une synchro de plus.
- Certitude : CONFIRMÉ par lecture + mesure ; fréquence réelle dépend de la cadence des synchros.
- Piste : si `segment === tempsPourBoss` forcer `bossPv = 0` (idem joueur) au lieu de soustraire.

### A5. [FAIBLE-MOYENNE] Le boss ne régénère pas PENDANT un combat qu'on ne peut pas gagner (divergence jeu)
- `idle-runtime-progression.js:1199-1207` : `dpsBossNet = max(0, dpsJoueur*mult - regenBossSec)` ; `1228-1233` : les PV du boss ne peuvent que baisser pendant le combat.
- Jeu (audit `boss-at-rebirth.md` §1.2 et E4) : à chaque appel de `fight` (50/s) `bossCurHP += bossRegen`, plafonné à `bossMaxHP`, y compris en combat. Si regen > dégâts du joueur, le boss REMONTE jusqu'à son maximum dans le jeu ; dans SOREAL il reste figé aux PV où il était.
- Scénario : après une défaite le boss est à 40 %. Le joueur relance Fight avec une attaque inférieure à la régén du boss : jeu = le boss remonte à 100 % pendant le combat ; SOREAL = figé à 40 % (puis remonte seulement hors combat, p3 l.970-984). Le joueur subit les dégâts jusqu'à la mort dans les deux cas : la différence est visible sur la barre du boss et sur la durée avant défaite.
- Certitude : CONFIRMÉ (modèle linéaire du moteur) ; à recouper avec la simulation client.

### A6. [FAIBLE-MOYENNE] Temps non consommé après la fin du combat dans une même synchro : jamais crédité en repos
- `idle-runtime-progression.js:2157-2196` + `p3` l.943-985 (la régénération de repos n'est calculée que si `!combatBossActif` AU DÉBUT).
- Ce qui se passe : si le combat se termine (victoire, défaite, fuite) au milieu d'une fenêtre, `tempsRestant` (la fin de la fenêtre) n'est ni rejoué en repos pour le joueur ni pour le boss. Fenêtre de 4 à 10 s en ligne : perte minime (la régén joueur vaut ~0,5 %/s des PV max quand Défense ≈ Attaque) ; plus gros avec une synchro tardive (onglet en arrière-plan : une fenêtre de plusieurs minutes avec combat fini en 10 s = plusieurs minutes de régén perdues, et le boss après défaite reste plus bas de PV régénérés). Après victoire c'est le joueur qui repart avec moins de vie ; après défaite le boss regagne moins.
- Certitude : CONFIRMÉ.

### A7. [FAIBLE] Fight lancé à 0 PV : « défaite » comptée immédiatement, essai décompté
- `idle-runtime-combat.js:295-374` : aucune garde `pvJoueur > 0` au démarrage. Boucle : `progression.js:2171-2182` : si `pvJoueur <= 0`, défaite, `koSubis +1`, `fluxBossDefaites +1`, `fluxBossDernier = boss courant`. Le compteur d'essais (`fluxEssais`, l.367-373) a déjà été incrémenté.
- Scénario : après une défaite, clic sur Fight (ou « Auto boss suivant » côté client) avant d'avoir regagné de la vie : une « défaite » de plus apparaît dans « En direct », l'essai du boss est +1, sans combat. Dépend du client pour l'empêcher (non lu ici).
- Certitude : CONFIRMÉ côté moteur ; HYPOTHÈSE côté client.

### A8. [FAIBLE] Victoire ET défaite dans le même segment : défaite comptée contre le boss SUIVANT
- `idle-runtime-progression.js:1275-1278, 1411-1434` (victoire, change `bossCombatIndex`) puis `1441-1458` (p7, défaite si `joueurBattu`), `2185-2187`. Si `bossMort` et `pvJoueur === 0` dans le même segment : le gain est validé, puis p7 ajoute une défaite (`koSubis`, `fluxBossDefaites`) et pose `fluxBossDernier = nouvelle valeur de bossCombatIndex + 1` (le boss SUIVANT), et `cloreCombatBossClassementV1_(false)` est rappelé (sans effet car déjà remis à 0).
- Condition : `tempsPourBoss === tempsPourDefaite` (ou résidu de PV du joueur < 1e-9 après le segment). Quasi impossible pour de grands PV, plausible seulement avec de petits nombres égaux (début de partie). Effet : le fil « En direct » peut annoncer une défaite contre le boss N+1 que le joueur n'a jamais combattu. Le joueur reste à 0 PV après sa victoire.
- Certitude : CONFIRMÉ (code) ; rare.

### A9. [FAIBLE] Arrondi du stockage des PV du boss : un boss à < 0,5 PV est « ressuscité »
- `idle-runtime-progression.js:2103` écrit `Math.round(bossPv)` ; `p4` l.1028-1033 remet le boss au maximum quand `!combatBossActif && bossPv <= 1e-9`.
- Scénario : défaite alors qu'il restait 0,3 PV au boss (ordre de grandeur des tout premiers boss seulement) : écrit 0, puis la synchro suivante hors combat le remet à 100 %. Pour les gros PV (> 1e7) l'arrondi est sans effet.
- Certitude : CONFIRMÉ ; quasi inobservable.

### A10. [FAIBLE] Régénération du joueur incohérente entre combat et repos
- Combat : `(1 + defense)/20` par seconde (`p3` l.937-941, conforme `Character::updateHP`). Repos : `regenPvAvecMultiplicateursSorealIdle_` et `regenPvIntegreeBasicTrainingSorealIdleV176_` (l.303-421) utilisent `defense/20` sans le `+1` (et `(100 + ...)/20`). Écart relatif 1/Défense (≤ 1 %), sans conséquence visible ; à noter pour l'alignement sur le code du jeu (règle n°0).

### A11. [FAIBLE, hypothèse] Valeurs vides lues comme 0 plutôt que comme le défaut
- `nombreSorealIdle_('' ou null, défaut)` renvoie 0 (`Number('') = 0`, `Number(null) = 0` sont finis), pas le défaut. Pour `BOSS_PV` (`p3` l.826-830, `definirCombat` l.360) une cellule vide donne `bossPv = 0` ; avec `combatBossActif` vrai la boucle tuerait le boss sans combat. Un `Infinity` écrit en JSON devient `null` puis 0. Je n'ai pas trouvé de chemin normal qui laisse `BOSS_PV` vide (Rebirth, défis et Nuke l'écrivent) : risque seulement sur une ligne importée/ancienne. HYPOTHÈSE.
- Même remarque pour de très grands nombres : boss 301 = PV 1,98e299, régén 3e294 x 50 ; une Attaque joueur > 1,8e308 (Infinity) serait lue 0/défaut. À surveiller pour la fin de partie, non démontré.

---

## B. Points vérifiés et jugés conformes (pas de défaut trouvé)
- Idempotence Fight : double clic -> `dejaActif` (`combat.js:291-293`), pas de recréation ; Start obsolète (`snapshot.bossSelection` d'un autre boss) renvoyé `ok:true, ignore` AVANT toute écriture (l.147-159).
- Aucun double octroi d'EXP : victoire ET Nuke relisent le joueur après la progression ; le Nuke refuse si `combatBossActif` (l.596-606). `highestBoss` avancé localement à chaque kill (FTBE), pas de bonus rejoué.
- Nuke : conditions `Attaque/5 > DéfBoss ET Défense/5 > AtkBoss` strictes (l.786-791), arrêt à `bossID > 300`, restriction « jamais vaincu en Normal sauf >= 124 » (`nukeArretBossInedit_`), conformes à `boss-at-rebirth.md` E2/E3 (corrigés). Réponse `SOREAL_IDLE_NUKE_AUCUN_BOSS` propre, PV du joueur conservés (pas de soin).
- Stats de boss (PV, attaque, défense, régén x50, boss 301 = 69/69/420) identiques au jeu ; difficulté sans effet sur le boss (`nguBossStatsV1`, `divider = 1`), donc l'appel `pvMaxBossSorealIdle_(bossCombatIndex)` sans difficulté à la victoire (`progression.js:1428-1431`) et dans le Nuke (`combat.js:872-874`) est sans conséquence aujourd'hui.
- Ordre dans une synchro : niveaux NGU validés AVANT Attaque/Défense/PV max (règle n°5) ; PUISSANCE/ENDURANCE réécrites par `synchroniserEntrainementBaseSorealIdleV41_` avant le Nuke.
- Rebirth et défi : arrêtent le combat, remettent `BOSS_VAINCUS=0`, boss et joueur à PV pleins (`actions.js:1122-1215`, `:918-985`).
- Défaite : le boss GARDE ses PV (`p7`), aucun K.O. persistant ; fuite : PV conservés.

## C. Code mort / commentaires trompeurs (à nettoyer ou à ne pas « réparer »)
- Capacités de boss (fureur, paralysie, bouclier, sceau) : `bossCatalogueConstruireSorealIdle_` force `capacites = []` (`idle-runtime-catalogue.js:317`) ; donc `multiplicateurAttaqueBossSorealIdle_` (fureur à 30 % PV, `boss.js:825-883`), `multiplicateurDpsJoueurBossSorealIdle_` (`:667-754`), `multiplicateurSceauBossSorealIdle_` (`:130-148`) renvoient toujours 1. Sans quoi la fureur aurait imposé un découpage de segment (le dégât reçu est constant sur un segment, l.1078-1085 de progression.js). Le jeu n'a pas ces mécaniques (`boss-at-rebirth.md` §1.2 : réglé).
- `bossStunJusqua`, `buffBouclierJusqua/Pct`, `bossVulnerableJusqua/Pct`, `immuniteParalysieJusqua`, `sceauBriseBossNumero` : plus aucun code ne les arme (seulement des remises à 0, ex. `actions.js:100-103, 1165-1166`) ; les branches de `progression.js:1087-1166` sont mortes.
- `ancienBoss` (`progression.js:1331-1332`) : `bossCombatIndex` vaut toujours `bossVaincus` dans la boucle, donc toujours faux ; `bossBloqueRenaissance` toujours faux (mur du boss 20 retiré), mais encore renvoyé au client.
- `pvJoueurMax = Math.max(1000, ...)` (`progression.js:784-790`) alors que `boss.js:1517` dit « sans plancher » (formule du jeu `10 + 10 x attaque`) : sans effet tant que l'Attaque >= 100 (PV >= 1010), mais deux sources pour les PV max (`PV_JOUEUR_MAX` écrit aussi par `recalculerPuissanceCompleteSorealIdle_`, `boss.js:1040-1046`).
- Les commentaires « difficulté » de `definitionBossSorealIdle_` / `attaqueBossSorealIdle_` décrivent un diviseur 1e30 qui n'existe plus (audit IL 2026-11-20) ; le paramètre `difficulty` est ignoré. Risque de « correction » à tort.
- `definitionBossSorealIdle_` : `n < catalogue.length` est testé AVANT `bossFinDesBossAtteinteSorealIdle_` (`boss.js:1626-1650`) : si une feuille `IDLE_BOSS` portait plus de 301 lignes actives, le boss 302 existerait ; idem `nuke.dernierBoss` compare à `catalogue.length` (`combat.js:959`) et non à 301. Hypothèse (le catalogue de production a 301 lignes selon les audits).
- La boucle de combat n'a aucune garde `bossFinDesBossAtteinteSorealIdle_` (seul `definirCombat` l'a, `combat.js:324`) : un `combatBossActif` déjà vrai avec `bossVaincus > 300` (import, admin) combattrait le boss « NONE » (420 PV, régén 21 000/s). Théorique.

## D. Recommandations courtes (priorité décroissante)
1. A1 : supprimer la remise de `DERNIERE_SYNCHRO` dans `stopBossOnOpen` (mode serveur).
2. A2 : une seule fonction de calcul d'EXP de victoire partagée par l'état, le combat et le Nuke (floor + bonus première fois).
3. A3 : sur arrêt avec snapshot, ne recopier les PV du joueur que si `snapshotMemeBoss` et seulement à la baisse ; ne jamais forcer 0 PV si le moteur a déjà validé la victoire.
4. A4 : forcer `bossPv = 0` / `pvJoueur = 0` quand `segment === tempsPourBoss` / `tempsPourDefaite`.
5. A5/A6 : décider (règle n°0 : le jeu gagne) si la régén du boss en combat doit remonter ses PV ; créditer le temps restant en repos après la fin du combat.
