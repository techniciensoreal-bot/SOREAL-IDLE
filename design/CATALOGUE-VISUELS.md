# Catalogue des visuels et effets de SOREAL IDLE

FICHIER GÉNÉRÉ par `node cloudflare/tools/inventaire-visuels.mjs --ecrire` (ne pas éditer à la main). Liste de contrôle de la reconstruction (design/ARCHITECTURE-CIBLE.md) : un élément ne disparaît jamais sans l'accord de Norman.

## Résumé
- menus : **29**
- pages : **33**
- keyframes : **439**
- fichiersAvecWebAnimations : **21**
- fichiersCanvas : **13**
- pointsEntreeRejouables : **272**
- mortsDeBase : **3**
- retoursJoueur : **8**
- retoursBoss : **7**
- mortsNouvelles : **5**
- effetsReglables : **4**
- sonsEffets : **82**
- dossiersDeRessources : **22**

## Menus
Basic Training (`entrainement`) · Fight Boss (`combat`) · Adventure (`aventure`) · Rebirth (`renaissance`) · Augmentations (`augmentations`) · Advanced Training (`avance`) · Time Machine (`machine`) · Blood Magic (`sang`) · ITOPOD (`tower`) · Item Daycare (`daycare`) · Challenges (`challenges`) · Titans (`titans`) · NGU (`ngu`) · Wandoos (`wandoos`) · Yggdrasil (`yggdrasil`) · Gold Diggers (`diggers`) · Beards (`beards`) · MacGuffins (`macguffins`) · Hacks (`hacks`) · Questing (`questing`) · Quirks (`quirks`) · Wishes (`wishes`) · Cards (`cards`) · Cooking (`cooking`) · Boutique (`shop`) · Chroniques (`chroniques`) · Chat (`chat`) · Settings (`parametres`) · Admin (`admin`)

## Morts et retours du joueur
- Morts de base (explosion en pixels, puis retour) : fondu, rewind, clignote
- Morts (nouvelles) : Cendres, Trou noir, Vitre brisée, Tranché, Âme
- Retours du joueur : Galop, Marche sur les coins, Rebond, Tampon, Puzzle, Faisceau, Ballon, Toupie
- Retours des boss : Écrasement, Surgissement, Portail, Silhouette, Plongeon, Fumée, Briques

## Sons nommés (effets)
achievement, albumDix, albumFerme, albumPage, augTic, baille, bloodCap, bloodMinus, bloodPlus, boostAllAbsorption, boostPower, boostSpecial, boostToughness, borneAllume, borneTousse, bossAppear, btCap, btMinus, btPlus, chestClose, chestOpen, chorale, chroniqueNote, clavierApp, coffreAccident, coffreAvale, coffrePet, coffreRecrache, coffreReveil, coffreRonfle, coffreRot, dailySpin, debugState, defeat, defeatList, defeatReverse, defeatReversePrepare, dernierSonBoss, dernierSonVictoire, diarrheeList, equip, fight, flee, joueurConnecte, laugh, menu, menuNav, menuUnlock, mergeAccessory, mergeArmor, mergeWeapon, moneyPit, nuke, previewDiarrhee, purchase, purchaseGem, purchaseGold, reapparitionBip, recordPerso, rot, roueCliquets, roueTourne, setComplete, shopDoor, shopSteps, sortBlood, synth, timeMachine, tmCap, tmMinus, tmPlus, uiClick, valiseFerme, valiseOuvre, valisePotion, valiseRonfle, valiseTouche, valiseVomi, victory, voiceDone, wandoosErreur, wandoosMaj

## Effets réglables
soreal_idle_effet_decor_v1, soreal_idle_effet_feu_v1, soreal_idle_effet_nav_v1, soreal_idle_effet_orage_v1

## Points d'entrée rejouables (window.__SOREAL_IDLE_*__)
Chaque module expose son API ici : une animation se REJOUE en direct dans le navigateur (jamais de planche de captures). 272 points d'entrée, listés dans `design/catalogue-visuels.json` (champ `pointsEntree`).

## Animations CSS orphelines (définies mais nommées nulle part ailleurs)
`bnPulse` (soreal-idle-itopod.css) · `rgFeuV1` (soreal-idle-itopod.css) · `sorealIdleBtTickV1` (soreal-idle-ui.css)

## Fichiers qui animent par script (Web Animations) et qui dessinent en canvas
`modules/album-cartes-v1.js` (27) · `modules/augmentations-page-v1.js` (1) · `modules/borne-led-v1.js` (1) · `modules/boss-reveal-v1.js` (1) · `modules/cthulhu-scene-v1.js` (1) · `modules/engrenages-v1.js` (1) · `modules/feu-v1.js` (2) · `modules/foudre-borne-v1.js` (2) · `modules/machine-dessin-v1.js` (4) · `modules/nettoyage-ap-v1.js` (2) · `modules/orage-v1.js` (1) · `modules/reapparitions-v1.js` (1) · `modules/sang-rituel-decor-v1.js` (2) · `modules/theme-images-v1.js` (1) · `modules/ui-boucle-v1.js` (1) · `modules/ui-entrainement-v1.js` (1) · `modules/ui-menus-v1.js` (1) · `modules/ui-renaissance-v1.js` (8) · `modules/walderp-cachette-v1.js` (1) · `modules/wandoos-retro-v1.js` (2) · `modules/yggdrasil-elfes-v1.js` (4)

`modules/apparition-boss-v1.js` (7) · `modules/aug-led-barres-v1.js` (5) · `modules/borne-led-v1.js` (3) · `modules/machine-dessin-v1.js` (1) · `modules/moqueurs-fuite-v1.js` (1) · `modules/mort-joueur-v1.js` (2) · `modules/morts-boss-nouvelles-v1.js` (6) · `modules/morts-joueur-nouvelles-v1.js` (2) · `modules/profil-visage-v1.js` (3) · `modules/sang-rituel-decor-v1.js` (2) · `modules/steam-v1.js` (1) · `modules/tm-bulles-canvas-v1.js` (3) · `modules/victoire-boss-arcade-v1.js` (3)

## Ressources par dossier
- `chargement` : 3
- `cthulhu` : 30
- `dos-cartes/normal` : 18
- `fonts` : 11
- `garderie` : 2
- `garderie/paupieres` : 39
- `garderie/queues` : 21
- `garderie/yeux` : 33
- `icons` : 3
- `img/mineurs/fonds` : 1
- `img/mineurs/labos` : 17
- `intro` : 16
- `machine-v2` : 3
- `machine-v3` : 9
- `magic/boss` : 299
- `magic/fonds` : 32
- `magic/safe` : 32
- `perks` : 173
- `shop` : 74
- `trou` : 2
- `voice-en` : 16
- `wandoos` : 1

Le détail complet (chaque animation, ses fichiers de définition et d'usage) est dans `design/catalogue-visuels.json`.
