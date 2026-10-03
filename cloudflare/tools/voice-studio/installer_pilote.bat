@echo off
rem SOREAL IDLE - fait demarrer le pilote du studio de voix tout seul avec Windows (a faire UNE fois), sans fenetre.
setlocal
set "PYW=%USERPROFILE%\soreal-voice-studio\venv\Scripts\pythonw.exe"
if not exist "%PYW%" for /f "delims=" %%i in ('where pythonw 2^>nul') do if not defined PYTROUVE set "PYW=%%i" & set PYTROUVE=1
if not exist "%PYW%" (
  echo Python introuvable : installe d abord le studio avec installer.bat
  pause
  exit /b 1
)
set "LNK=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\SOREAL pilote studio de voix.lnk"
powershell -NoProfile -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut($env:LNK); $s.TargetPath=$env:PYW; $s.Arguments='\"%~dp0pilote.py\"'; $s.WorkingDirectory='%~dp0'; $s.WindowStyle=7; $s.Save()" || goto erreur
rem Demarre aussi le pilote tout de suite (sans attendre le prochain demarrage de Windows).
start "" "%PYW%" "%~dp0pilote.py"
echo Pilote installe : il demarre avec Windows, et tourne deja. Les boutons du menu Admin peuvent lancer et arreter le studio.
echo Pour l enlever : desinstaller_pilote.bat
pause
exit /b 0
:erreur
echo ECHEC : le raccourci de demarrage n a pas pu etre cree.
pause
exit /b 1
