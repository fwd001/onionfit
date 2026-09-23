<script setup lang="ts">
// 首页：组装全部卡片 + 天气渐变背景 + 下拉刷新 + 就地设置 + 深色模式
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useWeatherStore } from '@/stores/weather'
import { useSettingsStore } from '@/stores/settings'
import { plan } from '@/core/engine/planner'
import type { OutfitRecommendation } from '@/core/types'
import { SELECTABLE_ACTIVITIES } from '@/core/engine/activity'
import { usePullToRefresh } from '@/composables/usePullToRefresh'
import { paletteFor } from '@/composables/palette'
import { layerAdvice, weatherDesc } from '@/presentation'
import { CityService } from '@/services/cityService'

import HeaderBar from '@/cards/HeaderBar.vue'
import ActionRow from '@/cards/ActionRow.vue'
import ErrorBanner from '@/cards/ErrorBanner.vue'
import Hero from '@/cards/Hero.vue'
import MetricsRow from '@/cards/MetricsRow.vue'
import OnionCard from '@/cards/OnionCard.vue'
import DemandCard from '@/cards/DemandCard.vue'
import DaypartCard from '@/cards/DaypartCard.vue'
import HoursCard from '@/cards/HoursCard.vue'
import TipsCard from '@/cards/TipsCard.vue'
import TomorrowCard from '@/cards/TomorrowCard.vue'
import MetaLine from '@/cards/MetaLine.vue'
import SettingsSheet from '@/cards/SettingsSheet.vue'
import StaggerContainer from '@/components/StaggerContainer.vue'

const weather = useWeatherStore()
const settings = useSettingsStore()
const { report, loading, error } = storeToRefs(weather)

weather.bootstrap()

const showSettings = ref(false)
const locating = ref(false)
const locateError = ref<string | null>(null)
const scrollRef = ref<HTMLElement | null>(null)
const pull = usePullToRefresh(scrollRef, () => weather.refresh())
const cityService = new CityService()

const recommendation = computed<OutfitRecommendation | null>(() => {
  if (!report.value) return null
  return plan({ report: report.value, settings: settings.settings })
})

const palette = computed(() =>
  paletteFor(report.value?.current.condition ?? 'clear', report.value?.current.isDay ?? true),
)

const profileLabels: Record<string, string> = {
  CHILD: '儿童',
  ADULT: '成人',
  ELDERLY: '老人',
  COLD_SENSITIVE: '怕冷',
  NORMAL: '标准',
  HEAT_SENSITIVE: '怕热',
}

/** 人群胶囊：完整显示个性化（默认界面不开面板即可一眼看到） */
const profileLabel = computed(() => {
  const base = profileLabels[settings.profile] ?? settings.profile
  const sens = settings.sensitivity
  return sens !== 'NORMAL' ? `${base} · ${profileLabels[sens] ?? sens}` : base
})

const activityLabel = computed(
  () => SELECTABLE_ACTIVITIES.find((a) => a.value === settings.activity)?.label ?? '活动',
)

const carriedText = computed(() =>
  recommendation.value ? layerAdvice(recommendation.value.nowOutfit.layers) : '',
)

// 设置变化 → 只重算不重新拉网（持久化）
watch(
  () => settings.settings,
  () => {
    if (report.value) weather.persist()
  },
  { deep: true },
)

// 下拉刷新指示位移（transform）
const pullStyle = computed(() => ({
  transform: `translateY(${pull.distance}px)`,
  transition: pull.refreshing ? 'transform 0.3s' : 'none',
}))

function onRefreshClick() {
  void weather.refresh()
}

/** 首页定位：定位 → 逆地理 → 切换城市拉天气（定位胶囊） */
async function onLocate() {
  if (locating.value) return
  locating.value = true
  locateError.value = null
  const outcome = await cityService.locateCurrent()
  locating.value = false
  if (outcome.error) {
    locateError.value = outcome.error
    return
  }
  await weather.selectCity(outcome.city)
}

/** 展开/收起设置面板（人群/活动胶囊 toggle；面板内"完成"也可关闭） */
function onToggleSettings() {
  locateError.value = null
  showSettings.value = !showSettings.value
}

// 首次使用（无引导记录）：自动展开设置面板让用户先选择配置；
// 之后每次进入直接沿用上次选择，不再打扰
if (!settings.isOnboarded) {
  showSettings.value = true
}
</script>

