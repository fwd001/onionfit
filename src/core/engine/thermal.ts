// ThermalComfortEngine：对每个整点算作用温度、体感、所需隔热（clo）
// 关键约束：辐射走 radiantGainK 抬作用温度不改气温；湿度仅高温侧；风双区间模型

import { thermalPoint, round2, type ThermalPoint } from './psychrometrics'
import type { WeatherContext } from './weather'
import type { PersonProfile } from './person'
import type { ResolvedActivity } from './activity'

export interface HourlyThermal extends ThermalPoint {
  hour: number
  temperatureC: number
}

/**
 * 全天各整点热状态。
 * 有效风速 = 环境风速 + 自生风
 */
export function buildHourlyThermal(
  ctx: WeatherContext,
  nowHour: number,
  person: PersonProfile,
  activity: ResolvedActivity,
  radiantGainAt: (hour: number) => number,
): { hourly: HourlyThermal[]; designHour: HourlyThermal } {
  const hourly = ctx.day.map((p) => {
    const effWind = activity.selfWindMs + p.windSpeedMs
    const t = thermalPoint(
      p.temperatureC,
      effWind,
      p.humidityPercent,
      radiantGainAt(p.hour),
      person.neutralTempC,
    )
    return { ...t, hour: p.hour, temperatureC: round2(p.temperatureC) }
  })

  // 设计时刻 = 全天 requiredClo 最高（需带最多的整点）
  const designHour = hourly.reduce((acc, h) => (h.requiredClo > acc.requiredClo ? h : acc), hourly[0])
  void nowHour
  return { hourly, designHour }
}