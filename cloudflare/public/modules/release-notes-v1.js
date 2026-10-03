/*
 * Notes de mise à jour de SOREAL IDLE (Norman, 2026-09-25 ; refonte 2026-10-02).
 *
 * UNE entrée PAR JOUR, qui reprend tout ce qui a été fait ce jour-là. Numérotation : le premier jour (2026-09-23) vaut 1.0, puis +0.1 par jour
 * (1.1, 1.2, … 1.9, 2.0…). La plus récente est EN TÊTE de `versions`.
 *
 * RÈGLE (Norman, 2026-10-02) : on ne touche PAS au numéro de Beta ni aux notes à chaque publication. C’est Norman qui dit quand mettre à jour :
 * alors seulement, ajouter (ou compléter) l’entrée du jour et mettre `courante` à jour. Texte destiné aux joueurs : AUCUN spoil (ne jamais nommer un
 * système encore verrouillé ni un total caché).
 */
(function(){
  'use strict';
  window.__SOREAL_IDLE_RELEASE_NOTES_V1__={
    courante:'2.0',
    versions:[
      {
        version:'2.0',
        nom:'Des chronos exacts, des combats plus vivants',
        date:'2026-10-03',
        points:[
          'Le serveur répond environ dix fois plus vite à chaque synchro (de 1 à 4 secondes avant, bien moins d’une demi-seconde maintenant) : il recalcule beaucoup moins de choses à chaque appel.',
          'Tous les chronos sont calés sur l’heure du serveur, plus sur celle de ton téléphone : barres et comptes à rebours restent exacts, ne se figent plus après une synchro, ne reculent plus quand la page se redessine, et le jeu se resynchronise dès que tu reviens sur l’onglet.',
          'Correctif important : la régénération de ta vie tient de nouveau compte de tous tes multiplicateurs. Avant, elle était des milliards de fois trop faible côté serveur : la barre montait à l’écran puis retombait à chaque synchro. Elle monte maintenant jusqu’au bout.',
          'Fight Boss : les images s’animent pendant le combat (élans, secousses, halo rouge), d’autant plus fort que la vie d’un des deux combattants baisse. Barres de vie refaites avec dégradés, reflets et alertes. Le bouton Fight reste grisé tant que le serveur n’a pas validé le combat. Plus de boss sauté ni de retour en arrière après une victoire. En Aventure, la barre de l’ennemi est rouge.',
          'L’Or d’un niveau gagné est retiré tout de suite du compteur du haut de page, qui reste le seul compteur d’Or de la page.',
          'Basic Training : la compétence suivante apparaît en grisé avec son seul prérequis, et la case Synchro garde son état après un Rebirth.',
          'Inventaire : le tri classe aussi les boosts par numéro croissant dans leur catégorie, et place côte à côte les objets de même nom. Trier ne fait plus clignoter la page (on ne voit plus le haut de l’écran une fraction de seconde).',
          'Augmentations : « il manque de l’Or » est jugé avec ton Or du moment ; la barre reste pleine à la fin d’un niveau et repart dès que l’Or suffit. Même logique pour les autres barres qui dépensent de l’Or.',
          'Le jeu retente tout seul une synchro qui échoue (réseau instable) et force une synchro si l’état du serveur tarde trop à arriver.',
          'Détails d’affichage : cases du Coffre plus petites avec l’image pleine case, texte du prix lisible dans le menu des récompenses d’Or, et boutons de ce menu grisés tant qu’ils ne sont pas prêts.',
          'Le bandeau « En direct » annonce l’article acheté par les autres joueurs, la durée du run lors d’un Rebirth et les récompenses de connexion récupérées ; les longs messages du chat y passent en entier. Le chat reste collé aux derniers messages.',
          'Des récompenses de connexion mensuelles apparaissent dans un menu une fois découvert : une case par jour du mois, qui s’allument une à une. Plus tu enchaînes les jours, plus c’est généreux ; rater un jour te ramène à la première case. Les jours 1 et 2 d’octobre sont offerts à tous.',
          'Le menu des récompenses d’Or est plus clair : « Ton prix » juste sous les boutons, puis le bonus des jours cumulés avec le total d’AP obtenus depuis le début, puis deux cadres repliables (un par liste de récompenses), de 20 lignes par page, avec des pages pour les plus anciennes.',
          'Les popups d’objet s’ouvrent après une demi-seconde de survol, au lieu de s’ouvrir dès que la souris passe dessus.',
          'Le coffre a maintenant une recherche : tape un nom d’objet ou une statistique (par exemple Magic Power) et seuls les objets correspondants restent affichés.',
          'Popup des objets : l’intitulé de chaque statistique a la couleur du boost qui la remplit (orange pour la puissance et les PV max, bleu pour l’endurance et la régénération, jaune pour les spéciaux).',
          'Les boutons prêts à servir brillent de façon bien visible (dans le menu comme dans la page), un nouveau son de clochettes de vieux magasin accueille dans la boutique, et la machine à Or gagne sa barre qui se remplit au rythme de ses remplissages par seconde ; ses chiffres se mettent à jour en direct.'
        ]
      },
      {
        version:'1.9',
        nom:'Plus léger, plus vivant, plus sonore',
        date:'2026-10-02',
        points:[
          'Le jeu envoie beaucoup moins de données à chaque action : les réponses du serveur sont environ dix fois plus légères, donc plus rapides, surtout sur téléphone.',
          'Combats : les ennemis les plus coriaces se combattent dans la scène d’Aventure ; lancer un défi te fait renaître comme un vrai Rebirth ; après un Rebirth, certains menus et zones se referment tant que tu n’as pas retué les boss qui les ouvrent, comme dans le jeu d’origine.',
          'La régénération de PV en Fight Boss tient compte de tous tes bonus, et les chiffres de vie restent fixes (deux décimales), avec la régénération en petit vert lumineux à droite des cadres, qui font la largeur des portraits.',
          'L’entraînement avancé est refait comme dans le jeu d’origine (une ligne par compétence, Target, « Advance Energy »). Nouveau rayon « Toc » dans la boutique EXP avec le tri de l’inventaire (20 EXP) et « Synchro Basic Training » : une case sous Input place l’énergie en même temps dans les deux compétences d’une paire.',
          'Le bandeau « En direct » ne montre que ce qui se passe réellement en direct : chaque information entre à l’instant où elle arrive et ne passe qu’une fois. Il annonce aussi les connexions, les défis lancés, les sets complétés et les achats en boutique.',
          'Trois barres de son dans les Paramètres (voix, ambiance, sons de l’interface), à 75 % de base, avec une case à cocher pour couper chacune complètement.',
          'Dans les champs Input et Target, un clic sélectionne tout le nombre. Le Coffre est épuré : l’image remplit toute la case, avec seulement le niveau, la coche et le nom par-dessus.',
          'Les menus sont plus colorés, avec plus d’emojis et des noms en français ; un menu a retrouvé les couleurs du jeu d’origine.',
          'Pendant un défi ou après un Rebirth, les chroniques et histoires de boss déjà rencontrés ne sont plus relues automatiquement ; quand un objet n’absorbe aucun boost, un message t’explique pourquoi.'
        ]
      },
      {
        version:'1.8',
        nom:'Un jeu vivant et lisible',
        date:'2026-10-01',
        points:[
          'Un bandeau « En direct » en bas de l’écran annonce ce que font les autres joueurs (boss vaincus pour la première fois, trophées, farm…) et les messages du chat. Chaque information ne passe qu’une fois, en fondu.',
          'Le chat est maintenant une vraie page du menu, avec l’activité des joueurs au-dessus.',
          'Une bannière t’invite à rafraîchir la page quand une nouvelle version du jeu est disponible.',
          'Tous les menus ont leur propre décor, et les cases fixes du haut prennent les couleurs de la page ouverte.',
          'Les textes sont plus grands et plus lisibles sur téléphone, et les barres de vie du combat n’affichent plus que les PV, en plus gros.',
          'Une allocation d’énergie ou de magie n’est plus jamais annulée par une mise à jour plus ancienne, les boosts s’effacent tout de suite quand tu les absorbes, et un objet qui tombe apparaît sans devoir rafraîchir.',
          'Dans l’entraînement, les compétences d’attaque (rouge) et de défense (bleu) sont clairement séparées.'
        ]
      },
      {
        version:'1.7',
        nom:'Scènes, chat et défis',
        date:'2026-09-30',
        points:[
          'Le menu Défis est refait d’après le wiki : description, restrictions réellement appliquées, condition de victoire et récompenses en français ; un défi se termine tout seul dès que son objectif est atteint, avec une annonce des récompenses.',
          'Les scènes spéciales peuvent être créées et modifiées par l’administrateur (images, textes, boss qui déclenche la scène), avec des voix d’homme et de femme dans la même histoire grâce aux balises, et un bouton pour écouter chaque étape seule. Toutes les voix ont été réenregistrées, plus naturelles.',
          'Le chat est réservé aux joueurs de SOREAL IDLE, dans le jeu. Le bouton « en ligne » montre qui joue et ce qu’il fait (un nom de zone ou de boss n’apparaît que si tu l’as déjà découvert). Le temps de jeu comparé ne compte plus que le temps où tu joues vraiment.',
          'Chaque nouveau système débloqué a son propre panneau explicatif, lu à voix haute.',
          'Les menus où l’on répartit de l’énergie ou de la magie répondent instantanément ; les clics rapprochés sont regroupés en un seul envoi.',
          'La barre de Magie se remplit vraiment au compte-goutte, comme l’Énergie ; en Aventure, les coups sont de nouveau nets.',
          'Les histoires de boss déjà entendues ne se relisent plus quand tu passes du PC au téléphone.'
        ]
      },
      {
        version:'1.6',
        nom:'Une même interface partout',
        date:'2026-09-29',
        points:[
          'Augmentations, Blood Magic et les autres écrans d’allocation reprennent les boutons, la taille, le son, l’animation et la réactivité de Basic Training, avec le temps restant avant le prochain niveau. Blood Magic est refait, avec un décor plus sombre et une barre de progression.',
          'Chaque menu d’allocation a un bloc « À quoi ça sert ? » qui se replie d’un clic ; les éléments encore inaccessibles n’y apparaissent pas.',
          'L’Aventure continue de farmer pendant ton absence (dans la limite de 8 heures) sans trop remplir ton sac ; une défaite pendant l’absence est racontée dans le journal de combat.',
          'La barre de Magie se remplit progressivement comme l’Énergie, et les infobulles Énergie / Magie montrent leurs vrais chiffres.',
          'Sur PC, les statistiques d’un objet s’affichent au survol, en un seul popup. Les objets spéciaux retrouvent leur vraie image, le portrait du set Forêt évolue avec le niveau de l’équipement.',
          'Nouvel achat dans la boutique EXP : un bouton « Trier » pour le sac. Un double tap sur le Cube de l’infini lui fait absorber tous les boosts.',
          'Les zones Input gardent le dernier chiffre écrit ; la barre de vie des boss redescend de façon fluide.',
          'Une nouvelle scène spéciale, avec les voix de la deuxième histoire enregistrées.'
        ]
      },
      {
        version:'1.5',
        nom:'Patience et finitions',
        date:'2026-09-28',
        points:[
          'Scène spéciale du boss 18 : un indicateur de chargement tourne pendant les attentes, la voix démarre nettement plus vite, et le texte reste affiché assez longtemps pour être lu même sans voix.',
          'Le rythme de cette scène est corrigé (défilement trop rapide quand la voix ne joue pas).',
          'La recherche d’image de certains objets spéciaux est corrigée : ils sont reconnus par leur identifiant exact.',
          'Petits ajustements d’affichage et de synthèse vocale.'
        ]
      },
      {
        version:'1.4',
        nom:'Absence contrôlée',
        date:'2026-09-27',
        points:[
          'Au retour d’une absence, un popup résume ce que tu as eu (EXP, AP, boss battus, dégâts, objets obtenus…) et reste affiché jusqu’au clic sur « Fermer ».',
          'Une option de combat automatique engage, en ligne comme hors ligne, des adversaires que tu es assez fort pour vaincre ; certains systèmes de fin de partie progressent aussi pendant ton absence, et Basic Training rattrape une absence aussi longue que les autres. Le combat automatique ne s’arrête plus quand l’application passe en arrière-plan.',
          'Les défaites automatiques apparaissent dans le journal de combat (regroupées en une ligne).',
          'Le Coffre trie ses cases par zone puis par type de pièce ; l’automatisation de l’inventaire est rangée en cartes ; le boss de zone porte une couronne dorée.',
          'Les sons d’ambiance ne se superposent plus et sont compensés pour sonner au même niveau ; nouveaux sons pour les sets complétés, le Money Pit, la roue quotidienne et dix sons de victoire différents.',
          'Plus de saut de page en ouvrant le Coffre, en cochant un filtre ou en changeant d’onglet.',
          'La voix ne lit plus le texte entre parenthèses ni « Chronique du boss » ; l’histoire d’un boss ne se relance plus après un Rebirth ; la fenêtre d’explication se réduit en petite bulle quand tu cliques en dehors.',
          'Les boutons +, − et Max des Augmentations réagissent instantanément ; « Power », « Toughness » et « HP Regen » passent en français ; le prochain boss apparaît plus vite après une victoire.'
        ]
      },
      {
        version:'1.3',
        nom:'Sons, voix et sets',
        date:'2026-09-26',
        points:[
          'Menus : les boutons qui ne font pas progresser le jeu sont à droite, avant Settings ; les fenêtres de statistiques d’objet sont plus compactes et la comparaison fonctionne sur téléphone ; les filtres de butin sont propres à chaque zone ; les boutons répondent dès le premier clic (actions mises en file).',
          'Compléter un set déclenche une annonce en fondu avec le bonus obtenu ; l’onglet Sets de la Collection le met en évidence. Des visages familiers de l’équipe apparaissent parmi les ennemis.',
          'Nouveau bouton « Signaler un bug » dans Settings ; touche Attack ou Defense pour voir le calcul complet, facteur par facteur ; ton pseudo se choisit dans Settings, section Profil ; SOREAL IDLE peut s’installer comme une application.',
          'Le tutoriel du début se place tout seul, avec des boutons qui clignotent pour te montrer où cliquer ; les voix sont améliorées (plus claires, noms mieux prononcés, plus de « astérisque »).',
          'Chaque achat fait un bruit de caisse enregistreuse ou de carillon ; équiper, ajouter ou retirer de l’énergie, perdre un combat, fuir, lancer un combat, débloquer un succès ou un menu ont chacun leur son ; chaque nouveau boss a son propre bruit d’apparition.',
          'Les chiffres de vie du duel sont plus beaux et ne dépassent plus de leur pastille ; le bouton Adventure clignote quand tu es K.O.',
          'Correction : un boss vaincu n’est plus suivi, quelques secondes plus tard, du même boss revenu à pleine vie.',
          'Le Puits rote des phrases humoristiques, avec les temps de recharge du jeu d’origine ; le zoom (pincement, double tap) est désactivé.'
        ]
      },
      {
        version:'1.2',
        nom:'Shop, Chat et confort de jeu',
        date:'2026-09-25',
        points:[
          'Les deux boutiques sont réunies dans un menu « Shop » avec un onglet par boutique ; le menu est réorganisable (maintiens un bouton pour passer en mode « Rangement des boutons »).',
          'Le Chat SOREAL est dans le jeu, avec un badge de messages non lus et la liste des personnes en ligne.',
          'Quand tu portes les 4 pièces d’un même set, ton héros prend l’apparence de ce set ; le choix des portraits montre leurs images ; un emoji remplace l’image manquante d’un objet.',
          'Barre d’énergie : le tick garde une vitesse constante, avec un compteur « Pleine dans… » ; le plafond d’énergie au Rebirth compte toute l’énergie du run, comme dans NGU ; Attack et Defense repartent à 100 après un Rebirth.',
          'Valeurs corrigées d’après le wiki : certaines options ne sont achetables que dans la difficulté prévue (ce que tu as déjà acheté est conservé), Special Boosts comme dans le jeu d’origine, nouveaux fruits disponibles selon tes systèmes.',
          'Special Prize : deux choix (50 000 AP ou un joli chaton) ; infobulle d’énergie avec les raccourcis R et T ; les voix des popups démarrent sans délai.',
          'Collection : cartes de boss épurées et cliquables ; l’inventaire ne saute plus avec A / D / Q / W / E.'
        ]
      },
      {
        version:'1.1',
        nom:'Second passage',
        date:'2026-09-24',
        points:[
          'Deuxième relecture complète des chiffres du jeu contre le wiki de NGU : écarts corrigés.',
          'Inventaire allégé, messages Aventure et Inventaire fusionnés, popup d’objet au survol sur PC, niveau affiché sur l’image des objets.',
          'Augmentations : boutons « + / − / Max » et saisie libre, comme dans Basic Training.',
          'Boutique EXP en onglets ; Boutique AP en mauve.',
          'Voix pré-enregistrées pour la narration (plus rapides et plus stables).',
          'Compteur « Généré » au-dessus de la barre d’énergie.',
          'Deux parties de comparaison pendant le développement (invisibles pour les joueurs).'
        ]
      },
      {
        version:'1.0',
        nom:'Fidélité au wiki',
        date:'2026-09-23',
        points:[
          'Relecture systématique du jeu contre le wiki de NGU : entraînement, combats, butin, équipement et boosts recalés sur les vraies valeurs.',
          'Le mode Aventure ne se fige plus, et les PV ne clignotent plus.',
          'De nombreux systèmes du jeu complétés d’après le wiki (nouveaux contenus, boutiques, réglages avancés).',
          'Aventure : image des créatures selon leur nom, zones et bestiaire vérifiés.',
          'Sécurité renforcée sur l’ensemble du site.'
        ]
      }
    ]
  };
})();
