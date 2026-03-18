@echo off
cd /d C:\Users\Sundram\OneDrive\Desktop\store-system

start cmd /k "npm run dev"
timeout /t 2 /nobreak > nul
start http://localhost:5173