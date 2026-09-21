# WORKLOG — SOREAL-IDLE

Dernière mise à jour : 2026-09-21
Tâche en cours : remplacer progressivement le TTS navigateur par une couche audio pré-générée avec fallback TTS.

## État vérifié avant chantier
- Branche production : `main`
- SHA `main` initial vérifié : `005168cc4566fe4adb98fe76da1b30d5806510e9`
- Dernier workflow production avant chantier : `Deploy SOREAL Idle to Cloudflare` run #498
- CI / déploiement du SHA initial : SUCCESS
- SHA réellement déployé avant chantier : `005168cc4566fe4adb98fe76da1b30d5806510e9`
- Création du WORKLOG : `29d231ef11cf2c0726d5032ba73dcd52f85bd0ab`
- Audit consigné : `8d2eb2fa51d1f74efb32c055da8613a7d60b9157`
- Les deux commits docs ci-dessus ne touchent pas `cloudflare/**` et ne déclenchent donc pas de déploiement.

## Limitation de l'environnement
- Le clone local de cette session ne peut pas résoudre `github.com` : `Could not resolve host: github.com`.
- La connexion GitHub applicative fonctionne.
- La suite complète locale ne peut donc pas être exécutée dans le conteneur de cette session.
- Ne pas déclarer le chantier terminé avant la suite complète GitHub Actions sur `main` et la vérification du SHA déployé.

## Audit TTS vérifié
- Module : `cloudflare/public/modules/tutorial-tts-v202.js`.
- Avant changement : Web Speech API uniquement, avec contournements Android (morceaux <= 220 caractères, `resume()`, retry sans voix explicite).
- Le test historique interdisait explicitement `Audio` et devait être adapté.
- Cache-buster initial du module : `?v=210`.

## Implémentation sur branche
Branche : `work/tts-audio-fallback`

Commits fonctionnels :
- `fc6c3a610cd157345324dd5ae3fd09fd1c7040e7` — priorité à l'audio pré-généré avec fallback TTS.
- `8b23373cbeab508e3626b10c127725ca411c314f` — test adapté pour couvrir l'architecture hybride.
- `a03187ad454198ddb758912da0c814bcb0eaa3cb` — cache-buster narration `?v=221`.
- `0ac7f35c7b889d8075cc6d85f2d8fc309970f5ca` — évite un double fallback si `Audio.play()` échoue synchroniquement.

Comportement ajouté :
- source audio explicite via `data-soreal-tts-audio-src` ;
- ou manifeste global `window.__SOREAL_IDLE_NARRATION_AUDIO_MANIFEST__` indexé par ID de cible ;
- `readText(text, audioSrc)` accepte aussi une URL audio explicite ;
- si aucun audio n'existe : SpeechSynthesis actuel ;
- si le chargement/la lecture audio échoue : SpeechSynthesis actuel ;
- `stop()` coupe audio et synthèse ;
- aucune clé API ni appel direct à un fournisseur TTS depuis le navigateur.

## Validation ciblée exécutée
Validation V8 avec faux `Audio` et faux `SpeechSynthesis` :
- syntaxe du module : OK ;
- audio pré-généré prioritaire : OK ;
- fallback SpeechSynthesis après erreur audio : OK ;
- arrêt de l'audio par `stop()` : OK ;
- aucun `fetch()` direct vers un fournisseur TTS : OK ;
- cache-buster `?v=221` : OK.

Dernier SHA de branche validé : `0ac7f35c7b889d8075cc6d85f2d8fc309970f5ca`.

## État production
- Dernier SHA production vérifié : `005168cc4566fe4adb98fe76da1b30d5806510e9`.
- La nouvelle narration n'est PAS encore sur `main` ni en production à ce stade.

## Dernière erreur
- Pas d'erreur fonctionnelle connue sur la branche.
- Limitation persistante : clone local réseau indisponible, donc suite complète locale non exécutée.

## Prochaine action
1. Vérifier que `main` n'a pas avancé depuis `8d2eb2fa...`.
2. Comparer précisément la branche à `main`.
3. Intégrer sur `main` seulement si le diff est limité au module narration, son test, le cache-buster et ce WORKLOG.
4. Vérifier le workflow complet GitHub Actions : suite de tests, build, déploiement Cloudflare et contrôle du SHA actif.
5. Mettre à jour ce WORKLOG avec le SHA réellement déployé.
