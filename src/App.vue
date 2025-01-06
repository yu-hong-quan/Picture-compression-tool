<template>
  <Loading :visible="loading" />
  <n-message-provider>
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
            <n-switch v-model:value="isDarkMode">
              <template #checked>🌙</template>
              <template #unchecked>☀️</template>
            </n-switch>
          </div>
        </n-layout-header>
        <n-layout-content class="main-content">
          <router-view></router-view>
        </n-layout-content>
      </n-layout>
    </n-config-provider>
  </n-message-provider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { darkTheme, lightTheme } from 'naive-ui'
import { useOsTheme } from 'naive-ui'
import Loading from './components/Loading.vue'

const osThemeRef = useOsTheme()
const isDarkMode = ref(osThemeRef.value === 'light')
const theme = computed(() => isDarkMode.value ? darkTheme : lightTheme)
const isElectron = computed(() => window?.electron !== undefined)

const loading = ref(true)

onMounted(async () => {
  // 等待资源加载完成
  await Promise.all([
    // 添加需要等待的资源加载
    new Promise(resolve => setTimeout(resolve, 1000)) // 至少显示1秒
  ])
  loading.value = false
})

// 添加窗口控制函数
const handleClose = () => {
  window.electron?.windowClose()
}

const handleMinimize = () => {
  window.electron?.windowMinimize()
}

const handleMaximize = () => {
  window.electron?.windowMaximize()
}
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
</style> 