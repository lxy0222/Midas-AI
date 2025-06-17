import React, { useState, useEffect } from 'react'
import {
  Drawer,
  List,
  Typography,
  Button,
  Input,
  Space,
  Popconfirm,
  message,
  Empty,
  Tooltip,
  Tag
} from 'antd'
import {
  HistoryOutlined,
  EditOutlined,
  DeleteOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons'
import './ChatHistory.css'

const { Title, Text } = Typography

function ChatHistory({ visible, onClose, currentSessionId, onSessionSelect }) {
  const [chatSessions, setChatSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')

  // 加载对话历史
  const loadChatHistory = async () => {
    setLoading(true)
    try {
      // 从localStorage获取对话历史
      const savedSessions = localStorage.getItem('chatSessions')
      if (savedSessions) {
        const sessions = JSON.parse(savedSessions)
        // 按时间降序排序
        const sortedSessions = sessions.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
        setChatSessions(sortedSessions)
      }
    } catch (error) {
      console.error('加载对话历史失败:', error)
      message.error('加载对话历史失败')
    } finally {
      setLoading(false)
    }
  }

  // 保存对话会话
  const saveSession = (sessionId, title, messages) => {
    try {
      const savedSessions = localStorage.getItem('chatSessions')
      let sessions = savedSessions ? JSON.parse(savedSessions) : []
      
      const existingIndex = sessions.findIndex(s => s.id === sessionId)
      const sessionData = {
        id: sessionId,
        title: title || `对话 ${new Date().toLocaleString()}`,
        messageCount: messages.length,
        lastMessage: messages.length > 0 ? messages[messages.length - 1].content.slice(0, 50) + '...' : '',
        lastUpdated: new Date().toISOString(),
        createdAt: existingIndex >= 0 ? sessions[existingIndex].createdAt : new Date().toISOString(),
        messages: messages
      }

      if (existingIndex >= 0) {
        sessions[existingIndex] = sessionData
      } else {
        sessions.push(sessionData)
      }

      // 保持最多50个会话
      if (sessions.length > 50) {
        sessions = sessions.slice(0, 50)
      }

      localStorage.setItem('chatSessions', JSON.stringify(sessions))
      loadChatHistory() // 重新加载以更新排序
    } catch (error) {
      console.error('保存对话会话失败:', error)
    }
  }

  // 删除对话
  const deleteSession = async (sessionId) => {
    try {
      const savedSessions = localStorage.getItem('chatSessions')
      if (savedSessions) {
        const sessions = JSON.parse(savedSessions)
        const filteredSessions = sessions.filter(s => s.id !== sessionId)
        localStorage.setItem('chatSessions', JSON.stringify(filteredSessions))
        setChatSessions(filteredSessions)
        message.success('对话已删除')
      }
    } catch (error) {
      console.error('删除对话失败:', error)
      message.error('删除对话失败')
    }
  }

  // 重命名对话
  const renameSession = async (sessionId, newName) => {
    try {
      const savedSessions = localStorage.getItem('chatSessions')
      if (savedSessions) {
        const sessions = JSON.parse(savedSessions)
        const sessionIndex = sessions.findIndex(s => s.id === sessionId)
        if (sessionIndex >= 0) {
          sessions[sessionIndex].title = newName
          sessions[sessionIndex].lastUpdated = new Date().toISOString()
          localStorage.setItem('chatSessions', JSON.stringify(sessions))
          setChatSessions(sessions.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)))
          message.success('对话名称已更新')
        }
      }
    } catch (error) {
      console.error('重命名对话失败:', error)
      message.error('重命名对话失败')
    }
  }

  // 开始编辑
  const startEdit = (session) => {
    setEditingId(session.id)
    setEditingName(session.title)
  }

  // 确认编辑
  const confirmEdit = () => {
    if (editingName.trim()) {
      renameSession(editingId, editingName.trim())
    }
    setEditingId(null)
    setEditingName('')
  }

  // 取消编辑
  const cancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  // 选择对话
  const selectSession = (session) => {
    onSessionSelect(session)
    onClose()
  }

  // 格式化时间
  const formatTime = (timeString) => {
    const time = new Date(timeString)
    const now = new Date()
    const diffMs = now - time
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 7) return `${diffDays}天前`
    return time.toLocaleDateString()
  }

  useEffect(() => {
    if (visible) {
      loadChatHistory()
    }
  }, [visible])

  // 暴露保存会话的方法给父组件
  React.useImperativeHandle(React.forwardRef(() => null), () => ({
    saveSession
  }))

  return (
    <Drawer
      title={
        <Space>
          <HistoryOutlined />
          <span>对话历史</span>
          <Tag color="blue">{chatSessions.length}</Tag>
        </Space>
      }
      placement="right"
      width={400}
      open={visible}
      onClose={onClose}
      className="chat-history-drawer"
    >
      <div className="chat-history-content">
        {chatSessions.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无对话历史"
            style={{ marginTop: 100 }}
          />
        ) : (
          <List
            dataSource={chatSessions}
            loading={loading}
            renderItem={(session) => (
              <div>
                <List.Item
                  className={`chat-session-item ${session.id === currentSessionId ? 'active' : ''}`}
                  actions={[
                    <Tooltip title="编辑名称">
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation()
                          startEdit(session)
                        }}
                      />
                    </Tooltip>,
                    <Popconfirm
                      title="确定删除这个对话吗？"
                      onConfirm={() => deleteSession(session.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Tooltip title="删除对话">
                        <Button
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          danger
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Tooltip>
                    </Popconfirm>
                  ]}
                  onClick={() => selectSession(session)}
                >
                  <List.Item.Meta
                    avatar={<MessageOutlined className="session-icon" />}
                    title={
                      editingId === session.id ? (
                        <div className="edit-title-container">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onPressEnter={confirmEdit}
                            size="small"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Space size="small">
                            <Button
                              type="text"
                              size="small"
                              icon={<CheckOutlined />}
                              onClick={(e) => {
                                e.stopPropagation()
                                confirmEdit()
                              }}
                            />
                            <Button
                              type="text"
                              size="small"
                              icon={<CloseOutlined />}
                              onClick={(e) => {
                                e.stopPropagation()
                                cancelEdit()
                              }}
                            />
                          </Space>
                        </div>
                      ) : (
                        <div className="session-title">{session.title}</div>
                      )
                    }
                    description={
                      <div className="session-description">
                        <Text type="secondary" className="last-message">
                          {session.lastMessage}
                        </Text>
                        <div className="session-meta">
                          <Space size="small">
                            <ClockCircleOutlined />
                            <Text type="secondary" className="session-time">
                              {formatTime(session.lastUpdated)}
                            </Text>
                            <Text type="secondary" className="message-count">
                              {session.messageCount} 条消息
                            </Text>
                          </Space>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              </div>
            )}
          />
        )}
      </div>
    </Drawer>
  )
}

// 导出保存会话的工具函数
export const saveChatSession = (sessionId, title, messages) => {
  try {
    const savedSessions = localStorage.getItem('chatSessions')
    let sessions = savedSessions ? JSON.parse(savedSessions) : []
    
    const existingIndex = sessions.findIndex(s => s.id === sessionId)
    const sessionData = {
      id: sessionId,
      title: title || `对话 ${new Date().toLocaleString()}`,
      messageCount: messages.length,
      lastMessage: messages.length > 0 ? messages[messages.length - 1].content.slice(0, 50) + '...' : '',
      lastUpdated: new Date().toISOString(),
      createdAt: existingIndex >= 0 ? sessions[existingIndex].createdAt : new Date().toISOString(),
      messages: messages
    }

    if (existingIndex >= 0) {
      sessions[existingIndex] = sessionData
    } else {
      sessions.push(sessionData)
    }

    // 保持最多50个会话
    if (sessions.length > 50) {
      sessions = sessions.slice(0, 50)
    }

    localStorage.setItem('chatSessions', JSON.stringify(sessions))
  } catch (error) {
    console.error('保存对话会话失败:', error)
  }
}

export default ChatHistory
