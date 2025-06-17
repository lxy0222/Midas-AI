import React from 'react'
import { Result, Button } from 'antd'
import { RocketOutlined, HomeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const ComingSoon = ({ title = "功能开发中", subtitle = "该功能正在紧张开发中，敬请期待！" }) => {
  const navigate = useNavigate()

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Result
          icon={
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <RocketOutlined style={{ color: '#1890ff', fontSize: '72px' }} />
            </motion.div>
          }
          title={title}
          subTitle={subtitle}
          extra={
            <Button 
              type="primary" 
              icon={<HomeOutlined />}
              onClick={() => navigate('/')}
              size="large"
            >
              返回首页
            </Button>
          }
        />
      </motion.div>
    </div>
  )
}

export default ComingSoon
