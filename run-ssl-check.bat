@echo off
echo Running SSL Certificate Verification...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0SSL_CERTIFICATE_VERIFICATION.ps1"
pause