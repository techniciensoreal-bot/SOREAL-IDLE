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
    courante:'6.8',
    versions:[
      {
        version:'6.8',
        nom:'Statistiques du Cube, plus lisibles',
        date:'2026-09-29',
        points:[
          'Le cadre de statistiques en mode Aventure n’affiche plus « (+0 cube) » quand la contribution du Cube est trop petite pour se voir arrondie.',
          'Le vrai bonus s’affiche toujours normalement dès qu’il est assez grand pour compter.',
          'Aucun autre changement sur ce cadre.'
        ]
      },
      {
        version:'6.7',
        nom:'Énergie et Magie, sans à-coups',
        date:'2026-09-29',
        points:[
          'La barre d’Énergie et la barre de Magie ne tiquent plus : elles se remplissent et se vident simplement, sans à-coups.',
          'Fini le petit bond répété qui touchait le haut de la barre puis repartait d’un coup.',
          'Le remplissage reste progressif à chaque énergie gagnée, juste sans cette animation en dents de scie.'
        ]
      },
      {
        version:'6.6',
        nom:'Une seule et même interface',
        date:'2026-09-29',
        points:[
          'Augmentations utilise maintenant les mêmes boutons, la même taille et la même animation que Basic Training, avec les mêmes raccourcis Energy Cap / Idle.',
          'Un autre écran d’allocation garde son apparence actuelle, mais répond désormais aussi vite que Basic Training, avec le même son et la même animation sur les chiffres alloués.',
          'Blood Magic ne fonctionnait pas correctement : refait avec les mêmes commandes que Basic Training, plus un bouton Cap/+/− sur chaque rituel.',
          'Basic Training, Augmentations et Blood Magic affichent maintenant le temps restant avant le prochain niveau ou rituel.'
        ]
      },
      {
        version:'6.5',
        nom:'Magie, la barre reprend vie',
        date:'2026-09-29',
        points:[
          'La barre de Magie se remplit désormais progressivement, comme la barre d’Énergie, au lieu d’avancer par à-coups.',
          'Les infobulles d’Énergie et de Magie précisent maintenant clairement que le nombre affiché n’est pas un plafond absolu.',
          'Ces infobulles indiquent les vrais moyens d’aller plus haut : dépenser de l’EXP pour du Plafond, ou obtenir des Perks/Quirks/Souhaits.'
        ]
      },
      {
        version:'6.4',
        nom:'L’aventure continue, pour de vrai cette fois',
        date:'2026-09-29',
        points:[
          'Le combat automatique d’Aventure pendant ton absence, annoncé la dernière fois, restait silencieux : il farme désormais vraiment.',
          'L’or, l’expérience et les butins récoltés pendant ton absence sont bien crédités à ton retour.',
          'Le récit d’une défaite pendant ton absence (le monstre, la zone) s’affiche enfin correctement dans le journal de combat.'
        ]
      },
      {
        version:'6.3',
        nom:'L’aventure continue sans toi',
        date:'2026-09-29',
        points:[
          'Le combat automatique d’Aventure continue de farmer pendant ton absence, dans la limite de 8 heures.',
          'Les butins récupérés pendant l’absence s’arrêtent avant de trop remplir ton sac, pour toujours garder de la place.',
          'Si le combat aurait mal tourné pendant ton absence, tu le retrouveras raconté dans le journal de combat à ton retour.'
        ]
      },
      {
        version:'6.2',
        nom:'Forêt, la tenue au grand complet',
        date:'2026-09-29',
        points:[
          'Le portrait automatique du set Forêt évolue maintenant avec le niveau de l’équipement porté.',
          'Les 5 pièces à niveau 50 minimum débloquent une nouvelle variante du portrait.',
          'Les 5 pièces au niveau 100 débloquent la variante la plus avancée.'
        ]
      },
      {
        version:'6.1',
        nom:'Objets, l’image retrouvée',
        date:'2026-09-29',
        points:[
          'Certains objets spéciaux d’Aventure affichaient un simple symbole au lieu de leur vraie image, même quand elle existait bien : corrigé.',
          'Sur ordinateur, les statistiques d’un objet s’affichent désormais instantanément au survol de la souris.',
          'Cette nouvelle bulle d’info se place intelligemment autour de l’objet pour ne jamais le cacher ni rester sous le curseur.'
        ]
      },
      {
        version:'6.0',
        nom:'Magie, les bonnes infos',
        date:'2026-09-29',
        points:[
          'La bulle d’info au survol de la barre Magie affichait par erreur les mêmes chiffres que l’Énergie : elle montre maintenant ses propres chiffres (plafond, production, vitesse).',
          'Raccourci rappelé au survol : T récupère toute la Magie allouée dans toutes les fonctions.',
          'Petits ajustements supplémentaires sur l’affichage des ressources.'
        ]
      },
      {
        version:'5.9',
        nom:'Les images d’objets retrouvées',
        date:'2026-09-28',
        points:[
          'Correction de la recherche d’image de certains objets spéciaux, qui pouvait manquer une image pourtant bien ajoutée.',
          'Les objets spéciaux sont désormais reconnus par leur identifiant exact plutôt que par leur nom seul.',
          'Petits ajustements supplémentaires sur l’affichage des objets.'
        ]
      },
      {
        version:'5.8',
        nom:'La voix se lance plus tôt',
        date:'2026-09-28',
        points:[
          'Le début de la voix de la scène spéciale du boss 18 démarre nettement plus vite.',
          'Optimisation du préchargement de la narration entre deux étapes.',
          'Petits ajustements supplémentaires sur la synthèse vocale.'
        ]
      },
      {
        version:'5.7',
        nom:'On reprend le bon rythme',
        date:'2026-09-28',
        points:[
          'Correction d’un défilement trop rapide de la scène spéciale du boss 18 quand la voix ne joue pas.',
          'Le texte reste maintenant affiché assez longtemps pour être lu, même sans voix.',
          'Réglages fins supplémentaires sur le rythme de cette scène.'
        ]
      },
      {
        version:'5.6',
        nom:'Un peu de patience visuelle',
        date:'2026-09-28',
        points:[
          'Un indicateur de chargement tourne désormais pendant les temps d’attente de la scène spéciale du boss 18.',
          'L’écran ne semble plus figé le temps que l’image et la voix arrivent.',
          'Petits ajustements visuels supplémentaires.'
        ]
      },
      {
        version:'5.5',
        nom:'Ça répond au doigt et à l’œil',
        date:'2026-09-27',
        points:[
          'Les boutons +, − et Max des Augmentations réagissent maintenant instantanément, avec le même son que Basic Training.',
          'Le chiffre d’énergie placée bouge sans attendre la réponse du serveur.',
          'Petites optimisations internes sur les allocations d’énergie.'
        ]
      },
      {
        version:'5.4',
        nom:'Plus vite, sans coupure',
        date:'2026-09-27',
        points:[
          'La voix de la scène spéciale du boss 18 démarre beaucoup plus vite (voix préchargée à l’avance).',
          'Plus de long silence entre deux images de cette scène une fois la lecture terminée.',
          'Petites optimisations internes de la narration vocale.'
        ]
      },
      {
        version:'5.3',
        nom:'Pendant ton absence, pour de vrai',
        date:'2026-09-27',
        points:[
          'Le popup de résumé au retour affiche maintenant la vraie énergie produite pendant ton absence.',
          'Nettoyage visuel du badge de récompense en bas de Fight Boss.',
          'Un nouvel outil (administrateur) permet de revoir une scène spéciale déjà vue pour vérifier un correctif.'
        ]
      },
      {
        version:'5.2',
        nom:'Silence sur les parenthèses',
        date:'2026-09-27',
        points:[
          'Le narrateur ne lit plus jamais le texte entre parenthèses.',
          'Correction d’une scène qui pouvait perdre sa synchronisation image/texte.',
          'Une scène spéciale ou l’introduction interrompue en cours de route sera rejouée depuis le tout début au prochain lancement.',
          'Correction d’un débordement de l’interface sur la droite qui pouvait couper certains boutons (dont Paramètres).'
        ]
      },
      {
        version:'5.1',
        nom:'Ça continue même caché',
        date:'2026-09-27',
        points:[
          'Le combat automatique d’Aventure ne s’arrête plus quand l’application passe en arrière-plan (écran éteint, autre appli au premier plan).',
          'Tant que l’application reste ouverte en arrière-plan, tu continues de progresser et de looter normalement.',
          'Rien ne change si l’application est complètement fermée : la progression reprend à la reconnexion, comme avant.'
        ]
      },
      {
        version:'5.0',
        nom:'Le résumé de ton absence',
        date:'2026-09-27',
        points:[
          'Relancer le jeu affiche maintenant un popup qui résume ce que tu as eu pendant ton absence : EXP, AP, boss battus, dégâts, objets obtenus...',
          'Ce popup reste affiché jusqu’à ce que tu cliques sur « Fermer » — il ne disparaît plus seul.',
          'Il n’apparaît que s’il y a vraiment quelque chose à raconter : pas de popup vide pour un simple rechargement.'
        ]
      },
      {
        version:'4.9',
        nom:'Dix façons de gagner',
        date:'2026-09-27',
        points:[
          'Vaincre un boss en Fight Boss joue maintenant l’un de dix sons de victoire différents, chacun à son tour.',
          'Une fois les dix entendus, le cycle recommence au premier — jamais deux fois le même son de suite.',
          'La mémoire de ce cycle vit sur ton appareil, comme pour les sons d’apparition des boss.'
        ]
      },
      {
        version:'4.8',
        nom:'Puissance, Endurance, Regen PV',
        date:'2026-09-27',
        points:[
          'Le Money Pit et la Roue quotidienne ont désormais leur propre son quand on y joue.',
          'Les sons d’ambiance trop faibles sont maintenant vraiment amplifiés (pas seulement moins coupés) ; les sons trop forts restent réduits comme avant.',
          '« Power », « Toughness » et « HP Regen » sont traduits en français (Puissance, Endurance, Regen PV) partout dans les statistiques d’objet et d’Aventure.'
        ]
      },
      {
        version:'4.7',
        nom:'Plus de saut ni de clignotement',
        date:'2026-09-27',
        points:[
          'Ouvrir ou fermer le Coffre ne fait plus sauter la page.',
          'Cocher un filtre de butin, ou changer un réglage d’Automatisation de l’inventaire, ne recharge plus toute la page.',
          'Changer d’onglet (Collection, Shop), rouvrir les Notes de mise à jour ou l’encart Infos : même chose, plus de saut.'
        ]
      },
      {
        version:'4.6',
        nom:'Un son pour la collection complète',
        date:'2026-09-27',
        points:[
          'Compléter un set d’objets déclenche maintenant un petit son de victoire, en même temps que l’annonce à l’écran.',
          'Ce son est nouveau : différent de celui d’un boss vaincu ou d’un menu débloqué.',
          'Rien d’autre ne change : l’annonce du bonus obtenu reste identique.'
        ]
      },
      {
        version:'4.5',
        nom:'Entendu une fois, jamais deux',
        date:'2026-09-27',
        points:[
          'Correction : l’histoire d’un boss pouvait se relancer depuis le début après un Rebirth si elle avait été interrompue avant la fin la fois précédente. Elle ne se relance plus automatiquement, quoi qu’il arrive, une fois entendue.',
          'Le bouton « Lire la chronique » reste toujours disponible pour la réécouter à la demande.',
          'Le badge doré « Boss de zone » sur l’image du monstre, en Aventure, tient maintenant sur une seule ligne.'
        ]
      },
      {
        version:'4.4',
        nom:'Même volume pour tous',
        date:'2026-09-27',
        points:[
          'Les sons d’ambiance en Aventure sont désormais compensés automatiquement pour sonner à un niveau comparable, quel que soit le fichier joué.',
          'Le curseur « Ambiance » des Paramètres continue de régler le volume global par-dessus, identique pour tous les sons.',
          'Rien à faire de ton côté : la compensation se calcule toute seule au premier passage de chaque fichier.'
        ]
      },
      {
        version:'4.3',
        nom:'Une couronne, un seul son',
        date:'2026-09-27',
        points:[
          'En Aventure, le boss de zone se distingue maintenant par une petite couronne dorée devant son nom, sur une seule ligne.',
          'Les sons d’ambiance en Aventure ne se superposent plus : un seul à la fois, jamais deux en même temps.',
          'Le silence occasionnel entre deux sons d’ambiance reste rare, comme avant.'
        ]
      },
      {
        version:'4.2',
        nom:'Achète où tu en as besoin',
        date:'2026-09-27',
        points:[
          'Dans Automatisation de l’inventaire, certaines améliorations verrouillées (Auto Merge, Filtre de butin basique, Filtre de butin amélioré) ont maintenant un bouton « Acheter » directement sur place.',
          'Le bouton achète exactement la même chose que dans la boutique correspondante, au même prix.',
          'Les améliorations disponibles à plusieurs endroits différents, ou obtenues par un Challenge, restent indiquées en texte comme avant.'
        ]
      },
      {
        version:'4.1',
        nom:'Le journal n’oublie plus',
        date:'2026-09-27',
        points:[
          'Une mort en Aventure pendant un combat automatique (en ligne comme hors ligne) apparaît maintenant dans le journal de combat, comme une mort en combat manuel.',
          'Avant ce correctif, seule une mort vue en direct était notée : une défaite pendant ton absence passait inaperçue dans le journal.',
          'Plusieurs défaites automatiques d’affilée sont résumées en une seule ligne, avec leur nombre.'
        ]
      },
      {
        version:'4.0',
        nom:'Rangé par zone',
        date:'2026-09-27',
        points:[
          'Le Coffre trie maintenant ses cases dans l’ordre des zones d’Adventure.',
          'À l’intérieur d’une même zone, l’ordre suit le type de pièce : arme, tête, torse, jambes, bottes, puis accessoires.',
          'Volume d’ambiance et de voix par défaut ajustés pour un rendu plus discret dès la première ouverture.'
        ]
      },
      {
        version:'3.9',
        nom:'Petit et bien rangé',
        date:'2026-09-27',
        points:[
          'La fenêtre d’explication se réduit en petite bulle quand tu cliques en dehors : la voix continue de parler, et rien n’est bloqué pendant ce temps. Reclique dessus pour la remettre à sa taille normale.',
          'Correction : Settings pouvait déborder sur la droite de l’écran sur certains comptes.',
          'En Zone Tutoriel, une phrase au-dessus du sac rappelle comment équiper, fusionner et booster tes objets.'
        ]
      },
      {
        version:'3.8',
        nom:'Silence, on écoute',
        date:'2026-09-27',
        points:[
          'Le narrateur ne dit plus "Chronique du boss" avant de raconter une histoire de boss : redondant avec le nom qui suit juste après.',
          'Ce titre reste affiché à l’écran, seule la voix change.',
          'Vrai partout où une histoire de boss est racontée : à la rencontre, en relisant la fiche d’un boss, et dans "Lire toute l’histoire".'
        ]
      },
      {
        version:'3.7',
        nom:'Clic, clic, boss !',
        date:'2026-09-27',
        points:[
          'En Fight Boss, la régénération de PV affichée à côté des barres de vie n’a plus de chiffre après la virgule.',
          'Le portrait du joueur en Fight Boss a maintenant des coins arrondis, comme celui du boss.',
          'Le prochain boss apparaît plus vite après une victoire.',
          'Les voix des boss se relancent bien après une réinitialisation complète de la partie.',
          'La narration du boss « Une Petite Souris » a été retouchée.',
          'Deux parties de comparaison pendant le développement (invisibles pour les joueurs) sont de retour.'
        ]
      },
      {
        version:'3.6',
        nom:'Absence contrôlée',
        date:'2026-09-27',
        points:[
          'Une nouvelle option de combat automatique permet d’engager, en ligne comme hors ligne, certains adversaires déjà avancés que tu es assez fort pour vaincre.',
          'Certains systèmes de fin de partie continuent de progresser même quand tu n’y es pas, hors ligne compris, dès que tu es assez puissant.',
          'Basic Training rattrape maintenant une absence aussi longue que les autres systèmes du jeu.'
        ]
      },
      {
        version:'3.5',
        nom:'Ça tinte',
        date:'2026-09-26',
        points:[
          'Le menu Achievements n’apparaît qu’à ton premier succès débloqué.',
          'Chaque achat dans la boutique d’EXP fait maintenant tinter un tas de pièces d’or.',
          'Une autre boutique a son propre bruit d’achat : un carillon de cristal, comme une pierre précieuse qu’on fait tinter.',
          'Le bruit d’achat de la boutique d’EXP se fait maintenant bien entendre (le son n’était pas déclenché).',
          'Les chiffres de vie du duel ne dépassent plus de leur pastille, même avec de très grands nombres.',
          'La narration du boss « Une Petite Souris » se lit maintenant en entier.',
          'Équiper un objet fait maintenant un bruit : froissement de sangle, cliquetis de boucle et petit « toc ».',
          'Les joueurs de SOREAL sont toujours vus « Pseudo (Prénom) » ; les autres joueurs par leur pseudo, ou par le prénom de leur compte Google s’ils n’en ont pas choisi.',
          'Ton pseudo remplace « Joueur » au-dessus de ton portrait dans Fight Boss.',
          'En aventure, le nom du monstre (boss de zone compris) tient sur une seule ligne.',
          'En aventure, chaque bouton d’attaque, de défense et de bonus a son propre bruit (coup d’épée, parade, bouclier, soin, rugissement…).',
          'Un double tap sur une pièce équipée applique tes boosts dessus, comme A + clic sur ordinateur.',
          'Le zoom (pincement, double tap) est désactivé.',
          'La barre verte n’a plus l’éclat blanc qui la traversait à chaque tick.',
          'Toutes les fenêtres d’explication des nouveaux menus sont maintenant lues par la voix pré-enregistrée (plus de ralentissement ni d’erreur).'
        ]
      },
      {
        version:'3.4',
        nom:'Ça sent la bagarre',
        date:'2026-09-26',
        points:[
          'Quand un combat commence, le bruit est plus en rapport : deux lames qui s’entrechoquent, trois coups de tambour de guerre, puis un appel de cuivres.',
          'Les chiffres de vie sous les images du combat de boss sont bien plus beaux : pastille brillante et barre épaisse avec reflet.',
          'Le bouton Adventure clignote en rouge quand on est mis K.O. en aventure, pour indiquer qu’il faut relancer une zone.',
          'La zone d’entraînement s’appelle maintenant « Zone Tutoriel ».',
          'Dans les fenêtres d’explication, un titre répété (comme « Le NOMBRE ») n’est plus relu à chaque page : la voix ne le dit qu’au début.',
          'L’encart « Magie — aucun sort appris » qui apparaissait pendant le combat de boss est retiré : il n’y a pas de sorts à lancer en plein combat.'
        ]
      },
      {
        version:'3.3',
        nom:'Une voix plus claire',
        date:'2026-09-26',
        points:[
          'La voix de Tom est plus stable et un peu plus lente, et toutes les voix sont enregistrées en meilleure qualité : plus d’effet « quelque chose dans la gorge ».',
          'Le nom du jeu est prononcé comme il se doit : « Soréalle Ailledeulle ».',
          'Après le popup du sandwich, une voix se lance en arrière-plan… et une dame a un petit mot à dire.',
          'Le son quand on perd un combat est plus adapté : un coup sourd, puis une petite mélodie triste qui redescend.'
        ]
      },
      {
        version:'3.2',
        nom:'Un cri, une berceuse',
        date:'2026-09-26',
        points:[
          'Le premier bruit de boss ne garde que les quatre coups d’archet aigus du début.',
          'Le bourdon et la petite comptine qui les accompagnaient forment maintenant un boss à part entière : la boîte à musique. Elle remplace le dixième bruit.',
          'SOREAL IDLE peut désormais s’installer comme une vraie application (icône, plein écran) depuis ton navigateur.'
        ]
      },
      {
        version:'3.1',
        nom:'Dix boss, dix cris',
        date:'2026-09-26',
        points:[
          'Chaque nouveau boss a son propre bruit d’apparition : dix sons différents (film d’horreur, glas, rugissement, cor de guerre, battements de cœur, orgue, tonnerre, sirène, chœur fantôme, portail). Une fois les dix entendus, on repart du premier.',
          'Quand tu fuis, le bruit du boss n’est plus rejoué : il ne se joue que pour un nouveau boss.',
          'Quand tu renais, un bruit de machine à voyager dans le temps t’accompagne.'
        ]
      },
      {
        version:'3.0',
        nom:'Un seul gong',
        date:'2026-09-26',
        points:[
          'Le bruit d’apparition d’un boss ne se joue plus qu’une seule fois.',
          'Auparavant, l’image du boss se rechargeait une seconde fois juste après son apparition et relançait le son : c’est corrigé.',
          'Rappel : ton pseudo se choisit dans Settings, section Profil.'
        ]
      },
      {
        version:'2.9',
        nom:'Ton nom, ton pseudo',
        date:'2026-09-26',
        points:[
          'Nouveau dans Settings : une section Profil pour choisir ton pseudo (3 à 20 caractères, unique). C’est le nom que les autres joueurs verront.',
          'Si tu joues depuis SOREAL APP ou TV, ton prénom reste affiché entre parenthèses à côté de ton pseudo.',
          'Ton pseudo est gardé même si tu réinitialises ta partie.'
        ]
      },
      {
        version:'2.8',
        nom:'Frissons et petits détails',
        date:'2026-09-26',
        points:[
          'Le badge tout en haut du jeu affiche maintenant le vrai numéro de version (Beta 2.8).',
          'Quand un boss apparaît, le bruit devient une petite scène de film d’horreur : bourdon grave, coups d’archet aigus et une comptine de boîte à musique qui grince.',
          'Un petit son doux et agréable accompagne chaque changement de menu.',
          'Quand tu ajoutes de l’énergie avec + (ou Cap), le chiffre « Énergie affectée » gonfle une fois pour te montrer que c’est bien pris en compte.',
          'Tutoriel : sur la page qui parle de la grosse barre verte, c’est elle qui clignote.',
          'La voix IA automatique est activée de base ; tu peux toujours la couper, ton choix est retenu.',
          'Automatisation de l’inventaire : les noms cités correspondent maintenant à ceux du jeu (Boutique EXP, Boutique AP, menus Shop, Perks, Quirks, Challenges).'
        ]
      },
      {
        version:'2.7',
        nom:'Ça sonne, ça brille',
        date:'2026-09-26',
        points:[
          'Chaque achat fait maintenant le bruit d’une caisse enregistreuse : le tiroir qui claque, puis le petit « ding ». Un achat refusé reste silencieux.',
          'Quand tu débloques un succès, une annonce apparaît puis disparaît toute seule, avec sa couleur, son emoji et une petite fanfare.',
          'La page Achievements est plus vivante : chaque catégorie a son emoji et sa couleur.',
          'Tutoriel : pendant la page Objectif, les cases Attack et Defense clignotent, et le résumé du haut est réorganisé (Nombre, Rebirths, Attack, Defense, Gold, EXP, Run).',
          'La fenêtre qui commente ton premier boss vaincu se place en bas de l’écran pour ne pas gêner les annonces, et la voix dit « expérience » au lieu de « expe ».'
        ]
      },
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
