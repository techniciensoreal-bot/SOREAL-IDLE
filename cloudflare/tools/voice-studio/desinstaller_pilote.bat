@echo off
rem SOREAL IDLE - retire le demarrage automatique du pilote du studio de voix et l arrete.
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\SOREAL pilote studio de voix.lnk" 2>nul
for /f "tokens=5" %%p in ('netstat -ano -p tcp ^| findstr /R /C:":8766 .*LISTENING"') do taskkill /PID %%p /F >nul 2>&1
echo Pilote retire (il ne demarrera plus avec Windows).
pause
