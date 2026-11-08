# Refonte du menu Mineurs d'or — étapes 1 et 2 (2026-11-08)

Demande de Norman : « refaire entièrement le menu Mineurs d'or, étape par étape. 1) un décor avec à chaque fois une caverne, chaque cavité différente et en rapport avec ce qu'elle rapporte ; 2) un mineur de base, sans vêtements, pour pouvoir l'adapter aux autres mineurs. »

## Décisions (et pourquoi)

1. **12 cavernes = 12 images séparées**, une par mineur (`drop`, `wandoos`, `stats`, `adventure`, `energyNgu`, `magicNgu`, `energyBeard`, `magicBeard`, `pp`, `daycare`, `blood`, `experience`). Pas une grande coupe de montagne en une seule image :
   - **anti-spoil (règle n°2)** : une coupe unique montrerait d'emblée les 12 cavités, donc le nombre de mineurs à découvrir. Une caverne n'apparaît qu'une fois son mineur découvert ; rien pour les autres, ni cavité vide ni cadenas ;
   - **mise en page** : PC et téléphone n'ont pas la même grille (une image unique ne se réorganise pas, 12 images se rangent comme on veut) ;
   - **coût de rendu** : le téléphone a déjà montré (C9) que ce sont le nombre d'éléments SVG et les animations qui coûtent. Une image par caverne = un seul élément chacune, et les animations (lueur, poussière) restent des calques CSS légers.
2. **Images plutôt que dessin SVG** : douze cavernes différentes dessinées en SVG feraient plusieurs centaines d'éléments chacune ; je recommande tes images. Si tu préfères que je les dessine en SVG, je le fais, mais en version plus simple (formes, dégradés, une dizaine de motifs par caverne).
3. **Le mineur est un calque à part** (étape 2) posé dans la caverne : un seul mineur de base, habillé ensuite par calques (casque, bandeau, chapeau, barbe, couronne…) selon le mineur.

## Étape 1 — les 12 cavernes

