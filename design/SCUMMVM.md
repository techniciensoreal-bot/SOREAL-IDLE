# ScummVM dans Soreal IDLE (menu « Énigmes »)

Décisions de Norman (2026-11-22) : un menu de la liste (comme Time Machine), jeu affiché instantanément avec la partie déjà chargée, jouable au doigt sur téléphone, n'importe quel jeu ScummVM déposé dans un dossier R2, un jeu par difficulté, choisi plus tard. Chaque progrès dans le jeu (même ramasser un objet) rapportera un peu d'AP : étape suivante.

## Disposition R2 (seau `soreal`, préfixe `scummvm/`), servie par `GET /api/idle/scummvm/<clé>`
- `moteur/` : `scummvm.html`, `scummvm.js`, `scummvm.wasm`, `data/…` (moteur compilé ; 42 Mo + 11 Mo de données). Cache une semaine.
- `jeux/<dossier>/…` : fichiers d'un jeu et `index.json` (`{nom: taille}`). Revalidé à chaque fois (ETag).
- `jeux.json` : `{"jeux":[{"id":"dott","nom":"Day of the Tentacle","dossier":"DOTT","cible":"tentacle","difficulte":"normal"}]}` (une entrée par difficulté : normal, evil, sadistic).

## Où placer le jeu sur R2, et l'INTERRUPTEUR (fermé par défaut)
Tout se range dans le seau **`soreal`**, sous le préfixe **`scummvm/`** (voir la disposition ci-dessus) ; l'outil `scummvm-envoyer.mjs` place les fichiers aux bonnes clés.
**Tant que l'objet `scummvm/ouvert` n'existe pas, rien n'est accessible aux joueurs** : la route répond 404 pour tous les fichiers et le menu « Énigmes » reste caché.
Ouvrir (effet en moins d'une minute, sans redéploiement) : `echo 1 > ouvert.txt && npx wrangler r2 object put soreal/scummvm/ouvert --file ouvert.txt --remote`.
Fermer : `npx wrangler r2 object delete soreal/scummvm/ouvert --remote`.
En local (`SCUMMVM_DOSSIER`) : ouvert si le miroir contient `scummvm/ouvert`.

## Mettre un jeu en ligne
```
node cloudflare/tools/scummvm-envoyer.mjs jeu <dossier-du-jeu> --nom <dossier>      # envoie sur R2 (wrangler)
node cloudflare/tools/scummvm-envoyer.mjs catalogue jeux.json
node cloudflare/tools/scummvm-envoyer.mjs moteur <dossier-du-moteur>                # une fois, ou à la mise à jour du moteur
```
`--local <dossier>` copie dans un miroir (dossier `.scummvm-miroir/`, ignoré par git) pour `SCUMMVM_DOSSIER=.scummvm-miroir` de `local-dev-server.mjs` ; `--simuler` liste sans rien faire.

## Lancement d'un jeu
La page lance `scummvm.html#--path=/data/games/<dossier> --save-slot=0 <cible>` : ScummVM détecte le jeu à partir de son dossier (aucune entrée dans `scummvm.ini`), et reprend l'autosave. Il faut que le moteur ait le plugin de la famille du jeu (`data/plugins/lib<moteur>.so`, ex. `libscumm.so` pour Day of the Tentacle).

## Limites et points d'attention
- La page de démonstration d'origine envoyait des rapports d'erreurs à Sentry : l'outil la nettoie ; rien ne doit sortir de notre origine.
- ScummVM est sous licence GPL : publier les sources de toute modification du moteur ; le binaire de démonstration (Christian Kuendig) sert aux essais, à remplacer par notre compilation (`dists/emscripten/build.sh`) avant publication.
- Les jeux doivent être gratuits et redistribuables, ou fournis par le joueur.
- Sauvegardes : IndexedDB `/home/web_user` (table `FILE_DATA`, `saves/…`) de la même origine ; leur copie sur le compte est une étape suivante (le crédit d'AP par progrès est décrit plus bas).

## AP par progrès (2026-11-22)
Décisions de Norman : chaque progrès dans le jeu rapporte un peu d'AP, même ramasser un objet ; AP BRUT (le multiplicateur d'AP du joueur ne s'applique pas) ; plafond PAR JEU (150 000 AP pour Day of the Tentacle), chaque jeu du catalogue a le sien et ses propres crédits.
- Catalogue : `jeux.json` peut déclarer par jeu `"ap":{"plafond":150000,"parUnite":53}` (nombres strictement positifs, validés par `scummvm-envoyer.mjs catalogue`). Sans bloc `ap`, le jeu ne rapporte rien.
- Calcul de `parUnite` : plafond / nombre d'unités possibles du lecteur, arrondi au plus proche : 150 000 / (800 objets + 2 048 indicateurs = 2 848) = 52,67, soit 53. Une partie réelle n'atteint qu'une partie des 2 848 unités possibles (la plupart des objets n'entrent jamais dans un inventaire) : le plafond est un maximum, pas une cible.
- Lecteur (`modules/scummvm-sauvegarde-v1.js`) : ScummVM écrit un autosave dans IndexedDB `/home/web_user`, table `FILE_DATA`, clé `/home/web_user/saves/<cible>.s00` (gzip). Le contenu est celui de `ScummEngine::saveLoadWithSerializer` (engines/scumm/saveload.cpp, version de format 124, la seule acceptée) ; chaque taille du lecteur est une ligne de ce code, et la lecture n'est reconnue que si elle atteint EXACTEMENT le dernier octet (ressources verrouillées, état du CD, bloc son, jeu de caractères). Sinon : aucun crédit, jamais de valeur devinée.
- Unités retenues : objet global possédé par un acteur (propriétaire 1 à 14), indicateur (bitVars) à 1. Mémoire « déjà vu » (jamais redescendante) dans le navigateur (`soreal_idle_scummvm_progres_v1`, bitset par jeu). Les unités vraies au départ de la partie (`depart` du profil) ne comptent pas.
- Non retenues : variables globales (_scummVars) : minuteurs, aléa, temps et variables de travail du script se mélangent aux faits de scénario, sans règle vérifiable (TODO : établir une liste sûre sur des parties jouées jusqu'au bout ; le lecteur les décode déjà).
- Moteur : action `scummvmProgres` { jeu, unites, plafond, parUnite } (`src/idle-scummvm-progres-v1.js`, opération générique d'actions : le contrat du protocole ne change pas) ; état `systems.scummvm.data.jeux[id] = {unites, apCredite}` ; borne absolue `IDLE_SCUMMVM_AP_MAX_PAR_JEU_V1` (1 000 000, choix SOREAL à valider, inscrit au registre des constantes).
- Client : `modules/scummvm-progres-v1.js` (une attente de 30 s replanifiée tant que le jeu tourne, et à la fermeture de la page ; n'envoie que si le nombre d'unités a augmenté). La page montre seulement « AP gagnés avec ce jeu : N ».
- Tests : `idle-scummvm-sauvegarde-v1` (lecteur sur deux vraies sauvegardes, `cloudflare/tests/references/scummvm-tentacle-*-v1.bin`), `idle-scummvm-progres-moteur-v1`, `idle-scummvm-progres-client-v1`.
