import React from 'react'
import { Timeline, Avatar, Typography, Card, Tag } from 'antd'
import { motion, AnimatePresence } from 'framer-motion'
import MessageRenderer from './MessageRenderer'
import './AgentTimeline.css'

const { Text, Title } = Typography

const AgentTimeline = ({ agents, isStreaming, currentAgent }) => {
  if (!agents || agents.length === 0) {
    return null
  }

  const timelineItems = agents.map((agent, index) => {
    const isActive = currentAgent === agent.id
    const isCompleted = agent.status === 'completed'
    const isWorking = agent.status === 'working'

    return {
      key: agent.id,
      dot: (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: isActive ? 1.2 : 1, 
            opacity: 1 
          }}
          transition={{ duration: 0.3 }}
          className={`agent-timeline-dot ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
        >
          <Avatar 
            size={isActive ? 48 : 40}
            style={{ 
              backgroundColor: agent.agent_info?.color || '#1890ff',
              fontSize: isActive ? '20px' : '16px',
              transition: 'all 0.3s ease'
            }}
          >
            {agent.agent_info?.avatar || '🤖'}
          </Avatar>
          {isWorking && (
            <div className="working-indicator">
              <div className="pulse-ring"></div>
              <div className="pulse-ring delay-1"></div>
              <div className="pulse-ring delay-2"></div>
            </div>
          )}
        </motion.div>
      ),
      children: (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="agent-timeline-content"
        >
          <Card 
            className={`agent-card ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
            bordered={false}
            size="small"
          >
            <div className="agent-header">
              <div className="agent-info">
                <Title level={5} className="agent-name">
                  {agent.agent_info?.name || agent.id}
                </Title>
                <Text className="agent-description">
                  {agent.agent_info?.description || '智能体'}
                </Text>
              </div>
              <div className="agent-status">
                {isWorking && (
                  <Tag color="processing" className="status-tag">
                    工作中
                  </Tag>
                )}
                {isCompleted && (
                  <Tag color="success" className="status-tag">
                    已完成
                  </Tag>
                )}
                {!isWorking && !isCompleted && (
                  <Tag color="default" className="status-tag">
                    等待中
                  </Tag>
                )}
              </div>
            </div>
            
            {agent.content && (
              <div className="agent-content">
                <MessageRenderer 
                  content={agent.content}
                  isStreaming={isWorking && isStreaming}
                />
              </div>
            )}
            
            {agent.startTime && (
              <div className="agent-timestamp">
                <Text type="secondary" className="timestamp">
                  开始时间: {new Date(agent.startTime).toLocaleTimeString()}
                </Text>
                {agent.endTime && (
                  <Text type="secondary" className="timestamp">
                    完成时间: {new Date(agent.endTime).toLocaleTimeString()}
                  </Text>
                )}
              </div>
            )}
          </Card>
        </motion.div>
      )
    }
  })

  return (
    <div className="agent-timeline-container">
      <div className="timeline-header">
        <Title level={4} className="timeline-title">
          🔄 智能体协作流程
        </Title>
        <Text className="timeline-subtitle">
          多个智能体正在协作为您提供最佳答案
        </Text>
      </div>
      
      <Timeline
        mode="left"
        items={timelineItems}
        className="agent-timeline"
      />
      
      {isStreaming && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="streaming-indicator"
        >
          <div className="streaming-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <Text className="streaming-text">智能体正在思考中...</Text>
        </motion.div>
      )}
    </div>
  )
}

export default AgentTimeline
