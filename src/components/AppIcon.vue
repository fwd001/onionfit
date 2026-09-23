<script setup lang="ts">
import { Icon } from '@iconify/vue'
import './icons'

withDefaults(
  defineProps<{
    /** Iconify 图标名，如 fluent:weather-sunny-16-regular */
    icon: string
    size?: number
  }>(),
  { size: 22 },
)
</script>

<template>
  <Icon
    :icon="icon"
    :width="size"
    :height="size"
    aria-hidden="true"
    class="app-icon"
  />
</template>

<style scoped>
.app-icon {
  flex-shrink: 0;
}
</style>