# WORKLOG — SOREAL-IDLE

Dernière mise à jour : 2026-09-21
Tâche : remplacer la lecture TTS navigateur par une narration neurale avec cache, tout en gardant un fallback fiable.

## État final vérifié
- Branche production : `main`
- SHA fonctionnel vérifié et déployé : `05003c6f7228de448a03459679ce0b8568ecb62c`
- Workflow production : `Deploy SOREAL Idle to Cloudflare` run #502
- Suite complète `cloudflare/tests/*.test.mjs` : SUCCESS
- Build standalone frontend : SUCCESS
- Déploiement Cloudflare Worker : SUCCESS
- Vérification du SHA actif : SUCCESS
- Version Cloudflare active : `0bfe1ed7-efa0-4763-b6a3-78c7a68b1a14`
- Routage production : 100 %
- Le commit WORKLOG qui suit est docs-only ; il ne touche pas `cloudflare/**` et ne redéploie pas le Worker.

## Narration V205 livrée
Ordre de lecture côté client :
1. audio explicitement mappé via `data-soreal-tts-audio-src` ou `__SOREAL_IDLE_NARRATION_AUDIO_MANIFEST__` ;
2. narration neurale SOREAL-IDLE ;
3. fallback `SpeechSynthesis` navigateur.

### Narration neurale
- Route : `POST /api/v1/narration`
- Authentification : session SOREAL-IDLE obligatoire.
- Validation interne : `/__soreal-idle-v1/session-validate`.
- Workers AI binding : `env.AI`.
- Modèle : `@cf/myshell-ai/melotts`.
- Langue : `fr`.
- Sortie : MP3.
- Limite : 3500 caractères par génération neurale ; les textes plus longs retombent sur SpeechSynthesis.
- Aucun secret tiers ni clé ElevenLabs dans le navigateur ou le dépôt.

### Cache
- Bucket existant : binding `SOREAL_R2`.
- Préfixe : `idle/narration/v1/fr/`.
- Clé : SHA-256 du modèle + langue + texte normalisé.
- Premier passage : génération Workers AI puis écriture R2.
- Passages suivants : lecture du MP3 R2 sans nouvelle inférence.
- Une panne R2 n'empêche pas de lire un audio déjà généré pendant la requête.
- Une panne Workers AI, un timeout client, une session invalide ou un texte trop long déclenche le fallback SpeechSynthesis.

### Client
- Module : `cloudflare/public/modules/tutorial-tts-v202.js`.
- API courante : `__SOREAL_IDLE_TUTORIAL_TTS_V205__`.
- Aliases V204/V203/V202 conservés.
- Cache-buster : `?v=222`.
- Timeout neural client : 12 s.
- Les Blob URLs audio sont libérées à la fin, à l'erreur et à l'arrêt.
- Le bouton Arrêter annule aussi une génération en attente grâce au compteur `speechGeneration`.

## Validation avant production
Une CI temporaire de branche a été utilisée pour ne pas tester pour la première fois en production :
- Branche : `work/neural-narration-v1`
- Workflow temporaire : `Validate neural narration branch`
- Run #1
- SHA testé : `953ba4089dda23a66b3061a4e885a7869b478531`
- Suite complète : SUCCESS
- Build standalone : SUCCESS
- Syntaxe des modules Worker : SUCCESS
- Workflow temporaire supprimé avant merge.

## Validation production
- Merge PR #2 : `05003c6f7228de448a03459679ce0b8568ecb62c`
- Run #502 : SUCCESS complet.
- Cloudflare a confirmé :
  - SHA : `05003c6f7228de448a03459679ce0b8568ecb62c`
  - version : `0bfe1ed7-efa0-4763-b6a3-78c7a68b1a14`
  - routage : 100 %.

## État actuel / dernière erreur
- Aucune erreur CI, build ou déploiement connue.
- La route, l'authentification, le cache R2 et le comportement client sont couverts par les tests.
- La seule vérification qui ne peut pas être effectuée depuis cette session est l'écoute réelle d'une génération MeloTTS avec une session joueur active.

## Prochaine action
Test manuel dans SOREAL-IDLE avec une session réelle :
- ouvrir un texte possédant un bouton de lecture ;
- lancer la lecture ;
- confirmer que la voix entendue est neurale et non la voix système ;
- relancer le même texte pour confirmer que la lecture reste correcte après mise en cache R2 ;
- tester ensuite sur mobile.
Si l'écoute réelle révèle un défaut, reprendre depuis ce SHA sans toucher aux autres dépôts.


