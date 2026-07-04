@echo off
cd /d "%~dp0"

set PORT=8777

where python >nul 2>nul
if %errorlevel%==0 (
    start "" http://localhost:%PORT%/index.html
    python -m http.server %PORT%
    goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
    start "" http://localhost:%PORT%/index.html
    py -m http.server %PORT%
    goto :eof
)

echo Python non trovato. Installa Python da https://www.python.org/downloads/
echo oppure apri index.html direttamente nel browser (alcune immagini potrebbero non caricarsi).
pause
