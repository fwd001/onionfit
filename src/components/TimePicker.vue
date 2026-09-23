<script setup lang="ts">
// 出门/回家时间选择：点击唤起原生 time picker（iOS/Android 调系统滚轮，体验原生）
// 已选时间可通过 × 一键清除

import AppIcon from '@/components/AppIcon.vue'

defineProps<{
  modelValue: string | null
  placeholder: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

function onChange(e: Event) {
  const input = e.target as HTMLInputElement
  emit('update:modelValue', input.value || null)
}

function clear() {
  emit('update:modelValue', null)
}
</script>

<template>
  <div class="time-field">
    <button
      type="button"
      class="time-btn"
    >
      <span class="time-value">{{ modelValue ?? placeholder }}</span>
      <input
        type="time"
        class="time-native"
        :value="modelValue ?? ''"
        @change="onChange"
      />
    </button>
    <button
      v-if="modelValue"
      type="button"
      class="clear-btn"
      aria-label="清除时间"
      @click.stop="clear"
    >
      <AppIcon
        icon="fluent:dismiss-circle-24-regular"
        :size="16"
      />
    </button>
  </div>
</template>

<style scoped lang="scss">
.time-field {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.time-btn {
  position: relative;
  min-width: 88px;
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  text-align: center;

  &:active {
    background: rgba(255, 255, 255, 0.2);
  }
}

.time-value {
  pointer-events: none;
}

.time-native {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.clear-btn {
  position: absolute;
  right: 6px;
  display: grid;
  place-items: center;
  padding: 4px;
  color: rgba(255, 255, 255, 0.55);
  z-index: 1;

  &:active {
    color: rgba(255, 255, 255, 0.85);
  }
}
</style>