### Format (identique pour les 12)
- **1200 × 1080 px** (ratio 10 : 9, même que la page actuelle), WebP ou PNG, **fond opaque**. 960 × 864 suffit.
- **Aucun texte, nombre, bouton, personnage, ni objet qui bouge** dans l'image : le jeu pose lui-même le mineur, les chiffres, les boutons, la lueur et les particules.
- **Une seule chambre taillée dans la roche**, vue de face, sans perspective forte : une voûte (arche irrégulière) qui occupe presque toute l'image, entourée de roche sombre qui sert de cadre. Les douze images doivent avoir le **même cadre de roche** et la même hauteur de sol pour se ranger côte à côte.
- **Sol à y = 800** (ligne où le mineur pose les pieds), sol plat sur toute la largeur. **Sous y = 810 : calme** (roche, terre, sans détail) : les boutons sont posés par-dessus. **Au-dessus de y = 190 : calme** (voûte sombre) : le titre est posé dessus.
- **Zone du mineur : x 120 à 560, y 260 à 800 laissée VIDE** (le mineur de l'étape 2 y sera posé ; pas de meuble ni de lampe devant). **Zone du butin / décor principal : x 620 à 1080, y 430 à 800.** Le reste (murs, plafond) porte les détails.
- Éclairage chaud par lampes à gaz ou à huile, **la couleur dominante change selon la profondeur** (comme les galeries actuelles) : haut = terre brune, milieu = gris-bleu, fond = violet profond, tout au fond = rouge braise.
- Style (déjà choisi) : **gravure sombre, dark fantasy / steampunk**, traits fins, teintes sourdes sépia / laiton / patine, pas de cartoon.

### Ce que raconte chaque caverne (en rapport avec ce que le mineur rapporte)
| Fichier | Ce qu'il rapporte | La cavité | Ambiance |
|---|---|---|---|
| `drop.webp` | Chance de butin | caveau au trésor : coffres cerclés de fer, étagères de coffres et de sacs, fers à cheval cloués, éclats de gemmes dans la roche | terre brune, orange chaud |
| `wandoos.webp` | Wandoos | salle informatique taillée dans la roche : vieux écrans à tube cathodique éteints sur des établis, câbles au sol, tour d'ordinateur beige | terre brune, lueur verte éteinte |
| `stats.webp` | Statistiques | armoire de manomètres et de jauges en laiton, tuyaux le long des murs, tableau de cadrans | terre brune, laiton |
| `adventure.webp` | Aventure | salle des cartes : cartes punaisées sur la roche, boussole géante, cordes, piolets, râtelier d'armes, lanternes | gris-bleu, ambre |
| `energyNgu.webp` | NGU d'énergie | salle de la dynamo : bobines de cuivre, grande sphère d'acier, câbles épais, arcs électriques figés sur les murs | gris-bleu, vert pâle |
| `magicNgu.webp` | NGU de magie | grotte aux cristaux violets : amas de cristaux au sol et au plafond, runes gravées dans la roche | gris-bleu, violet |
| `energyBeard.webp` | Barbe d'énergie | racines et mèches de barbe dorée qui pendent du plafond comme des stalactites, grand peigne doré planté dans le sol, étincelles vertes | bleu-gris profond, doré et vert |
| `magicBeard.webp` | Barbe de magie | même idée en violet : mèches pendantes, peigne, étincelles violettes | bleu-gris profond, violet |
| `pp.webp` | Points de pouvoir (PP) | grotte aux étoiles : plafond piqueté d'étoiles dorées, gros sac à étoile posé au sol, poussière d'or | violet profond, doré |
| `daycare.webp` | Garderie | crèche taillée dans la roche : berceaux à barreaux, mobiles suspendus, petits lits, lumière douce | violet profond, ambre doux |
| `blood.webp` | Sang | caverne du chaudron : grand chaudron rouge, mares de sang, chaînes, crochets, braise au fond | rouge braise |
| `experience.webp` | EXP | bibliothèque troglodyte : piles de livres, étagères creusées, sphère de verre, pupitre | rouge sombre, lueur dorée |

> Les bonus exacts viennent du moteur (valeurs du wiki NGU Idle) et sont affichés par la page ; les images n'en montrent aucune valeur.

### Prompt commun (à coller en tête de chaque demande, une image à la fois)
« Illustration de jeu vidéo, gravure sombre dark fantasy / steampunk, traits fins, teintes sourdes sépia, laiton et patine. Vue de face, à plat, sans perspective forte, d'UNE chambre taillée dans la roche dans une mine : voûte irrégulière qui occupe presque toute l'image, entourée de roche sombre. Sol plat horizontal aux trois quarts de la hauteur (à 74 % depuis le haut), la partie de l'image sous le sol est de la roche et de la terre sans détail ; le haut de la voûte est sombre et sans détail. Éclairage par lampes à huile. **Aucun personnage, aucun texte, aucune lettre, aucun chiffre, aucune flamme ni particule animée.** Le tiers gauche de la chambre, au sol, est vide (un personnage y sera posé plus tard). Format 1200 × 1080. »
Puis ajouter la ligne de la caverne voulue (colonnes « La cavité » et « Ambiance » du tableau).

## Étape 2 — le mineur de base (sans vêtements)

### Ce qu'il faut
- **UN seul mineur de base**, **calque détouré** : PNG à **fond transparent**, **768 × 1152 px** (ratio 2 : 3), le mineur en pied, **les pieds posés sur la ligne y = 1120** (au bord du bas), centré, **sans ombre ni sol**.
- **Sans vêtements** : pour que les générateurs ne refusent pas la demande, demande plutôt un **corps nu neutre de type mannequin** (peau lisse, sans détails anatomiques, comme une figure en bois articulée) ; à défaut, un **simple caleçon court**, que je recouvrirai. Je m'occupe ensuite de tout ce qui l'habille.
- **Pose neutre** : debout, de trois quarts **tourné vers la droite** (le mineur est à gauche de la caverne et regarde son butin), poids sur les deux pieds, bras légèrement écartés du corps (pour qu'on puisse y poser des manches), **mains ouvertes et vides** (la pelle, le seau, etc. sont des calques à part), tête droite, **visage neutre**, **sans casque, sans chapeau, sans barbe**.
- **Proportions** : corps trapu d'ouvrier de mine, tête = 1/6 de la hauteur ; le haut du crâne à y ≈ 60, pour laisser la place d'un casque ou d'un chapeau au-dessus (jusqu'à y = 0).
- Même style que les cavernes (gravure sombre, traits fins).

### Points d'ancrage (pour que je pose chaque accessoire au bon endroit)
| Repère | Position (px de l'image 768 × 1152) |
|---|---|
| Sommet du crâne (casques, chapeaux, couronne) | (384, 70) |
| Menton (barbe) | (384, 235) |
| Main gauche et droite (outils) | (210, 640) et (558, 640) |
| Épaules (cols, capuches) | (250, 330) et (518, 330) |
| Pieds (appui au sol) | (384, 1120) |

### Pour la suite (étape 3, pas maintenant)
Habillage par calques du mineur (un fichier par chapeau, barbe, accessoire), puis animation (respiration par CSS, gestes de creusage par calques de bras si on veut du mouvement), puis la page refaite caverne par caverne.

## Décisions de Norman (2026-11-08)
- **12 cavernes en images** (pas de SVG). **Mineur de base : mannequin** (corps nu neutre de type figure articulée, sans détails anatomiques).

## Prompts prêts à coller (une image à la fois)

**À chaque fois, coller d'abord le « Prompt commun » ci-dessus, puis UNE des lignes suivantes.** Rappel : aucun personnage, aucun texte, aucune flamme animée ; tiers gauche du sol vide ; sol à 74 % de la hauteur.

1. **`drop`** — « La chambre est un caveau au trésor : coffres de bois cerclés de fer et sacs de toile empilés sur des étagères creusées dans la roche, fers à cheval cloués aux piliers, éclats de gemmes brillant dans les parois. Couleurs : terre brune, orange chaud des lampes. »
2. **`wandoos`** — « La chambre est une salle informatique taillée dans la roche : vieux écrans à tube cathodique éteints (verre vert sombre) posés sur des établis de bois, grosse tour d'ordinateur beige, câbles qui courent au sol et aux murs, claviers poussiéreux. Couleurs : terre brune, lueur verte très faible. »
3. **`stats`** — « La chambre est une salle de manomètres : grande armoire de laiton à cadrans et jauges, tuyaux de cuivre le long des murs, tableau de cadrans suspendu, valves à volant. Couleurs : terre brune, reflets de laiton. »
4. **`adventure`** — « La chambre est une salle des cartes : vieilles cartes punaisées sur la roche, grosse boussole de laiton, cordes enroulées, piolets et épées dans un râtelier, lanternes suspendues. Couleurs : gris-bleu, lumière ambre. »
5. **`energyNgu`** — « La chambre est une salle de dynamo : bobines de cuivre, grande sphère d'acier au centre, câbles épais au sol, arcs électriques FIGÉS sur les murs (traits fins vert pâle). Couleurs : gris-bleu, vert pâle. »
6. **`magicNgu`** — « La chambre est une grotte aux cristaux : amas de cristaux violets au sol et au plafond, runes gravées dans la roche (formes abstraites, aucune lettre lisible). Couleurs : gris-bleu, violet. »
7. **`energyBeard`** — « La chambre est envahie de mèches de barbe dorée qui pendent du plafond comme des stalactites, un grand peigne doré planté dans le sol, étincelles vertes figées dans l'air. Couleurs : bleu-gris profond, doré et vert. »
8. **`magicBeard`** — « La chambre est envahie de mèches de barbe violette qui pendent du plafond comme des stalactites, un grand peigne planté dans le sol, étincelles violettes figées dans l'air. Couleurs : bleu-gris profond, violet. »
9. **`pp`** — « La chambre est une grotte aux étoiles : plafond piqueté d'étoiles dorées, gros sac de toile marqué d'une étoile posé au sol, poussière d'or. Couleurs : violet profond, doré. »
10. **`daycare`** — « La chambre est une crèche taillée dans la roche : berceaux à barreaux, mobiles suspendus, petits lits, doudous, lumière douce de lampes à abat-jour. Couleurs : violet profond, ambre doux. »
11. **`blood`** — « La chambre est une caverne du chaudron : grand chaudron rouge sombre sur un foyer de braises, mares de sang, chaînes et crochets de boucher, lueur de braise au fond. Couleurs : rouge braise, noir. »
12. **`experience`** — « La chambre est une bibliothèque troglodyte : piles de livres, étagères creusées dans la roche, grosse sphère de verre posée sur un socle, pupitre incliné. Couleurs : rouge sombre, lueur dorée. »

### Prompt du mineur de base (mannequin) — image à part
« Illustration de jeu vidéo, gravure sombre dark fantasy / steampunk, traits fins, teintes sourdes sépia. **Un mineur de base en pied, en mannequin** : figure articulée de bois clair ou de cire, peau lisse sans détails anatomiques, sans vêtements, sans cheveux, sans barbe, sans casque, sans chapeau, sans lunettes. Corps trapu d'ouvrier de mine, tête = un sixième de la hauteur. Debout, de trois quarts tourné vers la droite, poids sur les deux pieds, bras légèrement écartés du corps, **mains ouvertes et vides**, tête droite, visage neutre (traits simples, sans expression). **Fond TRANSPARENT (PNG avec canal alpha)**, aucun sol, aucune ombre, aucun décor, aucun texte. Image 768 × 1152, le mineur occupe toute la hauteur, les pieds au bord du bas (à 97 %), le haut du crâne à 5 %. »

## Où les déposer
Cavernes : `cloudflare/public/img/mineurs/cavernes/<id>.webp`. Mineur de base : `cloudflare/public/img/mineurs/mineur-base.png`. Dès qu'une image arrive, je la branche (les cavernes manquantes gardent le dessin actuel).
