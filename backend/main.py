# -*- coding: utf-8 -*-
import asyncio
import json
from typing import AsyncGenerator, Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from chat_service import ChatService
from test_chat_service import test_chat_service
from file_service import file_service

app = FastAPI(title="AutoGen Chat API", version="1.0.0")

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置具体的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化聊天服务
chat_service = ChatService()

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"



class FileAnalysisRequest(BaseModel):
    message: str
    session_id: str = "default"
    file_name: str
    file_type: str
    file_content: str

class ChatResponse(BaseModel):
    content: str
    type: str = "text"
    finished: bool = False

class FileUploadResponse(BaseModel):
    success: bool
    message: str
    file_info: Optional[dict] = None
    content: Optional[str] = None

class MarkerConfigRequest(BaseModel):
    enable_llm: bool = False
    llm_service: Optional[str] = None
    openai_base_url: Optional[str] = None
    openai_model: Optional[str] = None
    openai_api_key: Optional[str] = None
    use_marker: bool = True

class UserProxyResponse(BaseModel):
    session_id: str
    user_input: str
    approved: bool = True

class UserFeedback(BaseModel):
    content: str

@app.get("/")
async def root():
    return {"message": "AutoGen Chat API is running"}

@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """流式聊天接口 - 使用真实大模型"""

    async def generate_response() -> AsyncGenerator[str, None]:
        try:
            # 使用真实的AutoGen聊天服务
            async for chunk in chat_service.chat_stream(request.message, request.session_id):
                # chat_service已经返回了JSON格式的字符串，直接输出
                yield f"data: {chunk.strip()}\n\n"

            # 发送结束事件
            yield f"data: {json.dumps({'type': 'complete', 'message': 'All agents completed'})}\n\n"

        except Exception as e:
            error_data = {
                "type": "error",
                "content": f"Error: {str(e)}",
                "finished": True
            }
            yield f"data: {json.dumps(error_data)}\n\n"

    return StreamingResponse(
        generate_response(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
        }
    )

@app.post("/chat/stream/demo")
async def chat_stream_demo(request: ChatRequest):
    """流式聊天接口 - 使用演示服务（智能体时间轴）"""

    async def generate_response() -> AsyncGenerator[str, None]:
        try:
            # 直接使用测试服务的流式输出
            async for chunk in test_chat_service.chat_stream(request.message, request.session_id):
                yield f"data: {chunk.strip()}\n\n"

        except Exception as e:
            error_data = {
                "type": "error",
                "content": f"Error: {str(e)}",
                "finished": True
            }
            yield f"data: {json.dumps(error_data)}\n\n"

    return StreamingResponse(
        generate_response(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
        }
    )

