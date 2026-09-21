# WORKLOG — SOREAL-IDLE

Dernière mise à jour : 2026-09-21
Tâche : remplacer définitivement le TTS navigateur et le TTS cloud payant par une narration neurale française Piper exécutée localement dans le navigateur.

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


## Correctif MeloTTS V4 — code langue français
Diagnostic production du run #504 :
- tests : SUCCESS ;
- build : SUCCESS ;
- déploiement Worker : SUCCESS ;
- smoke test neural : FAILURE ;
- réponse réelle Cloudflare : `8002: Invalid input`.

Cause identifiée :
- le payload utilisait `lang: "fr"` ;
- MeloTTS upstream utilise les identifiants de langue en majuscules, dont `FR` pour le français ;
- Cloudflare documente actuellement un exemple en minuscules, mais des erreurs `8002` similaires sont documentées pour des codes de langue non acceptés.

Branche : `work/melotts-fr-v4`

Correctifs :
- `IDLE_NARRATION_LANG_V1` : `fr` → `FR` ;
- tests mis à jour ;
- smoke test production exige désormais `lang === "FR"`.

Validation hors production :
- workflow temporaire `Validate MeloTTS FR branch` run #1 ;
- SHA testé : `5100436f6221ead7e06feb9a3654c05cf974dac9` ;
- suite complète : SUCCESS ;
- build standalone : SUCCESS ;
- workflow temporaire supprimé au commit `4f646022f03078c04c20763f9edf2d22372a42b9`.

Prochaine action :
- vérifier que la branche est 0 commit derrière `main` ;
- merger ;
- vérifier la production et surtout `/api/v1/narration-health` avec le vrai modèle MeloTTS.


## Narration V5 — abandon MeloTTS, bascule Grok TTS
Diagnostic réel après V4 :
- MeloTTS accepte désormais le code langue mais renvoie `3043: Internal server error` côté Cloudflare ;
- la route Worker, le binding AI et le smoke test fonctionnent : l'échec est dans le backend MeloTTS français.

Décision :
- remplacement du modèle par `xai/grok-tts`, exposé via le même binding `env.AI` Cloudflare ;
- langue : `fr` ;
- voix : `ara` (chaude/conversationnelle) ;
- sortie : MP3 fournie par URL signée, téléchargée côté Worker puis mise en cache R2 ;
- aucun retour de SpeechSynthesis n'est réintroduit ;
- cache déplacé sous `idle/narration/v2/fr/` ;
- le hash de cache inclut modèle + langue + voix ;
- le health check production exige modèle Grok TTS + français + voix ara + octets audio réels ;
- le workflow affiche désormais le corps JSON des erreurs du health check.

Prochaine action :
- valider la branche complète ;
- merger seulement si `main` n'a pas avancé ;
- exiger un health check Grok TTS réel vert en production.


## Narration V6 — Piper Plus local, sans crédits API
Diagnostic réel du run production #506 :
- tests : SUCCESS ;
- build : SUCCESS ;
- déploiement Worker : SUCCESS ;
- Grok TTS : FAILURE avec `2021: Insufficient AI Gateway credits`.
- Le blocage Grok est donc lié au compte Cloudflare/billing, pas au code client.

Décision V6 :
- le chemin de lecture client ne dépend plus de Workers AI ;
- `SpeechSynthesis` reste totalement interdit ;
- moteur : Piper Plus 0.7.0 en WebAssembly/ONNX dans le navigateur ;
- ONNX Runtime Web épinglé en 1.30.0 ;
- modèle : `ayousanz/piper-plus-css10-ja-6lang` ;
- modèle ONNX FP16 : environ 40 Mo, français explicitement supporté ;
- langue forcée : `fr` ;
- chargement lazy au premier usage ;
- modèle mis en cache par le navigateur après téléchargement ;
- progression affichée sur le bouton pendant chargement/génération ;
- aucun appel client à `/api/v1/narration` ;
- aucun fallback vers Web Speech ;
- cache-buster du contrôleur : `?v=225`.

Fichiers :
- nouveau `cloudflare/public/modules/local-neural-piper-v1.js` ;
- `cloudflare/public/index.html` ajoute un import map épinglé et charge le module local avant le contrôleur ;
- `cloudflare/public/modules/tutorial-tts-v202.js` utilise uniquement audio mappé ou Piper local ;
- nouveau test `idle-local-piper-neural.test.mjs` ;
- workflow production : suppression du health check payant Grok, remplacé par la vérification d'accessibilité des dépendances Piper/ONNX/modèle.

État branche : `work/local-piper-v6`.
Prochaine action : suite complète + build + smoke test Chromium générant réellement une phrase française avec Piper local. Aucun merge avant succès.


## Narration V6 — validation Piper locale réelle
Base `main` avant merge :
- SHA `main` : `71415350444c6a3197e04607ee521806791afabf`.
- Run production #506 : tests SUCCESS, build SUCCESS, déploiement Worker SUCCESS, puis échec du health check Grok pour crédits insuffisants ; la vérification finale du SHA actif a donc été SKIPPED.
- Dernier déploiement dont le SHA actif a été entièrement vérifié par le workflow : run #503, SHA `ede23e471987d7df187b67bba17a9c6d6b59f37d`, version Cloudflare `24eeb579-604e-449a-88f2-e64227ff2f77`, routage 100 %.

