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
  window.__SOREAL_IDLE_RELEASE_NOTES_V1__={
    courante:'5.6',
    /* Hommage (Norman, 2026-10-08) : une ligne en bas de CHAQUE note de mise à jour, à conserver dans toutes les versions à venir. */
    hommage:'🐾 En hommage à Grizboule',
    versions:[
      {
        version:'5.6',
        nom:'Une télé d’un autre temps',
        date:'2026-11-11',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Au rechargement du jeu, les dernières secondes de progression (Or, niveaux, barres) ne sont plus perdues : la partie gardée sur l’appareil est maintenant bien reprise quand elle est plus récente que celle du serveur.',
            'Les barres qui coûtent de l’Or ne reculent plus au démarrage : l’heure du calcul est suivie sans à-coup, et un Or encore inconnu ne fige plus la barre.',
            'La barre des menus ne bouge plus quand tu cliques sur un bouton d’une page dont les lignes changent de texte : chaque ligne réserve désormais sa place, plus aucun saut.',
            'La page ne fait plus de saut quand une barre d’énergie ou de magie du haut disparaît ou revient (par exemple après avoir tout dépensé d’un coup) : le bandeau et son décalage changent en même temps.',
            'Les barres d’énergie et de magie du haut ne clignotent plus quand tu dépenses tout d’un coup : elles ne disparaissent que si elles restent vraiment vides (plus de flash du fond ni des écritures).',
            'Tous les textes du jeu changent de police : fini l’écriture « traitement de texte », place à une police de jeu vidéo plus nette et plus lisible, la même que celle des Chroniques et des Réglages.',
            'Les Réglages sont entièrement refaits, dans un style jeu vidéo : plaques d’acier colorées pour chaque catégorie (Mon jeu, Profil, Audio, Affichage, Ma partie, Infos), cadres, icônes dessinées, interrupteurs à levier, curseurs de volume et gros boutons lisibles. Le son et l’image sont maintenant deux catégories séparées, et les sections de test de développement ont disparu.'
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'En Aventure, la fenêtre de statistiques affiche maintenant directement le total (Puissance, Endurance, PV Max, Regen), en vert quand tu as des bonus, au lieu de la base avec l’équipement et le Cube entre parenthèses. Un petit « i » à côté de chaque statistique ouvre le détail : la base, l’équipement, le Cube, puis chaque source de bonus avec son multiplicateur.'
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Quand tu gagnes un combat, la borne joue soit les yeux contents (arcs heureux ou cœurs), soit la vague, mais plus les deux à la suite : la victoire est bien plus courte et le nom du boss suivant arrive plus vite.',
            'La vague de victoire sur la borne est refaite en vrai ras de marée : un mur d’eau haut qui déferle de gauche à droite avec sa crête de mousse, qui porte le mot VICTOIRE ! avant de se retirer.',
            'Les yeux de la borne ont de nouvelles animations. Quand tu perds un combat, ils jouent au hasard l’une de ces fins : explosion, spirale hypnotique, larmes, télé qui s’éteint ou croix. Quand tu gagnes : les yeux en U à l’envers ou qui se transforment peu à peu en cœurs. Les larmes, la vague, FIGHT !, VICTOIRE ! et K.O. sont accélérés de moitié. Et après deux minutes sans rien faire sur le combat de boss, une mouche vient les embêter.'
          ]},
          {menu:'challenges', titre:'Défis', points:[
            'Dans un défi, les récompenses parlent maintenant de labos au lieu de Diggers (bonus global des labos, emplacement de labo).'
          ]},
          {menu:'chroniques', titre:'Chroniques', points:[
            'Dans l’onglet Équipement, chaque objet déjà découvert (boosts compris) a le même bouton de filtre que le Coffre : un objet filtré n’est plus ramassé en Aventure. La liste est la même que celle du Coffre. Un boost filtré part directement dans le Cube si tu as acheté l’option. Disponible une fois le filtre amélioré acheté.'
          ]},
          {menu:'machine', titre:'Machine temporelle', points:[
            'Les deux ronds du haut des tours Énergie et Magie reprennent le même baromètre que la machine centrale : graduations de 0 à 50, aiguille dorée qui suit la vitesse de la barre, et bulle de verre par-dessus le rouage ou l’orbe qui tourne toujours derrière.',
            'Le baromètre de la machine centrale est refait : graduations de 0 à 50 tics avec leurs chiffres (la zone chaude en orange), une aiguille dorée de machine à remonter le temps, et le tout sous une bulle de verre bombée avec son reflet.',
            'L’écran du monstre de la Machine temporelle a un vrai effet de tube cathodique : vitre bombée, couleurs légèrement décalées vers les bords, lignes de balayage douces, reflet sur la vitre et bords sombres, à la place de l’ancienne grille de points.',
            'Dans la Machine temporelle, la tour Magie a maintenant le même alignement des textes que la tour Énergie (afficheurs, ligne Cible, boutons + − Max 0 bien centrés), et la vitesse et le multiplicateur de la machine centrale sont centrés en hauteur.',
            'Les pièces de la Machine temporelle tombent maintenant de l’arrière du décor : elles sortent de derrière le haut du réceptacle noir au lieu d’apparaître en plein milieu.',
            'L’écran du monstre de la Machine temporelle est maintenant en couleurs, avec l’aspect d’une vraie télé cathodique : couleurs un peu délavées, image légèrement floue, petits points rouges, verts et bleus, lignes de balayage, coins arrondis et bords sombres, plus les interférences.'
          ]}
        ]
      },
      {
        version:'5.5',
        nom:'Une version sans fausse alerte',
        date:'2026-11-10',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Les sons d’ambiance et les musiques de menu s’arrêtent dès que tu quittes le jeu (changement d’appli, écran éteint) : plus de lecteur multimédia qui reste affiché sur le téléphone. Ils repartent quand tu reviens.',
            'La bannière « Nouvelle version disponible » ne revient plus toutes les 3 minutes alors que rien n’a changé : elle n’apparaît que si une vraie nouvelle version est sortie.'
          ]},
          {menu:'shop', titre:'Boutique', points:[
            'L’image de l’« emplacement de labo » dans la boutique est maintenant une fiole au lieu d’une pelle.'
          ]},
          {menu:'avance', titre:'Entraînement avancé', points:[
            'Son bouton de menu passe à un mélange de rose et de mauve : il ne ressemble plus à ses voisins.',
            'Quand « Faire suivre l’énergie » est cochée, le compteur « Énergie placée » de chaque ligne se met maintenant à jour tout de suite quand l’énergie passe à la ligne suivante, au lieu d’attendre ton prochain clic.',
            'Chaque ligne de l’Entraînement avancé a un bouton « Max » : il place sur cette compétence toute l’énergie idle disponible.'
          ]},
          {menu:'machine', titre:'Machine temporelle', points:[
            'L’écran du monstre de la Machine temporelle devient une télé en noir et blanc : l’image remplit tout le cadre et subit des interférences (bandes qui décalent l’image, grain, lignes de balayage).',
            'Les tours Énergie et Magie sont un peu réduites et mieux placées : leurs connecteurs sont maintenant en face de ceux de la machine centrale.',
            'La Machine temporelle a un nouveau décor : le liquide des tubes d’Énergie et de Magie et l’image du monstre passent derrière le cadre de la machine, qui leur sert de filtre, et remplissent toute leur ouverture (de tout en bas à tout en haut).'
          ]}
        ]
      },
      {
        version:'5.4',
        nom:'Les monstres reviennent',
        date:'2026-11-09',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Dans le tutoriel, Cthulhu n’a plus de voix : son texte s’écrit lettre après lettre avec un petit bip, comme dans les vieux jeux, et il suffit de toucher l’écran pour passer au texte suivant (« Touchez l’écran » apparaît quand la phrase est finie).',
            'Le cadre qui contient tous les menus ne bouge plus quand tu passes d’une page longue à une page courte : la place de la barre de défilement est toujours réservée.'
          ]},
          {menu:'shop', titre:'Boutique', points:[
            'Un consommable acheté ne s’utilise plus à l’achat : il est mis de côté et attend que tu décides de l’utiliser, comme les potions.'
          ]},
          {menu:'challenges', titre:'Défis', points:[
            'Lancer un défi joue maintenant la même animation que la Renaissance : l’horloge qui fonce vers l’écran, l’éclair, puis l’arrivée sur la borne de combat.',
            'Le bouton « Jouer » d’un défi est grisé tant que les 3 minutes de la partie ne sont pas passées (avec le temps restant), puis il s’allume tout seul, comme la Renaissance. Plus de bruit de machine sans que le défi se lance.'
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Sur téléphone, le défilement de la page et de la barre de menus démarre plus vite : seul un doigt posé sur une case d’objet ou sur le Cube attend l’écran, le reste de l’écran répond tout de suite.',
            'Les monstres d’Aventure dont le nom a changé (« Un slime métallique », « 743 poulets furax »…) retrouvent leur image.',
            'Dans tout le jeu, une image qui n’arrive pas (un monstre en Aventure, un boss, un décor…) est redemandée toute seule trois fois, après 1,5, 4 puis 9 secondes, au lieu de rester vide jusqu’à ce que tu changes d’onglet.'
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'Dans les difficultés supérieures, les images des boss sont de nouveau celles de ta difficulté au lieu de l’image normale.',
            'Boss 106 : une fois visible derrière sa mort, le boss suivant n’a plus sa scène d’apparition ; le fait qu’il soit derrière l’autre image suffit.'
          ]},
          {menu:'machine', titre:'Machine temporelle', points:[
            'Les pelles deviennent des scientifiques partout : récompenses des défis, boutiques (« emplacement de labo »), phrases d’« En direct », menu et Machine temporelle. Seuls les textes lus pendant les défis gardent leurs anciens mots.',
            'Après une renaissance, le niveau de la Machine temporelle ne recule plus pendant la première seconde quand tu mets de l’énergie : il n’affiche plus un niveau de trop pendant quelques images.'
          ]},
          {menu:'entrainement', titre:'Entraînement de base', points:[
            'Quand toutes les barres sont allumées, l’allumage du menu ne fait plus un énorme bruit : seul le son de la plus grosse barre est joué.'
          ]},
          {menu:'yggdrasil', titre:'Yggdrasil', points:[
            'Sur téléphone, la page ne saute plus quand un fruit devient mûr : l’aperçu de ce qu’il donne se pose sur son image au lieu d’agrandir la carte, et « Récolter » n’est plus coupé.',
            'Le cadre « Manger / récolter tous les fruits » est maintenant en haut de la page, juste sous tes compteurs de graines, et ses boutons tiennent sur une seule ligne.'
          ]},
          {menu:'diggers', titre:'Labos', points:[
            'Sur un bouton grisé (« Améliorer le labo », « Ouvrir le labo »), le prix reste bien lisible : fond plus sombre, lettres plus grosses, et l’unité (Qi, K…) a la même couleur claire que le reste du prix.',
            'Le bouton « Au maximum » est toujours cliquable, même quand le niveau actif est déjà au niveau maximal : il remet le plus haut niveau que ton or supporte.',
            'Un labo n’apparaît plus avant que le système dont il porte le nom soit débloqué.'
          ]},
          {menu:'chroniques', titre:'Chroniques', points:[
            'Quand tu zoomes sur une carte, les lettres des grands nombres (Tvg, Uvg…) sont en couleur, comme quand la carte est rangée dans l’album.',
            'Sur téléphone, les pages de l’album tournent en glissant à plat vers la gauche, plus vite et sans pivot en 3D : bien moins de choses à redessiner. Sur PC, le tour de page ne change pas.'
          ]}
          ,{menu:'renaissance', titre:'Renaissance', points:[
            'Le menu Renaissance apparaît tout seul à la fin des 3 minutes de la partie, sans avoir besoin de cliquer sur un autre menu.'
          ]}
        ]
      },
      {
        version:'5.3',
        nom:'Des cartes avec leurs textes',
        date:'2026-11-08',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Admin : dans la fenêtre « Voix » d’un guide du tutoriel, un bouton « Tout régénérer » refait d’un coup les voix de toutes les étapes avec la voix choisie (« Lhu malicieux » d’office), sans passer étape par étape.',
            'Les 27 étapes du tutoriel de Lhu sont relues par un Lhu malicieux.',
            'Le tutoriel avec Cthulhu enchaîne plus vite : la bulle suivante arrive presque tout de suite après la voix, l’étape suivante moins d’une demi-seconde après ton clic, et ses déplacements sont plus courts.',
            'Quand tu retires toute l’énergie ou toute la magie d’une barre de tube, elle s’arrête net au lieu de continuer à monter un instant.',
            'Redimensionner la fenêtre ne provoque plus d’erreur dans les barres lumineuses.',
            'Thème Magic : 45 cartes de boss retrouvent les écritures de l’image d’origine (noms, chiffres, panneaux).'
          ]},
          {menu:'machine', titre:'Machine temporelle', points:[
            'Dans « En direct », quand un joueur règle sa Machine temporelle (il y ajoute de l’énergie ou de la magie), la phrase dit combien d’or par seconde elle produit chez lui (« 1,37 Qa d’or par seconde »).',
            'Le tas d’or sous la goulotte grossit avec l’or par seconde de la machine (B, T, Qa, Qi, Sx… par seconde) et non plus avec le butin d’une barre : dix tas différents.',
            'L’image du monstre sur l’écran de la Machine temporelle est maintenant entière et centrée : elle n’est plus agrandie ni coupée (un slime métallique apparaissait zoomé et mal placé).',
          ]},
          {menu:'diggers', titre:'Labos', points:[
            'Ce menu devient celui des Labos : chaque labo est une pièce du donjon, différente et en rapport avec ce qu’il améliore, où un savant fou brasse une potion.',
            'Au travail, le savant marche derrière l’établi et verse sa potion dans le flacon, les tubes et le bécher ; au repos, la pièce est dans la pénombre et il garde les bras baissés.',
            'La page est refaite : nom du labo, potion, effet, niveau et boutons sont posés sur la scène ; l’or par seconde consommé et les emplacements gardent leur place en haut.',
            'Dans « En direct » et dans la Machine temporelle, les phrases parlent maintenant de labos.',
            'Nouveau bouton dans la barre des menus (une fiole et un bécher qui bouillonnent quand les labos travaillent), nouveau cadre du haut et nouveau fond : violet nuit et vert des potions, plus de brun.'
          ]}
        ]
      },
      {
        version:'5.2',
        nom:'Une borne plus légère',
        date:'2026-11-07',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Admin : onze voix de Lhu (l’enfant et dix nouvelles, dont plusieurs « ados ») sont dans la liste des voix des textes et du tutoriel.',
            'Le titre « Rob Boss » d’une chronique n’est plus lu avec la voix anglaise quand le jeu est en français (le filtre vaut aussi pour les voix déclarées par la chronique).',
            'Les petits textes gris et fins sous les barres et dans les cadres de plusieurs menus sont plus lisibles : plus clairs et plus gras.',
            'La voix de secours est supprimée du jeu : seuls les textes qui ont une voix générée sont lus (les autres restent muets), et le jeu est plus fluide.',
            'Réglages : une case permet de couper les aides du tutoriel.',
            'Le tutoriel du début est entièrement refait : des bulles courtes, une idée par bulle, qui passent toutes seules.',
            'Quand le jeu est en français, le nom d’un boss écrit pareil dans les deux langues (« Rob Boss ») n’est plus lu avec la voix anglaise.',
            'Quand tu tues un boss, le suivant ne se montre plus une demi-seconde avant son animation d’arrivée, quelles que soient les images utilisées.',
            'Le moteur du jeu calcule un peu plus vite (environ 6 % de moins par action et par synchronisation).',
            'En anglais, les chroniques d’origine des boss restent affichées pour tous les boss, même quand l’un d’eux a été renommé.',
            'Un boss renommé garde son nouveau nom partout, y compris dans le journal de combat quand il apparaît comme ennemi d’Aventure (« 743 poulets furax » ne redevient plus « 743 coucous furax »).',
            'Boss 106 : derrière son animation de mort, on voit déjà la photo du boss suivant (le même boss, transformé).',
            'Dans le tutoriel de Lhu, la bulle suivante arrive dès que la voix a fini de lire (une courte respiration), au lieu d’attendre un temps fixe.',
            'Les points de vie s’écrivent toujours avec deux décimales à partir du million (2,90M et non 2,9M) : les chiffres ne bougent plus quand un zéro final apparaît ou disparaît.',
            'Quand Lhu parle de la barre verte, elle est entourée.',
            'Lhu vole (ailes qui battent) quand il retourne se poser sur la borne, au lieu de glisser debout.',
            'Après le premier boss, seule la case de l’image du boss reste noire (plus toute la borne), et le nom du boss suivant n’est plus prononcé avant le départ de Lhu.',
            'Le texte de l’introduction ne se relit plus depuis le début à chaque nouvelle image, et ce sont bien tes nouvelles voix qui sont lues (l’ancienne voix de la page pouvait démarrer avant l’arrivée des voix par image).',
          ]},
          {menu:'entrainement', titre:'Entraînement de base', points:[
            'Le menu Entraînement de base ne se rallume plus à chaque rechargement de la page : l’allumage néon n’a lieu qu’une seule fois par Renaissance.',
            'La barre d’outils du haut de l’Entraînement de base tient sur une seule ligne et reste lisible : Input, Plafond d’énergie, Idle et la carte « Énergie placée » à droite, avec des libellés et des boutons plus grands, et des crayons discrets pour tes boutons personnalisés. Sur téléphone : Input et « Énergie placée » côte à côte, puis une ligne par rangée, avec des boutons larges.',
            'Le son du néon qui s’allume est celui de toutes les barres, et il devient plus impressionnant à chaque barre suivante : plus d’amorces, un accord de plus en plus riche, une basse profonde, une montée en puissance et, pour la dernière barre, un carillon.',
            'Sous chaque barre, les textes (vitesse, Cap, prochain, temps par niveau) sont en blanc franc et en gras, bien plus faciles à lire, et le mot « Cap » reste « Cap ».',
            'L’Entraînement de base est refait : chaque barre a son emblème et son habillage, de plus en plus travaillés et de plus en plus grands à chaque barre débloquée (cadre, lueur, motif dans la barre) ; les boutons de la défense sont bleus.',
            'À la première ouverture de l’Entraînement de base après une Renaissance, toutes les barres clignotent de nouveau comme des tubes néon avant de tenir.',
            'La barre d’outils de l’Entraînement de base (saisie, plafonds, idle, énergie placée) tient maintenant sur une seule ligne.',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'À la fin du tutoriel, la partie du boss reste noire tant que Lhu n’est pas parti ; 2 secondes après son départ, le nouveau boss apparaît en fondu et sa chronique est lue en entier (avant, seul son nom était prononcé).',
            'Quand tu raccourcis le tutoriel dans l’Admin, Lhu vole tout seul près du bouton à cliquer, même si l’étape qui le plaçait a été supprimée.',
            'Les yeux de la borne qui regardent la barre de vie s’arrêtent maintenant à la fin de chaque combat, même quand tu fuis ou que le combat s’arrête sans victoire ni défaite.',
            'Ta vie (barre du haut et duel) et le texte de vie de la borne s’écrivent maintenant en nombres entiers avant le million : 1000, 10.000, 100.000, 999.999, puis 1M, 1,5M…',
            'Quand les yeux de la borne regardent ta barre de vie, ils visent le bout de la partie pleine, là où elle s’arrête : vie haute, regard vers la droite ; vie basse, vers la gauche.',
            'Quand un combat est serré, les yeux de la borne regardent la barre de vie du boss puis la tienne, plusieurs fois, sans se presser.',
            'Les yeux de la borne se rapprochent et s’éloignent : ils arrivent d’un bond depuis le fond, reculent à chaque coup reçu, se penchent vers l’écran quand le boss faiblit, viennent tout près quand il va tomber, et à la défaite les deux croix s’éloignent dans le lointain.',
            'L’écran LED de la borne demande moins de calcul à chaque image : même aspect, moins de petits à-coups en combat, surtout sur téléphone.',
            'Pendant un combat, la borne n’a plus d’animation de personnage (le bonhomme qui court, le clown, la tronçonneuse, Twin Peaks et les hommes qui rient sont retirés pour l’instant, ils reviendront plus tard) : à la place, elle a des yeux ! Ils apparaissent dès le lancement du combat et regardent la barre de vie du boss. Leur humeur suit le combat : concentrés, déterminés quand le boss faiblit, ravis quand il va tomber, inquiets puis apeurés quand ta vie baisse, avec une grimace à chaque coup reçu. Victoire : yeux heureux et étincelles. Défaite : deux croix.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Le filtre d’objets avancé du Coffre est gardé dans ton compte : si le jeu le remet à zéro par erreur, les objets que tu avais cochés sont remis tout seuls, et ils suivent aussi d’un appareil à l’autre.',
          ]},
          {menu:'renaissance', titre:'Renaissance', points:[
            'Quand tu renais, l’horloge fonce vers l’écran en emballant ses aiguilles à rebours, un éclair blanc couvre tout, puis s’ouvre en cercle sur le Combat de boss : le bord du cercle devient de plus en plus transparent, comme de la fumée.',
            'La fenêtre de Renaissance est refaite : un décor magique avec une horloge qui tourne à rebours, le nombre de fois où tu seras plus fort écrit clairement, les boss qui tombent plus vite, ce qui repart de zéro, ce qui se referme pour l’instant et ce que tu gardes.',
          ]},
          {menu:'machine', titre:'Machine temporelle', points:[
            'Les boutons « Tout retirer » s’appellent maintenant « Tout reprendre », et le mot n’est plus coupé nulle part (dans la Machine temporelle ses boutons ont aussi un fond plus sombre, plus lisible).',
            'Le « ding » qui sonnait quand une barre de la Machine temporelle gagnait un niveau est retiré.',
            'Il n’y a plus de bulles dans les tubes Énergie et Magie quand aucune ressource n’est placée dessus, même s’il reste du liquide.',
            'La Machine temporelle a ses propres sons : les boutons + (un cliquet qui monte), − (qui redescend) et Max (la machine se charge puis se cale d’un coup sourd et d’une cloche) font des bruits de mécanique bien audibles, un bouton sans effet fait un choc sourd, et un balayage suivi d’une cloche annonce un niveau gagné.',
            'Sur les tours Énergie et Magie, le mot « Allouée » est remplacé par une icône (éclair ou étoile) : le montant n’est plus coupé.',
            'La Machine temporelle change encore de look sur PC (nouvelle image) : un petit écran pour l’image du boss, avec un effet d’écran (lignes de balayage, bords sombres, bande lumineuse qui descend), et un autre écran pour son nom et son butin. Les afficheurs ont des écritures de science-fiction, inclinées, comme un écran qui saute dans le temps. Le tas d’Or en bas est maintenant un vrai tas de pièces, et chaque pièce entre par le haut de la sortie et tombe dedans. Le socle de l’Énergie n’a plus qu’un seul grand rouage, vert, et le cadran n’a plus que son aiguille.',
            'Quand tu mets de la Magie dans la Machine temporelle, la barre d’Énergie ne recule plus.',
          ]},
          {menu:'augmentations', titre:'Augmentations', points:[
            'Les barres de la page Augmentations avancent maintenant à 60 images par seconde, avec une colonne en cours qui monte en intensité de façon continue, au lieu de saccader.',
            'Une ligne dont la « Cible » est à -1 fait maintenant passer son énergie à la ligne suivante quand « Faire suivre l’énergie » est coché (jusqu’à la dernière ligne pour l’Entraînement avancé), au lieu de la garder ou de te la rendre.',
          ]},
          {menu:'avance', titre:'Entraînement avancé', points:[
            'Entraînement avancé : la case « Faire suivre l’énergie » est maintenant bien visible sous le titre (elle était cachée sous la barre d’énergie et de vie).',
            'Entraînement avancé : quand le moteur te rend l’énergie d’une compétence (cible atteinte) ou la fait passer à la suivante, « Énergie placée » se met à jour tout de suite, sans attendre un clic.',
            'Une « Cible » à -1 reste à -1 à l’écran de l’Entraînement avancé : elle s’affichait 0 alors que le jeu la gardait bien en mémoire (elle reste liée à ton compte, comme toutes les cibles).',
            'Une ligne dont la « Cible » est à -1 fait maintenant passer son énergie à la ligne suivante quand « Faire suivre l’énergie » est coché (jusqu’à la dernière ligne pour l’Entraînement avancé), au lieu de la garder ou de te la rendre.',
          ]},
          {menu:'ngu', titre:'NGU', points:[
            'Une ligne dont la « Cible » est à -1 fait maintenant passer son énergie à la ligne suivante quand « Faire suivre l’énergie » est coché (jusqu’à la dernière ligne pour l’Entraînement avancé), au lieu de la garder ou de te la rendre.',
          ]},
          {menu:'diggers', titre:'Mineurs d’or', points:[
            'Le bouton « Au maximum » met le mineur au plus haut niveau que ton or par seconde peut supporter (au lieu d’être refusé quand le niveau possédé est trop gourmand).',
            'Les boutons grisés se lisent maintenant (texte clair sur fond sombre, au lieu de gris sur gris).',
          ]},
          {menu:'sang', titre:'Magie du sang', points:[
            'Magie du sang : quand un rituel dépasse 1 niveau par seconde, l’animation de la scène ne s’arrête plus un instant à chaque synchronisation : elle reste continue.',
            'Magie du sang : le sang monte d’un seul bloc à chaque rituel accompli (60 000 d’un coup pour le bol de fil barbelé), au lieu de grimper doucement pendant toute l’animation.',
            'Magie du sang : le « Sang collecté » sous chaque rituel est maintenant exactement ce que ce rituel a rapporté (multiplicateurs compris) : leur somme égale le sang disponible, et lancer un sort remet tous ces compteurs à 0.',
          ]},
        ],
      },
      {
        version:'5.1',
        nom:'Une borne vivante',
        date:'2026-11-06',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Dans tous les menus, la page cherche beaucoup moins souvent ses éléments à chaque image (l’Entraînement de base, par exemple, ne se met plus à jour quand tu es ailleurs) : moins de petits à-coups, surtout sur téléphone.',
            'Chaque réponse du moteur est traitée plus légèrement par la page (la copie de sécurité de l’Aventure est faite seulement quand elle sert) : moins de petits à-coups au moment des synchronisations, surtout sur téléphone.',
            'Quand une information arrive dans le bandeau « En direct », l’affichage ne saccade plus : la page n’est plus recalculée en entier à ce moment-là.',
            'Le jeu calcule environ 15 % plus vite à chaque synchronisation et à chaque action : moins de petits à-coups, surtout sur les parties avancées.',
            'Dans la barre de vie, la régénération est maintenant écrite à gauche, et à droite un compte à rebours dit dans combien de temps la vie sera pleine (✔ quand elle l’est).',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'L’animation du ballon, quand le bonhomme réapparaît, est beaucoup plus brève.',
            'Quand un combat est très serré, long ou court, la borne joue maintenant une de ses animations (le clown, la tronçonneuse…) au lieu de rester sur FIGHT !. Un combat qui dure encore après quelques secondes bascule aussi sur l’animation.',
            'De temps en temps, quand tu n’as pas cliqué depuis quelques secondes, la borne a des yeux sur son écran LED : ils regardent à gauche, à droite, sont heureux, tristes, suspicieux… Un clic ou un combat les arrête.',
          ]},
          {menu:'machine', titre:'Machine temporelle', points:[
            'La Machine temporelle a un tout nouveau look : trois images, la tour Énergie (verte), la machine au centre et la tour Magie (bleue), collées bord à bord et à la bonne taille sur PC comme sur téléphone. Les engrenages s’imbriquent vraiment : chaque dent passe dans le creux du rouage voisin. La petite barre en double dans « Temps restant » est retirée, et la page est beaucoup plus légère (moitié moins d’éléments à dessiner).',
            'Les bulles des deux tubes sont dessinées d’un seul tenant au lieu d’une par une : même aspect, mais la page est plus légère à afficher, surtout sur téléphone.',
          ]},
          {menu:'augmentations', titre:'Augmentations', points:[
            'Tu peux maintenant mettre -1 dans une zone « Cible » : cette ligne est ignorée par « Faire suivre l’énergie ». Quand toutes les cibles sont atteintes ou à -1, l’énergie t’est rendue.',
          ]},
          {menu:'avance', titre:'Entraînement avancé', points:[
            'Tu peux maintenant mettre -1 dans une zone « Cible » : cette ligne est ignorée par « Faire suivre l’énergie ». Quand toutes les cibles sont atteintes ou à -1, l’énergie t’est rendue.',
          ]},
          {menu:'ngu', titre:'NGU', points:[
            'Tu peux maintenant mettre -1 dans une zone « Cible » : cette ligne est ignorée par « Faire suivre l’énergie ». Quand toutes les cibles sont atteintes ou à -1, l’énergie t’est rendue.',
          ]},
          {menu:'aventure', titre:'Aventure', points:[
            'Le kill automatique applique maintenant le filtre de butin : un objet filtré (🚫 dans le Coffre) n’entre plus dans le sac quand il tombe en kill automatique.',
            'Le filtre d’un objet précis (le bouton 🧹 du Coffre) est maintenant le même dans toutes les zones : un objet coché n’est plus ramassé nulle part et reste coché quand tu changes de zone. Tes filtres déjà réglés par zone sont réunis, rien n’est perdu.',
          ]},
        ],
      },
      {
        version:'5.0',
        nom:'Menus plus légers',
        date:'2026-11-05',
        groupes:[
          {menu:'general', titre:'Général', points:[
            'Les réglages de son (volumes, cases de son, lecture automatique de la voix) et les effets sont maintenant propres à chaque appareil : couper la musique chez toi ne la coupe plus ailleurs.',
            'Les menus s’ouvrent plus légèrement, surtout sur téléphone.',
          ]},
          {menu:'combat', titre:'Combat de boss', points:[
            'La victoire du bonhomme qui court est plus courte : elle s’arrête dès la fin des feux d’artifice.',
          ]},
          {menu:'augmentations', titre:'Augmentations', points:[
            'Comme dans NGU Idle, une Augmentation gagne au plus 50 niveaux par seconde, même avec une énorme quantité d’énergie, hors ligne comme en ligne.',
            'Les panneaux LED des barres ne sont dessinés que lorsqu’ils sont à l’écran : la page est plus fluide, au défilement comme à l’ouverture.',
          ]},
          {menu:'machine', titre:'Machine temporelle', points:[
            'Les touches R (énergie) et T (magie) arrêtent la barre de la Machine temporelle au moment du clic : elle ne continue plus d’avancer un instant, puis ne recule plus.',
            'Comme dans NGU Idle, l’Or arrive progressivement pendant la montée de niveaux : quand l’Or manque, le niveau s’achète dès qu’il est assez rentré, et le niveau affiché ne recule plus d’un cran.',
            'Comme dans NGU Idle, une barre gagne au plus 50 niveaux par seconde : le jeu tourne à 50 mises à jour par seconde, une barre ne peut pas se remplir plus d’une fois par mise à jour.',
            'À chaque passage de niveau, la barre de la Machine temporelle suit exactement le calcul du jeu : plus de saut juste après une renaissance, quand la barre va très vite.',
            'Les barres de la Machine temporelle ne reculent plus quand tu changes une allocation, même quand elles vont très vite, et les actions d’allocation sont environ un tiers plus rapides à traiter.',
            'Quand tu retires l’énergie ou la magie d’une barre (ou que tu changes sa répartition), elle s’arrête exactement à cet instant : plus de progression en trop ni de retour en arrière, dans tous les menus à répartition.',
          ]},
          {menu:'sang', titre:'Magie du sang', points:[
            'Comme dans NGU Idle, un rituel dure au moins un tick : jamais plus de 50 rituels par seconde, et le compteur ne saute plus d’un rituel quand la barre se termine pile.',
          ]},
          {menu:'ngu', titre:'NGU', points:[
            'La barre d’un NGU suit exactement le calcul du jeu : chaque niveau coûte plus que le précédent, donc elle n’avance plus trop vite pour reculer ensuite.',
          ]},
          {menu:'avance', titre:'Entraînement avancé', points:[
            'Comme dans NGU Idle, une compétence gagne au plus 50 niveaux par seconde, quel que soit le moment où la page se synchronise : la barre et le compteur donnent toujours le même résultat.',
          ]},
          {menu:'beards', titre:'Barbes', points:[
            'Une barre de Barbe ne dépasse plus 50 niveaux par seconde, même quand elle est au maximum de sa vitesse.',
          ]},
          {menu:'hacks', titre:'Hacks', points:[
            'Un Hack gagne au plus un niveau par tick (50 par seconde), comme dans NGU Idle, même avec un très gros débit de Ressource 3.',
          ]},
          {menu:'wishes', titre:'Wishes', points:[
            'Un Wish qui accélère les Wishes joue dès qu’il gagne un niveau, et non à la synchronisation suivante : le résultat ne dépend plus du moment où la page se met à jour.',
          ]},
          {menu:'wandoos', titre:'Wandoos', points:[
            'Pendant le démarrage de l’OS, la barre de niveau suit la montée progressive de la vitesse comme le jeu : le niveau affiché ne retarde plus sur le niveau réel.',
          ]},
          {menu:'wandoos', titre:'Wandoos', points:[
            'La barre orange de chargement de l’OS ne saute plus quand une barre de niveau avance : ses rayures défilent sans interruption.',
          ]},
          {menu:'yggdrasil', titre:'Yggdrasil', points:[
            'Quand tu ne peux pas encore acheter une amélioration, une fenêtre t’explique le prérequis, avec un son d’échec.',
          ]},
        ],
      }
    ].concat(window.__SOREAL_IDLE_RELEASE_NOTES_ANCIENNES_V1__||[])
  };
})();
