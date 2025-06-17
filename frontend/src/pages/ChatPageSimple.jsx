import React, { useState, useRef, useEffect } from 'react'
import { Typography, Button, Space, message, Input, Avatar, Switch, Tooltip, Collapse } from 'antd'
import {
  SendOutlined,
  MoreOutlined,
  ShareAltOutlined,
  EditOutlined,
  RobotOutlined,
  UserOutlined,
  ExperimentOutlined,
  ThunderboltOutlined,
  PaperClipOutlined,
  FileTextOutlined,
  HistoryOutlined
} from '@ant-design/icons'
import { motion, AnimatePresence } from 'framer-motion'
import MessageRenderer from '../components/MessageRenderer'
import AgentTimeline from '../components/AgentTimeline'
import FileUpload from '../components/FileUpload'
import ChatHistory, { saveChatSession } from '../components/ChatHistory'
import UserProxyModal from '../components/UserProxyModal'
import './ChatPage.css'

const { Title, Text } = Typography
const { TextArea } = Input
const { Panel } = Collapse

function ChatPageSimple() {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [sessionId, setSessionId] = useState(() => `session_${Date.now()}`)
  const [currentAgents, setCurrentAgents] = useState([])
  const [currentAgent, setCurrentAgent] = useState(null)
  const [useDemo, setUseDemo] = useState(false) // 是否使用演示模式
  const [selectedFile, setSelectedFile] = useState(null) // 选中的文件
  const [showFileUpload, setShowFileUpload] = useState(false) // 是否显示文件上传
  const [showHistory, setShowHistory] = useState(false) // 是否显示对话历史
  const [chatTitle, setChatTitle] = useState('') // 当前对话标题
  const [userProxyModal, setUserProxyModal] = useState({
    visible: false,
    agentContent: '',
    agentName: '',
    isWaiting: false,
    pendingResponse: null
  })
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 自动保存对话
  useEffect(() => {
    if (messages.length > 0) {
      const title = chatTitle || `对话 ${new Date().toLocaleString()}`
      saveChatSession(sessionId, title, messages)
    }
  }, [messages, sessionId, chatTitle])

  // 发送消息
  const sendMessage = async () => {
    if (!inputValue.trim() || isStreaming) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      file: selectedFile ? {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size
      } : null
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsStreaming(true)

    // 重置智能体状态
    setCurrentAgents([])
    setCurrentAgent(null)

    // 创建助手消息
    const assistantMessage = {
      id: Date.now() + 1,
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      streaming: true,
      agents: []
    }

    setMessages(prev => [...prev, assistantMessage])

    try {
      let endpoint, requestOptions

      if (selectedFile) {
        // 有文件时，使用专门的文件分析端点
        endpoint = '/api/chat/file-analysis/stream'

        requestOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage.content,
            session_id: sessionId,
            file_name: selectedFile.name,
            file_type: selectedFile.type,
            file_content: selectedFile.content
          })
        }
      } else {
        // 没有文件时使用普通端点
        endpoint = useDemo ? '/api/chat/stream/demo' : '/api/chat/stream'
        requestOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage.content,
            session_id: sessionId
          })
        }
      }

      const response = await fetch(endpoint, requestOptions)

      if (!response.ok) {
        throw new Error('网络请求失败')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let agentsMap = new Map()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6)
              if (jsonStr.trim()) {
                const data = JSON.parse(jsonStr)
                console.log('Received data:', data)
                
                if (data.type === 'agent_start') {
                  // 为每个智能体启动创建一个唯一的实例ID
                  const timestamp = Date.now()
                  const uniqueId = `${data.agent}_${timestamp}`

                  const newAgent = {
                    id: uniqueId,
                    originalId: data.agent, // 保存原始智能体ID
                    agent_info: data.agent_info,
                    content: '',
                    status: 'working',
                    startTime: new Date().toISOString(),
                    order: agentsMap.size // 用于排序
                  }

                  agentsMap.set(uniqueId, newAgent)
                  setCurrentAgent(uniqueId)
                  setCurrentAgents(Array.from(agentsMap.values()))
                  
                } else if (data.type === 'chunk' && data.content) {
                  // 处理智能体内容
                  if (data.agent) {
                    // 查找当前正在工作的智能体实例
                    let targetAgent = null
                    let targetAgentId = null

                    // 查找具有相同originalId且状态为working的智能体
                    for (const [id, agent] of agentsMap.entries()) {
                      if (agent.originalId === data.agent && agent.status === 'working') {
                        targetAgent = agent
                        targetAgentId = id
                        break
                      }
                    }

                    if (targetAgent && targetAgentId) {
                      targetAgent.content += data.content
                      agentsMap.set(targetAgentId, targetAgent)
                      setCurrentAgents(Array.from(agentsMap.values()))

                      setMessages(prev => prev.map(msg =>
                        msg.id === assistantMessage.id
                          ? {
                              ...msg,
                              agents: Array.from(agentsMap.values())
                            }
                          : msg
                      ))
                    }
                  } else {
                    // 处理普通文本内容（没有智能体信息时）
                    setMessages(prev => prev.map(msg =>
                      msg.id === assistantMessage.id
                        ? {
                            ...msg,
                            content: msg.content + data.content
                          }
                        : msg
                    ))
                  }
                  
                } else if (data.type === 'agent_end') {
                  // 查找要结束的智能体实例
                  for (const [id, agent] of agentsMap.entries()) {
                    if (agent.originalId === data.agent && agent.status === 'working') {
                      agent.status = 'completed'
                      agent.endTime = new Date().toISOString()
                      agentsMap.set(id, agent)
                      setCurrentAgents(Array.from(agentsMap.values()))
                      break
                    }
                  }
                  
                } else if (data.type === 'user_proxy') {
                  // 用户代理需要审批
                  console.log('User proxy approval needed:', data)

                  // 为用户代理创建唯一实例
                  const timestamp = Date.now()
                  const userProxyId = `user_proxy_${timestamp}`

                  const userProxyAgent = {
                    id: userProxyId,
                    originalId: 'user_proxy',
                    agent_info: {
                      name: 'User Proxy Agent',
                      description: '等待用户审批',
                      avatar: '👤',
                      color: '#ff7875'
                    },
                    content: data.content || '等待用户审批...',
                    status: 'waiting',
                    startTime: new Date().toISOString(),
                    order: agentsMap.size
                  }

                  agentsMap.set(userProxyId, userProxyAgent)
                  setCurrentAgent(userProxyId)
                  setCurrentAgents(Array.from(agentsMap.values()))

                  // 更新消息显示
                  setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessage.id
                      ? {
                          ...msg,
                          agents: Array.from(agentsMap.values())
                        }
                      : msg
                  ))

                  setUserProxyModal({
                    visible: true,
                    agentContent: data.content || '',
                    agentName: data.agent || 'User Proxy Agent',
                    isWaiting: true,
                    pendingResponse: { userProxyId } // 传递user proxy ID
                  })
                  // 不要return，让流处理继续

                } else if (data.type === 'complete') {
                  console.log('All agents completed:', data.message)

                } else if (data.type === 'error') {
                  message.error(data.content)
                  setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessage.id
                      ? {
                          ...msg,
                          content: data.content,
                          streaming: false,
                          agents: Array.from(agentsMap.values())
                        }
                      : msg
                  ))
                }
              }
            } catch (e) {
              console.warn('解析流数据失败:', e, jsonStr)
            }
          }
        }
      }
      
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessage.id
          ? {
              ...msg,
              streaming: false,
              agents: Array.from(agentsMap.values())
            }
          : msg
      ))
      setCurrentAgent(null)
    } catch (error) {
      console.error('发送消息失败:', error)
      message.error('发送消息失败，请重试')
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessage.id
          ? {
              ...msg,
              content: '抱歉，发送消息时出现错误，请重试。',
              streaming: false,
              agents: []
            }
          : msg
      ))
    } finally {
      setIsStreaming(false)
      setCurrentAgent(null)
      // 清理文件状态
      setSelectedFile(null)
      setShowFileUpload(false)
    }
  }

  // 处理用户审批
  const handleUserApproval = async (userInput) => {
    try {
      // 发送用户反馈到后端的feedback队列
      const feedbackResponse = await fetch('http://localhost:8000/chat/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: userInput
        })
      })

      if (!feedbackResponse.ok) {
        throw new Error('发送用户反馈失败')
      }

      // 更新user_proxy智能体状态
      const { userProxyId } = userProxyModal.pendingResponse || {}
      if (userProxyId) {
        setCurrentAgents(prev => prev.map(agent =>
          agent.id === userProxyId
            ? {
                ...agent,
                content: `用户反馈: ${userInput}`,
                status: 'completed',
                endTime: new Date().toISOString()
              }
            : agent
        ))

        // 更新消息中的智能体状态
        setMessages(prev => prev.map(msg =>
          msg.type === 'assistant' && msg.streaming
            ? {
                ...msg,
                agents: prev.find(m => m.id === msg.id)?.agents?.map(agent =>
                  agent.id === userProxyId
                    ? {
                        ...agent,
                        content: `用户反馈: ${userInput}`,
                        status: 'completed',
                        endTime: new Date().toISOString()
                      }
                    : agent
                ) || []
              }
            : msg
        ))
      }

      // 关闭模态框
      setUserProxyModal({
        visible: false,
        agentContent: '',
        agentName: '',
        isWaiting: false,
        pendingResponse: null
      })

      console.log('用户反馈已发送，流处理将自动继续...')

    } catch (error) {
      console.error('处理用户审批失败:', error)
      message.error('处理审批失败，请重试')
    }
  }



  // 处理审批拒绝
  const handleUserRejection = async (userInput) => {
    await handleUserApproval(userInput) // 使用相同的处理逻辑，后端会根据内容判断
  }

  // 关闭审批模态框
  const handleCloseUserProxyModal = () => {
    setUserProxyModal({
      visible: false,
      agentContent: '',
      agentName: '',
      isWaiting: false,
      pendingResponse: null
    })
    setIsStreaming(false)
    setCurrentAgent(null)
  }

  // 清除对话
  const clearChat = async () => {
    try {
      await fetch(`/api/chat/session/${sessionId}`, {
        method: 'DELETE'
      })
      // 创建新的会话ID
      const newSessionId = `session_${Date.now()}`
      setSessionId(newSessionId)
      setMessages([])
      setCurrentAgents([])
      setCurrentAgent(null)
      setSelectedFile(null)
      setShowFileUpload(false)
      setChatTitle('')
      message.success('新对话已开始')
    } catch (error) {
      console.error('清除对话失败:', error)
      message.error('清除对话失败')
    }
  }

  // 文件选择处理
  const handleFileSelect = (fileInfo) => {
    setSelectedFile(fileInfo)
    message.success(`文件 ${fileInfo.name} 已选择`)
  }

  // 文件移除处理
  const handleFileRemove = () => {
    setSelectedFile(null)
    setShowFileUpload(false)
  }

  // 切换文件上传面板
  const toggleFileUpload = () => {
    setShowFileUpload(!showFileUpload)
  }

  // 处理键盘事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // 选择历史对话
  const handleSessionSelect = (session) => {
    setSessionId(session.id)

    // 处理消息格式，确保timestamp是Date对象
    const processedMessages = (session.messages || []).map(msg => ({
      ...msg,
      timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp || Date.now()),
      id: msg.id || `msg_${Date.now()}_${Math.random()}`
    }))

    setMessages(processedMessages)
    setChatTitle(session.title)
    setCurrentAgents([])
    setCurrentAgent(null)
    setSelectedFile(null)
    setShowFileUpload(false)
    message.success(`已切换到对话: ${session.title}`)
  }

  // 切换对话历史显示
  const toggleHistory = () => {
    setShowHistory(!showHistory)
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <div className="header-left">
          <Title level={4} className="chat-title">
            {chatTitle || '智能对话'}
          </Title>
        </div>
        <div className="header-right">
          <Space>
            <Tooltip title={useDemo ? "切换到真实大模型" : "切换到演示模式"}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ThunderboltOutlined style={{ color: useDemo ? '#ccc' : '#1890ff' }} />
                <Switch
                  checked={useDemo}
                  onChange={setUseDemo}
                  size="small"
                  checkedChildren={<ExperimentOutlined />}
                  unCheckedChildren={<ThunderboltOutlined />}
                />
                <ExperimentOutlined style={{ color: useDemo ? '#1890ff' : '#ccc' }} />
              </div>
            </Tooltip>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={clearChat}
              className="header-btn"
            >
              新对话
            </Button>
            <Button
              type="text"
              icon={<HistoryOutlined />}
              onClick={toggleHistory}
              className="header-btn"
            >
              历史
            </Button>
            <Button type="text" icon={<ShareAltOutlined />} className="header-btn" />
            <Button type="text" icon={<MoreOutlined />} className="header-btn" />
          </Space>
        </div>
      </div>

      <div className="chat-container">
        <div className="messages-container">
          <AnimatePresence>
            {messages.length === 0 ? (
              <motion.div 
                className="welcome-message"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <RobotOutlined className="welcome-icon" />
                <Title level={4} className="gradient-text">
                  欢迎使用Midas AI
                </Title>
                <Text className="welcome-text">
                  我是您的 AI 智能助手，有什么可以帮助您的吗？
                </Text>
              </motion.div>
            ) : (
              messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  className={`message-wrapper ${msg.type}-message`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={`message-bubble ${msg.type}`}>
                    <div className="message-header">
                      {msg.type === 'user' ? (
                        <UserOutlined className="message-icon user" />
                      ) : (
                        <RobotOutlined className="message-icon assistant" />
                      )}
                      <Text className="message-time">
                        {msg.timestamp instanceof Date ?
                          msg.timestamp.toLocaleTimeString() :
                          new Date(msg.timestamp).toLocaleTimeString()
                        }
                      </Text>
                    </div>
                    <div className="message-content">
                      {/* 显示文件信息 */}
                      {msg.file && (
                        <div className="message-file-info">
                          <Space>
                            <FileTextOutlined style={{ color: '#1890ff' }} />
                            <Text type="secondary">
                              附件: {msg.file.name} ({(msg.file.size / 1024).toFixed(1)} KB)
                            </Text>
                          </Space>
                        </div>
                      )}

                      {msg.type === 'assistant' && msg.agents && msg.agents.length > 0 ? (
                        <AgentTimeline
                          agents={msg.agents}
                          isStreaming={msg.streaming}
                          currentAgent={currentAgent}
                        />
                      ) : (
                        <MessageRenderer
                          content={msg.content}
                          isStreaming={msg.streaming}
                        />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          {/* 文件上传区域 */}
          {showFileUpload && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="file-upload-section"
            >
              <Collapse
                activeKey={showFileUpload ? ['1'] : []}
                ghost
                size="small"
              >
                <Panel
                  header="上传文件"
                  key="1"
                  extra={
                    <Button
                      type="text"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowFileUpload(false)
                      }}
                    >
                      收起
                    </Button>
                  }
                >
                  <FileUpload
                    onFileSelect={handleFileSelect}
                    onFileRemove={handleFileRemove}
                    disabled={isStreaming}
                  />
                </Panel>
              </Collapse>
            </motion.div>
          )}

          {/* 选中文件显示 */}
          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="selected-file-info"
            >
              <Space>
                <FileTextOutlined style={{ color: '#1890ff' }} />
                <Text>已选择: {selectedFile.name}</Text>
                <Button
                  type="text"
                  size="small"
                  onClick={handleFileRemove}
                  disabled={isStreaming}
                >
                  移除
                </Button>
              </Space>
            </motion.div>
          )}

          <div className="input-wrapper">
            <Button
              type="text"
              icon={<PaperClipOutlined />}
              onClick={toggleFileUpload}
              className="attach-button"
              disabled={isStreaming}
              title="上传文件"
            />
            <TextArea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={selectedFile ? "描述您想对文件进行的分析..." : "输入您的问题..."}
              className="chat-input"
              disabled={isStreaming}
              autoSize={{ minRows: 1, maxRows: 4 }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={sendMessage}
              loading={isStreaming}
              className="send-button"
              disabled={!inputValue.trim()}
            >
              发送
            </Button>
          </div>
        </div>
      </div>

      {/* 对话历史抽屉 */}
      <ChatHistory
        visible={showHistory}
        onClose={() => setShowHistory(false)}
        currentSessionId={sessionId}
        onSessionSelect={handleSessionSelect}
      />

      {/* 用户代理审批模态框 */}
      <UserProxyModal
        visible={userProxyModal.visible}
        onApprove={handleUserApproval}
        onReject={handleUserRejection}
        onClose={handleCloseUserProxyModal}
        agentContent={userProxyModal.agentContent}
        agentName={userProxyModal.agentName}
        isWaiting={userProxyModal.isWaiting}
      />
    </div>
  )
}

export default ChatPageSimple