Branche : `work/local-piper-v6`.

Échecs réellement détectés pendant la validation :
1. run temporaire #1 : ancien test V207 encore lié au cloud `requestNeuralAudio_` ;
2. run #2 : import navigateur `@piper-plus/g2p` non résolu ;
3. run #3 : modèle CSS10 incompatible avec le fallback speaker embedding de Piper 0.7.0 (192 fourni, 256 attendu).

Correctifs :
- garde V207 alignée sur `requestLocalNeuralAudio_` et interdiction explicite de l'ancien TTS cloud / SpeechSynthesis ;
- import map épinglé : `piper-plus@0.7.0`, `@piper-plus/g2p@0.4.2`, `onnxruntime-web@1.30.0` ;
- modèle remplacé par le modèle multilingue de démo Piper :
  `https://huggingface.co/spaces/ayousanz/piper-plus-demo/resolve/main/models/multilingual-test-medium.onnx` ;
- langue forcée : `fr`.

Validation décisive :
- workflow temporaire `Validate local Piper V6 branch` run #4 ;
- SHA de code testé : `a6344354b3cd633c535e71f2c811bf301f389bee` ;
- suite complète `cloudflare/tests/*.test.mjs` : SUCCESS ;
- build standalone : SUCCESS ;
- dépendances Piper/G2P/ONNX/modèle : SUCCESS ;
- installation Chromium : SUCCESS ;
- synthèse française réelle dans Chromium : SUCCESS ;
- WAV produit : 161324 octets, MIME `audio/wav`, entête `RIFF` ;
- état moteur : `ready`, langue `fr` ;
- aucun avertissement `speaker_embedding`, aucun échec Rust WASM/G2P dans le run vert.

Nettoyage :
- workflow temporaire supprimé au commit `b2d81962815313a1e50d2ff8ceaa2e300322e70e`.
- le smoke test Chromium reste dans les tests comme harnais de validation ciblée, mais n'est pas exécuté automatiquement par le workflow production.

Prochaine action :
- comparer `work/local-piper-v6` à `main` et exiger 0 commit derrière ;
- créer/merger la PR ;
- vérifier le workflow production complet ;
- ne déclarer V6 en production qu'après tests, build, déploiement et vérification du SHA Cloudflare actif.


## Narration V6 — production vérifiée
- PR #7 fusionnée sur `main`.
- SHA de code fusionné et déployé : `854ff7729cff3f4db0821e63adab03b07eaceac9`.
- Workflow production : `Deploy SOREAL Idle to Cloudflare` run #507.
- Suite complète `cloudflare/tests/*.test.mjs` : SUCCESS.
- Build standalone frontend : SUCCESS.
- Déploiement Cloudflare Worker : SUCCESS.
- Vérification des dépendances Piper/G2P/ONNX/modèle : SUCCESS.
- Vérification du SHA actif : SUCCESS.
- Version Cloudflare active : `b9eacd00-fb6c-442d-9af6-14346fd97f2e`.
- Routage production : 100 %.
- Validation navigateur préalable : Chromium a synthétisé une phrase française réelle en WAV `audio/wav`, 161324 octets, entête `RIFF`, langue `fr`, moteur revenu à `ready`.
- Aucun `SpeechSynthesis` dans le frontend et aucun appel client au TTS cloud pour la narration.
- Le moteur courant est Piper Plus local dans le navigateur, avec dépendances épinglées et chargement lazy.

### État actuel / prochaine action
- V6 est sur `main` et le SHA de code est vérifié en production.
- Le commit WORKLOG final est docs-only et ne doit pas redéployer le Worker.
- Prochaine vérification fonctionnelle : tester un bouton de narration dans une vraie session SOREAL-IDLE sur desktop, puis mobile, afin d'évaluer la qualité audible et le temps de premier chargement.


## Narration V6 — production vérifiée
- PR #7 fusionnée.
- SHA de production déployé : `854ff7729cff3f4db0821e63adab03b07eaceac9`.
- Workflow production : `Deploy SOREAL Idle to Cloudflare` run #507.
- Suite complète : SUCCESS.
- Build standalone : SUCCESS.
- Déploiement Cloudflare Worker : SUCCESS.
- Vérification des dépendances locales Piper/G2P/ONNX/modèle : SUCCESS.
- Vérification du SHA Cloudflare actif : SUCCESS.
- Version Cloudflare active : `b9eacd00-fb6c-442d-9af6-14346fd97f2e`.
- Routage production : 100 %.
- Smoke Chromium pré-merge : SUCCESS sur `a6344354b3cd633c535e71f2c811bf301f389bee`, WAV français réel de 161324 octets, RIFF, état moteur `ready`.
- Le code client en production ne dépend plus de Grok/MeloTTS pour la lecture et n'utilise pas SpeechSynthesis.
- Modèle production : `multilingual-test-medium.onnx` de la démo Piper Plus, langue forcée `fr`.

