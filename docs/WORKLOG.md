# WORKLOG — SOREAL-IDLE

Dernière mise à jour : 2026-09-21
Tâche en cours : remplacer progressivement le TTS navigateur par une couche audio capable de lire des fichiers pré-générés, avec fallback TTS.

## État vérifié avant chantier
- Branche : `main`
- SHA `main` vérifié : `005168cc4566fe4adb98fe76da1b30d5806510e9`
- Dernier workflow production : `Deploy SOREAL Idle to Cloudflare` run #498
- CI / déploiement du SHA ci-dessus : SUCCESS
- Tests/build locaux pour ce chantier : pas encore exécutés
- SHA réellement déployé vérifié avant chantier : `005168cc4566fe4adb98fe76da1b30d5806510e9`
- Dernière erreur : aucune erreur de CI connue à l'entrée du chantier
- Note : aucun `docs/WORKLOG.md` n'existait auparavant dans ce dépôt.

## Étape en cours
- Lire le TTS existant (`cloudflare/public/modules/tutorial-tts-v202.js`) et ses tests.
- Concevoir une première étape minimale : source audio pré-générée si disponible, sinon fallback Web Speech API.
- Ne pas ajouter encore de fournisseur TTS externe ni de secret/API.

## Prochaine action
Auditer le module TTS et les tests associés, puis ajouter un test de régression ciblé avant toute modification fonctionnelle.
