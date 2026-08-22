@echo off
title NutriCare - Deploy Gratuito
color 0B
echo ============================================
echo   NutriCare - Publicar na Internet
echo ============================================
echo.
echo Escolha uma opcao:
echo.
echo  [1] Vercel (RECOMENDADO - mais facil)
echo  [2] GitHub Pages + GitHub Actions
echo.
set /p OPT="Opcao: "
echo.

if "%OPT%"=="1" goto vercel
if "%OPT%"=="2" goto github
goto end

:vercel
echo ============================================
echo  DEPLOY NO VERCEL (gratuito)
echo ============================================
echo.
echo  Requisitos:
echo   1. Conta em https://vercel.com
echo   2. Git instalado
echo.
echo  Passos:
echo   1. Crie um repositorio no GitHub:
echo      - https://github.com/new
echo      - Nome: nutricare
echo      - Publico
echo.
set /p REPO_URL="URL do repositorio: "
echo.
git init 2>nul
git add -A
git commit -m "NutriCare - Sistema de Gestao Nutricional"
git branch -M main
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git push -u origin main
echo.
echo  Agora va em https://vercel.com/new
echo  Importe o repositorio "nutricare"
echo  Clique em "Deploy"
echo.
echo  Pronto! Seu site estara em: https://nutricare.vercel.app
echo.
pause
goto end

:github
echo ============================================
echo  DEPLOY NO GITHUB PAGES
echo ============================================
echo.
echo  Criando repositorio...
set /p REPO_URL="URL do repositorio GitHub: "
echo.
git init 2>nul
git add -A
git commit -m "NutriCare - Sistema de Gestao Nutricional"
git branch -M main
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git push -u origin main
echo.
echo  Envio concluido!
echo.
echo  Apos enviar, ative o GitHub Pages:
echo   1. https://github.com/SEUUSUARIO/nutricare/settings/pages
echo   2. Source: GitHub Actions
echo   3. O workflow ja esta configurado em .github/workflows/deploy.yml
echo.
pause
goto end

:end
