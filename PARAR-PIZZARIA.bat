@echo off
chcp 65001 >nul
title OmniCommerce • Parar Servidor Bella Pizza
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -like '*src/server.js*' -or $_.CommandLine -like '*src\server.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"
echo [OK] Servidor local Bella Pizza encerrado.
timeout /t 2 /nobreak >nul