Dernière erreur :
- aucune erreur CI/build/déploiement connue après le run #507.

Prochaine action :
- test auditif utilisateur dans SOREAL IDLE sur un bouton de narration réel, idéalement après un rechargement forcé afin de prendre les nouveaux assets.
- ce commit WORKLOG est docs-only ; le SHA réellement déployé reste `854ff7729cff3f4db0821e63adab03b07eaceac9`.


## Narration V7 — lecture navigateur réelle
Retour utilisateur après V6 :
- bouton : `Voix IA indisponible` sur navigateur réel.

Écart trouvé dans la validation V6 :
- le smoke Chromium V6 vérifiait uniquement que Piper pouvait synthétiser un WAV ;
- il ne vérifiait pas la lecture audio différée après chargement du modèle ;
- le contrôleur V6 appelait `HTMLAudioElement.play()` après plusieurs opérations asynchrones, donc hors de la fenêtre de geste utilisateur selon la politique autoplay du navigateur.

Correctif V7 :
- branche : `fix/piper-playback-v7` ;
- Web Audio `AudioContext` créé/réactivé dès le clic utilisateur ;
- impulsion silencieuse immédiate pour conserver le déverrouillage audio ;
- WAV Piper décodé puis lu via `AudioBufferSourceNode` ;
- arrêt de narration coupe aussi la source Web Audio ;
- cache-busters : Piper local `?v=2`, contrôleur narration `?v=226` ;
- en cas d'échec, le bouton affiche maintenant le code d'erreur au lieu du seul message générique.

Validation hors production :
- workflow temporaire : `Validate Piper playback V7 branch` ;
- run #1 : échec sur une assertion de test obsolète uniquement ;
- run #2 : SUCCESS ;
- suite complète : SUCCESS ;
- build standalone : SUCCESS ;
- Chromium lancé avec `--autoplay-policy=user-gesture-required` ;
- clic réel sur le bouton de narration : SUCCESS ;
- synthèse Piper : SUCCESS ;
- lecture complète Web Audio : SUCCESS ;
- `lastError=""` ;
- `audioState="running"` ;
- moteur Piper final : `ready`, langue `fr`.

Prochaine action :
- supprimer le workflow temporaire ;
- vérifier que la branche est 0 commit derrière `main` ;
- merger ;
- vérifier CI/build/déploiement/SHA Cloudflare actif ;
- retest utilisateur sur le bouton réel.


## Narration V7 — production vérifiée
- PR #8 fusionnée sur `main`.
- SHA de code déployé : `bee6933f4bae1dabb1192d14e8f7c56f6dfe4df0`.
- Workflow production : `Deploy SOREAL Idle to Cloudflare` run #508.
- Suite complète : SUCCESS.
- Build standalone : SUCCESS.
- Déploiement Cloudflare Worker : SUCCESS.
- Vérification dépendances Piper/G2P/ONNX/modèle : SUCCESS.
- Vérification du SHA actif : SUCCESS.
- Version Cloudflare active : `eebe7b14-c6f5-4c83-a229-51b98eec4a7e`.
- Routage : 100 %.
- Validation navigateur stricte avant merge : SUCCESS avec `--autoplay-policy=user-gesture-required`, clic réel, synthèse Piper, lecture complète Web Audio, `lastError=""`, `audioState="running"`.
- Cache-busters actifs : Piper local `?v=2`, contrôleur narration `?v=226`.
- Si un nouvel échec apparaît côté utilisateur, le bouton affiche maintenant le code d'erreur exact.

Prochaine action :
- retest utilisateur sur un bouton de narration réel dans SOREAL-IDLE.
- ce commit WORKLOG est docs-only ; le SHA de code réellement déployé reste `bee6933f4bae1dabb1192d14e8f7c56f6dfe4df0`.


## Narration V8 — diagnostic origine production
Objectif : reproduire la lecture Piper dans Chromium contre l’URL Cloudflare réellement déployée, sans modifier la production.

Branche : `diag/piper-production-v8`.

Diagnostic run #1 :
- commit : `907b07234a23ebb2e019cf847e06580cd02dad48` ;
- checkout : SUCCESS ;
- installation Chromium/Playwright : SUCCESS ;
- test production : FAILURE avant ouverture du navigateur ;
- erreur exacte : `ERR_MODULE_NOT_FOUND: Cannot find package 'playwright' imported from /tmp/piper-prod-smoke.mjs` ;
- cause : le script de diagnostic était créé dans `/tmp`, hors de l’arborescence du dépôt, donc la résolution ESM ne remontait pas vers le `node_modules` du workspace ;
- aucune conclusion sur Piper ou la production ne peut être tirée de ce run.

Prochaine action :
- déplacer le script de diagnostic sous le workspace du dépôt ;
- relancer le même test contre `https://soreal-idle.technicien-soreal.workers.dev/` ;
- ne toucher au code de narration qu’après obtention d’une erreur runtime réellement reproduite.
