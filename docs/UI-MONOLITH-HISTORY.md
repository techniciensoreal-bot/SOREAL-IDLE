# SOREAL IDLE — historique des commentaires du monolithe UI

Commentaires techniques/historiques extraits de `cloudflare/public/soreal-idle-ui.js` pendant UI split V8. Ils sont conservés ici pour traçabilité sans alourdir le fichier runtime.

## Bloc 1

```text
 * SOREAL IDLE standalone UI.
 * Migrated from SOREAL-APP/Soreal_Idle_UI.html at 0e9f517632ed462ee707d98eb86c7da7721914b8.
 * Source blob: d806407ce4f0c5ab52e679703a116e6e87fef27a.
 * Post-snapshot APP fixes synchronized: 1c43812 (single boss recovery path)
 * and 9d71863 (stable Fight button while disabled).
 * SOREAL-IDLE is the authoritative frontend owner after cutover.

```

## Bloc 2

```text
     * ============================================================
     * SOREAL IDLE — MODULE SÉPARÉ V1
     * ============================================================
     *
     * - Aucun include HTML supplémentaire.
     * - Le bouton reste caché tant que le serveur n'a pas autorisé
     *   l'utilisateur connecté.
     * - Toutes les pages SOREAL existantes continuent d'utiliser
     *   ouvrirPage() exactement comme avant.
     * - Seule la valeur "idle" est interceptée ici.
    
```

## Bloc 3

```text
       * Norman (2026-09-16) : "pour chaque push que tu fais dessus, tu
       * dois utiliser un numéro de version visible... tu incrémentes à
       * chaque push." Le bump manuel a été plusieurs fois oublié malgré
       * cette règle (audit externe du 2026-09-17, confirmé : la valeur
       * restait "0.12" après plusieurs pushes IDLE le jour même) — la
       * valeur littérale ci-dessous n'est donc plus la source de vérité :
       * cloudflare/build-static.mjs la réécrit automatiquement à chaque
       * build avec bridgeAssetVersion (SHA court du déploiement, identique
       * à la version déjà utilisée par le reste de l'APP), jamais périmée.
       * Cette valeur par défaut ne s'affiche donc que pour un run local
       * sans build (jamais en production réelle).
       *
       * IDLE_UI_MILESTONE_V48_NGU_BALANCE (ci-dessous) reste le marqueur
       * STABLE de jalon de parité UI utilisé par les tests contractuels
       * (idle-ui.test.mjs) -- jamais renommé/retiré, indépendant de ce
       * numéro de version qui, lui, change à chaque déploiement.
       *
       * IDLE_CLIENT_PROTOCOL_VERSION (ci-dessous) est un troisième
       * concept encore différent, ajouté par l'audit du 2026-09-17 :
       * aucun contrat de version n'était partagé jusqu'ici entre
       * SOREAL-IDLE et SOREAL-APP (deux dépôts déployés indépendamment,
       * sans CI croisée) : il décrit la compatibilité du CONTRAT
       * client/serveur (noms d'opérations, forme des réponses,
       * arguments attendus), jamais le build en cours d'exécution. Doit
       * rester égal à IDLE_PROTOCOL_VERSION côté SOREAL-IDLE (moteur
       * serveur, dépôt SOREAL-IDLE). Déclarée ici pour rester regroupée
       * avec les deux autres
       * constantes de version de ce module, MAIS la comparaison réelle
       * (contre `protocolVersion` renvoyé par obtenirAccesSorealIdle) se
       * fait dans Soreal_App_html.html, PAS ici : verifierAccesIdleNatifV4_
       * plus bas dans ce fichier fait bien le même appel, mais n'a plus
       * aucun site d'appel actif (vérifié par grep le 2026-09-17,
       * attendreSessionIdleNatifV4_ qui l'invoquait n'est elle-même
       * jamais appelée) -- le vrai premier appel à obtenirAccesSorealIdle
       * en production part de verifierAccesIdleLoaderV1_ dans
       * Soreal_App_html.html, avant même que ce module ne soit
       * téléchargé. C'est donc là qu'un désaccord de version doit être
       * détecté, pour refuser d'ouvrir le module plutôt que de le
       * charger puis découvrir la casse.
       *
       * À incrémenter UNIQUEMENT pour un changement cassant du contrat
       * (champ de réponse renommé/retiré, forme de réponse changée,
       * arguments d'une opération changés, opération renommée/
       * supprimée) — jamais pour un champ optionnel ajouté, une nouvelle
       * opération, ou un refactor interne sans effet observable côté
       * client. Bumper les deux côtés (ici et IDLE_PROTOCOL_VERSION côté
       * SOREAL-IDLE) dans le même effort de travail que le changement
       * cassant lui-même.
      
```

## Bloc 4

```text
       * Correctif 2026-09-18 (Norman, en direct : "ajoute à moi seul,
       * dans le menu paramètres, un bouton qui reset l'entièreté des
       * joueurs actuels") — première tentative : capturer
       * utilisateur.email depuis la réponse d'obtenirAccesSorealIdle
       * (verifierAccesIdleNatifV4_). Bug trouvé en direct (Norman :
       * "IL FAUT AUSSI LE BOUTON...", le bouton n'apparaissait jamais) :
       * attendreSessionIdleNatifV4_/verifierAccesIdleNatifV4_ ne sont
       * JAMAIS appelées nulle part dans ce fichier (code mort, prévu
       * pour afficher un bouton de navigation natif qui n'existe plus
       * sous cette forme) — idleUtilisateurEmailV1 restait donc
       * toujours vide. SOREAL_USER (déclaré et peuplé dans
       * Soreal_JS_01_Coeur.html, même portée globale que SOREAL_SESSION
       * déjà utilisé des centaines de fois dans ce fichier) est déjà
       * fiable et toujours peuplé à ce stade — plus besoin d'une
       * variable dédiée, estAdminSorealIdle_() le lit directement.
      
```

## Bloc 5

```text
       * Correctif 2026-09-18 (suite, Norman, en direct : bouton toujours
       * invisible malgré le correctif ci-dessus, repro confirmée) —
       * SOREAL_USER dépend d'un handshake TV-embed asynchrone (postMessage,
       * voir cloudflare/features/idle/tv-staging-session-bridge-v1.html et
       * l'équivalent prod dans build-static.mjs) dont le timing n'est
       * jamais garanti avant le tout premier rendu de la page Settings —
       * le bouton pouvait donc rester invisible indéfiniment même après
       * la fin du handshake, tant qu'aucun autre événement ne redéclenchait
       * un rendu complet. idleEstAdminV1 (résolu une seule fois par
       * rafraichirEstAdminSorealIdle_, juste en dessous) donne une réponse
       * SERVEUR autoritaire (estAdminSorealIdle, idle-sqlite-runtime.js,
       * même comparaison qu'ADMIN_SOREAL_IDLE_EMAIL côté serveur), et
       * déclenche elle-même un re-rendu dès qu'elle arrive — SOREAL_USER
       * reste un repli instantané tant qu'elle n'est pas encore résolue.
      
```

## Bloc 6

```text
       * Perf/fix V1 — ces trois variables du blocage combat par popup
       * pedagogique (V75/V102) etaient lues et assignees a plusieurs
       * endroits sans jamais etre declarees, ce qui levait
       * "ReferenceError: idlePopupBloqueCombatV102 is not defined" des
       * la premiere lecture (avant toute popup affichee) : Start Boss
       * plantait immediatement et le ticker plantait a chaque tick.
      
```

## Bloc 7

```text
       * V116 — COMBAT PAR COUPS, PAS PAR DRAIN CONTINU.
       * Le DPS reste identique sur la durée, mais les PV ne changent qu'au
       * moment d'une attaque. Cela évite aussi les micro-variations visibles
       * dans les WebView/iframes TV.
      
```

## Bloc 8

```text
       * V117 — VARIANCE D'IMPACT ÉQUILIBRÉE.
       * Deux coups consécutifs totalisent 2,00x le dégât moyen : on sent
       * l'aléatoire sans augmenter le DPS à long terme.
      
```

## Bloc 9

```text
         * Si TV a raté quelques frames, on rattrape au maximum 4 coups en
         * une fois. On ne transforme jamais un lag d'affichage en drain
         * continu.
        
```

## Bloc 10

```text
         * V41.1 : le cap est une valeur du RUN. Il ne change jamais
         * pendant que la barre monte. Les niveaux préparent nextCap,
         * appliqué seulement lors de la Renaissance.
        
```

## Bloc 11

```text
         * V219 — la progression mécanique et la progression visuelle sont
         * volontairement séparées.
         *
         * Le moteur continue d'ajouter exactement speed * dt niveaux.
         * La barre, elle, utilise une animation compositor dont UN cycle
         * dure exactement 1000/speed ms. À 15 niv/s sur un écran 60 Hz,
         * écrire simplement skill.progress à chaque frame ne peut montrer
         * que ~0/25/50/75 % : le niveau reboucle avant qu'un frame ne
         * tombe sur 100 %. On réserve donc une vraie fenêtre visible au
         * début et à la fin du cycle sans modifier sa durée totale.
        
```

## Bloc 12

```text
         * Un cap différent signifie qu'une Renaissance/challenge a
         * réellement ouvert un nouveau run : dans ce cas le serveur gagne
         * entièrement et aucun niveau de l'ancien run ne doit survivre.
        
```

## Bloc 13

```text
             * L'allocation locale est la dernière intention du joueur ;
             * la réponse réseau peut avoir été produite avant le dernier
             * clic. Le serveur la confirmera au prochain envoi.
            
```

## Bloc 14

```text
         * V177 — une réponse de sauvegarde Basic Training est un autre
         * chemin réseau que la synchro générale. Pendant la récupération
         * après une défaite Fight Boss, le client possède déjà la trajectoire
         * exacte des niveaux/Defense toutes les 100 ms. Injecter ici le
         * snapshot serveur (potentiellement calculé sur une fenêtre plus
         * large) change Defense d'un coup, puis le tick suivant applique
         * Defense/20 et peut remplir la barre instantanément.
         *
         * On accepte encore les champs énergie/persistance sans rapport avec
         * les PV, mais on ne remplace ni BT, ni A/D, ni PV max pendant cette
         * phase. Le prochain clic Fight resynchronise l'état de combat.
        
```

## Bloc 15

```text
         * Correctif 2026-09-18 (Norman, en direct : "la barre de vie monte
         * à 3M et redescend jusqu'à la valeur qui devrait être la bonne...
         * ça se produit au moment où tu places tes premiers points dans
         * basic training") — cause confirmée : progresserBasicTrainingLocalIdleV120_
         * recalcule force/pvJoueurMax LOCALEMENT à chaque tick de 100ms
         * (jusqu'à 50 niveaux/s par compétence), mais cette réponse réseau
         * (l'écho serveur de l'ALLOCATION qu'on vient d'envoyer, jamais plus
         * récente que l'état local au moment où elle revient) écrasait
         * ensuite force/pvJoueur/pvJoueurMax/basicTraining SANS AUCUNE
         * garde — même classe de bug déjà trouvée et corrigée ailleurs ce
         * jour (EXP Shop, Adventure) : une réponse réseau périmée qui
         * écrase un état local plus avancé. Même remède que le garde-fou
         * de combat de boss (appliquerSynchroCombatSansReflowIdleV116_,
         * plus bas) : Math.max(local,serveur) pour les stats qui ne
         * peuvent que grandir tant qu'on entraîne, jamais un retour en
         * arrière visible entre deux ticks locaux.
        
```

## Bloc 16

```text
         * pvJoueur (PV courants, pas le max) : Basic Training ne combat
         * jamais — rien ne doit jamais le faire redescendre ici. On garde
         * la copie locale telle quelle (déjà correctement plafonnée par
         * progresserBasicTrainingLocalIdleV120_ via Math.min(pvJoueurMax,...)).
        
```

## Bloc 17

```text
             * Norman (2026-09-11) : "Quand je mets des points dans Basic
             * training, ils me sont souvent rendus. je dois les remettre
             * une 2eme fois." Cause trouvée : le serveur peut refuser cette
             * écriture avec {ok:false} quand son verrou (LockService, 2.5s
             * max) est déjà pris par une autre requête (ex. la synchro
             * périodique qui tombe pile au même moment qu'un clic). Ce cas
             * était traité comme si l'allocation avait simplement échoué
             * "pour de bon" : un resync généraliste ré-affichait le DERNIER
             * état confirmé par le serveur (donc SANS l'allocation qui
             * vient d'être refusée) — les points "reviennent" visuellement
             * — mais rien ne renvoyait jamais cette allocation, sauf si un
             * changement plus récent avait par coïncidence déjà mis
             * idleBasicTrainingDirtyV120 à true. Sans ce coup de chance, le
             * joueur devait recliquer une seconde fois pour que ça reparte.
             * Un refus {ok:false} doit donc TOUJOURS redemander l'envoi
             * (jamais seulement s'il y a déjà un changement plus récent en
             * attente), pas juste se resynchroniser passivement.
            
```

## Bloc 18

```text
         * Norman (2026-09-17) : "Le bouton + ne fonctionne toujours
         * pas. Le - fonctionne." Cause confirmée : contrairement à
         * '-' (jamais bloqué, peut toujours redescendre), '+'/'cap'
         * sont plafonnés par idleAvant (l'énergie Idle NON allouée
         * disponible en ce moment) — sans ça, un clic pourrait
         * dépasser l'énergie réellement possédée. Quand idleAvant vaut
         * 0 (toute l'énergie Idle est déjà répartie ailleurs, ou pas
         * encore produite), '+' ne fait donc RIEN — un comportement
         * voulu (on ne peut pas allouer une énergie qu'on n'a pas),
         * mais totalement silencieux jusqu'ici : rien n'indiquait au
         * joueur POURQUOI le clic n'avait aucun effet, ce qui ressemble
         * exactement à "le bouton ne marche pas". Un simple message
         * suffit à distinguer ce cas réel d'un vrai bug.
        
```

## Bloc 19

```text
         * Norman (2026-09-17) : "La barre d'exp ne tique plus. Elle se
         * remplit juste, je voulais que le tique continue mais qu'il
         * démarré de là où la barre est déjà remplie." Revirement
         * assumé par rapport au correctif du 2026-09-16 ("le tique doit
         * commencer de 0... se vider entièrement avant le 2eme tique") :
         * l'animation CSS sawtooth (.ticking/@keyframes sorealIdleBtTickV1,
         * 0%→100% puis reset instantané) est retirée. skill.progress
         * (calculé ci-dessous à chaque tic local, 100ms) est déjà EXACTEMENT
         * la valeur continue voulue — jamais réinitialisée arbitrairement,
         * seulement remise à un petit reste réel au moment d'un vrai
         * passage de niveau (jamais une remise à zéro décorative). Posée
         * en continu via largeurBarreCombatIdleV121_ (déjà l'unique writer
         * de largeur de barre de combat, jamais un second calcul). Un
         * vrai passage de niveau déclenche un flash bref (classe .pulse),
         * pour garder un "tique" perceptible sans jamais réinitialiser
         * le remplissage lui-même.
        
```

## Bloc 20

```text
         * Audit 2026-09-16 : dans le vrai NGU Idle, l'équipement/loot
         * n'existe QUE dans Adventure Mode -- le combat de boss numéroté
         * (Fight Boss/Basic Training) n'a AUCUN objet équipé dans le
         * vrai jeu. Le serveur (idle-sqlite-runtime.js,
         * statsCombatPrincipalSorealIdleV413_) fige désormais ces deux
         * multiplicateurs à 1 -- ce miroir client DOIT faire pareil,
         * sinon Attack/Defense grimperaient localement avec le stuff
         * équipé puis retomberaient brutalement à chaque resynchro
         * serveur (le champ combatPrincipal.multiplicateurEquipement*
         * reste envoyé pour l'affichage informatif de l'écran
         * Équipement, mais ne doit plus jamais influencer le combat).
        
```

## Bloc 21

```text
         * V121 — une montée de Basic Training ne soigne JAMAIS le joueur.
         * Le serveur conserve les PV absolus quand le maximum augmente ;
         * le client doit faire exactement pareil.
         *
         * Pendant un combat, le maximum est aussi monotone : une réponse
         * réseau légèrement en retard ne peut pas réduire le dénominateur
         * de la barre puis la faire remonter au tick suivant.
        
```

## Bloc 22

```text
       * Norman (2026-09-17) : "le bouton + ne fonctionne toujours pas."
       * Cause confirmée en direct : cloudflare/features/idle/basic-
       * training-stability-v121.html lit la disponibilité d'énergie via
       * document.getElementById('sorealIdleBtIdleV120') — un élément
       * retiré du DOM depuis la refonte de la barre "Énergie
       * d'entraînement" (id désormais sorealIdleEnergieValeurV4). Cette
       * lecture renvoie donc TOUJOURS 0, quelle que soit l'énergie
       * réellement disponible : un clic sur "+" calcule alors une cible
       * bornée à l'allocation actuelle (jamais plus), donc silencieuse la
       * plupart du temps — ou pire, un "moins" involontaire si la valeur
       * saisie est inférieure à l'allocation déjà en place. Expose la
       * vraie source de vérité (déjà utilisée par la barre elle-même)
       * pour que ce correctif externe la lise réellement, au lieu de
       * dupliquer son propre calcul.
      
```

## Bloc 23

```text
       * Norman (2026-09-15) : "l'image a changé pour celle du boss en
       * gardant les points de vie de l'autre ennemi." Root cause confirmée
       * par investigation : adventure-scene-v79.html lit son PROPRE cache
       * partagé (window.__SOREAL_IDLE_RUNTIME_V1__) pour l'image d'ennemi,
       * jamais idleEtat directement — alors que la barre de vie (ce fichier)
       * lit idleEtat directement à chaque tick. Avant ce correctif, un seul
       * endroit dans tout le client appelait pushState (le succès de
       * actionMetaIdleV130_) : dès que ce cache dépassait 2s sans nouvel
       * appel (synchro périodique, résolution d'un combat de zone...), il
       * se re-remplissait tout seul via un aller-retour réseau séparé,
       * indépendant du idleEtat local déjà affiché — d'où un ennemi/boss
       * différent affiché à l'image, avec les PV de l'autre. Appelée
       * maintenant à CHAQUE endroit qui réassigne idleEtat, pas seulement
       * après une action réseau.
      
```

## Bloc 24

```text
           * V186 — aucun état visuel générique sur le raccourci hôte.
           * Les classes globales active/idle-open pouvaient lui imposer
           * une hauteur/bordure du shell et créer le grand cadre vertical.
          
```

## Bloc 25

```text
             * Progression visuelle volontairement asymptotique :
             * elle reste sous 94 % tant que le serveur n'a pas répondu.
            
```

## Bloc 26

```text
       * Basic Training a sa propre horloge. Le tick générique est
       * volontairement plafonné à 1 s pour les combats/animations, mais
       * ce plafond faisait perdre du temps réel d'entraînement dès que le
       * thread principal était bloqué plus d'une seconde. NGU compte les
       * ticks de Basic Training selon le temps réellement écoulé.
      
```

## Bloc 27

```text
         * V41.2 : aucun boss principal ne se reforme dans le run.
         * Ces champs restent à zéro pour absorber une ancienne réponse
         * encore en cache sans recréer un faux cooldown à l'écran.
        
```

## Bloc 28

```text
       * V167 — démarrer Fight ne nécessite pas de reconstruire toute la
       * page. Le seul changement structurel immédiat est l'état des boutons
       * Fight/Fuite ; le ticker met déjà à jour PV, K.O., sorts et journal.
       * Éviter rendreIdleEtat_ ici supprime le flash du bouton et du portrait
       * au clic tout en gardant exactement le même état de jeu.
      
```

## Bloc 29

```text
         * Norman (2026-09-14, capture d'écran du vrai NGU Idle à
         * l'appui) : "avec 1 milliard à générer, avec 1 tic par
         * seconde, ça n'ira pas." Vérifié sur le wiki NGU (formule
         * confirmée par sa capture : Energy Speed 3,4 → arrondi
         * supérieur(50/3,4)=15 tics, exactement "remplit tous les 15
         * tics" affiché en jeu) : le moteur réel tourne à 50 tics/
         * seconde fixes, donc l'intervalle le plus rapide possible est
         * 1000/50 = 20ms (Energy Speed au maximum, 50). Le plancher
         * ici était 90ms — jusqu'à 4,5× plus lent que le vrai jeu ne
         * le permet en fin de partie, quelle que soit la production.
        
```

## Bloc 30

```text
         * V214 — une barre de PV est un instrument d'état, pas une
         * animation décorative. Toute transition CSS retardait visuellement
         * les PV réels (particulièrement Fight Boss). La largeur est donc
         * appliquée au même frame que la valeur HP locale.
        
```

## Bloc 31

```text
         * NGU Fight Boss : HP Regen = Defense / 20 exactement.
         * Aucun additif indépendant n'est documenté.
        
```

## Bloc 32

```text
         * Basic Training ne doit jamais utiliser le dt plafonné du combat.
         * Si un setInterval de 100 ms arrive 1,23 s plus tard à cause du
         * moteur JS, les 1,23 s doivent être comptées, pas seulement 1 s.
        
```

## Bloc 33

```text
         * Norman (2026-09-16) : "je veux que les chiffres [Attaque et
         * Défense] montent en temps réel. Pas juste toutes les x
         * secondes." progresserBasicTrainingLocalIdleV120_ vient de
         * recalculer idleEtat.force/endurance en continu (ligne ~1221),
         * mais patcherResumeStatsIdleV28_ n'était appelée que par la
         * synchro réseau périodique — la barre persistante restait donc
         * figée entre deux réponses serveur. Appelée ici, à chaque tic
         * local (100ms), jamais un second calcul de stats.
        
```

## Bloc 34

```text
         * V200 — une ressource pleine ne continue pas à "tiquer" en
         * arrière-plan. On remet le reliquat à zéro au plafond. Dès que
         * de l'énergie est réellement dépensée, le prochain cycle repart
         * proprement de zéro seconde depuis la nouvelle base.
        
```

## Bloc 35

```text
         * En salle de repos, les PV se régénèrent aussi localement.
         * Le serveur reste autoritaire et recalcule lors de la synchro.
        
```

## Bloc 36

```text
         * Fight Boss NGU : hors combat, un boss blessé récupère
         * progressivement selon SON HP Regen. Cette valeur vient de la
         * référence bf_hp_regen du serveur (idleEtat.regenBoss), jamais
         * de Defense/20 — Defense/20 est la regen du joueur.
         *
         * Un boss à 0 est réellement vaincu et ne ressuscite pas.
        
```

## Bloc 37

```text
         * Après une mort/fuite, Fight redevient disponible dès le premier
         * PV régénéré et Fuite reste grisée tant que le combat est arrêté.
        
```

## Bloc 38

```text
         * Norman (2026-09-17) : "la barre visuelle ne doit plus repartir
         * de zéro à chaque tick... elle représente
         * (énergie déjà accumulée + progression du tick actuel) / max...
         * à 500/500, la génération s'arrête complètement." Largeur posée
         * en continu à chaque tic local de 100ms — jamais un cycle
         * d'animation qui repart de 0%, jamais un état à réévaluer à part
         * (le plafond est déjà géré par
         * mettreAJourBarreProgressionContinueV1_ : progression forcée à 0
         * dès que la valeur atteint le max).
        
```

## Bloc 39

```text
         * V215 — les barres Augmentations sont extrapolées entre deux
         * snapshots serveur à partir de la durée réelle d'un niveau.
         * Elles suivent donc réellement le temps : 15 niveaux/s produit
         * 15 cycles/s (jusqu'au plafond moteur NGU de 50), sans attendre
         * le prochain polling réseau.
        
```

## Bloc 40

```text
           * V217 — animation native par cycle. On ne déduit plus la largeur
           * d'un échantillon de temps à chaque frame : le navigateur anime
           * réellement 0 -> 100 % sur EXACTEMENT la durée d'un niveau,
           * puis recommence à 0. Cela supprime l'effet 25 % -> 75 % observé
           * quand les frames tombaient entre deux bornes de tick.
          
```

## Bloc 41

