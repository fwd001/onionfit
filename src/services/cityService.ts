// 城市服务：定位 → 逆地理 →（可选）触发天气拉取的编排
//
// 定位策略：
// 1. 优先浏览器定位（GPS/WiFi，精度高）
// 2. 失败时回退 IP 定位（桌面常见：浏览器定位服务不可达 / 无 GPS）
// 3. 两者都失败才提示错误

import { locateDevice } from '@/data/location'
import { reverseGeocode } from '@/data/geo/reverseGeo'
import { locateByIp } from '@/data/geo/ipGeolocate'
import type { CityInfo } from '@/core/types'

export interface LocateOutcome {
  city: CityInfo
  /** 用户可读提示（失败原因） */
  error?: string
  /** 是否来自 IP 兜底定位（精度较低） */
  viaIpFallback?: boolean
}

export class CityService {
  /** 定位并解析城市；失败返回带 error 的结果 */
  async locateCurrent(): Promise<LocateOutcome> {
    // 浏览器定位与 IP 定位并发执行：
    // - 浏览器定位成功（GPS/WiFi，精度高）→ 优先用
    // - 浏览器失败/超时 → 用 IP 结果（已并发请求，无需再等）
    const browserPromise = locateDevice().then(
      (c) => ({ ok: true as const, coords: c }),
      () => ({ ok: false as const }),
    )
    const ipPromise = locateByIp().then(
      (c) => ({ ok: true as const, coords: c }),
      () => ({ ok: false as const }),
    )

    const [browser, ip] = await Promise.all([browserPromise, ipPromise])

    let coords: { lat: number; lon: number }
    let viaIpFallback = false
    if (browser.ok) {
      coords = browser.coords
    } else if (ip.ok) {
      coords = ip.coords
      viaIpFallback = true
    } else {
      return { city: fallbackCity(), error: '定位失败，请检查网络或系统定位服务' }
    }

    // 逆地理编码（失败仍返回带经纬度的"当前位置"，可正常查天气）
    try {
      const city = await reverseGeocode(coords.lat, coords.lon)
      return { city, viaIpFallback }
    } catch {
      return {
        city: {
          id: `gps:${coords.lat.toFixed(4)},${coords.lon.toFixed(4)}`,
          name: '当前位置',
          lat: coords.lat,
          lon: coords.lon,
        },
        viaIpFallback,
      }
    }
  }
}

function fallbackCity(): CityInfo {
  return { id: 'fallback', name: '当前位置', lat: 0, lon: 0 }
}