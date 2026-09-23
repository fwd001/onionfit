<script setup lang="ts">
// 洋葱示意图：1-4 层同心弧（自绘 SVG，非图片资源）
// 内层 #8FD3FF / 中层 #FFD28F / 外层 #A8E6B0；未穿层（active=false）淡显
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 层角色顺序（内→外） */
    roles: { role: string; active: boolean }[]
    size?: number
  }>(),
  { size: 180 },
)

const COLOR: Record<string, string> = {
  BASE: '#8FD3FF',
  INSULATION: '#FFD28F',
  PROTECTION: '#A8E6B0',
}

const layers = computed(() => props.roles.slice(0, 4))

/** 每层弧的半径（由内到外递增） */
function radius(i: number, total: number): number {
  const base = 22
  const step = (props.size - base - 18) / Math.max(total, 1)
  return base + step * i
}

/** 弧的扫过角度：层数越多每层越小；未穿层用"缺口弧"表达 */
const sweepAngle = computed(() => {
  const n = layers.value.length
  return n <= 2 ? 200 : 150
})

function arcPath(r: number, gap: boolean): string {
  const s = sweepAngle.value * (gap ? 0.72 : 1)
  const start = (360 - s) / 2
  const largeArc = s > 180 ? 1 : 0
  const cx = 90 // viewBox 中心
  const cy = 90
  const x1 = cx + r * Math.cos((start * Math.PI) / 180)
  const y1 = cy + r * Math.sin((start * Math.PI) / 180)
  const end = start + s
  const x2 = cx + r * Math.cos((end * Math.PI) / 180)
  const y2 = cy + r * Math.sin((end * Math.PI) / 180)
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`
}
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 180 180"
    class="onion-diagram"
    role="img"
    aria-label="洋葱式穿衣层次示意"
  >
    <!-- 中心标记：当前穿着层数 -->
    <circle
      cx="90"
      cy="90"
      r="16"
      :fill="layers.length ? COLOR[layers[0].role] : '#ffffff22'"
      class="core"
    />
    <text
      x="90"
      y="95"
      text-anchor="middle"
      class="core-count"
      fill="#12142E"
      font-size="15"
      font-weight="700"
    >
      {{ layers.length }}
    </text>
    <path
      v-for="(layer, i) in layers"
      :key="layer.role + i"
      :d="arcPath(radius(i, layers.length), !layer.active)"
      fill="none"
      :stroke="COLOR[layer.role] ?? '#ffffff'"
      stroke-width="11"
      stroke-linecap="round"
      :class="{ breathing: layer.active }"
      :style="{ opacity: layer.active ? 0.95 : 0.4 }"
    />
  </svg>
</template>

<style scoped>
.onion-diagram {
  display: block;
}

.breathing {
  animation: breathe 2.6s ease-in-out infinite;
  transform-origin: center;
  transform-box: fill-box;
}

.core {
  animation: core-pulse 2.6s ease-in-out infinite;
}

.core-count {
  user-select: none;
}

@keyframes breathe {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.04);
  }
}

@keyframes core-pulse {
  0%,
  100% {
    opacity: 0.9;
  }
  50% {
    opacity: 1;
  }
}
</style>