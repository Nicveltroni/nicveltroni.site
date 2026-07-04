@echo off
rem ------------------------------------------------------------
rem  VILYA motion — avvio rapido
rem  Serve la cartella su http://localhost:8741 e apre il browser.
rem  Lascia questa finestra aperta mentre guardi la pagina.
rem ------------------------------------------------------------
cd /d "%~dp0"
echo Avvio del server locale su http://localhost:8741 ...
start "" "http://localhost:8741"
python -m http.server 8741 2>nul
if errorlevel 1 py -m http.server 8741
