// Open-Meteo WMO weather code → WeatherKind 映射
// 参考 https://open-meteo.com/en/docs 的 WMO Weather interpretation codes

import type { WeatherKind } from '@/core/types'

export function mapWeatherCode(code: number): WeatherKind {
  if (code === 0) return 'clear'
  if (code <= 3) return 'cloudy'
  if (code >= 45 && code <= 48) return 'fog'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
  if (code >= 71 && code <= 77) return 'snow'
  if (code >= 95) return 'thunder'
  return 'cloudy'
}

/** 数组访问的容错：越界或 undefined 返回 fallback */
export function at(arr: number[] | undefined, i: number, fallback = -1): number {
  if (!arr) return fallback
  return arr[i] ?? fallback
}

export function atStr(arr: string[] | undefined, i: number, fallback = ''): string {
  if (!arr) return fallback
  return arr[i] ?? fallback
}