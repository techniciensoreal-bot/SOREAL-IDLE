/*
 * Notes de mise à jour de SOREAL IDLE (Norman, 2026-09-25 ; refonte 2026-10-02 ; regroupées par menu 2026-10-11).
 *
 * UNE entrée PAR JOUR, qui reprend tout ce qui a été fait ce jour-là. Numérotation : le premier jour (2026-09-23) vaut 1.0, puis +0.1 par jour
 * (1.1, 1.2, … 1.9, 2.0…). La plus récente est EN TÊTE de `versions`.
 *
 * FORMAT (Norman, 2026-10-11) : les lignes de chaque version sont REGROUPÉES PAR MENU. Chaque version porte `groupes:[{menu, titre, points:[…]}]` :
 *  - `menu` = un id de IDLE_MENUS_V1 (soreal-idle-ui.js : entrainement, combat, aventure, tower, sang…) ou le mot spécial 'general' (interface, en-tête, barres
 *    du haut, voix, sécurité, traductions, performances, « En direct »…) ; inventaire, coffre, équipement, objets, boosts, cube et journal d’aventure vont dans 'aventure' ;
 *  - `titre` = le nom français du menu tel qu’affiché dans le jeu ;
 *  - ordre des groupes : 'general' d’abord, puis les menus dans l’ordre de IDLE_MENUS_V1 ; dans un groupe, le plus récent en haut ; une ligne qui parle de
 *    plusieurs menus est coupée en une ligne par menu.
 * ANTI-SPOIL (AGENTS.md règle n°2) : le moteur n’affiche un groupe que si le joueur possède déjà ce menu (le `titre` peut donc porter le nom du menu), mais les
 * LIGNES restent neutres : jamais le nom d’un système encore verrouillé ni un total caché.
 *
 * RÈGLE (Norman, 2026-10-02) : on ne touche PAS au numéro de Beta ni aux notes à chaque publication. C’est Norman qui dit quand mettre à jour :
 * alors seulement, ajouter (ou compléter) l’entrée du jour et mettre `courante` à jour. Texte destiné aux joueurs : AUCUN spoil (ne jamais nommer un
 * système encore verrouillé ni un total caché).
 */
