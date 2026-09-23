// 城市服务：定位 → 逆地理 →（可选）触发天气拉取的编排

import { locateDevice } from '@/data/location'
import { reverseGeocode } from '@/data/geo/reverseGeo'
import type { CityInfo } from '@/core/types'

export interface LocateOutcome {
  city: CityInfo
  /** 用户可读提示（失败原因） */
  error?: string
}

export class CityService {
  /** 定位并解析城市；失败返回带 error 的结果 */
  async locateCurrent(): Promise<LocateOutcome> {
    try {
      const { lat, lon } = await locateDevice()
      const city = await reverseGeocode(lat, lon)
      return { city }
    } catch (err) {
      const message =
        typeof err === 'object' && err && 'message' in err
          ? String((err as { message: string }).message)
          : '定位失败'
      return { city: fallbackCity(), error: message }
    }
  }
}

function fallbackCity(): CityInfo {
  return { id: 'fallback', name: '当前位置', lat: 0, lon: 0 }
}