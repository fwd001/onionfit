<script setup lang="ts">
// 明日卡片：明日一句话建议
import GlassCard from '@/components/GlassCard.vue'

defineProps<{
  headline: string
  detail: string
}>()
</script>

<template>
  <GlassCard class="tomorrow-card">
    <div class="t-head">
      <span class="t-label">明日建议</span>
      <span class="t-detail">{{ detail }}</span>
    </div>
    <div class="t-headline">{{ headline }}</div>
  </GlassCard>
</template>

<style scoped lang="scss">
.tomorrow-card {
  padding: 18px 20px;
}

.t-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.t-label {
  font-size: 14px;
  font-weight: 600;
}

.t-detail {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.t-headline {
  font-size: 17px;
  font-weight: 600;
}
</style>