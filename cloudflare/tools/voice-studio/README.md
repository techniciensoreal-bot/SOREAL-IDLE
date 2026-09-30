# Studio de voix SOREAL IDLE (voix réaliste, gratuit, sur ton PC)

Sert au bouton **« Générer les voix »** du menu Admin. Il utilise **Chatterbox** (modèle multilingue, licence MIT) sur ta carte
graphique NVIDIA. Rien à payer, rien n'est envoyé à un service externe : seul le fichier audio final est téléversé sur le site.

1. **Une fois** : double-clique `installer.bat` (plusieurs Go, quelques minutes ; le modèle se télécharge au premier lancement).
2. **À chaque session de génération** : double-clique `lancer.bat` et laisse la fenêtre ouverte.
3. Dans le jeu, menu **Admin** → ouvre une histoire → **Générer les voix**.

Voix de référence (facultatif) : mets un extrait audio de 6 à 15 s dans une variable d'environnement
`SOREAL_VOIX_REFERENCE` (chemin du fichier) avant `lancer.bat` : la voix générée imitera cet extrait. Utilise seulement une voix dont
tu as les droits (la tienne, celle d'un proche qui est d'accord, une voix libre de droits).

Chrome peut demander l'autorisation « accéder aux appareils du réseau local » la première fois : accepte. Safari (iPhone) ne peut pas
joindre ton PC : génère les voix depuis Chrome ou Edge sur ce PC.
