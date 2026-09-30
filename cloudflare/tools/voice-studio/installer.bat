@echo off
rem SOREAL IDLE - installation du studio de voix (Chatterbox, gratuit) - a lancer UNE fois.
setlocal
set "DIR=%USERPROFILE%\soreal-voice-studio"
echo Installation dans %DIR% (plusieurs Go, quelques minutes)...
python -m pip install --user --quiet uv || goto erreur
python -m uv venv --python 3.12 "%DIR%\venv" || goto erreur
python -m uv pip install --python "%DIR%\venv\Scripts\python.exe" chatterbox-tts piper-tts imageio-ffmpeg "setuptools<81" || goto erreur
rem PyTorch avec CUDA (carte graphique NVIDIA) a la place de la version processeur seul.
python -m uv pip install --python "%DIR%\venv\Scripts\python.exe" --reinstall-package torch --reinstall-package torchaudio torch==2.6.0 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cu124 || goto erreur
rem Extraits de reference : une voix d homme et une voix de femme FRANCAISES (evite l accent anglais).
"%DIR%\venv\Scripts\python.exe" "%~dp0creer_references.py" || goto erreur
echo.
echo Installation terminee. Lance ensuite lancer.bat
exit /b 0
:erreur
echo.
echo ECHEC de l installation (voir le message ci-dessus).
exit /b 1
