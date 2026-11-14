@echo off
chcp 65001 >nul
title OmniCommerce • Criar Atalho Bella Pizza
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws = New-Object -ComObject WScript.Shell;" ^
  "$desk = [Environment]::GetFolderPath('Desktop');" ^
  "$lnk = Join-Path $desk 'Bella Pizza.lnk';" ^
  "$s = $ws.CreateShortcut($lnk);" ^
  "$s.TargetPath = '%~dp0INICIAR-PIZZARIA.bat';" ^
  "$s.WorkingDirectory = '%~dp0';" ^
  "$s.IconLocation = '%~dp0bella-pizza.ico,0';" ^
  "$s.Description = 'Sistema Bella Pizza - PDV, Cozinha e Agentes';" ^
  "$s.Save();" ^
  "Write-Host '[OK] Atalho criado na Area de Trabalho:' $lnk"

pause
