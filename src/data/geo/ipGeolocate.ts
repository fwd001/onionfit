// IP 定位兜底：浏览器定位失败（桌面无 GPS / Google 定位服务不可达）时，
// 用免费 IP 地理库获取大致经纬度，再走逆地理编码。
//
// 免费服务对比（均支持 CORS、无需 key）：
// - ipwho.is：返回 city/region/country/lat/lon，免费额度充足
// - get.geojs.io：结构类似，作为备选
// IP 定位精度到城市级，足够天气查询使用。

import type { LocateResult } from '@/data/location'

interface IpWhoResult {
  success: boolean
  latitude: number
  longitude: number
  city?: string
  region?: string
  country?: string
}

/** 主：ipwho.is */
async function viaIpWho(): Promise<LocateResult> {
  const res = await fetch('https://ipwho.is/')
  if (!res.ok) throw new Error('ipwho.is failed')
  const data = (await res.json()) as IpWhoResult
  if (!data.success || data.latitude == null || data.longitude == null) {
    throw new Error('ipwho.is no coords')
  }
  return { lat: data.latitude, lon: data.longitude }
}

/** 备选：geojs.io（经纬度为字符串，需 Number 转换） */
async function viaGeoJs(): Promise<LocateResult> {
  const res = await fetch('https://get.geojs.io/v1/ip/geo.json')
  if (!res.ok) throw new Error('geojs.io failed')
  const data = (await res.json()) as { latitude?: string; longitude?: string }
  const lat = Number(data.latitude)
  const lon = Number(data.longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error('geojs.io no coords')
  }
  return { lat, lon }
}

/** IP 定位：依次尝试 ipwho.is → geojs.io */
export async function locateByIp(): Promise<LocateResult> {
  try {
    return await viaIpWho()
  } catch {
    return await viaGeoJs()
  }
}

