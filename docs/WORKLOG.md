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


### Validation V8 — run #1
- commit testé : `d0078e2594a07c2d99c73b43b0f7bbbfea9d1513` ;
- nouveau test proxy same-origin : SUCCESS ;
- suite complète : FAILURE avant build/smoke ;
- erreur exacte : `idle-tutorial-tts-v202.test.mjs:90` attend encore `/modules/local-neural-piper-v1.js?v=2` ;
- cause : assertion de garde obsolète après passage volontaire du cache-buster Piper à `?v=3` ;
- build et smoke navigateur : non exécutés sur ce run.

Prochaine action :
- mettre à jour cette assertion vers `?v=3` ;
- relancer la validation complète sans autre changement fonctionnel.


### Validation V8 — run #3 vert
- commit de code testé : `bbe200465e8471b249589edb1025e4de28b8ad55` ;
- suite complète `cloudflare/tests/*.test.mjs` : SUCCESS ;
- build standalone : SUCCESS ;
- installation Chromium/Playwright : SUCCESS ;
- smoke navigateur same-origin : SUCCESS ;
- Chromium exécuté avec `--autoplay-policy=user-gesture-required` ;
- Piper charge modèle + configuration via la route same-origin ;
- synthèse française : SUCCESS ;
- lecture Web Audio : SUCCESS ;
- aucune erreur CORS / `Failed to fetch`.

État :
- correction validée sur branche uniquement ;
- aucune fusion sur `main` ;
- aucun déploiement production V8 à ce stade.

Prochaine action :
- ajouter ce smoke réel au workflow de production après vérification du SHA déployé ;
- revalider la branche ;
- supprimer le workflow temporaire de branche ;
- comparer à `main`, merger seulement si la branche n’est pas en retard ;
- vérifier ensuite CI, build, SHA Cloudflare et smoke Piper sur la vraie production.


### Validation V8 — run #5 final
- commit testé : `580815bdd75dbaf7c758c2b3d85b16128e22198e` ;
- suite complète : SUCCESS ;
- build standalone : SUCCESS ;
- installation Chromium : SUCCESS ;
- smoke Piper same-origin : SUCCESS ;
- la vérification permanente du smoke sur l’origine de production est maintenant intégrée à `.github/workflows/cloudflare-deploy.yml`.

État :
- correction validée sur branche ;
- pas encore fusionnée sur `main` ;
- pas encore déployée en production.

Prochaine action :
- supprimer le workflow temporaire `validate-piper-same-origin-v8.yml` ;
- vérifier l’écart exact avec `main` ;
- fusionner uniquement si la branche est à jour ;
- vérifier le run de production complet, le SHA actif et le smoke navigateur contre l’origine Cloudflare.


### V8 — état pré-fusion vérifié
- `main` vérifié : `84e52feff5cc77b17967a680dac220926d237fd9` ;
- tête de branche avant cette note : `af43120500642bb161c02f9e2525d109804fa0eb` ;
- comparaison : branche `ahead` de 13 commits, `behind_by=0` ;
- workflow temporaire V8 supprimé avant fusion ;
- dernier code réellement validé : `580815bdd75dbaf7c758c2b3d85b16128e22198e` ;
- run de validation V8 #5 : SUCCESS complet (tests, build, Chromium, synthèse et lecture same-origin).

Prochaine action :
- créer puis fusionner la PR V8 vers `main` ;
- suivre le workflow `Deploy SOREAL Idle to Cloudflare` ;
- exiger : tests SUCCESS, build SUCCESS, déploiement SUCCESS, SHA Cloudflare actif correct et smoke Piper production-origin SUCCESS.


## Narration V8 — production vérifiée
Cause réelle du message utilisateur `Voix IA indisponible` :
- Piper V7 chargeait directement le modèle depuis Hugging Face ;
- sur l’origine réelle Cloudflare, le navigateur bloquait `multilingual-test-medium.onnx.json` par CORS ;
- erreur reproduite : `Failed to fetch` + absence de `Access-Control-Allow-Origin`.

Correctif :
- modèle Piper et configuration exposés par SOREAL-IDLE via :
  - `/api/idle/media/piper-model.onnx`
  - `/api/idle/media/piper-model.onnx.json`
- le navigateur ne contacte plus directement Hugging Face pour le modèle ;
- cache-buster du module Piper : `?v=3` ;
- test de non-régression du proxy ajouté ;
- smoke Chromium production-origin ajouté au workflow de déploiement permanent.

État vérifié :
- PR #9 fusionnée ;
- SHA de code sur `main` et déployé : `0254667cf5abf348f9f6399240d010ed09d3afae` ;
- workflow production : `Deploy SOREAL Idle to Cloudflare` run #509 ;
- suite complète : SUCCESS ;
- build standalone : SUCCESS ;
- déploiement Cloudflare : SUCCESS ;
- dépendances Piper/G2P/ONNX/modèle : SUCCESS ;
- vérification SHA actif : SUCCESS ;
- version Cloudflare active : `592732fb-1ef6-4313-980d-51d486bc3415` ;
- routage : 100 % ;
- smoke Chromium sur `https://soreal-idle.technicien-soreal.workers.dev/` : SUCCESS ;
- `lastError=""` ;
- `audioState="running"` ;
- moteur Piper final : `status="ready"`, langue `fr` ;
- modèle réellement utilisé : `https://soreal-idle.technicien-soreal.workers.dev/api/idle/media/piper-model.onnx`.

Dernière anomalie connue :
- aucune erreur CI/build/déploiement/Piper connue après le run #509.
- l’ancienne erreur CORS Hugging Face est couverte par le smoke permanent.

Prochaine action :
- retest auditif utilisateur sur un bouton de narration réel ;
- si un défaut subsiste sur un navigateur précis, relever le code d’erreur affiché par le bouton et diagnostiquer ce navigateur sans remettre en cause le chemin production déjà vérifié.


## Narration V9 — choix de voix IA
Démarrage : 2026-09-21.
- Dépôt traité : SOREAL-IDLE uniquement.
- Branche : `feat/piper-voice-choice-v9`.
- `main` vérifié au démarrage : `31677b98a7bb8901ccefb1fe0a9cc199af9796c7` (commit docs-only).
- Dernier SHA de code vérifié en production avant ce chantier : `0254667cf5abf348f9f6399240d010ed09d3afae`.
- État production de départ : run #509 SUCCESS, tests/build/déploiement/SHA actif/smoke Piper production-origin SUCCESS.
- Demande : permettre au joueur de choisir réellement sa voix IA.
- Constat : le modèle V8 courant n'expose qu'un seul locuteur et l'API navigateur Piper Plus 0.7.0 ne propose pas de sélection speakerId ; un faux sélecteur est donc exclu.
- Direction retenue : choix entre plusieurs modèles vocaux français mono-locuteur, chargés à la demande et mémorisés localement, sans réintroduire SpeechSynthesis ni TTS cloud.

