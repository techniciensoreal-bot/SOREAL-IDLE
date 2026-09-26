# WORKLOG — SOREAL-IDLE

## ÉTAT COURANT

*(Section maintenue à la main à chaque étape importante ; l'historique détaillé est plus bas, les entrées les plus récentes en bas du fichier.)*

- **Tâche courante** : confirmation des données du wiki local dans le jeu (registre `docs/WIKI-COVERAGE.md`). Fait : recalcul cellule par cellule de Wandoos, Time Machine, Boost, Augmentations, Blood Magic, NGU, Hacks, Cards, Gold Diggers, Boss Fights et zones d'Adventure Mode, chacune verrouillée par un test `idle-wiki-table-*` ; Energy / Magic / Resource 3 rattachées aux catalogues vérifiés. Suite : décision ITOPOD, puis manques sans source.
- **SHA `main` vérifié** : `17e81d2be845a4b0d44bf6e9d98c811e422811bb` (dernier commit de code ; les commits suivants ne touchent que `docs/`). `origin/main` relu par `git fetch` avant le push.
- **Derniers commits du chantier** : `17e81d2` (docs du registre), avant lui les tests `idle-wiki-table-wandoos` et `idle-wiki-table-time-machine` ; `6d0aff5` et le lot de tests `idle-wiki-table-*` (avec `HACK_HARD_CAP_V1` exportée) ; `ff5fcec` et `3db7b2a` (pipeline).
- **Tests** : 300 fichiers `cloudflare/tests/*.test.mjs`, tous verts en local (Node 24) et dans la CI.
- **Build** : `node cloudflare/build-standalone.mjs` + `node --check` des modules et de l'UI : vert dans la CI.
- **CI** : run #573 (`17e81d2`) terminé avec succès, chaque étape en succès : Setup Node, tests, build, Verify voice runtime dependencies, Deploy, Verify deployed Git SHA, smoke Chromium Piper.
- **SHA réellement déployé** : `git:17e81d2be845a4b0d44bf6e9d98c811e422811bb` (étape « Verify deployed Git SHA » : annotation `workers/message` égale au SHA attendu, version active à 100 %). Version ID Cloudflare non relevé ici (pas d'identifiants Cloudflare sur le poste de travail) ; le site sert `soreal-idle-ui.js?v=236`.
- **Dernière anomalie** : aucune dans ce chantier.
- **Vérifications effectuées** : chaque test rouge sur l'ancien état ou vert par construction sur les valeurs du wiki ; contrôle vocal réel contre le réseau ; YAML validé ; coquilles du wiki consignées dans `NGU-Wiki/external/wiki-table-typos.json` (boss 161-183, rituel 8, Halloweenies, rareté des cartes).
- **Problèmes ouverts, volontairement non traités** : diviseur 1E30 Evil/Sadistic (sens ambigu, impact d'équilibrage colossal) ; ITOPOD : moyennes au lieu du tirage aléatoire 0,8-1,2 (à décider) ; facteur temps du NGU Number, Rich Perks III/IV par difficulté, perks Iron Pill, Gold Multiplier de la Time Machine, paliers 12-16 du Money Pit, bonus 1E8 du Money Pit (+1 ou +10), AutoKill des titans, THE END, énigmes Beast/Exile/Death Note/GLOP, Effectiveness des objets, Tippi/Traitor (respawn, EXP, butin), types de mobs, Custom Input Buttons, fruits de Mayo, cartes Foil/End : aucune source fiable, pas d'invention. Auto-hébergement du modèle Tom sur R2 : décision à prendre avec Norman. Actions GitHub non épinglées par SHA.
- **Prochaine action exacte** : trancher ITOPOD avec Norman (moyenne actuelle contre tirage aléatoire 0,8-1,2 et PV 588-612), puis traiter les manques sans source à mesure que des données fiables arrivent (relevés dans NGU).

## Snapshot historique (2026-09-21) — narration V205

Tâche de l'époque : remplacer définitivement le TTS navigateur et le TTS cloud payant par une narration neurale française Piper exécutée localement dans le navigateur.

## État vérifié le 2026-09-21 (historique, pas l'état courant)
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

## 2026-09-23 — Vérification en direct : l'en-tête HTTP CSP n'atteint pas les vrais clients (à investiguer)

Vérification en production après déploiement du correctif `frame-ancestors` (via en-tête HTTP `Content-Security-Policy` posé par `idle-worker-entry-v1.js`) : **le corps de la page reflète bien le code déployé** (meta CSP réduite, SRI présente), mais **l'en-tête HTTP `content-security-policy` n'apparaît jamais** dans les réponses réelles (`curl -sD`), même avec un paramètre de requête unique pour contourner le cache. `cache-control` renvoyé (`public, max-age=0, must-revalidate`) ne correspond pas non plus à ce que le code fixe (`no-cache, no-store, must-revalidate`) -- toutes les réponses affichent `CF-Cache-Status: HIT`, y compris pour des URLs jamais demandées auparavant.

**Hypothèse la plus probable** : une couche de cache Cloudflare en amont du Worker (règle de cache/Page Rule au niveau de la zone, hors de ce dépôt) normalise/écrase les en-têtes `cache-control` et `content-security-policy` des réponses mises en cache, indépendamment de ce que le code du Worker fixe. Non vérifiable ni corrigeable depuis ce dépôt (nécessite un accès au tableau de bord Cloudflare).

**Conséquence réelle** : `object-src`/`base-uri` (posés via le `<meta>`, qui fait partie du corps mis en cache) restent bien appliqués. `frame-ancestors` (protection anti-clickjacking, qui NE PEUT être appliqué que via un vrai en-tête HTTP) n'est probablement PAS appliqué en pratique tant que cette couche de cache n'est pas ajustée. **Ne pas considérer ce point comme résolu** -- signalé à l'utilisateur, nécessite une investigation côté tableau de bord Cloudflare (règles de cache pour ce domaine).

## 2026-09-23 — Audit (suite, tier Faible) : étiquette "Ver. Beta local" obsolète + en-tête WORKLOG clarifié

**Étiquette "Ver. Beta local"** affichée aux joueurs en production (écran d'erreur) : "local" est factuellement faux depuis longtemps (déployé sur Cloudflare, pas en local) -- changé en "Version bêta".

**En-tête WORKLOG.md** : la section "État final vérifié" en tête de fichier donnait l'impression d'être un résumé de l'état courant, alors qu'elle décrit l'état au 2026-09-21 (narration V205) -- largement dépassée depuis (abandon MeloTTS, puis Grok TTS, passage à Piper local, voix unique...). Disclaimer ajouté en tête expliquant que ce fichier est un journal chronologique (le plus récent en bas), jamais un résumé courant.

Suite complète : 173/173 OK.

## 2026-09-23 — Second audit approfondi (3 dépôts) : tier Critique — bypass d'authentification sur `idleCallV1`

`/api/v1/call` (route publique du Worker standalone) acceptait un repli "clé interne" (`x-soreal-idle-internal-key`, même secret que le proxy avatar/debug-list) qui faisait confiance à un `user` fourni tel quel par l'appelant -- aucun jeton de session, aucune preuve d'identité. Plus loin dans la chaîne, `reinitialiserTousLesComptesSorealIdle` (réinitialisation de TOUS les comptes joueurs) ne vérifiait qu'une égalité de chaîne sur `user.email`. Quiconque obtient cette clé (fuite de log, erreur de config...) pouvait donc réinitialiser tous les comptes ou lire/écrire l'état de n'importe quel joueur en se faisant simplement passer pour son email, depuis l'internet public, sans rate-limit.

**Recherche exhaustive avant de corriger** (TV, APP, IDLE) : aucun appelant légitime nulle part. TV/APP appellent le Durable Object directement via le binding cross-script (`idleCall()` dans `index-global-read-coordinator-v55.js`, jamais joignable depuis l'internet) avec un `user` vérifié serveur (`verifyOperational` d'abord) -- jamais cette route HTTP publique avec cet en-tête. Ce chemin était donc mort fonctionnellement mais vivant comme surface d'attaque.

**Fix** : branche `internalKey` retirée entièrement de `idleCallV1` (`cloudflare/src/idle-worker-entry-v1.js`) plutôt que durcie -- rien ne s'en sert, la retirer ferme le risque sans effet de bord. Le handler Durable Object `/__soreal-idle-v1/call` reste inchangé : il est toujours utilisé légitimement par le binding direct TV/APP (chemin non affecté par ce correctif, non joignable publiquement).

Test `idle-standalone-worker-routes.test.mjs` mis à jour : l'ancien cas qui exerçait le bypass (clé interne + user arbitraire → 200) est remplacé par l'assertion inverse (clé interne seule, sans jeton → 401, Durable Object jamais atteint).

Suite complète : 173/173 OK.

**Plus aucun finding Critique restant côté IDLE.**

## 2026-09-23 — Second audit approfondi (3 dépôts) : tier Élevée — `frame-ancestors 'self'` aurait cassé l'intégration TV/APP

L'en-tête HTTP CSP ajouté plus tôt le même jour posait `frame-ancestors 'self'` -- ce qui interdit l'intégration en iframe depuis n'importe quelle origine autre que `soreal-idle` lui-même. Or TV (`TV_78_JS_Fallback_Continued.html`) et APP (`Soreal_App_html.html`, `soreal-idle-module.html`) embarquent tous les deux ce frontend en iframe cross-origin -- pas d'erreur visible aujourd'hui uniquement parce que le bug de cache Cloudflare (déjà documenté, non résolu) empêche cet en-tête d'atteindre les vrais clients. Le jour où ce bug de cache se résout, l'iframe IDLE aurait cessé de s'afficher silencieusement dans TV et APP.

**Fix** : `frame-ancestors 'self' https://soreal-tv.technicien-soreal.workers.dev https://soreal-app.technicien-soreal.workers.dev` -- les deux origines de production qui embarquent réellement ce frontend, listées explicitement. Test `index-html-csp-and-sri.test.mjs` mis à jour.

Suite complète : 173/173 OK.

## 2026-09-23 — Second audit approfondi (3 dépôts) : tier Faible — fichiers morts, doc obsolète, résidu localStorage

**Fichiers morts** : `modules/audio-effects-v197.js` (jamais chargé par `index.html`, seul `v199` l'est, aucune référence nulle part) et `modules/long-press-v197.js` (jamais chargé -- `long-press-v200.js` l'est) supprimés. `inventory-mobile-item-popup-v194.test.mjs` lisait pourtant `long-press-v197.js` et validait sa logique (`touchcancel` avec seuil `elapsed>=120`) -- alors que le v200 réellement servi aux joueurs a une gestion de `touchcancel` **réellement différente** (plus de seuil, tout maintien immobile annulé tôt est conservé). Ce test donnait donc une fausse confiance sur du code qui n'est plus celui livré. Les assertions sur le module long-press retirées de ce test (redondantes avec `idle-inventory-gestures-v200.test.mjs`, qui couvre déjà `HOLD_MS`, `MOVE_PX`, `touchstart` actif et `touchcancel` immobile sur le vrai v200) ; ses assertions sur `soreal-idle-ui.js` (double-tap V196, absence de l'ancien bouton i) restent.

**`AGENTS.md`** : le paragraphe affirmant « le Worker de ce dépôt n'a lui-même aucune route publique utile » (faux depuis le 2026-09-19, et auto-contradictoire avec le paragraphe juste au-dessus) réécrit pour décrire les deux surfaces réelles (chemin public standalone par ticket/session, chemin historique par binding Durable Object).

**`modules/runtime.js`** : `token_()` lisait encore `localStorage.getItem('soreal_session_v6b')`, clé jamais écrite dans ce dépôt (IDLE tourne sur sa propre origine, aucun localStorage partagé avec APP/TV) -- retirée. `idle-standalone-ui.test.mjs` étendu pour couvrir aussi `runtime.js` (il ne vérifiait que `standalone-bridge.js`).

**Rate-limiting sur les routes publiques** (même tier) : non ajouté, même raisonnement que côté TV/APP -- jetons 256 bits non devinables, protections plateforme Cloudflare, coût/bénéfice faible.

Suite complète : 173/173 OK.

## 2026-09-23 — Audit NGU Idle : le mode Aventure restait figé (deux causes confirmées)

Retour utilisateur : « le mode aventure peine parfois à lancer les combats, il reste figé ».

**Cause 1 (régression du split UI V9, commit `85094df`)** : `idleMetaBusyV130` existait en deux variables indépendantes -- celle du module `meta-progression-v130.js` (assignée à chaque requête) et une copie du monolithe `soreal-idle-ui.js` jamais assignée, donc toujours `false`. Le monolithe ne voyait jamais qu'une requête partait : `envoyerResolutionAdventurePendingV2_` n'acquittait jamais la résolution d'un combat de zone (`idleAdventureResolutionPendingV2` restait armé), le minuteur de respawn se ré-armait toutes les 16 ms sur ce drapeau sans jamais lancer `startZoneFight`, et la résolution était renvoyée à chaque image (`AUCUN_COMBAT_ACTIF` côté serveur). Gel jusqu'au rechargement.

**Cause 2 (antérieure au split)** : un `startZoneFight` qui échoue (verrou serveur `SOREAL_IDLE_OCCUPE` après 5 s, timeout du pont à 45 s, refus serveur, appel abandonné car le module était déjà occupé) laissait `idleAdventureRespawnStartPendingV165` à `true` pour toujours ; plus aucun respawn n'était reprogrammé. Un aller-retour Safe Zone débloquait -- d'où le « parfois ».

**Fix** : la seule source de vérité est celle du module, exposée par `estOccupeIdleV130_()` ; le monolithe l'interroge via `metaOccupeIdleV130_()` (copie morte supprimée). Dans le module, tout échec/abandon d'un `startZoneFight` (réponse non ok, erreur réseau, module occupé, pas de session) libère le drapeau de démarrage, ce qui laisse le cycle par image reprogrammer le respawn. Cache-busters : `meta-progression-v130.js?v=20260923` (n'en avait pas), `soreal-idle-ui.js?v=222`.

Nouveau test `idle-adventure-combat-start-never-freezes.test.mjs` (comportemental : drapeau réel, 4 chemins d'échec ; structurel : plus aucune référence à l'ancienne variable). Suite complète : 174/174 OK.

Non traité ici (suspecté par l'analyse, à vérifier) : une réponse de synchro tardive pouvant écraser l'état d'un combat plus récent.

## 2026-09-23 — Audit NGU Idle : Entraînement de base (3 écarts de calcul corrigés)

Retour utilisateur : mêmes chiffres placés dans Entraînement de base dans NGU et SOREAL IDLE dès le début du jeu, statistiques différentes après 1 h. Analyse comparée au miroir local du wiki (`Basic Training`, `Training cap`, `Advanced Training`, `ngu-wiki-reference/rebirth-and-number.md`). **Ce qui est conforme** (vérifié, simulation à l'appui : 500 énergie dans Idle Attack pendant 3600 s = exactement 36 000 niveaux, sans dérive flottante) : vitesse 50 niveaux/s × min(1, allocation/cap), les 12 caps/valeurs de base/paliers, formule `Level^1.3 × BaseValue`, PV = 10 × attaque, régénération = défense/20.

**Corrigé :**
1. **Niveau fractionnaire dans la formule des stats** (`idle-basic-training.js`, client `soreal-idle-ui.js`) : `Level^1.3` était calculé sur `niveau + fraction de barre`, alors que le wiki (et le vrai jeu) utilise le niveau entier -- chaque entraînement était gonflé d'environ 0,5 niveau. La fraction ne sert plus qu'à la barre de progression. (L'intégrale de régénération de PV V176 reste continue, volontairement.)
2. **L'allocation effaçait la barre d'énergie** (`idle-sqlite-runtime.js`) : chaque changement d'allocation remettait `fillProgress` à 0, perdant jusqu'à une unité de régénération par clic ; le vrai jeu conserve la progression de la barre.
3. **`attackTrainingLevels` toujours 0 et `basicTrainingComplete` toujours faux** : `entrainementBase.skills` est un objet indexé par id, or le code testait `Array.isArray` et lisait un champ `unlocked` que l'état ne contient pas. Conséquences : le facteur « training level » du NUMBER (`Floor(1 + Attack_Basic_Training_Levels / 10 000)`) restait figé à 1, et **Advanced Training (wiki : débloqué quand Ultimate Attack et Ultimate Buff le sont) ne pouvait jamais s'ouvrir**. Calcul désormais fait avec `normalizeBasicTrainingStateV411` + `isBasicTrainingSkillUnlockedV411`.

Nouveau test `idle-basic-training-number-and-advanced-unlock.test.mjs`. Suite complète : 175/175 OK.

**Constatés, non corrigés dans ce lot** (à traiter ensuite) : (4) l'allocation est appliquée localement tout de suite et côté serveur après ~70 ms + latence, avec un raccord qui garde la valeur la plus haute (dérive de l'affichage au-dessus de la vérité serveur) ; (5) l'affichage client code les multiplicateurs (NUMBER, perks) à 1 ; (6) le client plafonne le temps d'énergie à 1 s par appel (onglet en arrière-plan sous-crédité à l'écran) ; (7) effets non branchés : Double Basic Training, quirk « Super Advanced Beast Training! », vœu 23 (+1 niveau par remplissage de barre selon le wiki). **À ne pas inventer** : la règle de réduction de cap (`niveaux/1000 %` plafonné à 10 %) n'est pas publiée par le wiki (« up to 10% » seulement) et la table « 1 cap at » du wiki est incohérente avec son propre texte (56/74/81/86/89/92 vs 57..92) -- laissée en l'état, à trancher avec l'utilisateur.

## 2026-09-23 — Audit NGU Idle : parité de contenu avec le miroir local du wiki (lot 1)

Comparaison hors ligne de SOREAL IDLE avec `NGU-Wiki` (1110 pages, modèles expansés) : zones (181 champs), pièces de sets (587), accessoires, mobs (~1235), boss (901), titans, or/EXP, augments, Blood Magic, Diggers, hacks, Wandoos, vœux (693), perks/quirks (549), boutique -- **la grande majorité concorde exactement**. Écarts confirmés corrigés dans ce lot :

- **Zones Evil/Sadistic (17 zones)** : le butin reposait sur un repli universel **inventé** (22 % set / 12 % boost / 4 % spécial, force de boost `log2(1+boss/10)`), et ni or ni EXP de boss n'existaient pour elles. Profils complets ajoutés à partir de la section Loot de chaque page (taux de base et plafonds « up to » pour les boosts et les sets, niveau de drop, plage d'or normal/boss, EXP de boss avec son taux), + `bossChance` propre à la zone (Evilverse 2/9, Rad-Lands 1/5, Aethereal Sea 4/21). The Aethereal Sea : « Exp 1,200 » publié sans taux -- volontairement non tiré, jamais de taux inventé. **Fad-lands et Back To School** : leurs pages sont **absentes du miroir** (collision de casse Windows avec leur redirection `The Fad-Lands`/`Back To School`) -- wikitexte brut relu via l'API MediaWiki, `{{formatnum}}`/`{{BigNum}}` réduits à leur nombre.
- **Niveau de drop des sets** de Beardverse, Badly Drawn, Boring-Ass Earth (Stealth) et Chocolate : `0` dans le code, `lvl 1` sur le wiki.
- **Forest Pendant** : sans surcharge, il héritait de 176/7 ≈ 25,14 de Power et de Toughness alors que le modèle wiki `Item data Forest Pendant` n'en a aucun.
- **Sewers (set)** : totaux 20/20 dans le code, 52/52 sur le wiki (les surcharges par pièce, elles, étaient justes).

Nouveau test `idle-adventure-evil-sadistic-loot-profiles.test.mjs` (données de référence + comportement réel d'un kill de boss avec RNG forcé). Suite complète : voir ci-dessous.

**Constaté, non traité dans ce lot** (par ordre d'intérêt) : accessoires propres aux zones Evil/Sadistic (Edgy Magicite Crystal, Creepy Doll, THE EXPONENTIAL...), Ascended Pendants et Looties absents ; **228 pièces de sets sur 240 sans « Specials »** du wiki (Energy/Magic Power/Cap/Bars, etc. -- fort impact jeu) ; drops de titans (UUG/Slimy/Voodoo/Van Gogh garantis au lieu de 0,05 % à 2 %) et récompenses EXP/AP/or de titans absentes ; titans 8 à 14 absents ; 165 objets sur 431 des modèles wiki absents ; catalogue NGU (16 NGU) différent du wiki ; systèmes absents : MacGuffins, Cards/Mayo, Cooking, Questing, Item Daycare, Achievements. **Décision à prendre** : `diggerSlot` est attaché au set Jake alors que le wiki le place sur « Scrap of Paper (set) » -- laissé en l'état faute de savoir combien de slots la base donne au départ.

## 2026-09-23 — Audit NGU Idle : Entraînement de base, avance du client bornée

Suite de l'entrée « Entraînement de base » : écart (4) traité. `fusionnerBasicTrainingPlusAvanceIdleV166_` gardait la valeur la plus haute entre client et serveur **pour toujours** ; l'avance légitime du client (latence de la réponse, allocation appliquée localement avant son envoi au serveur) n'était donc jamais résorbée et l'affichage dérivait au-dessus de la vérité serveur à chaque changement d'allocation. L'avance tolérée est bornée à 3 s de gain à la vitesse courante (2 niveaux minimum) ; au-delà, le serveur fait foi (l'allocation choisie localement reste conservée). Nouveau test `idle-basic-training-client-lead-bounded.test.mjs` (extrait la vraie fonction du monolithe). Cache-buster `soreal-idle-ui.js?v=223`.

Écart (6) (plafond de 1 s de temps d'énergie par appel côté client) réexaminé, non modifié : la synchro serveur recale l'énergie, impact d'affichage seulement. Écart (5) (multiplicateurs codés à 1 dans l'affichage client) et (7) (Double Basic Training, quirk, vœu 23 non branchés) restent à traiter.

## 2026-09-23 — Audit NGU Idle : butin et récompenses des titans (parité wiki, lot 2)

Comparaison de `titan()` avec la section Loot de chaque page de titan et la colonne « Base Rewards » de la page Titans (miroir local NGU-Wiki).

- **Aucune récompense de titan n'existait** : ni EXP, ni or, ni AP, ni progression de PP. Ajout de `TITAN_REWARDS_V1` (GRB 35 EXP / 10 AP / 1 000 000–1 250 000 or, GCT 60/15, Jake 200/50, UUG 300/60, Walderp 500/70 à la forme finale, The Beast 750 EXP + 250 000 de progression de PP, The Exile 2 500 EXP + 400 000 de PP + or). L'or reçoit le bonus de cube comme en zone.
- **Butin inventé remplacé** (`rollTitanLootV1`) : GRB, Jake, UUG (anneaux), Slimy, Wanderer's/S'rerednaW étaient **garantis** à chaque kill (pièce tirée parmi tous les slots, niveau 0). Désormais : GRB 1 pièce garantie lvl 0 parmi 5, 50 % lvl 0–2, 15 % par pièce lvl 0–4 (collier et viande seulement là), Forest Pendant 10 % lvl 20 ; GCT 3 Boost 10 garantis + boosts 5–10 % + Forest Pendant lvl 50 ; Jake garanti/60 %/10 %/25 % + boosts 100 ; UUG anneaux lvl 4 à 2 % (Ring of Greed garanti la 1re fois) + Forest Pendant 2 % ; Walderp 0,5 % par pièce lvl 4 ; The Beast Slimy 0,05 %, Voodoo Doll 0,005 %, Purple Liquid 0,002 %, Van-Gogh 0,001 %, Small Gerbil 0,0001 %. Tous les taux « base chance » sont multipliés par le multiplicateur de drop.
- **Pont vers les vraies monnaies** (`idle-ngu-progression.js`) : `crediterRecompensesAventure` verse EXP/or/AP et la progression de PP (1 000 000 = 1 PP) ; le combat du 1er titan par `titanFight` ne créditait rien, il passe par le même pont.
- Tests : nouveau `idle-adventure-titan-wiki-loot-and-rewards.test.mjs` ; 3 tests qui verrouillaient l'ancien garanti (advanced-skills, titans-5-6-uug, walderp) adaptés (RNG forcé). Suite complète OK.

**Non traité (objets absents de SOREAL, jamais remplacés par une valeur inventée)** : Stapler, Ascended Forest Pendant, Heroic Sigil, Ascended³ Pendant, Bald Egg, Giant Apple, Power Pill, Candy Cane of Destiny, Wandoos XL, Fanny Pack, Dorky Glasses, UUG's Special Ring, les 3 Clues ; multiplicateurs ×1,1/1,2/1,3 du souhait « V2/3/4 Titans better rewards » et QP conditionnés par souhait (niveau de souhait absent du contexte Aventure) ; drops du titan 7 (The Exile) et titans 8–14.

## 2026-09-23 — Audit NGU Idle : Typo (set) et vérifications de parité sans écart

- **Typo (set)** : la récompense de complétion était vide (`reward:{}`) ; le wiki donne « +20% Wish Speed! ». Ajout de `setRewards.wishSpeedPct` (0,20) consommé dans `idleNguBonuses().wishSpeedMultiplier` et dans le calcul de progression des Wishes. Test `idle-adventure-typo-set-wish-speed.test.mjs`.
- **Rad-Lands, attackRate 0** : vérifié sur les 10 pages de mobs, le wiki publie `attack_rate=?` pour 8 des 10 (seuls Wandering Gamma Ray = 1, A.C SKATER = 1 et RADIOACTIVE MACGUFFIN = 1,2 sont chiffrés, et le code les a) : ce n'est pas un écart, la valeur n'est pas publiée. Aucun changement.
- **Jake (set)** : le wiki donne 7 000 EXP + Wandoos MEH ; le Digger Slot vient du set « Scrap of Paper » (objet A Scrap of Paper), pas de Jake. SOREAL le donne encore sur `jake` (`diggerSlot:1`) faute d'objet « Scrap of Paper » maxable : non modifié pour ne pas retirer un slot sans son équivalent.

## 2026-09-23 — Audit NGU Idle : Entraînement de base, niveaux par remplissage de barre

Wiki (Basic Training / Advanced Training / Perk Points / Quirk Points / Wishes) : *Double Basic Training* (perk 15, 100 PP), *Super Advanced Beast Training!* (quirk 17, 4 000 QP) et *I wish Basic Training was EVEN FASTER >:)* (souhait 23) ajoutent **chacun +1 niveau à chaque remplissage de barre** (jusqu'à x4).

- Le perk était acheté sans aucun effet (`doubleBasicTrainingFromPerks` calculé mais jamais lu), le quirk 17 absent du catalogue, le souhait 23 sans bonus.
- `levelsPerFillBasicTrainingV411` + paramètre `levelsPerFill` dans `idle-basic-training.js` (vitesse, avance, snapshot) ; le snapshot annonce `maxLevelsPerSecond = 50 x niveaux par barre`, que le client utilise déjà pour animer les barres et calculer sa vitesse : aucun changement côté client. `idleNguBonuses().basicTrainingLevelsPerFill` agrège perk + quirk + souhait ; le runtime le passe à l'avance hors ligne et au snapshot.
- Test `idle-basic-training-levels-per-fill.test.mjs` ; `idle-quirks-v1.test.mjs` passe à 71 quirks.

## 2026-09-23 — Audit NGU Idle : les 16 vrais NGU (Normal / Evil / Sadistic) remplacent les 9 pistes inventées

**Constat** : le système NGU de SOREAL avait 9 pistes inventées (NGU Power, Defense, Adventure, Drop, Respawn, EXP, PP, Quest, Daycare), avancées une seule à la fois avec un diviseur arbitraire (300 000), un coût constant par niveau et des effets en `log10` sans source. Le jeu (wiki, page « NGU ») a **16 NGU** (9 Energy + 7 Magic) qui progressent **en parallèle**, chacun avec sa propre allocation, plus leurs variantes **Evil** et **Sadistic**.

**Fait**
- `idle-ngu-catalog-v1.js` (nouveau) : les 48 lignes des 6 tableaux du wiki (bonus par niveau, soft cap, formule après plafond, coût de base). Le test vérifie la colonne « Max value » du wiki pour les 48 (tolérance 0,15 %, écart d'arrondi du wiki), la continuité au soft cap, et les totaux publiés (Power α+β 5e16 %, total Evil 5e30 %, Respawn 40 % + 10 % -> 46 %, 51,4 % en Sadistic).
- Règles du wiki reprises : niveau max 1 milliard ; coût du niveau N -> N+1 = (N+1) x coût de base (résolu en forme fermée, pas de boucle) ; débit = allocation x puissance x vitesse / coût de base ; Evil et Sadistic sont des multiplicateurs supplémentaires ; un seul palier reçoit de l'énergie/magie à la fois ; effets Evil dès la difficulté Evil, Sadistic dès Sadistic.
- Moteur (`idle-ngu-progression.js`) : état `systems.ngu.data = { tier, ngus: { normal|evil|sadistic: { <ngu>: { level, work, allocation } } } }` ; actions `allocateNgu` et `setNguTier` (changer de palier rend l'énergie du palier quitté) ; les anciens `allocate`/`selectTrack` sur `ngu` sont refusés ; allocations rendues au Rebirth, niveaux conservés ; le No NGU Challenge neutralise effets et allocation.
- Effets réellement branchés : Power α/β -> Attack/Defense (multiplicatif), Adventure α/β -> stats d'aventure, Drop Chance, EXP, Gold, Respawn, Number (Rebirth et stats), PP (ITOPOD -- le `ppMultiplier` n'était lu par personne), Yggdrasil (gain de graines), Time Machine (or/s), Augments (multiplie le bonus des Augmentations), Wandoos (vitesse des deux dumps), Magic NGU / Energy NGU (vitesse des NGU de l'autre ressource). Vitesse des NGU : défis, Beard Cage, Diggers Energy/Magic NGU, sets Meta/Back To School, objets, perks « Faster NGU Energy/Magic » (jusqu'ici calculés mais jamais lus) et quirks.
- Quirks ajoutés : 14 « The Beast NGU Quirk Ever » (Evil -> Normal), 89 « An even Beast-er NGU Quirk » (Sadistic -> Evil), 93-98 « Faster Energy/Magic NGU I-III » (coûts/plafonds du wiki).
- Interface : nouvelle page NGU (`pageNguIdleV1_`, module `meta-progression-v130.js?v=202609231`) : sélecteur de palier, résumé des multiplicateurs, 9 NGU Energy et 7 NGU Magic avec niveau, bonus courant, temps du prochain niveau, barre de progression et boutons 0/25/50/100 %.
- Tests : `idle-ngu-real-catalog`, `idle-ngu-real-engine`, `idle-ngu-page-render` ; 6 tests qui pilotaient les anciennes pistes réécrits (vitesse des sets, vitesse des objets, multiplicateurs de puissance, runtime, early game, quirks).

**Migration (perte assumée)** : les niveaux des anciennes pistes n'ont aucun équivalent dans les 16 vrais NGU (formules et coûts sans rapport) : ils repartent de 0, comme au début d'une vraie partie ; l'énergie/magie qui leur était allouée est rendue.

**Non traité** : la vitesse d'énergie/« bars » n'entre pas dans le débit d'un NGU (le wiki cite « 50 energy speed » dans la définition du coût de base sans préciser son rôle ; débit = allocation x puissance x multiplicateurs) ; Hacks « Energy/Magic NGU Speed » (les effets des Hacks ne sont branchés nulle part) ; bonus Cards ; le « Number » NGU n'ajoute pas de facteur de temps de Rebirth distinct (le wiki dit qu'il est « multiplié par le facteur de temps courant », déjà porté par le Number).

## 2026-09-23 — Affichage des PV : plus de clignotement ni de chiffres qui bougent

Retour utilisateur : la regen de vie fait bouger les chiffres des PV, la regen apparaît et disparaît très vite. Causes : le suffixe « ↗ +x/s » n'existait que lorsque les PV étaient sous le max (il s'éteignait à PV pleins puis se rallumait), et `formatGrandNombreIdleV70_` retire les zéros finaux (« 1.60 » -> « 1.6 »), donc la largeur changeait ; les PV du boss utilisaient en plus un nombre de décimales variable (4). Correctif : `formaterDecimalesFixesIdleV1_` (2 décimales fixes), suffixe de regen permanent tant que la regen est > 0 (joueur et boss), chiffres tabulaires + `nowrap` en CSS. Monolithe `?v=224`. Test `idle-hp-display-stable.test.mjs`.

## 2026-09-23 — Titans : souhait « meilleures récompenses », QP ; Scrap of Paper (set)

- **Souhait 3** « I wish V2/3/4 Titans had better rewards » : EXP, PP progress et QP des titans x1,1 (Normal+), x1,2 (Hard+), x1,3 (Brutal) selon le niveau du souhait (`1 + 0,1 x min(niveau, rang du palier)`). **QP** : The Beast 1 (souhait 73), The Exile 3 (souhait 41), créditées dans `currencies.qp`. Le niveau des souhaits est passé au moteur d'Aventure (`wishLevels`).
- **Scrap of Paper (set)** : le Digger Slot est donné par ce set d'un seul objet (wiki « Gold Diggers » > Digger Slot Locations, page « Scrap of Paper (set) »), que Jake From Accounting laisse tomber à coup sûr (lvl 0), et non plus par la complétion du set Jake (7 000 EXP + Wandoos MEH). Les sauvegardes où le set Jake était déjà complété gardent leur slot (rien n'est retiré).
- Tests ajoutés à `idle-adventure-titan-wiki-loot-and-rewards.test.mjs`.

## 2026-09-23 — Specials des pièces de set (225 pièces sur 240)

**Constat** : les pièces de set n'avaient aucun Special (Energy/Magic Power/Cap/Bars, NGU Speed, Gold Drops, Resource 3...). Une décision antérieure (« aucun objet d'équipement n'est censé porter de vrai bonus special », 2026-09-16) était contredite par le wiki : la fiche de 225 pièces liste des Specials (gabarit « Item data » : *Base value*, *Max stat at lvl 0*, *Max stat at max lvl*).

**Modèle retenu** (le wiki ne décrit pas le tirage ; on prolonge la convention des accessoires) : le premier Special de la pièce est porté par le scalaire `special` de l'objet : départ = *Base value*, plafond = *Max stat at lvl 0* x (1 + niveau/100) (x2 au niveau 100, comme le wiki), monté par les Special Boosts, fusion = maximum des deux. Les autres Specials de la même pièce avancent avec **la même fraction de progression** vers leur propre plafond (le wiki ne dit pas comment un boost se répartit). Le tooltip du wiki (« actual stat / maximum potential ») correspond à ce départ + montée par boosts ; les objets déjà possédés remontent à la Base value au chargement.

- Données : `idle-adventure-set-specials-v1.js`, extraites des fiches du miroir local. **Vérification** : pour 34 des 36 sets, la somme des maxima par type = « Total Specials Max » de la page du set ; Stealth (« 2nd Energy X » = « Energy X ») concorde une fois fusionné ; Edgy : sa pièce `boots` est mappée sur l'objet à débloquer « BOTH Edgy Boots » au lieu des bottes du set « Edgy Boots (set) » (le vrai set Edgy compte 5 pièces, les bottes forment un mini-set Left/Right Edgy Boot) : cette pièce n'a volontairement aucun Special, la restructuration du set Edgy reste à faire.
- Un Special Boost est accepté sur toute pièce qui a des Specials (refusé sinon, ex. Training Set). Le menu d'objet liste tous les Specials (valeur / plafond).
- Branchés : Energy/Magic Power, Cap, Bars, Speed, Drop Chance, Gold Drops, NGU Speed, Beard Speed, Respawn (déjà lus), plus **nouveaux** : Resource 3 Power/Cap/Bars, Wish Speed, Hack Speed, Wandoos Speed, Augment Speed, Seed Gain / Yggdrasil Yield. Portés sans consommateur (systèmes absents) : Cooking, Quest Drops, Move Cooldowns, Advanced Training, Daycare Speed.
- Tests : `idle-adventure-set-item-specials.test.mjs` ; 3 tests qui figeaient l'ancienne règle mis à jour (pièce Training pour le cas « sans Special »).
- Effet sur l'équilibrage : les sets tardifs donnent de très gros multiplicateurs (p. ex. Edgy : 44 200 % d'Energy Power au total, comme sur le wiki).

## 2026-09-23 — Quirks : banks III-V, Resource 3, ITOPOD PPP, Blood Magic (+23)

Ajout, avec coûts/plafonds/effets du tableau « Quirk Points » : Adv. Training / Time Machine / Beard Temp Level Bank III-V (22-24, 27-29, 32-34), Generic Resource 3 Power/Cap/Bars I-III et Final (47-49, 67-69, 86-88, 183-185, lus par `r3*Multiplier`), Improved Base ITOPOD PPP (70, +10 PPP de base par niveau, lu par le calcul ITOPOD), Better Blood Magic I (91, +1 %/niveau de Blood produit). Toujours exclus (systèmes absents) : Cards/Mayo/Deck/Tags (99-169), Quêtes (71), slots Accessory/MacGuffin/Wish/Automerge (18, 19, 50, 55, 56), Hack Milestone Reducers (57-60, 174-175, les effets des Hacks n'étant pas encore branchés), Lower Minimum Wish Speed (54), Even More Inventory Space (90). Test `idle-quirks-banks-r3-ppp-blood.test.mjs`.

## 2026-09-23 — Audit approfondi (lot 1) : Adventure Stats, régénération, NUMBER, EXP de boss

Audit en parallèle (4 relecteurs, lecture seule) code vs miroir du wiki. Corrigé dans ce lot :

- **Régénération d'aventure « instantanée »** : `adventureRestPv` (PV de repos entre deux combats / en Safe Zone) vivait dans `idleEtat`, remplacé à chaque synchro serveur (~15 s) par un objet sans ce champ ; le tick suivant lisait `null` et remettait les PV au maximum. Mémorisé hors de `idleEtat` (`idleAdventureRestPvMemoV1`). Test `idle-adventure-rest-hp-survives-sync`.
- **Aucun multiplicateur d'Adventure Stats n'atteignait le combat** (perks, quirks, wishes, NGU Adventure α/β, Advanced Training, Beard BEARd, Digger, Challenges...) : `idleAdventureCombatStatsV1` applique maintenant `(base 10 + équipement + permanent + gains absolus) x multiplicateur` ; PV et regen suivent Power et Toughness (x3 / x0,03). Gains absolus lus : Newbie Adventure Perk (+100), Fruit of Adventure (stocké mais jamais lu), Iron Pill.
- **Advanced Training** : « Bonus% for Adventure Power/Toughness = Level^0.4 x 10 » s'applique à la Power/Toughness **d'aventure**, pas à l'Attack/Defense de Fight Boss (il y était appliqué à tort) ; le terme sans source `1 + sqrt(L) x 0,008` est retiré. Block Damage Reduction = `(Level+50)/(Level+100)` (au lieu de 50 % fixe), exposé par le serveur et lu par la compétence Block du client.
- **Iron Pill** : gain absolu `Blood^0.25` (Power/Toughness, HP x3, regen x0,03), comme sur le wiki, au lieu d'un pourcentage jamais lu.
- **Titans et ITOPOD** utilisaient un champ jamais renseigné (`adventurePower`, donc 0/10) : ils lisent les vraies stats d'aventure.
- **Specials d'équipement** : seul un sous-ensemble de types était exposé à `idleNguBonuses` ; tous le sont désormais (Resource 3, Wish/Hack/Wandoos/Augment Speed, Respawn, Move Cooldowns...). Ce qui rendait inertes une partie des Specials de sets ajoutés plus tôt. Réduction de respawn : les Specials d'équipement sont comptés, plafond porté de 75 % à 92 % (minimum ~0,33 s du wiki).
- **NUMBER inférieur à 1** : `attackMultiplier`/`defenseMultiplier` étaient écrasés à 1 dans les stats de combat ; le NUMBER d'un Rebirth rapide vaut par exemple 0,33 après 10 min (wiki Rebirths : « peut monter ou baisser »). Cause probable du NUKE plus généreux dans SOREAL après un Rebirth (sur une partie neuve sans Rebirth, la chaîne Attack/Defense est identique au wiki).
- **`attackTrainingLevels`** ignorait trois entraînements du groupe attaque (contre_palette, percee_quai, ultime_soreal) : facteur d'entraînement du NUMBER faussé.
- **Perk « +2 % EXP from bosses 24 and on »** (calculé, jamais lu) appliqué à l'EXP de boss (combat, premier kill, NUKE, récompense affichée).
- Tests : `idle-adventure-stats-multipliers`, `idle-adventure-rest-hp-survives-sync`, test Advanced Training réécrit.

**À faire (rapports)** : Auto Nuker (vendu 65 000 AP sans effet), bonus FTBE contradictoire dans le wiki, Move Cooldowns d'équipement, Slimy (set) Parry x3, Idle Mode x1,8, taux du Cube (perk), mur avant Rebirth non sourcé (boss 20), pièces par boss ; ITOPOD : formule des ennemis du wiki ; types d'ennemis (aucune mécanique chiffrée : rien à inventer).

## 2026-09-23 — Audit approfondi (lot 2) : ressources, systèmes de run, contenu d'aventure

Corrigé :
- **Cap effectif** (perks, quirks, wishes, équipement) dans le budget, l'allocation et le cap exposé au client/runtime (`capBase` conservé) : le cap affiché/allouable ignorait ces bonus alors que la génération les utilisait.
- **Resource 3** : jamais générée (Hacks et Wishes injouables) ; générée par speed/bars comme Energy/Magic dès que les Hacks sont débloqués.
- **Advanced Training** : ~400 fois trop rapide et à coût constant ; maintenant 10 000 s (20 000 s pour les dumps Wandoos) pour le niveau 0->1 à 1000 de cap et 1 de puissance, temps linéaire par niveau, racine carrée de la puissance, 50 niveaux/s max (wiki Advanced Training).
- **Rebirth** : allocations Hacks/Wishes rendues, diggers désactivés (wiki Rebirths).
- **Iron Pill** : recharge selon la difficulté (11,5 h / 23,5 h / 47,5 h, wiki Blood Magic).
- **Bonus calculés mais jamais lus, désormais appliqués** : multiplicateur d'or d'aventure (Golden Showers, GOOOLD, NGU Gold, Specials Gold Drops), « Boosted/Beasted Boosts » (force des boosts), slots d'inventaire (perks, souhaits « more Inventory space », No Equipment Challenge) et d'accessoires (perk), chance de +1 niveau sur le loot (Fibonacci 144).
- **Hacks** : effets appliqués (`(1 + Effect x Niveau) x Milestone^floor(niveau/milestone)`, inactifs en Normal) sur Attack/Defense, Adventure, Drop, EXP, PP, NUMBER, vitesses Time Machine/Augments/NGU Energy/Magic/Hack/Wish, Blood ; 6 quirks « Hack Milestone Reducer » ajoutés.
- **Yggdrasil** : formules de « Fruit Yields » : Power β (0,05 % x niveau², était 1e-4 %), Numbers (0,05 % x niveau^1.3), Arbitrariness x15 AP, Luck ceil(0,7 x ...) x 0,05 %, Knowledge x5 avec EXPBonus et perks FoK, Rage = progression de PP (x60 000), Adventure avec la vraie BaseToughness, Gold en minutes de production ; rendement NGU/Quirk/Yield/FirstHarvest appliqués aux effets.
- **Perk Fibonacci** : tableau exact de la page wiki (le niveau 3 = Magic Cap manquait, +10 % de tout aux niveaux 1-2 était faux) et jalons PP/AP/QP/EXP/loot branchés.
- **Set Edgy** restructuré : 5 pièces (Helmet, Chest, Pants, Jaw Axe, Cheap Plastic Amulet, 11 700 000 / 4 094 000), « Edgy Boots (set) » = Left/Right Edgy Boot, « BOTH Edgy Boots » à part et conditionnel (0,0018 %, plafond 12 %, seulement si Edgy Boots (set) complet) ; migration des sauvegardes `edgy:boots` -> `bothedgy:boots`.
- **Bestiaire** : boss de Badly Drawn World (2) et de la Fad-lands (2, THE SLAMMER via l'API en ligne), mob « Kitten In a Mech Woman » de Mega Lands ; One Hit de The Aethereal Sea (5,75e35).
- **The Exile** n'est plus combattable en Normal (« 190 (Evil) ») ; **No Equipment Challenge** se débloque en *découvrant* les 7 pièces GRB (wiki) au lieu de les compléter.
- Non retouché : Lonely Flubber (le wiki publie « +0,41 % par boss », lu tel quel).

**Reste à faire (rapports)** : Auto Nuker ; titans 7 et 9-14 (données dans le rapport : respawn, EXP, PP, or, QP, stats) ; butin des zones normales absent (Looties, Ascended Pendants, Bar Bar, etc.) ; bonus de complétion de sets non câblés ; formules d'ITOPOD ; Beards (~x50 trop lents ?) ; double comptage du NUMBER (Beard/NGU) ; Challenges (récompenses 24 h/100 Levels/Troll/Laser Sword) ; Wandoos (plafond, niveau d'OS) ; perks/quirks manquants ; Money Pit paliers 5-11 ; banks Advanced Training ; achats Spend EXP (slots, Auto-Activate).

## 2026-09-23 — Titans 7-12 et Auto Nuker

- **Titans** (page Titans + page de chaque titan) : Greasy Nerd (boss 125, Evil), The Godmother (166, Evil), IT HUNGERS (175, Sadistic), ROCK LOBSTER (224, Sadistic) et AMALGAMATE (248, Sadistic) ajoutés avec seuils Manual P/T par difficulté, cooldown, récompenses et QP/wish (`TITAN_QP_V1`). Porte `sadisticOnly` (erreur `DIFFICULTE_SADISTIC_REQUISE`), drop d'objet de déblocage facultatif. Non modélisé : quête Secrets and Spoilers, butin d'objets absents, GLOP, objets « paper », Ring of Apathy ; TIPPI et THE TRAITOR (respawn/EXP/or/butin non publiés).
- **Auto Nuker** (Sellout Shop, 65 000 AP) : n'avait aucun effet. Le client lance désormais le NUKE existant 10 s après le début de chaque run (`renaissance.runDebuteA`), puis toutes les minutes, sans chevaucher un NUKE ou un combat de boss en cours. `soreal-idle-ui.js?v=228`. Test `idle-auto-nuker`.

## 2026-09-23 — Défis Evil/Sadistic, bonus de défis réellement câblés

Source : page Challenges (Normal / Evil / Sadistic).
- **Défis Evil et Sadistic** : n'existaient pas (seule la colonne Normal). Compteurs par difficulté (`challenge.completionsTier`), table EXP/AP/boss cible/nombre de complétions propre à chaque difficulté, liste affichée selon la difficulté active (ou celle du défi en cours). Débloqués en entrant dans la difficulté (wiki).
- **24 Hour** : EXP/AP = base x numéro du défi (400/5000 Normal, 4000/1000 Evil, 40000/1000 Sadistic).
- **Bonus câblés** : Basic Evil +10 % Adventure Stats/complétion ; No Augs Evil +5 %/+25 % de vitesse d'augments ; No Equipment Evil +3 slots (12 max) ; No Rebirth : -15 min de respawn par complétion à partir de Jake (Normal), du Greasy Nerd (Evil), d'IT HUNGERS (Sadistic) -- avant, GRB/GCT en profitaient à tort ; No NGU Evil +20 % vitesse Hacks ; No Time Machine Evil +10 % vitesse TM et +100 % d'or ; 100 Levels Normal +20 % vitesse Wandoos (le boot est réduit par les 100 Levels EVIL seulement) ; Troll Normal 1re = Magic NGU x3, Sadistic 1re = Energy NGU x3, Evil 5e = Hacks +25 %, slots d'accessoire (Normal 2e, Evil 1re, Sadistic 7e) ; 24 Hour = +10 % / +4 % / +2 % d'EXP des boss 24+ par complétion (additif aux perks) ; Laser Sword Normal = +0,01 x rang de l'augment à l'exposant par complétion.
- **Idle Mode** : x1,2 / x1,5 (Spoopy) / x1,8 avec les 5 No Equipment Sadistic (+2 %/complétion, +10 % à la dernière) ; le serveur expose `idleAttackMultiplier`.
- Non modélisé (systèmes absents) : Mayo, Cards, MacGuffins, Daycare, slot de Beard/Wish des Trolls, bonus « +0,05 » première/dernière complétion du Laser Sword (formulation ambiguë), flat +1 EXP du premier 24 Hour.
- Tests : `idle-challenges-tiers` ; tests titans/cooldown ajustés.

## 2026-09-23 — Perks manquants et respawn selon le wiki

- **Perks ajoutés** (page Perk Points, effets déjà modélisés dans SOREAL) : Iron Pill I/II (84/85, x26 et x4), SPAWN FASTER DAMMIT (93, -0,1 % de respawn/niveau), 15 perks Resource 3 (95-103, 122-124, 132-134, 141-143, 226-228), Faster Wishes (108, 155, 156, 159, 160), Minimum Wish Time Reduction (109/110, -24 s/niveau sur les 4 h), Hack Milestone Reducers (113-115, 217-219). « Welcome to Sadistic Difficulty » (144) applique maintenant aussi +20 % vitesse d'augments et +20 % vitesse des NGU. Restent exclus les perks de systèmes absents (MacGuffins, Cards, Mayo, Quêtes, Daycare, Merge slots).
- **Respawn** (page Respawn) : facteurs multiplicatifs (NGU, set Clock -5 %, perk 93, souhait 46), objets « Respawn » additionnés puis plafonnés à 48 % / 58 % / 78 % selon la difficulté, plancher 0,34 s ; le client plafonnait à 75 % au lieu de ~91,5 %.
- Tests : `idle-perks-evil-systems`, catalogue 150 perks.

## 2026-09-23 — ITOPOD réécrit selon le wiki

Source : page ITOPOD (Drops, One hit power required, Tower milestones) + page Respawn.
- Avant : cadence de kills inventée `min(1, (Power/1,05^étage)^0,2 / 20)` par seconde, aucun EXP/AP, étage = kills/10 sans borne.
- Maintenant : ennemis de l'étage F = 600 x 1,05^F PV et 10 x 1,05^F de défense ; dégâts d'Idle Attack = max(10 % Power, Power - défense/2) x bonus Idle (1,2/1,5/1,8) ; un kill = respawn (4 s réduit, plancher 0,34 s) + coups x 1 s (0,8 s avec Red Liquid) ; 10 kills = 1 étage ; sur l'étage de fin, 10 kills ramènent au départ ; EXP + 1 AP tous les n kills (n = 40 - palier, 20 au-delà ; EXP 1, 2 puis (palier-1)(palier-2)+2) ; PP de première atteinte des étages multiples de 10 (1 PP, +1 par centaine, étage/10 aux centaines).
- Par défaut l'ITOPOD monte jusqu'à l'« étage optimal » (le plus haut où un coup suffit) ; action `towerFloors` (départ/fin, ou auto) et champs dans la page ITOPOD.
- Rattrapage hors-ligne par lots (aucune boucle kill par kill), sauvegardes existantes migrées (étage = kills/10).
- Non modélisé : chute de Boosts (14 %), MacGuffins, dégâts subis / mort. Tests : `idle-itopod-floor-tracking` réécrit ; trois tests PP recalibrés (Power 1e6).

## 2026-09-23 — Beards, Wandoos, Money Pit

- **Beards of Power** : la formule du wiki est « progress per tick » ; la vitesse par seconde était 50 fois trop lente (`baseRate` x50, le plafond de 50 niveaux/s supposait déjà des ticks). Non modélisé : plusieurs Beards actives en même temps (pénalité Beards_SameResource) -- une seule Beard active.
- **Wandoos** (page Wandoos) : le multiplicateur de niveau d'OS est `niveau + 1` (« 100 % au niveau 0, 200 % au niveau 1, 401x au niveau 400 », le +4 % affiché étant trompeur) au lieu de `1 + (niveau+1) x 0,04` ; le plafond de 50 niveaux/s s'applique après tous les multiplicateurs ; Wandoos MEH n'est sélectionnable qu'avec le set Jake complété. Non modélisé : bonus des sets Wandoos/Wandoos XL, objet Wandoos XL.
- **Money Pit** (page Money Pit) : paliers 5 à 11 complétés avec toutes leurs colonnes (Adv Stat, Cube P/T ou les deux, HP, regen, EXP multipliée par le bonus d'EXP, niveaux Wandoos plafonnés à 20/50/100, Seeds). Non modélisé : « Equip +1 LVL / Daycare », paliers 12-16 (souhait).
- Vérifié sans écart : table des Augmentations (dont Laser Sword 2,3e19).
- Tests : `idle-money-pit-upper-tiers`, `idle-wandoos-meh-gating`, tests Wandoos/Beard recalibrés.

## 2026-09-23 — Boutique 4G's Sellout : effets réels, slots de Diggers

- Avant : seuls les objets EXP/PP avaient un effet ; tous les autres étaient injouables (achat refusé). Maintenant câblés : potions Energy/Magic/Resource 3 (alpha/delta = x2 ou x3 avec timer décompté par le moteur, beta = x2 jusqu'au Rebirth, perdue au Rebirth), Bar Bars (x2 bars, 60 min), Lucky Charm / Super Lucky Charm (Drop Chance x2, 30 min / 12 h), Little Blue Pill (PPP de l'ITOPOD doublés par pilule), Extra Inventory Space, Extra Accessory Slot 1-5, Digger Slots, Faster Wishes (+25 %), Auto Nuker (nuke client). Restent inactifs (système absent) : Mayo, Cards, MacGuffins, Quêtes, Daycare, Loadouts, cœurs, boutons personnalisés.
- **Slots de Diggers** : les perks « A Digger Slot! » (+2) et la boutique (+6) étaient calculés mais jamais lus ; le joueur n'avait qu'1 slot + set + défi (maximum 12).
- **Diggers PP et Blood** : le PP Digger (ITOPOD, PP des titans) et le Blood Digger (gain de sang des rituels) n'étaient jamais lus.
- Tests : `idle-sellout-effects`, `idle-diggers-pp-blood`.

## 2026-09-23 — Boutique EXP : achats d'aventure, slots, Rich Jerks

Source : page Experience (Spend Experience). Achats manquants (aucun n'existait, ni serveur ni interface, Rich Jerks n'avait pas d'écran) : Adventure Power/Toughness (3 EXP = +1), Max Health (3 EXP = +10), HP Regen (50 EXP = +1), espaces d'inventaire (2 EXP de 25 à 36, puis 4 x (possédés - 35), plafond 60), 2 slots d'accessoire (3 000 / 30 000 EXP), 1 slot de Digger (25 000 EXP) ; écran « Aventure et divers » dans la Boutique EXP avec Attaque/Défense pour riches. Action `buyExpShop`. Non modélisés : Auto Merge, filtre de butin, loadouts, Daycare, boutons personnalisés, Training Auto Advance, slots de Beard/MacGuffin, Auto-Activate d'Yggdrasil. Tests : `idle-exp-shop-adventure`, `idle-pages-render-2026-09-23`.

## 2026-09-23 — Quirks 18/54/90, No Time Machine Evil

- **Quirks ajoutés** : Accessory Slot! (18, +1 slot), Lower Minimum Wish Speed? (54, -24 s/niveau sur les 4 h de Wish), Even More Inventory Space? (90, +1 espace/niveau). Les autres quirks manquants (Cards, Mayo, Quêtes, MacGuffins, Daycare) restent hors périmètre.
- **No Time Machine Evil (1re complétion)** : +100 % de GPS de la Time Machine (page Broken Time Machine : « 1100 % au total avec les 10 No TM normaux ») et non un multiplicateur d'or d'aventure.
- Vérifié sans écart : rituels de Blood Magic, formules Iron Pill / Counterfeit Gold, formule de vitesse de Time Machine.

## 2026-09-23 — Souhaits à effet non branché

Wishes dont le bonus était déclaré vide alors que le système existe : 20 (temps minimum de Rebirth -10 s/niveau, 180 s -> 120 s), 46 (respawn -1 %/niveau, déjà ajouté au calcul de respawn), 61 (+0,5 % d'EXP global/niveau), 76/77/78 (paliers des Hacks QP / Number / Hack Hack -1 niveau/palier/niveau), 79 (+50 PPP de base par niveau dans l'ITOPOD), 107/108 (+0,001 au multiplicateur de boss Sadistic par niveau), 109 (slot d'accessoire), 111-114 (+2 % de vitesse NGU Energy/Magic par niveau). Restent sans effet (systèmes absents) : MacGuffins, Daycare, Quêtes, Cards, Mayo, double arme, nouveaux mouvements, Advanced Training auto, Cube boosting, paliers 12-16 du Money Pit.

## 2026-09-23 — Five O'Clock Shadow (Beards)

Le perk « Five O'Clock Shadow » (21) était calculé (`beardTrimSpeedLevel`) mais jamais lu : le facteur de temps de conversion des Beards (+1/3 par heure, 8 après 24 h) atteint maintenant son maximum 1 h plus tôt par niveau (minimum 12 h). Test `idle-beard-shadow-perk`.

## 2026-09-23 — Compétences d'aventure (client)

Page Skills / Build Move Cooldowns : les specials « Move Cooldowns » de l'équipement (Ring of Might 20 %, Sands of Time 20 %, Infinity Charm 10 %) réduisaient rien -- ils réduisent maintenant les cooldowns des moves (puis Red Liquid -20 %) ; Parry x3 avec le set Slimy complété ; l'Idle Mode lit le multiplicateur du serveur (x1,2 / 1,5 / 1,8). `soreal-idle-ui.js?v=231`. Test `idle-client-skill-tweaks`.

## 2026-09-23 — Drop Chance : set 2D et Cube comptés deux fois

Le bonus de drop du set 2D (+7,43 %) et du Cube d'Infinité (50 % et plus, additif avec les objets d'après la page Drop Chance) entrait déjà dans `specials.dropChancePct` -> `dropMultiplier` du moteur meta, puis était appliqué une seconde fois dans `rollKill` et pour les titans (avec un Cube à 50 %, le drop valait 2,25x au lieu de 1,5x). Le contexte meta signale maintenant `dropMultiplierIncludesGear` et le moteur d'aventure ne recompte plus set + Cube dans ce cas. Test `idle-drop-chance-no-double-count`.

## 2026-09-23 — Daily Spin complet

Page Daily Spin : la roue n'avait que les lots AP/graines (probabilités normalisées, donc AP surévalués). Table complète de chaque palier (100 % chacun) avec potions Energy/Magic α/β/δ, Lucky Charm, Bar Bar, Little Blue Pill et « CONSUMABLES JACKPOT » (contenus des paliers 3 à 7) ; les objets s'activent immédiatement comme à l'achat au shop Sellout. Poop, Beast Butter et MacGuffin Muffin (systèmes absents) sont tirés avec leur vraie probabilité mais sans effet. Les récompenses de la Money Pit (Cube, Wandoos) et de la roue s'affichent dans le message de l'interface. Test `idle-daily-spin-items`.

## 2026-09-23 — AP de Rebirth

Page Arbitrary Points : les Rebirths de plus d'une heure donnent 1 AP par 500 s (multiplié par le perk Fibonacci 89) ; n'existait pas. Non modélisés : 1 AP / 10 boss, sauvegarde manuelle (200 AP/jour). Test `idle-rebirth-ap`.

## 2026-09-23 — Puissance des boosts (page Boost)

Écart important : les perks « Boosted Boosts » I à V et les quirks « Beasted Boosts » I à IV étaient ADDITIONNÉS entre eux (5,9 et 3,45 au maximum) alors que la page Boost les dit multiplicatifs (2,5 x 2,2 x 2,2 x 1,5 x 1,5 = 27,2 et 1,5 x 2,2 x 1,5 x 1,25 = 6,19) ; les sets Badly Drawn et Construction (x1,2 chacun, multiplicatifs) étaient ajoutés aux +2 % de complétion. Un boost de force 1 valait environ 10 fois trop peu avec tous les bonus (431,78 sur le wiki, reproduit par le test). Test `idle-boost-power-composition`.

## 2026-09-23 — Objets manquants et butin des zones (audit wiki systématique)

Un script a extrait la section « Loot » des 32 zones du miroir wiki et l'a comparée au butin du code : aucune chance/plafond/niveau existant n'était faux, mais 59 lignes de drop manquaient. Ajoutés (114 objets au total) : 74 objets isolés (Looty McLootFace, Dragon Wings, A Beanie, pendentifs Ascended, Sir/King/Emperor Looty, GALACTIC HERALD LOOTY, Strand of Beard Hair, The Stealthiest Armour, 9mm Beretta, Evil Bonus Accs, etc.), 6 sets de titans Evil/Sadistic (Greasy Nerd, Mobster, Exile, Space, Rock, Amalgamate : 40 pièces, totaux = « Stats Max » du wiki) et les drops de titans (Jake, UUG, Walderp, Beast, Nerd, Godmother, Exile, IT HUNGERS, ROCK LOBSTER, AMALGAMATE). Le moteur gère maintenant les drops conditionnés à un set complété, « un parmi plusieurs » et à un ennemi nommé. Récompenses de complétion vides pour les sets dont le bonus n'a pas d'équivalent (MacGuffin, QP, Cooking, cartes). Ignorés (taux ou source non publiés) : pendentifs x3 de Chocolate/Evilverse/PPP, lignes « chance ? » de l'Aethereal Sea, x8/x9, GRAND DEMON LOOTZIFER, Triple Flubber, Blue Eyes Ultimate Chestplate ; hors périmètre : cœurs, indices, GLOP, Wandoos XL. Test `idle-adventure-missing-items-2026-09-23`.

## 2026-09-23 — Inventaire : No Equipment Evil

Page Inventory : les No Equipment Challenges Evil donnent 3 espaces par complétion et 9 de plus à la dernière (24 au total), et non 12 au maximum. Le total maximal d'espaces (24 + 360) se retrouve : EXP 36, Sellout 166, No Equipment 50 + 24, perks 24, souhaits 36, quirks 24.

## 2026-09-23 — Infinity Cube : taux de conversion

Le perk « Improved Cube Boosting! » (conversion à 2 % au lieu de 1 %) était exposé mais jamais lu, et le souhait 110 (+5 % d'efficacité du Cube par niveau, x2 au niveau 20) n'avait aucun effet : le versement d'un boost dans le Cube utilise maintenant `cubeBoostRate` et `cubeBoostEffectiveness`. Test `idle-cube-boost-rate`.

## 2026-09-23 — Collection : vraies informations sur les monstres

Signalé : « dans Collection, les informations sur les monstres ne sont pas bonnes ». Causes : (1) tous les mobs et gardiens de zone affichaient PV = toughness de la zone (x3 pour un gardien) et attaque = puissance recommandée de la zone, jamais leurs propres stats ; (2) les boss principaux lisaient les colonnes brutes du catalogue historique (PV/attaque/nom) au lieu de la définition réellement utilisée au combat ; (3) les zones sans dossier d'images (Beardverse et suivantes) ne listaient qu'une créature générique et leurs rencontres par ennemi n'étaient pas comptées. Maintenant : une entrée par ennemi du bestiaire wiki avec Power, Toughness, regen, Max HP, cadence et type ; boss avec Attaque, Défense, PV et EXP de la référence (boss 4 : 1,1 M/600 k/11 M, valeurs du jeu réel confirmées par capture, le tableau du wiki dit 1,3 M) ; rencontres comptées dès qu'un ennemi est tiré. Les découvertes faites avant ce correctif dans des zones sans images (compteur plat) ne sont pas reprises. `soreal-idle-ui.js?v=232`. Test `idle-collection-real-stats`.

## 2026-09-23 — Plusieurs Beards actives

Page Beards of Power : jusqu'à 7 slots (1 au déblocage, 1 Troll Normal complétion 4, 1 boutique EXP 50 000 EXP, 4 boutique Sellout) ; les Beards actives se ralentissent entre elles quand elles utilisent la même ressource (diviseur = nombre actif, x0,9 avec le set Beardverse) ; la conversion permanente du Rebirth traite chaque Beard active ; quirk « Beast's Special Beard Tonic » (+1 % de vitesse par niveau) branché. Sélectionner une Beard déjà active la retire ; le slot le plus ancien est remplacé quand tous sont pleins. Le bank de niveaux de Beard s'applique à la première Beard active (formulation du wiki ambiguë avec plusieurs Beards). Test `idle-beards-multi-slots`.

## 2026-09-23 — AP des boss d'aventure, boosts de l'ITOPOD

- Page Arbitrary Points : 1 AP tous les 10 boss d'aventure vaincus (multiplié par les bonus d'AP). Test `idle-boss-ap`.
- Page ITOPOD : 14 % de chance par kill de lâcher un boost de niveau 1 dont la force dépend du palier (1, 2, 5, 10, 20, 50, 100, 200, 500, 1 000, 2 000, 5 000, 10 000) ; limité par la place restante dans l'inventaire. Test `idle-itopod-boost-drops`.
- TIPPI et THE TRAITOR (titans 13 et 14) restent non modélisés : le miroir du wiki ne publie ni respawn, ni récompenses, ni butin pour eux (modèle vide).

## 2026-09-23 — Niveaux maximaux des Hacks

Page Hacks : chaque Hack a un niveau maximal (attaque/défense 7 720, Adventure 7 632, TM et Drop 7 544, Augments 7 456, NGU 7 340, Blood 7 252, QP 7 164, Daycare 7 048, EXP 6 960, Number 6 873, PP et Hack 6 757, Wish 6 262) ; la progression s'arrête à ce niveau au lieu de croître sans limite.

## 2026-09-23 — Cooking

Nouveau moteur `idle-cooking-v1.js` (déblocage par IT HUNGERS, slots 7/8 par Rock Lobster/Amalgamate, 8 ingrédients en 4 paires secrètes, efficacité « Nerdy Math » du wiki, bonus totaux x1,03 par objet de Cooking, Space x1,10, slots 7/8 x1,20, minuteur 23,5 h / 22,5 h avec Bread, banque 24,5 h, gain d'EXP plafonné à 300 % écrit dans `bonuses.cookingExp`) et page client. Manger un repas est refusé (`COOKING_GAIN_REPAS_NON_DOCUMENTE`) : le wiki ne publie pas l'EXP d'un repas (un seul point de mesure, 0,66 % à 132 % de bonus). Non ajoutés : inventaire d'ingrédients (les aliments de GLOP relèvent du combat contre IT HUNGERS), objet My Rainbow Heart.

## 2026-09-23 — Item Daycare

Nouveau moteur `idle-daycare-v1.js` : 321 taux de niveau par objet lus sur les fiches du wiki (297 des 383 objets du dépôt ; les 86 autres sont « daycare = ? » sur le wiki et refusés), 6 slots (3 achats EXP 250 / 25 000 / 500 000, 10e Blind Normal, 3e Troll Evil, perk 86 ajouté), réductions de temps rétroactives (Blind Normal, Daycare Kitty's Blessing I/II reclassés en réductions de temps, boost Sellout) et bonus de vitesse non rétroactifs (équipement, Fibonacci 55, souhait 27, Blind Evil/Sadistic, Digger et Hack Daycare, désormais lus), actions `daycarePlace`/`daycareRemove`, progression hors ligne jusqu'au niveau 100, survie au Rebirth, page client avec ETA. Non modélisés : cartes, Macguffin Daycare, récompense « équipement ou Daycare » de la Money Pit, objets de quête.

## 2026-09-23 — Questing

Nouveau moteur `idle-questing-v1.js` : Major Quests toutes les 7 h 50 (banque 10, 50 avec Extended Quest Bank ; Faster Questing +20 %, set Fad +10 %), zones de quête ouvertes quand leur set est complet (10 zones, objet de quête chacune), 50-59 objets (toujours 50 avec Fibonacci 610), drops actifs (5 % par kill dans la zone, plus Quest Drops et Improved Quest Looting), remise 1 + niveau / (11 - bonus), fusion comme l'équipement, +2 % de QP par objet de quête au niveau 100, idle questing (diviseur 8, jusqu'à 3), Truly Idle Questing, récompenses 50/10 QP et AP doublées sans remplir la barre d'idle, multiplicateurs QP (perks, souhaits, QP Hack, Mobster, Beast Butter), perks de quêtes et quirk 71 ajoutés aux catalogues, objets Sellout de quêtes achetables, page client. Choix laissés ouverts par le wiki, marqués « CHOIX SOREAL » dans le code (formule de remise, empilement, souhaits 19/62 sur les QP seulement). Non modélisés : Heroic Sigil set, My Orange Heart, Quest Reminder, quêtes au Daycare, Fruit of Quirks.

## 2026-09-23 — MacGuffin Fragments

Nouveau moteur `idle-macguffins-v1.js` : 22 fragments avec leurs formules par niveau et le ratio de temps T du wiki, application au Rebirth des fragments équipés (MacGuffin Muffin x2, achetable au shop Sellout et dans la roue quotidienne), bonus injectés dans `idleNguBonuses` (Power/Cap/Bars Energy, Magic, R3, Drop Chance, Stat, Adventure) et dans NGU, Wandoos, Augments, Blood et NUMBER, 22 slots (boutique EXP 10 M / 100 M, perks 66/67/88, quirks 19/50, set Edgy, Troll Evil 2, No Equipment Evil 5, 11 Sellout), drops (compteur de zone tous les 1 000 kills, ITOPOD tous les 5 000 avec les perks 68-71, titans), niveau de drop (perk 65, souhait 2, set Greasy Nerd), fusion a+b+1 sans plafond, sorts Blood MacGuffin α/β, Fruits of MacGuffin α/β d'Yggdrasil, page client. Choix non précisés par le wiki : bonus multiplicatifs avec les autres sources, un fragment de chaque type équipé, inventaire séparé. Non appliqués : cible du fragment Golden, souhaits 59/60, perk 56 (Daycare), Automerge, Purple Heart.

## 2026-09-23 — Cards et Mayo

Nouveau moteur `idle-cards-v1.js` remplaçant les fausses cartes horaires : 14 types de cartes et formule de bonus `(C1 + C2·R·T^C3·C4^T) x M` vérifiée contre les tableaux du wiki, rareté 0,80-1,20 (0,85 avec Disco), coût en mayo, tiers, tags, deck 10 à 120 (une carte par heure, pause si le deck est plein), 6 mayos avec générateurs (1 par heure partagé, +2 % de vitesse par générateur supplémentaire), Big Chonkers, recyclage, Regular Black Pens, Mayo Infuser, perks 161-216 et quirks 99-169 ajoutés aux catalogues, souhaits de cartes branchés par id, objets Sellout (deck, générateur, tag, Infuser, Pens) achetables, bonus des sets Rock/Rad/Disco/Duck/Amalgamate, Troll Sadistic 5 et 6, récompenses Mayo du Basic Sadistic, persistance au Rebirth, page client. Non faits : cartes Foil et End (taux « ~1 % »), fruits de Mayo (coût ambigu), sets de Cœurs, cartes QP. Choix : tirages uniformes, souhait 160 traité comme vitesse de mayo.

## 2026-09-23 — Bonus de complétion des sets

Nouvelle table des sets faits d'objets spéciaux (complétés au niveau 100) : Pissed Off Key (+10 % de progression PP en ITOPOD), Wandoos (300 EXP, +10 % de vitesse Wandoos après le boot), Normal Bonus Accs (+25 % de drop), et quatre objets qui n'étaient que des drapeaux de déblocage et sont maintenant de vrais objets fusionnables lâchés à coup sûr par leur titan : A Number (+10 % de vitesse NGU), UUG's Armpit Hair (+10 % de vitesse de Beard), Incriminating Evidence (+2 R3 Power, +80 K R3 Cap, +2 R3 Bars) et A Severed Unicorn's Head (+13,37 % de vitesse des Wishes). Potions, Bar Bars et Lucky Charms des sets Forest, HSB, Gaudy et Incriminating Evidence donnés une fois à la complétion. Bug corrigé : deux exemplaires d'un même objet spécial partageaient le même identifiant, ce qui interdisait la fusion et donc la complétion des sets d'un seul objet (les sauvegardes sont réparées au chargement). Migration « +10 EXP du set Training » supprimée (le wiki donne 10). Totaux Power/Toughness et EXP/AP de tous les sets vérifiés : aucun écart. Non faits : Wandoos XL, Flubber, Seed, cœurs (objets absents), Western et Exile (effet vague).

## 2026-09-23 — Audit du combat d'aventure (compétences)

Vérifiés sans écart : tous les cooldowns, multiplicateurs et durées des tableaux Skills, formule de dégâts (Power - Toughness/2, facteur 0,8-1,2, bonus Idle 1,2/1,5/1,8), cadence d'attaque des ennemis, régénération au repos x5/x10, respawn 4 s (0,34 s minimum), délais de réapparition et seuils manuels des titans. Corrigés : (1) le set Red Liquid réduisait à tort le cooldown de chaque compétence de 20 % alors que le wiki parle du « global cooldown » (délai entre deux moves différents) et de la vitesse de l'Idle Attack ; (2) Parry attaquait immédiatement, et jamais s'il était lancé avant le combat : il contre-attaque maintenant quand le prochain coup ennemi est paré (dégâts divisés par deux, puis x1 ou x3 avec Slimy ; une Charge active est conservée pour la contre-attaque). `soreal-idle-ui.js?v=233`. Test `idle-adventure-combat-wiki-parity`. Non simulés faute de chiffres du wiki : types de mobs (rapid, charger, grower, paralyze, exploder) et capacités spéciales des titans (le combat de titan reste un test de seuils). Le plancher de 10 % de dégâts ennemis n'est pas dans le miroir wiki (laissé tel quel).

## 2026-09-23 — Audit scripté des zones et du bestiaire

Comparaison par script de 254 ennemis de 30 zones (normaux et boss) avec les pages d'ennemis et de zones : stats identiques ; gold, EXP, boosts et drops de set de chaque section Loot conformes ; boss de déblocage et difficulté conformes pour les 32 zones. Corrigés : The West World (THE OUTLAW et THE SHERIFF sont des boss, ils étaient rangés en mobs normaux, si bien que le tirage de boss retombait sur les PV moyens de la zone), The Rad-Lands (7 mobs à `attack_rate=?` avaient reçu 0 : maintenant `null`, ignoré dans la moyenne), `bossChance` 1/4 explicite pour 14 zones Evil/Sadistic, `oneHitP` ajouté à 7 zones (Typo Zonw, Fad-lands, Rad-Lands, Back To School, West World, That 70's Zone, Halloweenies). Le générateur `design/build-idle-adventure-bestiary-v2.mjs` écrit `null` pour les valeurs inconnues et avertit de ne pas le relancer tel quel (le miroir a perdu des pages). Non faits : bestiaires de The Nether Regions et The Aethereal Sea (aucune stat d'aventure publiée pour leurs ennemis, ni dans le miroir ni en ligne) ; Manual/Idle P/T : le tableau de « Adventure Mode » est conservé, ses écarts avec certaines pages de zone sont documentés, non tranchés ; One Hit de la Construction Zone incohérent d'un facteur 10 sur le wiki.

## 2026-09-23 — Automatisation de l'inventaire

Nouveau moteur `idle-inventory-auto-v1.js` : Auto Merge (200 EXP, ordre de priorité du wiki : équipement, accessoires, slots d'automerge ; ignore les objets protégés, s'arrête au niveau 100), Auto Boost (débloqué par le 1er No Equipment ; l'excédent va dans le Cube quand tout est au maximum), minuteurs de 60 min réduits de 10 % par No Equipment et de moitié par l'objet Sellout (combinés par multiplication), recyclage de boosts (EXP jusqu'à 50 % + Basic Challenge, enfin lu ; un boost recyclé perd un palier et est réappliqué, seule lecture qui redonne les x1,94 / x1,77 / x1,88 de la page Boost), transformation Q/W/E (coûte un palier ; gratuite après la dernière complétion de 100 Levels, avec auto-transformation), jusqu'à 8 slots d'automerge (EXP 1 000, perks 111/112, quirk 55, Sellout x4), filtres de butin (par type 20 EXP, par objet Sellout, filtrage vers le Cube), loadouts (2 + 1 par EXP, 7 par Sellout), panneau client et raccourcis A/D/Q/W/E + clic. Question ouverte : prix d'Auto Merge, 200 EXP (page Experience) ou 1 000 (page Inventory). Non faits : exception hors-ligne du recyclage (le moteur ne distingue pas), réglage « consommer les boosts recyclés ». Les drops filtrés arrivent après l'entrée dans le sac : ils sont perdus si le sac est plein.

## 2026-09-23 — Cœurs, Wandoos XL et objets manquants

Les 10 cœurs du shop Sellout sont de vrais accessoires (stats et spéciaux du wiki, prix du wiki, achetables plusieurs fois pour être fusionnés ; AP débités une fois le cœur livré au niveau 0) avec leurs bonus au niveau 100 : Red +10 % EXP, Yellow +20 % AP (hors kills ITOPOD), Green +20 % PP, Blue consommables +10 %, Purple MacGuffins -20 % de kills, Orange +20 % QP, Grey Hacks +25 %, Rainbow cartes et mayo +10 % ; pour Red et Yellow le plus grand de l'effet équipé et de l'effet au niveau 100 s'applique. Wandoos XL : objet lâché par Walderp, Badly Drawn World et Boring-Ass Earth, nouvelle action `consumeWandoosCopy` (98 et XL : chaque niveau d'OS coûte des niveaux d'objet, la copie garde le reste), l'OS XL n'est plus sélectionnable librement, set XL = boot -10 %. The Triple Flubber (transformation d'une Lonely Flubber niveau 100, set +30 000 AP), Heroic Sigil et Still-Beating Heart (drops de The Beast et The Exile, sets +10 % de drops de quête et +1 % d'effet des tags). Corrigé : l'EXP/AP d'un set complété en retirant un objet du Daycare n'était jamais crédité. Sans effet faute de mécanique : Brown Heart et Seed (pas de crottin), Pink Heart (un seul slot de Wish). Écart de wiki : Wandoos XL tombe au niveau 3 à Badly Drawn World (fiches) et non 5 (page Wandoos).

## 2026-09-23 — Slots de Wish

Page Wishes : chaque slot de souhait a sa propre allocation Energy/Magic/Resource 3 et travaille sur son propre souhait, même formule ((Power x Alloc)^0,17 / (diviseur x (niveau+1))) par slot, multiplicateurs de vitesse et minimum de 4 h partagés (perks 109/110, quirk 54). 4 slots au plus : 1 de départ, 1 au 7e Troll Evil, 1 avec le set My Pink Heart, 1 avec le quirk 56 « A Wish Slot! » (50 000 QP, ajouté). Actions `setWishSlot` et `allocateWishSlot` (plafonnées par le cap effectif et les ressources possédées), anciennes sauvegardes migrées vers le slot 1, `system.allocation` reste la somme des slots, page client avec une carte par slot. Tests `idle-wish-slots-*`.

## 2026-09-23 — Yggdrasil complété

Nouveaux fruits Power δ, Watermelon et Fruit of Quirks ; Fruit of Numbers débloqué au Troll 5 ; crottin (Poop) avec paquets, Daily Spin, Blue Heart x1,5 / x1,65 et Brown Heart gratuit tous les 10 tiers ; 15 Auto-Activates de la boutique EXP ; Beast's Fertilizer (-1 min par tier et par niveau) ; perks 16/17 après 30 min. Corrigés : les graines ne sont plus boostées par l'équipement Yggdrasil Yield, séparation Quirk_Ygg / Quirk_Seeds (quirk 92), Fruit of Knowledge x3 par perk. Page client : Poop, Auto-Activate, durée d'un tier. Non faits : fruits de Mayo, multiplicateur QP du Fruit of Quirks, set Seed, Poop Sky/ITOPOD, souhait 60, Harvest Light. Note : `collectSystem('yggdrasil')` lit un `data.growth` inexistant (code mort).

## 2026-09-24 — Bestiaire de The Nether Regions et The Aethereal Sea (source externe)

Les fiches d'ennemis de ces deux zones sont des stubs sans stats (Nether) ou n'existent pas (Aethereal) sur le wiki, y compris en ligne. Le miroir local a été complété (NGU-Wiki\external\) avec les stats du dépôt ngu-idle-calculators (src/assets/enemy.ts, commit 42aafcb) après contrôles de cohérence : effectif et boss chance identiques aux pages de zone, puissance moyenne des ennemis / puissance Manual recommandée à 0,80 et 0,76 (0,54-0,80 dans les zones voisines), 212 ennemis sur 222 déjà identiques aux fiches du wiki. Ajoutés à `IDLE_ADVENTURE_MOB_BESTIARY_V1` : 8 ennemis Nether (6 + 2 boss) et 21 Aethereal (17 + 4 boss), avec type de mob et taux d'attaque ; le combat et la Collection utilisent donc leurs vrais PV, puissance et toughness au lieu du repli zone-plat. Les 7 `attack_rate=?` de The Rad-Lands sont comblés par la même source (1 à 1,2). Source externe : dérogation à la Règle n°1, acceptée par Norman le 2026-09-24. Non appliqué : les 21 écarts wiki/source de `external/proposed-corrections.json` (dont Back To School, puissance x2 dans le wiki, probablement une coquille) ; ils restent à trancher. Toujours introuvables nulle part : respawn, EXP et butin de Tippi et du Traitor. Tests `idle-zones-audit-bestiary` et `idle-bestiaire-aventure-v47-rebuild` mis à jour.

## 2026-09-24 — Écarts wiki/source appliqués et Cooking : manger

Les 21 écarts de `NGU-Wiki\external\proposed-corrections.json` sont appliqués (la source externe gagne, elle recoupe le wiki sur 212 ennemis sur 222) : Back To School (P/T/regen/PV divisés par 2 : le wiki avait un rapport puissance mob / puissance Manual de 1,21 contre 0,54-0,80 ailleurs), A Bulldozer (PV 2,07e33), 3 Guys Carrying a Beam (stats et type normal), attack_rate 1 -> 1,1/1,2 dans West World, Breadverse, Halloweenies, Construction et Duck Duck, type « paralzye » (coquille du wiki) -> « paralyze ». Cooking : l'action « manger » est débloquée avec la formule de jshepler (forum Steam) : gain = max(0,36, 1 - bonus^2) x 0,005 x multiplicateur de cuisine x efficacité, ajouté au Total Exp Gain plafonné à 300 %, où « bonus » est le Total Exp Gain déjà acquis. Le maximum (0,66 % pour 132 %) recoupe l'exemple du wiki ; sa capture, plus ancienne, ne montre pas le plancher. Source externe, dérogation à la Règle n°1 acceptée par Norman.

## 2026-09-24 — Action rapide de l'inventaire (clic droit PC, double tap téléphone)

Comme dans NGU Idle : un clic droit sur un objet du sac l'équipe ; si une pièce identique (même `definitionId`) est déjà équipée, il est fusionné dans la pièce équipée (même décision que le glisser-déposer sur un slot). Sur téléphone, un double tap rapide (420 ms) sur un objet du sac fait la même chose. Boosts et objets déjà équipés gardent l'ancien comportement (double tap = popup de détails) ; le maintien long ouvre toujours le popup de détails. Le composant `long-press-v200.js` traitait le clic droit de la souris comme un maintien long et ouvrait le popup : il l'ignore maintenant (seul un contextmenu tactile reste un signal de secours). `soreal-idle-ui.js?v=234`. Test `idle-inventory-quick-action-v209` (logique exécutée avec des doubles, câblage, maintien long). Non vérifié dans un vrai navigateur.

## 2026-09-24 — Boutique EXP : prix des espaces d'inventaire lisibles

Vérification demandée par Norman (« filtre de loot basique introuvable », « espaces d'inventaire toujours 2 EXP ») : le Basic Loot Filter (20 EXP, « Filtre de butin basique ») est bien dans la boutique ; les espaces d'inventaire suivent le barème du wiki (25-36 : 2 EXP, 37-60 : 4 x (possédés - 35), plafond 60 avec 24 de base), mais l'étiquette « dès 2 EXP » cachait la progression. Le snapshot expose maintenant tous les prix restants (`remainingCosts`) et les boutons affichent le coût total réel du lot (x1 = 2, x10 = 20, x36 = 1 224 EXP) avec un bouton « tout ». Achats du wiki toujours absents : Training Auto Advance (300 EXP), Custom Input Buttons 1 à 4 (50 / 100 / 500 / 1 000 EXP, effet non décrit par le wiki) et les 6 Auto-Activate de fruits de Mayo (1 Md EXP, cap 100 Q ; fruits de Mayo non implémentés).

## 2026-09-24 — Reliquats MacGuffins, Automerge, Cards

Faits : cartes QP (page Cards « QP Gain », page Questing « Other features : QP Hacks, QP Cards ») : le bonus multiplie la récompense QP des quêtes comme le QP Hack (`env.qpCardMultiplier`). Réglage « consommer les boosts recyclés » (Build History 2018, build .367 : « consumes recycled boosts or leaves them alone ») : coché par défaut ; décoché, un boost recyclé reste dans le sac jusqu'à la fin de la passe A + clic / Auto Boost, sans marqueur persistant (aucun décrit) ; case dans le panneau, `inventory-auto-v1.js?v=2`. Purple Heart : vérifié branché sur les drops réels (800 kills en zone, 4 000 à l'ITOPOD ; les minimums 720 / 1 800 de la page MacGuffin Fragments confirment qu'il compte aussi à l'ITOPOD). Wandoos XL à Badly Drawn World : niveau 3 tranché, quatre sources (Template:Item data `BDlvldrop = 3`, fiche, page de zone, tableau d'Adventure Mode) contre la seule page Wandoos (5) ; le code avait déjà 3. Sets de Cœurs liés aux cartes (Rainbow, Blue/Infuser, Still-Beating) : déjà branchés et testés. Automerge des MacGuffins équipés : déjà fait. Tests `idle-cards-qp-quests`, `idle-inventory-auto-consume-recycled`, `idle-macguffins-purple-heart-drops`, `idle-inventory-auto-client` mis à jour.

Abandonnés (wiki muet ou ambigu) : cible du fragment Golden (aucune page) ; souhaits 59/60 (+20 % par niveau sur un nombre entier de niveaux, arrondi et position dans ⌊…⌋ / ⌈…⌉ non publiés) ; perk 56 Macguffin Daycare (aucune vitesse de Daycare publiée pour les fragments) ; exception hors ligne du recyclage (page Boost, « offline boost progress » : le moteur ne distingue pas en ligne / hors ligne) ; prix d'Auto Merge : 200 conservé (tableau de la boutique, page Experience ; le 1 000 de la page Inventory ressemble à l'« Inventory Merge Slot! » à 1 000, mais aucune page ne le prouve) ; cartes Foil (cosmétiques, « no special properties ») et End (« ~1 % » non chiffré).

## 2026-09-24 — Boutique EXP : Training Auto Advance

Ajouté « Training Auto Advance » (300 EXP, achat unique, wiki Experience > Misc ; libellé client « Avance automatique de l'entraînement »). Le wiki (Experience, Basic Training > Related Purchases) dit seulement : « Automatically allocates energy each time a skill is unlocked while leaving the necessary cap for each skill ». Lecture retenue, la plus littérale : à l'instant où une compétence se débloque, l'énergie allouée à sa prérequise au-delà de son cap lui est transférée ; la prérequise garde exactement son cap (donc sa vitesse maximale), l'énergie inactive n'est jamais prise, le total alloué ne change pas, et le transfert se répète en cascade. La compétence débloquée ne progresse qu'à partir de l'instant de son déblocage (calculé depuis la vitesse de sa prérequise), y compris hors ligne. Un déblocage acquis avant l'achat ne déclenche rien. Effet dans `advanceBasicTrainingStateV411` (option `autoAdvance`), passé par `synchroniserEntrainementBaseSorealIdleV41_`. Test `idle-basic-training-auto-advance`. Non ajoutés : « Custom Input Button 1..4 » (50 / 100 / 500 / 1 000 EXP) — aucune page du miroir ne décrit leur effet (Energy, Magic, Resource 3 et 4G's Sellout Shop disent seulement que les boutons % « work like the other custom buttons ») ; rien n'est inventé. `meta-progression-v130.js` modifié (une étiquette) sans changer son `?v=` : sans rechargement du cache, le client affiche le nom anglais du serveur.

## 2026-09-24 — Reliquats Yggdrasil : Giant Seed, sources de Poop, Harvest Light

Vérifié, déjà branché : Brown Heart (set) (chaque 10e Poop gratuite, via `completedSets`) et Pink Heart (set) (+1 slot de souhait) ; les commentaires « sans effet » sont corrigés, test de bout en bout du Brown Heart. A Giant Seed devient un vrai objet lâché à chaque kill du Grand Corrupted Tree (niveau 0, garanti) ; Seed (set) au niveau 100 = 10 Poop une seule fois ; nouvelle action `consumeGiantSeed` (Yggdrasil débloqué, objet non verrouillé) : max(1, ⌊L + L²/100⌋) graines, bouton « Ajouter aux graines » (`soreal-idle-ui.js?v=234`). Poop : Icarus Proudbottom en The Sky (0,05 %, plafond 0,5 %, multiplié par le Drop Chance) ; ITOPOD avec la perk 30 : 1 tous les 9 000 kills + 0,01 % par kill, hors-ligne compris. Yggdrasil Harvest Light : l'achat était refusé (aucun effet déclaré), il allume maintenant le menu Yggdrasil. Nettoyage : branche morte `collect('yggdrasil')` retirée. Choix non précisés par le wiki : le 0,01 % ITOPOD n'est pas multiplié par le Drop Chance ; au-delà de 100 000 kills d'un coup, l'espérance remplace le tirage kill par kill ; la lumière s'allume pour un fruit qui ne pousse plus ou dont la première récolte du Rebirth est prête (1 h). Le taux ITOPOD vient de la colonne « Buy Early? » de Perk Points, recoupée par « 2-11 per day » (page Yggdrasil). Non faits : QPRewardModifier du Fruit of Quirks (jamais défini, Questing dit seulement « multiplied by other bonuses ») ; souhait 60 (+20 % par niveau, place dans l'arrondi non publiée, coût 400 Qi sur Wishes contre 22 Sx sur Yggdrasil) ; fruits de Mayo (cap requis « 100 Q » sur Experience, graines « weird_seeds » et condition de déblocage non publiées).

## 2026-09-24 — Audit de seconde passe : systèmes secondaires (composition et « catalogué mais non branché »)

Méthode : script `design/audit-catalog-effects-read.mjs` (exécute chaque perk, quirk et souhait au niveau 1, liste les champs d'agrégateur modifiés, vérifie qu'ils sont lus, sinon cherche l'id ; pour le Sellout : achetable / passif / lu) et `design/compare-catalogs-to-wiki.mjs` (nom, coût, cap, niveaux, diviseurs comparés au miroir : 0 écart chiffré sur 232 perks, 186 quirks, 231 souhaits ; prix et maxima de tout le Sellout identiques à la page). Tests `idle-catalog-effects-read` (fige les exceptions) et `idle-catalogs-vs-wiki-mirror` (ignoré sans miroir). Cinq relectures indépendantes page par page (Gold Diggers/Hacks, NGU/Beards, Yggdrasil/Challenges/Wishes, Fibonacci/ITOPOD/Titans, Boost/Cube/Inventory/Adventure) ont fourni les écarts ci-dessous.

Corrigés (chacun avec test, `idle-second-pass-*` et `idle-catalog-effects-read`) :
- Perk 34 « Bonus Titan EXP! » : agrégée (1 + 0,5 x niveau) puis copiée dans un objet que personne ne lisait. Wiki (Experience, Perk Points) : +50 % fixe sur les 3 x niveau premiers kills de chaque titan par Rebirth ; compteur `rebirthKills` remis à 0 au Rebirth. Composition avec le souhait des titans non publiée : multiplicatif.
- Arbitrary Points : facteurs Yellow Heart x Fibonacci 89 (page Arbitrary Points, « 158,25 % x 120 % x 102 % », arrondi inférieur) sur toutes les sources (défis, roue, Money Pit, Fruit of Arbitrariness, titans, bosses, sets, Rebirth) SAUF les kills de l'ITOPOD, qui recevaient à tort le Fibonacci 89 ; aucune source n'arrondissait. Les succès (jusqu'à +58,25 %) n'existent pas dans SOREAL.
- Hacks : les Bars de R3 multipliaient la vitesse ; la formule de la page n'a que R3 alloué x Puissance R3 x bonus.
- NGU : plafond de 50 niveaux/s (pages NGU et Energy) absent, seuls les barbes et Wandoos l'avaient.
- NUMBER : NGU Number et Beard Number étaient dans le NUMBER figé au Rebirth ET remultipliés en direct (compté deux fois). Fruit of Numbers et Number Hack restent en direct (choix historique, la page NUMBER les range dans le produit du prochain Rebirth).
- Titans : délai minimal de 60 min (page Titans) ; le Rebirth relance le délai complet de chaque titan déjà vaincu ; bonus EXP du 24 Hour Challenge appliqué aux titans (« bonus also applies to Titans », arrondi inférieur).
- Wishes : la Puissance de la formule (Energy, Magic, R3) est la Puissance effective (perks, équipement...), comme pour les Hacks et les NGU.
- PPBonus (Yggdrasil, Fruit of Rage) : les quatre sets « PP earnings » (Green Heart 20 %, Pissed Off Key 10 %, Pretty Pink 10 %, Halloweenie 45 %) sont des facteurs séparés (x2,105), pas 1 + 0,85 ; le PP des titans reçoit le même facteur (« bonus applied to all Perk Points gain »).
- Infinity Cube : 1 % de la valeur TOTALE du boost, Boosted Boosts / Beasted Boosts compris (jusqu'à x15 perdu).
- Sellout : « 7-Day Time Bank for Daily Spin! » achetable (banque de retard 12 h -> 144 h, lecture : plafond total 36 h -> 7 jours) ; « An Evil Accessory Slot » (500 000 AP, Evil ou Sadistic) ajouté (client : une ligne de libellé).
- Ascension des objets de niveau 100 (page Inventory + pages d'objets) : Forest Pendant -> Ascended -> ... -> Ascended x9 ; Looty McLootFace -> ... -> LootzLrtozl (niveau 0) ; quatre objets ajoutés (x8, x9, GRAND DEMON LOOTZIFER, LootzLrtozl, données des modèles wiki) ; client : le bouton « Transformer » couvre ces objets (`soreal-idle-ui.js`, `?v=` non modifié).
- En-têtes de `idle-perks-v1.js` et `idle-quirks-v1.js` remis à jour (les « exclusions » annoncées sont câblées depuis).

Non fait, avec la raison :
- Perk 56 Macguffin Daycare, souhaits 59 / 60 (arrondi non publié), Dual Wield 28 / 45 (2e slot d'arme, mécanique et interface absentes), cartes Foil / End.
- Sellout non achetables (effet purement d'interface ou cosmétique) : boutons % personnalisés (5 objets), Quest Reminder, Adventure Light, NGU Cap Modifier, Daycare Kitty Art, Resource 3 Name Randomizer ; Adventure Advancer (automatisation de zone), Lazy ITOPOD Floor Shifter (la montée vers l'étage optimal existe déjà sans achat), Insta Training Cap (« 6 energy, 1 pour chaque training » : la Basic Training de SOREAL a 12 compétences, correspondance non publiée).
- Ambigus, non tranchés : Beard Bank par barbe (une seule barbe active est banquée) ; Beard Speed équipement x set (le wiki n'a qu'un terme `1 + Equip`) ; PP des titans IT HUNGERS / ROCK LOBSTER (page ITOPOD 600 000 / 800 000 contre page Titans 0,5 / 0,7 PP) ; AP du titan 1 (10 sur Titans, « 15-70 » sur Arbitrary Points) ; unité de temps des Wishes (ticks ou secondes) ; +1 EXP de boss 24+ (première complétion 24 Hour) ; arrondi vers le bas des caps d'objet ; Fibonacci 1597 (art cosmétique) ; THE END (transformation finale de la dernière Looty, objet sans bonus) ; achievements ; No Equipment / Laser Sword Evil-Sadistic (cumuls non publiés).
## 2026-09-24 — Audit des systèmes jamais comparés au wiki (Banks, Rebirths, Portraits, Special Prize...)

Pages lues et comparées au code : Achievements, Arbitrary Points, Banks, Bestiary, Boss Fights, Rebirths, Hard Reset Challenge, Player Portraits (+ Portrait pack pictures), The Titan Effigy, Safe Zone: Awakening Site, The Death Note, Cas Boss, A Very Strange Place, Awakening The Beast, A Crumpled Note.

Faits. (1) Banks : les Perks 36-40 et Quirks 20-24 ne retenaient rien, le niveau d'Advanced Training n'était jamais banqué. Le pourcentage cumulé (1 % par niveau de perk, 0,5 % par niveau de quirk, arrondi inférieur) s'applique maintenant au niveau de fin de run de chaque compétence d'AT, y compris les deux dumps Wandoos (page Advanced Training : « every Advanced Training ability »). Page Banks et page Rebirths : l'AT perd son niveau et l'accès au menu au Rebirth ; tant que le menu est fermé (Basic Training pas refait), les niveaux d'AT (retenus ou non) n'ont aucun effet sur Power/Toughness/Block ni sur les dumps Wandoos (`atLevelV1`). Les tests qui posaient des niveaux d'AT sans ouvrir le menu sont mis à jour (commentaire 2026-09-24). (2) Perk 18 « Instant Advanced Training Levels » : un niveau de chaque compétence d'AT par niveau de perk à chaque Rebirth ; l'effet était calculé et jamais lu. (3) Player Portraits : nouveau module `idle-portraits-v1.js`, 50 portraits (défaut PlayerAPportrait16, 44 sets dont les 2 bonus du set Forest, souhaits 26 / 75 / 202, SEXY et SMART à 250 % de bonus permanent), choix cosmétique (`action: "portrait"`), la route média `/api/idle/media/player` accepte `?portrait=<fichier du wiki>` (repli sur le défaut si le fichier R2 manque). (4) Special Prize (Tips N' Tricks, Arbitrary Points) : 50 000 AP une seule fois, sans bonus d'AP (`action: "specialPrize"`). (5) Client : le menu Achievements n'existait pas côté client (le serveur publiait les 153 succès sans page) ; nouvelle page `modules/profile-v1.js` (succès, BP, bonus d'AP, portraits, Special Prize), menu « Achievements », portrait choisi passé à l'image du héros au combat. `?v=` non modifiés ; nouveau `<script src="/modules/profile-v1.js?v=1">` dans index.html, `soreal-idle-ui.js` et `meta-progression-v130.js` modifiés : à bumper. Tests `idle-banks-advanced-training`, `idle-portraits-special-prize`, `idle-profile-page`.

Vérifiés sans écart, rien à changer : The Titan Effigy (fiche 479 identique, butin AMALGAMATE Brutal niveau 4) ; Safe Zone (boss 4, régénération x5 / x10 avec GRB, retour à la zone sûre après une défaite) ; déblocages de la page Boss Fights (Normal, Evil, Sadistic : 4 à 137, 58 à 200, 125 à 269, sauf TIPPI 296 et THE TRAITOR 301, titans sans stats publiées) ; A Very Strange Place (déjà couvert par l'audit des zones) ; facteur de temps de Rebirth et minimum de 3 min (2 min avec le souhait) ; cap d'entraînement de base -10 % par Rebirth ; boss et NUKE (le tableau du wiki dit défense >= 5x l'attaque du boss, le code suit la règle du jeu des deux côtés, inchangé) ; Bestiary (aucune récompense de complétion sur la page).

Non faits, avec la raison. Awakening The Beast / A Crumpled Note : la quête (Skeleton Guardian 30 M P/T, 3 Md PV, 3 M de régénération ; Crumpled Note ; quatre indices ; Rebirth au bon moment) n'est pas modélisée et The Beast reste combattable dès le boss 132 ; le wiki se contredit sur la fenêtre finale (« 43:19, entre 43:05 et 43:35 » sur Awakening The Beast, « entre 43:09 et 43:29 » sur Secrets and Spoilers), l'état exact entre les deux Rebirths n'est pas décrit, le niveau du Stick et du Stapler n'est pas précisé et l'indice de l'ITOPOD (étage 0 à 101 sans équipement, sans relancer le sous-menu) demande un suivi d'ascension que le modèle agrégé n'a pas. The Death Note : le Consigliere n'a aucune statistique publiée (sa fiche n'a que « il remplace la Godmother ») ; la Godmother reste combattable dès le boss 166. Portraits « Complete all the Normal / Evil / SADISTIC challenges » : « complété » (une fois ou au maximum) n'est pas précisé ; Sexy Player Fashion Pack (110 kreds), portraits Steam, connexion d'Halloween et Krissmuss 2020 : achats ou événements passés. Arbitrary Points : « Buying AP » et « sauvegarde manuelle, 200 AP par jour » (pas de bouton de sauvegarde dans SOREAL) ; l'option « A PRETTY KITTY » du Special Prize (aucun effet propre décrit). Hard Reset Challenge : page candidate à la suppression, toutes récompenses à 0. Cas Boss : « fan fiction, aucun tel boss » (boss 191 fictif). Écart du wiki noté : la page Achievements annonce 5 825 BP au maximum alors que la somme de ses lignes vaut 5 815 ; One Hit de la page Ancient Battlefield (422 550) contre le tableau d'Adventure Mode (282 966 avec le bonus Spoopy, valeur du code).

## 2026-09-24 — Audit exhaustif des objets (431 modèles « Item data »)

Méthode : un script lit les 431 modèles et les 431 fiches du miroir, puis compare chaque objet au jeu (IDs, slot, Power/Toughness de base, Base value, Specials un par un, taux Daycare, sources de drop zone et titan avec taux, plafonds et niveaux, évolutions, sets). Résultat : 406 objets du jeu sur 431 modèles ; les écarts trouvés sont corrigés, le reste était déjà exact (404 lignes de drop de zones recoupées à la fiche de zone, 0 écart de taux/plafond/niveau ; 12 titans recoupés ligne à ligne ; 50 pages « (set) » : composition et totaux Power/Toughness identiques).

Fait : (1) Base value publiée comme valeur de départ (352 objets, tirage aléatoire retiré). (2) Ascensions : table `ITEM_EVOLUTIONS_V1` tirée des champs `evolutionto` (Forest Pendant jusqu'à Ascended x9, lignée Looty, Wanderer's Cane, Lonely Flubber, Small Gerbil) ; transformation générique au niveau 100, objet obtenu au niveau 0 (page Inventory) ; nouveaux objets Ascended x8 (430), Ascended x9 (504), GRAND DEMON LOOTZIFER (431) et LootzL...OOt (505), avec stats, Specials et Daycare des modèles. Le bouton client « Transformer » lit `itemCatalog[].evolutionTo` (seul changement client, `soreal-idle-ui.js` sans bump de `?v=`). (3) Set « Evil Bonus Accs » (8 accessoires 445-452) : +20 % d'Adventure stats à la complétion, facteur ajouté aux multiplicateurs d'Adventure stats (le wiki ne dit pas s'il s'additionne ou se multiplie aux autres sources : convention du moteur, un facteur par source). Tests : `idle-items-wiki-audit-2026-09-24` (+ `idle-daycare-v1` : 315 -> 319 objets à taux publié).

Non fait, avec la raison : - Effectiveness des objets (« 100 % effective when you've slayed Boss #N », 6 valeurs : 20, 33, 58, 67, 82, 100) : la seule formule publiée est celle de la page HSB (set), « (Current Boss)/20 x 100 », et « Current Boss » n'est pas défini (run en cours ou plus haut boss) ; ce serait un changement de balance majeur pour tout l'équipement, à trancher. - Blue Eyes Ultimate Chestplate (342), Sack of the Exile (341), Face of the Exile (336), Seal of the Exile (335) et les 4 Clues de l'Exile (336-340) : chaîne secrète d'assemblage dans l'inventaire (positions de cases, Hack Hack, quête à 90 %, ITOPOD 950-999) dont les conditions ne sont pas toutes chiffrables ; le drop de la Sack (2 % fixe) et de la Face (25 % fixe) dépend du set Exile complet, celui du Blue Eyes de la Sack (0,0001 %). - Clues 1 à 4 du Beast (180-183), A Crumpled Note (179), The Death Note (288) : quêtes secrètes sans stats. - Ingrédients de cuisine GLOP Recipe, GLOP, Steak, Pickle Ice Cream, Surstromming, Marmite, Pineapple Pizza (367-372, 387) : aucun taux de drop publié (« found on » seulement), GLOP « 5 à 8 attaques » vague. - A Spittoon (285) : fiche sans donnée. - THE END (16 pièces, dont 480 et 485 obtenues par ascension de l'Ascended x9 / LootzL...OOt, et une pièce à chaque boss Sadistic 300, hack et sort final) : consommables sans stats, fin du jeu non implémentée. - Ascended Ascended Ascended Pendant en zone (Chocolate World, Evilverse, Pretty Pink Princess Land) : taux « 0.1% + 0.0000001% » dont la notation « + » n'est expliquée nulle part. - Niveau de drop des Evil titans : le bonus « No Rebirth Challenge » n'est pas appliqué aux objets à niveau fixe (Ascended x4, Looties...), ambigu (le wiki l'exclut explicitement pour King Looty du Godmother mais pas ailleurs). - Écarts wiki sans effet : Heart Shaped Panties (max niveau 100 publié 1333, deux fois le max niveau 0 = 1334), A Rusty Old Sabre (max niveau 100 publié 9 720 001 000, max niveau 0 4 860 000 000). - Noms : les deux premiers sets restent en français ; « The Tuba of Time », « A Beard Comb », « A Shrunken Voodoo Doll » y perdent leur article (sans effet sur le jeu, le client a sa propre table de noms).

## 2026-09-24 — Pages-guides (FAQ, Glossary, Advanced Guide, Speedruns, New Player Guide, Tips N' Tricks, The Final Guide, UUG, Cultural References, Secrets and Spoilers, THE END, Tools, Builds, Build <stat>)

Fait : Money Pit, « One-Time Bonuses » (or TOTAL jeté, une fois chacun, masque `records.moneyPitOneTimeMask`) : 1E8 -> +100 Max HP et +1 HP Regen d'Aventure ; 1E10 -> +1 barre Energy et Magic (pages Money Pit, Energy, Magic ; la FAQ, plus ancienne, disait 1B) ; 1E11 -> Looty McLootFace (niveau 0, non marqué versé tant que le sac est plein) ; 1E12 -> +100 EXP. Les seuils versés par un jet sont dans `result.oneTime`. Sellout Shop : « An Evil Accessory Slot » (500 000 AP, achat verrouillé hors Evil, page 4G's Sellout Shop / Special 3 ; utilisable en Normal une fois acheté, Advanced Guide ; Builds : 6 slots d'accessoire viennent de la boutique), l'ancien commentaire « pas de difficulté Evil » était périmé. Titans : copie de Wandoos 98 garantie au kill de GRB et du Grand Corrupted Tree (commit précédent). Tests `idle-money-pit-one-time-bonuses`, `idle-evil-accessory-slot`, `idle-money-pit-daily-spin-random-reward` (mis à jour : 1e9 franchit le seuil 1E8).

Retiré pour éviter un doublon avec les branches parallèles : le secret « Sneaky Secret about Rebirthing » (w5-b, Achievements, mêmes champs `speedrunStreak`) et le « Special Prize » de 50 000 AP (w5-b, `idle-portraits-v1.js`). Les deux étaient certains (Rebirths, Tips N' Tricks, Speedruns, Arbitrary Points, Build History .407).

Vérifié conforme (aucun écart) : tick 1/50 s et Energy Speed en fractions entières de 50 (10, 12,5, 16,7, 25, 50), plafonds Power/Cap/Bars 1E18/9E18/50, niveaux de NGU 1E9, diviseurs Evil des fonctionnalités (Augs 2,5E12, TM 1E12), Wandoos 98 (1 %/4 % par niveau, produit à la puissance 0,8), Iron Pill (Blood^0,25), déblocages par objets (Sky -> ITOPOD, GRB -> NGU, GCT -> Yggdrasil, Jake -> Diggers, UUG -> Beards, Walderp -> MacGuffins, Beast -> Questing), niveaux de boss des zones Evil, ITOPOD étage 1600 et 1 000 000 PPP = 1 PP, Flubber (0,82 % au boss 59, +0,41 %/boss), Ring of Apathy (Goblin, 0,8 %), butin d'UUG, Dragon Wings 0,15 %, 14 slots d'accessoire (Builds), report du délai du Money Pit après un Rebirth, minimum de Rebirth de 3 minutes.

Contradictions page-guide / code : FAQ « Training set : 2 Energy Speed, 20 EXP » et « Forest set : 1 Energy Potion a+b, 1 Energy Bar » contre les pages Training (set) (10 EXP) et Forest (set) (2 potions alpha, 2 beta, 2 Energy Bar Bar, +5 Energy Power, 200 EXP) : le code suit les pages de sets, la FAQ est périmée. FAQ « 1B : +1 Energy et Magic par barre » contre 1E10 (3 pages). FAQ « 1E8 : +1 Adventure attack and defense » contre la page Money Pit « +10 Power, +10 Toughness » : non versé (voir plus bas). Basic Training, colonne « 1 cap at » (56, 74, 81, 86, 89, 92) : le code donne 56, 73, 80, 85, 88, 91 (`nextBasicTrainingCapV411`, « -1 » propre à SOREAL) ; la formule « réduction = ⌈10 % du cap⌉ » donne 57, 74, 81, 86, 89, 92 : aucune formule ne reproduit les six valeurs, rien n'est modifié.

Non fait, faute de valeurs certaines ou parce que la fonctionnalité est trop grande : AutoKill des titans (réglage « Automatically Kill Titans » ; seuils P/T/Regen publiés sur Adventure Mode ; règles hors ligne contradictoires : « no items drop while offline » (New Player Guide) contre butin normal (Titans) ; réglage client requis) ; THE END (16 pièces, dont 4 tirées sur AMALGAMATE sans taux publié, THE TRAITOR absent, dernier hack, dernier sort de sang, carte THE END, Perk 231 / Quirk 176 / Wish 203, écran de fin) ; énigmes de déblocage des titans (Beast : quatre indices, fenêtre de Rebirth 43:09-43:29 ; Greasy Nerd : code FARTS ; Godmother : Death Note ; Exile ; IT HUNGERS : GLOP) ; croissance de puissance d'UUG par tour ((2 - niveau/100)^tour) et invincibilité (combat sans tour) ; plafond d'Adventure Power/Toughness 1E36, d'Attack/Defense 1,80E308 et « 4,84 Qi avec les potions » (FAQ seule, portée base ou total ambiguë) ; +1 EXP par boss 24+ à la première complétion du 24 Hour Challenge (Challenges, New Player Guide : ordre d'application avec les multiplicateurs non publié) ; bonus 1E8 « +10 Power, +10 Toughness » (page) contre « +1 » (FAQ) ; Money Pit : paliers 12 à 16 du souhait 4 (« 1h worth of blood » ambigu) et « Equip +1 LVL » ; saut de niveau cible -1 (Tips, interface). Aucun fichier client modifié, aucun `?v=` changé.

## 2026-09-24 — Fusion de main dans w5-e (dédoublonnage)

Doublons résolus en gardant la version de main (déjà testée) : slot « An Evil Accessory Slot » (`minDifficulty`, pas `requiresDifficulty`), ascension des objets (table `ITEM_EVOLUTIONS_V1` seule ; `ASCENSION_CHAIN_V1` supprimée, LootzLrtozl = `glitchyLooty`), bouton « Transformer » du client (piloté par `itemCatalog[].evolutionTo`), bonus AP commun `apWithBonusV1` (succès x Yellow Heart x Fibonacci 89, remplace `apGainV1`), banque d'Advanced Training (total `bank.advancedTraining` réinjecté au Rebirth avec le perk 18 ; suppression de `advancedTrainingTracks/Pending` et `applyAdvancedTrainingBankV1`). Conservé de w5-e : perk 34, Arbitrary Points, Hacks, NGU 50 niveaux/s, NUMBER, Titans 60 min, Wishes, PPBonus, Infinity Cube, banque Daily Spin, catalog-effects-read. Tests mis à jour (2026-09-24) : idle-daycare-v1, idle-earlygame-v47, idle-second-pass-banks-loot, idle-second-pass-composition.

**Seconde fusion (main = w5-d dans w5-e).** Perk 34 « Bonus Titan EXP! » : une seule lecture gardée, celle de w5-e (`titanExpBonusKills` = 3 x niveau, lu directement dans la définition du perk, compteur `rebirthKills` remis à zéro au Rebirth) car c'est la formulation exacte de la page Perk Points ; la lecture de w5-d (`titanExpFirstKillsMultiplier` reconvertie en kills, compteur `killsThisRebirth`) est supprimée avec son test. NUMBER : la version de w5-d est gardée (NGU Number, Beard, Fruit of Numbers, MacGuffin, Number Hack sont tous des facteurs du PROCHAIN NUMBER calculés dans `refreshRebirthState` ; le NUMBER courant n'est plus multiplié en direct). Conservés de w5-e : bonus EXP 24 Hour Challenge sur les titans, plancher de délai 60 min, délai relancé au Rebirth.


## 2026-09-24 — Audit de seconde passe (composition) : systèmes de progression

Pages relues : Basic Training, Advanced Training, Augmentations, Broken Time Machine, Blood Magic, Wandoos, Money Pit, Rebirths + NUMBER, Energy, Magic, Resource 3, Boss Fights, Gold, Experience (Gain / Spend), plus Attack, Defense, Banks, Yggdrasil, Arbitrary Points, Perk Points. Méthode : pour chaque page, les affirmations chiffrées ET la façon dont les facteurs se combinent, vérifiées dans `idle-ngu-progression.js`, `idle-basic-training.js`, `idle-sqlite-runtime.js`. Branche fusionnée avec main en fin de travail (main avait entre-temps repris, chacun de son côté, le bonus d'AP commun, le secret Speedrun, les bonus uniques du Money Pit et les banques d'AT + perk 18 : ses versions sont gardées, les doublons de cette branche retirés).

**Sources d'Attack/Defense (pages Attack, Defense, NUMBER, Basic Training…) et état dans le code.** Toutes se multiplient entre elles ; à l'intérieur d'une catégorie, les paliers de perks / quirks / souhaits s'additionnent (`1 + somme`). (1) Entraînement : 100 naturels + Σ Level^1,3 x valeur de base — conforme. (2) NUMBER : facteur unique du run courant, composé des facteurs de la page ; double comptage Beard / NGU Number et Fruit of Numbers / Number Hack mal placés corrigés au commit 7604cb7. (3) Perks (Newbie Stat 100 %, Rich Perks I 10 % / II-VI 1 % par niveau, Fibonacci 377 %, Welcome to Evil / Sadistic), quirks (Rich Quirks), souhaits (« beat up more bosses » I-VIII, souhait 0) — présents. (4) Rich Jerks (30 EXP = +10 %), équipement (+1 % par point de Power / Toughness) — conformes. (5) NGU Power α / β (+5 % / +1 % par niveau, paliers Evil / Sadistic multiplicatifs) — conforme. (6) Augments : additifs entre eux, multiplicatifs avec NGU Augments ; le TEMPS de niveau ne croissait pas avec le niveau (corrigé, a9014de). (7) Wandoos (formule par OS) — conforme. (8) Yggdrasil Power α (valeur^1,5) / β (niveau², activé après 30 min avec les perks 16/17) / δ — conformes. (9) Beard Fu Manchu, Digger Stat, Hack Attack/Defense (Evil+), Cards, MacGuffin — présents. (10) Affichage : le client recalculait Attack/Defense avec des multiplicateurs codés à 1 (dadfb5a) — cause la plus probable de l'écart ~x1100 ; le serveur n'avait pas d'écart de composition mesurable en Normal. (11) Diviseur Evil / Sadistic de 1E30 : voir « non fait ».

**Corrigé (avec test, cloudflare/tests) :** Augments : temps de niveau x niveau visé (Augment et Upgrade) — `idle-augmentation-cost-scales-with-level`. Blood Magic : recharge de l'Iron Pill 11,5 h partout (23,5 h / 47,5 h de la page sont les recharges des sorts Blood MacGuffin α / β, l'ancien code les avait prises pour l'Iron Pill en Evil / Sadistic) — `idle-blood-magic-iron-pill-cooldown` ; 8e rituel débloqué à la 6e complétion du Troll Challenge (drapeau posé nulle part) — `idle-blood-ritual-8-troll-unlock`. Advanced Training : spécial d'équipement « Advanced Training » (vitesse, jamais lu), souhait 190 (toutes les capacités à 50 niveaux/s sans énergie), niveaux d'AT dans le budget de 100 niveaux du défi 100 Levels — `idle-advanced-training-composition`. Money Pit : souhait 4 = niveau Wandoos du Money Pit à 100 — `idle-wish4-wandoos-money-pit-level`. Yggdrasil : perks 16 / 17 (Power β / Numbers actifs seuls après 30 min, bonus vide jusqu'ici) — `idle-yggdrasil-quick-activation-perks`. EXP : le bonus d'EXP (« applied to all experience gain », page Yggdrasil) s'applique enfin à l'EXP de l'aventure (titans, boss de zone, bonus de complétion) et le perk « Bonus Titan EXP! » (3 x niveau premières morts de chaque titan par Rebirth, +50 %) est lu — `idle-experience-bonus-adventure`. Energy / Magic / Resource 3 : Power et Bars plafonnés à 1E18, Cap à 9E18 sur le TOTAL avant potions (4,84E18 = (2 x 1,1)² avec potions ; seuls les achats bruts l'étaient) — `idle-resource-stat-hard-caps` (lecture « total » : main la jugeait ambiguë, elle est cohérente avec « Capped at 1 Qi before potion effects »). Wandoos : le boot linéaire de 1 h est intégré sur la fenêtre simulée au lieu d'être lu en fin de fenêtre (retour hors ligne surévalué jusqu'à x2) — `idle-wandoos-boot-average`. Broken Time Machine : le plus gros drop d'Or du Rebirth alimente enfin la production (`context.bestGold` valait toujours 1 côté serveur, la machine ne produisait presque rien) — `idle-time-machine-best-gold-drop`. Rebirths : Time Machine (boss 30) et Blood Magic (boss 37) inactives tant que leur boss n'est pas revaincu — `idle-rebirth-relocks-time-machine-blood-magic`. Tests mis à jour avec commentaire daté : `idle-hearts-wandoos-flubber-sigil` (boot moyen).

**Non fait, et pourquoi :** (a) DIVISEUR EVIL / SADISTIC 1E30 : pages Evil / SADISTIC difficulty « Fight boss attack/defense is divided by 1e30 (this attack modifier…) ». Le code divise les stats des BOSS ; la page Yggdrasil appelle « Boss Fight's Attack and Defense » les stats du JOUEUR, l'introduction d'Evil dit « more difficult to climb bosses », les perks « Welcome to Evil » compensent : la lecture probable est que ce sont l'Attack / Defense du joueur qui sont divisées (effet inverse du code actuel, qui rend les boss Evil 1E30 fois plus faibles). Ambigu, donc non modifié ; à trancher (changement large : plancher `max(100, …)` des stats de combat, PV minimum 1000, boss non divisés). (b) NGU Number « also multiplied by the current rebirth time factor » : formule non publiée. (c) Rich Perks III / Welcome to Evil « evil difficulty only », IV / Welcome to Sadistic « SADISTIC only » : gating par difficulté non appliqué (portée exacte, V et VI non listés). (d) Iron Pill : perks « Also Sucks » et « Still Sucks » (26 x 4 multiplicatifs ou additifs ?). (e) Gold Multiplier de la Time Machine = 1 + niveau : supposition non publiée. (f) Money Pit : « Equip +1 LVL », « Daycare », tiers 12-16 (Iron Pill 1 h de sang, Pomegranate) ; +10 Power/Toughness du bonus 1E8 (main). (g) EXP de complétion des défis et secret des Rebirths rapides : pas de multiplicateur d'EXP (le wiki dit « 200 EXP » exact, portée de « all experience gain » incertaine). (h) Energy Speed : la page Energy annonce 10 EXP, la page Experience 2 pour 0,1 (20) ; le code suit la page Experience. (i) Boutons « Custom Input » (aucun effet publié). (j) Bonus de nuke (règle attaque ET défense) : non vérifiable sur le wiki. Aucun fichier client modifié, aucun `?v=` changé.

## 2026-09-24 — CI : contrôle des dépendances vocales réelles, avant le déploiement

**Constat** : l'étape « Verify local neural dependencies » de `.github/workflows/cloudflare-deploy.yml` vérifiait encore `piper-plus@0.7.0`, `@piper-plus/g2p`, le modèle multilingue, Siwis et Gilles (pipeline V1-V9 retiré le 2026-09-22), et tournait APRÈS `wrangler deploy`. Le frontend actuel charge `onnxruntime-web@1.30.0`, `@diffusionstudio/piper-wasm@1.0.0` (js avec SRI, wasm, data) et le modèle Tom (`fr_FR-tom-medium`, proxifié depuis Hugging Face par `idle-media-v1.js`). Conséquence : une dépendance réellement utilisée pouvait disparaître sans que la CI le voie avant la publication, et une dépendance inutile pouvait la faire échouer.

**Correction** : `cloudflare/tools/voice-runtime-dependencies.mjs` calcule la liste depuis les sources (importmap et scripts avec SRI de `index.html`, constantes du module `local-neural-piper-v1.js`, URL amont de `idle-media-v1.js`) ; `cloudflare/tools/verify-voice-runtime-dependencies.mjs` la contrôle : empreinte SRI réelle de `piper_phonemize.js`, modules et fichiers compagnons d'ONNX Runtime (`ort-wasm-simd-threaded.jsep.mjs` / `.wasm`, lus dans `ort.min.mjs`), wasm et data, modèle Tom, configuration (`espeak.voice=fr`, `phoneme_type=espeak`, `phoneme_id_map`), 3 essais par requête. L'étape s'exécute maintenant avant le déploiement ; le smoke Chromium réel reste après (synthèse et lecture audio).

**Test** : `cloudflare/tests/voice-runtime-dependencies.test.mjs` (hors ligne, déterministe) : extraction sur les vraies sources, aucun script externe sans SRI, toute URL du module vocal couverte, absence de l'ancien pipeline dans le workflow, contrôle avant `wrangler deploy` et smoke après. Rouge sur l'ancien workflow (« piper-plus »), vert sur le nouveau. Contrôle exécuté pour de vrai contre le réseau : toutes les dépendances OK.

**Décision non prise** : auto-héberger le modèle Tom (63,5 Mo) sur R2 plutôt que dépendre de Hugging Face au premier chargement d'un edge (cache 7 jours). Coût R2 négligeable, mais l'envoi sur R2 exige des identifiants Cloudflare : à décider avec Norman.

## 2026-09-24 — CI : Node épinglé, droits minimaux, plus d'annulation d'un run en cours

**Scénario analysé** : avec `concurrency.cancel-in-progress: true`, un push sur `main` pendant un run déjà passé par `wrangler deploy` mais pas encore par « Verify deployed Git SHA » ou le smoke Chromium annulait ce run. Le SHA déployé restait alors en production sans validation complète ; si le run suivant échouait aux tests (donc ne déployait jamais), ce SHA y restait durablement.

**Corrections (workflow `cloudflare-deploy.yml`)** :
- `cancel-in-progress: false` : le run en cours va toujours jusqu'au bout ; GitHub ne conserve qu'un run en attente, le plus récent (les intermédiaires sont abandonnés avant de commencer, donc pas de minutes gaspillées). Coût : quelques minutes d'attente lors de deux pushes rapprochés.
- `permissions: contents: read` (le job ne fait que `checkout` ; le déploiement utilise le secret `CLOUDFLARE_API_TOKEN`).
- `actions/setup-node@v4` avec Node 24 : les 288 fichiers de test sont validés sous Node 24, le runner ne dérive plus avec l'image `ubuntu-latest`. Wrangler reste épinglé à 4.127.1.

**Test** : `cloudflare/tests/deploy-workflow-hardening.test.mjs` (permissions, absence d'annulation hors commentaire, setup-node avant toute commande node/npx, ordre tests → build → dépendances vocales → déploiement → SHA vérifié → smoke réel). Rouge avant la correction, vert après. YAML validé avec js-yaml.

**Non modifié** : actions non épinglées par SHA (`actions/checkout@v4`, `actions/setup-node@v4`) : risque de chaîne d'approvisionnement réel mais faible sur des actions officielles GitHub ; à traiter avec les trois dépôts en même temps si Norman le souhaite.

## 2026-09-24 — Registre de couverture du wiki local (`docs/WIKI-COVERAGE.md`)

Demande de Norman : confirmer que 100 % des données du wiki local sont dans le jeu, pour ne travailler ensuite que sur les manques. Trois outils dans `design/` (hors CI, ils lisent le miroir) : `wiki-number-coverage.mjs` (présence des nombres distinctifs de chaque page dans le code), `wiki-number-context.mjs` (contexte des absents), `wiki-boss-table-check.mjs` (table Boss Fights contre le moteur).

**Résultat** : 79,5 % des nombres des pages de fonctionnalités, 95,9 % des ennemis, 89,9 % des zones existent comme littéraux dans le code ; la plupart des absents sont des valeurs calculées par des formules déjà implémentées (Advanced Training, facteur de temps de Rebirth, sorts Blood Magic, drop du Lonely Flubber vérifiés). **Ce n'est donc pas une preuve à 100 %**, seulement un détecteur de trous ; le registre distingue Calculé/Dérivé/Écart/À vérifier par page.

**Écarts trouvés** :
- **Boss Fights, boss 161 à 183** : le tableau du wiki est inférieur au moteur d'un facteur 100 puis 1 000, mais la fiche individuelle du boss 161 (`bf_power=1.984E+158`), celle du boss 181 (`1.984E+178`) et le HP Regen publié du boss 190 (3,052E+183) concordent avec le moteur : erreur du tableau, code inchangé. Boss 4 : valeur du vrai jeu conservée (déjà documenté).
- **ITOPOD** : le moteur utilise des valeurs moyennes (PV 600, défense 10, sans le facteur aléatoire 0,8-1,2 ni la plage de PV 588-612 décrits par la page) : simplification connue, à décider.

**Reste** : recalcul cellule par cellule des tables NGU, Cards, Boost, Augmentations, Hacks ; recontrôle du tableau des zones d'Adventure Mode ; décision ITOPOD. Voir la fin de `docs/WIKI-COVERAGE.md`.

## 2026-09-24 — Tables du wiki recalculées avec le moteur et verrouillées par des tests

Suite du registre `docs/WIKI-COVERAGE.md` : les tables dont les nombres « manquaient » dans le code sont recalculées cellule par cellule avec les fonctions du moteur. Neuf tests `idle-wiki-table-*` (valeurs du wiki en fixtures, générées par les scripts `design/wiki-*-table-check.mjs`) : **Boost** (13 valeurs, exactes), **Augmentations** (7 paires x 8 valeurs), **Blood Magic** (8 rituels, ratios, sorts MacGuffin), **NGU** (48 lignes), **Hacks** (15 hacks), **Cards** (14 types), **Gold Diggers** (12 diggers, bonus global 67,848 %), **Boss Fights** (157 boss du tableau) et **zones d'Adventure Mode** (32 zones). Résultat : le moteur reproduit toutes ces tables ; aucun écart de code trouvé.

**Coquilles du wiki** (consignées dans `NGU-Wiki/external/wiki-table-typos.json`, code inchangé) : Boss Fights boss 161 à 183 (tableau inférieur au moteur d'un facteur 100 puis 1 000, contredit par les fiches individuelles des boss et le HP Regen du boss 190), ratio « Gold Per Blood » du rituel 8 de Blood Magic (x10), Manual T des Halloweenies dans le tableau d'Adventure Mode (E31 au lieu de E29), texte « rareté 1,0 » de la page Cards (tableau calculé à 1,2 ou 1,14-1,17). `HACK_HARD_CAP_V1` est maintenant exportée pour être testée.

**Reste** : tables Wandoos, Time Machine, Resource 3 / Energy / Magic non recalculées ici ; décision ITOPOD (moyenne contre tirage aléatoire) ; les manques sans source (Money Pit 12-16, THE END, Tippi/Traitor, types de mobs, capacités des titans, Custom Input Buttons, fruits de Mayo, cartes Foil/End).

## 2026-09-24 — Tables Wandoos et Time Machine verrouillées ; Energy / Magic / Resource 3 rattachées aux catalogues

Deux tests de plus, `idle-wiki-table-wandoos` (seuils de speed-cap des 3 OS par difficulté, rapports annoncés, formules de bonus réévaluées de façon indépendante) et `idle-wiki-table-time-machine` (tableau « Machine Speed scaling » sur 13 niveaux, « Highest Boss - 27 » plafonné à 274). Aucun écart de code. L'effet exact d'un niveau de Gold Multiplier de la Time Machine n'est pas publié : volontairement non verrouillé. Les pages Energy, Magic et Resource 3 ne contiennent que des listes de perks / souhaits / objets Sellout : `design/compare-catalogs-to-wiki.mjs` relancé (perks, quirks, souhaits : seulement des libellés d'écart) ; le perk 56 « Macguffin Daycare! » (5 000 PP, 1 niveau, Evil) reste volontairement absent, son effet n'étant pas chiffré. Le registre `docs/WIKI-COVERAGE.md` est à jour.

## 2026-09-24 — Boosts spéciaux : seuls le Cube tuto / infini les reçoivent

Demande de Norman (comportement du vrai jeu) : les boosts spéciaux ne servent pas à remplir les statistiques spéciales des objets, sauf pour le Cube tuto / infini. Avant, une pièce de set à Specials, un accessoire ou une arme les acceptait (le garde-fou du 2026-09-16 n'excluait que les pièces sans Special). Maintenant `applyBoost` (moteur) ne les accepte que sur un objet `kind:"cube"` (Tutorial Cube ; le Cube infini les reçoit par l'action `cube`), sinon `BOOST_SPECIAL_CIBLE_INVALIDE` ; `idleAdventureBoostRoomV1(..., "special")` renvoie 0 pour tout autre objet, si bien que l'Auto Boost / A + clic ne leur en donne plus et versent les boosts spéciaux au cube dès que l'équipement est au maximum. Côté client (`soreal-idle-ui.js`) : le glisser-déposer d'un boost spécial sur un objet affiche un message sans consommer le boost, et n'est plus traité comme un « booster ». Tests mis à jour : `idle-adventure-set-item-specials`, `idle-adventure-special-boost-equipment-guard`, `idle-inventory-auto-core`.

## 2026-09-24 — Coffre avant les options d'inventaire ; Paramètres > Info repliable

Deux demandes de Norman sur l'UI. (1) Inventaire : le panneau « Automatisation de l'inventaire » (filtre de butin, Auto Merge, configurations d'équipement) s'insérait juste sous le sac, donc avant le Coffre ; `modules/inventory-auto-v1.js` (`?v=3`) le place maintenant juste après le Coffre (à défaut, sous le sac) et le déplace si l'ordre du DOM change. (2) Paramètres : « Info » devient un menu repliable comme le Coffre (titre cliquable, chevron ▼/▲, `aria-expanded`), **fermé par défaut** (état dans `localStorage` `soreal_idle_info_ouvert_v1`, fermé si rien n'est stocké ou si le stockage est inaccessible) ; la liste des infos et les pages Norman & Sébastien ne sont rendues que si le menu est ouvert. Tests : `idle-settings-info-collapsible-v1`, `idle-special-boost-client-guard-v1`, `idle-inventory-auto-client` (ordre et `?v=3`). `soreal-idle-ui.js` passe à `?v=237`.

## 2026-09-24 — Voix IA « 1060760 » : demi-caractère UTF-16 isolé dans le texte lu

Norman voyait « Voix IA · 1060760 » sur le bouton de lecture. Cause reproduite en direct sur la version déployée (navigateur intégré, phonémiseur espeak-ng chargé comme en production) : quand le texte contient un demi-caractère UTF-16 isolé (moitié d'emoji : `\ud83d` ou `\ude00` seul), le WASM lève une exception C++ que JavaScript ne reçoit que comme un **nombre** (pointeur mémoire), et `String(erreur)` l'affichait tel quel. Balayage de 871 caractères et séquences (ASCII, Latin-1, ponctuation, espaces insécables, monnaies, flèches, symboles, emojis entiers) : seuls les deux demi-caractères isolés échouent ; plusieurs synthèses simultanées, des textes de 600 / 1 200 / 2 000 caractères et les textes de tutoriel passent. Correctifs (`modules/local-neural-piper-v1.js`, `?v=7`) : `sanitizeText_` remplace tout demi-caractère isolé et tout caractère de contrôle par une espace avant phonémisation et synthèse ; `wasmError_` transforme un nombre lancé par le WASM (phonémiseur ou inférence ONNX) en erreur lisible `PIPER_LOCAL_PHONEMIZE_EXCEPTION_WASM_<n>` / `PIPER_LOCAL_INFERENCE_EXCEPTION_WASM_<n>`. Test : `idle-local-piper-neural` (nettoyage et conversion d'erreur). Non traité : un texte de 2 000 caractères met ~54 s à se synthétiser sur ce poste (thread principal), à optimiser à part si besoin ; l'origine exacte du demi-caractère dans le texte de Norman n'est pas identifiée (le nettoyage couvre toutes les sources).

## 2026-09-24 — Deux parties (A réelle / B de comparaison), uniquement pendant le développement

Demande de Norman : pouvoir basculer entre une partie jouée pour de vrai sans jamais reset et une partie réinitialisée régulièrement pour comparer à NGU IDLE, uniquement pendant la période de développement. Conception : la partie **B** est une seconde ligne JOUEURS retrouvée par une adresse alias (`technicien.soreal+partieb@gmail.com`, prénom « Norman (B) ») ; toute la progression vit dans la ligne du joueur, donc les deux parties sont indépendantes et « Réinitialiser » n'efface que la partie active. La partie **A** est la ligne historique (adresse réelle), jamais modifiée par ce mécanisme. Le choix est porté par la session (`idle_sessions.user_json.slot`), via deux opérations du coordinateur `obtenirPartieDevSorealIdle` / `definirPartieDevSorealIdle` ; la ligne est choisie dans `trouverLigneJoueurSorealIdle_`. Réservé au compte administrateur (`technicien.soreal@gmail.com`). Nouveau module `src/idle-dev-save-slots-v1.js` : **`enabled: true` → `false` au lancement public** désactive le sélecteur et ramène toutes les sessions sur la partie A côté serveur, sans rien d'autre à nettoyer. Client : section « 🛠️ Développement — Parties » en tête de Paramètres (invisible sans droit), le changement recharge la page. Tests : `idle-dev-save-slots` (bout en bout sur un vrai SQLite en mémoire : A puis B = deux lignes, A inchangée quand on joue en B, reset de B sans toucher A, retour en A, autre session du même compte repart en A, un autre joueur n'a ni sélecteur ni accès à B) et `idle-dev-save-slots-client`. `soreal-idle-ui.js` passe à `?v=238`. Limites : le chemin historique APP/TV (appel direct du Durable Object sans session) reste sur la partie A ; « Réinitialiser TOUS les joueurs » (admin) efface les deux parties.

## 2026-09-24 — Écran figé sur « Boss vaincu » : relance de la synchronisation jusqu'à confirmation

Norman : après un boss, l'écran reste bloqué sur « BOSS VAINCU » ; il faut changer de menu et revenir. Cause **lue dans le code, pas reproduite en direct** (le combat exige une vraie session de jeu) : le client prédit la victoire (`idleVictoireBossLocaleV49`), affiche l'overlay et lance UNE synchronisation forcée ; si le serveur (qui fait foi) n'a pas encore tué le boss, `appliquerSynchroCombatSansReflowIdleV116_` répond « garder l'état local » et rien ne relançait de synchronisation ; le changement de menu recharge tout, d'où le contournement. Correctif : `surveillerConfirmationVictoireBossIdleV1_` relance la synchronisation forcée toutes les 1,2 s tant que la victoire n'est pas confirmée (le rendu du nouveau boss remet le drapeau à zéro et arrête la boucle) ; après 15 s sans confirmation, la prédiction est abandonnée et l'état serveur est rechargé (`obtenirEtatSorealIdle`) puis rendu. Test : `idle-boss-victory-watchdog-v1` (source). `soreal-idle-ui.js` passe à `?v=239`. **À confirmer par Norman en jouant** ; si le blocage revient, mesurer la durée réelle entre la victoire locale et la confirmation serveur.

## 2026-09-24 — Narration : pauses de la chronique du boss, notes entre parenthèses, lecture en continu

Demande de Norman : lire « Chronique du boss (petit arrêt) Gorgonzola (arrêt plus long que le point) puis l'histoire », et mettre en page comme les autres notes tout paragraphe de début entre parenthèses (« (Une nouvelle Zone d'Aventure a été débloquée : Forêt !…) »). Cause : le texte lu était `textContent` du bloc, donc « Chronique du boss Gorgonzola ✦ ❦ ✦ … » sans ponctuation, en un seul bloc ; et seul le PREMIER paragraphe entre parenthèses recevait la mise en page « note » (24 récits sur 283 en ont, 7 en ont plusieurs). Correctifs : (1) `tutorial-tts-v202.js` (`?v=231`) — un élément `data-soreal-tts-pause="ms"` est suivi d'un silence de cette durée (marqueur invisible transformé en vrai silence entre deux synthèses, plafonné à 5 s) ; titre 450 ms, nom du boss 1 100 ms (plus long que la pause d'un point), chaque note 700 ms ; l'ornement ✦ ❦ ✦ n'est plus lu ; (2) blocs de lecture de 2 000 → 600 caractères et **préchargement** : le bloc suivant est synthétisé pendant la lecture du précédent (mesuré : 54 s d'attente avant le premier son pour 2 000 caractères), sans quoi les silences auraient été noyés dans le temps de génération ; (3) `soreal-idle-ui.js` (`?v=240`) : toutes les notes de tête (ligne entière entre parenthèses) prennent la mise en page « note », une parenthèse au milieu du récit reste dans le récit. Tests : `idle-narration-pauses-v1` (découpe, pauses, plafond, notes multiples) et trois tests existants alignés. Non vérifié à l'oreille : la durée exacte des silences est à juger par Norman (valeurs réglables dans le balisage).

## 2026-09-24 — Boosts spéciaux sur l'équipement : annulation de ma mauvaise lecture + vraie cause

Le matin, j'avais lu « Les boosts spéciaux ne peuvent pas être utilisés pour remplir les statistiques spéciales des objets, mis à part le cube tuto/infini » comme une règle du vrai jeu et j'avais **interdit** ces boosts sur tout objet autre que le cube (commit da9ddd1). C'était le contraire de ce que Norman voulait : il signalait un défaut (« Je ne peux toujours pas remplir les objets avec les boosts spéciaux », avec ses bottes équipées comme exemple). Annulé (moteur, tests et garde client de da9ddd1 restaurés). **Vraie cause** côté client : `decisionActionSlotAdventureIdleV138_` transformait tout dépôt d'un boost spécial sur une pièce d'équipement en « équiper » (échange de place), règle de la correction du 2026-09-16 écrite quand les pièces de set n'avaient aucun Special ; depuis l'audit du 2026-09-23 la plupart en ont un (`baseSpecial > 0`) et n'avaient donc aucun moyen de le recevoir par ce chemin. Correctif : le refus « équiper » ne vise plus que les pièces SANS Special. Test : `idle-special-boost-equipment-client-v1` (remplace `idle-special-boost-client-guard-v1`). `soreal-idle-ui.js` passe à `?v=241`. Leçon : quand une phrase peut se lire comme règle ou comme défaut, demander avant d'agir sur le moteur.

## 2026-09-24 — Augmentations : « + / − / Max » et Input comme Basic Training (fin des boutons 0/25/50/100 %)

Norman : « Augmentation ne fonctionne pas comme dans NGU IDLE. Il me semble qu'il y avait des + pour pouvoir y placer de l'énergie comme pour Basic training. Là, si je clique sur 50 %, ça me retire l'énergie de Basic training et ça génère la moitié de mes points comme si je venais de lancer une nouvelle partie. » Wiki (page Augmentations) : la vitesse de montée de niveau dépend de « the amount of allocated energy » de chaque augment ; le coût en or est par niveau. **Reproduit sur le vrai moteur** (base SQLite en mémoire, action réelle `agirProgressionSorealIdle`) : le serveur est cohérent (Basic Training garde ses 200 unités, l'Augment reçoit le reste libre) ; c'est le bouton qui était en cause : « 25 / 50 / 100 % » visaient un montant ABSOLU (fraction du Cap total) donc « 50 % » d'un Cap de 500 = 250 prenait d'un coup toute l'énergie libre (250 au départ d'une partie) et l'énergie Idle de Basic Training tombait à 0. Correctif (`modules/meta-progression-v130.js`, `?v=202609243`) : par piste (Augment et Upgrade), « − » et « + » retirent / placent la valeur du champ Input (125 par défaut, comme Basic Training ; le serveur borne à l'énergie libre), « Max » place toute l'énergie libre ; en tête de page : Input, « Énergie libre » et « Tout retirer » (nouvelle action moteur `clearAugmentAllocations`). Test `idle-augmentation-allocation-ui-v1` (moteur : +/−/Max/Tout retirer avec de l'énergie déjà prise par Basic Training ; client : rendu réel de la page et clics simulés). **Non traité, à décider** : les pages NGU, Time Machine, Blood Magic et Wishes utilisent encore les boutons 0/25/50/100 % (là, le pourcentage porte sur l'énergie disponible et non sur le Cap total) ; à aligner sur « + / − » si Norman le souhaite.

## 2026-09-24 — Money Pit : suppression de la page texte seul qui écrasait la page à image

Norman : deux Money Pit s'écrasent, celui à image est à garder, le texte seul à supprimer. Constaté dans le navigateur : la page à image (« Trou sans fond », boutons « Balance ton argent » et « Fais-moi tourner ») est bien celle affichée. Cause dans le code : `modules/ui.js` (V49, module « auxiliaire ») possédait sa propre page Money Pit + Daily Spin en texte seul (`rendreMoney_`), déclenchée par un `MutationObserver` à chaque changement du DOM quand le menu actif était `moneyPit` : elle réécrivait le contenu de la page produite par `pageMoneyPitDailySpinIdleV206_` (`modules/meta-progression-v130.js`, la seule page à garder). Supprimé de `ui.js` : `moneyEtat_`, `rendreMoney_`, le compte à rebours, `hookCollect_`, la branche `moneyPit` de `enhancer_`, le style `hero.money` (`?v=50`). Test `idle-money-pit-single-page-v1` : le module n'expose plus rien pour Money Pit, la page à image est conservée, et un `MutationObserver` déclenché sur la page Money Pit ne modifie plus son contenu ni ne relit l'état. **Même motif repéré, non traité** : la page Advanced Training a aussi une version dans `ui.js` (V49) en plus de la page générique du module méta (`pageSystemeMetaIdleV130_`). **CI** : l'étape « Verify deployed Piper narration in Chromium » échoue sur 91cfb3f et ecfc466 (25 à 33 s, échec rapide) alors que le déploiement et la vérification du SHA passent ; le même script joué en local contre le site en ligne réussit (Chromium local) ; journaux CI illisibles sans authentification, cause non déterminée.

## 2026-09-24 — Boutique EXP en onglets, achats de départ en premier, fond bleu de la bannière

Norman : la Boutique EXP a trop de catégories, on s'y perd ; des achats à faire très tôt (filtre de butin) étaient tout en bas ; le fond blanc des cartes lui déplaît, il veut le bleu de la bannière « Boutique EXP ». Avant : une seule page très longue (Énergie, Magie, Ressource 3 : 4 blocs chacun avec explication, lots, quantité personnalisée et offres débutant, puis « Aventure et divers » : ~20 achats, où se trouvait le filtre de butin, puis Yggdrasil). Maintenant (`pageSpendExpIdleV1_`, `modules/meta-progression-v130.js`, `?v=202609244`) : **six onglets, un seul affiché à la fois** — 🚀 **Débuts** (par défaut : espaces d'inventaire 2 EXP, filtre de butin 20, recyclage des boosts 100, Auto Merge 200, Item Daycare 250, avance automatique de Basic Training 300, du moins cher au plus cher, une ligne d'aide chacun, pastille jaune sur l'onglet = nombre d'achats abordables avec l'EXP actuelle), ⚡ Énergie, ✨ Magie, 🧪 Ressource 3 (message court si verrouillée), ⚔️ Aventure (puissance / robustesse / PV / régénération + Rich Jerks), 🎒 Slots & options (slots d'accessoire, Digger, Beard, garderie, configurations, automerge, MacGuffins, Auto-Activate d'Yggdrasil). Chaque achat n'apparaît que dans un seul onglet ; l'onglet choisi est mémorisé (`localStorage`). **Couleurs** : les cartes blanches deviennent le bleu de la bannière (`--nav-color`, #0891b2 pour ce menu, mêmes dégradés 60 % / 38 % que `page-head`), texte clair, or pour les offres débutant. Les lignes d'aide de l'onglet Débuts reprennent les effets déjà décrits dans le jeu (rien d'inventé) ; les textes des autres achats sont inchangés. Tests : `idle-exp-shop-tabs-v1` (chaque achat dans un seul onglet, ordre, pastille, navigation, absence de fond clair) et trois tests de rendu alignés. À valider visuellement par Norman (rendu vérifié par tests, pas encore à l'œil).

## 2026-09-24 — Énergie qui « regénère » 17-20 points en boucle après placement dans Augmentation ; Boutique EXP en boutique

**Énergie.** Norman : quand toute l'énergie est générée et qu'il en place dans Augmentation, le compteur continue de générer puis retombe à 0 vers 17-20, en boucle. Cause (lue dans le code et cohérente avec le moteur vérifié plus haut) : le serveur ne laisse à l'énergie libre que Cap − (Basic Training + tous les systèmes qui en retiennent : Augmentations, NGU, Time Machine, Wishes…) ; `mettreAJourJeuIdleLocalV7_` (`soreal-idle-ui.js`, `?v=242`) ne retirait du Cap que Basic Training, donc avec toute l'énergie placée dans Augmentation le client « générait » localement jusqu'à la synchronisation suivante, qui ramenait la valeur du serveur (0). Nouvelle `allocationMetaEnergieIdleV1_` (somme des `state.allocation.energy` de tous les systèmes du snapshot, comme `totalAllocated` du moteur), retirée du plafond local dans la génération, dans le placement d'énergie de Basic Training et dans « Tout retirer ». Test `idle-energy-local-cap-meta-allocations-v1`. Non reproduit en direct sur ton compte (j'aurais modifié ton énergie) ; à confirmer en jouant.

**Boutique EXP, décor de magasin** (`?v=202609245`). Deux nuances = les deux extrémités du dégradé de la bannière, en alternance d'une carte à l'autre ; auvent rayé à festons ; « caisse » (EXP disponible en afficheur vert sur fond sombre) avec enseigne « ● OUVERT » ; onglets = « Rayons » suspendus ; chaque achat est un produit posé sur une étagère (bandeau de nom, plinthe) ; boutons en étiquettes de prix (trou d'attache, contour en pointillés) ; « Maximum atteint » en tampon ; offres débutant en coupon pointillé doré. Aperçu vérifié dans un vrai navigateur avant publication (page reconstruite avec la même feuille de style), puis à revérifier sur le site.

## 2026-09-24 — RÈGLE DE PROJET : aucun spoil. Le joueur ne voit que ce qu'il a débloqué

Norman : « Fais attention à ne pas spoil. Magie, Ressource 3 : ils ne doivent pas savoir que ça existe, ils doivent être surpris quand ils les débloquent. Pense toujours comme ça dans le jeu. Ils ne doivent pas voir qu'il y a 301 boss. Dans Collection, il ne faut pas montrer toutes les cases disponibles ni le nombre d'items à placer. Garde vraiment cette façon de penser pour le projet. » **Règle** (mémoire projet + AGENTS.md à jour) : toute nouvelle interface se demande « ce texte, cette case, ce compteur révèle-t-il quelque chose de verrouillé ? » ; on n'affiche ni cadenas, ni prix, ni dénominateur, ni case « ??? » pour ce qui n'est pas découvert, et un test le vérifie. Appliqué maintenant : **Boutique EXP** (`?v=202609246`) — onglets Magie / Ressource 3 / Aventure / Slots & options absents tant que leur système n'est pas débloqué ; chaque achat lié à un système verrouillé (Digger, Beard, MacGuffin, garderie, Yggdrasil, tout ce qui touche à l'Aventure avant le boss 4) invisible ; achats de ressource verrouillés (Puissance / Plafond avant leur boss) non affichés au lieu d'un cadenas « Atteins le Boss N » ; **Collection** — le serveur n'envoie plus que les entrées de Bestiaire déjà découvertes (avant : une entrée « ??? » par boss et par créature, donc le nombre de boss se lisait dans la liste), onglets sans « n/??? », Équipement sans cases « ??? », Sets sans cases vides ni « x/6 » ; **Coffre** — le serveur n'envoie que les emplacements découverts, titre « Coffre (n) » au lieu de « (n / 284) ». Tests : `idle-anti-spoil-collection-v1` (vrai moteur : un joueur neuf reçoit 0 entrée et 0 emplacement), `idle-exp-shop-tabs-v1` (aux boss 0 et 4 : aucun mot d'un système verrouillé), `idle-adventure-boost-merge-coffre` mis à jour. **Reste à passer en revue** (non fait ici) : le catalogue complet des objets et des sets (`itemCatalog`, `setCatalog`) part encore dans le snapshot d'Aventure (visible seulement dans l'outil réseau du navigateur, pas dans l'interface) ; les textes d'aide des menus déjà débloqués qui citent des systèmes suivants.

## 2026-09-24 — Bas de Fight Boss : l'or affiché était un chiffre de l'ancienne version ; XP vérifiée sur le wiki

Norman a demandé de vérifier l'XP et l'or affichés en bas de Fight Boss. **XP** : comparée aux 160 premiers boss du tableau « Boss listing » (colonne « Exp Reward ») avec le moteur (`nguBossStatsV1`) : identique partout (0, 1, 2 … 14) ; l'affichage applique ensuite les multiplicateurs d'EXP du joueur. Seul écart signalé : le bonus « première fois » (FTBE) du boss 4 vaut 10 dans le moteur (fiche individuelle du boss, relevée par Norman) alors que le tableau récapitulatif du wiki dit 3 ; et les boss 21 à 23 ont « (3 at FTBE) » dans le tableau alors que le moteur n'a pas de bonus après le boss 20 (les fiches individuelles ne le publient pas) — **non modifié**, à trancher. **Or** : le wiki (page Boss Fights) ne donne AUCUN or pour un boss principal, seulement de l'EXP ; l'or du jeu vient de l'Aventure, du Money Pit et de la Time Machine. Le « +N 🪙 » du bas de Fight Boss était la colonne inventée « pieces » de la feuille IDLE_BOSS (ancienne version) ; en plus, chaque victoire créditait ces « pièces » (monnaie n'ayant plus aucune utilité : l'ancienne boutique est désactivée) **et tirait un objet au hasard** (colonne inventée `chanceLoot`, 45 % par défaut) alors que, d'après le wiki (page Inventory), l'équipement n'existe qu'en Aventure. Supprimés : l'affichage de l'or, le crédit de pièces et le tirage d'objet, en combat normal et en NUKE (`?v=243`). Test `idle-boss-reward-footer-v1` (EXP des paliers du wiki, absence d'or et d'objet). **Note** : les objets que des boss principaux ont déjà pu déposer dans des sacs restent dans les sacs.

## 2026-09-24 — Audit « code → wiki » des chiffres et comparaison du hors-ligne avec NGU

Deux rapports, sans changement de règles de jeu : `docs/AUDIT-CHIFFRES.md` (nouvel outil `design/code-number-audit.mjs` : 86 littéraux de `cloudflare/src` absents du wiki, dont 66 valeurs `p:`/`t:` de sets ; liste des constantes de `CONFIG_SOREAL_IDLE` encore lues sans source ; feuilles de catalogue à passer en revue) et `docs/HORS-LIGNE.md` (wiki vs SOREAL, tableau des écarts : Titans en Auto-Kill hors ligne absents, ITOPOD hors ligne exigeant d'être actif alors que NGU demande 650 de Power sans y être, plafond de 12 h de Basic Training inventé, Cube de l'infini hors ligne absent ; le butin de boss principal, qui existait hors ligne, a été supprimé plus haut). Retiré : 5 constantes de `CONFIG_SOREAL_IDLE` et le bloc `AVENTURE` (11 valeurs inventées de l'ancienne version) qu'aucun code ne lisait. Limite de la méthode rappelée dans le rapport : présent dans le wiki ≠ correct ; les vraies preuves restent les tests `idle-wiki-table-*`.

## 2026-09-24 — Boost sans statistique correspondante : refusé avant d'être consommé

Norman : son épée sans Toughness acceptait les boosts de Toughness, qui lui étaient ensuite rendus. Le serveur refusait déjà (`BOOST_STAT_DEJA_MAX`, plafond 0), mais la garde du client (`boosterObjetParIdAdventureIdleV47_`) ne refusait que « plafond > 0 et atteint » ; avec un plafond de 0 elle envoyait l'action, le boost disparaissait du sac par application optimiste, puis le serveur le rendait. Maintenant : plafond 0 = « cet objet n'a pas de statistique X » (message, rien envoyé, rien consommé), plafond atteint = « déjà au maximum », et l'application optimiste est refusée dans les deux cas (`?v=244`). Un boost n'est donc accepté que si la statistique existe et n'est pas pleine. Test `idle-boost-refused-without-stat-v1` (serveur : épée d'égouts Power 20 / Toughness 0 ; client : fonction exécutée avec des cibles simulées).

## 2026-09-24 — Compteur « Généré » au-dessus de la barre d'énergie

Demande de Norman : au-dessus de la barre d'énergie, un compteur au même format que la barre verte mais avec le total réellement généré (pas seulement l'énergie actuelle), pour savoir combien il reste à partager ; les deux informations ensemble. Barre verte = énergie **disponible** (inchangée) ; nouveau compteur « 🔋 Généré : X / Cap » = disponible + déjà placée (Basic Training + tous les autres systèmes : Augmentations, NGU, Time Machine, Wishes…, somme `allocationMetaEnergieIdleV1_` ajoutée plus haut). Mis à jour en même temps que la barre (tick local et rafraîchissement). `soreal-idle-ui.js` `?v=245`, style dans `soreal-idle-ui.css`. Test `idle-energy-generated-counter-v1`. À voir sur le rendu réel : emplacement et taille du texte.

## 2026-09-24 — Filtre de butin : réglages renvoyés jusqu'à enregistrement ; Achievements sans spoil

**Filtre de butin.** Norman : « Casque est toujours coché, je n'arrive pas à le décocher. » **Non reproduit** : dans son jeu (même compte, version déployée) décocher puis recocher Casque fonctionne, l'état survit à un rechargement. Cause la plus probable, lue dans le code : `actionMetaIdleV130_` **abandonne en silence** toute action envoyée pendant qu'une autre action méta est en cours ; la case décochée à l'écran repartait alors à sa valeur précédente au rendu suivant, sans que rien n'ait été enregistré (aucun message). Correctif dans `modules/inventory-auto-v1.js` (`?v=4`) : les réglages du panneau (types de filtre, filtre objet par objet, réglages Auto Merge / Auto Boost / recyclage) sont mémorisés puis **renvoyés** (au plus 8 envois, ~1,5 s d'écart) tant que l'état du serveur ne reflète pas la valeur voulue ; le panneau affiche la valeur voulue pendant l'attente. Test `idle-inventory-filter-reliable-v1` (serveur simulé qui abandonne les 2 premiers envois ; plafond de 8 envois). Si le problème persiste chez Norman malgré ce correctif, il faudra la trace réseau au moment du clic.

**Achievements (règle anti-spoil).** Repéré en vérifiant dans le jeu : la page listait les 153 succès (« Succès 5 / 153 »), leurs objectifs à venir, les succès secrets en « ??? », 50 portraits dont les verrouillés avec leur condition, et des totaux par groupe. Maintenant (`modules/profile-v1.js`, `?v=2`) : seuls les succès et portraits **déjà obtenus** sont montrés, sans dénominateur ; test `idle-profile-page` mis à jour. Le « Special Prize » reste affiché (condition d'obtention non documentée ici : à revoir).

## 2026-09-24 — « Généré » placé en haut à droite, à la place du doublon

Correction de ma première lecture : Norman voulait que « Généré » remplace le compteur du haut à droite (« (+1) 476 / 10946 ⚡ », doublon de la barre verte), pas une ligne de plus au-dessus de la barre. Maintenant : haut à droite = « 🔋 Généré : X / Cap » (disponible + déjà placé), la barre verte garde le disponible ; la ligne ajoutée et son style sont retirés ; le gain par tick reste visible dans « Tick : … · +N ⚡ » sous le titre. `soreal-idle-ui.js` `?v=246`. Test `idle-energy-generated-counter-v1` mis à jour.

## 2026-09-24 — Voix pré-générées (Tom) au lieu de Piper dans le navigateur

Demande de Norman : la voix IA générée à la volée ne lui plaît pas ; il veut « les générer 1 fois et les rendre jouables sur le site via un format pas lourd ». Choix : même voix Tom (Piper), générée ici, pour tout (chroniques de boss, tutoriels Norman & Sébastien, textes d'info).

- **Outil** `cloudflare/tools/voice-generate.mjs` : navigateur sans écran → vrai module de narration + vrai Piper → ffmpeg AAC mono 32 kbps → `cloudflare/public/voice/<empreinte>.m4a` + `manifest.json`. Reprenable (un bloc déjà présent n'est pas régénéré). Résultat : 884 blocs (≈ 228 000 caractères), 53,6 Mo, servis comme fichiers statiques (assets Cloudflare).
- **Client** `tutorial-tts-v202.js` (`?v=232`) : chaque bloc de texte a une empreinte (cyrb53 + « tom1 ») ; si `voice/manifest.json` la contient, le fichier est lu tel quel (aucun modèle de 60 Mo, aucun calcul), sinon repli sur Piper. Manifeste absent = repli, jamais d'erreur.
- **Mêmes blocs partout** : la chronique de boss, la fiche du boss, la Collection et « Lire toute l'histoire » passent par `composerChronique_` (titre, nom, notes de déblocage, récit, mêmes pauses). Les panneaux d'explication (tutoriels, popups de nouveauté, Info, Norman & Sébastien) portent `data-soreal-tts-say` construit depuis les données ; l'en-tête « SOREAL IDLE », les icônes et « Page n / N » ne sont plus lus. Les infos de systèmes dont la description vient des données du jeu restent en repli Piper.
- Test `idle-voice-pregenerated-v1` (empreinte, composition, couverture : chaque bloc de chaque chronique a son fichier).
- Pour changer de voix plus tard : changer `VOICE_TAG` et relancer l'outil (les anciens fichiers deviennent orphelins).

## 2026-09-24 — Augmentations : barre, temps par niveau, ordre des menus

Norman : « les barres se remplissent à fond mais ne repartent pas de 0 ; j'aimerais le temps indiqué pour qu'elle prenne un level ; Augmentations entre Fight Boss et Basic Training ; Boutique AP entre EXP Shop et Settings ».
- **Cause 1 (fidèle à NGU, mais muette)** : wiki « Each augment level costs gold » — sans l'Or du prochain niveau, `advanceAugmentationTrackV214_` garde la barre pleine. Rien ne le disait. Le snapshot expose maintenant `goldCost`, `upgradeGoldCost`, `waitingGold`, `upgradeWaitingGold` (mêmes fonctions que l'achat réel) ; la page affiche « ⏱ durée par niveau · 💰 coût en Or » et, barre pleine, « ⏳ il manque X Or pour le niveau suivant » ; la barre reste alors figée pleine au lieu de tourner à vide.
- **Cause 2 (client)** : l'animation en boucle remplissait la barre à 72 % du cycle puis la gardait pleine jusqu'à 98 % (paliers prévus pour des ticks de 66 ms, V220). Pour les cycles ≥ 2 s : remplissage linéaire 0 → 100 % puis retour à 0 ; paliers gardés pour les cycles très courts.
- **Temps** : « Niveau suivant dans 6 min 40 s », compte à rebours rafraîchi à chaque tick avec la barre.
- **Menus** : Basic Training, Augmentations, Fight Boss, … EXP Shop, Boutique AP, Settings (lecture littérale : Basic Training et Fight Boss étaient déjà voisins). `ui ?v=248`, `meta-progression ?v=202609247`. Test `idle-augmentation-eta-menu-order-v1`.

## 2026-09-24 — Tick de la barre d'énergie : rebond à vitesse constante

Norman : « je n'aime pas comment tique la barre d'énergie ; elle devait partir de l'endroit du remplissage ; la trajectoire 400→1000 dure autant que 0→1000 ou 999→1000 ; elle s'allonge mais ne se rétracte pas, la baisse est instantanée ; comme une balle qui rebondit ».
Cause : `valeur + (cap − valeur) × progression` — balayage vers le cap en une durée fixe (donc vitesse variable), puis retour instantané au remplissage ; de plus `transition: width .12s` sur la barre écrasait toute trajectoire courte. Maintenant (`largeurTickEnergieIdleV1_`) : chaque tick part du remplissage, monte jusqu'au cap PUIS redescend jusqu'au nouveau remplissage (valeur + gain), les deux à vitesse constante (celle qui fait tenir l'aller-retour depuis 0 dans un tick) ; plus la barre est pleine, plus le rebond est court, et il finit exactement là où le tick suivant commence (aucun saut). Transition CSS retirée sur cette barre. `ui ?v=249`. Test `idle-energy-tick-bounce-v1` (continuité, vitesse constante, durées décroissantes) ; `idle-energy-adventure-hp-v200` adapté.

## 2026-09-24 — Infinity Cube retiré, intro lisible + JOUER, « déjà vu » côté serveur, Boutique AP en mauve

- **Menu Infinity Cube supprimé** (écran générique sans équivalent NGU ; le vrai cube reste dans l'Inventaire, ses bonus et paliers inchangés). Le système reste dans le catalogue moteur (aucune donnée de sauvegarde touchée).
- **Premier récit** (« LE COMMENCEMENT ») : la carte des popups (`.soreal-idle-modal-card-v63`) est maintenant une colonne qui tient dans l'écran (`max-height: 100dvh − 36px`) ; seul le corps défile, l'en-tête et les boutons restent visibles ; le bouton est un gros bouton blanc « JOUER » (`bouton:'JOUER'` sur cette page seulement). Vérifié en rendu 360×640 et 412×915.
- **Popups, tutoriels et textes d'accueil : une seule fois** — l'état « déjà vu » n'était gardé que dans le stockage du navigateur. Il est maintenant aussi dans la sauvegarde du joueur (`stats.vus`, opération `marquerVusSorealIdle`, contrat de protocole +1) : la Renaissance, un autre appareil ou un stockage local vidé ne les rejouent plus ; ce que le navigateur savait déjà est envoyé au serveur une fois. Identifiants sans le joueur ni la date (« menu:… », « tuto:… », « bienvenue »). Une nouvelle partie / un reset complet repart de zéro (nouvelle ligne).
- **Boutique AP** : même style « magasin » que la Boutique EXP (auvent, caisse, rayons en onglets par catégorie, étagères, boutons-étiquettes), en mauve (`--nav-color` du menu ; la Boutique EXP reste cyan). CSS partagé (`idleBoutiqueCssIdleV1_`) entre les deux pages ; achat impossible grisé.
- `ui ?v=250`, `meta-progression ?v=202609248`. Tests : `idle-seen-popups-server-v1` (de bout en bout), `idle-menus-shops-intro-v1`.

## 2026-09-24 — Niveau sur l'image des objets + V vert « maximum »

Norman : le niveau des objets qui montent de niveau doit être inscrit sur leur image, bien visible, avec un contour, joli ; un V vert quand l'objet est au maximum — niveau 100 pour un objet sans statistiques (boost), niveau 100 ET tous les boosts accumulés pour les autres, « le même prérequis que pour placer un item dans le Coffre ».
`iconeObjetAdventureIdleV138_` ajoute maintenant (`badgesNiveauObjetIdleV1_`) le niveau (chiffre blanc à contour sombre épais et halo, doré au niveau 100) en bas à droite et un V vert rond à bord blanc en haut à gauche quand `item.fullyMaxed` — la valeur serveur calculée par `idleAdventureObjetPleinementMaxeV1`, la fonction du Coffre (un boost n'ayant pas de statistiques, il l'est dès le niveau 100). Vaut pour le sac, l'équipement, les accessoires, la corbeille, la Collection (niveau ; le ✔ de la carte existait déjà) et le Coffre. `ui ?v=251`. Test `idle-item-level-badge-v1`.

## 2026-09-24 — Inventory sous Adventure, options repliables, popup d'objet au survol (PC)

Norman : « trop de menus, surtout sur téléphone » ; « toute la partie d'Inventory sous tout ce qui est déjà en mode Adventure » ; « les options de l'inventaire, en bas, ouvrables/fermables comme le Coffre et Info » ; « sur PC, le popup d'un objet se refermait au relâchement du clic : qu'il apparaisse quand on passe la souris et disparaisse quand on sort du popup ».
- **Menu Inventory supprimé** ; `pageAventureIdleV28_` se termine maintenant par `pageInventaireIdleV28_(j)` (équipement, sac, corbeille, popup d'objet, Coffre, options, bonus d'équipement). Les mises à jour partielles de l'inventaire (`patchInventaireAdventureIdleV160_`) suivent la page Adventure ; un ancien menu « inventaire » mémorisé en session ouvre Adventure. Effet de bord voulu : l'aventure automatique n'est plus coupée quand on range son sac (elle s'arrêtait en quittant le menu).
- **Options de l'inventaire** (« Automatisation de l'inventaire », `inventory-auto-v1.js ?v=5`) : titre cliquable + chevron, même style que Coffre/Info, fermé par défaut, état gardé dans `soreal_idle_inv_auto_ouvert_v1`.
- **Survol (souris seulement, `(hover:hover) and (pointer:fine)`)** : passer sur un objet du sac/de l'équipement ouvre son popup à côté (à droite, sinon à gauche) ; il reste tant que la souris est sur l'objet ou dans le popup (boutons Verrouiller, Équiper… utilisables), et se ferme 200 ms après avoir quitté les deux, ou en quittant la fenêtre. Presser un objet (glisser-déposer) ferme le popup ; pas de popup pendant un glisser ni une comparaison. Le maintien du clic à la souris n'ouvre plus rien ; le tactile garde le maintien long. Vérifié dans un vrai navigateur (déplacements de souris réels) sur une maquette avec les vraies fonctions.
- `ui ?v=252`. Test `idle-inventory-in-adventure-hover-v1` ; tests d'options adaptés (panneau ouvert).

## 2026-09-24 — Inventory allégé, messages Aventure/Inventaire fusionnés, restes de l'ancien SOREAL corrigés

- **Inventory** : bandeau « Inventory / Glisse un objet… » et cadres Sac / Cube / Sets supprimés (place gagnée) ; le compteur du sac reste dans le titre « 🎒 Sac (n / cap) » (mis à jour aussi par les mises à jour partielles). Le tutoriel d'Aventure ne parle plus d'un « nouveau menu INVENTAIRE » : « … dans ton INVENTAIRE, juste en dessous dans cette même page Aventure ! ».
- **Basic Training : vrais noms (wiki « Basic Training »), en français** — Attaque passive (Idle Attack), Attaque régulière (Regular), Attaque puissante (Strong), **Parade** (ex « Contre-palette », Parry), **Attaque perçante** (ex « Percée de quai »), **Attaque ultime** (ex « Ultime SOREAL ») ; Blocage, **Bonus défensif** (ex « Défense renforcée »), **Soin** (ex « Récupération »), **Bonus offensif** (ex « Boost offensif »), **Charge** (ex « Charge logistique »), **Bonus ultime** (ex « Ultime logistique »). Les identifiants internes (sauvegardes) ne changent pas. Compétence d'Aventure « Ult. Buff » → « Bonus ultime ».
- **Autres restes de l'ancien SOREAL retirés/corrigés** : popup Renaissance (« l'Essence SOREAL » → le NOMBRE, vrai mécanisme ; liste « Conservé » sans boutique/Essence/Maîtrises/Procédures/artefacts), liste du reset total (sans Pièces, boutique, Forge, matériaux, Essence), en-têtes Perks (« Avantages permanents ») et Quirks (« Particularités permanentes »), définitions d'info jamais atteignables « Améliorations » (pièces) et « Mana & Magie » (Soin de fortune).
- **Voix** : `voice-generate.mjs --prune` (nouveau) supprime les fichiers devenus inutiles ; 2 blocs régénérés, 6 fichiers orphelins retirés (880 fichiers, 53,5 Mo).
- **Non modifié, à décider** : les créatures d'Aventure (`IDLE_ADVENTURE_MOB_CATALOG_V1`) sont des créations SOREAL originales sur le thème dépôt/entrepôt, avec leurs propres images ; leur donner les noms NGU reviendrait à changer aussi leur image. Pages mortes de l'ancien jeu (Magie, Améliorations permanentes, Personnage) : plus aucun menu n'y mène, gardées car des tests les référencent.
- `ui ?v=253`, `meta-progression ?v=202609249`. Test `idle-legacy-names-inventory-cleanup-v1`.

## 2026-09-24 — Créatures d'Aventure : image par NOM ; Cube : palier/images vérifiés ; Tippi

- **Créatures d'Aventure — correction de ma propre affirmation** : les créatures « pallet goblin / forklift… » n'existent plus à l'écran. Les noms affichés (combat, Collection) sont déjà les vrais noms NGU (`IDLE_ADVENTURE_MOB_BESTIARY_V1`) et les fichiers R2 portent déjà les vrais noms (`Adv_<id>_<nom>.png`) ; seul le catalogue de noms de fichiers du moteur était périmé. Défaut réel trouvé en interrogeant le worker en ligne (en-tête `x-soreal-idle-r2-key`, 130 créatures) : l'image était choisie par INDEX dans le dossier trié, et un boss « non maximal », un fichier absent ou en trop décalait le pool — « Fairy » affichait l'image de « Rat of Unusual Size », « Robot » celle de « Limburger Cheese », « The First Stop Sign » celle de « A Super Hexagon », etc. (Sewers, Forêt, Grotte, Ciel, HSB, 2D, Champ antique, Very Strange Place, Mega Lands, Beardverse…). Maintenant le jeu envoie le nom (`?name=`) et le worker choisit le fichier du même nom (casse/ponctuation/accents ignorés) ; repli par index sinon. Zones concernées : toutes, du Tutoriel à Chocolate World. Images réellement absentes du R2 (repli) : « Small Mouse » (Égouts), « Fairy » (Forêt), le boss « Rat of Unusual Size » (le fichier Adv_015 porte ce nom mais Forêt le classe en normal), etc. — à déposer sous `Adv_<id>_<nom exact>.png`.
- **Infinity Cube** : tableau des 11 paliers = wiki à l'identique (seuils, drop, or, vitesse hack/wish) ; le palier suit Power + Toughness aux seuils exacts (99→palier 0, 100→1…), est renvoyé à chaque réponse et l'emplacement est redessiné après un boost. Images R2 `Item_0100_THE_CUBE_Tier<n>.png` présentes pour 0-3 et 5-7 ; **absentes pour 4, 8, 9, 10** (le cube y tombait sur l'emoji). Le worker sert maintenant l'image du palier disponible le plus proche en dessous (palier 4 → image du 3) ; dès qu'un fichier est déposé, il est servi tel quel. Test `idle-cube-tier-evolution-images-v1`.
- **Tippi (commentaires de la page wiki)** : enregistrés dans `NGU-Wiki/external/tippi-comments.json` (commentaires de joueurs, pas des données vérifiées) : Tippi ne donnerait pas d'EXP et ne servirait qu'à débloquer THE TRAITOR ; battu « facilement » avec 4,3E34 Power / 1,5E34 Toughness (= stats recommandées de la page) ; ajouté en v1.260. Respawn et butin restent introuvables → toujours non implémenté (aucune valeur inventée).

## 2026-09-25 — Special Prize (menu Info, deux choix)

- **Special Prize** : dans le jeu il vit dans « Info 'n Stuff » (Tips N' Tricks), pas dans Achievements. La carte quitte la page Achievements pour le menu **Info** (visible seulement quand Info est ouvert). Deux choix, une seule fois, hors bonus d'AP : 50 000 AP, ou un JOLI CHATON (qui donne aussi les AP). Le second clic répond « Bien essayé, gourmand ! » (`PRIX_SPECIAL_DEJA_RECLAME` côté serveur, même sur l'autre option).
- Le choix est mémorisé dans `records.specialPrizeChoice` (0 aucun, 1 AP, 2 chaton ; nombre car les `records` sont coercés en compteurs par `normalizeIdleNguState`) et renvoyé en `portraits.specialPrize.choice`. Le portrait chaton (cosmétique de la garderie) n'est pas encore dessiné : seul le choix est retenu.
- `ui ?v=255`. Test `idle-special-prize-choice-v1` ; `idle-profile-page` et `idle-settings-info-collapsible-v1` adaptés.
- **Écarts NGU restants (analyse, non modifiés)** : bonus EXP de premier kill des boss (FTBE : table moteur [2,3,4,10,3×16] conservée, à vérifier en jeu sur boss 4 et 21–23) ; sens du diviseur Evil/Sadistic (appliqué aux stats du boss ; à inverser côté joueur seulement sur accord) ; formule d'EXP du Cooking (ambiguë).

## 2026-09-25 — Barre d'énergie : plus de descente animée

- Norman : le « rebond » (montée puis descente animée) n'est pas ce qu'il voulait. Voulu : la barre démarre de 0 et va taper le cap (500) ; elle repart INSTANTANÉMENT de 1 et retape 500 ; puis de 2, de 3… sans aucune animation de 500 vers 1/2/3.
- `largeurTickEnergieIdleV1_` : `min(cap, valeur + cap × progression)` — montée seule, à vitesse constante depuis le remplissage actuel (le cap est touché à (cap − valeur)/cap du tick puis la barre y reste) ; au tick suivant elle repart d'un coup du nouveau remplissage. Transition CSS toujours retirée. `ui ?v=256`. Test `idle-energy-tick-bounce-v1` réécrit.

## 2026-09-25 — Special Prize : le choix « chaton » débloque le portrait « Joli chaton »

- Norman : « utilise le choix aussi pour le chat ; l'image du Kitty qu'on débloque est idle/Kitty/BadKittyDaycareBow.webp ». Nouveau portrait `kitty` (« Joli chaton ») dans `idle-portraits-v1.js`, débloqué uniquement si `records.specialPrizeChoice === 2` (choix chaton ; le choix AP ne le donne pas) ; sélectionnable comme les autres portraits (Achievements).
- Média : `/api/idle/media/player?portrait=BadKittyDaycareBow` sert le fichier R2 désigné `idle/Kitty/BadKittyDaycareBow.webp` (hors dossier `idle/player/`). Si le fichier est absent de R2 : 404 (le client retombe alors sur son comportement habituel).
- Carte Special Prize (Info) : mention du chaton dans les Player Portraits après le choix. `ui ?v=257`. Test `idle-special-prize-choice-v1` étendu.
- **Compte de Norman** : le Special Prize réclamé avant l'existence du choix (`specialPrizeClaimed > 0`, aucun choix enregistré) débloque le portrait « Joli chaton » (règle générale côté serveur, sans écriture directe dans l'état du joueur). Un compte qui n'a pas encore réclamé le Special Prize choisit simplement « chaton » dans Info.

## 2026-09-25 — Inventaire : la page ne saute plus sous le sac après A / D / Q / W / E

- Norman (PC) : « quand je maintiens A pour absorber les boosts, la page me replace toujours plus bas que l'inventaire une fois l'action réalisée ». L'action `inventoryAuto` déclenche un rendu complet ; celui-ci rétablissait un `scrollY` ABSOLU, or l'inventaire est maintenant au bas de la page Aventure (longue, images et journal qui changent de hauteur après le rendu).
- `ancreSacIdleV1_` / `restaurerAncreSacIdleV1_` : si le sac est à l'écran avant le rendu, on mémorise sa distance au haut de la fenêtre et on la rétablit après le rendu, puis à +120 ms et +450 ms (mise en page qui bouge) ; un défilement fait par le joueur entre-temps n'est plus contrarié. Sac hors écran : comportement habituel. `ui ?v=258`. Test `idle-inventory-scroll-anchor-v1`. Cause non reproduite en navigateur réel (session requise) : correction par ancrage, à confirmer.

## 2026-09-25 — Collection : plus d'onglet Aventure, cartes de boss épurées et cliquables

- Norman : « dans Collection, enlève les mobs Aventure (ce sont les mêmes que les Boss) ; les boss n'affichent pas le texte en dessous : juste leur nom, centré, sans bords noirs sur les côtés de l'image ; cartes cliquables pour afficher statistiques et chroniques ».
- Onglet « Aventure » retiré de Collection (Boss · Équipement · Sets). Un ancien onglet mémorisé « aventure » retombe sur Boss. Les données d'Aventure du serveur ne sont pas modifiées.
- Carte de boss : image plein cadre (`object-fit:cover`, carré, sans marge ni bande) et nom centré, plus de type / statistiques / chronique / bouton de lecture sur la carte.
- Clic (ou Entrée/Espace) : fiche `sorealIdleBossCollectionModalV1` — image, statistiques (PV, Attaque, Défense, Régénération si présente, EXP, Rencontres) et chronique avec le bouton « 🔊 Lire cette chronique » (mêmes attributs `data-soreal-tts-*` : les voix pré-générées s'appliquent). Le serveur n'envoie que les boss découverts : rien à deviner (anti-spoil), un boss non découvert n'ouvre rien.
- `ui ?v=259`. Test `idle-collection-boss-cards-v1`.

## 2026-09-25 — Broken Time Machine : écran fidèle au jeu (+ / −, Target, facteurs du GPS, couleurs)

- Norman a fourni la capture du jeu (« BROKEN TIME MACHINE » ; deux pistes, Machine Speed en vert = Energy, Gold Multiplier en jaune = Magic ; barre de progression, boutons + et −, champ « Target », ressource allouée, niveau ; panneau gris des facteurs du GPS) et demandé de reprendre les couleurs. Réponse de Norman : « Target » = **niveau cible** (l'allocation est retirée automatiquement une fois atteint ; 0 = aucun).
- **Écran** (`pageTimeMachineIdleV48_`, `meta-progression-v130.js ?v=202609250`, CSS `.soreal-idle-tm-*`) : bandeau bleu acier, piste verte / jaune à fond blanc, boutons blancs cerclés, panneau gris. + / − placent ou retirent la valeur du champ **Input** (même mécanique que Basic Training et les Augmentations), « Max » place toute la ressource libre ; les anciens presets 0/25/50/100 % disparaissent de cette page. Libellés en français.
- **Facteurs affichés** (`timeMachineView` dans le snapshot) : Or par remplissage de barre, remplissages/s, Bonus GPS Blood Magic, Multiplicateur GPS NGU, Multiplicateur des défis, Multiplicateur du meilleur boss (boss − 27, max 274), Multiplicateur d'or (1 + niveau), Multiplicateur GPS de la vitesse (niveau − 48 dès le niveau 50), Multiplicateur GPS de la Barbe, GPS brut et net : ce sont exactement les facteurs de `idleNguTimeMachineGrossGoldPerSecond` (test : produit des facteurs = GPS brut). Cohérent avec la capture (niveau 97 → x49, niveau 81 → x82, % = multiplicateur × 100). Barres = progression vers le niveau suivant.
- **Target** : `data.speedTarget` / `data.goldTarget`, action `setTimeMachineTarget` ; la montée de niveaux s'arrête au niveau cible et l'énergie (vitesse) ou la magie (Gold) allouée est rendue (`tmApplyTargets`, aussi au réglage si déjà atteint). Commentaires du wiki (non vérifiés) : une fois la barre pleine toute allocation en plus est perdue ; pas de bouton Cap propre à la piste.
- Test `idle-time-machine-screen-target-v1`.

## 2026-09-25 — Barre d'énergie : compteur « Pleine dans … »

- Norman : « à côté de "Généré : 250/500", un compteur qui indique dans combien de temps toute l'énergie sera générée (ex. 15 minutes 22 secondes) ». `texteTempsEnergiePleineIdleV1_` : (cap − déjà généré) / `productionSeconde`, l'énergie déjà placée comptant comme générée ; format « 15 min 22 s » (« 1 h 23 min 20 s », « 2 j 7 h 33 min »), « ✅ Énergie pleine » au cap, rien si la production est nulle. Rafraîchi avec le compteur « Généré » (tick et actions). `ui ?v=260`. Test `idle-energy-generated-counter-v1` étendu.

## 2026-09-25 — Cap d'énergie au Rebirth : toute l'énergie obtenue compte (916 comme NGU)

- Norman, en jouant exactement la même chose dans les deux jeux : NGU donne un cap de **916** au Rebirth, SOREAL **512**. Wiki (page Energy) : le cap gagne 1 « every 20 Energy you get ». 512 = 500 + ⌊250/20⌋ : SOREAL ne comptait (`generatedThisRun`) que les 250 points qui remplissaient la réserve jusqu'au cap, puis plus rien. Dans NGU la barre d'énergie continue de se remplir au cap et chaque remplissage compte : 916 = 500 + ⌊8 330/20⌋ (≈ 2 h 19 min à 1 énergie/s). **Hypothèse déduite des deux chiffres** (cohérente avec la partie neuve : cap 500, réserve 250, 1/s).
- `advanceGeneratedResources` : `generatedThisRun += bars × remplissages` MÊME quand la réserve est pleine ; la réserve reste plafonnée au cap (rien ne change pour le compteur « Généré » ni pour l'énergie disponible/placée). Test `idle-energy-cap-growth-counts-overflow-v1` : 250 s → 512 ; 8 330 s → 916 ; plafond mou 100 000 inchangé.
- **Barres CAP** (Norman : « dans NGU, quand une barre est CAP elle ne clignote plus, elle reste complètement remplie de sa couleur ») : Basic Training (énergie allouée ≥ cap → barre pleine, plus d'animation en dents de scie, rendu initial plein) et Augmentations (1 niveau/tick = 0,02 s → barre pleine). `ui ?v=261`. Test `idle-basic-training-capped-bar-solid-v1`.

## 2026-09-25 — Outil : serveur local de développement

- `cloudflare/tools/local-dev-server.mjs` : sert `cloudflare/public` et branche `/api/v1/call` sur le vrai moteur (`runSorealIdleOperation`, SQLite en mémoire) ; l'interface complète tourne en local, sans session ni déploiement, pour reproduire un bug ou vérifier un écran (`node cloudflare/tools/local-dev-server.mjs`, puis `sessionStorage.setItem('soreal_idle_session_v1','local')` et recharger). `POST /debug/js` (local uniquement) prépare un état. Vérifié : régénération des PV hors de l'onglet Fight Boss (+5/s à Defense 100), combat contre « Un Petit Bout de Peluche » à Nombre 1 (Attaque 50 000 contre 1 000 PV : mort immédiate, comme dans NGU).

## 2026-09-25 — Attack/Defense après Rebirth = 100/100 ; popups revus après un reset ; cap d'énergie confirmé par l'infobulle NGU

- **Attack / Defense** (Norman, jeux côte à côte : 209 K PV dans SOREAL contre 1 010 dans NGU après un Rebirth ; « NGU fait retomber le joueur à 100 Attack / 100 Defense ; les bonus accumulés ne se déverrouillent qu'en avançant dans les boss »). Wiki NUMBER : « multiplies your Attack and Defense **from Basic Training** » ; Basic Training : « natural attack and defense of 100, with trainings giving a bonus of Level^1.3 × BaseValue ». `statsCombatPrincipalSorealIdleV413_` calculait `(100 + entraînement) × tous les multiplicateurs` ; c'est maintenant `100 + entraînement × multiplicateurs` (serveur ET recalcul local du client) : sans point d'entraînement, 100 / 100 / 1 000 PV quel que soit le NUMBER.
- **Équipement d'Aventure** (« +1 % Attack/Defense par point de Power/Toughness ») : son facteur est retiré du produit tant que le run n'a pas atteint le boss 4 (`REBIRTH_UNLOCK_BOSS_V1`, Adventure relockée à chaque Rebirth, wiki Rebirths). `idleNguBonuses` expose `equipmentAttackMultiplier` / `equipmentDefenseMultiplier` ; le serveur reçoit le nombre de boss du run. Non fait (à confirmer par Norman en avançant dans les boss) : verrouiller de la même façon d'autres sources (Augmentations, Blood Magic…) — les niveaux d'Augmentation repartent déjà à zéro au Rebirth.
- **Popups après un reset total** : le serveur efface déjà la ligne du joueur (donc `profil.stats.vus`), mais la page gardait en mémoire « bienvenue », tutoriels et popups de menus jusqu'au rechargement. `idleVusOublierV1_` vide cette mémoire, la file d'envoi et les caches locaux (`soreal_idle_menus_ack_v1_*`, `soreal_idle_bienvenue_v75_*`, `soreal_idle_tutoriel_*`) au succès du reset ; le nouveau personnage revoit chaque popup une fois. Vérifié dans l'interface locale : après « Tout effacer », le texte d'accueil et le bouton JOUER réapparaissent.
- **Cap d'énergie** : l'infobulle d'énergie de NGU (capture de Norman : « capped at 916. On rebirth, you will have 1114 Energy… You currently make 2 Energy per second », run de 33:07) confirme la correction précédente : 1 987 s × 2/s = 3 974 énergies → +198 → 916 + 198 = 1 114. Cas ajouté au test `idle-energy-cap-growth-counts-overflow-v1`. `ui ?v=262`. Tests `idle-attack-defense-natural-100-after-rebirth-v1`, `idle-reset-forgets-seen-popups-v1` ; `idle-client-attack-multipliers` adapté.

## 2026-09-25 — Infobulle d'énergie de NGU et raccourcis R / T

- Norman : « je veux exactement le même comportement que dans NGU » (capture de l'infobulle d'énergie). Survol du panneau d'énergie (PC) ou appui (téléphone) : plafond du run, énergie au prochain Rebirth, règle « 1 énergie tous les 20 obtenues, jusqu'à 100 000 », production par seconde, vitesse et ticks par remplissage, prochain palier de vitesse (ou « vitesse maximale »), raccourci R. Les chiffres viennent du serveur (`resourceInfo.energy` dans le snapshot ; mêmes formules que la génération et la croissance du cap) : 916 / 1 114 / 2 par seconde / 25 ticks / 2,1 comme sur la capture.
- **R** récupère l'énergie de toutes les fonctions sauf l'entraînement (action `reclaimResource`, déjà existante côté serveur) ; **T** la magie (une fois Blood Magic débloqué ; wiki Magic : « Pressing T will reclaim all allocated Magic from all features »). Ignorés dans un champ de saisie ou avec Ctrl/Alt.
- `ui ?v=263`. Test `idle-energy-tooltip-and-reclaim-keys-v1`.

## 2026-09-25 — Coffre : une case pour le Tutorial Cube maxxé

- Norman : « dans le coffre au trésor, il faut un emplacement pour le Tutorial Cube (quand il est maxxé) ». Wiki (Infinity Cube) : le Cube de l'infini se débloque en montant le Tutorial Cube au niveau 100 ; le moteur le transformait alors et le **retirait** du sac (rien n'était conservé). Le Coffre ne connaissait que les cases d'équipement.
- Nouvelle case « Tutorial Cube » — visible seulement une fois maxxé, jamais avant (anti-spoil) — (après les cases d’équipement, `idleAdventureCoffreSlotsV1`) : au niveau 100, le Tutorial Cube est **rangé dans sa case** en même temps que le Cube de l'infini se débloque. Les comptes ayant déjà transformé leur Tutorial Cube (`tutorialCubeMaxed`) reçoivent une fois le trophée au niveau maximum (Power/Toughness 14, effet 30 % : wiki) ; reprenable comme tout objet du Coffre, sans doublon recréé (`tutorialCubeCoffreV1`). Le dépôt manuel accepte aussi cet objet (mêmes règles : maxé, non équipé, case libre). Les autres objets spéciaux restent refusés.
- `ui ?v=264` (l'icône de la case passe l'identifiant wiki 77). Test `idle-coffre-tutorial-cube-v1`.

## 2026-09-25 — Menus : Shop, Classement des joueurs, Rangement des boutons

- **Shop** : EXP Shop et Boutique AP réunis dans un seul menu « Shop » (mêmes pages, même visuel), séparés par deux onglets (✨ EXP Shop par défaut, 🛍️ Boutique AP) ; un clic pour passer de l'un à l'autre. L'onglet Boutique AP n'existe qu'une fois cette boutique débloquée (un seul magasin disponible : pas d'onglets). Un ancien menu mémorisé « spendExp » / « sellout » ouvre Shop.
- **Classement** (📊, juste à gauche de Settings) : tous les comptes IDLE. Statistiques suivies par le moteur (`records`) : boss le plus élevé vaincu (`highestBoss`, numéro affiché : pas d'anti-spoil dans ce menu, demande de Norman), Rebirths, **meilleur NUMBER** (`bestNumber`, mis à jour au Rebirth), **EXP totale gagnée** (`totalExpEarned` : chaque hausse de l'EXP est un gain, un achat ne la diminue pas), **temps de jeu** (`playSeconds`, secondes simulées hors ligne comprises), nombre de succès. Opération `obtenirClassementSorealIdle` : le serveur calcule les rangs (égalités : même rang) et les points (rang r sur n joueurs → n − r + 1 points, global = somme). Onglets : Global (points) + une par statistique. Un joueur qui réinitialise sa partie **reste listé, à 0, en bas** : registre des participants dans la feuille `CLASSEMENT` (e-mail, nom, dernière vue) — sa ligne de jeu effacée, il reste dans le registre.
- **Bouton Classement caché aux autres** : verrou provisoire = administrateur seulement (`classementDebloqueSorealIdle_` côté serveur, `j.classement.debloque`). **À faire** : remplacer ce verrou par « trophée débloqué dans TV/APP » (Norman doit encore dire lequel).
- **Rangement des boutons** : maintien (600 ms, doigt ou souris) sur un bouton du menu → mode « Rangement des boutons » (bordure pointillée, boutons qui tremblent, menu sur plusieurs lignes) ; glisser un bouton pour l'intercaler entre deux autres ; le bouton « ✔ Valider » n'existe que dans ce mode ; un appui en mode rangement, ou juste après le maintien, ne change pas de page. Ordre enregistré côté serveur (`profil.stats.menuOrdre`, opération `definirOrdreMenusSorealIdle`) avec cache local ; un menu absent de l'ordre enregistré (débloqué plus tard) se place après son prédécesseur par défaut. Le reset total oublie l'ordre local. La navigation par balayage suit l'ordre choisi.
- `ui ?v=265`. Tests `idle-leaderboard-v1` (deux comptes, rangs, points, reset, ordre des menus), `idle-shop-classement-menu-order-v1` ; `idle-augmentation-eta-menu-order-v1`, `idle-inventory-in-adventure-hover-v1`, `idle-v210-ui-coherence` adaptés.

## 2026-09-25 — Classement filtré, interrupteur d'accès, voix des popups, couleurs du Shop AP

- **Classement** : ne comptent que les joueurs connectés à leur compte — la **partie B** de développement (adresse alias `nom+partieb@…`) et toute entrée sans vrai nom (« Joueur ») en sont exclues (aussi retirées du registre `CLASSEMENT` si elles y avaient déjà été inscrites).
- **Interrupteur d'accès** (Paramètres, administrateur seulement — bloc « 🔑 Accès à SOREAL IDLE ») : *activé* = toute personne connectée à son compte sur APP / TV a accès à SOREAL IDLE (sous sa propre adresse) ; *désactivé* (défaut) = caché à tout le monde sauf aux deux comptes de Norman. État stocké dans `idle_meta.acces_ouvert` (lu à chaque appel, effet immédiat sur les sessions en cours), opération `definirAccesOuvertSorealIdle` (administrateur), exposé à l'administrateur seul dans `reglages.accesOuvert`. **Sébastien n'a plus d'accès spécial** : retiré de `EMAILS_DEVELOPPEMENT`, de la liste locale du lanceur TV (`TV_67_JS_Idle_Launcher.html`) et de celle du build APP ; APP interroge désormais le serveur (`__SOREAL_IDLE_CALL_V1__('obtenirAccesSorealIdle')`) pour afficher le bouton aux comptes autorisés, TV le faisait déjà. Tant que l'interrupteur est fermé, Sébastien n'a donc plus accès.
- **Voix des popups** (`tutorial-tts-v202.js ?v=233`) : (1) l'ancien anti-rebond de `scan_` (« clearTimeout puis 70 ms ») ne s'exécutait jamais tant que le jeu modifiait la page toutes les <70 ms : la voix automatique d'un popup n'apparaissait qu'à la première pause de ces mises à jour, d'où l'attente après « Suivant » — remplacé par une limitation (une évaluation au plus 70 ms après la première mutation) ; (2) `narrate_` appelait `stop_()` qui effaçait l'empreinte du texte lu, si bien que la mutation suivante relançait la narration depuis le début (les mêmes phrases en boucle) — l'empreinte est conservée, et une erreur n'entraîne plus de relance en boucle (réessai au prochain geste) ; (3) les fichiers de voix de la page suivante (et de la suivante) sont préchargés pendant la lecture (`prechauffer`), cache mémoire par empreinte ; (4) un panneau pas encore visible (animation d'apparition) est réévalué sans attendre une mutation. Mesuré en local : 1 seul démarrage par page, premier son 35–75 ms après « Suivant ».
- **Shop** : la page AP garde ses couleurs mauves et son onglet aussi (chaque boutique repose sa propre `--nav-color`, onglets colorés ; le bouton « Shop » du menu prend la couleur de la boutique affichée).
- `ui ?v=266`. Tests `idle-leaderboard-v1` (accès, exclusions), `idle-shop-classement-menu-order-v1`, `idle-dev-save-slots`, `idle-runtime` adaptés.

## 2026-09-25 — Accès à SOREAL IDLE conditionné au trophée « Assiduité de bronze »

- Norman : « fais-le se débloquer quand on acquiert le trophée Assiduité de bronze… quand je switch le bouton sur activer, tous ceux qui ont déjà ce trophée, même ceux qui ne travaillent plus ici, aient le jeu ; je dois pouvoir le désactiver avec le bouton ».
- Règle (`verifierAccesSorealIdle_`) : comptes de Norman **toujours** ; les autres = interrupteur des Paramètres **activé ET** `user.idleTrophee === true`. Le drapeau est posé par le Worker TV (Durable Object : `trophy_unlocks` retrouvés par adresse/alias, ouvriers archivés inclus) sur l'identité déjà vérifiée, jamais lu depuis le navigateur ; `normalizeIdleLaunchUserV1` le conserve. Interrupteur désactivé → IDLE caché à tout le monde sauf Norman.
- Le popup de félicitations (⚡ + texte) est géré côté APP/TV (voir leurs WORKLOG). Textes des Paramètres reformulés. `ui ?v=267`. Tests `idle-dev-save-slots`, `idle-leaderboard-v1` adaptés.
- Le bouton Classement reste visible pour l'administrateur seul (choix du trophée de déblocage toujours en attente de Norman).

## 2026-09-25 — Cadres « offre » (pointillés dorés) pour tout ce que le jeu offre

- Norman : « j'aime bien les étiquettes des Offres débutant, avec les traits interrompus ; pareil pour tout ce que le jeu offre (Special Prize : 50 000 AP ou un joli chaton + 50 000 AP) ».
- Classe globale `.soreal-idle-offre-v1` (même rendu que `.soreal-idle-exp-newbie-v210` : fond doré, contour `2px dashed`, titre 🎁) + boutons `.soreal-idle-offre-bouton-v1` (« Offre unique » + contenu). Appliquée au **Special Prize** (Info) et au **prix du Daily Spin** (« TON PRIX », Money Pit). Les Offres débutant du EXP Shop sont inchangées. Le jeu n'a pas d'autre cadeau/offre : Speedrun bonus n'a pas d'écran.
- `ui ?v=268`, `meta-progression-v130.js ?v=202609251`. Test `idle-offer-frames-v1`.
- **Version affichée** (Paramètres) : « Build V212 » → « Build **Beta 1.0** » (demande de Norman : cette version est la Beta 1.0). Tests qui vérifiaient l'ancien libellé adaptés.

## 2026-09-25 — Beta 1.1 « Le Chat » : le chat de APP/TV dans le jeu, avec les personnes en ligne

- Norman : « le chat normal, celui dans lequel tout le monde parle, mais accessible dans SOREAL IDLE, avec le bouton de gens en ligne ». Même salon « général » que APP/TV : aucune donnée dupliquée.
- **Architecture** : IDLE ne reçoit jamais la session APP/TV (isolation voulue). Le jeu demande donc à la page parente, par `postMessage` (`{soreal:'idle-chat-v1', id, op}` ; ops `hello`, `list`, `send`, `presence`), de lire/envoyer avec SA session. Parents : `Soreal_App_html.html` (`/api/chat-complet`, `/api/chat-send`, `/api/presence`) et `TV_67_JS_Idle_Launcher.html` (`/api/tv/chat`, `/api/tv/chat-send`). Le parent ne répond qu'à son cadre IDLE (origine + fenêtre), uniquement pour `general` (jamais `responsables`), arguments bornés (280 caractères). Hors APP/TV (adresse directe du jeu) : pas de bouton.
- **Interface** (`modules/chat-v1.js`) : bouton « 💬 Chat » dans le menu (rangeable comme les autres, jamais atteint par le balayage) qui ouvre un panneau au-dessus du jeu (hors de `#app`, dont le rendu complet effacerait la saisie) ; badge rouge de non-lus ; bouton « 🟢 N en ligne » = liste en ligne / hors ligne avec ADMIN et « moi », comme APP/TV. Messages : texte ; photos, vocaux et pièces jointes remplacés par un texte neutre (à voir dans APP/TV). Sondage 3 s panneau ouvert, 15 s sinon. Les raccourcis du jeu (A, D, R, T…) sont coupés pendant la frappe.
- **Limite v1** : la lecture n'est pas synchronisée avec le point rouge de APP/TV (`chat-read` non appelé) ; pas de photos/audio/réactions/mentions.
- `ui ?v=270`, `chat-v1.js ?v=1`, `release-notes-v1.js ?v=2` (1.1 « Le Chat »). Tests `idle-chat-v1`, `idle-release-notes-v1` ; côté APP/TV `idle-chat-bridge`.

## 2026-09-25 — Beta 1.2 « Armures & Portraits » : portrait automatique du set équipé, emoji de repli des objets

- Norman : « relier les portraits du jeu avec les portraits du R2 ; dès qu'on a les 4 pièces d'un set équipées, peu importe le niveau, l'image du joueur devient celle avec l'armure du set (soreal/idle/player/) ; quand il manque une image d'objet, un emoji bien grand et centré ; s'ils sont plusieurs, au mieux pour qu'on les voie bien ».
- **Portrait automatique** : `equippedFullSetIdV1(adventure)` (idle-ngu-progression.js) = set dont tête, torse, jambes et bottes équipés sont du même set (BOTH Edgy Boots comptent pour Edgy), sans condition de niveau ni de complétion ; `portraits.auto` = `{id,file,name,set}` du portrait de ce set (mêmes identifiants que les sets d'Aventure : les 42 sets à portrait sont couverts). Le choix manuel est conservé et revient quand une pièce est retirée. Le média `/api/idle/media/player` accepte `&fallback=` : si l'image du set n'existe pas dans R2, repli sur le portrait choisi (puis le défaut) au lieu de tomber directement sur le défaut.
- **Sélecteur de portraits** (Achievements) : vignette R2 de chaque portrait débloqué (silhouette 🧑 grande et centrée si l'image manque) + note quand le portrait est automatique.
- **Emoji de repli** (`.idle-emoji-fallback-v1`) : 64×64 comme les images, centré, 46 px pour un symbole, 30 px pour deux, 26 px pour trois, 21 px pour quatre et plus (deux par ligne) ; symboles collés (espaces retirés). Appliqué à toutes les icônes d'objets (équipé, sac, coffre, collection, boosts, cube) et aux modules d'objets spéciaux.
- **Images R2 retrouvées** (sondage du média avec les noms du wiki, sans lister le dossier) : Forest (+2 bonus), Cave, GRB, Jake, Wanderer, S'rerednaW, Slimy, Greasy Nerd, Mobster, Fad, Exile, Halloweenie, souhaits (Weiner, Mayo, Sneak Preview), chaton. **Introuvables sous les noms du wiki** : Training, Sewers, HSB, Clock, 2D, Spoopy, Gaudy, Mega, Beardverse, Badly Drawn, Stealth, Choco, Edgy, Pretty Pink Princess, Meta, Party, Typo, JRPG, Rad, Back To School, Western, Space, Bread, Disco, Rock, Construction, Duck, Dutch, Amalgamate, Pirate, Sexy, Smart → en attente des noms de fichiers de Norman.
- `ui ?v=271`, `profile-v1.js ?v=3`, `release-notes-v1.js ?v=3`. Test `idle-set-portrait-auto-v1`.

## 2026-09-25 — Beta 1.3 « Fidèle au wiki »

- **Difficulté des Perks / Quirks / Wishes** (`src/idle-difficulty-gates-v1.js`) : tables id → Evil/Sadistic (Perk/Quirk Points « Evil only / Sadistic only » ; 111 lignes de souhaits avec colonne Difficulty recoupées avec la source tierce, 0 écart ; les 231 souhaits sont Evil 95 / Sadistic 136, aucun en Normal). Achat/affectation refusés (`DIFFICULTE_REQUISE`), niveaux déjà obtenus gardés mais inactifs, catalogues cachés sans spoil. ~25 tests adaptés (états `difficulty` explicite).
- **Valeurs corrigées** (vérifiées wiki + source tierce) : Wishes 88/89 = 10 niveaux, 189 = +100 %/niveau, 91 = 1e23 ; quadLaser `baseGold` 1,5625e23 (×1000) ; Back To School `oneHitP` 2,72433e28. Rapports de recoupement : `design/external-crosscheck/`.
- **Fruits de Mayo** (6) : activation 10 Qa (1e16) Energy (Angry/Moldy/Cinco) ou Magic (Sad/Ayyy/Pretty), 10 graines, T²×250 000 ; progression = T^1,1 × 0,025 × Poop × MayoSpeed (Infuser inclus) ; Auto-Activate 1e9 EXP (cap requis 1e17, seule valeur déduite) ; visibles uniquement avec Cards. Test `idle-yggdrasil-mayo-fruits`.
- Suite complète verte. `release-notes-v1.js ?v=4`, `meta-progression-v130.js ?v=202609252`.
- **Titans 13 et 14** (Sadistic) : TIPPI THE TUTORIAL MOUSE (boss 296 — la page du titan dit 296, le tableau de la page Titans dit 295 : on suit la page du titan ; seuils 4E+34 / 1,5E+34, aucune récompense publiée) et THE TRAITOR (boss 300 + Tippi tué une fois ; seuils 1,5E+35 / 4E+34, HP et Regen recommandés non testés comme pour tous les titans ; respawn : plancher wiki de 60 min, rien d'inventé). Cachés de l'API tant que non accessibles (`secret`). Vaincre le Traitor pose `unlockFlags.traitorDefeated` et fixe les Rebirths à 10 000 (jamais réduits). Le butin THE END (#495) viendra avec l'étape « THE END ». Test `idle-adventure-titans-tippi-traitor`.
- **Seconde arme (Dual Wielding)** : slot `weapon2`, ratio = 0,05 × (niveau souhait 28 + niveau souhait 45) plafonné à 1 (wiki Wishes ; source tierce player.ts identique), appliqué à Power / Toughness / HP / Regen / Special / Specials. Les souhaits 28 et 45 exigent Troll Challenge Evil 4 et 6 (page Wishes). Les 9 secondes armes des sets tardifs (type Weapon sur le wiki) ne vont plus en accessoire à 100 % : slot dédié, migration des sauvegardes. UI : slot dans le paperdoll, visible seulement une fois débloqué. Test `idle-dual-wield-second-weapon`.
- **Specials en points** : le wiki donne pour chaque Special « Base Points / Max Points » ; un Special Boost verse des points, dans l'ordre de la fiche (page Build Cooking : « 30 Special Boosts before you can start leveling the Energy Power boost »). `idle-adventure-special-points-v1.js` (généré par `design/build-special-points.mjs`, 374 objets recoupés valeur par valeur) : ratio points/valeur par Special ; `special` (1er) et `specialExtra` (suivants) ; migration unique des pièces de set (l'ancien modèle proportionnel est conservé, rien n'est perdu). Corrige aussi l'unité des boosts sur les objets tardifs (avant : 1 point = 1 %). Conflit wiki signalé : A Battle Corgi, NGU Speed (500 %/6 M points au niveau 0, 1 200 %/12 M au niveau 100 : incohérent, on retient 1e4). Test `idle-adventure-special-points-sequential`.
- **Golden MacGuffin** → Gold Drops (`adventureGoldMultiplier`) : source tierce unique (macguffins.ts, même stat que Golden Showers), le wiki est muet.
- `soreal-idle-ui.js ?v=272`.
- **THE END** (`src/idle-the-end-v1.js`, `public/modules/the-end-ui-v1.js`) : les 16 pièces #480 à #495 de la page THE END, chacune branchée sur sa source — 480 / 485 : Ascended x9 Pendant et GLITCHY LOOTY maxés puis transformés ; 481 : Move 69 x69 ; 482 / 486 / 490 : Perk 231, Quirk 176, Wish 203 ; 483 / 489 / 493 / 484 : AMALGAMATE (V1+ / V2+ / V3+ / V4) ; 487 : boss 300 en Sadistic (`difficultyPeaks.extreme`) ; 488 : dernier Hack (apparaît quand les 15 autres sont au plafond `HACK_HARD_CAP_V1`, 200 000 s, 1 s par seconde, sans Resource 3, hors ligne compris) ; 491 : ITOPOD étage 1450+, 0,005 % x (étage - 1449) par kill ; 492 : carte THE END (1 % à côté d'une carte, Sadistic, 99 de chaque mayo, une seule à la fois tant que la pièce manque) ; 494 : dernier sort de Blood Magic (5e22 de sang, consomme tout le sang comme les autres sorts) ; 495 : drop fixe du Traitor. Les 16 réunies : la pièce rouge (495) lance la fin (confirmation), les pièces restent, la fin est rejouable. **Choix documentés** : pièces rangées à part (`adventure.theEnd`, pas dans les cases du sac : ni jetables ni perdues) ; taux des pièces d'AMALGAMATE non publié → repris de l'objet signature du même palier (1,4e-8 / 1e-8 / 8e-9 / 6e-9, règle du cube root) ; le sort 494 consomme tout le sang (le wiki ne dit que « blood requirement 5e22 »). **Anti-spoil** : rien n'est visible avant la première pièce (panneau, ligne de Hack, sort, carte : tous conditionnels), jamais de compteur x/16 ; le texte de la fin n'existe que côté serveur, renvoyé dans la réponse de l'action `theEndPlay` et jamais stocké dans l'état. Le texte est une **rédaction originale SOREAL** (à relire / réécrire par Norman), pas celui de 4G. Tests `idle-the-end-v1` (chaque source, l'absence de spoil, la fin) ; interface vérifiée dans le navigateur (panneau, bouton rouge, ligne de Hack, fin plein écran).
- **Conflits wiki à trancher (signalés, non appliqués silencieusement)** : (1) TIPPI : la page du titan dit boss 296, le tableau de la page Titans et la page Adventure Zones disent 295 → on suit la page du titan (296) ; (2) THE TRAITOR : page du titan 150 Dc Power / 40 Dc Toughness, page Adventure Zones 128 Dc / 60 Dc / Regen 3 Dc → on suit la page du titan ; (3) A Battle Corgi, NGU Speed : 500 % / 6 M points au niveau 0 mais 1 200 % / 12 M au niveau 100 (voir « Specials en points »).
- `soreal-idle-ui.js ?v=273`, `meta-progression-v130.js ?v=202609253`, `the-end-ui-v1.js ?v=1`.

## 2026-09-26 — Beta 1.4 « Menus & Voix »

- **Ordre par défaut des menus** (Norman : « Classement, Collection, Chat tout à droite, juste à gauche de Settings ; ce ne sont pas des mécaniques qui apportent à la progression ») : `IDLE_MENUS_V1` finit par Shop, Classement, Collection, Chat, Settings. L'ordre déjà rangé par un joueur (`menuOrdre`) reste prioritaire.
- **Voix : plus de « astérisque »** : `*BLOUM*`, `*ZWOUP*`, `*burp*`… étaient épelés par Piper. `normalizeAsterisks_` (`local-neural-piper-v1.js`) lit un bruitage tout en majuscules comme un mot suivi d'une pause (« Bloum. »), une simple mise en valeur telle quelle, et supprime tout astérisque restant. Le hash des blocs (donc le mapping) est inchangé. `voice-generate.mjs` : `--asterisques` régénère les blocs concernés (80), `--only-first` seulement le son d'intro (`158d8dc7d2d596`) ; le module Piper local est maintenant servi au navigateur sans écran, comme la narration et l'UI.
- `release-notes-v1.js ?v=5`, `soreal-idle-ui.js ?v=274`, `local-neural-piper-v1.js ?v=8`.
- **Popups d'objet** : plus compacts (largeur 280, une stat par ligne fine, boutons réduits) ; **comparaison sur téléphone** : le premier popup s'efface pendant le choix du second (il cachait le sac), puis les deux s'empilent en pleine largeur (≤ 600 px). **PC** : le popup au survol s'ouvre après 1 s d'arrêt (`IDLE_SURVOL_DELAI_MS_V1`, chaque mouvement relance la seconde) ; passer à un autre objet ferme aussitôt le précédent.
- **Filtres de butin par zone** (`idle-inventory-auto-v1.js`) : `lootFilters` zone -> filtre ; `lootFilter` reste le défaut (anciennes sauvegardes, zones sans réglage). Régler une zone crée son filtre (copie du filtre en vigueur). Zone = zone choisie, sinon la dernière zone de combat en Safe Zone ; le snapshot expose `lootFilterZone` et le filtre de cette zone ; le panneau nomme la zone. Drops d'ITOPOD et de titans : filtre de la zone courante. Test `idle-loot-filter-per-zone-v1`.
- **Plus de saut au rendu** : la hauteur du document est retenue pendant `rendreIdleEtat_` (le remplacement du contenu la réduisait, le navigateur ramenait le défilement en haut avant le recalage). Non vérifié en session réelle (compte requis).
- `soreal-idle-ui.js ?v=275`, `inventory-auto-v1.js ?v=6`.

## 2026-09-26 — Beta 1.5 « L'équipe s'invite » (ITOPOD)

- **Ennemis = ouvriers** (Norman : « ils portent les prénoms des ouvriers, avec leur avatar ; la liste s'agrandira ; décors Level 1 à 6 ; ajoute Sébastien et moi ») : `src/idle-itopod-roster-v1.js` lit côté serveur la route PUBLIQUE de TV `/api/cosmetiques-equipe` (un profil par personne : prénom + avatar, sans e-mail renvoyé à IDLE), cache 10 min ; `GET /api/idle/media/roster` -> `{workers:[{nom,avatar}], decors:{1..6:[clés R2]}}` (décors listés dans R2 `shared/avatar-backgrounds/level-N/`), `GET /api/idle/media/shared?key=` sert les images des seuls dossiers `shared/avatars/` et `shared/avatar-backgrounds/` (même bucket `soreal` que TV). Le profil d'accueil « Bienvenue » est exclu ; Norman et Sébastien sont toujours présents (avec leur avatar si leur profil existe, sinon sans). Si TV est injoignable : liste réduite à ces deux noms, réessai après 30 s.
- **Scène** (`public/modules/itopod-scene-v1.js`, en tête de la page ITOPOD) : décor du Level = `floor((palier-1)*6/32)+1` (32 paliers de 50 étages sur 6 Levels), image du Level choisie par palier ; l'ennemi est choisi d'après le nombre total de kills avec un pas premier avec la taille de la liste (jamais le même nom deux fois de suite) ; repli sur le Dude d'origine sans liste. Purement visuel (le combat est calculé par lots côté serveur). Test `idle-itopod-roster-v1` ; rendu vérifié dans le navigateur avec les vraies données de TV.
- **À trancher** : la source ne distingue pas les ouvriers des responsables ni des anciens (Antonio, Dylan… ont encore un profil) : tous les profils nommés apparaissent, sauf « Bienvenue ». `IDLE_ITOPOD_EXCLUS_V1` (dans `idle-itopod-roster-v1.js`) liste les prénoms à écarter.
- **Risque à vérifier après déploiement** : Cloudflare peut refuser qu'un Worker en appelle un autre sur le même sous-domaine workers.dev (erreur 1042) ; dans ce cas la liste reste réduite à Norman et Sébastien et il faudra passer par le pont de la page parente (APP/TV), comme le chat.
- `release-notes-v1.js ?v=6`, `meta-progression-v130.js ?v=202609254`, `itopod-scene-v1.js ?v=1`.

## 2026-09-26 — Beta 1.6 « Sets & Annonces »

- **Récompenses de set** : vérifié par script sur les 46 sets à récompense (pièces ajoutées au niveau 100 -> `completedSets` posé et `setRewards` / `permanent` / `unlockFlags` modifiés) : aucun écart. Annonce en fondu non cliquable (`modules/fade-notice-v1.js`, `pointer-events:none`, file d'attente) : « 🧩 Set complété : X — Bonus obtenu : … » ; même annonce pour « 🧊 Infinity Cube débloqué ! » (explication). Détection par comparaison de l'état de l'Aventure chaque seconde (`surveillerEvenementsAventureIdleV1_`), le premier état observé sert de référence.
- **Collection > Sets** : bonus du set dans un cadre doré (« 🎁 Bonus du set », condition « quand les N pièces sont au niveau 100 »), vert « ✅ Bonus du set obtenu » une fois `completedSets[id]`.
- **Flèches de zone** : cause = le choix de zone était abandonné en silence quand une autre action méta était en cours (le combat en envoie en continu) ET la synchronisation client gardait le combat local actif malgré la réponse du serveur. `selectionnerZoneAdventureIdleV47_` (commune aux flèches et au menu) interrompt le combat local, mémorise le choix et le renvoie tant que le canal est occupé (`envoyerChoixZoneFiableIdleV1_`). Reproduit et vérifié avec le serveur local (`cloudflare/tools/local-dev-server.mjs`).
- **Comparer à la souris** : reproduit en local. Après le tap du 2e objet (pointerup -> comparaison ouverte), le `click` qui suit, hors des popups, refermait tout ; un clic qui suit de moins de 750 ms un geste sur un objet (`idleAdventureIgnorerClicJusquaV165`) n'est plus traité comme un clic extérieur. Un vrai clic extérieur ferme toujours.
- **ITOPOD : liste des ouvriers** : en production, la liste restait réduite à Norman et Sébastien : un Worker ne peut pas appeler un autre Worker par son adresse workers.dev (erreur 1042). Liaison de service `SOREAL_TV_API` -> `soreal-tv` ajoutée à `wrangler.jsonc` (comme APP) ; repli sur l'adresse publique pour les tests. À revérifier après déploiement : `/api/idle/media/roster` doit renvoyer les ouvriers.
- `soreal-idle-ui.js ?v=276`, `release-notes-v1.js ?v=7`, `fade-notice-v1.js ?v=1`. Test `idle-fade-notice-zone-compare-v1`.

## 2026-09-26 — Beta 1.7 « Boutons réactifs »

- **Boutons qui demandent deux clics** (achats, Money Pit, roue) : `actionMetaIdleV130_` ABANDONNAIT en silence toute action envoyée pendant qu'une autre était en cours (le jeu en envoie en arrière-plan). Elles sont maintenant mises en file (12 max, doublons de la file ignorés) et envoyées dès que le canal se libère (`viderFileActionsMetaV1_`) ; sont exclus de la file les actions de combat de zone (startZoneFight, resolveZoneFight, loseZoneFight, zoneKill : cadence gérée à part) et le doublon exact de l'action en cours dans les 700 ms (double clic = un seul achat). Vérifié avec le serveur local : 4 actions en rafale toutes appliquées, le double clic une seule fois.
- **Money Pit** : le bandeau « Progression permanente » est remplacé par « Bonus obtenus grâce au Money Pit » = totaux depuis le début (`data.rewardsTotal`, cumulés côté serveur : l'historique ne garde que 20 jets ; sauvegarde d'avant : départ depuis l'historique disponible ; bonus uniques 1E8/1E10/1E12 comptés). Test `idle-money-pit-totals-ui-texts-v1`.
- **Popups de nouveauté d'un menu** : « Continuer » seulement. **Textes** : phrase de la roue et paragraphe « Les niveaux gagnés préparent une baisse du Cap… » retirés ; « Appuie sur Fight. » ; Coffre sans « (au toucher…) » ; bloc « Equipment Bonuses » retiré de la page Adventure ; ligne « Cap : … · prochain : … » de Basic Training passée de 8 à 13 px.
- **Liste des ouvriers (ITOPOD)** : la liaison de service fonctionne en production (22 ouvriers) ; Mickaël manquait d'avatar (accent dans le chemin R2 : `é` refusé par la validation de clé) : corrigé (Unicode accepté).
- **Portraits de set** : 17 portraits sur 49 ont leur image dans R2 ; les autres sont bien liés dans le code (`idle-portraits-v1.js`) mais leurs fichiers sont introuvables sous les noms attendus (`Portrait_<fichier du wiki>.png`), donc l'image du héros ne change pas (Training, Sewers, HSB, Clock, 2D, Spoopy, Gaudy, Mega, Beardverse, Badly Drawn, Stealth, Choco, Edgy, Pretty Pink Princess, Meta, Party, Typo, JRPG, Rad, Back To School, Western, Space, Bread, Disco, Rock, Construction, Duck, Dutch, Amalgamate, Pirate, SEXY, SMART).
- `soreal-idle-ui.js ?v=277`, `meta-progression-v130.js ?v=202609255`, `release-notes-v1.js ?v=8`.

### 2026-09-26 — Beta 1.8 : « Signaler un bug » + boutons + / − / Cap visibles

- **Signaler un bug** (Settings) : fenêtre avec zone de texte, bouton Envoyer grisé tant que le message est vide (2000 caractères max, 5 par heure et par compte). Opérations moteur `signalerBugSorealIdle`, `marquerBugMailSorealIdle`, `lireBugsSorealIdle` (lecture réservée à l'administrateur) ; table `idle_bug_reports`.
- **Mail** : le Worker (`idleBugMailV1`) transmet le rapport à une passerelle Google Apps Script (`integrations/idle-bug-mail/`), destinataire `reeeedruuuum@gmail.com` et objet « Soreal IDLE Bug signalé » figés dans `Code.gs`. Secrets `SOREAL_IDLE_BUG_MAIL_URL` / `SOREAL_IDLE_BUG_MAIL_SECRET` à poser par Norman (`wrangler secret put`) ; sans eux, les signalements sont enregistrés et lisibles dans Settings > Signalements reçus. L'adresse e-mail du joueur n'est jamais renvoyée au navigateur.
- **Basic Training** : boutons + (vert), − (rouge), Cap (bleu) plus grands, avec relief.
- Test : `idle-bug-report-v1`. `soreal-idle-ui.js ?v=278`, `bug-report-v1.js ?v=1`, `release-notes-v1.js ?v=9`.

### 2026-09-26 — Signalements sans mail (retour de Norman)

- Plus de mail : passerelle Apps Script (`integrations/idle-bug-mail/`), `idleBugMailV1` du Worker et opération `marquerBugMailSorealIdle` supprimés. Le signalement est enregistré (`idle_bug_reports`) ; le joueur voit « Signalement envoyé. Merci ! ».
- Administrateur : Settings > « Signalements reçus » liste les 50 derniers, avec un bouton « Supprimer (réglé) » à double clic de confirmation ; nouvelle opération `supprimerBugSorealIdle` (admin seulement). Vérifié sur le serveur local avec le vrai moteur : message vide refusé, envoi, lecture, suppression.
- `bug-report-v1.js ?v=2`. Aucun secret Cloudflare à poser (les deux secrets `SOREAL_IDLE_BUG_MAIL_*` n'ont jamais été créés).

### 2026-09-26 — Portraits : nom de fichier simple par portrait

- Norman : « relie les portraits aux bons noms, donne-moi le nom de chaque fichier, ce seront des webp ». Convention `portrait-<id>.webp` dans `idle/player/` (`idlePortraitNomFichierV1`) ; `idlePortraitPickR2KeyV1` cherche d'abord ce nom (toute extension), puis l'ancien nom du wiki : les 18 images déjà présentes continuent de marcher, un nouveau fichier l'emporte sur l'ancien. Le média `/api/idle/media/player` et le client n'ont pas changé.
- Liste complète (32 à ajouter, 18 présents) : `docs/PORTRAITS-NOMS-FICHIERS.md`. Test : `idle-portraits-noms-fichiers-v1`.

### 2026-09-26 — Beta 1.9 : panneau « Détail : Attack / Defense »

- Norman (comparaison côte à côte avec le vrai NGU, mêmes actions dans les deux parties) : à niveaux identiques (11 289 / 11 284 à 40:32), l'Attack de NGU vaut la base wiki × 1,0894 et la Defense × 1,0694, constants à 34:52 et 40:32 ; SOREAL ≈ × 1,04 pour les deux. Écart Attack/Defense de NGU = +2 points, cohérent avec l'équipement (1 point de Power = +1 % d'Attack, 1 point de Toughness = +1 % de Defense). La seule différence de départ est l'équipement porté, donc aussi les **boosts appliqués** (wiki Boost : la stat de l'objet est sa valeur actuelle, jusqu'à son potentiel maximum). PV du joueur NGU = 10 × Attack, comme chez nous.
- **Panneau** : un clic sur la case Attack ou Defense du résumé ouvre le calcul, facteur par facteur (base Basic Training, puis chaque facteur actif avec × et %, « autres bonus » déduits, produit, total). Seuls les facteurs actifs sont nommés (rien de verrouillé n'est révélé), les neutres sont comptés. Mis à jour chaque seconde.
- Moteur : `idleNguBonuses(...).facteursStats` expose les variables réellement multipliées (aucun second calcul) + Power/Toughness portés (Infinity Cube compris) ; `combatPrincipal.detailStats` (serveur) : facteurs, `autres` = produit appliqué / produit listé (le produit affiché est donc toujours celui du serveur), équipement retiré tant que l'Aventure n'est pas débloquée (comme le calcul). Client : `modules/stats-detail-v1.js ?v=1`, accesseur `window.__SOREAL_IDLE_LIRE_ETAT_V1__`. Test `idle-stats-detail-v1`. `soreal-idle-ui.js ?v=279`, `release-notes-v1.js ?v=10`.

### 2026-09-26 — Rebirth : facteur de temps et NUMBER en direct (comparaison NGU)

- Capture côte à côte à ~45:22 de run : boss 2^6 = ×64 et training level factor ×2 identiques ; Rebirth Time Factor NGU 0,37810 (= minutes/120, wiki) contre 0,376 chez nous (le chrono du haut affichait pourtant 45:21) : le panneau Rebirth montrait le facteur calculé au dernier rafraîchissement serveur. `modules/rebirth-live-v1.js` (?v=1) recalcule le facteur chaque seconde depuis l'horloge du run (même formule que `idleNguRebirthTimeFactor`, test `idle-rebirth-live-v1`), et en déduit NUMBER au Rebirth et Variation ; le serveur calcule toujours le vrai NUMBER au Rebirth. Pas de note de version : le panneau Rebirth est verrouillé pour les nouveaux joueurs.
- **Écart à trancher** : NGU affiche « NUMBER on Rebirth 49 » pour un produit de 64 × 0,37810 × 2 = 48,40 ; SOREAL affiche l'arrondi (48). NGU arrondit-il vers le haut, ou un facteur caché manque-t-il (≥ ×1,002) ? Il faut d'autres captures Rebirth à des moments différents avant de toucher au code.
- Or : NGU +66,6 or/s constant (94 529 à 34:52, 117 185 à 40:32, 136 498 à 45:22) contre ≈ +53 or/s chez nous ; la farm d'Aventure dépend des dégâts (équipement) : à revoir avec le panneau Détail Attack/Defense.

### 2026-09-26 — Beta 2.0 : Money Pit (texte du prix, boutons, phrases en français, recharge)

- Norman : « dans Ton prix on ne voit pas bien l'écriture (case jaune, écriture jaune) ; le Money Pit me semble plus généreux que dans NGU ; les petites phrases humoristiques en français ; les boutons Balance ton argent et Daily Spin sous l'image, une moitié chacun ».
- **Texte du prix** : la règle `.soreal-idle-offre-v1 .soreal-idle-prize-v206{color:#e9d9a3}` repeignait en jaune pâle le texte prévu foncé (#19160b) sur le fond #f4c83b ; corrigée.
- **Boutons** : image seule, puis une ligne de deux blocs (`flex:1 1 0`), Puits à gauche et Daily Spin à droite, chacun sur la moitié de la largeur de l'image (plus de blocs posés sur l'image).
- **Phrases** (`phraseMoneyPitIdleV1_`, affichées dans « Ton prix » au-dessus du détail) : le wiki ne publie que 3 messages du Puits ; traduits fidèlement : le boost (« Le Puits rote et recrache un Boost Toughness 1 ! », donné par Norman), Wandoos déjà au maximum (« ça sent affreusement mauvais ») et la graine avant le déblocage de l'arbre (phrase du wiki sans le nommer). Les autres (Power/Toughness, PV max, régénération, EXP, objet brillant, Wandoos) sont écrites par SOREAL dans le même ton, deux variantes fixées par l'heure du jet.
- **Générosité (audit de la page Money Pit du wiki)** : seuils des 11 paliers, un seul type de récompense tiré parmi ceux du palier, valeurs de chaque colonne, AP = floor(log10(or)), EXP multipliée par le bonus d'EXP, bonus uniques, remise à zéro au Rebirth (dernier jet + 1 h) : conformes. **Écart trouvé et corrigé : la recharge** — wiki : « après le premier jet, 2 heures, puis 3, puis 4… » ; le code attendait 1 h, 2 h, 3 h (une heure de trop généreuse à chaque jet). Maintenant k + 1 heures après le k-ième jet. Test mis à jour.
- **Restent moins généreux que NGU** (non modélisés) : la colonne « Equip +1 LVL / Daycare » des paliers 2 et plus, et les paliers 12 à 16 (wish). **À confirmer** : la récompense « Adv Stat » ajoute +N à la fois au Power ET à la Toughness (le wiki dit « Power and Toughness stats » sans préciser si c'est l'un ou l'autre au hasard) ; si NGU n'en donne qu'un, nous doublons.
- Constat de la comparaison Attack (captures Norman) : base Basic Training identique (67,7 M contre 67 711 Million) ; NGU applique exactement base × (1 + Power / 100) : équipement ×112 % (Power 12) et ×110 % (Toughness 10) contre ×109 % (Power 9) chez nous ; seule la différence d'équipement porté explique l'écart, rien à corriger côté formule.
- Test `idle-money-pit-phrases-layout-v1` ; `meta-progression-v130.js ?v=202609261`, `release-notes-v1.js ?v=11`.

### 2026-09-26 — Beta 2.1 : le tutoriel du début se place tout seul

- Norman : à chaque page du tutoriel « Norman & Sébastien », le jeu doit ouvrir le bon menu, défiler vers ce dont on parle et poser la fenêtre à l'endroit qui ne le cache pas (PC et téléphone). `modules/tutorial-framing-v1.js` (?v=1), appelé après l'affichage de la fenêtre flottante ; chaque page du début porte un `cadrage` :
  - Objectif -> `stats` : Basic Training, les cases Nombre / Attack / Defense… juste sous la barre de menus (tout en haut), fenêtre juste sous ces cases ;
  - Énergie et Énergie Idle -> `energie` : la barre verte en haut, fenêtre juste dessous ;
  - Basic Training et Bien joué -> `barres` : Attaque passive et Blocage visibles dans le bas de l'écran, fenêtre en haut sans cacher le cadre d'Attaque passive (même disposition sur les deux pages) ; sur un écran trop petit pour les deux, au moins Attaque passive, juste sous la fenêtre ;
  - Saisie personnalisée -> `saisie` : le cadre bleu Basic Training tout en haut, fenêtre sous le bouton « Tout retirer » ;
  - Défense -> `blocage` : Blocage en bas de l'écran, fenêtre juste au-dessus ;
  - Fight Boss -> `fight` : bascule sur l'écran Fight Boss, fenêtre juste au-dessus du cadre rouge ;
  - page finale et pages d'accroche : aucun cadrage, rien ne bouge.
- Le placement se recalcule sur les vraies positions à l'écran (jamais de pixels fixes), avec des passes de contrôle après 16 / 250 / 700 ms (hauteur de la fenêtre, redessin) et au redimensionnement ; une fenêtre déplacée à la main n'est plus replacée avant la page suivante. Rejeu de test uniquement en local (`__SOREAL_IDLE_TUTO_REJOUER_V1__(page)`), rien n'est marqué comme vu.
- Vérifié dans le navigateur, pages 2 à 10, à 1024×768 et 375×812 : écarts mesurés ≤ 2 px sur « juste en dessous / juste au-dessus », cases du haut à 69 px (sous la barre de menus), Attaque passive jamais sous la fenêtre, Blocage entièrement visible dans les deux formats, dernière page sans défilement.
- Test `idle-tutorial-framing-v1`. `soreal-idle-ui.js ?v=280`, `release-notes-v1.js ?v=12`.

### 2026-09-26 — Beta 2.2 : tuto sur PC, voix, redémarrage du tuto, victoire de boss

- **Cadrage PC** (`tutorial-framing-v1.js ?v=2`) : Objectif = la barre verte tout en haut puis les cases en dessous, fenêtre juste sous les cases ; première page Énergie (`energie1`) = aucun mouvement sur PC (sur téléphone : sous la barre verte, comme demandé avant) ; fenêtre centrée sur PC comme sur téléphone (mêmes endroits) ; Fight Boss = fenêtre juste **sous le bouton Fight**, PC et téléphone (si la page ne peut pas remonter davantage, le texte de la fenêtre défile dans la place restante). Vérifié dans le navigateur à 1024×768 et 375×812 (écarts ≤ 2 px).
- **Tuto qui repartait de zéro** : `demarrerTutorielPagesIdleV1_` est rappelée à chaque rendu ; un tutoriel déjà en cours de même clé n'est plus relancé (on réaffiche seulement la fenêtre si un autre popup l'avait retirée). Cause du « j'ai cliqué sur Shop, ça repart de Norman & Sébastien ».
- **Phrase** : « Jambon fromage et sauce mayonnaise volé à un ouvrier dans le frigo. Miam. » à la place du sandwich ciabatta.
- **Voix** : `Norman` -> « Normanne » et `Fight Boss` -> « Faïte Bosse » (dictionnaire `PRONONCIATIONS_` appliqué à la synthèse seulement : l'empreinte des blocs ne change pas) ; le titre « Norman & Sébastien » n'est plus lu (texte voix des pages) ; **pause des « … »** : deux points de suite ne rallongent rien (mesuré : ≈ 0,6 s comme un point), le « … » coupe donc le texte en morceaux lus séparément avec 1 s de silence entre eux (mesuré ≈ 1,05 à 1,3 s au total, environ deux points). Régénération : `voice-generate.mjs --motifs "Norman|Fight|\.\.\.|…" --prune` (160 blocs + 1 nouveau, nouvelle option `--motifs`).
- **Boss vaincu / même boss** : le combat est prédit côté client avec les niveaux d'entraînement du moment ; si les allocations récentes n'étaient pas encore parties, le serveur (qui fait foi) calculait avec d'anciennes stats et ne confirmait pas la victoire, puis le client adoptait l'état serveur (même boss). Les allocations en attente partent maintenant avant la synchronisation de victoire (1,5 s au plus). Cause probable, non reproduite en session réelle : à confirmer par Norman.
- Tests : `idle-tutorial-framing-v1` (adapté), `idle-voice-pronunciation-tutorial-restart-v1` (nouveau), `idle-local-piper-neural` et `idle-boss-victory-watchdog-v1` adaptés. `soreal-idle-ui.js ?v=281`, `local-neural-piper-v1.js ?v=10`, `release-notes-v1.js ?v=13`.

### 2026-09-26 — Beta 2.3 : Fuite, menus débloqués ; voix régénérées (Beta 2.2)

- **Voix** : 161 blocs régénérés (dictionnaire Norman/Fight Boss, pause des « … », titres « Norman & Sébastien » retirés du texte lu) ; manifeste 879 fichiers (53,9 Mo). `local-neural-piper-v1.js ?v=10` : le « … » est un point + marqueur, la synthèse lit les morceaux séparément avec 1 000 ms de silence (le premier essai « . . » ne rallongeait rien : mesuré 0,5 s comme un point).
- **Fuite** : la page Fight Boss (clé du fondu = nom du boss) et la mise à jour de l'image (clé = numéro du boss) se relayaient avec deux clés différentes : chaque rendu, dont celui d'une Fuite, refaisait le fondu et rejouait le gong d'apparition du boss (mesuré : 3 gongs, 3 fondus). La clé est maintenant l'adresse de l'image ; l'image déjà affichée n'est pas remplacée ; `decoding="sync"` quand elle ne change pas. Son de fuite (`flee` : « wah-wah-wah-waaah » descendant) uniquement quand il y a un combat à fuir (`__fuirBossIdleV1__`). Vérifié : à la fuite un seul son (`flee`), aucun fondu.
- **Menu débloqué** : `annoncerNouveauxMenusIdleV1_` (à chaque rendu) : annonce en fondu « 🔓 Nouveau menu débloqué ! » + nom du menu (non cliquable, module de fondu existant) et son `menuUnlock` (clochettes montantes, distinct de la fanfare des boss). « Vu » mémorisé côté serveur (`menu-annonce:<id>`) ; première fois : menus déjà disponibles seulement notés (aucune rafale d'annonces pour les joueurs existants).
- Test `idle-flee-and-menu-unlock-v1`. `soreal-idle-ui.js ?v=282`, `audio-effects-v199.js ?v=211`, `release-notes-v1.js ?v=14`.

### 2026-09-26 — Beta 2.4 : sons de + / − / Cap (Basic Training)

- Norman : « un son pour + − et CAP, 3 sons différents en rapport avec ce qu'ils font ». `audio-effects-v199.js ?v=212` : `btPlus` (deux « bloups » qui montent + brillance : on ajoute), `btMinus` (deux « bloups » qui descendent, plus mats : on retire), `btCap` (charge en dents de scie qui monte de 180 à 900 Hz, puis « ding » aigu à 1568/2093 Hz avec un souffle : plafond atteint). Groupe `bt-adjust` (un événement plus récent remplace l'ancien : pas d'empilement quand on enchaîne les clics), 350 à 450 ms de péremption.
- Branchement : `ajusterBasicTrainingIdleV120_` joue le son seulement si l'allocation change vraiment (`delta !== 0`) : rien quand il n'y a pas d'énergie Idle à allouer. Vérifié dans le navigateur : + -> `btPlus`, − -> `btMinus`, Cap -> `btCap`, + sans énergie -> aucun son.
- Test `idle-basic-training-button-sounds-v1` (contexte audio factice : les trois sons planifient de vraies notes, sont tous différents, + monte, − descend, Cap finit par un aigu). `soreal-idle-ui.js ?v=283`, `release-notes-v1.js ?v=15`.
