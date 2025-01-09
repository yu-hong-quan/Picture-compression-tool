<template>
  <div class="home">
    <n-card class="control-panel glass-effect" :bordered="false">
      <n-space vertical>
        <n-space align="center" justify="space-between">
          <div class="quality-control">
            <span class="label">压缩质量:</span>
            <n-slider 
              v-model:value="quality" 
              :step="0.1"
              :min="0.1"
              :max="1"
              style="width: 200px"
            />
            <span class="value">{{ Math.floor(quality * 100) }}%</span>
            <span class="quality-tip">注：比例越小压缩率就越高，图片质量会越差</span>
          </div>
          <n-space>
            <n-button 
              type="primary" 
              @click="handleSaveAll" 
              :disabled="!hasCompressedImages"
              class="action-button"
            >
              <template #icon>
                <n-icon><save-outline /></n-icon>
              </template>
              保存所有压缩图片
            </n-button>
            <n-button 
              @click="handleClearAll" 
              :disabled="!fileList.length"
              class="action-button"
            >
              <template #icon>
                <n-icon><trash-outline /></n-icon>
              </template>
              清空列表
            </n-button>
          </n-space>
        </n-space>
      </n-space>
    </n-card>

    <n-upload
    ref="uploadRef"
    multiple
    directory-dnd
    :default-upload="false"
    :max="10"
    @change="handleChange"
    @update:file-list="handleUpdateFileList"
    :file-list="fileList"
    :show-file-list="true"
    accept="image/jpeg,image/png,image/jpg"
    :before-upload="beforeUpload"
    class="custom-upload"
    >
      <n-upload-dragger class="upload-dragger glass-effect">
        <div class="upload-area">
          <n-icon size="48" class="upload-icon">
            <image-outline />
          </n-icon>
          <p class="upload-text">点击或拖拽图片到此处</p>
          <p class="upload-tip">仅支持 JPG、PNG 格式，单次最多10张</p>
        </div>
      </n-upload-dragger>

      <template #file="{ file }">
        <div class="n-upload-file">
          <div class="n-upload-file-info">
                <div class="file-info">
                  <span class="n-upload-file-info__name">{{ file.name }}</span>
                  <span class="n-upload-file-info__size">
                    {{ formatFileSize(file.file?.size || 0) }}
                  </span>
                </div>
                <div class="n-upload-file-info__action">
              <n-button quaternary circle @click.stop="handleDeleteImage(file)">
                    <template #icon>
                      <n-icon><close-outline /></n-icon>
                    </template>
                  </n-button>
            </div>
          </div>
        </div>
      </template>
    </n-upload>

    <transition-group name="image-list" tag="div" class="image-grid">
      <n-card
        v-for="file in fileList"
        :key="file.id"
        class="image-card glass-effect"
        :bordered="false"
      >
        <template #cover>
          <div class="image-preview">
            <img :src="previewUrls[file.id]" />
            <div class="image-info glass-effect">
              <span>{{ formatFileSize(file.file?.size || 0) }}</span>
              <span v-if="file.status === 'finished'" class="size-arrow">
                →
              </span>
              <span v-if="file.status === 'finished'">
                {{ formatFileSize(compressedFiles[file.id]?.size || 0) }}
              </span>
            </div>
            <div class="delete-button" @click.stop="handleDeleteImage(file)">
              <n-icon><close-outline /></n-icon>
            </div>
          </div>
        </template>
        <n-space vertical>
          <n-progress
            type="line"
            :percentage="file.percentage || 0"
            :processing="file.status === 'uploading'"
            :status="file.status === 'error' ? 'error' : 'default'"
            class="progress-bar"
          />
          <n-space justify="space-between">
            <n-button 
              size="small" 
              @click="handleSaveImage(file)"
              :disabled="file.status !== 'finished'"
              class="save-button"
            >
              <template #icon>
                <n-icon><download-outline /></n-icon>
              </template>
              保存
            </n-button>
            <span class="compression-info" v-if="file.status === 'finished'">
              压缩率: {{ getCompressionRatio(file) }}%
            </span>
          </n-space>
        </n-space>
      </n-card>
    </transition-group>

    <n-card class="history-panel glass-effect" :bordered="false">
      <template #header>
        压缩历史记录
      </template>
      <n-table :single-line="false" class="history-table">
        <thead>
          <tr>
            <th>文件名</th>
            <th>原始大小</th>
            <th>压缩后大小</th>
            <th>压缩率</th>
            <th>状态</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in compressionHistory" :key="record.id">
            <td class="filename-cell">{{ record.fileName }}</td>
            <td>{{ formatFileSize(record.originalSize) }}</td>
            <td>{{ formatFileSize(record.compressedSize) }}</td>
            <td>{{ record.ratio }}%</td>
            <td>
              <n-tag :type="record.status === 'finished' ? 'success' : record.status === 'error' ? 'error' : 'info'">
                {{ record.status === 'finished' ? '完成' : record.status === 'error' ? '失败' : '处理中' }}
              </n-tag>
            </td>
            <td>{{ new Date(record.timestamp).toLocaleString() }}</td>
          </tr>
        </tbody>
      </n-table>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed,onBeforeUnmount } from 'vue'
