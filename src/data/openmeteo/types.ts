// Open-Meteo 响应 DTO（仅映射需要的字段）

export interface OpenMeteoResponse {
  latitude: number
  longitude: number
  timezone: string
  timezone_abbreviation: string
  current: {
    time: string
    temperature_2m: number
    relative_humidity_2m: number
    apparent_temperature: number
    is_day: number
    weather_code: number
    precipitation_probability: number
    precipitation: number
    wind_speed_10m: number
    wind_direction_10m: number
    cloud_cover: number
    pressure_msl?: number
    surface_pressure?: number
  }
  hourly: {
    time: string[]
    temperature_2m: number[]
    relative_humidity_2m: number[]
    wind_speed_10m: number[]
    wind_direction_10m: number[]
    precipitation: number[]
    precipitation_probability: number[]
    weather_code: number[]
    cloud_cover: number[]
    uv_index: number[]
    shortwave_radiation: number[]
    is_day?: number[]
  }
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    sunrise: string[]
    sunset: string[]
    precipitation_sum: number[]
    precipitation_probability_max: number[]
    uv_index_max: number[]
  }
}