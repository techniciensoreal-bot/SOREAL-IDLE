# ScummVM dans Soreal IDLE (menu « Énigmes »)

Décisions de Norman (2026-11-22) : un menu de la liste (comme Time Machine), jeu affiché instantanément avec la partie déjà chargée, jouable au doigt sur téléphone, n'importe quel jeu ScummVM déposé dans un dossier R2, un jeu par difficulté, choisi plus tard. Chaque progrès dans le jeu (même ramasser un objet) rapportera un peu d'AP : étape suivante.

## Disposition R2 (seau `soreal`, préfixe `scummvm/`), servie par `GET /api/idle/scummvm/<clé>`
- `moteur/` : `scummvm.html`, `scummvm.js`, `scummvm.wasm`, `data/…` (moteur compilé ; 42 Mo + 11 Mo de données). Cache une semaine.
- `jeux/<dossier>/…` : fichiers d'un jeu et `index.json` (`{nom: taille}`). Revalidé à chaque fois (ETag).
- `jeux.json` : `{"jeux":[{"id":"sky-bass","nom":"Beneath a Steel Sky","dossier":"BASS-Floppy-1.3","cible":"sky","difficulte":"normal"}]}` (une entrée par difficulté : normal, evil, sadistic).

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

## Limites et points d'attention
- La page de démonstration d'origine envoyait des rapports d'erreurs à Sentry : l'outil la nettoie ; rien ne doit sortir de notre origine.
- ScummVM est sous licence GPL : publier les sources de toute modification du moteur ; le binaire de démonstration (Christian Kuendig) sert aux essais, à remplacer par notre compilation (`dists/emscripten/build.sh`) avant publication.
- Les jeux doivent être gratuits et redistribuables, ou fournis par le joueur.
- Sauvegardes : IndexedDB `/home/web_user` (table `FILE_DATA`, `saves/…`) de la même origine ; leur copie sur le compte et le crédit d'AP par progrès sont des étapes suivantes.
