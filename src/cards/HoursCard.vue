<script setup lang="ts">
// 逐时趋势卡片：横向滚动 chip（12h）+ 首次进入滑动指引
import { onMounted, onUnmounted, ref } from 'vue'
import GlassCard from '@/components/GlassCard.vue'
import { weatherDesc } from '@/presentation'
import type { HourlyEnvironment, WeatherKind } from '@/core/types'

const props = defineProps<{
  hourly: HourlyEnvironment[]
  nowHour: number
}>()

const scrollRef = ref<HTMLElement | null>(null)

const kindText: Record<string, string> = {
  clear: '晴',
  cloudy: '多云',
  rain: '雨',
  snow: '雪',
  thunder: '雷',
  fog: '雾',
}

function hourOf(time: string): number {
  return new Date(time).getHours()
}

// 从"当前小时"起取未来 13 个整点（跨零点回绕），而不是从 00:00 开始
const shown = (() => {
  if (!props.hourly.length) return []
  const sorted = [...props.hourly].sort((a, b) => hourOf(a.time) - hourOf(b.time))
  const startIdx = sorted.findIndex((h) => hourOf(h.time) >= props.nowHour)
  const start = startIdx < 0 ? 0 : startIdx
  return [...sorted.slice(start), ...sorted.slice(0, start)].slice(0, 13)
})()

function isNow(i: number): boolean {
  return hourOf(shown[i]?.time ?? '') === props.nowHour
}

// 滑动指引：可滚动时轻推一下再弹回，告诉用户"这里可以横滑"（原生 carousel 手法，仅一次）
onMounted(() => {
  const el = scrollRef.value
  if (!el || el.scrollWidth <= el.clientWidth + 8) return
  let back: ReturnType<typeof setTimeout> | undefined
  const timer = setTimeout(() => {
    el.scrollTo({ left: 34, behavior: 'smooth' })
    back = setTimeout(() => el.scrollTo({ left: 0, behavior: 'smooth' }), 460)
  }, 550)
  onUnmounted(() => {
    clearTimeout(timer)
    if (back) clearTimeout(back)
  })
})
void weatherDesc
</script>

<template>
  <GlassCard class="hours-card">
    <div class="card-title">未来逐时</div>
    <div
      ref="scrollRef"
      class="hours-scroll touch-scroll"
    >
      <div
        v-for="(h, i) in shown"
        :key="h.time"
        class="hour-chip"
        :class="{ now: isNow(i) }"
      >
        <div class="hour-time">
          {{ isNow(i) ? '现在' : `${String(hourOf(h.time)).padStart(2, '0')}:00` }}
        </div>
        <div
          class="hour-kind"
          :class="`k-${h.kind}`"
        >
          {{ kindText[h.kind as WeatherKind] ?? '' }}
        </div>
        <div class="hour-temp">{{ Math.round(h.temperatureC) }}°</div>
      </div>
    </div>
  </GlassCard>
</template>

<style scoped lang="scss">
.hours-card {
  padding: 18px 20px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 14px;
}

.hours-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
  /* 右侧渐变提示还有更多小时可滑（滚动条已按原生惯例隐藏） */
  mask-image: linear-gradient(to right, #000 0, #000 calc(100% - 24px), transparent 100%);
  -webkit-mask-image: linear-gradient(to right, #000 0, #000 calc(100% - 24px), transparent 100%);
}

.hour-chip {
  min-width: 62px;
  padding: 10px 8px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
  text-align: center;

  &.now {
    background: rgba(255, 255, 255, 0.2);
  }
}

.hour-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.78);
}

.hour-kind {
  margin: 5px 0;
  font-size: 13px;
  font-weight: 500;
}

.k-clear {
  color: #ffd76e;
}
.k-rain {
  color: #8fb6ff;
}
.k-cloudy {
  color: #c5d2e0;
}
.k-snow {
  color: #ffffff;
}
.k-thunder {
  color: #d7b3ff;
}
.k-fog {
  color: #c5c8cf;
}

.hour-temp {
  font-size: 16px;
  font-weight: 500;
}
</style>