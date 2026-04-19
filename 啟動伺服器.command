#!/bin/bash
cd "$(dirname "$0")"
echo "伺服器啟動中..."
echo ""

# 顯示本機 IP
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
echo "Windows 電腦請開瀏覽器輸入："
echo ""
echo "  http://${IP}:8080"
echo ""
echo "（按 Ctrl+C 可關閉伺服器）"
echo "-----------------------------------"
python3 -m http.server 8080