État actuel : modification de code non commencée sur cette branche.
Prochaine action : ajouter les routes modèles vocales, la sélection persistante côté Piper, l'interface de choix et les tests de non-régression.


### V9 — modèles et contrôleur multi-voix ajoutés
Commits réalisés :
- `3fdd193d` : routes proxy pour les modèles sélectionnables ;
- `3d4ed1fb` : tests des routes proxy ;
- `790f1fe3` : moteur Piper avec sélection persistante et changement de modèle ;
- `e753f357` : sélecteur de voix dans les contrôles de narration ;
- `502cfa63` : cache-busters V9 ;
- `08523ec0` / `cf687ee7` : tests de non-régression du moteur et du sélecteur ;
- `d5386213` : smoke Chromium prévu pour synthétiser SOREAL, Siwis et Gilles ;
- `2d9dcf77` : CI vérifie la disponibilité des trois modèles.

Voix configurées :
- SOREAL : modèle V8 actuel ;
- Siwis : fr_FR-siwis-medium (Piper voices v1.0.0) ;
- Gilles : fr_FR-gilles-low (Piper voices v1.0.0).

Dernière anomalie :
- validation locale impossible dans le conteneur ChatGPT : `git clone` échoue avec `Could not resolve host: github.com` ; ce n'est pas une erreur du dépôt ni des tests.

État tests/build :
- non encore exécutés sur GitHub pour V9.
Prochaine action :
- ajouter un workflow temporaire de validation de branche ;
- ouvrir la PR pour déclencher tests + build + Wrangler local + Chromium sur les trois voix.


### Validation V9 — échec Chromium #1
Run GitHub Actions : `35649204569`.
- Suite complète : SUCCESS.
- Build standalone : SUCCESS.
- Dépendances des trois voix : SUCCESS.
- Worker Wrangler local : SUCCESS.
- Smoke Chromium : FAILURE après succès de la voix SOREAL.

Erreur exacte sur Siwis :
`openjtalkModule is required. Pass it via new JapaneseG2P({ openjtalkModule }) or initialize({ openjtalkModule }).`

Cause vérifiée :
- les anciens modèles Piper mono-langue Siwis/Gilles n'ont pas de `language_id_map` ;
- Piper Plus 0.7.0 initialise alors tous les G2P JS, dont le japonais, ce qui réclame OpenJTalk alors que seule la phonémisation française est nécessaire ;
- le modèle SOREAL actuel possède une carte de langues et passe correctement.

Prochaine action précise :
- adapter uniquement les configs same-origin Siwis/Gilles pendant l'initialisation pour borner le G2P à `fr`, puis retirer cette carte de compatibilité avant l'inférence afin de ne pas envoyer de tenseur `lid` aux modèles mono-langue ;
- relancer la validation complète avant fusion.


### Validation V9 — run vert pré-fusion
- Workflow temporaire : `Validate Piper voice choice V9`.
- Run : `35649603324`.
- Job : `106498440361`.
- SHA de code validé : `502fbf3b3737de16fd3e42c7586e9a51153c3f0b`.
- Suite complète `cloudflare/tests/*.test.mjs` : SUCCESS.
- Build standalone + vérifications syntaxiques : SUCCESS.
- Disponibilité des dépendances et des trois modèles : SUCCESS.
- Worker Wrangler local : SUCCESS.
- Chromium avec politique autoplay stricte : SUCCESS.
- Synthèse + lecture Web Audio SOREAL : SUCCESS.
- Synthèse + lecture Web Audio Siwis : SUCCESS.
- Synthèse + lecture Web Audio Gilles : SUCCESS.
- État final : `lastError=""`, `audioState="running"`.
- Aucun SpeechSynthesis ni TTS cloud réintroduit.

Important :
- ce run valide la branche contre un Worker local, pas encore la production ;
- aucune fusion sur `main` ni aucun déploiement V9 n'a encore eu lieu.

Prochaine action :
- supprimer le workflow temporaire de validation ;
- vérifier que la branche reste `behind_by=0` par rapport à `main` ;
- fusionner la PR #10 ;
- exiger ensuite le workflow de production complet avec SHA Cloudflare actif et smoke Chromium réel sur les trois voix.


### V9 — état pré-fusion vérifié
- Workflow temporaire de validation supprimé au commit `f2496938289954dc8a90aefbb839d34a39568af8`.
- `main` vérifié avant fusion : `31677b98a7bb8901ccefb1fe0a9cc199af9796c7`.
- Branche V9 : `behind_by=0`.
- Comparaison depuis le SHA de code validé `502fbf3b3737de16fd3e42c7586e9a51153c3f0b` : uniquement `docs/WORKLOG.md` modifié et workflow temporaire retiré ; aucun fichier de production/test validé n'a changé après le run vert.
- PR : #10.

Prochaine action :
- fusionner la PR #10 vers `main` ;
- vérifier le workflow de production complet ;
- ne déclarer V9 disponible qu'après tests/build/déploiement, vérification du SHA Cloudflare actif et smoke Chromium des trois voix contre l'origine de production.


## Refactor découpage UI V1 — 2026-09-21
- Tâche en cours : réduire progressivement le monolithe `cloudflare/public/soreal-idle-ui.js` (~1,1 Mo), sans changement fonctionnel.
- Base vérifiée : `main` = `490473687f88b58c8ceb669e79e6a9dddbacdd04`.
- Branche : `refactor/split-idle-ui-v1`.
- Première étape : activation du module auxiliaire déjà extrait `cloudflare/public/modules/ui.js` (Advanced Training + Money Pit/Daily Spin) avant le monolithe.
- Commit chargement : `378df9630cc41db2968dc592bb785260651c060d`.
- Commit test ordre de chargement : `4b5359e39507908753e8f349a648e8b17b0cc927`.
- Production : inchangée ; rien de cette branche n'est sur `main`.
- Tests/CI de branche : à lancer/vérifier avant toute extraction supplémentaire.
- Prochaine action : exécuter les tests sur la branche, corriger toute régression, puis seulement choisir le prochain bloc autonome à extraire.

- Validation branche UI split : run #3 (ID 35651772502) SUCCESS sur `a99663da8f75f288f807ea523ffe5991571b238f` ; suite complète SUCCESS ; build standalone + syntaxe SUCCESS.
- Deux faux négatifs de test corrigés avant validation : ancien contrat interdisant `modules/ui.js`, puis ordre de chargement du test mal recalculé.
- Workflow temporaire supprimé après validation au commit `6a089556a46b3948b936ea703b6467ac8088d88e`.
- Prochaine action : merger PR #11, vérifier le nouveau SHA `main`, puis vérifier le workflow production complet et le SHA réellement déployé avant de poursuivre les extractions suivantes.


