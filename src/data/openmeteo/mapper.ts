// Open-Meteo DTO → WeatherReport 适配
// 遵循 requirements 8.2 语义约定：-1 = 上游未提供（估算路径，非 0）

import type { HourlyEnvironment, WeatherDay, WeatherReport } from '@/core/types'
import type { OpenMeteoResponse } from './types'
import { at, atStr, mapWeatherCode } from './wmo'
import { estimateSolarElevation, estimateSolarRadiation } from './solar'

const NEG = -1

/** 水汽压（hPa）：Magnus 公式 */
export function vaporPressure(humidityPercent: number, tempC: number): number {
  const eSat = 6.112 * Math.exp((17.62 * tempC) / (243.12 + tempC))
  return (humidityPercent / 100) * eSat
}

export function mapOpenMeteo(dto: OpenMeteoResponse, lat: number, lon: number): WeatherReport {
  const generatedAt = new Date().toISOString()
  const current = dto.current
  const hourly = dto.hourly
  const daily = dto.daily
  const n = hourly.time.length

  const timezone = dto.timezone || 'UTC'
  const isTzKnown = timezone !== 'UTC'

  // 全部逐时环境（Open-Meteo 返回 2 天 48 小时，取前 48 供引擎挑选当天 24h）
  const environments: HourlyEnvironment[] = []
  for (let i = 0; i < n; i++) {
    const time = hourly.time[i]
    const date = new Date(time)
    const temp = at(hourly.temperature_2m, i, NEG)
    const humidity = at(hourly.relative_humidity_2m, i, NEG)
    const ele = estimateSolarElevation(date, lat)
    const cloud = at(hourly.cloud_cover, i, NEG)
    const radiation = at(hourly.shortwave_radiation, i, NEG)
    const uv = at(hourly.uv_index, i, NEG)
    const sunUp = ele > 0
    environments.push({
      time,
      temperatureC: temp,
      humidityPercent: humidity,
      windSpeedMs: at(hourly.wind_speed_10m, i, NEG),
      windDirectionDeg: at(hourly.wind_direction_10m, i, NEG),
      precipitationMmPerHour: at(hourly.precipitation, i, 0),
      precipitationProbabilityPercent: at(hourly.precipitation_probability, i, NEG),
      kind: mapWeatherCode(at(hourly.weather_code, i, 0)),
      cloudCoverPercent: cloud,
      uvIndex: uv,
      solarRadiationWm2: radiation >= 0 ? radiation : estimateSolarRadiation(ele, cloud),
      solarElevationDeg: ele,
      isDay: sunUp,
      vaporPressureHpa: humidity >= 0 && temp >= -60 ? vaporPressure(humidity, temp) : NEG,
      sourceFeelsLikeC: NEG, // Open-Meteo 无逐时体感，由引擎计算
      fromForecast: true,
    })
  }

  // 时区处理：取第一个小时与当前本地时间比较，避免服务器时钟偏差
  // （requirements：观测时钟距设备 >120min 则用设备时区；Web 端简化为始终用本地时区做"此刻"判断）

  // 当天 24h 切片：以第一个整点开始
  const dayEnvs = environments.slice(0, 24)

  const dayKinds: WeatherDay[] = []
  for (let d = 0; d < 2; d++) {
    dayKinds.push({
      date: atStr(daily.time, d, ''),
      minC: at(daily.temperature_2m_min, d, NEG),
      maxC: at(daily.temperature_2m_max, d, NEG),
      dayKind: mapWeatherCode(at(daily.weather_code, d, 0)),
      sunrise: atStr(daily.sunrise, d, ''),
      sunset: atStr(daily.sunset, d, ''),
      rainMm: at(daily.precipitation_sum, d, 0),
      rainChancePercent: at(daily.precipitation_probability_max, d, NEG),
      uvMax: at(daily.uv_index_max, d, NEG),
    })
  }

  const currentKind = mapWeatherCode(current.weather_code ?? 0)
  const currentIsDay = current.is_day === 1

  return {
    lat,
    lon,
    timezone: isTzKnown ? timezone : 'UTC',
    generatedAt,
    current: {
      temperatureC: current.temperature_2m,
      feelsLikeC: current.apparent_temperature,
      humidityPercent: current.relative_humidity_2m,
      windSpeedMs: current.wind_speed_10m,
      precipitationProbabilityPercent: current.precipitation_probability ?? NEG,
      condition: currentKind,
      isDay: currentIsDay,
    },
    hourly: dayEnvs,
    daily: [dayKinds[0], dayKinds[1] ?? dayKinds[0]],
    source: 'open-meteo',
    hasHourlyForecast: n >= 24,
  }
}