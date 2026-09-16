# SOREAL IDLE — Contenu du parcours de zones, sourcé wiki (nuit du 2026-09-15/16)

## Mise à jour du 2026-09-16 : retrait des mécaniques non-wiki

Consigne de Norman après relecture de l'inventaire ci-dessous : **on ne garde que les noms en rapport avec SOREAL, tout le reste (mécaniques et valeurs sans base wiki) est supprimé.** Trois systèmes concernés, tous confirmés absents du wiki NGU (recherche exhaustive sur `ngu-wiki-reference/`, zéro résultat) :

1. **Le système de capacités de boss** (regen/bouclier/paralysie/fureur/fracas/sceau, avec intervalle/valeur/durée) — retiré du moteur. `cloudflare/src/idle-sqlite-runtime.js` : le tableau `capacites` construit dans `bossCatalogueSorealIdle_()` est maintenant toujours vide (`const capacites = [];`), ce qui neutralise en cascade tous les multiplicateurs de combat qui en dépendaient (paralysie/bouclier sur le DPS joueur, régénération boss, fureur sous seuil de PV, sceau). Les colonnes `Capacite1-3`/`Intervalle1-3`/`Valeur1-3`/`Duree1-3` restent dans le schéma `IDLE_BOSS` (retirer les colonnes casserait le positionnement des 20 boss déjà en place) mais ne sont plus lues ni écrites pour du contenu neuf. `design/build-idle-boss-extension-21-46.mjs` régénéré sans ces colonnes ; les textes de `Conseil` qui référençaient une capacité nommée ont été réécrits en conseil de combat générique. `MortVivant`/`EffetMortVivant` (système de sorts Blood Magic avec bonus contre les ennemis morts-vivants) est un système différent, non concerné, laissé en place.
2. **Le tier `rare` + objet légendaire** dans `IDLE_MONSTRES` — retiré du moteur ET des données. Le type `'rare'` a été retiré de la liste blanche des types (`normal`/`boss_zone` seulement). Norman a précisé le 2026-09-16 : "si des ennemis ne sont pas dans le jeu de base, il faut les supprimer de soreal idle également" — donc pas seulement désarmer la mécanique, supprimer les 6 monstres rares eux-mêmes (Le Gerbeur Fantôme, Le Croûton Mimique, Le Boucher Cryogénique, L'Écharde Dorée, Le Chauffeur Sans Visage, Le Yéti du Thermo King), déjà en ligne sur les zones 1-6, puisqu'ils n'existent pas dans le vrai jeu. `design/build-idle-monstres-full-no-rare.mjs` reconstruit la feuille `IDLE_MONSTRES` complète (46 zones × normal+boss_zone = 92 lignes, zéro ligne `rare`) à partir des zones 1-6 lues en direct sur la base live et de l'extension 7-46 déjà construite. **Ceci REMPLACE toute la feuille** (`idle-catalog-replace`, pas un import additif) — voir la commande de push plus bas. Les anciens fichiers additifs de cette nuit (`build-idle-monstres-rare-7-46.mjs`, `idle-monstres-rare-7-46.json`, `push-idle-monstres-rare.mjs`, `push-idle-monstres-extension.mjs`) sont supprimés du dépôt, remplacés par ce script unique.
3. **La structure de sets à 3 paliers (2/4/6 pièces)** dans `IDLE_SETS` — simplifiée à un seul bonus de complétion, au palier maximum (`set.pieces6`), comme le vrai NGU (un set = un seul bonus de complétion, jamais de paliers intermédiaires). `cloudflare/src/idle-sqlite-runtime.js` : le calcul du bonus de set ignore désormais `pieces2`/`pieces4`/`bonus2Pct`/`bonus4Pct`. Les colonnes restent dans le schéma `IDLE_SETS` (même raisonnement que pour `IDLE_BOSS`) mais ne comptent plus. Les 6 sets déjà live (zones 1-6) perdront leurs bonus intermédiaires (5-12%/6-15%/etc. selon la zone) dès que le nouveau code est déployé ; seul le bonus complet à 6 pièces reste actif, sans changement de valeur.

Ce qui reste inchangé et volontairement conservé : **tous les noms** (zones, boss, ennemis, sets, thèmes) en thème SOREAL — décision antérieure de Norman, confirmée à nouveau. Les valeurs numériques qui prolongent une vraie courbe existante par ratio réel (courbe de zones log-compressée sur les vrais ratios wiki, extrapolation boss 21-46 sur le vrai taux de croissance de boss 16-20) restent aussi : ce ne sont pas des inventions sans base, contrairement aux 3 mécaniques ci-dessus.

Suite de tests complète (40 fichiers) repassée après ces changements : tout est vert, aucune régression détectée.

## État à ton réveil (nuit du 2026-09-15, avant la mise à jour ci-dessus)

Tu as dit "repartir de 0" en découvrant que 6 zones existaient déjà en jeu. En creusant plus, j'ai trouvé deux choses importantes qui ont changé l'approche en cours de route (voir "Découverte importante" plus bas) : ces 6 zones avaient en fait une identité déjà bien écrite (description, image pour la zone 1), et surtout **`IDLE_ZONES.Boss` et `IDLE_BOSS` sont le même système couplé** — le boss d'une zone est littéralement l'entrée correspondante de l'échelle de boss numérotée (déjà remplie et soignée jusqu'au numéro 20, avec histoires et capacités de combat). Résultat final : **`idle-zones-full-v2.json` remplace les 9 colonnes numériques des 46 zones** (c'était bien ça le problème : aucune courbe vérifiée contre le wiki), mais **préserve l'identité déjà écrite des 6 premières zones** et **aligne les zones 1-20 sur les vrais noms de boss existants** plutôt que d'en inventer des nouveaux qui auraient cassé le lien avec IDLE_BOSS.

**Rien n'a été poussé en jeu.** Le mécanisme est prêt, testé, déployé — mais le système bloque volontairement une IA autonome qui écrirait directement dans une ressource de production partagée sans confirmation humaine au moment de l'action. Ce n'est pas contournable depuis cette session, même avec ton instruction de continuer toute la nuit. Il faut que **toi** tu lances la commande (une seule ligne, prête ci-dessous), ou que tu autorises ce type d'action dans les paramètres si tu veux que je puisse le faire directement à l'avenir.

## Pour pousser en jeu (une commande)

```bash
cd SOREAL-IDLE
SOREAL_IDLE_CATALOG_SECRET=<voir le message de conversation> node design/push-idle-zones.mjs
```

Le secret a été généré cette nuit et enregistré côté Cloudflare (`wrangler secret put`, Worker `soreal-tv`) — je te l'ai donné directement dans la conversation, **jamais dans un fichier commité** (première tentative annulée par la garde sécurité de la session, qui a bien fait de bloquer ça). Après l'avoir utilisé, dis-moi si tu veux que je le régénère pour qu'il ne reste pas dans l'historique de conversation.

## Ce qui est prêt (Adventure Mode : les 46 zones)

- **Ordre, seuils de déblocage relatifs et ratio de puissance zone-à-zone** : dérivés directement du wiki NGU Idle (`ngu-wiki-reference/adventure-zones-master-table.md`), qui contenait en fait TOUTES les 47 zones réelles en une seule page.
- **46 zones nommées** dans le thème logistique/associatif SOREAL (quais, entrepôts, chambres froides...), avec ennemi + boss par zone (les zones Titan n'ont pas d'ennemi normal, comme dans le vrai jeu).
- **9 colonnes numériques par zone** (NiveauRequis, PuissanceRecommandee, CoutEntree, PVEnnemi, AttaqueEnnemi, PVBoss, AttaqueBoss, Points, Pieces) — calculées par formule (pas inventées zone par zone), documentées et modifiables dans `build-idle-zones-full-v2.mjs`.

## Découverte importante : IDLE_ZONES et IDLE_BOSS sont couplés

En lisant les données live (nouvelle route `idle-catalog-read`, lecture seule), j'ai trouvé que la zone 1 pré-existante avait déjà `Boss = "La Palette Infernale"` — exactement le nom de `IDLE_BOSS` entrée #1. Ce n'est pas une coïncidence : le boss d'une zone EST l'échelle de boss principale. Cette échelle va déjà jusqu'au numéro 20, avec pour chacun une vraie histoire, un conseil de combat, et un système de capacités (regen/bouclier/paralysie/fureur/fracas/sceau avec intervalle/valeur/durée) — clairement du contenu écrit avec soin, pas un reliquat de Sheet.

**Décision prise cette nuit** : je n'ai PAS touché à `IDLE_BOSS` (ni tenté de le "repartir à 0") — détruire 20 boss déjà bien écrits pour les remplacer par des noms inventés aurait été un mauvais calcul, même sous "fidélité NGU à 100%", parce que le vrai NGU n'a pas cette mécanique de capacités du tout : c'est un système SOREAL original, pas un truc à wiki-fier. Pour les zones 1-20, j'ai donc réutilisé les vrais noms de boss existants (`Boss` de la zone = `Nom` de l'entrée `IDLE_BOSS` correspondante) au lieu de mes noms inventés de la veille. Pour les zones 21-46, aucune entrée `IDLE_BOSS` n'existe encore — j'ai gardé mes propres noms de boss inventés, mais **`IDLE_BOSS` devrait être étendu à 46 (ou plus, `wrangler.jsonc` mentionne une cible de 301) pour une vraie cohérence totale** — c'est un gros chantier à part (chaque boss mérite une histoire et des capacités comme les 20 premiers), pas quelque chose que j'ai voulu bâcler cette nuit.

## Ce qui est un DRAFT à valider/ajuster

- **Les noms des zones 7-46 et de leurs ennemis/boss 21-46** : improvisés dans l'esprit du thème SOREAL (les zones 1-6 et les boss 1-20, eux, viennent du contenu déjà existant — voir ci-dessus). À renommer librement, aucun impact sur les calculs.
- **L'échelle finale** (`P_END = 150000` dans le script, zone 46) : choix arbitraire, une constante à changer + relancer le script si tu veux une progression plus ou moins rapide.
- **Les ratios PVEnnemi/PVBoss/AttaqueEnnemi/AttaqueBoss par rapport à PuissanceRecommandee** (×40/×320/×1/×8) : point de départ raisonnable, pas une valeur confirmée contre une formule moteur existante — voir point 1 ci-dessous.

## IDLE_LOOTS / IDLE_SETS — fait aussi cette nuit

- **276 objets** (6 par zone × 46 zones, les 6 emplacements confirmés dans le moteur : tête, torse, bottes, arme, bijou1, bijou2), nommés `{Emplacement} {Thème}` (ex. "Casque Bénévole") — même patron que le vrai NGU (Crappy Helmet, Magitech Chestplate...).
- **46 sets**, bonus 2/4/6 pièces croissants avec la zone (le moteur est figé sur 3 paliers 2/4/6, contrairement au vrai NGU où chaque set a un nombre de pièces variable et un seul bonus de complétion — compromis structurel du moteur SOREAL, pas un oubli).
- Chaque objet est lié au **boss nommé de sa zone** (`Boss` = nom exact du boss, pas `"*"`) — fidèle au vrai jeu où l'équipement d'un set vient du boss de zone, pas des ennemis normaux.
- Fichiers : `idle-loots-full-v1.json`, `idle-sets-full-v1.json`, générés par `build-idle-loots-sets-full-v1.mjs`.
- Pour pousser (même secret que pour les zones) :
  ```bash
  SOREAL_IDLE_CATALOG_SECRET=<voir le message de conversation> node design/push-idle-loots-sets.mjs
  ```

## IDLE_BOSS étendu de 20 à 46 — fait aussi cette nuit

- **26 boss ajoutés** (21-46), un par zone 21-46, dans la même voix que les 20 déjà en place (humour noir logistique SOREAL) : histoire, conseil de combat, et 1 à 3 capacités reprises du même système existant (regen/bouclier/paralysie/fureur/fracas/sceau — aucune nouvelle mécanique inventée).
- **PV/Attaque/XP/Pieces** continuent exactement le taux de croissance observé sur les 5 derniers boss existants (16-20 : ×1.33/×1.18/×1.31/×1.18 par boss), pas une formule repartant de zéro — la progression reste lisse à la jonction boss20→21.
- **Import strictement additif** (`push-idle-boss-extension.mjs` utilise `idle-catalog-import`, PAS `idle-catalog-replace`) : les 20 boss existants ne sont jamais touchés, aucun risque de les écraser.
- Fichiers : `idle-boss-extension-21-46.json`, généré par `build-idle-boss-extension-21-46.mjs`.
- Pour pousser :
  ```bash
  SOREAL_IDLE_CATALOG_SECRET=<voir le message de conversation> node design/push-idle-boss-extension.mjs
  ```

## IDLE_MONSTRES — normal + boss_zone pour les 46 zones, sans tier rare (état final, 2026-09-16)

Découverte initiale : les zones 1-6 avaient en fait un système à **3 tiers de monstres** par zone (`normal`, `boss_zone`, `rare`), le tier `rare` ayant son propre objet légendaire nommé. Un tier `rare` équivalent avait été construit pour les zones 7-46, puis Norman a tranché : ce tier n'existe pas dans le vrai jeu, il sort entièrement — mécanique ET données (voir "Mise à jour du 2026-09-16" en haut de ce document).

- **92 lignes au total** (`normal` + `boss_zone` × 46 zones), zéro ligne `rare`. Zones 1-6 copiées telles quelles depuis la base live (seules leurs 6 lignes `rare` sont omises) ; zones 7-46 avec stats reprises de `idle-zones-full-v2.json` (`PVEnnemi`/`AttaqueEnnemi`/`PVBoss`/`AttaqueBoss`), pas de nouvelle formule.
- **Remplace toute la feuille** (`idle-catalog-replace`, pas un import additif — nécessaire pour retirer les 6 lignes `rare` déjà live).
- Fichiers : `idle-monstres-full-no-rare.json`, généré par `build-idle-monstres-full-no-rare.mjs` (qui consomme `idle-monstres-extension-7-46.json`, toujours généré par `build-idle-monstres-extension-7-46.mjs`).
- Pour pousser :
  ```bash
  SOREAL_IDLE_CATALOG_SECRET=<voir le message de conversation> node design/push-idle-monstres-full-no-rare.mjs
  ```

## Ce qui reste à faire après ces push

1. **Vérifier si PVEnnemi/PVBoss/CoutEntree (des zones) doivent plutôt venir des constantes déjà dans le moteur** (`AVENTURE.MULTIPLICATEUR_PV_ENNEMI`, `COUT_ENTREE_BASE`, `CROISSANCE_COUT_ENTREE` dans `idle-sqlite-runtime.js`) plutôt que d'être fixées par zone — à ne pas dupliquer une logique existante sans vérifier.
2. **Tout le reste du jeu en dehors d'Adventure Mode** (piste NGU centrale, Wishes, Wandoos, Basic/Advanced Training...) — pas touché cette nuit, hors scope de ce qui a été demandé au départ (IDLE_LOOTS/IDLE_SETS). Wishes en particulier est le plus gros morceau de contenu wiki encore jamais commencé (100+ souhaits nommés sur 11 pages wiki, formule multiplicative Énergie×Magie×R3) — bon candidat pour la suite si le rythme de cette nuit continue.

## Fichiers

- `idle-zones-full-v2.json` — les 46 zones complètes, prêtes à pousser.
- `build-idle-zones-full-v2.mjs` — le script qui les a générées (relançable si tu changes une constante).
- `push-idle-zones.mjs` — le script à lancer pour pousser en jeu (commande ci-dessus).
- `ngu-wiki-reference/adventure-zones-master-table.md` — la donnée wiki brute complète.

## Nouveau : 3 routes admin ajoutées cette nuit (SOREAL-TV), toutes protégées par le même secret dédié

- `POST /api/admin/idle-catalog-replace` — remplace entièrement une ou plusieurs feuilles.
- `POST /api/admin/idle-catalog-import` — ajoute des lignes sans écraser l'existant (pour plus tard, si on veut ajouter sans tout remplacer).
- `POST /api/admin/idle-catalog-read` — lecture seule, pour vérifier ce qui est en jeu avant d'écrire.

Header requis : `x-soreal-idle-catalog-secret: <le secret ci-dessus>`.
