@echo off
rem SOREAL IDLE - a faire UNE SEULE FOIS : apprend a Windows le lien soreal-studio://, ce qui permet au bouton « Lancer le studio » du menu Admin
rem de demarrer le studio de voix SANS qu aucun programme (pilote) ne doive tourner en permanence. Modifie uniquement ton compte (HKCU).
setlocal
reg add "HKCU\Software\Classes\soreal-studio" /ve /d "URL:SOREAL studio de voix" /f >nul || goto erreur
reg add "HKCU\Software\Classes\soreal-studio" /v "URL Protocol" /d "" /f >nul || goto erreur
reg add "HKCU\Software\Classes\soreal-studio\shell\open\command" /ve /d "\"%~dp0lancer_depuis_lien.bat\" \"%%1\"" /f >nul || goto erreur
echo Lien installe. Dans le menu Admin, « Lancer le studio » peut maintenant demarrer le studio tout seul.
echo Si le navigateur demande d ouvrir « soreal-studio », accepte et coche « toujours ».
echo Pour l enlever : desinstaller_lien_studio.bat
pause
exit /b 0
:erreur
echo ECHEC : le lien n a pas pu etre enregistre.
pause
exit /b 1
