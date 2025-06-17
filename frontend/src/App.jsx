import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import AppLayout from './components/Layout'
import HomePage from './pages/HomePage'
import ChatPage from './pages/ChatPageSimple'
import ComingSoon from './pages/ComingSoon'
import AgentDemo from './pages/AgentDemo'
import './App.css'

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Routes>
          {/* 首页路由 - 不使用布局 */}
          <Route path="/" element={<HomePage />} />

          {/* 其他页面使用布局 */}
          <Route path="/" element={<AppLayout />}>
            <Route path="ai/chat" element={<ChatPage />} />
            <Route path="ai/demo" element={<AgentDemo />} />
            <Route path="ai/assistant" element={<ComingSoon title="智能助手" subtitle="智能助手功能正在开发中，敬请期待！" />} />
            <Route path="ai/analysis" element={<ComingSoon title="文本分析" subtitle="文本分析功能正在开发中，敬请期待！" />} />
            <Route path="tools/converter" element={<ComingSoon title="格式转换" subtitle="格式转换工具正在开发中，敬请期待！" />} />
            <Route path="tools/calculator" element={<ComingSoon title="计算器" subtitle="计算器功能正在开发中，敬请期待！" />} />
            <Route path="help/guide" element={<ComingSoon title="使用指南" subtitle="使用指南正在编写中，敬请期待！" />} />
            <Route path="help/faq" element={<ComingSoon title="常见问题" subtitle="常见问题整理中，敬请期待！" />} />
            <Route path="settings" element={<ComingSoon title="设置" subtitle="设置功能正在开发中，敬请期待！" />} />
            <Route path="profile" element={<ComingSoon title="个人资料" subtitle="个人资料功能正在开发中，敬请期待！" />} />
          </Route>
        </Routes>
      </Router>
    </ConfigProvider>
  )
}

export default App