```text
                 * V218 — correction de la cause réelle du "1/4 -> 3/4".
                 * À 15 Hz sur un écran 60 Hz, une animation strictement
                 * linéaire de 66,7 ms est typiquement échantillonnée à
                 * 0/25/50/75 %, puis le frame suivant tombe déjà sur le
                 * cycle suivant : le navigateur ne présente donc jamais
                 * visuellement 100 %. Même phénomène à 50 Hz.
                 *
                 * Un tick conserve EXACTEMENT la même durée réelle, mais
                 * réserve une courte fenêtre visible à 0 % et à 100 %.
                 * Ainsi chaque cycle observé est bien :
                 * 0 -> montée -> 100 -> reset 0.
                 *
                 * transform:scaleX() est utilisé plutôt que width afin
                 * que l'animation reste sur le compositor et ne provoque
                 * pas de layout jusqu'à 50 cycles/s sur plusieurs barres.
                
```

## Bloc 42

```text
         * Audit 2026-09-13 (Norman, en jouant SOREAL et NGU en parallèle) :
         * "les barres descendent progressivement plus ou moins vite
         * suivant la différence de force de l'ennemi." Vérifié sur le
         * wiki NGU (page Attack) : "Your attack minus the defense of the
         * boss is the amount you deduct from the HP of the boss per
         * second." dpsBase valait jusqu'ici idleEtat.puissance seule,
         * SANS jamais soustraire la Defense du boss (idleEtat.defenseBoss,
         * désormais exposée par le serveur) — contrairement au dégât du
         * boss vers le joueur, qui la soustrayait déjà correctement plus
         * bas. Pas de plancher minimum ici (contrairement au dégât du
         * boss, un choix d'équilibrage SOREAL assumé séparément) : le
         * wiki ne décrit qu'une soustraction pure, jamais un minimum
         * garanti — c'est justement ce qui force à s'entraîner avant de
         * pouvoir blesser un boss trop défensif.
        
```

## Bloc 43

```text
               * Fight Boss suit le modèle NGU à drain continu : le DPS net
               * est appliqué à chaque tick local avec le vrai dt écoulé.
               * Adventure conserve son système distinct par impacts.
              
```

## Bloc 44

```text
                 * Norman (2026-09-16) : "Vérifie que le journal de
                 * combat indique bien quand un boss drop de l'exp.
                 * affiche cette phrase en vert." Type dédié 'bossxp'
                 * (distinct de 'reward', qui reste doré pour les autres
                 * lignes de récompense : +XP générique de synchro,
                 * NIVEAU SUPÉRIEUR) — seule la ligne annonçant
                 * explicitement l'EXP droppée par un boss vaincu doit
                 * être en vert.
                
```

## Bloc 45

```text
                 * Le boss n'est jamais déclaré visuellement mort avant que
                 * sa barre ait réellement peint 0. Sans ce frame forcé, la
                 * transition de mort pouvait remplacer le boss dans le même
                 * tick que le dernier coup et l'œil voyait encore >0.
                
```

## Bloc 46

```text
             * Norman (2026-09-08) : "les boss meurent en 1 coup même quand ils
             * arrivent à nous tuer avant." Un retour anticipé ici sautait
             * TOUJOURS la riposte du boss dès que le coup du joueur venait de
             * l'achever dans le même tick (idleVictoireBossLocaleV49 vient
             * d'être mis à true juste au-dessus) — la riposte pourtant déjà
             * due (même horloge coupsDusIdleV116_) n'était donc jamais
             * infligée. On laisse maintenant la riposte du boss s'appliquer
             * pour CE tick même si le boss vient de mourir ; la garde du
             * KO joueur plus bas (idleVictoireBossLocaleV49) empêche qu'un
             * KO simultané ne "ressuscite" le boss à pleine vie.
            
```

## Bloc 47

```text
             * Norman (2026-09-15) : "perdre un combat contre un boss ne
             * stop pas toujours le combat. Après mon rebirth, même mort le
             * boss continuait à frapper." Cause : cette riposte du boss
             * n'était gardée par AUCUNE condition — seule l'attaque du
             * joueur ci-dessus vérifie idleCombatEnPauseApresDefaiteV1
             * (mis à true plus bas, à la fin de CE MÊME bloc, dès que le
             * joueur tombe K.O.). Au tick suivant, sans ce garde-fou, la
             * riposte continuait de s'exécuter et pouvait re-déclencher
             * indéfiniment le bloc K.O. Ne touche pas au cas déjà couvert
             * par le commentaire du 2026-09-08 ci-dessus (idleVictoireBossLocaleV49) :
             * ce nouveau garde-fou ne peut jamais être vrai au moment où le
             * joueur porte le coup fatal, seulement aux ticks SUIVANTS.
            
```

## Bloc 48

```text
             * Norman (2026-09-16, deuxième signalement le même jour) : "vie
             * qui ne descend pas à la même vitesse dans les 2 jeux, régen de
             * vie plus faible dans SOREAL IDLE" en comparant un fresh start
             * NGU et SOREAL IDLE en parallèle. Cause confirmée : la regen
             * Defense/20 (wiki NGU-idle.fandom.com, page Boss Fights : "HP
             * while fighting is 10*attack, and HP regain is defense/20")
             * n'était appliquée nulle part dans CE tick local de combat actif
             * — seulement côté serveur, et seulement hors combat/pendant le
             * K.O. (idle-sqlite-runtime.js). Le combat affiché en direct ici
             * encaissait donc les dégâts du boss SANS jamais compenser par la
             * regen, contrairement au vrai jeu où les deux stats s'appliquent
             * PENDANT le combat lui-même. Nette directement sur "recus"
             * ci-dessous, jamais un second calcul de PV séparé.
            
```

## Bloc 49

```text
             * NGU : les dégâts entrants sont Boss Attack - Defense.
             * Si Defense dépasse l'Attack du boss, aucun dégât n'est subi.
            
```

## Bloc 50

```text
             * Même règle côté joueur : Fight Boss est un drain continu.
             * La régénération Defense/20 est intégrée au débit net, comme
             * côté serveur. Aucun paquet de dégâts 850/1000 ms ici.
            
```

## Bloc 51

```text
               * Défaite Fight Boss NGU :
               * le coup fatal peint immédiatement 0 PV puis arrête le
               * combat. Aucun K.O., aucun délai artificiel et aucun reset
               * des PV du boss. Les deux barres récupèrent ensuite hors
               * combat selon leurs regens respectives.
              
```

## Bloc 52

```text
               * Mort = combat réellement terminé dès ce tick.
               * Fuite doit devenir grisée immédiatement, sans attendre
               * la prochaine réponse réseau.
              
```

## Bloc 53

```text
               * Ne PAS lancer ici une synchro forcée en parallèle du STOP.
               * Le lot 'combat:defaite' doit être persisté en premier.
               * terminerLotRapideIdleV60_ déclenche déjà la réconciliation
               * après succès : une lecture avant ce succès peut encore
               * renvoyer combatBossActif=true et écraser la récupération.
              
```

## Bloc 54

```text
           * La couleur de la barre dépend uniquement du pourcentage de PV.
           * Aucun état K.O. séparé n'existe plus dans Fight Boss.
          
```

## Bloc 55

```text
         * Norman (2026-09-15) : la note/bouton sous le panneau joueur
         * (".soreal-idle-adventure-fight-note-v1" pour "Combat en cours…"/
         * "Zone sûre…", ou un bouton nu ".soreal-idle-expand-button-v25"
         * pour "Combattre" — rendreZoneCombatAdventureIdleV1_) n'a PAS
         * toujours la même classe selon l'état affiché : un sélecteur de
         * classe fixe ne retrouve donc pas l'élément dans tous les cas
         * (ex. impossible de repérer le bouton "Combattre" pour le
         * remplacer par "Combat en cours…" au tout premier tick d'un
         * combat). C'est toujours le frère immédiat du panneau joueur —
         * repéré par position, jamais par classe.
        
```

## Bloc 56

```text
         * Un combat resté actif sur une zone qu'on a quittée entre-temps
         * (bug corrigé côté serveur dans selectZone, mais une sauvegarde
         * déjà bloquée dans cet état ne doit plus jamais afficher ses PV
         * — voir adventure-scene-v79.html pour le même garde-fou côté
         * décor).
         *
         * Norman (2026-09-16) : "le combat se termine souvent alors que
         * le monstre a encore de la vie... on est parfois renvoyé à la
         * safe zone alors que visuellement on n'est pas toujours à 0 en
         * vie." Cause confirmée : dès que progresserZoneFightLocalIdleV1_
         * détecte monsterHp<=0 ou playerHp<=0, il met fight.active=false
         * LOCALEMENT (avant même la réponse serveur, pour ne pas rejouer
         * la victoire/défaite en boucle — voir plus bas) mais laisse
         * Dès qu'un coup termine réellement la rencontre, fight.active
         * passe à false et l'écran doit basculer immédiatement sur la phase
         * de repos : c'est cette phase qui montre la régénération entre les
         * deux combats. fight.zone seul ne suffit donc plus à piloter les
         * barres après la mort ; il reste uniquement un garde de cohérence
         * pour un combat encore actif dans la zone courante.
        
```

## Bloc 57

```text
           * Norman (2026-09-11) : le panneau joueur Aventure (barre rouge +
           * "X / Y HP") doit se mettre à jour à chaque coup comme celui de
           * l'ennemi juste au-dessus — même technique (poke direct par id,
           * jamais un reflow complet de page pendant un combat qui
           * s'enchaîne toutes les quelques secondes).
          
```

## Bloc 58

```text
           * Norman (2026-09-15) : "on ne regen pas sa vie progressivement
           * quand on est dans la safety zone". idleEtat.adventureRestPv est
           * déjà recalculé à chaque tick par progresserZoneFightLocalIdleV1_
           * (appelée juste avant, même fonction) — mais tant qu'aucun combat
           * n'est actif, rien ne relit jamais cette valeur dans le DOM en
           * dehors d'un rendu complet de page (rendreZoneCombatAdventureIdleV1_).
           * Même formule ici (pvMaxRepos/pvRepos), jamais un second calcul de
           * regen — pour que la barre bouge visiblement pendant le repos, pas
           * seulement au prochain rendu complet.
           *
           * Correctif 2026-09-18 (audit wiki SOREAL IDLE, PISTE 3) : le "+10"
           * ci-dessous n'avait jamais de citation wiki côté serveur non plus
           * (idle-adventure-v47.js, playerHpMaxForAdventureV1) — aucune page
           * NGU ne documente de PV joueur en Aventure (système à seuil dans
           * le vrai jeu, pas de barre de vie). Retiré des deux côtés à la
           * fois pour ne jamais laisser le client dupliquer une valeur que
           * le serveur ne produit plus.
          
```

## Bloc 59

```text
           * Norman (2026-09-15) : "tu devais supprimer le bouton combat
           * dans la safety zone, ça n'est pas fait" — le bouton disparaît
           * déjà au rendu initial (rendreZoneCombatAdventureIdleV1_), mais
           * startZoneFight/resolveZoneFight sont volontairement exclus du
           * rendu complet (estCycleCombatZoneV1, voir plus bas) pour ne
           * jamais perturber un glisser-déposer en cours — la note de combat
           * restait alors figée sur son ancien contenu (ex. le bouton
           * "Combattre" affiché pendant tout un combat, cliquable). Même
           * poke ciblé que le reste de ce bloc, jamais de reflow complet.
          
```

## Bloc 60

```text
           * V206 — garde anti-combat fantôme. Une réponse réseau retardée
           * peut encore dire "actif" après une victoire/fuite. Elle est
           * ignorée et on envoie une seule commande STOP corrective.
          
```

## Bloc 61

```text
         * V1 (2026-09-11) — même principe que le garde-fou Boss plus bas,
         * mais pour un combat de zone Aventure : progresserZoneFightLocalIdleV1_
         * fait vivre fight.monsterHp/playerHp localement entre deux synchros
         * réseau (toutes les idleEtat.syncSecondes, indépendant du combat).
         * Sans ce garde-fou, la synchro remplaçait idleEtat en entier avec
         * l'instantané du serveur — figé depuis le tout début du combat,
         * puisque le serveur n'est notifié qu'au démarrage (startZoneFight)
         * et à la résolution (resolveZoneFight/loseZoneFight) — faisant
         * remonter puis redescendre la barre de vie du monstre en boucle
         * jusqu'à la fin réelle du combat. Norman : "j'ai pas mal de
         * rollback sur la vie des ennemis. Leurs barres de vie remontent,
         * descendent plusieurs fois."
        
```

## Bloc 62

```text
           * Norman (2026-09-15) : "on récupère sa vie très doucement les 2
           * premiers PV récupérés et ensuite ça nous remet full vie en une
           * fois." Cause confirmée : idleEtat.adventureRestPv est une
           * valeur CLIENTE (le serveur ne connaît pas ce concept), jamais
           * incluse dans joueurServeur — ce garde-fou tourne à CHAQUE
           * synchro périodique pendant un combat actif (bien plus souvent
           * qu'une victoire/défaite) et remplaçait idleEtat en entier sans
           * la reporter, l'effaçant silencieusement. Au combat suivant,
           * rendreZoneCombatAdventureIdleV1_ retrouvait adventureRestPv
           * à null et le remettait aussitôt à pvMaxRepos (PLEIN) — d'où le
           * saut brutal après seulement 1-2 ticks de vraie régén locale.
           * Même correctif déjà appliqué ailleurs (voir
           * adventureRestPvAvantV1 plus bas) pour ce même risque.
          
```

## Bloc 63

```text
         * Après le coup fatal local, une synchro périodique lancée AVANT
         * cette mort peut encore revenir avec "ancien boss + combat actif".
         * L'appliquer ferait ressusciter l'ancien portrait et remettrait
         * Fight en combat juste avant la vraie réponse du boss suivant.
         * Tant que le serveur n'a pas confirmé une progression de boss, ce
         * snapshot pré-mort est donc obsolète et doit être ignoré.
        
```

## Bloc 64

```text
         * V175 — récupération après DÉFAITE : le ticker local est l'unique
         * écrivain des PV jusqu'au prochain clic Fight.
         *
         * V174 protégeait uniquement le cas où bossSelection serveur/local
         * était identique. Or une réponse réseau peut transporter une
         * structure légèrement différente (sélection recalculée, catalogue
         * rafraîchi, état ancien parti avant le STOP). Dans ce cas le chemin
         * générique pouvait encore remplacer 1,60 B par 3,18 B en un seul
         * rendu. Pendant cette phase, on fusionne les données non-combat du
         * serveur mais on CONSERVE strictement les deux barres et l'identité
         * du boss affiché. Le prochain clic Fight envoie le snapshot V173
         * exact au serveur.
        
```

## Bloc 65

```text
                 * V176 : pendant cette récupération, la simulation locale
                 * fait déjà avancer Basic Training toutes les 100 ms avec
                 * la même formule NGU. Une sync serveur ne doit pas injecter
                 * d'un coup une Defense de fin de fenêtre, sinon le tick
                 * suivant calcule Defense/20 avec cette valeur future et
                 * remplit artificiellement le reste de la barre.
                
```

## Bloc 66

```text
         * V174 — récupération Fight Boss hors combat.
         *
         * Après une défaite, une requête réseau partie juste AVANT le STOP
         * peut encore revenir avec combatBossActif=true. Ce snapshot est
         * forcément ancien : le client a déjà peint 0 PV, arrêté les coups
         * et envoyé la commande de défaite. Il ne doit jamais ressusciter
         * le combat ni interrompre la régénération.
        
```

## Bloc 67

```text
         * Quand les deux côtés confirment que le même boss est hors combat,
         * les PV affichés restent pilotés par le ticker local de 100 ms.
         * Le serveur persiste la même progression, mais une réponse réseau
         * ne doit jamais remplacer en bloc une barre au milieu de sa montée.
         * Au prochain Fight/Fuite, le snapshot V173 renvoie ces valeurs
         * exactes au serveur.
        
```

## Bloc 68

```text
         * V167 — le serveur simule lui aussi Fight Boss entre deux syncs.
         * Il peut donc confirmer la mort et passer au boss N+1 quelques
         * centaines de ms AVANT que les derniers impacts/animations du
         * client aient fini. L'ancien code traitait alors ce snapshot comme
         * un changement structurel : #app était reconstruit, le bouton Fight
         * passait disabled -> enabled -> disabled et paraissait clignoter,
         * tandis que le portrait changeait au milieu du dernier impact.
         *
         * Tant que le combat LOCAL est encore réellement actif, cette avance
         * serveur est seulement mise de côté. Après une défaite, la commande
         * STOP est désormais confirmée AVANT toute réconciliation réseau
         * (V174), afin qu'aucun snapshot pré-défaite ne puisse reprendre la main.
        
```

## Bloc 69

```text
         * Pendant LE MÊME combat, une synchro réseau ne peut jamais faire
         * remonter une barre de vie. Le serveur peut seulement confirmer un
         * état identique ou plus avancé.
        
```

## Bloc 70

```text
           * Une synchro serveur ne doit jamais remonter les PV pendant le
           * même combat, mais elle doit pouvoir corriger un client local
           * artificiellement trop haut. On conserve donc l'état le plus
           * avancé vers zéro.
          
```

## Bloc 71

```text
           * Basic Training tourne localement entre deux synchros. Garder
           * sa copie la plus avancée évite un micro-retour en arrière des
           * stats toutes les N secondes, qui faisait bouger les PV max.
           * La prochaine synchro hors combat reprend l'état serveur complet.
          
```

## Bloc 72

```text
         * Pas de rendreIdleEtat_ ici : il reconstruit toute la page et fait
         * clignoter textes/images dans l'iframe TV. Le ticker existant met
         * les barres et valeurs à jour sans reflow complet.
        
```

## Bloc 73

```text
         * V167 — ne jamais jeter une demande forcée (mort d'un boss,
         * réconciliation explicite) sous prétexte qu'une lecture périodique
         * est déjà en cours. On la rejoue juste après la réponse courante.
        
```

## Bloc 74

```text
               * Correctif 2026-09-18 (même bug que le va-et-vient de la
               * barre de vie pendant Basic Training) : défense en
               * profondeur, en plus du garde-fou Math.max déjà posé sur
               * les deux points d'application de la réponse serveur —
               * évite même de LANCER une synchro pendant qu'un envoi
               * d'allocation Basic Training est en vol ou en attente,
               * même principe que idleMetaBusyV130 pour l'EXP Shop.
              
```

## Bloc 75

```text
             * Si l'utilisateur a recliqué pendant la synchro,
             * on ne détruit pas son état optimiste avec une réponse ancienne.
            
```

## Bloc 76

```text
             * Correctif 2026-09-18 (Norman, en direct : "je dépense 20 exp,
             * ça s'enlève bien. Je clique ensuite sur +2 exp, et ça me rend
             * les 20 exp dépensés avant, décompte que les 2"). Cause
             * confirmée : cette synchro périodique (toutes les 5-15s,
             * demarrerTickerIdle_) peut être EN VOL au moment où un achat
             * EXP Shop (acheterRessourceMetaIdleV130_ / actionMetaIdleV130_)
             * démarre puis se termine — sa réponse, capturée AVANT l'achat,
             * arrive ensuite et remplace idleEtat en entier (ligne
             * idleEtat=joueurSynchronise plus bas), effaçant silencieusement
             * l'EXP déjà dépensée (et tout autre gain entre-temps) avec
             * l'ancien instantané. idleMetaBusyV130 est déjà exclu du
             * DÉMARRAGE d'une synchro (garde-fou ci-dessus) mais une synchro
             * déjà en vol AVANT l'achat n'est pas concernée par ce
             * garde-fou — elle doit donc aussi être écartée ICI, à la
             * réception, exactement comme idleFastNetworkBusyV60/
             * idleFastPendingV60_() le sont déjà pour la file Basic
             * Training. actionMetaIdleV130_ a déjà remplacé idleEtat avec
             * l'état serveur réellement à jour une fois l'achat résolu —
             * rien à rejouer, le prochain tick périodique resynchronisera
             * normalement une fois les deux requêtes terminées.
            
```

## Bloc 77

```text
               * Norman (2026-09-15) : "une fois dans la safe zone, la vie
               * remonte extremement lentement pendant quelques secondes et
               * se remplit full d'un coup." Même cause que le garde-fou
               * adventureRestPvAvantSyncV1 ci-dessus (appliquerSynchroCombatSansReflowIdleV116_),
               * mais pour le cas SANS combat actif (repos en zone) : cette
               * fonction retourne alors false et laisse ce remplacement
               * intégral de idleEtat effacer adventureRestPv (valeur
               * cliente, jamais connue du serveur) — au tick suivant,
               * rendreZoneCombatAdventureIdleV1_ le retrouvait à null et le
               * remettait aussitôt à pvMaxRepos (PLEIN), d'où le saut brutal
               * après seulement quelques ticks de vraie régén locale. Ce
               * garde-fou tourne à CHAQUE synchro périodique, combat actif
               * ou non — il doit donc être reporté ici aussi.
              
```

## Bloc 78

```text
               * Correctif 2026-09-18 (Norman, en direct : "la barre de vie
               * monte à 3M et redescend... au moment où tu places tes
               * premiers points dans basic training") — même cause que le
               * garde-fou adventureRestPv juste au-dessus, mais pour
               * Basic Training : progresserBasicTrainingLocalIdleV120_
               * recalcule force/pvJoueurMax à CHAQUE tick de 100ms (jusqu'à
               * 50 niveaux/s par compétence), mais ce remplacement intégral
               * (hors combat de boss actif, donc valable en permanence
               * pendant l'entraînement) écrasait force/pvJoueur/pvJoueurMax/
               * basicTraining avec l'instantané serveur de CETTE synchro
               * périodique (5-15s), toujours en retard sur la simulation
               * locale — d'où le va-et-vient répété. Même remède que
               * appliquerEtatBasicTrainingIdleV120_ (même bug, même jour) :
               * Math.max(local,serveur) pour les stats qui ne peuvent que
               * grandir, jamais un retour en arrière visible.
              
```

## Bloc 79

```text
       * Norman (2026-09-17) : "je veux complètement modifier la façon
       * dont la barre d'Énergie d'entraînement fonctionne... elle ne
       * doit plus repartir visuellement de zéro à chaque tick." Cette
       * fonction ne pilote plus la largeur de la barre (c'était son seul
       * rôle avant : relancer un cycle CSS 0%→100% à chaque tick, "purement
       * décoratif", sans lien avec la valeur réelle) — la largeur est
       * désormais posée en continu par
       * mettreAJourBarreProgressionContinueV1_, appelée à chaque tic
       * local de 100ms (voir mettreAJourJeuIdleLocalV7_). Seul reste ici
       * l'éclat (shine) déclenché au moment précis où un tick COMPLET
       * vient d'ajouter de l'énergie — un flourish visuel, jamais la
       * source de vérité de la barre.
      
```

## Bloc 80

```text
       * V200 — cycle visuel de génération demandé par Norman.
       *
       * La quantité déjà générée est la BASE immuable du cycle courant.
       * Pendant le temps nécessaire à produire le prochain point, la
       * partie verte parcourt tout l'espace restant jusqu'au cap :
       *
       *   0/500   : 0   -> 500
       *   1/500   : 1   -> 500
       *   100/500 : 100 -> 500
       *
       * Quand le tick se termine, le point est réellement ajouté puis le
       * cycle suivant repart de cette nouvelle base. La barre ne prétend
       * donc jamais qu'un point intermédiaire est acquis : seul le texte
       * X / 500 représente l'énergie réellement disponible.
       *
       * Au cap, la barre reste pleine et aucune animation n'est appliquée.
      
```

## Bloc 81

```text
         * V214 — le moteur visuel suit désormais le rafraîchissement écran.
         * L'ancien setInterval(100 ms) plafonnait l'affichage à 10 mises à
         * jour/s : une ressource censée tiquer 15 ou 50 fois/s sautait donc
         * plusieurs ticks d'un coup. Le calcul reste fondé sur le temps
         * réellement écoulé, mais chaque frame peut maintenant matérialiser
         * les ticks au moment où ils deviennent dus.
        
```

## Bloc 82

```text
         * Les achats déjà envoyés sont placés avant les achats encore
         * en attente pour calculer correctement les coûts successifs.
        
```

## Bloc 83

```text
         * Une réponse d'entraînement est autoritaire pour l'énergie et les
         * statistiques qu'un entraînement peut modifier. On ne remplace pas
         * tout idleEtat ici : une action rapide indépendante (équipement,
         * boutique, combat...) peut encore être optimiste localement.
        
```

## Bloc 84

