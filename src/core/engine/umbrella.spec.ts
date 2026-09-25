// UmbrellaEngine 单测：全部为方向性断言（requirements 10.2）
// 不写「90% 必须带伞」式黄金值断言；只锁「输入变化时结论按预期方向变化」

import { describe, expect, it } from 'vitest'
import { buildWeatherContext } from './weather'
import { assessUmbrella } from './umbrella'
import type {
  ActivityKind,
  HourlyEnvironment,
  UserSettings,
  WeatherReport,
} from '@/core/types'

const DATE = '2026-09-25'

interface HourOverride {
  prob?: number
  mm?: number
  wind?: number
}

interface ReportOpts {
  /** 今天全天降水概率 % */
  dayChance?: number
  /** 明天全天降水概率 % */
  nextChance?: number
  /** 是否有逐时预报 */
  hourly?: boolean
  /** 实况降水概率 % */
  currentChance?: number
}

/** 造一份 24h 报告：未指定的整点为「无雨、微风」 */
function makeReport(hours: Record<number, HourOverride>, opts: ReportOpts = {}): WeatherReport {
  const hourly: HourlyEnvironment[] = Array.from({ length: 24 }, (_, i) => {
    const o = hours[i] ?? {}
    return {
      time: `${DATE}T${String(i).padStart(2, '0')}:00`,
      temperatureC: 20,
      humidityPercent: 60,
      windSpeedMs: o.wind ?? 2,
      windDirectionDeg: 90,
      precipitationMmPerHour: o.mm ?? 0,
      precipitationProbabilityPercent: o.prob ?? 0,
      kind: (o.prob ?? 0) >= 60 ? 'rain' : 'clear',
      cloudCoverPercent: 30,
      uvIndex: 3,
      solarRadiationWm2: 200,
      solarElevationDeg: 20,
      isDay: true,
      vaporPressureHpa: 15,
      sourceFeelsLikeC: 20,
      fromForecast: true,
    }
  })

  const day = (chance: number, kind: 'clear' | 'rain') => ({
    date: DATE,
    minC: 15,
    maxC: 24,
    dayKind: kind,
    sunrise: '06:10',
    sunset: '18:20',
    rainMm: 0,
    rainChancePercent: chance,
    uvMax: 5,
  })
  const dayChance = opts.dayChance ?? 0
  const nextChance = opts.nextChance ?? 0

  return {
    lat: 31.2304,
    lon: 121.4737,
    timezone: 'Asia/Shanghai',
    generatedAt: `${DATE}T06:00:00.000Z`,
    current: {
      temperatureC: 20,
      feelsLikeC: 20,
      humidityPercent: 60,
      windSpeedMs: 2,
      precipitationProbabilityPercent: opts.currentChance ?? 0,
      condition: 'clear',
      isDay: true,
    },
    hourly,
    daily: [day(dayChance, dayChance >= 30 ? 'rain' : 'clear'), day(nextChance, nextChance >= 30 ? 'rain' : 'clear')],
    source: 'open-meteo',
    hasHourlyForecast: opts.hourly ?? true,
  }
}

function assess(
  report: WeatherReport,
  over: { activity?: ActivityKind; outTime?: string | null; homeTime?: string | null; now?: string } = {},
) {
  const settings: UserSettings = {
    profile: 'ADULT',
    sensitivity: 'NORMAL',
    activity: over.activity ?? 'WALKING',
    outTime: over.outTime === undefined ? '08:00' : over.outTime,
    homeTime: over.homeTime === undefined ? '18:00' : over.homeTime,
  }
  return assessUmbrella({
    ctx: buildWeatherContext(report),
    nextDayRainChance: report.daily[1].rainChancePercent,
    activity: settings.activity,
    settings,
    now: new Date(over.now ? `${DATE}T${over.now}` : `${DATE}T07:00:00`),
  })
}

