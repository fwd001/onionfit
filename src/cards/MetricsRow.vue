<script setup lang="ts">
// 指标行：体感 / 湿度 / 风 / 降水概率 chip
import AppIcon from '@/components/AppIcon.vue'

defineProps<{
  feelsLike: number
  humidity: number
  windMs: number
  rainChance: number
}>()
</script>

<template>
  <div class="metrics touch-scroll">
    <div class="metric">
      <AppIcon
        icon="fluent:temperature-24-regular"
        :size="16"
      />
      <span>体感 {{ Math.round(feelsLike) }}°</span>
    </div>
    <div class="metric">
      <AppIcon
        icon="fluent:drop-28-regular"
        :size="16"
      />
      <span>湿度 {{ humidity }}%</span>
    </div>
    <div class="metric">
      <AppIcon
        icon="fluent:weather-squalls-24-regular"
        :size="16"
      />
      <span>风 {{ windMs }} m/s</span>
    </div>
    <div
      v-if="rainChance >= 0"
      class="metric"
    >
      <AppIcon
        icon="fluent:weather-rain-24-regular"
        :size="16"
      />
      <span>降水 {{ rainChance }}%</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.metrics {
  display: flex;
  gap: 10px;
  padding: 0 4px 4px;
  overflow-x: auto;
  /* 右缘渐变提示可滑（滚动条按原生惯例隐藏） */
  mask-image: linear-gradient(to right, #000 0, #000 calc(100% - 18px), transparent 100%);
  -webkit-mask-image: linear-gradient(to right, #000 0, #000 calc(100% - 18px), transparent 100%);
}

.metric {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 13px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  font-size: 13px;
  color: #fff;
  white-space: nowrap;
}
</style>