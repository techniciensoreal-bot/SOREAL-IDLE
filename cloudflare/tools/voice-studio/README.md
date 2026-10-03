# Studio de voix SOREAL IDLE (voix réaliste, gratuit, sur ton PC)

Sert au bouton **« Générer les voix »** du menu Admin. Il utilise **Chatterbox** (modèle multilingue, licence MIT) sur ta carte
graphique NVIDIA. Rien à payer, rien n'est envoyé à un service externe : seul le fichier audio final est téléversé sur le site.

1. **Une fois** : double-clique `installer.bat` (plusieurs Go, quelques minutes ; le modèle se télécharge au premier lancement).
2. **À chaque session de génération** : double-clique `lancer.bat` et laisse la fenêtre ouverte — **ou** clique sur **« 🚀 Lancer le studio »** dans le menu Admin (et **« 🛑 Arrêter le studio »** quand tu as fini). Ces deux boutons passent par le **pilote** (voir plus bas).
3. Dans le jeu, menu **Admin** → ouvre une histoire → **Générer les voix**.

**Deux voix** : chaque étape d'une histoire se lit avec le **narrateur** (voix d'homme) ou une **femme** (choix « Qui parle » dans
l'éditeur). Chacune imite un court extrait de voix **française** (`voix/homme.wav`, `voix/femme.wav` dans
`%USERPROFILE%\soreal-voice-studiooix`), ce qui évite l'accent anglais de la voix par défaut de Chatterbox. Les extraits par défaut
sont créés à l'installation avec les voix Piper françaises libres « Tom » et « Siwis ». Pour une voix encore plus naturelle,
remplace-les par un extrait de 6 à 15 s (sans musique ni bruit) : utilise seulement une voix dont tu as les droits (la tienne, celle
d'un proche qui est d'accord, une voix libre de droits).

Chrome peut demander l'autorisation « accéder aux appareils du réseau local » la première fois : accepte. Safari (iPhone) ne peut pas
joindre ton PC : génère les voix depuis Chrome ou Edge sur ce PC.

## Pilote : lancer et arrêter le studio depuis le menu Admin

Une page web ne peut pas démarrer un programme sur ton PC. Le **pilote** (`pilote.py`, bibliothèque standard de Python seulement) est un tout petit serveur
local, toujours allumé, qui lance ou arrête `lancer.bat` quand tu cliques sur **🚀 Lancer le studio** / **🛑 Arrêter le studio** (éditeur d'histoires et éditeur de textes).

- **Une seule fois** : double-clique `installer_pilote.bat`. Le pilote démarre alors tout seul avec Windows (sans fenêtre) et tourne tout de suite.
  (À la main, sans installer : `pilote.bat`, fenêtre à laisser ouverte.) Pour l'enlever : `desinstaller_pilote.bat`.
- **Sécurité** : il n'écoute que sur ce PC (127.0.0.1:8766), n'obéit qu'au site du jeu (en-tête Origin) et ne sait faire que « lancer lancer.bat » et « arrêter le studio ».
- **Arrêt** : ferme le studio et sa fenêtre, qu'il ait été lancé par le bouton ou à la main.
- Ne fonctionne que sur ce PC (Chrome ou Edge ; pas Safari).
