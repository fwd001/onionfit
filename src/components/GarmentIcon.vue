<script setup lang="ts">
// 衣物卡通图形：按目录 id 渲染简笔 SVG（描边随 currentColor / 层语义色）
import { computed } from 'vue'
import { GARMENT_ART } from './garments'

const props = withDefaults(
  defineProps<{
    /** catalog.ts 中的衣物 id */
    id: string
    size?: number
  }>(),
  { size: 26 },
)

const art = computed(() => GARMENT_ART[props.id])
</script>

<template>
  <svg
    v-if="art"
    class="garment-icon"
    :width="size"
    :height="size"
    viewBox="0 0 64 64"
    fill="none"
    stroke="currentColor"
    stroke-width="3"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="art.body" />
    <path
      v-for="(d, i) in art.details ?? []"
      :key="i"
      :d="d"
      stroke-width="2.2"
      opacity="0.9"
    />
  </svg>
</template>

<style scoped>
.garment-icon {
  flex-shrink: 0;
  display: block;
}
</style>
