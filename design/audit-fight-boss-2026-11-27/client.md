# Audit Fight Boss, tranche CLIENT (2026-11-27)

Lecture seule. Chemins relatifs à `cloudflare/public/modules/` sauf mention. Moteur lu à titre de comparaison : `cloudflare/src/`.
Certitude : « confirmé » = lu dans le code, enchaînement vérifié ; « hypothèse » = le mécanisme est dans le code mais le déclencheur réel (timing, mode serveur vs local) n'est pas démontré.

## A. Constats les plus graves

### A1. Combat local fantôme quand le moteur a déjà terminé le combat (défaite, ordre ignoré, onglet caché) — HAUTE — confirmé
- `ui-combat-1-v1.js:1097-1108` : si le local est en combat et que la réponse dit « combat inactif » (ou autre boss), la branche renvoie `true` (état local gardé) tant que ni victoire prédite ni pause après défaite. Aucune limite de durée, aucun signal de divergence.
- Scénarios concrets :
  1. Onglet caché / téléphone verrouillé / PC en veille pendant un Fight : le tick local ne compte que 1 s par passage (`ui-boucle-v1.js:1632-1640`), le moteur résout tout le temps écoulé et peut tuer le JOUEUR. Au retour (`auRetourV1`, `ui-boucle-v1.js:2137-2143`) la synchro forcée dit « combat inactif, PV joueur 0 » : le client l'ignore, la barre de vie reste haute, le combat repart comme si de rien n'était. S'il gagne localement : victoire prédite (son « victory », XP local ajouté, boss suivant affiché), puis 15 s plus tard « 15 s sans confirmation » -> état du moteur adopté : le même boss est de retour, XP retirée.
  2. Ordre « Fight » refusé ou ignoré côté moteur : `terminerLotRapideIdleV60_` (`ui-actions-rapides-v1.js:380-466`) ne lit jamais `res.ignore` / `res.obsolete` / `res.actif:false` (aucune occurrence dans le client, grep `obsolete|\.ignore`), et sur échec non « occupé » il affiche un toast mais ne désarme pas le combat local. Le moteur renvoie `ok:true, ignore:true, obsolete:true` quand `snapshot.bossSelection !== bossVaincus+1` (`src/idle-runtime-combat.js:131-153`). Même effet : combat fantôme puis retour du boss 15 s après.
- Conséquence visible : « j'ai tué le boss, il est revenu quelques secondes après », barres qui ne correspondent pas à l'état réel.
- Piste : en cas de désaccord prolongé (> quelques secondes) sur « combat actif », faire foi au moteur (comme pour la vie : > 3 points) ; traiter `ignore/obsolete` dans `terminerLotRapide`.

### A2. « Combattre » depuis la carte d'un boss soigne le joueur à fond et remplit le boss — HAUTE — confirmé
- `ui-combat-2-v1.js:752-801` (`selectionnerBossIdleV37_`) : `REG.idleEtat.pvJoueur = pvJoueurMax` (l.791), `bossPv = bossPvMax = b.pv` (l.787) sans condition, puis `combattreDepuisCarteBossIdleV91_` (l.129-148) lance Fight 120 ms après.
- Le snapshot de l'ordre Fight contient ces PV ; le moteur les recopie : `PV_JOUEUR = min(pvMax, snapshot.pvJoueur)` quand `actif` est vrai (`src/idle-runtime-combat.js:~164-181`). Donc :
  - joueur à 0 PV (après défaite, Fight normalement bloqué par `pvJoueur<=0`, `ui-combat-2-v1.js:416-424`) : le bouton « Combattre » de la carte contourne ce blocage et donne un combat à PV pleins, côté moteur aussi ;
  - boss déjà entamé : le client l'affiche plein, le moteur garde le plus bas (`Math.min(bossPvSnapshot, bossPvServeur)`) : écart > 3 pts, saut visible de la barre du boss.
