import type { WeatherReport } from '@/core/types'
import { OpenMeteoProvider } from './openmeteo'

/** 天气数据源统一抽象。将来加和风 QWeather 时实现同一接口即可替换。 */
export interface WeatherProvider {
  readonly id: 'open-meteo' | 'qweather'
  readonly label: string
  fetchWeather(params: { lat: number; lon: number }): Promise<WeatherReport>
}

/** 数据源工厂：默认 Open-Meteo；保留将来切换 QWeather 的口子 */
export function getProvider(): WeatherProvider {
  return new OpenMeteoProvider()
}