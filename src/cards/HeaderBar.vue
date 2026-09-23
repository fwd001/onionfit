<script setup lang="ts">
// 首页顶部：城市名 + 副标题（更新时间/来源）+ 搜索入口
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'

const props = defineProps<{
  cityName: string
  sourceLabel: string
  /** 天气数据更新于几分钟前 */
  minutesAgo: number
}>()

const router = useRouter()

/** 真实的数据更新时间（而非页面加载时刻） */
const updatedText = computed(() => {
  const m = Math.max(0, props.minutesAgo)
  if (m <= 0) return '刚刚更新'
  if (m < 60) return `${m} 分钟前更新`
  return `${Math.floor(m / 60)} 小时前更新`
})
</script>

<template>
  <header class="header">
    <div class="header-left">
      <h1 class="city">{{ cityName }}</h1>
      <div class="subtitle">{{ updatedText }} · {{ sourceLabel }}</div>
    </div>
    <button
      type="button"
      class="header-btn"
      aria-label="搜索城市"
      @click="router.push('/city')"
    >
      <AppIcon
        icon="fluent:location-28-regular"
        :size="22"
      />
    </button>
  </header>
</template>

<style scoped lang="scss">
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 4px;
}

.city {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.subtitle {
  margin-top: 2px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.header-btn {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  transition: background 0.2s;

  &:active {
    background: rgba(255, 255, 255, 0.24);
  }
}
</style>