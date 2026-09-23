<script setup lang="ts">
withDefaults(
  defineProps<{
    /** 强调（更强背景/描边） */
    strong?: boolean
  }>(),
  { strong: false },
)
</script>

<template>
  <div
    class="glass-card"
    :class="{ 'glass-strong': strong }"
  >
    <slot />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;
@use '@/styles/glass';

.glass-card {
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.18),
    inset 0 0.5px 0 rgba(255, 255, 255, 0.18);
}

.glass-strong {
  background: rgba(255, 255, 255, 0.24);
}
</style>