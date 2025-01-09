<template>
  <!-- 全局消息提供者 -->
  <n-message-provider>
    <!-- 全局对话框提供者 -->
    <n-dialog-provider>
      <!-- 加载动画组件 -->
      <Loading :visible="loading" />
      <!-- 主应用容器 -->
      <div v-show="!loading" class="app-wrapper">
        <!-- 主题配置提供者 -->
        <n-config-provider :theme="theme">
          <n-layout class="app-container">
            <!-- 自定义标题栏 -->
            <n-layout-header class="titlebar">
              <div class="toolbar">
                <!-- macOS 风格的窗口控制按钮 -->
                <div v-if="isElectron" class="traffic-lights">
                  <div class="traffic-light-wrapper">
                    <div class="traffic-light close" @click="handleClose"></div>
                    <div class="traffic-light minimize" @click="handleMinimize"></div>
                    <div class="traffic-light zoom" @click="handleMaximize"></div>
                  </div>
                </div>
                <!-- 主题切换开关 -->
                <div class="theme-switch">
                  <n-switch v-model:value="isDarkMode">
                    <template #checked>🌙</template>
                    <template #unchecked>☀️</template>
                  </n-switch>
                </div>
              </div>
            </n-layout-header>
            <!-- 主内容区域 -->
            <n-layout-content class="main-content">
              <Suspense>
                <template #default>
                  <router-view></router-view>
                </template>
                <template #fallback>
                  <div>加载中...</div>
                </template>
              </Suspense>
            </n-layout-content>
          </n-layout>
        </n-config-provider>
      </div>
    </n-dialog-provider>
  </n-message-provider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { darkTheme, lightTheme, useDialog, NDialogProvider, createDiscreteApi } from 'naive-ui'
import { useOsTheme } from 'naive-ui'
import Loading from './components/Loading.vue'
import { useRouter, onBeforeRouteUpdate } from 'vue-router'

// 获取系统主题
const osThemeRef = useOsTheme()

// 创建离散 API，用于在组件外使用对话框
const { dialog } = createDiscreteApi(['dialog'], {
  configProviderProps: {
    theme: computed(() => isDarkMode.value ? darkTheme : lightTheme)
  }
})

// 从 localStorage 读取主题设置，如果没有则使用系统主题
const isDarkMode = ref(
  localStorage.getItem('theme') 
    ? localStorage.getItem('theme') === 'dark'
    : osThemeRef.value === 'dark'
)

// 监听主题变化并保存到 localStorage
watch(isDarkMode, (newValue) => {
  localStorage.setItem('theme', newValue ? 'dark' : 'light')
})

// 计算当前主题
const theme = computed(() => isDarkMode.value ? darkTheme : lightTheme)
// 判断是否在 Electron 环境中
const isElectron = computed(() => window?.electron !== undefined)

// 加载状态控制
const loading = ref(true)

const router = useRouter()

// 组件挂载后的初始化
onMounted(async () => {
  try {
    // 预加载资源
    await Promise.all([
      import('compressorjs'),
      import('jszip'),
      // 确保路由就绪
      router.isReady(),
      // 最少显示加载动画500ms
      new Promise(resolve => setTimeout(resolve, 500))
    ])
  } catch (error) {
    console.error('资源加载失败:', error)
  } finally {
    loading.value = false
  }
})

// 监听路由变化
onBeforeRouteUpdate((to, from) => {
  console.log('路由更新:', to.path)
})

// 窗口控制函数
const handleClose = () => {
  dialog.warning({
    title: '确认退出',
    content: '确定要退出应用吗？',
    positiveText: '确定',
    negativeText: '取消',
    async onPositiveClick() {
      try {
        if (!window.electron?.windowQuit) {
          throw new Error('windowQuit method not found')
        }
        await window.electron.windowQuit()
      } catch (error) {
        console.error('退出应用失败:', error)
        dialog.error({
          title: '错误',
          content: '退出应用失败，请重试'
        })
      }
    }
  })
}

// 最小化窗口
const handleMinimize = () => {
  window.electron?.windowMinimize()
}

// 最大化/还原窗口
const handleMaximize = () => {
  window.electron?.windowMaximize()
}

// 路由调试日志
router.beforeEach((to, from) => {
  console.log('路由切换:', { to, from })
})
</script>

<style lang="scss">
// 应用容器样式
.app-container {
  height: 100vh;
}

// 自定义标题栏样式
.titlebar {
  height: 38px;
  -webkit-app-region: drag; // 允许拖拽窗口
  background: transparent;
}

// 工具栏样式
.toolbar {
  padding: 8px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

// 窗口控制按钮区域
.traffic-lights {
  -webkit-app-region: no-drag; // 防止按钮区域可拖拽
}

// 窗口控制按钮包装器
.traffic-light-wrapper {
  display: flex;
  gap: 8px;
}

// 窗口控制按钮样式
.traffic-light {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.2s;
  
  // 按钮颜色
  &.close { background: #ff5f57; }
  &.minimize { background: #febc2e; }
  &.zoom { background: #28c840; }

  // 悬停效果
  &:hover {
    &.close { background: #ff4444; }
    &.minimize { background: #ffbc2c; }
    &.zoom { background: #00c73e; }
  }
}

// 主内容区域样式
.main-content {
  padding: 0 20px 20px;
}

// 应用包装器样式
.app-wrapper {
  width: 100%;
  height: 100%;
}

// 主题切换开关样式
.theme-switch {
  -webkit-app-region: no-drag; // 防止开关可拖拽
  z-index: 1000;
}
</style> 