@echo off
rem SOREAL IDLE - demarre le studio de voix local (laisse cette fenetre ouverte pendant que tu generes les voix depuis le menu Admin).
set "PY=%USERPROFILE%\soreal-voice-studio\venv\Scripts\python.exe"
if not exist "%PY%" (
  echo Studio de voix non installe : lance d abord installer.bat
  pause
  exit /b 1
)
:boucle
"%PY%" "%~dp0serveur.py"
rem Code 3 = erreur CUDA irrecuperable : le studio est relance tout seul.
if errorlevel 3 (
  echo Studio redemarre apres une erreur GPU...
  goto boucle
)
pause
