@echo off
rem SOREAL IDLE - retire le lien soreal-studio:// installe par installer_lien_studio.bat.
reg delete "HKCU\Software\Classes\soreal-studio" /f >nul 2>&1
echo Lien retire.
pause
exit /b 0
