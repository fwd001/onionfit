// 天气服务：拉取 + 断网降级（保留旧快照）+ 错误转人话

import { getProvider, type WeatherProvider } from '@/data/provider'
import type { WeatherReport } from '@/core/types'

export interface WeatherResult {
  report: WeatherReport
  /** 显示用的来源信息 */
  sourceLabel: string
  /** 距上次成功更新的分钟数 */
  minutesAgo: number
  /** 是否使用旧快照降级 */
  stale: boolean
}

export class WeatherService {
  private provider: WeatherProvider = getProvider()

  /**
   * 拉取天气。失败时若有缓存则返回缓存（stale=true），否则抛出人话错误。
   */
  async fetchOrCached(
    lat: number,
    lon: number,
    cached: WeatherReport | null,
  ): Promise<WeatherResult> {
    try {
      const report = await this.provider.fetchWeather({ lat, lon })
      return {
        report,
        sourceLabel: this.provider.label,
        minutesAgo: 0,
        stale: false,
      }
    } catch (err) {
      if (cached) {
        const minutesAgo = minutesBetween(cached.generatedAt, new Date())
        return {
          report: cached,
          sourceLabel: this.provider.label,
          minutesAgo,
          stale: true,
        }
      }
      throw new Error(toFriendlyMessage(err))
    }
  }

  /** 设置数据源（预留） */
  setProvider(provider: WeatherProvider) {
    this.provider = provider
  }
}

function minutesBetween(generatedAt: string, now: Date): number {
  try {
    const prev = new Date(generatedAt).getTime()
    return Math.max(0, Math.floor((now.getTime() - prev) / 60000))
  } catch {
    return 0
  }
}

function toFriendlyMessage(err: unknown): string {
  if (err instanceof DOMException && err.name === 'AbortError') return '请求超时，请检查网络'
  const m = err instanceof Error ? err.message : String(err)
  if (/network|fetch|failed/i.test(m)) return '网络不可用，稍后再试'
  return m || '获取天气失败'
}