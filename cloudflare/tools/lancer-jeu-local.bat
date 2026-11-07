@echo off
REM Lance le jeu COMPLET en local (joueur neuf : intro, tutoriel...) et l'ouvre dans Google Chrome (sinon dans le navigateur par defaut).
REM Arreter le jeu : fermer cette fenetre. Autre navigateur : ouvrir http://localhost:8861/jouer  (http://localhost:8861/jouer?neuf=1 recommence une partie neuve).
cd /d "%~dp0\..\.."
set PORT=8861
start "" chrome "http://localhost:%PORT%/jouer" || start "" "http://localhost:%PORT%/jouer"
node cloudflare/tools/local-dev-server.mjs
pause
