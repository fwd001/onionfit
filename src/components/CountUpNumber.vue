<script setup lang="ts">
// 数字滚动动画（用 @vueuse useTransition，避免手写 rAF）
import { useTransition } from '@vueuse/core'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    value: number
    /** 小数位 */
    digits?: number
    /** 动画时长 ms */
    duration?: number
  }>(),
  { digits: 0, duration: 500 },
)

// useTransition 自动对源 ref 变化做补间动画
const input = computed(() => props.value)
const transitioned = useTransition(input, {
  duration: props.duration,
  transition: [0.22, 0.61, 0.36, 1],
})

const display = computed(() => transitioned.value.toFixed(props.digits))
</script>

<template>
  <span class="count-up">{{ display }}</span>
</template>

<style scoped>
.count-up {
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}
</style>