```text
         * Le ticker repart exactement du moment de la réponse serveur.
         * Il ne doit pas ajouter une seconde fois le temps écoulé pendant
         * la requête réseau.
        
```

## Bloc 85

```text
         * Important V23 :
         * on déplace les achats vers "envoyés" AVANT de vider la file.
         * Leur énergie reste donc réservée pendant toute la latence serveur.
        
```

## Bloc 86

```text
             * Toujours réconcilier immédiatement l'énergie de l'entraînement,
             * même si une autre action rapide est encore en attente.
             * Avant V115, la réservation était supprimée puis la réponse
             * serveur pouvait être ignorée : 50 redevenait brièvement 250.
            
```

## Bloc 87

```text
             * L'appel a échoué : on rend les achats à la file locale.
            
```

## Bloc 88

```text
       * ==========================================================
       * ACTIONS INSTANTANÉES V60
       * ==========================================================
       *
       * Règle pour tout nouveau bouton de gameplay :
       * 1. modifier idleEtat immédiatement ;
       * 2. planifier le rendu au prochain frame ;
       * 3. ajouter l'intention dans idleFastPendingV60 ;
       * 4. laisser le réseau persister en arrière-plan.
       *
       * Aucun bouton de gameplay ne doit attendre Apps Script
       * avant de donner son feedback visuel.
      
```

## Bloc 89

```text
       * V167 — une synchro forcée ne doit jamais être perdue parce qu'une
       * synchro périodique est déjà en vol. C'est particulièrement critique
       * au frame de mort d'un boss : cette seconde lecture est celle qui
       * ramène le boss suivant (nom, id, image, PV) après la transition.
      
```

## Bloc 90

```text
         * Le serveur est la source de vérité pour toutes les valeurs
         * dérivées. Une réponse d'achat contient joueur{}, tandis que la
         * réconciliation ciblée les renvoie directement à la racine.
        
```

## Bloc 91

```text
           * Une réponse de boutique ne peut être appliquée que si aucun
           * clic PLUS RÉCENT n'attend encore. Sinon l'état optimiste local
           * est volontairement conservé jusqu'au prochain lot.
          
```

## Bloc 92

```text
         * On n'envoie jamais une mutation pendant une autre mutation
         * historique du client. L'interface, elle, reste totalement libre.
        
```

## Bloc 93

```text
           * Audit 2026-09-16 (précisé le 2026-09-17 après relecture
           * externe) : `runner` (google.script.run) reste l'API historique
           * Google Apps Script — un polyfill `window.google.script.run`
           * existe bel et bien, mais il vit dans un fichier séparé
           * (cloudflare/public/cloudflare-bridge.js), jamais dans CE
           * fichier. `selectionnerZoneAventureSorealIdle` n'a de toute
           * façon aucune contrepartie serveur restante — la vraie
           * sélection de zone Aventure passe déjà par
           * __selectionnerZoneAdventureIdleV47__ (idle-adventure-v47.js,
           * confirmée fonctionnelle en direct). Branche retirée plutôt que
           * laissée à lever une ReferenceError si jamais atteinte ; les
           * autres branches de ce switch dépendent de la même API Apps
           * Script indisponible et méritent un audit dédié séparé (portée
           * plus large que ce correctif ponctuel).
          
```

## Bloc 94

```text
         * La réservation d'énergie est immédiatement reflétée
         * dans l'interface. Le serveur reste la source de vérité.
        
```

## Bloc 95

```text
         * Le clic équipe réellement l'objet dans l'état local
         * AVANT tout accès réseau.
        
```

## Bloc 96

```text
             * On remet uniquement le lot raté en attente.
             * Les cases ne réapparaissent pas pendant ce temps.
            
```

## Bloc 97

```text
         * Disparition immédiate, sans attendre aucun appel Apps Script.
        
```

## Bloc 98

```text
         * V144 — Norman (audit 2026-09-11) : "ne remet jamais le flag
         * serveur à false, donc au prochain chargement complet ça peut
         * repartir pour un tour." idleAutoAventureV30 est réhydraté
         * depuis j.autoAventure.actif (le SERVEUR) à chaque rendu complet
         * — l'éteindre seulement en local/localStorage (sauverCombatAutoIdleV30_)
         * ne survit pas à ce réhydratage. Persiste maintenant aussi côté
         * serveur, exactement comme le fait (faisait) le bouton manuel
         * AUTO ON/OFF, pour une extinction réellement durable.
        
```

## Bloc 99

```text
       * V144 — nettoyage (audit 2026-09-11, "Audit possible duplicate
       * Adventure zone system in IDLE") : actualiserBoutonAutoAventureIdleV62_
       * et basculerCombatAutoIdleV30_ (+ son export window) ne servaient
       * QUE le bouton "AUTO ON/OFF" du rendu carteZoneAventureIdleV80_/
       * rendreAventureIdleV16_, confirmé mort (zéro appelant, remplacé par
       * le moteur V47 — voir suppression groupée plus bas). Supprimés
       * ensemble : plus aucun bouton visible ne peut activer AUTO, seul
       * un compte historique déjà sauvegardé avec autoAventure.actif=true
       * peut encore le déclencher (chargerCombatAutoIdleV30_ ci-dessous,
       * puis la réhydratation serveur) — voir arreterCombatAutoIdleV30_
       * plus bas pour l'extinction durable de ce résidu.
      
```

## Bloc 100

```text
       * V144 — nettoyage (audit 2026-09-11) : idZoneSelectionneeIdleV33_ /
       * selectionnerZoneAventureIdleV33_ (+ export window) et le journal
       * "V77" ci-dessous (ajouterLogAventureIdleV77_ et alentours)
       * n'appartenaient qu'au rendu mort carteZoneAventureIdleV80_ /
       * rendreAventureIdleV16_ (zéro appelant confirmé) — supprimés avec
       * lui. Le vrai sélecteur de zone Aventure vit dans
       * cloudflare/features/idle/adventure-scene-v79.html
       * (<select class="soreal-idle-zone-select-v1">), sans équivalent
       * de ce genre.
      
```

## Bloc 101

```text
       * V144 — nettoyage (audit 2026-09-11, "Audit possible duplicate
       * Adventure zone system in IDLE") : carteZoneAventureIdleV80_,
       * rendreAventureIdleV16_, statutZoneAventureIdleV17_,
       * reactiverBoutonsAventureIdleV17_,
       * afficherRechercheRencontreAventureV110_,
       * demarrerCombatAventureInstantaneV50_, attendreIdleV19_,
       * creerBlocCombatIdleV19_, animerCombatIdleV19_,
       * creerRequestIdAventureIdleV110_, terminerRequeteAventureIdleV110_,
       * echouerRequeteAventureIdleV110_, envoyerRequeteAventureIdleV110_
       * (et idleAventureRequestV110) supprimés — audit confirmé : zéro
       * appelant hors de ce cluster (le seul routeur de page 'aventure'
       * pointe uniquement vers pageAventureIdleV28_/le moteur V47), tout
       * son DOM cible (#sorealIdleZoneStatusV17_*, #sorealIdleFightV19_*,
       * .soreal-idle-zone-v16, etc.) n'est plus jamais construit. Le vrai
       * combat de zone vit dans progresserZoneFightLocalIdleV1_ (appelée
       * depuis mettreAJourJeuIdleLocalV7_) + adventure-scene-v79.html.
       * combattreAventureIdleV17_ ci-dessous reste le SEUL point d'entrée
       * encore atteignable (via l'AUTO résiduel pour un éventuel compte
       * historique) : simplifié en extinction directe et durable d'AUTO
       * plutôt que de rejouer toute cette chaîne vouée à l'échec (le
       * serveur refuse déjà explicitement cette RPC,
       * SOREAL_IDLE_V47_LEGACY_DISABLED, idle-sqlite-runtime.js).
      
```

## Bloc 102

```text
       * Norman (2026-09-16, référence : capture d'écran du vrai écran
       * Rebirth NGU) : le vrai jeu détaille CHAQUE facteur du calcul du
       * NUMBER (Boss Power Bonus, Rebirth Time Factor, Training level
       * Factor, chacun avec sa version "dernier Rebirth") — SOREAL
       * n'affichait qu'un ratio final opaque ("×1.234"). Le serveur
       * calcule déjà TOUT ça (calculateIdleNguNextNumber, exposé tel quel
       * dans state.rebirth.preview via idleNguSnapshot) ; pur gap
       * d'affichage côté client, aucun nouveau calcul nécessaire ici.
      
```

## Bloc 103

```text
             * Norman (2026-09-15) : "après mon rebirth, même mort le boss
             * continuait à frapper." idleCombatEnPauseApresDefaiteV1 et
             * idleVictoireBossLocaleV49 sont des drapeaux CLIENTS (jamais
             * dans idleEtat, voir leur déclaration plus bas dans ce
             * fichier) — le remplacement intégral de idleEtat ci-dessus ne
             * les touche pas. S'ils étaient restés à true suite à une mort
             * juste avant le clic Rebirth, le joueur se retrouvait bloqué
             * en incapacité d'attaquer (geste gardé par ce même drapeau)
             * pendant que la riposte du boss, elle, continuait — même
             * correctif que reprendreCombatBossIdleV1_/definirCombatBossIdleV39_
             * ci-dessous pour toute reprise normale de combat.
            
```

## Bloc 104

```text
             * V186 — Safe Zone autoritaire après Rebirth. Les timers AUTO
             * et le localStorage sont hors idleEtat : les couper ici évite
             * qu'un combat Adventure ancien reparte tout seul.
            
```

## Bloc 105

```text
         * Correctif 2026-09-13 : le bouton Rebirth paraissait "ne rien
         * faire" pendant les 3 premières minutes d'un run — cette
         * fonction sortait silencieusement (aucun toast, aucun log) sans
         * jamais atteindre le serveur, qui a pourtant déjà le vrai
         * message (REBIRTH_TROP_TOT). On informe maintenant explicitement
         * le joueur au lieu de laisser croire à un bouton cassé.
        
```

## Bloc 106

```text
       * V179 — dernier menu réellement peint dans #app.
       * Distingue un vrai changement d'onglet d'une réconciliation réseau.
      
```

## Bloc 107

```text
       * V183 — running gag global SOREAL IDLE : chaque nombre EXACTEMENT
       * égal à 69 affiché dans le texte devient "69 lol". Les nombres qui
       * contiennent 69 (6987, 6969, 169, 69.5...) ne sont jamais touchés.
      
```

## Bloc 108

```text
       * Norman (2026-09-18, en direct) : "la barre de menu en haut...
       * actuellement il revient constamment tout à gauche et nous montre
       * basic training." Cause confirmée : .soreal-idle-nav-v28 est une
       * bande défilable (overflow-x:auto), mais chaque rendu complet
       * (rendreIdleEtat_) remplace TOUT #app.innerHTML — l'élément est
       * détruit et recréé, son scrollLeft repart donc toujours à 0
       * (Basic Training, premier onglet de IDLE_MENUS_V1) même quand
       * l'onglet réellement actif (idleMenuActifV28, correctement
       * surligné) est plus loin dans la liste et simplement hors champ.
       * Remet l'onglet actif visible après CHAQUE rendu complet, sans
       * jamais toucher idleMenuActifV28 lui-même.
      
```

## Bloc 109

```text
       * Correctif 2026-09-18 (Norman, en direct : "Le menu Sets et
       * settings fait décaler toute l'interface du jeu") — Element.
       * scrollIntoView() défile, par spécification, TOUS les ancêtres
       * défilables jusqu'à ce que l'élément soit visible, jamais
       * seulement le conteneur voulu (.soreal-idle-nav-v28) : remplacé
       * ci-dessous par un calcul manuel de scrollLeft, borné
       * exclusivement à .soreal-idle-nav-v28.
       *
       * V2 (même jour, re-testé en direct au navigateur après le premier
       * correctif) : le décalage persistait quand même, PAS transitoire.
       * Cause réelle isolée via inspection JS live : le clic natif sur un
       * <button> lui donne le focus AVANT même que l'onclick ne
       * s'exécute (le focus arrive au mousedown) -- et le navigateur
       * fait défiler tous les ancêtres pour rendre l'élément focus
       * visible, y compris #app et .soreal-idle-native-v4, qui ont
       * pourtant tous deux overflow-x:hidden (confirmé : overflow:hidden
       * bloque le scroll utilisateur/molette, mais PAS le défilement
       * natif déclenché par le focus, ni une affectation JS de
       * .scrollLeft -- un vrai piège navigateur, pas une supposition).
       * #app se retrouvait donc avec un scrollLeft non nul QUI NE SE
       * REMETTAIT JAMAIS À ZÉRO tout seul (contrairement à ce qu'un
       * premier test superficiel laissait croire). Corrigé en
       * réinitialisant explicitement le scrollLeft de chaque ancêtre
       * entre la bande et #app (jamais #app lui-même touché autrement
       * qu'à 0, jamais body/html qui n'ont jamais ce problème).
      
```

## Bloc 110

```text
         * Le focus natif du bouton cliqué (mousedown, avant même
         * l'onclick) fait défiler tous les ancêtres jusqu'à #app pour le
         * rendre visible, malgré leur overflow-x:hidden -- jamais remis à
         * zéro tout seul. Chaque ancêtre entre la bande et #app (inclus)
         * est donc explicitement remis à 0 ici, sans jamais toucher la
         * bande elle-même (déjà positionnée ci-dessus) ni body/html.
        
```

## Bloc 111

```text
       * Norman (2026-09-14) : les popups d'information par menu doivent
       * pointer vers le VRAI onglet de navigation correspondant (pour
       * pouvoir déclencher leur popup au premier clic sur cet onglet —
       * voir menuIdleV28_/idleInfosParMenuIdleV1_). Un seul jeu de
       * correspondances menu<->système, jamais dupliqué : la disponibilité
       * (menuDisponibleIdleV28_) ET les popups d'info (idleInfosParMenuIdleV1_)
       * lisent tous les deux IDLE_SYSTEME_PAR_MENU_V1 / son inverse.
      
```

## Bloc 112

```text
           * Audit 2026-09-16 : menuDisponibleIdleV28_ n'avait de branche
           * ni pour 'spendExp' ni pour 'setsZones' (ajoutés le même jour)
           * — ni dans les cas spéciaux ci-dessus, ni dans
           * IDLE_SYSTEME_PAR_MENU_V1 (qui ne couvre que les vrais
           * IDLE_NGU_SYSTEMS) — donc `return false` par défaut plus bas
           * les retirait silencieusement de la liste des menus visibles
           * (IDLE_MENUS_V1.filter(menuDisponibleIdleV28_)). Les deux
           * pages gèrent déjà honnêtement leurs propres états verrouillés/
           * vides en interne, donc toujours visibles au même titre que
           * Settings.
          
```

## Bloc 113

```text
           * EXP Shop se débloque au premier boss et reste visible ensuite,
           * même quand le solde EXP retombe à 0. records.highestBoss est un
           * record permanent qui survit aux dépenses et aux Rebirths.
          
```

## Bloc 114

```text
           * Norman (2026-09-16) : "J'aimerais que le sellout shop
           * n'apparaisse qu'à partir du moment où on récolte ses
           * premiers points d'AP." unlockedEver (SOREAL-IDLE,
           * idleNguSnapshot) reste vrai pour toujours dès le premier AP
           * récolté, jamais réévalué sur le solde courant.
          
```

## Bloc 115

```text
         * 'boutique' (old pieces shop) and 'magie' (old mana/spell shop) are
         * retired V47/V53 legacy systems: their buy actions always return
         * SOREAL_IDLE_V53_LEGACY_SHOP_DISABLED / SOREAL_IDLE_V47_LEGACY_DISABLED
         * server-side, and neither id has a nav tab in navigationIdleV28_() nor
         * a case in menuDisponibleIdleV28_() — so the "Aller à ..." button on
         * their popup could never actually navigate anywhere. Announcing them
         * as "unlocked" is therefore always a stale/false popup for a menu
         * that does not exist in the current game. They are intentionally
         * excluded here; only the popup is suppressed, the underlying
         * j.deblocages.boutique/magie unlock flags are left untouched.
        
```

## Bloc 116

```text
         * Norman (2026-09-10) : "on a encore le popup pour inventaire
         * quand on tue le premier boss. J'aimerai qu'on le supprime. Et
         * qu'un seul popup apparaisse quand on débloque aventure. Ca doit
         * nous débloquer inventaire en même temps et nous en parler dans
         * le même popup." Plus de déclenchement séparé ici : l'inventaire
         * est maintenant annoncé dans les bullets du popup 'aventure'
         * (definitionsNouveautesIdleV75_) — j.inventaireDebloque continue
         * de gater l'onglet lui-même (menuDisponibleIdleV28_), seul le
         * popup dédié disparaît.
        
```

## Bloc 117

```text
       * Norman (2026-09-14) : "Je voudrais que les popups informatifs
       * apparaissent autrement... quand un menu se débloque, il clignote
       * pour nous indiquer de cliquer dessus. Et seulement quand on
       * clique dessus et uniquement la première fois, on aura le popup
       * informatif. Une fois fermé, il ne réapparaitra plus."
       * Remplace l'ancien déclenchement automatique (dès qu'une fonction
       * apparaissait côté état, peu importe si le joueur regardait cet
       * écran) par une résolution "info par menu", appelée UNIQUEMENT au
       * clic sur l'onglet correspondant (menuIdleV28_) — jamais en
       * arrière-plan. Réutilise exactement les mêmes définitions que
       * l'ancien système (definitionsNouveautesIdleV75_ + les systèmes
       * dynamiques de j.systemes.systems) : même contenu, seul le moment
       * d'affichage change.
      
```

## Bloc 118

```text
               * V203 — Money Pit n'est pas "une nouvelle couche de
               * progression" générique. Son premier panneau explique
               * réellement le puits ET la Roue journalière, qui vivent
               * dans le même menu.
              
```

## Bloc 119

```text
       * Les 4 onglets toujours disponibles dès le départ (jamais un vrai
       * "déblocage") ne doivent jamais clignoter ni exiger un
       * acquittement — sinon un tout nouveau joueur verrait 4 onglets
       * clignoter dès son premier chargement, l'effet inverse de ce que
       * Norman demande ("ça peut faire peur aux nouveaux joueurs").
      
```

## Bloc 120

```text
       * Norman (2026-09-16) : "Je veux que tous les textes explicatifs qui
       * ont été ajouté avant l'adaptation fidèle soient retirés... Je veux
       * que tu regardes pour tout nettoyer et ne mettre que les nouveaux
       * que je te donne." + "Il les faut traduits en français avec
       * exactement le même humour. Tu ne changes rien mis à part les noms
       * Sébastien & Norman à la place de 4G."
       *
       * Ces deux tutoriels sont copiés QUASI mot pour mot du vrai tutoriel
       * NGU Idle (capture d'écran fournie par Norman, jeu réel) — seule
       * différence volontaire : "4G" (le pseudo du développeur réel)
       * devient "Norman & Sébastien". Aucune invention SOREAL au milieu
       * (contrairement à l'ancien texte "Palette Infernale"/"prise de
       * service au dépôt", entièrement retiré ci-dessous).
       *
       * TUTORIEL_DEBUT_JEU_PAGES_V1 : premier lancement (ou après avoir
       * effacé sa partie). paragraphes[] permet plusieurs blocs de texte
       * par page (le prologue "THE BEGINNING" en a 5).
      
```

## Bloc 121

```text
       * TUTORIEL_AVENTURE_PAGES_V1 : premier accès réel au menu Aventure
       * (boss 4 vaincu). Remplace intégralement l'ancienne entrée
       * "aventure" de definitionsNouveautesIdleV75_ (texte SOREAL inventé
       * "Les portes du dépôt s'ouvrent...", "Palette Infernale", etc.,
       * plus aucune trace nulle part après ce correctif).
      
```

## Bloc 122

```text
       * TUTORIEL_PREMIER_BOSS_PAGES_V1 : premier boss du Combat de boss
       * numéroté réellement vaincu (bossVaincus passe de 0 à 1+). Reprend
       * le vrai texte NGU (capture d'écran fournie par Norman) — annonce
       * le déblocage du menu Dépenser l'EXP.
      
```

## Bloc 123

```text
       * Norman (2026-09-16), suite : "La première [page] avec le long
       * texte de mise en scène doit être comme elle est actuellement...
       * juste un bouton Continuer." + "le reste des textes, il faut
       * qu'on puisse déplacer la fenêtre et pouvoir en même temps jouer
       * sans qu'elle disparaisse... le fond du jeu ne doit donc pas être
       * flouté... fais la fenêtre plus petite." Deux habillages selon la
       * page : `page.long` (prologue uniquement) garde l'ancien plein
       * écran bloquant avec un seul bouton Continuer ; toutes les autres
       * pages utilisent une petite fenêtre flottante déplaçable (même
       * mécanisme que le popup de stats d'objet en Aventure,
       * activerGlisserPopupObjetAdventureIdleV1_), sans fond assombri,
       * donc sans jamais bloquer le jeu derrière.
      
```

## Bloc 124

```text
         * Bascule (ou reste) sur la petite fenêtre flottante, jamais de
         * fond assombri : le jeu doit rester jouable derrière.
        
```

## Bloc 125

```text
         * root.innerHTML recrée la poignée à CHAQUE changement de page.
         * Les anciens listeners mousedown/touchstart sont donc détruits
         * avec l'ancienne poignée. Réattacher le drag après chaque rendu,
         * sinon seule la première page flottante reste déplaçable sur PC.
        
```

## Bloc 126

```text
         * L'interruption d'un combat en cours n'a de sens que pour la
         * toute première page (plein écran, bloquante) — les pages
         * suivantes (petite fenêtre) laissent le jeu tourner normalement.
        
```

## Bloc 127

```text
         * Un popup pédagogique est prioritaire sur TOUT combat.
         * Le blocage est local et immédiat ; la fuite serveur part ensuite
         * dans la file rapide. Le popup ne dépend donc plus du bouton STOP.
        
```

## Bloc 128

```text
       * Norman (2026-09-14) : "les popups informatifs [ne doivent plus
       * apparaître automatiquement]... seulement quand on clique [sur le
       * menu concerné] et uniquement la première fois." Ce gestionnaire
       * ne gère donc plus QUE le tout premier accueil (une seule fois par
       * partie) — chaque popup par menu est désormais résolu et affiché
       * à la demande par menuIdleV28_ via idleInfosParMenuIdleV1_,
       * jamais en arrière-plan.
      
```

## Bloc 129

```text
         * Norman (2026-09-16) : "Texte quand on lance le jeu la première
         * fois... Ca doit pop au premier lancement du jeu. Ou quand on
         * efface sa partie." Remplace l'ancien texte inventé par SOREAL
         * ("Palette Infernale", "prise de service au dépôt") par le vrai
         * tutoriel NGU traduit, en plusieurs pages (Suivant/Précédent/
         * Passer) au lieu d'un unique popup — cle basée sur
         * generationJoueurIdleV75_ (id+dateDebut), qui change déjà
         * naturellement à chaque nouvelle partie/effacement.
        
```

## Bloc 130

```text
       * Norman (2026-09-16) : "Quand on tue le premier boss, on doit avoir
       * ça qui apparait." Déclenchement indépendant du popup de bienvenue
       * ci-dessus (qui ne s'exécute réellement qu'une fois par génération
       * à cause de son propre garde-fou) — vérifié à chaque application
       * d'état serveur, comme gererPopupsProgressionIdleV75_, mais avec sa
       * propre clé "déjà vu" scoped à la génération (id+dateDebut), donc
       * persistant à travers les Renaissances de la même partie, remis à
       * zéro seulement par un effacement réel.
      
```

## Bloc 131

```text
       * Norman (2026-09-10) : "j'aimerai aussi plus de couleurs dans NGU
       * IDLE, les menus avec des couleurs différentes etc. Ca doit être
       * beaucoup plus coloré pour différencier les menus et leurs
       * fonctions." Une couleur d'accent dédiée par menu (regroupées par
       * thème : combat en rouge/orangé, progression en bleu, magie en
       * violet, ressources en or/vert, etc.), appliquée via la variable
       * CSS --nav-color (bandeau + fond actif) dans soreal-idle-nav-button-v28.
      
```

## Bloc 132

```text
       * Norman (2026-09-14) : liste unique des menus, partagée par la
       * navigation ET par le glisser gauche/droite (naviguerSwipeIdleV1_)
       * — jamais un second ordre de menus dupliqué ailleurs.
      
```

