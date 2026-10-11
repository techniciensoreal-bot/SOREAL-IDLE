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
    courante:'2.6',
    /* Hommage (Norman, 2026-10-08) : une ligne en bas de CHAQUE note de mise à jour, à conserver dans toutes les versions à venir. */
    hommage:'🐾 En hommage à Grizboule',
    versions:[
      {
        version:'2.6',
        nom:'Tout en direct',
        date:'2026-10-11',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Les menus dont les chiffres bougent seuls (barres, compteurs) se mettent à jour en direct pendant que tu es dessus.',
            'Chaque barre où tu places de l’énergie a un bouton « 0 » : il retire toute l’énergie de cette barre seulement.',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Sur la borne d’arcade, le fond de l’écran est maintenant tout noir : plus de points lumineux derrière l’image.',
            'En anglais, la chronique d’un boss est maintenant le texte original du wiki, et non plus une traduction du français.',
            'Les rails bleu et rouge de la borne d’arcade ne dépassent plus en haut.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Si tu retires (ou remplaces) une pièce qui augmente ton plafond d’énergie ou de magie, et que l’énergie déjà placée serait alors trop grande, le jeu refuse et te dit combien libérer d’abord.',
            'Le bouton Aventure ne clignote plus en rouge après une défaite.',
            'Sur téléphone, les pièces équipées sont dans un cadre sans titre, avec des cases de la même taille que celles du sac.',
            'Sur téléphone, quand tu descends dans l’inventaire, une languette tire un volet qui montre l’équipement par-dessus la page. Il disparaît quand tu remontes.',
            'Sur téléphone, une barre de défilement à droite de l’inventaire fait défiler la page sans jamais attraper une pièce.',
            'Le Coffre ne rote et ne pète que quand tu le vois, et il s’excuse après un pet avec des phrases variées.',
          ]},
          {menu:'titans', titre:'Titans', points:[
            'Chaque Titan a sa propre case « Auto-kill » : cochée, le Titan est tué automatiquement.',
            'L’auto-kill des Titans donne maintenant le butin quand tu es connecté. Hors ligne, il donne toujours seulement l’EXP, l’Or, les AP, PP et QP, comme dans le jeu d’origine.',
            'La carte d’un Titan dit clairement l’état de son auto-kill (par exemple : le Titan n’a pas encore réapparu, ou il manque des statistiques).',
            'Le mot « Titans » du menu Aventure brille quand un Titan est prêt à être affronté (sauf s’il se tue tout seul).',
            'Le ×5 de régénération de la Safe Zone ne s’applique plus pendant un combat contre un Titan.',
          ]},
          {menu:'augmentations', titre:'Augmentations', points:[
            'Une piste sans énergie ne progresse plus.',
            'Les valeurs ont été relues contre le wiki : toutes sont conformes.',
            'Tes cibles et « Faire suivre l’énergie » sont gardées après une Renaissance.',
            'Le reflet des barres ne brille que sur la partie remplie.',
          ]},
          {menu:'machine', titre:'Machine temporelle', points:[
            'La barre d’Or tique de plus en plus vite, jusqu’à 50 fois par seconde, sans s’arrêter de tiquer avant.',
            'La barre qui va de plus en plus vite se met à jour en direct : plus besoin de changer de menu pour la voir accélérer.',
          ]},
          {menu:'sang', titre:'Magie du sang', points:[
            'Quand un rituel a un tuyau, le sang le traverse pendant tout le niveau, puis coule une seule fois dans le récipient quand le niveau se termine : plus de filet qui coule sans arrêt.',
            'Les boutons de tous les rituels restent alignés, même quand aucune Magie n’est allouée.',
            'Les rituels suivants sont redessinés à leur tour, avec de vraies illustrations dessinées à la main.',
            'La page prend l’ambiance d’un rituel : bougies, pentacle qui tourne, et des tuyaux qui grossissent d’un rituel à l’autre.',
            'Les rituels sont redessinés un par un. Le premier : une punaise pique un doigt et une goutte tombe dans une boîte en verre portant ton nom.',
            'Une piqûre = un niveau. La boîte est pleine tous les 1000 niveaux. La punaise pique de plus en plus vite quand tu places de la Magie, avec une vitesse maximale pour que ça reste lisible.',
            'Quand une boîte est presque pleine, la suivante arrive d’en dehors de l’écran et pousse la première, qui sort de l’écran.',
            'Sous chaque rituel, « Sang collecté » indique le nombre de récipients déjà remplis.',
            'Le bouton des sorts dit maintenant « Lancer avec tout mon sang ».',
          ]},
          {menu:'challenges', titre:'Défis', points:[
            'Le menu Défis change de look : chaque défi est une carte avec son blason, ses étoiles de réussite et un gros bouton Jouer. Un clic sur la carte ouvre la fiche du défi.',
          ]},
          {menu:'tower', titre:'ITOPOD', points:[
            'La tour affiche un compte à rebours avant le prochain combat.',
          ]},
          {menu:'ngu', titre:'NGU', points:[
            'Le cadre lumineux d’une barre qui porte de l’énergie reste fixe : il ne clignote plus.',
          ]},
          {menu:'wandoos', titre:'Wandoos', points:[
            'L’image de l’ordinateur est recadrée, sans la partie vide du bas. Placer une ressource ne fait plus défiler la page.',
          ]},
          {menu:'chroniques', titre:'Chroniques', points:[
            'Dans l’onglet « Global » de Chroniques, le boss d’un joueur plus avancé que toi est masqué : tu ne vois pas jusqu’où les autres sont allés.',
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
            'Les barres qui portent de l’énergie s’animent avec des particules propres à chaque menu. Les boutons Max, 1/2, 1/4, + et − sont de grands carrés sur ordinateur, où les petites écritures sont aussi plus grandes. Chaque champ Input est propre à son menu.',
            '« En direct » annonce les Nuke, les objets transformés et les boosts versés ; les grands nombres ont des points entre les milliers ; les descriptions encore en anglais sont traduites et la version anglaise ne contient plus de français.',
            'La paralysie ne décale plus l’interface, et plus aucune bulle d’aide du navigateur n’apparaît au survol.',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Combat de boss : une vraie borne d’arcade dessinée, identique sur PC et sur téléphone, avec la chronique du boss dans un cadre sous la borne (elle s’affiche et se lit toute seule, avec un bouton Play / Stop). Ses néons et ses boutons s’animent en douceur, et la page est plus fluide.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'L’inventaire est refait : un Coffre à pattes, à dents et à langue qui croque les objets (bruits d’avalement et de crachat, rots et pets), des icônes dessinées, un bouton Trier lisible, et un clic droit (ou double tap) qui fusionne les boosts de même chiffre et de même couleur jusqu’au niveau 100.',
            'La page Aventure est allégée (journal à hauteur fixe, moins de clignotements) et le Cube annonce ses paliers.',
          ]},
          {menu:'moneyPit', titre:'Trou sans fond', points:[
            'Récompenses de connexion : un jour raté grise sa case sans tout remettre à zéro, et chaque jour raté retire 10 % aux récompenses restantes à partir du mois prochain. Le Trou sans fond est refait (image entière, roue journalière).',
          ]},
          {menu:'augmentations', titre:'Augmentations', points:[
            'Augmentations est refait : chaque paire montre ses deux pistes côte à côte, dans une même couleur avec une nuance plus claire pour la seconde, des tubes de verre lumineux, une cible par piste et « Faire suivre l’énergie ». L’Or est contrôlé en direct et, quand il manque, la piste la moins chère est servie en premier.',
          ]},
          {menu:'ngu', titre:'NGU', points:[
            'NGU est en nuit étoilée : le ciel s’éclaire à mesure que des machines tournent, le liquide des tuyaux avance à chaque image et la page ne rame plus.',
          ]},
          {menu:'chroniques', titre:'Chroniques', points:[
            'Un onglet des Chroniques, « Combat le plus long », range les joueurs selon leur plus long combat de boss mené jusqu’au bout (une fuite ne compte pas). La page des succès montre toutes ses cases, en couleur avec une médaille quand elles sont obtenues, grisées sinon.',
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
            '« En direct » raconte ce que font les autres joueurs : combats de boss lancés, victoires, fuites et défaites (avec des phrases taquines), menus visités, boosts versés dans une pièce ou dans le Cube, passages en boutique, au Trou ou à la roue. Chaque situation a une vingtaine de phrases ; un menu ou un boss que tu n’as pas encore découvert n’est jamais nommé, tu ne vois que les annonces des autres, et un même joueur n’apparaît plus en double.',
            'En haut de l’écran : cinq cadres (Attaque, Défense, Or, EXP, AP) sur une seule ligne, puis les barres d’énergie, de magie et de vie en tubes de verre animés, collées en haut. L’icône passe devant les chiffres, le gain par seconde est à gauche et le temps restant à droite, la vie affiche sa régénération en vert. Les animations bouclent sans à-coup et chaque barre a son propre popup au survol (sauf la vie).',
            'Dans chaque menu où l’on place une ressource : boutons + − Max sur chaque ligne, cadres « Plafond » (Max, 1/2, 1/4) et « Idle » (1/2, 1/4, Tout retirer), et un cadre « total placé » aux couleurs de la page.',
            'Les barres qui consomment de l’Or enchaînent leurs niveaux sans pause : l’Or baisse en direct, la barre reste pleine en disant ce qu’il manque quand l’Or ne suffit pas, et chaque somme est verte quand tu l’as, rouge sinon.',
            'Menu du jeu. Moins de menus : « Chroniques » réunit trois menus de suivi. Les derniers boutons sont Boutique, Chroniques, Chat, Réglages puis, pour l’administrateur seulement, Admin toujours en dernier, et un menu débloqué par un boss apparaît tout de suite. Sur ordinateur, plus de sous-titre sous les noms ; sur téléphone, les boutons se rangent sur 1, 2 ou 3 lignes. Le menu Aventure prend un nom plus large quand un nouvel onglet s’y débloque, et ce bouton brille quand un adversaire est prêt.',
            'Les grands nombres ont chacun leur unité en couleur (Spd en vert, Qa en bleu…), toujours séparée des chiffres par une espace.',
            'Ambiance et fluidité : l’orage n’a plus de pluie, la cheminée éclaire le pourtour de l’écran (désactivée par défaut, à cocher dans les Réglages), les sons d’ambiance se coupent d’un coup et une barre « Musique » règle les musiques de menus. Le jeu est allégé pour les téléphones (compteurs moins réécrits, animations légères).',
            'Les fenêtres explicatives sont courtes, claires et un peu drôles, et l’éditeur de voix est repensé : une bulle par personnage, des expressions, des pauses, et l’écoute d’une voix avant de la choisir. Toutes les voix sont modifiables.',
            'Plus de retour en arrière : une réponse tardive du serveur n’est jamais appliquée (boss vaincu, barres, état de jeu). Depuis SOREAL APP sur Android, le bouton ⚡ ouvre le jeu dans sa propre application (ou dans Chrome), et le retour se fait avec le bouton précédent. Un clic sur le numéro de Beta ouvre ces notes.',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Borne d’arcade : tout le boss est en haut (numéro, nom, barre de vie violette en tube de verre avec les chiffres dedans, capacités), son portrait est plus grand que celui du joueur, et le stick et les trois boutons ronds (Fight rouge, Fuite bleu, Nuke jaune) sont rapprochés au centre et se pressent directement. Sur ordinateur, elle ne prend pas tout l’écran. Le Nuke ne rend plus toute ta vie.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Sur téléphone, un seul geste : le double tap fusionne toutes les pièces identiques possibles puis, sinon, absorbe tous les boosts. Sur le Cube de l’infini, le double tap absorbe tous les boosts et l’appui long ouvre son popup.',
            'Sac et équipement : le sac s’affiche par pages de 60 cases (cinq par ligne sur téléphone), de petits points de couleur montrent les boosts qui manquent à une pièce (orange, bleu, jaune), le V vert n’apparaît qu’au niveau 100, et les troisième et quatrième accessoires se placent sous les deux premiers. Les interrupteurs d’automatisation et les minuteurs d’Auto Merge et d’Auto Boost se lisent au-dessus de l’inventaire.',
            'Aventure : une attaque utilisée bloque les autres pendant 1 seconde (0,8 seconde avec le set Red Liquid) ; en Zone sûre, le jeu ne farme plus en cachette ton ancienne zone ; un adversaire rencontré apparaît tout de suite. Un ensemble complété par fusion ou boost verse son EXP et ses AP immédiatement.',
          ]},
          {menu:'renaissance', titre:'Renaissance', points:[
            'La page Renaissance est entièrement en français : le nombre, le total de renaissances et le temps du run y vivent, avec des écritures plus lisibles.',
          ]},
          {menu:'moneyPit', titre:'Trou sans fond', points:[
            'Trou sans fond et roue : le cadre du prix change de couleur à chaque récompense, et jeter moins que le minimum prend quand même ton or, avec le message du jeu d’origine. Sur ordinateur, l’image du Trou garde une taille raisonnable.',
          ]},
          {menu:'augmentations', titre:'Augmentations', points:[
            'Un niveau d’Augmentation agit tout de suite sur l’attaque et la vie max.',
          ]},
          {menu:'avance', titre:'Entraînement avancé', points:[
            'À l’Entraînement avancé, seules les lignes concernées se mettent à jour.',
          ]},
          {menu:'sang', titre:'Magie du sang', points:[
            'Blood Magic accepte de la Magic dans plusieurs rituels à la fois, chacun à son rythme.',
          ]},
          {menu:'ngu', titre:'NGU', points:[
            'Page des NGU en nuit étoilée : un tuyau lumineux par NGU, avec + − Max, une cible, « Advance Energy », le minuteur du niveau en cours et un volet « Effets de tous tes NGU » qui reste ouvert. Les étoiles scintillent dès que de l’énergie ou de la magie est placée, et « Je fais quoi ? » reste ouvert le temps de lire.',
          ]},
          {menu:'wandoos', titre:'Wandoos', points:[
            'L’ordinateur rétro : démarrage une fois par Rebirth, énergie et magie en vraies quantités avec un champ de saisie (un nombre ou une fraction comme 1/4), barres de niveau en temps réel, touches mécaniques et écran stable sur téléphone.',
          ]},
          {menu:'shop', titre:'Boutique', points:[
            'Boutique EXP : chaque achat est un carré (médaillon, gain en vert, prix en pièce d’or, cadre bronze, argent ou or selon le palier) avec « Acheter » dessous. La quantité personnalisée comprend « 30K », « 1,5M »… et affiche un récapitulatif (gain, avant · après, coût, EXP restante). Les offres débutant sont des tickets dans le rayon Débuts, et aucun article d’un menu pas encore débloqué n’est proposé.',
            'Les deux achats du magasin s’appellent « Double tap : boosts » et « Double tap : fusion ».',
          ]},
          {menu:'chroniques', titre:'Chroniques', points:[
            'Équipement : ce qui est à 100 % est en couleur et le reste est grisé.',
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
            'Les pages avec des chiffres qui évoluent se mettent à jour sans toucher aux animations ni à tes champs de saisie.',
            'Le texte de présentation d’une page ne mentionne plus que ce que tu as déjà débloqué.',
            'Plusieurs textes d’aide, les notes de mise à jour et deux listes ne nomment plus de système que tu n’as pas encore débloqué.',
            'La récompense de connexion du jour est donnée dès que tu te connectes, avec une annonce : jours consécutifs et AP récupérés.',
            'Plusieurs menus qui restaient figés se mettent maintenant à jour en direct (toutes les 4 secondes) au lieu d’attendre ta prochaine visite.',
            'La fenêtre qui annonce un système débloqué dit maintenant où le retrouver.',
            'Ce que le serveur envoie ne contient plus que ce que tu as déjà découvert : plus de listes complètes ni de noms de systèmes que tu n’as pas encore débloqués (vérifié avec un joueur neuf).',
            'Sur téléphone, les boutons + et − des listes sont plus grands et plus faciles à toucher.',
            'Quand un écran rencontre une erreur discrète, elle est maintenant notée dans le journal de fluidité au lieu d’être perdue, pour être corrigée plus vite.',
            'Quand l’ambiance sonore est un orage, le ciel s’assombrit, des éclairs suivent les coups de tonnerre et des lumières blanches éclairent tout l’écran (rien du tout si ton appareil demande moins d’animations).',
            'L’application reprend peu à peu un nouveau style, adapté à chaque menu : couleurs propres à chacun, cadres sombres, textes façon bande dessinée.',
            'Les barres de puissance changent d’aspect à chaque palier (fond de plus en plus sombre, reflets, lueur, flammes).',
          ]},
          {menu:'entrainement', titre:'Entraînement de base', points:[
            'Dans l’entraînement, les titres sont des bandeaux de combat : lumières éteintes sans énergie, allumées comme un néon quand on en met, avec parfois un grésillement ; + et − font un clic de clavier.',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'La page du combat de boss devient une borne d’arcade : un grand écran où les deux combattants se font face, un joystick et six boutons.',
          ]},
          {menu:'sang', titre:'Magie du sang', points:[
            'Les barres du sang saignent quand elles sont actives.',
          ]},
          {menu:'wandoos', titre:'Wandoos', points:[
            'Une page a été entièrement refaite dans un style d’ordinateur des années 80 : écran vert qui change de couleur d’un bouton, barres à l’ancienne et un clavier dont les touches claquent.',
          ]},
          {menu:'yggdrasil', titre:'Yggdrasil', points:[
            'Une autre page a été entièrement refaite façon elfes : neuf éléments par page, chacun avec son image, des cadres de pierre et de feuillage et de nouveaux boutons.',
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
            'Les barres alimentées par une ressource (Augments, machine à Or, rituels) ne rattrapent plus leur retard quand tu changes l’allocation : elles gardent leur place et adoptent la nouvelle vitesse. Le niveau se termine plus vite, mais plus jamais d’un coup : impossible de placer une grosse somme, de remplir le niveau et de la retirer.',
            'Le jeu est plus léger : quatre appels de moins au démarrage, plusieurs allocations d’un coup (Augments, entraînement avancé) envoyées en un seul appel, et les chiffres des barres, de l’entraînement, de l’aventure et du combat de boss ne sont plus réécrits quand rien ne change.',
            'Le menu de gauche reste sur une seule colonne, même sur un grand écran, et ses boutons prennent entièrement la couleur de leur menu (comme la Boutique), avec une couleur plus vive et une lueur quand le menu est ouvert.',
            'En English, toute l’interface passe vraiment en anglais : menus, boutons, infobulles, messages et annonces ; repasser en Français remet tout dans la langue d’origine.',
            '« En direct » indique maintenant après combien de temps un Challenge a été réussi.',
            'La progression PP s’affiche en chiffres complets (724 124 / 1 000 000).',
            'Le maximum d’énergie affiché suit tout de suite un achat qui change le plafond (atout, boutique, équipement) : plus d’ancien chiffre ni de génération par à-coups jusqu’à la synchro suivante.',
            'L’énergie libre n’est plus bloquée au plafond de base : avec des bonus de plafond (atouts, équipement…), elle continue de se générer jusqu’au vrai plafond au lieu de retomber toute seule.',
            'La case « Ambiance » décochée coupe vraiment le son, y compris sur iPhone et iPad.',
            'Un menu a disparu : sa boutique est maintenant dans une autre page, derrière un bouton (avec « Retour » pour revenir).',
          ]},
          {menu:'entrainement', titre:'Entraînement de base', points:[
            'Entraînement de base : l’énergie en trop placée sur une ligne passe maintenant toujours à la ligne suivante quand elle se débloque (elle pouvait revenir dans l’énergie libre).',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'En combat de boss, si ta régénération dépasse les coups de l’ennemi, ta vie remonte pendant le combat : elle descend de moins en moins vite, s’arrête, puis remonte, au lieu de rester figée jusqu’à la fin.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Quand le jeu te ramène en Zone sûre, la raison est maintenant écrite dans le journal d’Aventure.',
            'Sur PC, le clic droit absorbe les boosts de la même façon partout, sur un objet comme sur le cube.',
            'Un ennemi d’Aventure ne reçoit plus l’image d’un autre quand son nom est traduit (le boss du Ciel affichait l’homme-oiseau à la place des bernaches).',
          ]},
          {menu:'augmentations', titre:'Augmentations', points:[
            'Augmentations : plus de petit retour en arrière du niveau ou de la barre à chaque validation du serveur (la page n’est plus redessinée en plein jeu : le serveur recale directement les barres).',
            'Le jeu ne se bloque plus quand on place d’énormes sommes d’énergie sur des barres très rapides (Augmentations) : le calcul du serveur est des centaines de fois plus rapide.',
          ]},
          {menu:'sang', titre:'Magie du sang', points:[
            'Chaque rituel affiche la Magie qui lui est allouée, avec le chiffre qui gonfle quand tu en ajoutes ou en retires. Quand tu enlèves toute la Magie, la barre du rituel s’arrête au lieu de continuer à monter, et repart de là où elle était.',
            'Blood Magic : la Magie libre se met à jour tout de suite quand on en place.',
          ]},
          {menu:'shop', titre:'Boutique', points:[
            'La boutique EXP ne propose plus d’acheter plus que le maximum (Recyclage de boosts : ×1 et ×5, plus de ×10).',
            'Boutique EXP : les explications de Puissance et de Barres sont corrigées. Les Barres multiplient la génération (chaque remplissage donne autant de points que de Barres) ; la Puissance ne change pas la génération, elle amplifie l’effet de chaque point placé.',
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
            'Les zones de saisie du jeu ont aussi un nouveau look.',
            'Les menus suivent l’ordre dans lequel tu les débloques ; la Boutique, les Succès, le Chat et les Réglages restent toujours à la fin, dans cet ordre (tu peux toujours les déplacer).',
            'Le fil En direct raconte aussi les jets dans le trou (l’or jeté et la récompense) et les tours de roue, avec les récompenses nommées seulement si tu connais déjà le système concerné.',
            'Les menus suivent maintenant l’ordre dans lequel on les obtient, pour tout le monde. Ton ancien rangement a été remis à zéro une seule fois : tu peux réarranger les boutons à ta façon, et ton rangement sera conservé.',
            'Les tuiles du haut ont chacune leur couleur : Nombre en cyan, Rebirths en vert, Attack en rouge, Defense en bleu, Gold en or, EXP en violet, AP en rose et Run en orange, avec un style plus soigné pour les repérer d’un coup d’œil.',
            'Sur ordinateur, les boutons du menu de gauche sont plus larges et plus longs, avec des icônes et des titres plus grands, à la même échelle que le reste de l’interface.',
            'Les boutons du menu du haut ne s’animent plus de base.',
            'Le fil « En direct » raconte deux choses de plus : quand quelqu’un lance un sort de sang (le sort n’est nommé que si tu l’as toi-même découvert), quand il regarde une cinématique, et quand il lance, perd ou gagne un combat contre un géant.',
            'Les barres montent en puissance : dans les menus où elles se débloquent les unes après les autres, chaque barre est plus bad ass que la précédente, avec les mêmes couleurs mais de plus en plus de foncé, de lumière et de mouvement. La première reste sobre ; la dernière est noire comme l’obsidienne, avec des coins cernés de lumière et un reflet qui la traverse.',
            'Le bandeau « En direct » annonce aussi quand un joueur prend la fuite devant un boss ou perd contre lui (le nom du boss n’est donné qu’à ceux qui l’ont déjà atteint).',
            'Sur PC, le menu de gauche est une seule colonne, tous les boutons superposés, sans barre de défilement qui apparaît et disparaît ; les images sont moins démesurées. Chaque menu a sa propre couleur.',
            'Les boutons « Plafond » des barres d’allocation s’appellent « Max ».',
            'Sur téléphone, le menu du haut se lance d’un geste et continue de défiler jusqu’au bout (avant, il s’arrêtait à chaque bouton) ; il ne revient plus au début quand la page se met à jour pendant que tu le fais défiler.',
            'Le bandeau d’infos présent sur toutes les pages prend beaucoup moins de place en haut, avec le même habillage : l’Énergie et la Magie tiennent chacune sur une ligne d’infos (titre, niveau par seconde, reste à générer et temps avant d’être plein) suivie de leur barre et les huit tuiles (Nombre, Rebirths, Attack, Defense, Gold, EXP, AP, Run) sur une seule ligne sur PC, deux lignes de quatre sur téléphone. Environ moitié moins haut, sans perdre aucune information.',
            'Le jeu ressemble à un vrai jeu : le clic droit n’ouvre plus le menu du navigateur (le clic droit sur un objet du sac garde son action rapide) et les textes ne se sélectionnent ni ne se copient plus. Les champs où l’on écrit (pseudo, chat…) restent normaux.',
            'Éditeur de voix : chaque bloc de texte a sa ligne avec le fichier de voix à télécharger, à retoucher ailleurs puis à remplacer (le nouveau fichier écrase l’ancien). Les voix devenues inutiles sont retirées du texte à l’enregistrement, et le bouton de nettoyage des voix supprime leurs fichiers.',
            'Le temps de jeu est corrigé : il compte maintenant tout le temps où le jeu est affiché à l’écran, même sans cliquer (avant, seuls les clics des deux dernières minutes comptaient, ce qui en perdait la majeure partie). Le profil affiche ce vrai temps de jeu, et l’ancienneté du compte a sa propre ligne.',
          ]},
          {menu:'entrainement', titre:'Entraînement de base', points:[
            'Entraînement de base : le bouton « Max » d’une compétence rend l’énergie en trop et ne laisse que ce qui est nécessaire à son plafond, y compris quand la case Synchro est cochée (avant, il ne faisait que compléter les barres qui n’étaient pas pleines) ; plus de faux message « aucune énergie disponible » quand de l’énergie est rendue.',
            'Correctif : l’achat qui fait passer l’énergie à la compétence suivante d’Entraînement de base marche enfin à l’écran : quand une compétence se débloque, l’énergie qui dépasse le plafond de la précédente passe tout de suite à la nouvelle (avant, elle n’était déplacée que côté serveur et l’écran la remettait à sa place).',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Quand tu es paralysé en combat, les raccourcis d’attaque et de parade se grisent avec un éclair et un bandeau jaune indique combien de temps ça dure : plus d’impression que le jeu ne répond plus.',
            'La salle réagit : des rires quand tu prends la fuite, en plus des sons habituels.',
            'Les ennemis les plus redoutables n’ont plus seulement des chiffres : leurs capacités agissent pour de bon en combat. Paralysie, saignement qui ronge ta régénération, nuages de spores, nuées de sauterelles, battement de chemise qui désactive tes capacités une à une, invincibilité et puissance qui double à chaque tour… Les premiers sont faits, les suivants arrivent. Leur fiche dit exactement ce qui est simulé.',
            'Correctif : un ennemi redoutable ne peut plus être déclaré vaincu sans avoir été combattu (un combat ordinaire qui se terminait au même moment pouvait compter comme sa défaite). Seul son propre combat compte désormais.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Les objets qui débloquent un système arrivent toujours dans ton sac, jamais dans un menu à activer. Si ton sac est plein, un message te prévient qu’un objet t’attend et il arrive dès qu’une place se libère.',
            'Double tap et Triple tap servent aussi sur ordinateur : un clic droit sur un objet, au sac ou équipé, fusionne d’abord les pièces identiques, puis absorbe les boosts quand il n’y en a plus.',
            'Les combats se voient enfin : chaque attaque a son effet sur l’image de l’ennemi (trait, explosion, lance, météorite), chaque coup reçu a le sien sur ta barre de vie (flash, bouclier, paralysie, spores) et des nombres flottent à chaque impact. Un soin fait monter des croix vertes tant que ta vie remonte, et quand tu saignes ta barre vire au rouge sang, avec des gouttes qui coulent de plus en plus vite.',
            'La fiche d’objet est la même partout : le Coffre (au clic, ou en restant 1,5 seconde dessus sur PC) et la Collection ouvrent la fiche de statistiques de l’inventaire, et la reprise d’un objet se fait depuis cette fiche.',
            'Les objets qui débloquent un système s’utilisent comme dans le jeu d’origine : « Utiliser » sur la fiche de l’objet, ou clic droit dessus. L’objet est consommé et le système se débloque pour toujours. L’ancien menu « Objets de déblocage » ne reste qu’en secours si l’objet n’est plus dans ton sac.',
            'Les images de zone sûre déposées pendant que le jeu est ouvert apparaissent toutes seules (le jeu les redemande toutes les 20 secondes), sans recharger la page. Formats acceptés : webp, png, jpg, jpeg et avif.',
          ]},
          {menu:'avance', titre:'Entraînement avancé', points:[
            'L’entraînement avancé a des barres à la couleur de chaque compétence : plaques d’acier bleu pour la résistance, flammes pour la puissance, écailles cyan pour le blocage, écran à lignes de balayage pour les dumps de l’énergie, étincelles magenta pour ceux de la magie.',
          ]},
          {menu:'machine', titre:'Machine temporelle', points:[
            'Un menu est entièrement relooké : une machine de laiton qui fabrique de l’Or, avec le gain d’Or par seconde en très grand, la barre d’Or qui bat à chaque remplissage et des pièces qui tombent. Et à la fin d’une barre, le niveau suivant arrive tout de suite, sans attendre une action.',
          ]},
          {menu:'sang', titre:'Magie du sang', points:[
            'Chaque sort de sang a son rituel sonore, de plus en plus intense : un cœur qui s’emballe pour le premier, puis un glas, un râle, un chœur dissonant, et pour le dernier un vrai rituel qui dure presque cinq secondes.',
            'Le menu du sang a sa propre musique, qui monte très lentement en arrivant (cinq secondes de fondu) et redescend en partant, et qui reprend exactement là où elle s’était arrêtée quand tu y reviens.',
          ]},
          {menu:'tower', titre:'ITOPOD', points:[
            'La tour a sa propre arène : un décor par étage, un ouvrier, un responsable ou un ancien comme ennemi (avatar grand, sans cadre, qui respire), sa barre de vie qui descend à chaque coup de poing, et le choix des étages juste en dessous. Les joueurs sont aussi des ennemis, avec un avatar chacun. Un bouton permet d’entrer dans la tour pour combattre à la chaîne.',
          ]},
          {menu:'challenges', titre:'Défis', points:[
            'Un défi en cours a maintenant son compteur : le temps écoulé depuis son lancement, en mois, semaines, jours puis heures, minutes et secondes.',
          ]},
          {menu:'titans', titre:'Titans', points:[
            'Là où tu affrontes les géants, tes stats d’aventure s’affichent à côté des stats conseillées : en vert quand tu as atteint le niveau conseillé, en rouge sinon, pour le combat manuel, l’idle et l’auto-kill.',
          ]},
          {menu:'shop', titre:'Boutique', points:[
            'Le magasin des Perks devient une boutique à part, en vitrines néon, avec l’image de chaque achat, une recherche et un filtre des achats abordables.',
            'Les trois achats du rayon Toc ont maintenant leur propre illustration.',
            'La boutique prévient quand il y a du nouveau : un point rouge sur le bouton du menu, sur les rayons concernés et sur chaque nouvel achat, qui disparaît une fois l’achat vu. L’étoile du bouton ne scintille plus que dans la boutique ou quand elle a du nouveau.',
            'Les boutiques ont été remises en ordre : chaque rayon a la couleur de ses boutons, les boutons sont plus petits et ne disent plus que « Acheter », et les prix et les gains sont écrits dans le cadre de chaque article.',
            'Chaque achat de la boutique EXP a maintenant sa vignette, comme ceux de la boutique AP, et le rayon des petits outils a retrouvé son vrai nom.',
            'Un nouvel achat du rayon Toc de la boutique EXP (40 EXP), « Menus animés », les fait vivre quand un menu est actif.',
            'Chaque article des boutiques a maintenant son image, la même que dans le jeu d’origine.',
            'La boutique magique passe au mauve.',
            'Le double tap et le triple tap sur les objets du sac ne sont plus offerts de base : ils s’achètent dans la boutique EXP, rayon Aventure. « Double tap » (20 EXP) : un objet, équipé ou non, absorbe tous les boosts de ton inventaire. « Triple tap » (30 EXP) : il fusionne automatiquement avec toutes les pièces identiques disponibles.',
            'Les pas qui se font entendre quand tu passes d’un rayon à l’autre ne se répètent plus : six façons de marcher (talons sur parquet, baskets qui couinent, grosses bottes sur du gravier, tongs, talons aiguilles, vieux plancher qui craque), trois ou quatre pas, à un rythme différent à chaque fois.',
            'Les images des boutiques se chargent tout de suite et sont préchargées, pour ne plus clignoter ni manquer à l’appel.',
          ]},
          {menu:'chroniques', titre:'Chroniques', points:[
            'Collection : un V vert apparaît sur les boosts montés au niveau 100.',
            'Succès : un point rouge apparaît sur la catégorie d’un trophée que tu n’as pas encore vu, et sur le trophée lui-même, tant que tu restes dans le menu.',
            'Collection : la fiche d’un boss affiche son image entière et bien centrée sur PC, et l’administrateur peut y modifier le nom et la chronique du boss.',
          ]},
          {menu:'chat', titre:'Chat', points:[
            'Le chat envoie tes messages sans attendre : le message apparaît dès que tu l’envoies, avec la mention « envoi… » le temps que le serveur confirme.',
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
            'Le serveur répond environ dix fois plus vite à chaque synchro (de 1 à 4 secondes avant, bien moins d’une demi-seconde maintenant) : il recalcule beaucoup moins de choses à chaque appel.',
            'Tous les chronos sont calés sur l’heure du serveur, plus sur celle de ton téléphone : barres et comptes à rebours restent exacts, ne se figent plus après une synchro, ne reculent plus quand la page se redessine, et le jeu se resynchronise dès que tu reviens sur l’onglet.',
            'Correctif important : la régénération de ta vie tient de nouveau compte de tous tes multiplicateurs. Avant, elle était des milliards de fois trop faible côté serveur : la barre montait à l’écran puis retombait à chaque synchro. Elle monte maintenant jusqu’au bout.',
            'L’Or d’un niveau gagné est retiré tout de suite du compteur du haut de page, qui reste le seul compteur d’Or de la page.',
            'Le jeu retente tout seul une synchro qui échoue (réseau instable) et force une synchro si l’état du serveur tarde trop à arriver.',
            'Le bandeau « En direct » annonce l’article acheté par les autres joueurs, la durée du run lors d’un Rebirth et les récompenses de connexion récupérées ; les longs messages du chat y passent en entier. Le chat reste collé aux derniers messages.',
            'Le menu du haut est refait : chaque bouton a maintenant son identité, avec un badge illustré à la forme et à la couleur de son menu (bouclier pour le combat, goutte pour le sang, bulle pour le chat…), son nom et un verbe qui dit ce qu’on y fait.',
            'Les noms et descriptions des objets, des ennemis, des boutiques et des récompenses sont traduits en français ; en English, tu retrouves les originaux.',
            'Sur PC, le jeu occupe toute la largeur de l’écran : les menus sont rangés en colonne à gauche, toujours visibles, et la page à droite. Sur un grand écran de TV, tous les menus tiennent à l’écran, sans défilement. La bannière SOREAL IDLE s’affiche en entier et le bandeau « En direct » n’est plus caché.',
            'Les boutons du menu s’animent, chacun à sa façon : quand tu y places de l’énergie, quand tu farmes dans une zone, quand quelque chose t’attend, ou simplement quand tu es dans la boutique, le chat ou les réglages.',
            'Chaque menu a son propre petit son.',
            'La vitesse de génération de l’énergie et de la magie monte maintenant un petit peu à chaque achat, au lieu de rester bloquée entre deux paliers ; la vitesse des équipements compte aussi.',
            'Correctif : le plafond d’énergie acheté avec de l’EXP s’ajoute par-dessus la croissance naturelle de 100 000 au lieu de l’empêcher de continuer.',
            'Les grands nombres s’écrivent avec davantage de suffixes avant de passer en notation scientifique.',
            'Correctif : le cap d’énergie acheté avec de l’EXP s’ajoute désormais par-dessus la croissance naturelle de 100 000 par Rebirth, au lieu de l’empêcher de continuer.',
            'Les boutons prêts à servir brillent de façon bien visible (dans le menu comme dans la page).',
          ]},
          {menu:'entrainement', titre:'Entraînement de base', points:[
            'Basic Training : la compétence suivante apparaît en grisé avec son seul prérequis, et la case Synchro garde son état après un Rebirth.',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Fight Boss : les images s’animent pendant le combat (élans, secousses, halo), chacune à sa façon (le boss est lourd et lent, le joueur vif et léger) et d’autant plus fort que SA propre vie baisse. Barres de vie refaites avec dégradés, reflets et alertes. Le bouton Fight reste grisé tant que le serveur n’a pas validé le combat. Plus de boss sauté ni de retour en arrière après une victoire.',
            'Pendant un combat de boss, le jeu se met à jour plus souvent : tes statistiques et le boss suivant arrivent plus vite, sans attendre d’appuyer sur Fight.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'En Aventure, la barre de l’ennemi est rouge.',
            'Inventaire : le tri classe aussi les boosts par numéro croissant dans leur catégorie, et place côte à côte les objets de même nom. Trier ne fait plus clignoter la page (on ne voit plus le haut de l’écran une fraction de seconde).',
            'Détails d’affichage : cases du Coffre plus petites avec l’image pleine case.',
            'Le Coffre range maintenant chaque set dans un cadre à ses couleurs et à son décor (un thème par set), posé comme sur un mannequin, les cadres côte à côte et à la ligne quand la place manque. La recherche trouve aussi les noms d’origine et les statistiques (« magic », « forest »), et le filtre de butin amélioré se règle objet par objet depuis le Coffre.',
            'Les noms d’objets sont traduits en français (objets, pièces d’équipement et sets), par exemple « Clé furieuse » : la recherche du coffre se fait donc en français.',
            'Le tri range maintenant les accessoires en premier, puis les objets divers, puis l’équipement, puis les boosts ; les objets protégés (cadenas) passent toujours en tête de leur catégorie.',
            'Les popups d’objet s’ouvrent après une demi-seconde de survol, au lieu de s’ouvrir dès que la souris passe dessus.',
            'Le coffre a maintenant une recherche : tape un nom d’objet ou une statistique (par exemple Magic Power) et seuls les objets correspondants restent affichés.',
            'Popup des objets : l’intitulé de chaque statistique a la couleur du boost qui la remplit (orange pour la puissance et les PV max, bleu pour l’endurance et la régénération, jaune pour les spéciaux).',
          ]},
          {menu:'moneyPit', titre:'Trou sans fond', points:[
            'Texte du prix lisible dans le menu des récompenses d’Or, et boutons de ce menu grisés tant qu’ils ne sont pas prêts.',
            'Des récompenses de connexion mensuelles apparaissent dans un menu une fois découvert : une case par jour du mois, qui s’allument une à une. Plus tu enchaînes les jours, plus c’est généreux ; rater un jour te ramène à la première case. Les jours 1 et 2 d’octobre sont offerts à tous.',
            'Le menu des récompenses d’Or est plus clair : « Ton prix » juste sous les boutons, puis le bonus des jours cumulés avec le total d’AP obtenus depuis le début, puis deux cadres repliables (un par liste de récompenses), de 20 lignes par page, avec des pages pour les plus anciennes.',
            'Money Pit : le cadre « Ton prix » a la même largeur que les autres cadres sur PC.',
          ]},
          {menu:'augmentations', titre:'Augmentations', points:[
            'Augmentations : « il manque de l’Or » est jugé avec ton Or du moment ; la barre reste pleine à la fin d’un niveau et repart dès que l’Or suffit. Même logique pour les autres barres qui dépensent de l’Or.',
            'Les barres des Augmentations ne s’arrêtent plus entre deux niveaux : le niveau, le coût du suivant et le temps se mettent à jour à l’instant où la barre passe.',
          ]},
          {menu:'avance', titre:'Entraînement avancé', points:[
            'Chaque compétence de l’entraînement avancé affiche une vraie barre de progression qui se remplit en direct, avec son bonus actuel et le temps avant le niveau suivant.',
          ]},
          {menu:'machine', titre:'Machine temporelle', points:[
            'La machine à Or gagne sa barre qui se remplit au rythme de ses remplissages par seconde ; ses chiffres se mettent à jour en direct.',
          ]},
          {menu:'shop', titre:'Boutique', points:[
            'Trois pas se font entendre quand tu changes de rayon dans une boutique, et la boutique a sa musique, qui s’ajoute à l’ambiance d’Aventure.',
            'Un nouveau son de clochettes de vieux magasin accueille dans la boutique.',
          ]},
          {menu:'parametres', titre:'Réglages', points:[
            'Choix de la langue dans les Réglages : Français ou English.',
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
            'Le jeu envoie beaucoup moins de données à chaque action : les réponses du serveur sont environ dix fois plus légères, donc plus rapides, surtout sur téléphone.',
            'Le bandeau « En direct » ne montre que ce qui se passe réellement en direct : chaque information entre à l’instant où elle arrive et ne passe qu’une fois. Il annonce aussi les connexions, les défis lancés, les sets complétés et les achats en boutique.',
            'Dans les champs Input et Target, un clic sélectionne tout le nombre.',
            'Les menus sont plus colorés, avec plus d’emojis et des noms en français ; un menu a retrouvé les couleurs du jeu d’origine.',
            'Pendant un défi ou après un Rebirth, les chroniques et histoires de boss déjà rencontrés ne sont plus relues automatiquement.',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'La régénération de PV en Fight Boss tient compte de tous tes bonus, et les chiffres de vie restent fixes (deux décimales), avec la régénération en petit vert lumineux à droite des cadres, qui font la largeur des portraits.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Le Coffre est épuré : l’image remplit toute la case, avec seulement le niveau, la coche et le nom par-dessus.',
            'Quand un objet n’absorbe aucun boost, un message t’explique pourquoi.',
          ]},
          {menu:'renaissance', titre:'Renaissance', points:[
            'Après un Rebirth, certains menus et zones se referment tant que tu n’as pas retué les boss qui les ouvrent, comme dans le jeu d’origine.',
          ]},
          {menu:'avance', titre:'Entraînement avancé', points:[
            'L’entraînement avancé est refait comme dans le jeu d’origine (une ligne par compétence, Target, « Advance Energy »).',
          ]},
          {menu:'challenges', titre:'Défis', points:[
            'Lancer un défi te fait renaître comme un vrai Rebirth.',
          ]},
          {menu:'titans', titre:'Titans', points:[
            'Les ennemis les plus coriaces se combattent dans la scène d’Aventure.',
          ]},
          {menu:'shop', titre:'Boutique', points:[
            'Nouveau rayon « Toc » dans la boutique EXP avec le tri de l’inventaire (20 EXP) et « Synchro Basic Training » : une case sous Input place l’énergie en même temps dans les deux compétences d’une paire.',
          ]},
          {menu:'parametres', titre:'Réglages', points:[
            'Trois barres de son dans les Paramètres (voix, ambiance, sons de l’interface), à 75 % de base, avec une case à cocher pour couper chacune complètement.',
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
            'Un bandeau « En direct » en bas de l’écran annonce ce que font les autres joueurs (boss vaincus pour la première fois, trophées, farm…) et les messages du chat. Chaque information ne passe qu’une fois, en fondu.',
            'Une bannière t’invite à rafraîchir la page quand une nouvelle version du jeu est disponible.',
            'Tous les menus ont leur propre décor, et les cases fixes du haut prennent les couleurs de la page ouverte.',
            'Les textes sont plus grands et plus lisibles sur téléphone.',
            'Une allocation d’énergie ou de magie n’est plus jamais annulée par une mise à jour plus ancienne.',
          ]},
          {menu:'entrainement', titre:'Entraînement de base', points:[
            'Dans l’entraînement, les compétences d’attaque (rouge) et de défense (bleu) sont clairement séparées.',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Les barres de vie du combat n’affichent plus que les PV, en plus gros.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Les boosts s’effacent tout de suite quand tu les absorbes, et un objet qui tombe apparaît sans devoir rafraîchir.',
          ]},
          {menu:'chat', titre:'Chat', points:[
            'Le chat est maintenant une vraie page du menu, avec l’activité des joueurs au-dessus.',
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
            'Les scènes spéciales peuvent être créées et modifiées par l’administrateur (images, textes, boss qui déclenche la scène), avec des voix d’homme et de femme dans la même histoire grâce aux balises, et un bouton pour écouter chaque étape seule. Toutes les voix ont été réenregistrées, plus naturelles.',
            'Le temps de jeu comparé ne compte plus que le temps où tu joues vraiment.',
            'Chaque nouveau système débloqué a son propre panneau explicatif, lu à voix haute.',
            'Les menus où l’on répartit de l’énergie ou de la magie répondent instantanément ; les clics rapprochés sont regroupés en un seul envoi.',
            'La barre de Magie se remplit vraiment au compte-goutte, comme l’Énergie.',
            'Les histoires de boss déjà entendues ne se relisent plus quand tu passes du PC au téléphone.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'En Aventure, les coups sont de nouveau nets.',
          ]},
          {menu:'challenges', titre:'Défis', points:[
            'Le menu Défis est refait d’après le wiki : description, restrictions réellement appliquées, condition de victoire et récompenses en français ; un défi se termine tout seul dès que son objectif est atteint, avec une annonce des récompenses.',
          ]},
          {menu:'chat', titre:'Chat', points:[
            'Le chat est réservé aux joueurs de SOREAL IDLE, dans le jeu. Le bouton « en ligne » montre qui joue et ce qu’il fait (un nom de zone ou de boss n’apparaît que si tu l’as déjà découvert).',
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
            'Les autres écrans d’allocation reprennent aussi les boutons, la taille, le son, l’animation et la réactivité de Basic Training, avec le temps restant avant le prochain niveau.',
            'Chaque menu d’allocation a un bloc « À quoi ça sert ? » qui se replie d’un clic ; les éléments encore inaccessibles n’y apparaissent pas.',
            'La barre de Magie se remplit progressivement comme l’Énergie, et les infobulles Énergie / Magie montrent leurs vrais chiffres.',
            'Les zones Input gardent le dernier chiffre écrit.',
            'Une nouvelle scène spéciale, avec les voix de la deuxième histoire enregistrées.',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'La barre de vie des boss redescend de façon fluide.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'L’Aventure continue de farmer pendant ton absence (dans la limite de 8 heures) sans trop remplir ton sac ; une défaite pendant l’absence est racontée dans le journal de combat.',
            'Sur PC, les statistiques d’un objet s’affichent au survol, en un seul popup. Les objets spéciaux retrouvent leur vraie image, le portrait du set Forêt évolue avec le niveau de l’équipement.',
            'Un double tap sur le Cube de l’infini lui fait absorber tous les boosts.',
          ]},
          {menu:'augmentations', titre:'Augmentations', points:[
            'Augmentations reprend les boutons, la taille, le son, l’animation et la réactivité de Basic Training, avec le temps restant avant le prochain niveau.',
          ]},
          {menu:'sang', titre:'Magie du sang', points:[
            'Blood Magic reprend les mêmes boutons et réglages, et est refait, avec un décor plus sombre et une barre de progression.',
          ]},
          {menu:'shop', titre:'Boutique', points:[
            'Nouvel achat dans la boutique EXP : un bouton « Trier » pour le sac.',
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
            'Scène spéciale du boss 18 : un indicateur de chargement tourne pendant les attentes, la voix démarre nettement plus vite, et le texte reste affiché assez longtemps pour être lu même sans voix.',
            'Le rythme de cette scène est corrigé (défilement trop rapide quand la voix ne joue pas).',
            'Petits ajustements d’affichage et de synthèse vocale.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'La recherche d’image de certains objets spéciaux est corrigée : ils sont reconnus par leur identifiant exact.',
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
            'Au retour d’une absence, un popup résume ce que tu as eu (EXP, AP, boss battus, dégâts, objets obtenus…) et reste affiché jusqu’au clic sur « Fermer ».',
            'Certains systèmes de fin de partie progressent aussi pendant ton absence.',
            'Les sons d’ambiance ne se superposent plus et sont compensés pour sonner au même niveau ; nouveaux sons pour les sets complétés, le Money Pit, la roue quotidienne et dix sons de victoire différents.',
            'La voix ne lit plus le texte entre parenthèses ni « Chronique du boss » ; l’histoire d’un boss ne se relance plus après un Rebirth ; la fenêtre d’explication se réduit en petite bulle quand tu cliques en dehors.',
          ]},
          {menu:'entrainement', titre:'Entraînement de base', points:[
            'Basic Training rattrape une absence aussi longue que les autres.',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Le prochain boss apparaît plus vite après une victoire.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Une option de combat automatique engage, en ligne comme hors ligne, des adversaires que tu es assez fort pour vaincre. Le combat automatique ne s’arrête plus quand l’application passe en arrière-plan.',
            'Les défaites automatiques apparaissent dans le journal de combat (regroupées en une ligne).',
            'Le Coffre trie ses cases par zone puis par type de pièce ; l’automatisation de l’inventaire est rangée en cartes ; le boss de zone porte une couronne dorée.',
            'Plus de saut de page en ouvrant le Coffre, en cochant un filtre ou en changeant d’onglet.',
          ]},
          {menu:'augmentations', titre:'Augmentations', points:[
            'Les boutons +, − et Max des Augmentations réagissent instantanément.',
          ]},
          {menu:'avance', titre:'Entraînement avancé', points:[
            '« Power », « Toughness » et « HP Regen » passent en français.',
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
            'Menus : les boutons qui ne font pas progresser le jeu sont à droite, avant Settings ; les boutons répondent dès le premier clic (actions mises en file).',
            'Touche Attack ou Defense pour voir le calcul complet, facteur par facteur ; SOREAL IDLE peut s’installer comme une application.',
            'Le tutoriel du début se place tout seul, avec des boutons qui clignotent pour te montrer où cliquer ; les voix sont améliorées (plus claires, noms mieux prononcés, plus de « astérisque »).',
            'Chaque achat fait un bruit de caisse enregistreuse ou de carillon ; équiper, ajouter ou retirer de l’énergie, perdre un combat, fuir, lancer un combat, débloquer un succès ou un menu ont chacun leur son ; chaque nouveau boss a son propre bruit d’apparition.',
            'Le zoom (pincement, double tap) est désactivé.',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Les chiffres de vie du duel sont plus beaux et ne dépassent plus de leur pastille.',
            'Correction : un boss vaincu n’est plus suivi, quelques secondes plus tard, du même boss revenu à pleine vie.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Les fenêtres de statistiques d’objet sont plus compactes et la comparaison fonctionne sur téléphone ; les filtres de butin sont propres à chaque zone.',
            'Compléter un set déclenche une annonce en fondu avec le bonus obtenu.',
            'Des visages familiers de l’équipe apparaissent parmi les ennemis.',
            'Le bouton Adventure clignote quand tu es K.O.',
          ]},
          {menu:'moneyPit', titre:'Trou sans fond', points:[
            'Le Trou rote des phrases humoristiques, avec les temps de recharge du jeu d’origine.',
          ]},
          {menu:'chroniques', titre:'Chroniques', points:[
            'Dans la Collection, l’onglet Sets met en évidence le set complété.',
          ]},
          {menu:'parametres', titre:'Réglages', points:[
            'Nouveau bouton « Signaler un bug » dans Settings ; ton pseudo se choisit dans Settings, section Profil.',
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
            'Le menu est réorganisable (maintiens un bouton pour passer en mode « Rangement des boutons »).',
            'Barre d’énergie : le tick garde une vitesse constante, avec un compteur « Pleine dans… » ; le plafond d’énergie au Rebirth compte toute l’énergie du run, comme dans NGU.',
            'Valeurs corrigées d’après le wiki : certaines options ne sont achetables que dans la difficulté prévue (ce que tu as déjà acheté est conservé), Special Boosts comme dans le jeu d’origine, nouveaux fruits disponibles selon tes systèmes.',
            'Infobulle d’énergie avec les raccourcis R et T ; les voix des popups démarrent sans délai.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Quand tu portes les 4 pièces d’un même set, ton héros prend l’apparence de ce set ; le choix des portraits montre leurs images ; un emoji remplace l’image manquante d’un objet.',
            'L’inventaire ne saute plus avec A / D / Q / W / E.',
          ]},
          {menu:'renaissance', titre:'Renaissance', points:[
            'Attack et Defense repartent à 100 après un Rebirth.',
          ]},
          {menu:'shop', titre:'Boutique', points:[
            'Les deux boutiques sont réunies dans un menu « Shop » avec un onglet par boutique.',
            'Special Prize : deux choix (50 000 AP ou un joli chaton).',
          ]},
          {menu:'chroniques', titre:'Chroniques', points:[
            'Collection : cartes de boss épurées et cliquables.',
          ]},
          {menu:'chat', titre:'Chat', points:[
            'Le Chat SOREAL est dans le jeu, avec un badge de messages non lus et la liste des personnes en ligne.',
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
            'Deuxième relecture complète des chiffres du jeu contre le wiki de NGU : écarts corrigés.',
            'Voix pré-enregistrées pour la narration (plus rapides et plus stables).',
            'Compteur « Généré » au-dessus de la barre d’énergie.',
            'Deux parties de comparaison pendant le développement (invisibles pour les joueurs).',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Inventaire allégé, messages Aventure et Inventaire fusionnés, popup d’objet au survol sur PC, niveau affiché sur l’image des objets.',
          ]},
          {menu:'augmentations', titre:'Augmentations', points:[
            'Augmentations : boutons « + / − / Max » et saisie libre, comme dans Basic Training.',
          ]},
          {menu:'shop', titre:'Boutique', points:[
            'Boutique EXP en onglets ; Boutique AP en mauve.',
          ]}
        ]
      },
      {
        version:'1.0',
        nom:'Fidélité au wiki',
        date:'2026-09-23',
        hommage:HOMMAGE_ANCIEN,
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Relecture systématique du jeu contre le wiki de NGU : entraînement, combats, butin, équipement et boosts recalés sur les vraies valeurs.',
            'De nombreux systèmes du jeu complétés d’après le wiki (nouveaux contenus, boutiques, réglages avancés).',
            'Sécurité renforcée sur l’ensemble du site.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Le mode Aventure ne se fige plus, et les PV ne clignotent plus.',
            'Aventure : image des créatures selon leur nom, zones et bestiaire vérifiés.',
          ]}
        ]
      }
    ]
  };
})();
