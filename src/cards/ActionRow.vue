<script setup lang="ts">
// 操作行：人群 / 活动（点击展开就地设置面板）+ 刷新 / 定位 胶囊
import { useVibrate } from '@vueuse/core'
import AppIcon from '@/components/AppIcon.vue'

defineProps<{
  profileLabel: string
  activityLabel: string
  loading: boolean
  /** 设置面板是否展开（胶囊高亮提示可再点收起） */
  settingsOpen: boolean
  /** 正在定位 */
  locating: boolean
}>()

const emit = defineEmits<{
  refresh: []
  toggle: []
  locate: []
}>()

// 轻点触觉反馈（原生手感）
const { vibrate } = useVibrate({ pattern: [10] })

function onToggle() {
  vibrate()
  emit('toggle')
}
</script>

<template>
  <div class="action-row">
    <div class="capsules">
      <button
        type="button"
        class="cap"
        :class="{ active: settingsOpen }"
        :aria-expanded="settingsOpen"
        @click="onToggle"
      >
        <AppIcon
          icon="fluent:person-28-regular"
          :size="16"
        />
        <span>{{ profileLabel }}</span>
      </button>
      <button
        type="button"
        class="cap"
        :class="{ active: settingsOpen }"
        :aria-expanded="settingsOpen"
        @click="onToggle"
      >
        <AppIcon
          icon="fluent:person-walking-24-regular"
          :size="16"
        />
        <span>{{ activityLabel || '活动' }}</span>
      </button>
    </div>
    <div class="capsules">
      <button
        type="button"
        class="cap"
        :class="{ spinning: loading }"
        aria-label="刷新"
        @click="emit('refresh')"
      >
        <AppIcon
          icon="fluent:arrow-clockwise-28-regular"
          :size="18"
        />
      </button>
      <button
        type="button"
        class="cap"
        :class="{ locating }"
        :disabled="locating"
        aria-label="定位到当前位置"
        @click="emit('locate')"
      >
        <AppIcon
          icon="fluent:location-28-regular"
          :size="18"
        />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px 0;
  gap: 8px;
}

.capsules {
  display: flex;
  gap: 8px;
}

.cap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  transition: background 0.2s;

  &:active {
    background: rgba(255, 255, 255, 0.24);
  }

  &.active {
    background: rgba(255, 255, 255, 0.28);
  }

  &:disabled {
    opacity: 0.6;
  }

  &.locating {
    animation: locate-pulse 1.2s ease-in-out infinite;
  }
}

@keyframes locate-pulse {
  50% {
    opacity: 0.5;
  }
}

.spinning svg {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
