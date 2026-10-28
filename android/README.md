# SOREAL IDLE — application Android (APK)

L'application est une **Trusted Web Activity** (TWA) : une coque Android qui ouvre https://soreal-idle.technicien-soreal.workers.dev en plein écran dans Chrome (sans barre
d'adresse), avec l'icône et le nom « SOREAL IDLE ». Le jeu reste servi par le site : une mise à jour du site est visible tout de suite, sans réinstaller l'APK.

Pourquoi une TWA et pas une simple WebView : la connexion Google (« Se connecter avec Google ») est refusée par Google dans une WebView intégrée ; dans une TWA elle passe
par Chrome et fonctionne.

- `twa-manifest.json` : configuration (identifiant `be.soreal.idle`, adresse, couleurs, icônes du site).
- Le site sert `/manifest.webmanifest` et `/icons/*` (dossier `cloudflare/public`).
- **Jamais dans le dépôt** : le fichier de clé de signature (`soreal-idle-release.keystore`) et son mot de passe. Ils restent sur l'ordinateur de Norman ; les perdre empêche de
  publier des mises à jour de l'APK sous le même nom. Le `.gitignore` de ce dossier l'exclut.
- `cloudflare/public/.well-known/assetlinks.json` : empreinte SHA-256 de la clé de signature (créée le 2026-09-26), pour que l'application s'ouvre sans barre d'adresse. Si la clé change, mettre cette empreinte à jour.
- Outils de construction installés sur le PC de Norman dans `%USERPROFILE%\.bubblewrap` (JDK 17, SDK Android, mot de passe de la clé) : hors dépôt.

Construction (Bubblewrap ; depuis PowerShell, avec `BUBBLEWRAP_KEYSTORE_PASSWORD` et `BUBBLEWRAP_KEY_PASSWORD` définis, et `$env:PATH="$PWD;$env:PATH"`) :

    cd android
    npx @bubblewrap/cli update --manifest=twa-manifest.json --skipVersionUpgrade
    npx @bubblewrap/cli build --manifest=twa-manifest.json --skipPwaValidation

Résultat : `app-release-signed.apk` (installable). L'étape finale « bundle .aab » (Play Store) échoue faute de `jarsigner` dans le PATH : sans importance pour l'APK.

**Barre de navigation Android (2026-09-26)** : avec `targetSdkVersion 35+`, Android impose l'affichage bord à bord et ignore `navigationColor` : la barre du bas apparaissait blanche. Après `bubblewrap update`, remplacer `targetSdkVersion 36` par `targetSdkVersion 34` dans `app/build.gradle` (fichier généré, non versionné) avant de construire, avec un `appVersionCode` supérieur dans `twa-manifest.json` pour que le téléphone accepte la mise à jour (même clé de signature).

**Écran de démarrage (2026-10-09, APK 1.0.2, code 3)** : l'écran Android qui précède le chargement affichait l'icône (carré tiré de la bannière, coupé). Les `splash.png` de `app/src/main/res/drawable-*` sont remplacés par une image transparente de 48 px : on ne voit plus que le fond bleu nuit `#071226` jusqu'à l'écran de chargement du jeu (l'APK passe de 3,8 à 1,1 Mo). `bubblewrap update` régénère ces images : après un `update`, les remplacer de nouveau. Pour construire sans régénérer le projet, répondre **n** à « apply changes to the project before building? ». Le changement de version (`versionCode` 3) est à faire à la main dans `app/build.gradle` ET dans `twa-manifest.json`. Android 12 et plus affiche en plus son propre écran système (icône dans un rond) : non modifiable.

## APK HORS LIGNE (2026-10-28, versionCode 4, « 2.0.0-hors-ligne »)

Application native (WebView) qui contient TOUT le jeu : le dossier public du site, les ~4 976 médias (images, voix, musiques, mêmes clés que le bucket R2), le catalogue de départ et le VRAI Worker du jeu (service worker `sw-idle-v1.js` construit depuis `cloudflare/local/sw-android.js`, sql.js + IndexedDB). Aucune connexion nécessaire ; même identifiant `be.soreal.idle` et même clé que la TWA : elle s'installe par-dessus (la partie en ligne n'est PAS reprise : nouvelle partie locale, ou « Charger une partie » avec un export).
- Construction : `node android/construire-hors-ligne.mjs` (options `--sans-medias`, `--code=N`, `--nom=…`) → `android/soreal-idle-hors-ligne.apk` (≈ 562 Mo, signé, aligné). Les médias viennent de `desktop/medias` : relancer `node desktop/recolter.mjs` avant pour récupérer les nouveautés (dos de carte, etc.).
- `hors-ligne/app/src/main/java/be/soreal/idle/MainActivity.java` : sert les fichiers de l'APK sur `https://appassets.androidplatform.net` (plages d'octets pour les sons), pont d'enregistrement des fichiers exportés (Téléchargements) et sélecteur de fichier (« Charger une partie »).
- Après un changement de `cloudflare/src` : `node cloudflare/tools/build-moteur-local.mjs`, `maj-pins.mjs`, puis reconstruire l'APK.
- Vérifié : le jeu démarre dans la vraie WebView Android (émulateur Android 34) ; démarrage, pseudo, rechargement, images, voix et route des médias vérifiés dans Edge sur les mêmes fichiers. L'émulateur de ce PC plante (segfault) après quelques minutes : l'enregistrement de fichier et le sélecteur de fichier Android n'ont pas pu être essayés.
