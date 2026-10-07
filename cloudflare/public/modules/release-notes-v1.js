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
    courante:'2.4',
    versions:[
      {
        version:'2.4',
        nom:'Orage dégagé',
        date:'2026-10-07',
        points:[
          'L’orage n’a plus de pluie : il reste le ciel sombre, les éclairs, les lumières blanches et le grondement.',
          'Le cadre rouge des objets que tu as protégés est de nouveau visible, et « Transformer » annonce tout de suite que la transformation est en cours.',
          'Sur ordinateur, la grande image d’un écran de jeu ne dépasse plus la hauteur de l’écran et reste centrée.',
          'Les barres d’Augmentations et de Blood Magic, ainsi que les chronos, se calent sur l’instant exact où le serveur a calculé l’état : en ligne, elles ne repartent plus en retard à chaque synchro.',
          'Le cadre doré d’un objet sélectionné pour un échange ou une fusion est de nouveau visible.',
          'Le GPS net n’est plus affiché en double du GPS brut : il n’apparaît à part que lorsqu’une dépense vient réellement le réduire, avec l’explication de la différence.',
          'Sur la page de l’ordinateur rétro, l’énergie et la magie se placent maintenant en vraies quantités (avant, la limite était de 100 points), avec un champ de saisie : un nombre ou une fraction comme 1/4.',
          'L’ordinateur rétro affiche un court écran d’allumage une seule fois par Rebirth, puis un cadre à part montre le chargement du système (une heure après un Rebirth, moins avec certains bonus) : tu peux déjà y placer de l’énergie et de la magie, elles prennent de la vitesse au fil du chargement.',
          'La page des adversaires les plus coriaces est refaite : portrait en grand, statistiques en grosses tuiles et comparaison très lisible entre les stats conseillées et tes stats actuelles, avec un verdict pour chaque mode de combat.',
          'Les petites annonces (objets absorbés, erreurs, confirmations) apparaissent et disparaissent en fondu dans une plaque sombre à liseré doré : petites, mais faciles à lire.',
          'Ouvrir ou fermer un panneau (comme le coffre) ne redessine plus toute la page : ce que tu viens de toucher reste exactement à sa place, sans saut de page.',
          'Boutique : le rayon choisi garde un texte net et lisible, brun foncé sur fond doré, au lieu d’un contour noir qui le rendait illisible.',
          'La borne d’arcade n’a plus que trois boutons ronds, rouge, bleu et jaune : on peut les presser directement pour combattre, fuir ou lancer un Nuke, et ils s’enfoncent aussi quand tu utilises les grosses commandes en dessous. Le socle du joystick et les boutons sont centrés sur la planche.',
          'Automatisation de l’inventaire : les cases à cocher deviennent de vrais interrupteurs, à basculer vers le haut pour activer et vers le bas pour désactiver, avec une petite lumière verte quand c’est allumé. Le menu « Action au clic » disparaît.',
          'Quand la piste d’ambiance est un feu qui crépite, une lueur chaude vacille sur l’écran et éclaire les menus, comme un feu de bois dans une pièce sombre.',
          'Basic Training : quand tu places de l’énergie dans une barre qui n’en avait pas (sauf la toute première, qui allume la machine), les lumières vacillent une ou deux fois au hasard, avec le bruit d’une machine qui démarre.',
          'Blood Magic : tu peux enfin mettre de la Magic dans plusieurs rituels en même temps ; chacun garde la sienne et avance à son rythme, comme dans le jeu d’origine.',
          'Quand tu gagnes de l’or, le mot qui suit devient de plus en plus enthousiaste avec la somme : de « Bah… » jusqu’à « OH BORDEL ! », « WHOUHOU ! » et bien au-delà.',
          'Augmentations : quand tu ajoutes de l’énergie plusieurs fois de suite (par exemple 10 000 à chaque fois), la barre ne revient plus en arrière : elle garde sa place et prend simplement la nouvelle vitesse.',
          'Quand tu bats un boss, le jeu laisse d’abord partir les réglages d’énergie et de Magic en attente avant de demander confirmation au serveur, pour que le boss suivant se charge bien.',
          'Le jeu est allégé pour les téléphones : les compteurs ne se réécrivent plus à chaque image quand leur valeur n’a pas changé (environ 175 modifications de la page par seconde en moins), la barre de menus perd un flou et des ombres invisibles, et la lueur du feu est plus légère.',
          'L’ordinateur rétro : les barres de niveau avancent maintenant petit à petit, en temps réel, et le temps avant le niveau suivant se met à jour à chaque seconde. Sur ordinateur, le moniteur ne dépasse plus la hauteur de la fenêtre.',
          'Money Pit et roue : le cadre du prix change de couleur à chaque nouvelle récompense, pour bien voir la différence avec la précédente. Les cases de connexion ne rejouent plus leur animation à chaque fois : seule une case qui vient de s’allumer s’illumine.',
          'Régler un volume dans les Réglages avec le doigt ne change plus de page.',
          'L’ordinateur rétro sur téléphone : l’écran garde toujours la même taille, allumé ou éteint, n’est plus étiré vers le haut et touche maintenant les bords du téléphone. Sous chaque barre, seul le temps restant est écrit, et « Niveau de l’OS » devient « Version OS ».',
          'Fluidité sur téléphone : le menu du bas et les boutons « disponible » pulsent désormais sans forcer l’écran à se redessiner, et les barres de rang élevé restent belles mais ne bougent plus en continu sur petit écran. Ton téléphone respire, la batterie aussi.',
          'Les touches du clavier de l’ordinateur rétro font maintenant le même clic que celles de l’entraînement avancé : un bon vieux « clac » mécanique, et un « clonc » plus grave pour la barre d’espace.',
          'Aventure : un adversaire qu’on vient d’affronter ne reste plus invisible quand le serveur répond dans le désordre ; il apparaît tout de suite, sans devoir rafraîchir la page.',
        ]
      },
      {
        version:'2.3',
        nom:'Tout en direct',
        date:'2026-10-06',
        points:[
          'Les pages avec des chiffres qui évoluent se mettent à jour sans toucher aux animations ni à tes champs de saisie.',
          'Le texte de présentation d’une page ne mentionne plus que ce que tu as déjà débloqué.',
          'Plusieurs textes d’aide, les notes de mise à jour et deux listes ne nomment plus de système que tu n’as pas encore débloqué.',
          'La récompense de connexion du jour est donnée dès que tu te connectes, avec une annonce : jours consécutifs et AP récupérés.',
          'Plusieurs menus qui restaient figés se mettent maintenant à jour en direct (toutes les 4 secondes) au lieu d’attendre ta prochaine visite.',
          'La fenêtre qui annonce un système débloqué dit maintenant où le retrouver.',
          'Ce que le serveur envoie ne contient plus que ce que tu as déjà découvert : plus de listes complètes ni de noms de systèmes que tu n’as pas encore débloqués (vérifié avec un joueur neuf).',
          'Sur téléphone, les boutons + et − des listes sont plus grands et plus faciles à toucher.',
          'Quand un écran rencontre une erreur discrète, elle est maintenant notée dans le journal de fluidité au lieu d’être perdue, pour être corrigée plus vite.',
          'Une page a été entièrement refaite dans un style d’ordinateur des années 80 : écran vert qui change de couleur d’un bouton, barres à l’ancienne et un clavier dont les touches claquent.',
          'Une autre page a été entièrement refaite façon elfes : neuf éléments par page, chacun avec son image, des cadres de pierre et de feuillage et de nouveaux boutons.',
          'Quand l’ambiance sonore est un orage, le ciel s’assombrit, des éclairs suivent les coups de tonnerre et des lumières blanches éclairent tout l’écran (rien du tout si ton appareil demande moins d’animations).',
          'L’application reprend peu à peu un nouveau style, adapté à chaque menu : couleurs propres à chacun, cadres sombres, textes façon bande dessinée.',
          'Les barres de puissance changent d’aspect à chaque palier (fond de plus en plus sombre, reflets, lueur, flammes) et celles du sang saignent quand elles sont actives.',
          'Dans l’entraînement, les titres sont des bandeaux de combat : lumières éteintes sans énergie, allumées comme un néon quand on en met, avec parfois un grésillement ; + et − font un clic de clavier.',
          'La page du combat de boss devient une borne d’arcade : un grand écran où les deux combattants se font face, un joystick et six boutons.'
        ]
      },
      {
        version:'2.2',
        nom:'Des barres honnêtes, un jeu plus léger',
        date:'2026-10-05',
        points:[
          'Les barres alimentées par une ressource (Augments, machine à Or, rituels) ne rattrapent plus leur retard quand tu changes l’allocation : elles gardent leur place et adoptent la nouvelle vitesse. Le niveau se termine plus vite, mais plus jamais d’un coup : impossible de placer une grosse somme, de remplir le niveau et de la retirer.',
          'Chaque rituel affiche la Magie qui lui est allouée, avec le chiffre qui gonfle quand tu en ajoutes ou en retires. Quand tu enlèves toute la Magie, la barre du rituel s’arrête au lieu de continuer à monter, et repart de là où elle était.',
          'En combat de boss, si ta régénération dépasse les coups de l’ennemi, ta vie remonte pendant le combat : elle descend de moins en moins vite, s’arrête, puis remonte, au lieu de rester figée jusqu’à la fin.',
          'Quand le jeu te ramène en Zone sûre, la raison est maintenant écrite dans le journal d’Aventure.',
          'Sur PC, le clic droit absorbe les boosts de la même façon partout, sur un objet comme sur le cube.',
          'Le jeu est plus léger : quatre appels de moins au démarrage, plusieurs allocations d’un coup (Augments, entraînement avancé) envoyées en un seul appel, et les chiffres des barres, de l’entraînement, de l’aventure et du combat de boss ne sont plus réécrits quand rien ne change.',
          'Le menu de gauche reste sur une seule colonne, même sur un grand écran, et ses boutons prennent entièrement la couleur de leur menu (comme la Boutique), avec une couleur plus vive et une lueur quand le menu est ouvert.',
          'En English, toute l’interface passe vraiment en anglais : menus, boutons, infobulles, messages et annonces ; repasser en Français remet tout dans la langue d’origine.',
          '« En direct » indique maintenant après combien de temps un Challenge a été réussi.',
          'Un ennemi d’Aventure ne reçoit plus l’image d’un autre quand son nom est traduit (le boss du Ciel affichait l’homme-oiseau à la place des bernaches).',
          'La boutique EXP ne propose plus d’acheter plus que le maximum (Recyclage de boosts : ×1 et ×5, plus de ×10).',
          'Boutique EXP : les explications de Puissance et de Barres sont corrigées. Les Barres multiplient la génération (chaque remplissage donne autant de points que de Barres) ; la Puissance ne change pas la génération, elle amplifie l’effet de chaque point placé.',
          'La progression PP s’affiche en chiffres complets (724 124 / 1 000 000).',
          'Le maximum d’énergie affiché suit tout de suite un achat qui change le plafond (atout, boutique, équipement) : plus d’ancien chiffre ni de génération par à-coups jusqu’à la synchro suivante.',
          'L’énergie libre n’est plus bloquée au plafond de base : avec des bonus de plafond (atouts, équipement…), elle continue de se générer jusqu’au vrai plafond au lieu de retomber toute seule.',
          'La case « Ambiance » décochée coupe vraiment le son, y compris sur iPhone et iPad.',
          'Un menu a disparu : sa boutique est maintenant dans une autre page, derrière un bouton (avec « Retour » pour revenir).',
          'Augmentations : plus de petit retour en arrière du niveau ou de la barre à chaque validation du serveur (la page n’est plus redessinée en plein jeu : le serveur recale directement les barres).',
          'Le jeu ne se bloque plus quand on place d’énormes sommes d’énergie sur des barres très rapides (Augmentations) : le calcul du serveur est des centaines de fois plus rapide.',
          'Blood Magic : la Magie libre se met à jour tout de suite quand on en place.',
          'Entraînement de base : l’énergie en trop placée sur une ligne passe maintenant toujours à la ligne suivante quand elle se débloque (elle pouvait revenir dans l’énergie libre).'
        ]
      },
      {
        version:'2.1',
        nom:'Des combats qu’on voit, des barres qui montent en puissance',
        date:'2026-10-04',
        points:[
          'La tour a sa propre arène : un décor par étage, un ouvrier, un responsable ou un ancien comme ennemi (avatar grand, sans cadre, qui respire), sa barre de vie qui descend à chaque coup de poing, et le choix des étages juste en dessous. Les joueurs sont aussi des ennemis, avec un avatar chacun. Un bouton permet d’entrer dans la tour pour combattre à la chaîne. Les zones de saisie du jeu ont aussi un nouveau look.',
          'Les menus suivent l’ordre dans lequel tu les débloques ; la Boutique, les Succès, le Chat et les Réglages restent toujours à la fin, dans cet ordre (tu peux toujours les déplacer).',
          'Le magasin des Perks devient une boutique à part, en vitrines néon, avec l’image de chaque achat, une recherche et un filtre des achats abordables.',
          'Un défi en cours a maintenant son compteur : le temps écoulé depuis son lancement, en mois, semaines, jours puis heures, minutes et secondes.',
          'Le fil En direct raconte aussi les jets dans le puits (l’or jeté et la récompense) et les tours de roue, avec les récompenses nommées seulement si tu connais déjà le système concerné.',
          'Les menus suivent maintenant l’ordre dans lequel on les obtient, pour tout le monde. Ton ancien rangement a été remis à zéro une seule fois : tu peux réarranger les boutons à ta façon, et ton rangement sera conservé.',
          'Les tuiles du haut ont chacune leur couleur : Nombre en cyan, Rebirths en vert, Attack en rouge, Defense en bleu, Gold en or, EXP en violet, AP en rose et Run en orange, avec un style plus soigné pour les repérer d’un coup d’œil.',
          'Les trois achats du rayon Toc ont maintenant leur propre illustration.',
          'La boutique prévient quand il y a du nouveau : un point rouge sur le bouton du menu, sur les rayons concernés et sur chaque nouvel achat, qui disparaît une fois l’achat vu. L’étoile du bouton ne scintille plus que dans la boutique ou quand elle a du nouveau.',
          'Les objets qui débloquent un système arrivent toujours dans ton sac, jamais dans un menu à activer. Si ton sac est plein, un message te prévient qu’un objet t’attend et il arrive dès qu’une place se libère.',
          'Le chat envoie tes messages sans attendre : le message apparaît dès que tu l’envoies, avec la mention « envoi… » le temps que le serveur confirme.',
          'Quand tu es paralysé en combat, les raccourcis d’attaque et de parade se grisent avec un éclair et un bandeau jaune indique combien de temps ça dure : plus d’impression que le jeu ne répond plus.',
          'Double tap et Triple tap servent aussi sur ordinateur : un clic droit sur un objet, au sac ou équipé, fusionne d’abord les pièces identiques, puis absorbe les boosts quand il n’y en a plus.',
          'Sur ordinateur, les boutons du menu de gauche sont plus larges et plus longs, avec des icônes et des titres plus grands, à la même échelle que le reste de l’interface.',
          'Là où tu affrontes les géants, tes stats d’aventure s’affichent à côté des stats conseillées : en vert quand tu as atteint le niveau conseillé, en rouge sinon, pour le combat manuel, l’idle et l’auto-kill.',
          'La salle réagit : des rires quand tu prends la fuite, en plus des sons habituels.',
          'Les boutiques ont été remises en ordre : chaque rayon a la couleur de ses boutons, les boutons sont plus petits et ne disent plus que « Acheter », et les prix et les gains sont écrits dans le cadre de chaque article.',
          'Chaque achat de la boutique EXP a maintenant sa vignette, comme ceux de la boutique AP, et le rayon des petits outils a retrouvé son vrai nom.',
          'Les boutons du menu du haut ne s’animent plus de base. Un nouvel achat du rayon Toc de la boutique EXP (40 EXP), « Menus animés », les fait vivre quand un menu est actif.',
          'Le fil « En direct » raconte deux choses de plus : quand quelqu’un lance un sort de sang (le sort n’est nommé que si tu l’as toi-même découvert), quand il regarde une cinématique, et quand il lance, perd ou gagne un combat contre un géant.',
          'Les combats se voient enfin : chaque attaque a son effet sur l’image de l’ennemi (trait, explosion, lance, météorite), chaque coup reçu a le sien sur ta barre de vie (flash, bouclier, paralysie, spores) et des nombres flottent à chaque impact. Un soin fait monter des croix vertes tant que ta vie remonte, et quand tu saignes ta barre vire au rouge sang, avec des gouttes qui coulent de plus en plus vite.',
          'Les ennemis les plus redoutables n’ont plus seulement des chiffres : leurs capacités agissent pour de bon en combat. Paralysie, saignement qui ronge ta régénération, nuages de spores, nuées de sauterelles, battement de chemise qui désactive tes capacités une à une, invincibilité et puissance qui double à chaque tour… Les premiers sont faits, les suivants arrivent. Leur fiche dit exactement ce qui est simulé.',
          'L’entraînement avancé a des barres à la couleur de chaque compétence : plaques d’acier bleu pour la résistance, flammes pour la puissance, écailles cyan pour le blocage, écran à lignes de balayage pour les dumps de l’énergie, étincelles magenta pour ceux de la magie.',
          'L’entraînement avancé a des barres à la couleur de chaque compétence : plaques d’acier bleu pour la résistance, flammes pour la puissance, écailles cyan pour le blocage, écran à lignes de balayage pour les dumps de l’énergie, étincelles magenta pour ceux de la magie.',
          'Les barres montent en puissance : dans les menus où elles se débloquent les unes après les autres, chaque barre est plus bad ass que la précédente, avec les mêmes couleurs mais de plus en plus de foncé, de lumière et de mouvement. La première reste sobre ; la dernière est noire comme l’obsidienne, avec des coins cernés de lumière et un reflet qui la traverse.',
          'Un menu est entièrement relooké : une machine de laiton qui fabrique de l’Or, avec le gain d’Or par seconde en très grand, la barre d’Or qui bat à chaque remplissage et des pièces qui tombent. Et à la fin d’une barre, le niveau suivant arrive tout de suite, sans attendre une action.',
          'Chaque sort de sang a son rituel sonore, de plus en plus intense : un cœur qui s’emballe pour le premier, puis un glas, un râle, un chœur dissonant, et pour le dernier un vrai rituel qui dure presque cinq secondes.',
          'Le menu du sang a sa propre musique, qui monte très lentement en arrivant (cinq secondes de fondu) et redescend en partant, et qui reprend exactement là où elle s’était arrêtée quand tu y reviens.',
          'La fiche d’objet est la même partout : le Coffre (au clic, ou en restant 1,5 seconde dessus sur PC) et la Collection ouvrent la fiche de statistiques de l’inventaire, et la reprise d’un objet se fait depuis cette fiche.',
          'Collection : un V vert apparaît sur les boosts montés au niveau 100.',
          'Chaque article des boutiques a maintenant son image, la même que dans le jeu d’origine.',
          'Le bandeau « En direct » annonce aussi quand un joueur prend la fuite devant un boss ou perd contre lui (le nom du boss n’est donné qu’à ceux qui l’ont déjà atteint).',
          'Sur PC, le menu de gauche est une seule colonne, tous les boutons superposés, sans barre de défilement qui apparaît et disparaît ; les images sont moins démesurées. Chaque menu a sa propre couleur, et la boutique magique passe au mauve.',
          'Les boutons « Plafond » des barres d’allocation s’appellent « Max ».',
          'Les objets qui débloquent un système s’utilisent comme dans le jeu d’origine : « Utiliser » sur la fiche de l’objet, ou clic droit dessus. L’objet est consommé et le système se débloque pour toujours. L’ancien menu « Objets de déblocage » ne reste qu’en secours si l’objet n’est plus dans ton sac.',
          'Le double tap et le triple tap sur les objets du sac ne sont plus offerts de base : ils s’achètent dans la boutique EXP, rayon Aventure. « Double tap » (20 EXP) : un objet, équipé ou non, absorbe tous les boosts de ton inventaire. « Triple tap » (30 EXP) : il fusionne automatiquement avec toutes les pièces identiques disponibles.',
          'Sur téléphone, le menu du haut se lance d’un geste et continue de défiler jusqu’au bout (avant, il s’arrêtait à chaque bouton) ; il ne revient plus au début quand la page se met à jour pendant que tu le fais défiler.',
          'Le bandeau d’infos présent sur toutes les pages prend beaucoup moins de place en haut, avec le même habillage : l’Énergie et la Magie tiennent chacune sur une ligne d’infos (titre, niveau par seconde, reste à générer et temps avant d’être plein) suivie de leur barre et les huit tuiles (Nombre, Rebirths, Attack, Defense, Gold, EXP, AP, Run) sur une seule ligne sur PC, deux lignes de quatre sur téléphone. Environ moitié moins haut, sans perdre aucune information.',
          'Les images de zone sûre déposées pendant que le jeu est ouvert apparaissent toutes seules (le jeu les redemande toutes les 20 secondes), sans recharger la page. Formats acceptés : webp, png, jpg, jpeg et avif.',
          'Succès : un point rouge apparaît sur la catégorie d’un trophée que tu n’as pas encore vu, et sur le trophée lui-même, tant que tu restes dans le menu.',
          'Entraînement de base : le bouton « Max » d’une compétence rend l’énergie en trop et ne laisse que ce qui est nécessaire à son plafond, y compris quand la case Synchro est cochée (avant, il ne faisait que compléter les barres qui n’étaient pas pleines) ; plus de faux message « aucune énergie disponible » quand de l’énergie est rendue.',
          'Correctif : l’achat qui fait passer l’énergie à la compétence suivante d’Entraînement de base marche enfin à l’écran : quand une compétence se débloque, l’énergie qui dépasse le plafond de la précédente passe tout de suite à la nouvelle (avant, elle n’était déplacée que côté serveur et l’écran la remettait à sa place).',
          'Le jeu ressemble à un vrai jeu : le clic droit n’ouvre plus le menu du navigateur (le clic droit sur un objet du sac garde son action rapide) et les textes ne se sélectionnent ni ne se copient plus. Les champs où l’on écrit (pseudo, chat…) restent normaux.',
          'Correctif : un ennemi redoutable ne peut plus être déclaré vaincu sans avoir été combattu (un combat ordinaire qui se terminait au même moment pouvait compter comme sa défaite). Seul son propre combat compte désormais.',
          'Éditeur de voix : chaque bloc de texte a sa ligne avec le fichier de voix à télécharger, à retoucher ailleurs puis à remplacer (le nouveau fichier écrase l’ancien). Les voix devenues inutiles sont retirées du texte à l’enregistrement, et le bouton de nettoyage des voix supprime leurs fichiers.',
          'Les pas qui se font entendre quand tu passes d’un rayon à l’autre ne se répètent plus : six façons de marcher (talons sur parquet, baskets qui couinent, grosses bottes sur du gravier, tongs, talons aiguilles, vieux plancher qui craque), trois ou quatre pas, à un rythme différent à chaque fois.',
          'Collection : la fiche d’un boss affiche son image entière et bien centrée sur PC, et l’administrateur peut y modifier le nom et la chronique du boss.',
          'Le temps de jeu est corrigé : il compte maintenant tout le temps où le jeu est affiché à l’écran, même sans cliquer (avant, seuls les clics des deux dernières minutes comptaient, ce qui en perdait la majeure partie). Le profil affiche ce vrai temps de jeu, et l’ancienneté du compte a sa propre ligne.',
          'Les images des boutiques se chargent tout de suite et sont préchargées, pour ne plus clignoter ni manquer à l’appel.',
        ]
      },
      {
        version:'2.0',
        nom:'Des chronos exacts, des combats plus vivants',
        date:'2026-10-03',
        points:[
          'Le serveur répond environ dix fois plus vite à chaque synchro (de 1 à 4 secondes avant, bien moins d’une demi-seconde maintenant) : il recalcule beaucoup moins de choses à chaque appel.',
          'Tous les chronos sont calés sur l’heure du serveur, plus sur celle de ton téléphone : barres et comptes à rebours restent exacts, ne se figent plus après une synchro, ne reculent plus quand la page se redessine, et le jeu se resynchronise dès que tu reviens sur l’onglet.',
          'Correctif important : la régénération de ta vie tient de nouveau compte de tous tes multiplicateurs. Avant, elle était des milliards de fois trop faible côté serveur : la barre montait à l’écran puis retombait à chaque synchro. Elle monte maintenant jusqu’au bout.',
          'Fight Boss : les images s’animent pendant le combat (élans, secousses, halo), chacune à sa façon (le boss est lourd et lent, le joueur vif et léger) et d’autant plus fort que SA propre vie baisse. Barres de vie refaites avec dégradés, reflets et alertes. Le bouton Fight reste grisé tant que le serveur n’a pas validé le combat. Plus de boss sauté ni de retour en arrière après une victoire. En Aventure, la barre de l’ennemi est rouge.',
          'L’Or d’un niveau gagné est retiré tout de suite du compteur du haut de page, qui reste le seul compteur d’Or de la page.',
          'Basic Training : la compétence suivante apparaît en grisé avec son seul prérequis, et la case Synchro garde son état après un Rebirth.',
          'Inventaire : le tri classe aussi les boosts par numéro croissant dans leur catégorie, et place côte à côte les objets de même nom. Trier ne fait plus clignoter la page (on ne voit plus le haut de l’écran une fraction de seconde).',
          'Augmentations : « il manque de l’Or » est jugé avec ton Or du moment ; la barre reste pleine à la fin d’un niveau et repart dès que l’Or suffit. Même logique pour les autres barres qui dépensent de l’Or.',
          'Le jeu retente tout seul une synchro qui échoue (réseau instable) et force une synchro si l’état du serveur tarde trop à arriver.',
          'Détails d’affichage : cases du Coffre plus petites avec l’image pleine case, texte du prix lisible dans le menu des récompenses d’Or, et boutons de ce menu grisés tant qu’ils ne sont pas prêts.',
          'Le bandeau « En direct » annonce l’article acheté par les autres joueurs, la durée du run lors d’un Rebirth et les récompenses de connexion récupérées ; les longs messages du chat y passent en entier. Le chat reste collé aux derniers messages.',
          'Des récompenses de connexion mensuelles apparaissent dans un menu une fois découvert : une case par jour du mois, qui s’allument une à une. Plus tu enchaînes les jours, plus c’est généreux ; rater un jour te ramène à la première case. Les jours 1 et 2 d’octobre sont offerts à tous.',
          'Le menu des récompenses d’Or est plus clair : « Ton prix » juste sous les boutons, puis le bonus des jours cumulés avec le total d’AP obtenus depuis le début, puis deux cadres repliables (un par liste de récompenses), de 20 lignes par page, avec des pages pour les plus anciennes.',
          'Le menu du haut est refait : chaque bouton a maintenant son identité, avec un badge illustré à la forme et à la couleur de son menu (bouclier pour le combat, goutte pour le sang, bulle pour le chat…), son nom et un verbe qui dit ce qu’on y fait.',
          'Choix de la langue dans les Réglages : Français ou English. Les noms et descriptions des objets, des ennemis, des boutiques et des récompenses sont traduits en français ; en English, tu retrouves les originaux.',
          'Sur PC, le jeu occupe toute la largeur de l’écran : les menus sont rangés en colonne à gauche, toujours visibles, et la page à droite. Sur un grand écran de TV, tous les menus tiennent à l’écran, sans défilement. La bannière SOREAL IDLE s’affiche en entier et le bandeau « En direct » n’est plus caché.',
          'Les boutons du menu s’animent, chacun à sa façon : quand tu y places de l’énergie, quand tu farmes dans une zone, quand quelque chose t’attend, ou simplement quand tu es dans la boutique, le chat ou les réglages.',
          'Chaque menu a son propre petit son, trois pas se font entendre quand tu changes de rayon dans une boutique, et la boutique a sa musique, qui s’ajoute à l’ambiance d’Aventure.',
          'Le Coffre range maintenant chaque set dans un cadre à ses couleurs et à son décor (un thème par set), posé comme sur un mannequin, les cadres côte à côte et à la ligne quand la place manque. La recherche trouve aussi les noms d’origine et les statistiques (« magic », « forest »), et le filtre de butin amélioré se règle objet par objet depuis le Coffre.',
          'Chaque compétence de l’entraînement avancé affiche une vraie barre de progression qui se remplit en direct, avec son bonus actuel et le temps avant le niveau suivant.',
          'Les barres des Augmentations ne s’arrêtent plus entre deux niveaux : le niveau, le coût du suivant et le temps se mettent à jour à l’instant où la barre passe.',
          'La vitesse de génération de l’énergie et de la magie monte maintenant un petit peu à chaque achat, au lieu de rester bloquée entre deux paliers ; la vitesse des équipements compte aussi.',
          'Correctif : le plafond d’énergie acheté avec de l’EXP s’ajoute par-dessus la croissance naturelle de 100 000 au lieu de l’empêcher de continuer.',
          'Pendant un combat de boss, le jeu se met à jour plus souvent : tes statistiques et le boss suivant arrivent plus vite, sans attendre d’appuyer sur Fight.',
          'Money Pit : le cadre « Ton prix » a la même largeur que les autres cadres sur PC.',
          'Les noms d’objets sont traduits en français (objets, pièces d’équipement et sets), par exemple « Clé furieuse » : la recherche du coffre se fait donc en français.',
          'Le tri range maintenant les accessoires en premier, puis les objets divers, puis l’équipement, puis les boosts ; les objets protégés (cadenas) passent toujours en tête de leur catégorie.',
          'Les grands nombres s’écrivent avec davantage de suffixes avant de passer en notation scientifique.',
          'Correctif : le cap d’énergie acheté avec de l’EXP s’ajoute désormais par-dessus la croissance naturelle de 100 000 par Rebirth, au lieu de l’empêcher de continuer.',
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
