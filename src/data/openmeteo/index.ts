import type { WeatherReport } from '@/core/types'
import type { WeatherProvider } from '../provider'
import type { OpenMeteoResponse } from './types'
import { mapOpenMeteo } from './mapper'

const BASE_URL = 'https://api.open-meteo.com/v1/forecast'

export class OpenMeteoProvider implements WeatherProvider {
  readonly id = 'open-meteo' as const
  readonly label = 'Open-Meteo'

  async fetchWeather({ lat, lon }: { lat: number; lon: number }): Promise<WeatherReport> {
    const params = new URLSearchParams({
      latitude: lat.toFixed(4),
      longitude: lon.toFixed(4),
      current:
        'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,is_day,precipitation_probability,precipitation,wind_speed_10m,wind_direction_10m,cloud_cover',
      hourly:
        'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation,precipitation_probability,weather_code,cloud_cover,uv_index,shortwave_radiation',
      daily:
        'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,uv_index_max',
      timezone: 'auto',
      forecast_days: '2',
      windspeed_unit: 'ms',
    })
    const url = `${BASE_URL}?${params.toString()}`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15_000)
    let res: Response
    try {
      res = await fetch(url, { signal: controller.signal })
    } finally {
      clearTimeout(timer)
    }
    if (!res.ok) {
      throw new Error(`Open-Meteo 请求失败：HTTP ${res.status}`)
    }
    const dto = (await res.json()) as OpenMeteoResponse
    return mapOpenMeteo(dto, lat, lon)
  }
}