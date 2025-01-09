<template>
  <n-message-provider>
    <n-dialog-provider>
      <Loading :visible="loading" />
      <div v-show="!loading" class="app-wrapper">
        <n-config-provider :theme="theme">
          <n-layout class="app-container">
            <n-layout-header class="titlebar">
              <div class="toolbar">
                <div v-if="isElectron" class="traffic-lights">
                  <div class="traffic-light-wrapper">
                    <div class="traffic-light close" @click="handleClose"></div>
                    <div class="traffic-light minimize" @click="handleMinimize"></div>
                    <div class="traffic-light zoom" @click="handleMaximize"></div>
                  </div>
                </div>
                <div class="theme-switch">
                  <n-switch v-model:value="isDarkMode">
                    <template #checked>🌙</template>
                    <template #unchecked>☀️</template>
                  </n-switch>
                </div>
              </div>
            </n-layout-header>
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

const osThemeRef = useOsTheme()

// 创建离散 API
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

const theme = computed(() => isDarkMode.value ? darkTheme : lightTheme)
const isElectron = computed(() => window?.electron !== undefined)

const loading = ref(true)

const router = useRouter()

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

// 添加窗口控制函数
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

const handleMinimize = () => {
  window.electron?.windowMinimize()
}

const handleMaximize = () => {
  window.electron?.windowMaximize()
}

// 添加路由调试日志
router.beforeEach((to, from) => {
  console.log('路由切换:', { to, from })
})
</script>

<style lang="scss">
.app-container {
  height: 100vh;
}

.titlebar {
  height: 38px;
  -webkit-app-region: drag;
  background: transparent;
}

.toolbar {
  padding: 8px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.traffic-lights {
  -webkit-app-region: no-drag;
}

.traffic-light-wrapper {
  display: flex;
  gap: 8px;
}

.traffic-light {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &.close { background: #ff5f57; }
  &.minimize { background: #febc2e; }
  &.zoom { background: #28c840; }

  &:hover {
    &.close { background: #ff4444; }
    &.minimize { background: #ffbc2c; }
    &.zoom { background: #00c73e; }
  }
}

.main-content {
  padding: 0 20px 20px;
}

.app-wrapper {
  width: 100%;
  height: 100%;
}

.theme-switch {
  -webkit-app-region: no-drag;
  z-index: 1000;
}
</style> 