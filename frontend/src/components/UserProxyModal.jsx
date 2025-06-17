import React, { useState, useEffect } from 'react'
import { Modal, Input, Button, Typography, Space, Alert, Spin } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, UserOutlined } from '@ant-design/icons'
import './UserProxyModal.css'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

function UserProxyModal({ 
  visible, 
  onApprove, 
  onReject, 
  onClose,
  agentContent = '',
  agentName = 'User Proxy Agent',
  isWaiting = false 
}) {
  const [inputValue, setInputValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 重置状态当模态框打开时
  useEffect(() => {
    if (visible) {
      setInputValue('')
      setIsSubmitting(false)
    }
  }, [visible])

  // 处理审批
  const handleApprove = async () => {
    setIsSubmitting(true)
    try {
      await onApprove(inputValue || 'APPROVE')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理拒绝
  const handleReject = async () => {
    setIsSubmitting(true)
    try {
      await onReject(inputValue || 'REJECT')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理键盘事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      handleApprove()
    }
  }

  return (
    <Modal
      title={
        <div className="user-proxy-modal-title">
          <UserOutlined className="modal-icon" />
          <span>用户代理审批</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      className="user-proxy-modal"
      maskClosable={false}
      keyboard={false}
    >
      <div className="modal-content">
        {/* 等待状态提示 */}
        {isWaiting && (
          <Alert
            message="等待用户审批"
            description="系统正在等待您的审批决定，请仔细查看生成的内容并做出选择。"
            type="info"
            showIcon
            className="waiting-alert"
          />
        )}

        {/* 智能体生成的内容 */}
        {agentContent && (
          <div className="agent-content-section">
            <Title level={5}>
              <span className="agent-name">{agentName}</span> 生成的内容：
            </Title>
            <div className="agent-content">
              <pre className="content-preview">{agentContent}</pre>
            </div>
          </div>
        )}

        {/* 用户输入区域 */}
        <div className="user-input-section">
          <Title level={5}>您的决定：</Title>
          <Paragraph type="secondary" className="input-hint">
            请输入您的审批意见。输入 "APPROVE" 批准继续，或输入其他内容提供修改建议。
          </Paragraph>
          
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入 APPROVE 批准，或输入修改建议..."
            rows={4}
            className="approval-input"
            disabled={isSubmitting}
          />
          
          <div className="input-tips">
            <Text type="secondary" className="tip-text">
              💡 提示：按 Ctrl+Enter 快速批准
            </Text>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="modal-actions">
          <Space size="middle">
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleApprove}
              loading={isSubmitting}
              className="approve-btn"
            >
              批准继续
            </Button>
            
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={handleReject}
              loading={isSubmitting}
              className="reject-btn"
            >
              拒绝/修改
            </Button>
            
            <Button
              onClick={onClose}
              disabled={isSubmitting}
              className="cancel-btn"
            >
              取消
            </Button>
          </Space>
        </div>

        {/* 加载状态 */}
        {isSubmitting && (
          <div className="submitting-overlay">
            <Spin size="large" />
            <Text className="submitting-text">正在提交您的决定...</Text>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default UserProxyModal
