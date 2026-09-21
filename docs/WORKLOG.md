# WORKLOG — SOREAL-IDLE

Dernière mise à jour : 2026-09-21
Tâche : couche de narration audio pré-générée avec fallback TTS.

## État final vérifié
- Branche production : `main`
- SHA fonctionnel vérifié sur `main` : `98d3757dfd81e543e6c13059e73502147259aed6`
- Workflow : `Deploy SOREAL Idle to Cloudflare` run #501
- Suite complète de tests : SUCCESS
- Build standalone frontend : SUCCESS
- Déploiement Cloudflare Worker : SUCCESS
- Vérification du SHA actif : SUCCESS
- SHA réellement déployé : `98d3757dfd81e543e6c13059e73502147259aed6`
- Version Cloudflare active : `35a954af-f164-48a2-b776-b195f648cd0f`
- Routage production : 100 %
- Ce fichier WORKLOG est mis à jour par un commit docs-only après ce SHA ; ce commit ne touche pas `cloudflare/**` et ne déclenche donc pas de nouveau déploiement.

## Fonctionnalité livrée
- Module : `cloudflare/public/modules/tutorial-tts-v202.js` (API V204, alias V203/V202 conservés).
- L'audio pré-généré devient prioritaire lorsqu'une source est disponible.
- Sources supportées :
  - attribut `data-soreal-tts-audio-src` sur une cible ;
  - manifeste global `window.__SOREAL_IDLE_NARRATION_AUDIO_MANIFEST__` indexé par ID de cible ;
  - second argument optionnel de `readText(text, audioSrc)`.
- Si aucune source audio n'existe : fallback vers le Web Speech API existant.
- Si le chargement ou la lecture audio échoue : fallback vers SpeechSynthesis.
- `stop()` coupe désormais à la fois l'audio et SpeechSynthesis.
- Aucun secret ni appel direct à un fournisseur TTS n'est embarqué dans le navigateur.
- Cache-buster du module : `?v=221`.

## Validation ciblée effectuée avant intégration
Validation V8 avec faux `Audio` et faux `SpeechSynthesis` :
- syntaxe du module : OK ;
- audio pré-généré prioritaire : OK ;
- fallback SpeechSynthesis après erreur audio : OK ;
- arrêt audio par `stop()` : OK ;
- aucun `fetch()` direct vers un fournisseur TTS : OK.

## Historique CI de ce chantier
- Run #499 sur `5020a68fa9480c9bd2f5b54dc47e031a231d6a06` : FAILURE.
  - Cause : test `idle-tutorial-tts-v202.test.mjs` exigeait encore littéralement `readText:function(value)`.
  - Build/déploiement non exécutés.
- Correctif : `a3dd3992d213a57fa77b70065d1b06d36d548b81`.
- Run #500 : FAILURE.
  - Le test TTS principal passe.
  - Cause suivante : même garde obsolète dans `idle-v206-user-regressions.test.mjs`.
  - Build/déploiement non exécutés.
- Correctif : `98d3757dfd81e543e6c13059e73502147259aed6`.
- Run #501 : SUCCESS complet, y compris déploiement et vérification du SHA actif.

## Limitation de l'environnement
- Le clone local de cette session ne pouvait pas résoudre `github.com` (`Could not resolve host: github.com`).
- La connexion GitHub applicative a été utilisée pour les lectures/écritures.
- La validation définitive a donc été la suite complète GitHub Actions sur `main`, qui est verte.

## État actuel / dernière erreur
- Aucune erreur CI ou de déploiement connue après le run #501.
- Les textes existants continuent à utiliser SpeechSynthesis tant qu'aucun fichier audio pré-généré n'est renseigné pour leur cible.
- La couche nécessaire pour brancher des voix neurales est maintenant en production.

## Étape en cours — narration neurale V1
Branche : `work/neural-narration-v1`

Architecture retenue après vérification de la documentation Cloudflare :
- Workers AI binding `env.AI`.
- Modèle `@cf/myshell-ai/melotts`, langue `fr`.
- Endpoint public protégé par la session SOREAL-IDLE.
- Génération uniquement à la demande.
- Cache R2 déterministe par hash du texte sous `idle/narration/v1/fr/`.
- Le navigateur conserve SpeechSynthesis comme fallback si l'appel neural échoue.
- Aucun secret tiers ni clé ElevenLabs n'est nécessaire.

## Prochaine action
Ajouter le binding Workers AI, la route serveur authentifiée + cache R2 et ses tests, puis brancher le module client. Ne pousser sur `main` qu'après validation ciblée du diff.
