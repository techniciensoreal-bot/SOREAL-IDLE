# SOREAL IDLE pour Windows

Le jeu complet dans une application : le VRAI Worker de production tourne dans l'application (`src/env-local.mjs`), sur une base SQLite du joueur ; images, voix et musiques sont embarquées.
Jouable sans internet. (Décisions de Norman, 2026-10-28 : partie locale sans compte, juste un pseudo ; liaison Google plus tard ; « la plus avancée gagne ».)

## Construire l'installateur

1. `node desktop/recolter.mjs` : copie les médias de R2 (`idle/`) dans `desktop/medias` (reprise possible ; `--liste` = inventaire seulement). Accès : la connexion `wrangler` de l'administrateur, lecture seule.
2. `node desktop/publier-maj.mjs --creer-cle` : UNE fois (clé de signature des mises à jour ; **sauvegarder** `%USERPROFILE%\.soreal-idle\maj-cle-privee.pem`).
3. `node desktop/construire.mjs` : `desktop/dist/SOREAL-IDLE-Setup-<version>.exe` (`--dossier` : seulement le dossier exécutable, plus rapide à essayer).

## Mises à jour (comme VLC : dans la fenêtre, sans retélécharger d'installateur)

Après avoir changé des images / sons dans R2 et/ou du code (`git commit`) :

```
node desktop/publier-maj.mjs --notes "Nouvelles images du Titan"            # simule : montre ce qui serait publié
node desktop/publier-maj.mjs --notes "Nouvelles images du Titan" --publier  # publie
```

(L'APK Android hors ligne se met à jour de la même façon : ajouter `--apk` aux deux commandes ; voir android/README.md.)

Les applications ouvertes et connectées affichent en haut de la fenêtre « Une mise à jour est disponible : … [Mettre à jour] [Plus tard] » (vérification 8 s après l'ouverture, puis toutes les 30 minutes). « Mettre à jour » télécharge UNIQUEMENT ce qui a changé
(le paquet de code s'il a changé, les médias nouveaux ou modifiés), avec une barre de progression, puis le jeu se relance.

- Le manifeste (`idle/_maj/manifeste.json` dans R2) est **signé** (Ed25519) ; l'application ne fait confiance qu'à la clé publique embarquée (`maj-cle-publique.pem`) : le code d'une mise à jour s'exécute dans l'application.
- Une mise à jour est installée dans `…\SOREAL IDLE\maj\v<date>\` (couches : la plus récente d'abord, puis ce qu'embarque l'installateur). Si le jeu ne démarre pas avec elle, l'application revient toute seule à l'état d'avant et ne la repropose plus.
- Routes du Worker : `/api/v1/maj/manifeste` et `/api/v1/maj/fichier?cle=idle/…` (lecture seule, sous `idle/` uniquement).
- Ce qui se met à jour : le jeu, les médias ET le cœur de l’application (`coeur.js`, `preload.js`, `icone.ico`, `src/env-local.mjs`, `src/liaison.mjs`, `src/steam.mjs`, qui voyagent dans le paquet de code). Le lanceur `main.js` charge le cœur de la dernière mise à jour seulement s’il a prouvé qu’il démarre (témoin `maj/coeur-essai.json`, liste `maj/coeur-refuse.json`), sinon celui de l’installateur.
- Ce qui ne se met JAMAIS à jour : le lanceur `main.js`, `src/maj.mjs` et `src/zip.mjs` (la vérification des signatures), la clé publique, l’exécutable Electron lui-même et l’installateur (donc l’icône dessinée dans le fichier .exe ; celle de la fenêtre et de la barre des tâches vient du cœur). Ne jamais modifier `main.js` à la légère : un changement exigerait de réinstaller chez tout le monde.
- Essai local complet : voir `cloudflare/tests/idle-desktop-maj-v1.test.mjs` ; pour tester l'application emballée contre un faux serveur, lancer l'exe avec `SOREAL_MAJ_URL=http://127.0.0.1:<port>`.

## Autres

- `node desktop/src/serveur-essai.mjs` : le Worker embarqué derrière un petit serveur HTTP (pour le voir dans un navigateur).
- Option « Ajouter à Steam » : Réglages > Ma partie (`src/steam.mjs`).
- Piloter l'application emballée : lancer avec `--remote-debugging-port=N` (protocole CDP).