import { ImageOutline, SaveOutline, TrashOutline, DownloadOutline, CloseOutline, CheckmarkCircleOutline } from '@vicons/ionicons5'
import type { UploadFileInfo } from 'naive-ui'
import { useMessage } from 'naive-ui'
import Compressor from 'compressorjs'
import JSZip from 'jszip'

const message = useMessage()
const uploadRef = ref()
const quality = ref(0.5)
const fileList = ref<UploadFileInfo[]>([])
const previewUrls = ref<Record<string, string>>({})
const compressedFiles = ref<Record<string, Blob>>({})
const deletingFiles = ref<Set<string>>(new Set())

const hasCompressedImages = computed(() => {
  return Object.keys(compressedFiles.value).length > 0
})

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

interface CompressorOptions {
  quality: number;
  success: (result: Blob) => void;
  error: (err: Error) => void;
  progress?: (percent: number) => void;
}

// 添加压缩记录接口
interface CompressionRecord {
  originalSize: number;
  compressedSize: number;
  ratio: number;
  status: 'uploading' | 'finished' | 'error';
  percentage: number;
  timestamp: number;
}

// 添加压缩记录存储
const compressionRecords = ref<Record<string, CompressionRecord>>({})

// 添加文件类型检查函数
const beforeUpload = (file: File) => {
  const isImage = file.type === 'image/jpeg' || 
                  file.type === 'image/png' || 
                  file.type === 'image/jpg'
  
  if (!isImage) {
    message.error('只能上传 JPG 或 PNG 格式的图片！')
    return false
  }
  
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    message.error('图片大小不能超过 10MB！')
    return false
  }
  
  return true
}

const handleChange = async (data: { file: UploadFileInfo, event?: Event }) => {
  const { file } = data
  
  if (file.status === 'removed' || file.status === 'finished') {
    return
  }

  // 初始化压缩记录
  compressionRecords.value[file.id] = {
    originalSize: file.file?.size || 0,
    compressedSize: 0,
    ratio: 0,
    status: 'uploading',
    percentage: 0,
    timestamp: Date.now()
  }

  const url = URL.createObjectURL(file.file as Blob)
  previewUrls.value[file.id] = url
  file.status = 'uploading'
  file.percentage = 0

  new Compressor(file.file as Blob, {
    quality: quality.value,
    maxWidth: 2000,
    maxHeight: 2000,
    convertSize: 1000000,
    success(result) {
      compressedFiles.value[file.id] = result
      file.status = 'finished'
      file.percentage = 100
      
      URL.revokeObjectURL(previewUrls.value[file.id])
      previewUrls.value[file.id] = URL.createObjectURL(result)

      // 更新压缩记录
      const ratio = getCompressionRatio(file)
      compressionRecords.value[file.id] = {
        ...compressionRecords.value[file.id],
        compressedSize: result.size,
        ratio,
        status: 'finished',
        percentage: 100
      }

      message.success(`压缩完成，压缩率：${ratio}%`)
    },
    error(err) {
      message.error('压缩失败：' + err.message)
      file.status = 'error'
      
      // 更新压缩记录
      compressionRecords.value[file.id].status = 'error'
    },
    progress(percent) {
      file.percentage = percent
      compressionRecords.value[file.id].percentage = percent
    },
    mimeType: 'image/jpeg',
    checkOrientation: true
  } as CompressorOptions)
}

const isClearingAll = ref(false)

const handleUpdateFileList = (files: UploadFileInfo[]) => {
  if (isClearingAll.value) {
    isClearingAll.value = false
    return
  }

  // 如果是通过 n-upload 的删除操作触发的更新
  if (files.length < fileList.value.length) {
    const removedFiles = fileList.value.filter(oldFile => 
      !files.some(newFile => newFile.id === oldFile.id)
    )

    removedFiles.forEach(file => {
      if (previewUrls.value[file.id]) {
        URL.revokeObjectURL(previewUrls.value[file.id])
        delete previewUrls.value[file.id]
      }
      delete compressedFiles.value[file.id]
    })
  }

  fileList.value = files
}

