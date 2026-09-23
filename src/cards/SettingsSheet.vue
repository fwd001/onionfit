<script setup lang="ts">
// 就地设置面板：为谁穿衣（人群）/ 冷热偏好 / 活动 / 出门/回家时间
import { computed } from 'vue'
import SegmentedPicker from '@/components/SegmentedPicker.vue'
import TimePicker from '@/components/TimePicker.vue'
import GlassCard from '@/components/GlassCard.vue'
import { useSettingsStore } from '@/stores/settings'
import { SELECTABLE_ACTIVITIES } from '@/core/engine/activity'
import type { BodyProfile, HeatSensitivity } from '@/core/types'

const emit = defineEmits<{
  close: []
}>()

const settings = useSettingsStore()

/** 首次进入：引导文案代替普通标题 */
const sheetTitle = computed(() =>
  settings.isOnboarded ? '个性化设置' : '先花 10 秒，让推荐更懂你',
)

/** 完成：结束首次引导 + 收起面板 */
function onDone() {
  settings.completeOnboarding()
  emit('close')
}

const profileOptions = computed(() => [
  { value: 'CHILD' as BodyProfile, label: '儿童' },
  { value: 'ADULT' as BodyProfile, label: '成人' },
  { value: 'ELDERLY' as BodyProfile, label: '老人' },
])

const sensitivityOptions = computed(() => [
  { value: 'COLD_SENSITIVE' as HeatSensitivity, label: '怕冷' },
  { value: 'NORMAL' as HeatSensitivity, label: '标准' },
  { value: 'HEAT_SENSITIVE' as HeatSensitivity, label: '怕热' },
])
</script>

<template>
  <GlassCard class="settings-sheet">
    <div class="sheet-head">
      <div class="sheet-title">{{ sheetTitle }}</div>
      <button
        type="button"
        class="done-btn"
        @click="onDone"
      >
        完成
      </button>
    </div>
    <div class="sheet-row">
      <div class="sheet-label">为谁穿衣</div>
      <SegmentedPicker
        :options="profileOptions"
        :model-value="settings.profile"
        @update:model-value="settings.set('profile', $event)"
      />
    </div>
    <div class="sheet-row">
      <div class="sheet-label">冷热偏好</div>
      <SegmentedPicker
        :options="sensitivityOptions"
        :model-value="settings.sensitivity"
        @update:model-value="settings.set('sensitivity', $event)"
      />
    </div>
    <div class="sheet-row">
      <div class="sheet-label">活动</div>
      <SegmentedPicker
        scrollable
        :options="SELECTABLE_ACTIVITIES"
        :model-value="settings.activity"
        @update:model-value="settings.set('activity', $event)"
      />
    </div>
    <div class="sheet-row sheet-row-time">
      <div class="sheet-label">出门 / 回家</div>
      <div class="time-pair">
        <TimePicker
          :model-value="settings.outTime"
          placeholder="出门"
          @update:model-value="settings.set('outTime', $event)"
        />
        <span class="time-sep">→</span>
        <TimePicker
          :model-value="settings.homeTime"
          placeholder="回家"
          @update:model-value="settings.set('homeTime', $event)"
        />
      </div>
    </div>
    <div
      v-if="!settings.hasSchedule"
      class="sheet-tip"
    >
      同时填出门与回家时间，才能给出更准的时段建议
    </div>
  </GlassCard>
</template>

<style scoped lang="scss">
.settings-sheet {
  margin: 10px 16px 0;
  padding: 16px;
}

.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.sheet-title {
  font-size: 15px;
  font-weight: 600;
}

.done-btn {
  padding: 5px 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  font-size: 13px;
  font-weight: 600;
  color: #fff;

  &:active {
    background: rgba(255, 255, 255, 0.34);
  }
}

.sheet-row {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.sheet-label {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.72);
  margin-bottom: 8px;
}

.sheet-row-time {
  .time-pair {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .time-sep {
    color: rgba(255, 255, 255, 0.5);
  }
}

.sheet-tip {
  margin-top: 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
}
</style>