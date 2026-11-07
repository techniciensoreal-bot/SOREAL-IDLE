# Images des Mineurs d'or (à produire par Norman)

Style choisi : **gravure sombre, dark fantasy / steampunk** (traits fins, teintes sourdes sépia / laiton / patine, mineurs adultes, lunettes de laiton, tuyaux, manomètres, lampe à gaz). Pas de style cartoon.

## Format
- WebP (ou PNG), **fond opaque**, ratio **120 : 108** (ex. 960 × 864), un fichier par scène. 960 px suffit (affichage ≤ 480 px, écrans 2x).
- Pas de texte, pas de nombre, pas de bouton dans l'image : le jeu les affiche par-dessus (titre et effet en haut, boutons en bas ; **laisser le bas (~25 %) et le haut (~18 %) calmes**, sans détail important).
- Le mineur et son butin dans la partie centrale ; le mineur à gauche, le butin à droite (comme aujourd'hui).

## Les 12 scènes (un mineur chacun, dans la galerie de son étage)
| Fichier | Mineur | Butin / décor | Galerie |
|---|---|---|---|
| `drop.webp` | casque d'acier | coffre cerclé de fer | g1 (haut) |
| `wandoos.webp` | casquette de cuir | vieil ordinateur à écran vert | g1 |
| `stats.webp` | bandeau rouge | armoire à manomètres et 3 jauges | g1 |
| `adventure.webp` | chapeau d'explorateur | carte + boussole de laiton | g2 (milieu) |
| `energyNgu.webp` | casque à éclair | dynamo / sphère d'acier, éclairs | g2 |
| `magicNgu.webp` | chapeau pointu violet | cristaux violets | g2 |
| `energyBeard.webp` | grande barbe dorée | peigne doré, éclairs | g3 (sous la barbe) |
| `magicBeard.webp` | grande barbe violette | peigne, étincelles violettes | g3 |
| `pp.webp` | couronne d'or | sac à étoile dorée | g4 (fond des puits) |
| `daycare.webp` | bonnet, tablier | berceau à barreaux, bébé | g4 |
| `blood.webp` | capuche sombre | chaudron de sang | g5 (là où ça brûle) |
| `experience.webp` | mortier d'étudiant, lunettes | pile de livres, sphère | g5 |

## Animation (je m'en occupe)
Le mineur ne bouge pas dans l'image : je peux faire une légère respiration / balancement par CSS (transform seulement, boucle parfaite de 1,8 s) si l'image garde le mineur **sur un calque séparé** (un second fichier PNG détouré `<id>-mineur.png`, même taille, fond transparent). Sinon l'image reste fixe, avec une lueur douce (opacity).

## Option : décor des galeries
`g1.webp` … `g5.webp` : fond de galerie seul (sans mineur), même ratio, une par étage. Alors les 12 scènes peuvent être de simples PNG détourés (mineur + butin, fond transparent) posés sur ces 5 fonds : **bien moins d'images à produire (5 + 12) et plus léger**. Recommandé.

## Où les déposer
`cloudflare/public/img/mineurs/` (je branche ensuite la page : `modules/mineurs-page-v1.js`, repli automatique sur le dessin actuel tant qu'une image manque).
