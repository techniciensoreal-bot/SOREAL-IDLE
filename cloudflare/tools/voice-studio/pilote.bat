@echo off
rem SOREAL IDLE - lance le PILOTE du studio de voix (il doit rester allume : les boutons "Lancer le studio" / "Arreter le studio" du menu Admin lui parlent).
rem Pour qu il demarre tout seul avec Windows : installer_pilote.bat (une seule fois).
set "PY=%USERPROFILE%\soreal-voice-studio\venv\Scripts\python.exe"
if not exist "%PY%" set "PY=python"
"%PY%" "%~dp0pilote.py"
pause