const getCompressionRatio = (file: UploadFileInfo) => {
  if (!compressedFiles.value[file.id] || !file.file) return 0
  const originalSize = file.file.size
  const compressedSize = compressedFiles.value[file.id].size
  const ratio = Math.round((1 - compressedSize / originalSize) * 100)
  return ratio > 0 ? ratio : 0
}

const handleSaveImage = async (file: UploadFileInfo) => {
  const compressedFile = compressedFiles.value[file.id]
  if (!compressedFile) return

  if (window.electron) {
    try {
      // 获取文件扩展名
      const ext = file.name.split('.').pop() || 'jpg'
      // 生成带压缩率的文件名
      const ratio = getCompressionRatio(file)
      const defaultName = `${file.name.replace(`.${ext}`, '')}_${ratio}%压缩.${ext}`

      const result = await window.electron.showSaveDialog({
        defaultPath: defaultName,
        filters: [
          { name: 'JPEG', extensions: ['jpg', 'jpeg'] },
          { name: 'PNG', extensions: ['png'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })

      if (!result.canceled && result.filePath) {
        await window.electron.saveFile(result.filePath, compressedFile)
        message.success('保存成功')
      }
    } catch (err) {
      message.error('保存失败')
      console.error(err)
    }
  } else {
    // 网页版下载逻辑
    const ext = file.name.split('.').pop() || 'jpg'
    const ratio = getCompressionRatio(file)
    const fileName = `${file.name.replace(`.${ext}`, '')}_${ratio}%压缩.${ext}`
    
    const link = document.createElement('a')
    link.href = previewUrls.value[file.id]
    link.download = fileName
    link.click()
  }
}

const handleSaveAll = async () => {
  if (window.electron) {
    try {
      const result = await window.electron.showSaveDialog({
        defaultPath: 'compressed_images.zip',
        filters: [{ name: 'Zip Archive', extensions: ['zip'] }]
      })

      if (!result.canceled && result.filePath) {
        const zip = new JSZip()
        let successCount = 0
        
        // 添加所有压缩后的图片到zip
        for (const file of fileList.value) {
          const compressedFile = compressedFiles.value[file.id]
          if (compressedFile) {
            // 获取文件扩展名
            const ext = file.name.split('.').pop() || 'jpg'
            // 生成新的文件名（添加压缩率信息）
            const ratio = getCompressionRatio(file)
            const newFileName = `${file.name.replace(`.${ext}`, '')}_${ratio}%压缩.${ext}`
            
            zip.file(newFileName, compressedFile)
            successCount++
          }
        }
        
        // 生成zip文件
        const content = await zip.generateAsync({ 
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 9 }
        })
        
        // 保存zip文件
        await window.electron.saveFile(result.filePath, content)
        message.success(`已将 ${successCount} 个压缩图片打包保存`)
      }
    } catch (err) {
      message.error('保存失败')
      console.error(err)
    }
  } else {
    // 网页版批量下载为zip
    try {
      const zip = new JSZip()
      let successCount = 0

      for (const file of fileList.value) {
        const compressedFile = compressedFiles.value[file.id]
        if (compressedFile) {
          const ext = file.name.split('.').pop() || 'jpg'
          const ratio = getCompressionRatio(file)
          const newFileName = `${file.name.replace(`.${ext}`, '')}_${ratio}%压缩.${ext}`
          
          zip.file(newFileName, compressedFile)
          successCount++
        }
      }

      const content = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 }
      })

      // 创建下载链接
      const url = URL.createObjectURL(content)
      const link = document.createElement('a')
      link.href = url
      link.download = 'compressed_images.zip'
      link.click()
      
      // 清理URL
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 1000)

      message.success(`已将 ${successCount} 个压缩图片打包下载`)
    } catch (err) {
      message.error('打包下载失败')
      console.error(err)
    }
  }
}

const handleClearAll = () => {
  isClearingAll.value = true
  
  // 清理预览URL
  Object.values(previewUrls.value).forEach(url => {
    URL.revokeObjectURL(url)
  })
  
  fileList.value = []
  previewUrls.value = {}
  compressedFiles.value = {}
  if (uploadRef.value) {
    uploadRef.value.clear()
  }

  message.success('已清空所有图片')
}

const handleDeleteImage = (file: UploadFileInfo) => {
  const newFiles = fileList.value.filter(f => f.id !== file.id)
  fileList.value = newFiles

  // 只清理预览资源，保留压缩记录
  if (previewUrls.value[file.id]) {
    URL.revokeObjectURL(previewUrls.value[file.id])
    delete previewUrls.value[file.id]
  }
  
  message.success('已删除图片')
}

