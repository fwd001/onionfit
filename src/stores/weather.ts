// 城市与天气 store：当前城市、天气快照、加载态、错误、刷新

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { CityInfo, WeatherReport } from '@/core/types'
import { readSnapshot, writeSnapshot } from '@/data/snapshot'
import { WeatherService } from '@/services/weatherService'
import { useSettingsStore } from './settings'

const service = new WeatherService()

export const useWeatherStore = defineStore('weather', () => {
  const saved = readSnapshot()

  const city = ref<CityInfo>(saved.city)
  const report = ref<WeatherReport | null>(saved.weather)
  const loading = ref(false)
  const refreshing = ref(false)
  const error = ref<string | null>(null)
  const stale = ref(false)
  const lastFetchedAt = ref<Date | null>(null)
  const sourceLabel = ref('Open-Meteo')

  /** 数据是否久于 60 分钟（stale 标记，FR-08 简化） */
  const isStale = computed(() => {
    if (!report.value) return false
    try {
      const minutes = (Date.now() - new Date(report.value.generatedAt).getTime()) / 60000
      return minutes > 60
    } catch {
      return false
    }
  })

  /** 距上次成功更新的分钟数 */
  const minutesAgo = computed(() => {
    if (!report.value) return 0
    try {
      return Math.max(
        0,
        Math.floor((Date.now() - new Date(report.value.generatedAt).getTime()) / 60000),
      )
    } catch {
      return 0
    }
  })

  const settingsStore = useSettingsStore()

  /** 重新拉取当前城市天气 → 更新快照 → 持久化 */
  async function refresh(): Promise<void> {
    if (loading.value) return
    loading.value = true
    error.value = null
    try {
      const result = await service.fetchOrCached(city.value.lat, city.value.lon, report.value)
      report.value = result.report
      stale.value = result.stale
      sourceLabel.value = result.sourceLabel
      lastFetchedAt.value = result.stale && report.value ? fromMinutesAgo(result.minutesAgo) : new Date()
      persist()
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      loading.value = false
      refreshing.value = false
    }
  }

  /** 更换城市（选城页调用）：乐观更新——城市立即切换、旧天气保留展示，新数据到达后平滑替换 */
  async function selectCity(newCity: CityInfo): Promise<void> {
    city.value = newCity
    stale.value = false
    error.value = null
    await refresh()
  }

  /** 只重算不网络：设置变化时由页面 watch 触发，这里保证存在数据 */
  function ensureData(): void {
    if (!report.value && !loading.value) void refresh()
  }

  function persist(): void {
    writeSnapshot({
      city: city.value,
      weather: report.value,
      settings: settingsStore.settings,
      updatedAt: new Date().toISOString(),
    })
  }

  /** 启动时立即尝试刷新（首次进入有天气） */
  function bootstrap(): void {
    if (!report.value) void refresh()
  }

  return {
    city,
    report,
    loading,
    refreshing,
    error,
    stale,
    lastFetchedAt,
    sourceLabel,
    isStale,
    minutesAgo,
    refresh,
    selectCity,
    ensureData,
    bootstrap,
    persist,
  }
})

function fromMinutesAgo(min: number): Date {
  return new Date(Date.now() - min * 60000)
}