## Refactor découpage UI V2 — 2026-09-21
- V1 mergée sur `main` : `2f7216f107d1f13eee3b6ce881947a4b2555b562`.
- Production run #511 / ID `35651868202` : SUCCESS complet.
- Tests complets : SUCCESS ; build standalone : SUCCESS ; déploiement Worker : SUCCESS ; dépendances Piper : SUCCESS ; SHA production : SUCCESS ; smoke Chromium Piper : SUCCESS.
- Branche V2 créée depuis ce SHA production vérifié : `refactor/split-idle-ui-v2`.
- Blocage technique constaté pour l'extraction suivante : l'API GitHub de lecture par plages renvoie un contenu vide pour `soreal-idle-ui.js` (1,1 Mo) et le fetch brut refuse le fichier comme trop volumineux. Ne pas modifier le monolithe à l'aveugle.
- Prochaine action précise : utiliser une méthode de récupération adaptée au gros blob ou une extraction basée sur une copie locale, identifier les frontières d'un bloc autonome, puis seulement créer le module V2 avec test de parité.

- UI split V2 validation : run `35652426289` SUCCESS sur `b8f2906efe964518465e0146a1d2fd4e256485e0` ; tests complets + build/syntaxe validés.
- Module extrait : `modules/item-presentation-v1.js`; monolithe délègue la présentation emoji des objets.
- Workflow V2 temporaire supprimé après validation. Prochaine action : merge PR #12 puis validation production complète avant V3.


## Refactor découpage UI V3 — 2026-09-21
- Base production vérifiée : `main` = `1e16b4d0139154deac8e378eac54274526a5ebb4`, run #512 SUCCESS complet.
- Extraction : formatteurs numériques vers `cloudflare/public/modules/number-format-v1.js` ; wrappers compatibles conservés dans le monolithe.
- Validation #1 : faux négatif du nouveau test (attendait `999.4` au lieu du comportement historique localisé `999,4`). Aucun changement fonctionnel appliqué pour le corriger.
- Validation #2 : run `35652922982` SUCCESS sur `684ce36b665742f7c49c216177bf8af41cb14570` ; suite complète + build/syntaxe SUCCESS.
- Workflow V3 temporaire supprimé. Prochaine action : merge PR #13 et vérifier production complète avant V4.


## Refactor découpage UI V4 — 2026-09-21
- V3 production : `main` = `8dde82bc52d8710d0e8b94d834c6ac3e911ad2fd`, run #513 SUCCESS complet (tests, build, Worker, dépendances Piper, SHA déployé, Chromium Piper).
- Extraction V4 : formatage de durée/run/heures vers `cloudflare/public/modules/time-format-v1.js` ; wrappers historiques conservés.
- Validation V4 : run `35653334813` SUCCESS sur `69756446b4033a46b4fa193ad3874825a5a08173` ; suite complète + build/syntaxe SUCCESS.
- Workflow temporaire supprimé. Prochaine action : merge PR #14 puis vérifier production avant V5.


## Refactor découpage UI V5 — 2026-09-22
- Base production V4 : `main` = `72cc1d676bc3dc2e363053a67770e52e4698d6fd`, run #514 SUCCESS complet.
- Extraction V5 : helpers texte purs vers `cloudflare/public/modules/text-helpers-v1.js` (effets, dégât(s), nom R2, ressources).
- Validation V5 : run `35686720053` SUCCESS sur `dca5d2cd3643d0ca2379a515f8439243715fe76b` ; suite complète + build/syntaxe SUCCESS.
- Workflow temporaire supprimé. Prochaine action : merge PR #15 puis vérifier production avant V6.


## Refactor découpage UI V6 — 2026-09-22
- Base production V5 : `main` = `5aafaef0513efaeecfd5e9a38b37ccede7ff7c49`, run #515 SUCCESS complet.
- Extraction V6 : présentation inventaire (noms/icônes de slots + classe de rareté) vers `cloudflare/public/modules/inventory-presentation-v1.js`.
- Validation V6 : run `35687115563` SUCCESS sur `3f75641a16b82b3d73a75eec645103da620599b8` ; suite complète + build/syntaxe SUCCESS.
- Workflow temporaire supprimé. Prochaine action : merge PR #16 puis vérifier production avant V7.


## UI split V7 — 2026-09-22
- Base vérifiée : main `a79667ed2623965b36ba69a1db19714215c37547`.
- Tâche : réduction du monolithe `cloudflare/public/soreal-idle-ui.js` par gros blocs cohérents.
- Extraction texte : `texte69LolIdleV183_` et `idHtml_attr_` vers `modules/text-transforms-v1.js`.
- Extraction majeure : stylesheet embarqué déplacé vers `cloudflare/public/soreal-idle-ui.css` et chargé avant le bridge standalone.
- Monolithe avant V7 : 32 025 lignes.
- Monolithe après V7 : 25 047 lignes.
- Réduction nette V7 : 6 978 lignes (~22 %).
- Nouveau CSS extrait : 6 960 lignes.
- Les échecs intermédiaires provenaient de tests historiques qui lisaient les styles dans le JS ; contrats migrés vers le CSS extrait, sans suppression des assertions fonctionnelles.
- Validation branche : workflow `Validate UI split V7`, run `35689483439` : SUCCESS complet (suite cloudflare/tests, build standalone et contrôles de syntaxe).
- Workflow temporaire supprimé après validation au commit `7754af745a797cd8ed67ea6c6f73af7d4bd53f94`.
- Dernière erreur : aucune sur la validation V7.
- Prochaine action : merger PR #17, vérifier le SHA réel de main et le déploiement production ; ensuite créer V8 depuis ce main et extraire un nouveau sous-système cohérent de 500–2000+ lignes.


## UI split V8 — 2026-09-22
- Base production V7 : `main` = `8d53eacbb2496321dc59f98917391d11df3e4613`, production run `35689554263` SUCCESS complet.
- Extraction : 348 blocs de commentaires historiques multiline retirés du runtime et conservés dans `docs/UI-MONOLITH-HISTORY.md`.
- Monolithe avant V8 : 25 047 lignes.
- Monolithe après V8 : 22 025 lignes.
- Réduction nette V8 : 3 022 lignes.
- Documentation extraite : 4 767 lignes.
- Tests qui dépendaient de libellés de commentaires migrés vers des invariants de code exécutables (V177, drain Fight Boss, V175, gestes V196, tutoriel draggable).
- Validation branche : run `35690224012` SUCCESS complet (suite tests, build standalone, syntaxe).
- Workflow temporaire V8 supprimé après validation.
- Dernière erreur : aucune.
- Prochaine action : merge PR #18, vérifier production, puis reprendre V9 avec extraction d'un sous-système JavaScript cohérent.