- Piste : ne toucher ni `pvJoueur` ni `bossPv` quand la sélection ne change pas (le moteur n'accepte que bossVaincus+1 de toute façon, `idle-runtime-joueurs.js:~735`).

### A3. `__SOREAL_IDLE_COMBAT_EN_COURS_V1__` reste vrai après une défaite / un arrêt autre que la Fuite : boss suivant masqué jusqu'à 12 s — MOYENNE — confirmé
- Posé à vrai en `ui-combat-1-v1.js:80`, remis à faux seulement en `ui-combat-1-v1.js:352` (mort du boss) et `ui-amorcage-v1.js:948` (bouton Fuite). Aucun reset sur : défaite locale (`ui-boucle-v1.js:928-953`), arrêt par popup (`ui-popups-v1.js:165-176`), ouverture d'une carte boss (`ui-combat-2-v1.js:~325`), tutoriel (`ui-tutoriel-v1.js:~461`), garde fantôme (`ui-combat-1-v1.js:825-849`), Renaissance, Nuke.
- `apparition-boss-v1.js:442` : tant que le drapeau est vrai, un changement d'image de boss est « couvert » (calque noir) en attendant une victoire qui ne viendra pas ; filet à 12 s. Scénario : défaite sur le boss N, puis Nuke ou Rebirth -> nouveau boss caché ~12 s sous un calque sombre, sans animation d'apparition.

### A4. Une popup de nouveauté interrompt le Fight en cours — MOYENNE — confirmé (conception, mais ressenti comme un bug)
- `ui-popups-v1.js:165-176` : `afficherProchainePopupIdleV75_` met `combatBossActif=false`, appelle `definirCombatBossIdleV39_(false)` (journal « Fuite : combat interrompu », ordre de fuite envoyé avec snapshot). Toute popup mise en file (déblocage, succès…) pendant un combat l'arrête sans que le joueur ait cliqué. De même l'ouverture d'une carte de boss (`ui-combat-2-v1.js:~323-335`) fuit le combat.
- À signaler à Norman : « le combat s'arrête tout seul » = cette règle.

### A5. Victoire prédite remise à zéro par un redessin ; prédiction jamais annulée par une Renaissance — MOYENNE — mécanisme confirmé, fréquence hypothèse (surtout mode serveur / connexion lente)
- `ui-noyau-v1.js:716` : `rendreIdleEtat_` remet `idleVictoireBossLocaleV49=false` à CHAQUE rendu (changement de menu, rendu optimiste, déblocage de menu `ui-noyau-v1.js:285-288`...). Il appelle d'abord `appliquerSynchroCombatSansReflowIdleV116_(état)`, dont l'état « serveur » est ici l'état LOCAL (`ui-noyau-v1.js:287`, `ui-actions-rapides-v1.js:84-90`). Après `appliquerBossSuivantLocalIdleV1_` (≈0,4 s après la mort), `bossVaincus` local = `prev.vaincus` : la prédiction est alors « confirmée » par le client lui-même (`ui-combat-1-v1.js:792-800`), la surveillance 0,4 s s'arrête (l.797 et boucle l.444). Ensuite toute réponse du moteur avec moins de boss vaincus est jetée comme « périmée » (l.806-808) sans limite de temps : si le moteur n'a jamais enregistré la victoire, l'écran reste sur le boss N+1 alors que le moteur est sur N.
- Rebirth pendant une prédiction non confirmée : `ui-renaissance-v1.js:~340-352` remet le drapeau mais jamais `idlePrevisionBossV1` (seuls `ui-combat-1-v1.js:288` et `:795` le font). `bossVaincus` d'après Rebirth < `prev.vaincus` : pendant 15 s toutes les synchros sont ignorées (`ui-combat-1-v1.js:794`) et le bouton Fight reste grisé (`fightEnAttenteServeurIdleV1_`, `ui-synchro-v1.js:19-26`, inclut `idlePrevisionBossV1.actif`).

### A6. Nuke : aucune garde contre une victoire prédite, un Fight en cours d'envoi ou un Fight cliqué pendant le Nuke — MOYENNE — confirmé (déclencheur : auto-Nuke / double action)
- `ui-combat-2-v1.js:644-667` (`nukerBossIdleV1_`) refuse si `combatBossActif`, mais pas si `fightEnAttenteServeurIdleV1_()` (victoire prédite, ordre en vol) : pendant la fenêtre de victoire prédite `combatBossActif` est faux, donc l'auto-Nuke (`ui-amorcage-v1.js:972-990`, toutes les secondes) peut partir avant que le moteur ait enregistré la victoire.
- l.656 `REG.idleFastPendingV60.combat=null` jette sans condition un ordre Fight cliqué à l'instant ; l.692 recommence à la fin de la cascade. `REG.idleNukeEnCoursV1` repasse à faux dès la réponse (l.669), pas à la fin de la cascade (qui dure jusqu'à plusieurs secondes : 30-90 ms par boss), et ni `definirCombatBossIdleV39_` ni le calcul `disabled` de Fight (`ui-combat-1-v1.js:193-202`) ne le regardent : un Fight cliqué pendant la cascade démarre (son « fight », journal), puis la fin de cascade remet `combatBossActif=false` et écrase l'état avec celui de la réponse du Nuke ; l'ordre déjà parti rend le moteur « en combat » alors que le client ne l'est pas (la garde de l.825 l'arrête ensuite une fois).
- Le bouton NUKE n'est pas grisé en combat (`ui-combat-2-v1.js:~1033-1041`, `ui-combat-1-v1.js:261-265`) : le clic ne fait rien en silence (retour muet l.646).

