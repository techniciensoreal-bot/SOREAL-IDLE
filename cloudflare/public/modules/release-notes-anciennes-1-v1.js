/*
 * Notes de mise à jour de SOREAL IDLE — versions ANCIENNES, partie 1/2 (4.9 à 4.2), découpées de release-notes-v1.js le 2026-11-10 (accord de Norman : le fichier
 * principal grossissait d'une entrée par jour et dépassait son plafond de taille). Même format que release-notes-v1.js (voir son en-tête), la plus récente en tête.
 * Chargé AVANT release-notes-v1.js (la partie 1 d'abord, puis la partie 2) : chaque fichier AJOUTE ses versions à la suite de la liste `window.__SOREAL_IDLE_RELEASE_NOTES_ANCIENNES_V1__`.
 * Quand release-notes-v1.js dépasse de nouveau son plafond, déplacer ses plus vieilles versions en tête de la partie 1 (ordre décroissant conservé) ; si la partie 1 dépasse 150 Ko, créer une partie de plus.
 */
(function(){
  'use strict';
  window.__SOREAL_IDLE_RELEASE_NOTES_ANCIENNES_V1__=(window.__SOREAL_IDLE_RELEASE_NOTES_ANCIENNES_V1__||[]).concat([
      {
        version:'4.9',
        nom:'Compteurs et fumée',
        date:'2026-11-04',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Toutes les fenêtres de confirmation et de saisie sont maintenant au format du site : plus aucune fenêtre grise du navigateur.',
            'Plus aucune fenêtre ne s’ouvre à la première visite d’un menu, et la fenêtre « ce que tu as généré hors ligne » à la reconnexion a disparu.',
            'Les boutons de menu réagissent plus vite : la page change juste après l’image du clic, ce qui améliore la réactivité de l’interface.',
            'L’application Android ne recharge plus ta partie en boucle au démarrage.',
          ]},
          {menu:'renaissance', titre:'Renaissance', points:[
            'Le logo de gauche du bouton du menu tourne maintenant dans l’autre sens.',
          ]},
          {menu:'entrainement', titre:'Entraînement de base', points:[
            'Un compteur de niveaux par seconde (niv/s, format 0,01) accompagne le temps de chaque barre.',
          ]},
          {menu:'augmentations', titre:'Augmentations', points:[
            'Le « × » et son petit cadre entre une augmentation et son amélioration sont supprimés.',
            'Les barres LED sont, elles aussi, dessinées sur des pixels entiers : points réguliers à tous les zooms.',
            'Le message du coût manquant se lit maintenant « Il manque 314K d’or pour le niveau suivant. ».',
            'Les barres d’avancement sont des panneaux LED à points, comme l’écran de la borne d’arcade.',
            'Un compteur de niveaux par seconde (niv/s, format 0,01) accompagne le temps de chaque barre.',
          ]},
          {menu:'avance', titre:'Entraînement avancé', points:[
            'Un compteur de niveaux par seconde (niv/s, format 0,01) accompagne le temps de chaque barre.',
          ]},
          {menu:'machine', titre:'Machine temporelle', points:[
            'La barre de la Machine temporelle tourne à la vraie cadence (49 niveaux par seconde = 49 tours par seconde) et ne reste pleine et fixe qu’au cap de 50.',
            'Un compteur de niveaux par seconde (niv/s, format 0,01) accompagne le temps de la barre.',
          ]},
          {menu:'sang', titre:'Magie du sang', points:[
            'Un compteur de niveaux par seconde (niv/s, format 0,01) accompagne le temps avant le prochain rituel.',
          ]},
          {menu:'wandoos', titre:'Wandoos', points:[
            'La barre de chargement de l’OS et ses rayures ne sautent plus quand les barres de niveau avancent.',
            'La barre tourne maintenant à la vraie vitesse : à 13 niv/s elle fait 13 tours par seconde (jusqu’au cap de 50), au lieu de 3 au plus.',
            'La barre ne recule plus par à-coups à chaque synchronisation : elle tourne à un rythme continu.',
            'Au-dessus d’un niveau par seconde, la vitesse s’écrit en niveaux entiers (10 niv/s, plus 10,95).',
            'La barre ne reste fixe et pleine qu’une fois le CAP atteint ; en dessous, elle continue de tourner.',
            'Quand les niveaux vont vite, le texte sous la barre dit « VITESSE : … niv/s » au lieu de « RESTE ».',
            'Un compteur de niveaux par seconde (niv/s, format 0,01) accompagne le temps de chaque barre.',
          ]},
          {menu:'ngu', titre:'NGU', points:[
            'NGU Nuit : plus de barre pleine dans les tubes ; des grappes d’étoiles avancent comme les nuages de l’énergie, et au cap un tube de paillettes (trois plans d’étoiles, les plus lointains plus lents) défile très vite.',
            'NGU : chaque tuyau est entouré d’un cadre discret qui regroupe sa barre, ses boutons et ses informations.',
            'NGU Magie : quand tu places de la magie, le message dit « Place de la magie pour avancer » (et non plus l’énergie), et les étoiles avancent au rythme du remplissage du niveau.',
            'NGU Énergie : un seul nuage vaporeux, toujours visible, montre l’avancée du niveau (il reste à l’arrêt si tu retires l’énergie, et continue sa course jusqu’à sortir du tube quand le niveau est fini) ; à partir de 2 niveaux par seconde il y a autant de nuages que de niveaux par seconde, la fumée s’épaissit jusqu’à 49, et le tuyau n’est plein de fumée qu’à 50.',
            'NGU Énergie : la fumée est la barre. Aucun nuage sans énergie ; un seul nuage traverse le tube quand c’est lent, la traînée s’allonge avec les niveaux par seconde, et le tube est plein de fumée au CAP. Chaque tube a sa couleur.',
            'Chaque tube affiche ses niveaux par seconde (niv/s, format 0,01).',
          ]},
          {menu:'yggdrasil', titre:'Yggdrasil', points:[
            'Au-dessus de chaque arbre, le compteur montre les fruits prêts sur ceux de l’arbre (2/8) ; le niveau maximum n’est plus affiché.',
          ]},
          {menu:'wishes', titre:'Wishes', points:[
            'Un compteur de niveaux par seconde (niv/s, format 0,01) accompagne le temps du niveau suivant.',
          ]},
          {menu:'daycare', titre:'Garderie', points:[
            'Quand tu cliques sur un bocal occupé, tu vois depuis combien de temps l’objet est en garderie.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Coffre : le premier pendentif ascendé peut y être rangé dès le niveau 100, même sans tous ses boosts.',
            'Quand il n’y a plus de place dans le sac, un message clair s’affiche et rien n’est perdu.',
            'Coffre : les deux répliques de l’accident restent plus longtemps à l’écran (4,4 s chacune) et la seconde ne démarre qu’une fois la première partie.',
            'Équiper une configuration reprend automatiquement dans le coffre les pièces qui y sont rangées (si le sac a de la place).',
            'Configurations d’équipement : tu peux leur donner un nom, les monter ou les descendre, et tu vois le total des bonus de leurs pièces (Puissance, Endurance, PV max, Regen PV et Specials).',
            'Tri du sac : les pendentifs sont rangés du plus faible au plus puissant.',
            'Sur téléphone, un sélecteur « Action au clic » (booster, fusionner, transformer) remplace les touches du clavier.',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Écran LED : la pluie de la scène du clown est refaite, avec trois plans de gouttes, du vent et de petites éclaboussures sur la chaussée.',
            'Petits Nuke : le chat, le chien et le ballon sortent chacun environ un tiers du temps (avant, le ballon sortait presque toujours).',
            'Écran LED : Leatherface reste toujours derrière la voiture et ne la rattrape jamais, même pendant un combat lent.',
            'Un petit Nuke démarre directement son animation à l’appui du bouton (ballon, chien, chat…), sans écran d’attente.',
            'Les bandes lumineuses bleue et rouge du contour de la borne sont continues, de l’écran au sol : même brillance partout, elles suivent l’épaule inclinée du pupitre, sans décrochement ni coin.',
            'Le halo du haut de la borne est bleu à gauche, rose au milieu et rouge à droite, au lieu d’être rose partout.',
            'La mort « Tranché » coupe maintenant l’image elle-même : un coup de sabre en diagonale la sépare en deux triangles qui tombent dans leur cadre, puis l’image revient au galop.',
            'L’écran LED de la borne s’affiche maintenant sur des pixels entiers, même quand la page est zoomée : les lignes de points sont toutes égales, sans traits noirs plus marqués que d’autres.',
            'Après la mort « Tranché » (et seulement elle), ton image revient toute petite au loin et grossit en galopant, « tagada » quatre fois au même rythme, au bruit des sabots ; la borne et la pancarte de la chronique rebondissent avec elle, et la borne tousse quand tu n’es pas en combat. Les autres morts gardent leur retour habituel.',
            'Le Nuke porte maintenant un nom par dizaine de boss tués, inspiré des séries de victoires : NUKE pour moins de 20 boss, puis MEGA NUKE, ULTRA NUKE, MONSTER NUKE… et DOUBLE ou TRIPLE devant quand la liste est épuisée, jusqu’à ARMAGEDDON.',
            'Après la mort « Tranché », la borne galope avant de s’arrêter.',
            'L’animation du clown est plus fluide : le bateau avance seul jusqu’à la bouche d’égout ; selon l’issue du combat, le garçon esquive la planche jaune et récupère son bateau, ou la prend de plein fouet.',
            'Écran LED : plus aucune ligne au sol ni juste au-dessus de la barre de vie du boss dans les animations ; le sol de la Red Room est reconstruit sans elle.',
            'Écran LED : l’ange n’est plus cerné de points noirs : sa forme se distingue bien mieux sur le rideau.',
            'Écran LED : la voiture de la poursuite arrive d’abord ; Leatherface entre ensuite derrière elle, une fois la voiture entièrement à l’écran, puis la suit.',
            'Écran LED : la tête des deux Cooper est ronde, et le premier a un teint un peu plus humain que l’autre.',
            'Écran LED : à la défaite, « PERDU ! » (« YOU LOSE » en anglais) remplace « K.O. ».',
            'Écran LED : le trait de la couleur de la barre du boss ne traverse plus les animations.',
            'Écran LED : le ballon garde la même vitesse de bout en bout, sans temps d’arrêt avant de foncer sur le bouton.',
            'Les animations de la borne ne s’arrêtent plus quand tu cliques en dehors de la fenêtre de l’application.',
          ]},
          {menu:'challenges', titre:'Défis', points:[
            'Le bouton « Abandonner le défi » est plus gros et plus lisible.',
            'Un défi terminé porte une étiquette « ✔ TERMINÉ » et un bouton JOUER en vert victoire.',
          ]},
        ]
      },
      {
        version:'4.8',
        nom:'Collection et borne',
        date:'2026-11-03',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Une cible de niveau est désormais toujours respectée au niveau près, même quand l’énergie est au CAP et qu’une barre monte de dizaines de niveaux d’un coup.',
            'La barre de mise à jour de l’application montre maintenant le téléchargement qui avance, puis l’installation, puis le redémarrage.',
            'Sur PC, la molette fait défiler le menu pendant le rangement, même quand tu tiens un bouton.',
            'Tu peux masquer un menu : en mode rangement, l’œil de chaque bouton le masque ou le réaffiche ; les menus masqués restent visibles mais foncés pendant le rangement.',
            'Les boutons de placement (Max, +, Cap…) tiennent compte de la ressource réellement disponible, sans valeur périmée.',
            'L’icône d’un menu qui travaille continue de bouger quand tu cliques en dehors de la fenêtre de l’application.',
            'Énergie et magie : le nombre affiché ne recule plus d’une unité de temps en temps pendant qu’il monte.',
            'L’application Android hors ligne garde toute seule la partie la plus récente, sans te demander de choisir ; un petit message te dit laquelle a été retenue.',
            'Les voix générées sont lues partout, y compris l’introduction des chroniques.',
            'Admin : les voix lues sans texte à l’écran peuvent maintenant être supprimées complètement (et rétablies).',
            'Le menu de gauche ne bouge plus d’une dizaine de pixels quand tu navigues dans les catégories d’une page.',
          ]},
          {menu:'chroniques', titre:'Chroniques', points:[
            'Sets : clique sur une pièce de la vitrine : elle vient en grand, avec ses statistiques, ses bonus et ses Specials.',
            'Album : trois flèches de chaque côté du livre : un bout de l’album, 10 pages par 10, une page.',
            'Quand tu lis toute l’histoire, le bruit de page entre deux boss n’est plus coupé.',
            'Sets : chaque pièce est exposée dans une vitrine, avec une icône plus grande posée sur un socle.',
            'Album : le petit losange au-dessus des flèches de navigation est retiré, et le texte des cartes reste net quand une page se fige.',
            'Album : la page noire n’apparaît plus en double un instant à l’ouverture et à la fermeture du classeur.',
            'Les titres du menu Chroniques reprennent le cadre parchemin du bouton du menu, et le fond bleu laisse place à un brun chaud très sombre.',
            'Dans les sets de la Collection, un objet terminé n’affiche plus que son nom et un petit V vert ; son niveau n’apparaît que tant qu’il n’est pas complètement monté.',
            'Les objets des sets de la Collection ont leur image.',
          ]},
          {menu:'augmentations', titre:'Augmentations', points:[
            'Dans Augmentations, la prochaine amélioration à obtenir indique le boss à battre.',
            'Les écrans des circuits sont mieux incrustés : plus de bord noir, un fin liseré de cuivre et une découpe dans la teinte du circuit.',
            'Chaque augmentation a son propre circuit imprimé : à partir du deuxième ils sont tous différents et montent en puissance (pistes, composants, points lumineux, couleurs qui se mélangent).',
            'Quand tu places de l’énergie, le cadre ne zoome plus : seule la somme s’écrit. Les touches en gomme font un petit « tic » de clip.',
            'Les boutons de la barre du haut sont plus grands, remplissent leurs cadres, et « Tout retirer » n’est plus coupé.',
            'Les touches en gomme (+, −, MAX, 0) sont aussi sur les améliorations.',
            'Machine temporelle : quand il manque de l’Or, l’écran n’affiche plus qu’une somme en rouge : le coût du niveau suivant.',
            'Les petites étoiles qui scintillaient dans les barres actives sont retirées.',
            'Les cadres du niveau et de l’énergie placée ont la même taille et ne s’allongent plus, quel que soit le nombre de chiffres.',
            'Les boutons + − Max et 0 deviennent de vraies touches en caoutchouc mat, chacune dans son cadre aux couleurs de la carte, avec une police plus sobre.',
            'Quand l’amélioration d’un augment n’est pas encore possédée, la carte garde sa taille et montre seulement le circuit imprimé vide ; sur téléphone, une bande plus courte.',
            'Machine temporelle : la barre d’un niveau ne recule plus d’un coup quand tu ajoutes ou retires des ressources.',
            'Les dents dorées des cartes sont désormais plates et d’un or franc.',
          ]},
          {menu:'ngu', titre:'NGU', points:[
            'Magie : un vrai ciel étoilé couvre toute la largeur de chaque ligne, différent d’une ligne à l’autre : points fins, quelques étoiles brillantes qui scintillent en alternance.',
            'Le soleil et la lune du bandeau de la page sont beaucoup plus brillants.',
            'Un simple appui sur le bouton NGU ouvre toujours les NGU d’énergie ; un double clic, un double appui ou un clic droit ouvre toujours ceux de magie.',
            'Magie : les étoiles ne brillent que sur les lignes alimentées, et d’autant plus fort que la ligne se remplit vite.',
            'Énergie : des bancs de nuages gris couvrent la page et ne se dégagent que, très lentement, sur les lignes alimentées, avec un seul soleil en haut ; le ciel est entièrement dégagé quand toutes les lignes sont alimentées.',
            'Le ciel de chaque onglet ne s’éclaire que par ses propres machines : sans magie placée, plus d’aurores boréales ni d’étoiles dans l’onglet Magie, même si l’énergie tourne.',
          ]},
          {menu:'renaissance', titre:'Renaissance', points:[
            'Après un Rebirth, le temps du Rebirth reste affiché dans le bandeau du haut, tout de suite et sans jamais disparaître, même quand le menu Renaissance n’est pas encore reproposé.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Un clic droit sur le bouton Aventure fait comme un double appui.',
            'Quand tu tries ton sac, les pendentifs de la forêt sont côte à côte, du plus puissant au moins puissant.',
            'Journal d’Aventure : un combat terminé n’est plus rejoué en double (deux fois « Vous avez vaincu » pour un seul butin).',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Nouvelle scène de combat sur la borne : un petit garçon en ciré jaune court après un bateau en papier dans une rigole inondée, vers un clown caché dans un égout. Si tu gagnes, il rattrape le bateau ; si tu perds, le clown l’emporte.',
            'Après un Nuke, l’EXP totale gagnée s’affiche sous le nombre de boss sur l’écran LED.',
            'Le ballon fait un vrai tour complet dans le ciel avant de s’écraser sur le bouton : il tourne sur lui-même, l’avant suivant la trajectoire, et il est redessiné en ballon de foire.',
            'L’ange de la Red Room se tient à droite de la sortie, dans un décor d’un rouge bleuté.',
            'Si tu perds pendant une animation de la borne, elle ne se relance plus quand tu refais Fight sur le même boss.',
            'Les petits Nukes restent sobres : plus d’éclairs, de gerbes ni de secousse par-dessus le chat ou le chien.',
            'L’image numérisée de la défaite émerge du noir, sans cadre visible.',
            'Le chat, le chien et le ballon n’apparaissent plus que pour un petit Nuke.',
            'La vague de victoire est refaite : une vraie ola de stade qui traverse l’écran et porte les lettres de VICTOIRE !.',
            'Quand Cooper s’échappe, un ange numérisé apparaît seul, avec les mêmes effets et les éclairs.',
            'Le bonhomme qui saute n’a plus de clignotement juste avant d’entrer dans le château.',
            'Au clic sur Fight, l’animation de la borne démarre tout de suite, sans nom de boss avant ; FIGHT ! s’affiche seulement si le combat est trop court pour une animation.',
            'Un petit Nuke n’affiche plus jamais SUPER NUKE : il a maintenant des animations comiques, dont un ballon qui se dégonfle.',
            'L’entrée aux yeux rouges place les yeux rouges sur les vrais yeux du boss.',
            'Quand tu perds un combat de boss, la borne peut afficher un visage numérisé qui apparaît seul, zébré d’éclairs.',
            'Pendant la danse de Leatherface, il n’y a plus de sang qui gicle.',
            'Une image de boss est remplacée par un nouveau dessin.',
            'Si l’image d’un boss tarde à apparaître au début du combat, elle est révélée au plus tard quelques secondes après.',
            'Dans l’animation du Nuke, le chat saute sur le bouton pour l’activer.',
            'Le Nuke devient de plus en plus fou selon le nombre de boss tués, avec des animations en plus tous les 10 boss et une surprise pour un Nuke qui va jusqu’au bout. Un chien renifle le sol, se met face à toi, lève la patte et arrose le bouton.',
            'Combat de boss : la vie du boss et celle du joueur ne remontent plus brièvement en plein combat.',
            'Les animations longues de la borne se lancent dès que le combat dure au moins 3 secondes, qu’on gagne ou qu’on perde.',
            'Sur la borne, l’animation de victoire n’est plus coupée par le nom du boss suivant.',
            'Sur la borne, la page « victoires » du tableau des scores disparaît : le numéro du boss suffit.',
            'Dans la troisième animation de la borne, le nain ne passe plus qu’une fois dans le couloir.',
          ]},
          {menu:'shop', titre:'Boutique', points:[
            'Boutique : chaque rayon, aide et achat n’apparaît qu’une fois ce qu’il concerne découvert, et reste visible ensuite, même après une Renaissance.',
          ]},
          {menu:'daycare', titre:'Garderie', points:[
            'Les pupilles des chats se contractent et se dilatent doucement, sur 2 secondes.',
          ]},
          {menu:'moneyPit', titre:'Trou sans fond', points:[
            'Les récompenses possibles ne sont plus coupées et chacune affiche sa chance de tomber.',
            'Les pièces jetées dans le trou sont de taille normale et tombent de façon crédible : elles accélèrent, puis rapetissent et s’assombrissent en s’enfonçant.',
          ]},
          {menu:'challenges', titre:'Défis', points:[
            'Défi des 100 niveaux : plus aucun niveau n’est affiché au-delà du budget ; la barre reste pleine et bloque.',
          ]},
          {menu:'entrainement', titre:'Entraînement de base', points:[
            'Entraînement de base : les barres actives gardent leur cadre lumineux, sans particules.',
          ]},
          {menu:'wandoos', titre:'Wandoos', points:[
            'Le bouton CAP affiche la somme réellement nécessaire pendant le chargement de l’OS (elle baisse à mesure qu’il charge) et rend l’énergie en trop.',
            'La barre de chargement orange ne fait plus sauter ses lignes toutes les quelques secondes.',
            'Le bouton CAP place tout ton stock tant que le plafond n’est pas atteint, puis seulement ce dont la machine a besoin.',
          ]},
          {menu:'yggdrasil', titre:'Yggdrasil', points:[
            'Les portes montent et disparaissent derrière la plaque du titre, qui les coupe net.',
            'Une nouvelle police, plus élégante, pour le titre, les noms et les boutons de cette page.',
            'Les écritures des boutons grisés de cette page sont maintenant lisibles.',
            'Une des portes est remplacée par un nouveau dessin.',
          ]},
          {menu:'machine', titre:'Machine temporelle', points:[
            'L’application et le site sont plus fluides sur téléphone : l’écran de la borne, la machine temporelle et le tour des pages de l’album saccadent moins.'
          ]},
        ],
      },
      {
        version:'4.7',
        nom:'Android et gyroscope',
        date:'2026-11-02',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Les entêtes d’allocation (Input, plafonds d’énergie et de magie, Idle) sont plus compacts sur PC : l’Input passe à gauche sur la même rangée, les lignes « placée » sont collées en bas du cadre et les boutons profitent de la place gagnée.',
            'Le jeu est plus fluide partout : le dessin de l’écran de la borne est environ sept fois moins coûteux, le jeu ne se rafraîchit plus plus de 60 fois par seconde, les menus se redessinent plus vite et les écrans qui sortent de l’image se mettent en pause.',
            'Application Android : tu retrouves le menu Admin et le journal de fluidité sur ton compte, même hors ligne, et un bouton « Reconnecter mon compte » (Réglages, onglet Ma partie) ainsi qu’un petit bandeau te proposent de te reconnecter quand ton compte n’est plus relié, sans toucher à ta partie.',
          ]},
          {menu:'augmentations', titre:'Augmentations', points:[
            'Les circuits imprimés portent de petites dents dorées sur leur bord, comme le connecteur d’une barrette de mémoire (à gauche sur PC, en haut sur téléphone).',
            'Le petit crayon qui sert à changer tes boutons « Mes nombres » n’est plus coupé : il est maintenant à gauche du nombre, bien visible et facile à toucher (Augmentations et autres menus).',
          ]},
          {menu:'chroniques', titre:'Chroniques', points:[
            'Tout le menu Chroniques change d’allure, façon forge sombre : onglets en plaques biseautées avec une gemme qui s’allume, sous-onglets, cadres et boutons dorés, titres et textes redessinés (Collection, Succès, Cinématiques…).',
            'La page des sets de la Collection est refaite : une grande carte ornée par set, avec son propre motif de fond, les pièces trouvées avec leur niveau, le sceau du bonus et un cadre doré quand un set est complet.',
            'Les objets des sets de la Collection ont de nouveau leur image.',
            'En anglais, la lecture d’une carte de chronique utilise bien la voix anglaise du début à la fin.',
            'Le lecteur des chroniques réduit en petite enceinte se rouvre de nouveau d’un simple toucher.',
            'Album des cartes : sur téléphone, les cartes ne clignotent plus quand tu tournes la page. Les images de la page suivante sont préparées avant que la feuille ne tourne, et la page qui part est déplacée au lieu d’être redessinée.',
            'Gyroscope : la carte spéciale zoomée réagit maintenant de façon plus naturelle : elle garde son orientation quand tu inclines le téléphone (elle penche dans le sens inverse) et le reflet suit une lumière fixe ; elle bouge en douceur, sans saccade, et revient doucement à plat quand le téléphone reste immobile.',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Des animations ont été ajoutées sur l’écran de la borne.',
            'Une troisième animation de la borne a été ajoutée.',
            'Une des animations de la borne a été refaite, avec un nouveau décor et de nouveaux personnages : à toi de la découvrir.',
            'Cette animation a maintenant une fin différente selon que tu gagnes ou que tu perds.',
            'Sur la borne, l’animation de victoire est vue en entier avant que le nom du boss suivant ne s’écrive.',
            'L’autre animation de la borne a aussi sa propre fin quand tu perds.',
            'L’image du boss suivant ne reste plus invisible après une victoire : un filet de sécurité la fait réapparaître.',
            'La barre de vie suit mieux le moteur : un combat de boss ne rend plus plus de vie quand la défense monte pendant une longue synchro.',
            'La vie regagnée au repos ne prend plus de retard quand la fenêtre est en arrière-plan : plus de saut en avant au retour.',
            'Les dégâts annoncés d’un boss tiennent compte de la difficulté choisie.',
            'Sur la borne, les animations ne se lancent que pour un combat d’au moins 6 secondes, et le nom du boss s’écrit dès qu’il apparaît.',
            'En anglais, la carte de chronique sous la borne lit maintenant tout le texte (et plus seulement le titre).',
            'Sur la borne, les coins noirs qui dépassaient derrière les images du duel sont maintenant arrondis comme les images.',
            'Sur la borne, la vie du boss est centrée sous la barre de l’écran, toujours au format « vie / vie max », et sa régénération n’y est plus affichée.',
          ]},
          {menu:'ngu', titre:'NGU', points:[
            'La lune est une vraie pleine lune brillante, avec ses cratères et son halo ; et tant qu’aucune énergie n’est placée, un gros nuage gris couvre le ciel : le soleil et les nuages blancs n’apparaissent qu’ensuite.',
          ]},
          {menu:'sang', titre:'Magie du sang', points:[
            'Le pentacle du bouton du menu bat comme un cœur, de son rouge jusqu’au rouge de la goutte de sang, quand de la magie est placée ; les icônes du menu bougent dès qu’un rituel a de la magie.',
            'Rituel du fil barbelé : le calice suivant n’arrive plus trop tôt, le calice plein part et le suivant prend sa place.',
            'Les boutons « Lancer le sort » se débloquent dès que ton sang suffit, sans changer d’onglet et revenir.',
          ]},
          {menu:'moneyPit', titre:'Trou sans fond', points:[
            'Le bouton du menu et les illustrations de la page ont été retravaillés.',
            'L’image du trou passe en version nuit du coucher au lever du soleil de l’endroit où tu joues.',
            'Sous l’image du trou, tu vois les récompenses possibles avec l’Or que tu as en stock.',
          ]},
          {menu:'challenges', titre:'Défis', points:[
            'Les trolls disent maintenant leurs vraies phrases, et leurs effets tombent après la production du moment : plus de vol « sans effet ».',
            'Le Troll Challenge affiche maintenant des minuteries pour ses trolls.',
            'Les trolls alternent : un petit troll qui vient de tomber ne revient pas avant trois autres, et le popup d’un troll reste moins longtemps à l’écran.',
            'Un troll ne tombe plus que sur ce que tu possèdes déjà : plus de troll qui parle d’un système que tu n’as pas encore.',
            'Un troll qui retire l’énergie ou la magie retire aussi ce qui était déjà alloué ; la touche R reprend maintenant aussi l’énergie placée dans les améliorations.',
            'Les trolls et leurs popups se produisent aussi quand on reste sur le combat, et fermer puis rouvrir le jeu ne les fait plus disparaître.',
            'Le message d’un troll apparaît à l’instant où il se produit et reste plus longtemps à l’écran.',
            'Pendant le Troll Challenge, l’entraînement de base ne progresse plus hors ligne.',
            'Les descriptions des défis reprennent désormais le texte d’origine du jeu.',
            'Lancer un défi donne maintenant la même énergie de départ dans l’entraînement qu’une renaissance (amélioration de la boutique).',
            'Le menu Défis reste affiché même quand on ne peut pas encore lancer de défi.',
          ]},
          {menu:'wandoos', titre:'Wandoos', points:[
            'Les touches du clavier de ce menu font exactement le même bruit que les boutons de l’application SOREAL, barre d’espace comprise.',
          ]},
          {menu:'machine', titre:'Machine temporelle', points:[
            'La page de la machine reprend la couleur et le fond du bouton de son menu.',
            'Quand il te manque de l’Or pour le niveau suivant, plus de phrase : seul l’Or que tu as déjà s’affiche, en rouge.',
          ]},
          {menu:'yggdrasil', titre:'Yggdrasil', points:[
            'Les portes des fruits ont de nouveaux dessins et s’ouvrent par le haut, avec un bruit de herse de château fort.',
            'Les cadres des fruits prennent les couleurs de leur porte (cadre, nom, boutons et barre de croissance), avec un ombrage à l’intérieur.',
            'Les portes ont toutes la même taille, ne sont plus coupées et ne laissent plus voir le cadre derrière elles.',
            'Les fruits se fondent mieux dans l’image de leur arbre : même teinte, légèrement adoucis, avec une ombre chaude.',
          ]},
          {menu:'daycare', titre:'Garderie', points:[
            'Les pupilles des chats grandissent progressivement jusqu’à presque remplir l’œil, puis redeviennent fines : à l’arrivée dans le menu, quand on prend un bocal, et rarement au repos.',
            'Les yeux des chats : la pupille ne dépasse plus jamais de l’iris et il n’y a plus de pupille de fond ni de rectangle clair derrière elle.',
          ]},
          {menu:'renaissance', titre:'Renaissance', points:[
            'Le compteur de temps du bandeau du haut apparaît désormais dès la renaissance, en même temps que le menu Renaissance.'
          ]},
        ],
      },
      {
        version:'4.6',
        nom:'Android plus fluide',
        date:'2026-11-01',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Dans le Profil, les éléments du badavatar tournent sur 360°, passent devant ou derrière les autres et se placent partout sur le corps.',
            'Quand un rangement a plusieurs pages, les numéros de pages sont aussi affichés en haut, juste sous la barre de recherche.',
            'Réglages : un nouvel onglet « Profil » montre ton badavatar ; tu peux déplacer, agrandir, tourner ou masquer ses éléments, puis l’enregistrer : c’est lui que les autres joueurs voient. Un visage personnalisé est possible en option, détouré sur ton appareil, même sans connexion.',
            'Quand l’orage frappe l’image d’un écran, la déformation reste maintenant à l’intérieur de l’écran sans jamais déborder du cadre.',
            'Les en-têtes des pages où l’on place ses ressources sont beaucoup plus petites : Input dans son petit cadre, puis les cadres Plafond et Idle de chaque ressource sur la même ligne.',
            'Les barres de progression vont maintenant toujours jusqu’au bout avant de repartir, même quand un niveau se gagne en une fraction de seconde.',
            'Dans le choix du portrait de la borne, les noms sous les portraits sont plus gros, sur un fond sombre, et passent sur deux lignes au lieu d’être coupés.',
            'Dans la barre des menus, les icônes des menus qui travaillent brillent en couleurs vives comme celles du menu ouvert ; tout le reste est foncé, pour voir d’un coup d’œil où sont placées tes ressources.',
            'Les nombres que tu tapes dans les champs sont mieux gardés : espaces, virgules et suffixes (k, m, b, t) sont compris, le champ ne se trompe plus de menu, et les saisies de départ et de fin d’étage ainsi que la quantité personnalisée de la boutique sont conservées.',
            'Le journal de combat reste toujours tout en bas, sur la ligne la plus récente : la molette et le doigt ne le font plus défiler. Deux flèches (haut et bas) permettent de remonter ; après 15 secondes sans mouvement, il revient tout seul en bas.',
            'Pour un nouveau joueur, les fenêtres d’annonce (nouveau portrait, nouveau chat) attendent la fin de toute l’introduction avant de s’afficher.',
            'Les barres d’Énergie et de Magie disparaissent instantanément quand il n’y en a plus, et réapparaissent instantanément quand tu en récupères.',
            'Quand tu utilises un objet qui a un effet (potion, copie de système, graine géante, Poop, palier de 100 boosts…), une fenêtre te confirme ce qui vient de se passer, avec les vrais chiffres.',
            'Voix : un texte enregistré ne lit plus que les voix que tu as validées ; 30 voix françaises écrasées par erreur (des noms identiques en anglais) sont restaurées ; les voix anglaises des chroniques sont terminées. La chronique d’un boss rangée sous le mauvais boss est corrigée dans tous les cas.',
            'Application Android : le jeu demande beaucoup moins de travail au téléphone (sauvegardes plus légères, échanges espacés, démarrage et lecture des fichiers plus rapides) ; les effets visuels sont allégés par défaut, tu peux les remettre dans les Réglages.',
            'Application Android : les images se chargent plus vite et ne clignotent plus après un moment d’inactivité (le service du jeu ne démarre plus tout son moteur pour afficher une image, et les images déjà vues sont gardées).'
          ]},
          {menu:'augmentations', titre:'Augmentations', points:[
            'Dans les Augmentations, toutes les informations sont maintenant dans de petits écrans incrustés (LED sur le circuit, LCD sur le processeur), une couleur par paire. Le titre, la barre d’avancement, l’écran Cible et les boutons ont aussi changé d’aspect, et il n’y a plus de pointillés.',
            'Dans les Augmentations, les barres d’avancement ont un effet LED (grille de petits points lumineux) mais restent continues, sans coupure, de la couleur de la paire ; les écrans des processeurs sont maintenant des écrans LCD rétroéclairés, au fond clair lumineux et aux caractères sombres.',
            'Dans les Augmentations, les petits textes des écrans du circuit (« Niveau suivant dans… », « Niveau », « Prochain niveau », « Cible » et leurs valeurs) sont beaucoup plus clairs et plus lisibles, pour toutes les paires.'
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Sur la borne, la ligne rouge et les cadres des deux images ont disparu : elles font corps avec l’écran. Ton nom et le nombre de fois que tu as tué le boss s’affichent sur de petits écrans LED sous les images.',
            'L’écran à LED de la borne est maintenant très noir quand il est allumé : plus aucun reflet sur la vitre, et les points éteints sont presque noirs.',
            'Le panneau de la borne affiche aussi, de temps en temps, le temps restant de l’objet actif (porte-bonheur, potions…).',
            'Chaque NUKE déclenche maintenant une animation différente sur le panneau de la borne, avec le nombre de boss franchis.',
            'La barre de vie du boss est maintenant intégrée dans l’écran de la borne, sous le panneau LED.',
            'Le texte du panneau LED est net, et l’écran affiche plus de LED quand il est plus large.',
            'Borne d’arcade : plus d’espace entre l’enseigne et l’écran, et les bandes lumineuses bleue et rouge descendent maintenant sans coupure jusqu’en bas.',
            'Le portrait du boss suivant s’affiche toujours : si son image n’a pas pu se charger, elle est redemandée automatiquement.',
            'Le nom et le numéro du boss s’affichent maintenant sur un panneau à LED, au-dessus de sa barre de vie : FIGHT ! reste affiché pendant tout le combat, avec des animations pour les coups, la victoire et le K.O.'
          ]}
          ,{menu:'diggers', titre:'Mineurs d’or', points:[
            'Dans le petit menu, le tas d’or du dessin est posé plus bas et des pièces tombent dedans quand le menu travaille.',
            'Quand un mineur est activé, les icônes du menu restent allumées dans la barre même si tu n’es pas dans ce menu : seul le fond s’assombrit.'
          ]}
          ,{menu:'chroniques', titre:'Chroniques', points:[
            'Le dos des cartes spéciales est étiré : plus aucun bord noir n’est visible.',
            'Les dos des cartes du classeur ont maintenant 9 dessins différents (un par emplacement d’une page) au lieu d’un seul.',
            'Les cartes spéciales du classeur ont leur propre dos, une image de carte dorée et brune, plus belle.',
            'Le livre des chroniques n’est plus fermé au départ : il s’ouvre directement sur la dernière page où tu t’étais arrêté (la même sur tous tes appareils), et sur ordinateur les flèches sont de chaque côté du livre : −10 et −1 à gauche, +1 et +10 à droite, avec le numéro de page discret sous le livre.',
            'Le lecteur des chroniques a la forme d’une cassette de walkman (les bobines tournent pendant la lecture) avec les touches précédent, lecture/pause, suivant et stop ; il peut se réduire en petite enceinte, déplaçable où tu veux, qu’un toucher agrandit.',
            'Le texte d’une carte de chronique se fait défiler à la souris : avec la molette, ou en gardant le clic gauche enfoncé et en bougeant la souris.',
            'Les cartes spéciales du classeur sortent maintenant de leur pochette comme les autres : touche-en une, elle vient au centre, tu peux la saisir et la faire pivoter (le dos se montre de l’autre côté), et l’effet hologramme bleu, rouge, vert et couleur de base brille selon le coin vers lequel elle penche, sans rien qui bouge tout seul (le reflet blanc qui passait à intervalle régulier est supprimé) ; la main disparaît pendant que tu tiens une carte.',
            'Sur téléphone, une carte spéciale zoomée suit l’inclinaison de ton téléphone (gyroscope) : elle penche et l’effet hologramme brille selon l’angle ; ton doigt posé sur la carte reste prioritaire.',
            'Les cartes spéciales du classeur commencent maintenant sur une nouvelle page, avec leurs dos visibles avant de tourner la page.',
            'Changer de langue dans les Réglages recharge maintenant la page : les noms de boss, les chroniques et les voix sont tout de suite dans la bonne langue.',
            'Sur les cartes de boss, le bas de la carte indique la langue (EN en anglais) et le nom du boss suit la langue choisie.',
            'Les comptes d’ouvrier absents de la liste de l’équipe apparaissent maintenant comme ennemis dans la tour, avec le badavatar de leur Profil.',
            'Sur l’écran de la borne, les lettres des grands nombres (K, M, AB…) ont leur couleur habituelle et la régénération est écrite plus petit.',
            'Le journal de combat de l’Aventure reste toujours calé sur la dernière ligne, même quand le combat va très vite.',
            'Sur l’écran de la borne, les chiffres de la vie du boss sont sous la jauge, à gauche, sur la même ligne que la régénération.',
            'L’écran LED de la borne est plus net (points au bord franc, halo plus discret) et ses chiffres sont plus petits.',
            'Les flèches du classeur ont un nouveau style fantasy : métal doré, gemme lumineuse, pointes taillées en relief, « 10 » sur les flèches de dix pages, et un aspect terni quand elles sont inactives.',
            'Au bout du classeur, de nouvelles pages peuvent apparaître avec des cartes spéciales : un cadre particulier aux couleurs de chaque personnage et un effet hologramme qui suit ton doigt ou ta souris.',
            'Dans la Collection, les boosts du bas sont toujours rangés par valeur (1, 2, 5, 10, 20, 50, 100), puis dans l’ordre orange, bleu, jaune, qu’ils soient complétés ou non.'
          ]}
          ,{menu:'sang', titre:'Magie du sang', points:[
            'Braquage de la banque du sang : l’animation de la salle ne se lance plus en boucle pendant un long rituel, elle ne joue que lorsqu’un niveau se termine vraiment.',
            'Dans le petit menu de la magie du sang, le pentacle brille d’un rouge beaucoup plus vif.',
            'Le bol de fil barbelé : le calice suivant arrive maintenant vraiment vide, et il ne peut plus y avoir deux calices en même temps pendant l’échange.',
            'Application Windows : les éléments de Blood Magic ne disparaissent plus quand tu cliques en dehors de la fenêtre.'
          ]}
          ,{menu:'daycare', titre:'Garderie', points:[
            'Dans la Garderie, les durées s’affichent en jours, heures et minutes (« 7 h 36 min » au lieu de « 7,6 h »).',
            'La ligne blanche coupée qui courait à la surface du liquide des bocaux a disparu : il ne reste que les vagues.',
            'Les petits traits noirs qui apparaissaient à la surface du liquide des bocaux, en vue normale comme en vue zoom, ont disparu : la surface est propre.',
            'Les bocaux ont une forme propre à chaque apparence de ton chat ; le niveau s’affiche sous le bocal, et les fioles sont posées au milieu de la planche.',
            'Chaque chat a une ombre au sol, un fond mieux cadré sur téléphone, et des pupilles en fente qui s’élargissent et se contractent.',
            'Un clic sur un bocal le met en gros plan avec le temps avant le prochain niveau et avant le niveau 100, puis « Reprendre » ou « Ranger ».',
            'Dans la fenêtre qui propose de reprendre un objet, le bouton Annuler est lisible : texte blanc sur fond vert très sombre, avec un contour clair.',
            'La couleur du liquide des bocaux suit l’apparence du chat : transparent pour le chat de base, rose bonbon pour le coquet, or pour le doré, sang pour Halloween, arc-en-ciel pour Nyan…'
          ]}
          ,{menu:'tower', titre:'ITOPOD', points:[
            'Le badavatar montré dans Réglages › Profil est maintenant exactement celui que les autres voient dans la tour.',
            'Une barbe qui montait sur le nez d’un personnage (comme Massimo) est replacée juste sous le nez ; tous les autres visages restent exactement comme avant.',
            'Les ennemis défilent maintenant l’un après l’autre, du premier au dernier de la liste, puis tout recommence au premier. Leurs visages ne sont plus coupés en haut et les corps ne flottent plus.'
          ]}
        ]
      },
      {
        version:'4.5',
        nom:'La voix anglaise',
        date:'2026-10-31',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Application Windows : un bouton « Vérifier les mises à jour » dans les Réglages (Ma partie) cherche tout de suite une nouvelle version, sans attendre le contrôle automatique.',
            'L’introduction en anglais affiche maintenant le texte original du jeu (« THE BEGINNING ») et est lue par un narrateur anglais, légèrement ralenti ; si une voix ne peut pas se jouer, l’introduction défile en texte seul.',
            'Dans le menu en petit, un menu qui travaille sans être ouvert garde son fond sombre, mais ses icônes restent en couleurs pleines et animées.',
            'En anglais, le lecteur reste muet quand aucune voix anglaise n’existe pour le texte, au lieu de lire le texte français ; les guides et le tutoriel sont traduits en entier.',
            'Application Android : après avoir choisi la partie du compte, l’écran « deux parties » ne revient plus à chaque lancement.',
            'Les nombres que tu tapes dans les champs de saisie sont mieux conservés sur ton compte : plus de valeur perdue à la fermeture ou après une mise à jour.',
            '« En direct » n’indique plus dans quel menu se trouve un joueur : on n’y voit que ses actions.',
            'Dans cette liste, les lignes ajoutées depuis la dernière mise en ligne s’affichent en vert.',
            'Tu peux choisir ton portrait de héros même quand un set complet est équipé ; un bouton « Automatique » te ramène au portrait du set.',
            'Pour Halloween, un portrait de joueur d’Halloween se gagne en jouant, comme le chat chauve-souris ; une fenêtre te l’annonce.'
          ]},
          {menu:'entrainement', titre:'Entraînement de base', points:[
            'Le titre du menu : l’haltère à gauche, coupée par le bord, avec sa barre qui monte et descend ; le gant de boxe à droite, qui frappe de droite à gauche.',
            'Le petit bouton du menu reprend les mêmes animations quand le menu travaille : la barre de l’haltère monte et descend, le gant frappe.',
            'Dans le petit menu, l’haltère est décalée à gauche et le gant frappe un peu moins loin, pour ne plus passer derrière le texte.'
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Auto Merge et Auto Boost ne fonctionnent plus hors ligne : l’inventaire se remplit, c’est tout. Ils repartent dès que tu te reconnectes.',
            'Les compteurs d’Auto Merge et d’Auto Boost ne reculent plus, et le sac se met à jour tout de suite après un Auto Boost.',
            'Coffre : quand une zone donne deux objets pour le même emplacement (deux casques, par exemple), ils ont chacun leur case au lieu de se superposer.',
            'Quand tu appuies sur le bouton Aventure du menu, l’inventaire (le Sac) est de nouveau affiché par défaut.',
            'Le bouton Aventure allumé par « Adventure Light » a la même lueur que le Trou sans fond ; dans le petit menu, la croix rouge pivote doucement et les pointillés apparaissent un à un jusqu’à elle.',
            'Les ronflements pendant le sommeil sont limités à deux ou trois fois.'
          ]},
          {menu:'augmentations', titre:'Augmentations', points:[
            'Chaque augmentation est maintenant posée sur sa propre carte électronique de couleur, avec un processeur pour son amélioration.',
            'Le cadre de chaque paire est plus court : la bande du haut est supprimée et les noms des deux augmentations sont plus grands.',
            'Les broches des processeurs sont bien placées sur toutes les cartes, y compris Bouclier d’énergie et Sabre laser à quatre côtés.'
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Le bouton « Écouter » de la chronique lance seulement la voix : pour ouvrir la carte, clique sur le panneau lui-même.',
            'Le cadre de titre n’affiche plus que son titre, sans phrase en dessous.',
            'Le choix du portrait du héros se fait maintenant sur la borne : un petit bouton rond « 1P » sur la tranche du pupitre ouvre « CHOOSE YOUR PLAYER ». Il quitte la page des succès.'
          ]},
          {menu:'daycare', titre:'Garderie', points:[
            'Un clic sur un bocal ouvre maintenant une fenêtre d’information aux couleurs de la page, et les bocaux sont un peu plus grands.',
            'Mamie l’armoire : la pupille et la paupière sont maintenant posées exactement sur l’œil dessiné, sans second œil par-dessus.',
            'Le chat de la Garderie a plusieurs apparences : dès que tu en possèdes deux, une rangée de vignettes apparaît pour changer d’apparence, avec une animation de glissement d’un chat à l’autre.',
            'Chaque chat a son propre regard : iris et pupille adaptés, et des paupières qui épousent exactement ses yeux et clignent ensemble.',
            'Les chats ont des regards variés (ils se tournent par moments d’un côté ou de l’autre), des clignements de plusieurs sortes, et respirent très légèrement.',
            'Les bocaux reposent maintenant bien sur les planches de l’étagère.',
            'Quand tu débloques une nouvelle apparence de chat, une fenêtre te l’annonce ; elle se ferme avec le bouton « Cool ».',
            'Les chats qui ont une queue visible la balancent doucement.'
          ]},
          {menu:'tower', titre:'ITOPOD', points:[
            'Chaque ennemi de la tour a maintenant un visage généré au hasard : un corps d’homme ou de femme, des cheveux, des yeux, un nez, une bouche et parfois une barbe. Un ennemi qui porte un prénom garde toujours le même visage.',
            'Le petit bouton de ce menu a une nouvelle tour à droite : en pierre, avec créneaux, fenêtre éclairée, porte en arc et fanion.',
            'Sur le petit bouton du menu, la grande tour de gauche monte à l’infini quand le menu travaille.'
          ]},
          {menu:'sang', titre:'Magie du sang', points:[
            'Dans le petit menu, le pentacle est d’un rouge plus vif quand le menu est actif et tourne sur lui-même ; la goutte de sang est plus petite : elle apparaît en haut, tombe et disparaît en fondu, en boucle.'
          ]},
          {menu:'moneyPit', titre:'Trou sans fond', points:[
            'Les pièces d’or qui ne passent pas le bord du trou continuent leur chute en devenant de plus en plus petites, puis disparaissent en fondu, sans éclat.',
            'Les filets de puanteur qui sortent du trou bougent chacun de leur côté : montée et balancement n’ont plus le même rythme d’un filet à l’autre.',
            'Au fond du trou, la deuxième puis la troisième paire d’yeux apparaissent minuscules et grossissent en se déplaçant très lentement jusqu’à leur place (la troisième arrive du haut à gauche et se place au-dessus des deux autres), comme si quelque chose s’approchait de l’ouverture pour te regarder ; les yeux sont d’un jaune rougeâtre, pour ne pas les confondre avec les pièces d’or.',
            'Sur ordinateur, les deux colonnes sont équilibrées : le trou et la roue ont chacun leur colonne (image, menu, tableau de récompenses), et les Réglages comblent leurs espaces vides.',
            'Sur ordinateur, l’image du trou et la roue sont côte à côte, chacune avec son menu en dessous, et les deux tableaux de récompenses aussi.',
            'Les yeux au fond du trou n’apparaissent qu’à partir du moment où l’image est à l’écran : une paire après l’autre, sans se presser, puis ils restent fixes.',
            'Quand tu jettes ton or, certaines pièces passent le bord du trou et disparaissent derrière lui, les autres rapetissent en tombant et s’effacent dans le noir.',
            'La scène a une nouvelle image, avec le titre et la phrase au-dessus, en français et en anglais.',
            'Au fond du trou, des yeux jaunes brillent plus ou moins ; quelques volutes de puanteur remontent, et des pièces d’or tombent dedans uniquement quand tu jettes ton or.',
            'La roue journalière est refaite : une grande roue sous le cadre du trou, avec toutes les récompenses possibles à leur vraie proportion ; elle tourne vraiment et s’arrête sur ta récompense.',
            'Le titre du Trou sans fond a un léger bord clair, plus lisible sur l’herbe.'
          ]},
          {menu:'yggdrasil', titre:'Yggdrasil', points:[
            'Une pile de graines utilisée d’un coup ajoute autant de graines qu’elle en contient (une pile de 15 en donne 15).',
            'Avec l’achat qui prévient quand un fruit est prêt, le bouton du menu attire l’œil comme celui du Trou sans fond et les fruits prêts brillent.'
          ]}
          ,{menu:'shop', titre:'Boutique', points:[
            'Un petit « i » sur les articles qui débloquent une fonction (emplacements, outils du sac…) explique en une phrase ce que l’achat fera, avant de l’acheter.'
          ]}
        ]
      },
      {
        version:'4.4',
        nom:'Le classeur',
        date:'2026-10-30',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Au lancement du jeu, sur l’écran où l’on choisit son pseudo, on choisit aussi sa langue (Français ou English) : l’écran se traduit tout de suite et l’introduction se lance dans la langue choisie. En anglais, l’introduction s’affiche en texte seul pour l’instant : les voix anglaises ne sont pas encore enregistrées.',
            'Les cadres de titre des menus gardent leur apparence à toute largeur de fenêtre : ils reprennent le visuel de leur petit bouton au lieu de s’étirer en gros disques flous sur un grand écran.',
            'Application Android hors ligne : au lancement en ligne, ta partie du compte est maintenant revendiquée comme sur ordinateur (un seul appareil joue à la fois) ; si une partie plus récente existe sur le compte, un écran oblige à choisir entre la partie du compte et celle du téléphone, et la partie remplacée est gardée 30 jours en secours.',
            'Application Android hors ligne : le bouton Retour ferme maintenant l’application, comme avant.',
            'Application Android hors ligne : à chaque ouverture, un dialogue propose la mise à jour tant qu’elle n’est pas appliquée (avec un bouton pour la télécharger tout de suite, même en réseau mobile), signale quand l’ancienne version a dû être remise et propose de réessayer ; le numéro de version du code actif s’affiche dans les Réglages (onglet Infos), et les médias retirés (anciennes voix) sont supprimés de l’appareil pour libérer de la place.',
            'Les boutons de la barre des menus (en haut sur téléphone, à gauche sur ordinateur) sont maintenant le cadre de titre de leur menu en petit, avec le nom du menu au centre : le menu ouvert brille, les autres sont sombres, et les deux dessins de chaque bouton s’animent quand ce menu travaille (avec l’achat « Menus animés »).',
            'Applications Android et PC hors ligne : les textes des chroniques et leurs voix se mettent maintenant à jour avec les mises à jour de l’application (avant, elles gardaient celles d’origine).',
            'Dans les bonus obtenus grâce à la roue, l’objet s’appelle maintenant « Caca » (et non « crottin »), sans la mention « sans effet » : il a un effet quand on l’utilise.',
            'Application Android hors ligne : au démarrage, un écran de connexion affiche l’image du jeu en plein écran ; un appui ouvre le navigateur pour choisir son compte Google. Si le compte possède une partie, elle est restaurée directement ; sinon un pseudo est demandé, et un pseudo déjà pris est refusé.',
            'Quand tu nettoies ton Coffre ou ta Valise, une phrase comique accompagne maintenant la récompense en AP (une au hasard, jamais deux fois de suite la même), avec des phrases à part pour le gain exceptionnel.',
            'Dans l’application PC lancée par Steam, les bandes noires qui apparaissaient pendant l’interface Steam (et une demi-seconde après) sont corrigées : le jeu continue de se dessiner sous la superposition.',
            'Les cadres de titre des menus ont une police plus grande et un aspect plus soigné : le nom en grosses lettres entre deux filets lumineux, la mini phrase plus lisible, un reflet et un liseré dans la couleur du menu.',
            'Sur téléphone, les voix ne crachouillent plus : elles utilisent un tampon audio plus large et passent par le même limiteur que les autres sons.',
            'Chaque menu commence par un cadre de titre (le nom du menu et une mini phrase) de la hauteur exacte des 4 barres du haut : même toutes affichées, elles ne cachent que le titre, jamais un bouton.',
            'Dans l’application PC lancée par Steam, le jeu ne clignote plus en noir quand l’interface Steam est affichée.',
            'Dans l’application PC, le premier lancement est bien plus rapide : elle ne reste plus figée pendant qu’elle prépare ses images et ses voix (le travail se fait en arrière-plan, puis est retenu pour les lancements suivants).',
            'Sur la couverture du classeur fermé, les trous noirs sont au niveau des anneaux ; les anneaux restent visibles pendant un saut de 10 pages.',
            'L’intérieur de la couverture garde exactement son cuir, ses bords et ses trous quand le livre finit de s’ouvrir : la texture ne disparaît plus, et l’affiche de la première page ne clignote plus.'
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Sur téléphone, l’aura du Cube de l’infini est de nouveau visible : la case ne la coupe plus.',
            'Sur téléphone, un double tap sur le Cube de l’infini absorbe maintenant les boosts au lieu d’ouvrir sa fenêtre : un simple tap ouvre la fenêtre (avec l’achat « Double tap », elle s’ouvre juste après le délai du double tap).',
            'L’Auto Boost n’en laisse plus dans ton sac : l’équipement reçoit les boosts en premier, puis tout ce qu’il ne peut plus absorber part dans le Cube de l’infini (avant, le Cube attendait que toutes les stats de l’équipement soient au maximum).',
            'Dans la fiche d’un objet, les boutons ne sont plus coupés : le texte passe à la ligne et les boutons au libellé long prennent toute la largeur, sur ordinateur comme sur téléphone.',
            'Sur les cartes des boss, le « Monde » suit maintenant les zones du mode Aventure (Zone Tutoriel = monde 1, puis +1 à chaque nouvelle zone), au lieu de 20 boss par monde.',
            'Un objet de niveau 100 dont les boosts sont au maximum perd maintenant son point de couleur tout de suite (et reçoit son V vert) : avant, il fallait changer d’onglet et revenir.'
          ]},
          {menu:'daycare', titre:'Garderie', points:[
            'Sur ordinateur, la Garderie montre Mamie l’armoire en grand, posée sur l’ombre du plancher du grenier (décor agrandi) ; le titre et le texte sont à gauche, le résumé et le détail des bonus à droite, pour que l’armoire reste entièrement visible.',
            'Les onglets Sac et Garderie gardent exactement la même taille et la même place quand on passe de l’un à l’autre.',
            'Plus de boutons sous l’armoire : on clique sur les bocaux. Un « + » dans un bocal vide permet de choisir un objet disponible ; cliquer sur un bocal occupé propose de reprendre l’objet, en prévenant que l’avancée vers le niveau suivant sera perdue. Chaque bocal montre le niveau de départ puis le niveau actuel, en vert.',
            'L’image du grenier occupe tout le cadre de la Garderie (onglets et titre compris), et Mamie l’armoire a de petits mouvements : sa pupille gauche tombe parfois comme une bille et sa paupière se ferme plusieurs fois pour la remettre en place, et le bout de son nez bouge de temps en temps.',
            'La Garderie d’objets n’est plus un menu : c’est un onglet à côté du sac, tenu par une vieille armoire aux yeux fous qui parle, bougonne un peu et remue son gros nez entre deux bocaux. Chaque emplacement est un grand bocal de verre avec ton objet dedans et un liquide aux couleurs de l’arc-en-ciel qui monte ; quand il atteint le haut, l’objet gagne 1 niveau et le liquide repart du bas.',
            'Les bocaux apparaissent un par un sur l’étagère, au fur et à mesure que tu obtiens des emplacements, avec une petite animation de pose.',
            'Dans la fiche d’un objet, un bouton Garderie le place directement dans un bocal libre (« Garderie pleine » s’il n’y en a plus).',
            'Quand tu ranges un objet qui n’est pas maxé, il file dans un bocal libre de la garderie ; s’il n’y en a plus, l’étagère le refuse avec un petit commentaire et il reste dans ton sac.'
          ]},
          {menu:'shop', titre:'Boutique', points:[
            'L’emplacement de Daycare (Boutique EXP, onglet Débuts) apparaît maintenant sans condition cachée : avant, il fallait déjà avoir un emplacement pour le voir.'
          ]},
          {menu:'chroniques', titre:'Chroniques', points:[
            'Plus de double couverture : le cuir de fond ne dépasse plus derrière l’album ouvert, on ne voit que la couverture et les pages.',
            'Les sets faits d’un seul objet apparaissent maintenant dans la Collection : dans l’onglet Sets (leur objet et leur bonus) et dans la liste des sets complétés de l’onglet Équipement. L’annonce « Set complété » donne leur vrai nom et leur bonus, qui est maintenant écrit en toutes lettres.',
            'Dans l’album, quand tu consultes un boss, la carte sort de sa pochette en un seul mouvement fluide, et quand tu la refermes elle rentre dans sa pochette avec la même animation.',
            'Dans l’album des boss, la flèche tout à gauche fait repasser toutes les pages d’un coup puis referme la couverture (le livre se centre sur la page en se fermant) ; viennent ensuite la flèche qui avance (ou recule) de 10 pages en 10 pages et celle qui tourne une page à la fois.',
            'Sur téléphone, le texte d’une carte de chronique défile maintenant sous le doigt : le fond du jeu ne glisse plus à sa place.',
            'Quand tu ranges de nouvelles cartes, chacune entre maintenant dans sa pochette par le côté extérieur de la page, sous le plastique (elle ne le traverse plus), et un bouton « Passer » (ou la touche Échap) range tout d’un coup.',
            'Sur téléphone, l’album montre une seule page de 9 cartes au plus, à taille fixe (plus de zoom), et les images des cartes ne disparaissent plus quand on tourne les pages.',
            'Dans le classeur, la carte reste maintenant bien visible pendant qu’elle glisse pour entrer dans sa pochette (elle disparaissait avant d’arriver).',
            'La flèche tout à gauche du classeur attend maintenant la fin de la dernière feuille avant de refermer la couverture : plus de mouvement de couverture en double à la fermeture.',
            'Sur ordinateur, quand la page de gauche du classeur n’est pas complète, les emplacements vides laissent voir le dos des cartes rangées derrière elle (seulement celles qui existent vraiment).',
            'Sur les cartes des boss, la case du coin donne le total de PV du boss et sa régénération par seconde (comme sur la borne d’arcade) ; le nombre de fois que le boss a été tué est un chiffre précédé d’une épée (un boss déjà vaincu reprend son ancien nombre de rencontres tant que le compteur, né aujourd’hui, est plus petit) ; le nombre de rencontres n’est plus écrit au pied de la carte, et le numéro du bas s’écrit « B 112 » au lieu de « B 0112 ».',
            'Le classeur a des sons : trois bruits doux de feuille de plastique qui se tourne, un bruit de pages qui défilent quand on avance de 10 en 10, et un bruit de couverture qui se referme.',
            'Les pochettes s’ouvrent maintenant sur le côté extérieur de la page (à gauche sur la page de gauche, à droite sur la page de droite) : le pointillé suit, et les cartes y entrent et en sortent par ce côté, même hors de l’écran.',
            'Le classeur n’a plus d’anneaux ni de ronds noirs.',
            'Le classeur s’adapte maintenant à la taille de la fenêtre, même petite, sur ordinateur comme sur téléphone, et propose des boutons + et − pour zoomer ou dézoomer. Les cartes rangées dans les pochettes sont écrites exactement comme la carte sortie du classeur, même minuscules : leur nom n’est plus tronqué plus que sur la grande carte.'
          ]},
          {menu:'yggdrasil', titre:'Yggdrasil', points:[
            'Sur un fruit prêt, le gain de « Manger » et de « Récolter » est bien plus visible (cadre doré, texte plus grand) et les unités des grands nombres (Qa…) ont leur couleur comme partout ailleurs.'
          ]},
          {menu:'ngu', titre:'NGU', points:[
            'Dans NGU, « Eh, c’est le nom du jeu original ! » est maintenant sous « NGU » dans le cadre du haut, et le deuxième cadre (jour / nuit), devenu inutile, est supprimé.',
            'Le cadre de titre de la page prend vraiment le thème de la page : la moitié gauche est en jour (ciel bleu et soleil), la moitié droite en nuit (ciel sombre, lune et étoiles).'
          ]},
          {menu:'wandoos', titre:'Wandoos', points:[
            'Sur ordinateur, cette page a un nouveau fond : une salle de serveurs lugubre éclairée aux néons, derrière tout le cadre. Le titre reste au-dessus et le dessin dépasse en haut, à gauche et à droite. Le titre est vert, comme le bouton du menu. Le mauve des néons de gauche et le vert de ceux de droite se reflètent sur la vitre, la coque et le clavier.'
          ]},
          {menu:'sang', titre:'Magie du sang', points:[
            'Lancer un sort demande maintenant confirmation : une fenêtre aux couleurs du sang indique combien de sang sera dépensé, avec le chiffre du moment (le bouton affichait un ancien montant). Le « Sang collecté » est plus gros et plus visible, et le bouton ne porte plus de chiffre.',
            'La sangsue ne reste plus bloquée : quand elle crachait un jet puis que plus aucune boule n’apparaissait dans son ventre, elle repart toute seule (plus besoin de changer de page et de revenir).'
          ]}
        ]
      },
      {
        version:'4.3',
        nom:'Les arbres',
        date:'2026-10-29',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Les cartes de boss s’ouvrent plus grandes sur PC, au même format dans le panneau sous la borne et quand on passe au boss précédent ou suivant ; sur téléphone elles prennent presque toute la largeur, les flèches passant sous la carte.',
            'Dans l’application PC, une mise à jour ne peut plus échouer parce qu’une voix a été régénérée entre-temps : le fichier concerné est mis de côté et le reste s’installe.',
            'Dans l’application PC, l’entrée Steam s’appelle SOREAL NGU IDLE (renommée toute seule au lancement, Steam fermé), et l’interface Steam ne fait plus clignoter de bande noire.',
            'L’icône du jeu est la nouvelle sur la fenêtre et sur les raccourcis du Bureau, du menu Démarrer et de la barre des tâches.',
            'Le boss qui s’écroule en pierre se fissure exactement là où il se casse : les morceaux qui tombent suivent les fissures.',
            'Un son de mort n’est plus joué en double : une mort qui a son propre son ne rejoue plus le son de défaite en plus.',
            'L’autocollant SOREAL de la borne est centré sur l’enseigne, de travers, et le N de NGU se lit en entier.',
            'Sur PC, l’écran de lancement utilise la grande image horizontale ; sur téléphone, l’affiche verticale.',
            'Sur PC, le cadre des menus de gauche est centré en hauteur (même marge en haut et en bas) et ses icônes restent dans le cadre quand on le fait défiler.',
            'Le jeu change de nom : il s’appelle maintenant SOREAL NGU IDLE, partout. Sur la borne d’arcade, l’enseigne affiche NGU IDLE avec un autocollant SOREAL collé devant.',
            'Au lancement, l’écran de chargement montre la grande affiche verticale du jeu avec son logo et la barre de chargement.',
            'Sur PC, le jeu occupe maintenant toute la largeur de la fenêtre, même hors plein écran : plus de zones vides sur les côtés.',
            'Sur PC, l’ajout à Steam utilise maintenant de nouvelles images : affiche, en-tête, bannière, logo et icône, aux formats attendus par Steam pour un jeu non-Steam.',
            'L’introduction est maintenant entièrement traduite en anglais pendant qu’elle défile : la phrase de la quatorzième image et le premier bruitage n’étaient pas traduits.',
            'En plein écran, le jeu occupe vraiment toute la largeur et toute la hauteur de l’écran : plus de bandes vides à gauche et à droite.',
            'Quand on ferme l’interface Steam, l’image de Steam ne reste plus à l’écran comme un fantôme : la fenêtre se repeint toute seule.',
            'Sur PC, la barre de défilement de la page prend les couleurs de la page affichée et une texture à son image : métal rivé, écran vert, écorce, gouttes, étoiles, terre, bandes d’alerte, losanges, papier ou quadrillage.',
            'Sur PC, les images et les sons de l’application sont maintenant protégés : ils ne sont plus lisibles directement dans le dossier d’installation.',
            'Sur téléphone, placer ou retirer de l’Énergie ou de la Magie ne fait plus bouger la page : le cadre « total placé » garde toujours la même hauteur.',
            'Les sons de la boutique (porte, pas) et d’autres effets ne crachouillent plus par moment : un claquement très bref, qui dépendait de l’instant exact où le son démarrait, a été supprimé.',
            'Sur téléphone, le cadre Temps ne coupe plus l’heure : elle rétrécit juste assez pour tenir en entier.',
            'Lancée depuis Steam, l’application dessine maintenant de façon à laisser la superposition Steam s’afficher par-dessus le jeu ; Maj + Tab ouvre le menu Steam.',
            'Sur PC, un bouton plein écran / écran normal apparaît en haut à droite, au bout de la rangée des chiffres (à droite du cadre Temps).',
            'L’application Android se met maintenant à jour toute seule, comme celle de Windows : au lancement, elle cherche les nouveautés (images, sons, jeu), ne télécharge que ce qui a changé et te propose de relancer quand c’est prêt.',
            'Dans l’application Windows, F5 et Ctrl+R actualisent de nouveau la fenêtre (Ctrl+Maj+R et Ctrl+F5 aussi, en ignorant le cache).'
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Quand un boss meurt, le son de l’apparition du boss suivant ne se joue plus deux fois (une fois pendant la mort, puis à la fin) : le même son ne revient plus à la suite.',
            'Les réapparitions sont aussi variées que les morts : après sa mort, le joueur revient en marchant sur les coins du bas, en rebondissant, en tampon, en puzzle, en faisceau, en ballon ou en toupie, chacun avec son propre son ; le simple fondu a disparu.',
            'Les boss font une entrée différente à chaque fois : sept nouvelles arrivées (écrasement, surgissement, portail, silhouette, plongeon, fumée, briques), chacune avec son son, jouées à la suite des précédentes.',
            'Après une Renaissance, le combat de boss est toujours à l’arrêt : le premier boss ne se bat plus tout seul quand l’écran de la borne s’allume ; il faut appuyer sur Fight.',
            'Les animations de mort du boss et du joueur ne se jouent plus au hasard : elles défilent dans l’ordre, l’une après l’autre ; quand toutes ont été vues, on recommence à la première. Les prochaines s’ajouteront à la fin de la file.',
            'Tout boss combattu avec le bouton Fight a maintenant l’animation de sa mort, quelle que soit la durée du combat (plus de minimum de 5 secondes) ; seul le NUKE n’en a pas. Même si le boss suivant était déjà prêt avant la fin de la barre de vie, on ne voit plus son image apparaître une demi-seconde, puis un écran noir, puis un fondu sans son. Sa mort se joue d’abord, puis il apparaît avec son effet et son son.'
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Le Cube de l’infini a toujours une petite aura, de la couleur de son aspect (elle change avec son palier).',
            'Le journal de combat revient tout en bas après 10 secondes sans qu’on y touche ; toucher ou faire défiler le journal repousse ce retour.',
            'Le Cube de l’infini s’ouvre et se referme comme les autres objets : un appui ouvre sa fiche, un nouvel appui la ferme (souris comme tactile).',
            'Dans le coffre, les noms des équipements ne sont plus écrits sur les cases : ils cachaient l’image. Clique sur un objet pour connaître son nom.'
          ]},
          {menu:'machine', titre:'Machine temporelle', points:[
            'Le bandeau (chiffres et barres) est posé au-dessus du jeu : quand une barre d’énergie, de magie ou de 3e ressource apparaît ou disparaît, il glisse par-dessus la page sans jamais la pousser ni la faire défiler, ni sur PC ni sur téléphone (y compris en retirant l’énergie ou la magie dans la Machine temporelle). Seules la barre de vie et les autres barres bougent.',
            'Quand on tue des boss très vite, la mort et l’apparition du suivant ne se jouent plus deux fois par-dessus l’autre ; le tas d’Or de la machine temporelle grossit exactement à chaque unité (M, B, T, Sx, Oc, Vg, Uvg, Tvg…).',
            'Machine temporelle : les barres sont maintenant aussi fluides que dans les autres menus (60 images par seconde au lieu de 45 à 50) : les tubes de verre ne ralentissent plus la page, et la barre ne recule plus quand le moteur répond après un clic : elle rejoint sa vraie valeur en douceur, même si tu cliques en rafale.',
            'Machine temporelle : les pièces d’or sortent maintenant en file régulière, toutes de la même façon (plus aucune pièce qui fait des haut-bas), et le tas d’Or sous la goulotte grossit avec le butin : dix tas différents, d’un petit tas à une grosse pile.',
            'Quand tu places ou retires de l’Énergie ou de la Magie, les barres et les comptes à rebours ne font plus de petit retour en arrière : ils restent fluides.',
            'Sous la barre de chaque colonne, le prix en Or du niveau suivant est affiché et se met à jour à chaque niveau gagné.'
          ]},
          {menu:'ngu', titre:'NGU', points:[
            'Dans le NGU de magie, les aurores boréales ont de vrais rideaux courbes et lumineux, au lieu de bandes droites. Les étoiles apparaissent en fondu quand tu places de la magie, et elles scintillent.'
          ]},
          {menu:'yggdrasil', titre:'Yggdrasil', points:[
            'Quand tu manges un fruit, un seul fruit reste : il grossit en plein écran, hors du cadre, puis disparaît en fondu ; les autres rétrécissent.',
            'Le bouton Activer reste grisé tant que l’Énergie ou la Magie nécessaire n’est pas générée et disponible dans la barre du haut ; il se dégrise tout seul dès qu’il y en a assez. Quand il coûte de la Magie, il prend une teinte bleutée, comme le fond de la carte.',
            'Quand tu manges un fruit, on entend la mâche des fruits complets, qui rétrécissent un à un, à tour de rôle ; le fruit qui pousse encore rétrécit seulement jusqu’à disparaître, sans bruit. Quand tu les transformes en graines, seuls les fruits complets se défont en mini particules qui tombent au sol.',
            'Les cadres d’image des fruits sont maintenant carrés et montrent l’arbre en entier, du tronc aux feuilles, au lieu de couper les côtés.',
            'Les décors des fruits sont maintenant de grands arbres, et la terre au sol a disparu. Les fruits poussent sur l’arbre, à taille normale : une heure de croissance de plus fait pousser un fruit de plus (à 10 h, dix fruits mûrs ; à 9 h 50, neuf mûrs et un dixième encore en train de pousser). Ils sont répartis au hasard dans le feuillage, un peu penchés et de tailles légèrement différentes, pour que l’arbre ait l’air naturel.',
            'Les fruits mûrs, prêts à être récoltés, ont une aura douce de leur couleur sur l’arbre ; le fruit qui pousse encore n’en a pas. Le cadre d’un fruit ne brille plus que lorsque ce fruit a atteint son palier maximum, d’une lueur douce de sa couleur.',
            'Un fruit déjà mûr ne change jamais de place sur l’arbre, et chaque nouveau fruit apparaît loin des autres : l’arbre se remplit partout, sans amas.'
          ]},
          {menu:'wandoos', titre:'Wandoos', points:[
            'Au démarrage de l’ordinateur, l’écran de chargement ne bouge plus quand les messages changent : le logo, la barre et le pourcentage restent bien en place, c’est lisible.'
          ]}
          ,{menu:'chroniques', titre:'Chroniques', points:[
            'Album de collection des boss, refait comme une vraie farde noire à anneaux : fermée à l’arrivée (le logo du jeu sur sa couverture), elle s’ouvre d’un clic. 9 cartes par page, deux pages de cartes de face ouvertes sur PC et une seule page sur téléphone ; la première page est un grand dessin en 9 cartes qui se complète au fil des boss vaincus (on voit le dos des cartes pas encore gagnées). On gagne la carte d’un boss en le vainquant une première fois ; les nouvelles cartes restent invisibles tant qu’elles ne sont pas rangées, puis s’annoncent, se rejoignent en paquet et se glissent une à une dans leur pochette.',
            'Dans la Collection, les boss sont rangés dans un album de collection, chaque carte glissée dans sa pochette en plastique. Un clic : la carte sort de sa pochette et vient en zoom sur l’écran ; tu peux la faire tourner au doigt ou à la souris.',
            'L’album de collection des boss a des pages : des boutons (ou un glissement du doigt) tournent la page autour des anneaux du classeur, sur téléphone comme sur PC.',
            'Dans l’album des boss, on change de page au-dessus comme en dessous du livre : une flèche pour avancer d’une page, une autre pour avancer de 10 pages, avec 10 feuilles qui tournent en même temps. Le livre s’ouvre en refaisant à l’envers le geste de sa fermeture, les feuilles passent au-dessus des anneaux (qu’on voit à travers leurs trous), les cartes ne bougent plus à la fin d’un tour de page, et le dos de la première feuille ne montre que les cartes du grand dessin déjà gagnées.',
            'L’album des boss garde exactement la même taille sur toutes ses pages, y compris la dernière (les emplacements libres sont de vraies pochettes vides, la carte s’y glisse) ; plus rien ne bouge pendant un saut de pages, la page ne défile plus toute seule quand on ouvre la couverture, et l’anneau ne disparaît plus.'
          ]}
        ]
      },
      {
        version:'4.2',
        nom:'Sans réseau',
        date:'2026-10-28',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Dans « En direct », une victoire sur un boss s’écrit maintenant « Sébastien a battu Ent après 3 essais » : le nombre de fois où le joueur a lancé le combat avant de le vaincre (« du premier coup » s’il a gagné du premier essai).',
            'Les chiffres sont partout plus lisibles : le 7 ne ressemble plus à un 1 (cadres du haut, compteurs, niveaux, prix, barres). Tous les nombres du jeu ont un 1 avec un drapeau et un 7 bien droit.',
            'Le jeu se rouvre et se joue maintenant sans internet : la page, le moteur et ta partie sont gardés sur l’appareil, et la partie est envoyée au serveur dès que la connexion revient. Ouvre le jeu au moins une fois avec internet pour que tout soit prêt.',
            'Les craquements des sons sont traités : tous les sons du jeu partagent désormais un seul flux audio, au lieu d’en ouvrir plusieurs qui se disputaient la carte son.',
            'La fenêtre « Nouveau menu débloqué ! » n’apparaît que la toute première fois. Après un Rebirth, un menu qui revient fait seulement clignoter son bouton avec les trois petits bips.',
            'Les boutons du menu se déplacent sans à-coups : pendant que tu glisses un bouton, la barre se fige au lieu de trembler, et le jeu ne recalcule plus la page à chaque mouvement du doigt.',
            'Pendant une étape du tutoriel où il faut cliquer sur un élément, plus rien d’autre ne réagit : même le bouton de lecture d’une chronique ne peut plus lancer sa voix et interrompre le guide.',
            'Toutes les parties sont maintenant sauvegardées chaque jour sur le serveur (une copie par jour, gardée 30 jours), en plus des copies de chaque joueur.',
            'Confidentialité : la liste des joueurs du serveur n’est plus envoyée à ton appareil avec le catalogue du jeu. Seules tes propres données y sont.',
            'Quand une barre de magie ou d’énergie disparaît (ou revient), la page où tu te trouves ne bouge plus du tout, même tout en haut : le bandeau et le menu sont maintenant indépendants.',
            'Quand une barre d’énergie ou de magie disparaît, il ne reste plus jamais de grand espace vide en haut de la page : la page ne saute pas au moment où la barre part, puis elle remonte doucement une fois le bandeau stable.'
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Dans la liste des zones d’Aventure, chaque ligne a sa personnalité : une icône (un feu de camp pour la Zone sûre, un rat pour la Zone Tutoriel, un alligator pour les Égouts…) et pour texture le décor de la zone vers laquelle elle mène, teinté à sa couleur. On repère les zones d’un coup d’œil.',
            'Un clic sur un objet de la langue de la valise (potion, effet en cours, graines, Poop…) ouvre une fenêtre qui dit ce qu’il fait ; une potion peut y être utilisée.'
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Cinq nouvelles morts de boss : éboulement, poussière, fonte, foudre et enfoncement, chacune avec son propre son. Quand un combat dure au moins 5 secondes, la mort du boss est tirée au hasard parmi elles et l’éclatement en pixels, jamais deux fois la même d’affilée.',
            'Cinq nouvelles morts du joueur : cendres, trou noir, vitre brisée, tranché et âme, chacune avec son propre son. Elles s’ajoutent aux trois déjà là et sont tirées au hasard, jamais deux fois la même d’affilée.',
            'Quand tu ouvres la chronique d’un boss, elle s’affiche maintenant comme une carte à collectionner : le nom en haut, l’illustration, les capacités, l’histoire en italique et, dans le coin, son attaque et sa vie. La fiche d’un boss dans la Collection a la même carte. Sa couleur suit l’illustration du boss (bleu, rouge, vert, noir, blanc, ou or quand deux couleurs dominent). L’illustration du boss s’affiche en entier (la carte est plus haute). Un tap dessus retourne la carte, qui montre son dos ; un autre tap la remet à l’endroit. Des flèches sur les côtés passent au boss découvert précédent ou suivant, et la carte passe au-dessus du jeu, qui est flouté autour.'
          ]},
          {menu:'challenges', titre:'Défis', points:[
            'Le menu Défis n’apparaît qu’après 3 minutes de run, et un défi ne peut plus être lancé avant : lancer un défi te fait renaître, ce qui n’est pas permis avant 3 minutes.'
          ]},
          {menu:'ngu', titre:'NGU', points:[
            'Dans chaque barre, le bouton « Max » ne dépasse plus de son cadre sur téléphone.'
          ]},
          {menu:'yggdrasil', titre:'Yggdrasil', points:[
            'Les portes s’ouvrent d’un seul mouvement, sans petits à-coups : une seule accélération du début à la fin.',
            'La lueur autour du tas de terre est deux fois moins forte, et elle entoure maintenant le tas des deux côtés : au-dessus comme en dessous.'
          ]},
          {menu:'shop', titre:'Boutique', points:[
            'Ce menu s’appelle maintenant « Boutique » : dans l’annonce de déblocage comme sur son bouton.'
          ]}
        ]
      }
  ]);
})();
