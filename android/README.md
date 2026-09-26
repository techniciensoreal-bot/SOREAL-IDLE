# SOREAL IDLE — application Android (APK)

L'application est une **Trusted Web Activity** (TWA) : une coque Android qui ouvre https://soreal-idle.technicien-soreal.workers.dev en plein écran dans Chrome (sans barre
d'adresse), avec l'icône et le nom « SOREAL IDLE ». Le jeu reste servi par le site : une mise à jour du site est visible tout de suite, sans réinstaller l'APK.

Pourquoi une TWA et pas une simple WebView : la connexion Google (« Se connecter avec Google ») est refusée par Google dans une WebView intégrée ; dans une TWA elle passe
par Chrome et fonctionne.

- `twa-manifest.json` : configuration (identifiant `be.soreal.idle`, adresse, couleurs, icônes du site).
- Le site sert `/manifest.webmanifest` et `/icons/*` (dossier `cloudflare/public`).
- **Jamais dans le dépôt** : le fichier de clé de signature (`soreal-idle-release.keystore`) et son mot de passe. Ils restent sur l'ordinateur de Norman ; les perdre empêche de
  publier des mises à jour de l'APK sous le même nom. Le `.gitignore` de ce dossier l'exclut.
- `cloudflare/public/.well-known/assetlinks.json` (empreinte SHA-256 de la clé de signature) : à ajouter après la création de la clé, pour que l'application s'ouvre sans barre
  d'adresse.

Construction (Bubblewrap, nécessite JDK 17 + Android SDK, installés par Bubblewrap lui-même) :

    cd android
    npx @bubblewrap/cli build --manifest=twa-manifest.json
