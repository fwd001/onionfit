<script setup lang="ts">
// 错峰进场容器：为每个直接子元素施加错峰出现的 CSS 动画
// 使用方式：子元素需带 .stagger-child，或由容器统一调度
import { onMounted, ref } from 'vue'

withDefaults(
  defineProps<{
    /** 每项间隔 ms */
    stagger?: number
  }>(),
  { stagger: 70 },
)

const el = ref<HTMLElement | null>(null)

onMounted(() => {
  if (!el.value) return
  const children = el.value.querySelectorAll<HTMLElement>(':scope > *')
  children.forEach((child, i) => {
    child.style.opacity = '0'
    child.style.transform = 'translateY(12px)'
    child.animate(
      [
        { opacity: 0, transform: 'translateY(12px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      {
        duration: 420,
        delay: i * 70,
        easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
        fill: 'both',
      },
    )
  })
})
</script>

<template>
  <div
    ref="el"
    class="stagger-container"
  >
    <slot />
  </div>
</template>

<style scoped lang="scss">
/* 统一卡片流：垂直间距 + 屏幕左右边距（HIG 16pt） */
.stagger-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 16px 0;
}
</style>