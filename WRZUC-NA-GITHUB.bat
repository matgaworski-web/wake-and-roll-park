@echo off
title Wrzuć Wake & Roll Park na GitHub
color 0a
echo ========================================================
echo   WYSYLANIE PROJEKTU WAKE AND ROLL PARK NA GITHUB
echo ========================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0push-to-github.ps1"
pause
