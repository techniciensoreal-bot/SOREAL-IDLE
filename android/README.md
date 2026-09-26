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
