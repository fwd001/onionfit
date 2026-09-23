// 城市名搜索（Open-Meteo geocoding），对应 requirements 8.1
// search: count=12, language=zh；搜索防抖由调用方 useDebounceFn 处理

import type { CityInfo } from '@/core/types'

const GEO_BASE = 'https://geocoding-api.open-meteo.com/v1/search'

interface GeoResult {
  id: number
  name: string
  latitude: number
  longitude: number
  country?: string
  country_code?: string
  admin1?: string
}

/** 按关键词搜索城市（中文名） */
export async function searchCities(query: string): Promise<CityInfo[]> {
  const params = new URLSearchParams({
    name: query,
    count: '12',
    language: 'zh',
    format: 'json',
  })
  const res = await fetch(`${GEO_BASE}?${params.toString()}`)
  if (!res.ok) throw new Error('城市搜索失败')
  const data = (await res.json()) as { results?: GeoResult[] }
  if (!data.results) return []
  return data.results
    .filter((r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude))
    .map((r) => ({
      id: String(r.id),
      name: r.name,
      lat: r.latitude,
      lon: r.longitude,
      country: r.country,
      admin1: r.admin1,
    }))
}