<template>
  <div
    ref="scrollRef"
    class="home-page"
    :style="{ background: palette.gradient }"
  >
    <div
      class="glow"
      :style="{ background: palette.glow }"
    />
    <!-- 下拉刷新指示 -->
    <div
      class="pull-indicator"
      :style="{ opacity: pull.distance > 0 || pull.refreshing ? 1 : 0 }"
    >
      <span v-if="pull.refreshing">刷新中…</span>
      <span v-else>{{ pull.ready ? '松开刷新' : '下拉刷新' }}</span>
    </div>

    <div
      class="content"
      :style="pullStyle"
    >
      <HeaderBar
        :city-name="weather.city.name"
        :source-label="weather.sourceLabel"
        :minutes-ago="weather.minutesAgo"
      />

      <ActionRow
        :profile-label="profileLabel"
        :activity-label="activityLabel"
        :loading="loading"
        :settings-open="showSettings"
        :locating="locating"
        @refresh="onRefreshClick"
        @toggle="onToggleSettings"
        @locate="onLocate"
      />

      <Transition name="sheet">
        <SettingsSheet
          v-if="showSettings"
          @close="showSettings = false"
        />
      </Transition>

      <ErrorBanner
        v-if="error"
        :message="error"
      />
      <ErrorBanner
        v-if="locateError"
        :message="locateError"
      />

      <!-- 骨架屏：与真实卡片同构的 shimmer 占位（无缓存首开时） -->
      <div
        v-if="!recommendation"
        class="skeleton-stack"
      >
        <div class="skel skel-hero">
          <div class="skel-line big" />
          <div class="skel-line" />
        </div>
        <div class="skel skel-card">
          <div class="skel-line" />
          <div class="skel-line short" />
          <div class="skel-line short" />
        </div>
        <div class="skel skel-card">
          <div class="skel-line" />
          <div class="skel-line short" />
        </div>
      </div>

      <template v-else>
        <StaggerContainer>
          <Hero
            :temp="recommendation.current.temperatureC"
            :feels-like="recommendation.thermal.feelsLikeC"
            :condition="weatherDesc(
              recommendation.current.condition,
              recommendation.current.temperatureC,
              recommendation.current.isDay,
            )"
            :is-day="recommendation.current.isDay"
          />
          <MetricsRow
            :feels-like="recommendation.thermal.feelsLikeC"
            :humidity="recommendation.current.humidityPercent"
            :wind-ms="recommendation.current.windSpeedMs"
            :rain-chance="recommendation.current.precipitationProbability"
          />
          <OnionCard
            :outfit="recommendation.nowOutfit"
            :worn-count="recommendation.wornNowCount"
          />
          <DemandCard :demand="recommendation.demand.vector" />
          <DaypartCard :periods="recommendation.periods" />
          <HoursCard
            v-if="report && report.hourly.length"
            :hourly="report.hourly"
            :now-hour="new Date().getHours()"
          />
          <TipsCard
            :timeline="recommendation.timeline"
            :accessories="recommendation.accessories"
            :safety="recommendation.safety"
            :carried-text="carriedText"
          />
          <TomorrowCard
            v-if="recommendation.tomorrow"
            :headline="recommendation.tomorrow.headline"
            :detail="recommendation.tomorrow.detail"
          />
        </StaggerContainer>
      </template>

      <MetaLine
        :source-label="weather.sourceLabel"
        :minutes-ago="weather.minutesAgo"
        :stale="weather.stale"
      />
      <div class="safe-bottom-space" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.home-page {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
  transition: background 0.6s ease;
}

.glow {
  position: fixed;
  top: -120px;
  left: 50%;
  width: 420px;
  height: 420px;
  transform: translateX(-50%);
  border-radius: 50%;
  opacity: 0.35;
  filter: blur(90px);
  transition: background 0.6s ease;
  pointer-events: none;
}

.content {
  position: relative;
  padding: env(safe-area-inset-top, 12px) 0 0;
}

.pull-indicator {
  position: fixed;
  top: calc(env(safe-area-inset-top, 12px) + 6px);
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  transition: opacity 0.2s;
  z-index: 5;
}

// ===== 骨架屏（与真实卡片同构，shimmer 横向流动） =====
.skeleton-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 16px 0;
}

.skel {
  border-radius: 24px;
  background:
    linear-gradient(
      100deg,
      rgba(255, 255, 255, 0.06) 40%,
      rgba(255, 255, 255, 0.13) 50%,
      rgba(255, 255, 255, 0.06) 60%
    );
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

.skel-hero {
  min-height: 140px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.skel-card {
  min-height: 120px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skel-line {
  height: 14px;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.1);
  width: 55%;

  &.big {
    width: 40%;
    height: 64px;
    border-radius: 16px;
  }

  &.short {
    width: 35%;
  }
}

@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}

.sheet-enter-active,
.sheet-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.safe-bottom-space {
  height: calc(env(safe-area-inset-bottom, 0px) + 24px);
}
</style>