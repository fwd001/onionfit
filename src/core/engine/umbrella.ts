// UmbrellaEngine：通勤时段被淋雨概率 + 带伞判定（确定性，无 LLM）
// 口径与需求向量不同：demand.RAIN 乘了 activity.rainExposure（办公/居家为 0），量的是「需不需要防水面料」；
// 本引擎量的是「上下班那十几分钟会不会被淋」，故按 legMinutes 取暴露窗口，不复用该乘子。
// 概率合并用 noisy-OR，并用 rainPersistence 把整点概率折算到实际暴露窗口。

import { SAFETY, UMBRELLA } from '../config'
import type {
  ActivityKind,
  ReasonCode,
  UmbrellaAssessment,
  UmbrellaLeg,
  UmbrellaVerdict,
  UserSettings,
} from '../types'
import type { WeatherContext } from './weather'

export type { UmbrellaAssessment, UmbrellaLeg, UmbrellaVerdict }

export interface UmbrellaInput {
  ctx: WeatherContext
  /** 次日降水概率 %（跨零点夜班时供回家段取值） */
  nextDayRainChance: number
  activity: ActivityKind
  settings: UserSettings
  now: Date
}

interface PlannedLeg {
  phase: UmbrellaLeg['phase']
  /** 当日分钟数，可能 > 1440 表示次日 */
  start: number
  minutes: number
  /** true = 落在次日，当日逐时数据不可用 */
  nextDay: boolean
}

/** "HH:mm" → 当日分钟数 */
function toMinutes(hhmm: string): number | null {
  const [h, m] = hhmm.split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  return h * 60 + m
}

function fmtMinutes(total: number): string {
  const t = ((total % 1440) + 1440) % 1440
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.round(t % 60)).padStart(2, '0')}`
}

/**
 * 一段暴露的淋雨概率：P = 1 − Π (1 − q_h)，
 * q_h = p_h × (w + (1 − w) × rainPersistence)，w = 该小时被暴露窗口覆盖的比例。
 * 单小时全覆盖（w=1）时正好退化为该小时的整点概率。
 */
function legProbability(hours: { prob: number; weight: number }[]): number {
  let dry = 1
  for (const h of hours) {
    if (h.prob <= 0) continue
    const w = Math.min(Math.max(h.weight, 0), 1)
    dry *= 1 - (h.prob / 100) * (w + (1 - w) * UMBRELLA.rainPersistence)
  }
  return (1 - dry) * 100
}

/** 主入口：给出今天带不带伞的量化结论 */
export function assessUmbrella({
  ctx,
  nextDayRainChance,
  activity,
  settings,
  now,
}: UmbrellaInput): UmbrellaAssessment {
  const threshold = Math.round(100 / (1 + UMBRELLA.lossRatio))
  const minutes = UMBRELLA.legMinutes[activity] ?? UMBRELLA.legMinutes.WALKING
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const assumed = settings.outTime === null || settings.homeTime === null

  const out = toMinutes(settings.outTime ?? '') ?? UMBRELLA.fallbackOutMinutes
  const homeRaw = toMinutes(settings.homeTime ?? '') ?? UMBRELLA.fallbackHomeMinutes
  // 回家不晚于出门 → 夜班，回家段属于次日
  const home = homeRaw > out ? homeRaw : homeRaw + 1440

  const planned: PlannedLeg[] = [
    { phase: 'OUT', start: out, minutes, nextDay: false },
    { phase: 'HOME', start: home, minutes, nextDay: home >= 1440 },
  ]

  const reasons: ReasonCode[] = []
  if (assumed) reasons.push('assumed-commute-time')

  // 两段都已过去（深夜还在看这条建议）→ 改按「此刻起一段」测算，避免全天报废
  const upcoming = planned.filter((l) => l.start + l.minutes > nowMinutes)
  const legs: PlannedLeg[] = upcoming.length
    ? upcoming
    : [{ phase: 'NOW', start: nowMinutes, minutes, nextDay: false }]
  if (!upcoming.length) reasons.push('commute-passed')

  const byHour = new Map(ctx.day.map((p) => [p.hour, p]))
  const hourlyOk = ctx.hasHourly
  const dayCap = Math.max(ctx.dayRainChanceMax, 0)
  let confidence: UmbrellaAssessment['confidence'] = hourlyOk ? 'HOURLY' : 'DEGRADED'

  let dryAll = 1
  let windMs = 0
  let rainMmPerHour = 0
  const measured: UmbrellaLeg[] = []

  for (const leg of legs) {
    const end = leg.start + leg.minutes
    const samples: { prob: number; weight: number }[] = []
    let legWind = 0
    let legMm = 0

    if (hourlyOk && !leg.nextDay) {
      for (let h = Math.floor(leg.start / 60); h < Math.ceil(end / 60) && h < 24; h++) {
        const overlap = Math.min(end, (h + 1) * 60) - Math.max(leg.start, h * 60)
        if (overlap <= 0) continue
        const point = byHour.get(h)
        if (!point || point.precipitationProb < 0) continue
        samples.push({ prob: point.precipitationProb, weight: overlap / 60 })
        legWind = Math.max(legWind, point.windSpeedMs)
        legMm = Math.max(legMm, point.precipitationMm)
      }
    }

    // 逐时不可用（缺数据 / 段落在次日）时，退回用全天或次日概率折算这段暴露
    const hourly = samples.length > 0
    const reference = leg.nextDay ? nextDayRainChance : dayCap
    if (!hourly) confidence = 'DEGRADED'
    let prob = legProbability(
      hourly ? samples : [{ prob: reference, weight: leg.minutes / 60 }],
    )
    // 没有逐时定位时，不应比全天概率本身更有把握
    if (!hourly) prob = Math.min(prob, reference)

    dryAll *= 1 - prob / 100
    windMs = Math.max(windMs, legWind)
    rainMmPerHour = Math.max(rainMmPerHour, legMm)
    measured.push({
      phase: leg.phase,
      start: fmtMinutes(leg.start),
      minutes: leg.minutes,
      probability: Math.round(prob),
    })
  }

  const combined = (1 - dryAll) * 100
  // 缺逐时定位时，合并结果同样不得超过唯一可用信号本身（不该比来源更有把握）
  const probability = Math.round(
    confidence === 'DEGRADED'
      ? Math.min(combined, Math.max(dayCap, nextDayRainChance, 0))
      : combined,
  )
  const wetEnough = probability >= threshold
  const windy = confidence === 'HOURLY' && windMs >= UMBRELLA.windVetoMs
  const heavy = confidence === 'HOURLY' && rainMmPerHour >= SAFETY.dangerRainMm

  let verdict: UmbrellaVerdict = 'SKIP'
  if (wetEnough && windy) {
    verdict = 'RAINCOAT'
    reasons.push('wind-rain')
  } else if (wetEnough && heavy) {
    verdict = 'RAINCOAT'
    reasons.push('heavy-rain')
  } else if (wetEnough) {
    verdict = 'BRING'
    reasons.push('rain')
  }
  if (confidence === 'DEGRADED') reasons.push('degraded-forecast')

  return {
    probability,
    verdict,
    threshold,
    legs: measured,
    windMs: Math.round(windMs * 10) / 10,
    rainMmPerHour: Math.round(rainMmPerHour * 10) / 10,
    confidence,
    assumed,
    reasons,
  }
}
