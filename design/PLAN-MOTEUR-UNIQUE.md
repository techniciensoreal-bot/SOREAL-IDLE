# Plan : un seul calcul, sur l'appareil, comme le jeu Unity d'origine

Demande de Norman (2026-11-05) : « je veux que ça fonctionne comme le jeu original sous Unity ». Les calculs se font sur l'appareil, il n'y a qu'UNE version de chaque barre, aucun recalage, donc aucun recul possible.

## Le problème, mesuré
- Aujourd'hui l'écran garde sa propre prédiction de chaque barre (Machine temporelle, Augmentations, rituels, NGU...) et le moteur local la recale à chaque réponse. Le recul vient de ce recalage.
- Le moteur est un portage d'un script de tableur : chaque opération relit l'état entier, le normalise, recalcule les bonus, reconstruit une réponse complète. Sur la partie de Norman : allocation ~100 ms, synchro ~70 ms (banc : `scratchpad/reel.mjs`, profil `top.mjs`).
- À 50 remplissages par seconde, 100 ms d'écart = 5 tours de barre.

## Principe cible
1. L'état du joueur vit dans le Worker local, en mémoire (pas de relecture/normalisation à chaque appel).
2. Le Worker fait avancer toutes les barres EN CONTINU (une opération d'avancement légère, quelques ms) avec les formules du moteur.
3. L'écran ne calcule plus aucune position de barre : il lit la position publiée par le Worker (valeur + instant) et la peint. Une barre n'a qu'une seule source.
4. Une action du joueur (allocation, achat) s'applique à l'état du Worker et prend effet à l'image suivante, sans réponse complète à attendre.

## Fluidité : critère de CHAQUE étape (demande de Norman, 2026-11-05 : « 60 FPS constant »)
Mesure de départ sur le PC de Norman (images enregistrées pendant des clics, 1920x911, avec l'enregistreur en marche) : médiane 17 ms ; 95 % 18-19 ms ; 99 % 22-30 ms ; plus longue 49-55 ms ; 2,4 à 3,8 % d'images > 20 ms ; 0,1 à 0,4 % > 34 ms.
Budget à respecter après CHAQUE étape, sur la même mesure (même partie exportée, mêmes clics) :
- médiane <= 17 ms ;
- images > 20 ms : moins de 1 % ;
- images > 34 ms (deux images sautées) : moins de 0,1 % ;
- aucune image > 50 ms hors chargement ;
- aucun recul de barre (critère principal).
Une étape qui dégrade l'un de ces chiffres n'est pas livrée. Le journal de fluidité existant (`diag-fluidite-v1.js`, images longues « LoAF ») fournit les mesures dans le navigateur ; le banc de l'étape 1 reprend la même échelle.
Limite honnête : le web ne garantit pas 60 images/s sur un téléphone modeste ni si le système plafonne à 30 ; le budget vaut pour un PC moyen, et pour les téléphones on mesure et on ne dégrade pas.
Leviers, dans l'ordre : peindre les barres rapides en canvas (plus de recalcul de mise en page par image), supprimer les redessins complets de page (morph) pendant les animations, travail par image mesuré et plafonné.

## Étapes (chacune livrable et prouvée avant la suivante)
0. Inventaire (1/2 j) : lister tout module qui calcule lui-même une position de barre (`tmEtaAt`, `restant=base-...`, `phaseRituelEtat`, trajectoire des multiplicateurs, repères des Augments, NGU...). Sortie : tableau barre -> formule écran -> formule moteur.
1. Banc de preuve (1 j) : test sur la partie exportée de Norman avec une barre rapide ; il enregistre la position affichée ET la durée de chaque image pendant des clics (Max, 0, allocations répétées) et ÉCHOUE au moindre recul ou si le budget de fluidité est dépassé. Il tourne d'abord sur le code actuel (il doit échouer : c'est la preuve que le test voit le défaut). Fluidité : ce banc fixe les chiffres de départ.
2. État résident (2 j) : le Worker garde l'état normalisé en mémoire entre deux opérations ; relecture seulement après un changement venu de l'extérieur (chargement, restauration, autre appareil). Garde-fous existants conservés : IndexedDB, envoi au serveur, un seul appareil à la fois, sauvegardes (règle n°7). Mesure : synchro et allocation < 20 ms. Fluidité : budget respecté ; plus aucune image longue provoquée par un message du Worker.
   **Mesure du 2026-11-05 sur la partie de Norman (allocation = 82 ms après la copie rapide ; `scratchpad/spans.mjs`)** : l'état en mémoire seul ne suffit PAS à atteindre 20 ms, car le temps n'est pas surtout dans la relecture. Répartition par opération : 5 synchronisations complètes (avancement 33 ms + normalisation 16 ms), 70 calculs de bonus (37 ms, dont ~30 ms rien que pour fabriquer la clé de mémo = sérialiser l'état de 110 Ko 70 fois), construction de la réponse complète (43 ms). Trois chantiers, dans l'ordre :
   - 2a. État normalisé gardé entre deux opérations (gain visé : ~20 ms : normalisation et lecture JSON) ;
   - 2b. UNE synchronisation par opération (les trois qui suivent l'action se font au même instant) : bloquée par un point à régler d'abord, l'avancement tire du hasard (boosts d'objets) donc deux synchros successives au même instant ne redonnent pas le même état ; il faut isoler ce hasard (gain visé : ~25 ms) ;
   - 2c. Remplacer les clés de mémo « contenu de l'état » par une invalidation EXPLICITE (compteur de version incrémenté à chaque mutation des blocs qui comptent) : fin des 70 sérialisations (gain visé : ~30 ms). C'est le plus risqué : toute mutation oubliée donne un bonus périmé ; garde-fou `SOREAL_IDLE_VERIF_BONUS=1` obligatoire.
3. Opération d'avancement (1 j) : `avancer(t)` ne fait progresser que les barres et les ressources (pas de réponse complète). Le test de non-régression compare son résultat à celui de la synchro complète au même instant (égalité exacte). Fluidité : coût de l'avancement mesuré par image (cible < 2 ms dans le Worker).
4. Machine temporelle (2 j) : l'écran lit la position publiée ; plus de calcul de position dans `ui-machine-temporelle-v1.js`. Le banc de l'étape 1 doit passer, barre rapide comprise. Fluidité : budget respecté ; les barres rapides sont peintes en canvas si la largeur d'un div coûte du recalcul de mise en page.
5. Les autres barres, une par une (Augmentations, Entraînement avancé, rituels, NGU, Wandoos...) : même méthode, même banc élargi (reculs ET fluidité). Chaque barre migrée retire du code écran, et aucune ne dégrade les chiffres de fluidité de la page.
6. Nettoyage : suppression de la prédiction écran, de `clientAt` devenu inutile là où l'état est résident, de la trajectoire des multiplicateurs (remplacée par la lecture directe), mise à jour de AGENTS.md (règles n°4, n°5 et n°7, plus une règle « budget de fluidité » avec ses seuils et son banc).

## Plusieurs appareils (exigence de Norman, 2026-11-05 : « on doit pouvoir jouer de plusieurs appareils ; on reprend la partie la plus récente quand on se connecte ailleurs »)
Le moteur en mémoire ne change RIEN à ce comportement, déjà posé par la règle n°7 d'AGENTS.md :
- à la connexion, l'appareil reçoit la partie la plus récente du serveur ; si sa copie locale (IndexedDB) est plus récente que celle du serveur, c'est elle qui est reprise et renvoyée ;
- un seul appareil joue à la fois : le nouvel appareil revendique la partie, l'ancien reçoit « Partie reprise sur un autre appareil » ; un état plus ancien n'écrase jamais un plus récent ;
- envoi toutes les 10 s après une action (1 min au repos), à la fermeture et sur demande ; sauvegardes de sécurité côté serveur avant tout écrasement.
Avec l'état résident (étape 2), le Worker doit, à chaque reprise (connexion, retour sur l'onglet, partie reprise ailleurs), relire l'état le plus récent et jeter son état en mémoire : jamais d'état résident périmé.
Tests de reprise à écrire AVANT l'étape 2 : (1) A joue, B se connecte, B voit l'état le plus récent de A ; (2) B joue, A revient : A reprend l'état de B (ou affiche l'écran de reprise) et ne l'écrase pas ; (3) fermeture brutale de A puis connexion de B : l'état de B est celui du dernier envoi de A, la copie locale de A plus récente est ensuite renvoyée si A revient ; (4) deux onglets du même appareil : un seul joue.

## Règles qui restent vraies
- Règle n°4 (aucun redessin visible) : la barre est peinte à chaque image depuis la même valeur ; rien n'est retiré puis remis.
- Règle n°5 (statistiques instantanées) : attaque, défense, vie max lues dans l'état du Worker, jamais dans la page.
- Règle n°7 : le Worker garde toutes les précautions (reprise, envoi, un seul appareil, sauvegardes).
- Anti-spoil (règle n°2) : la position publiée ne contient que des barres déjà débloquées.

## Risques
- Gros chantier : plusieurs semaines si on veut tout migrer. On livre barre par barre ; à chaque étape le jeu reste jouable.
- L'état résident change la gestion des erreurs et de la reprise : tests de reprise (fermeture brutale, rechargement, deux onglets) à écrire AVANT l'étape 2.
- Le contrat client/serveur (`idle-protocol.json`) change seulement par ajout d'opérations ; version du protocole à incrémenter si une réponse change de forme.

## Décisions à prendre par Norman
- Valider l'ordre : Machine temporelle d'abord, puis le reste ?
- Accepter qu'une partie de l'écran (Machine temporelle) change de fonctionnement interne avant les autres menus ?
