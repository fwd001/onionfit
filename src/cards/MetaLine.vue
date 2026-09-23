<script setup lang="ts">
// 数据来源与时间点（metaLine）与错误横幅（ErrorBanner）

defineProps<{
  sourceLabel: string
  minutesAgo: number
  stale: boolean
}>()
</script>

<template>
  <div class="meta-line">
    <span v-if="stale">网络不可用，显示上次结果</span>
    <span v-else>{{ sourceLabel }}</span>
    <span class="dot">·</span>
    <span>{{ minutesAgo }} 分钟前</span>
  </div>
</template>

<style scoped lang="scss">
.meta-line {
  padding: 16px 16px 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
  text-align: center;
}

.dot {
  margin: 0 6px;
}
</style>