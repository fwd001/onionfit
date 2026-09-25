// SafetyEngine：安全预警（先算）。forcedDemands 只上调需求，永不下调

import { SAFETY } from '../config'
import type { DemandVector, SafetyLevel, SafetyReport } from '../types'
import type { WeatherContext } from './weather'
import type { PersonProfile } from './person'
import type { ResolvedActivity } from './activity'
import { round1 } from './psychrometrics'

export type { SafetyReport } from '../types'

export function assessSafety(
  ctx: WeatherContext,
  person: PersonProfile,
  activity: ResolvedActivity,
): SafetyReport {
  const warnings: string[] = []
  let level: SafetyLevel = 'NORMAL'
  const forced: Partial<DemandVector> = {}

  const temp = ctx.dayMaxC
  const dayMin = ctx.dayMinC
  const wind = ctx.windMaxMs
  const rain = ctx.dayRainMm

  // 高温
  if (temp >= SAFETY.dangerHeatC) {
    level = maxLevel(level, 'DANGER')
    warnings.push(`白天最高 ${round1(temp)}℃，谨防中暑，减少长时间户外活动`)
    forced.WARMTH = 0 // 不用保暖（高危高温），同时抬升透气
    forced.BREATHABILITY = Math.max(forced.BREATHABILITY ?? 0, 80)
    forced.SOLAR = Math.max(forced.SOLAR ?? 0, 70)
  } else if (temp >= SAFETY.watchHeatC) {
    level = maxLevel(level, 'WATCH')
    warnings.push(`白天最高 ${round1(temp)}℃，户外注意补水与遮阳`)
    forced.SOLAR = Math.max(forced.SOLAR ?? 0, 40)
  }

  // 严寒
  if (dayMin <= SAFETY.dangerColdC) {
    level = maxLevel(level, 'DANGER')
    warnings.push(`凌晨最低 ${round1(dayMin)}℃，谨防冻伤，注意手脚保暖`)
    forced.WARMTH = Math.max(forced.WARMTH ?? 0, 95)
  } else if (dayMin <= SAFETY.watchColdC) {
    level = maxLevel(level, 'WATCH')
    warnings.push(`早晚最低 ${round1(dayMin)}℃，注意添加保暖层`)
    forced.WARMTH = Math.max(forced.WARMTH ?? 0, 75)
  }

  // 风
  if (wind >= SAFETY.dangerWindMs) {
    level = maxLevel(level, 'DANGER')
    warnings.push(`阵风可达 ${round1(wind)} m/s，注意防风保暖`)
    forced.WIND = Math.max(forced.WIND ?? 0, 90)
  } else if (wind >= SAFETY.watchWindMs) {
    level = maxLevel(level, 'WATCH')
    warnings.push(`风力较大（约 ${round1(wind)} m/s），防风外层有帮助`)
    forced.WIND = Math.max(forced.WIND ?? 0, 50)
  }

  // 强降雨（只谈穿着的外层，「带不带伞」由 UmbrellaEngine 单独给结论）
  if (rain >= SAFETY.dangerRainMm) {
    level = maxLevel(level, 'DANGER')
    warnings.push('预计降雨量较大，外层务必防水')
    forced.RAIN = Math.max(forced.RAIN ?? 0, 95)
  } else if (rain >= SAFETY.watchRainMm) {
    level = maxLevel(level, 'WATCH')
    warnings.push('有降雨，外层建议选防水面料')
    forced.RAIN = Math.max(forced.RAIN ?? 0, 60)
  }

  // 人群保守性（老人/儿童在高低温都额外上抬）
  if (person.conservativeK > 0 && temp >= SAFETY.watchHeatC) {
    forced.BREATHABILITY = Math.max(forced.BREATHABILITY ?? 0, 60)
  }
  void activity

  return { level, warnings, forcedDemands: forced }
}

function maxLevel(a: SafetyLevel, b: SafetyLevel): SafetyLevel {
  const order: Record<SafetyLevel, number> = { NORMAL: 0, WATCH: 1, DANGER: 2 }
  return order[b] > order[a] ? b : a
}