import React, { useState, useRef, useEffect } from 'react'
import { Typography, Button, Space, message, Input, Avatar, Switch, Tooltip } from 'antd'
import {
  SendOutlined,
  MoreOutlined,
  ShareAltOutlined,
  EditOutlined,
  RobotOutlined,
  UserOutlined,
  ExperimentOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import { motion, AnimatePresence } from 'framer-motion'
import MessageRenderer from '../components/MessageRenderer'
import AgentTimeline from '../components/AgentTimeline'
import './ChatPage.css'

const { Title, Text } = Typography
const { TextArea } = Input

function ChatPageSimple() {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [sessionId] = useState(() => `session_${Date.now()}`)
  const [currentAgents, setCurrentAgents] = useState([])
  const [currentAgent, setCurrentAgent] = useState(null)
  const [useDemo, setUseDemo] = useState(false) // 是否使用演示模式
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
      timestamp: new Date()
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
      const endpoint = useDemo ? '/api/chat/stream/demo' : '/api/chat/stream'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          session_id: sessionId
        })
      })

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
      message.success('对话已清除')
    } catch (error) {
      console.error('清除对话失败:', error)
      message.error('清除对话失败')
    }
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
                  欢迎使用但问智能
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
          <div className="input-wrapper">
            <TextArea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入您的问题..."
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