## UI split V8 — production vérifiée
- PR #18 fusionnée sur `main` : `539199f5c8620bc02f0cc3e1d9518ace6ac7e916`.
- Vérifié indépendamment en reprenant cette session (nouveau dépôt, local remis à jour depuis un HEAD périmé) : ni supposé ni recopié du WORKLOG.
- Workflow production `Deploy SOREAL Idle to Cloudflare` run #518 : **succeeded en 1m 32s**, toutes les étapes vertes :
  - Run test suite : OK
  - Build standalone frontend : OK
  - Deploy SOREAL Idle Worker : OK
  - Verify local neural dependencies : OK
  - Verify deployed Git SHA : OK (`wrangler deployments status --json`, comparaison directe au SHA courant, pas de tri de liste — pas exposé au bug d'ordre trouvé sur SOREAL-TV/SOREAL-APP)
  - Verify deployed Piper narration in Chromium : OK (synthèse + lecture réelle)
- Production reconfirmée par requête directe indépendante (`curl` hors CI) : HTTP 200 sur `https://soreal-idle.technicien-soreal.workers.dev/`.
- Anomalie mineure repérée en passant (non bloquante, hors périmètre V8) : `/api/v1/narration-health` répond encore `{"ok":false,"error":"2021: Insufficient AI Gateway credits","model":"xai/grok-tts"}` — reste de l'ancienne route Grok TTS (V5, abandonnée dès V6 au profit de Piper local). Le client n'appelle plus cette route depuis V6, donc aucun impact utilisateur actuel ; à nettoyer un jour comme dette technique (route morte qui signale une fausse erreur si quelqu'un la consulte).
- État : aucune erreur bloquante ni bug fonctionnel connu sur SOREAL-IDLE à ce stade. Prochaine action potentielle : V9 (poursuite du découpage du monolithe UI, dette technique non urgente) ou nettoyage de la route Grok TTS morte, selon priorité de l'utilisateur.

## UI split V9 — 2026-09-22
- Base vérifiée : `main` = `539199f5c8620bc02f0cc3e1d9518ace6ac7e916` (V8, production vérifiée).
- Extraction : dispatcheur "Système Méta" (Yggdrasil, Gold Diggers, Perks, Quirks, ITOPOD, Challenges, Augmentations, Time Machine, Blood Magic, Money Pit/Daily Spin, Boutique EXP) vers `cloudflare/public/modules/meta-progression-v130.js`.
- Monolithe avant V9 : 22 025 lignes. Monolithe après V9 : 20 866 lignes (-1159, ~5 %).
- Différence de nature avec V1-V8 : ce bloc n'est pas une fonction utilitaire pure ni un composant DOM isolé — il réassigne `idleEtat` et appelle la synchronisation combat/serveur en direct. Un pont de dépendances explicite (`window.__SOREAL_IDLE_META_HOST_V130__`, relu à l'exécution et non au chargement, insensible à l'ordre des balises `<script>`) expose tout ce que le module lit/écrit dans la fermeture du monolithe.
- 4 fonctions extraites restaient appelées ailleurs dans le monolithe par leur nom (menu router, navigation, alias legacy V47) : conservées comme wrappers fins qui délèguent au module via `window.__SOREAL_IDLE_META_V130__`.
- Cartographie des dépendances externes faite par script (pas manuellement) pour éviter tout oubli silencieux ; 2 dépendances manquées à la première passe manuelle (`formatterHeuresIdleV47_`, `rendreIdleEtat_`) détectées et corrigées par un second script de vérification systématique avant assemblage.
- 9 tests existants avaient des faux négatifs après l'extraction (cache-buster `?v=220→221`, ou contenu légitimement déplacé) : corrigés pour vérifier la présence dans l'une ou l'autre source plutôt que de figer où chaque chaîne doit vivre.
- Nouveau test de contrat `idle-meta-progression-module.test.mjs` : charge le module en isolation (vm) avec un pont hôte simulé, exerce un vrai chemin de rendu (page Money Pit), vérifie la garde de session de `actionMetaIdleV130_`, et vérifie que le monolithe expose bien le pont + les 4 wrappers attendus.
- Suite complète locale : 171/171 OK.
- Validation branche : workflow temporaire `Validate UI split V9 branch` run #1 (`35724377758`) : SUCCESS (suite complète + build standalone + syntaxe, sur infrastructure GitHub Actions réelle). Workflow temporaire supprimé après validation.
- Prochaine action : merger sur `main`, vérifier le workflow de production complet (y compris le smoke Chromium Piper — sans rapport avec ce changement mais fait partie du gate standard), puis vérifier la production directement.

## UI split V9 — production vérifiée
- PR #19 fusionnée sur `main` : `766b9e5b80b82c18a01e3b3926614a10ea641103`.
- Workflow production `Deploy SOREAL Idle to Cloudflare` : **succeeded en 1m 39s**, toutes les étapes vertes :
  - Run test suite : OK (11s, 171 tests)
  - Build standalone frontend : OK
  - Deploy SOREAL Idle Worker : OK (24s)
  - Verify local neural dependencies : OK
  - Verify deployed Git SHA : OK
  - Verify deployed Piper narration in Chromium : OK (57s, synthèse + lecture réelle — sans rapport avec ce changement, fait partie du gate standard)
- Production reconfirmée par requête directe indépendante (`curl` hors CI) : `soreal-idle-ui.js?v=221` chargé, `modules/meta-progression-v130.js` accessible (HTTP 200).
- État : aucune erreur bloquante ni bug fonctionnel connu sur SOREAL-IDLE à ce stade. Monolithe réduit de 22 025 à 20 866 lignes depuis le début du chantier (V1-V9, ~5 % rien que sur V9, davantage cumulé depuis V1). Prochaine action potentielle : V10 (poursuite du découpage, dette technique non urgente) ou nettoyage de la route Grok TTS morte (`/api/v1/narration-health`, repéré en V8), selon priorité de l'utilisateur.

## Nettoyage narration serveur morte (Grok TTS) — 2026-09-22
- Demande utilisateur : nettoyer Grok TTS s'il est mort. Vérifié en direct avant toute suppression : `/api/v1/narration-health` répondait encore `2021: Insufficient AI Gateway credits` — confirmé mort, pas juste inutilisé.
- Confirmé qu'aucun code client (depuis V6, Piper Plus local) n'appelle plus `/api/v1/narration` — les gardes anti-régression existants (`idle-local-piper-neural`, `idle-tutorial-tts-v202`, `idle-v207-interactions-encounters-audio-tts`) l'interdisent déjà explicitement et restent en place.
- Supprimé : `cloudflare/src/idle-narration-v1.js` (génération + cache R2 via `xai/grok-tts`), les routes `/api/v1/narration` et `/api/v1/narration-health` du Worker, le binding `"ai"` dans `wrangler.jsonc` (plus aucun code ne lit `env.AI`), et `cloudflare/tests/idle-neural-narration-v1.test.mjs` (testait uniquement ce chemin mort).
- Suite complète locale : 170/170 OK.
- Commit `4695bb8b93664be2a617ed47cb9bae389214eca7`, poussé directement sur `main` (suppression pure, aucun changement de comportement client à valider sur branche séparée).
- Workflow production `Deploy SOREAL Idle to Cloudflare` : **succeeded en 1m 37s**, toutes les étapes vertes y compris le smoke Chromium Piper réel.
- Production reconfirmée par requêtes directes indépendantes : `/api/v1/narration-health` et `/api/v1/narration` renvoient désormais `404` ; `/` renvoie toujours `200`.
- Note : les objets déjà écrits dans le bucket R2 sous `idle/narration/v1/fr/`, `idle/narration/v2/fr/` et `idle/narration-health/v2/` (générés par l'ancien pipeline Grok/MeloTTS quand il fonctionnait encore) n'ont pas été purgés — nettoyage de données, hors périmètre de ce changement de code, à faire séparément si souhaité.

## Correctif sélecteur de voix inaccessible — 2026-09-22
Retour utilisateur : "je n'ai qu'une seule voix, pas d'option pour changer" — alors que V9 avait ajouté 3 voix Piper sélectionnables (SOREAL/Siwis/Gilles).

Diagnostic réel (pas supposé) :
- Le sélecteur de voix n'était injecté (`renderButton_`/`activePanel_`) que dans 3 popups ponctuels : tutoriel début de jeu, tutoriel premier boss, popup nouveauté — chacun affiché une seule fois grâce à un flag `localStorage`.
- Tous les autres boutons "Lire" permanents du jeu (chroniques de boss dans Settings > Info et dans la Collection, potentiellement d'autres) utilisent un mécanisme totalement séparé (`data-soreal-tts-target` + écouteur `document.click` global) qui n'a jamais attaché de sélecteur.
- Dans un usage réel du jeu, l'utilisateur ne pouvait donc jamais réellement voir ni utiliser le sélecteur — conforme au symptôme rapporté.

Correctif :
- Nouvelle fonction partagée `ensureVoiceSelectAfter_(anchor)` dans `tutorial-tts-v202.js`, appelée par `updateReadButtons_()` pour chaque bouton `.soreal-idle-tts-read-v203[data-soreal-tts-target]` détecté (scanné en continu par le `MutationObserver` existant).
- Réutilise le style déjà injecté (`style_()`, pastille bordée, lisible sur fond sombre) et le même `changeVoice_` que les popups.
- Cache-buster `tutorial-tts-v202.js` : `?v=227` → `?v=228`.

Vérification :
- Vérifié visuellement dans un navigateur réel (harnais HTML local temporaire, pas seulement des assertions de chaîne) : un bouton "Lire" simulé hors de tout popup reçoit bien un sélecteur listant les 3 voix ; changer la sélection appelle `setVoice(id)` et se resynchronise correctement. Harnais supprimé après vérification, jamais commité.
- Suite complète locale : 170/170 OK (2 tests mis à jour pour le nouveau cache-buster + une nouvelle assertion structurelle garantissant que `updateReadButtons_` attache bien le sélecteur).
- Commit `df7407ac0a3b13f3853ab477748e744149860633`, poussé sur `main`.
- Workflow production `Deploy SOREAL Idle to Cloudflare` : **succeeded en 1m 41s**, toutes les étapes vertes y compris le smoke Chromium Piper réel.
- Production reconfirmée par requête directe indépendante : `tutorial-tts-v202.js?v=228` chargé.

Prochaine action potentielle (non demandée pour l'instant, à discuter séparément avec l'utilisateur) : générer et mettre en cache sur R2 le premier résultat de synthèse Piper (gratuit, local) pour accélérer les écoutes suivantes du même texte, sans réintroduire de dépendance à un TTS serveur payant.

## Correctif sélecteur de voix — round 2 : rendu persistant — 2026-09-22
Retour utilisateur après le correctif précédent : "je n'arrive pas à sélectionner une voix dans la liste. Ça reste sur Voix SOREAL."

Root cause réelle, trouvée en instrumentant un vrai navigateur (harnais HTML local avec simulation de churn DOM), pas supposée :
- `rendreIdleEtat_` remplace **tout** `document.getElementById('app').innerHTML` à chaque synchronisation serveur — très fréquent dans un idle game.
- Le sélecteur attaché au round précédent à côté de chaque bouton "Lire" (`ensureVoiceSelectAfter_`) vivait à l'intérieur de `#app` : il était donc détruit et recréé en continu, souvent avant même que le clic du joueur n'ait pu s'enregistrer sur l'option choisie.
- Les 3 popups ponctuels (tutoriel, nouveauté) fonctionnaient, eux, précisément parce qu'ils sont attachés à `document.body` directement (`document.body.appendChild(...)`), hors de `#app`.

Correctif :
- Remplacé l'attache par bouton par **un seul sélecteur global et persistant** (`ensureGlobalVoiceControl_`), lui aussi attaché directement à `document.body` (position fixed, coin bas-droit, `z-index:5000`), créé une seule fois (jamais recréé) et resynchronisé à chaque scan sans jamais être détruit par un rafraîchissement de page.
- Les 3 popups ponctuels sont restés inchangés (ils fonctionnaient déjà correctement).
- Cache-buster `tutorial-tts-v202.js` : `?v=228` → `?v=229`.

Vérification (décisive, pas seulement des assertions de chaîne) :
- Harnais HTML local simulant `rendreIdleEtat_` : remplacement complet de `#app.innerHTML` toutes les 300ms. Sur plus de 200 cycles (3+ secondes), le nœud DOM du contrôle global n'est jamais recréé (`hostIsSameNode:true`, `hostParent:'BODY'`) et la voix sélectionnée reste stable (`Voix · Gilles` affiché correctement après 216 destructions du contenu). Harnais supprimé après vérification, jamais commité.
- Suite complète locale : 170/170 OK (assertions mises à jour pour vérifier `ensureGlobalVoiceControl_` + son attache à `document.body`, plus le nouveau cache-buster).
- Commit `68836fbd5c4439443cfa8a3e5cd37702693a2f70`, poussé sur `main`.
- Workflow production `Deploy SOREAL Idle to Cloudflare` : **succeeded en 1m 42s**, toutes les étapes vertes y compris le smoke Chromium Piper réel.
- Production reconfirmée par requête directe indépendante : `tutorial-tts-v202.js?v=229` chargé.

## Voix unique (Tom), suppression du sélecteur — 2026-09-22
Retour utilisateur après avoir pu réellement tester le sélecteur (corrigé au round précédent) : "je n'aime aucune des 3 voix. Quel serait le meilleur moyen d'en avoir des bien sans devoir payer ?"

Recherche (avant tout changement de code) :
- Catalogue officiel `rhasspy/piper-voices` pour le français (fr_FR) : `gilles` (low), `siwis` (low/medium), `mls` (medium), `mls_1840` (low), `tom` (medium), `upmc` (medium, 2 locuteurs). Aucune voix "high" n'existe en français chez Piper — "medium" est le plafond de qualité officiel.
- Site d'écoute officiel confirmé fonctionnel : `https://rhasspy.github.io/piper-samples/`.
- Voix précédemment utilisées : `siwis` et `gilles`. "SOREAL" (voix par défaut d'origine) n'est pas une voix Piper officielle du tout — modèle démo multilingue non listé dans ce catalogue.
- Utilisateur a écouté et choisi **Tom** (`fr_FR-tom-medium`), et a explicitement demandé de retirer le choix (une seule voix par défaut).

Changement :
- `cloudflare/src/idle-media-v1.js` : le proxy CORS Piper ne sert plus qu'un seul modèle (`fr_FR-tom-medium.onnx`) via `/api/idle/media/piper-model.onnx` (+`.json`). Retiré : la table multi-voix (`IDLE_PIPER_VOICES_V2`) et les 3 routes `piper-voice-{soreal,siwis,gilles}.onnx`. Le correctif de compatibilité G2P français (`language_id_map`, nécessaire pour toute voix Piper officielle mono-langue) s'applique désormais systématiquement, plus seulement aux voix non-"soreal".
- `cloudflare/public/modules/local-neural-piper-v1.js` : réécrit sans état de sélection/persistance de voix (`VOICES_V2`, `selectedVoiceId`, `setVoice_`, `localStorage`) — une seule URL de modèle fixe.
- `cloudflare/public/modules/tutorial-tts-v202.js` : retiré le sélecteur de voix global persistant (ajouté puis corrigé lors des deux rounds précédents) et toute son API publique (`voices`/`voice`/`setVoice`).
- Cache-busters : `local-neural-piper-v1.js` `?v=4→5`, `tutorial-tts-v202.js` `?v=229→230`.

Vérification :
- URLs du modèle Tom vérifiées accessibles avant tout changement (`curl`, HTTP 200, `.onnx` = 63 511 038 octets).
- Harnais HTML local (jamais commité) : confirmé qu'aucun `<select>` n'apparaît plus nulle part dans le DOM.
- Suite complète locale : 170/170 OK. 3 tests réécrits pour l'API voix unique (`idle-local-piper-neural.test.mjs`, `idle-piper-model-proxy.test.mjs`, `idle-tutorial-tts-v202.test.mjs`) + le smoke Chromium de production réel simplifié en conséquence (`idle-piper-production-origin.smoke.mjs`, testait auparavant les 3 voix en boucle).
- Commit `94f58e97c45f8580ce6beb9efdd6b6145ca03b7e`, poussé sur `main`.
- Workflow production `Deploy SOREAL Idle to Cloudflare` : **succeeded en 1m 51s**, y compris le smoke Chromium réel (1m 7s — téléchargement effectif du modèle Tom 63 Mo + synthèse + lecture Web Audio).
- Production reconfirmée par requêtes directes indépendantes : `local-neural-piper-v1.js?v=5` et `tutorial-tts-v202.js?v=230` chargés ; `/api/idle/media/piper-model.onnx` sert bien le modèle Tom (63 511 038 octets, HTTP 200) ; les anciennes routes `/api/idle/media/piper-voice-soreal.onnx` etc. renvoient `404`.

Dette technique repérée en passant, hors périmètre de ce changement : `idle-local-piper-browser-smoke.mjs` et `idle-local-piper-controller-smoke.mjs` pointent vers des pages de harnais local qui n'existent plus et ne sont exécutés par aucune CI — tâche séparée créée pour investigation/nettoyage.

## Nettoyage tests orphelins Piper local — 2026-09-22
Investigation de la dette repérée ci-dessus (`idle-local-piper-browser-smoke.mjs`, `idle-local-piper-controller-smoke.mjs`).

Constats :
- Les deux fichiers chargent `http://127.0.0.1:4173/__piper-smoke.html` et `__piper-playback-smoke.html` — des pages de harnais local qui n'ont jamais été commitées (voir note ligne 812 ci-dessus) et n'existent nulle part dans le dépôt.
- Aucune référence dans `.github/workflows/` ni dans `docs/` — confirmé par recherche.
- Non exécutés par la boucle de suite locale (`for f in cloudflare/tests/*.test.mjs`, voir `AGENTS.md`) : leur extension `.mjs` sans suffixe `.test.` les exclut déjà du pattern.
- `idle-local-piper-browser-smoke.mjs` contenait en plus une assertion obsolète : comparait `api.model` à l'ancienne URL directe HuggingFace (`https://huggingface.co/spaces/ayousanz/piper-plus-demo/...`), périmée depuis le proxy CORS `/api/idle/media/piper-model.onnx` et totalement fausse depuis le passage à la voix unique Tom (ce même jour, voir section précédente).
- `idle-local-piper-controller-smoke.mjs` référençait `window.__SOREAL_IDLE_TUTORIAL_TTS_V208__`, un global déjà remplacé par `V209` (voir `tutorial-tts-v202.js` current + `idle-piper-production-origin.smoke.mjs`).
- `cloudflare/tests/idle-piper-production-origin.smoke.mjs`, câblé dans le workflow de production (`.github/workflows/cloudflare-deploy.yml:155`), couvre déjà le même terrain contre la vraie origine Cloudflare : chargement du module, synthèse Piper, déverrouillage Web Audio, lecture complète — avec en plus la vérification de l'URL de modèle actuelle.

Décision : suppression pure, pas de récupération. Recréer les pages de harnais local aurait dupliqué une couverture déjà assurée en production par un test correctement câblé en CI, pour un gain nul (les pages harnais étaient de toute façon un choix délibéré de ne jamais committer). Supprimés : `cloudflare/tests/idle-local-piper-browser-smoke.mjs`, `cloudflare/tests/idle-local-piper-controller-smoke.mjs`.

Vérification :
- Suite complète locale : 170/170 OK (aucun de ces deux fichiers n'y participait, extension confirmée hors du pattern `*.test.mjs`).

## Remplacement du moteur de phonémisation (piper-plus → espeak-ng réel) — 2026-09-22
Retour utilisateur après avoir écouté Tom en jeu : "il lit super mal le texte. Pourtant sur l'autre page, il lisait bien. Ça ne ressemble presque pas à du français." Un premier WAV reproduisant exactement le pipeline du jeu (même modèle, mêmes réglages) présentait le même défaut. Reformulation décisive de l'utilisateur : "il y a le même souci [...] déjà avec les voix avant ça il y avait le même problème [...] on dirait qu'ils ont un accent autre que français [...] ne s'arrêtent pas aux virgules" — le défaut n'était donc pas spécifique à Tom, il était présent depuis la toute première voix Piper intégrée (V6).

Root cause (confirmée en lisant le code source, pas supposée) :
- `piper-plus@0.7.0` embarque son **propre phonémiseur maison** (`@piper-plus/g2p@0.4.2`), à base de règles, qui n'est **pas** espeak-ng.
- Les modèles Piper officiels (`rhasspy/piper-voices`, dont `fr_FR-tom-medium`) sont entraînés sur des phonèmes produits par le **vrai** espeak-ng (l'outil C++ `piper_phonemize` utilisé par le projet Piper original).
- Ce décalage phonèmes-d'entraînement / phonèmes-d'inférence explique mécaniquement l'accent étranger, les mauvaises prononciations et l'absence de pause aux virgules constatés sur les 3 voix testées (siwis, gilles, tom) : le modèle reçoit des identifiants de phonèmes qu'il n'a jamais vus à l'entraînement pour la plupart des mots.
- Piste de correctif léger testée et rejetée : retirer l'option `language` de `piper-plus` (pour éviter son tenseur `lid` erroné côté ONNX) — échoue immédiatement (`G2P: language "en" is not initialised`), car la bibliothèque bascule alors sur l'anglais par défaut. Aucun correctif interne à `piper-plus` n'est viable sans un vrai changement de moteur.

Recherche (agent dédié, sources lues directement, pas de spéculation) :
- `@diffusionstudio/piper-wasm@1.0.0` (CDN jsdelivr, ~635 Ko wasm + ~18 Mo data, `access-control-allow-origin: *` confirmé) est un vrai build WASM du `piper_phonemize` C++/espeak-ng original. Chargé en `<script>` classique (pas ESM), expose `window.createPiperPhonemize`.
- Licence : le cœur espeak-ng-data est GPL-3.0-or-later (contrairement au phonémiseur maison MIT de piper-plus) — signalé à l'utilisateur, pas bloquant pour ce projet.

Preuve de concept (avant tout changement de code shippé) :
- Harnais HTML local reproduisant le contrat ONNX standard de Piper (lu depuis le code Python officiel `rhasspy/piper`, `voice.py`) : `input`/`input_lengths`/`scales` en entrée, sortie `output` (PCM float32 brut), en lisant les réglages `noise_scale`/`length_scale`/`noise_w` directement depuis `config.inference` du modèle (et non plus des valeurs codées en dur côté client).
- Testé contre le vrai modèle Tom déployé (63 511 038 octets) avec la phrase "Bonjour, ceci est un test de la voix française." → 101 phonème-ids générés par le vrai espeak-ng, synthèse réussie, WAV envoyé à l'utilisateur pour écoute réelle.
- Confirmation explicite : **"oui ça sonne beaucoup mieux."**

Changement (intégration dans le code shippé, même algorithme que la preuve de concept) :
- `cloudflare/src/idle-media-v1.js` : proxy `piperModelProxy_` simplifié — sert désormais la configuration du modèle Tom **telle quelle**, sans injection de `language_id_map`/`num_languages`/`soreal_monolingual_g2p_compat` (ce correctif de compatibilité était spécifique au phonémiseur maison de piper-plus, devenu inutile).
- `cloudflare/public/modules/local-neural-piper-v1.js` (V3 → V4) : réécrit intégralement sans dépendance à `piper-plus`. Nouveau pipeline : `window.createPiperPhonemize(...).then(module => module.callMain(["-l", config.espeak.voice, "--input", JSON.stringify([{text}]), "--espeak_data", "/espeak-ng-data"]))` pour la phonémisation, puis inférence ONNX manuelle directe (`ort.InferenceSession.create` + `session.run`) avec les tenseurs `input`/`input_lengths`/`scales` construits à la main, et encodage WAV manuel (`pcm2wav_`). Le téléchargement du modèle (63 Mo) rapporte sa progression via un lecteur de flux (`fetchModelWithProgress_`), équivalent à l'ancien `onProgress` de piper-plus.
- `cloudflare/public/index.html` : import map — retiré `piper-plus`/`@piper-plus/g2p`, conservé `onnxruntime-web`. Ajouté `<script src="https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.js"></script>` (chargement classique, avant le module Piper local, pour exposer `window.createPiperPhonemize` à temps). Cache-buster `local-neural-piper-v1.js` : `?v=5` → `?v=6`.
- API publique (`window.__SOREAL_IDLE_LOCAL_NEURAL_V1__`) inchangée dans sa forme (`synthesize`/`preload`/`subscribe`/`state`/`model`) : aucun changement requis côté `tutorial-tts-v202.js`.

Vérification :
- 3 fichiers de test réécrits pour la nouvelle architecture : `idle-local-piper-neural.test.mjs` (assertions sur le nouveau pipeline espeak-ng, absence de `piper-plus`/`PiperPlus`), `idle-piper-model-proxy.test.mjs` (le proxy ne patch plus la config), `idle-tutorial-tts-v202.test.mjs` (import map mise à jour). `idle-piper-production-origin.smoke.mjs` inchangé (ne teste que la forme de l'API publique, restée stable).
- Suite complète locale : 173/173 OK.
- Harnais HTML local chargeant le **module réellement shippé** (`local-neural-piper-v1.js` servi tel quel, avec un override ciblé de `fetch` pour rediriger uniquement les requêtes du modèle Tom vers l'origine de production le temps du test) : synthèse réussie, WAV de 544 812 octets produit, état `ready` correct. Harnais supprimé après vérification, jamais commité.
- Échantillon audio du module shippé envoyé à l'utilisateur pour confirmation finale (mêmes paramètres que la preuve de concept déjà validée).
- Commit `8aa217deb7cbd8601c258e8ef731f746844524e0`, poussé sur `main`.
- Workflow production `Deploy SOREAL Idle to Cloudflare` run #525 : **Success en 1m 39s** (job `deploy` 1m 30s), avec l'étape réelle "Verify deployed Piper narration in Chromium" (le smoke Chromium) réussie en 45s — pas de ralentissement notable malgré les ~18,6 Mo supplémentaires d'espeak-ng, probablement grâce au cache CDN jsdelivr.
- Production reconfirmée par requêtes `curl` directes indépendantes : `index.html` ne référence plus `piper-plus` dans l'import map, contient bien `<script src=".../piper_phonemize.js">` et `local-neural-piper-v1.js?v=6` ; `/api/idle/media/piper-model.onnx.json` sert la config Tom brute (aucun des champs `language_id_map`/`num_languages`/`soreal_monolingual_g2p_compat` injectés auparavant) ; `/api/idle/media/piper-model.onnx` sert toujours le modèle Tom (63 511 038 octets, HTTP 200, CORS `*`, cache immutable).

## Correctif points de suspension abandonnés par espeak-ng — 2026-09-22
Retour utilisateur après avoir testé le moteur espeak-ng en production : "il ne s'arrête pas aux points de suspension par exemple. C'est compréhensible, mais j'ai l'impression que c'est moins bien que sur le site où j'ai choisi cette voix."

Root cause (confirmée en comparant les flux de phonèmes bruts, pas supposée) : harnais HTML comparant la sortie de `piper_phonemize` (JSON `{"phonemes":[...],"phoneme_ids":[...]}`) pour 4 entrées :
- `"Bonjour. Ca va ?"` → séquence de phonèmes contient bien `"."` (id 10, pause).
- `"Bonjour, ca va ?"` → contient bien `","` (id 8, pause courte).
- `"Bonjour... Ca va ?"` (3 points ASCII) → **aucun phonème de pause généré du tout** : la séquence saute directement de "ʁ" à "s", comme si la ponctuation n'existait pas.
- `"Bonjour… Ca va ?"` (caractère unicode ellipsis U+2026) → **résultat identique**, phonème totalement absorbé/perdu.

Contrairement à la virgule et au point simple (tous deux présents dans le `phoneme_id_map` de 256 symboles de Tom, vérifié directement dans sa config), espeak-ng ne produit aucun phonème pour "..."/"…" lors de la phonémisation français via `piper_phonemize` — la ponctuation est silencieusement absorbée, pas seulement mal pausée.

Correctif :
- `cloudflare/public/modules/local-neural-piper-v1.js` : nouvelle fonction `normalizeEllipsis_(text)` — remplace toute suite de 2+ points (`/\.{2,}/`) ou le caractère unicode `…` (`…`) par un point simple `"."`, appliquée dans `synthesize_` avant la phonémisation. Le point simple étant déjà prouvé fonctionnel (pause correcte), c'est le point d'ancrage le plus sûr dans le vocabulaire de 256 symboles du modèle.

Vérification :
- Harnais HTML local (jamais commité) confirmant que `normalizeEllipsis_("Bonjour... Ca va ?")` et `normalizeEllipsis_("Bonjour… Ca va ?")` produisent bien `"Bonjour. Ca va ?"`, dont la pause phonémique fonctionne (cas déjà vérifié ci-dessus).
- Nouveau test comportemental dans `idle-local-piper-neural.test.mjs` : extrait et exécute réellement `normalizeEllipsis_` (pas seulement une vérification de présence de chaîne) sur 4 cas (3 points ASCII, caractère unicode, 4 points, point simple inchangé).
- Suite complète locale : 174/174 OK.
- Harnais HTML local chargeant le module réellement shippé (même méthode que le changement précédent) : synthèse réussie sur "Attends... Je ne sais pas... c'est compliqué.", WAV de 258 604 octets, état `ready`. Échantillon envoyé à l'utilisateur pour confirmation auditive. Harnais supprimé après vérification, jamais commité.
- Commit `63c639cabc06b75fdc3d4dbf6b4c3d2c2858729d`, poussé sur `main`.
- Workflow production `Deploy SOREAL Idle to Cloudflare` run #526 : **Success en 1m 25s**, "Verify deployed Piper narration in Chromium" réussie en 38s.
- Production reconfirmée par requête `curl` directe indépendante : `/modules/local-neural-piper-v1.js` contient bien `normalizeEllipsis_` et son appel dans `synthesize_`.

## 2026-09-23 — Audit de sécurité (3 dépôts) : debug-list R2 public sans authentification

Audit de professionnalisme demandé par l'utilisateur sur les 3 dépôts SOREAL. `/api/idle/media/debug-list` (idle-media-v1.js) énumérait jusqu'à 5000 clés R2 (noms + tailles) sous n'importe quel préfixe `idle/`, sans la moindre authentification. Aucun appelant frontend (recherche exhaustive) : pur outil de diagnostic manuel. Un fichier identique existe dans SOREAL-APP (cloudflare/features/idle/worker.js) — corrigé en parallèle sur ce dépôt voisin.

**Fix** : même clé interne que `idleCallV1` (`idle-worker-entry-v1.js`) — `SOREAL_IDLE_INTERNAL_KEY` / header `x-soreal-idle-internal-key`. Fermé par défaut si le secret n'est pas provisionné (jamais un accès ouvert par défaut).

Nouveau test (`idle-media-debug-list-requires-internal-key.test.mjs`). Suite complète : 171/171 OK.

## 2026-09-23 — Audit (suite, tier Moyenne #11) : proxy d'avatar public sans authentification

`/api/idle/media/avatar` (avatarProxy_) relayait n'importe quelle requête vers un fichier Google Drive arbitraire (via son `id`) sans la moindre authentification -- accessible à quiconque sur Internet, qui pouvait faire télécharger/mettre en cache par le Worker (facturé sur le compte Cloudflare) n'importe quel fichier dont il connaît l'id. Recherche exhaustive dans les 3 dépôts : aucun appelant frontend trouvé nulle part -- même situation que `debug-list` (corrigé plus tôt aujourd'hui).

**Fix** : même clé interne que `idleCallV1`/`debug-list` -- `SOREAL_IDLE_INTERNAL_KEY` / header `x-soreal-idle-internal-key`, fermé par défaut si le secret n'est pas provisionné. Nouveau test `idle-media-avatar-requires-internal-key.test.mjs`.

**Prudence** : contrairement à `debug-list`, ce proxy a une implémentation soignée (largeur bornée, cache 7 jours, support HEAD) qui suggère un usage réel prévu, même si aucun appelant n'a été trouvé -- probablement un vestige d'une migration vers des avatars hébergés directement sur R2. Si ce correctif casse l'affichage d'un avatar en production, revert immédiat et investigation.

Suite complète : 172/172 OK.

## 2026-09-23 — Audit (suite, tier Moyenne #10) : SRI + CSP de base

Aucune Subresource Integrity sur les scripts CDN (jsdelivr) ni aucune Content-Security-Policy. En cas de compromission de jsdelivr ou du paquet npm source (typosquatting, prise de contrôle de compte mainteneur), le script injecté s'exécuterait avec un accès complet au DOM/sessionStorage (qui contient le sessionToken Bearer).

**Fix scopé volontairement** :
- CSP de base sans risque de régression : `object-src 'none'; base-uri 'self'; frame-ancestors 'self'` (n'affecte ni le WASM, ni les styles inline très nombreux sur cette page, ni le chargement de scripts).
- SRI (`integrity` + `crossorigin="anonymous"`) sur `piper_phonemize.js` -- hash SHA-384 calculé directement sur le fichier réellement servi par jsdelivr pour cette version épinglée.
- `<script type="importmap">` (onnxruntime-web) reste sans SRI : les navigateurs ne le supportent pas encore -- limitation de plateforme documentée en commentaire, pas un oubli.
- Une politique `script-src`/`style-src` stricte nécessiterait de tester en direct tout le pipeline audio (Piper WASM, AudioWorklet) avant déploiement -- volontairement pas ajoutée dans cette passe.

2 tests existants verrouillaient le tag `<script>` exact sans les nouveaux attributs -- mis à jour. Suite complète : 173/173 OK.

## 2026-09-23 — Correctif immédiat : frame-ancestors ignoré via <meta>, déplacé vers un vrai en-tête HTTP

Vérification en direct du correctif CSP précédent (dans la même session) : la console affichait "The Content Security Policy directive 'frame-ancestors' is ignored when delivered via a <meta> element." -- confirmation que ce navigateur (et tous) ignorent silencieusement cette directive quand elle vient d'un `<meta>`, contrairement à `object-src`/`base-uri` qui fonctionnent bien par ce biais.

**Fix** : `frame-ancestors` appliqué désormais via un vrai en-tête HTTP `Content-Security-Policy`, posé par le Worker (`idle-worker-entry-v1.js`) au moment de servir `index.html`. Le `<meta>` garde `object-src`/`base-uri` (défense en profondeur, sans risque). Suite complète : 173/173 OK.
