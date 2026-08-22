@echo off
title Dieta Calculadora
cd /d "%~dp0"

echo ================================
echo    Dieta Calculadora
echo ================================
echo.

if not exist node_modules (
  echo Instalando dependencias...
  call npm install
)

echo Iniciando servidor...
echo Abra http://localhost:3000 no navegador apos o servidor iniciar.
echo.
npm run dev
pause
