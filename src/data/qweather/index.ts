/**
 * 和风 QWeather 数据源（预留）。
 * 将来配置 API key 后填充实现，保持与 WeatherProvider 接口一致即可无缝替换 Open-Meteo。
 * 接口参考：
 *   now:   GET https://devapi.qweather.com/v7/weather/now?location={lon},{lat}&key={key}
 *   24h:   GET https://devapi.qweather.com/v7/weather/24h?location=...
 *   7d:    GET https://devapi.qweather.com/v7/weather/7d?location=...
 */
import type { WeatherReport } from '@/core/types'
import type { WeatherProvider } from '../provider'

export class QWeatherProvider implements WeatherProvider {
  readonly id = 'qweather' as const
  readonly label = '和风天气'

  async fetchWeather(_params: { lat: number; lon: number }): Promise<WeatherReport> {
    throw new Error('QWeather 尚未配置 API key（预留数据源）')
  }
}