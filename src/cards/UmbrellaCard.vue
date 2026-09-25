<script setup lang="ts">
// 带伞卡：把「今天出门带不带伞」量化为通勤窗口的被淋概率 + 结论
// 概率来自 UmbrellaEngine（cost-loss 判定），本组件只渲染与翻译，不做判断
import { computed, onMounted, ref } from 'vue'
import GlassCard from '@/components/GlassCard.vue'
import AppIcon from '@/components/AppIcon.vue'
import CountUpNumber from '@/components/CountUpNumber.vue'
import { umbrellaCaveat, umbrellaHeadline, umbrellaLegLabel, umbrellaReason } from '@/presentation'
import type { UmbrellaAssessment } from '@/core/types'

const props = defineProps<{
  umbrella: UmbrellaAssessment
}>()

const emit = defineEmits<{
  adjust: []
}>()

const R = 30
const CIRC = 2 * Math.PI * R

// 进场从 0 扫到当前概率；后续改设置走 transition
const revealed = ref(false)
onMounted(() => {
  requestAnimationFrame(() => {
    revealed.value = true
  })
})

const dashOffset = computed(() =>
  revealed.value ? CIRC * (1 - props.umbrella.probability / 100) : CIRC,
)

const wet = computed(() => props.umbrella.verdict !== 'SKIP')
const ariaLabel = computed(
  () => `带伞建议：${umbrellaHeadline(props.umbrella)}，通勤被淋概率 ${props.umbrella.probability}%`,
)
</script>

<template>
  <GlassCard
    class="umbrella-card"
    :class="`verdict-${umbrella.verdict.toLowerCase()}`"
    role="group"
    :aria-label="ariaLabel"
  >
    <div class="umb-decor">
      <AppIcon
        icon="fluent:umbrella-24-filled"
        :size="26"
        class="umb-glyph"
      />
      <template v-if="wet">
        <i class="umb-drop" />
        <i class="umb-drop d2" />
        <i class="umb-drop d3" />
      </template>
    </div>

    <div class="umb-title">今天带伞吗</div>

    <div class="umb-main">
      <div class="umb-gauge">
        <svg
          viewBox="0 0 80 80"
          class="gauge-svg"
          aria-hidden="true"
        >
          <!-- 弧线从 12 点起算，故只旋转圆环；阈值刻度留在未旋转的坐标系里 -->
          <g transform="rotate(-90 40 40)">
            <circle
              class="gauge-track"
              cx="40"
              cy="40"
              :r="R"
              fill="none"
            />
            <circle
              class="gauge-fill"
              cx="40"
              cy="40"
              :r="R"
              fill="none"
              :stroke-dasharray="CIRC"
              :stroke-dashoffset="dashOffset"
            />
          </g>
          <line
            class="gauge-threshold"
            x1="40"
            :y1="40 - R - 5"
            x2="40"
            :y2="40 - R + 5"
            :transform="`rotate(${(umbrella.threshold / 100) * 360} 40 40)`"
          />
        </svg>
        <div class="gauge-num">
          <CountUpNumber
            :value="umbrella.probability"
            :duration="900"
          /><span class="gauge-pct">%</span>
        </div>
      </div>

      <div class="umb-copy">
        <div class="umb-headline">
          {{ umbrellaHeadline(umbrella) }}
        </div>
        <div class="umb-reason">
          {{ umbrellaReason(umbrella) }}
        </div>
        <div
          v-if="umbrellaCaveat(umbrella)"
          class="umb-caveat"
        >
          {{ umbrellaCaveat(umbrella) }}
        </div>
      </div>
    </div>

    <div class="umb-legs">
      <div
        v-for="leg in umbrella.legs"
        :key="`${leg.phase}-${leg.start}`"
        class="leg-row"
      >
        <span class="leg-label">{{ umbrellaLegLabel(leg) }}</span>
        <span class="leg-track">
          <span
            class="leg-fill"
            :style="{ width: `${leg.probability}%` }"
          />
        </span>
        <span class="leg-val">{{ leg.probability }}%</span>
      </div>
      <button
        v-if="umbrella.assumed"
        type="button"
        class="leg-adjust"
        @click="emit('adjust')"
      >
        设置我的通勤时间
      </button>
    </div>

    <div class="umb-foot">
      概率高于 {{ umbrella.threshold }}% 才建议带伞
    </div>
  </GlassCard>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;
