@echo off
cd /d "%~dp0"
title NutriCare - Servidor Local
echo ================================
echo    NutriCare - Servidor Local
echo ================================
echo.
echo Instalando dependencias (se necessario)...
if not exist node_modules (
  call npm install
)
echo.
echo Iniciando servidor de desenvolvimento...
start http://localhost:3000
cmd /k "npm run dev"
