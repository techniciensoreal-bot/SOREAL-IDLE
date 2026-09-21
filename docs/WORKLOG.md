# WORKLOG — SOREAL-IDLE

Dernière mise à jour : 2026-09-21
Tâche en cours : remplacer progressivement le TTS navigateur par une couche audio capable de lire des fichiers pré-générés, avec fallback TTS.

## État vérifié avant chantier
- Branche : `main`
- SHA `main` initial vérifié : `005168cc4566fe4adb98fe76da1b30d5806510e9`
- Dernier workflow production avant chantier : `Deploy SOREAL Idle to Cloudflare` run #498
- CI / déploiement du SHA initial : SUCCESS
- SHA réellement déployé avant chantier : `005168cc4566fe4adb98fe76da1b30d5806510e9`
- Commit de création du WORKLOG : `29d231ef11cf2c0726d5032ba73dcd52f85bd0ab` (docs uniquement, pas de déploiement attendu)
- Tests/build locaux pour ce chantier : non exécutables depuis le clone local de cette session car l'environnement ne résout pas github.com
- Dernière erreur : `git clone` local impossible (`Could not resolve host: github.com`). La connexion GitHub applicative fonctionne.
- Note : aucun `docs/WORKLOG.md` n'existait auparavant dans ce dépôt.

## Audit TTS vérifié
- Module de production : `cloudflare/public/modules/tutorial-tts-v202.js`.
- L'API exposée est actuellement `__SOREAL_IDLE_TUTORIAL_TTS_V203__` / alias V202.
- Lecture actuelle : Web Speech API uniquement (`window.speechSynthesis` + `SpeechSynthesisUtterance`).
- Le module contient des contournements Android : découpage <= 220 caractères, `resume()`, relance sans voix explicite.
- Le test `idle-tutorial-tts-v202.test.mjs` interdit explicitement tout `fetch`, `Audio` ou fichier .mp3/.wav/.ogg : ce garde doit être adapté pour autoriser la nouvelle architecture.
- Le cache-buster actuel du module dans `cloudflare/public/index.html` est `?v=210`.

## Stratégie de changement
- Première étape uniquement : support d'un audio pré-généré quand une source est fournie.
- Sources prévues : attribut `data-soreal-tts-audio-src` ou manifeste global par identifiant de cible.
- En cas de source absente, erreur de chargement ou lecture refusée : fallback vers le Web Speech API existant.
- Aucun fournisseur externe, secret ou génération dynamique n'est ajouté à cette étape.
- Le bouton et les API existants restent compatibles.

## Prochaine action
Créer une branche de travail depuis le SHA courant de `main`, modifier le module + test ciblé + cache-buster, vérifier la syntaxe et les tests ciblés récupérables, puis intégrer sur `main` et laisser la CI complète + déploiement vérifier le changement avant de le déclarer terminé.