## Bloc 133

```text
       * Norman (2026-09-14) : "je veux que le bouton du Money Pit
       * devienne vert quand le money pit est dispo, dans le menu.
       * Quand on a utilisé le money pit, il redevient comme les autres
       * boutons. Sauf si le daily spin est disponible. Là, le bouton
       * sera jaune tant qu'il nous reste des daily spin. Si ni money
       * pit dispo, ni daily spin dispo, alors le bouton redevient comme
       * les autres." Confirmé sur le wiki NGU (page Money Pit) : "The
       * Money Pit menu button will light up in green..." et (page Daily
       * Spin) : "the Money Pit menu button will light up in yellow...
       * this gets overridden by the Money Pit's green highlight" — même
       * priorité ici (vert > jaune > couleur normale).
      
```

## Bloc 134

```text
         * Norman (2026-09-14) : "j'aimerai aussi que les menus en haut ne
         * soient visibles qu'une fois débloqués. Sinon ça en fait trop
         * d'un coup. Ca peut faire peur aux nouveaux joueurs." Les onglets
         * verrouillés ("🔒 ???????") disparaissent entièrement — seuls
         * les onglets réellement disponibles sont rendus. Un onglet qui
         * vient d'apparaître clignote (idleMenuEstAcquisV1_) jusqu'à son
         * premier clic, qui déclenche aussi son popup d'info le cas
         * échéant (voir menuIdleV28_).
        
```

## Bloc 135

```text
       * Norman : "je t'avais demandé la possibilité de switch d'un écran
       * à l'autre en slidant de gauche à droite et inversément. Par
       * exemple On est sur fight boss, on slide on arrive sur basic
       * training. et en slidant invérsement, on revient sur fight boss."
       * Glisser gauche/droite = passer au menu visible suivant/précédent
       * dans IDLE_MENUS_V1 (même ordre, même liste que la navigation —
       * jamais un second ordre dupliqué), en boucle. Écouteur attaché une
       * seule fois sur document (le conteneur IDLE est reconstruit à
       * chaque rendu, jamais réutilisable comme cible d'écoute directe).
      
```

## Bloc 136

```text
           * Norman (2026-09-14) : "Quand slide de gauche à droite, on
           * doit quand même pouvoir faire glisser la barre des menus en
           * haut. Ça ne doit pas faire changer l'écran." La barre de
           * navigation (.soreal-idle-nav-v28) vit À L'INTÉRIEUR de
           * .soreal-idle-native-v4 — un doigt posé dessus armait donc
           * aussi ce swipe global, changeant d'écran au lieu de laisser
           * l'utilisateur interagir avec la barre elle-même. Un toucher
           * démarré sur la barre de navigation n'arme plus ce geste.
          
```

## Bloc 137

```text
           * Seuil de 60px + glissement clairement plus horizontal que
           * vertical, pour ne jamais interpréter un défilement vertical
           * normal de la page comme un changement d'écran.
          
```

## Bloc 138

```text
       * V2 (2026-09-18, Norman : "for the colors, makes something really
       * beautiful") — remplace l'ancienne teinte dérivée du TITRE (hash
       * déterministe, palette séparée de la navigation) par --nav-color,
       * la MÊME couleur que la pastille de menu active (IDLE_NAV_COULEURS_V1,
       * posée une seule fois sur .soreal-idle-page-root-v28). Un seul
       * identifiant de couleur par menu, jamais deux systèmes qui
       * pourraient diverger visuellement. entetePageIdleV28_ n'a donc
       * plus besoin de connaître le titre pour se colorer : la couleur
       * vient déjà de son ancêtre en CSS pur.
      
```

## Bloc 139

```text
       * Journal de combat Aventure (Norman, 2026-09-11) : réutilise le même
       * principe que idleCombatLogV70 (Combat de boss, plus bas) mais un
       * tableau/rendu SÉPARÉ — écran, palette et cadence différents (un
       * combat de zone s'enchaîne toutes les quelques secondes en continu,
       * jamais mêlé au journal du Combat de boss).
      
```

## Bloc 140

```text
       * Norman (2026-09-14) : "il doit toujours focus la dernière ligne du
       * journal de combat sauf si on remonte manuellement. Mais le focus
       * devra reprendre après un certain temps." L'ancien enBas était
       * recalculé à chaque ligne ajoutée : remonter lire l'historique
       * pouvait se faire aspirer vers le bas dès qu'une nouvelle ligne
       * retombait par hasard à moins de 24px (aucun état persistant).
       * Reprend exactement le même patron déjà éprouvé pour le journal de
       * Combat de boss (idleCombatLogAutoScrollV70_ / journalCombatEstEnBasV70_,
       * plus bas dans ce fichier) — état persistant + écouteur de scroll —
       * et y ajoute la reprise automatique après inactivité, qui n'existait
       * encore nulle part (ni ici ni sur le journal de Combat de boss).
      
```

## Bloc 141

```text
       * Appelée après chaque rendu complet de page (même point d'ancrage
       * que restaurerScrollJournalCombatIdleV70_ ci-dessous) : le nœud du
       * journal Aventure est reconstruit à neuf par rendreZoneCombatAdventureIdleV1_,
       * donc ni l'écouteur ni la position n'y survivent.
      
```

## Bloc 142

```text
       * Norman (2026-09-09) : "l'affichage doit focus la dernière ligne du
       * journal de combat. Il n'y a que si on remonte la liste que l'auto
       * focus doit s'arrêter. Si on retourne manuellement à la dernière
       * ligne, alors il refocus la dernière ligne." — scroll "collant" façon
       * NGU Idle : true tant que l'utilisateur n'a pas remonté la liste.
      
```

## Bloc 143

```text
       * V112 — états visuels du JOUEUR.
       * Les capacités historiques continuent d'utiliser leurs variables
       * dédiées. Ce petit registre accueille les futurs états (gel, feu,
       * poison, stun...) sans alourdir la boucle de combat.
      
```

## Bloc 144

```text
       * V142 — table de verbes de dégâts façon NGU Idle (Norman, ref.
       * cloudflare/reference/ngu-adventure-raw-v1.txt : "table des messages
       * de dégâts... contenu humoristique NGU original — NE PAS traduire
       * mot à mot... à adapter avec l'humour et l'identité SOREAL en
       * gardant la MÊME fonction (échelle de paliers de dégâts croissants
       * avec un message de plus en plus grandiloquent), pas le même
       * texte"). Contrairement aux seuils de zone/set (jamais inventés,
       * copiés du wiki), ceci est explicitement du texte cosmétique que
       * Norman a demandé d'inventer avec l'identité SOREAL (univers
       * dépôt/logistique), pas une valeur de jeu à sourcer.
      
```

## Bloc 145

```text
       * Appelée juste après qu'un rendu complet de page (rendreIdleEtat_)
       * ait recréé l'élément du journal depuis zéro : le nœud DOM est neuf,
       * donc ni l'écouteur de scroll ni la position ne survivent. On
       * réattache l'écouteur et on restaure soit le bas (mode auto-scroll),
       * soit la position mémorisée (l'utilisateur était en train de lire
       * l'historique).
      
```

## Bloc 146

```text
         * Norman (2026-09-09) : le journal doit rester "collé" à la dernière
         * ligne (comme NGU Idle) tant que le joueur n'a pas remonté la liste
         * manuellement. On ne force donc le scroll en bas QUE si l'auto-scroll
         * est actif ; sinon on laisse la position telle quelle (innerHTML sur
         * le même nœud ne réinitialise pas scrollTop) pour ne pas arracher le
         * joueur de l'historique qu'il est en train de lire.
        
```

## Bloc 147

```text
         * V186 — IDLE_BOSS.Conseil = anciens tips SOREAL, non NGU.
         * Seule l'Histoire partagée avec Collection reste visible.
        
```

## Bloc 148

```text
         * V198 — certaines histoires NGU commencent par une information
         * système entre parenthèses (ex. déblocage de The Sewers), suivie
         * de la vraie narration. Cette première phrase n'appartient pas au
         * récit : elle est rendue séparément en information neutre, tandis
         * que le paragraphe narratif conserve l'habillage grimoire/doré.
        
```

## Bloc 149

```text
               * Le client a déjà affiché l'achat. En cas de refus serveur,
               * on resynchronise immédiatement pour annuler proprement
               * l'état optimiste.
              
```

## Bloc 150

```text
               * Réconciliation uniquement lorsque la file est vide.
               * Une réponse serveur ancienne ne peut donc pas écraser
               * un second clic optimiste effectué entre-temps.
              
```

## Bloc 151

```text
         * Achat visible dans LA MÊME FRAME.
        
```

## Bloc 152

```text
               * Norman (2026-09-15) : même effacement silencieux
               * d'idleEtat.adventureRestPv que le garde-fou de synchro
               * Aventure (voir plus haut) — un sort lancé pendant le
               * Combat de boss remplace aussi idleEtat en entier.
               *
               * V2 (2026-09-18) : même cause que actionMetaIdleV130_/
               * rendreIdleEtat_ — un sort lancé pendant un combat de zone
               * Aventure ACTIF écrasait aussi son fight local en cours.
               * Même garde-fou réutilisé avant l'écrasement brut.
              
```

## Bloc 153

```text
       * Norman (2026-09-16) : "En dessous du menu, je voudrais qu'il y ait
       * la barre d'énergie qui tique. Et je voudrais qu'elle reste
       * affichée sur tous les écrans. Comme le menu. Tu peux l'enlever de
       * basic training et de fight boss et n'utiliser que celle que je te
       * demande." Reprend TEL QUEL le panneau déjà construit (et déjà
       * animé à la vraie fréquence de tic, sorealIdleEnergyBarV11/
       * mettreAJourBarreProgressionContinueV1_) auparavant intégré dans
       * pageCombatIdleV28_ — déplacé ici pour vivre dans le shell
       * persistant (voir rendreIdleEtat_, juste après navigationIdleV28_),
       * jamais un second mécanisme de tic inventé. Seul ajout : le texte
       * "Total d'énergie X / Y" superposé directement dans la barre,
       * comme demandé.
      
```

## Bloc 154

```text
       * Norman (2026-09-16) : "il faut aussi un timer avec le temps du
       * run actuel. Un run peut durer plusieurs jours donc prévois
       * l'espace." Format "Xj HH:MM:SS" (jours seulement si >0), jamais
       * un simple HH:MM:SS qui déborderait visuellement sur un run de
       * plusieurs jours.
      
```

## Bloc 155

```text
       * Patch ciblé du résumé de stats (NUMBER/Attack/Defense/Energy/Gold/
       * EXP), par id, sans jamais toucher au reste du DOM — utilisé par la
       * synchro périodique (synchroniserJeuIdleV7_) quand rien de
       * structurel n'a changé, pour éviter le clignotement d'un
       * rendreIdleEtat_ complet (Norman : "je ne veux plus de refresh de
       * l'écran... pas de clignotement de photo").
      
```

## Bloc 156

```text
       * Empreinte structurelle (Norman, 2026-09-10) : "Je suis sur Boss, je
       * ne combats pas et pourtant mon écran se refresh tous les X temps...
       * je ne veux plus de refresh de l'écran dans SOREAL IDLE. Pas de
       * clignotement de photo." La synchro périodique (toutes les
       * ~15s, synchroniserJeuIdleV7_) appelait un rendreIdleEtat_ complet
       * (destruction/recréation de tout #app, y compris les <img>) à
       * chaque tick, même quand rien de visible n'avait changé — c'est le
       * clignotement observé en direct (MutationObserver confirmant un
       * remplacement de #app toutes les ~15s même hors combat).
       *
       * Cette empreinte ne couvre QUE les champs qui déterminent quelles
       * SECTIONS du DOM existent (onglets débloqués, combat en cours,
       * niveau) — jamais les valeurs numériques brutes, qui sont
       * maintenant patchées séparément par patcherResumeStatsIdleV28_ sans
       * jamais toucher au reste du DOM. Si l'empreinte ne change pas, un
       * rendreIdleEtat_ complet produirait de toute façon un DOM identique
       * en structure : inutile de le reconstruire.
      
```

## Bloc 157

```text
       * Norman (2026-09-18) : "je ne veux plus du tableau avec le nom des
       * 20 premiers boss 'Liste des boss'." rendreListeBossIdleV29_ (le
       * tableau complet) avait un seul point d'appel, retiré ci-dessous —
       * fonction supprimée entièrement plutôt que laissée morte.
      
```

## Bloc 158

```text
       * V206 — un combat Fight Boss ne peut exister localement qu'après un
       * geste explicite sur Fight. Un snapshot réseau "actif" ancien ne
       * possède jamais le droit de démarrer le boss suivant tout seul.
      
```

## Bloc 159

```text
       * Pause après défaite (Norman, 2026-09-09) : "le combat doit
       * totalement s'arrêter tant qu'on ne reclique pas sur le bouton."
       * Suivie en dehors de idleEtat (comme idleVictoireBossLocaleV49
       * juste au-dessus) pour ne jamais être effacée par un resync
       * serveur périodique pendant la transition de défaite — sinon le
       * combat pourrait repartir tout seul dès la prochaine synchro.
      
```

## Bloc 160

```text
           * Fight est le seul bouton qui démarre/reprend un combat.
           * Fuite et défaite arrêtent le combat ; aucun état K.O. ou
           * compte à rebours intermédiaire n'existe.
          
```

## Bloc 161

```text
           * Le premier résumé du journal doit couvrir une vraie seconde
           * complète. Sinon un premier tick de 100 ms pouvait afficher
           * 0 dégât alors que la vie descendait réellement.
          
```

## Bloc 162

```text
           * Fuite = STOP immédiat. Aucun K.O. ni compte à rebours.
           * Les PV actuels des deux combattants sont conservés, puis chacun
           * récupère progressivement hors combat selon sa propre regen.
          
```

## Bloc 163

```text
           * Une fuite change aussi l'état K.O./récupération : ce cas garde
           * le rendu complet historique. Le démarrage normal, lui, reste
           * désormais entièrement sans reflow.
          
```

## Bloc 164

```text
       * NUKE — le serveur applique la règle réelle de BossController :
       * Attack/5 > Defense boss ET Defense/5 > Attack boss, puis renvoie
       * la liste des boss réellement nukables.
       * Cette fonction se contente d'afficher rapidement chaque boss vaincu
       * en cascade (overlay autonome, sans toucher au rendu de combat
       * existant) avant d'appliquer l'état final "prêt, reclique Start"
       * renvoyé par le serveur — jamais d'auto-enchaînement silencieux.
      
```

## Bloc 165

```text
         * Plus il y a de boss enchaînés, plus le défilement doit être
         * rapide pour rester "hyper rapide" comme demandé, sans jamais
         * dépasser quelques centaines de ms au total.
        
```

## Bloc 166

```text
         * V184 — NUKE crée une frontière stricte entre deux instances de
         * Fight Boss. Un ancien Start/Fuite encore en file locale ne doit
         * jamais pouvoir être envoyé ensuite sur le boss nouvellement
         * sélectionné.
        
```

## Bloc 167

```text
                 * Réponse NUKE autoritaire : le boss suivant est toujours
                 * affiché PRÊT, jamais déjà engagé par un ancien Fight.
                
```

## Bloc 168

```text
         * Correctif 2026-09-18 (Norman, en direct : "supprime les messages
         * des anciens boss Soreal") — phrasesBossIdleV76_ (taunts 100%
         * inventés SOREAL, ex. "Je vais te mettre en palette.", jamais
         * sourcés wiki) retirée avec sa bulle dédiée
         * (sorealIdleDialogueBossV76) : la vraie histoire du boss
         * (histoireBossMarkupIdleV142_, sourcée wiki, sous la barre de vie)
         * remplace ce rôle. Seule la bulle du joueur reste.
        
```

## Bloc 169

```text
                         * Correctif (Norman : "les boss dans fight boss n'ont
                         * toujours pas leurs images, dans collection on les
                         * voit pourtant") : j.bossImage/j.bossDriveFileId sont
                         * vides pour la plupart des boss (colonnes Image/
                         * DriveFileID non renseignées dans IDLE_BOSS), donc ce
                         * rendu initial synchrone n'affichait jamais rien —
                         * la correction async (chargerImageBossIdleV36_, plus
                         * bas) tombait ensuite sur le même hôte, mais un
                         * nouveau rendu de cet écran (chaque poll de combat)
                         * réinjectait ce markup vide et effaçait la
                         * correction. La carte Collection (construireCarte-
                         * BossIdleV91_) ne souffre jamais de ça car elle
                         * calcule DÉJÀ ce même repli R2 avant de rendre —
                         * repris ici à l'identique.
                        
```

## Bloc 170

```text
         * Norman (2026-09-17) : la barre doit refléter en continu
         * skill.progress (jamais une animation décorative indépendante de
         * la vraie progression) — voir progresserBasicTrainingLocalIdleV120_
         * pour la mise à jour à chaque tic local (100ms).
        
```

## Bloc 171

```text
       * V1 (2026-09-11) — Norman : "Renommer Bestiaire en 'Collection'.
       * Dans cet onglet, on aurait tous les boss tués dans une catégorie.
       * Tous les mobs et boss tués du mode aventure dans une autre
       * catégorie et une dernière catégorie avec toutes les armes
       * obtenues et montées niveau max... avec l'image et les stats
       * quand on clique dessus." Puis : "les items apparaissent dans la
       * catégorie collection dès qu'on les loot. je veux qu'un V vert se
       * coche en haut de la case quand elle est niveau maximum."
       *
       * Les 2 premières catégories réutilisent EXACTEMENT j.bestiaire
       * (déjà distingué par entree.source==='boss'|'aventure', déjà
       * fonctionnel — seulement re-scindé en deux grilles). La 3e
       * réutilise a.itemList (déjà rempli dès le premier butin par
       * record(), y compris pour un objet depuis fusionné/jeté) et le
       * nouveau a.itemCatalog (nom/image/stats par definitionId,
       * idle-adventure-v47.js) pour ne jamais dépendre d'un objet encore
       * présent dans l'inventaire.
       *
       * Pas de "formes" du Cube de l'infini : le jeu ne modélise
       * aujourd'hui le Cube que par 2 totaux qui s'accumulent
       * (cube.power/toughness), aucun palier/forme discret n'existe côté
       * serveur — inventer des formes ici serait afficher des valeurs
       * fictives, exclu. Le Cube apparaît donc avec ses vrais totaux,
       * pas des "formes".
      
```

## Bloc 172

```text
             * Audit 2026-09-13 : cette grille n'appelait jamais les routes
             * R2 déjà utilisées ailleurs (urlBossR2IdleV1_ pour la carte de
             * combat) — restait sur l'ancien driveFileId (toujours vide,
             * DriveApp mort) ou e.image (toujours vide). e.numero (1-based)
             * identifie les entrées "Boss" (même numérotation que le
             * combat). e.zone (chaîne, ex. "sewers") identifie désormais
             * les entrées "Aventure" — le catalogue légataire déconnecté du
             * vrai moteur V47 a été entièrement reconstruit côté serveur
             * (idle-sqlite-runtime.js) pour lire les vraies zones/kills.
             *
             * Correctif 2026-09-16 (Norman : "Chacune des image doit être
             * reliée à un ennemi") : e.rencontres (compteur cumulé de
             * TOUTE la zone) est remplacé par e.index (position stable
             * dans IDLE_ADVENTURE_MOB_CATALOG_V1, un index PAR mob
             * individuellement suivi) — worker.js (choisirCleMobR2_)
             * indexe désormais directement son pool trié avec ce nombre,
             * jamais un hachage qui pouvait faire collisionner deux mobs
             * distincts sur la même image.
            
```

## Bloc 173

```text
       * V1 (2026-09-11) — Norman : "j'aimerai que pour les boosts, tu
       * utilises la bonne image." Un boost obtenu (add(), idle-
       * adventure-v47.js) est aussi tracé dans itemList sous
       * "boost:<type>:<force>" (ex. "boost:power:1") — absent du
       * catalogue (qui ne couvre que sets/spéciaux) puisqu'un boost n'a
       * ni niveau ni image de set. Reconnu ici séparément pour réutiliser
       * EXACTEMENT la même icône que l'Inventaire (urlImageBoostAdventureIdleV138_
       * via iconeObjetAdventureIdleV138_({kind:'boost',...})) au lieu de
       * l'id brut et d'une étoile générique.
      
```

## Bloc 174

```text
       * V2 (2026-09-11) — Norman : "Elles doivent être classées par ordre
       * de difficulté. Set Training en premier, suivi du set Sewers
       * etc. On doit déjà avoir toutes les cases de tous les items du
       * jeu. Mais elles doivent avoir un ? dessus tant qu'elles n'ont
       * pas été débloquées." La grille part maintenant du CATALOGUE
       * complet (Object.keys(catalog)) — jamais de itemList — donc
       * TOUTES les cases existent dès le début, dans l'ordre de
       * progression déjà garanti par SETS (idle-adventure-v47.js, ordre
       * de déclaration = ordre de difficulté réel, sourcé du wiki),
       * jamais reclassées alphabétiquement. Une case sans entrée dans
       * itemList reste verrouillée (❔ / ???), exactement comme les
       * entrées Boss/Aventure non rencontrées.
      
```

## Bloc 175

```text
             * Correctif 2026-09-13 (Phase 11) : maxAtteint venait d'un
             * "niveau>=100" recalculé ici, une troisième copie de la même
             * logique déjà dupliquée côté serveur (record()/checkSets()).
             * Utilise désormais directement info.maxed, exposé par
             * idleAdventureSnapshotV47 via idleAdventureNiveauEstMaxV1 —
             * une seule fonction, réutilisée partout (Collection, V vert,
             * coffre côté serveur).
            
```

## Bloc 176

```text
             * Correctif 2026-09-14 (audit fidélité wiki NGU, mission IDLE) :
             * même bug que afficherDetailsObjetAdventureIdleV138_ ci-dessus
             * — cette carte affichait "Objet spécial" (aucune stat) pour
             * TOUT objet kind==='special', y compris ceux qui ont
             * désormais de vraies Power/Toughness sourcées du wiki
             * (IDLE_ADVENTURE_ITEM_CATALOG_V1 les expose déjà via
             * def.basePower/def.baseToughness, jamais 0 pour ces objets-
             * là — voir idle-adventure-v47.js). estEquipement continue de
             * gouverner l'icône/le niveau (comportement inchangé pour les
             * pièces d'équipement de set) ; estStatBearing gouverne
             * uniquement l'affichage Power/Toughness, élargi aux
             * accessoires spéciaux qui en ont réellement.
             *
             * Correctif 2026-09-18 (Norman, en direct : "le tutorial cube
             * n'a pas de statistiques") : kind==='cube' (Tutorial Cube
             * avant transformation) était exclu ici alors qu'il porte de
             * vraies Power/Toughness sourcées du wiki (SPECIALS.
             * tutorialCube, p:7/t:7 — voir idle-adventure-v47.js). Rien à
             * voir avec le Cube de l'infini déjà transformé (cubeHtml
             * plus haut, unlocked===true, jamais un objet d'inventaire) —
             * uniquement le Tutorial Cube lui-même, kind==='cube' tant
             * qu'il n'est pas encore maxé/transformé.
            
```

## Bloc 177

```text
       * "les stats quand on clique dessus" — bascule l'affichage des
       * stats déjà présentes (mais masquées) dans la carte, sans
       * reconstruire toute la grille ni faire d'appel réseau.
      
```

## Bloc 178

```text
       * Inventory performance V160 — 2026-09-19.
       *
       * Les mutations Adventure Inventory ne passent plus par le verrou
       * global idleMetaBusyV130 ni par rendreIdleEtat_(). Elles utilisent
       * une file FIFO dédiée, un état optimiste et une réconciliation
       * ciblée. Le serveur reste la source de vérité ; le DOM ne dépend
       * plus du round-trip réseau pour répondre au geste utilisateur.
      
```

## Bloc 179

