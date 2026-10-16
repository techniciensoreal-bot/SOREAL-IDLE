@echo off
rem SOREAL IDLE - lance par le lien soreal-studio:// (voir installer_lien_studio.bat) : demarre lancer.bat si le studio de voix ne tourne pas deja.
rem Tout ce que contient le lien est IGNORE : la page ne peut rien faire executer d autre que lancer.bat.
rem Plus de test "quelque chose ecoute sur 8765" (un autre programme sur ce port faisait fermer cette fenetre aussitot et le studio ne demarrait jamais) :
rem lancer.bat sait reconnaitre le studio (deja lance : il le dit et s arrete), liberer le port d un intrus, ou expliquer pourquoi c est impossible.
start "SOREAL studio de voix" cmd /c "%~dp0lancer.bat"
exit /b 0