@use 'sass:map';

.umbrella-card {
  position: relative;
  overflow: hidden;
  padding: 18px 20px;
  --umb: #{$layer-protection};
}

.verdict-bring {
  --umb: #{map.get($demand-colors, 'rain')};
}

.verdict-raincoat {
  --umb: #{$layer-insulation};
}

.umb-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 14px;
}

// ===== 右上角伞形 + 雨滴 =====
.umb-decor {
  position: absolute;
  top: 14px;
  right: 18px;
  width: 28px;
  height: 46px;
}

.umb-glyph {
  color: var(--umb);
  opacity: 0.9;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.25));
  animation: umb-breathe 2.6s ease-in-out infinite;
}

.umb-drop {
  position: absolute;
  top: 28px;
  left: 4px;
  width: 4px;
  height: 8px;
  border-radius: 0 60% 60% 60%;
  transform: rotate(45deg);
  background: var(--umb);
  opacity: 0;
  animation: umb-drop 1.9s linear infinite;

  &.d2 {
    left: 12px;
    animation-delay: 0.6s;
  }

  &.d3 {
    left: 21px;
    animation-delay: 1.2s;
  }
}

// ===== 仪表 + 文案 =====
.umb-main {
  display: flex;
  align-items: center;
  gap: 16px;
}

.umb-gauge {
  position: relative;
  width: 76px;
  height: 76px;
  flex-shrink: 0;
}

.gauge-svg {
  width: 100%;
  height: 100%;
}

.gauge-track {
  stroke: rgba(255, 255, 255, 0.14);
  stroke-width: 7;
}

.gauge-fill {
  stroke: var(--umb);
  stroke-width: 7;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.9s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.gauge-threshold {
  stroke: rgba(255, 255, 255, 0.5);
  stroke-width: 1.5;
}

.gauge-num {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  text-shadow: $text-shadow-vibrant;
}

.gauge-pct {
  font-size: 12px;
  font-weight: 500;
  color: $text-tertiary;
  margin-left: 1px;
}

.umb-copy {
  flex: 1;
  min-width: 0;
}

.umb-headline {
  font-size: 19px;
  font-weight: 700;
  color: var(--umb);
  text-shadow: $text-shadow-vibrant;
}

.umb-reason {
  margin-top: 5px;
  font-size: 13px;
  line-height: 1.45;
  color: $text-secondary;
}

.umb-caveat {
  margin-top: 4px;
  font-size: 12px;
  color: $text-tertiary;
}

// ===== 分段明细 =====
.umb-legs {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.leg-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 7px;
}

.leg-label {
  width: 72px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: $text-tertiary;
}

.leg-track {
  flex: 1;
  height: 5px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
}

.leg-fill {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: var(--umb);
  opacity: 0.8;
  transition: width 0.6s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.leg-val {
  width: 34px;
  text-align: right;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: $text-secondary;
}

.umb-foot {
  margin-top: 10px;
  font-size: 11px;
  color: $text-tertiary;
}

// 触控目标 ≥44pt（HIG）
.leg-adjust {
  display: block;
  width: 100%;
  min-height: 44px;
  margin-top: 6px;
  border: none;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: $text-secondary;
  font-family: inherit;
  font-size: 13px;
  text-align: left;
  padding: 0 12px;
  cursor: pointer;
}

@keyframes umb-drop {
  0% {
    opacity: 0;
    transform: rotate(45deg) translate(0, 0) scale(0.6);
  }
  25% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: rotate(45deg) translate(0, 16px) scale(1);
  }
}

@keyframes umb-breathe {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.07);
  }
}

@media (prefers-reduced-motion: reduce) {
  .umb-drop {
    display: none;
  }

  .umb-glyph,
  .gauge-fill,
  .leg-fill {
    animation: none;
    transition: none;
  }
}
</style>