```text
       * V208 — barrière anti-rollback globale de l'Adventure Inventory.
       *
       * V160/V183 savaient déjà rejouer les mutations optimistes et garder
       * une fusion visible pendant un retry. Il restait toutefois deux
       * courses :
       *  - une synchro/une action Aventure partie AVANT la fusion pouvait
       *    répondre APRÈS et réinjecter un snapshot plus ancien ;
       *  - un timeout pouvait cacher une fusion réellement appliquée côté
       *    serveur, puis son retry tentait de consommer à nouveau le même
       *    objet.
       *
       * Le moteur expose maintenant adventure.revision (monotone). Tant
       * qu'une mutation Inventory est en vol, les champs d'inventaire du
       * snapshot serveur sont donc mis en attente et l'état optimiste local
       * reste affiché. Une réponse de révision plus ancienne ne peut plus
       * reprendre le dessus. Le snapshot différé le plus récent est appliqué
       * dès que la file FIFO est vide.
      
```

## Bloc 180

```text
               * V182 — une case vide réutilisée peut avoir changé de
               * position visuelle. Les DEUX index et le handler HTML5
               * doivent suivre desc.index ; conserver l'ancien index
               * envoyait l'objet dans une autre case que celle visée.
              
```

## Bloc 181

```text
         * casesSacAdventureIdleV162_ applique déjà exactement les règles
         * serveur : ids équipés exclus, positions valides conservées,
         * doublons/ids morts ignorés, nouveaux objets placés dans le
         * premier trou libre. On réécrit inventorySlots après CHAQUE
         * mutation optimiste pour empêcher un id fusionné/équipé de rester
         * fantôme dans la table et de décaler la prochaine réorganisation.
        
```

## Bloc 182

```text
           * V182 — quand l'UI déséquipe en déposant directement dans une
           * case du sac, cette case fait partie de la mutation : pas de
           * passage transitoire par "premier trou libre".
          
```

## Bloc 183

```text
           * V180/V182 — B (objet 1/source) peut être équipé. Le moteur
           * transfère alors son slot vers A (objet 2/cible) avant de
           * l'absorber ; le miroir optimiste doit être identique.
          
```

## Bloc 184

```text
           * V207 — tout autre doublon compatible est un accessoire/spécial
           * équipable : il mérite son propre tintement au lieu du silence.
          
```

## Bloc 185

```text
           * V183 — surtout ne PAS reconstruire depuis l'ancien snapshot :
           * la fusion optimiste reste affichée pendant les retries. C'est
           * précisément ce qui neutralise le rollback visuel transitoire.
          
```

## Bloc 186

```text
         * V203 — feedback audio au moment exact où l'action optimiste
         * locale est acceptée. Avant, le son attendait le round-trip
         * serveur puis la réconciliation, ce qui cassait complètement
         * la sensation de fusion/boost sur mobile.
        
```

## Bloc 187

```text
       * Une défaite Adventure renvoie le joueur en Safe Zone sans
       * reconstruire toute l'application. Le sélecteur de zone est le seul
       * morceau de page statique qui doit être réconcilié localement ; le
       * décor et les barres suivent déjà l'état via le runtime partagé.
       * Aucun scrollTo : la position appartient uniquement à l'utilisateur.
       * Le retour Safe Zone doit donc être visuellement neutre côté viewport.
      
```

## Bloc 188

```text
       * Norman (2026-09-10) : "je veux une liste déroulante pour choisir
       * sa zone et des flèches à gauche et droite de ce menu pour passer
       * d'une zone à l'autre." Les flèches ne parcourent que les zones
       * déjà déverrouillées (sélectionner une zone verrouillée échouerait
       * de toute façon côté serveur) — la liste déroulante, elle, montre
       * aussi les zones verrouillées (grisées, désactivées) pour qu'on
       * voie la progression à venir.
      
```

## Bloc 189

```text
       * V146 — nettoyage (Norman, 2026-09-11 : "je ne voulais plus les
       * notifications du mode aventure dans le bas") : nomZoneAdventureIdleV137_,
       * texteButinAdventureIdleV137_, afficherCombatAdventureIdleV137_ et
       * l'overlay #sorealIdleAdventureCombatV137 qu'ils construisaient
       * (carte "vaincu !" fixe en bas de l'écran, CSS
       * .soreal-idle-adventure-combat-v137) n'avaient plus qu'un seul
       * appelant, retiré avec eux — le décor de zone
       * (adventure-scene-v79.html) affiche déjà l'ennemi, sa barre de PV
       * et l'impact visuel du coup, rendant cette notification redondante
       * en plus d'être gênante à répétition.
      
```

## Bloc 190

```text
       * Combat de zone réel (demande Norman 2026-09-09) : "on voit
       * l'ennemi, on voit les barres de vie qui descendent à chaque
       * coup. Comme pour les boss." combattreZoneAdventureIdleV47_
       * ci-dessus (zoneKill, résolution instantanée) reste définie mais
       * n'est plus appelée par l'écran Adventure — remplacée par un vrai
       * combat : startZoneFight ouvre un monstre avec de vrais PV,
       * progresserZoneFightLocalIdleV1_ (appelée depuis le tick général
       * mettreAJourJeuIdleLocalV7_, comme le Combat de boss) inflige des
       * dégâts réels à intervalles réguliers, puis resolveZoneFight
       * clôture le combat côté serveur une fois les PV à 0.
      
```

## Bloc 191

```text
       * Correctif 2026-09-18 (Norman, en direct : "tu dois enlever le
       * bouton 'Combattre' du mode aventure. Les combats se lancent tout
       * seul avec le timing adéquat entre 2 combats") — le bouton manuel
       * (demarrerCombatZoneAdventureIdleV1_, appelait exactement le même
       * startZoneFight que le minuteur automatique ci-dessous) a disparu
       * de l'affichage ; cette fonction devenait donc du code mort
       * (aucun autre appelant), retirée avec lui. Le garde-fou Safety
       * Zone qu'elle portait reste appliqué ailleurs : le minuteur de
       * respawn (plus bas) ne programme jamais de startZoneFight tant
       * que zoneCourante==='safe'.
      
```

## Bloc 192

```text
       * Enchaînement continu façon NGU (Norman, 2026-09-09) : "dans NGU
       * IDLE, les combats en aventure s'enchaînent non stop tant qu'on ne
       * meurt pas, avec un temps de repop défini entre 2 mobs. On peut le
       * réduire par la suite." Vrai NGU (confirmé wiki, page Adventure
       * Mode) : les monstres réapparaissent toutes les 4 secondes par
       * défaut, réductible par équipement/NGU/Perk/Wish — valeur reprise
       * telle quelle ici, réductible plus tard par les mêmes leviers.
       *
       * Correctif 2026-09-18 (Norman, en direct : "les combats se lancent
       * tout seul avec le timing adéquat entre 2 combats (durée à voir
       * sur le wiki, mécanique importante car on peut réduire par la
       * suite le timing entre 2 rencontres... farmer plus vite en late
       * game)") — le "réductible plus tard" ci-dessus n'avait jamais été
       * câblé : idleNguBonuses().respawnReduction (idle-ngu-progression.js,
       * combine déjà NGU Respawn + set Clock, clamp 0-0.75) était calculé
       * côté serveur mais jamais lu côté client, le délai restait
       * toujours 4000ms pile. Exposé dans systemes.bonuses (même snapshot
       * que systemes.adventure), lu ici pour réduire réellement le délai.
      
```

## Bloc 193

```text
       * V166 — la régénération entre deux combats a sa propre horloge réelle.
       * Le ticker générique reste plafonné à 1 s pour les animations/combat,
       * mais ce plafond ne doit jamais supprimer du temps de soin quand le
       * navigateur retarde un tick (même correctif de principe que Basic
       * Training V166). Le prochain combat reçoit adventureRestPv, donc cette
       * valeur doit correspondre exactement à ce qui a été affiché.
      
```

## Bloc 194

```text
       * NGU Adventure — Idle Mode / combat manuel.
       * Vérifié sur le wiki NGU (Skills + Basic Training, 2026-09-19) :
       * - Idle Mode attaque automatiquement chaque seconde, dégâts x1.2,
       *   x1.5 après le set Spoopy, et donne +20% HP Regen ;
       * - tant qu'Idle Mode est actif, aucun coup manuel n'est utilisable ;
       * - chaque compétence manuelle se débloque en même temps que son
       *   Basic Training correspondant.
       *
       * UX téléphone : Idle Mode reste actif par défaut et les deux rangées
       * de compétences ne sont affichées que lorsque le joueur le coupe.
       * Les boutons gardent une hauteur tactile >= 48px, sans obliger le
       * joueur mobile à gérer cette interface pendant le farm normal.
      
```

## Bloc 195

```text
       * NGU Skills — troisième rangée avancée.
       * Déblocages vérifiés :
       * Paralyze = 5 Basic Challenges ; Hyper Regen = Red Liquid ;
       * Beast Mode = Purple Liquid ; Mega Buff = Wish 8 ;
       * Oh Shit = Wish 58 ; Move 69 = Grey Liquid (Gerbil 100, Sadistic).
      
```

## Bloc 196

```text
       * Norman (2026-09-16) : "j'aimerai aussi que dans le journal de
       * combat, ça affiche le nom par rapport à l'image dans le R2. Pas
       * tel quel, mais un peu comme on voit dans le menu Collection. Ce
       * sont les vrais noms par rapport aux images."
       *
       * Remplace l'ancien mécanisme (noms anglais du wiki NGU, un seul
       * jeu pour la seule zone "tutorial") par la MÊME source de vérité
       * que la Collection : le vrai fichier R2 actuellement résolu pour
       * ce combat. Le serveur (worker.js, adventureMob_) expose déjà la
       * clé exacte via l'en-tête x-soreal-idle-r2-key — jamais un second
       * catalogue de noms dupliqué côté client. "seed" = un hachage
       * stable de monsterHpMax (fixe pour toute la durée d'un même
       * combat), garantissant que l'image ET le nom pointent vers le
       * MÊME index de catalogue.
      
```

## Bloc 197

```text
       * Correctif 2026-09-17 (Norman a réorganisé idle/aventure/ avec les
       * vrais noms NGU, fichiers "Adv_<id>_<nom réel>.ext") : l'ancien
       * préfixe à retirer était le zoneId SOREAL ("cave_..."), plus jamais
       * présent — remplacé par le préfixe numérique "Adv_<id>_" partagé
       * par tous les fichiers. Le mot-clé "_boss" en suffixe (ancienne
       * convention) reste toléré en repli, jamais supprimé du contrat.
      
```

## Bloc 198

```text
         * Audit 2026-09-16 : monsterHpMax est une valeur CONSTANTE pour
         * toute la zone (dépend de z.oneHitP, jamais du mob réellement
         * tiré) -- l'utiliser comme "seed" résolvait donc TOUJOURS le
         * même mob du pool ("tous les mobs s'appellent Monster Box").
         * fight.monsterIndex (idle-adventure-v47.js, startZoneFight) est
         * le vrai index tiré au hasard pour CE combat précis -- seule
         * valeur qui varie réellement d'un combat à l'autre.
        
```

## Bloc 199

```text
       * Norman (2026-09-16) : "quand on est à la safe zone, on doit
       * regen x5". Le x5 (Safe Zone) et le x2 (entre 2 monstres en zone
       * active) étaient déjà corrects, mais le x10 post-GRB (wiki NGU,
       * Safe Zone: Awakening Site — "10x after completing GRB set")
       * n'était jamais lu côté client alors que le serveur pose déjà
       * stats.setRewards.safeZoneRegen10x=true une fois le set GRB
       * complété (idle-adventure-v47.js, checkSets/reward.safeZoneRegen10x).
       * Seule source de vérité pour ce multiplicateur — jamais un second
       * calcul, réutilisée par le tick de regen ET par l'affichage.
      
```

## Bloc 200

```text
       * Correctif 2026-09-18 (Norman : "la regen est à 3/s dès le début
       * de l'aventure, sans rien d'équipé — elle doit rester à 1") —
       * double multiplication trouvée : idleAdventureEquipmentStatsV47
       * (idle-adventure-v47.js, SOREAL-IDLE) renvoie déjà stats.regen
       * MULTIPLIÉ par le bonus Safe Zone (×5/×10, wiki NGU) avant de
       * l'envoyer au client. Cette fonction ré-appliquait le même ×5/×10
       * PAR-DESSUS côté client — Safe Zone se retrouvait donc à ×25/×100
       * au lieu de ×5/×10, et un joueur sans équipement (0 avant
       * multiplication, mais un cube/bonus de set résiduel donnait
       * rarement un 0 strict) voyait ce résidu amplifié deux fois.
       * Safe Zone renvoie donc désormais 1 (stats.regen porte déjà tout
       * le bonus de zone) ; seul le bonus de combat (×2, réglage SOREAL
       * "enchaîner plusieurs monstres sans repasser par la Safe Zone",
       * jamais appliqué côté serveur) reste un vrai multiplicateur client.
      
```

## Bloc 201

```text
       * Parité NGU Adventure V2.
       *
       * L'ancien combat SOREAL n'utilisait pas réellement les statistiques
       * affichées : un mob normal était forcé à mourir en 5 coups et sa
       * riposte retirait une fraction fixe des PV du joueur. Deux écrans
       * avec les mêmes Power/Toughness pouvaient donc avoir des résultats
       * très différents. Le combat ci-dessous utilise désormais les stats
       * réelles déjà transportées par le serveur pour CHAQUE mob.
      
```

## Bloc 202

```text
       * Wiki NGU : Safe Zone = x5 HP Regen, x10 après le set GRB.
       * Hors Safe Zone et hors combat, aucune multiplication x2 n'existe :
       * on conserve la regen normale. L'ancien x2 SOREAL pouvait rendre
       * toute la vie presque instantanément juste après un kill.
      
```

## Bloc 203

```text
         * NGU garde un plancher de 10 % du Power du monstre : avoir une
         * Toughness énorme ne peut donc pas rendre chaque attaque nulle.
        
```

## Bloc 204

```text
         * Important : la mort est locale et immédiate. On n'attend jamais
         * le round-trip Cloudflare pour commencer le repos après une
         * victoire. Le serveur confirme ensuite butin/compteurs.
        
```

## Bloc 205

```text
           * Une défaite doit attendre la confirmation serveur qui replace
           * réellement le joueur en Safe Zone. Une victoire, elle, peut
           * commencer à régénérer immédiatement pendant cette confirmation.
          
```

## Bloc 206

```text
             * Le coup létal termine le combat ICI. L'ennemi n'obtient
             * jamais une riposte gratuite sur le même tick.
            
```

## Bloc 207

```text
         * La régénération reste continue entre deux impacts, mais les
         * dégâts eux-mêmes sont strictement appliqués et journalisés
         * coup par coup.
        
```

## Bloc 208

```text
       * V145 — The Beast a 4 vrais paliers de difficulté (Norman,
       * 2026-09-11 : confirmé que ce n'est "pas un minijeu", juste un
       * seuil à choisir). Le sélecteur ci-dessous (rendreCarteTitanAdventureIdleV145_)
       * lit la valeur choisie et l'envoie ; les titans sans palier
       * (t1-t5) n'ont pas de sélecteur, difficulty reste vide — le
       * serveur retombe alors sur "easy" par défaut sans jamais planter.
      
```

## Bloc 209

```text
       * V147 — Norman (2026-09-11) : "c'est pas vraiment des minijeu, il
       * faut juste aller à certains endroits et faire certaines choses,
       * non ?" Walderp (t5) se cache réellement dans un panneau de l'app
       * après chaque forme (sauf la dernière) — idle-adventure-v47.js le
       * tire au sort côté serveur et l'expose via titans[].state.hiddenPanel
       * (déjà dans le snapshot standard, aucun champ nouveau à brancher).
       * Cette bannière apparaît sur TOUTES les pages (injectée une seule
       * fois dans le rendu principal, jamais dupliquée par page) : elle
       * indique où aller tant qu'on n'y est pas, et un bouton "Le
       * débusquer !" dès qu'on est au bon endroit.
      
```

## Bloc 210

```text
       * V147bis — doit rester en synchronisation exacte avec
       * WALDERP_HIDE_PANELS_V147 (idle-adventure-v47.js, côté TV) : ne
       * couvrir QUE des menus réellement présents dans navigationIdleV28_
       * ci-dessous (voir la liste complète juste avant) — "boutique"/
       * "magie"/"personnage" existent encore comme routes de rendu mais
       * ne sont plus dans la navigation visible depuis la parité NGU.
      
```

## Bloc 211

```text
       * Trou trouvé par l'audit du "gros chantier" NGU (2026-09-10) :
       * consumeUnlock (idle-adventure-v47.js) transforme un objet spécial
       * de titan/boss (A Number, Giant Seed, Scrap Paper, UUG Hair,
       * Pissed Off Key, Wandoos 98) en déblocage réel de NGU/Yggdrasil/
       * Diggers/Beards/Tower/Wandoos — mais AUCUN bouton nulle part dans
       * le jeu n'appelait cette action. Un joueur pouvait looter ces
       * objets sur les titans/boss sans jamais pouvoir les utiliser,
       * rendant tous ces systèmes (pourtant fonctionnels côté moteur)
       * inaccessibles. s.unlockItems[id] (déjà renvoyé par
       * idleAdventureSnapshotV47) passe à true dès l'obtention — cette
       * section affiche un bouton "Utiliser" tant qu'il n'a pas encore
       * été consommé.
      
```

## Bloc 212

```text
       * Bug trouvé en testant en direct (Norman, 2026-09-10) : "on doit
       * pouvoir les fusionner en les glissants les uns sur les autres" ne
       * fonctionnait pour AUCUN objet (pas seulement les boots) — le
       * serveur (idle-adventure-v47.js) attend les champs `a`/`b`
       * (confirmé par son propre test : {action:"merge",a:...,b:...}),
       * mais ce client envoyait `idA`/`idB` — toujours FUSION_INVALIDE
       * (A/B introuvables) quel que soit l'objet.
      
```

## Bloc 213

```text
         * V222 — le moteur Aventure sait absorber le Cube via action:"cube",
         * mais le runtime de production reçoit encore le contrat historique
         * Inventory action:"boost",toCube:true. On conserve donc ce contrat
         * réseau et le serveur le normalise vers "cube". Cela évite le
         * rollback visuel boost disparu/réapparu observé quand un runtime
         * encore ancien rejette ACTION_AVENTURE_INCONNUE pour "cube".
        
```

## Bloc 214

```text
       * Menu déroulant personnalisé pour la sélection de zone d'Aventure
       * (même composant visuel que "Trier par" en Équipe, team-sort-*).
      
```

## Bloc 215

```text
       * L'ennemi, sa barre de PV et son étiquette boss sont affichés
       * directement sur le décor de la zone (cloudflare/features/idle/
       * adventure-scene-v79.html, superposé sur l'image), pas ici — évite
       * un doublon d'ids (#sorealIdleAdventureFightPvV1 / -BarV1) entre
       * les deux modules, et répond à la demande de Norman de voir
       * l'ennemi sur le décor plutôt que minuscule dans une case à part.
      
```

## Bloc 216

```text
       * V152 — Norman (2026-09-11, 3 captures NGU en référence) : "je veux
       * pareil. Pas juste 7/8 pv." Le panneau joueur (nom, Power/Toughness/
       * Max HP/HP Regen, vraie barre rouge) doit toujours être visible en
       * Aventure, pas seulement un texte "7 / 8" pendant un combat — le
       * repos réutilise la même formule que le serveur (playerHpMaxForAdventureV1
       * = stats.hp, idle-adventure-v47.js -- le "+10" a été retiré des deux
       * côtés le 2026-09-18, audit wiki PISTE 3, aucune page NGU ne
       * documentant de PV joueur en Aventure) pour afficher les PV pleins
       * hors combat, sans dupliquer une seconde source de vérité.
      
```

## Bloc 217

```text
       * Norman (2026-09-14) : "on doit regen sa vie progressivement quand
       * on arrive dans la safe zone. Pas tout d'un coup." Hors combat, les
       * PV affichés étaient toujours pvMaxRepos (frais, à chaque rendu) —
       * un joueur K.O. se retrouvait donc instantanément à PV pleins dès
       * l'arrivée en Safe Zone. idleEtat.adventureRestPv est maintenant le
       * seul PV "au repos" persistant, remis à 0 à la défaite
       * (progresserZoneFightLocalIdleV1_) et régénéré ici même à chaque
       * tick via le regen déjà affiché (HP Regen/s), jamais un second
       * calcul de regen.
      
```

## Bloc 218

```text
         * Norman (2026-09-14) : "on doit regen sa vie progressivement quand
         * on arrive dans la safe zone. Pas tout d'un coup." idleEtat.
         * adventureRestPv est le seul PV "au repos" persistant (valeur
         * cliente, régénérée à chaque tick par progresserZoneFightLocalIdleV1_
         * via le même regen déjà affiché ci-dessous — jamais un second
         * calcul). Ici : juste l'initialiser/le plafonner pour l'affichage,
         * jamais recalculer le regen lui-même.
        
```

## Bloc 219

```text
         * Norman (2026-09-16) : "Ma fiche me met... Max HP: 29 / ❤️ 28 / 28
         * HP. Le Max HP devrait être à 29/29." Cause confirmée : `pv` était
         * toujours tronqué (idleEntier_, Math.floor) mais `pvMax` restait
         * une valeur brute non tronquée (pvMaxRepos) hors combat — le
         * badge "Max HP" (formatGrandNombreIdleV70_, qui arrondit) pouvait
         * donc afficher un nombre différent de celui réellement utilisé
         * pour le "X / Y HP" juste en dessous. Les deux doivent toujours
         * dériver de LA MÊME valeur tronquée, jamais un arrondi d'un côté
         * et une valeur brute de l'autre.
        
```

## Bloc 220

```text
         * Correctif 2026-09-18 : `pv`/`pvRepos` (valeur courante) ne sont
         * plus utilisés ici — le libellé "❤️ X / Y HP" et la largeur de la
         * barre sont désormais peints uniquement par
         * mettreAJourJeuIdleLocalV7_ (même id/classe, élément déplacé
         * dans le cadre noir). pvMax reste nécessaire pour la carte
         * "Max HP" plus bas. L'initialisation/le plafonnement
         * d'idleEtat.adventureRestPv juste au-dessus reste nécessaire
         * (lu par ce même tick rapide), même sans lecture locale ici.
        
```

## Bloc 221

```text
         * Audit 2026-09-13 : contrairement à pvMaxRepos (alors 10+stats.hp,
         * un vrai +10 du serveur, idle-adventure-v47.js:
         * playerHpMaxForAdventureV1), ce "+1" n'avait aucune contrepartie
         * serveur — un pur artefact client datant d'avant le correctif Max
         * HP/Regen (stats.regen était toujours 0). Retiré pour afficher
         * exactement Defense/20 (5/s pour un joueur neuf avec Defense=100),
         * fidèle au wiki NGU.
         *
         * Correctif 2026-09-18 (audit wiki, PISTE 3) : le "+10" cité ci-dessus
         * comme "vrai" bonus serveur a depuis été retiré lui aussi (aucune
         * page NGU ne documente de PV joueur en Aventure) -- pvMaxRepos vaut
         * désormais stats.hp seul, des deux côtés.
        
```

## Bloc 222

```text
         * Norman (2026-09-14) : "quand on clique sur combattre dans la
         * safety zone, le journal spam 'Vous avez vaincu l'ennemi'." La
         * Safety Zone n'a jamais eu de combat (wiki NGU, cf. serveur) —
         * le bouton n'y apparaissait pourtant pas de garde. Masqué ici,
         * remplacé par un message explicite ; garde serveur ajoutée en
         * plus (startZoneFight rejette maintenant explicitement "safe").
        
```

## Bloc 223

```text
         * Norman (2026-09-18) : "je veux que la barre de vie de l'ennemi
         * et la nôtre soient superposées dans le cadre noir 'ADVENTURE'.
         * La barre de l'ennemi au dessus et la nôtre juste en dessous.
         * Enlève le petit cadre '⚔️ Tutoriel SOREAL'. Mets juste les
         * statistiques en dessous du cadre noir dans son propre cadre.
         * Et pour terminer je veux le journal de combat."
         *
         * Les 2 barres de vie (ennemi + joueur) et leur libellé "❤️ X / Y"
         * sont maintenant des éléments STATIQUES créés une fois par
         * adventure-scene-v79.html à l'intérieur du cadre noir
         * (.soreal-idle-v79-adventure-copy), avec les MÊMES id/classes
         * qu'ici auparavant (#sorealIdleAdventureJoueurPvLabelV1,
         * .soreal-idle-adventure-player-pv-label-v1,
         * #sorealIdleAdventureJoueurBarV1) — la mise à jour rapide
         * existante (mettreAJourJeuIdleLocalV7_, 100ms, cible ces mêmes
         * id/classes par getElementById/querySelector, jamais par
         * position) continue donc de fonctionner sans aucun changement,
         * juste sur un élément déplacé ailleurs dans le DOM.
         *
         * .soreal-idle-adventure-player-panel-v1 reste ici (juste le nom,
         * plus la barre) : c'est le repère de position utilisé par
         * mettreAJourJeuIdleLocalV7_ pour trouver la note/bouton de combat
         * juste en dessous (panneauJoueurEl.nextElementSibling) — retirer
         * cet élément casserait cette mise à jour rapide.
        
```

