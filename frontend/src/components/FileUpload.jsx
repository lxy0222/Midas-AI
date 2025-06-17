import React, { useState, useRef } from 'react'
import { Upload, Button, message, Card, Typography, Tag, Space, Progress, Tooltip } from 'antd'
import {
  UploadOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FileOutlined,
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons'
import { motion, AnimatePresence } from 'framer-motion'
import './FileUpload.css'

const { Text, Paragraph } = Typography
const { Dragger } = Upload

const FileUpload = ({ onFileSelect, onFileRemove, disabled = false, maxSize = 10 }) => {
  const [fileList, setFileList] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // 支持的文件类型
  const supportedTypes = {
    'text': { extensions: ['.txt', '.md', '.json', '.csv', '.log'], icon: FileTextOutlined, color: '#52c41a' },
    'document': { extensions: ['.pdf', '.docx', '.doc'], icon: FilePdfOutlined, color: '#f5222d' },
    'spreadsheet': { extensions: ['.xlsx', '.xls'], icon: FileExcelOutlined, color: '#13c2c2' },
    'image': { extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'], icon: FileImageOutlined, color: '#722ed1' },
    'code': { extensions: ['.py', '.js', '.html', '.css', '.java', '.cpp', '.c', '.go', '.rs'], icon: FileTextOutlined, color: '#1890ff' }
  }

  const getFileTypeInfo = (filename) => {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'))
    for (const [type, info] of Object.entries(supportedTypes)) {
      if (info.extensions.includes(ext)) {
        return { type, ...info }
      }
    }
    return { type: 'unknown', icon: FileOutlined, color: '#8c8c8c' }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const beforeUpload = (file) => {
    // 检查文件大小
    const isLtMaxSize = file.size / 1024 / 1024 < maxSize
    if (!isLtMaxSize) {
      message.error(`文件大小不能超过 ${maxSize}MB!`)
      return false
    }

    // 检查文件类型
    const fileTypeInfo = getFileTypeInfo(file.name)
    if (fileTypeInfo.type === 'unknown') {
      message.error('不支持的文件类型!')
      return false
    }

    // 检查是否已经有文件
    if (fileList.length > 0) {
      message.warning('请先移除当前文件再上传新文件')
      return false
    }

    return true
  }

  const handleUpload = async (options) => {
    const { file, onSuccess, onError, onProgress } = options
    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(progress)
          onProgress({ percent: progress })
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText)
            if (response.success) {
              const fileInfo = {
                uid: file.uid,
                name: file.name,
                size: file.size,
                type: getFileTypeInfo(file.name).type,
                content: response.content,
                metadata: response.file_info?.metadata || {}
              }

              setFileList([fileInfo])
              onFileSelect && onFileSelect(fileInfo)
              onSuccess(response)
              message.success('文件上传成功!')
            } else {
              throw new Error(response.message || '文件处理失败')
            }
          } catch (parseError) {
            console.error('解析响应失败:', parseError)
            throw new Error('服务器响应格式错误')
          }
        } else {
          throw new Error(`上传失败 (HTTP ${xhr.status})`)
        }
      })

      xhr.addEventListener('error', () => {
        throw new Error('网络错误')
      })

      xhr.open('POST', '/api/upload')
      xhr.send(formData)

    } catch (error) {
      console.error('Upload error:', error)
      message.error(`上传失败: ${error.message}`)
      onError(error)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleRemove = (file) => {
    setFileList([])
    onFileRemove && onFileRemove()
    message.success('文件已移除')
  }

  const uploadProps = {
    name: 'file',
    multiple: false,
    fileList: [],
    beforeUpload,
    customRequest: handleUpload,
    showUploadList: false,
    disabled: disabled || uploading
  }

  return (
    <div className="file-upload-container">
      <AnimatePresence>
        {fileList.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Dragger {...uploadProps} className="upload-dragger">
              <div className="upload-content">
                <UploadOutlined className="upload-icon" />
                <div className="upload-text">
                  <Text strong>点击或拖拽文件到此区域上传</Text>
                  <br />
                  <Text type="secondary">
                    支持 PDF、Word、Excel、图片、文本等格式，最大 {maxSize}MB
                  </Text>
                </div>
              </div>
            </Dragger>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {fileList.map((file) => {
              const typeInfo = getFileTypeInfo(file.name)
              const IconComponent = typeInfo.icon
              
              return (
                <Card key={file.uid} className="file-card" size="small">
                  <div className="file-info">
                    <div className="file-icon-wrapper">
                      <IconComponent 
                        className="file-icon" 
                        style={{ color: typeInfo.color }} 
                      />
                    </div>
                    <div className="file-details">
                      <div className="file-name">
                        <Text strong ellipsis={{ tooltip: file.name }}>
                          {file.name}
                        </Text>
                      </div>
                      <div className="file-meta">
                        <Space size="small">
                          <Tag color={typeInfo.color} size="small">
                            {typeInfo.type}
                          </Tag>
                          <Text type="secondary" className="file-size">
                            {formatFileSize(file.size)}
                          </Text>
                        </Space>
                      </div>
                      {file.content && (
                        <div className="file-preview">
                          <Paragraph 
                            ellipsis={{ rows: 2, expandable: false }}
                            type="secondary"
                            className="preview-text"
                          >
                            {file.content.substring(0, 100)}...
                          </Paragraph>
                        </div>
                      )}
                    </div>
                    <div className="file-actions">
                      <Tooltip title="移除文件">
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemove(file)}
                          size="small"
                        />
                      </Tooltip>
                    </div>
                  </div>
                </Card>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {uploading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="upload-progress"
        >
          <Progress 
            percent={uploadProgress} 
            status="active"
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
          <Text type="secondary">上传中...</Text>
        </motion.div>
      )}
    </div>
  )
}

export default FileUpload
