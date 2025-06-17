import React, { useState } from 'react'
import { Button, Card, Typography, Space, message } from 'antd'
import { PlayCircleOutlined, UserOutlined } from '@ant-design/icons'
import UserProxyModal from './UserProxyModal'

const { Title, Paragraph, Text } = Typography

function UserProxyDemo() {
  const [modalVisible, setModalVisible] = useState(false)
  const [demoContent, setDemoContent] = useState('')

  // 模拟用户代理审批场景
  const startDemo = () => {
    const mockContent = `
测试用例生成结果：

1. 测试用例：用户登录功能
   - 输入：有效用户名和密码
   - 预期结果：成功登录并跳转到主页
   
2. 测试用例：密码错误场景
   - 输入：有效用户名和错误密码
   - 预期结果：显示错误提示信息
   
3. 测试用例：用户名为空场景
   - 输入：空用户名和有效密码
   - 预期结果：显示用户名必填提示

请审批以上测试用例是否符合要求。
    `.trim()

    setDemoContent(mockContent)
    setModalVisible(true)
  }

  // 处理审批
  const handleApprove = async (userInput) => {
    console.log('用户批准:', userInput)
    message.success('测试用例已批准，继续执行...')
    setModalVisible(false)
  }

  // 处理拒绝
  const handleReject = async (userInput) => {
    console.log('用户拒绝/修改建议:', userInput)
    message.warning('测试用例需要修改，已发送修改建议...')
    setModalVisible(false)
  }

  // 关闭模态框
  const handleClose = () => {
    setModalVisible(false)
    message.info('审批已取消')
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <UserOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
          <Title level={2}>用户代理审批演示</Title>
          <Paragraph type="secondary">
            演示在AI生成测试用例时，如何通过用户代理进行人工审批和干预
          </Paragraph>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <Title level={4}>功能说明</Title>
          <Paragraph>
            当AI智能体生成测试用例或其他重要内容时，系统会暂停执行并等待用户审批：
          </Paragraph>
          <ul>
            <li><Text strong>批准继续</Text>：输入 "APPROVE" 或点击批准按钮继续执行</li>
            <li><Text strong>提供修改建议</Text>：输入具体的修改意见，AI会根据建议调整</li>
            <li><Text strong>拒绝</Text>：拒绝当前生成的内容，要求重新生成</li>
          </ul>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={startDemo}
          >
            开始演示
          </Button>
        </div>

        <div style={{ marginTop: '32px', padding: '16px', background: '#f6f8fa', borderRadius: '8px' }}>
          <Title level={5}>使用提示</Title>
          <Space direction="vertical" size="small">
            <Text>• 在实际使用中，当AI生成内容需要审批时，会自动弹出审批框</Text>
            <Text>• 您可以输入 "APPROVE" 快速批准，或提供详细的修改建议</Text>
            <Text>• 按 Ctrl+Enter 可以快速批准继续</Text>
            <Text>• 审批过程中，AI会等待您的决定，不会继续执行</Text>
          </Space>
        </div>
      </Card>

      <UserProxyModal
        visible={modalVisible}
        onApprove={handleApprove}
        onReject={handleReject}
        onClose={handleClose}
        agentContent={demoContent}
        agentName="测试用例生成器"
        isWaiting={true}
      />
    </div>
  )
}

export default UserProxyDemo
