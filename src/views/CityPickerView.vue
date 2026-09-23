<script setup lang="ts">
// 选城页：中文搜索（防抖 300ms）+ 一键定位 + 结果列表
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDebounceFn, useVibrate } from '@vueuse/core'
import AppIcon from '@/components/AppIcon.vue'
import { searchCities } from '@/data/geo/citySearch'
import { CityService } from '@/services/cityService'
import { useWeatherStore } from '@/stores/weather'
import type { CityInfo } from '@/core/types'

const router = useRouter()
const weather = useWeatherStore()
const cityService = new CityService()

const query = ref('')
const results = ref<CityInfo[]>([])
const searching = ref(false)
const locating = ref(false)
const locatingError = ref<string | null>(null)
const searchError = ref<string | null>(null)
const hasSearched = ref(false)

const { vibrate } = useVibrate({ pattern: [10] })

async function doSearch() {
  const q = query.value.trim()
  if (!q) {
    results.value = []
    hasSearched.value = false
    return
  }
  searching.value = true
  searchError.value = null
  try {
    results.value = await searchCities(q)
    hasSearched.value = true
  } catch {
    searchError.value = '搜索失败，请检查网络'
  } finally {
    searching.value = false
  }
}

const debouncedSearch = useDebounceFn(doSearch, 300)

async function pick(city: CityInfo) {
  vibrate()
  await weather.selectCity(city)
  goBack()
}

async function locate() {
  locating.value = true
  locatingError.value = null
  const outcome = await cityService.locateCurrent()
  locating.value = false
  if (outcome.error) {
    locatingError.value = outcome.error
    return
  }
  await pick(outcome.city)
}

/** 从选城页返回：仅当确实从首页导航而来时 back，深链接/刷新进入时回首页 */
function goBack() {
  const back = router.options.history.state.back as string | null | undefined
  const isFromApp = Boolean(back && back !== 'about:blank' && back.startsWith(location.origin))
  if (isFromApp) {
    router.back()
  } else {
    router.replace('/')
  }
}
</script>

<template>
  <main class="picker-page">
    <header class="picker-header">
      <button
        type="button"
        class="back-btn"
        aria-label="返回"
        @click="goBack"
      >
        <AppIcon
          icon="fluent:chevron-left-28-regular"
          :size="24"
        />
      </button>
      <h1 class="title">选择城市</h1>
      <div class="header-spacer" />
    </header>

    <div class="search-box">
      <AppIcon
        icon="fluent:search-24-regular"
        :size="18"
        class="search-icon"
      />
      <input
        v-model="query"
        type="search"
        class="search-input"
        placeholder="搜索城市（中文）"
        @input="debouncedSearch"
      />
      <button
        v-if="query"
        type="button"
        class="clear-btn"
        aria-label="清除"
        @click="query = ''; results = []; hasSearched = false"
      >
        <AppIcon
          icon="fluent:dismiss-circle-24-regular"
          :size="18"
        />
      </button>
    </div>

    <button
      type="button"
      class="locate-btn"
      :disabled="locating"
      @click="locate"
    >
      <AppIcon
        icon="fluent:location-28-regular"
        :size="18"
      />
      <span>{{ locating ? '定位中…' : '使用我的当前位置' }}</span>
    </button>

    <p
      v-if="locatingError"
      class="locate-error"
    >
      {{ locatingError }}
    </p>
    <p
      v-if="searchError"
      class="locate-error"
    >
      {{ searchError }}
    </p>

    <div
      v-if="searching"
      class="status-line"
    >
      搜索中…
    </div>

    <ul
      v-else-if="results.length"
      class="result-list"
    >
      <li
        v-for="c in results"
        :key="c.id"
        class="result-item"
        @click="pick(c)"
      >
        <div class="result-main">
          <div class="result-name">{{ c.name }}</div>
          <div
            v-if="c.admin1 || c.country"
            class="result-sub"
          >
            {{ [c.admin1, c.country].filter(Boolean).join(' · ') }}
          </div>
        </div>
        <AppIcon
          icon="fluent:chevron-right-24-regular"
          :size="16"
          class="result-arrow"
        />
      </li>
    </ul>

    <div
      v-else-if="hasSearched"
      class="status-line"
    >
      未找到相关城市
    </div>
  </main>
</template>

<style scoped lang="scss">
.picker-page {
  min-height: 100vh;
  background: #12142e;
  padding: env(safe-area-inset-top, 12px) 0 env(safe-area-inset-bottom, 12px);
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
}

.back-btn {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.title {
  font-size: 18px;
  font-weight: 600;
}

.header-spacer {
  width: 40px;
}

.search-box {
  position: relative;
  margin: 16px 20px 12px;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 0 12px;
}

.search-icon {
  color: rgba(255, 255, 255, 0.55);
}

.search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: #fff;
  font-size: 16px;
  padding: 12px 10px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.45);
  }
}

.clear-btn {
  color: rgba(255, 255, 255, 0.55);
  display: grid;
  place-items: center;
}

.locate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 12px 20px;
  width: calc(100% - 40px);
  padding: 13px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  font-size: 15px;
  font-weight: 500;

  &:active {
    background: rgba(255, 255, 255, 0.24);
  }

  &:disabled {
    opacity: 0.6;
  }
}

.locate-error {
  margin: 0 20px 8px;
  font-size: 13px;
  color: #ffc4bd;
}

.status-line {
  padding: 30px 20px;
  text-align: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.result-list {
  list-style: none;
  margin: 8px 20px 0;
  padding: 0;
}

.result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  &:active {
    background: rgba(255, 255, 255, 0.06);
    border-radius: 10px;
  }
}

.result-name {
  font-size: 16px;
  font-weight: 500;
}

.result-sub {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
}

.result-arrow {
  color: rgba(255, 255, 255, 0.4);
}
</style>