## Bloc 224

```text
       * V145 — The Beast (t6) est le premier titan avec plusieurs vrais
       * paliers de difficulté (Norman, 2026-09-11). t.difficulties (objet
       * {easy:{p,t},normal:{...},...}, transmis tel quel par le snapshot
       * serveur) détermine si un sélecteur doit apparaître ; les autres
       * titans (t1-t5) n'en ont pas et gardent leur bouton simple.
      
```

## Bloc 225

```text
               * Idle P/T (2026-09-18) : même ajout informatif que pour les
               * zones normales ci-dessus (voir zones.filter(...).map(...)
               * plus haut) -- absent quand non confirmé par le wiki pour ce
               * palier (jamais inventé).
              
```

## Bloc 226

```text
         * Norman (2026-09-10) : "les titans, je ne pense pas qu'ils
         * soient visibles dans un menu dès le début." Confirmé : le vrai
         * NGU ne les révèle qu'une fois leur seuil de boss atteint
         * (corrigé côté serveur : progressionUnlocked reflète maintenant
         * le vrai seuil, pas seulement la chaîne entre titans) — un
         * titan pas encore accessible ne doit donc plus apparaître du
         * tout ici, jamais grisé avec son nom/seuil déjà visibles.
        
```

## Bloc 227

```text
         * Norman (2026-09-14) : "Les stats Power 68.8M et toughness ne
         * sont pas indispensable sur cette page." Retirées de ce résumé —
         * déjà visibles juste en dessous via "Requis : X Power · Y
         * Toughness" (comparaison utile), ici ce n'était qu'une
         * répétition brute des mêmes valeurs. Cube Power/Toughness
         * restent (jamais mentionnés par Norman, information distincte).
        
```

## Bloc 228

```text
           * Norman (2026-09-14) : "dans aventure, enlève les 'Power
           * conseillé : 10 · Toughness : 10'." Retiré — l'info reste
           * consultable en info-bulle sur chaque option du sélecteur de
           * zone (voir zones.filter(...).map(...) plus bas), jamais une
           * répétition brute en tête de section.
          
```

## Bloc 229

```text
           * Norman (2026-09-14) : "Le menu déroulant dans aventure pour
           * choisir sa zone est moche. Utilise le même menu déroulant
           * qu'on utilise ailleurs pour le rendre plus beau." Remplace le
           * <select> natif (liste popup blanche du navigateur, hors
           * charte) par le même menu déroulant personnalisé déjà utilisé
           * pour "Trier par" dans Équipe (team-sort-custom/-trigger/-menu/
           * -option, Soreal_CSS_01_Fondations.html) — jamais un second
           * composant de menu déroulant réinventé.
           *
           * Norman (2026-09-15) : "je veux le menu déroulant des zones
           * tout en haut, au-dessus de l'image de combat." Déplacé avant
           * la section Combat — adventure-scene-v79.html (qui superpose le
           * décor/l'ennemi) insère maintenant son bloc juste avant cette
           * section Combat plutôt qu'en tête de page, donc l'ordre visuel
           * réel devient : Zones, puis décor/ennemi, puis Combat.
          
```

## Bloc 230

```text
                   * Audit 2026-09-13 (Norman) : "un menu non déverrouillé ne
                   * doit jamais être sélectionné... jamais afficher leur nom,
                   * ni ???, ni un nombre total de zones à venir." Filtre
                   * identique à celui déjà utilisé par les flèches ◀▶
                   * (zoneAdventureDeplacerV1_ ci-dessus), jamais un nouveau
                   * système : la liste s'allonge d'elle-même au fur et à
                   * mesure des déblocages, sans rien révéler à l'avance.
                  
```

## Bloc 231

```text
                     * Norman (2026-09-10) : "je ne veux pas POWER 10
                     * TOUGHNESS 10 sur le nom des zones." Le nom reste
                     * seul dans le libellé visible ; Power/Toughness passe
                     * en info-bulle (title) pour rester consultable sans
                     * encombrer la liste.
                     *
                     * Idle P/T (2026-09-18, Norman en chat) : le wiki NGU
                     * publie un troisième seuil à côté de Manual P/T (déjà
                     * affiché ici) -- le seuil minimum pour laisser la zone
                     * tourner sans surveillance (AFK / Auto Aventure) sans
                     * mourir (idle-adventure-v47.js, IDLE_ADVENTURE_ZONES,
                     * sourcé wiki). SOREAL simule un vrai combat coup par
                     * coup (barre de vie réelle, cf. commentaire
                     * idle-adventure-v47.js:~1793 "Combat de zone réel") au
                     * lieu du système à seuil du vrai NGU -- le combat sim
                     * détermine déjà lui-même la survie réelle, donc ce
                     * nombre reste PUREMENT informatif ici (même traitement
                     * que Manual P/T juste à côté, jamais un blocage dur :
                     * cf. idle-adventure-v47.js, correctif 2026-09-14,
                     * "AVENTURE_TROP_FAIBLE... n'aurait jamais dû exister").
                     * Ajouté seulement quand la zone a un Idle P/T confirmé
                     * (z.idleP/z.idleT peuvent être absents -- valeur
                     * ambiguë sur le wiki, jamais inventée, voir
                     * idle-adventure-v47.js).
                    
```

## Bloc 232

```text
           * Norman (2026-09-18) : "enlève le petit cadre avec '⚔️
           * Tutoriel SOREAL'." Le nom de zone est déjà affiché dans le
           * cadre noir juste au-dessus (adventure-scene-v79.html,
           * .soreal-idle-v79-adventure-copy, "ADVENTURE" + <h2>) — cette
           * seconde répétition du nom de zone dans son propre encadré
           * était redondante. rendreZoneCombatAdventureIdleV1_ n'est plus
           * enveloppée dans un .soreal-idle-section-v8 avec titre : elle
           * gère désormais elle-même ses propres cadres (stats, journal).
          
```

## Bloc 233

```text
       * Audit 2026-09-16 : rendreCollectionIdleV22_ (progression de
       * découverte d'équipement par zone, bonus de puissance permanent à
       * la complétion) était un rendu complet et fonctionnel, jamais
       * appelé depuis aucun menu (j.collections/j.collection déjà
       * alimentés côté serveur, données réelles déjà accumulées). Décision
       * Norman (2026-09-16) : lui donner un vrai point d'entrée plutôt que
       * le supprimer — nommé "Sets" (pas "Collection", déjà pris par le
       * Bestiaire dans IDLE_MENUS_V1) pour éviter toute confusion entre
       * les deux écrans.
      
```

## Bloc 234

```text
       * Refonte Inventory Adventure (2026-09-09, demande Norman) : paperdoll
       * par partie du corps + grille du sac + glisser-déposer pour équiper
       * ou fusionner, façon NGU Idle. L'ancien écran (liste de boutons
       * Équiper/Fusionner) est remplacé — plus de position persistée pour
       * le sac (aucun champ d'ordre n'existe côté serveur pour l'inventaire
       * Adventure, contrairement à l'ancien Sac générique jamais branché
       * ailleurs dans le jeu) : seules deux actions réelles et déjà
       * éprouvées sont déclenchées par le glisser-déposer, equip() et
       * merge(), toutes deux inchangées côté serveur.
       *
       * Bug confirmé au passage : le filtre boosts/équipement de l'ancien
       * écran lisait item.type, un champ qui n'existe jamais côté serveur
       * (idle-adventure-v47.js pose kind, jamais type) — la section Boosts
       * était donc toujours vide et un boost apparaissait à tort dans la
       * liste Équipement avec un bouton "Équiper" qui échouait forcément
       * (equip() rejette explicitement kind==="boost"). Corrigé ici en
       * filtrant sur kind.
       *
       * Glisser-déposer HTML5 (ondragstart/ondrop) ne fonctionne pas au
       * toucher sur mobile — SOREAL APP est d'abord une app téléphone.
       * Un repli "toucher pour sélectionner puis toucher la cible" est
       * donc câblé sur les mêmes actions, pour ne jamais régresser
       * l'usage tactile par rapport aux anciens boutons.
      
```

## Bloc 235

```text
       * Norman (2026-09-14) : "tu dois copier la couleur de fond des items
       * selon les codes couleurs utilisés dans NGU Idle. Ca indique la
       * rareté de l'objet. Ca doit également se voir sur l'équipement,
       * dans le coffre, dans collection. (partage les mêmes codes...)"
       * NGU Idle n'a pas de palette de rareté officielle unique et
       * documentée (recherché à plusieurs reprises) — palette dérivée ici
       * directement de la vraie puissance de chaque set (SETS.p/SETS.t
       * côté serveur, exposée au client via basePower/baseToughness sur
       * chaque objet d'équipement/spécial — jamais recalculée ni codée en
       * dur par set ici), sur une échelle logarithmique (Training Set
       * ~0.8 -> Choco Set ~778 000, sur ~6 ordres de grandeur).
       * UNE SEULE fonction, réutilisée par : paperdoll, accessoires, sac,
       * coffre et Collection (ces deux derniers partagent déjà la même
       * classe de carte .soreal-idle-collection-card-v1) — jamais dupliquée.
      
```

## Bloc 236

```text
       * Correctif 2026-09-15 (Norman : "pas besoin d'écrire bottes,
       * pantalon etc... l'icône suffit... pareil pour l'inventaire") —
       * un objet équipé répétait déjà son nom+niveau ici ET dans le
       * popup de détails ouvert au clic (afficherDetailsObjetAdventureIdleV138_).
       * Le libellé du slot (Casque/Torse/Jambes/Bottes/Arme) était gardé
       * à l'époque comme seule façon de savoir quel emplacement est vide.
       *
       * Correctif 2026-09-18 (Norman : "je ne veux pas qu'il fasse écrit
       * Bottes, Pantalon, Torse etc. Je veux juste l'émoji comme c'est le
       * cas actuellement quand la case est vide") — le libellé texte est
       * en fait redondant : iconeSlotAdventureIdleV138_ donne déjà une
       * émoji DIFFÉRENTE par slot (🪖 casque, 👕 torse, 👖 jambes, 🥾
       * bottes, 🗡️ arme), donc l'icône seule identifie déjà l'emplacement
       * vide sans le texte. Libellé retiré entièrement (occupé ET vide) ;
       * le titre reste consultable en info-bulle (title) sur la case.
      
```

## Bloc 237

```text
       * Correctif 2026-09-18 (Norman, en direct : "pour accessoires, je ne
       * veux pas non plus le texte") — même retrait de libellé que les 5
       * autres emplacements (rendreSlotPaperdollAdventureIdleV138_,
       * correctif du même jour) : l'icône (💍 vide ou objet réel) suffit
       * déjà à identifier l'emplacement, le nom complet reste consultable
       * en info-bulle (title) au survol.
      
```

## Bloc 238

```text
       * Correctif 2026-09-18 (Norman, en direct : "je veux les accessoires
       * à la gauche de la tête") — les 2 emplacements accessoire de base
       * rejoignent désormais la grille .soreal-idle-v138-paperdoll
       * elle-même (colonne 1, vide jusqu'ici sur les rangées Casque/Torse,
       * voir grid-template-areas), au lieu d'une rangée séparée sous tout
       * le paperdoll. Un 3e anneau (et au-delà, capacité déverrouillée en
       * jeu) n'a plus de case dédiée dans la grille à 4 rangées : ces
       * emplacements EXCÉDENTAIRES restent rendus dans l'ancienne rangée
       * .soreal-idle-v138-accessories sous le paperdoll, jamais perdus.
      
```

## Bloc 239

```text
         * Norman (2026-09-11) : "chaque fois que j'ajoute un anneau, il me
         * débloque un emplacement supplémentaire... on en a 2 de base."
         * Un emplacement vide supplémentaire était toujours ajouté après
         * les emplacements occupés, sans jamais respecter de plafond — ça
         * donnait l'illusion de débloquer un nouvel emplacement à chaque
         * anneau équipé, à l'infini. Affiche maintenant exactement
         * `capacite` emplacements (occupés + vides), jamais plus.
        
```

## Bloc 240

```text
       * Correctif 2026-09-15 (Norman : "les noms des items ne soient pas
       * visibles directement dans l'inventaire... l'icône suffit... quand
       * on clique dessus, dans le popup, on pourra voir les informations")
       * — le nom/niveau était déjà répété deux fois pour rien : une fois
       * ici sur la carte, une fois dans le popup de détails ouvert au
       * clic (afficherDetailsObjetAdventureIdleV138_, titre + niveau déjà
       * affichés là-bas). Ne garde que l'icône ici, réutilisée telle
       * quelle par les cartes plus grandes de Collection/Coffre qui,
       * elles, doivent garder leur nom visible (demande explicite de
       * Norman) — ce sont des rendus séparés (rendreCoffreAdventureIdleV1_),
       * jamais celui-ci.
      
```

## Bloc 241

```text
       * Norman (2026-09-14) : "je veux l'intégralité de l'inventaire.
       * Je veux les cases vides et qui se remplissent quand un objet
       * tombe. Actuellement, l'inventaire grandit au fur et à mesure."
       * La capacité (24, fixe côté serveur — idle-adventure-v47.js) est
       * assez petite pour tenir sur un seul écran sans pagination :
       * affiche désormais TOUJOURS les `capacite` cases, occupées ou
       * vides, plutôt qu'une liste qui ne grandit qu'avec le contenu.
       * Les cases vides restent de vraies cibles de glisser-déposer
       * (retirer un équipement en le glissant dans une case libre),
       * jamais un simple décor.
      
```

## Bloc 242

```text
       * V196 — contrôleur UNIQUE d'interaction inventaire.
       *
       * Source de vérité : Pointer Events pour souris, tactile et stylet.
       * Aucun item n'est HTML5-draggable : le drag natif déclenche lui-même
       * pointercancel et entre en conflit avec un appui long personnalisé.
       *
       * WebKit/WKWebView : un touchstart actif + preventDefault() est gardé
       * uniquement comme garde anti-callout/drag système. Toute la logique
       * applicative reste dans Pointer Events.
      
```

## Bloc 243

```text
         * Le timer d'appui long n'habite plus ici. Le composant générique
         * long-press-v197 utilise Touch Events en WebView et émet
         * soreal-longpress. V196 ne gère que tap/drag.
        
```

## Bloc 244

```text
           * Pas de comportement navigateur concurrent : tout l'item
           * appartient au contrôleur V196 dès le pointerdown.
          
```

## Bloc 245

```text
           * Après pointerup, l'état est déjà nettoyé. Si la capture se
           * perd avant, on traite cela comme une annulation réelle.
          
```

## Bloc 246

```text
           * V207 — clic/tap n'importe où hors popup = fermeture.
           * Le clic continue ensuite sa vie normale (sélection d'un autre
           * objet, navigation, etc.), on ne crée pas une couche modale.
          
```

## Bloc 247

```text
           * Les taps/clics sont terminés sur pointerup par V196. On bloque
           * donc les clics de compatibilité retardés des WebView.
          
```

## Bloc 248

```text
         * Norman (2026-09-14) : "le tutorial cube doit pouvoir être équipé
         * comme un bijoux avant d'être transformé en cube de l'infini."
         * Confirmé sur le wiki NGU (4G's Merge and Boost Tutorial Cube :
         * Type Accessory) — un objet kind==='cube' n'est plus exclu ici,
         * le serveur (equip(), idle-adventure-v47.js) reste seul juge :
         * il ne bloque plus que le Cube DÉJÀ transformé (s.cube.unlocked),
         * qui n'existe alors de toute façon plus dans l'inventaire.
        
```

## Bloc 249

```text
         * On équipe toujours via l'emplacement réel de l'objet (accessory
         * ou l'un des 5 emplacements du corps), jamais celui visé
         * visuellement — évite d'envoyer un nom d'emplacement (ex. "ring")
         * que le serveur rejette avec SLOT_INVALIDE.
        
```

## Bloc 250

```text
       * V180 — direction unique de fusion.
       *
       * Règle utilisateur corrigée : l'objet 1 est celui sélectionné /
       * déplacé en premier (source). L'objet 2 est celui touché / visé en
       * second (cible). L'OBJET 2 absorbe toujours l'OBJET 1.
       *
       * merge(a,b) côté moteur conserve a et consomme b : la cible est
       * donc toujours "a", sans exception inventaire/équipement.
      
```

## Bloc 251

```text
       * Norman (2026-09-10) : les boosts doivent "prendre une place"
       * dans le même sac que l'équipement — donc plus de menu séparé
       * avec un sélecteur de cible. Glisser un boost sur un objet
       * équipable (équipement ou spécial) l'applique directement, exactement
       * comme glisser un objet identique sur un autre le fusionne.
      
```

## Bloc 252

```text
         * V2 (2026-09-11) — merge() (idle-adventure-v47.js) n'a aucune
         * restriction de type, seulement definitionId identique — deux
         * Tutorial Cube (kind==='cube') doivent pouvoir se fusionner
         * exactement comme deux pièces d'équipement, sinon le niveau 100
         * requis pour débloquer le Cube de l'infini est inatteignable.
        
```

## Bloc 253

```text
           * Correctif 2026-09-18 (Norman, en direct : "on peut l'équiper
           * et déjà le remplir avec les boosts adéquats") : kind==='cube'
           * (Tutorial Cube avant transformation) était exclu ici, alors
           * qu'applyBoost() côté serveur (idle-adventure-v47.js) ne rejette
           * jamais un objet cube comme cible — seul kind==='boost' l'est.
           * Empêchait de booster le Tutorial Cube malgré l'intention
           * explicite de Norman.
          
```

## Bloc 254

```text
           * Deux objets incompatibles ne déclenchent plus une erreur :
           * ils échangent simplement leur case. Cela permet d'organiser
           * librement le sac (équipement au début, boosts à la fin, etc.).
          
```

## Bloc 255

```text
       * Correctif 2026-09-13 : le Cube de l'infini n'avait qu'un
       * ondrop (glisser-déposer) — aucun onclick, contrairement à TOUS
       * les autres emplacements (paperdoll, accessoires, Trash), qui
       * supportent déjà le mode "au toucher : touche l'objet puis la
       * cible" (voir l'instruction affichée en haut de l'onglet
       * Inventory). Sur un écran tactile, sans souris pour un vrai
       * drag-and-drop, le Cube était donc INUTILISABLE en pratique —
       * ce qui explique qu'il paraissait "ne pas exister" malgré un
       * mécanisme serveur déjà complet (idle-adventure-v47.js).
      
```

## Bloc 256

```text
       * Trash NGU-like : un seul emplacement récupérable. Un nouvel objet
       * déposé détruit l'ancien contenu. Le bouton "Supprimer" du popup
       * n'efface JAMAIS directement : il envoie exactement l'objet dans
       * cette Trash récupérable.
      
```

## Bloc 257

```text
       * V146 — Norman (2026-09-11) : "quand un équipement est équipé,
       * j'ai l'impression qu'on ne peut plus le fusionner." Confirmé :
       * un emplacement de paperdoll (rendreSlotPaperdollAdventureIdleV138_)
       * n'était jamais draggable et son clic (clicCibleAdventureIdleV138_)
       * appelait TOUJOURS equiperParIdAdventureIdleV138_ (remplacement),
       * jamais un choix fusionner/booster — un objet déjà équipé était
       * donc bloqué à son niveau tant qu'on ne le déséquipait pas
       * d'abord. Ce helper décide de la bonne action selon ce qui occupe
       * déjà l'emplacement, réutilisé par le clic ET le glisser-déposer.
      
```

## Bloc 258

```text
         * Norman (2026-09-17) : "Les Flubber ne peuvent pas se stacker
         * pour les augmenter au level 100." Root cause confirmée :
         * merge() (idle-adventure-v47.js, ligne ~789) n'exige que
         * source.kind!=='boost'/occupant.kind!=='boost' + même
         * definitionId — AUCUNE restriction à kind==='equipment' (déjà
         * généralisé pour le Tutorial Cube, kind==='cube', par le
         * correctif V2 du 2026-09-11 sur fusionnerSiPossibleAdventureIdleV138_
         * juste au-dessus). Ce SECOND chemin de fusion (glisser/cliquer un
         * objet du sac SUR UN EMPLACEMENT DÉJÀ ÉQUIPÉ, pas sac-sur-sac)
         * avait été oublié lors de cette généralisation et restait limité
         * à kind==='equipment' des deux côtés : un objet kind==='special'
         * comme The Lonely Flubber (ngu-idle.fandom.com/wiki/The_Lonely_
         * Flubber, Accessoire — équipé par défaut puisque c'est le seul
         * accessoire de son slot) tombait alors systématiquement sur le
         * fallback 'equiper' (remplacement silencieux) au lieu de fusionner
         * dès qu'un second exemplaire était obtenu et glissé sur le
         * premier déjà équipé — rendant le niveau 100 requis par le wiki
         * ("level it to level 100 and CTRL+Click to transform it")
         * inatteignable en pratique. Même garde-fou que merge() côté
         * serveur : seul kind==='boost' est exclu.
        
```

## Bloc 259

```text
         * Norman (2026-09-16) : "Sébastien a toujours le boost spécial qui
         * est ajouté à son épée alors que c'est impossible normalement."
         * Un boost "special" ne doit jamais pouvoir cibler une pièce
         * d'équipement (kind:"equipment") — seuls les vrais objets
         * SPECIALS (accessoires/cube) ont un bonus "special" réel. Même
         * garde-fou que le serveur (applyBoost, idle-adventure-v47.js).
        
```

## Bloc 260

```text
         * Correctif 2026-09-18 (Norman, en direct : "on peut l'équiper et
         * déjà le remplir avec les boosts adéquats") : kind==='cube'
         * (Tutorial Cube avant transformation, équipé par défaut dans son
         * seul emplacement) tombait sur le fallback 'equiper' au lieu de
         * 'booster' — même bug que fusionnerSiPossibleAdventureIdleV138_
         * ci-dessus, même garde-fou serveur (applyBoost n'exclut jamais
         * kind==='cube', seul kind==='boost' l'est).
        
```

## Bloc 261

```text
         * V150 — Norman (2026-09-11) : "quand je fusionne avec une pièce
         * équipée, ça déséquipe la pièce... je voudrais que ce soit
         * l'objet [du sac] qui soit aspiré sur la pièce équipée et non
         * l'inverse." merge(s,a,b) (idle-adventure-v47.js) GARDE l'id de
         * "a" et SUPPRIME "b" de l'inventaire — passer (sourceId,occupantId)
         * faisait donc survivre l'objet du SAC et supprimait l'objet
         * ÉQUIPÉ, dont l'emplacement pointait alors vers un id mort
         * (slot visuellement vide). Corrigé : l'occupant (déjà équipé)
         * est toujours "a" (survivant), peu importe lequel des deux a
         * été sélectionné/glissé en premier.
        
```

## Bloc 262

```text
       * V150 — Norman (2026-09-11) : "je veux que pour chaque item, quand
       * on le sélectionne, qu'il affiche quelque part les statistiques de
       * l'arme. On doit voir le niveau sur 100." Power/Toughness d'un
       * objet suivent une formule linéaire au niveau (item(), idle-
       * adventure-v47.js : power=basePower*(1+niveau/100)) — la valeur de
       * base se retrouve donc par simple algèbre à partir des stats déjà
       * connues de l'objet, sans dupliquer les données de set côté
       * client. Les objets "special"/"cube" (Tutorial Cube, etc.) n'ont
       * jamais de Power/Toughness réels : seuls Nom+Niveau s'affichent
       * pour eux. Les "Special Bonuses" du vrai NGU (EM Power/Bars/Cap)
       * ne sont pas encore repris ici — aucune donnée par objet n'existe
       * encore côté SOREAL pour ça, et inventer des valeurs est exclu.
      
```

## Bloc 263

