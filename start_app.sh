#!/bin/bash

# 启动聊天应用脚本
echo "🚀 启动 AutoGen 聊天应用..."

# 检查虚拟环境是否存在
if [ ! -d "backend/venv" ]; then
    echo "❌ 虚拟环境不存在，请先运行 setup_venv.sh"
    exit 1
fi

# 启动后端服务（在虚拟环境中）
echo "📡 启动后端服务..."
cd backend
source venv/bin/activate
python main.py &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 3

# 启动前端服务
echo "🌐 启动前端服务..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ 应用启动成功！"
echo "📱 前端地址: http://localhost:3000"
echo "🔧 后端地址: http://localhost:8000"
echo "📚 API文档: http://localhost:8000/docs"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo '🛑 正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
