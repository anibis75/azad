@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul || (echo. & echo Node.js n'est pas installe : telecharge-le sur https://nodejs.org ^(version LTS^), installe-le, puis relance FILM.bat & pause & exit /b 1)
if not exist node_modules\ffmpeg-static ( echo Installation des outils ^(une seule fois^)... & call npm install --no-audit --no-fund )
node render.cjs %*
pause
