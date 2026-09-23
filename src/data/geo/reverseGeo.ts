// 逆地理编码：坐标 → 城市名
// 对应 requirements 8.1：bigdatacloud；失败回退 "当前位置"

import type { CityInfo } from '@/core/types'

const REVERSE_BASE = 'https://api.bigdatacloud.net/data/reverse-geocode-client'

interface ReverseResult {
  city?: string
  locality?: string
  principalSubdivision?: string
  countryName?: string
}

export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<CityInfo> {
  try {
    const params = new URLSearchParams({
      latitude: lat.toFixed(6),
      longitude: lon.toFixed(6),
      localityLanguage: 'zh',
    })
    const res = await fetch(`${REVERSE_BASE}?${params.toString()}`)
    if (res.ok) {
      const data = (await res.json()) as ReverseResult
      const name = data.city || data.locality || data.principalSubdivision || '当前位置'
      return {
        id: `gps:${lat.toFixed(4)},${lon.toFixed(4)}`,
        name,
        lat,
        lon,
        country: data.countryName,
        admin1: data.principalSubdivision,
      }
    }
  } catch {
    // 网络失败走回退
  }
  return {
    id: `gps:${lat.toFixed(4)},${lon.toFixed(4)}`,
    name: '当前位置',
    lat,
    lon,
  }
}