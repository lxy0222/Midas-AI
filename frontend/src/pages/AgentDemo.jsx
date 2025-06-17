import React, { useState } from 'react'
import { Card, Button, Typography, Space, Divider } from 'antd'
import { PlayCircleOutlined, RobotOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import AgentTimeline from '../components/AgentTimeline'

const { Title, Text, Paragraph } = Typography

const AgentDemo = () => {
  const [showDemo, setShowDemo] = useState(false)
  
  // 模拟智能体数据
  const demoAgents = [
    {
      id: "analyzer",
      agent_info: {
        name: "需求分析师",
        description: "负责分析用户需求，理解问题背景",
        avatar: "🔍",
        color: "#1890ff"
      },
      content: "正在分析您的问题：「如何优化网站性能」\n\n我理解您想了解的是网站性能优化的方法和最佳实践。这是一个涉及前端、后端、网络等多个方面的综合性问题。",
      status: "completed",
      startTime: new Date(Date.now() - 10000).toISOString(),
      endTime: new Date(Date.now() - 8000).toISOString()
    },
    {
      id: "researcher",
      agent_info: {
        name: "知识研究员", 
        description: "负责搜索和整理相关知识信息",
        avatar: "📚",
        color: "#52c41a"
      },
      content: "基于需求分析，我开始搜索相关信息...\n\n找到以下相关内容：\n• 前端优化：代码分割、懒加载、图片优化\n• 后端优化：缓存策略、数据库优化、CDN\n• 网络优化：HTTP/2、压缩、预加载\n• 监控工具：性能分析、用户体验监控",
      status: "completed",
      startTime: new Date(Date.now() - 8000).toISOString(),
      endTime: new Date(Date.now() - 5000).toISOString()
    },
    {
      id: "synthesizer",
      agent_info: {
        name: "内容整合师",
        description: "负责整合信息，生成最终答案",
        avatar: "⚡",
        color: "#722ed1"
      },
      content: "综合以上分析和研究结果，为您提供完整的网站性能优化方案：\n\n## 前端优化\n1. **代码优化**：使用代码分割和懒加载\n2. **资源优化**：压缩图片、使用WebP格式\n3. **缓存策略**：合理设置浏览器缓存\n\n## 后端优化\n1. **数据库优化**：索引优化、查询优化\n2. **服务器缓存**：Redis、Memcached\n3. **CDN部署**：静态资源分发\n\n## 监控与测试\n1. **性能监控**：使用工具持续监控\n2. **用户体验**：Core Web Vitals指标\n\n希望这个全面的优化方案对您有帮助！",
      status: "working",
      startTime: new Date(Date.now() - 5000).toISOString()
    }
  ]

  return (
    <div style={{ 
      padding: '24px',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <RobotOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 16 }} />
            <Title level={2}>智能体协作时间轴演示</Title>
            <Paragraph style={{ fontSize: 16, color: '#64748b' }}>
              展示多个AI智能体如何协作完成复杂任务，每个智能体都有自己的专业领域和职责
            </Paragraph>
          </div>

          <Divider />

          <div style={{ marginBottom: 24 }}>
            <Title level={4}>功能特点</Title>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>🔄 多智能体协作：</Text>
                <Text> 不同专业领域的智能体按顺序工作，各司其职</Text>
              </div>
              <div>
                <Text strong>⏱️ 时间轴展示：</Text>
                <Text> 清晰展示每个智能体的工作时间和状态</Text>
              </div>
              <div>
                <Text strong>🎨 可视化界面：</Text>
                <Text> 美观的界面设计，实时状态更新和动画效果</Text>
              </div>
              <div>
                <Text strong>📊 工作状态：</Text>
                <Text> 等待中、工作中、已完成等状态一目了然</Text>
              </div>
            </Space>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Button 
              type="primary" 
              size="large"
              icon={<PlayCircleOutlined />}
              onClick={() => setShowDemo(!showDemo)}
            >
              {showDemo ? '隐藏演示' : '查看演示'}
            </Button>
          </div>

          {showDemo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.5 }}
            >
              <Divider />
              <AgentTimeline 
                agents={demoAgents}
                isStreaming={true}
                currentAgent="synthesizer"
              />
            </motion.div>
          )}

          <Divider />

          <div style={{ textAlign: 'center' }}>
            <Title level={4}>如何体验</Title>
            <Paragraph>
              前往 <Text strong>AI服务 → 智能对话</Text> 页面，发送任何问题即可看到智能体协作的完整过程！
            </Paragraph>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

export default AgentDemo
