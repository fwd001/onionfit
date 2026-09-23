<script setup lang="ts">
// 错误横幅：最近一次失败的人话说明
import AppIcon from '@/components/AppIcon.vue'

defineProps<{
  message: string
}>()
</script>

<template>
  <div class="error-banner">
    <AppIcon
      icon="fluent:warning-28-regular"
      :size="16"
    />
    <span>{{ message }}</span>
  </div>
</template>

<style scoped lang="scss">
.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 16px 0;
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(255, 99, 88, 0.18);
  border: 1px solid rgba(255, 99, 88, 0.4);
  font-size: 13px;
  color: #ffc4bd;
}
</style>