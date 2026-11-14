@echo off
chcp 65001 >nul
title OmniCommerce • Bella Pizza (Servidor Local)
cd /d "%~dp0"

set "PATH=%PATH%;C:\Program Files\nodejs"
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
  echo [OK] Node.js instalado com sucesso!
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
    echo [AVISO] Arquivo .env criado a partir do .env.example.
  )
)

echo.
echo ==================================================
echo   BELLA PIZZA • SERVIDOR LOCAL INICIADO
echo   Painel: http://localhost:3000/app.html?loja=cli_bellapizza
echo   Login:  bellapizza@loja.com  ^|  Senha: 123456
echo   Loja:   http://localhost:3000/loja.html?loja=cli_bellapizza
echo ==================================================
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000/app.html?loja=cli_bellapizza"
node src/server.js
pause
