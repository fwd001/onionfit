<script setup lang="ts">
// 提醒卡：穿衣提醒 + 加/减层时间线 + 配饰 + 安全预警
import GlassCard from '@/components/GlassCard.vue'
import type { Accessory, SafetyReport, TimelineEvent } from '@/core/types'
import { accessoryLabel } from '@/presentation'

defineProps<{
  timeline: TimelineEvent[]
  accessories: Accessory[]
  safety: SafetyReport
  carriedText: string
}>()
</script>

<template>
  <GlassCard class="tips-card">
    <template v-if="safety.level !== 'NORMAL'">
      <div
        class="safety-box"
        :class="`safety-${safety.level.toLowerCase()}`"
      >
        <div class="safety-title">
          {{ safety.level === 'DANGER' ? '安全提醒' : '温馨提示' }}
        </div>
        <div
          v-for="(w, i) in safety.warnings"
          :key="i"
          class="safety-warning"
        >
          {{ w }}
        </div>
      </div>
    </template>

    <div
      v-if="timeline.length"
      class="tip-block"
    >
      <div class="tip-title">什么时候脱 / 加</div>
      <div
        v-for="(ev, i) in timeline"
        :key="i"
        class="timeline-row"
      >
        <span class="tl-time">{{ ev.hour }}</span>
        <span
          class="tl-action"
          :class="ev.action === 'ADD' ? 'act-add' : 'act-remove'"
        >
          {{ ev.action === 'ADD' ? '加' : '脱' }}
        </span>
        <span class="tl-label">{{ ev.layerLabel }}</span>
      </div>
    </div>

    <div
      v-if="accessories.length"
      class="tip-block"
    >
      <div class="tip-title">配饰与携带</div>
      <div class="accessories">
        <div
          v-for="a in accessories"
          :key="a.kind"
          class="acc-chip"
        >
          {{ accessoryLabel(a) }}
        </div>
      </div>
    </div>

    <div
      v-if="carriedText"
      class="tip-block"
    >
      <div class="tip-title">怎么穿</div>
      <div class="carried-text">{{ carriedText }}</div>
    </div>
  </GlassCard>
</template>

<style scoped lang="scss">
.tips-card {
  padding: 18px 20px;
}

.safety-box {
  border-radius: 16px;
  padding: 14px;
  margin-bottom: 14px;
}

.safety-watch {
  background: rgba(255, 215, 110, 0.16);
  border: 1px solid rgba(255, 215, 110, 0.4);
}

.safety-danger {
  background: rgba(255, 99, 88, 0.18);
  border: 1px solid rgba(255, 99, 88, 0.5);
}

.safety-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 6px;
}

.safety-warning {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.88);
  margin-top: 4px;
}

.tip-block {
  margin-top: 14px;

  &:first-of-type {
    margin-top: 0;
  }
}

.tip-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
}

.timeline-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;

  &:last-child {
    margin-bottom: 0;
  }
}

.tl-time {
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.72);
  width: 40px;
}

.tl-action {
  font-size: 12px;
  font-weight: 700;
  border-radius: 6px;
  padding: 2px 7px;
}

.act-add {
  background: rgba(168, 230, 176, 0.22);
  color: #a8e6b0;
}

.act-remove {
  background: rgba(255, 210, 143, 0.22);
  color: #ffd28f;
}

.tl-label {
  font-size: 13px;
}

.accessories {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.acc-chip {
  font-size: 13px;
  padding: 6px 11px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.88);
}

.carried-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}
</style>