```text
         * Correctif 2026-09-14 (audit fidélité wiki NGU, mission IDLE) :
         * cette condition ne montrait jamais les stats d'un objet
         * kind==='special' (tous les accessoires d'Aventure : Tuba of
         * Time, Cheese Grater, Magicite Crystal, etc.) — alors que le
         * serveur (idle-adventure-v47.js, special()/
         * idleAdventureSpecialBaseStatsV1) leur attribue désormais de
         * vraies Power/Toughness sourcées du wiki (jusqu'à 100 000 pour
         * certains). Les joueurs ne voyaient donc jamais ces stats
         * pourtant réelles. 'special' utilise exactement la même
         * progression de niveau (base×(1+niveau/100), plafond base×2 à
         * 100) que 'equipment' — voir special() côté serveur — donc le
         * même bloc d'affichage s'applique sans changement de formule.
         *
         * Correctif 2026-09-18 (Norman, en direct : "le tutorial cube n'a
         * pas de statistiques") : item.kind==='cube' (le Tutorial Cube
         * avant transformation, cf. special() : kind:d.cube?"cube":
         * "special") reste exclu ici alors que le SERVEUR lui attribue
         * déjà item.basePower/baseToughness réels (idleAdventureSnapshotV47
         * : defById() classe TOUT objet SPECIALS comme kind==="special"
         * pour ce calcul, sans jamais distinguer "cube" -- seul cet
         * affichage CLIENT, qui lit item.kind au lieu de defById(...).kind,
         * les excluait par erreur). Le Cube de l'infini déjà transformé
         * (unlocked===true) n'est plus un objet d'inventaire du tout
         * (rendu séparément, cubeHtml) -- ce correctif ne concerne que le
         * Tutorial Cube lui-même.
        
```

## Bloc 264

```text
           * Correctif 2026-09-13 (Phase 10, X/MAX) : basePower/
           * baseToughness viennent désormais directement du serveur
           * (idle-adventure-v47.js, idleAdventureSnapshotV47), au lieu
           * d'être "reconstitués" ici en divisant la stat actuelle par
           * le facteur de niveau — un raccourci devenu FAUX dès qu'un
           * objet porte un surplus de boost (désormais conservé à
           * travers les fusions, voir remake()) : diviser une stat déjà
           * boostée par le facteur de niveau surestimait la base ET,
           * avec elle, la prévision "au niveau suivant".
           *
           * RÉVISÉ 2026-09-16 (Norman : "dans NGU si un objet est 1/3 et
           * que je le fusionne il passe à 1/4. La seule manière de le
           * faire monter à 2/4 sera de lui mettre des boosts") — le
           * plafond affiché ("Y" dans "X/Y") doit suivre le NIVEAU
           * COURANT de l'objet (base×(1+niveau/100), wiki : "Each time
           * an item levels-up, its maximum potential will go up"),
           * jamais rester fixé à base×2 (le plafond ABSOLU, atteint
           * seulement au niveau 100) — sinon la fusion (qui augmente le
           * niveau sans jamais toucher la stat courante, voir merge()
           * côté serveur) ne se voit jamais à l'écran : le "Y" resterait
           * identique avant/après fusion. applyBoost() (serveur) utilise
           * désormais exactement cette même formule comme plafond réel
           * d'un boost — cet affichage doit rester identique à ce
           * plafond, jamais un second calcul qui pourrait diverger.
          
```

## Bloc 265

```text
           * Norman (2026-09-15) : "pas besoin de la flèche qui montre le
           * total. On le voit directement." La prévision "→ valeur au
           * niveau suivant" est retirée — seuls X/MAX restent affichés.
          
```

## Bloc 266

```text
           * Norman (2026-09-14, confirmé 2026-09-15 "Ca ne doit être
           * écrit en vert que quand c'est un 100% exemple 1/1 mais pas
           * pour 1/2... Rempli de boosts à 100% = toute cette stat écrite
           * en vert") : vert UNIQUEMENT quand la stat courante a
           * réellement atteint (ou dépassé) un plafond RÉEL (base>0) —
           * jamais pour un plafond nul (0), qui rendrait "vert" un objet
           * n'ayant en réalité aucune statistique de ce type (le "Power
           * 1/0" signalé comme "pas possible" : un Cloth Hat n'a jamais
           * eu de Power sur le wiki, ce plafond ne doit jamais se lire
           * comme "atteint").
          
```

## Bloc 267

```text
           * itemHp/itemRegen dérivés de item.power/item.toughness (jamais
           * lus depuis item.hp/item.regen, qui n'existent pas sur les
           * objets déjà en inventaire créés avant ce correctif — même
           * principe que idleAdventureEquipmentStatsV47 côté serveur :
           * tout objet déjà possédé en bénéficie immédiatement). HP
           * Max=Power×3, HP Regen=Toughness×0.03 (règle NGU vérifiée sur
           * ~90 objets du wiki, idle-adventure-v47.js).
          
```

## Bloc 268

```text
           * Norman (2026-09-15) : "Cette statistique n'est pas possible"
           * (Power affiché "1/0" sur un Cloth Hat, qui n'a jamais eu de
           * Power réel sur le wiki) — un plafond RÉEL nul (base=0) rend
           * la stat elle-même impossible à afficher correctement (aucun
           * "X/0" n'a de sens), donc masquée entièrement, pas juste privée
           * de couleur verte. Objets déjà en inventaire avant l'audit
           * wiki (2026-09-15) : leur Power/Toughness stocké peut encore
           * porter un reliquat de l'ancien partage égal, orphelin tant
           * que l'objet n'est pas relevé/refusionné — connu, pas corrigé
           * ici (migration de données distincte, à faire séparément).
          
```

## Bloc 269

```text
                 * Norman (2026-09-18, en direct, capture d'écran de son
                 * propre Tutorial Cube) : "je vois que mon tutorial cube
                 * n'a toujours pas de stats special. Tu n'as rien fait ?"
                 * Cause confirmée (2e partie, ce popup) : cette ligne
                 * n'affichait qu'un nombre brut item.special, sans label
                 * ni plafond, et seulement si >0 -- jamais rien pour un
                 * Special Bonus authentique mais encore non maxé/non
                 * boosté à 0. item.baseSpecial/specialType sont désormais
                 * exposés par le serveur (idleAdventureSnapshotV47, même
                 * convention que basePower/baseToughness) ; même formule
                 * X/MAX que Power/Toughness ci-dessus (plafond = baseSpecial×q),
                 * même label partagé (idleLabelSpecialBonusV1_, la même
                 * table que le panneau Equipment Bonuses).
                
```

## Bloc 270

```text
         * Norman (2026-09-11) : "je n'arrive plus à jeter des items ni à
         * déséquiper des items." Aucun bouton ne permettait de déséquiper
         * un objet (voir unequip() côté serveur, ajouté le même jour) —
         * affiché uniquement quand l'objet sélectionné occupe réellement
         * un slot ou l'un des emplacements accessoires.
        
```

## Bloc 271

```text
         * Norman (2026-09-14) : "Sur le popup qui s'ouvre quand on
         * sélectionne un item. Si cet item est équipable, il doit y avoir
         * un logo pour l'équiper directement." Réutilise
         * equiperParIdAdventureIdleV138_ (déjà la seule fonction sûre pour
         * équiper un objet par id — résout le bon emplacement, rejette
         * boost et le Cube déjà transformé), jamais une seconde logique
         * de résolution d'emplacement.
         *
         * V2 (2026-09-14) : un Tutorial Cube (kind==='cube') redevient
         * équipable ici aussi, tant qu'il n'est pas encore transformé en
         * Cube de l'infini — voir equiperParIdAdventureIdleV138_.
        
```

## Bloc 272

```text
       * Norman (2026-09-14) : "j'aimerai que les stats de l'arme, quand
       * on la sélectionne, s'affichent dans un popup qu'on peut déplacer
       * en le glissant. Il disparaîtrait quand on reclique sur l'item.
       * Un joli popup." Position mémorisée en mémoire (pas de flash au
       * centre à chaque réouverture pendant la session), toujours
       * repositionnée à l'intérieur de l'écran si celui-ci a changé de
       * taille entre-temps.
      
```

## Bloc 273

```text
       * Un emplacement déjà occupé peut désormais être choisi comme
       * SOURCE (tapoter l'objet équipé en premier), pas seulement comme
       * cible d'équipement — condition pour pouvoir ensuite tapoter un
       * doublon dans le sac et le fusionner.
      
```

## Bloc 274

```text
       * V1 (2026-09-11) — Norman a montré une capture du vrai NGU Idle :
       * "il faut que ce soit pareil que NGU... c'est 60 cases par page
       * avec un bouton page 1 2 3 en dessous." Confirmé sur l'image
       * (Equipment fixe en haut, Inventory paginé par 60 en dessous,
       * boutons "Page 1/2/3"). "On doit toujours pouvoir voir
       * l'équipement équipé et l'inventaire sur une même page" — donc
       * seule la grille (Sac ou Collection) est paginée, jamais
       * l'Équipement au-dessus, exactement comme la référence.
      
```

## Bloc 275

```text
       * Norman (2026-09-14) : "Quand on rebirth, l'inventaire ne doit
       * plus être bloqué jusqu'au niveau 4. L'inventaire se débloque une
       * seule fois et reste accessible même si on est au boss 1 après
       * un rebirth." Reproduit en direct (vrai Rebirth sur son compte) :
       * l'onglet Inventory restait bien visible dans la navigation
       * (menuDisponibleIdleV28_ lit déjà j.inventaireDebloque, qui a son
       * propre high-water-mark permanent), MAIS cliquer dessus affichait
       * quand même "🔒 se débloque au boss 4" — cette page vérifiait
       * aventureDebloqueeIdleV47_(j), le flag PROPRE à l'Aventure (zone
       * tutoriel débloquée CE run), qui se reverrouille intentionnellement
       * après un Rebirth (comportement correct pour l'Aventure elle-même,
       * confirmé par le wiki NGU). Deux endroits, deux conditions
       * différentes pour la même question "Inventory est-il utilisable ?"
       * — corrigé en réutilisant ICI exactement le même flag que la
       * navigation, jamais une seconde règle.
      
```

## Bloc 276

```text
       * Norman (2026-09-18, capture d'écran "EQUIPMENT BONUSES" du vrai
       * NGU en direct) : "Je veux ces statistiques de ce que l'équipement
       * procure comme bonus. Dans le bas de la page inventaire." Le vrai
       * panneau liste Power/Toughness/Max Health/Health Regen (les
       * bonus BRUTS fournis par l'équipement, pas les stats totales du
       * joueur), puis "Special Bonuses" et "Player Stat Boosts: Attack/
       * Defense %".
       *
       * a.stats vient de idleAdventureEquipmentStatsV47 (idle-adventure-
       * v47.js), déjà exposé par idleAdventureSnapshotV47 -- exactement
       * la même fonction et la même donnée que celle désormais utilisée
       * côté serveur (idle-ngu-progression.js::idleNguBonuses,
       * equipmentAttackMultiplier/equipmentDefenseMultiplier) pour
       * appliquer réellement ce même bonus au combat, jamais un second
       * calcul qui pourrait diverger. Attack%/Defense% affichés ici sont
       * donc littéralement stats.power/stats.toughness (ratio 1 point =
       * 1%, wiki NGU page Adventure Mode, déjà cité idle-sqlite-
       * runtime.js:9095-9097, revérifié par cette même capture : Power
       * +1 -> Attack 1%, Toughness +1 -> Defense 1%).
       *
       * "Special Bonuses" -- Norman (2026-09-18, audit "Est-ce que tu as
       * bien intégré chacune des statistiques special etc ?") : le champ
       * générique "Special" ci-dessus (item.special, une somme brute sans
       * type) a été remplacé côté moteur par un agrégat TYPÉ par vrai
       * bonus (idle-adventure-v47.js::idleAdventureSpecialsByTypeV1,
       * SPECIALS.<item>.sType/sExtra, chaque magnitude sourcée wiki --
       * voir ce fichier) exposé dans stats.specials.<type>Pct. Ce panneau
       * liste maintenant chaque type réellement présent séparément (ex.
       * "Energy Speed: 5%", "Magic Cap: 2%"), jamais un seul nombre
       * mélangeant des bonus de nature différente.
      
```

## Bloc 277

```text
       * Table partagée type->label wiki des Special Bonuses (Norman,
       * 2026-09-18) -- hissée hors de rendreBonusEquipementAdventureIdleV1_
       * pour que afficherDetailsObjetAdventureIdleV138_ (popup par objet,
       * voir plus bas) la réutilise à l'identique, jamais une seconde
       * table qui pourrait diverger.
      
```

## Bloc 278

```text
         * V146 — Norman (2026-09-11) : "je ne veux pas non plus le
         * tableau qui écrit le nom des items avec 10/100 à côté. Il y a
         * une liste mais elle est inutile." Ce tableau affichait les
         * clés brutes de definitionId (ex. "training:head"), jamais un
         * nom lisible — supprimé, sans équivalent car il n'apportait
         * aucune information qu'un joueur puisse exploiter (le niveau
         * réel de chaque objet est déjà visible sur sa propre carte,
         * équipée ou dans le sac).
        
```

## Bloc 279

```text
         * V162 — ordre manuel persistant : on ne regroupe plus
         * equipment/special/boost par type. La grille suit exactement
         * inventorySlots envoyé par le moteur, trous compris.
        
```

## Bloc 280

```text
               * Norman (2026-09-14) : "j'ai demandé d'enlever le cube de
               * l'infini au-dessus des items équipés." Vérifié sur le
               * wiki NGU (page Infinity Cube) : le vrai jeu l'affiche
               * bien à côté des emplacements d'équipement, "right next
               * to the weapon slot" — jamais AU-DESSUS de tout (ce qui
               * ressemble à un vrai emplacement séparé/prioritaire). La
               * case du Cube suit donc désormais la case Arme dans le
               * paperdoll, au lieu de précéder le Casque — même style de
               * "ressemble à un emplacement d'équipement" que le wiki
               * décrit, jamais retiré ni déplacé (equip() continue de
               * rejeter kind==='cube', comme dans le vrai jeu).
               *
               * Correctif 2026-09-18 (Norman, en direct : "je veux les
               * accessoires à la gauche de la tête") — accessoiresRendu.
               * enGrille (2 cases de base) rejoint désormais la grille du
               * paperdoll elle-même (colonne 1, jusqu'ici vide) au lieu
               * d'une rangée séparée en dessous ; seul un éventuel 3e
               * anneau (et au-delà) reste dans l'ancienne rangée
               * (accessoiresRendu.debordement, vide la plupart du temps).
              
```

## Bloc 281

```text
       * Coffre (Phase 12, 2026-09-13 ; refonte emplacements fixes,
       * audit 2026-09-13) — Norman : "on doit ranger nous-même dans la
       * case appropriée. On peut reprendre les items pour les réequiper
       * au besoin." Chaque emplacement du catalogue d'équipement a
       * désormais une case FIXE et toujours visible (locked/vide/occupée),
       * sur le même gabarit visuel que la grille Équipement de Collection
       * (rendreCollectionEquipementIdleV1_) — jamais un deuxième style de
       * grille inventé. Déposer reste un geste global (glisser sur l'icône
       * Coffre / sélection + clic) : c'est le SERVEUR qui détermine la
       * case d'arrivée (definitionId), jamais un choix libre de case par
       * le joueur. Le client se contente d'afficher le résultat renvoyé.
      
```

## Bloc 282

```text
         * Norman (2026-09-14) : "Je veux pouvoir fermer le coffre ou
         * l'ouvrir. Et il garde la dernière position/état." Seule la
         * grille (potentiellement longue — un slot par pièce
         * d'équipement du jeu) se replie ; le titre et la zone de dépôt
         * restent toujours visibles, pour pouvoir toujours y ranger un
         * objet sans devoir d'abord rouvrir. État mémorisé par appareil
         * (localStorage), pas par compte — c'est une préférence
         * d'affichage, jamais une donnée de jeu.
        
```

## Bloc 283

```text
       * Coffre V197 : ouverture et fermeture utilisent le moteur audio
       * partagé du frontend autonome. Les deux sons appartiennent à la
       * même famille bois/métal mais restent clairement distincts.
      
```

## Bloc 284

```text
       * Correctif 2026-09-13 (Phase 8, Cube de l'infini) : ce slot vivait
       * jusqu'ici tout en bas de l'onglet Inventory, après Trash — hors
       * champ de vision sur mobile, ce qui explique qu'il paraissait "ne
       * pas exister" pour Norman malgré un mécanisme serveur déjà complet
       * (idle-adventure-v47.js : action 'cube', tiers sourcés du wiki).
       * Déplacé en tête du panneau Équipement, juste avant le casque —
       * jamais équipable/déplaçable lui-même (conforme au vrai NGU : "le
       * Cube ne peut jamais être déplacé"), il ne fait qu'absorber des
       * boosts. Image résolue par palier sur R2 (mêmes 11 images déjà
       * présentes : infinityCube_tier_0 à _10), avec repli emoji.
      
```

## Bloc 285

```text
         * V220 — l'Infinity Cube est l'item wiki #100. Son image dépend
         * directement du tier : Item_0100_THE_CUBE_Tier0.png,
         * Item_0100_THE_CUBE_Tier1.png, etc. On transmet donc l'ID et le
         * tier au Worker média au lieu d'un nom SOREAL inventé.
        
```

## Bloc 286

```text
       * Correctif 2026-09-18 (Norman, en direct : "enlève le gros cadre
       * cube de l'infini. Il ne doit apparaitre que quand on a le cube de
       * l'infini. Je ne veux pas ce texte en dessous") — la grosse carte
       * pointillée (icône + libellé + description) apparaissait même
       * verrouillée, ce qui ressemblait à un emplacement d'équipement
       * normal en permanence visible plutôt qu'à un bonus caché tant
       * qu'il n'est pas débloqué. Verrouillé : rien n'est rendu (chaîne
       * vide, jamais une case fantôme). Débloqué : même case carrée
       * icône-seule que les autres emplacements du paperdoll
       * (.soreal-idle-v138-slot), palier/stats en info-bulle (title) au
       * lieu d'un texte permanent — jamais un second style de case.
      
```

## Bloc 287

```text
               * Norman (2026-09-14) : régen progressive des PV Aventure au
               * repos. idleEtat.adventureRestPv est une valeur CLIENTE
               * (le serveur ne connaît pas ce concept de PV "au repos"
               * persistant) — idleEtat=res.joueur ci-dessous remplace TOUT
               * l'objet à chaque action, quelle qu'elle soit, ce qui
               * effacerait cette valeur silencieusement (et resetterait
               * l'affichage à pleins PV) sur la toute première action
               * suivant une défaite. Reportée explicitement après le
               * remplacement, exactement comme le reste de l'état côté
               * serveur ne serait jamais perdu.
              
```

## Bloc 288

```text
               * V4 (2026-09-18, Norman : "l'ennemi a stoppé le combat et
               * récupéré toute sa vie. Combat actif reste déclenché mais
               * plus rien ne se passe.") Cause confirmée : CETTE fonction
               * traite aussi bien resolveZoneFight/startZoneFight que
               * TOUTE autre action Aventure/méta (buyPerk, buyQuirk,
               * challenge, équiper, booster…). Pour ces dernières,
               * idleEtat=res.joueur ci-dessous écrasait un combat de zone
               * ACTIF en cours (fight.monsterHp/playerHp ne vivent QUE
               * côté client entre 2 synchros, voir progresserZoneFight-
               * LocalIdleV1_) par l'instantané figé du tout début du
               * combat renvoyé par le serveur — remontant la vie du
               * monstre à son maximum et gelant la progression locale.
               * Même garde-fou déjà éprouvé pour les sondages périodiques
               * (appliquerSynchroCombatSansReflowIdleV116_, voir plus
               * haut) : s'il reconnaît un combat de zone ou de boss
               * actif, il fusionne déjà idleEtat correctement (fight
               * local conservé) et ne doit alors PAS être réécrasé ici.
              
```

## Bloc 289

```text
               * Norman (2026-09-10) : "l'écran se recharge toutes les x
               * secondes... ça fait perdre le focus (on ne peut plus
               * glisser d'objets pendant ce temps là)." rendreIdleEtat_
               * remplace TOUT le HTML de #app à chaque appel — correct
               * pour la plupart des actions (rares), catastrophique pour
               * les 3 actions de combat de zone qui reviennent en boucle
               * toutes les quelques secondes pendant l'enchaînement
               * automatique. Pour celles-ci seulement : idleEtat est déjà
               * à jour (ligne au-dessus), on notifie juste le runtime
               * partagé (pushState) pour que le décor de zone et la barre
               * de vie se mettent à jour SANS reconstruire toute la page
               * — exactement comme le Combat de boss ne re-rend jamais
               * toute la page à chaque coup.
              
```

## Bloc 290

```text
               * V2 (2026-09-14, Norman : "ça m'indique que je suis dans la
               * tutorial zone alors que c'est l'image de la safety zone.
               * Et je n'arrive plus à revenir dans une autre zone.")
               * loseZoneFight change RÉELLEMENT de zone (retour forcé en
               * Safe Zone, idle-adventure-v47.js) — contrairement à
               * startZoneFight/resolveZoneFight qui répètent la MÊME zone
               * en boucle pendant l'enchaînement, un rendu allégé
               * (pushState seul) y laissait le libellé de zone/dropdown
               * de la page (construits une seule fois par rendreIdleEtat_,
               * jamais par pushState) figés sur l'ancienne zone alors que
               * le décor (lui, abonné au runtime) se mettait à jour —
               * exactement le désync signalé. Une défaite est rare (pas
               * un flot de plusieurs par seconde comme les 2 autres), un
               * rendu complet ici ne recrée donc pas le problème de perte
               * de focus que ce mécanisme visait à l'origine à éviter.
              
```

## Bloc 291

```text
               * V3 (2026-09-15, Norman : "j'ai perdu mais le décor du
               * combat + le boss restent affichés, je suis toujours dans
               * le monde tutorial") — le rendu complet ci-dessous (branche
               * else) reconstruit bien le libellé/dropdown à partir de
               * idleEtat frais, mais NE prévient jamais le runtime partagé
               * (adventure-scene-v79.html lit son PROPRE cache via
               * runtime.getState(), jamais le DOM) : ce cache restait donc
               * bloqué sur l'ancienne zone/le boss jusqu'à sa expiration
               * naturelle (2s) ET qu'un autre événement redéclenche un
               * rendu — plusieurs secondes de désync visuel après CHAQUE
               * défaite, pas seulement un cas rare. pushState doit être
               * appelé dans les DEUX branches : l'idleEtat frais est déjà
               * en mémoire, pas besoin d'un aller-retour réseau (invalidate
               * seul aurait forcé une 2e requête inutile).
              
```

## Bloc 292

```text
                 * Un loot de combat peut remplir une case du sac pendant que
                 * l'Inventory est ouvert. On insère/actualise uniquement les
                 * cartes du sac : le combat et le reste de #app ne bougent pas.
                
```

## Bloc 293

```text
                 * V146 — Norman (2026-09-11) : "je ne voulais plus les
                 * notifications du mode aventure dans le bas." Le cycle de
                 * combat de zone (startZoneFight/resolveZoneFight/
                 * loseZoneFight) revient toutes les quelques secondes
                 * pendant l'enchaînement automatique — le toast générique
                 * ET la carte "vaincu !" (afficherCombatAdventureIdleV137_,
                 * fixe en bas de l'écran) devenaient donc un flot continu
                 * de notifications, alors que le décor de zone affiche
                 * déjà la vraie barre de PV et l'impact visuel du coup.
                 * Les deux sont maintenant supprimés pour ce cycle
                 * uniquement — gardés pour toute autre action Aventure
                 * ponctuelle (équiper, fusionner, booster…), où une
                 * confirmation reste utile.
                
```

## Bloc 294

```text
                 * Défaite en Aventure (Norman, 2026-09-09) : "en aventure,
                 * on doit être renvoyé à la safe zone." loseZoneFight a déjà
                 * fait ce renvoi côté serveur (selectedZone==='safe' dans
                 * res.joueur) — reste à prévenir clairement le joueur, pas
                 * juste le toast générique "Progression mise à jour".
                
```

## Bloc 295

