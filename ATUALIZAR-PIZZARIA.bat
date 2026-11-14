@echo off
chcp 65001 >nul
title OmniCommerce • Atualizar Bella Pizza
cd /d "%~dp0"

echo [INFO] Verificando atualizacoes do sistema no GitHub...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "$zip=Join-Path $env:TEMP 'bella_update.zip';" ^
  "$ext=Join-Path $env:TEMP 'bella_update_ext';" ^
  "try {" ^
  "  Invoke-WebRequest -Uri 'https://github.com/alizardo57-tech/omnicommerce-agentes-vps/archive/refs/heads/main.zip' -OutFile $zip -TimeoutSec 15;" ^
  "  if (Test-Path $ext) { Remove-Item $ext -Recurse -Force }" ^
  "  Expand-Archive -Path $zip -DestinationPath $ext -Force;" ^
  "  $src=Join-Path $ext 'omnicommerce-agentes-vps-main';" ^
  "  robocopy $src '%~dp0.' /E /XD .git node_modules data /XF .env *.log | Out-Null;" ^
  "  Remove-Item $zip -Force -ErrorAction SilentlyContinue;" ^
  "  Remove-Item $ext -Recurse -Force -ErrorAction SilentlyContinue;" ^
  "  Write-Host '[OK] Sistema atualizado com sucesso! (data/ e .env preservados)';" ^
  "} catch {" ^
  "  Write-Host '[AVISO] Sem internet ou falha ao baixar. Mantendo versao local atual.';" ^
  "}"

set "PATH=%PATH%;C:\Program Files\nodejs"
where npm >nul 2>&1
if not errorlevel 1 (
  echo [INFO] Conferindo dependencias...
  call npm install --omit=dev >nul 2>&1
)

if "%~1"=="--auto" exit /b 0
echo.
echo Pressione qualquer tecla para fechar...
pause >nul