describe('UmbrellaEngine', () => {
  it('回家段降水概率上升时，淋雨概率随之上升', () => {
    const light = assess(makeReport({ 18: { prob: 20 } }))
    const heavy = assess(makeReport({ 18: { prob: 80 } }))
    expect(heavy.probability).toBeGreaterThan(light.probability)
  })

  it('淋雨概率跨过决策阈值时结论由不推荐翻转为推荐', () => {
    const below = assess(makeReport({ 8: { prob: 10 }, 18: { prob: 10 } }))
    const above = assess(makeReport({ 8: { prob: 40 }, 18: { prob: 40 } }))
    expect(below.verdict).toBe('SKIP')
    expect(above.verdict).toBe('BRING')
  })

  it('暴露窗口内大风时改判雨衣而非带伞', () => {
    const calm = assess(makeReport({ 18: { prob: 90, wind: 3 } }))
    const windy = assess(makeReport({ 18: { prob: 90, wind: 14 } }))
    expect(calm.verdict).toBe('BRING')
    expect(windy.verdict).toBe('RAINCOAT')
  })

  it('暴露窗口内雨强超出伞的适用范围时改判雨衣', () => {
    const drizzle = assess(makeReport({ 18: { prob: 90, mm: 1 } }))
    const downpour = assess(makeReport({ 18: { prob: 90, mm: 12 } }))
    expect(drizzle.verdict).toBe('BRING')
    expect(downpour.verdict).toBe('RAINCOAT')
  })

  it('办公活动下通勤窗口照常计算降水，不被暴露系数抹零', () => {
    const a = assess(makeReport({ 18: { prob: 90 } }), { activity: 'OFFICE' })
    expect(a.probability).toBeGreaterThan(a.threshold)
    expect(a.verdict).toBe('BRING')
  })

  it('同样一场雨，落在通勤窗口内比落在凌晨给出更高的概率', () => {
    const inWindow = assess(makeReport({ 18: { prob: 90 } }))
    const outWindow = assess(makeReport({ 3: { prob: 90 } }))
    expect(inWindow.probability).toBeGreaterThan(outWindow.probability)
  })

  it('暴露窗口越长，同等整点概率下被淋概率越高', () => {
    const driving = assess(makeReport({ 18: { prob: 90 } }), { activity: 'DRIVING' })
    const walking = assess(makeReport({ 18: { prob: 90 } }), { activity: 'WALKING' })
    expect(walking.probability).toBeGreaterThan(driving.probability)
  })

  it('短窗口的概率落在整点概率与按分钟线性折算之间', () => {
    // 90% 的一小时里下 18 分钟：既不该照抄 90，也不该线性抹成 90×0.3=27
    const a = assess(makeReport({ 18: { prob: 90 } }), { activity: 'WALKING' })
    expect(a.probability).toBeGreaterThan(27)
    expect(a.probability).toBeLessThan(90)
  })

  it('同一输入两次测算结果完全一致', () => {
    const report = makeReport({ 8: { prob: 40 }, 18: { prob: 90, wind: 5 } })
    expect(assess(report)).toEqual(assess(report))
  })

  it('缺少逐时预报时降级为全天概率，且不超过全天概率', () => {
    const a = assess(
      makeReport({ 18: { prob: 90 } }, { dayChance: 70, currentChance: 70, hourly: false }),
    )
    expect(a.confidence).toBe('DEGRADED')
    expect(a.probability).toBeGreaterThan(0)
    expect(a.probability).toBeLessThanOrEqual(70)
  })

  it('回家时刻早于出门时刻（跨零点夜班）时，回家段取次日信号', () => {
    const nextDry = assess(makeReport({ 20: { prob: 5 } }, { nextChance: 5 }), {
      outTime: '20:00',
      homeTime: '02:00',
    })
    const nextWet = assess(makeReport({ 20: { prob: 5 } }, { nextChance: 80 }), {
      outTime: '20:00',
      homeTime: '02:00',
    })
    expect(nextWet.probability).toBeGreaterThan(nextDry.probability)
  })

  it('两段通勤都已过去时，改按此刻起的一段测算，夜间外出仍有结论', () => {
    const a = assess(makeReport({ 22: { prob: 95 } }), { now: '22:00' })
    expect(a.probability).toBeGreaterThan(a.threshold)
    expect(a.verdict).toBe('BRING')
  })

  it('未设置通勤时刻时按兜底时段测算并标记为估算', () => {
    const a = assess(makeReport({ 18: { prob: 90 } }), { outTime: null, homeTime: null })
    expect(a.assumed).toBe(true)
    expect(a.probability).toBeGreaterThan(a.threshold)
  })

  it('全天干燥时概率归零且不推荐带伞', () => {
    const a = assess(makeReport({}))
    expect(a.probability).toBe(0)
    expect(a.verdict).toBe('SKIP')
  })
})
