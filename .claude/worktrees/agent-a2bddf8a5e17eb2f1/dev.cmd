@echo off
rem Atalho p/ rodar o dev server pelo PowerShell/Explorer.
rem As dependencias do projeto sao instaladas no WSL (Linux) - este script
rem apenas encaminha o comando para la. Nao rode "npm install" no Windows!
wsl -e bash -ic "cd \"$(wslpath '%~dp0')\" && npm run dev"
