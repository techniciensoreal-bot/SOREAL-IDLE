@echo off
rem SOREAL IDLE - lance par le lien soreal-studio:// (voir installer_lien_studio.bat) : demarre lancer.bat si le studio de voix ne tourne pas deja.
rem Tout ce que contient le lien est IGNORE : la page ne peut rien faire executer d autre que lancer.bat.
netstat -ano -p tcp | findstr /R /C:":8765 .*LISTENING" >nul 2>&1
if %errorlevel%==0 exit /b 0
start "SOREAL studio de voix" cmd /c "%~dp0lancer.bat"
exit /b 0
