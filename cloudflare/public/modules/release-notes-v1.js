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
 * RÈGLE (Norman, 2026-10-21 : « n’oublie pas le patch note, je ne veux plus avoir à te le rappeler ; dès qu’on modifie, nouveau patch note du jour ») : DÈS QU’UN JOUR COMPORTE UNE MODIFICATION visible par les joueurs, ajouter (ou compléter) l’entrée du jour
 * et mettre `courante` à jour, SANS attendre qu’on le demande ; la veille est résumée à son état final. Texte destiné aux joueurs : AUCUN spoil (ne jamais nommer un
 * système encore verrouillé ni un total caché).
 */
(function(){
  'use strict';
  /* Ancien hommage (2026-10-07 à 2026-10-10) : il reste sous les versions déjà publiées ; depuis 2026-10-11 le texte est raccourci (champ `hommage` global ci-dessous, utilisé par la version 2.6 et les suivantes). Chaque version peut avoir son propre champ `hommage`. */
  var HOMMAGE_ANCIEN='🐾 En souvenir de Grizboule, mon chat adoré, qui m’a accompagné dans toutes mes galères, adorable de notre première rencontre jusqu’à son dernier jour. Repose-toi bien là-haut, petit compagnon : je t’aime et tu me manques.';
  window.__SOREAL_IDLE_RELEASE_NOTES_V1__={
    courante:'4.2',
    /* Hommage (Norman, 2026-10-08) : une ligne en bas de CHAQUE note de mise à jour, à conserver dans toutes les versions à venir. */
    hommage:'🐾 En hommage à Grizboule',
    versions:[
      {
        version:'4.2',
        nom:'Sans réseau',
        date:'2026-10-28',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Les chiffres sont partout plus lisibles : le 7 ne ressemble plus à un 1 (cadres du haut, compteurs, niveaux, prix, barres). Tous les nombres du jeu ont un 1 avec un drapeau et un 7 bien droit.',
            'Le jeu se rouvre et se joue maintenant sans internet : la page, le moteur et ta partie sont gardés sur l’appareil, et la partie est envoyée au serveur dès que la connexion revient. Ouvre le jeu au moins une fois avec internet pour que tout soit prêt.',
            'Les craquements des sons sont traités : tous les sons du jeu partagent désormais un seul flux audio, au lieu d’en ouvrir plusieurs qui se disputaient la carte son.',
            'La fenêtre « Nouveau menu débloqué ! » n’apparaît que la toute première fois. Après un Rebirth, un menu qui revient fait seulement clignoter son bouton avec les trois petits bips.',
            'Les boutons du menu se déplacent sans à-coups : pendant que tu glisses un bouton, la barre se fige au lieu de trembler, et le jeu ne recalcule plus la page à chaque mouvement du doigt.',
            'Pendant une étape du tutoriel où il faut cliquer sur un élément, plus rien d’autre ne réagit : même le bouton de lecture d’une chronique ne peut plus lancer sa voix et interrompre le guide.',
            'Toutes les parties sont maintenant sauvegardées chaque jour sur le serveur (une copie par jour, gardée 30 jours), en plus des copies de chaque joueur.',
            'Confidentialité : la liste des joueurs du serveur n’est plus envoyée à ton appareil avec le catalogue du jeu. Seules tes propres données y sont.'
          ]},
          {menu:'ngu', titre:'NGU', points:[
            'Dans chaque barre, le bouton « Max » ne dépasse plus de son cadre sur téléphone.'
          ]},
          {menu:'yggdrasil', titre:'Yggdrasil', points:[
            'Les portes s’ouvrent d’un seul mouvement, sans petits à-coups : une seule accélération du début à la fin.'
          ]},
          {menu:'shop', titre:'Boutique', points:[
            'Ce menu s’appelle maintenant « Boutique » : dans l’annonce de déblocage comme sur son bouton.'
          ]}
        ]
      },
      {
        version:'4.1',
        nom:'Chaque détail',
        date:'2026-10-27',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Le tout premier guide n’affiche plus rien à l’écran : ni fenêtre, ni texte, ni petite enceinte. Seule la voix te guide, et tu avances en cliquant sur les éléments entourés.',
            'Le chœur d’anges qui accompagne ta réapparition est un peu moins fort.',
            'Les sons du jeu ne saturent plus : tout ce qui sort passe maintenant par un limiteur qui calme seulement les dépassements (plusieurs sons en même temps, ambiances amplifiées). Le volume habituel ne change pas.',
            'Le bandeau « En direct » apparaît et disparaît maintenant en fondu, et les informations entrent toujours par la droite de l’écran puis le traversent en entier, sur PC comme sur téléphone (sur PC, la première pouvait démarrer au milieu).',
            'Les portes ne se referment plus en plein milieu de leur ouverture, et les fruits ne rétrécissent plus jamais en animation : une pousse plus petite apparaît d’un coup.',
            'Le boss suivant n’apparaît plus d’abord en entier puis noir avant de revenir : il n’est montré que par son animation d’apparition. Et Fight reste bloqué tant que le boss n’est pas apparu.',
            'Lancer un défi te fait maintenant arriver comme après un Rebirth : même bruit de voyage dans le temps, et tu retrouves la borne d’arcade.',
            'Quand un menu apparaît (la première fois, et de nouveau après chaque Rebirth), son bouton clignote trois fois avec trois petits bips doux. Si plusieurs menus se débloquent en même temps, tous clignotent ensemble mais le son ne joue qu’une fois. Quand plusieurs portes s’ouvrent d’un coup, il n’y a qu’un seul son de porte et un seul coq.',
            'Quand on lit toutes les chroniques de boss, ou qu’on les reprend à partir d’un boss, un tournement de page est joué entre chaque boss : les trois sons du fichier passent à tour de rôle (première page, deuxième, troisième, puis on recommence).',
            'Le bandeau du haut est plus fluide sur toutes les pages : la barre de vie glisse avec la carte graphique au lieu de redessiner toute sa largeur, et les braises de l’énergie comme le code de la 3e ressource aussi.',
            'Le NGU d’énergie (le jour) est deux fois plus fluide : les nuages glissent maintenant avec la carte graphique, au lieu de redessiner tout le ciel à chaque image.',
            'Ta fenêtre de tutoriel s’ouvre réduite en petite enceinte (la voix parle déjà) : un clic sur l’enceinte l’agrandit. Quand une étape demande de cliquer sur un élément (comme Fight), rien d’autre ne se clique, et l’élément lui-même reste bloqué tant que la voix n’a pas fini ; attendre ne lance jamais l’étape suivante : seul le clic sur l’élément le fait.',
            'Après la fermeture du texte du premier boss, la chronique ne se relit plus : la fenêtre disparaît tout de suite et la voix s’arrête.',
            'La partie ne commence réellement qu’à la fermeture du texte du premier boss : tu arrives sur la borne avec 250 d’énergie, qui regénère jusqu’à 500, que tu aies mis une minute ou un quart d’heure à passer le pseudo et l’introduction. Ton tutoriel de départ ne se lance qu’à ce moment-là, plus sur l’écran du pseudo.'
          ]},
          {menu:'yggdrasil', titre:'Yggdrasil', points:[
            'Dès qu’un fruit commence à pousser, une petite aura dépasse du tas de terre, au-dessus du sol seulement : dorée pour l’or, rougeâtre pour la puissance, et d’une autre couleur pour chaque fruit.',
            'Quand une porte d’un fruit s’ouvre ou se referme, son cadre reste en place jusqu’à la fin du fondu : on ne voit plus l’image sur les bords extérieurs de la porte.'
          ]},
          {menu:'diggers', titre:'Mineurs d’or', points:[
            'Ce menu est entièrement refait : chaque mineur est un ouvrier dessiné avec sa pelle, dans un cadre qui est tout son décor, et il a vraiment l’air de travailler (il se penche, creuse, soulève la terre et la balance sur le tas). Le nom, ce qu’il améliore et les boutons sont posés sur le dessin. Tu vois l’or par seconde consommé, les emplacements en casques à lampe et le bonus de chaque mineur.'
          ]},
          {menu:'chroniques', titre:'Chroniques', points:[
            'La Collection, avec les chroniques des boss, reste accessible après un Rebirth ou un défi : elle ne disparaît plus, tu retrouves tous les boss déjà rencontrés.',
            'Dans Chroniques, « Combat le plus long » disparaît des tableaux de rangs et un onglet « Défis » apparaît dès que tu as débloqué un défi : un sous-menu par défi, avec le meilleur temps de chaque joueur pour le terminer, du plus court au plus long. Tu ne vois que les défis que tu as déjà atteints.'
          ]}
        ]
      },
      {
        version:'4.0',
        nom:'Page après page',
        date:'2026-10-26',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Sur téléphone, frotter la flaque du Coffre ou de la valise pour la nettoyer ne change plus de page : le glissement ne fait plus passer à l’écran voisin pendant le nettoyage.',
            'Au lancement d’une nouvelle partie, la chronique du premier boss n’est plus lue toute seule : elle est déjà lue dans l’introduction. L’ancien tutoriel (Norman & Sébastien) est supprimé : seuls l’introduction et ton propre tutoriel restent.',
            'Quand une barre d’énergie ou de magie disparaît ou revient (tout dépensé, tout récupéré), la page où tu te trouves ne bouge plus : le contenu reste en place et la barre se déploie par-dessus, en douceur.',
            'Quand on fait un NUKE, un bruit de mitraillette, grave et sourd, dure tant que la fenêtre des boss enchaînés est à l’écran.',
            'À la première ouverture et à chaque nouvelle partie, un écran d’accueil demande aux joueurs connectés avec Google de choisir leur pseudo : il est obligatoire et unique, on peut le changer plus tard dans les Réglages mais pas le retirer. Le bouton « Entrer dans Soreal IDLE » lance ensuite l’introduction.',
            'Dans Réglages, l’onglet « Ma partie » propose maintenant trois parties pour tout le monde : A, B et C. Un clic sur l’une d’elles ouvre cette partie, indépendante des deux autres. La B et la C servent à essayer autre chose sans toucher à la A ; les autres joueurs ne les voient pas.',
            'Sur PC, le menu de gauche ne bouge plus quand on arrive tout en bas d’une page : il reste exactement à la même place qu’en haut.',
            'Dans l’éditeur de textes de l’administrateur, les boss s’affichent par pages de soixante, jusqu’au dernier, au lieu des soixante premiers seulement.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Quand on arrive sur la page Aventure, ou qu’on ouvre le Coffre après être venu d’un autre menu, la page ne fait plus de petit saut : les bandes ajoutées au sac apparaissent en même temps que le reste.',
            'Chaque zone a maintenant un décor peint derrière le cadre de combat, assombri pour que les barres et les cartes restent bien lisibles ; la Zone sûre garde son apparence.',
            'À l’ouverture du Coffre, le fond vert s’applique tout de suite au lieu de se faire attendre.',
            'Dans le Coffre, la langue sort quand on l’ouvre et rentre quand on le ferme, au lieu d’apparaître ou de disparaître en une image.',
            'Dans le Coffre, dès qu’une pièce d’un set est lootée, les emplacements des autres pièces de ce set et de sa zone apparaissent en cases blanches vides ; une case ne montre son image grisée et son nom qu’une fois son objet looté au moins une fois.',
            'Dans le Coffre, les titres des cadres se lisent en entier (plus de « Looty » coupé lettre par lettre) et n’ont plus qu’un seul emoji.',
            'Tous les objets qui se montent au niveau 100 ont maintenant leur case dans le Coffre.',
            'Fermer le Coffre ne fait plus descendre le cadre trop bas avant de le faire remonter d’un coup : sur PC, où la page est mise à l’échelle, il se raccourcit maintenant d’un seul geste.',
          ]},
          {menu:'titans', titre:'Titans', points:[
            'Dans le Coffre, un objet de titan qui est tout seul n’a plus son propre cadre : il rejoint les autres objets de titans.',
          ]},
          {menu:'yggdrasil', titre:'Yggdrasil', points:[
            'Sur téléphone, les portes des fruits remplissent mieux l’image : leur cadre est plus fin, elles ne paraissent plus trop petites.',
            'La terre sous un fruit prend une légère teinte du sol de son décor : elle se fond mieux dans l’image au lieu de paraître ajoutée.',
            'Un fruit sort de terre : la première heure, seule la terre grossit ; après une heure complète apparaît un tout petit fruit qui grossit en douceur jusqu’à 24 h, la terre grandissant de son côté. Avec un temps maximum de 5 h débloqué, il ne dépasse pas la croissance prévue pour 5 h. Après la 12e heure, une aura de la couleur du fruit apparaît, de plus en plus forte, et la 24e heure est beaucoup plus marquée.',
          ]},
          {menu:'ngu', titre:'NGU', points:[
            'Le ciel du NGU d’énergie (le jour) est plus foncé : le bleu est moins clair et fatigue moins les yeux.',
          ]},
          {menu:'augmentations', titre:'Augmentations', points:[
            'Le bonus total Attaque et Défense, en haut de la page, s’écrit comme la vie : avec des lettres (K, M, B…).',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Sur la borne d’arcade, les deux traits mauves de chaque côté des boutons disparaissent : les bandes bleue et rouge du bas montent tout le long du module des boutons et brillent comme celles de l’écran.',
            'Sur PC, la page du combat de boss a un nouveau fond : une salle d’arcade en perspective, derrière la borne.',
          ]},
          {menu:'machine', titre:'Machine temporelle', points:[
            'Machine temporelle : les roues au sommet des tours ne tournent plus quand rien n’y est alloué, tournent d’autant plus vite que la somme est grande (au maximum quand la barre est maxée) et ralentissent doucement quand elle baisse ; celles de la machine du centre continuent.',
          ]},
        ]
      },
      {
        version:'3.9',
        nom:'Le jour et la nuit',
        date:'2026-10-25',
        groupes:[
          {menu:'general', titre:'Général', points:[
            '« En direct » est beaucoup plus vivant : les progrès des autres joueurs y défilent, avec plusieurs phrases différentes ; chaque phrase n’apparaît que si tu possèdes déjà le menu concerné.',
            'Réglages refaits : quatre catégories (Mon jeu, Son et image, Ma partie, Infos) au lieu d’une longue liste ; les blocs de développement et d’administrateur ne sont plus dans ce menu.',
            'Pour tout effacer, il faut maintenant taper « TOUT EFFACER » pour confirmer, afin de ne pas le faire par erreur.',
            'Sur PC, plus d’espace vide au-dessus des cadres Attaque, Défense… : le menu de gauche est au même niveau et le bandeau reste toujours visible en haut ; sur téléphone, le menu du haut ne cache plus les cadres du haut.',
            'Les informations entre parenthèses des chroniques de boss (une nouveauté débloquée, par exemple) s’affichent maintenant en notification, comme les trophées, avec leur propre son, dès que tu atteins le boss concerné.',
            'Toutes les notifications restent un peu plus longtemps à l’écran.',
            'Sur PC, la fiche d’un objet s’ouvre au-dessus de l’objet sur lequel tu as cliqué.',
            'Le son de défaite joué à l’envers part maintenant en même temps que le rembobinage de l’image (il était prêt trop tard) ; le chœur d’anges est un peu plus court.',
            'Équiper ou retirer une pièce qui donne du cap d’énergie ou de magie : quand l’énergie (ou la magie) que tu as placée l’empêche, un bandeau rouge te dit combien libérer. Avant, le refus ne s’affichait pas.',
            'Les très grands nombres n’utilisent plus l’écriture « e+96 » : après Tg, le jeu continue avec des lettres (AA = 1 suivi de 96 zéros, puis AB, AC… jusqu’à CS), chacune avec sa couleur. On peut aussi les saisir ainsi (par exemple « 2AA »).',
            'Comparaison de deux objets : la valeur la plus basse redevient rouge (et la plus haute verte) même quand les deux objets sont au maximum de leur niveau ; elles restaient vertes toutes les deux.',
            'Multiplicateur de drop : quand un bonus l’augmente, le total s’affiche en vert (par exemple ×1,73) à la place de « ×1 (×1,73 avec les bonus) ».',
            'Menu : les boutons non sélectionnés n’ont plus de contour d’une autre couleur ; ils prennent le dégradé foncé de la Boutique, et deviennent plus clairs dans le menu ouvert.',
            'Sur PC, la barre latérale des menus monte maintenant jusqu’en haut de la page, à côté de la barre de vie, même quand on remonte le menu ouvert.',
            'Quand tu meurs et que ton image réapparaît en fondu d’ouverture, un chœur d’anges (« aaaaah ») accompagne le fondu.',
            'L’Attaque, la Défense, la vie maximale et la régénération de vie ne reculent plus par à-coups quand tes niveaux montent vite : l’affichage tient sa valeur jusqu’à ce que le jeu la rattrape.',
          ]},
          {menu:'yggdrasil', titre:'Yggdrasil', points:[
            'Les fruits ont 24 images de pousse (une par heure du palier maximum de 24 h) sur un décor peint en rapport avec leur bonus ; l’or et les fruits de Puissance en font aussi partie.',
            'Les compteurs de graines et de Poop sont maintenant tout en haut de la page.',
          ]},
          {menu:'ngu', titre:'NGU', points:[
            'Dans « En direct », on voit maintenant les autres joueurs lancer leurs premiers NGU puis faire grandir le meilleur.',
            'NGU : côté Énergie, c’est le jour (ciel qui s’assombrit en descendant, nuages, arc-en-ciel, soleil) ; côté Magie, la nuit avec une lune d’Halloween, des aurores boréales et des chauves-souris. Sans énergie (ou sans magie) placée, le soleil (la lune) ne brille pas.',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'La carte de la chronique ne s’ouvre plus toute seule à la première rencontre d’un boss : la voix lit toujours l’histoire.',
          ]},
          {menu:'wandoos', titre:'Wandoos', points:[
            'Dans « En direct », on voit maintenant les autres joueurs changer de système d’exploitation ou le faire monter de niveaux.',
            'Synchro : l’énergie et la magie sont placées en un seul coup, donc leurs barres partent exactement ensemble ; plus de petit mouvement de recul quand tu ajoutes une grosse quantité.',
          ]},
          {menu:'chroniques', titre:'Chroniques', points:[
            'Chroniques a un nouvel onglet « Cinématiques » : tout le monde peut y revoir l’intro (la première image sert d’aperçu), et « En direct » dit quand un joueur la regarde. Les prochaines scènes s’y ajouteront.',
            'Nouveau look pour Chroniques : tout en bleus de nuit, des onglets en verre qui s’allument dans la couleur de leur sous-menu, des puces et des cadres assortis (plus de jaune).',
          ]},
          {menu:'sang', titre:'Magie du sang', points:[
            'Rituels : le « Sang collecté » et le sang dans le récipient ne comptent plus de rituel terminé tant que le moteur n’en a validé aucun (par exemple quand il te manque de l’Or) ; avant, 2 rituels fantômes s’affichaient.',
            'Magie du sang : le compteur de sang disponible, en haut de la page, se met à jour en direct pendant que tu y es (il avançait seulement au rechargement de la page).',
          ]},
          {menu:'machine', titre:'Machine temporelle', points:[
            'Dans « En direct », on voit maintenant les autres joueurs pousser la vitesse ou l’or de leur Machine temporelle.',
          ]},
          {menu:'diggers', titre:'Mineurs d’or', points:[
            'Dans « En direct », on voit maintenant les autres joueurs mettre de nouveaux mineurs au travail et les améliorer.',
          ]},
          {menu:'tower', titre:'ITOPOD', points:[
            'Dans « En direct », on voit maintenant à quel étage de la tour sont les autres joueurs, tous les dix étages.',
          ]},
          {menu:'avance', titre:'Entraînement avancé', points:[
            'Dans « En direct », on voit maintenant les autres joueurs monter leur Entraînement avancé.',
          ]},
        ]
      },
      {
        version:'3.8',
        nom:'Tout en anglais',
        date:'2026-10-24',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Mode anglais : plus de 500 textes qui restaient en français sont maintenant traduits (introduction en images, tutoriel, journal des attaques, messages du flux, bulles d’aide, noms des sons…).',
            'Moins de ralentissements sur téléphone dans la page Aventure : plusieurs calculs inutiles ont disparu et les décors animés sont plus légers.',
            'La bannière « SOREAL IDLE » en haut de la page et son raccourci vers les notes de mise à jour sont retirés (les notes restent dans les Réglages).',
            'Réglages › Effets visuels : deux nouveaux réglages, « Animations du menu du haut » et « Décors animés des cadres », à décocher pour alléger un téléphone lent (cochés par défaut : rien ne change).',
          ]},
          {menu:'augmentations', titre:'Augmentations', points:[
            'Une longue absence compte maintenant toutes les barres : avant, chaque barre était plafonnée à 10 000 niveaux à ton retour, alors que le jeu en ligne en gagne bien plus.',
          ]},
          {menu:'renaissance', titre:'Renaissance', points:[
            'Le bandeau du haut (Attaque, Défense, Or…) gagne une case « Temps » : la durée du Rebirth en cours, mise à jour chaque seconde.',
          ]},
          {menu:'entrainement', titre:'Basic Training', points:[
            'Basic Training : à la première ouverture après une Renaissance, les deux dernières lignes de chaque groupe (Charge, Bonus ultime…) s’allument maintenant en néon comme les autres, au lieu de rester éteintes.',
          ]},
          {menu:'machine', titre:'Machine temporelle', points:[
            'Les textes de la page sont maintenant aussi en anglais (titre, « meilleur butin d’or », « tiques/s », attente d’Or…).',
          ]},
        ]
      },
      {
        version:'3.7',
        nom:'Un tour d’écran',
        date:'2026-10-23',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Dans l’introduction en images, tape sur l’image pour passer à la suivante si tu lis plus vite que la voix.',
            'Si le navigateur bloque le son au lancement de l’introduction, l’écran te demande de le toucher une fois : la voix démarre alors en même temps que les images.',
            'Dans l’introduction en images, chaque image reste le temps de la phrase écrite en dessous, au rythme de la voix.',
            'Dans un guide, une étape qui attend un clic sur un bouton n’apparaît que 2 secondes après le clic, le temps de voir le jeu réagir.',
            'À la fin de l’introduction en images, la chronique du premier boss s’enchaîne : l’image du boss sur fond noir avec son texte en dessous. Le tutoriel ne démarre qu’une fois cette fenêtre fermée.',
            'Le boss suivant ne laisse plus un écran noir à la place de son image : l’écran sombre qui le cache disparaît toujours (même avec les animations réduites ou une image lente à charger).',
            'Les spectateurs qui rigolent à la Fuite restent maintenant à l’intérieur de l’écran de la borne, aux coins arrondis, au lieu de dépasser sur les bords.',
            'Quand tu perds un combat, ton image peut maintenant réapparaître de trois façons, tirées au hasard : en fondu d’ouverture ; en pixels qui se reconstituent avec un effet de rembobinage de cassette VHS (lignes qui tremblent, neige, « ◀◀ RW ») et le son de défaite joué à l’envers ; ou en clignotant trois fois, avec trois petits sons identiques calés sur chaque clignotement.',
            'La voix du guide d’introduction et de ses étapes lit désormais le même texte que celui préparé dans l’éditeur.',
            'Dans la fenêtre d’un guide, la voix lit maintenant le texte enregistré dans l’éditeur et ne retombe plus sur la voix de secours.',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Le boss « Sundae » garde son nom d’origine partout (c’est un jeu de mots avec « Sunday »).',
          ]},
          {menu:'sang', titre:'Magie du sang', points:[
            'Rituels : faute d’Or, la barre attend pleine au lieu d’empiler du retard ; placer de la Magie ne valide plus, d’un coup, tous les rituels qui s’étaient accumulés.',
            'Rituel de la sangsue : plus aucun jet de sang parasite quand on change la cadence (par exemple en plaçant toute la Magie) ; à cadence très rapide, la sangsue passe en écoulement continu, sans jets ni recalages qui sautent.',
          ]},
          {menu:'machine', titre:'Machine temporelle', points:[
            'Machine à remonter le temps : le nom de l’ennemi est écrit au-dessus, sur toute la largeur de l’écran ; dessous, seulement « Meilleur butin d’or » et l’Or. Les cases « Cible » et « Allouée » ne changent plus de taille quand on ajoute de l’énergie.',
          ]},
          {menu:'wandoos', titre:'Wandoos', points:[
            'La boutique EXP a un nouvel achat dans le rayon Toc (75 EXP), visible quand le menu concerné est découvert. Il ajoute au clavier de l’ordinateur un petit interrupteur de métal (« Sync », au-dessus d’Énergie) : on le monte pour l’allumer, la loupiote devient verte (rouge quand il est éteint). Allumé, les touches 0, −, + et CAP agissent en même temps sur l’énergie et la magie ; s’il manque de la magie, on place le maximum disponible.',
          ]},
        ]
      },
      {
        version:'3.6',
        nom:'La borne en met plein la vue',
        date:'2026-10-22',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Sur téléphone, les petits textes (11 px et moins) passent à 12 px au minimum dans la plupart des menus, et un bouton désactivé, trop pâle, se lit mieux.',
            'Sur ordinateur, les petits textes sont plus grands (13 à 14 px) dans tous les menus, et la page Réglages range ses cartes sur deux colonnes : elle est un quart moins haute.',
            'Au début d’une nouvelle partie, seule l’introduction en images se joue, puis le nouveau tutoriel : l’ancien tutoriel de base n’est plus lancé. Sa fenêtre s’ouvre une fois la chronique du boss lue.',
            'L’introduction « Le commencement » est racontée en seize images qui défilent avec leur phrase en blanc dessous ; la dernière s’arrête sur le gros bouton blanc et c’est toi qui cliques sur l’image pour continuer.',
            'Au premier lancement d’une partie (ou après une remise à zéro complète), l’introduction se lance tout de suite, avant la chronique du boss et sans attendre le menu Basic Training.',
            'Dans le chat, un bouton émoji (sur PC) ouvre une grille d’émojis à glisser dans ton message.',
            'Un menu qui se débloque ne se glisse plus tout en bas de la liste (après Réglages) quand tu as déjà réorganisé les boutons ; et sur PC, la liste défile d’elle-même quand tu glisses un bouton près du bord, pour atteindre le bas.',
            'Sur PC, le pointeur ne clignote plus entre flèche et main quand on le place au bord d’un bouton du menu de gauche (le bouton ne se soulève plus au survol).',
            'Les nombres qui montent (vie, énergie, magie, monnaies…) ne font plus de petits retours en arrière : un nombre ne recule que pour un vrai retrait (achat, dégâts, renaissance).',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'La fiche d’un objet est refaite façon jeu de rôle : le nom à la couleur de sa rareté, le niveau en jaune, l’emplacement et l’ensemble, les statistiques (orange, bleu, jaune selon le boost qui les remplit) et, en vert en bas, le bonus de son ensemble une fois toutes ses pièces au maximum.',
          ]},
          {menu:'sang', titre:'Magie du sang', points:[
            'Quand il manque de l’Or pour un rituel, le message « Il manque X Or » reste affiché et la sangsue s’arrête et attend, au lieu de continuer son animation comme si le rituel se faisait.',
          ]},
          {menu:'entrainement', titre:'Entraînement de base', points:[
            'Le premier point placé dans n’importe quelle barre refait le son du néon qui s’allume (l’ancien son d’Attaque passive).',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Quand tu perds un combat, l’image de ton personnage éclate en gros pixels comme celle d’un boss qui meurt, puis réapparaît à sa place en fondu pendant 3 secondes.',
            'Quand un éclair tombe, l’écran de la borne d’arcade est frappé lui aussi : interférences, image qui se déchire, puis tout reprend normalement.',
            'Le bouton NUKE de la borne se referme sous un blindage d’acier quand il n’est pas disponible : deux battants et deux verrous, qui s’ouvrent (et se referment) avec leur bruit de mécanisme.',
            'Chaque boss apparaît avec son propre effet (dix effets différents, joués dans l’ordre des boss) et son propre son ; l’image du boss suivant reste cachée jusqu’à la fin de l’écran de victoire, puis apparaît toujours avec son effet.',
            'Quand tu tues un boss après un combat d’au moins 5 secondes, l’image de CE boss éclate en gros pixels sur la borne d’arcade, avec un énorme « K.O. » puis « BOSS VAINCU » et un petit air de victoire. Rien pendant un NUKE.',
            'Quand tu prends la fuite en plein combat, trois spectateurs jaillissent du bas de tout l’écran de la borne, te montrent du doigt en riant (« HAHA ») puis repartent vers le bas, juste le temps du rire.',
          ]},
          {menu:'tower', titre:'ITOPOD', points:[
            'Un clic sur ce menu ramène toujours à l’écran de combat de la tour : la boutique des Atouts ne reste plus affichée.',
          ]},
          {menu:'chroniques', titre:'Chroniques', points:[
            'Le bouton « Lire toute l’histoire des boss débloqués » affiche maintenant le petit lecteur (pause, stop, déplaçable), comme quand on reprend depuis un boss.',
            'Quand tu écoutes plusieurs chroniques de boss d’affilée, le nom de chaque boss n’est plus prononcé : les histoires s’enchaînent comme un seul récit.',
          ]},
          {menu:'yggdrasil', titre:'Yggdrasil', points:[
            'Les fruits qui demandent de la Magic ont une teinte bleu-vert ; un fruit qui pousse a une lueur qui s’échappe de son cadre, et elle brille beaucoup plus quand il a fini de pousser.',
            'Sur chaque fruit prêt, la carte indique les graines que donne « Récolter » et les graines et bonus que donne « Manger » (avec la Poop si elle est cochée).',
          ]},
          {menu:'wandoos', titre:'Wandoos', points:[
            'Au démarrage de l’ordinateur, un BIOS apparaît une demi-seconde avant l’écran d’accueil.',
            'Quand un éclair tombe pendant que tu es sur cet écran, l’image du moniteur est frappée : interférences, image qui se déchire, puis tout reprend normalement.',
            'La touche COULEUR de l’écran propose maintenant vingt couleurs.',
            'L’information « Libre » est retirée de l’écran (elle est déjà dans la barre du haut), et pendant le chargement de l’OS tout tient sur un seul écran, sans défilement.',
            'Quand un niveau demande moins d’une seconde, le texte sous la barre indique la vitesse en niveaux par seconde (N/s), jusqu’au maximum de 50 niveaux par seconde.',
            'Les touches du clavier de cet écran refont leur bruit de clic.',
          ]}
        ]
      },
      {
        version:'3.5',
        nom:'Un démarrage à toute épreuve',
        date:'2026-10-21',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Plus de petit saut de page en arrivant sur un menu : la page ne bouge plus pendant son affichage.',
            'Quand tu reviens dans le jeu en Zone sûre après un K.O. pendant ton absence ou une défaite, le journal d’Aventure explique maintenant pourquoi.',
            'Le son d’ouverture des portes n’a plus sa petite mélodie finale, et un coq chante juste après, une seule fois par renaissance, à la première ouverture d’une porte.',
            'Les boutons « Tout retirer » ne prennent plus toute la largeur, sur PC comme sur téléphone : ils sont sur la même ligne que 1/2 et 1/4, dans toutes les pages (la zone des boutons est plus courte).',
            'Un combat de boss mené pendant que la page était fermée ou en arrière-plan plus de 30 secondes n’entre plus dans les records de durée (seule la durée d’un combat suivi compte).',
            'Les cadres « Ton prix » du Money Pit et de la roue journalière changent de couleur à chaque récompense (celle de la roue suit son nombre de tours, plus rien ne peut la remettre en rouge).',
            'Changer de page dans l’inventaire ne fait plus bouger la page : seul le contenu du cadre Sac change, le cadre garde la même hauteur.',
            'Si le moteur du jeu met trop de temps à démarrer (application de bureau, appareil lent), le jeu continue en mode serveur au lieu de rester sur « Connexion à SOREAL IDLE ».',
          ]},
          {menu:'challenges', titre:'Défis', points:[
            'Pendant le défi No Rebirth, le bouton RENAISSANCE est grisé : les renaissances y sont interdites.',
          ]},
          {menu:'entrainement', titre:'Entraînement de base', points:[
            'Après une renaissance, le menu Entraînement de base est éteint ; la première fois que tu l’ouvres, il s’allume comme des tubes néon : chaque bloc clignote avant de tenir, avec des sons de starter, des « pop » et un ronronnement. Chaque barre qui a de l’énergie garde son propre son de démarrage, joué quand sa ligne s’allume. Ensuite, plus d’animation ni de son jusqu’à la prochaine renaissance.',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Un NUKE fait exploser l’image du boss dans la borne d’arcade : éclair, boule de feu, ondes de choc, étincelles, et l’image tremble.',
            'Après une renaissance, le bouton NUKE est cliquable tout de suite, sans changer de menu et revenir.',
            'Chaque boss a sa propre couleur de barre de vie (toujours la même pour un même boss, bien différente de celle du boss voisin).',
          ]},
          {menu:'ngu', titre:'NGU', points:[
            'Les boutons Max, 1/2, 1/4, + et − sont bien lisibles (fond plein, texte net), et le bouton « Vers les NGU de magie / d’énergie » est illuminé et étoilé, comme les cadres du chat.',
          ]},
          {menu:'shop', titre:'Boutique', points:[
            'Les achats « Double tap : boosts » et « Double tap : fusion » sont rangés dans l’onglet Débuts de la boutique d’EXP, juste après le filtre de butin.',
          ]},
          {menu:'sang', titre:'Magie du sang', points:[
            'La sangsue est stable : sa boule repart tout de suite de là où elle s’était arrêtée quand on replace de la Magie, son pied reste posé sur la table après un redessin, le personnage glisse toujours depuis la gauche, et une image qui ne charge pas est redemandée toute seule.',
          ]},
          {menu:'machine', titre:'Machine temporelle', points:[
            'De l’air monte du bas des jauges : plein de minibulles très fines et rapides au pied du tube, et quelques bulles qui montent en grossissant.',
            'Cible et ressource allouée sont de petits écrans, comme Niveau et Temps restant.',
            'L’Énergie est en vert comme sa barre, et la seconde tour reprend la couleur de sa propre barre.',
          ]}
        ]
      },
      {
        version:'3.4',
        nom:'Comparer pour mieux choisir',
        date:'2026-10-20',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Dans les Réglages, tu peux enregistrer ta partie dans un fichier sur ton appareil (« Exporter ma partie ») puis la recharger (« Charger une partie ») : elle reprend exactement là où tu l’as sauvegardée, sans aucun temps écoulé entre-temps.',
            'Le jeu répond plus vite : tes clics passent avant les mises à jour automatiques, et le calcul de chaque mise à jour est plus léger.',
            'L’ambiance sonore ne démarre qu’après le chargement du jeu, pour ne plus ralentir la première ouverture.',
            'Tes réglages sont appliqués avant le démarrage du jeu : plus de double chargement à l’ouverture.',
            'Aucun texte du jeu n’est plus petit que 11 px.',
            'Les boutons des menus (Max, 1/2, 1/4, Tout retirer, + et −) sont un peu plus petits (44 px) : ni trop gros, ni trop petits.',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Le gros bouton Fight clignote lentement tant qu’il attend d’être pressé ; Nuke est jaune et noir, bien lisible, et Fuite est bleue.',
            'Le bouton de combat reste grisé tant que le boss n’est pas affiché.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Quand tu compares deux objets, les statistiques qu’ils ont en commun sont colorées : la plus haute en vert, la plus faible en rouge ; deux valeurs égales et les statistiques propres à un seul objet restent blanches.',
            'Quand tu nettoies le caca de ton coffre, les autres joueurs qui connaissent l’Aventure le voient passer dans « En direct », avec une phrase d’humour différente à chaque fois.',
            'De temps en temps, quand tu le regardes, le coffre te lance une remarque bien sentie.',
          ]},
          {menu:'augmentations', titre:'Augmentations', points:[
            'Quand le calcul est en attente, la barre reste pleine au lieu de repartir de zéro.',
          ]},
          {menu:'sang', titre:'Magie du sang', points:[
            'Premier affichage du rituel de la sangsue : le canal, la boule et le jet attendent que les images soient chargées, plus de fond d’armoire visible à travers la sangsue.',
            'Les scènes de rituel gardent leur table et le fond de l’armoire même quand une autre scène apparaît ou disparaît (renaissance, nouveau rituel) : plus de table transparente.',
          ]},
          {menu:'ngu', titre:'NGU', points:[
            'La phrase de la page NGU devient « EH, C’EST LE NOM DU JEU ORIGINAL ! ».',
          ]},
          {menu:'machine', titre:'Machine temporelle', points:[
            'La Machine temporelle devient une grosse machine animée : l’Énergie se place sur la tour de gauche, un écran montre le temps restant et le niveau, et les engrenages tournent de plus en plus vite jusqu’à 50 tiques par seconde.',
            'L’écran de la machine montre le mob qui t’a rapporté le plus gros butin d’Or (celui sur lequel elle se base) ; l’image change quand un meilleur butin tombe.',
            'Un second écran, comme celui de la vitesse, affiche le multiplicateur d’Or de la machine.',
          ]},
          {menu:'wandoos', titre:'Wandoos', points:[
            'Le bouton CAP place seulement l’énergie nécessaire pour atteindre le plafond de la barre ; le reste reste disponible. Le niveau et la barre avancent en direct.',
          ]}
        ]
      },
      {
        version:'3.3',
        nom:'Tout se passe chez toi',
        date:'2026-10-19',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'L’heure du jeu suit celle du serveur : changer l’heure de ton appareil ne fait plus gagner de temps ni rejouer une récompense du jour.',
            'Les décimales de tes PV ne reculent plus un court instant quand une mise à jour arrive hors combat.',
            'Le jeu se met à jour jusqu’à 60 fois par seconde quand ton appareil le permet (15 avant) : barres, vie et compteurs sont plus fluides.',
            'Le jeu est maintenant calculé directement sur ton appareil, pour tout le monde : tout réagit tout de suite, rien ne recule en attendant le serveur, les menus qui évoluent en direct se rafraîchissent environ 10 fois plus souvent, et ta partie est enregistrée sur l’appareil puis envoyée au serveur. Si ton navigateur ne peut pas le faire, le jeu fonctionne comme avant.',
            'Dans les Réglages, un bouton « Envoyer ma partie vers le serveur » permet de changer d’appareil sans rien perdre ; une partie ouverte sur un autre appareil affiche « Partie reprise sur un autre appareil ».',
            'Le serveur garde des copies de sécurité de ta partie (une par jour, plus celles des dernières heures) pour la restaurer en cas de problème.',
          ]},
          {menu:'entrainement', titre:'Entraînement de base', points:[
            'Le plafond d’entraînement instantané place bien 6 points dans Attaque passive à chaque renaissance, et 6 de plus dans Blocage avec la synchro de l’entraînement.',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Le lancement d’un combat est plus léger : une mesure de la page, refaite à chaque image au départ, a été allégée.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'La carte de stats montre ton multiplicateur de drop (×1 de base) et, entre parenthèses, le total avec l’équipement et les autres bonus : il multiplie la chance propre de chaque objet, il ne veut pas dire qu’on loote à chaque fois.',
            'Il n’y a plus de limite de 70 % : l’Aventure hors ligne peut remplir tout le sac.',
            'Changer de page du sac ne redessine plus toute la page.',
            'Quand le coffre mange un objet, il ouvre grand la gueule, croque, puis se lèche les babines avec sa langue ; l’animation se joue aussi quand on dépose l’objet au doigt ou à la souris.',
          ]},
          {menu:'renaissance', titre:'Renaissance', points:[
            'Quand renaître est en positif, de petites étoiles à quatre branches scintillent partout sur le cadre du bouton du menu, chacune à son rythme ; les points jaunes qui remontaient sont partis.',
          ]},
          {menu:'machine', titre:'Machine temporelle', points:[
            'Les barres sont dessinées à chaque image : elles avancent sans saccade.',
            'Après une renaissance, la machine ne produit plus d’or tant qu’aucun ennemi n’a été tué.',
          ]},
          {menu:'sang', titre:'Magie du sang', points:[
            'Le sort Or contrefait est réparé et traduit, comme Spaghetti au sang et Pilule de fer : le bouton Lancer reste inactif sous le sang minimum et le rituel ne démarre qu’une fois accepté par le serveur.',
          ]},
          {menu:'wandoos', titre:'Wandoos', points:[
            'La touche MAX du clavier devient CAP et place jusqu’au plafond du poste.',
            'Clics très rapides sur + et sur les chiffres : tous sont validés, et le chiffre ne recule plus.',
          ]}
        ]
      },
      {
        version:'3.2',
        nom:'Des portes qui se referment',
        date:'2026-10-17',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Quand le serveur tue le boss un instant avant ton dernier coup, tu vois le coup final et la victoire ; deux réponses du serveur arrivées dans le désordre ne font plus reculer le boss ni l’avancement.',
            'Un journal de fluidité détaillé (combat, vie des combattants, appareil, réseau) et un bouton 🐞 réservé à l’administrateur aident à traquer les défauts à l’écran.',
            'Les chroniques de boss ont partout la même voix et le même texte ; un record personnel battu ou une place gagnée s’annonce par un petit message avec un son à part.',
          ]},
          {menu:'renaissance', titre:'Renaissance', points:[
            'Le bouton Renaissance prend la couleur de son menu, dans le menu comme dans la page.',
          ]},
          {menu:'challenges', titre:'Défis', points:[
            'Défi sans équipement : l’équipement porté ne compte plus nulle part (combats, Aventure…), les pièces équipées sont grisées et ce qu’elles donneraient est barré dans le petit tableau sous l’image. Tu peux toujours mettre et enlever des pièces.',
          ]},
          {menu:'moneyPit', titre:'Money Pit & Roue journalière', points:[
            'Comme pour le Money Pit, un bandeau donne le total de ce que la roue journalière t’a apporté depuis le début : toute l’AP cumulée, les graines et les objets obtenus.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Dans le petit tableau sous l’image, ce qui vient du Money Pit et des autres systèmes est compté dans ta valeur de base (572 au lieu de 15 (+557)) ; seuls l’équipement et le Cube restent entre parenthèses.',
            'La page Aventure ne montre plus un instant le bas de la page (l’inventaire) avant son haut en y arrivant sur ordinateur.',
          ]},
          {menu:'yggdrasil', titre:'Yggdrasil', points:[
            'Quand un fruit est mangé ou récolté sans l’auto, sa porte se referme : animation d’ouverture à l’envers, avec son propre bruit de fermeture.',
          ]},
          {menu:'sang', titre:'Magie du sang', points:[
            'Le compteur de rituels terminés suit le vrai total sans bloquer : plus besoin de rafraîchir la page pour voir le bon chiffre.',
          ]}
        ]
      },
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
            'Plus de grand vide entre l’image avec les boutons et le tableau des récompenses, et les deux cartes sont resserrées sans espace vide : l’image suit la hauteur des cartes, sur PC comme sur téléphone.',
            'Chaque carte a son « Ton prix » sous son bouton, avec son propre dernier gain ; la couleur change à chaque nouveau gain pour le repérer d’un coup d’œil.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Le Coffre a maintenant six pattes : deux de plus au milieu.',
            'Les cadres de zone du Coffre ne sont plus plus larges que leurs objets : un titre long passe à la ligne au lieu de les élargir.',
          ]},
          {menu:'yggdrasil', titre:'Yggdrasil', points:[
            'Un fruit sans énergie reste derrière une porte fermée, sans aucune animation ; au moment de placer l’énergie, la porte s’ouvre avec son bruit (pierre ou bois, au choix dans le banc d’essai). Après une renaissance, les portes sont de nouveau fermées et s’ouvrent à ta première visite, même si l’auto a déjà fait avancer le fruit.',
            'Chaque fruit a sa porte, aux emblèmes différents, et un cadre de même taille que son image.',
            'Un fruit au niveau maximum joue ses 20 images à bonne vitesse en arrivant sur la page ; le choix Manger / Récolter de chaque fruit est mémorisé.',
            'Titre en branche vivante, et les 20 images de croissance existent aussi pour le fruit de puissance.',
          ]},
          {menu:'titans', titre:'Titans', points:[
            'Les Titans sont des cartes à collectionner : l’image du Titan (ou un « ? » tant que tu ne l’as pas affronté), son nom, ses victoires et son état ; un clic déplie le bouton Affronter, la difficulté, l’Auto-kill, les statistiques, la comparaison avec tes stats et les capacités.',
          ]},
          {menu:'wandoos', titre:'Wandoos', points:[
            'Le « 69 % » ne bouge plus : le « lol » apparaît simplement à sa droite.',
          ]},
          {menu:'sang', titre:'Magie du sang', points:[
            'Dans « En direct », quand un joueur place de la magie dans un rituel, une phrase le raconte : « s’entaille le bras avec du papier », « avale un bol de barbelés »… (le rituel n’est nommé que si tu l’as déjà débloqué).',
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
          ]},
          {menu:'machine', titre:'Machine temporelle', points:[
            'Les deux barres qu’on alimente sont plus grosses et plus soignées : tuyau de laiton à graduations, or avec des rouages qui défilent.',
          ]},
          {menu:'tower', titre:'ITOPOD', points:[
            'Changer les étages avec les boutons recommence toujours au premier ennemi de l’étage choisi.',
            'Un clic sur ce menu te ramène toujours à l’écran de combat de la tour : la boutique ne reste plus ouverte en mémoire.',
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