```text
                 * Norman (2026-09-11, référence NGU en capture) : le
                 * journal de combat Aventure doit annoncer le butin obtenu
                 * à la victoire ("X dropped ... gold! Sweet!"), pas
                 * seulement le coup fatal. rollKill (resolveZoneFight)
                 * renvoie drops[] (objets/boosts) ET gold (idle-adventure-
                 * v47.js, valeurs par zone sourcées du wiki NGU page
                 * "Gold" — voir son commentaire dédié).
                
```

## Bloc 296

```text
                 * Déblocage via objet spécial (audit "gros chantier" NGU,
                 * 2026-09-10) : consumeUnlock renvoie {flag}, pas de quoi
                 * afficher un message clair avec le seul toast générique.
                
```

## Bloc 297

```text
                 * Norman (2026-09-14) : "Le money pit et la roue
                 * journalière doivent afficher les lots remportés." Les
                 * deux renvoient déjà {reward:{...}} côté serveur
                 * (tossMoneyPit/spinDaily) mais seul le toast générique
                 * "Progression mise à jour" s'affichait — le lot réel
                 * n'était jamais montré.
                
```

## Bloc 298

```text
       * Norman (2026-09-14) : affichage du lot remporté (Money Pit / Daily
       * Spin) — une seule fonction de mise en forme, réutilisée par les
       * deux, plutôt que de dupliquer le mapping monnaie->libellé.
      
```

## Bloc 299

```text
       * Audit 2026-09-16 : le vrai menu NGU "Spend EXP" (ngu-wiki-reference/
       * currencies-gold-exp-ap.md : "EXP is the primary currency for
       * permanent upgrades, spent through the 'Spend EXP' menu") n'avait
       * plus aucun point d'entrée depuis la suppression de l'ancien hub
       * pageSystemesIdleV130_ (dead code pré-parité NGU, jamais atteint
       * autrement). buyResource côté serveur fonctionne déjà (Energy/Magic,
       * et R3 ajouté dans ce même audit) — il ne manquait qu'une vraie page
       * dédiée, même gabarit que pagePerksIdleV1_/pageQuirksIdleV1_. Chaque
       * ressource verrouillée est annoncée honnêtement (🔒), jamais un
       * bouton d'achat qui échouerait silencieusement.
      
```

## Bloc 300

```text
               * Audit 2026-09-16 : chaque piste (Beards notamment) porte
               * déjà un vrai flag `unlocked` calculé côté serveur
               * (beardTrackUnlocked, idle-ngu-progression.js) — jamais lu
               * ici, donc une piste verrouillée restait cliquable et
               * échouait silencieusement en PISTE_VERROUILLEE côté
               * serveur. Même principe que les autres boutons retirés
               * quand ils ne peuvent que rater (cf. bouton "Récolter"
               * ci-dessus) : verrouillée = désactivée et annoncée, jamais
               * cliquable-mais-vouée-à-l'échec.
              
```

## Bloc 301

```text
       * Audit 2026-09-16 : le bouton "Jeter de l'or" restait cliquable
       * même en recharge (PUITS_EN_RECHARGE, cooldown croissant
       * 1h/2h/3h... par lancer, tossMoneyPit) ou sous le seuil de
       * 100 000 Or (OR_INSUFFISANT) — deux échecs serveur silencieux
       * jamais annoncés côté client. Même principe que les autres boutons
       * désactivés plutôt que cliquables-mais-voués-à-l'échec.
      
```

## Bloc 302

```text
         * Correctif 2026-09-14 (audit fidélité wiki NGU, mission IDLE) :
         * questing/cards/cooking/infinityCube/macguffins n'ont AUCUNE
         * branche réelle côté serveur (collectSystem, idle-ngu-
         * progression.js) — seuls yggdrasil/dailySpin/bloodMagic y sont
         * implémentés, tout le reste lève ACTION_NON_DISPONIBLE à chaque
         * appel. Ces 5 systèmes sont bien débloquables en jeu normal
         * (unlock réel : heroicSigil, stillBeatingHeart, itHungersDefeated,
         * tutorialCubeMaxed, walderpFinalDefeated), donc ce bouton cassé
         * était réellement atteignable, pas juste théorique. Retiré tant
         * que ces systèmes n'ont pas de vraie mécanique construite —
         * mieux vaut l'absence honnête d'un bouton qu'un bouton qui
         * échoue toujours.
        
```

## Bloc 303

```text
 * Correctif 2026-09-14 (audit fidélité wiki NGU, mission IDLE) : "Acheter
 * une Maîtrise"/"Acheter une Procédure" envoyaient l'action buyPerk/
 * buyQuirk SANS aucun id — le serveur (idle-ngu-progression.js, buyPerkV1/
 * buyQuirkV1) exige un id précis depuis la migration vers de vrais
 * catalogues (PERK_INTROUVABLE/QUIRK_INTROUVABLE sinon), donc ce bouton
 * échouait à chaque clic. Le serveur expose désormais perkDefinitions/
 * quirkDefinitions (idleNguSnapshot) — ces deux pages listent chaque
 * entrée réelle du catalogue avec son propre bouton d'achat, même gabarit
 * que pageDiggersIdleV47_ ci-dessus.

```

## Bloc 304

```text
 * Audit 2026-09-16 : ITOPOD retombait sur le rendu générique
 * (Niveau/temporaire/permanent, "Level 0") faute d'être spécial-cassé
 * dans pageSystemeMetaIdleV130_ — même défaut que Perks/Quirks/Challenges
 * avant leurs propres pages dédiées. Le serveur (advanceLateSystems,
 * idle-ngu-progression.js) suit déjà étage/kills/PPP réels (wiki ITOPOD :
 * "every 10 enemies killed advances 1 floor", "(200+Floor) PPP/kill",
 * "1 000 000 PPP = 1 PP") — il ne manquait qu'un affichage dédié.

```

## Bloc 305

```text
 * Correctif 2026-09-14 (audit fidélité wiki NGU, mission IDLE) : le
 * serveur (idle-ngu-progression.js, IDLE_NGU_NORMAL_CHALLENGES) suit déjà
 * 11 défis réels, exposés via challengeDefinitions (idleNguSnapshot), mais
 * seul le défi 'basic' était jouable — 3 boutons câblés en dur (Démarrer/
 * Valider/Abandonner) dans pageSystemesIdleV130_, sans jamais lire ce
 * catalogue. Les 10 autres défis pourtant déjà débloquables (ex.
 * noAugmentations dès boss 75) étaient donc invisibles et injouables.
 * Cette page liste chaque défi réel avec son propre statut (verrouillé /
 * en préparation / prêt / actif), même gabarit que pagePerksIdleV1_.
 * "En préparation" (implemented:false, 5 défis) n'est pas un statut
 * inventé : c'est le champ exact du catalogue serveur, qui refuse déjà
 * DEFI_EN_PREPARATION au démarrage — jamais masqué, juste annoncé.

```

## Bloc 306

```text
       * 4G's Sellout Shop (audit 2026-09-13, Norman) : "je veux exactement
       * le même shop. Je ne veux juste pas les menus qui permettent de
       * dépenser de l'argent réel." Catalogue + coût déjà calculés côté
       * serveur (j.selloutShop.catalog, SOREAL-TV idle-sellout-shop-v1.js)
       * — le client se contente d'afficher et d'envoyer l'achat, jamais de
       * recalculer un prix ou une éligibilité ici.
      
```

## Bloc 307

```text
       * V210 — le moteur conserve les noms NGU canoniques dans son
       * catalogue, mais l'interface destinée au joueur est entièrement
       * francisée ici. Les IDs/prix/effets mécaniques restent inchangés.
      
```

## Bloc 308

```text
         * Rien de ce qui a été cliqué juste avant le reset
         * ne doit pouvoir être envoyé après l'effacement du compte.
        
```

## Bloc 309

```text
             * Ne recharge plus toute la WebApp : Apps Script peut afficher
             * une page blanche dans ce contexte. On recrée le joueur
             * immédiatement via le moteur, comme une première connexion.
            
```

## Bloc 310

```text
                   * Norman (2026-09-18, en direct) : "je veux que quand
                   * quelqu'un reset une partie, il soit automatiquement
                   * ramené dans l'onglet Fight Boss." idleMenuActifV28
                   * démarre déjà sur 'combat' par défaut pour un tout
                   * nouveau joueur (jamais rien en sessionStorage), mais un
                   * reset dans le MÊME onglet de navigateur hérite sinon de
                   * l'ancien onglet actif encore en sessionStorage (ex.
                   * Inventaire) — forcé explicitement ici, jamais laissé au
                   * hasard de ce qui traînait avant le reset.
                  
```

## Bloc 311

```text
       * Correctif 2026-09-18 (Norman, en direct : "ajoute à moi seul,
       * dans le menu paramètres, un bouton qui fait reset l'entièreté
       * des joueurs actuels") — même popup de confirmation que le reset
       * individuel (soreal-idle-modal-*), même appel google.script.run
       * que tout le reste de l'onglet Settings, juste une action serveur
       * différente (reinitialiserTousLesComptesSorealIdle, déjà existante
       * côté SOREAL-IDLE mais jamais branchée à un bouton avant ce
       * correctif — voir ADMIN_SOREAL_IDLE_EMAIL, idle-sqlite-runtime.js,
       * pour la vraie porte d'accès).
      
```

## Bloc 312

```text
       * Norman (2026-09-14) : "Dans Settings, je voudrais un récapitulatif
       * qui explique chaque menu débloqué. Pour pouvoir relire le texte
       * une fois fermé. Un menu Info avec dedans la possibilité de
       * reconsulter les panneaux informatifs qu'on a eu depuis le début
       * du jeu (mais pas ceux non déverrouillé)." Réutilise EXACTEMENT le
       * même contenu que les popups d'unlock (idleInfosParMenuIdleV1_) —
       * jamais un second texte dupliqué — filtré aux seuls menus déjà
       * acquittés (idleMenusAckListeV1_), ce qui exclut naturellement
       * tout menu non débloqué (il ne peut jamais être acquitté avant).
      
```

## Bloc 313

```text
         * V204 — "tout pouvoir relire" : Norman & Sébastien sont les
         * narrateurs de ces séquences complètes. On archive donc TOUTES
         * les pages déjà atteintes (prologue, Objectif, Énergie, etc.),
         * pas uniquement celles dont le titre littéral est leur nom.
         * Les groupes futurs restent cachés jusqu'à leur vrai déblocage
         * pour ne jamais spoiler la progression.
        
```

## Bloc 314

```text
       * Norman (2026-09-16) : "Est-ce qu'il est possible d'ajouter un
       * bruit agréable quand on clique sur un menu ?" (2026-09-17 :
       * "j'aimerai un autre son" — clic sec percussif via bruit blanc
       * filtré). Norman (2026-09-17, suite) : "Son de clic dans toute
       * l'APP — réutilise EXACTEMENT le bruit de clic déjà présent dans
       * SOREAL IDLE... réutiliser le système audio existant plutôt que
       * réimporter le fichier son plusieurs fois." La synthèse (Web
       * Audio, AudioContext + buffer de bruit mis en cache) a donc été
       * déplacée dans Soreal_JS_31_Click_Sound_V1.html (module toujours
       * chargé dès le démarrage de l'APP, contrairement à IDLE qui n'est
       * chargé qu'à la demande) — jamais deux implémentations séparées
       * du même son. jouerSonMenuIdleV1_ n'est plus qu'un alias vers la
       * fonction partagée, conservé pour ne rien casser des appelants
       * existants (menuIdleV28_ ci-dessous, window.__jouerSonMenuIdleV1__).
      
```

## Bloc 315

```text
         * V207 — le standalone SOREAL IDLE ne charge pas le module audio
         * global du shell APP. On retombe donc sur le même clic synthétique
         * via le moteur audio IDLE au lieu de rester silencieux.
        
```

## Bloc 316

```text
         * Norman (2026-09-14) : "seulement quand on clique dessus et
         * uniquement la première fois, on aura le popup informatif. Une
         * fois fermé, il ne réapparaitra plus." Le popup (s'il en existe
         * un pour ce menu) n'est déclenché qu'ici, au tout premier clic
         * sur l'onglet — jamais en arrière-plan pendant que le joueur
         * regarde un autre écran.
        
```

## Bloc 317

```text
           * Norman (2026-09-16) : à l'entrée réelle en Aventure (boss 4),
           * le vrai tutoriel NGU s'affiche ("So you killed the mouse?...").
           * Remplace ici l'ancien popup générique unique (texte SOREAL
           * inventé, retiré de definitionsNouveautesIdleV75_) par le
           * carrousel traduit fidèle.
          
```

## Bloc 318

```text
       * Norman (2026-09-18) : "Je veux que ce soit les images R2." Cette
       * préchauffe préchargeait/mettait en cache les anciennes images
       * Drive héritées du catalogue Google Sheets — pire, la boucle sur
       * bossCatalogue écrivait directement dans idleBossImageCacheV36,
       * le MÊME cache que chargerImageBossIdleV36_ consulte en premier :
       * même après avoir corrigé chargerImageBossIdleV36_ pour utiliser
       * R2, ce préchargement aurait quand même empoisonné le cache avec
       * l'URL Drive avant le premier vrai rendu. R2 partout, plus aucune
       * référence à driveFileId ici.
      
```

## Bloc 319

```text
         * Le boss courant + le joueur partent en premier.
        
```

## Bloc 320

```text
         * Puis tous les boss déjà connus sont mis dans le cache navigateur.
         * Les changements de boss n'attendent donc plus un appel Apps Script.
        
```

## Bloc 321

```text
             * V181 — même règle que Fight Boss/Collection : le numéro
             * canonique est boss.numero (ou index+1), jamais boss.id brut.
             * Le cache est indexé par numéro, pas par nom, pour qu'un nom
             * traduit/dupliqué ne puisse jamais empoisonner le portrait.
            
```

## Bloc 322

```text
       * Bug signalé : "le journal de combat ne correspond pas toujours aux
       * coups visibles à l'écran." Cause confirmée : coupsDusIdleV116_
       * peut rattraper jusqu'à 4 coups d'un coup (onglet mis en arrière-
       * plan/throttlé), mais un seul éclat visuel (impactIdleV46_) était
       * déclenché pour toute la fenêtre de rattrapage — un éclat pouvait
       * donc représenter 1 à 4 coups réels. Ici, un éclat par coup réel,
       * espacé pour rester visuellement distinct (le premier immédiat,
       * les suivants décalés de 110ms). Le drain/dégâts réels ne changent
       * pas : seul le nombre d'éclats rejoue fidèlement coupsDusIdleV116_.
      
```

## Bloc 323

```text
       * Audit 2026-09-13 (Norman) : "Le joueur se trouve dans
       * soreal/idle/player/ mais je vais en ajouter d'autres qui
       * refléteront les sets équipés de chaque zone... le système pour
       * les accueillir quand elles seront là doit déjà être en place."
       * Convention : player-<zoneId>.<ext> par zone, player-default.<ext>
       * en repli tant que l'image de la zone n'existe pas encore
       * (résolution entièrement côté serveur, /api/idle/media/player).
      
```

## Bloc 324

```text
       * Audit 2026-09-13 (Norman) : "Les mobs du mode aventure se trouvent
       * tous dans mon R2 : soreal/idle/aventure/." Route déjà fonctionnelle
       * côté serveur (/api/idle/media/mob?zone=<id>&boss=0|1&seed=<n>,
       * cloudflare/features/idle/worker.js) mais jamais appelée côté
       * client jusqu'ici. seed stabilise le choix d'image (même graine =
       * même mob affiché, pas un nouveau tirage à chaque rendu).
      
```

## Bloc 325

```text
         * "seed" reste le nom du paramètre d'URL (worker.js,
         * choisirCleMobR2_) pour rester compatible avec toute mise en
         * cache déjà en place — sa valeur est désormais un vrai INDEX de
         * catalogue (0-based), plus une graine hachée (voir Norman
         * 2026-09-16, "Chacune des image doit être reliée à un ennemi").
        
```

## Bloc 326

```text
       * Norman (2026-09-18) : "Je veux que ce soit les images R2." Cause
       * confirmée : driveFileId (donnée héritée de l'ancien catalogue
       * Google Sheets/Drive, jamais nettoyée depuis la migration R2) était
       * TOUJOURS tentée en premier via imageRapideIdleV46_ — tant que ce
       * champ reste renseigné pour un joueur, l'image Drive gagnait
       * systématiquement, l'image R2 n'étant qu'un repli jamais atteint.
       * driveFileId n'est plus utilisé du tout : R2 (déjà fonctionnel,
       * urlJoueurR2IdleV1_) est désormais la seule source.
      
```

## Bloc 327

```text
       * Correctif 2026-09-13 : résolution générale d'image de boss par id
       * (idle/bosses/boss_<id>_*.webp sur R2), au lieu du RPC
       * obtenirImageBossSorealIdle — celui-ci s'appuyait côté serveur sur
       * imageBossParNomSorealIdle_/DriveApp, un stub qui renvoie toujours
       * un blob vide dans cet environnement Cloudflare Workers (jamais
       * fonctionnel pour AUCUN boss, pas seulement au-delà de 20). Le
       * boss 21 utilise exactement le même chemin que le boss 1.
      
```

## Bloc 328

```text
       * V181 — l'identité VISUELLE d'un boss suit toujours son numéro
       * Fight Boss (bossSelection). bossId est un champ de compatibilité
       * qui peut arriver avec un snapshot plus ancien juste après NUKE.
       * Utiliser bossSelection en priorité empêche donc l'image du boss N
       * de rester affichée alors que les PV/nom sont déjà ceux de N+1.
      
```

## Bloc 329

```text
       * Norman (2026-09-18) : "Je veux que ce soit les images R2." Même
       * cause que chargerImageJoueurIdleV43_ : driveFileId (hérité de
       * l'ancien catalogue Google Sheets/Drive) était toujours tenté en
       * premier, l'image R2 n'étant qu'un repli jamais atteint tant que ce
       * champ reste renseigné. driveFileId n'est plus utilisé du tout :
       * R2 (déjà fonctionnel, urlBossR2IdleV1_) est désormais la seule
       * source.
      
```

## Bloc 330

```text
         * Norman (2026-09-18) : "Quand on bat un boss, la fenêtre retourne
         * en haut automatiquement. Enlève ça. Elle doit rester où on
         * l'avait placée." Cause : rendreIdleEtat_ est appelée par ~15
         * chemins différents (dont transitionMortBossIdleV61_ -> la
         * synchro forcée après victoire), et remplace le contenu de l'app
         * -- seuls 3 appelants sur 16 passaient déjà par
         * conserverPositionIdleV24_ (le même helper qui préserve déjà
         * window.scrollX/scrollY ailleurs). Capturé ici une bonne fois
         * pour TOUS les appelants, restauré après le même
         * requestAnimationFrame qui restaure déjà le scroll des journaux
         * de combat/aventure ci-dessous.
        
```

## Bloc 331

```text
         * Norman (2026-09-14) : régen progressive des PV Aventure au repos
         * (voir actionMetaIdleV130_, même raison). Filet de sécurité ici
         * pour TOUT appelant de rendreIdleEtat_ (chargement initial,
         * sondages périodiques, sorts...), pas seulement le cycle de
         * combat de zone.
         *
         * V2 (2026-09-18, même cause que actionMetaIdleV130_ ci-dessus) :
         * rendreIdleEtat_ est appelée par ~15 actions sans rapport avec le
         * combat (équiper, recycler, acheter une amélioration EXP, un
         * sort, un perk...). idleEtat=res.joueur écrasait alors un combat
         * de zone/boss ACTIF en cours avec l'instantané figé du serveur,
         * remontant la vie du monstre/boss à son maximum. On retente
         * d'abord le même garde-fou que les sondages périodiques
         * (appliquerSynchroCombatSansReflowIdleV116_) : s'il reconnaît un
         * combat actif, idleEtat est déjà correctement fusionné (fight
         * local conservé) et ne doit pas être réécrasé ici.
        
```

## Bloc 332

```text
         * V179 — Fight Boss visible = DOM de combat immuable pendant le
         * combat. La synchro sans reflow a déjà fusionné l'état serveur ;
         * continuer jusqu'au remplacement complet de #app recréerait le
         * bouton Fight et provoquerait son clignotement.
         *
         * Le garde ne s'applique que si l'onglet Combat est déjà celui qui
         * est réellement peint. Un changement volontaire d'onglet continue
         * donc de déclencher un rendu complet normal.
        
```

## Bloc 333

```text
         * V209 — conserver le même noeud image Money Pit pendant les
         * synchronisations. Le rendu global reconstruit #app ; garder le
         * noeud évite d'annuler/reprendre le chargement de l'image.
        
```

## Bloc 334

```text
         * À ce stade le jeu est déjà rendu et utilisable. Une mise à jour
         * secondaire de boutons ou du ticker ne doit jamais transformer un
         * rendu réussi en "échec d'ouverture".
        
```

## Bloc 335

```text
             * mesurerInterfaceMobileV31 appartient au module Chat
             * (Soreal_JS_06_Chat_Presence.html), jamais chargé par SOREAL
             * IDLE (page/asset statique indépendante) — l'appeler sans
             * garde levait un ReferenceError qui interrompait tout le
             * reste de ce callback (restauration du scroll, image du
             * boss...), jamais rattrapé (confirmé dans la console live).
            
```

## Bloc 336

```text
             * Suppression de l'auberge (Norman, 2026-09-10) : "on devait
             * supprimer l'auberge. Elle n'a plus d'utilité à partir du
             * moment où quand on meurt, le combat s'arrête totalement."
             * L'écran de combat montre maintenant toujours le duel réel
             * (plus de scène "Salle de repos" séparée) — l'image du
             * joueur se charge donc dans tous les cas, jamais celle du
             * repos (chargerImageReposIdleV43_, désormais morte).
            
```

## Bloc 337

```text
         * V36.1 — ZÉRO REFLOW AU CLIC ⚡
         *
         * Jusqu'ici, on faisait :
         *   1) body -> thème IDLE
         *   2) #app -> écran de chargement
         *   3) attente serveur
         *   4) #app -> vrai jeu
         *
         * Cela produisait le grand cadre vertical visible pendant
         * quelques instants.
         *
         * Désormais, rien de visuel ne change avant d'avoir l'état
         * complet du joueur. Les styles, la classe du body et le HTML
         * final sont appliqués dans le même cycle JavaScript.
        
```

## Bloc 338

```text
         * On laisse la page SOREAL actuelle intacte en cas d'erreur.
         * Même un échec serveur ne doit plus provoquer de reflow.
        
```

## Bloc 339

```text
         * Aucun nouvel appel serveur :
         * l'état a déjà été préparé par le launcher Apps Script.
        
```

## Bloc 340

```text
         * IMPORTANT :
         * on NE TOUCHE PAS à PAGE_ACTIVE, #app ou au thème du body ici.
         * La page actuellement affichée reste parfaitement immobile
         * pendant la lecture de l'état IDLE.
        
```

## Bloc 341

```text
           * L'ancienne animation de chargement peut exister si le module
           * avait déjà été ouvert avec une version antérieure.
          
```

## Bloc 342

```text
               * AUCUN setTimeout ici.
               * Le changement de thème et le remplacement de #app sont
               * effectués dans le même tour d'événements, sans frame
               * intermédiaire visible.
              
```

## Bloc 343

```text
         * Pas besoin d'attendre qu'un faux écran de chargement soit peint.
         * La requête peut partir immédiatement.
        
```

## Bloc 344

```text
       * BOOTSTRAP ROBUSTE V27.1
       * Le loader principal cherche toujours V1.
       * On expose donc V1 AVANT le hook de navigation SOREAL APP.
       * Ainsi, une erreur d'intégration secondaire ne peut plus faire croire
       * au loader que le module n'a pas été initialisé.
      
```

## Bloc 345

```text
           * Compatibilité seulement.
           * Le launcher V3.9 utilise __ouvrirSorealIdleAvecEtatV108__.
          
```

## Bloc 346

```text
       * Hook de navigation sécurisé.
       * Certains chargements paresseux peuvent injecter IDLE avant que
       * ouvrirPage soit visible comme variable lexicale globale.
      
```

## Bloc 347

```text
           * Si l'utilisateur choisit une autre page pendant que le serveur
           * prépare IDLE, cette navigation gagne. IDLE ne surgira pas
           * ensuite tout seul.
          
```

## Bloc 348

```text
       * Important :
       * le module ne fait RIEN lors du chargement.
       * Il attend l'appel explicite du loader de SOREAL APP.
      
```

