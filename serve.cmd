@echo off
rem K8s 学练营 本地预览服务：双击即可在 8080 端口启动（最小化窗口）
cd /d %~dp0
start "k8s-study local server" /min python -m http.server 8080
