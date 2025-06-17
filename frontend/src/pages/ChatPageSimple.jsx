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
  FileTextOutlined
} from '@ant-design/icons'
import { motion, AnimatePresence } from 'framer-motion'
import MessageRenderer from '../components/MessageRenderer'
import AgentTimeline from '../components/AgentTimeline'
import FileUpload from '../components/FileUpload'
import './ChatPage.css'

const { Title, Text } = Typography
const { TextArea } = Input
const { Panel } = Collapse

function ChatPageSimple() {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [sessionId] = useState(() => `session_${Date.now()}`)
  const [currentAgents, setCurrentAgents] = useState([])
  const [currentAgent, setCurrentAgent] = useState(null)
  const [useDemo, setUseDemo] = useState(false) // 是否使用演示模式
  const [selectedFile, setSelectedFile] = useState(null) // 选中的文件
  const [showFileUpload, setShowFileUpload] = useState(false) // 是否显示文件上传
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
                  const newAgent = {
                    id: data.agent,
                    agent_info: data.agent_info,
                    content: '',
                    status: 'working',
                    startTime: new Date().toISOString()
                  }
                  
                  agentsMap.set(data.agent, newAgent)
                  setCurrentAgent(data.agent)
                  setCurrentAgents(Array.from(agentsMap.values()))
                  
                } else if (data.type === 'chunk' && data.content) {
                  // 处理智能体内容
                  if (data.agent && agentsMap.has(data.agent)) {
                    const agent = agentsMap.get(data.agent)
                    agent.content += data.content
                    agentsMap.set(data.agent, agent)
                    setCurrentAgents(Array.from(agentsMap.values()))

                    setMessages(prev => prev.map(msg =>
                      msg.id === assistantMessage.id
                        ? {
                            ...msg,
                            agents: Array.from(agentsMap.values())
                          }
                        : msg
                    ))
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
                  if (agentsMap.has(data.agent)) {
                    const agent = agentsMap.get(data.agent)
                    agent.status = 'completed'
                    agent.endTime = new Date().toISOString()
                    agentsMap.set(data.agent, agent)
                    setCurrentAgents(Array.from(agentsMap.values()))
                  }
                  
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

  // 清除对话
  const clearChat = async () => {
    try {
      await fetch(`/api/chat/session/${sessionId}`, {
        method: 'DELETE'
      })
      setMessages([])
      setCurrentAgents([])
      setCurrentAgent(null)
      setSelectedFile(null)
      setShowFileUpload(false)
      message.success('对话已清除')
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

  return (
    <div className="chat-page">
      <div className="chat-header">
        <div className="header-left">
          <Title level={4} className="chat-title">智能对话</Title>
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
                        {msg.timestamp.toLocaleTimeString()}
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
    </div>
  )
}

export default ChatPageSimple
