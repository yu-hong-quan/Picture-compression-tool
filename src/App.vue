<template>
  <n-message-provider>
    <n-config-provider :theme="theme">
      <n-layout class="app-container">
        <n-layout-header class="titlebar">
          <div class="toolbar">
            <div class="traffic-lights" v-if="isElectron">
              <div class="traffic-light close"></div>
              <div class="traffic-light minimize"></div>
              <div class="traffic-light zoom"></div>
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
import { ref, computed } from 'vue'
import { darkTheme, lightTheme } from 'naive-ui'
import { useOsTheme } from 'naive-ui'

const osThemeRef = useOsTheme()
const isDarkMode = ref(osThemeRef.value === 'light')
const theme = computed(() => isDarkMode.value ? darkTheme : lightTheme)
const isElectron = computed(() => window?.electron !== undefined)
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
  display: flex;
  gap: 8px;
  -webkit-app-region: no-drag;
}

.traffic-light {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  
  &.close { background: #ff5f57; }
  &.minimize { background: #febc2e; }
  &.zoom { background: #28c840; }
}

.main-content {
  padding: 0 20px 20px;
}
</style> 