## Correctif narration V2 — 2026-09-21
Retour utilisateur : la voix entendue restait identique au TTS navigateur.

Cause probable corrigée après vérification de la documentation Cloudflare :
- `env.AI.run()` MeloTTS était appelé avec `returnRawResponse:true`, option non documentée pour le binding Workers AI ;
- `rejectIfBusy:true` faisait échouer immédiatement la génération si le modèle était occupé ;
- le client abandonnait la génération neurale après 12 s.

Correctifs sur `work/neural-narration-v2` :
- appel MeloTTS ramené à l'API documentée : `env.AI.run(model,{prompt,lang})` ;
- suppression de `returnRawResponse` ;
- suppression de `rejectIfBusy` ;
- timeout client passé de 12 s à 30 s ;
- cache-buster narration passé à `?v=223` ;
- test MeloTTS ajusté au retour documenté `{audio: <base64 MP3>}`.

Validation hors production :
- workflow temporaire `Validate neural narration V2 branch` run #1 ;
- SHA testé : `33bf5a7ad28ad70be153721298b11bd614e6dbcc` ;
- suite complète : SUCCESS ;
- build standalone : SUCCESS ;
- workflow temporaire supprimé au commit `0340daa60460c5f53d0b98c35c5af0697d916b59`.

Prochaine action : comparer la branche à `main`, merger si 0 commit derrière, puis vérifier CI/build/déploiement/SHA production.


## Correctif narration V2 — état production vérifié
- Merge PR #3 : `ede23e471987d7df187b67bba17a9c6d6b59f37d`.
- Workflow production #503 : SUCCESS.
- Suite complète : SUCCESS.
- Build standalone : SUCCESS.
- Déploiement Cloudflare : SUCCESS.
- Vérification du SHA actif : SUCCESS.
- Version Cloudflare : `24eeb579-604e-449a-88f2-e64227ff2f77`.
- Routage : 100 %.
- Correctifs actifs : API MeloTTS documentée sans `returnRawResponse`, sans `rejectIfBusy`, timeout client neural 30 s, cache-buster `?v=223`.
- Prochaine action : retest réel d'un bouton de lecture dans SOREAL-IDLE. Si la voix reste identique, instrumenter la route pour exposer la raison exacte du fallback au lieu de continuer à deviner.


## Narration neurale V3 — suppression totale du TTS navigateur
Retour utilisateur : la voix restait celle du TTS système. Décision : supprimer totalement Web Speech / SpeechSynthesis et ne conserver que la narration neurale.

Branche : `work/neural-only-v3`

Modifications :
- `tutorial-tts-v202.js` réécrit en mode neural-only ;
- aucune utilisation de `window.speechSynthesis` ;
- aucune utilisation de `SpeechSynthesisUtterance` ;
- aucun fallback vers une voix système ;
- en cas d'échec neural : silence + message visible `⚠️ Voix IA indisponible` ;
- les textes longs sont découpés en morceaux de 2000 caractères et lus séquentiellement via MeloTTS ;
- timeout d'un appel neural : 45 s ;
- cache-buster narration : `?v=224` ;
- ancienne voix système `Fight!` supprimée de `audio-effects-v197.js` ;
- garde permanent `idle-no-browser-speech.test.mjs` : toute future réintroduction de SpeechSynthesis dans `cloudflare/public/` fait échouer la CI.

Diagnostic réel ajouté :
- route `GET /api/v1/narration-health` ;
- binding Cloudflare `CF_VERSION_METADATA` ;
- chaque nouvelle version Worker génère réellement une courte phrase MeloTTS française une fois ;
- résultat mis en cache R2 par version ;
- le workflow production appelle ce health check après déploiement et refuse un succès si MeloTTS ne renvoie pas d'audio ;
- modèle vérifié dans la documentation Cloudflare : `@cf/myshell-ai/melotts`, langue `fr`.

Validation hors production :
- workflow temporaire `Validate neural-only narration branch` ;
- run #4 sur `8dc2b97cca62ef47d3a82bf03527a94ea50f8abc` : SUCCESS ;
- suite complète : SUCCESS ;
- build standalone : SUCCESS ;
- garde global anti-SpeechSynthesis : SUCCESS.

Prochaine action :
- supprimer le workflow temporaire de branche ;
- vérifier que la branche est 0 commit derrière `main` ;
- merger ;
- vérifier le workflow production, y compris le nouveau smoke test MeloTTS réel et le SHA Cloudflare actif.
