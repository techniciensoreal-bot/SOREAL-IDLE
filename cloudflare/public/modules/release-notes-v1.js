/*
 * Notes de mise à jour de SOREAL IDLE (Norman, 2026-09-25) : « à partir de maintenant tu incrémenteras 1.1, 1.2, 1.3… avec un petit nom qui
 * représente la mise à jour ; dans Settings, une "Note de mise à jour" avec un résumé de ce que la version apporte ».
 *
 * RÈGLE : à CHAQUE mise à jour visible par les joueurs, ajouter une entrée EN TÊTE de `versions` (numéro suivant, petit nom, date, résumé) et
 * mettre `courante` à jour. Texte destiné aux joueurs : AUCUN spoil (ne jamais nommer un système encore verrouillé ni un total caché).
 */
(function(){
  'use strict';
  window.__SOREAL_IDLE_RELEASE_NOTES_V1__={
    courante:'2.6',
    versions:[
      {
        version:'2.6',
        nom:'Boss vaincu, pour de bon',
        date:'2026-09-26',
        points:[
          'Correction : quand tu battais un boss, l’écran « Boss vaincu » pouvait être suivi, quelques secondes plus tard, du même boss revenu à pleine vie. La victoire est maintenant toujours validée avant de passer au boss suivant.',
          'Le jeu laisse le temps au serveur de confirmer le coup fatal au lieu d’arrêter son combat trop tôt.',
          'Si la confirmation tarde vraiment, l’écran se met à jour tout seul après quelques secondes au lieu de rester bloqué.'
        ]
      },
      {
        version:'2.5',
        nom:'Le doigt sur le bouton',
        date:'2026-09-26',
        points:[
          'Tutoriel du début : à la page Basic Training, le bouton + d’Attaque passive clignote pour te montrer où cliquer. Il faut cliquer dessus pour passer à la suite, il n’y a plus de bouton « Passer » à cette page.',
          'Ensuite le bouton − clignote, mais tu n’es pas obligé de l’utiliser. Plus loin, à la page Défense, c’est le + de Blocage qui clignote.',
          'La voix dit maintenant « Vazi » au lieu de « Vas i-grec ».'
        ]
      },
      {
        version:'2.4',
        nom:'Trois petits sons',
        date:'2026-09-26',
        points:[
          'Les boutons + , − et Cap de Basic Training ont chacun leur petit son : un « bloup » qui monte pour ajouter de l’énergie, un « bloup » qui redescend pour la retirer, et une charge qui monte suivie d’un « ding » pour Cap.',
          'Le son ne se joue que si l’énergie affectée change vraiment.',
          'Comme les autres sons du jeu, ils se coupent d’eux-mêmes quand tu enchaînes les clics : jamais d’empilement.'
        ]
      },
      {
        version:'2.3',
        nom:'Fuite et nouveaux menus',
        date:'2026-09-26',
        points:[
          'Quand tu prends la fuite, l’image du boss ne se recharge plus et son bruit d’arrivée ne se rejoue plus : un petit son de défaite comique marque la fuite.',
          'Chaque nouveau menu débloqué est annoncé par un message qui apparaît et disparaît, avec un petit bruit de victoire différent de celui des boss.',
          'Le message ne peut pas être cliqué : il ne gêne jamais le jeu.'
        ]
      },
      {
        version:'2.2',
        nom:'La voix et le tuto au poil',
        date:'2026-09-26',
        points:[
          'Tutoriel du début : sur PC, la première page montre la barre verte tout en haut avec les cases en dessous, la fenêtre est centrée comme sur téléphone, et la page Fight Boss place la fenêtre juste sous le bouton Fight.',
          'Le tutoriel ne repart plus de la première page quand tu cliques ailleurs sans l’avoir fermé.',
          'Voix : Norman se prononce enfin « Normanne », les points de suspension marquent une vraie pause, Fight Boss est mieux prononcé et le titre « Norman & Sébastien » n’est plus lu.',
          'Une phrase de Norman & Sébastien a été réécrite, et le passage au boss suivant après une victoire est plus fiable.'
        ]
      },
      {
        version:'2.1',
        nom:'Le tutoriel qui guide',
        date:'2026-09-26',
        points:[
          'Le tutoriel du début se place tout seul : le jeu ouvre le bon menu et fait défiler l’écran vers ce dont Norman & Sébastien parlent.',
          'La fenêtre d’explication se pose juste à côté de l’élément concerné, sans le cacher, sur PC comme sur téléphone.',
          'Tu peux toujours la déplacer à la main : elle ne bouge plus avant la page suivante.'
        ]
      },
      {
        version:'2.0',
        nom:'Le Puits qui rote',
        date:'2026-09-26',
        points:[
          'Des phrases humoristiques en français accompagnent maintenant certains tirages de récompenses.',
          'Sur la page de ces tirages, les deux boutons passent sous l’illustration, chacun sur la moitié de sa largeur.',
          'Le texte du prix gagné est enfin lisible : foncé sur fond jaune.',
          'Les temps de recharge de ces tirages suivent exactement ceux du jeu d’origine.'
        ]
      },
      {
        version:'1.9',
        nom:'Le détail du calcul',
        date:'2026-09-26',
        points:[
          'Touche la case Attack ou Defense en haut de l’écran : le calcul complet s’affiche, facteur par facteur (Basic Training et bonus actifs).',
          'Le détail se met à jour en direct pendant que tu t’entraînes, et ne montre que les bonus réellement actifs.',
          'Ces chiffres sont exactement ceux que le jeu utilise en combat : ils servent à comparer ta progression avec le jeu d’origine.'
        ]
      },
      {
        version:'1.8',
        nom:'Signaler un bug',
        date:'2026-09-26',
        points:[
          'Nouveau bouton « Signaler un bug » dans Settings : écris ce qui ne va pas, ton message est envoyé à Norman. Le bouton reste grisé tant que le message est vide.',
          'Les boutons + , − et Cap de Basic Training sont plus grands et colorés (vert, rouge, bleu) pour qu’on voie tout de suite où ça se passe.',
          'La version du jeu et le menu ouvert sont ajoutés automatiquement à ton message.'
        ]
      },
      {
        version:'1.7',
        nom:'Boutons réactifs',
        date:'2026-09-26',
        points:[
          'Les boutons répondent dès le premier clic : une action envoyée pendant qu’une autre est en cours n’est plus perdue, elle est mise en file. Un double clic reste un seul achat.',
          'Les fenêtres de nouveauté d’un menu n’ont plus qu’un bouton : « Continuer ».',
          'Un système avancé n’affiche plus que les bonus qu’il t’a apportés depuis le début de la partie, au lieu de la ligne de ressources.',
          'Textes retouchés : « Appuie sur Fight », Coffre, Basic Training (la ligne « Cap : … · prochain : … » est plus grande) ; le bloc Equipment Bonuses du bas de l’Aventure est retiré.'
        ]
      },
      {
        version:'1.6',
        nom:'Sets & Annonces',
        date:'2026-09-26',
        points:[
          'Quand tu complètes un set, une annonce apparaît en fondu (sans cliquer) et confirme le bonus obtenu.',
          'Dans la Collection, l’onglet Sets met le bonus du set bien en évidence : doré tant qu’il n’est pas obtenu, vert une fois obtenu.',
          'Quand ton Tutorial Cube devient l’Infinity Cube, une annonce t’explique ce qui vient de se passer.',
          'Les flèches gauche / droite des zones sont aussi efficaces que le menu déroulant : changer de zone en plein combat l’interrompt.',
          'Comparer refonctionne à la souris sur PC.'
        ]
      },
      {
        version:'1.5',
        nom:'L’équipe s’invite',
        date:'2026-09-26',
        points:[
          'Des visages familiers apparaissent parmi les ennemis : ils portent les prénoms de l’équipe, avec leur avatar. La liste grandit toute seule avec l’équipe (à découvrir en jeu).',
          'Les décors Level 1 à Level 6 des profils servent de fond et changent au fil de la progression.',
          'Norman et Sébastien y sont toujours.'
        ]
      },
      {
        version:'1.4',
        nom:'Menus, Voix & Filtres',
        date:'2026-09-26',
        points:[
          'Dans le menu, les boutons qui ne font pas progresser le jeu (Collection, Chat…) sont maintenant tout à droite, juste avant Settings, à l’écart des systèmes qui le font. Si tu as rangé tes boutons toi-même, ton ordre est conservé.',
          'La voix ne prononce plus « astérisque » : les bruitages comme *BLOUM* sont lus comme un mot. Le son d’introduction et les récits concernés ont été refaits.',
          'Les fenêtres de statistiques des objets sont plus compactes. La comparaison fonctionne maintenant sur téléphone : la première fenêtre s’efface pendant que tu choisis le deuxième objet, puis les deux s’affichent l’une sous l’autre.',
          'Sur PC, la fenêtre d’un objet n’apparaît plus instantanément au survol : il faut laisser la souris immobile 1 seconde.',
          'Les filtres de butin sont maintenant propres à chaque zone : en changeant de zone, le filtre de cette zone s’affiche et s’applique. Tes anciens réglages servent de point de départ à toutes les zones.',
          'Quand tu absorbes des boosts en maintenant A, l’écran ne saute plus vers le haut avant de revenir à sa place.'
        ]
      },
      {
        version:'1.3',
        nom:'Fidèle au wiki',
        date:'2026-09-25',
        points:[
          'Certaines options (Perks, Quirks, Wishes) ne sont plus achetables que dans la difficulté prévue par le wiki. Ce que tu as déjà acheté est conservé, mais reste inactif tant que la difficulté requise n’est pas atteinte.',
          'Plusieurs valeurs corrigées d’après le wiki : niveaux et effets de quelques Wishes, gain d’or d’un objet d’aventure et une valeur de combat.',
          'De nouveaux fruits deviennent disponibles dans Yggdrasil quand leur système est débloqué.',
          'Les Special Boosts se comportent comme dans le jeu d’origine : ils apportent des points qui remplissent les Specials d’un objet dans l’ordre de sa fiche, et tous les Specials d’un objet (y compris ceux des accessoires) montent maintenant. Les objets déjà en sac ne perdent rien.',
          'Un bonus d’objet qui n’était pas encore branché est maintenant actif.',
          'Nouveau slot d’équipement pour certaines armes, quand les conditions du jeu sont remplies.'
        ]
      },
      {
        version:'1.2',
        nom:'Armures & Portraits',
        date:'2026-09-25',
        points:[
          'Quand tu portes les 4 pièces d’un même set (tête, torse, jambes, bottes), quel que soit leur niveau, ton héros prend automatiquement l’apparence de ce set. Retire une pièce et ton portrait choisi revient.',
          'Le choix des portraits (Achievements) montre maintenant l’image de chaque portrait.',
          'Quand l’image d’un objet manque, un emoji s’affiche à sa place, bien grand et centré dans sa case ; s’il y en a plusieurs, ils sont réduits pour tenir tous dans la case.'
        ]
      },
      {
        version:'1.1',
        nom:'Le Chat',
        date:'2026-09-25',
        points:[
          'Le Chat SOREAL est dans le jeu : c’est le même que dans APP et TV, celui où tout le monde parle.',
          'Nouveau bouton « 💬 Chat » dans le menu : il ouvre le chat par-dessus le jeu, sans quitter ta partie. Un badge rouge indique les messages non lus.',
          'Bouton « 🟢 N en ligne » : la liste des personnes en ligne et hors ligne, comme dans APP et TV.',
          'Le chat du jeu est en texte ; les photos et les messages vocaux restent à voir dans APP ou TV.',
          'Disponible quand SOREAL IDLE est ouvert depuis APP ou TV.'
        ]
      },
      {
        version:'1.0',
        nom:'Shop & Rangement',
        date:'2026-09-25',
        points:[
          'Les deux boutiques sont réunies dans un seul menu « Shop », avec un onglet par boutique (EXP Shop par défaut, Boutique AP en un clic).',
          'Menu réorganisable : maintiens ton doigt (ou la souris) sur un bouton pour passer en mode « Rangement des boutons », glisse-le entre deux autres, puis valide.',
          'Les offres du jeu (offres débutant, Special Prize, prix du Daily Spin) ont désormais toutes la même étiquette dorée en pointillés.',
          'Special Prize : deux choix, 50 000 AP ou un joli chaton (avec les 50 000 AP en plus).',
          'Voix des popups d’information : la lecture automatique démarre et enchaîne sans délai, sans boucle.',
          'Infobulle d’énergie comme dans NGU, avec les raccourcis R (récupérer l’énergie) et T (la magie, une fois débloquée).',
          'Une case du coffre au trésor accueille le Tutorial Cube une fois maxxé.',
          'Version affichée : Beta 1.0.'
        ]
      },
      {
        version:'0.9',
        nom:'Confort de jeu',
        date:'2026-09-25',
        points:[
          'Barre d’énergie : le tick garde une vitesse constante, et un compteur « Pleine dans… » indique quand elle sera pleine.',
          'Le plafond d’énergie au Rebirth compte toute l’énergie obtenue pendant le run, comme dans NGU.',
          'Attack et Defense repartent à 100 après un Rebirth ; les popups déjà vus reviennent après une réinitialisation complète.',
          'Inventaire : la page ne saute plus quand tu utilises A / D / Q / W / E.',
          'Collection : cartes de boss épurées et cliquables.',
          'Barres au plafond (CAP) affichées pleines, comme dans NGU.'
        ]
      },
      {
        version:'0.8',
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
        version:'0.7',
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
