import React from 'react'
import { Card, Row, Col, Typography, Button, Space } from 'antd'
import { 
  RobotOutlined, 
  MessageOutlined, 
  BulbOutlined, 
  RocketOutlined,
  ArrowRightOutlined,
  StarOutlined,
  ThunderboltOutlined,
  SafetyOutlined
} from '@ant-design/icons'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import './HomePage.css'

const { Title, Paragraph, Text } = Typography

const HomePage = () => {
  const navigate = useNavigate()

  const features = [
    {
      icon: <RobotOutlined />,
      title: '智能对话',
      description: '基于先进的AI技术，提供自然流畅的对话体验',
      color: '#1890ff'
    },
    {
      icon: <ThunderboltOutlined />,
      title: '快速响应',
      description: '毫秒级响应速度，实时流式输出，无需等待',
      color: '#52c41a'
    },
    {
      icon: <BulbOutlined />,
      title: '智能分析',
      description: '深度理解用户意图，提供精准的解答和建议',
      color: '#faad14'
    },
    {
      icon: <SafetyOutlined />,
      title: '安全可靠',
      description: '企业级安全保障，保护您的隐私和数据安全',
      color: '#f5222d'
    }
  ]

  const useCases = [
    {
      title: '学习助手',
      description: '帮助您解答学习中的疑问，提供知识点解释',
      icon: '📚'
    },
    {
      title: '工作伙伴',
      description: '协助处理工作任务，提高工作效率',
      icon: '💼'
    },
    {
      title: '创意灵感',
      description: '激发创意思维，提供创新想法和建议',
      icon: '💡'
    },
    {
      title: '生活顾问',
      description: '解答生活中的各种问题，提供实用建议',
      icon: '🏠'
    }
  ]

  return (
    <div className="home-page">
      {/* Hero Section */}
      <motion.div 
        className="hero-section"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="hero-content">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <RobotOutlined className="hero-icon" />
          </motion.div>
          
          <Title level={1} className="hero-title">
            但问智能
          </Title>
          
          <Paragraph className="hero-description">
            您的专属AI智能助手，随时为您提供智能对话服务
            <br />
            让AI成为您学习、工作和生活的得力伙伴
          </Paragraph>
          
          <Space size="large" className="hero-actions">
            <Button 
              type="primary" 
              size="large" 
              icon={<MessageOutlined />}
              onClick={() => navigate('/ai/chat')}
              className="primary-btn"
            >
              开始对话
              <ArrowRightOutlined />
            </Button>
            
            <Button 
              size="large" 
              icon={<StarOutlined />}
              className="secondary-btn"
            >
              了解更多
            </Button>
          </Space>
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.div 
        className="features-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <Title level={2} className="section-title">
          核心特性
        </Title>
        
        <Row gutter={[24, 24]}>
          {features.map((feature, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
              >
                <Card 
                  className="feature-card"
                  hoverable
                  bordered={false}
                >
                  <div className="feature-icon" style={{ color: feature.color }}>
                    {feature.icon}
                  </div>
                  <Title level={4} className="feature-title">
                    {feature.title}
                  </Title>
                  <Paragraph className="feature-description">
                    {feature.description}
                  </Paragraph>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      </motion.div>

      {/* Use Cases Section */}
      <motion.div 
        className="use-cases-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        <Title level={2} className="section-title">
          应用场景
        </Title>
        
        <Row gutter={[24, 24]}>
          {useCases.map((useCase, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 1.0 + index * 0.1 }}
              >
                <Card 
                  className="use-case-card"
                  hoverable
                  bordered={false}
                >
                  <div className="use-case-icon">
                    {useCase.icon}
                  </div>
                  <Title level={4} className="use-case-title">
                    {useCase.title}
                  </Title>
                  <Paragraph className="use-case-description">
                    {useCase.description}
                  </Paragraph>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      </motion.div>

      {/* CTA Section */}
      <motion.div 
        className="cta-section"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
      >
        <Card className="cta-card" bordered={false}>
          <RocketOutlined className="cta-icon" />
          <Title level={3} className="cta-title">
            准备好开始了吗？
          </Title>
          <Paragraph className="cta-description">
            立即体验但问智能，让AI助力您的每一天
          </Paragraph>
          <Button 
            type="primary" 
            size="large" 
            icon={<MessageOutlined />}
            onClick={() => navigate('/ai/chat')}
            className="cta-button"
          >
            立即开始对话
          </Button>
        </Card>
      </motion.div>
    </div>
  )
}

export default HomePage