### A7. Retour de lot « occupé » : un vieil ordre de combat écrase un ordre plus récent — FAIBLE — confirmé, déclencheur rare
- `ui-actions-rapides-v1.js:167-172` (`remettreLotRapideIdleV60_`, cas `combat`) réécrit `pending.combat` sans vérifier qu'un ordre plus récent y est déjà (ex. Fight en réessai, Fuite cliquée entre-temps) : l'ancien Fight remplace la Fuite. Idem `boss` (l.197-202) et `zone`.
- Ordre d'extraction fixe (`ui-actions-rapides-v1.js:213-377`) : `combat` part AVANT `boss`. Hypothèse : Fight cliqué pendant que « sélection de boss » est encore en file -> snapshot avec le numéro choisi, moteur encore sur l'ancien -> `obsolete` ignoré silencieusement (voir A1).

## B. Écarts de modèle client / moteur (barres qui sautent ou reculent)

### B1. Boucliers magiques et vulnérabilité : plafonds différents — FAIBLE — confirmé
- Bouclier : client plafonne à 95 % (`ui-combat-1-v1.js:704`, `ui-boucle-v1.js:842`), moteur à 90 % (`src/idle-runtime-progression.js:~1100-1106`, `Math.min(90, buffBouclierPct)`). Au-dessus de 90 % la vie du joueur descend plus lentement à l'écran qu'au moteur.
- Vulnérabilité du boss : moteur plafonne à +300 % (`idle-runtime-progression.js:~1160`), client sans plafond (`ui-boucle-v1.js:1481-1496`) : dégâts locaux surestimés au-delà.
- Effet : écart croissant, adopté par le moteur au-delà de 3 pts (`combat-vie-modele-v1.js:44-48`) : saut de barre.

### B2. Puissance / défense / vie max du combat recalculées localement à chaque image — FAIBLE à MOYENNE — confirmé (risque de divergence, pas de bug démontré)
- `ui-entrainement-v1.js:1050-1310` recalcule `puissance`, `defense`, `force`, `endurance`, `pvJoueurMax` chaque tick depuis les niveaux de Basic Training × `multiplicateurAttaqueTotal`/`Post`, indépendamment du moteur. Tout nouveau bonus qui n'entre pas dans ces multiplicateurs rend le combat local plus faible/fort que le moteur ; seul le contrôle de 3 pts rattrape.
- `tenirStat` (l.1233-1242) : état global `globalThis.__SOREAL_GARDE_STATS_V1__`, jamais remis à zéro (changement de boss, Renaissance, autre compte dans la même page) ; un recul de moins de 2 % est tenu 15 s : jusqu'à 2 % de dégâts en trop pendant 15 s.
- `ui-entrainement-v1.js:1289-1295` : en combat `pvJoueurMax = max(avant, calculé)` : la vie max ne baisse jamais pendant un combat (perte d'un bonus -> max trop haut jusqu'à la fin du combat) ; `ui-combat-1-v1.js:1179-1183` fait pareil à la synchro (`max(local, serveur)` pour `pvJoueurMax`, `puissance`, `defense`, `force`, `endurance`).

### B3. Régénération du boss ignorée quand le joueur ne peut pas le blesser — FAIBLE — hypothèse
- `ui-boucle-v1.js:1551-1563` : `dps = max(0, dpsAvantRegen - regenBoss)` ; `p8` ne tourne que si `dps>0` (l.632-637). Si la régénération dépasse les dégâts, le boss reste figé localement ; le moteur calcule la même chose (`idle-runtime-progression.js:~1180`), donc cohérent, mais la barre ne remonte jamais côté client même si le moteur permettait une remontée (à confirmer côté moteur).
- Note : le code des capacités de boss (`ui-combat-1-v1.js:2024-2400`, paralysie / bouclier / régénération par intervalle) est du code mort : le moteur force `capacites = []` (`src/idle-runtime-catalogue.js:314-318`). À ne pas confondre avec une source d'écart.

### B4. Marche arrière de la vie du joueur : cause résiduelle — FAIBLE — hypothèse
- `ui-combat-1-v1.js:1168-1218` : la vie affichée vient du modèle local ; la réponse du moteur ne la remplace qu'au-delà de 3 points (`combat-vie-modele-v1.js:16`). Toute dérive de moins de 3 points est donc gardée, mais l'écart pour le boss `ecartPts>0` (page en avance) -> la barre reste en avance puis le moteur « rattrape » : visuellement la barre du boss peut marquer une pause, sans reculer. Sous le seuil de 3 pts rien ne recule ; au-dessus, saut (voir B1/B2).

