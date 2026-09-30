@echo off
rem K8s-study local preview on port 8080 (minimized window)
cd /d %~dp0
start "k8s-study local server" /min python -m http.server 8080
