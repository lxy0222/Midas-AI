#!/bin/bash

# 设置虚拟环境脚本
echo "🔧 设置 Python 虚拟环境..."

# 进入后端目录
cd backend

# 创建虚拟环境
echo "📦 创建虚拟环境..."
python3 -m venv venv

# 激活虚拟环境
echo "🔄 激活虚拟环境..."
source venv/bin/activate

# 升级 pip
echo "⬆️ 升级 pip..."
pip install --upgrade pip

# 安装依赖
echo "📚 安装 Python 依赖..."
pip install -r requirements.txt

echo "✅ 虚拟环境设置完成！"
echo ""
echo "要激活虚拟环境，请运行："
echo "cd backend && source venv/bin/activate"
echo ""
echo "要启动应用，请运行："
echo "./start_app.sh"

cd ..
