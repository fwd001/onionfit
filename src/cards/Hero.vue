<script setup lang="ts">
// 主视觉区：大号温度 + 天气描述（温度数字滚动动画）
import CountUpNumber from '@/components/CountUpNumber.vue'

defineProps<{
  temp: number
  feelsLike: number
  condition: string
  isDay: boolean
}>()
</script>

<template>
  <section class="hero">
    <div class="temp-row">
      <CountUpNumber
        :value="temp"
        :digits="0"
        class="temp"
      />
      <span class="degree">°</span>
    </div>
    <div class="desc">{{ condition }}</div>
    <div class="feels">体感 {{ Math.round(feelsLike) }}°</div>
  </section>
</template>

<style scoped lang="scss">
.hero {
  /* 容器（StaggerContainer）已提供 16px 屏幕边距 */
  padding: 8px 4px 18px;
  text-align: center;
}

.temp-row {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.temp {
  /* iOS 天气 App 同款 ultralight 字重 */
  font-size: 92px;
  font-weight: 200;
  line-height: 1;
  letter-spacing: -0.03em;
}

.degree {
  font-size: 46px;
  font-weight: 200;
  margin-top: 10px;
}

.desc {
  margin-top: 2px;
  font-size: 19px;
  font-weight: 500;
}

.feels {
  margin-top: 2px;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.72);
}
</style>