@app.post("/chat")
async def chat(request: ChatRequest):
    """非流式聊天接口"""
    try:
        response = await chat_service.chat(request.message, request.session_id)
        return ChatResponse(content=response, finished=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/chat/session/{session_id}")
async def clear_session(session_id: str):
    """清除会话历史"""
    chat_service.clear_session(session_id)
    return {"message": f"Session {session_id} cleared"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/upload", response_model=FileUploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """文件上传接口"""
    try:
        print(f"收到文件上传请求: {file.filename}, 大小: {file.size}")

        # 检查文件大小 (10MB限制)
        if file.size and file.size > 10 * 1024 * 1024:
            print(f"文件大小超限: {file.size}")
            return FileUploadResponse(
                success=False,
                message="文件大小超过10MB限制"
            )

        # 检查文件类型
        if not file_service.is_supported_file(file.filename):
            print(f"不支持的文件类型: {file.filename}")
            return FileUploadResponse(
                success=False,
                message=f"不支持的文件类型: {file.filename}"
            )

        # 读取文件内容
        file_content = await file.read()
        print(f"文件内容读取完成，大小: {len(file_content)}")

        # 保存文件
        file_path = await file_service.save_uploaded_file(file_content, file.filename)
        print(f"文件保存成功: {file_path}")

        # 提取文件内容
        extraction_result = await file_service.extract_text_from_file(file_path, file.filename)
        print(f"文件内容提取结果: {extraction_result['success']}")

        if extraction_result['success']:
            return FileUploadResponse(
                success=True,
                message="文件上传并解析成功",
                file_info={
                    "filename": file.filename,
                    "size": len(file_content),
                    "type": file_service.get_file_type(file.filename),
                    "metadata": extraction_result['metadata']
                },
                content=extraction_result['content']
            )
        else:
            print(f"文件解析失败: {extraction_result['error']}")
            return FileUploadResponse(
                success=False,
                message=f"文件解析失败: {extraction_result['error']}"
            )

    except Exception as e:
        print(f"文件上传异常: {str(e)}")
        import traceback
        traceback.print_exc()
        return FileUploadResponse(
            success=False,
            message=f"文件上传失败: {str(e)}"
        )





@app.post("/chat/file-analysis/stream")
async def chat_file_analysis_stream(request: FileAnalysisRequest):
    """文件分析流式聊天接口 - 隐式处理文件内容"""

    async def generate_response() -> AsyncGenerator[str, None]:
        try:
            # 使用专门的文件分析服务
            async for chunk in chat_service.file_analysis_stream(
                request.message,
                request.file_content,
                request.session_id
            ):
                yield f"data: {chunk.strip()}\n\n"

            # 发送结束事件
            yield f"data: {json.dumps({'type': 'complete', 'message': 'Analysis completed'})}\n\n"

        except Exception as e:
            error_data = {
                "type": "error",
                "content": f"Error: {str(e)}",
                "finished": True
            }
            yield f"data: {json.dumps(error_data)}\n\n"

    return StreamingResponse(
        generate_response(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
        }
    )

@app.post("/chat/feedback")
async def handle_user_feedback(request: UserFeedback):
    """接收用户反馈并放入队列"""
    try:
        await chat_service.put_feedback({"content": request.content})
        return {
            "success": True,
            "message": "用户反馈已接收"
        }
    except Exception as e:
        print(f"处理用户反馈失败: {str(e)}")
        return {
            "success": False,
            "message": f"处理失败: {str(e)}"
        }

@app.post("/chat/user-proxy-response")
async def handle_user_proxy_response(request: UserProxyResponse):
    """处理用户代理审批响应"""
    try:
        # 将用户输入传递给聊天服务
        result = await chat_service.handle_user_proxy_response(
            request.session_id,
            request.user_input,
            request.approved
        )

        return {
            "success": True,
            "message": "用户审批已处理",
            "result": result
        }
    except Exception as e:
        print(f"处理用户代理响应失败: {str(e)}")
        return {
            "success": False,
            "message": f"处理失败: {str(e)}"
        }

@app.post("/marker/config")
async def configure_marker(request: MarkerConfigRequest):
    """配置Marker文档处理服务"""
    try:
        # 启用或禁用Marker
        if request.use_marker:
            file_service.enable_marker()
        else:
            file_service.disable_marker()

        # 配置LLM服务
        if request.enable_llm and request.openai_api_key:
            llm_config = {
                "use_llm": True,
                "llm_service": request.llm_service or "marker.services.openai.OpenAIService",
                "openai_base_url": request.openai_base_url or "https://api.openai.com/v1",
                "openai_model": request.openai_model or "gpt-4o-mini",
                "openai_api_key": request.openai_api_key
            }
            file_service.enable_marker_llm(llm_config)

        return {
            "success": True,
            "message": "Marker配置更新成功",
            "config": {
                "use_marker": request.use_marker,
                "llm_enabled": request.enable_llm
            }
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"配置失败: {str(e)}"
        }

@app.get("/marker/status")
async def get_marker_status():
    """获取Marker服务状态"""
    return {
        "marker_enabled": file_service.use_marker,
        "supported_formats": file_service.get_supported_formats(),
        "service_status": "active"
    }

@app.get("/test/user-proxy-event")
async def test_user_proxy_event():
    """测试用户代理事件"""
    async def generate_test_event():
        # 发送一些普通消息
        yield f"data: {json.dumps({'type': 'chunk', 'content': '正在生成测试用例...'})}\n\n"

        # 发送user_proxy事件
        yield f"data: {json.dumps({'type': 'user_proxy', 'content': '这是测试生成的内容，请审批', 'agent': 'test_agent', 'message': '需要用户审批才能继续'})}\n\n"

    return StreamingResponse(
        generate_test_event(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
