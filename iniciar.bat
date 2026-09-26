@echo off
title Redacoes - corretor (porta 4020)
cd /d "%~dp0"
echo.
echo  =============================================================
echo   Corretor de redacoes - servidor local (porta 4020)
echo.
echo   Acesse NO NOTEBOOK     : http://localhost:4020
echo   Acesse NO TABLET/REDE : (mesma rede WiFi deste PC)
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' }).IPAddress -join ' '`") do echo       http://%%i:4020
echo.
echo   Deixe ESTA JANELA ABERTA - o servidor reinicia sozinho se cair.
echo  =============================================================
echo.
:inicio
echo [%date% %time%] Iniciando servidor...
npm run start
echo.
echo  O servidor foi encerrado ou apresentou erro.
echo  Reiniciando em 3 segundos (feche esta janela para parar)...
timeout /t 3 /nobreak >nul
goto inicio