// 添加获取压缩历史的计算属性
const compressionHistory = computed(() => {
  return Object.entries(compressionRecords.value)
    .sort((a, b) => b[1].timestamp - a[1].timestamp)
    .map(([id, record]) => ({
      id,
      ...record,
      fileName: fileList.value.find(f => f.id === id)?.name || '已删除文件'
    }))
})

// 组件卸载时清理资源
onBeforeUnmount(() => {
  Object.values(previewUrls.value).forEach(url => {
    URL.revokeObjectURL(url)
  })
})
</script>

<style lang="scss" scoped>
.home {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

// 毛玻璃效果
.glass-effect {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
}

.control-panel {
  margin-bottom: 20px;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

.quality-control {
  display: flex;
  align-items: center;
  gap: 12px;

  .label, .value {
    font-size: 14px;
    color: var(--n-text-color-2);
  }
  .quality-tip{
    font-size: 11px;
    color: var(--n-text-color-3);
  }
}

.action-button {
  transition: all 0.3s ease;

  &:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.upload-dragger {
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
}

.upload-area {
  padding: 40px;
  text-align: center;

  .upload-icon {
    color: var(--n-text-color-3);
    transition: transform 0.3s ease;
  }

  .upload-text {
    margin: 16px 0 8px;
    font-size: 16px;
    color: var(--n-text-color-2);
  }

  .upload-tip {
    font-size: 12px;
    color: var(--n-text-color-3);
  }

  &:hover .upload-icon {
    transform: scale(1.1);
  }
}

// 图片网格动画
.image-list-enter-active,
.image-list-leave-active {
  transition: all 0.5s ease;
}

.image-list-enter-from,
.image-list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.image-grid {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.image-card {
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  .image-preview {
    position: relative;
    overflow: hidden;
    border-radius: 8px;
    
    img {
      width: 100%;
      height: 200px;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    &:hover img {
      transform: scale(1.05);
    }

    .image-info {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 8px 12px;
      font-size: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .size-arrow {
        color: var(--n-primary-color);
        font-weight: bold;
      }
    }

    .delete-button {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.6);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      opacity: 0;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(255, 59, 48, 0.8);
        transform: scale(1.1);
      }
    }

    &:hover .delete-button {
      opacity: 1;
    }
  }
}

.progress-bar {
  margin: 8px 0;
}

.save-button {
  transition: all 0.3s ease;

  &:not(:disabled):hover {
    transform: translateY(-2px);
  }
}

.compression-info {
  font-size: 12px;
  color: var(--n-text-color-3);
  font-weight: 500;
}

// 深色模式适配
:deep(.n-card) {
  background: var(--n-card-color);
}

@media (max-width: 768px) {
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }

  .quality-control {
    flex-direction: column;
    align-items: flex-start;
  }
}

// 添加历史记录面板样式
.history-panel {
  margin-top: 20px;

  :deep(.history-table) {
    th, td {
      padding: 12px 16px;
      text-align: left;
    }

    th {
      font-weight: 500;
      color: var(--n-text-color-2);
      background-color: var(--n-table-header-color);
    }

    td {
      color: var(--n-text-color-1);
    }

    .filename-cell {
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    tr:hover td {
      background-color: var(--n-table-color-hover);
    }
  }
}

// 自定义文件列表样式
.custom-upload {
  :deep(.n-upload-file-list) {
    margin-top: 16px;
    
    .n-upload-file {
      background: var(--n-card-color);
      border-radius: 8px;
      padding: 12px 16px;
      transition: all 0.3s ease;
      border: 1px solid var(--n-border-color);
      margin-bottom: 8px;
      
      &:hover {
        background: var(--n-card-color-hover);
        transform: translateX(4px);
      }
      
      .n-upload-file-info {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        
        .file-info {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          
          .n-upload-file-info__name {
            font-size: 14px;
            color: var(--n-text-color-1);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          .n-upload-file-info__size {
            font-size: 13px;
            color: var(--n-text-color-3);
          }
        }
        
        .n-upload-file-info__action {
          .n-button {
            padding: 4px;
            min-width: 24px;
            height: 24px;
            border-radius: 4px;
            
            &:hover {
              color: var(--n-error-color);
            }
            
            .n-icon {
              font-size: 16px;
            }
          }
        }
      }
    }
  }
}

/* 深色模式适配 */
:deep([data-theme='dark']) {
  .custom-upload {
    .n-upload-file {
      background: rgba(255, 255, 255, 0.04);
      
      &:hover {
        background: rgba(255, 255, 255, 0.06);
      }
    }
  }
}

/* 响应式布局 */
@media (max-width: 768px) {
  .custom-upload {
    :deep(.n-upload-file-list) {
      grid-template-columns: 1fr;
      
      .n-upload-file {
        .n-upload-file-info__name {
          max-width: 150px;
        }
      }
    }
  }
}
</style> 