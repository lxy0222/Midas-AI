import asyncio
import json
import time
from typing import AsyncGenerator

class TestChatService:
    """测试用的聊天服务，模拟多智能体协作"""
    
    def __init__(self):
        self.agent_info = {
            "analyzer": {
                "name": "需求分析师",
                "description": "负责分析用户需求，理解问题背景",
                "avatar": "🔍",
                "color": "#1890ff"
            },
            "researcher": {
                "name": "知识研究员", 
                "description": "负责搜索和整理相关知识信息",
                "avatar": "📚",
                "color": "#52c41a"
            },
            "synthesizer": {
                "name": "内容整合师",
                "description": "负责整合信息，生成最终答案",
                "avatar": "⚡",
                "color": "#722ed1"
            }
        }
    
    async def chat_stream(self, message: str, session_id: str = "default") -> AsyncGenerator[str, None]:
        """模拟多智能体协作的流式聊天"""
        
        # 模拟智能体工作流程
        agents_workflow = [
            {
                "agent": "analyzer",
                "content": f"正在分析您的问题：「{message}」\n\n我理解您想了解的是...",
                "delay": 0.1
            },
            {
                "agent": "researcher", 
                "content": "基于需求分析，我开始搜索相关信息...\n\n找到以下相关内容：\n- 相关概念解释\n- 实际应用案例\n- 最佳实践建议",
                "delay": 0.08
            },
            {
                "agent": "synthesizer",
                "content": "综合以上分析和研究结果，为您提供完整答案：\n\n根据您的问题，我的建议是...\n\n希望这个回答对您有帮助！",
                "delay": 0.06
            }
        ]
        
        try:
            for workflow_step in agents_workflow:
                agent_id = workflow_step["agent"]
                content = workflow_step["content"]
                delay = workflow_step["delay"]
                
                # 发送智能体开始事件
                yield json.dumps({
                    "type": "agent_start",
                    "agent": agent_id,
                    "agent_info": self.agent_info[agent_id],
                    "content": ""
                }) + "\n"
                
                # 模拟流式输出内容
                words = content.split()
                current_content = ""
                
                for word in words:
                    current_content += word + " "
                    yield json.dumps({
                        "type": "chunk",
                        "agent": agent_id,
                        "content": word + " "
                    }) + "\n"
                    
                    # 模拟打字延迟
                    await asyncio.sleep(delay)
                
                # 发送智能体结束事件
                yield json.dumps({
                    "type": "agent_end",
                    "agent": agent_id,
                    "content": current_content.strip()
                }) + "\n"
                
                # 智能体之间的切换延迟
                await asyncio.sleep(0.5)
            
            # 发送完成事件
            yield json.dumps({
                "type": "complete",
                "message": "所有智能体协作完成"
            }) + "\n"
            
        except Exception as e:
            yield json.dumps({
                "type": "error",
                "content": f"处理请求时出现错误：{str(e)}",
                "agent": "system"
            }) + "\n"

# 创建全局实例
test_chat_service = TestChatService()
