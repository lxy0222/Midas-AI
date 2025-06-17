import React, { useState } from 'react'
import { Layout, Menu, Button, Avatar, Dropdown, Space, Typography } from 'antd'
import {
  MenuOutlined,
  HomeOutlined,
  RobotOutlined,
  MessageOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  BulbOutlined,
  ToolOutlined,
  FileTextOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import './Layout.css'

const { Header, Sider, Content } = Layout
const { Title } = Typography

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // 菜单项配置
  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/ai',
      icon: <RobotOutlined />,
      label: 'AI 服务',
      children: [
        {
          key: '/ai/chat',
          icon: <MessageOutlined />,
          label: '智能对话',
        },
        {
          key: '/ai/demo',
          icon: <RobotOutlined />,
          label: '协作演示',
        },
        {
          key: '/ai/assistant',
          icon: <BulbOutlined />,
          label: '智能助手',
        },
        {
          key: '/ai/analysis',
          icon: <FileTextOutlined />,
          label: '文本分析',
        },
      ],
    },
    {
      key: '/tools',
      icon: <ToolOutlined />,
      label: '工具箱',
      children: [
        {
          key: '/tools/converter',
          icon: <ToolOutlined />,
          label: '格式转换',
        },
        {
          key: '/tools/calculator',
          icon: <ToolOutlined />,
          label: '计算器',
        },
      ],
    },
    {
      key: '/help',
      icon: <QuestionCircleOutlined />,
      label: '帮助中心',
      children: [
        {
          key: '/help/guide',
          icon: <QuestionCircleOutlined />,
          label: '使用指南',
        },
        {
          key: '/help/faq',
          icon: <QuestionCircleOutlined />,
          label: '常见问题',
        },
      ],
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
  ]

  // 用户菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '账户设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ]

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  const handleUserMenuClick = ({ key }) => {
    if (key === 'logout') {
      // 处理退出登录
      console.log('退出登录')
    } else if (key === 'profile') {
      navigate('/profile')
    } else if (key === 'settings') {
      navigate('/settings')
    }
  }

  // 获取当前选中的菜单项
  const getSelectedKeys = () => {
    const path = location.pathname
    // 如果是子路径，返回父路径作为选中项
    if (path.startsWith('/ai/')) return [path]
    if (path.startsWith('/tools/')) return [path]
    if (path.startsWith('/help/')) return [path]
    return [path]
  }

  // 获取展开的菜单项
  const getOpenKeys = () => {
    const path = location.pathname
    if (path.startsWith('/ai/')) return ['/ai']
    if (path.startsWith('/tools/')) return ['/tools']
    if (path.startsWith('/help/')) return ['/help']
    return []
  }

  return (
    <Layout className="app-layout">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        className="app-sider"
        width={280}
        collapsedWidth={80}
      >
        <div className="logo">
          <RobotOutlined className="logo-icon" />
          {!collapsed && <Title level={4} className="logo-text">但问智能</Title>}
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
          onClick={handleMenuClick}
          className="app-menu"
        />
      </Sider>
      
      <Layout className="main-layout">
        <Header className="app-header">
          <div className="header-left">
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="trigger-btn"
            />
          </div>
          
          <div className="header-right">
            <Space size="middle">
              <Dropdown
                menu={{
                  items: userMenuItems,
                  onClick: handleUserMenuClick,
                }}
                placement="bottomRight"
                arrow
              >
                <div className="user-info">
                  <Avatar size="small" icon={<UserOutlined />} />
                  <span className="username">用户</span>
                </div>
              </Dropdown>
            </Space>
          </div>
        </Header>
        
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AppLayout
