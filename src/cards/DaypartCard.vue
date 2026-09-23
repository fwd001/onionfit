<script setup lang="ts">
// 时段卡片：早/午/晚 三段建议
import GlassCard from '@/components/GlassCard.vue'
import type { PeriodRecommendation } from '@/core/types'

defineProps<{
  periods: PeriodRecommendation[]
}>()
</script>

<template>
  <GlassCard class="daypart-card">
    <div class="card-title">今日分段</div>
    <div class="periods">
      <div
        v-for="(p, i) in periods"
        :key="p.phase + i"
        class="period"
      >
        <div
          class="period-badge"
          :class="`phase-${p.phase}`"
        >
          {{ p.label }}
        </div>
        <div class="period-advice">{{ p.advice }}</div>
      </div>
    </div>
  </GlassCard>
</template>

<style scoped lang="scss">
.daypart-card {
  padding: 18px 20px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 14px;
}

.periods {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.period {
  display: flex;
  align-items: center;
  gap: 12px;
}

.period-badge {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  min-width: 46px;
  text-align: center;
}

.phase-morning {
  background: rgba(255, 210, 143, 0.2);
  color: #ffd28f;
}

.phase-noon {
  background: rgba(143, 211, 255, 0.2);
  color: #8fd3ff;
}

.phase-evening {
  background: rgba(168, 230, 176, 0.2);
  color: #a8e6b0;
}

.period-advice {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
}
</style>