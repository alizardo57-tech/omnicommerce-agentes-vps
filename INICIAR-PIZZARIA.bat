@echo off
chcp 65001 >nul
title OmniCommerce • Bella Pizza (Iniciando...)
cd /d "%~dp0"

set "PATH=%PATH%;C:\Program Files\nodejs"

:: Se o servidor ja estiver rodando na porta 3000, apenas abre o navegador
powershell -NoProfile -Command "try { $r=Invoke-WebRequest -Uri 'http://localhost:3000/app.html' -TimeoutSec 1 -UseBasicParsing; exit 0 } catch { exit 1 }"
if not errorlevel 1 (
  start "" "http://localhost:3000/app.html?loja=cli_bellapizza"
  exit /b 0
)

where node >nul 2>&1
if errorlevel 1 (
  echo [INFO] Node.js nao encontrado. Instalando automaticamente...
  where winget >nul 2>&1
  if not errorlevel 1 (
    winget install -e --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
  )
  set "PATH=%PATH%;C:\Program Files\nodejs"
  where node >nul 2>&1
  if errorlevel 1 (
    echo [INFO] Baixando instalador oficial do Node.js LTS...
    powershell -NoProfile -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi' -OutFile '%TEMP%\nodejs-lts.msi'"
    msiexec /i "%TEMP%\nodejs-lts.msi" /passive /norestart
    del "%TEMP%\nodejs-lts.msi" >nul 2>&1
    set "PATH=%PATH%;C:\Program Files\nodejs"
  )
  where node >nul 2>&1
  if errorlevel 1 (
    echo [ERRO] Nao foi possivel instalar o Node.js automaticamente. Instale em https://nodejs.org
    pause
    exit /b 1
  )
)

if exist "ATUALIZAR-PIZZARIA.bat" (
  call "ATUALIZAR-PIZZARIA.bat" --auto
)

if not exist "node_modules" (
  echo Instalando dependencias pela primeira vez...
  call npm install --omit=dev
  if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias.
    pause
    exit /b 1
  )
)

if not exist ".env" (
  if exist ".env.example" (
    copy ".env.example" ".env" >nul
  )
)
powershell -NoProfile -Command "if (Test-Path '.env') { $c=Get-Content '.env' -Raw; if ($c -notmatch 'AUTO_PRINT=true') { Add-Content '.env' \"`nAUTO_PRINT=true\" } } else { Set-Content '.env' 'AUTO_PRINT=true' }"

:: Inicia o servidor Node 100% invisivel em segundo plano
powershell -NoProfile -Command "Start-Process -FilePath 'node' -ArgumentList 'src/server.js' -WorkingDirectory '%~dp0' -WindowStyle Hidden"

timeout /t 2 /nobreak >nul
start "" "http://localhost:3000/app.html?loja=cli_bellapizza"
exit /b 0
