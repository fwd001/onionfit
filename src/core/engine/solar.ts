// SolarEngine：昼夜判断、辐射→辐射增益（radiantGainK）、UV → 遮阳需求

import { SOLAR, THERMAL } from '../config'
import { normalize } from './psychrometrics'
import type { WeatherContext } from './weather'

export interface SolarContext {
  isDay: boolean
  /** 当前辐射 W/m²（未知时估算） */
  radiationWm2: number
  /** 辐射对人体产生的升温 (K)（不改气温，只抬作用温度） */
  radiantGainK: number
  uvIndex: number
  /** 遮阳需求 0-100 */
  solarDemand: number
  sunrise: string
  sunset: string
}

/**
 * 用当前时刻 + 上下文的整点数据构建太阳上下文。
 * 辐射未知（-1）时按白天的正弦近似估算；阴天按云量衰减。
 */
export function buildSolarContext(
  ctx: WeatherContext,
  nowHour: number,
): SolarContext {
  const radiationObserved = ctx.radiationAt(nowHour)
  const uvObserved = ctx.uvAt(nowHour)
  const radiation = radiationObserved >= 0 ? radiationObserved : estimateRadiation(ctx, nowHour)
  const isDay = radiation > 0.5

  const gain = radiation * THERMAL.radiantGainCoeff
  const radiantGainK = isDay ? Math.min(gain, THERMAL.radiantGainMaxK) : 0
  const uv = uvObserved >= 0 ? uvObserved : (isDay ? Math.max(ctx.dayUvMax, 1) : 0)

  return {
    isDay,
    radiationWm2: Math.round(radiation),
    radiantGainK: Math.round(radiantGainK * 1000) / 1000,
    uvIndex: uv,
    solarDemand: isDay ? normalize(uv, SOLAR.uvOnset, SOLAR.uvFull) : 0,
    sunrise: SOLAR.fallbackSunrise,
    sunset: SOLAR.fallbackSunset,
  }
}

/** 简化辐射估算：白天正弦近似（6-19 点），云层衰减 */
function estimateRadiation(ctx: WeatherContext, nowHour: number): number {
  if (nowHour <= 6 || nowHour >= 19) return 0
  const peak = 800
  const dayFactor = Math.max(0, Math.sin(((nowHour - 6) / 13) * Math.PI))
  const cloud = ctx.cloudAt(nowHour)
  const cloudFactor = cloud < 0 ? 0.7 : Math.max(0.1, 1 - 0.6 * (cloud / 100))
  return peak * dayFactor * cloudFactor
}