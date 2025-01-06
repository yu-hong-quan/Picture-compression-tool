<template>
  <Transition name="fade">
    <div class="loading-wrapper" v-if="visible">
      <div class="loading-content">
        <n-spin size="large">
          <template #description>
            <span class="loading-text">资源加载中...</span>
          </template>
        </n-spin>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
}>()
</script>

<style lang="scss" scoped>
.loading-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--n-color);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);

  .loading-content {
    text-align: center;
  }

  .loading-text {
    margin-top: 16px;
    color: var(--n-text-color-2);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 