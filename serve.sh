#!/usr/bin/env bash
# K8s 学练营 本地预览（macOS / Linux）
# 用法：./serve.sh [端口]（默认 8080），Ctrl+C 停止
cd "$(dirname "$0")" || exit 1
PORT="${1:-8080}"
echo "☸️  K8s 学练营: http://localhost:${PORT}/  （Ctrl+C 停止）"
python3 -m http.server "$PORT"
