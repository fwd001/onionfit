<script setup lang="ts">
// 需求向量卡片：六维需求条（稳定配色），展示"今天的主要矛盾"
import GlassCard from '@/components/GlassCard.vue'
import { DEMAND_META } from '@/presentation'
import type { DemandVector } from '@/core/types'

defineProps<{
  demand: DemandVector
}>()

const colors: Record<keyof DemandVector, string> = {
  WARMTH: '#FFB07A',
  WIND: '#9FE8FF',
  RAIN: '#8FB6FF',
  BREATHABILITY: '#A8E6B0',
  SOLAR: '#FFD76E',
  REMOVABLE: '#D7B3FF',
}
</script>

<template>
  <GlassCard class="demand-card">
    <div class="demand-title">今天的主要矛盾</div>
    <div
      v-for="(dim, key) in demand"
      :key="key"
      class="demand-bar"
    >
      <div class="demand-label">
        {{ DEMAND_META[key as keyof typeof DEMAND_META].label }}
      </div>
      <div class="bar-track">
        <div
          class="bar-fill"
          :style="{
            width: `${dim}%`,
            background: colors[key as keyof DemandVector],
          }"
        />
      </div>
      <div class="demand-val">{{ dim }}</div>
    </div>
  </GlassCard>
</template>

<style scoped lang="scss">
.demand-card {
  padding: 18px 20px;
}

.demand-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 14px;
}

.demand-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;

  &:last-child {
    margin-bottom: 0;
  }
}

.demand-label {
  width: 44px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
}

.bar-track {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.demand-val {
  width: 28px;
  text-align: right;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.6);
}
</style>