(function(){
  'use strict';
  /* Ancien hommage (2026-10-07 à 2026-10-10) : il reste sous les versions déjà publiées ; depuis 2026-10-11 le texte est raccourci (champ `hommage` global ci-dessous, utilisé par la version 2.6 et les suivantes). Chaque version peut avoir son propre champ `hommage`. */
  var HOMMAGE_ANCIEN='🐾 En souvenir de Grizboule, mon chat adoré, qui m’a accompagné dans toutes mes galères, adorable de notre première rencontre jusqu’à son dernier jour. Repose-toi bien là-haut, petit compagnon : je t’aime et tu me manques.';
  window.__SOREAL_IDLE_RELEASE_NOTES_V1__={
    courante:'3.1',
    /* Hommage (Norman, 2026-10-08) : une ligne en bas de CHAQUE note de mise à jour, à conserver dans toutes les versions à venir. */
    hommage:'🐾 En hommage à Grizboule',
    versions:[
      {
        version:'3.1',
        nom:'Un coffre à six pattes',
        date:'2026-10-16',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Tes réglages, cases cochées, saisies, onglets et volumes sont liés à ton compte : tu les retrouves à l’identique sur tous tes appareils.',
            'La Magie ne peut plus dépasser son maximum en cours de partie (elle se corrigeait seulement après un rafraîchissement de la page).',
          ]},
          {menu:'moneyPit', titre:'Money Pit & Roue journalière', points:[
            'Plus de grand vide entre l’image avec les boutons et le tableau des récompenses : l’image suit la hauteur des cartes, sur PC comme sur téléphone.',
            'Les deux cartes (« Balance ton argent » et la roue journalière) sont resserrées, sans espace vide, sur PC comme sur téléphone.',
            'Chaque carte a son « Ton prix » sous son bouton, avec son propre dernier gain ; la couleur change à chaque nouveau gain pour le repérer d’un coup d’œil.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Le Coffre a son accident environ une fois par jour, même s’il n’est pas à l’écran : tu retrouves le sac sale et la flaque à ton retour.',
            'Quatre nouveaux pets grinçants pour le Coffre : un court, trois d’affilée, un long et un de porte qui grince.',
            'Le Coffre a maintenant six pattes : deux de plus au milieu.',
            'Les cadres de zone du Coffre ne sont plus plus larges que leurs objets : un titre long passe à la ligne au lieu de les élargir.',
            'Les accidents du Coffre sont aléatoires mais jamais rapprochés (dix minutes au moins entre deux), et sa phrase sur un objet qu’il digère mal est beaucoup plus rare.',
          ]},
          {menu:'yggdrasil', titre:'Yggdrasil', points:[
            'Un fruit sans énergie reste derrière une porte fermée, sans aucune animation ; au moment de placer l’énergie, la porte s’ouvre avec son bruit (pierre ou bois, au choix dans le banc d’essai).',
            'Chaque fruit a sa porte, aux emblèmes différents, et un cadre de même taille que son image.',
            'Un fruit au niveau maximum joue ses 20 images à bonne vitesse en arrivant sur la page ; le choix Manger / Récolter de chaque fruit est mémorisé.',
            'Titre en branche vivante, et les 20 images de croissance existent aussi pour le fruit de puissance.',
          ]},
          {menu:'titans', titre:'Titans', points:[
            'Les Titans sont maintenant des cartes à collectionner : l’image du Titan, ou un « ? » tant que tu ne l’as pas affronté, avec son nom, ses victoires et son état.',
            'Un clic sur une carte la déplie : bouton Affronter, difficulté, case Auto-kill et son état, statistiques, comparaison avec tes stats et capacités.',
          ]},
          {menu:'wandoos', titre:'Wandoos', points:[
            'Le « 69 % » ne bouge plus : le « lol » apparaît simplement à sa droite.',
          ]},
          {menu:'sang', titre:'Magie du sang', points:[
            'Quand un sort bascule la piste d’ambiance sur l’orage, plus aucun éclair n’apparaît : seuls le sceau, le pentacle, les runes et le sang animent le sort.',
          ]}
        ]
      },
      {
        version:'3.0',
        nom:'Un coffre à la bonne taille',
        date:'2026-10-15',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Les boutons de tous les menus ont la même taille, lisible sur PC comme sur téléphone ; les barres d’outils (Input, Mes nombres, Plafond, Idle) sont de petits cadres propres où « Max » ne dépasse plus.',
            'Un clic sur un menu replace la page sous la bannière, sur PC comme sur téléphone (barre Attaque, Défense, Or, EXP, AP juste dessous), et le menu de gauche descend jusqu’à son dernier bouton.',
            'Les pages mises à jour en direct (dont celle des NGU) ne clignotent plus : cadres lumineux, particules, boutons de pourcentage et tuyaux restent fluides.',
            'La page Renaissance est refaite : « Partie précédente » et « Partie en cours » côte à côte, le Number en grand, les calculs en bas et un décor inspiré des cieux, de la vie et de la mort.',
            '« En direct » annonce quand le coffre d’un joueur s’est chié dessus, et prévient l’administrateur d’un nouveau signalement de bug.',
            'Les panneaux d’informations des menus sont fermés à l’arrivée et au changement de menu, les icônes d’objets s’affichent toutes tout de suite, et la bannière, le menu et la barre de vie ne s’étirent plus quand tu changes d’onglet.',
            'Quand tu perds un combat, le son de défaite est tiré au hasard parmi sept.',
            'L’éditeur de textes et de voix et le journal d’EXP de l’administrateur sont améliorés (personnages retrouvés à la réouverture, plusieurs jours d’historique).',
          ]},
          {menu:'machine', titre:'Machine temporelle', points:[
            'Les deux barres qu’on alimente sont plus grosses et plus soignées : tuyau de laiton à graduations, or avec des rouages qui défilent.',
          ]},
          {menu:'tower', titre:'ITOPOD', points:[
            'Changer les étages avec les boutons recommence toujours au premier ennemi de l’étage choisi.',
          ]},
          {menu:'wandoos', titre:'Wandoos', points:[
            'Installer l’OS avec une copie réussie : un son d’ordinateur joyeux (deux bips, arpège de démarrage, carillon) ; copie de niveau insuffisant : un son d’erreur d’ordinateur.',
          ]},
          {menu:'yggdrasil', titre:'Yggdrasil', points:[
            'La page est sans bords, plus large, avec des textes plus lisibles (deux colonnes de fruits sur téléphone) ; le premier fruit change d’image en grandissant et les durées s’affichent en heures et minutes (09h58).',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Le bouton Aventure du menu t’amène toujours sur l’onglet Aventure, écran remonté ; la comparaison de deux objets tient dans une seule fenêtre ; la fiche d’un objet s’ouvre au clic, jamais au survol.',
            'Les cases du coffre, sets compris, ont la taille des cases de l’inventaire, et le Coffre laisse échapper un vrai nuage quand il pète.',
            'Sur téléphone, le repère de la barre à côté de l’inventaire suit le doigt vers le bas et vers le haut.',
          ]},
          {menu:'combat', titre:'Fight Boss', points:[
            'Quatre sons accueillent l’apparition d’un boss suivant : orgue de cathédrale, boîte à musique qui ralentit, fanfare funèbre et gong.',
            'Si le bandeau « Boss vaincu » reste affiché, le jeu affiche le boss suivant tout seul au bout de quelques secondes.',
          ]},
          {menu:'sang', titre:'Magie du sang', points:[
            'Les sorts sont des rituels visuels : un sceau puis un pentacle qui tourne, des runes et du sang qui tombe, de plus en plus riches jusqu’au dernier sort ; la piste d’ambiance bascule en même temps sur l’orage.',
            'Les animations des rituels ne se perdent plus (coupure, punaise, jet de la sangsue, fil barbelé, banque), les cadres des rituels s’assombrissent du premier au dernier, et le pied de la sangsue est posé sur la table, aussi sur téléphone.',
            'Tous les textes du jeu parlent de « sang » et de « Nombre ».',
          ]},
          {menu:'titans', titre:'Titans', points:[
            'Une musique angoissante et nerveuse accompagne ces combats ; son volume suit la barre « Musique » des Réglages et les sons d’ambiance se taisent pendant le combat.',
            'Un double clic ou double tap sur le bouton Aventure du menu t’emmène directement dans l’onglet Titans.',
          ]},
          {menu:'shop', titre:'Boutique', points:[
            'Les emplacements d’inventaire de la boutique AP affichent combien tu en as déjà achetés sur le maximum possible, et chaque achat précise qu’il ajoute 1 emplacement.',
          ]}
        ]
      },
      {
        version:'2.9',
        nom:'Des images bien à nous',
        date:'2026-10-14',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'La bannière SOREAL IDLE et toutes les images viennent maintenant du stockage du jeu : plus aucun lien Google (la bannière ne s’affichait plus).',
            'Chaque version des notes affiche sa date en toutes lettres, y compris les anciennes.',
            'Les boutons Max, 1/2, 1/4, Tout retirer et le champ Input sont plus grands et plus lisibles, sur PC comme sur l’application.',
            'Les échanges avec le serveur sont plus légers (environ un tiers de données en moins à chaque synchronisation) et deux synchronisations ne se suivent plus à moins d’une seconde et demie.',
            'Les polices du jeu sont hébergées avec le jeu : plus aucun appel à un service externe pour les afficher.',
            'Les chiffres des cadres du haut (Attaque, Défense, Or, EXP, AP) changent de police : le 1 ne ressemble plus au 7.',
          ]},
          {menu:'entrainement', titre:'Entraînement de base', points:[
            'Entraînement de base : le bouton de chaque ligne s’appelle maintenant « Cap » (il ne place que l’énergie nécessaire pour atteindre le plafond de la compétence). Les « Max » des autres menus continuent de tout placer.',
          ]},
          {menu:'combat', titre:'Fight Boss', points:[
            'Chaque boss affiche de nouveau sa propre histoire : à partir du boss 80, les histoires étaient rangées sous le boss suivant ou précédent. C’est remis dans l’ordre en français et en anglais, sans écraser les textes que tu as modifiés.',
            'Les histoires du bon boss sont aussi vérifiées côté serveur par identifiant, avec des tests qui empêchent le décalage de revenir.',
          ]},
          {menu:'titans', titre:'Titans', points:[
            'Chaque Titan a son propre fond de combat, dessiné d’après son image (fixe, sans animation) ; les boutons Aventure et Titans prennent sa couleur.',
            'Le combat de Titan occupe tout l’écran de l’interface, menus de gauche visibles, bien aligné dès le lancement : plus besoin de descendre avec la molette.',
            'Un grand écran d’alerte « Un Titan approche… » s’affiche pendant l’attente du combat, avec son nom et son image qui grossit (un « ? » si tu ne l’as jamais affronté).',
            'Le Grand Arbre corrompu commence petit et grandit à mesure que sa force monte, jusqu’à remplir tout l’écran vers la moitié de ses PV.',
            'Quand tu bats un Titan, son image rapetisse en tournant sur elle-même, puis un message annonce dans combien de temps il sera de retour.',
            'Cliquer sur Aventure depuis l’onglet Titans te ramène à l’onglet Aventure ; en plein combat, la fuite est annoncée dans « En direct » (le nom n’est donné qu’aux joueurs qui connaissent ce Titan).',
            'La case « Auto-kill » d’un Titan ne peut plus être cochée tant que tu n’as pas les statistiques nécessaires : elle reste grisée, avec un message. Décocher reste toujours possible.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Le bouton Trier range l’équipement set par set (casque 1, torse 1, puis casque 2, torse 2…) et colle toujours les objets identiques, bijoux compris, pour voir d’un coup d’œil ce qui peut fusionner.',
            'Un simple appui sur un objet (sac ou équipement) ouvre sa fiche, avec ou sans statistiques, à la place de l’appui long ; appuyer de nouveau sur le même objet la referme. La fusion se fait toujours en glissant un objet sur un autre, et le double tap acheté fonctionne comme avant.',
          ]},
          {menu:'cards', titre:'Cards', points:[
            'Les cartes de ton deck sont dessinées : cadre, palier, coût en mayo, type, effet et rareté, avec une illustration pour chaque type et une variante dorée pour environ 1 % d’entre elles.',
          ]}
        ]
      },
      {
        version:'2.8',
        nom:'Un écran pour les Titans',
        date:'2026-10-13',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Audit de fluidité : moins de travail en arrière-plan quand l’onglet est caché, une erreur dans un calcul n’arrête plus l’affichage, des clics rapides ne se perdent plus, et le serveur répond plus vite aux synchronisations.',
          ]},
          {menu:'combat', titre:'Fight Boss', points:[
            'Après une Renaissance, tu arrives sur Fight Boss, la borne d’arcade en haut de la page, pour la revoir s’allumer.',
          ]},
          {menu:'chroniques', titre:'Chroniques', points:[
            'Dans l’onglet Boss, le numéro d’un boss plus avancé que le tien est masqué, comme dans l’onglet Global.',
            'Un succès secret ne se débloquait pas : c’est corrigé.',
          ]},
          {menu:'renaissance', titre:'Renaissance', points:[
            'Le suivi en direct du nombre et du facteur de temps de la Renaissance fonctionne de nouveau.',
          ]},
          {menu:'titans', titre:'Titans', points:[
            'Nouvel écran de combat de Titan : tout tient sur un seul écran sans défilement (image du Titan, PV du Titan et les tiens, toutes tes attaques manuelles) ; tu restes dans l’écran Titans, et le bouton Aventure arrête le combat et te remet en Zone sûre.',
            'Avant d’affronter un Titan, un message te rappelle de libérer de la place dans ton inventaire ; il faut aussi avoir ses stats Manuel (Puissance et Endurance), sinon un message te dit de monter tes stats.',
            'Au début d’un combat de Titan, toutes tes attaques sont en recharge. L’image d’un Titan reste un « ? » tant que tu ne l’as pas affronté, et la difficulté choisie ne revient plus à la première.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Dès que le cube passe au palier 1, son bonus s’affiche simplement (+68) en mauve, sans le mot « cube ».',
            'Un petit bouton 📖 à côté d’Idle Mode ouvre le journal des attaques : ce que fait chaque raccourci débloqué, avec ses recharges.',
            'Après un glisser-déposer, l’équipement, le coffre et les bonus se mettent bien à jour.',
          ]},
          {menu:'machine', titre:'Machine temporelle', points:[
            'À 50 remplissages par seconde, la barre d’Or reste pleine au lieu de scintiller.',
            'La barre de vitesse reste pleine dès que les niveaux durent 0,25 s ou moins.',
          ]},
          {menu:'sang', titre:'Magie du sang', points:[
            'Un fond de sang tapisse les récipients dès le premier rituel terminé, discret, sans changer le remplissage.',
            'Le ventre de la sangsue se gonfle là où se trouve la boule, sans s’affoler quand les niveaux sont très rapides.',
            'La sangsue bat aussi sur les appareils sans WebGL (TV).',
            'Le compteur des rituels ne dépasse plus ce que le serveur a validé : plus de chiffres gonflés aux vitesses extrêmes, sans jamais reculer de façon visible.',
            'L’animation de la scène d’un rituel se joue aussi quand les niveaux sont extrêmement rapides.',
          ]}
        ]
      },
      {
        version:'2.7',
        nom:'Des boutiques qui servent',
        date:'2026-10-12',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Le résumé « Pendant ton absence » montre tout ce que tu as farmé : EXP, AP, PP, Or, Magie…',
            'Un pavé numérique s’ouvre sur toutes les zones de saisie de nombres (sauf le pseudo).',
            'Le message « Il manque … Or » est plus voyant, avec la somme en doré.',
            'Plus de reflet qui traverse les cases Attaque, Défense, Or, EXP et AP.',
          ]},
          {menu:'titans', titre:'Titans', points:[
            'Choisir une zone (Zone sûre comprise) arrête le combat contre un Titan, et le ×5 de régénération de la Zone sûre ne s’applique plus pendant le combat.',
            'Les Titans gagnent 1 % de force à chaque attaque : plus le combat dure, plus ils tapent fort.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Le Coffre fait parfois la sieste : mieux vaut ne pas le réveiller.',
          ]},
          {menu:'tower', titre:'ITOPOD', points:[
            'Le bouton Auto règle tes étages sur ton meilleur étage en un clic ; avec le « Réglage automatique de l’étage » de la Boutique AP, ton étage le suit tout seul.',
          ]},
          {menu:'sang', titre:'Magie du sang', points:[
            'Nouvelle sangsue au ventre transparent : la boule de sang avance avec la barre, sort à chaque niveau terminé en jet de sang (plus épais au plafond), et la sangsue attend, vide, quand il manque de l’Or.',
            'Cadres des rituels plus courts, page bien plus fluide, baignoire de la banque du sang à plusieurs poches, coupure de papier plus fine, bol de barbelés plus lent.',
            'Le compteur des rituels ne recule plus quand tu ajoutes de la Magie.',
          ]},
          {menu:'ngu', titre:'NGU', points:[
            'Nouvelle aura : une aurore de lumière dans le tuyau, sans halo autour des barres.',
          ]},
          {menu:'shop', titre:'Boutique', points:[
            'Boutique AP : Adventure Advancer, Adventure Light, Insta Training Cap, boutons de pourcentage, réglage du Max des NGU et nom aléatoire de la ressource 3 fonctionnent.',
            'Boutique EXP : les quatre « Custom Input Button » (rangée « Mes nombres » aux couleurs du menu, fenêtre de saisie du site) placent le nombre de ton choix dans Input.',
          ]}
        ]
      },
      {
        version:'2.6',
        nom:'Tout en direct',
        date:'2026-10-11',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Sur PC, la barre des menus ne bouge plus ; la barre de vie ne saute plus ; les pages aux chiffres mouvants se mettent à jour en direct ; un bouton « 0 » retire toute l’énergie d’une barre.',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Borne d’arcade : fond noir et rails alignés ; chronique des boss en anglais.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Le Coffre rote en nuage vert ; sur téléphone, l’équipement se tire en volet depuis l’inventaire.',
          ]},
          {menu:'titans', titre:'Titans', points:[
            'Chaque Titan a son Auto-kill, qui donne le butin en ligne.',
          ]},
          {menu:'augmentations', titre:'Augmentations', points:[
            'Les améliorations prennent la couleur de leur Augment ; une piste sans énergie ne progresse plus.',
          ]},
          {menu:'avance', titre:'Entraînement avancé', points:[
            'La page ne se redessine plus quand tu reclics sur son menu ou places des points.',
          ]},
          {menu:'machine', titre:'Machine temporelle', points:[
            'La barre d’Or tique jusqu’à 50 fois par seconde, en direct.',
          ]},
          {menu:'sang', titre:'Magie du sang', points:[
            'Rituels redessinés : décors, bibliothèque, planche, récipients transparents et petites têtes de mort dans le sang.',
            'Récipients plus lents à remplir à haut niveau ; compte à rebours à la seconde près ; sans énergie, les personnages sortent de la case.',
            'Sur téléphone, la page est centrée.',
          ]},
          {menu:'moneyPit', titre:'Trou sans fond', points:[
            'Le cliquet de la roue est synchronisé avec l’image.',
          ]},
          {menu:'challenges', titre:'Défis', points:[
            'Défis en cartes, avec blason et gros bouton Jouer.',
          ]},
          {menu:'tower', titre:'ITOPOD', points:[
            'Compte à rebours avant le prochain combat.',
          ]},
          {menu:'ngu', titre:'NGU', points:[
            'Le cadre lumineux d’une barre ne clignote plus ; sur téléphone, la page ne déborde plus.',
          ]},
          {menu:'wandoos', titre:'Wandoos', points:[
            'Image de l’ordinateur recadrée ; placer une ressource ne fait plus défiler la page.',
          ]},
          {menu:'chroniques', titre:'Chroniques', points:[
            '« Combat le plus long » : un seul Fight, boss à PV pleins, sans fuite ni reprise, avec son issue (gagné ou perdu).',
            'Dans « Global », le boss d’un joueur plus avancé que toi est masqué.',
          ]}
        ]
      },
      {
        version:'2.5',
        nom:'Tout en médailles',
        date:'2026-10-10',
        hommage:HOMMAGE_ANCIEN,
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Barres animées par menu, grands boutons carrés sur ordinateur, champ Input propre à chaque menu.',
            '« En direct » annonce plus d’événements ; grands nombres espacés ; anglais sans français.',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Une vraie borne d’arcade dessinée, avec la chronique du boss lue à voix haute.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Inventaire refait : un Coffre à dents qui croque les objets, tri lisible, fusion des boosts par clic droit.',
            'Page Aventure allégée ; le Cube annonce ses paliers.',
          ]},
          {menu:'moneyPit', titre:'Trou sans fond', points:[
            'Récompenses de connexion plus justes ; Trou sans fond refait.',
          ]},
          {menu:'augmentations', titre:'Augmentations', points:[
            'Augmentations refait : deux pistes côte à côte, tubes de verre, cible par piste.',
          ]},
          {menu:'ngu', titre:'NGU', points:[
            'NGU en nuit étoilée : le ciel s’éclaire quand des machines tournent.',
          ]},
          {menu:'chroniques', titre:'Chroniques', points:[
            'Nouvel onglet « Combat le plus long » ; la page des succès montre toutes ses cases.',
          ]}
        ]
      },
      {
        version:'2.4',
        nom:'Orage dégagé',
        date:'2026-10-07',
        hommage:HOMMAGE_ANCIEN,
        /* Les nouveautés les plus récentes EN HAUT, du plus récent au moins récent (Norman, 2026-10-08). L'hommage reste en bas, rendu à part (champ « hommage » plus haut). */
        groupes:[
          {menu:'general', titre:'Général', points:[
            '« En direct » raconte ce que font les autres joueurs, sans jamais nommer ce que tu n’as pas découvert.',
            'Nouvel en-tête : cinq cadres sur une ligne, puis barres d’énergie, de magie et de vie en tubes de verre.',
            'Boutons + − Max, « Plafond » et « Idle » dans chaque menu où l’on place une ressource.',
            'Menus plus simples ; grands nombres avec unités en couleur.',
            'Jeu allégé pour téléphone ; plus de retour en arrière ; un clic sur Beta ouvre ces notes.',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Borne d’arcade : boss en haut, stick et trois boutons ronds au centre.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Double tap : fusionne ou absorbe d’un seul geste.',
            'Sac par pages de 60 cases, boosts manquants en petits points.',
          ]},
          {menu:'moneyPit', titre:'Trou sans fond', points:[
            'Roue et Trou : le cadre du prix change de couleur à chaque récompense.',
          ]},
          {menu:'sang', titre:'Magie du sang', points:[
            'La Magie se place dans plusieurs rituels à la fois.',
          ]},
          {menu:'ngu', titre:'NGU', points:[
            'Un tuyau lumineux par NGU, avec cible et minuteur.',
          ]},
          {menu:'shop', titre:'Boutique', points:[
            'Boutique EXP en carrés, avec médaille bronze, argent ou or.',
          ]}
        ]
      },
      {
        version:'2.3',
        nom:'Tout en direct',
        date:'2026-10-06',
        hommage:HOMMAGE_ANCIEN,
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Pages à chiffres vivants mises à jour sans casser animations ni saisies.',
            'Le serveur n’envoie plus que ce que tu as déjà découvert.',
            'Récompense de connexion donnée dès la connexion, avec une annonce.',
            'Orage plus vivant : ciel sombre, éclairs et tonnerre.',
            'Nouveau style par menu : couleurs propres, cadres sombres, textes de BD.',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Le combat de boss devient une borne d’arcade.',
          ]},
          {menu:'sang', titre:'Magie du sang', points:[
            'Les barres saignent quand elles sont actives.',
          ]},
          {menu:'wandoos', titre:'Wandoos', points:[
            'Page refaite façon ordinateur des années 80.',
          ]},
          {menu:'yggdrasil', titre:'Yggdrasil', points:[
            'Page refaite façon elfes, neuf éléments par page.',
          ]}
        ]
      },
      {
        version:'2.2',
        nom:'Des barres honnêtes, un jeu plus léger',
        date:'2026-10-05',
        hommage:HOMMAGE_ANCIEN,
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Les barres gardent leur place quand tu changes l’allocation : plus de triche possible.',
            'Jeu plus léger : moins d’appels au démarrage et moins de réécritures.',
            'Menu de gauche en une colonne, aux couleurs de chaque menu.',
            'Passer en English traduit toute l’interface.',
            'Le plafond d’énergie affiché suit tout de suite tes achats.',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Si ta régénération dépasse les coups, ta vie remonte en plein combat.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'La raison d’un retour en Zone sûre est écrite dans le journal.',
          ]},
          {menu:'augmentations', titre:'Augmentations', points:[
            'Plus de retour en arrière des barres ; calcul serveur beaucoup plus rapide.',
          ]},
          {menu:'sang', titre:'Magie du sang', points:[
            'Chaque rituel affiche la Magie allouée ; retirer toute la Magie l’arrête.',
          ]},
          {menu:'shop', titre:'Boutique', points:[
            'Boutique EXP : plus d’achat au-delà du maximum ; explications corrigées.',
          ]}
        ]
      },
      {
        version:'2.1',
        nom:'Des combats qu’on voit, des barres qui montent en puissance',
        date:'2026-10-04',
        hommage:HOMMAGE_ANCIEN,
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Nouveau look des zones de saisie et des tuiles du haut, chacune de sa couleur.',
            'Les menus suivent l’ordre où tu les débloques ; tu peux les réarranger.',
            'Barres de plus en plus puissantes : plus sombres, plus lumineuses, plus animées.',
            'Menu de gauche en une colonne sur PC ; bandeau du haut deux fois moins haut.',
            'Plus de clic droit du navigateur ni de texte sélectionnable.',
            'Temps de jeu corrigé : il compte tout le temps affiché à l’écran.',
          ]},
          {menu:'entrainement', titre:'Entraînement de base', points:[
            'Le bouton « Max » rend l’énergie en trop ; le passage à la compétence suivante marche enfin.',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Les ennemis redoutables ont de vraies capacités en combat.',
            'Paralysie : raccourcis grisés et bandeau de durée.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Les combats se voient : effets d’attaque, nombres flottants, soins, saignement.',
            'Double tap et Triple tap deviennent des achats, utilisables au clic droit sur PC.',
            'Les objets de déblocage arrivent toujours dans le sac.',
          ]},
          {menu:'avance', titre:'Entraînement avancé', points:[
            'Barres de couleur propres à chaque compétence.',
          ]},
          {menu:'machine', titre:'Machine temporelle', points:[
            'Menu relooké : machine de laiton, Or par seconde en grand, pièces qui tombent.',
          ]},
          {menu:'sang', titre:'Magie du sang', points:[
            'Chaque sort a son rituel sonore, de plus en plus intense.',
            'Musique propre au menu, avec fondu.',
          ]},
          {menu:'tower', titre:'ITOPOD', points:[
            'Arène propre : un décor par étage, un ennemi qui respire, barre de vie qui descend.',
          ]},
          {menu:'challenges', titre:'Défis', points:[
            'Compteur du temps écoulé pour un défi en cours.',
          ]},
          {menu:'titans', titre:'Titans', points:[
            'Tes stats s’affichent à côté des stats conseillées.',
          ]},
          {menu:'shop', titre:'Boutique', points:[
            'Magasin des Perks en vitrines néon, avec recherche et filtre.',
            'Point rouge pour le nouveau ; image pour chaque article.',
          ]},
          {menu:'chroniques', titre:'Chroniques', points:[
            'V vert sur les boosts au niveau 100 ; point rouge sur les trophées non vus.',
          ]},
          {menu:'chat', titre:'Chat', points:[
            'Tes messages apparaissent dès l’envoi.',
          ]}
        ]
      },
      {
        version:'2.0',
        nom:'Des chronos exacts, des combats plus vivants',
        date:'2026-10-03',
        hommage:HOMMAGE_ANCIEN,
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Serveur environ dix fois plus rapide à chaque synchro.',
            'Tous les chronos suivent l’heure du serveur : barres exactes, plus de recul.',
            'Correctif : la régénération de vie tient compte de tous tes multiplicateurs.',
            'Sur PC, menus en colonne à gauche, toujours visibles.',
            'Menus du haut refaits : badge illustré, sons et animations propres.',
            'Objets, ennemis et boutiques traduits en français (originaux en English).',
          ]},
          {menu:'entrainement', titre:'Entraînement de base', points:[
            'La compétence suivante apparaît en grisé avec son prérequis.',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Images animées pendant le combat, barres de vie refaites, plus de boss sauté.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Coffre rangé par sets, avec recherche par nom ou statistique.',
            'Tri amélioré ; popups d’objet après une demi-seconde de survol.',
          ]},
          {menu:'moneyPit', titre:'Trou sans fond', points:[
            'Récompenses de connexion mensuelles : une case par jour.',
          ]},
          {menu:'augmentations', titre:'Augmentations', points:[
            'Les barres ne s’arrêtent plus entre deux niveaux.',
          ]},
          {menu:'avance', titre:'Entraînement avancé', points:[
            'Vraies barres de progression pour chaque compétence.',
          ]},
          {menu:'machine', titre:'Machine temporelle', points:[
            'Barre d’Or qui se remplit en direct.',
          ]},
          {menu:'shop', titre:'Boutique', points:[
            'Sons de pas et de clochettes dans les boutiques.',
          ]},
          {menu:'parametres', titre:'Réglages', points:[
            'Choix de la langue : Français ou English.',
          ]}
        ]
      },
      {
        version:'1.9',
        nom:'Plus léger, plus vivant, plus sonore',
        date:'2026-10-02',
        hommage:HOMMAGE_ANCIEN,
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Réponses du serveur environ dix fois plus légères.',
            '« En direct » ne montre que ce qui se passe vraiment en direct.',
            'Menus plus colorés, avec des noms en français.',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'La régénération de PV tient compte de tous tes bonus.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Coffre épuré : l’image remplit toute la case.',
          ]},
          {menu:'renaissance', titre:'Renaissance', points:[
            'Après un Rebirth, certains menus se referment jusqu’à retuer leurs boss.',
          ]},
          {menu:'avance', titre:'Entraînement avancé', points:[
            'Entraînement avancé refait comme dans le jeu d’origine.',
          ]},
          {menu:'shop', titre:'Boutique', points:[
            'Nouveau rayon « Toc » : tri de l’inventaire et synchro d’entraînement.',
          ]},
          {menu:'parametres', titre:'Réglages', points:[
            'Trois barres de son : voix, ambiance et interface.',
          ]}
        ]
      },
      {
        version:'1.8',
        nom:'Un jeu vivant et lisible',
        date:'2026-10-01',
        hommage:HOMMAGE_ANCIEN,
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Bandeau « En direct » en bas de l’écran.',
            'Bannière quand une nouvelle version est disponible.',
            'Un décor par menu ; textes plus lisibles sur téléphone.',
          ]},
          {menu:'entrainement', titre:'Entraînement de base', points:[
            'Compétences d’attaque et de défense bien séparées.',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Barres de vie du combat plus grosses, avec seulement les PV.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Les boosts s’effacent dès qu’on les absorbe.',
          ]},
          {menu:'chat', titre:'Chat', points:[
            'Le chat devient une vraie page du menu.',
          ]}
        ]
      },
      {
        version:'1.7',
        nom:'Scènes, chat et défis',
        date:'2026-09-30',
        hommage:HOMMAGE_ANCIEN,
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Scènes spéciales créées par l’administrateur, avec plusieurs voix.',
            'Chaque nouveau système a son panneau explicatif lu à voix haute.',
            'Menus de répartition instantanés.',
          ]},
          {menu:'challenges', titre:'Défis', points:[
            'Défis refaits, avec fin automatique.',
          ]},
          {menu:'chat', titre:'Chat', points:[
            'Chat réservé aux joueurs, avec la liste de ceux qui sont en ligne.',
          ]}
        ]
      },
      {
        version:'1.6',
        nom:'Une même interface partout',
        date:'2026-09-29',
        hommage:HOMMAGE_ANCIEN,
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Tous les écrans d’allocation partagent les mêmes boutons, sons et animations.',
            'Un bloc « À quoi ça sert ? » repliable dans chaque menu.',
            'La Magie se remplit progressivement comme l’Énergie.',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'La barre de vie des boss descend en douceur.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'L’Aventure farme pendant ton absence (jusqu’à 8 h).',
          ]},
          {menu:'sang', titre:'Magie du sang', points:[
            'Le menu est refait, avec un décor plus sombre.',
          ]}
        ]
      },
      {
        version:'1.5',
        nom:'Patience et finitions',
        date:'2026-09-28',
        hommage:HOMMAGE_ANCIEN,
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Scène spéciale : chargement visible, voix plus rapide, texte lisible.',
            'Petits ajustements d’affichage et de voix.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Image des objets spéciaux corrigée.',
          ]}
        ]
      },
      {
        version:'1.4',
        nom:'Absence contrôlée',
        date:'2026-09-27',
        hommage:HOMMAGE_ANCIEN,
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Un popup résume ce que tu as gagné pendant ton absence.',
            'Sons d’ambiance mieux réglés ; nouveaux sons de victoire.',
            'La voix ne lit plus les parenthèses.',
          ]},
          {menu:'entrainement', titre:'Entraînement de base', points:[
            'Rattrape une absence aussi longue que les autres.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Combat automatique, aussi hors ligne, contre des adversaires que tu peux vaincre.',
            'Coffre trié par zone ; plus de saut de page.',
          ]}
        ]
      },
      {
        version:'1.3',
        nom:'Sons, voix et sets',
        date:'2026-09-26',
        hommage:HOMMAGE_ANCIEN,
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Chaque action a son son ; chaque boss a son bruit d’apparition.',
            'Tutoriel qui se place tout seul ; voix améliorées.',
            'Touche Attack ou Defense pour voir le calcul complet.',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Chiffres de vie du duel plus beaux ; plus de boss revenu à pleine vie.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Compléter un set déclenche une annonce avec le bonus.',
            'Popups d’objet plus compacts ; filtres de butin par zone.',
          ]},
          {menu:'moneyPit', titre:'Trou sans fond', points:[
            'Le Trou rote des phrases humoristiques.',
          ]},
          {menu:'parametres', titre:'Réglages', points:[
            'Bouton « Signaler un bug » ; pseudo dans la section Profil.',
          ]}
        ]
      },
      {
        version:'1.2',
        nom:'Shop, Chat et confort de jeu',
        date:'2026-09-25',
        hommage:HOMMAGE_ANCIEN,
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Menu réorganisable en maintenant un bouton.',
            'Barre d’énergie plus claire, avec « Pleine dans… ».',
            'Valeurs corrigées.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Quatre pièces d’un même set : ton héros prend son apparence.',
          ]},
          {menu:'renaissance', titre:'Renaissance', points:[
            'Attack et Defense repartent à 100 après un Rebirth.',
          ]},
          {menu:'shop', titre:'Boutique', points:[
            'Les deux boutiques sont réunies dans un menu « Shop ».',
          ]},
          {menu:'chat', titre:'Chat', points:[
            'Le Chat SOREAL arrive dans le jeu.',
          ]}
        ]
      },
      {
        version:'1.1',
        nom:'Second passage',
        date:'2026-09-24',
        hommage:HOMMAGE_ANCIEN,
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Deuxième relecture des chiffres du jeu.',
            'Voix pré-enregistrées pour la narration.',
            'Compteur « Généré » au-dessus de la barre d’énergie.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Inventaire allégé ; popup d’objet au survol sur PC.',
          ]},
          {menu:'augmentations', titre:'Augmentations', points:[
            'Boutons + / − / Max et saisie libre.',
          ]},
          {menu:'shop', titre:'Boutique', points:[
            'Boutique EXP en onglets ; Boutique AP en mauve.',
          ]}
        ]
      },
      {
        version:'1.0',
        nom:'Fidélité au jeu de base',
        date:'2026-09-23',
        hommage:HOMMAGE_ANCIEN,
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Relecture du jeu : entraînement, combats, butin et équipement recalés.',
            'De nombreux systèmes complétés.',
            'Sécurité renforcée.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'L’Aventure ne se fige plus ; image des créatures selon leur nom.',
          ]}
        ]
      }
    ]
  };
})();
