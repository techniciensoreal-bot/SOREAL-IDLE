# Signaler un bug : passerelle mail

Le bouton « Signaler un bug » de SOREAL IDLE (Settings) enregistre le message dans le jeu **et** envoie un mail à `reeeedruuuum@gmail.com` avec l'objet **Soreal IDLE Bug signalé**. L'envoi passe par un petit Web App Google Apps Script (`Code.gs`) : c'est le seul moyen d'envoyer un mail sans service payant ni secret dans le dépôt.

Tant que les deux étapes ci-dessous ne sont pas faites, rien n'est perdu : chaque signalement est enregistré et l'administrateur les lit dans Settings > « Signalements reçus » (le joueur voit « Signalement enregistré »).

## Mise en service (une seule fois)

1. Aller sur <https://script.google.com>, créer un projet, remplacer son contenu par `Code.gs` de ce dossier (compte Google qui enverra les mails : par exemple `reeeedruuuum@gmail.com`).
2. Exécuter la fonction `autoriser` une fois (Exécuter) et accepter l'autorisation d'envoi de mail.
3. (Recommandé) Projet > Paramètres > Propriétés du script : ajouter `SECRET` = une longue phrase au hasard.
4. Déployer > Nouveau déploiement > type « Application Web » : **Exécuter en tant que : moi**, **Qui a accès : tout le monde**. Copier l'adresse `…/exec`.
5. Donner l'adresse (et le secret) au Worker SOREAL IDLE, dans un terminal, depuis le dossier du dépôt (les valeurs sont saisies par toi, elles ne sont écrites nulle part dans le code) :

```bash
npx wrangler secret put SOREAL_IDLE_BUG_MAIL_URL
npx wrangler secret put SOREAL_IDLE_BUG_MAIL_SECRET
```

6. Tester : Settings > « Signaler un bug », écrire un message, Envoyer ; le mail arrive dans la minute. Si le signalement apparaît avec « mail : échec » dans Settings > « Signalements reçus », vérifier l'adresse `/exec` et le secret.

## Ce qui est garanti

- destinataire et objet sont fixes dans `Code.gs` (jamais lus dans la requête) ;
- pas de message vide (le bouton reste grisé) ; 2000 caractères au maximum ; 5 signalements par heure et par compte ;
- le mail contient le prénom et l'adresse du joueur : « Répondre » lui répond directement.
