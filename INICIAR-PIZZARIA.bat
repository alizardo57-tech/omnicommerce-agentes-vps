@echo off
chcp 65001 >nul
title OmniCommerce • Bella Pizza (Servidor Local)
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado neste PC.
  echo Baixe e instale a versao LTS em: https://nodejs.org
  pause
  exit /b 1
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
    echo Edite o .env para colocar sua GEMINI_API_KEY quando quiser IA na Camila.
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
