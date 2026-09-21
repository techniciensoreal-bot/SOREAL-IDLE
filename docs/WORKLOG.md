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