## C. Timers, états et conditions de course

### C1. Marquage « vaincu » du mauvais boss — FAIBLE — mécanisme confirmé, fréquence hypothèse
- `ui-combat-1-v1.js:391-409` (`transitionMortBossIdleV61_`, appelée 2 rAF + 110 ms après la mort : `ui-boucle-v1.js:775-783`) marque `bossCatalogue[bossSelection].etat='vaincu'`, `selectionnable=false` en lisant la sélection AU MOMENT de l'appel. Si une synchro (toutes les 4 s en combat) a déjà adopté le boss suivant dans cet intervalle d'environ 150 ms, c'est le boss N+1 qui est marqué « vaincu / non sélectionnable » dans le catalogue local jusqu'à la synchro suivante, et le journal écrit « Ce boss reste mort ».

### C2. Fight retenu : se relance seul — FAIBLE — confirmé
- `ui-combat-2-v1.js:375-389` : un Fight cliqué pendant une victoire prédite est retenu (`setInterval` 250 ms, 20 s) puis lancé seul quand le drapeau tombe, sans revérifier la sélection/le contexte (autre menu, autre boss choisi entre-temps) ; le message flottant peut être réaffiché si le drapeau est remis par `appliquerBossSuivantLocalIdleV1_` (`ui-combat-1-v1.js:497`).

### C3. XP et son « victory » à la prédiction — FAIBLE — confirmé
- `ui-boucle-v1.js:675-705` : son `victory`, journal et XP locale (`actualiserXpLocaleIdleV70_`) partent à la prédiction. Si la victoire n'est pas confirmée (A1, A5), le son et le gain ont été donnés à tort ; l'XP retombe quand l'état du moteur est adopté (`etat-monotone-v1.js:98-107` ne retient pas un recul supérieur à la pente apprise).

### C4. Synchro de combat seulement sur le menu Combat — FAIBLE — confirmé
- `ui-boucle-v1.js:2171-2176` : la synchro toutes les 4 s pendant le combat ne tourne que si `idleMenuActifV28==='combat'`. Combat actif sur un autre menu : seule la synchro de fond (15 s / 10 en local) ou le menu vivant corrige le modèle, la dérive s'accumule (dt plafonné à 1 s, A1).

### C5. Cadence/dt — FAIBLE — confirmé
- `ui-boucle-v1.js:1632-1640` : `dt` borné à 1 s par passage ; après un blocage de plus d'1 s (GC, tâche longue) le modèle local prend du retard sur le moteur (qui compte tout le temps) : barres du boss en retard puis saut en avant à la synchro (> 3 pts).

## D. Points vérifiés sans anomalie
- Double comptage de victoire : le drapeau `idleVictoireBossLocaleV49` garde p8 et p9 (`ui-boucle-v1.js:670-674, 790`) ; un boss tué dans le tick ne riposte plus. Victoire et défaite dans la même image : l'ordre « qui tombe en premier » (`ui-boucle-v1.js:645-649`) est cohérent avec le moteur.
- Divisions : pas de NaN/Infinity atteignable (`recusParSec>0`, `dps>0`, `bossPvMax>0` gardés ; `combat-vie-modele-v1.js` filtre par `nb`).
- Minuteries : `programmerCombatAutoIdleV30_` (auto Aventure) annule l'ancienne avant d'en poser une ; interval de surveillance de victoire arrêté dans tous les chemins ; `surveillerVictoireFigeeIdleV1_` s'arrête si le bandeau n'est plus dans la page. Le tick d'arrière-plan et le rAF ne tournent jamais ensemble (`document.hidden`).
- Anti-spoil : aucun texte de boss verrouillé dans les modules lus ; le message de cascade Nuke affiche des boss vaincus ; le moteur envoie toutefois `bossSuivant` (nom, stats) avant la victoire (`ui-combat-1-v1.js:477-500`), donc lisible dans la réponse réseau : à vérifier côté serveur (hors tranche) si la règle n°2 doit couvrir le prochain boss.

## E. Non vérifié
- `soreal-idle-ui.js` (parties combat) : seules les déclarations d'état partagé ont été regardées. `borne-led`, `borne-yeux`, `cthulhu-scene`, `bulles-sang`, `audio-borne`, `hud-haut-v2`, `fond-combat` : parcourus pour les minuteries/écouteurs (aucun cumul à chaque rendu relevé), pas audités ligne par ligne.
- La part du moteur local (Worker) dans les cas A1/A5 (latence réelle d'une réponse, `__recuPerfV1`) n'a pas été mesurée.
